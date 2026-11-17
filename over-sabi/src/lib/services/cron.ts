import "server-only";
import { db } from "../db";
import { pruneRateLimits } from "../rate-limit";

/**
 * Daily maintenance, idempotent (notifications use dedupe keys):
 * - Enforce transcript retention: delete turns and corrections past their expiry (the
 *   session summary is kept so learning history survives).
 * - Revision reminders and weekly summaries, honouring notification preferences.
 * - Prune rate-limit windows and analytics older than 13 months.
 */
export async function runDailyJobs() {
  const sql = db();
  const expired = await sql`
    with s as (select id from learning_sessions where transcript_expires_at < now())
    delete from conversation_turns where session_id in (select id from s)`;
  await sql`
    delete from feedback_items where session_id in (select id from learning_sessions where transcript_expires_at < now())`;

  const today = new Date().toISOString().slice(0, 10);
  const reviews = await sql`
    insert into notifications (user_id, kind, title, body, link, dedupe_key)
    select uv.user_id, 'review_due', 'Words are ready for revision',
      count(*) || ' words and phrases are due. A two-minute review keeps them fresh.', '/review', 'review:' || ${today}
    from user_vocabulary uv join profiles p on p.user_id = uv.user_id
    where uv.due_at <= now() and coalesce((p.notification_prefs->>'review_reminders')::boolean, true)
    group by uv.user_id
    on conflict (user_id, dedupe_key) do nothing`;

  const streaks = await sql`
    insert into notifications (user_id, kind, title, body, link, dedupe_key)
    select s.user_id, 'streak', 'Keep your streak going',
      'You''ve practised ' || s.current_days || ' days in a row. Five minutes today keeps it alive.', '/learn', 'streak:' || ${today}
    from streaks s join profiles p on p.user_id = s.user_id
    where s.current_days >= 2 and s.last_active_date = current_date - 1
      and coalesce((p.notification_prefs->>'streak_reminders')::boolean, true)
    on conflict (user_id, dedupe_key) do nothing`;

  let weekly = 0;
  if (new Date().getUTCDay() === 1) {
    const r = await sql`
      insert into notifications (user_id, kind, title, body, link, dedupe_key)
      select x.user_id, 'weekly_summary', 'Your week in Over Sabi',
        x.xp || ' XP, ' || x.lessons || ' lessons and ' || x.sessions || ' conversations last week.', '/progress', 'weekly:' || ${today}
      from (
        select p.user_id,
          (select coalesce(sum(amount), 0) from xp_events e where e.user_id = p.user_id and e.created_at > now() - interval '7 days') as xp,
          (select count(*) from lesson_progress lp where lp.user_id = p.user_id and lp.completed_at > now() - interval '7 days') as lessons,
          (select count(*) from learning_sessions ls where ls.user_id = p.user_id and ls.started_at > now() - interval '7 days') as sessions
        from profiles p where coalesce((p.notification_prefs->>'weekly_summary')::boolean, true)
      ) x where x.xp > 0
      on conflict (user_id, dedupe_key) do nothing`;
    weekly = r.count;
  }
  const rate = await pruneRateLimits();
  const analytics = await sql`delete from analytics_events where created_at < now() - interval '13 months'`;
  const notif =
    await sql`delete from notifications where read_at is not null and created_at < now() - interval '90 days'`;
  return {
    transcriptTurnsDeleted: expired.count,
    reviewReminders: reviews.count,
    streakReminders: streaks.count,
    weeklySummaries: weekly,
    rateLimitRowsPruned: rate,
    analyticsPruned: analytics.count,
    notificationsPruned: notif.count,
  };
}
