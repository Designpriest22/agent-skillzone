import { hostname } from "node:os";
import { claimJob, completeJob, failJob, recoverStaleJobs } from "@/orchestrator/queue";
import { handleJob } from "@/orchestrator/handlers";
import { tickScheduler } from "@/orchestrator/scheduler";
import { RetryableRunError } from "@/agents/runtime";
import { errMessage } from "@/lib/utils";
import { logActivity } from "@/lib/audit";

export const workerId = `${hostname()}:${process.pid}`;

/** Claims and runs one job. Returns false when the queue is empty. */
export async function processOne(): Promise<boolean> {
  const job = await claimJob(workerId);
  if (!job) return false;
  try {
    await handleJob(job);
    await completeJob(job.id);
  } catch (e) {
    const dead = await failJob(job, errMessage(e));
    if (!(e instanceof RetryableRunError)) console.error(`[worker] job ${job.type} ${job.id} failed${dead ? " permanently" : ""}:`, errMessage(e));
    if (dead) await logActivity({ type: "system", id: "worker" }, "job.dead", { type: "job", id: job.id }, { type: job.type, error: errMessage(e) });
  }
  return true;
}

/** Drains the queue for up to `budgetMs` (used by the serverless cron endpoint). */
export async function drain(budgetMs: number, concurrency = 2) {
  const deadline = Date.now() + budgetMs;
  let processed = 0;
  await tickScheduler();
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (Date.now() < deadline && (await processOne())) processed++;
  }));
  return processed;
}

export function startWorker(opts: { concurrency?: number; pollMs?: number } = {}) {
  const concurrency = opts.concurrency ?? Number(process.env.WORKER_CONCURRENCY ?? 3);
  const pollMs = opts.pollMs ?? 2000;
  let stopping = false;

  const lane = async (n: number) => {
    while (!stopping) {
      try {
        const worked = await processOne();
        if (!worked) await new Promise((r) => setTimeout(r, pollMs));
      } catch (e) {
        console.error(`[worker lane ${n}]`, errMessage(e));
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  };
  const schedulerTimer = setInterval(() => { tickScheduler().catch((e) => console.error("[scheduler]", errMessage(e))); }, 30_000);
  const recoveryTimer = setInterval(() => { recoverStaleJobs().catch(() => {}); }, 5 * 60_000);
  tickScheduler().catch((e) => console.error("[scheduler]", errMessage(e)));
  recoverStaleJobs().catch(() => {});
  const lanes = Array.from({ length: concurrency }, (_, i) => lane(i));
  console.log(`[worker] ${workerId} started with ${concurrency} lane(s)`);
  return async () => {
    stopping = true;
    clearInterval(schedulerTimer);
    clearInterval(recoveryTimer);
    await Promise.all(lanes);
  };
}
