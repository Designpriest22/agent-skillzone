import "server-only";
import { withUser } from "../db";
import { localDate } from "../dates";

/** The learner's active plan (language, course, tutor, settings). */
export async function getActivePlan(userId: string) {
  return withUser(userId, async (tx) => {
    const [plan] = await tx`
      select lp.*, l.name as language_name, l.native_name, l.tutor_status, l.stt_status, l.tts_status
      from learning_plans lp join languages l on l.code = lp.language_code
      where lp.user_id = ${userId}
      order by lp.is_active desc, lp.updated_at desc limit 1`;
    return plan ?? null;
  });
}

export async function getDashboard(userId: string) {
  return withUser(userId, async (tx) => {
    const [p] = await tx`select timezone, daily_goal_minutes from profiles where user_id = ${userId}`;
    const today = localDate(p?.timezone ?? "Africa/Lagos");
    const [stats] = await tx`
      select
        coalesce((select current_days from streaks where user_id = ${userId}), 0)::int as streak,
        coalesce((select longest_days from streaks where user_id = ${userId}), 0)::int as longest,
        coalesce((select last_active_date from streaks where user_id = ${userId})::text, '') as last_active,
        coalesce((select sum(amount) from xp_events where user_id = ${userId}), 0)::int as xp,
        coalesce((select sum(amount) from xp_events where user_id = ${userId} and local_date = ${today}), 0)::int as xp_today,
        (select count(*) from lesson_progress where user_id = ${userId} and status = 'completed')::int as lessons,
        (select count(*) from user_vocabulary where user_id = ${userId})::int as words,
        (select count(*) from user_vocabulary where user_id = ${userId} and due_at <= now())::int as due,
        (select count(*) from learning_sessions where user_id = ${userId} and status = 'ended' and turn_count > 1)::int as conversations`;
    const st = stats as unknown as {
      streak: number;
      longest: number;
      last_active: string;
      xp: number;
      xp_today: number;
      lessons: number;
      words: number;
      due: number;
      conversations: number;
    };
    return { ...st, today, dailyGoal: (p?.daily_goal_minutes as number | undefined) ?? 10 };
  });
}

/** Next unfinished lesson in the course for a language. */
export async function nextLesson(userId: string, courseId: string) {
  return withUser(userId, async (tx) => {
    const [l] = await tx`
      select l.id, l.title, l.summary, l.estimated_minutes, ch.title as chapter_title
      from lessons l join chapters ch on ch.id = l.chapter_id
      where ch.course_id = ${courseId} and l.status = 'published' and ch.status = 'published'
        and not exists (select 1 from lesson_progress lp where lp.lesson_id = l.id and lp.user_id = ${userId} and lp.status = 'completed')
      order by ch.sort_order, l.sort_order limit 1`;
    return l ?? null;
  });
}
