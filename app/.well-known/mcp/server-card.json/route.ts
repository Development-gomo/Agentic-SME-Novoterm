import { corsPreflight, jsonResponse } from "@/lib/agent/api";
import { buildMcpServerCard } from "@/lib/agent/discovery";

export const dynamic = "force-static";
export const OPTIONS = corsPreflight;

/** MCP server card — see lib/agent/discovery.ts for the format choice. */
export function GET() {
  return jsonResponse(buildMcpServerCard());
}
