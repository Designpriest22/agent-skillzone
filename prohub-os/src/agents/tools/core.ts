import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  tasks, deliverables, knowledgeDocs, agentMemories, agentMessages, intelItems, leads, clients, proposals, invoices,
  contentItems, campaigns, sitePages, approvals, projects, followUps, interactions, reports, agents, services,
  DELIVERABLE_KINDS, KNOWLEDGE_CATEGORIES, INTEL_CATEGORIES,
} from "@/db/schema";
import { defineTool, ToolError, type ToolContext } from "./types";
import { childResults, createTask } from "@/orchestrator/tasks";
import { logActivity } from "@/lib/audit";
import { searchKnowledge } from "../memory";

/* ── Completion verification ─────────────────────────────────────────────── */

const OUTPUT_TABLES = {
  deliverable: deliverables, lead: leads, client: clients, proposal: proposals, invoice: invoices,
  content_item: contentItems, campaign: campaigns, site_page: sitePages, intel: intelItems, knowledge: knowledgeDocs,
  approval: approvals, task: tasks, project: projects, follow_up: followUps, interaction: interactions,
  memory: agentMemories, report: reports,
} as const;
export type OutputType = keyof typeof OUTPUT_TABLES;
export const OUTPUT_TYPES = Object.keys(OUTPUT_TABLES) as [OutputType, ...OutputType[]];

export async function verifyOutputs(outputs: { type: string; id: string }[]) {
  const missing: string[] = [];
  for (const o of outputs) {
    const table = OUTPUT_TABLES[o.type as OutputType];
    if (!table || !/^[0-9a-f-]{36}$/i.test(o.id)) { missing.push(`${o.type}:${o.id}`); continue; }
    const rows = await db.select({ id: table.id }).from(table).where(eq(table.id, o.id)).limit(1);
    if (!rows.length) missing.push(`${o.type}:${o.id}`);
  }
  return { verified: missing.length === 0, checked: outputs.length, missing, at: new Date().toISOString() };
}

const outputRef = z.object({ type: z.enum(OUTPUT_TYPES), id: z.string() });

export const completeTask = defineTool({
  name: "complete_task",
  description:
    "Finish the current task. You MUST list the IDs of the records you actually created or changed (deliverables, leads, approvals, etc.) in `outputs`; " +
    "the orchestrator verifies every ID exists before accepting completion. Use answer_only=true only for pure questions answered from data you retrieved with tools. " +
    "Your summary must state real counts (e.g. '12 leads created', not the number requested) and any shortfall versus what was asked.",
  governance: "autonomous",
  schema: z.object({
    summary: z.string().min(20).describe("Outcome summary for the owner: what was done, real numbers, open issues, recommended next steps."),
    outputs: z.array(outputRef).default([]),
    answer_only: z.boolean().default(false),
  }),
  async run(input, ctx) {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, ctx.taskId));
    const open = (await childResults(ctx.taskId)).filter((c) => !["completed", "failed", "rejected", "cancelled"].includes(c.status));
    if (open.length) throw new ToolError(`${open.length} delegated subtask(s) are still running. Call await_subtasks instead; you will be resumed with their results.`);
    if (!input.outputs.length && !input.answer_only) {
      throw new ToolError("No outputs listed. Save your work with save_deliverable (or the relevant record tool) and reference the IDs, or set answer_only=true for a pure data answer.");
    }
    const verification = await verifyOutputs(input.outputs);
    if (!verification.verified) throw new ToolError(`These outputs do not exist: ${verification.missing.join(", ")}. Reference only records you actually created.`);
    ctx.terminal = { kind: "completed", summary: input.summary };
    await db.update(tasks).set({ resultSummary: input.summary, outputs: input.outputs, verification, updatedAt: new Date() }).where(eq(tasks.id, ctx.taskId));
    return { accepted: true, verified_outputs: verification.checked, task: task?.title };
  },
});

export const failTask = defineTool({
  name: "fail_task",
  description: "Stop and report that the task cannot be completed (missing information, integration not configured, blocked). Explain the blocker and what the owner must do.",
  governance: "autonomous",
  schema: z.object({ reason: z.string().min(10), needs_from_owner: z.string().optional() }),
  async run(input, ctx) {
    ctx.terminal = { kind: "failed", summary: `${input.reason}${input.needs_from_owner ? ` — Needed: ${input.needs_from_owner}` : ""}` };
    return { recorded: true };
  },
});

export const awaitSubtasks = defineTool({
  name: "await_subtasks",
  description: "End this turn while delegated subtasks run. You will be re-invoked automatically with all their results when they finish. Leave yourself plan notes.",
  governance: "autonomous",
  schema: z.object({ plan_notes: z.string().describe("What you delegated, why, and what you will do with the results.") }),
  async run(input, ctx) {
    const kids = await childResults(ctx.taskId);
    if (!kids.length) throw new ToolError("You have not delegated any subtasks.");
    await db.update(tasks).set({ planNotes: input.plan_notes, updatedAt: new Date() }).where(eq(tasks.id, ctx.taskId));
    ctx.terminal = { kind: "awaiting_subtasks", summary: input.plan_notes };
    return { waiting_on: kids.filter((k) => !["completed", "failed", "rejected", "cancelled"].includes(k.status)).length };
  },
});

/* ── Deliverables ────────────────────────────────────────────────────────── */

export const saveDeliverable = defineTool({
  name: "save_deliverable",
  description:
    "Save a work product (research report, strategy, calendar, script, storyboard, copy, SVG design, campaign plan…). " +
    "Creative deliverables must include a quality-control checklist; any failed QC item keeps it in draft. Returns the deliverable ID to reference in complete_task.",
  governance: "autonomous",
  schema: z.object({
    kind: z.enum(DELIVERABLE_KINDS),
    title: z.string().min(3),
    format: z.enum(["markdown", "json", "svg", "html", "url"]).default("markdown"),
    content: z.string().min(1).describe("Full content. For svg: a complete <svg> document with explicit width/height/viewBox."),
    platform: z.string().optional().describe("Target platform/format, e.g. instagram_reel_9x16, linkedin_post, a4_print"),
    qc: z.array(z.object({ item: z.string(), pass: z.boolean(), note: z.string().optional() })).default([]),
    project_id: z.string().uuid().optional(),
    client_id: z.string().uuid().optional(),
    lead_id: z.string().uuid().optional(),
    revises_deliverable_id: z.string().uuid().optional(),
    submit_for_review: z.boolean().default(true),
  }),
  async run(input, ctx) {
    const creative = ["design_svg", "design_concept", "script", "storyboard", "animation_brief", "copy", "landing_page", "image", "video", "brand_guidelines"];
    if (creative.includes(input.kind) && input.qc.length < 3) throw new ToolError("Creative deliverables require at least 3 QC checklist items (see your quality criteria).");
    if (input.format === "svg") {
      if (!/^\s*(<\?xml[^>]*>\s*)?<svg[\s>]/i.test(input.content)) throw new ToolError("SVG content must start with an <svg> element.");
      if (/<script|on\w+\s*=|javascript:/i.test(input.content)) throw new ToolError("SVG must not contain scripts or event handlers.");
    }
    let version = 1;
    if (input.revises_deliverable_id) {
      const [prev] = await db.select().from(deliverables).where(eq(deliverables.id, input.revises_deliverable_id));
      if (!prev) throw new ToolError("revises_deliverable_id not found");
      version = prev.version + 1;
    }
    const allPass = input.qc.every((q) => q.pass);
    const [row] = await db.insert(deliverables).values({
      taskId: ctx.taskId, agentSlug: ctx.agentSlug, kind: input.kind, title: input.title, format: input.format,
      content: input.content, platform: input.platform ?? null, qc: input.qc,
      status: input.submit_for_review && allPass ? "in_review" : "draft",
      projectId: input.project_id ?? null, clientId: input.client_id ?? null, leadId: input.lead_id ?? null,
      version, previousVersionId: input.revises_deliverable_id ?? null,
    }).returning({ id: deliverables.id, status: deliverables.status });
    ctx.produced.push({ type: "deliverable", id: row.id });
    return { deliverable_id: row.id, status: row.status, version, ...(allPass ? {} : { note: "Kept as draft because a QC item failed — fix and save a revision." }) };
  },
});

export const readRecord = defineTool({
  name: "read_record",
  description: "Read the full content of a record by type and ID (e.g. a deliverable produced by another agent, a lead, a proposal, a task result).",
  governance: "autonomous",
  schema: z.object({ type: z.enum(OUTPUT_TYPES), id: z.string().uuid() }),
  async run(input) {
    const table = OUTPUT_TABLES[input.type];
    const [row] = await db.select().from(table).where(eq(table.id, input.id)).limit(1);
    if (!row) throw new ToolError(`${input.type} ${input.id} not found`);
    const r = row as Record<string, unknown>;
    if ("transcript" in r) delete r.transcript;
    if (typeof r.content === "string" && r.content.length > 30_000) r.content = `${r.content.slice(0, 30_000)}\n…[truncated]`;
    return r;
  },
});

/* ── Knowledge & memory ─────────────────────────────────────────────────── */

export const searchKnowledgeTool = defineTool({
  name: "search_knowledge",
  description: "Search the shared business knowledge base and your own memory (company profile, services, pricing, SOPs, past projects, lessons). Check here BEFORE asking the owner for information.",
  governance: "autonomous",
  schema: z.object({ query: z.string().min(2), category: z.enum(KNOWLEDGE_CATEGORIES).optional(), limit: z.number().int().min(1).max(10).default(5) }),
  async run(input, ctx) {
    return searchKnowledge(input.query, { agentSlug: ctx.agentSlug, category: input.category, limit: input.limit });
  },
});

export const saveMemory = defineTool({
  name: "save_memory",
  description: "Save a durable lesson or fact to YOUR memory (e.g. what made a pitch succeed, a client preference, a mistake to avoid). Keep it specific and reusable.",
  governance: "autonomous",
  schema: z.object({ content: z.string().min(10).max(1500), kind: z.enum(["lesson", "fact", "preference", "outcome"]).default("lesson"), importance: z.number().int().min(1).max(5).default(3) }),
  async run(input, ctx) {
    const [row] = await db.insert(agentMemories).values({ agentSlug: ctx.agentSlug, content: input.content, kind: input.kind, importance: input.importance, sourceTaskId: ctx.taskId }).returning({ id: agentMemories.id });
    ctx.produced.push({ type: "memory", id: row.id });
    return { memory_id: row.id };
  },
});

export const addKnowledge = defineTool({
  name: "add_knowledge",
  description: "Add a document to the SHARED knowledge base for all agents (SOPs, strategies, client info, decisions, performance learnings). Do not store unverified claims as facts.",
  governance: "autonomous",
  schema: z.object({ category: z.enum(KNOWLEDGE_CATEGORIES), title: z.string().min(3), content: z.string().min(20), tags: z.array(z.string()).default([]), client_id: z.string().uuid().optional() }),
  async run(input, ctx) {
    if (input.category === "pricing") throw new ToolError("Pricing is owner-controlled. Propose pricing changes in a deliverable for owner review instead.");
    const [row] = await db.insert(knowledgeDocs).values({ ...input, clientId: input.client_id ?? null, createdBy: `agent:${ctx.agentSlug}` }).returning({ id: knowledgeDocs.id });
    ctx.produced.push({ type: "knowledge", id: row.id });
    return { knowledge_id: row.id };
  },
});

/* ── Inter-agent communication ───────────────────────────────────────────── */

export const sendAgentMessage = defineTool({
  name: "send_agent_message",
  description: "Send an FYI message to another agent's inbox (delivered at the start of its next task). For work requests use request_collaboration or delegate_task.",
  governance: "autonomous",
  schema: z.object({ to_agent: z.string(), subject: z.string().min(3), body: z.string().min(5).max(4000) }),
  async run(input, ctx) {
    const [a] = await db.select({ slug: agents.slug }).from(agents).where(eq(agents.slug, input.to_agent));
    if (!a) throw new ToolError(`Unknown agent ${input.to_agent}`);
    const [m] = await db.insert(agentMessages).values({ fromAgent: ctx.agentSlug, toAgent: input.to_agent, taskId: ctx.taskId, subject: input.subject, body: input.body }).returning({ id: agentMessages.id });
    return { message_id: m.id };
  },
});

export const requestCollaboration = defineTool({
  name: "request_collaboration",
  description: "Ask another department to do work for you. Creates a PROPOSED task that the Operations Manager reviews and approves before it runs. Use depends_on implicitly by waiting for the result in a later task.",
  governance: "autonomous",
  schema: z.object({ agent: z.string(), title: z.string().min(5), instructions: z.string().min(20), priority: z.number().int().min(1).max(5).default(3) }),
  async run(input, ctx) {
    if (input.agent === ctx.agentSlug) throw new ToolError("Do the work yourself rather than requesting it from your own department.");
    const t = await createTask({ title: input.title, instructions: input.instructions, agentSlug: input.agent, createdBy: `agent:${ctx.agentSlug}`, status: "proposed", priority: input.priority, parentTaskId: null });
    const { enqueueOpsReview } = await import("@/orchestrator/cycles");
    await enqueueOpsReview();
    ctx.produced.push({ type: "task", id: t.id });
    return { task_id: t.id, status: t.status, note: "Pending Operations Manager approval." };
  },
});

/* ── Intelligence ────────────────────────────────────────────────────────── */

export const recordIntel = defineTool({
  name: "record_intel",
  description:
    "Publish a finding to the Intelligence Centre (trend, competitor move, opportunity, recommendation). " +
    "confidence: 'verified' only with source URLs you actually read this session; 'likely' for well-supported inference; 'assumption' otherwise. " +
    "Revenue opportunities must include economics (estimated cost, potential revenue, requirements, risks).",
  governance: "autonomous",
  schema: z.object({
    category: z.enum(INTEL_CATEGORIES),
    title: z.string().min(5),
    summary: z.string().min(20),
    recommendation: z.string().optional(),
    source_urls: z.array(z.string().url()).default([]),
    confidence: z.enum(["verified", "likely", "assumption"]),
    economics: z.object({ est_cost_ngn: z.number().optional(), est_revenue_ngn: z.number().optional(), requirements: z.string().optional(), risks: z.string().optional() }).optional(),
  }),
  async run(input, ctx) {
    if (input.confidence === "verified" && !input.source_urls.length) throw new ToolError("'verified' findings need at least one source URL.");
    if (input.category === "revenue_opportunity" && !input.economics) throw new ToolError("Revenue opportunities must include economics: estimated cost, revenue, requirements and risks.");
    const e = input.economics;
    const [row] = await db.insert(intelItems).values({
      category: input.category, title: input.title, summary: input.summary, recommendation: input.recommendation ?? null,
      sourceUrls: input.source_urls, confidence: input.confidence, agentSlug: ctx.agentSlug, taskId: ctx.taskId,
      economics: e ? { estCostMinor: e.est_cost_ngn !== undefined ? Math.round(e.est_cost_ngn * 100) : undefined, estRevenueMinor: e.est_revenue_ngn !== undefined ? Math.round(e.est_revenue_ngn * 100) : undefined, requirements: e.requirements, risks: e.risks } : null,
    }).returning({ id: intelItems.id });
    ctx.produced.push({ type: "intel", id: row.id });
    return { intel_id: row.id };
  },
});

export const listServices = defineTool({
  name: "list_services",
  description: "List Prohub's service catalogue with any owner-configured indicative pricing (null = not set; never invent prices).",
  governance: "autonomous",
  schema: z.object({}),
  async run() {
    return db.select({ slug: services.slug, name: services.name, summary: services.summary, deliverables: services.deliverables, priceFromMinor: services.priceFromMinor, pricingModel: services.pricingModel }).from(services).orderBy(services.sortOrder);
  },
});

export const listRecentWork = defineTool({
  name: "list_recent_deliverables",
  description: "List recent deliverables (optionally by agent, kind, lead or project) to reuse and repurpose existing work instead of starting from scratch.",
  governance: "autonomous",
  schema: z.object({ agent: z.string().optional(), kind: z.enum(DELIVERABLE_KINDS).optional(), lead_id: z.string().uuid().optional(), project_id: z.string().uuid().optional(), limit: z.number().int().max(30).default(10) }),
  async run(input) {
    const conds = [];
    if (input.agent) conds.push(eq(deliverables.agentSlug, input.agent));
    if (input.kind) conds.push(eq(deliverables.kind, input.kind));
    if (input.lead_id) conds.push(eq(deliverables.leadId, input.lead_id));
    if (input.project_id) conds.push(eq(deliverables.projectId, input.project_id));
    return db.select({ id: deliverables.id, title: deliverables.title, kind: deliverables.kind, agent: deliverables.agentSlug, status: deliverables.status, createdAt: deliverables.createdAt })
      .from(deliverables).where(conds.length ? and(...conds) : undefined).orderBy(desc(deliverables.createdAt)).limit(input.limit);
  },
});

export async function logToolCall(ctx: ToolContext, tool: string, ok: boolean, detail: Record<string, unknown>) {
  await logActivity({ type: "agent", id: ctx.agentSlug }, `tool.${tool}${ok ? "" : ".error"}`, { type: "task", id: ctx.taskId }, detail);
}

