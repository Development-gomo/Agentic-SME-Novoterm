# Deployment — Novoterm Agentic Web (v1.3.0, November 2026)

This package is a standalone Next.js app (Next.js 16, Node.js ≥ 20.9) deployed on Vercel. Visitors and agents reach it through rewrites on the main site, www.novoterm.se, which is a separate headless-WordPress + Next.js app. Nothing here changes the main site's own pages.

## 1. Build and run

```
npm ci
npm test                 # 47 offline checks, no network calls to Novoterm, never sends a contact inquiry
npm run build
npm start                # local: next start -p 3131
```

`npm audit --omit=dev` must report 0 vulnerabilities (it did on 2026-11-20).

## 2. Environment variables (set on this deployment, not on the main site)

| Variable | Default | When to set it |
|---|---|---|
| `CONTACT_TOOL_ENABLED` | **off** | Set to `true` only after checks D1–D3 (section 5). Off: the `submit_contact_inquiry` MCP action is not registered and nothing advertises it. Read at build time — redeploy after changing it. |
| `CONTACT_BACKEND_KEY` | none | D1: shared secret sent as `X-Novoterm-Agent-Key`, only to the WordPress contact-form submit route, so WordPress can skip reCAPTCHA for this server alone. Must match the value configured in WordPress. |
| `RATE_LIMIT_IP_HEADER` | Vercel: `x-vercel-forwarded-for` | D2: the one request header trusted for the client IP. |
| `MCP_ALLOWED_ORIGINS` | none | Extra browser origins allowed to call `/mcp`, comma-separated (novoterm.se and www.novoterm.se are always allowed). |
| `HEALTH_DIAGNOSTICS_TOKEN` | none | Temporary, D2 only: lets `/mcp/health` return rate-limit diagnostics to callers that send it in `x-diagnostics-token`. Remove afterwards. |

## 3. Rewrites on the main site (www.novoterm.se → this deployment)

Already in place (checked 2026-11-20 — unknown paths under these return this app's own 404):

| Path on www.novoterm.se | Notes |
|---|---|
| `/agent` and `/agent/:path*` | Agent page, `/agent/v1/*` REST API, and the new **`/agent/md/*` markdown pages** — no change needed for these. |
| `/llms.txt`, `/llms-full.txt`, `/ai.txt`, `/api-catalog.json`, `/openapi.json` | |
| `/mcp`, `/mcp/:path*` | This app rewrites `/mcp` to its internal `/mcp/mcp`. |

**New in v1.3.0 — must be added on the main site** (today these return the main site's 404):

| Path | Rewrite to this deployment's same path |
|---|---|
| `/.well-known/ard.json` | ARD manifest |
| `/.well-known/api-catalog` | RFC 9727 API catalog (also answers `HEAD`) |
| `/.well-known/mcp/server-card.json` | MCP server card |

Make sure the main site's own `/.well-known/*` handling (if any) does not take precedence over these three paths.

Recommended on the main site (optional, improves discovery), in the `<head>` of every page:

```html
<link rel="ard" type="application/ard+json" href="https://www.novoterm.se/.well-known/ard.json">
<link rel="api-catalog" href="https://www.novoterm.se/.well-known/api-catalog">
```

The main site's robots.txt already carries the `LLM-Readable`, `LLM-Text`, `LLM-Full` and `Sitemap` lines; the package's own `public/robots.txt` is not what www.novoterm.se serves.

## 4. Release steps

1. Deploy to **staging** with `CONTACT_TOOL_ENABLED` unset (off).
2. Run against the staging URL — local runs cannot test proxy headers, environment configuration, the main-site rewrites or WordPress delivery:
   ```
   node scripts/verify-mcp.mjs https://<staging-url>
   ```
   It checks the MCP handshake, all tools and their read-only flags, real tool calls, error handling, origin policy and CORS, the 64 KB body limit, the schema document, the ARD manifest, the RFC 9727 catalog, the MCP server card and every markdown page. It never sends a contact inquiry.
3. Check through the main domain that the three new `/.well-known/` rewrites are live (each should return JSON, not the main site's 404).
4. Promote to **production** and run `node scripts/verify-mcp.mjs https://www.novoterm.se`.
5. Open https://www.novoterm.se/agent and confirm the four dates (published 2026-07-28, crawled/updated/verified 2026-11-20).

## 5. Before enabling the contact action (D1–D3)

| # | Check | Who |
|---|---|---|
| D1 | Contact delivery and response format. Confirm whether reCAPTCHA is enforced on `custom-cf7/v1/submit/321`. If it is, WordPress lets requests carrying a valid `X-Novoterm-Agent-Key` skip only the reCAPTCHA check, and the same secret is set as `CONTACT_BACKEND_KEY`. Then one authorised, genuine submission through the MCP tool: it must arrive in Novoterm's inbox and the tool must report `status: "sent"`. If it reports `unconfirmed`, record the backend's response body so the success check can be matched to the real contract. | Novoterm's developer + Novoterm |
| D2 | Real client IP. With `HEALTH_DIAGNOSTICS_TOKEN` set temporarily, `curl -H "x-diagnostics-token: <token>" https://www.novoterm.se/mcp/health` must show your own public IP in `rateLimit.clientKey`, unchanged when you add spoofed `x-vercel-forwarded-for`, `x-forwarded-for` and `x-real-ip` headers. Otherwise set `RATE_LIMIT_IP_HEADER`, redeploy and repeat. Then remove the token. | Developer |
| D3 | Shared abuse protection. The built-in limits (100 MCP requests/min and 5 contact submissions/hour per IP, 64 KB bodies) are per server instance and do not protect a serverless fleet. Add a cross-instance limit — a Vercel Firewall rate-limit rule or a shared store (Upstash / Vercel KV) — covering `/mcp` on www.novoterm.se, the internal `/mcp/mcp` path, and this project's own deployment URL if it is publicly reachable. | Developer / hosting owner |

Then set `CONTACT_TOOL_ENABLED=true`, redeploy, and run `verify-mcp.mjs` again: it detects the mode from `/mcp/health` and also checks the contact tool's field limits.

Emergency off: remove the variable (or set anything other than `true`) and redeploy.

## 6. Monthly content refresh

Normal (WordPress REST API reachable):

```
node scripts/refresh-content.mjs
```

Fallback when `backend.novoterm.se` cannot be reached (November 2026: SiteGround bot challenge) — needs a Firecrawl batch-scrape of every Swedish page (rendered text plus raw HTML):

```
node scripts/build-public-snapshot.mjs --out <snapshot.json> --firecrawl <batch.json> [<batch.json> ...]
PUBLIC_SNAPSHOT=<snapshot.json> node --import ./scripts/public-pages-source.mjs scripts/refresh-content.mjs
```

Either way the generator validates the result and refuses to write data that lost content; then build, test and verify as above, and release as a new version folder with its CHANGELOG.

## 7. Rollback

Redeploy the previous version (October 2026 package, v1.2.0). The new `/.well-known/` rewrites can stay: they will simply return 404 from the older deployment.
