import { MCP_SERVER_NAME, MCP_SERVER_VERSION, mcpTools } from "@/lib/mcp/tools";
import { createRateLimiter, type RateLimitResult } from "@/lib/rate-limit";
import { createMcpHandler } from "mcp-handler";

/**
 * Live MCP server for Novoterm, exposing services, industries, case studies,
 * team, and FAQ data as callable tools for AI agents and LLM applications.
 *
 * Transport: Streamable HTTP in stateless mode — a fresh server instance per
 * request (no session store), the recommended pattern for read-heavy,
 * idempotent use cases. The deprecated SSE transport is disabled.
 *
 * Mounted at app/mcp/[transport]/route.ts with basePath "/mcp", so the
 * Streamable HTTP endpoint resolves to /mcp/mcp; next.config.mjs rewrites the
 * clean, advertised URL /mcp to /mcp/mcp.
 */

export const maxDuration = 60;

const RATE_LIMIT_MAX_REQUESTS = 100;
const RATE_LIMIT_WINDOW_MS = 60_000;

const mcpRateLimiter = createRateLimiter({
  namespace: "mcp",
  windowMs: RATE_LIMIT_WINDOW_MS,
  maxRequests: RATE_LIMIT_MAX_REQUESTS,
});

function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const resetSeconds = Math.max(Math.ceil((result.resetAt - Date.now()) / 1000), 0);
  return {
    "RateLimit-Limit": String(RATE_LIMIT_MAX_REQUESTS),
    "RateLimit-Remaining": String(Math.max(result.remaining, 0)),
    "RateLimit-Reset": String(resetSeconds),
    "RateLimit-Policy": `${RATE_LIMIT_MAX_REQUESTS};w=${RATE_LIMIT_WINDOW_MS / 1000}`,
  };
}

const mcpHandler = createMcpHandler(
  (server) => {
    for (const tool of mcpTools) {
      server.registerTool(
        tool.name,
        {
          title: tool.title,
          description: tool.description,
          inputSchema: tool.inputSchema,
          annotations: tool.annotations,
        },
        async (args: Record<string, unknown>) => tool.handler(args ?? {}),
      );
    }
  },
  { serverInfo: { name: MCP_SERVER_NAME, version: MCP_SERVER_VERSION } },
  {
    streamableHttpEndpoint: "/mcp",
    maxDuration: 60,
    disableSse: true,
    verboseLogs: process.env.NODE_ENV !== "production",
  },
);

async function handleRequest(request: Request): Promise<Response> {
  const rateLimit = await mcpRateLimiter.checkByHeaders(request.headers);
  const headers = rateLimitHeaders(rateLimit);

  if (rateLimit.limited) {
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Rate limit exceeded. Please slow down and try again." },
        id: null,
      }),
      {
        status: 429,
        headers: { "Content-Type": "application/json", "Retry-After": String(rateLimit.retryAfterSeconds), ...headers },
      },
    );
  }

  const response = await mcpHandler(request);
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}

export { handleRequest as DELETE, handleRequest as GET, handleRequest as POST };
