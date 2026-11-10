import { z } from "zod";
import { handler, json, parseJson, requireApiUser } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { report } from "@/lib/services/player";

export const POST = handler(async (req, ctx: { params: Promise<{ username: string }> }) => {
  const user = await requireApiUser();
  await rateLimit(`report:${user.id}`, 10, 3600);
  const { reason } = await parseJson(req, z.object({ reason: z.string().trim().min(3).max(300) }));
  return json(await report(user.id, (await ctx.params).username, reason));
});
