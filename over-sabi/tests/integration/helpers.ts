import postgres from "postgres";
import { randomUUID } from "node:crypto";

export const sql = postgres(process.env.DATABASE_URL!, { max: 2, onnotice: () => {} });

/** Creates a verified, onboarded learner directly in the database. */
export async function makeUser(opts: { role?: string; language?: string } = {}) {
  const email = `t-${randomUUID()}@example.test`;
  const [u] =
    await sql`insert into users (email, display_name, role, email_verified_at) values (${email}, 'Tester', ${opts.role ?? "learner"}, now()) returning id`;
  await sql`insert into profiles (user_id, onboarding_completed_at) values (${u!.id}, now())`;
  const [course] = await sql`select id from courses where language_code = ${opts.language ?? "yo"}`;
  await sql`insert into learning_plans (user_id, language_code, course_id, tutor_id, is_active)
            values (${u!.id}, ${opts.language ?? "yo"}, ${course!.id}, ${opts.language === "ha" ? "hauwa" : opts.language === "ig" ? "chiamaka" : "kemi"}, true)`;
  return { id: u!.id as string, email };
}

export function asSessionUser(u: { id: string; email: string }, role = "learner") {
  return {
    id: u.id,
    email: u.email,
    displayName: "Tester",
    role: role as never,
    emailVerified: true,
    onboarded: true,
  };
}

export async function firstLesson(language = "yo") {
  const [l] = await sql`
    select l.id from lessons l join chapters ch on ch.id = l.chapter_id join courses c on c.id = ch.course_id
    where c.language_code = ${language} order by ch.sort_order, l.sort_order limit 1`;
  return l!.id as string;
}

/** The stored correct response for every activity in a lesson (test-only shortcut). */
export async function correctResponses(lessonId: string) {
  const rows =
    await sql`select id, type, payload, answer from lesson_activities where lesson_id = ${lessonId} order by sort_order`;
  return rows.map((r) => {
    switch (r.type) {
      case "listening":
      case "dialogue":
        return { id: r.id as string, response: { type: r.type, index: r.answer.index } };
      case "translation":
        return { id: r.id as string, response: { type: "translation", text: r.answer.accepted[0] } };
      case "word_order":
        return { id: r.id as string, response: { type: "word_order", order: r.answer.order } };
      case "matching":
        return { id: r.id as string, response: { type: "matching", pairs: r.answer.pairs } };
      case "review":
        return { id: r.id as string, response: { type: "review", answers: [] } };
      default:
        return { id: r.id as string, response: { type: "recap" } };
    }
  }) as { id: string; response: never }[];
}
