import { z } from "zod";
import { handler, json, parseJson, requireApiUser } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { getTranscript, sendTurn } from "@/lib/services/tutor";

export const POST = handler(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireApiUser();
  const id = z
    .string()
    .uuid()
    .parse((await params).id);
  await rateLimit(`turn:${user.id}`, 40, 60);
  const b = await parseJson(
    req,
    z.object({
      text: z.string().trim().min(1, "Say or type something first.").max(1000),
      inputMode: z.enum(["voice", "text"]).default("text"),
      sttProvider: z.string().max(40).optional(),
    }),
  );
  return json(await sendTurn(user.id, id, b));
});

export const GET = handler(async (_req, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireApiUser();
  const id = z
    .string()
    .uuid()
    .parse((await params).id);
  return json({ turns: await getTranscript(user.id, id) });
});
