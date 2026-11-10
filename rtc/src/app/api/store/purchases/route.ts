import { handler, json, requireApiUser } from "@/lib/http";
import { purchaseHistory } from "@/lib/services/player";

export const GET = handler(async () => {
  const user = await requireApiUser();
  return json({ purchases: await purchaseHistory(user.id) });
});
