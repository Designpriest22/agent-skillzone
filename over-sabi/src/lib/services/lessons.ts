import "server-only";
import { db, withUser } from "../db";
import { HttpError } from "../http";
import type { ActivityResponse, ActivityResult, ActivityType } from "../content/activity-types";
import { gradeActivity } from "../content/validate";
import { awardXp, gradeFromResult, recordVocabResult } from "../progress";
import { schedule, NEW_CARD } from "../srs";
import { track } from "../analytics";

interface StoredActivity {
  id: string;
  lesson_id: string;
  type: ActivityType;
  payload: { vocabIds?: string[] };
  answer: unknown;
}

async function loadActivity(lessonId: string, activityId: string): Promise<StoredActivity> {
  const [row] = await db()`
    select a.id, a.lesson_id, a.type, a.payload, a.answer
    from lesson_activities a join lessons l on l.id = a.lesson_id
    where a.id = ${activityId} and a.lesson_id = ${lessonId} and l.status = 'published'`;
  if (!row) throw new HttpError(404, "That activity doesn't exist.", "not_found");
  return row as unknown as StoredActivity;
}

async function reviewKeyFor(response: ActivityResponse): Promise<Map<string, string>> {
  if (response.type !== "review" || !response.answers.length) return new Map();
  const ids = response.answers.map((a) => a.vocabId);
  const rows = await db()`select id, translation from vocabulary where id = any(${ids}::uuid[])`;
  return new Map(rows.map((r) => [r.id as string, r.translation as string]));
}

/** Grades one activity. Signed-in learners get the attempt and SRS state recorded. */
export async function submitAttempt(
  userId: string | null,
  lessonId: string,
  activityId: string,
  response: ActivityResponse,
): Promise<ActivityResult> {
  const activity = await loadActivity(lessonId, activityId);
  const result = gradeActivity(activity.type, activity.answer, response, await reviewKeyFor(response));
  if (!userId) return result;

  await withUser(userId, async (tx) => {
    await tx`
      insert into activity_attempts (user_id, lesson_id, activity_id, correct, near_miss, score, response)
      values (${userId}, ${lessonId}, ${activityId}, ${result.correct}, ${result.nearMiss}, ${result.score}, ${tx.json(response as never)})`;
    await tx`
      insert into lesson_progress (user_id, lesson_id, status) values (${userId}, ${lessonId}, 'started')
      on conflict (user_id, lesson_id) do update set updated_at = now()`;
    if (result.items) {
      for (const item of result.items)
        await recordVocabResult(tx, userId, item.vocabId, item.correct ? 4 : 0);
    } else if (activity.type !== "recap" && activity.type !== "matching") {
      // Matching is graded as a set; individual words are scheduled at lesson completion.
      for (const vocabId of activity.payload.vocabIds ?? []) {
        await recordVocabResult(tx, userId, vocabId, gradeFromResult(result.correct, result.nearMiss));
      }
    }
  });
  return result;
}

export interface CompletionResult {
  score: number;
  xpEarned: number;
  newAchievements: string[];
  streakDays: number;
  firstCompletion: boolean;
}

/**
 * Completes a lesson: computes the score from the learner's latest attempt at each
 * graded activity (server-side — the client cannot claim a score), records progress,
 * queues the lesson's vocabulary for revision and awards XP once per lesson.
 */
export async function completeLesson(userId: string, lessonId: string): Promise<CompletionResult> {
  const [lesson] = await db()`
    select l.id, l.xp_reward, c.language_code
    from lessons l join chapters ch on ch.id = l.chapter_id join courses c on c.id = ch.course_id
    where l.id = ${lessonId} and l.status = 'published'`;
  if (!lesson) throw new HttpError(404, "Lesson not found.", "not_found");

  const result = await withUser(userId, async (tx) => {
    const graded = await tx`
      select a.id,
        (select at.score from activity_attempts at
          where at.activity_id = a.id and at.user_id = ${userId} and at.created_at > now() - interval '6 hours'
          order by at.created_at desc limit 1) as score
      from lesson_activities a
      where a.lesson_id = ${lessonId} and a.type <> 'recap'`;
    const attempted = graded.filter((g) => g.score !== null);
    if (graded.length && attempted.length < graded.length) {
      throw new HttpError(409, "Finish every activity in the lesson first.", "incomplete");
    }
    const score = graded.length
      ? Math.round((attempted.reduce((s, g) => s + Number(g.score), 0) / graded.length) * 100)
      : 100;

    const [prev] =
      await tx`select status from lesson_progress where user_id = ${userId} and lesson_id = ${lessonId}`;
    const firstCompletion = prev?.status !== "completed";
    await tx`
      insert into lesson_progress (user_id, lesson_id, status, best_score, attempts, completed_at)
      values (${userId}, ${lessonId}, 'completed', ${score}, 1, now())
      on conflict (user_id, lesson_id) do update set status = 'completed',
        best_score = greatest(lesson_progress.best_score, excluded.best_score),
        attempts = lesson_progress.attempts + 1,
        completed_at = coalesce(lesson_progress.completed_at, now()), updated_at = now()`;

    // Queue every lesson word not yet in the learner's revision queue.
    const first = schedule(NEW_CARD, 4);
    await tx`
      insert into user_vocabulary (user_id, vocab_id, language_code, source, ease, interval_days, repetitions, due_at)
      select ${userId}, lv.vocab_id, v.language_code, 'lesson', ${first.ease}, ${first.intervalDays}, ${first.repetitions}, ${first.dueAt}
      from lesson_vocabulary lv join vocabulary v on v.id = lv.vocab_id
      where lv.lesson_id = ${lessonId} and v.review_status <> 'rejected'
      on conflict (user_id, vocab_id) where vocab_id is not null do nothing`;

    const xp = firstCompletion ? (score >= 60 ? lesson.xp_reward : Math.round(lesson.xp_reward / 2)) : 5;
    const newAchievements = await awardXp(tx, userId, xp, "lesson_completed", lessonId);
    const [streak] = await tx`select current_days from streaks where user_id = ${userId}`;
    const [{ total }] =
      (await tx`select count(*)::int as total from lesson_progress where user_id = ${userId} and status = 'completed'`) as unknown as [
        { total: number },
      ];
    return {
      score,
      xpEarned: xp,
      newAchievements,
      streakDays: streak?.current_days ?? 1,
      firstCompletion,
      totalCompleted: total,
    };
  });

  await track("lesson_completed", { userId, language: lesson.language_code, props: { score: result.score } });
  if (result.totalCompleted === 1 && result.firstCompletion)
    await track("first_lesson_completed", { userId, language: lesson.language_code });
  const { totalCompleted: _ignored, ...rest } = result;
  void _ignored;
  return rest;
}

/** Imports progress a learner made as a guest before creating an account. */
export async function mergeGuestProgress(
  userId: string,
  input: { completedLessons: { lessonId: string; score: number }[]; savedVocabIds: string[] },
): Promise<{ lessons: number; words: number }> {
  const lessonIds = input.completedLessons.map((l) => l.lessonId);
  const valid = lessonIds.length
    ? new Set(
        (
          await db()`select id from lessons where id = any(${lessonIds}::uuid[]) and status = 'published'`
        ).map((r) => r.id as string),
      )
    : new Set<string>();
  const vocabValid = input.savedVocabIds.length
    ? (await db()`select id from vocabulary where id = any(${input.savedVocabIds}::uuid[])`).map(
        (r) => r.id as string,
      )
    : [];
  let lessons = 0;
  await withUser(userId, async (tx) => {
    for (const l of input.completedLessons) {
      if (!valid.has(l.lessonId)) continue;
      const score = Math.max(0, Math.min(100, Math.round(l.score)));
      const inserted = await tx`
        insert into lesson_progress (user_id, lesson_id, status, best_score, attempts, completed_at)
        values (${userId}, ${l.lessonId}, 'completed', ${score}, 1, now())
        on conflict (user_id, lesson_id) do nothing returning lesson_id`;
      if (inserted.length) {
        lessons++;
        const first = schedule(NEW_CARD, 4);
        await tx`
          insert into user_vocabulary (user_id, vocab_id, language_code, source, ease, interval_days, repetitions, due_at)
          select ${userId}, lv.vocab_id, v.language_code, 'lesson', ${first.ease}, ${first.intervalDays}, ${first.repetitions}, ${first.dueAt}
          from lesson_vocabulary lv join vocabulary v on v.id = lv.vocab_id where lv.lesson_id = ${l.lessonId}
          on conflict (user_id, vocab_id) where vocab_id is not null do nothing`;
      }
    }
    for (const id of vocabValid) {
      await tx`
        insert into user_vocabulary (user_id, vocab_id, language_code, source, saved)
        select ${userId}, id, language_code, 'manual', true from vocabulary where id = ${id}
        on conflict (user_id, vocab_id) where vocab_id is not null do update set saved = true`;
    }
    if (lessons) await awardXp(tx, userId, Math.min(lessons * 20, 200), "guest_progress_imported", null);
  });
  return { lessons, words: vocabValid.length };
}
