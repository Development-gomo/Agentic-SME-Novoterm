import { SITE_ORIGIN } from "@/config/site-origin";
import { corsPreflight, jsonResponse } from "@/lib/agent/api";
import { MCP_SERVER_VERSION, mcpTools } from "@/lib/mcp/tools";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const dynamic = "force-static";
export const OPTIONS = corsPreflight;

export function GET() {
  const tools = mcpTools.map((tool) => ({
    name: tool.name,
    title: tool.title,
    description: tool.description,
    readOnly: tool.annotations?.readOnlyHint ?? false,
    inputSchema: zodToJsonSchema(z.object(tool.inputSchema), { target: "jsonSchema7", $refStrategy: "none" }),
  }));

  return jsonResponse({
    name: "Novoterm MCP Server — Tool Discovery",
    description:
      "Directory of every tool exposed by the Novoterm MCP server, with names, descriptions, and JSON Schema input definitions. Connect an MCP client to the mcp_endpoint over Streamable HTTP to call these tools.",
    mcp_endpoint: `${SITE_ORIGIN}/mcp`,
    transport: "streamable-http",
    protocolVersion: "2025-03-26",
    version: MCP_SERVER_VERSION,
    health: `${SITE_ORIGIN}/mcp/health`,
    toolCount: tools.length,
    tools,
  });
}
