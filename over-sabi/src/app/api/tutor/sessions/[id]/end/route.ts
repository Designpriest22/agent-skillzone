import { z } from "zod";
import { assertSameOrigin, handler, json, requireApiUser } from "@/lib/http";
import { endSession } from "@/lib/services/tutor";

export const POST = handler(async (req, { params }: { params: Promise<{ id: string }> }) => {
  assertSameOrigin(req);
  const user = await requireApiUser();
  return json(
    await endSession(
      user.id,
      z
        .string()
        .uuid()
        .parse((await params).id),
    ),
  );
});
