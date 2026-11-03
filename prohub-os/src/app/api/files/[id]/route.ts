import { getUser } from "@/lib/auth";
import { readFile } from "@/services/files";
import { fileResponse } from "@/lib/file-response";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });
  const f = await readFile(id);
  if (!f) return new Response("Not found", { status: 404 });
  return fileResponse(req, f, { download: new URL(req.url).searchParams.has("download") });
}
