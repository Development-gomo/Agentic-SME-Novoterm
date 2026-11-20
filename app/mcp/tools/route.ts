import { SITE_ORIGIN } from "@/config/site-origin";
import { corsPreflight, jsonResponse } from "@/lib/agent/api";
import { MCP_SERVER_VERSION, mcpTools } from "@/lib/mcp/tools";
import { z } from "zod";

export const dynamic = "force-static";
export const OPTIONS = corsPreflight;

export function GET() {
  const tools = mcpTools.map((tool) => ({
    name: tool.name,
    title: tool.title,
    description: tool.description,
    readOnly: tool.annotations?.readOnlyHint ?? false,
    // Zod 4's built-in converter; "input" describes what a caller may send (optional fields stay optional).
    inputSchema: z.toJSONSchema(z.object(tool.inputSchema), { target: "draft-7", io: "input" }),
  }));

  return jsonResponse({
    name: "Novoterm MCP Server — Tool Discovery",
    description:
      "Directory of every tool exposed by the Novoterm MCP server, with names, descriptions, and JSON Schema input definitions. Connect an MCP client to the mcp_endpoint over Streamable HTTP to call these tools.",
    mcp_endpoint: `${SITE_ORIGIN}/mcp`,
    transport: "streamable-http",
    // Latest version negotiated through the initialize handshake; earlier 2025 revisions
    // are accepted too, and mcp-handler 2.x also serves the stateless 2026-07-28 revision.
    protocolVersion: "2025-11-25",
    supportedProtocolVersions: ["2026-07-28", "2025-11-25", "2025-06-18", "2025-03-26"],
    version: MCP_SERVER_VERSION,
    health: `${SITE_ORIGIN}/mcp/health`,
    toolCount: tools.length,
    tools,
  });
}
