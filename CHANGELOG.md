# Changelog — Novoterm Agentic Web, November 2026

| | |
|---|---|
| Version | **1.3.0** (was 1.2.0 in October 2026) |
| Site crawled | **2026-11-20** (Firecrawl batch scrape of every URL from the Firecrawl site map, the live sitemap and the October package, plus every further site link found on those pages: 241 URLs, all language versions, 0 errors) |
| Page first published | 2026-07-28 (unchanged) |
| Compared against | October 2026 package (repository root, crawled 2026-10-14, git commit `7cc9035`) |
| Pages covered | **135 Swedish URLs** (was 123) |
| Content source | Public pages on www.novoterm.se — see "Content source this month" |

Crawl scope: 241 URLs scraped — the 230 URLs in the Firecrawl site map, the live sitemap (227 unique: 141 Swedish, 86 English) and the October package, plus 11 further link targets found on those pages (redirects, two 404s and the new `/en/agent` route). English pages remain out of scope for the package, unchanged from October, by decision. (Firecrawl's own crawl job returned no pages on this site, so its batch-scrape endpoint was used on the full URL list; every page was fetched fresh, not from cache.)

All page paths below are on `https://www.novoterm.se`.

---

## Release changes beyond content (maintenance pass and external review)

| Change | Why |
|---|---|
| **Contact action off by default.** `submit_contact_inquiry` is registered only when the deployment sets `CONTACT_TOOL_ENABLED=true` (October: on unless set to `false`). | External review (Codex): the real-message action was on while its production controls D1–D3 are unfinished, and the built-in rate limits are per instance. Decision for this release: off until D1–D3 are done. **Novoterm should be told** — this reverses the October default they chose. |
| **Dependencies upgraded — `npm audit --omit=dev` 11 vulnerabilities (5 high, 6 moderate) → 0**, and `npm audit` (incl. dev) → 0. Next.js 15.5.28 → 16.4.6 (fixes the image-optimisation, Edge cookie and response-injection advisories, and bundles PostCSS 8.5.23); `mcp-handler` 1.1.0 → 2.4.0 with MCP SDK v2 (`@modelcontextprotocol/server` 2.4.0) replacing `@modelcontextprotocol/sdk` 1.26.0 (fixes the SDK advisories; drops Express and Hono, which removes the `body-parser`, `hono`, `@hono/node-server`, `qs`, `fast-uri` and `ip-address` advisories at the source); Zod 3.25 → 4.6.7 (memory-exhaustion advisory); `zod-to-json-schema` removed (Zod 4 has a built-in converter); React 19.3; the verify script uses `@modelcontextprotocol/client` 2.4.0. No advisory is accepted, so October's dispositions (pinned `mcp-handler` 1.1.0 / SDK 1.26.0, PostCSS deferred to Next 16) no longer apply. | External review (Codex): production dependency vulnerabilities. |
| **MCP server on SDK v2.** Stateless Streamable HTTP; clients negotiating 2025-03-26, 2025-06-18 and 2025-11-25 were tested (the official v2 client negotiates 2025-11-25); `mcp-handler` 2.x also serves the 2026-07-28 revision natively (per its documentation — not tested here). The HTTP+SSE transport no longer exists. Same 14 tools (13 with the contact action off), same rate limits, origin policy, CORS and 64 KB body limit. v2 answers any path it is mounted on, so the route now serves only `/mcp` (internally `/mcp/mcp`); `/mcp/<anything else>` is a 404 as before. A call to a tool that is switched off now gets a JSON-RPC "tool not found" error instead of an error result. | Required by the upgrade. |
| **New: `/.well-known/ard.json`** — Agentic Resource Discovery manifest (ARD v0.91, a proposal; also IETF draft-bu-dawn-ard-discovery-00) with 5 entries: the MCP server (`application/mcp-server-card+json` → server card), the REST API (`application/vnd.oai.openapi+json` → `/openapi.json`), the RFC 9727 API catalog, `llms.txt` and the agent page. Identifiers `urn:air:novoterm.se:<namespace>:<name>`; each entry has `displayName`, `type`, `url`, description, capabilities, 2–5 `representativeQueries`, version and `updatedAt`. Served as `application/json` (`application/ard+json` is requested in the IETF draft but not registered). No `trustManifest`/`digest`: optional in v0.91. | Requested in this maintenance pass ("ard.json"). |
| **New: `/.well-known/api-catalog`** — RFC 9727 API catalog (RFC 9264 linkset, `application/linkset+json; profile=…rfc9727`), with `HEAD` support and the `api-catalog` Link header. | Standard (IETF RFC) API discovery; the existing `/api-catalog.json` (APIs.json 0.16) stays. |
| **New: `/.well-known/mcp/server-card.json`** — MCP server card in the MCP registry `server.json` format (same values as `server.json`, kept in sync from the code) plus the live tool list. The server-card format is still a proposal (SEP-1649 named this path). | Needed as the target of the ARD MCP entry; MCP discovery. |
| **New: per-page markdown** — a clean `.md` version of every page: `https://www.novoterm.se/agent/md/<page path>.md` (homepage: `/agent/md/index.md`), 134 pages, index at `/agent/md/pages.md`. Each response is `text/markdown` with a `Link: <page URL>; rel="canonical"` header. Built from the same data and renderers as `llms-full.txt` (which stays byte-identical). `/integritetspolicy` has no markdown version (its text is not in the package data). Served under `/agent/`, which the main site already routes here. | Requested in this maintenance pass ("per-page markdown"). |
| **New: `DEPLOYMENT.md`** — build, environment variables, the main-site rewrites (three new `/.well-known/` paths must be added there), staging verification, D1–D3 before enabling the contact action, monthly refresh, rollback. | External review (Codex): staging verification; no deployment guide. |
| Discovery wiring: `llms.txt`, `ai.txt`, `/api-catalog.json` and the agent page now point to the ARD manifest, RFC 9727 catalog, MCP server card and markdown index; the agent page `<head>` carries `rel="ard"`, `rel="api-catalog"`, `rel="service-desc"` (OpenAPI) and an `llms.txt` alternate link. | So agents can find the new files from the existing entry points. |

Not added: `/.well-known/ai-catalog.json` (ARD's predecessor path — the spec says publishers should move to `ard.json` and need not serve both).

## Content source this month

`backend.novoterm.se` (the headless WordPress backend) answered every request from the build machine with a SiteGround bot challenge (`/.well-known/sgcaptcha/`, HTTP 202) on 2026-11-20, including the REST API that `scripts/refresh-content.mjs` reads. The challenge was not bypassed.

Instead, the unchanged generator was run against the WordPress data that the public site itself publishes: every page on www.novoterm.se is a statically generated Next.js page whose `__NEXT_DATA__` script contains the exact WordPress REST object it was rendered from (with all ACF fields), plus the site-wide header, footer, quote blocks, language list and video list.

- `scripts/build-public-snapshot.mjs` (new) collects those objects from the Firecrawl results into a snapshot.
- `scripts/public-pages-source.mjs` (new) answers the generator's backend requests from that snapshot.
- Two collections are not embedded in any page and were carried over from October after their text was verified against the live rendered pages: the team (9 people, `/om-oss`; names, roles, bios and quotes all match) and the article author bios (3 known authors; the one new author, Björn, read from his rendered author block).

The public `/videor/…` pages, whose VideoObject JSON-LD the generator reads, are also served from the same crawl, so every value comes from one consistent snapshot.

**Check of the method:** run with the October generator logic, every item that did not change on the live site came out **byte-for-byte identical** to the October data — 15 services, 14 of 15 industries, the 4 existing cases, 63 of 64 articles, the 15 existing videos, the team, all 20 general/homepage FAQs, the homepage/about blocks, the 44 languages, the 15 testimonials and the contact details. The only differences were the live-site changes listed below. The generator bug fixed afterwards (wrong intro text on three industry pages, see "Pages updated") then changed exactly those three items and nothing else.

Once the backend is reachable again, next month's refresh is the normal `node scripts/refresh-content.mjs`. The fallback command is:

```
node scripts/build-public-snapshot.mjs --out <snapshot.json> --firecrawl <batch.json> [<batch.json> ...]
PUBLIC_SNAPSHOT=<snapshot.json> node --import ./scripts/public-pages-source.mjs scripts/refresh-content.mjs
```

`data/novoterm-content.json` records this in `meta.source`.

---

## Pages added (12)

### Articles (7) — 64 → 71

| Page | Title | Published | Author |
|---|---|---|---|
| `/artiklar/novoterm-30-ar-bjorn-om-duvor-gruvor-och-oversattningsteknik` | Novoterm 30 år – Björn om duvor, gruvor och översättningsteknik | 2026-10-27 | Björn (new author card) |
| `/artiklar/arsredovisning-olika-typer-av-text` | En enda årsredovisning – olika typer av text | 2026-11-11 | Agnes Salomonsson Lagevald |
| `/artiklar/en-bra-oversattning-borjar-med-en-bra-originaltext` | En bra översättning börjar med en bra originaltext | 2026-11-11 | Agnes Salomonsson Lagevald |
| `/artiklar/hallbarhetsbudskap-pa-alla-sprak` | Hur ser ni till att ert hållbarhetsbudskap håller på alla språk? | 2026-11-11 | Agnes Salomonsson Lagevald |
| `/artiklar/oversattning-strategisk-fraga-forsvarsbranschen` | Därför är översättning en strategisk fråga för försvarsbranschen | 2026-11-11 | Agnes Salomonsson Lagevald |
| `/artiklar/test-fem-ai-verktyg-oversattning` | Vad händer när fem AI-verktyg får samma översättningsuppdrag? | 2026-11-11 | Mirjam Jonker |
| `/artiklar/vad-ar-shadow-translation` | Vad är shadow translation och hur kan det påverka er? | 2026-11-11 | Mirjam Jonker |

Articles with an author card: 14 → 21 (authors: 3 → 4). The Björn interview has no article summary in the CMS, so none is published for it.

### Client cases (2) — 4 → 6

| Page | Client | Industry | Published |
|---|---|---|---|
| `/kundcase/e-handel-mode-design` | Globalt företag inom e-handel, livsstil och design | E-handel, mode och design | 2026-11-16 |
| `/kundcase/true-stories-valles-varld` | True Stories (for SkiStar) | Barn- och familjeunderhållning | 2026-11-17 |

Both captured in full: hero, introduction, challenges (3 / 4), solution cards (2 / 3), results; the Valle case also has a client testimonial. The e-handel case has no "about the client" block in the CMS.

### Videos (3) — 15 → 18

| Page | Title | Duration | Related page |
|---|---|---|---|
| `/videor/ai-oversattning-fordelar-begransningar-och-mansklig-expertis` | AI-översättning – fördelar, begränsningar och mänsklig expertis | 1:05 | `/kontakta-oss` |
| `/videor/specialiserad-oversattning-av-hallbarhetsdokument` | Specialiserad översättning av hållbarhetsdokument | 1:07 | `/branscher/hallbarhet` |
| `/videor/varfor-finansoversattningar-behover-en-specialiserad-oversattare` | Varför finansöversättningar behöver en specialiserad översättare | 1:06 | `/branscher/finansiell-oversattning` |

All three with description, YouTube embed, thumbnail, duration and upload date from the page's VideoObject JSON-LD.

## Pages updated

| Page | Change |
|---|---|
| `/artiklar/novoterm-30-ar` | Edited in WordPress 2026-10-27. Article summary added ("Novoterm fyller 30 år! Från fax och pärmar till CAT-verktyg och AI …"); "fler än 40 språk" now links to `/sprak`. The live page also gained a "30 år med språk och relationer i fokus" block and two embedded interview videos — page furniture, not article text. Article text otherwise unchanged. |
| `/branscher/juridisk-oversattning` | The CMS link on "översättning" (in "Många gånger anlitar våra kunder oss för en översättning av dessa …") now points to `backend.novoterm.se/en/sprakoversattning/` — an English path, which is `/en/sprakoversattning/` on the public site and returns **404**. In October the same link pointed to `/sprakoversattning/` and was resolved to `/tjanster/oversattning`. The package now drops the dead link and keeps the text (see "Needs attention"). |
| `/branscher/it-oversattning`, `/branscher/medicinsk-oversattning`, `/branscher/teknisk-oversattning` | **Package error corrected (present since at least October).** The second intro block ("Smidiga och flexibla webb- och IT-översättningar", "Professionella medicinska översättningar på över 40 språk", "Lång erfarenhet av teknisk översättning") published five sentences about prospectus and IPO work ("Vi har gedigen erfarenhet av att arbeta med … en börsintroduktion eller nyemission …") that are not on these pages. They sit in a hidden CMS field (`content`) left over from the finance page; the site does not display that field for blocks with the image layout, but the generator published it anyway. Now only displayed text is published (`whyNovoterm` on each of the three pages). teknisk-oversattning was also edited in WordPress on 2026-11-06, with no visible text change. |

All other 120 October pages: no change. Every sentence the package publishes for its 127 service, industry, case, article, landing and video pages (4,583 sentences) was checked against the live page text and its structured data: all are on the live pages, except the author bio on one article whose live page does not display its author card (see "Needs attention"). WordPress modification dates for these pages are all before 2026-10-14.

## Pages removed

None. All 123 October pages return 200 with a self-referencing canonical and an indexable robots tag.

## Redirects changed on the live site

| URL | October | Now |
|---|---|---|
| `/videos` | 200, canonical `/videor` | **308 → `/videor`** |
| 15 × `/watch/…` | 200, canonical `/videor/…` | **308 → `/videor/…`** |

The package already used the `/videor` URLs; nothing changes in the package.

## Navigation, services, contact details, structured data

- **Services:** unchanged (15).
- **Contact details:** unchanged — Novoterm Translation AB, Kungsholms Strand 133, 112 33 Stockholm, info@novoterm.se, 08-21 17 19; Facebook and LinkedIn.
- **Navigation:** main menu unchanged (Om oss, Språktjänster, Texttyper, Branscher, Kundcase, Utforska, English, Kontakta oss). The footer links "För AI-agenter" to `/agent`, and links "Integritetspolicy" to `/Integritetspolicy` (capital I) on 137 pages, which 301-redirects to `/integritetspolicy`.
- **Structured data:** all JSON-LD on the live site parses. Articles carry `Article` + `SpeakableSpecification`, video pages `VideoObject`, service/industry/FAQ pages `FAQPage`; `/tjanster/korrekturlasning` has its own `Service` schema. October kept no copy of the live JSON-LD, so these cannot be marked new or old.
- **New live route:** `/en/agent` serves the package's agent page (canonical `/agent`) — handled by the main site's rewrite.

## Live but deliberately not added

| Page | Why |
|---|---|
| `/tjanster/oversattning-ads-page`, `/tjanster/korrekturlasning-ads` | Still `noindex, nofollow` duplicate ad landing pages — same rule as October. |
| `/event-registration`, `/newsletter-unsubscribe` | Utility pages (forms). |
| 88 English pages under `/en/` | Out of scope — English coverage kept as in October, by decision. For information: new English article `/en/articles/novoterm-30-years-diane-on-words-people-and-change` (2026-11-03); `/en/services/proofreading` (2026-11-17) and `/en/about-us` (2026-11-03) edited in WordPress. |

---

## Asset changes

All assets are generated from `data/`, so every one reflects the new content and the date 2026-11-20 automatically.

| Asset | Change |
|---|---|
| `/agent` | 7 new articles, 2 new cases (incl. testimonial), 3 new videos (+3 `VideoObject` in JSON-LD), new author; dates: published 2026-07-28, crawled/updated/verified 2026-11-20. |
| `/llms.txt` | Article Library 71, Video Highlights 18; last verified 2026-11-20. |
| `/llms-full.txt` | Full text of the 12 new pages; `novoterm-30-ar` summary and link; dead `juridisk` link removed; wrong prospectus text removed from the IT, medicinsk and teknisk intros. |
| `/ai.txt` | Last verified 2026-11-20; canonical sources add the MCP server card, ARD manifest, RFC 9727 catalog and markdown index; with the contact action off by default it now states that no actions are available. |
| `/api-catalog.json` | `modified` 2026-11-20; new entries for the markdown pages, ARD manifest, RFC 9727 catalog and MCP server card (and in `X-discovery`); MCP transport text updated for SDK v2. |
| `/mcp/tools` | `protocolVersion` 2025-11-25 plus `supportedProtocolVersions`; input schemas now generated by Zod 4 (`z.toJSONSchema`, draft-07) — same fields and limits. |
| `/.well-known/ard.json`, `/.well-known/api-catalog`, `/.well-known/mcp/server-card.json`, `/agent/md/*` | **New** — see "Release changes" above (`lib/agent/discovery.ts`, `lib/agent/markdown-pages.ts`, `app/.well-known/*`, `app/agent/md/[...path]`). |
| `app/mcp/[transport]/route.ts`, `app/mcp/tools/route.ts`, `config/features.ts`, `lib/agent/llms-full.ts` | SDK v2 / Zod 4 migration; route serves only the `mcp` segment; contact action off by default; per-page renderers exported for the markdown pages (output unchanged). |
| `package.json`, `package-lock.json`, `tsconfig.json`, `next-env.d.ts` | Upgraded dependencies (see "Release changes"); Next.js 16 set `jsx: react-jsx` and regenerated `next-env.d.ts`. |
| `scripts/verify-mcp.mjs` | Uses `@modelcontextprotocol/client` 2.4.0; new "discovery files" section (ARD entries and their URLs, RFC 9727 content type and HEAD Link, server card version, every markdown page with its canonical link); accepts SDK v2's "tool not found" error when the contact action is off. |
| `DEPLOYMENT.md` | **New.** |
| `/openapi.json` | Unchanged structure (11 paths, 24 schemas, API spec version 1.0.0 — no breaking change). |
| `/agent/v1/` REST API | `articles.json` 64 → 71, `case-studies.json` 4 → 6, `videos.json` 15 → 18; `industries.json` 15 (juridisk link and the three corrected intros); others unchanged in content (`faq.json` 123, `services.json` 15, `pages.json` 2, `team.json` 9). The MCP tools `get_industry` / `list_industries` return the corrected intros. |
| MCP server | Version 1.3.0; same 14 tools; list/search tools return the new articles, cases and videos. |
| `server.json`, `package.json`, `package-lock.json`, `lib/mcp/tools.ts` | Version 1.2.0 → 1.3.0. |
| `data/novoterm-content.json`, `data/novoterm-site-index.json` | Regenerated (`crawledAt` 2026-11-20, `meta.source` records the public-page source); site index 123 → 135 entries. |
| `scripts/build-public-snapshot.mjs`, `scripts/public-pages-source.mjs` | **New** — fallback content source when the backend API cannot be reached (see above). |
| `scripts/refresh-content.mjs` | Generator fixes: (1) industry intro blocks with the image layout no longer publish the hidden `content` field (the wrong prospectus text above); (2) a link in CMS text that is definitively gone (404/410) is now removed, keeping the link text — previously only warned and still published; (3) a video page whose VideoObject lacks `duration` or `uploadDate` is fetched again (up to 3 tries) — the live pages intermittently drop the YouTube duration, which in one test run emptied 7 of 18 durations; (4) the validator now refuses a refresh in which any video has an empty `duration` or `uploadDate`, instead of publishing it; (5) WP page slug `videor` added to the known pages (the video index page was renamed from `videos`, which produced a false "page not covered" warning); (6) `meta.source` can be set by the fallback source; header comment notes the November run. |
| `scripts/test.mjs` | 5 new offline tests: link resolution (redirect replaced, 404 removed with text kept, other failures left in place) and the validator rejecting a video without duration or upload date. |

## Sitemap coverage (https://www.novoterm.se/sitemap.xml, checked 2026-11-20)

| Group | Entries | In package |
|---|---|---|
| Swedish content pages | 135 | 135 (all) |
| Other Swedish entries (agentic files, `/videos` redirect, `/event-registration`, `/newsletter-unsubscribe`) | 6 | no — the agentic files are the package; `/videos` redirects to `/videor` (included); the other two are forms |
| English (`/en/…`) | 87 (86 unique) | no — out of scope by decision |
| **Total** | **228 entries (227 unique)** | |

The package's 135 pages and the sitemap's 135 Swedish content pages are the same set — nothing missing in either direction. Every package page was scraped and returns 200.

## Verification

- After the upgrades: `npm audit --omit=dev` and `npm audit` report 0 vulnerabilities; `tsc --noEmit` and `next build` (Next.js 16.4.6) pass — the 21 October routes plus `/.well-known/ard.json`, `/.well-known/api-catalog`, `/.well-known/mcp/server-card.json` and `/agent/md/[...path]` (135 static markdown files).
- `npm test`: all 47 offline checks pass, incl. the 5 new ones.
- `node scripts/verify-mcp.mjs http://localhost:3131` passes in **both** modes: default (contact action off: 13 tools, the action cannot be called, nothing advertises it) and `CONTACT_TOOL_ENABLED=true` (14 tools, all five contact field limits, the action advertised in ai.txt, the agent page, both catalogs, the ARD manifest and the server card). Includes the new discovery-file checks: 5 ARD entries valid and resolving, RFC 9727 catalog and HEAD Link header, server card version = `/mcp/health`, 134/134 markdown pages with canonical links.
- MCP protocol negotiation tested for 2025-03-26, 2025-06-18 and 2025-11-25; `/mcp/foo`, `/mcp/sse`, `/mcp/message` return 404; `GET /mcp` returns 405.
- `llms-full.txt` is byte-identical before and after the renderer refactor.
- Reverse text check: all 4,583 sentences the package publishes for its 127 content pages were compared with the live pages (rendered text plus structured data, since FAQ answers render collapsed); all are present except the 4-sentence author bio noted under "Needs attention".
- Output audit of the built package: no duplicate element ids or broken in-page anchors on `/agent`; its JSON-LD parses (Organization, WebPage, BreadcrumbList, FAQPage with 20 questions, 18 VideoObject); all text files are `text/plain; charset=utf-8` with no raw HTML, undecoded entities or encoding damage; all JSON endpoints parse.
- All 20 public endpoints return 200 locally (`/mcp` answers a plain GET with 405, as intended); `openapi.json` has no dangling `$ref`; health and `/mcp/tools` report version 1.3.0.
- Every site URL referenced in the generated assets (180) returns 200 on the live site, with no redirects; all 221 site links in the rendered `/agent` page are complete.
- Text-level review pass (as in October): all 813 paragraphs of the 135 live pages were compared with the generated `llms-full.txt`. Every paragraph of the 12 new pages is included. Remaining unmatched text (11 snippets) is related-article cards, two short list headings, a testimonial byline and the privacy-policy body — none of it content the package carries, same as October.
- Firecrawl API key used only for the crawl — not written to any file in this package.
- After deploying, run `node scripts/verify-mcp.mjs https://www.novoterm.se` (or the staging URL) and confirm `/agent` shows the four dates.

---

## Deployment checks (carried over from October — still open)

These remain to be done **before the contact action is switched on** (it is off by default from this release; see DEPLOYMENT.md, section 5). The backend block (below) also stopped any check of the contact form this month. Release steps, including running `verify-mcp.mjs` against staging, are in DEPLOYMENT.md, section 4.

| # | Check | Who | How |
|---|---|---|---|
| D1 | Contact delivery and response format | Novoterm developer + Novoterm (authorised test) | Confirm whether reCAPTCHA is enforced on `custom-cf7/v1/submit/321`. If it is, the developer lets requests that carry a valid `X-Novoterm-Agent-Key` header skip only the reCAPTCHA check (all other validation stays), and the same secret is set as `CONTACT_BACKEND_KEY` here. Then submit one genuine inquiry through the MCP tool. Confirm it arrives in Novoterm's inbox and that the tool reported `status: "sent"`. If it reported `unconfirmed`, record the backend's actual response body so the success check can match the real contract. |
| D2 | Production client IP | Developer | Temporarily set `HEALTH_DIAGNOSTICS_TOKEN` on this deployment. From your own machine run `curl -H "x-diagnostics-token: <token>" https://www.novoterm.se/mcp/health`: `rateLimit.clientKey` must equal your public IP, not a Vercel or main-site proxy address. Repeat with `-H "x-vercel-forwarded-for: 1.2.3.4" -H "x-forwarded-for: 1.2.3.4" -H "x-real-ip: 1.2.3.4"`; the value must not change. If either fails, set `RATE_LIMIT_IP_HEADER` to the header that carries the real visitor IP through the rewrite, redeploy, and repeat. Then remove `HEALTH_DIAGNOSTICS_TOKEN`. |
| D3 | Shared abuse protection | Developer / hosting owner | The built-in limits (100 MCP requests/min, 5 contact submissions/hour per IP, 64 KB bodies) are per server instance. Add a cross-instance limit, e.g. a Vercel Firewall rate-limit rule or a shared store (Upstash / Vercel KV). The rule must cover every route that reaches the MCP handler: `/mcp` on www.novoterm.se, the internal `/mcp/mcp` path, and this project's own deployment URL if it is publicly reachable. Any reCAPTCHA exemption from D1 depends on this. |

**The contact tool is OFF by default from this release** (October: on, by Novoterm's decision). To enable it after D1–D3, set `CONTACT_TOOL_ENABLED=true` and redeploy; to stop it again, remove the variable and redeploy.

## Configuration (environment variables on this deployment)

| Variable | Default | Purpose |
|---|---|---|
| `CONTACT_TOOL_ENABLED` | **off** (changed) | `true` registers `submit_contact_inquiry` and advertises it; anything else (or unset) leaves it unregistered and unmentioned. |
| `CONTACT_BACKEND_KEY` | none | Shared secret sent as `X-Novoterm-Agent-Key`, only to the WordPress submit route, so the backend can skip reCAPTCHA for this server alone (D1). |
| `RATE_LIMIT_IP_HEADER` | Vercel: `x-vercel-forwarded-for` | The one request header trusted for the client IP (see D2). |
| `MCP_ALLOWED_ORIGINS` | none | Extra browser origins allowed to call `/mcp`, comma-separated (novoterm.se and www.novoterm.se are always allowed). |
| `HEALTH_DIAGNOSTICS_TOKEN` | none | Temporary: lets `/mcp/health` return rate-limit diagnostics (check D2 only). |

## Needs attention

0. **Release prerequisites for this version** (DEPLOYMENT.md): (a) add rewrites on the main site for `/.well-known/ard.json`, `/.well-known/api-catalog` and `/.well-known/mcp/server-card.json` — today the main site answers these with its own 404; `/agent/md/*` needs nothing new; (b) run `node scripts/verify-mcp.mjs <staging-url>` against the real staging deployment — local runs cannot check proxy headers, environment variables, rewrites or WordPress delivery; (c) tell Novoterm the contact action now ships off; (d) ARD (v0.91) and the MCP server card are proposals — revisit both files when the specifications settle.
1. **WordPress backend blocks API access.** `backend.novoterm.se` serves a SiteGround bot challenge to the build machine for all `/wp-json/` requests. Ask the host to allowlist the build machine for `/wp-json/` (or exempt that path), so the next refresh can use the API directly. Also worth confirming that the challenge does not hit this deployment's server-side calls to the contact-form endpoint (`custom-cf7/v1/submit/321`) — if it does, `submit_contact_inquiry` will report `unconfirmed`/`rejected`, never a false success.
2. **New broken link on `/branscher/juridisk-oversattning`:** the "översättning" link points to `backend.novoterm.se/en/sprakoversattning/` (an English path on the backend host; `/en/sprakoversattning/` on the public site is 404). Intended target is most likely `/tjanster/oversattning`. Fix in WordPress; the package drops the link meanwhile.
3. **Contact form reCAPTCHA** (from October, still open): see D1.
4. **Broken links on the live site** (from October, still open):
   - `/tjanster/oversattning-ads-page` links to `/tjanster/info@novoterm.se` and `/tjanster/08-211719` (missing `mailto:` / `tel:`) → 404.
   - `/videor/oversattningar-forsvarsbranschen` links to `/branscher/forsvarsindustrin` → 404 (correct page: `/branscher/forsvarsbranschen`); the package drops that link.
   - `/artiklar/7-anledningar-att-inte-oversatta-dokument-med-google-translate` links to `/en/articles/7-reasons-not-to-use-google-to-translate-your-documents` → 404.
   - `/artiklar/oversattning-av-hr-material-har-manga-fordelar` still links to `backend.novoterm.se/personalutveckling-och-hr/` — resolved in the package to `/branscher/personalutveckling-och-hr`, but should be fixed in WordPress.
5. **Footer link `/Integritetspolicy`** (capital I) on 137 pages redirects (301) to `/integritetspolicy` — harmless, but should point to the canonical URL.
6. **English article links without `/en`:** English pages link to `/articles/…`, which redirect (308) to `/en/articles/…`.
7. **Leftover finance text in WordPress** on `it-oversattning`, `medicinsk-oversattning` and `teknisk-oversattning`: the second intro block's `content` field holds five sentences about prospectus/IPO work copied from the finance page. Not displayed on the site and no longer published by the package, but it should be cleared in WordPress — it would appear if the block's layout were ever switched to "text".
8. **Author card not displayed** on `/artiklar/oversattning-av-hallbarhetsdokumentation-tre-viktiga-faktorer`: WordPress sets Niklas Johnson as author (with the card switched on), and the package publishes that, but the live page shows no author block. Either the page or the CMS setting should be corrected.
9. **Video pages intermittently lose their duration:** during this build, 7 of the 18 `/videor/` pages served VideoObject JSON-LD without `duration` for a while, then had it again. Search engines read the same data, so Novoterm's developer should check how the site fetches YouTube details when it regenerates these pages.
10. **Words run together on `/artiklar/vad-gör-en-språkgranskare`:** the live page shows "ocksåden", "såär", "dåbland", "påderas"; the CMS text (and the package) has the spaces. Likely non-breaking spaces or markup in the CMS text that the site's renderer drops.
11. **FAQ question repeated in the agent page's FAQPage** (from October, by decision): "Vilka språk översätter ni till och från?" appears twice with two different answers (homepage and general FAQ).
12. **Sitemap anomalies** (live site): `/en` is still listed twice and `/videos` (now a redirect) is still listed. Resolved since October: `/videor` and `/artiklar/novoterm-30-ar` are now in the sitemap, and `novoterm-30-ar` is now indexable (it stays in `INCLUDE_DESPITE_NOINDEX`, which is now harmless).
