import { clientIp, handler, json, parseJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { signUp, signUpSchema } from "@/lib/services/auth";

export const POST = handler(async (req) => {
  await rateLimit(`signup:${clientIp(req)}`, 10, 3600);
  const input = await parseJson(req, signUpSchema);
  await signUp(input);
  return json({ ok: true }, { status: 201 });
});
