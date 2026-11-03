import { z } from "zod";
import { handler, json, parseJson, requireApiUser } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { runAdminAction } from "@/lib/services/admin";

/** Single, audited entry point for every admin mutation. Role checks happen per action. */
export const POST = handler(async (req) => {
  const user = await requireApiUser("reviewer");
  await rateLimit(`admin:${user.id}`, 300, 60);
  const { action, input } = await parseJson(
    req,
    z.object({ action: z.string().max(60), input: z.unknown() }),
  );
  return json({ ok: true, result: await runAdminAction(user, action, input) });
});
