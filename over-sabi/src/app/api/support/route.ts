import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { clientIp, handler, json, parseJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export const POST = handler(async (req) => {
  await rateLimit(`support:${clientIp(req)}`, 5, 3600);
  const b = await parseJson(
    req,
    z.object({
      email: z.string().email().max(254),
      subject: z.string().trim().min(1).max(200),
      message: z.string().trim().min(5).max(5000),
    }),
  );
  const user = await getCurrentUser();
  await db()`insert into support_requests (user_id, email, subject, message) values (${user?.id ?? null}, ${b.email}, ${b.subject}, ${b.message})`;
  return json({ ok: true }, { status: 201 });
});
