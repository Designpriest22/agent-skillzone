import { assertSameOrigin, handler, json, requireApiUser } from "@/lib/http";
import { cancelSubscription } from "@/lib/payments/service";

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const user = await requireApiUser();
  await cancelSubscription(user.id);
  return json({ ok: true });
});
