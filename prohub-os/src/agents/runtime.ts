/**
 * Agent execution engine: a manual tool-use loop over the Claude Messages API.
 * The manual loop (rather than the SDK tool runner) gives the orchestrator full control over
 * budgets, completion verification, nudges, transcript capture and pause_turn handling.
 */
import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { tasks, agentRuns, agents } from "@/db/schema";
import { getDefinition } from "./definitions";
import { buildSystem, buildTaskMessage, agentRow, attachmentBlocks } from "./prompts";
import { getLLM, estimateCostUsd, LLMNotConfigured } from "./llm";
import { ToolError, type AgentTool, type ToolContext } from "./tools/types";
import { setStatus, onTaskFinished, maybeResumeParent } from "@/orchestrator/tasks";
import { enqueue } from "@/orchestrator/queue";
import { logActivity } from "@/lib/audit";
import { errMessage } from "@/lib/utils";

const MAX_RESULT_CHARS = 24_000;

export function toolDefinitions(tools: AgentTool[]): Anthropic.Beta.BetaTool[] {
  return tools.map((t) => {
    const schema = z.toJSONSchema(t.schema, { io: "input", unrepresentable: "any" }) as Record<string, unknown>;
    delete schema.$schema;
    return { name: t.name, description: t.description, input_schema: schema as Anthropic.Beta.BetaTool.InputSchema };
  });
}

function serverTools(web: { search: number; fetch: number } | null): Anthropic.Beta.BetaToolUnion[] {
  if (!web) return [];
  return [
    { type: "web_search_20260209", name: "web_search", max_uses: web.search, user_location: { type: "approximate", country: "NG", city: "Lagos", timezone: "Africa/Lagos" } },
    { type: "web_fetch_20260209", name: "web_fetch", max_uses: web.fetch, max_content_tokens: 20000 },
  ];
}

async function spentToday(agentSlug: string) {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const [r] = await db.select({ s: sql<number>`coalesce(sum(${agentRuns.costUsd}),0)::float` }).from(agentRuns)
    .where(and(eq(agentRuns.agentSlug, agentSlug), gte(agentRuns.startedAt, start)));
  return r.s;
}

function compactForTranscript(content: unknown): unknown {
  const s = JSON.stringify(content);
  return s.length > 4000 ? `${s.slice(0, 4000)}…[${s.length} chars]` : content;
}

export type RunOutcome = { status: "completed" | "failed" | "awaiting_subtasks" | "deferred" | "skipped"; detail?: string };

export class RetryableRunError extends Error {}

export async function runTask(taskId: string, opts: { resume?: boolean } = {}): Promise<RunOutcome> {
  const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
  if (!task) return { status: "skipped", detail: "task not found" };
  if (task.status !== "queued") return { status: "skipped", detail: `status is ${task.status}` };

  const def = getDefinition(task.agentSlug);
  const cfg = await agentRow(task.agentSlug);
  if (!def || !cfg) {
    await setStatus(task.id, "failed", { error: `Agent ${task.agentSlug} is not defined` });
    await onTaskFinished(task.id);
    return { status: "failed" };
  }
  if (cfg.status === "disabled") {
    await setStatus(task.id, "failed", { error: `${cfg.name} is disabled. Re-enable the agent and retry the task.` });
    await onTaskFinished(task.id);
    return { status: "failed" };
  }
  if (cfg.status === "paused") {
    await enqueue("task.run", { taskId, resume: opts.resume ?? false }, { runAt: new Date(Date.now() + 15 * 60_000), priority: task.priority });
    return { status: "deferred", detail: "agent paused" };
  }
  const spent = await spentToday(task.agentSlug);
  if (spent >= cfg.dailyBudgetUsd) {
    const tomorrow = new Date();
    tomorrow.setUTCHours(24 + 5, 0, 0, 0); // 06:00 Lagos
    await enqueue("task.run", { taskId, resume: opts.resume ?? false }, { runAt: tomorrow, priority: task.priority });
    await logActivity({ type: "system", id: "orchestrator" }, "agent.budget_exhausted", { type: "agent", id: cfg.slug }, { spent, budget: cfg.dailyBudgetUsd });
    return { status: "deferred", detail: `daily budget $${cfg.dailyBudgetUsd} reached` };
  }

  const llm = await getLLM().catch((e) => e as Error);
  if (llm instanceof LLMNotConfigured) {
    await setStatus(task.id, "failed", { error: llm.message });
    await onTaskFinished(task.id);
    return { status: "failed", detail: llm.message };
  }
  if (llm instanceof Error) throw llm;

  await db.update(tasks).set({ status: "in_progress", startedAt: task.startedAt ?? new Date(), attempts: task.attempts + 1, updatedAt: new Date() }).where(eq(tasks.id, task.id));
  const [run] = await db.insert(agentRuns).values({ agentSlug: cfg.slug, taskId: task.id, model: cfg.model }).returning();
  await db.update(agents).set({ lastActiveAt: new Date() }).where(eq(agents.slug, cfg.slug));

  const toolMap = new Map(def.tools.map((t) => [t.name, t]));
  const tools: Anthropic.Beta.BetaToolUnion[] = [...toolDefinitions(def.tools), ...serverTools(def.web)];
  const system = await buildSystem(def, cfg.extraInstructions);
  const taskText = await buildTaskMessage(task.id, opts);
  const files = opts.resume ? [] : await attachmentBlocks(task);
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: files.length ? [...files, { type: "text", text: taskText }] : taskText }];
  const ctx: ToolContext = { agentSlug: cfg.slug, taskId: task.id, runId: run.id, produced: [], terminal: null };
  const usage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, webSearches: 0 };
  const transcript: unknown[] = [];
  let turns = 0, toolCalls = 0, nudged = false, finalText = "", errorStreak = 0;
  const MAX_ERROR_STREAK = 4;

  const persistRun = async (status: "succeeded" | "failed" | "halted", error?: string) => {
    await db.update(agentRuns).set({
      status, turns, toolCalls, inputTokens: usage.input, outputTokens: usage.output, cacheReadTokens: usage.cacheRead,
      cacheWriteTokens: usage.cacheWrite, webSearches: usage.webSearches, costUsd: estimateCostUsd(cfg.model, usage),
      finalText: finalText.slice(0, 8000), transcript, error: error ?? null, finishedAt: new Date(),
    }).where(eq(agentRuns.id, run.id));
  };

  try {
    while (turns < cfg.maxTurns && !ctx.terminal) {
      turns++;
      const res = await llm.create({ model: cfg.model, effort: cfg.effort, system, messages, tools });
      usage.input += res.usage.input_tokens ?? 0;
      usage.output += res.usage.output_tokens ?? 0;
      usage.cacheRead += res.usage.cache_read_input_tokens ?? 0;
      usage.cacheWrite += res.usage.cache_creation_input_tokens ?? 0;
      usage.webSearches += res.usage.server_tool_use?.web_search_requests ?? 0;
      messages.push({ role: "assistant", content: res.content as Anthropic.Beta.BetaContentBlockParam[] });
      transcript.push({ role: "assistant", stop: res.stop_reason, content: res.content.map((b) => compactForTranscript(b)) });
      const text = res.content.filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text").map((b) => b.text).join("\n");
      if (text) finalText = text;

      if (res.stop_reason === "refusal") {
        ctx.terminal = { kind: "failed", summary: "The model declined this request under its safety policy. Rephrase the task or handle it manually." };
        break;
      }
      if (res.stop_reason === "pause_turn") continue;

      const toolUses = res.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
      if (!toolUses.length) {
        if (!nudged) {
          nudged = true;
          messages.push({ role: "user", content: "You ended your turn without finishing the task. Continue the work, then call complete_task with the IDs of the records you produced — or fail_task if you are blocked." });
          continue;
        }
        ctx.terminal = { kind: "failed", summary: "Agent stopped without calling complete_task — no verifiable completion." };
        break;
      }

      const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
      for (const use of toolUses) {
        toolCalls++;
        const tool = toolMap.get(use.name);
        let content: string;
        let isError = false;
        if (res.stop_reason === "max_tokens") {
          content = "Your output was truncated before this call was complete. Re-issue it with smaller input (split long content).";
          isError = true;
        } else if (!tool) {
          content = `Unknown tool ${use.name}`;
          isError = true;
        } else {
          const parsed = tool.schema.safeParse(use.input);
          if (!parsed.success) {
            content = `Invalid input: ${parsed.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ")}`;
            isError = true;
          } else {
            try {
              const out = await tool.run(parsed.data, ctx);
              content = JSON.stringify(out ?? { ok: true });
            } catch (e) {
              isError = true;
              content = e instanceof ToolError ? e.message : `Tool failed: ${errMessage(e)}`;
              if (!(e instanceof ToolError)) console.error(`[agent:${cfg.slug}] tool ${use.name} crashed`, e);
            }
          }
        }
        if (content.length > MAX_RESULT_CHARS) content = `${content.slice(0, MAX_RESULT_CHARS)}…[truncated]`;
        await logActivity({ type: "agent", id: cfg.slug }, isError ? `tool.${use.name}.error` : `tool.${use.name}`, { type: "task", id: task.id }, { input: compactForTranscript(use.input), ...(isError ? { error: content.slice(0, 500) } : {}) });
        results.push({ type: "tool_result", tool_use_id: use.id, content, is_error: isError || undefined });
        transcript.push({ role: "tool", name: use.name, error: isError, content: compactForTranscript(content) });
        if (ctx.terminal) {
          // Remaining calls in this batch are skipped once a terminal tool ran.
          for (const rest of toolUses.slice(toolUses.indexOf(use) + 1)) results.push({ type: "tool_result", tool_use_id: rest.id, content: "Skipped: task already finished.", is_error: true });
          break;
        }
      }
      messages.push({ role: "user", content: results });
      // Circuit breaker: stop burning budget when every call keeps failing.
      errorStreak = results.every((r) => r.is_error) ? errorStreak + 1 : 0;
      if (errorStreak >= MAX_ERROR_STREAK && !ctx.terminal) {
        ctx.terminal = { kind: "failed", summary: `Stopped after ${MAX_ERROR_STREAK} consecutive turns of tool errors. Last error: ${String(results[0]?.content).slice(0, 300)}` };
      }
    }

    if (!ctx.terminal) ctx.terminal = { kind: "failed", summary: `Reached the turn limit (${cfg.maxTurns}) without completing. Partial records may exist; retry with narrower scope or raise the limit.` };

    const outcome = ctx.terminal;
    if (outcome.kind === "completed") {
      await setStatus(task.id, "completed", { resultSummary: outcome.summary, error: null });
      await persistRun("succeeded");
      await onTaskFinished(task.id);
    } else if (outcome.kind === "awaiting_subtasks") {
      await setStatus(task.id, "awaiting_subtasks");
      await persistRun("succeeded");
      await maybeResumeParent(task.id); // children may have finished during this run
    } else {
      await setStatus(task.id, "failed", { error: outcome.summary });
      await persistRun("halted", outcome.summary);
      await onTaskFinished(task.id);
    }
    await logActivity({ type: "agent", id: cfg.slug }, `task.${outcome.kind}`, { type: "task", id: task.id }, { turns, toolCalls, costUsd: estimateCostUsd(cfg.model, usage) });
    return { status: outcome.kind, detail: outcome.summary };
  } catch (e) {
    const msg = errMessage(e);
    await persistRun("failed", msg);
    const status = (e as { status?: number }).status;
    const retryable = status === 429 || status === 529 || (typeof status === "number" && status >= 500) || /ECONNRESET|ETIMEDOUT|fetch failed|Connection error/i.test(msg);
    if (retryable) {
      await setStatus(task.id, "queued", { error: `Transient error, will retry: ${msg}` });
      throw new RetryableRunError(msg);
    }
    await setStatus(task.id, "failed", { error: msg });
    await onTaskFinished(task.id);
    return { status: "failed", detail: msg };
  }
}
