import { z } from "zod";
import { tutorSettingsSchema } from "@/lib/ai/schemas";
import { db, withUser } from "@/lib/db";
import { handler, HttpError, json, parseJson, requireApiUser } from "@/lib/http";

const body = z.object({
  language: z.string().max(12),
  tutorId: z.string().max(40).optional(),
  settings: tutorSettingsSchema.partial().optional(),
  level: z.enum(["beginner", "few_words", "understand_more", "simple_conversations", "fluency"]).optional(),
  makeActive: z.boolean().optional(),
});

/** Updates the learner's plan for a language: tutor choice, tutor settings, level. */
export const PUT = handler(async (req) => {
  const user = await requireApiUser();
  const b = await parseJson(req, body);
  if (b.tutorId) {
    const [t] =
      await db()`select 1 from tutors where id = ${b.tutorId} and language_code = ${b.language} and status = 'active'`;
    if (!t) throw new HttpError(400, "That tutor doesn't teach this language.", "bad_tutor");
  }
  const [course] =
    await db()`select id from courses where language_code = ${b.language} and status = 'published' limit 1`;
  if (!course) throw new HttpError(400, "That language doesn't have a course yet.", "language_unavailable");
  const saved = await withUser(user.id, async (tx) => {
    const [existing] =
      await tx`select tutor_settings from learning_plans where user_id = ${user.id} and language_code = ${b.language}`;
    const settings = tutorSettingsSchema.parse({
      ...(existing?.tutor_settings ?? {}),
      ...(b.settings ?? {}),
    });
    if (b.makeActive) await tx`update learning_plans set is_active = false where user_id = ${user.id}`;
    const [row] = await tx`
      insert into learning_plans (user_id, language_code, course_id, tutor_id, tutor_settings, level, is_active)
      values (${user.id}, ${b.language}, ${course.id}, ${b.tutorId ?? null}, ${tx.json(settings)}, ${b.level ?? "beginner"}, ${b.makeActive ?? false})
      on conflict (user_id, language_code) do update set
        tutor_id = coalesce(${b.tutorId ?? null}, learning_plans.tutor_id),
        tutor_settings = ${tx.json(settings)},
        level = coalesce(${b.level ?? null}, learning_plans.level),
        is_active = learning_plans.is_active or ${b.makeActive ?? false},
        updated_at = now()
      returning tutor_id, tutor_settings, level`;
    return row;
  });
  return json({ ok: true, plan: saved });
});
