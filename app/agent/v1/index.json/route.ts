import { AGENT_API_BASE_URL, AGENT_API_ENDPOINTS, AGENT_API_VERSION, agentApiResponse, corsPreflight } from "@/lib/agent/api";

export const dynamic = "force-static";
export const OPTIONS = corsPreflight;

export function GET() {
  return agentApiResponse("index.json", {
    version: AGENT_API_VERSION,
    baseUrl: AGENT_API_BASE_URL,
    endpoints: AGENT_API_ENDPOINTS.map((entry) => ({
      name: entry.name,
      method: entry.method,
      url: entry.url,
      description: entry.description,
      tags: entry.tags,
    })),
  });
}
