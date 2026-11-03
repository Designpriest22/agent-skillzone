import { z } from "zod";
import { handler, json, parseJson, requireApiUser } from "@/lib/http";
import { deleteAccount } from "@/lib/services/account";

export const DELETE = handler(async (req) => {
  const user = await requireApiUser();
  const { confirmEmail } = await parseJson(req, z.object({ confirmEmail: z.string().max(254) }));
  return json({ ok: true, ...(await deleteAccount(user.id, confirmEmail)) });
});
