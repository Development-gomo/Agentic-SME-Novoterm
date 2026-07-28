import type { ZodRawShape } from "zod";

/**
 * Shared type definitions for the Novoterm MCP server.
 *
 * A single tool registry (lib/mcp/tools.ts) is the source of truth consumed by
 * both the live MCP handler (app/mcp/[transport]/route.ts) and the machine-
 * readable discovery endpoint (/mcp/tools), so the advertised tool list can
 * never drift from what the server actually exposes.
 */

export type McpToolResult = {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};

export type McpTool = {
  name: string;
  title: string;
  description: string;
  inputSchema: ZodRawShape;
  annotations?: {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
  };
  handler: (args: Record<string, unknown>) => Promise<McpToolResult> | McpToolResult;
};

export function jsonContent(value: unknown): McpToolResult {
  return { content: [{ type: "text", text: `${JSON.stringify(value, null, 2)}` }] };
}

export function errorContent(message: string): McpToolResult {
  return { content: [{ type: "text", text: message }], isError: true };
}
