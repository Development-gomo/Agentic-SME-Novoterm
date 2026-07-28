/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // Advertised endpoint is /mcp; the route lives at app/mcp/[transport]/route.ts
      // so mcp-handler's Streamable HTTP transport resolves to /mcp/mcp internally.
      { source: "/mcp", destination: "/mcp/mcp" },
    ];
  },
};

export default nextConfig;
