import { z } from "zod";
import { clientIp, handler, json, parseJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { resetPassword } from "@/lib/services/auth";

export const POST = handler(async (req) => {
  await rateLimit(`reset:${clientIp(req)}`, 10, 900);
  const { token, password } = await parseJson(
    req,
    z.object({ token: z.string().min(10).max(200), password: z.string().max(200) }),
  );
  await resetPassword(token, password);
  return json({ ok: true });
});
