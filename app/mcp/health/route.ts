import { SITE_ORIGIN } from "@/config/site-origin";
import { corsPreflight } from "@/lib/agent/api";
import { MCP_API_BASE, MCP_SERVER_NAME, MCP_SERVER_VERSION, mcpTools } from "@/lib/mcp/tools";

export const dynamic = "force-dynamic";
export const OPTIONS = corsPreflight;

export function GET() {
  const body = {
    status: "ok",
    name: MCP_SERVER_NAME,
    version: MCP_SERVER_VERSION,
    mcp_endpoint: `${SITE_ORIGIN}/mcp`,
    api_base: MCP_API_BASE,
    tools: mcpTools.length,
  };

  return new Response(`${JSON.stringify(body)}\n`, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}
