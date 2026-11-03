/**
 * Read models shared by the command channels (WhatsApp, Claude connector, dashboard).
 * Everything here is computed from the database — never from model output — so a channel can only
 * report work as completed when the orchestrator has verified it.
 */
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { approvals, commands, tasks, agents } from "@/db/schema";
import { getDefinition } from "@/agents/definitions";

/** Human short reference for a UUID, used in chat channels: first 6 hex chars, upper-case. */
export const shortRef = (id: string) => id.replace(/-/g, "").slice(0, 6).toUpperCase();

/** Resolve a short ref (≥4 hex chars) or full UUID to a row id in the given table. */
export async function resolveRef(table: "commands" | "approvals" | "tasks", ref: string): Promise<{ id: string } | { error: string }> {
  const clean = ref.trim().toLowerCase().replace(/[^0-9a-f-]/g, "");
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(clean)) return { id: clean };
  const hex = clean.replace(/-/g, "");
  if (hex.length < 4) return { error: `"${ref}" is not a valid reference.` };
  const rows = (await db.execute(sql`SELECT id::text AS id FROM ${sql.identifier(table)} WHERE replace(id::text, '-', '') LIKE ${hex + "%"} LIMIT 2`)) as unknown as { id: string }[];
  if (!rows.length) return { error: `Nothing found for reference ${ref.toUpperCase()}.` };
  if (rows.length > 1) return { error: `Reference ${ref.toUpperCase()} is ambiguous — use more characters.` };
  return { id: rows[0].id };
}

export function agentLabel(slug: string) {
  const d = getDefinition(slug);
  return d ? `${d.department} (${d.name})` : slug;
}

export type TaskBucket = "completed" | "pending" | "failed" | "awaiting_approval";

/** The four buckets the owner asked to keep distinct. */
export function bucketOf(status: string): TaskBucket {
  if (status === "completed") return "completed";
  if (status === "failed" || status === "rejected" || status === "cancelled") return "failed";
  if (status === "awaiting_approval") return "awaiting_approval";
  return "pending";
}

export async function commandStatus(commandId: string) {
  const [cmd] = await db.select().from(commands).where(eq(commands.id, commandId));
  if (!cmd) return null;
  const rows = await db.select({
    id: tasks.id, title: tasks.title, agentSlug: tasks.agentSlug, status: tasks.status, depth: tasks.depth, parentTaskId: tasks.parentTaskId,
    resultSummary: tasks.resultSummary, error: tasks.error, outputs: tasks.outputs, verification: tasks.verification, createdAt: tasks.createdAt, completedAt: tasks.completedAt,
  }).from(tasks).where(eq(tasks.commandId, commandId)).orderBy(tasks.createdAt);
  const taskIds = rows.map((r) => r.id);
  const pendingApprovals = taskIds.length
    ? await db.select({ id: approvals.id, title: approvals.title, actionType: approvals.actionType, level: approvals.level, agentSlug: approvals.agentSlug })
      .from(approvals).where(and(inArray(approvals.taskId, taskIds), eq(approvals.status, "pending")))
    : [];
  const root = rows.find((r) => r.id === cmd.rootTaskId) ?? null;
  const counts = { completed: 0, pending: 0, failed: 0, awaiting_approval: 0 } as Record<TaskBucket, number>;
  for (const r of rows) counts[bucketOf(r.status)]++;
  return {
    command: { id: cmd.id, ref: shortRef(cmd.id), text: cmd.text, status: cmd.status, channel: cmd.channel, createdAt: cmd.createdAt, completedAt: cmd.completedAt, response: cmd.response },
    root: root && { id: root.id, status: root.status, verification: root.verification, outputs: root.outputs },
    counts,
    tasks: rows.map((r) => ({
      id: r.id, title: r.title, agent: r.agentSlug, agentLabel: agentLabel(r.agentSlug), status: r.status, bucket: bucketOf(r.status), depth: r.depth,
      summary: r.status === "completed" ? r.resultSummary : r.error, outputs: r.outputs, verified: r.verification?.verified ?? null,
    })),
    pendingApprovals: pendingApprovals.map((a) => ({ ...a, ref: shortRef(a.id) })),
  };
}

export async function recentCommands(opts: { userId?: string; limit?: number } = {}) {
  return db.select({ id: commands.id, text: commands.text, status: commands.status, channel: commands.channel, createdAt: commands.createdAt, completedAt: commands.completedAt })
    .from(commands).where(opts.userId ? eq(commands.issuedBy, opts.userId) : undefined).orderBy(desc(commands.createdAt)).limit(opts.limit ?? 5);
}

/** Workforce-wide task picture for "what's outstanding / what got done today". */
export async function taskBoard(sinceHours = 24) {
  const since = new Date(Date.now() - sinceHours * 3600_000);
  const open = await db.select({ id: tasks.id, title: tasks.title, agentSlug: tasks.agentSlug, status: tasks.status, priority: tasks.priority, createdAt: tasks.createdAt })
    .from(tasks).where(inArray(tasks.status, ["proposed", "approved", "queued", "in_progress", "awaiting_subtasks", "awaiting_approval"])).orderBy(tasks.priority, tasks.createdAt).limit(60);
  const finished = await db.select({ id: tasks.id, title: tasks.title, agentSlug: tasks.agentSlug, status: tasks.status, resultSummary: tasks.resultSummary, error: tasks.error, completedAt: tasks.completedAt, verification: tasks.verification })
    .from(tasks).where(and(inArray(tasks.status, ["completed", "failed", "rejected", "cancelled"]), gte(tasks.completedAt, since))).orderBy(desc(tasks.completedAt)).limit(60);
  const pendingApprovals = await db.select({ id: approvals.id, title: approvals.title, level: approvals.level, agentSlug: approvals.agentSlug, createdAt: approvals.createdAt })
    .from(approvals).where(eq(approvals.status, "pending")).orderBy(approvals.createdAt).limit(30);
  const agentRows = await db.select({ slug: agents.slug, status: agents.status }).from(agents);
  return {
    sinceHours,
    completed: finished.filter((t) => t.status === "completed").map((t) => ({ ...t, agentLabel: agentLabel(t.agentSlug) })),
    failed: finished.filter((t) => t.status !== "completed").map((t) => ({ ...t, agentLabel: agentLabel(t.agentSlug) })),
    pending: open.filter((t) => t.status !== "awaiting_approval").map((t) => ({ ...t, agentLabel: agentLabel(t.agentSlug) })),
    awaitingApproval: open.filter((t) => t.status === "awaiting_approval").map((t) => ({ ...t, agentLabel: agentLabel(t.agentSlug) })),
    pendingApprovals: pendingApprovals.map((a) => ({ ...a, ref: shortRef(a.id) })),
    pausedAgents: agentRows.filter((a) => a.status !== "active").map((a) => a.slug),
  };
}
