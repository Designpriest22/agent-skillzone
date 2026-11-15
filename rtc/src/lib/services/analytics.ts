import "server-only";
import { z } from "zod";
import { db } from "@/lib/db";
import { EVENT_SCHEMAS, EVENT_NAMES, type EventName } from "@/game/client/events";
import { AREAS, SUBSTAGE_ORDER } from "@/game/data/world";

const token = z.string().regex(/^[A-Za-z0-9-]{8,64}$/);
export const ingestSchema = z.object({
  anonId: token,
  sessionId: token,
  platform: z.enum(["desktop", "mobile", "tablet"]),
  events: z.array(z.object({ name: z.enum(EVENT_NAMES as [EventName, ...EventName[]]), at: z.number().int(), props: z.record(z.string(), z.unknown()) })).min(1).max(50),
});

/** Validates every event against the tracking plan; invalid events are dropped, not stored. */
export async function ingest(input: z.infer<typeof ingestSchema>, userId: string | null) {
  const now = Date.now();
  let area: string | null = null;
  if (userId) {
    const [p] = await db()`select home_area from profiles where user_id = ${userId}`;
    area = (p?.home_area as string) ?? null;
  }
  const rows = [];
  for (const e of input.events) {
    const parsed = EVENT_SCHEMAS[e.name].safeParse(e.props);
    if (!parsed.success) continue;
    // Client clocks drift: accept up to 24h old / 5 min ahead, otherwise use server time.
    const at = e.at > now - 86_400_000 && e.at < now + 300_000 ? new Date(e.at) : new Date(now);
    rows.push({ at, anon_id: input.anonId, user_id: userId, session_id: input.sessionId, name: e.name, platform: input.platform, area, props: parsed.data });
  }
  if (rows.length) await db()`insert into analytics_events ${db()(rows, "at", "anon_id", "user_id", "session_id", "name", "platform", "area", "props")}`;
  return { accepted: rows.length, dropped: input.events.length - rows.length };
}

const num = (v: unknown) => Number(v ?? 0);

/** Every metric the live dashboard shows, computed from stored events only. Definitions live beside each query. */
export async function dashboard(days = 30) {
  const sql = db();
  const span = Math.min(90, Math.max(7, days));
  const [live] = await sql`select count(distinct anon_id)::int as players, count(distinct session_id)::int as sessions
    from analytics_events where at > now() - interval '5 minutes'`;
  // Active player = any event that day, de-duplicated by anonymous id (signed-in and guest alike).
  const [kpi] = await sql`select
      count(distinct anon_id) filter (where at > now() - interval '1 day')::int as dau,
      count(distinct anon_id) filter (where at > now() - interval '7 days')::int as wau,
      count(distinct anon_id) filter (where at > now() - interval '30 days')::int as mau,
      count(*) filter (where name = 'run_started' and at > now() - interval '1 day')::int as runs_today,
      count(*) filter (where name = 'signup_completed' and at > now() - interval '1 day')::int as signups_today
    from analytics_events where at > now() - interval '30 days'`;
  const [sess] = await sql`select coalesce(avg(len), 0)::float as avg_s, coalesce(percentile_cont(0.5) within group (order by len), 0)::float as median_s from (
      select extract(epoch from max(at) - min(at)) as len from analytics_events where at > now() - interval '7 days' group by session_id having count(*) > 1) s`;
  const daily = await sql`select to_char(date_trunc('day', at), 'YYYY-MM-DD') as day, count(distinct anon_id)::int as players,
      count(*) filter (where name = 'run_started')::int as runs
    from analytics_events where at > now() - make_interval(days => ${span}) group by 1 order by 1`;
  const hourly = await sql`select extract(isodow from at at time zone 'Africa/Lagos')::int as dow, extract(hour from at at time zone 'Africa/Lagos')::int as hour,
      count(distinct anon_id)::int as players from analytics_events where at > now() - interval '28 days' group by 1, 2`;
  // Funnel (7-day window, per anonymous player): visited → started a run → finished a run → cleared → created a profile.
  const [funnel] = await sql`select
      count(*) filter (where s)::int as visited, count(*) filter (where r)::int as started, count(*) filter (where f)::int as finished,
      count(*) filter (where c)::int as cleared, count(*) filter (where u)::int as signed_up from (
      select anon_id, bool_or(name = 'session_started') s, bool_or(name = 'run_started') r, bool_or(name = 'run_finished') f,
        bool_or(name = 'run_finished' and (props->>'cleared')::boolean) c, bool_or(name = 'signup_completed') u
      from analytics_events where at > now() - interval '7 days' group by anon_id) p`;
  const stages = await sql`select props->>'substage' as substage,
      count(*) filter (where name = 'run_started')::int as starts,
      count(*) filter (where name = 'run_finished' and (props->>'cleared')::boolean)::int as clears,
      count(*) filter (where name = 'run_finished' and not (props->>'cleared')::boolean)::int as fails,
      count(*) filter (where name = 'run_quit')::int as quits
    from analytics_events where name in ('run_started', 'run_finished', 'run_quit') and at > now() - make_interval(days => ${span}) group by 1`;
  const fighters = await sql`select props->>'fighter' as fighter, count(*)::int as runs from analytics_events
    where name = 'run_started' and at > now() - make_interval(days => ${span}) group by 1 order by 2 desc`;
  const areas = await sql`select area, count(distinct anon_id)::int as players from analytics_events
    where area is not null and at > now() - make_interval(days => ${span}) group by 1 order by 2 desc`;
  const platforms = await sql`select platform, count(distinct anon_id)::int as players from analytics_events
    where at > now() - make_interval(days => ${span}) group by 1`;
  const sources = await sql`select coalesce(nullif(props->>'source', ''), 'direct') as source, count(*)::int as sessions from analytics_events
    where name = 'session_started' and at > now() - make_interval(days => ${span}) group by 1 order by 2 desc limit 8`;
  // Retention: cohort = first day an anonymous id was seen; Dn = active on exactly day n after.
  const retention = await sql`with first as (select anon_id, min(at)::date as d0 from analytics_events group by anon_id),
      act as (select distinct anon_id, at::date as d from analytics_events)
    select to_char(f.d0, 'YYYY-MM-DD') as cohort, count(distinct f.anon_id)::int as size,
      case when f.d0 + 1 > current_date then null else count(distinct a.anon_id) filter (where a.d = f.d0 + 1) end::int as d1,
      case when f.d0 + 7 > current_date then null else count(distinct a.anon_id) filter (where a.d = f.d0 + 7) end::int as d7,
      case when f.d0 + 30 > current_date then null else count(distinct a.anon_id) filter (where a.d = f.d0 + 30) end::int as d30
    from first f left join act a on a.anon_id = f.anon_id
    where f.d0 > now() - interval '45 days' group by f.d0 order by f.d0 desc limit 21`;
  const bySub = Object.fromEntries(stages.map((s) => [s.substage as string, s]));
  return {
    at: new Date().toISOString(), days: span,
    live: { players: num(live?.players), sessions: num(live?.sessions) },
    kpi: { dau: num(kpi?.dau), wau: num(kpi?.wau), mau: num(kpi?.mau), runsToday: num(kpi?.runs_today), signupsToday: num(kpi?.signups_today),
      avgSessionS: Math.round(num(sess?.avg_s)), medianSessionS: Math.round(num(sess?.median_s)) },
    daily: daily.map((d) => ({ day: d.day as string, players: num(d.players), runs: num(d.runs) })),
    hourly: hourly.map((h) => ({ dow: num(h.dow), hour: num(h.hour), players: num(h.players) })),
    funnel: [
      { step: "Visited", n: num(funnel?.visited) }, { step: "Started a run", n: num(funnel?.started) }, { step: "Finished a run", n: num(funnel?.finished) },
      { step: "Cleared a stage", n: num(funnel?.cleared) }, { step: "Created a profile", n: num(funnel?.signed_up) },
    ],
    stages: SUBSTAGE_ORDER.map((id) => ({ substage: id, starts: num(bySub[id]?.starts), clears: num(bySub[id]?.clears), fails: num(bySub[id]?.fails), quits: num(bySub[id]?.quits) })),
    fighters: fighters.map((f) => ({ fighter: f.fighter as string, runs: num(f.runs) })),
    areas: AREAS.map((a) => ({ area: a.id, name: a.name, players: num(areas.find((r) => r.area === a.id)?.players) })),
    platforms: platforms.map((p) => ({ platform: p.platform as string, players: num(p.players) })),
    sources: sources.map((s) => ({ source: s.source as string, sessions: num(s.sessions) })),
    retention: retention.map((r) => ({ cohort: r.cohort as string, size: num(r.size), d1: r.d1 === null ? null : num(r.d1), d7: r.d7 === null ? null : num(r.d7), d30: r.d30 === null ? null : num(r.d30) })),
  };
}
export type Dashboard = Awaited<ReturnType<typeof dashboard>>;

/** 13-month retention for raw events. Call from a scheduled job. */
export async function pruneEvents() {
  return (await db()`delete from analytics_events where at < now() - interval '13 months'`).count;
}
