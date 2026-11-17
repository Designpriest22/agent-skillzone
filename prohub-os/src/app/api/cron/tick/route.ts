/** Serverless worker entrypoint (WORKER_MODE=cron): call every minute with `Authorization: Bearer $CRON_SECRET`. */
import { drain } from "@/worker/loop";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const maxDuration = 300;

async function handle(req: Request) {
  if (!env.cronSecret || req.headers.get("authorization") !== `Bearer ${env.cronSecret}`) return new Response("Unauthorized", { status: 401 });
  const processed = await drain(Number(process.env.CRON_DRAIN_MS ?? 50_000));
  return Response.json({ processed });
}
export const GET = handle;
export const POST = handle;
