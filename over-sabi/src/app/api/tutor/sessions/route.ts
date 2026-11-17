import { z } from "zod";
import { tutorSettingsSchema } from "@/lib/ai/schemas";
import { handler, json, parseJson, requireApiUser } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { startSession } from "@/lib/services/tutor";

export const POST = handler(async (req) => {
  const user = await requireApiUser();
  await rateLimit(`session-start:${user.id}`, 20, 3600);
  const b = await parseJson(
    req,
    z.object({
      language: z.string().max(12),
      tutorId: z.string().max(40),
      settings: tutorSettingsSchema.partial().default({}),
    }),
  );
  return json(
    await startSession(user.id, { languageCode: b.language, tutorId: b.tutorId, settings: b.settings }),
    { status: 201 },
  );
});
