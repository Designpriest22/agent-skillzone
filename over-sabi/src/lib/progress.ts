import "server-only";
import type { Tx } from "./db";
import { localDate, nextStreak } from "./dates";
import { gradeFromResult, NEW_CARD, schedule, type Grade } from "./srs";

/** Awards XP, updates the streak and returns newly earned achievement codes. */
export async function awardXp(
  tx: Tx,
  userId: string,
  amount: number,
  reason: string,
  ref: string | null,
): Promise<string[]> {
  const [profile] = await tx`select timezone from profiles where user_id = ${userId}`;
  const today = localDate(profile?.timezone ?? "Africa/Lagos");
  if (amount > 0) {
    await tx`insert into xp_events (user_id, amount, reason, ref, local_date) values (${userId}, ${amount}, ${reason}, ${ref}, ${today})`;
  }
  const [s] =
    await tx`select current_days, longest_days, last_active_date from streaks where user_id = ${userId}`;
  const next = nextStreak(
    {
      currentDays: s?.current_days ?? 0,
      longestDays: s?.longest_days ?? 0,
      lastActiveDate: s?.last_active_date ? toDateString(s.last_active_date) : null,
    },
    today,
  );
  await tx`
    insert into streaks (user_id, current_days, longest_days, last_active_date)
    values (${userId}, ${next.currentDays}, ${next.longestDays}, ${next.lastActiveDate})
    on conflict (user_id) do update set current_days = excluded.current_days,
      longest_days = excluded.longest_days, last_active_date = excluded.last_active_date`;
  return checkAchievements(tx, userId, next.currentDays);
}

export async function checkAchievements(tx: Tx, userId: string, streakDays?: number): Promise<string[]> {
  const [stats] = await tx`
    select
      (select count(*) from lesson_progress where user_id = ${userId} and status = 'completed')::int as lessons,
      (select count(*) from learning_sessions where user_id = ${userId} and status = 'ended' and turn_count > 0)::int as conversations,
      (select count(*) from user_vocabulary where user_id = ${userId})::int as words,
      (select count(*) from user_vocabulary where user_id = ${userId} and last_reviewed_at is not null)::int as reviewed,
      (select coalesce(current_days, 0) from streaks where user_id = ${userId})::int as streak,
      (select count(*) from content_contributions where contributor_id = ${userId} and status = 'accepted')::int as contributions,
      (select count(*) from chapters c
         where c.slug = 'greetings' and c.status = 'published'
           and not exists (select 1 from lessons l where l.chapter_id = c.id and l.status = 'published'
             and not exists (select 1 from lesson_progress lp where lp.lesson_id = l.id and lp.user_id = ${userId} and lp.status = 'completed'))
      )::int as greetings_done`;
  const st = stats!;
  const streak = streakDays ?? st.streak;
  const earned: string[] = [];
  if (st.lessons >= 1) earned.push("first_lesson");
  if (st.conversations >= 1) earned.push("first_conversation");
  if (streak >= 3) earned.push("streak_3");
  if (streak >= 7) earned.push("streak_7");
  if (st.words >= 25) earned.push("words_25");
  if (st.greetings_done >= 1) earned.push("greetings_complete");
  if (st.reviewed >= 10) earned.push("review_10");
  if (st.contributions >= 1) earned.push("contributor");
  if (!earned.length) return [];
  const inserted = await tx`
    insert into user_achievements (user_id, code)
    select ${userId}, unnest(${earned}::text[])
    on conflict do nothing
    returning code`;
  return inserted.map((r) => r.code as string);
}

/** Records a graded encounter with a vocabulary item in the learner's SRS queue. */
export async function recordVocabResult(
  tx: Tx,
  userId: string,
  vocabId: string,
  grade: Grade,
  source: "lesson" | "conversation" | "manual" = "lesson",
) {
  const [row] = await tx`
    select uv.id, uv.ease, uv.interval_days, uv.repetitions, uv.lapses, v.language_code
    from vocabulary v
    left join user_vocabulary uv on uv.vocab_id = v.id and uv.user_id = ${userId}
    where v.id = ${vocabId}`;
  if (!row) return;
  const state = row.id
    ? { ease: row.ease, intervalDays: row.interval_days, repetitions: row.repetitions, lapses: row.lapses }
    : NEW_CARD;
  const next = schedule(state, grade);
  if (row.id) {
    await tx`
      update user_vocabulary set ease = ${next.ease}, interval_days = ${next.intervalDays}, repetitions = ${next.repetitions},
        lapses = ${next.lapses}, due_at = ${next.dueAt}, last_reviewed_at = now()
      where id = ${row.id}`;
  } else {
    await tx`
      insert into user_vocabulary (user_id, vocab_id, language_code, source, ease, interval_days, repetitions, lapses, due_at)
      values (${userId}, ${vocabId}, ${row.language_code}, ${source}, ${next.ease}, ${next.intervalDays}, ${next.repetitions}, ${next.lapses}, ${next.dueAt})`;
  }
}

export { gradeFromResult };

function toDateString(d: Date | string): string {
  return typeof d === "string" ? d.slice(0, 10) : d.toISOString().slice(0, 10);
}
