import { z } from "zod";
import { handler, json, parseJson, requireApiUser } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { startCheckout } from "@/lib/services/player";

export const POST = handler(async (req) => {
  const user = await requireApiUser();
  await rateLimit(`checkout:${user.id}`, 10, 600);
  const { itemId } = await parseJson(req, z.object({ itemId: z.string().max(60) }));
  return json(await startCheckout(user.id, user.email, itemId));
});
