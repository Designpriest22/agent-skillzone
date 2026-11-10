import { z } from "zod";
import { handler, json, parseJson, requireApiUser } from "@/lib/http";
import { mergeGuestProgress } from "@/lib/services/lessons";

const body = z.object({
  completedLessons: z
    .array(z.object({ lessonId: z.string().uuid(), score: z.number().min(0).max(100) }))
    .max(50),
  savedVocabIds: z.array(z.string().uuid()).max(200),
});

export const POST = handler(async (req) => {
  const user = await requireApiUser();
  return json(await mergeGuestProgress(user.id, await parseJson(req, body)));
});
