/** @type {import('next').NextConfig} */

// RFC 8288 Link header pointing agents to the RFC 9727 API catalog, the
// OpenAPI description and the ARD manifest. www.novoterm.se sets the same
// header on its own pages; responses proxied from here keep this deployment's
// headers, so it is set here too. Not applied to /agent/md/* (each page sends
// its own canonical Link) or /.well-known/api-catalog (sends its own Link).
const DISCOVERY_LINK = [
  '<https://www.novoterm.se/.well-known/api-catalog>; rel="api-catalog"',
  '<https://www.novoterm.se/openapi.json>; rel="service-desc"; type="application/vnd.oai.openapi+json"',
  '<https://www.novoterm.se/.well-known/ard.json>; rel="ard"; type="application/json"',
].join(", ");

const LINK_HEADER_PATHS = [
  "/agent",
  "/agent/mcp",
  "/agent/v1/:file*",
  "/llms.txt",
  "/llms-full.txt",
  "/ai.txt",
  "/api-catalog.json",
  "/openapi.json",
  "/mcp/tools",
  "/mcp/health",
  "/.well-known/ard.json",
  "/.well-known/mcp/server-card.json",
];

const nextConfig = {
  async rewrites() {
    return [
      // Advertised endpoint is /mcp; the route lives at app/mcp/[transport]/route.ts
      // so mcp-handler's Streamable HTTP transport resolves to /mcp/mcp internally.
      { source: "/mcp", destination: "/mcp/mcp" },
    ];
  },
  async headers() {
    return LINK_HEADER_PATHS.map((source) => ({ source, headers: [{ key: "Link", value: DISCOVERY_LINK }] }));
  },
};

export default nextConfig;
