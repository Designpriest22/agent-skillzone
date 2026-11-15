import { clientIp, handler, json, parseJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/auth/session";
import { ingest, ingestSchema } from "@/lib/services/analytics";

export const POST = handler(async (req) => {
  const input = await parseJson(req, ingestSchema);
  await rateLimit(`ev:${input.anonId}`, 120, 600);
  await rateLimit(`evip:${clientIp(req)}`, 600, 600);
  const user = await getCurrentUser();
  return json(await ingest(input, user?.id ?? null));
});
