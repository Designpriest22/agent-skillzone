/**
 * HTTP glue for the Claude connector. Stateless Streamable HTTP with JSON responses: each request builds a
 * server bound to the token's user, handles the JSON-RPC message, and closes. Works on serverless and
 * long-running hosts alike.
 */
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { buildMcpServer } from "./mcp";
import { userForToken } from "@/lib/api-tokens";
import { rateLimit } from "@/lib/rate-limit";

const unauthorized = () => new Response(JSON.stringify({ jsonrpc: "2.0", error: { code: -32001, message: "Unauthorized: create a token in Prohub OS → Settings → Command channels" }, id: null }), {
  status: 401, headers: { "Content-Type": "application/json", "WWW-Authenticate": 'Bearer realm="prohub-ai"' },
});

export async function handleMcp(req: Request, token: string | null) {
  const user = await userForToken(token);
  if (!user) return unauthorized();
  if (!rateLimit(`mcp:${user.id}`, 120, 60_000).ok) return new Response("Too many requests", { status: 429 });
  if (req.method !== "POST") {
    // Stateless server: no standalone SSE stream and no sessions to delete.
    return new Response(null, { status: 405, headers: { Allow: "POST" } });
  }
  const server = buildMcpServer(user);
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  await server.connect(transport);
  try {
    return await transport.handleRequest(req);
  } finally {
    // JSON responses are fully materialised by now; release the per-request server.
    queueMicrotask(() => { server.close().catch(() => undefined); });
  }
}
