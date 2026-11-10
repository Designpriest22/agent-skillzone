import { describe, expect, it } from "vitest";
import { getLessonForPlayer } from "@/lib/content/repo";
import { completeLesson, mergeGuestProgress, submitAttempt } from "@/lib/services/lessons";
import { correctResponses, firstLesson, makeUser, sql } from "./helpers";

describe("guided lessons", () => {
  it("serves a lesson to the player without answers", async () => {
    const lesson = await getLessonForPlayer(await firstLesson("yo"), { kind: "guest" });
    expect(lesson).not.toBeNull();
    expect(lesson!.activities.length).toBeGreaterThan(3);
    expect(JSON.stringify(lesson)).not.toContain('"answer"');
    expect(JSON.stringify(lesson)).not.toContain("accepted");
  });

  it("grades a guest attempt without storing anything", async () => {
    const lessonId = await firstLesson("ha");
    const [first] = await correctResponses(lessonId);
    const r = await submitAttempt(null, lessonId, first!.id, first!.response);
    expect(r.correct).toBe(true);
    const [{ n }] =
      (await sql`select count(*)::int as n from activity_attempts where activity_id = ${first!.id}`) as unknown as [
        { n: number },
      ];
    expect(n).toBe(0);
  });

  it("refuses completion until every activity is attempted, then scores server-side", async () => {
    const u = await makeUser();
    const lessonId = await firstLesson("yo");
    const answers = await correctResponses(lessonId);
    await submitAttempt(u.id, lessonId, answers[0]!.id, answers[0]!.response);
    await expect(completeLesson(u.id, lessonId)).rejects.toMatchObject({ status: 409 });

    for (const a of answers) await submitAttempt(u.id, lessonId, a.id, a.response);
    const done = await completeLesson(u.id, lessonId);
    expect(done.score).toBe(100);
    expect(done.xpEarned).toBe(20);
    expect(done.newAchievements).toContain("first_lesson");
    expect(done.streakDays).toBe(1);

    const [p] =
      await sql`select status, best_score from lesson_progress where user_id = ${u.id} and lesson_id = ${lessonId}`;
    expect(p).toMatchObject({ status: "completed", best_score: 100 });
    const vocab = await sql`select * from user_vocabulary where user_id = ${u.id}`;
    const [{ n }] =
      (await sql`select count(*)::int as n from lesson_vocabulary where lesson_id = ${lessonId}`) as unknown as [
        { n: number },
      ];
    expect(vocab.length).toBe(n);

    // Repeating a lesson doesn't farm XP.
    const again = await completeLesson(u.id, lessonId);
    expect(again.xpEarned).toBe(5);
  });

  it("scores wrong answers lower and schedules missed words for immediate revision", async () => {
    const u = await makeUser();
    const lessonId = await firstLesson("ig");
    const answers = await correctResponses(lessonId);
    for (const a of answers) {
      const r = a.response as { type: string };
      const wrong = r.type === "translation" ? { type: "translation", text: "wrong" } : a.response;
      await submitAttempt(u.id, lessonId, a.id, wrong as never);
    }
    const done = await completeLesson(u.id, lessonId);
    expect(done.score).toBeLessThan(100);
    const due =
      await sql`select * from user_vocabulary where user_id = ${u.id} and due_at <= now() + interval '15 minutes'`;
    expect(due.length).toBeGreaterThan(0);
  });

  it("imports guest progress once, validating lesson ids", async () => {
    const u = await makeUser();
    const lessonId = await firstLesson("ha");
    const [v] = await sql`select id from vocabulary where language_code = 'ha' limit 1`;
    const r = await mergeGuestProgress(u.id, {
      completedLessons: [
        { lessonId, score: 140 },
        { lessonId: "00000000-0000-4000-8000-000000000000", score: 50 },
      ],
      savedVocabIds: [v!.id],
    });
    expect(r).toEqual({ lessons: 1, words: 1 });
    const [p] = await sql`select best_score from lesson_progress where user_id = ${u.id}`;
    expect(p!.best_score).toBe(100);
    expect(
      (await mergeGuestProgress(u.id, { completedLessons: [{ lessonId, score: 90 }], savedVocabIds: [] }))
        .lessons,
    ).toBe(0);
  });

  it("brings review items back on schedule and builds review questions from them", async () => {
    const u = await makeUser();
    const l1 = await firstLesson("yo");
    for (const a of await correctResponses(l1)) await submitAttempt(u.id, l1, a.id, a.response);
    await completeLesson(u.id, l1);
    const notDue = await sql`select * from user_vocabulary where user_id = ${u.id} and due_at <= now()`;
    expect(notDue).toHaveLength(0);
    await sql`update user_vocabulary set due_at = now() - interval '1 minute' where user_id = ${u.id}`;
    const due = await sql`select * from user_vocabulary where user_id = ${u.id} and due_at <= now()`;
    expect(due.length).toBeGreaterThan(0);

    const [l2] =
      await sql`select l.id from lessons l join chapters ch on ch.id = l.chapter_id join courses c on c.id = ch.course_id
      where c.language_code = 'yo' order by ch.sort_order, l.sort_order offset 1 limit 1`;
    const lesson = await getLessonForPlayer(l2!.id, { kind: "user", userId: u.id });
    const review = lesson!.activities.find((a) => a.type === "review");
    expect(review && review.type === "review" && review.questions.length).toBeGreaterThan(0);
  });
});
