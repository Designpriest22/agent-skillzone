import { z } from "zod";
import { track } from "@/lib/analytics";
import { db, withUser } from "@/lib/db";
import { assertSameOrigin, handler, HttpError, json, parseJson, requireApiUser } from "@/lib/http";

/** Save a curated vocabulary item to the notebook. */
export const POST = handler(async (req) => {
  const user = await requireApiUser();
  const { vocabId } = await parseJson(req, z.object({ vocabId: z.string().uuid() }));
  const [v] =
    await db()`select id, language_code from vocabulary where id = ${vocabId} and review_status <> 'rejected'`;
  if (!v) throw new HttpError(404, "Word not found.", "not_found");
  await withUser(
    user.id,
    (tx) => tx`
    insert into user_vocabulary (user_id, vocab_id, language_code, source, saved)
    values (${user.id}, ${vocabId}, ${v.language_code}, 'manual', true)
    on conflict (user_id, vocab_id) where vocab_id is not null do update set saved = true`,
  );
  await track("vocab_saved", { userId: user.id, language: v.language_code });
  return json({ ok: true });
});

/** Remove an item from the notebook (also removes it from revision). */
export const DELETE = handler(async (req) => {
  assertSameOrigin(req);
  const user = await requireApiUser();
  const id = z.string().uuid().parse(new URL(req.url).searchParams.get("id"));
  const r = await withUser(
    user.id,
    (tx) => tx`delete from user_vocabulary where id = ${id} and user_id = ${user.id}`,
  );
  if (!r.count) throw new HttpError(404, "Not in your notebook.", "not_found");
  return json({ ok: true });
});
