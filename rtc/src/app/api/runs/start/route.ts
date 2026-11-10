import { clientIp, handler, json, parseJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/auth/session";
import { startRun, startSchema } from "@/lib/services/runs";

export const POST = handler(async (req) => {
  const user = await getCurrentUser();
  await rateLimit(`run:${user?.id ?? clientIp(req)}`, 60, 3600);
  const input = await parseJson(req, startSchema);
  return json(await startRun(user?.id ?? null, input));
});
