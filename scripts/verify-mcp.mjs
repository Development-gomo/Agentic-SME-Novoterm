import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";

/**
 * End-to-end check of a running deployment: MCP handshake, tool discovery,
 * the well-known discovery files and per-page markdown,
 * real read-only tool calls, the origin policy, and the self-contained
 * /agent/v1/schema.json. Every check is an assertion; the script exits 1 on
 * the first failure.
 *
 * Offline logic (text conversion, refresh validation, contact response
 * handling) is covered separately by `npm test`.
 *
 * Usage: node scripts/verify-mcp.mjs [baseUrl]
 *   baseUrl defaults to $VERIFY_BASE_URL, then http://localhost:3131
 *   (e.g. a staging URL, or https://www.novoterm.se after deploying).
 *
 * submit_contact_inquiry is deliberately never called: it sends a real
 * inquiry to Novoterm's team. Verify it manually with one genuine submission.
 */

const BASE_URL = (process.argv[2] || process.env.VERIFY_BASE_URL || "http://localhost:3131").replace(/\/$/, "");
const SERVER_URL = `${BASE_URL}/mcp`;

const READ_ONLY_TOOLS = [
  "get_company", "list_services", "get_service", "list_industries", "get_industry",
  "list_case_studies", "get_case_study", "list_team", "list_pages", "list_videos",
  "search_faq", "search_articles", "get_article",
];
const CONTACT_TOOL = "submit_contact_inquiry";

function assert(condition, message) {
  if (!condition) throw new Error(`ASSERTION FAILED: ${message}`);
  console.log(`  ok - ${message}`);
}

async function callJson(client, name, args = {}) {
  const result = await client.callTool({ name, arguments: args });
  assert(!result.isError, `${name} returns a result`);
  return JSON.parse(result.content[0].text);
}

async function checkOriginPolicy() {
  console.log("\n--- origin policy and CORS ---");
  const init = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "verify", version: "1.0.0" } },
  };
  const res = await fetch(SERVER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      Origin: "https://untrusted.example",
    },
    body: JSON.stringify(init),
  });
  assert(res.status === 403, `request from an untrusted Origin is rejected (got HTTP ${res.status})`);

  // An approved browser origin gets a usable CORS preflight and response.
  const allowed = new URL(BASE_URL).origin === "https://www.novoterm.se" ? "https://novoterm.se" : "https://www.novoterm.se";
  const pre = await fetch(SERVER_URL, {
    method: "OPTIONS",
    headers: { Origin: allowed, "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "content-type, mcp-session-id" },
  });
  assert(pre.status === 204 && pre.headers.get("access-control-allow-origin") === allowed, `preflight from ${allowed} is allowed`);
  assert(/mcp-session-id/i.test(pre.headers.get("access-control-allow-headers") ?? ""), "preflight allows the Mcp-Session-Id header");
  const post = await fetch(SERVER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", Origin: allowed },
    body: JSON.stringify(init),
  });
  assert(post.ok && post.headers.get("access-control-allow-origin") === allowed, "POST from an allowed origin carries Access-Control-Allow-Origin");
}

async function checkBodyLimit() {
  console.log("\n--- request size limit ---");
  // Streamed (chunked) body with no Content-Length header: the limit must count received bytes.
  const padding = "x".repeat(70_000);
  const payload = new TextEncoder().encode(JSON.stringify({ jsonrpc: "2.0", id: 9, method: "tools/list", pad: padding }));
  const stream = new ReadableStream({
    start(controller) {
      for (let i = 0; i < payload.length; i += 8192) controller.enqueue(payload.slice(i, i + 8192));
      controller.close();
    },
  });
  const res = await fetch(SERVER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
    body: stream,
    duplex: "half",
  });
  assert(res.status === 413, `70 KB chunked body without Content-Length is rejected (got HTTP ${res.status})`);
}

async function checkSchemaDocument() {
  console.log("\n--- /agent/v1/schema.json ---");
  const res = await fetch(`${BASE_URL}/agent/v1/schema.json`);
  assert(res.ok, `schema.json responds (HTTP ${res.status})`);
  const text = await res.text();
  assert(!text.includes('"$ref"'), "schema.json has no unresolved $ref");
  const doc = JSON.parse(text);
  assert(doc.data.endpoints.every((e) => e.schema), "every endpoint has an inline schema");
}

/** Discovery files added Nov 2026: ARD manifest, RFC 9727 API catalog, MCP server card, per-page markdown. */
async function checkDiscoveryFiles(contactEnabled) {
  console.log("\n--- discovery files ---");
  const local = (u) => u.replace("https://www.novoterm.se", BASE_URL);

  const ardRes = await fetch(`${BASE_URL}/.well-known/ard.json`);
  assert(ardRes.status === 200, `/.well-known/ard.json responds (HTTP ${ardRes.status})`);
  const ard = await ardRes.json();
  assert(Array.isArray(ard.entries) && ard.entries.length > 0, `ard.json has entries (${ard.entries?.length})`);
  for (const e of ard.entries) {
    assert(/^urn:air:novoterm\.se:/.test(e.identifier) && e.displayName && e.type && !!e.url !== !!e.data, `ARD entry ${e.identifier} has identifier, displayName, type and exactly one of url/data`);
    if (e.url) {
      const r = await fetch(local(e.url));
      assert(r.status === 200, `ARD entry ${e.identifier} url resolves (HTTP ${r.status})`);
    }
  }
  const mcpEntry = ard.entries.find((e) => e.type === "application/mcp-server-card+json");
  assert(mcpEntry?.capabilities?.includes(CONTACT_TOOL) === contactEnabled, `ARD MCP entry lists ${CONTACT_TOOL} only when it is enabled`);

  const ac = await fetch(`${BASE_URL}/.well-known/api-catalog`);
  assert(ac.status === 200 && /application\/linkset\+json/.test(ac.headers.get("content-type") ?? ""), "/.well-known/api-catalog is an application/linkset+json document");
  const head = await fetch(`${BASE_URL}/.well-known/api-catalog`, { method: "HEAD" });
  assert(head.status === 200 && /rel="api-catalog"/.test(head.headers.get("link") ?? ""), "HEAD /.well-known/api-catalog returns an api-catalog Link header (RFC 9727)");

  const card = await (await fetch(`${BASE_URL}/.well-known/mcp/server-card.json`)).json();
  const health = await (await fetch(`${BASE_URL}/mcp/health`)).json();
  assert(card.version === health.version && card.remotes?.[0]?.url?.endsWith("/mcp"), `MCP server card version (${card.version}) matches /mcp/health and points to /mcp`);

  const index = await fetch(`${BASE_URL}/agent/md/pages.md`);
  const indexText = await index.text();
  assert(index.status === 200 && /text\/markdown/.test(index.headers.get("content-type") ?? ""), "/agent/md/pages.md is served as text/markdown");
  const links = [...indexText.matchAll(/\]\((https:\/\/www\.novoterm\.se\/agent\/md\/[^)]+)\)/g)].map((m) => m[1]);
  let okCount = 0;
  for (const u of links) {
    const r = await fetch(local(u));
    if (r.status === 200 && /rel="canonical"/.test(r.headers.get("link") ?? "")) okCount++;
  }
  assert(links.length > 100 && okCount === links.length, `every markdown page listed in pages.md responds with a canonical link (${okCount}/${links.length})`);

  // Added in v1.4.0: MCP documentation page and the Swedish-only language markers.
  const docs = await fetch(`${BASE_URL}/agent/mcp`);
  const docsText = await docs.text();
  const toolsList = (await (await fetch(`${BASE_URL}/mcp/tools`)).json()).tools.map((t) => t.name);
  assert(docs.status === 200 && toolsList.every((n) => docsText.includes(`tool-${n}`)), `/agent/mcp documents every tool (${toolsList.length})`);
  assert(/Authentication: <strong>none<\/strong>/.test(docsText), "/agent/mcp states that no authentication is needed");
  const api = await fetch(`${BASE_URL}/agent/v1/services.json`);
  const apiJson = await api.json();
  assert(apiJson.language === "sv-SE" && api.headers.get("content-language") === "sv", "/agent/v1 responses are marked Swedish (language field and Content-Language header)");
  const link = (await fetch(`${BASE_URL}/agent`)).headers.get("link") ?? "";
  assert(/rel="api-catalog"/.test(link) && /rel="service-desc"/.test(link), "/agent sends a Link header to the API catalog and OpenAPI description");
}

async function main() {
  console.log(`Target: ${BASE_URL}`);
  const health = await (await fetch(`${BASE_URL}/mcp/health`)).json();
  assert(health.status === "ok", "health endpoint is ok");
  assert(!("rateLimit" in health), "health returns no rate-limit diagnostics without the token");
  const contactEnabled = health.contact_tool_enabled === true;
  console.log(`  (contact tool ${contactEnabled ? "ENABLED" : "disabled"} on this deployment)`);
  const transport = new StreamableHTTPClientTransport(new URL(SERVER_URL));
  const client = new Client({ name: "novoterm-verification-client", version: "1.0.0" });

  console.log("\n--- handshake ---");
  await client.connect(transport);
  assert(client.getServerVersion()?.name === "novoterm", "server identifies as novoterm");

  console.log("\n--- tools/list ---");
  const { tools } = await client.listTools();
  const names = tools.map((t) => t.name);
  for (const name of READ_ONLY_TOOLS) assert(names.includes(name), `tool ${name} is listed`);
  assert(names.includes(CONTACT_TOOL) === contactEnabled, `${CONTACT_TOOL} is ${contactEnabled ? "listed" : "not listed"}, matching the switch`);
  assert(tools.length === READ_ONLY_TOOLS.length + (contactEnabled ? 1 : 0), `exactly ${tools.length} tools, no unexpected ones`);
  if (contactEnabled) {
    const contactTool = tools.find((t) => t.name === CONTACT_TOOL);
    assert(contactTool.annotations?.readOnlyHint === false, `${CONTACT_TOOL} is marked not read-only`);
    // Field limits are part of the tool's input schema, so the SDK enforces them before the handler runs.
    const props = contactTool.inputSchema.properties;
    for (const [field, max] of Object.entries({ fullName: 200, email: 254, phone: 40, companyName: 200, message: 5000 })) {
      assert(props[field]?.maxLength === max, `${CONTACT_TOOL}.${field} has maxLength ${max}`);
    }
  }
  for (const t of tools.filter((t) => t.name !== CONTACT_TOOL)) {
    assert(t.annotations?.readOnlyHint === true, `${t.name} is marked read-only`);
  }

  console.log("\n--- read-only tool calls ---");
  const company = await callJson(client, "get_company");
  assert(company.name && company.about?.ceo?.name, "get_company has name and CEO");
  assert(company.address?.postalCode && company.contact?.email?.address, "get_company has address and email");
  const service = await callJson(client, "get_service", { slug: "premiumoversattning" });
  assert(service.benefits.length > 0 && service.process.length > 0, "get_service returns benefits and process");
  const pages = await callJson(client, "list_pages");
  assert(pages.count > 0, `list_pages returns pages (${pages.count})`);
  const videos = await callJson(client, "list_videos");
  assert(videos.count > 0 && videos.videos.every((v) => v.description), `list_videos returns described videos (${videos.count})`);
  const faq = await callJson(client, "search_faq", { query: "översätt" });
  assert(faq.count > 0, `search_faq finds matches (${faq.count})`);

  console.log("\n--- error handling ---");
  const bad = await client.callTool({ name: "get_service", arguments: { slug: "does-not-exist" } });
  assert(bad.isError === true, "unknown slug returns isError");
  // Input-validation failures come back as isError results, not protocol errors.
  const missing = await client.callTool({ name: "get_service", arguments: {} });
  assert(missing.isError === true, "missing required argument is rejected");
  // The email is invalid too, so even a server without length limits rejects
  // this call before it can reach the real contact form.
  // With the tool switched off, MCP SDK v2 answers a call to an unregistered
  // tool with a JSON-RPC error (thrown by the client) rather than an isError
  // result; either way the call must not succeed.
  let rejected;
  try {
    const invalid = await client.callTool({
      name: "submit_contact_inquiry",
      arguments: { fullName: "x".repeat(500), email: "not-an-email", phone: "1", serviceArea: "other", inquiryType: "private" },
    });
    rejected = invalid.isError === true;
  } catch (err) {
    rejected = !contactEnabled && /not found|unknown tool/i.test(String(err?.message ?? err));
  }
  assert(
    rejected,
    contactEnabled ? "invalid / over-long contact input is rejected before any submission" : `${CONTACT_TOOL} cannot be called while switched off`,
  );

  await client.close();

  await checkOriginPolicy();
  await checkBodyLimit();
  await checkSchemaDocument();
  await checkDiscoveryFiles(contactEnabled);

  console.log("\nAll checks passed.");
}

main().catch((err) => {
  console.error("VERIFICATION FAILED:", err.message ?? err);
  process.exit(1);
});
