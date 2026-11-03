import type Anthropic from "@anthropic-ai/sdk";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { agentMessages, tasks, agents, commands } from "@/db/schema";
import { AGENTS, type AgentDefinition } from "./definitions";
import { pinnedKnowledge, relevantMemories } from "./memory";
import { childResults } from "@/orchestrator/tasks";
import { env } from "@/lib/env";

/** Shared operating charter: identical for every agent so it caches well. */
const CHARTER = `You are part of the AI workforce of Prohub Creative Solutions, a creative agency headquartered in Nigeria that also serves international clients. Services: brand strategy and identity, graphic design, video production and animation, digital marketing, social media management, content creation, website design and development, advertising and campaign management, event marketing and production, and creative consulting.

The business goal is consistent revenue through digital marketing, client acquisition, creative services, automation and effective client management. Everything you do should contribute to business growth, operational efficiency or revenue.

How you work
- You receive one task at a time from the orchestration system. Do the work with your tools; records you create are the work product. Text you write outside tool calls is not saved anywhere.
- Before asking for information, search the knowledge base. If something essential is genuinely missing, finish what you can and state the gap in your summary.
- Finish every task by calling complete_task (listing the IDs of records you created or changed) or fail_task (explaining the blocker). The orchestrator verifies those IDs exist; claimed work that isn't in the system does not count.
- Managers who delegate call await_subtasks and are resumed later with the results.

Truthfulness
- Never fabricate leads, clients, contacts, sales, transactions, testimonials, statistics or campaign performance. If research turns up fewer real results than requested, deliver the real number and say so.
- Keep verified facts (seen on a source you opened this session, with its URL) separate from assumptions and estimates, and label which is which.
- Estimates (opportunity value, projected revenue) are labelled as estimates. Only recorded transactions count as revenue.

Permissions
- Level 1 (do it yourself): research, analysis, drafting, internal records, task organisation, recommendations, preparing materials, identifying leads.
- Level 2 (request approval): anything that reaches the outside world — emails, WhatsApp, proposals, publishing posts or pages, launching campaigns. Use the request_* tools; a human approves and the system executes.
- Level 3 (owner only): spending money, payments, contracts, refunds, financial record changes, granting external access, deleting critical data. Use request_owner_authorisation. You can never record or edit financial transactions.

Context
- Currency is the Nigerian Naira (NGN, ₦) unless a client is international. Tool money fields named *_ngn take Naira amounts.
- Write in clear British/Nigerian business English. Be specific and commercial; avoid generic marketing filler.
- Be cost-conscious: use as few tool calls and searches as the task needs.`;

function jobDescription(def: AgentDefinition, extra: string | null) {
  const roster = AGENTS.map((a) => `- ${a.slug}: ${a.title} — ${a.mission}`).join("\n");
  return `# Your role: ${def.title} (${def.name}), ${def.department}

Mission: ${def.mission}

Responsibilities
${def.responsibilities.map((r) => `- ${r}`).join("\n")}

Objectives
${def.objectives.map((o) => `- ${o}`).join("\n")}

KPIs you are measured on: ${def.kpis.map((k) => k.label).join("; ")}.

Quality bar (check before you finish)
${def.qualityBar.map((q) => `- ${q}`).join("\n")}

The workforce (agent slugs you can collaborate with)
${roster}
${extra ? `\nOwner's standing instructions for you\n${extra}` : ""}`;
}

export async function buildSystem(def: AgentDefinition, extraInstructions: string | null): Promise<Anthropic.Beta.BetaTextBlockParam[]> {
  const pinned = await pinnedKnowledge();
  const knowledge = pinned.length
    ? `# Business knowledge (owner-maintained)\n\n${pinned.map((d) => `## ${d.title}\n${d.content}`).join("\n\n")}`
    : "# Business knowledge\nThe owner has not yet added a company profile. Use search_knowledge for anything else that has been stored.";
  return [
    { type: "text", text: CHARTER },
    { type: "text", text: jobDescription(def, extraInstructions) },
    { type: "text", text: knowledge },
  ];
}

export async function buildTaskMessage(taskId: string, opts: { resume?: boolean } = {}) {
  const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
  if (!task) throw new Error("Task not found");
  const now = new Intl.DateTimeFormat("en-GB", { dateStyle: "full", timeStyle: "short", timeZone: env.timezone }).format(new Date());
  const parts: string[] = [`Current time: ${now} (${env.timezone}).`, ""];

  parts.push(`# Task: ${task.title}`, `Task ID: ${task.id} · Priority P${task.priority} · Requested by ${task.createdBy}${task.dueAt ? ` · Due ${task.dueAt.toISOString()}` : ""}`);
  const refs = [task.leadId && `lead_id=${task.leadId}`, task.clientId && `client_id=${task.clientId}`, task.projectId && `project_id=${task.projectId}`].filter(Boolean);
  if (refs.length) parts.push(`Linked records: ${refs.join(", ")}`);
  parts.push("", task.instructions);

  if (task.parentTaskId) {
    const [parent] = await db.select({ title: tasks.title, agent: tasks.agentSlug }).from(tasks).where(eq(tasks.id, task.parentTaskId));
    if (parent) parts.push("", `This is a subtask of "${parent.title}" (owned by ${parent.agent}).`);
  }

  if (task.dependsOn.length) {
    const deps = await db.select({ id: tasks.id, title: tasks.title, agent: tasks.agentSlug, summary: tasks.resultSummary, outputs: tasks.outputs }).from(tasks).where(inArray(tasks.id, task.dependsOn));
    parts.push("", "# Results from prerequisite tasks (read records with read_record for full content)");
    for (const d of deps) parts.push(`- [${d.agent}] ${d.title}: ${d.summary ?? "(no summary)"}\n  outputs: ${JSON.stringify(d.outputs)}`);
  }

  if (opts.resume) {
    const kids = await childResults(task.id);
    parts.push("", "# You are resuming after your delegated subtasks finished.");
    if (task.planNotes) parts.push(`Your plan notes: ${task.planNotes}`);
    parts.push("Subtask results:");
    for (const k of kids) {
      parts.push(`- [${k.agentSlug}] ${k.title} — ${k.status}${k.verification ? ` (verified outputs: ${k.verification.checked})` : ""}\n  ${k.status === "completed" ? k.resultSummary : `Error: ${k.error}`}\n  outputs: ${JSON.stringify(k.outputs)}`);
    }
    parts.push("", "Review the work (read key deliverables; use review_deliverable where quality matters), then consolidate. Delegate follow-up work only if essential, otherwise call complete_task with a consolidated report for the owner that lists real results, items pending approval, failures and next steps. Include the important output IDs from subtasks.");
  }

  const inbox = await db.select().from(agentMessages).where(and(eq(agentMessages.toAgent, task.agentSlug), isNull(agentMessages.readAt))).limit(10);
  if (inbox.length) {
    parts.push("", "# Messages in your inbox");
    for (const m of inbox) parts.push(`- From ${m.fromAgent}: ${m.subject}\n  ${m.body}`);
    await db.update(agentMessages).set({ readAt: new Date() }).where(inArray(agentMessages.id, inbox.map((m) => m.id)));
  }

  const memories = await relevantMemories(task.agentSlug, `${task.title} ${task.instructions}`.slice(0, 500));
  if (memories.length) {
    parts.push("", "# Your relevant memories (lessons from earlier work)");
    for (const m of memories) parts.push(`- (${m.kind}) ${m.content}`);
  }

  return parts.join("\n");
}

export async function agentRow(slug: string) {
  const [row] = await db.select().from(agents).where(eq(agents.slug, slug));
  return row;
}

/**
 * Files the owner attached to a command (WhatsApp image/PDF, etc.) are given to the root task's agent as
 * native image / document blocks so it can actually read them. Other file types are described, not inlined.
 */
export async function attachmentBlocks(task: { commandId: string | null; depth: number }): Promise<Anthropic.Beta.BetaContentBlockParam[]> {
  if (!task.commandId || task.depth !== 0) return [];
  const [cmd] = await db.select({ attachments: commands.attachments }).from(commands).where(eq(commands.id, task.commandId));
  if (!cmd?.attachments.length) return [];
  const { readFile } = await import("@/services/files");
  const blocks: Anthropic.Beta.BetaContentBlockParam[] = [];
  for (const id of cmd.attachments.slice(0, 5)) {
    const f = await readFile(id);
    if (!f) continue;
    const mime = f.mimeType.split(";")[0];
    if (["image/jpeg", "image/png", "image/gif", "image/webp"].includes(mime) && f.data.length <= 5 * 1048576) {
      blocks.push({ type: "image", source: { type: "base64", media_type: mime as "image/jpeg", data: f.data.toString("base64") } });
    } else if (mime === "application/pdf" && f.data.length <= 30 * 1048576) {
      blocks.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: f.data.toString("base64") }, title: f.name });
    } else if (mime.startsWith("text/") && f.data.length <= 200_000) {
      blocks.push({ type: "document", source: { type: "text", media_type: "text/plain", data: f.data.toString("utf8") }, title: f.name });
    } else {
      blocks.push({ type: "text", text: `[Attached file ${f.name} (${mime}, ${(f.data.length / 1024).toFixed(0)} KB, file_id ${f.id}) — this type cannot be shown to you directly.]` });
    }
  }
  return blocks;
}
