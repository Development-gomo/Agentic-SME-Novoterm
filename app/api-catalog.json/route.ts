import { contact, LAST_MODIFIED } from "@/app/agent/content";
import { SITE_ORIGIN } from "@/config/site-origin";
import { AGENT_API_BASE_URL, AGENT_API_ENDPOINTS, corsPreflight, jsonResponse } from "@/lib/agent/api";
import { SITE_CONFIG } from "@/lib/json-ld/config";

export const dynamic = "force-static";
export const OPTIONS = corsPreflight;

const abs = (path: string) => `${SITE_ORIGIN}${path}`;
const CATALOG_CREATED = "2026-07-22";
const CATALOG_URL = abs("/api-catalog.json");

export function GET() {
  const catalog = {
    name: "Novoterm — API & Machine-Readable Endpoint Catalog",
    description:
      "Machine-readable catalog of the structured resources, discovery files, agent-accessible pages, and read-only REST endpoints published by Novoterm Translation (novoterm.se). The 'apis' array follows the APIs.json 0.16 specification (apisjson.org). Intended for AI agents, LLMs, crawlers, developer tools, and API marketplaces.",
    url: CATALOG_URL,
    created: CATALOG_CREATED,
    modified: LAST_MODIFIED,
    specificationVersion: "0.16",
    tags: ["translation", "language-services", "geo", "generative-engine-optimization", "ai-agent", "llm", "machine-readable"],

    apis: [
      {
        name: "Agent Page — Machine-Readable Site Representation",
        description:
          "Primary machine-readable endpoint for AI agents and LLMs. Semantic HTML page summarizing Novoterm's services, industries, team, case studies, and FAQ. Includes an embedded JSON-LD @graph (Organization, WebPage, FAQPage, BreadcrumbList).",
        method: "GET",
        baseURL: abs("/agent"),
        humanURL: abs("/agent"),
        "X-format": "text/html",
        "X-contentType": "semantic-html",
        "X-purpose": "primary-llm-endpoint",
        tags: ["read-only", "public", "llm", "agent", "json-ld", "primary"],
      },
      {
        name: "LLMs.txt — Plain Text LLM Discovery File",
        description: "Plain text file following the llms.txt standard. A curated index of the most important Novoterm pages with short descriptions.",
        method: "GET",
        baseURL: abs("/llms.txt"),
        humanURL: abs("/llms.txt"),
        "X-format": "text/plain",
        "X-contentType": "llms-txt",
        "X-purpose": "llm-discovery",
        properties: [
          { type: "X-standard", description: "Follows the llms.txt specification.", url: "https://llmstxt.org" },
          { type: "X-full-content", description: "Full-content companion with the text of the key pages inlined.", url: abs("/llms-full.txt") },
        ],
        tags: ["read-only", "public", "discovery", "llms-txt"],
      },
      {
        name: "LLMs-Full.txt — Full-Content LLM Ingestion File",
        description:
          "The full-content companion to llms.txt: the actual text of every service, industry, case study, team bio, and FAQ, inlined so an AI system can ingest everything in a single request.",
        method: "GET",
        baseURL: abs("/llms-full.txt"),
        humanURL: abs("/llms-full.txt"),
        "X-format": "text/plain",
        "X-contentType": "llms-full-txt",
        "X-purpose": "llm-full-content",
        tags: ["read-only", "public", "discovery", "llms-full-txt"],
      },
      {
        name: "AI.txt — AI Agent Permissions File",
        description: "Plain text file declaring how AI agents and LLMs may use novoterm.se content, including citation policy and canonical machine-readable sources.",
        method: "GET",
        baseURL: abs("/ai.txt"),
        humanURL: abs("/ai.txt"),
        "X-format": "text/plain",
        "X-contentType": "ai-txt",
        "X-purpose": "agent-permissions",
        tags: ["read-only", "public", "permissions", "ai-policy"],
      },
      {
        name: "API Catalog — This File",
        description: "Self-referential entry. Machine-readable JSON catalog of every Novoterm agent-accessible endpoint, following the APIs.json 0.16 specification.",
        method: "GET",
        baseURL: CATALOG_URL,
        humanURL: CATALOG_URL,
        "X-format": "application/json",
        "X-contentType": "apis-json",
        "X-purpose": "endpoint-discovery",
        properties: [{ type: "X-standard", description: "APIs.json 0.16 specification.", url: "https://apisjson.org" }],
        tags: ["read-only", "public", "catalog", "apis-json", "self-referential"],
      },
      {
        name: "Novoterm Agent API — Read-Only REST API",
        description:
          "Read-only REST API serving clean JSON at /agent/v1/. GET endpoints return structured data for company identity, services, industries, case studies, team, and FAQ. No authentication required.",
        method: "GET",
        baseURL: AGENT_API_BASE_URL,
        humanURL: `${AGENT_API_BASE_URL}/index.json`,
        "X-format": "application/json",
        "X-contentType": "rest-api",
        "X-purpose": "programmatic-data-access",
        properties: [
          ...AGENT_API_ENDPOINTS.map((entry) => ({ type: "X-endpoint", method: entry.method, route: entry.path, description: entry.description })),
          { type: "X-openapi", description: "OpenAPI 3.0.3 specification for this REST API.", url: abs("/openapi.json") },
        ],
        tags: ["read-only", "public", "rest-api", "json", "programmatic"],
      },
      {
        name: "Novoterm MCP Server — Callable Tools for AI Agents",
        description:
          "Live Model Context Protocol (MCP) server over Streamable HTTP. Agents invoke named tools with parameters to query filtered data (services, industries, case studies, team, FAQ search) and, via submit_contact_inquiry, to submit Novoterm's real contact form on a user's explicit behalf.",
        method: "POST",
        baseURL: abs("/mcp"),
        humanURL: abs("/mcp/tools"),
        "X-format": "application/json",
        "X-contentType": "mcp-streamable-http",
        "X-purpose": "agent-callable-tools",
        properties: [
          { type: "X-mcp-transport", description: "Streamable HTTP (MCP spec 2025-03-26), stateless mode.", url: abs("/mcp") },
          { type: "X-tool-discovery", description: "GET endpoint listing every tool with its name, description, and JSON Schema.", url: abs("/mcp/tools") },
          { type: "X-health", description: "Health/uptime probe.", url: abs("/mcp/health") },
          { type: "X-standard", description: "Model Context Protocol specification.", url: "https://modelcontextprotocol.io" },
          { type: "X-action-tool", description: "submit_contact_inquiry sends a real inquiry through Novoterm's contact form — not read-only.", url: abs("/mcp/tools") },
        ],
        tags: ["mcp", "agent", "tools", "streamable-http", "interactive", "llm", "action"],
      },
      {
        name: "Robots.txt — Crawler Permissions",
        description: "Standard robots.txt with an explicit AI-crawler allowlist and a pointer to the XML sitemap.",
        method: "GET",
        baseURL: abs("/robots.txt"),
        humanURL: abs("/robots.txt"),
        "X-format": "text/plain",
        "X-contentType": "robots-txt",
        "X-purpose": "crawler-permissions",
        tags: ["read-only", "public", "robots-txt", "crawler"],
      },
      {
        name: "Contact",
        description: "Human-facing contact pathway. No general company inbox is published — the contact form is the confirmed general contact channel.",
        method: "GET",
        baseURL: contact.form.url,
        humanURL: contact.form.url,
        "X-format": "text/html",
        "X-contentType": "contact-pathway",
        "X-purpose": "human-contact",
        tags: ["read-only", "public", "contact"],
      },
    ],

    maintainers: [{ FN: `${SITE_CONFIG.name} — contact form`, url: contact.form.url }],

    "X-organization": {
      name: SITE_CONFIG.name,
      legalName: SITE_CONFIG.legalName,
      url: SITE_CONFIG.url,
      founded: SITE_CONFIG.foundingDate,
    },

    "X-discovery": {
      "agent-page": abs("/agent"),
      "llms-txt": abs("/llms.txt"),
      "llms-full-txt": abs("/llms-full.txt"),
      "ai-txt": abs("/ai.txt"),
      "rest-api": `${AGENT_API_BASE_URL}/index.json`,
      openapi: abs("/openapi.json"),
      "mcp-server": abs("/mcp"),
      "mcp-tools": abs("/mcp/tools"),
      robots: abs("/robots.txt"),
      catalog: CATALOG_URL,
    },
  };

  return jsonResponse(catalog);
}
