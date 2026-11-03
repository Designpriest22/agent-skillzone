import { readFileByToken } from "@/services/files";
import { fileResponse } from "@/lib/file-response";

export const runtime = "nodejs";

/** Capability URL: used when an external service (e.g. WhatsApp Cloud API) must fetch a file by link. */
export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const f = await readFileByToken(token);
  if (!f) return new Response("Not found", { status: 404 });
  return fileResponse(req, f);
}
