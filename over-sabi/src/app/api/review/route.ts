import { z } from "zod";
import { track } from "@/lib/analytics";
import { withUser } from "@/lib/db";
import { handler, HttpError, json, parseJson, requireApiUser } from "@/lib/http";
import { awardXp } from "@/lib/progress";
import { schedule, type Grade } from "@/lib/srs";

/** Due revision cards. */
export const GET = handler(async () => {
  const user = await requireApiUser();
  const cards = await withUser(
    user.id,
    (tx) => tx`
    select uv.id, uv.language_code, uv.source, uv.repetitions, uv.due_at,
      coalesce(v.text, uv.custom_term) as term, coalesce(v.translation, uv.custom_meaning) as meaning,
      v.context_note, v.literal_meaning, v.review_status, (uv.vocab_id is null) as unverified
    from user_vocabulary uv left join vocabulary v on v.id = uv.vocab_id
    where uv.user_id = ${user.id} and uv.due_at <= now()
    order by uv.due_at limit 30`,
  );
  return json({ cards });
});

/** Grade a card: 0 forgot, 3 hard, 4 good, 5 easy. */
export const POST = handler(async (req) => {
  const user = await requireApiUser();
  const b = await parseJson(
    req,
    z.object({
      id: z.string().uuid(),
      grade: z.union([z.literal(0), z.literal(3), z.literal(4), z.literal(5)]),
    }),
  );
  const result = await withUser(user.id, async (tx) => {
    const [card] =
      await tx`select id, ease, interval_days, repetitions, lapses, language_code from user_vocabulary where id = ${b.id}`;
    if (!card) throw new HttpError(404, "Card not found.", "not_found");
    const next = schedule(
      {
        ease: card.ease,
        intervalDays: card.interval_days,
        repetitions: card.repetitions,
        lapses: card.lapses,
      },
      b.grade as Grade,
    );
    await tx`
      update user_vocabulary set ease = ${next.ease}, interval_days = ${next.intervalDays}, repetitions = ${next.repetitions},
        lapses = ${next.lapses}, due_at = ${next.dueAt}, last_reviewed_at = now() where id = ${b.id}`;
    const achievements = await awardXp(tx, user.id, 2, "review", b.id);
    return {
      dueAt: next.dueAt.toISOString(),
      intervalDays: next.intervalDays,
      achievements,
      language: card.language_code as string,
    };
  });
  await track("review_completed", { userId: user.id, language: result.language, props: { grade: b.grade } });
  return json(result);
});
