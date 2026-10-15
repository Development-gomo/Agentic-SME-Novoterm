import { timingSafeEqual } from "node:crypto";
import { CONTACT_TOOL_ENABLED } from "@/config/features";
import { SITE_ORIGIN } from "@/config/site-origin";
import { corsPreflight } from "@/lib/agent/api";
import { MCP_API_BASE, MCP_SERVER_NAME, MCP_SERVER_VERSION, mcpTools } from "@/lib/mcp/tools";
import { CLIENT_IP_SOURCE, clientKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const OPTIONS = corsPreflight;

/**
 * Rate-limit diagnostics (deployment check D2) are only returned to a caller
 * that sends the secret from HEALTH_DIAGNOSTICS_TOKEN in the
 * x-diagnostics-token header. Without the variable set, they are never
 * returned. A header rather than a query string keeps the token out of URLs
 * and access logs; the diagnostic response carries no CORS header, so no
 * other website's script can read a visitor's address from it.
 */
function diagnosticsAuthorized(request: Request): boolean {
  const expected = process.env.HEALTH_DIAGNOSTICS_TOKEN;
  const given = request.headers.get("x-diagnostics-token");
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function GET(request: Request) {
  const diagnostics = diagnosticsAuthorized(request);
  const body = {
    status: "ok",
    name: MCP_SERVER_NAME,
    version: MCP_SERVER_VERSION,
    mcp_endpoint: `${SITE_ORIGIN}/mcp`,
    api_base: MCP_API_BASE,
    tools: mcpTools.length,
    contact_tool_enabled: CONTACT_TOOL_ENABLED,
    ...(diagnostics && {
      // The header the rate limiter trusts here and the client address it
      // derived for this request: it must equal the caller's public IP and
      // must not change when spoofed forwarding headers are added.
      rateLimit: { ipHeader: CLIENT_IP_SOURCE, clientKey: clientKey(request.headers) },
    }),
  };

  const cors: Record<string, string> = diagnostics
    ? {}
    : {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      };

  return new Response(`${JSON.stringify(body)}\n`, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...cors,
    },
  });
}
