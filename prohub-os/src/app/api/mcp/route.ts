import { handleMcp } from "@/channels/mcp-http";
import { bearer } from "@/lib/api-tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Claude connector endpoint — token in the Authorization header (Claude Code, Claude Desktop via config). */
export const POST = (req: Request) => handleMcp(req, bearer(req));
export const GET = (req: Request) => handleMcp(req, bearer(req));
export const DELETE = (req: Request) => handleMcp(req, bearer(req));
