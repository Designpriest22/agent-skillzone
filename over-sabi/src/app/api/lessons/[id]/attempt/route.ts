import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { responseSchema } from "@/lib/content/activity-types";
import { clientIp, handler, json, parseJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { submitAttempt } from "@/lib/services/lessons";

const body = z.object({ activityId: z.string().uuid(), response: responseSchema });

/** Grades an activity. Works for guests (nothing stored) and signed-in learners. */
export const POST = handler(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  z.string().uuid().parse(id);
  const input = await parseJson(req, body);
  const user = await getCurrentUser();
  await rateLimit(user ? `attempt:${user.id}` : `attempt:ip:${clientIp(req)}`, 240, 600);
  return json(await submitAttempt(user?.id ?? null, id, input.activityId, input.response));
});
