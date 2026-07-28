import { AGENT_API_ENDPOINTS, agentApiResponse, corsPreflight } from "@/lib/agent/api";
import { OPENAPI_SCHEMAS } from "@/lib/agent/openapi-schemas";

export const dynamic = "force-static";
export const OPTIONS = corsPreflight;

export function GET() {
  return agentApiResponse("schema.json", {
    endpoints: AGENT_API_ENDPOINTS.map((entry) => ({
      name: entry.name,
      path: entry.path,
      responseSchema: entry.responseSchema,
      schema: OPENAPI_SCHEMAS[entry.responseSchema] ?? null,
    })),
  });
}
