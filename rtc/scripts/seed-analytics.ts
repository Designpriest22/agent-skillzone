/**
 * DEMO DATA ONLY. Fills a LOCAL database with synthetic analytics events so the staff dashboard can be
 * previewed before launch. Refuses to run in production. Never present these numbers as real traction.
 * Usage: npx tsx scripts/seed-analytics.ts [--players 1500]
 */
import postgres from "postgres";
import { loadEnv } from "./load-env";
import { AREAS, SUBSTAGE_ORDER } from "../src/game/data/world";
import { ROSTER } from "../src/game/data/roster";

loadEnv();
if (process.env.NODE_ENV === "production") throw new Error("Refusing to seed demo analytics in production.");
const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
let s = 42; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
const pick = <T,>(a: readonly T[]) => a[Math.floor(r() * a.length)]!;
const N = Number(process.argv[process.argv.indexOf("--players") + 1]) || 1500;
const SOURCES = ["", "", "instagram.com", "x.com", "tiktok", "tcm_site", "whatsapp", "liveoutloud"];
const HOURS = [0.2, 0.15, 0.1, 0.05, 0.05, 0.05, 0.1, 0.2, 0.3, 0.35, 0.4, 0.45, 0.6, 0.55, 0.5, 0.55, 0.65, 0.8, 0.95, 1, 1, 0.95, 0.75, 0.45];

async function main() {
  await sql`delete from analytics_events where props->>'demo' = 'true'`;
  const rows: Record<string, unknown>[] = [];
  const now = Date.now();
  for (let i = 0; i < N; i++) {
    const anon = `demo-${i.toString(36).padStart(6, "0")}-${Math.floor(r() * 1e9).toString(36)}`;
    const first = now - Math.pow(r(), 0.7) * 30 * 86400_000;
    const platform = r() < 0.78 ? "mobile" : r() < 0.85 ? "desktop" : "tablet";
    const area = r() < 0.35 ? pick(AREAS).id : null;
    const loyal = r();
    let day = first, visits = 0, progress = 0;
    while (day < now && visits < 40) {
      const hour = (() => { for (;;) { const h = Math.floor(r() * 24); if (r() < HOURS[h]!) return h; } })();
      const t0 = new Date(day); t0.setUTCHours(hour - 1, Math.floor(r() * 60));
      let t = t0.getTime(); if (t > now) break;
      const sess = `demo-s-${i}-${visits}`;
      const ev = (name: string, props: Record<string, unknown>) => { rows.push({ at: new Date(t), anon_id: anon, user_id: null, session_id: sess, name, platform, area, props: { ...props, demo: true } }); t += 20_000 + r() * 60_000; };
      ev("session_started", { source: visits ? "" : pick(SOURCES), returning: visits > 0 });
      ev("screen_viewed", { screen: "menu" });
      if (r() < 0.82) {
        const runs = 1 + Math.floor(r() * 4);
        for (let k = 0; k < runs; k++) {
          const sub = SUBSTAGE_ORDER[Math.min(progress, SUBSTAGE_ORDER.length - 1)]!;
          const fighter = r() < 0.45 ? "odumodu" : pick(ROSTER.slice(0, 6)).id;
          ev("run_started", { substage: sub, fighter, signed_in: !!area });
          const difficulty = [0.82, 0.7, 0.45, 0.6, 0.5, 0.28][SUBSTAGE_ORDER.indexOf(sub)]!;
          if (r() < 0.12) { ev("run_quit", { substage: sub, fighter, duration_s: Math.floor(30 + r() * 90) }); continue; }
          const cleared = r() < difficulty;
          ev("run_finished", { substage: sub, fighter, cleared, rating: cleared ? pick(["S", "A", "B", "B", "C"]) : "-", score: Math.floor(3000 + r() * 9000), max_combo: Math.floor(5 + r() * 40), kos: Math.floor(5 + r() * 25), duration_s: Math.floor(90 + r() * 150) });
          if (cleared) progress++;
        }
      }
      if (visits === 0 && area && r() < 0.6) ev("signup_completed", { home_area: area, fighter: "odumodu" });
      visits++;
      day += (1 + Math.floor(r() * 6) * (1.2 - loyal)) * 86400_000;
      if (r() > 0.35 + loyal * 0.6) break;
    }
  }
  for (let i = 0; i < rows.length; i += 2000) {
    const chunk = rows.slice(i, i + 2000);
    await sql`insert into analytics_events ${sql(chunk, "at", "anon_id", "user_id", "session_id", "name", "platform", "area", "props")}`;
  }
  console.log(`Seeded ${rows.length} DEMO events for ${N} synthetic players.`);
  await sql.end();
}
main().catch(async (e) => { console.error(e); await sql.end(); process.exit(1); });
