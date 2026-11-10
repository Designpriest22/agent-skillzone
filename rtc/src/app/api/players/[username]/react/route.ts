import { z } from "zod";
import { handler, json, parseJson, requireApiUser } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { react } from "@/lib/services/player";

export const POST = handler(async (req, ctx: { params: Promise<{ username: string }> }) => {
  const user = await requireApiUser();
  await rateLimit(`react:${user.id}`, 60, 3600);
  const { kind } = await parseJson(req, z.object({ kind: z.enum(["respect", "fire", "rematch"]) }));
  return json(await react(user.id, (await ctx.params).username, kind));
});
