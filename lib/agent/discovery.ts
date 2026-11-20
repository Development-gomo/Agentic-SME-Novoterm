import { LAST_MODIFIED } from "@/app/agent/content";
import { CONTACT_TOOL_ENABLED } from "@/config/features";
import { SITE_ORIGIN } from "@/config/site-origin";
import { MCP_SERVER_VERSION, mcpTools } from "@/lib/mcp/tools";

/**
 * Well-known discovery documents (November 2026):
 *
 * - /.well-known/mcp/server-card.json — MCP server card. The card format is
 *   still a proposal (SEP-1649 named this path; later proposals moved towards
 *   a shape derived from the MCP registry's server.json). This card uses the
 *   official MCP registry server.json schema — the same content as server.json
 *   at the repo root — plus the live tool list, so it is valid against a
 *   published schema whichever way the proposal settles.
 * - /.well-known/ard.json — Agentic Resource Discovery manifest (ARD v0.91,
 *   "Proposal", agenticresourcediscovery.org; also IETF draft-bu-dawn-ard-discovery-00).
 * - /.well-known/api-catalog — RFC 9727 API catalog (an RFC 9264 linkset).
 */

const abs = (path: string) => `${SITE_ORIGIN}${path}`;

export const MCP_REGISTRY_NAME = "se.novoterm/translation";
export const MCP_SERVER_CARD_URL = abs("/.well-known/mcp/server-card.json");
export const ARD_URL = abs("/.well-known/ard.json");
export const API_CATALOG_WELL_KNOWN_URL = abs("/.well-known/api-catalog");

const MCP_DESCRIPTION = `MCP server exposing Novoterm Translation's services, industries, landing pages, case studies, videos, team, FAQ and articles as read-only callable tools for AI agents.${
  CONTACT_TOOL_ENABLED ? " A submit_contact_inquiry action submits Novoterm's real contact form on a user's explicit behalf." : ""
} Novoterm is a Stockholm-based translation and language-review agency.`;

export function buildMcpServerCard() {
  return {
    $schema: "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json",
    name: MCP_REGISTRY_NAME,
    title: "Novoterm Translation",
    description: MCP_DESCRIPTION,
    version: MCP_SERVER_VERSION,
    websiteUrl: abs("/agent/mcp"),
    remotes: [{ type: "streamable-http", url: abs("/mcp") }],
    _meta: {
      "se.novoterm/discovery": {
        toolDiscovery: abs("/mcp/tools"),
        health: abs("/mcp/health"),
        protocolVersions: ["2026-07-28", "2025-11-25", "2025-06-18", "2025-03-26"],
        authentication: "none",
        tools: mcpTools.map((t) => ({ name: t.name, title: t.title, readOnly: t.annotations?.readOnlyHint ?? false })),
        lastVerified: LAST_MODIFIED,
      },
    },
  };
}

const ARD_CONTEXT = "https://agenticresourcediscovery.org/context/v1";
const updatedAt = `${LAST_MODIFIED}T00:00:00Z`;

export function buildArdManifest() {
  const entry = (e: Record<string, unknown>) => ({ "@context": ARD_CONTEXT, ...e, version: MCP_SERVER_VERSION, updatedAt });
  return {
    entries: [
      entry({
        identifier: "urn:air:novoterm.se:mcp:novoterm",
        displayName: "Novoterm Translation MCP server",
        type: "application/mcp-server-card+json",
        url: MCP_SERVER_CARD_URL,
        description: MCP_DESCRIPTION,
        capabilities: mcpTools.map((t) => t.name),
        representativeQueries: [
          "Which translation services does Novoterm offer?",
          "Does Novoterm translate legal or medical documents?",
          "Find Novoterm articles about AI translation",
          "Vilka språk översätter Novoterm till och från?",
        ],
        tags: ["translation", "language-services", "proofreading", "sweden", "mcp"],
      }),
      entry({
        identifier: "urn:air:novoterm.se:api:agent-v1",
        displayName: "Novoterm Agent API (read-only REST)",
        type: "application/vnd.oai.openapi+json",
        url: abs("/openapi.json"),
        description:
          "Read-only JSON API at /agent/v1/ with Novoterm's company details, services, industries, landing pages, case studies, team, videos, FAQ and articles. No authentication. Described by an OpenAPI 3.0.3 document.",
        capabilities: ["company", "services", "industries", "pages", "case-studies", "team", "videos", "faq", "articles"],
        representativeQueries: [
          "Get Novoterm's company contact details as JSON",
          "List Novoterm's industries and their FAQs",
          "Get all Novoterm articles as structured data",
        ],
        tags: ["rest-api", "openapi", "read-only", "translation"],
      }),
      entry({
        identifier: "urn:air:novoterm.se:catalog:api-catalog",
        displayName: "Novoterm API catalog (RFC 9727)",
        type: "application/linkset+json",
        url: API_CATALOG_WELL_KNOWN_URL,
        description: "RFC 9727 API catalog linking the REST API and MCP server to their descriptions, documentation and status endpoints.",
        representativeQueries: ["Which APIs does novoterm.se publish?", "Where is the OpenAPI description for Novoterm's API?"],
        tags: ["api-catalog", "rfc9727"],
      }),
      entry({
        identifier: "urn:air:novoterm.se:docs:llms-txt",
        displayName: "Novoterm llms.txt",
        type: "text/plain",
        url: abs("/llms.txt"),
        description: `Curated plain-text summary of Novoterm and its key pages for LLMs (llms.txt), with a full-content companion at ${abs("/llms-full.txt")} and per-page markdown at ${abs("/agent/md/pages.md")}.`,
        representativeQueries: ["Summarise what Novoterm Translation does", "What are Novoterm's main services and industries?"],
        tags: ["llms-txt", "documentation"],
      }),
      entry({
        identifier: "urn:air:novoterm.se:docs:agent-page",
        displayName: "Novoterm agent page",
        type: "text/html",
        url: abs("/agent"),
        description: "Machine-readable HTML page describing Novoterm for AI agents, with embedded JSON-LD (Organization, FAQPage, VideoObject) and links to every machine-readable resource.",
        representativeQueries: ["Give me a structured overview of Novoterm Translation", "Where are Novoterm's machine-readable resources?"],
        tags: ["agent-page", "json-ld"],
      }),
    ],
  };
}

/** RFC 9727 linkset. Each API is an anchor with its description, documentation and status links. */
export function buildApiCatalogLinkset() {
  return {
    linkset: [
      {
        anchor: abs("/agent/v1/index.json"),
        "service-desc": [{ href: abs("/openapi.json"), type: "application/vnd.oai.openapi+json" }],
        "service-doc": [
          { href: abs("/agent"), type: "text/html" },
          { href: abs("/llms.txt"), type: "text/plain" },
        ],
        "service-meta": [{ href: abs("/api-catalog.json"), type: "application/json" }],
        status: [{ href: abs("/agent/v1/index.json"), type: "application/json" }],
      },
      {
        anchor: abs("/mcp"),
        "service-desc": [
          { href: MCP_SERVER_CARD_URL, type: "application/json" },
          { href: abs("/mcp/tools"), type: "application/json" },
        ],
        "service-doc": [{ href: abs("/agent/mcp"), type: "text/html" }],
        status: [{ href: abs("/mcp/health"), type: "application/json" }],
      },
      {
        anchor: API_CATALOG_WELL_KNOWN_URL,
        "api-catalog": [{ href: API_CATALOG_WELL_KNOWN_URL }],
        item: [{ href: abs("/agent/v1/index.json") }, { href: abs("/mcp") }],
        related: [{ href: ARD_URL, type: "application/json" }],
      },
    ],
  };
}

export const API_CATALOG_CONTENT_TYPE = 'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"';
