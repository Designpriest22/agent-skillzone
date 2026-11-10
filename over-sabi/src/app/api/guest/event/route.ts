import { z } from "zod";
import { track } from "@/lib/analytics";
import { clientIp, handler, json, parseJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

const body = z.object({
  name: z.enum(["guest_lesson_completed"]),
  anonymousId: z.string().regex(/^[a-zA-Z0-9-]{8,64}$/),
  language: z.string().max(12),
});

export const POST = handler(async (req) => {
  await rateLimit(`guest-event:${clientIp(req)}`, 30, 3600);
  const e = await parseJson(req, body);
  await track(e.name, { anonymousId: e.anonymousId, language: e.language });
  return json({ ok: true });
});
