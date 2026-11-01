import { handleMcp } from "@/channels/mcp-http";
import { bearer } from "@/lib/api-tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Claude connector endpoint with the token in the path, for clients that only accept a URL
 * (claude.ai / Claude Desktop "custom connector"). Treat the full URL as a secret.
 */
async function handle(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  return handleMcp(req, bearer(req) ?? decodeURIComponent(token));
}
export const POST = handle;
export const GET = handle;
export const DELETE = handle;
