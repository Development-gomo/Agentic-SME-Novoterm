import { SITE_ORIGIN } from "@/config/site-origin";
import { LAST_MODIFIED, industries } from "@/app/agent/content";

/**
 * Shared definitions for the read-only agent JSON API served under /agent/v1.
 *
 * This registry is the single source of truth consumed by:
 *  - /agent/v1/index.json (the API directory)
 *  - /openapi.json (the OpenAPI 3.0.3 spec)
 *  - /api-catalog.json (the APIs.json catalog)
 * so the three machine-readable surfaces can never drift from each other.
 */

export const AGENT_API_VERSION = "v1";
export const AGENT_API_BASE_PATH = `/agent/${AGENT_API_VERSION}`;
export const AGENT_API_BASE_URL = `${SITE_ORIGIN}${AGENT_API_BASE_PATH}`;

/** Freshness signal tied to the /agent content, so the HTML page and JSON API stay in lockstep. */
export const AGENT_API_MODIFIED = LAST_MODIFIED;

export type AgentApiEndpoint = {
  file: string;
  path: string;
  url: string;
  method: "GET";
  name: string;
  description: string;
  tags: string[];
  responseSchema: string;
};

function endpoint(
  file: string,
  name: string,
  description: string,
  tags: string[],
  responseSchema: string,
): AgentApiEndpoint {
  const path = `${AGENT_API_BASE_PATH}/${file}`;
  return {
    file,
    path,
    url: `${SITE_ORIGIN}${path}`,
    method: "GET",
    name,
    description,
    tags,
    responseSchema,
  };
}

export const AGENT_API_ENDPOINTS: AgentApiEndpoint[] = [
  endpoint(
    "index.json",
    "index",
    "Directory of every /agent/v1 endpoint with its HTTP method, canonical URL, and a plain-language description.",
    ["read-only", "discovery"],
    "IndexResponse",
  ),
  endpoint(
    "schema.json",
    "schema",
    "Response shape definitions for each /agent/v1 endpoint, so agents know the fields to expect before fetching.",
    ["read-only", "schema"],
    "SchemaResponse",
  ),
  endpoint(
    "company.json",
    "company",
    "Novoterm Translation company identity: founding year, headquarters, team size, languages, philosophy, and contact pathways.",
    ["read-only", "company"],
    "CompanyResponse",
  ),
  endpoint(
    "services.json",
    "services",
    "All translation and language-review services, each with a description, benefits, and service-specific FAQs.",
    ["read-only", "services"],
    "ServicesResponse",
  ),
  endpoint(
    "industries.json",
    "industries",
    `All ${industries.length} industries Novoterm serves, each with a description of the sector-specific expertise offered.`,
    ["read-only", "industries"],
    "IndustriesResponse",
  ),
  endpoint(
    "case-studies.json",
    "case-studies",
    "Client case studies, each with the client, industry, services used, challenge, solution, and results.",
    ["read-only", "case-studies"],
    "CaseStudiesResponse",
  ),
  endpoint(
    "team.json",
    "team",
    "Novoterm's in-house team: name, role, and bio for each team member.",
    ["read-only", "team"],
    "TeamResponse",
  ),
  endpoint(
    "faq.json",
    "faq",
    "Frequently asked questions, combining the general FAQ page with every per-service FAQ.",
    ["read-only", "faq"],
    "FaqResponse",
  ),
  endpoint(
    "articles.json",
    "articles",
    "Novoterm's article library: all published articles with their full text, for on-topic questions about translation, AI translation, proofreading, and industry-specific advice.",
    ["read-only", "articles"],
    "ArticlesResponse",
  ),
];

export function getAgentApiEndpoint(file: string): AgentApiEndpoint {
  const match = AGENT_API_ENDPOINTS.find((entry) => entry.file === file);
  if (!match) {
    throw new Error(`Unknown agent API endpoint: ${file}`);
  }
  return match;
}

export type AgentApiMeta = {
  name: string;
  description: string;
  url: string;
  modified: string;
  usage: string;
};

const USAGE_NOTE =
  "Read-only and public; no authentication required. Free to read, cite, and summarize. Prefer this endpoint over scraping the HTML site.";

export function agentApiMeta(file: string): AgentApiMeta {
  const { name, description, url } = getAgentApiEndpoint(file);
  return { name, description, url, modified: AGENT_API_MODIFIED, usage: USAGE_NOTE };
}

export function agentApiResponse(file: string, data: unknown): Response {
  return jsonResponse({ ...agentApiMeta(file), data });
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
} as const;

export function jsonResponse(value: unknown): Response {
  return new Response(`${JSON.stringify(value, null, 2)}\n`, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Last-Modified": httpDate(AGENT_API_MODIFIED),
      ...CORS_HEADERS,
    },
  });
}

export function corsPreflight(): Response {
  return new Response(null, {
    status: 204,
    headers: { ...CORS_HEADERS, "Access-Control-Max-Age": "86400" },
  });
}

function httpDate(isoDate: string): string {
  const parsed = new Date(`${isoDate}T00:00:00Z`);
  const date = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  return date.toUTCString();
}
