import { z } from "zod";
import { handler, HttpError, json, parseJson, requireApiUser } from "@/lib/http";
import { startCheckout } from "@/lib/payments/service";

export const POST = handler(async (req) => {
  const user = await requireApiUser();
  if (!user.emailVerified) throw new HttpError(403, "Confirm your email before upgrading.", "unverified");
  const { priceId } = await parseJson(req, z.object({ priceId: z.string().uuid() }));
  return json({ url: await startCheckout(user, priceId) });
});
