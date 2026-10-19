import { z } from "zod";
import { clientIp, handler, json, parseJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { requestPasswordReset } from "@/lib/services/auth";

export const POST = handler(async (req) => {
  const { email } = await parseJson(req, z.object({ email: z.string().email().max(254) }));
  await rateLimit(`forgot:${clientIp(req)}`, 5, 900);
  await rateLimit(`forgot:${email.toLowerCase()}`, 3, 3600);
  await requestPasswordReset(email);
  return json({ ok: true });
});
