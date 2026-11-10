import { z } from "zod";
import { assertSameOrigin, handler, json, requireApiUser } from "@/lib/http";
import { completeLesson } from "@/lib/services/lessons";

export const POST = handler(async (req, { params }: { params: Promise<{ id: string }> }) => {
  assertSameOrigin(req);
  const user = await requireApiUser();
  const { id } = await params;
  return json(await completeLesson(user.id, z.string().uuid().parse(id)));
});
