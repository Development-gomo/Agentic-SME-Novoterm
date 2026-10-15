import { SITE_ORIGIN } from "@/config/site-origin";
import { AGENT_API_ENDPOINTS, agentApiResponse, corsPreflight } from "@/lib/agent/api";
import { OPENAPI_SCHEMAS } from "@/lib/agent/openapi-schemas";

export const dynamic = "force-static";
export const OPTIONS = corsPreflight;

const REF_PREFIX = "#/components/schemas/";

/**
 * Inlines every "#/components/schemas/X" reference, so each endpoint's schema
 * is self-contained in this document (it has no components section of its
 * own). The full referenced form remains available in /openapi.json.
 */
function inlineRefs(node: unknown, seen: string[] = []): unknown {
  if (Array.isArray(node)) return node.map((n) => inlineRefs(n, seen));
  if (!node || typeof node !== "object") return node;
  const ref = (node as { $ref?: unknown }).$ref;
  if (typeof ref === "string" && ref.startsWith(REF_PREFIX)) {
    const name = ref.slice(REF_PREFIX.length);
    if (seen.includes(name)) throw new Error(`Recursive schema reference: ${[...seen, name].join(" -> ")}`);
    return inlineRefs(OPENAPI_SCHEMAS[name], [...seen, name]);
  }
  return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, inlineRefs(v, seen)]));
}

export function GET() {
  return agentApiResponse("schema.json", {
    openapi: `${SITE_ORIGIN}/openapi.json`,
    endpoints: AGENT_API_ENDPOINTS.map((entry) => ({
      name: entry.name,
      path: entry.path,
      responseSchema: entry.responseSchema,
      schema: inlineRefs(OPENAPI_SCHEMAS[entry.responseSchema] ?? null),
    })),
  });
}
