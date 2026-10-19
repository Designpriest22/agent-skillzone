import { clientIp, handler, json, parseJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { signIn, signInSchema } from "@/lib/services/auth";

export const POST = handler(async (req) => {
  const input = await parseJson(req, signInSchema);
  await rateLimit(`signin:ip:${clientIp(req)}`, 30, 900);
  await rateLimit(`signin:email:${input.email}`, 10, 900);
  await signIn(input);
  return json({ ok: true });
});
