import type { Metadata } from "next";
import { z } from "zod";
import { LAST_MODIFIED } from "@/app/agent/content";
import { CONTACT_TOOL_ENABLED, CONTACT_TOOL_NAME } from "@/config/features";
import { SITE_ORIGIN } from "@/config/site-origin";
import { STYLE } from "@/lib/agent/page-style";
import {
  MCP_CONTACT_LIMIT_MAX_REQUESTS,
  MCP_MAX_BODY_BYTES,
  MCP_RATE_LIMIT_MAX_REQUESTS,
  MCP_RATE_LIMIT_WINDOW_MS,
} from "@/lib/mcp/limits";
import { MCP_SERVER_NAME, MCP_SERVER_VERSION, mcpTools } from "@/lib/mcp/tools";

/**
 * Human- and agent-readable documentation of the MCP server: endpoint,
 * transport, authentication (none), limits, every tool with its parameters,
 * and copy-paste example calls. Generated from the same tool registry and
 * limits the server uses, so it cannot drift from what /mcp actually does.
 */

const PAGE_URL = `${SITE_ORIGIN}/agent/mcp`;
const MCP_URL = `${SITE_ORIGIN}/mcp`;
const PROTOCOL = "2025-11-25";
const TITLE = "Novoterm MCP server — tools, example calls and limits";
const DESCRIPTION =
  "How to connect to Novoterm Translation's public MCP server: endpoint, Streamable HTTP transport, no authentication, rate limits, every tool with its parameters, and example calls.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  openGraph: { title: TITLE, description: DESCRIPTION, url: PAGE_URL },
  other: { "last-modified": LAST_MODIFIED },
};

type Param = { name: string; type: string; required: boolean; description: string };

function toolParams(shape: z.ZodRawShape): Param[] {
  const schema = z.toJSONSchema(z.object(shape), { io: "input" }) as {
    properties?: Record<string, { type?: string | string[]; enum?: unknown[]; description?: string; maxLength?: number }>;
    required?: string[];
  };
  return Object.entries(schema.properties ?? {}).map(([name, p]) => ({
    name,
    type: p.enum ? `one of: ${p.enum.join(", ")}` : `${[].concat((p.type ?? "any") as never).join(" | ")}${p.maxLength ? ` (max ${p.maxLength} chars)` : ""}`,
    required: (schema.required ?? []).includes(name),
    description: p.description ?? "",
  }));
}

const curl = (body: object, protocolHeader = true) =>
  [
    `curl -s ${MCP_URL} \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -H "Accept: application/json, text/event-stream" \\`,
    ...(protocolHeader ? [`  -H "MCP-Protocol-Version: ${PROTOCOL}" \\`] : []),
    `  -d '${JSON.stringify(body)}'`,
  ].join("\n");

const EXAMPLES: { title: string; code: string }[] = [
  {
    title: "1. Initialize (optional for stateless use, but tells you the server name, version and protocol)",
    code: curl(
      { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: PROTOCOL, capabilities: {}, clientInfo: { name: "example-client", version: "1.0.0" } } },
      false,
    ),
  },
  { title: "2. List the tools", code: curl({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }) },
  {
    title: "3. Call a tool — the translation service page",
    code: curl({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "get_service", arguments: { slug: "oversattning" } } }),
  },
  {
    title: "4. Call a tool — search the article library",
    // ASCII keyword on purpose: some shells (e.g. Windows) do not send å/ä/ö in curl -d as UTF-8.
    // Swedish keywords work fine from MCP clients, e.g. "AI-översättning".
    code: curl({ jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "search_articles", arguments: { query: "transcreation" } } }),
  },
];

const CLIENT_CONFIG = JSON.stringify({ mcpServers: { novoterm: { type: "http", url: MCP_URL } } }, null, 2);

const codeStyle = { background: "var(--bg-alt)", border: "1px solid var(--border)", padding: "1rem", overflowX: "auto" as const, whiteSpace: "pre" as const, margin: ".5rem 0 1rem" };

export default function McpDocsPage() {
  const tools = mcpTools.map((t) => ({ ...t, params: toolParams(t.inputSchema) }));
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />
      <h1>Novoterm MCP server</h1>
      <p>{DESCRIPTION}</p>
      <p>
        Back to the <a href={`${SITE_ORIGIN}/agent`}>agent page</a>. Last verified: <time dateTime={LAST_MODIFIED}>{LAST_MODIFIED}</time>.
      </p>

      <section id="overview">
        <h2>Overview</h2>
        <ul>
          <li>Endpoint: <a href={MCP_URL}>{MCP_URL}</a> (POST JSON-RPC; a plain GET answers 405)</li>
          <li>Transport: Streamable HTTP, stateless — no session to open or close</li>
          <li>Protocol versions: 2025-03-26, 2025-06-18 and 2025-11-25 through the initialize handshake; the 2026-07-28 revision is also served</li>
          <li>Authentication: <strong>none</strong> — the server is public and every read tool is anonymous</li>
          <li>Server: {MCP_SERVER_NAME} {MCP_SERVER_VERSION}, {tools.length} tools</li>
          <li>Content language: Swedish (sv-SE) — tools return the Swedish site&apos;s content; the English site under /en/ is a partial mirror and is not covered</li>
          <li>
            Contact action:{" "}
            {CONTACT_TOOL_ENABLED
              ? `${CONTACT_TOOL_NAME} is enabled — it submits Novoterm's real contact form, so call it only when the user has explicitly asked and supplied their own details.`
              : "none on this deployment — every tool is read-only. To contact Novoterm, give the user info@novoterm.se, 08-21 17 19 or https://www.novoterm.se/kontakta-oss."}
          </li>
        </ul>
      </section>

      <section id="connect">
        <h2>Connect</h2>
        <p>Most MCP clients accept a remote server by URL. A typical configuration:</p>
        <pre style={codeStyle}>{CLIENT_CONFIG}</pre>
        <p>Or call it directly over HTTP:</p>
        {EXAMPLES.map((e) => (
          <div key={e.title}>
            <h3>{e.title}</h3>
            <pre style={codeStyle}>{e.code}</pre>
          </div>
        ))}
        <p>
          Results come back as JSON-RPC; each tool result&apos;s <code>content[0].text</code> holds JSON. An unknown slug or a missing
          argument returns a result with <code>isError: true</code>; an unknown tool name returns a JSON-RPC error.
        </p>
      </section>

      <section id="limits">
        <h2>Limits</h2>
        <ul>
          <li>
            {MCP_RATE_LIMIT_MAX_REQUESTS} requests per {MCP_RATE_LIMIT_WINDOW_MS / 1000} seconds per client IP — over the limit you get HTTP 429 with{" "}
            <code>Retry-After</code>; every response carries <code>RateLimit-Limit</code>, <code>RateLimit-Remaining</code> and <code>RateLimit-Reset</code>
          </li>
          <li>Request body: at most {MCP_MAX_BODY_BYTES / 1024} KB (HTTP 413 above that)</li>
          {CONTACT_TOOL_ENABLED && (
            <li>
              {CONTACT_TOOL_NAME}: at most {MCP_CONTACT_LIMIT_MAX_REQUESTS} submissions per hour per client IP
            </li>
          )}
          <li>
            Browser requests are accepted only from novoterm.se origins (other <code>Origin</code> headers get HTTP 403); server-side clients send no
            Origin and are unaffected
          </li>
        </ul>
      </section>

      <section id="tools">
        <h2>Tools ({tools.length})</h2>
        {tools.map((t) => (
          <article key={t.name} id={`tool-${t.name}`}>
            <h3>
              {t.name} — {t.title}
            </h3>
            <p>
              {t.annotations?.readOnlyHint ? "Read-only." : "Action (not read-only)."} {t.description}
            </p>
            {t.params.length ? (
              <ul>
                {t.params.map((p) => (
                  <li key={p.name}>
                    <code>{p.name}</code> ({p.type}
                    {p.required ? ", required" : ", optional"}){p.description ? ` — ${p.description}` : ""}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No parameters.</p>
            )}
          </article>
        ))}
      </section>

      <section id="discovery">
        <h2>Machine-readable descriptions</h2>
        <ul>
          <li>
            <a href={`${SITE_ORIGIN}/mcp/tools`}>/mcp/tools</a> — every tool with its JSON Schema
          </li>
          <li>
            <a href={`${SITE_ORIGIN}/.well-known/mcp/server-card.json`}>/.well-known/mcp/server-card.json</a> — MCP server card
          </li>
          <li>
            <a href={`${SITE_ORIGIN}/mcp/health`}>/mcp/health</a> — status, version and tool count
          </li>
          <li>
            <a href={`${SITE_ORIGIN}/.well-known/ard.json`}>/.well-known/ard.json</a> — Agentic Resource Discovery manifest
          </li>
          <li>
            <a href={`${SITE_ORIGIN}/openapi.json`}>/openapi.json</a> — the same data as a read-only REST API
          </li>
        </ul>
      </section>
    </>
  );
}
