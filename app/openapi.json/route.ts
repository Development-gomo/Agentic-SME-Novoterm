import { SITE_ORIGIN } from "@/config/site-origin";
import {
  AGENT_API_BASE_URL,
  AGENT_API_ENDPOINTS,
  AGENT_API_MODIFIED,
  corsPreflight,
  jsonResponse,
} from "@/lib/agent/api";
import { OPENAPI_SCHEMAS } from "@/lib/agent/openapi-schemas";
import { SITE_CONFIG } from "@/lib/json-ld/config";

export const dynamic = "force-static";
export const OPTIONS = corsPreflight;

const errorResponses = {
  "404": {
    description: "The requested resource does not exist.",
    content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
  },
  "500": {
    description: "An unexpected server error occurred while producing the response.",
    content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
  },
} as const;

/**
 * OpenAPI 3.0.3 description of the read-only /agent/v1 JSON API.
 * Paths are generated from the shared endpoint list (lib/agent/api.ts) so the
 * spec cannot drift from the API itself.
 */
export function GET() {
  const paths = Object.fromEntries(
    AGENT_API_ENDPOINTS.map((entry) => [
      entry.path,
      {
        get: {
          summary: entry.description,
          description: entry.description,
          operationId: entry.name.replace(/[^a-zA-Z0-9]+/g, "_"),
          tags: entry.tags,
          responses: {
            "200": {
              description: entry.description,
              content: { "application/json": { schema: { $ref: `#/components/schemas/${entry.responseSchema}` } } },
            },
            ...errorResponses,
          },
        },
      },
    ]),
  );

  const spec = {
    openapi: "3.0.3",
    info: {
      title: "Novoterm Agent API",
      description:
        "Read-only, public JSON API exposing Novoterm Translation's services, industries, team, case studies, and FAQ for AI agents and automated systems. No authentication required.",
      version: "1.0.0",
      "x-modified": AGENT_API_MODIFIED,
      contact: {
        name: SITE_CONFIG.name,
        email: "info@novoterm.se",
        url: `${SITE_ORIGIN}/kontakta-oss`,
      },
    },
    servers: [{ url: SITE_ORIGIN }],
    externalDocs: { description: "Machine-readable agent page", url: `${SITE_ORIGIN}/agent` },
    "x-api-base-url": AGENT_API_BASE_URL,
    paths,
    components: { schemas: OPENAPI_SCHEMAS },
  };

  return jsonResponse(spec);
}
