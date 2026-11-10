import type Anthropic from "@anthropic-ai/sdk";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { seed } from "@/db/seed";
import { setLLMClient, type LLMClient, type LLMRequest } from "@/agents/llm";
import { processOne } from "@/worker/loop";

const TABLES = [
  "activity_log", "agent_messages", "agent_runs", "approvals", "brand_assets", "campaigns", "clients", "commands", "content_items",
  "deliverables", "follow_ups", "intel_items", "interactions", "invoices", "jobs", "leads", "notifications", "portfolio_items",
  "projects", "proposals", "reports", "revenue_targets", "site_pages", "social_accounts", "tasks", "testimonials", "transactions",
  "agent_memories", "sessions", "files", "authorized_senders", "api_tokens",
];

export async function resetDb() {
  await db.execute(sql.raw(`TRUNCATE ${TABLES.join(", ")} RESTART IDENTITY CASCADE`));
  await seed({ quiet: true });
}

export type Call = { tool: string; input: Record<string, unknown> };
type Turn = Call[] | { text: string };
type Script = (ctx: { req: LLMRequest; turn: number; lastResults: { name?: string; content: string; isError: boolean }[] }) => Turn;

let seq = 0;
function message(content: Anthropic.Beta.BetaContentBlock[], stop: Anthropic.Beta.BetaStopReason): Anthropic.Beta.BetaMessage {
  return {
    id: `msg_${++seq}`, type: "message", role: "assistant", model: "claude-opus-5-5", content, stop_reason: stop, stop_sequence: null,
    usage: { input_tokens: 1000, output_tokens: 200, cache_read_input_tokens: 500, cache_creation_input_tokens: 0, server_tool_use: null } as unknown as Anthropic.Beta.BetaUsage,
  } as unknown as Anthropic.Beta.BetaMessage;
}

/** Deterministic stand-in for the model, used ONLY in tests to exercise orchestration end to end. */
export class ScriptedLLM implements LLMClient {
  calls: LLMRequest[] = [];
  constructor(private scripts: Record<string, Script>) {}
  async create(req: LLMRequest) {
    this.calls.push(req);
    const role = /# Your role: .*?\(([^)]+)\)/.exec(req.system.map((s) => s.text).join("\n"));
    const agentName = role?.[1] ?? "unknown";
    const script = this.scripts[agentName];
    if (!script) throw new Error(`No script for agent ${agentName}`);
    const assistantTurns = req.messages.filter((m) => m.role === "assistant").length;
    const last = req.messages[req.messages.length - 1];
    const lastResults = Array.isArray(last.content)
      ? (last.content as Anthropic.Beta.BetaToolResultBlockParam[]).filter((b) => b.type === "tool_result").map((b) => ({ content: String(b.content), isError: Boolean(b.is_error) }))
      : [];
    const turn = script({ req, turn: assistantTurns, lastResults });
    if ("text" in turn) return message([{ type: "text", text: turn.text, citations: null } as Anthropic.Beta.BetaTextBlock], "end_turn");
    return message(turn.map((c, i) => ({ type: "tool_use", id: `tu_${seq}_${i}`, name: c.tool, input: c.input, caller: { type: "direct" } } as unknown as Anthropic.Beta.BetaToolUseBlock)), "tool_use");
  }
}

export function useScript(scripts: Record<string, Script>) {
  const llm = new ScriptedLLM(scripts);
  setLLMClient(llm);
  return llm;
}

export async function drainQueue(max = 200) {
  let n = 0;
  while (n < max && (await processOne())) n++;
  return n;
}

export const parse = <T = Record<string, unknown>>(s: string) => JSON.parse(s) as T;
