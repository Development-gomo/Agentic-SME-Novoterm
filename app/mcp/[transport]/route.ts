import { CONTACT_TOOL_NAME } from "@/config/features";
import { SITE_ORIGIN } from "@/config/site-origin";
import {
  MCP_CONTACT_LIMIT_MAX_REQUESTS,
  MCP_CONTACT_LIMIT_WINDOW_MS,
  MCP_MAX_BODY_BYTES,
  MCP_RATE_LIMIT_MAX_REQUESTS,
  MCP_RATE_LIMIT_WINDOW_MS,
} from "@/lib/mcp/limits";
import { MCP_SERVER_NAME, MCP_SERVER_VERSION, mcpTools } from "@/lib/mcp/tools";
import { createRateLimiter, type RateLimitResult } from "@/lib/rate-limit";
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

/**
 * Live MCP server for Novoterm, exposing services, industries, case studies,
 * team, and FAQ data as read-only callable tools for AI agents and LLM
 * applications, plus one optional action tool (submit_contact_inquiry, only
 * when CONTACT_TOOL_ENABLED is on — config/features.ts) that submits
 * Novoterm's real contact form on a user's explicit behalf.
 *
 * Transport: Streamable HTTP, stateless. mcp-handler 2.x (MCP SDK v2) serves
 * the 2026-07-28 MCP specification natively and 2025-era Streamable HTTP
 * clients through the SDK's stateless fallback, from the same handler. The
 * old HTTP+SSE transport no longer exists in 2.x.
 *
 * Mounted at app/mcp/[transport]/route.ts; next.config.mjs rewrites the
 * clean, advertised URL /mcp to /mcp/mcp. mcp-handler 2.x answers every
 * request it is given (routing is left to the framework), so only the
 * "mcp" segment is served here — any other /mcp/<x> path is a 404, as it was
 * with 1.x. /mcp/tools and /mcp/health are their own static routes.
 */

export const maxDuration = 60;

// Limits live in lib/mcp/limits.ts so the /agent/mcp documentation page publishes the same values.
const RATE_LIMIT_MAX_REQUESTS = MCP_RATE_LIMIT_MAX_REQUESTS;
const RATE_LIMIT_WINDOW_MS = MCP_RATE_LIMIT_WINDOW_MS;

const mcpRateLimiter = createRateLimiter({
  namespace: "mcp",
  windowMs: RATE_LIMIT_WINDOW_MS,
  maxRequests: RATE_LIMIT_MAX_REQUESTS,
});

/**
 * submit_contact_inquiry sends a real message to Novoterm's inbox, so it gets
 * its own, much tighter budget per client IP on top of the general limit.
 * Like the general limiter this is per server instance (see lib/rate-limit.ts).
 */
const CONTACT_TOOL = CONTACT_TOOL_NAME;
const contactRateLimiter = createRateLimiter({
  namespace: "mcp-contact",
  windowMs: MCP_CONTACT_LIMIT_WINDOW_MS,
  maxRequests: MCP_CONTACT_LIMIT_MAX_REQUESTS,
});

/** JSON-RPC requests here are small; anything larger is not a legitimate MCP call. */
const MAX_BODY_BYTES = MCP_MAX_BODY_BYTES;

/**
 * Origin policy (MCP Streamable HTTP: servers must validate Origin to prevent
 * DNS-rebinding). Non-browser MCP clients send no Origin header and are
 * allowed; a browser request is allowed only from Novoterm's own sites or an
 * origin listed in MCP_ALLOWED_ORIGINS (comma-separated).
 */
const ALLOWED_ORIGINS = new Set([
  SITE_ORIGIN,
  SITE_ORIGIN.replace("://www.", "://"),
  ...(process.env.MCP_ALLOWED_ORIGINS ?? "").split(",").map((o) => o.trim()).filter(Boolean),
]);

function jsonRpcError(status: number, code: number, message: string, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify({ jsonrpc: "2.0", error: { code, message }, id: null }), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

/** True when a JSON-RPC body is a tools/call for the contact tool, including inside a batch. */
function callsContactTool(bodyText: string): boolean {
  try {
    const body = JSON.parse(bodyText);
    const messages = Array.isArray(body) ? body : [body];
    return messages.some((m) => m?.method === "tools/call" && m?.params?.name === CONTACT_TOOL);
  } catch {
    return false;
  }
}

/**
 * Reads the body while counting the bytes actually received, so the limit
 * also holds for chunked requests that send no (or a false) Content-Length.
 * Returns null as soon as the limit is exceeded.
 */
async function readBoundedBody(request: Request, limit: number): Promise<Uint8Array<ArrayBuffer> | null> {
  if (!request.body) return new Uint8Array(new ArrayBuffer(0));
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const body = new Uint8Array(new ArrayBuffer(size));
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

/**
 * CORS for approved browser origins. Non-browser MCP clients ignore these
 * headers; a browser client on an origin in ALLOWED_ORIGINS needs them for
 * the preflight and to read the response (including the session header).
 */
function corsHeaders(origin: string | null): Record<string, string> {
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID",
    "Access-Control-Expose-Headers": "Mcp-Session-Id, Mcp-Protocol-Version, RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset, Retry-After",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function handlePreflight(request: Request): Response {
  const origin = request.headers.get("origin");
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return jsonRpcError(403, -32000, `Origin ${origin} is not allowed.`);
  }
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

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
          // SDK v2 takes a full Standard Schema object, not a raw zod shape.
          inputSchema: z.object(tool.inputSchema),
          annotations: tool.annotations,
        },
        async (args: Record<string, unknown>) => tool.handler(args ?? {}),
      );
    }
  },
  {
    serverInfo: { name: MCP_SERVER_NAME, version: MCP_SERVER_VERSION },
    verboseLogs: process.env.NODE_ENV !== "production",
  },
);

type RouteContext = { params: Promise<{ transport: string }> };

/** Only /mcp/mcp (the target of the /mcp rewrite) is the MCP endpoint. */
async function isMcpEndpoint(context: RouteContext): Promise<boolean> {
  const { transport } = await context.params;
  return transport === "mcp";
}

function notFound(): Response {
  return new Response("Not Found", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

async function handleOptions(request: Request, context: RouteContext): Promise<Response> {
  if (!(await isMcpEndpoint(context))) return notFound();
  return handlePreflight(request);
}

async function handleRequest(incoming: Request, context: RouteContext): Promise<Response> {
  if (!(await isMcpEndpoint(context))) return notFound();
  const origin = incoming.headers.get("origin");
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return jsonRpcError(403, -32000, `Origin ${origin} is not allowed.`);
  }
  const cors = corsHeaders(origin);

  const declaredLength = Number(incoming.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return jsonRpcError(413, -32000, `Request body too large (max ${MAX_BODY_BYTES} bytes).`, cors);
  }

  // Buffer the body under the byte limit, then hand the handler an equivalent
  // request built from that buffer (the original stream can only be read once).
  let request = incoming;
  let bodyText = "";
  if (incoming.method === "POST") {
    const body = await readBoundedBody(incoming, MAX_BODY_BYTES);
    if (!body) return jsonRpcError(413, -32000, `Request body too large (max ${MAX_BODY_BYTES} bytes).`, cors);
    bodyText = new TextDecoder().decode(body);
    request = new Request(incoming.url, { method: incoming.method, headers: incoming.headers, body });
  }

  const rateLimit = await mcpRateLimiter.checkByHeaders(request.headers);
  const headers = { ...rateLimitHeaders(rateLimit), ...cors };

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

  if (request.method === "POST" && callsContactTool(bodyText)) {
    const contactLimit = await contactRateLimiter.checkByHeaders(request.headers);
    if (contactLimit.limited) {
      return jsonRpcError(429, -32000, "Too many contact inquiries from this client. Please try again later or use the contact form.", {
        "Retry-After": String(contactLimit.retryAfterSeconds),
        ...headers,
      });
    }
  }

  const response = await mcpHandler(request);
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}

export { handleRequest as DELETE, handleRequest as GET, handleRequest as POST, handleOptions as OPTIONS };
