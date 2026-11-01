import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { approvals, tasks } from "@/db/schema";
import { ACTION_POLICY, canApprove } from "./permissions";
import { enqueue } from "@/orchestrator/queue";
import { notifyOwner } from "@/services/notify";
import { logActivity, type Actor } from "@/lib/audit";

export async function requestApproval(opts: {
  actionType: string; agentSlug?: string | null; taskId?: string | null; title: string; summary: string; payload: Record<string, unknown>;
}) {
  const policy = ACTION_POLICY[opts.actionType];
  if (!policy) throw new Error(`Unknown governed action: ${opts.actionType}`);
  const [row] = await db.insert(approvals).values({
    actionType: opts.actionType, level: policy.level, agentSlug: opts.agentSlug ?? null, taskId: opts.taskId ?? null,
    title: opts.title, summary: opts.summary, payload: opts.payload,
  }).returning();
  await logActivity({ type: opts.agentSlug ? "agent" : "system", id: opts.agentSlug ?? "system" }, "approval.requested", { type: "approval", id: row.id }, { actionType: opts.actionType, level: policy.level });
  await notifyOwner({
    kind: "approval",
    title: `${policy.level === 3 ? "Owner authorisation" : "Approval"} needed: ${opts.title}`,
    body: `${policy.label}. ${opts.summary}`.slice(0, 900),
    href: `/os/approvals?focus=${row.id}`,
  });
  return row;
}

export async function decideApproval(opts: { approvalId: string; userId: string; role: string; decision: "approve" | "reject"; note?: string }) {
  const [a] = await db.select().from(approvals).where(eq(approvals.id, opts.approvalId));
  if (!a) throw new Error("Approval not found");
  if (a.status !== "pending") throw new Error(`Approval is already ${a.status}`);
  if (!canApprove(opts.role, a.level)) throw new Error(a.level === 3 ? "Only the owner can authorise this action." : "Your role cannot approve this action.");
  const status = opts.decision === "approve" ? "approved" : "rejected";
  const updated = await db.update(approvals)
    .set({ status, decidedBy: opts.userId, decidedAt: new Date(), decisionNote: opts.note ?? null })
    .where(and(eq(approvals.id, a.id), eq(approvals.status, "pending"))).returning();
  if (!updated.length) throw new Error("Approval was decided concurrently");
  const actor: Actor = { type: "user", id: opts.userId };
  await logActivity(actor, `approval.${status}`, { type: "approval", id: a.id }, { actionType: a.actionType, note: opts.note });
  if (status === "approved") {
    await enqueue("approval.execute", { approvalId: a.id }, { priority: 2, dedupeKey: `approval:${a.id}` });
  } else {
    // Rejection is fed back to the agent's memory channel via the originating task.
    if (a.taskId) {
      await db.update(tasks).set({ updatedAt: new Date() }).where(eq(tasks.id, a.taskId));
    }
    await onRejected(a);
  }
  return updated[0];
}

async function onRejected(a: typeof approvals.$inferSelect) {
  const { rejectGovernedRecord } = await import("./actions");
  await rejectGovernedRecord(a);
}
