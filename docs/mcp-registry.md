# Publishing the Novoterm MCP server to the official registry

The live MCP server (`app/mcp/[transport]/route.ts`, advertised at
`https://www.novoterm.se/mcp`) is described for the official MCP registry
(registry.modelcontextprotocol.io) by [`server.json`](../server.json) at the
repo root.

## One-time publish

The `se.novoterm/*` namespace is a domain namespace, so publishing requires
proving ownership of `novoterm.se` (DNS or HTTP auth) — it cannot be automated
without that credential.

```bash
# 1. Install the publisher CLI
brew install mcp-publisher

# 2. Authenticate for the se.novoterm namespace (choose one)
mcp-publisher login dns  --domain novoterm.se   # add the printed TXT record
mcp-publisher login http --domain novoterm.se   # serve the printed challenge

# 3. Publish server.json from the repo root
mcp-publisher publish
```

## Notes

- `version` must be bumped on every republish (immutable once published) and
  should track `MCP_SERVER_VERSION` in `lib/mcp/tools.ts`.
- The remote `url` must stay on `novoterm.se` (or a subdomain) for the
  `se.novoterm` namespace to validate.
- This is optional — the MCP server works over Streamable HTTP without
  registry listing. Registry publication is purely a discovery/distribution
  channel for MCP clients that browse the registry.
