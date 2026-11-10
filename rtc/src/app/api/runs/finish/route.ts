import { handler, json, parseJson } from "@/lib/http";
import { getCurrentUser } from "@/lib/auth/session";
import { finishRun, finishSchema } from "@/lib/services/runs";

export const POST = handler(async (req) => {
  const user = await getCurrentUser();
  const input = await parseJson(req, finishSchema);
  return json(await finishRun(user?.id ?? null, input));
});
