import { z } from "zod";
import { track } from "@/lib/analytics";
import { getCurrentUser } from "@/lib/auth/session";
import { db, withUser } from "@/lib/db";
import { clientIp, handler, json, parseJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

const body = z.object({
  entityType: z.enum(["vocabulary", "lesson", "activity", "cultural_note", "tutor_reply"]),
  entityId: z.string().uuid().nullable(),
  language: z.string().max(12).nullable(),
  reason: z.enum(["wrong_translation", "wrong_spelling", "tone_marks", "dialect", "offensive", "other"]),
  details: z.string().max(2000).default(""),
});

/** "Report a problem" on any piece of learning content or a tutor reply. */
export const POST = handler(async (req) => {
  const b = await parseJson(req, body);
  const user = await getCurrentUser();
  await rateLimit(user ? `report:${user.id}` : `report:ip:${clientIp(req)}`, 20, 3600);
  const values = {
    entity_type: b.entityType,
    entity_id: b.entityId,
    language_code: b.language,
    reason: b.reason,
    details: b.details,
  };
  if (user) {
    await withUser(
      user.id,
      (tx) => tx`insert into content_reports ${tx({ ...values, reporter_id: user.id })}`,
    );
  } else {
    await db()`insert into content_reports ${db()({ ...values, reporter_id: null })}`;
  }
  await track("translation_reported", {
    userId: user?.id,
    language: b.language,
    props: { reason: b.reason },
  });
  return json({ ok: true }, { status: 201 });
});
