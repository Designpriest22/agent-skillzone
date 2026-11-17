/**
 * Task lifecycle — the central coordination mechanism between agents.
 *
 *   proposed ──(manager/owner approves)──▶ approved ──(deps met)──▶ queued ──▶ in_progress
 *        │                                                                     │
 *        └──▶ rejected                     awaiting_subtasks ◀── (delegated) ───┤
 *                                                                     completed / failed
 */
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { tasks, agents, commands, type TaskStatus } from "@/db/schema";
import { enqueue } from "./queue";
import { logActivity } from "@/lib/audit";

export const MAX_DEPTH = 3;
export const MAX_TASKS_PER_COMMAND = 30;
export const TERMINAL: TaskStatus[] = ["completed", "failed", "rejected", "cancelled"];

export type NewTask = {
  title: string;
  instructions: string;
  agentSlug: string;
  createdBy: string;
  status?: "proposed" | "approved";
  priority?: number;
  kind?: "work" | "review" | "consolidate" | "scheduled" | "triage";
  parentTaskId?: string | null;
  commandId?: string | null;
  projectId?: string | null;
  leadId?: string | null;
  clientId?: string | null;
  dependsOn?: string[];
  dueAt?: Date | null;
};

function actorOf(createdBy: string) {
  const [type, ...rest] = createdBy.split(":");
  const t = (["user", "agent", "system", "webhook"].includes(type) ? type : "system") as "user" | "agent" | "system" | "webhook";
  return { type: t, id: rest.join(":") || createdBy };
}

export async function createTask(t: NewTask) {
  const [agent] = await db.select().from(agents).where(eq(agents.slug, t.agentSlug));
  if (!agent) throw new Error(`Unknown agent "${t.agentSlug}"`);
  let depth = 0;
  let commandId = t.commandId ?? null;
  if (t.parentTaskId) {
    const [parent] = await db.select().from(tasks).where(eq(tasks.id, t.parentTaskId));
    if (!parent) throw new Error("Parent task not found");
    depth = parent.depth + 1;
    commandId = commandId ?? parent.commandId;
    if (depth > MAX_DEPTH) throw new Error(`Delegation depth limit (${MAX_DEPTH}) reached — complete the work directly or report back.`);
  }
  if (commandId) {
    const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(tasks).where(eq(tasks.commandId, commandId));
    if (n >= MAX_TASKS_PER_COMMAND) throw new Error(`Task budget for this command (${MAX_TASKS_PER_COMMAND}) is exhausted — consolidate with what you have.`);
  }
  if (t.dependsOn?.length) {
    const deps = await db.select({ id: tasks.id }).from(tasks).where(inArray(tasks.id, t.dependsOn));
    if (deps.length !== new Set(t.dependsOn).size) throw new Error("One or more depends_on task IDs do not exist");
  }
  const [row] = await db.insert(tasks).values({
    title: t.title, instructions: t.instructions, agentSlug: t.agentSlug, createdBy: t.createdBy,
    status: t.status ?? "proposed", priority: t.priority ?? 3, kind: t.kind ?? "work",
    parentTaskId: t.parentTaskId ?? null, commandId, projectId: t.projectId ?? null, leadId: t.leadId ?? null,
    clientId: t.clientId ?? null, dependsOn: t.dependsOn ?? [], dueAt: t.dueAt ?? null, depth,
  }).returning();
  await logActivity(actorOf(t.createdBy), "task.created", { type: "task", id: row.id }, { agent: t.agentSlug, status: row.status, title: row.title });
  if (row.commandId && row.depth === 1) await commandEvent(row.commandId, "assigned", row.id);
  if (row.status === "approved") await queueIfReady(row.id);
  return row;
}

/** Moves an approved task to `queued` and enqueues execution once all dependencies have completed. */
export async function queueIfReady(taskId: string) {
  const [t] = await db.select().from(tasks).where(eq(tasks.id, taskId));
  if (!t || t.status !== "approved") return false;
  if (t.dependsOn.length) {
    const deps = await db.select({ status: tasks.status }).from(tasks).where(inArray(tasks.id, t.dependsOn));
    if (deps.some((d) => d.status === "failed" || d.status === "rejected" || d.status === "cancelled")) {
      await setStatus(t.id, "failed", { error: "A prerequisite task did not complete; this task was not started." });
      await onTaskFinished(t.id);
      return false;
    }
    if (!deps.every((d) => d.status === "completed")) return false;
  }
  const updated = await db.update(tasks).set({ status: "queued", updatedAt: new Date() })
    .where(and(eq(tasks.id, t.id), eq(tasks.status, "approved"))).returning({ id: tasks.id });
  if (!updated.length) return false;
  await enqueue("task.run", { taskId: t.id }, { priority: t.priority, dedupeKey: `task:${t.id}:${t.attempts}` });
  return true;
}

export async function setStatus(taskId: string, status: TaskStatus, extra: Partial<typeof tasks.$inferInsert> = {}) {
  await db.update(tasks).set({
    status, updatedAt: new Date(), ...extra,
    ...(TERMINAL.includes(status) ? { completedAt: new Date() } : {}),
  }).where(eq(tasks.id, taskId));
}

export async function approveTask(taskId: string, approver: string) {
  const res = await db.update(tasks).set({ status: "approved", updatedAt: new Date() })
    .where(and(eq(tasks.id, taskId), eq(tasks.status, "proposed"))).returning();
  if (!res.length) throw new Error("Task is not awaiting approval");
  await logActivity(actorOf(approver), "task.approved", { type: "task", id: taskId });
  await queueIfReady(taskId);
  return res[0];
}

export async function rejectTask(taskId: string, approver: string, reason: string) {
  const res = await db.update(tasks).set({ status: "rejected", error: reason, completedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(tasks.id, taskId), eq(tasks.status, "proposed"))).returning();
  if (!res.length) throw new Error("Task is not awaiting approval");
  await logActivity(actorOf(approver), "task.rejected", { type: "task", id: taskId }, { reason });
  await onTaskFinished(taskId);
}

/** Owner-driven recovery: re-run a failed or cancelled task from scratch. */
export async function retryTask(taskId: string) {
  const [t] = await db.select().from(tasks).where(eq(tasks.id, taskId));
  if (!t) throw new Error("Task not found");
  if (!["failed", "cancelled"].includes(t.status)) throw new Error(`Only failed or cancelled tasks can be retried (status: ${t.status})`);
  await db.update(tasks).set({ status: "approved", error: null, completedAt: null, updatedAt: new Date() }).where(eq(tasks.id, taskId));
  if (t.commandId && !t.parentTaskId) await db.update(commands).set({ status: "executing", completedAt: null }).where(eq(commands.id, t.commandId));
  return queueIfReady(taskId);
}

export async function cancelTask(taskId: string, by: string) {
  const [t] = await db.select().from(tasks).where(eq(tasks.id, taskId));
  if (!t || TERMINAL.includes(t.status)) return;
  await setStatus(taskId, "cancelled", { error: `Cancelled by ${by}` });
  const children = await db.select({ id: tasks.id }).from(tasks).where(eq(tasks.parentTaskId, taskId));
  for (const c of children) await cancelTask(c.id, by);
  await onTaskFinished(taskId);
}

/**
 * Called whenever a task reaches a terminal state. Unblocks dependents and wakes the parent
 * manager agent to consolidate once all of its subtasks are finished.
 */
export async function onTaskFinished(taskId: string) {
  const [t] = await db.select().from(tasks).where(eq(tasks.id, taskId));
  if (!t) return;

  const dependents = await db.select({ id: tasks.id }).from(tasks)
    .where(and(eq(tasks.status, "approved"), sql`${tasks.dependsOn} @> ${JSON.stringify([taskId])}::jsonb`));
  for (const d of dependents) await queueIfReady(d.id);

  if (t.commandId && t.depth === 1 && TERMINAL.includes(t.status) && t.status !== "cancelled") await commandEvent(t.commandId, "finished", t.id);
  if (t.parentTaskId) await maybeResumeParent(t.parentTaskId);

  // Close the owner's command when its root task finishes.
  if (t.commandId && !t.parentTaskId && TERMINAL.includes(t.status)) {
    const status = t.status === "completed" ? "completed" : t.status === "cancelled" ? "cancelled" : "failed";
    await db.update(commands).set({ status, response: t.resultSummary ?? t.error, completedAt: new Date() }).where(eq(commands.id, t.commandId));
    await commandEvent(t.commandId, "command_done", t.id);
  }
}

/**
 * Progress events for commands issued from a push-capable channel (WhatsApp). Sent through the job
 * queue so a slow or failing messaging API never blocks orchestration, and retried with backoff.
 */
async function commandEvent(commandId: string, event: "assigned" | "finished" | "command_done", taskId: string) {
  const [cmd] = await db.select({ channel: commands.channel, replyTo: commands.replyTo }).from(commands).where(eq(commands.id, commandId));
  if (cmd?.channel !== "whatsapp" || !cmd.replyTo) return;
  await enqueue("channel.notify", { commandId, event, taskId }, { priority: 2, dedupeKey: `cmd-event:${commandId}:${event}:${taskId}` });
}

/** Wakes a manager waiting on subtasks once every child is terminal. Safe to call repeatedly. */
export async function maybeResumeParent(parentId: string) {
  const [parent] = await db.select().from(tasks).where(eq(tasks.id, parentId));
  if (parent?.status !== "awaiting_subtasks") return false;
  const siblings = await db.select({ status: tasks.status }).from(tasks).where(eq(tasks.parentTaskId, parent.id));
  if (!siblings.every((s) => TERMINAL.includes(s.status))) return false;
  const resumed = await db.update(tasks).set({ status: "queued", updatedAt: new Date() })
    .where(and(eq(tasks.id, parent.id), eq(tasks.status, "awaiting_subtasks"))).returning({ id: tasks.id });
  if (!resumed.length) return false;
  await enqueue("task.run", { taskId: parent.id, resume: true }, { priority: Math.max(1, parent.priority - 1), dedupeKey: `task:${parent.id}:resume:${Date.now()}` });
  return true;
}

export async function childResults(parentId: string) {
  return db.select({
    id: tasks.id, title: tasks.title, agentSlug: tasks.agentSlug, status: tasks.status,
    resultSummary: tasks.resultSummary, outputs: tasks.outputs, error: tasks.error, verification: tasks.verification,
  }).from(tasks).where(eq(tasks.parentTaskId, parentId));
}
