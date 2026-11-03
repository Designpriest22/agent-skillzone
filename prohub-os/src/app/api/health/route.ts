import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [r] = (await db.execute(sql`SELECT (SELECT count(*) FROM jobs WHERE status='queued')::int AS queued, (SELECT max(locked_at) FROM jobs) AS last_claim`)) as unknown as { queued: number; last_claim: string | null }[];
    return Response.json({ ok: true, db: "up", queued: r.queued, lastJobClaim: r.last_claim, ai: env.llmDisabled ? "not configured" : "configured" });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 503 });
  }
}
