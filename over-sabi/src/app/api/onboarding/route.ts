import { z } from "zod";
import { track } from "@/lib/analytics";
import { tutorSettingsSchema } from "@/lib/ai/schemas";
import { db, withUser } from "@/lib/db";
import { handler, HttpError, json, parseJson, requireApiUser } from "@/lib/http";

const body = z.object({
  language: z.string().max(12),
  goals: z.array(z.string().max(40)).max(8).default([]),
  level: z
    .enum(["beginner", "few_words", "understand_more", "simple_conversations", "fluency"])
    .default("beginner"),
  explanationLanguage: z.enum(["en", "pcm", "fr"]).default("en"),
  tutorId: z.string().max(40).nullable().default(null),
  dailyGoalMinutes: z
    .union([z.literal(5), z.literal(10), z.literal(15), z.literal(20), z.literal(30)])
    .default(10),
  ageBand: z.enum(["teen", "adult"]).optional(),
  timezone: z.string().max(60).optional(),
});

/** Saves onboarding answers and creates the learner's first learning plan. */
export const POST = handler(async (req) => {
  const user = await requireApiUser();
  const input = await parseJson(req, body);
  const [course] = await db()`
    select c.id from courses c join languages l on l.code = c.language_code
    where c.language_code = ${input.language} and c.status = 'published' and l.catalogue_status in ('beta','available') limit 1`;
  if (!course) throw new HttpError(400, "That language doesn't have a course yet.", "language_unavailable");
  let tutorId = input.tutorId;
  if (tutorId) {
    const [t] =
      await db()`select id from tutors where id = ${tutorId} and language_code = ${input.language} and status = 'active'`;
    if (!t) tutorId = null;
  }
  let tz = "Africa/Lagos";
  try {
    if (input.timezone) {
      new Intl.DateTimeFormat("en", { timeZone: input.timezone });
      tz = input.timezone;
    }
  } catch {
    /* keep default */
  }
  const settings = tutorSettingsSchema.parse({
    mode:
      input.level === "beginner" || input.level === "few_words"
        ? "beginner"
        : input.level === "fluency"
          ? "immersion"
          : "balanced",
    targetPercent: input.level === "beginner" ? 30 : input.level === "fluency" ? 90 : 60,
    sessionMinutes: input.dailyGoalMinutes,
  });
  await withUser(user.id, async (tx) => {
    await tx`update learning_plans set is_active = false where user_id = ${user.id}`;
    await tx`
      insert into learning_plans (user_id, language_code, course_id, level, goals, daily_goal_minutes, tutor_id, tutor_settings, is_active)
      values (${user.id}, ${input.language}, ${course.id}, ${input.level}, ${input.goals}, ${input.dailyGoalMinutes}, ${tutorId}, ${tx.json(settings)}, true)
      on conflict (user_id, language_code) do update set level = excluded.level, goals = excluded.goals,
        daily_goal_minutes = excluded.daily_goal_minutes, tutor_id = coalesce(excluded.tutor_id, learning_plans.tutor_id),
        is_active = true, updated_at = now()`;
    await tx`
      update profiles set explanation_language = ${input.explanationLanguage}, daily_goal_minutes = ${input.dailyGoalMinutes},
        learning_reasons = ${input.goals}, timezone = ${tz}, onboarding_completed_at = coalesce(onboarding_completed_at, now()),
        updated_at = now()
      where user_id = ${user.id}`;
  });
  if (input.ageBand) await db()`update profiles set age_band = ${input.ageBand} where user_id = ${user.id}`;
  await track("onboarding_completed", {
    userId: user.id,
    language: input.language,
    props: { level: input.level },
  });
  const [first] = await db()`
    select l.id from lessons l join chapters ch on ch.id = l.chapter_id
    where ch.course_id = ${course.id} and l.status = 'published' and ch.status = 'published'
      and not exists (select 1 from lesson_progress lp where lp.lesson_id = l.id and lp.user_id = ${user.id} and lp.status = 'completed')
    order by ch.sort_order, l.sort_order limit 1`;
  return json({ ok: true, firstLessonId: first?.id ?? null });
});
