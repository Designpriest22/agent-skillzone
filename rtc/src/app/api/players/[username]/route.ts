import { handler, json } from "@/lib/http";
import { publicProfile } from "@/lib/services/player";

export const GET = handler(async (_req, ctx: { params: Promise<{ username: string }> }) => {
  return json(await publicProfile((await ctx.params).username));
});
