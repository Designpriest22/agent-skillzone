import { z } from "zod";
import { withUser } from "@/lib/db";
import { handler, json, parseJson, requireApiUser } from "@/lib/http";

export const PATCH = handler(async (req) => {
  const user = await requireApiUser();
  const b = await parseJson(
    req,
    z.object({ ids: z.array(z.string().uuid()).max(100).optional(), all: z.boolean().optional() }),
  );
  await withUser(user.id, (tx) =>
    b.all
      ? tx`update notifications set read_at = now() where user_id = ${user.id} and read_at is null`
      : tx`update notifications set read_at = now() where id = any(${b.ids ?? []}::uuid[])`,
  );
  return json({ ok: true });
});
