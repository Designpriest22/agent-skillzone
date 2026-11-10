import { z } from "zod";
import { handler, json, parseJson, requireApiUser } from "@/lib/http";
import { buyWithCash } from "@/lib/services/player";

export const POST = handler(async (req) => {
  const user = await requireApiUser();
  const { itemId } = await parseJson(req, z.object({ itemId: z.string().max(60) }));
  return json(await buyWithCash(user.id, itemId));
});
