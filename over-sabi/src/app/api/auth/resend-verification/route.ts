import { handler, json, requireApiUser, assertSameOrigin } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { sendVerificationEmail } from "@/lib/services/auth";

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const user = await requireApiUser();
  if (user.emailVerified) return json({ ok: true, alreadyVerified: true });
  await rateLimit(`verify:${user.id}`, 3, 3600);
  const result = await sendVerificationEmail(user.id, user.email);
  return json({ ok: true, delivered: result.delivered });
});
