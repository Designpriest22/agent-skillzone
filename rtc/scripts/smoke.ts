/**
 * End-to-end smoke test against a running server and a LOCAL database:
 * signup → start run → bot plays → finish (server re-simulates) → rewards; then a tampered run is rejected.
 * The local DB's started_at is backdated so the wall-clock plausibility check passes without waiting.
 * Usage: npm run build && npm start (in another shell), then: npx tsx scripts/smoke.ts
 */
import postgres from "postgres";
import { loadEnv } from "./load-env";
import { encodeInputs } from "../src/game/sim/input";
import { playBot } from "../tests/bot";

loadEnv();
const BASE = process.env.SMOKE_URL ?? "http://localhost:3000";
if (process.env.NODE_ENV === "production") throw new Error("Smoke test edits run timestamps; never run it against production.");
const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
let cookie = "";

async function call(path: string, body?: unknown) {
  const res = await fetch(BASE + path, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json", Origin: BASE, Cookie: cookie },
    body: body ? JSON.stringify(body) : undefined,
  });
  const set = res.headers.get("set-cookie"); if (set) cookie = set.split(";")[0]!;
  const data = await res.json();
  if (!res.ok) throw new Error(`${path} ${res.status} ${JSON.stringify(data)}`);
  return data;
}
const check = (ok: boolean, msg: string) => { console.log(`${ok ? "✔" : "✘"} ${msg}`); if (!ok) process.exitCode = 1; };

async function main() {
  const u = `smoke${Date.now() % 1e8}`;
  await call("/api/auth/signup", { email: `${u}@example.test`, password: "correct horse battery", username: u, homeArea: "garki", fighter: "odumodu" });
  const me0 = await call("/api/me");
  check(me0.profile?.username === u, `signed up as @${u} with ${me0.profile.cash} CC`);

  // Honest run
  const start = await call("/api/runs/start", { substage: "01A", fighter: "odumodu", equipment: "firstaid" });
  const { log, result } = playBot("01A", "odumodu", start.seed);
  check(result.cleared, `bot cleared 01A locally (score ${result.score}, rating ${result.rating})`);
  await sql`update runs set started_at = now() - interval '1 hour' where id = ${start.runId}`;
  const fin = await call("/api/runs/finish", { runId: start.runId, inputs: encodeInputs(log), claimed: { score: result.score, ticks: result.ticks, cleared: result.cleared } });
  check(fin.verified === true, `server verified the run (${fin.rewards.map((r: { label: string }) => r.label).join(", ")})`);
  check(fin.achievements.includes("first_blood"), "first clear achievement awarded");
  const me1 = await call("/api/me");
  check(me1.profile.xp > 0 && me1.profile.cash > me0.profile.cash, `profile now ${me1.profile.xp} XP, ${me1.profile.cash} CC`);
  check(me1.unlockedStages.includes("01B"), "01B unlocked");

  // Replaying the same run id must not pay twice
  const again = await call("/api/runs/finish", { runId: start.runId, inputs: encodeInputs(log), claimed: { score: result.score, ticks: result.ticks, cleared: true } }).catch((e) => e);
  check(again instanceof Error, "resubmitting a finished run is refused");

  // Tampered run: claim a higher score
  const s2 = await call("/api/runs/start", { substage: "01A", fighter: "odumodu", equipment: null });
  const r2 = playBot("01A", "odumodu", s2.seed);
  await sql`update runs set started_at = now() - interval '1 hour' where id = ${s2.runId}`;
  const bad = await call("/api/runs/finish", { runId: s2.runId, inputs: encodeInputs(r2.log), claimed: { score: r2.result.score * 3, ticks: r2.result.ticks, cleared: true } }).catch((e) => e);
  check(bad instanceof Error || bad.verified === false, `inflated score rejected (${bad instanceof Error ? bad.message.slice(0, 80) : bad.reason})`);

  // Too-fast run (no backdating): real time can't be shorter than game time
  const s3 = await call("/api/runs/start", { substage: "01A", fighter: "odumodu", equipment: null });
  const r3 = playBot("01A", "odumodu", s3.seed);
  const fast = await call("/api/runs/finish", { runId: s3.runId, inputs: encodeInputs(r3.log), claimed: { score: r3.result.score, ticks: r3.result.ticks, cleared: r3.result.cleared } }).catch((e) => e);
  check(fast instanceof Error || fast.verified === false, "run finished faster than real time rejected");

  // Locked content and store rules
  const locked = await call("/api/runs/start", { substage: "02C", fighter: "odumodu", equipment: null }).catch((e) => e);
  check(locked instanceof Error, "locked substage refused");
  const lockedF = await call("/api/runs/start", { substage: "01A", fighter: "jabisiren", equipment: null }).catch((e) => e);
  check(lockedF instanceof Error, "locked fighter refused");
  const buy = await call("/api/store/buy", { itemId: "badge_area_pride" }).catch((e) => e);
  check(!(buy instanceof Error), `cash purchase ok (${buy instanceof Error ? buy.message : `${buy.cash} CC left`})`);
  const pay = await call("/api/store/checkout", { itemId: "pose_suya_flip" }).catch((e) => e);
  check(pay instanceof Error && /503/.test(pay.message), "Naira checkout is closed (503) until Paystack keys are set");

  const board = await call("/api/leaderboard?board=overall");
  check(board.rows.some((r: { username: string }) => r.username === u), "player appears on the live leaderboard");
  const pub = await call(`/api/players/${u}`);
  check(pub.username === u && !("email" in pub), "public profile exposes no email");
  await sql.end();
}
main().catch(async (e) => { console.error(e); await sql.end(); process.exit(1); });
