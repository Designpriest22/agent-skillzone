/**
 * Durable job queue on PostgreSQL (FOR UPDATE SKIP LOCKED).
 * Chosen over Redis/Celery for the MVP: one less service to run and pay for, transactional with business data,
 * and safe with multiple workers. Swap for a dedicated broker if throughput ever demands it.
 */
import { sql, eq, and, lt } from "drizzle-orm";
import { db } from "@/db/client";
import { jobs } from "@/db/schema";

export type JobType =
  | "task.run"
  | "command.process"
  | "approval.execute"
  | "cycle.morning"
  | "cycle.midday"
  | "cycle.evening"
  | "followups.check"
  | "invoices.check"
  | "content.publish_due"
  | "report.generate"
  | "notify"
  | "cycle.assignments"
  | "whatsapp.inbound"
  | "channel.notify"
  | "channel.approval";

export type Job = typeof jobs.$inferSelect;

export async function enqueue(
  type: JobType,
  payload: Record<string, unknown> = {},
  opts: { runAt?: Date; priority?: number; maxAttempts?: number; dedupeKey?: string } = {},
): Promise<string | null> {
  const rows = await db
    .insert(jobs)
    .values({
      type,
      payload,
      runAt: opts.runAt ?? new Date(),
      priority: opts.priority ?? 5,
      maxAttempts: opts.maxAttempts ?? 3,
      dedupeKey: opts.dedupeKey ?? null,
    })
    .onConflictDoNothing({ target: jobs.dedupeKey })
    .returning({ id: jobs.id });
  return rows[0]?.id ?? null;
}

export async function claimJob(workerId: string): Promise<Job | null> {
  const rows = await db.execute(sql`
    UPDATE jobs SET status = 'running', locked_at = now(), locked_by = ${workerId}, attempts = attempts + 1
    WHERE id = (
      SELECT id FROM jobs
      WHERE status = 'queued' AND run_at <= now()
      ORDER BY priority ASC, run_at ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    RETURNING id`);
  const id = (rows as unknown as { id: string }[])[0]?.id;
  if (!id) return null;
  const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
  return job ?? null;
}

/** Dedupe keys that must outlive the job (e.g. inbound WhatsApp message ids, which Meta may redeliver hours later). */
const PERMANENT_DEDUPE_PREFIXES = ["wa-in:"];

export async function completeJob(id: string) {
  await db.update(jobs).set({
    status: "succeeded", finishedAt: new Date(), lockedAt: null,
    dedupeKey: sql`CASE WHEN ${jobs.dedupeKey} LIKE ANY (${`{${PERMANENT_DEDUPE_PREFIXES.map((p) => `${p}%`).join(",")}}`}::text[]) THEN ${jobs.dedupeKey} ELSE NULL END`,
  }).where(eq(jobs.id, id));
}

/** Exponential backoff: 30s, 2m, 8m … ; moves to `dead` after maxAttempts. */
export async function failJob(job: Job, error: string) {
  const dead = job.attempts >= job.maxAttempts;
  const delayMs = 30_000 * Math.pow(4, Math.max(0, job.attempts - 1));
  await db
    .update(jobs)
    .set({
      status: dead ? "dead" : "queued",
      lastError: error.slice(0, 4000),
      lockedAt: null,
      lockedBy: null,
      runAt: dead ? job.runAt : new Date(Date.now() + delayMs),
      finishedAt: dead ? new Date() : null,
      dedupeKey: dead ? null : job.dedupeKey,
    })
    .where(eq(jobs.id, job.id));
  return dead;
}

/** Re-queue jobs whose worker died mid-run. */
export async function recoverStaleJobs(staleAfterMs = 30 * 60_000) {
  const cutoff = new Date(Date.now() - staleAfterMs);
  const res = await db
    .update(jobs)
    .set({ status: "queued", lockedAt: null, lockedBy: null, lastError: "Recovered after worker timeout" })
    .where(and(eq(jobs.status, "running"), lt(jobs.lockedAt, cutoff)))
    .returning({ id: jobs.id });
  return res.length;
}

export async function retryJob(id: string) {
  await db.update(jobs).set({ status: "queued", runAt: new Date(), attempts: 0, lastError: null, finishedAt: null }).where(eq(jobs.id, id));
}
