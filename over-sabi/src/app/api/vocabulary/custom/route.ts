import { z } from "zod";
import { db, withUser } from "@/lib/db";
import { handler, HttpError, json, parseJson, requireApiUser } from "@/lib/http";

/** Save a phrase from a tutor conversation. Always stored as unverified. */
export const POST = handler(async (req) => {
  const user = await requireApiUser();
  const b = await parseJson(
    req,
    z.object({
      language: z.string().max(12),
      term: z.string().trim().min(1).max(200),
      meaning: z.string().trim().min(1).max(300),
      note: z.string().max(500).default(""),
    }),
  );
  const [lang] = await db()`select 1 from languages where code = ${b.language}`;
  if (!lang) throw new HttpError(400, "Unknown language.", "bad_language");
  await withUser(user.id, async (tx) => {
    const [dupe] =
      await tx`select 1 from user_vocabulary where user_id = ${user.id} and custom_term = ${b.term} and language_code = ${b.language}`;
    if (!dupe) {
      await tx`
        insert into user_vocabulary (user_id, language_code, custom_term, custom_meaning, custom_note, source, saved)
        values (${user.id}, ${b.language}, ${b.term}, ${b.meaning}, ${b.note}, 'conversation', true)`;
    }
  });
  return json({ ok: true });
});
