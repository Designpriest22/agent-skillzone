import { timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import { runDailyJobs } from "@/lib/services/cron";

/** Daily maintenance. Call with `Authorization: Bearer $CRON_SECRET` (e.g. Vercel Cron). */
export async function POST(req: Request) {
  return run(req);
}
export async function GET(req: Request) {
  return run(req);
}

async function run(req: Request) {
  const secret = env().CRON_SECRET;
  const given = req.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  if (
    !secret ||
    given.length !== secret.length ||
    !timingSafeEqual(Buffer.from(given), Buffer.from(secret))
  ) {
    return new Response("unauthorized", { status: 401 });
  }
  return Response.json(await runDailyJobs());
}
