# Changelog — Novoterm Agentic Web, October 2026

| | |
|---|---|
| Version | **1.2.0** (was 1.1.0 in September 2026) |
| Site crawled | **2026-10-14** (Firecrawl full crawl of all language versions + WordPress REST refresh) |
| Page first published | 2026-07-28 (unchanged) |
| Compared against | `Versions/Sept 2026` (crawled 2026-09-15, git commit `b478f04`) |
| Pages covered | 123 Swedish URLs (was 117) |

Crawl scope: 242 live URLs crawled — 148 Swedish, 84 English, 10 other (machine-readable files such as `/llms.txt`). English pages remain out of scope for the package, unchanged from September, by decision.

All page paths below are on `https://www.novoterm.se`.

---

## Pages added

| Page | Why |
|---|---|
| `/sprak` | Languages page ("Översättning till fler än 40 språk"). Full content added as a landing page, incl. 5 new FAQs and the complete list of 44 languages. |
| `/produktions-byraer-kommunikations-byraer` | New landing page for production and communications agencies (created 2026-09-17). Full content added as a landing page. |
| `/kundcase` | Client case index — existed but was not listed in the site index. |
| `/artiklar` | Article library index — existed but was not listed in the site index. |
| `/videor` | Video index — replaces `/videos` (now canonicalised to `/videor`). |
| `/integritetspolicy` | Privacy policy — linked from the site footer, not previously listed. |
| `/artiklar/novoterm-30-ar` | New article "Novoterm fyller jämnt – 30 år av språkglädje och utveckling" (published 2026-09-15). Included by explicit decision although the live page is `noindex, nofollow` (see "Needs attention"). Text taken from WordPress and checked paragraph by paragraph against the live page. Articles: 63 → 64. |
| 15 × `/videor/…` | Video pages at their new canonical URLs (see "Pages moved" below). |

## Pages updated

| Page | Change |
|---|---|
| `/branscher/teknisk-oversattning` | Intro text edited ("Läs mer om webb- och it-översättning här."). |
| `/kontakta-oss` and site-wide footer | General contact details now published on every page: **Novoterm Translation AB, Kungsholms Strand 133, 112 33 Stockholm, info@novoterm.se, 08-21 17 19**. The package previously stated no general inbox existed — corrected everywhere. |
| `/kontakta-oss` (contact form) | Form now contains a reCAPTCHA field — see "Needs attention". |
| `/branscher/it-oversattning`, `/teknisk-oversattning`, `/juridisk-oversattning`, `/medicinsk-oversattning`, `/finansiell-oversattning`, `/hallbarhet`, `/bygg-och-konstruktion`, `/marknadsforings-och-pr` | Industry FAQ sections ("Frågor & svar") — **30 FAQs** now captured (IT 5, teknisk 7, juridisk 4, medicinsk 4, finansiell 4, hållbarhet 2, bygg 2, marknadsföring 2). Six of these pages were edited in WordPress on 2026-09-16–18, after the September crawl; bygg and marknadsföring were last edited 2026-09-14, so their FAQs were already live in September and were missed then. Found in the review pass. |

Also edited in WordPress after 2026-09-15 (current content fully included; no separate change to report): industries `personalutveckling-och-hr`, `fysisk-och-digital-sakerhet`; articles `kulturell-medvetenhet-varumarke`, `specialiserad-oversattning-av-hallbarhetsdokument`, `oversattning-av-marknadsforingstexter-en-konst-med-manga-fallgropar`, `oversattning-av-hallbarhetsdokumentation-tre-viktiga-faktorer`, `oversattning-finska-till-svenska-och-vice-versa`.

## Content captured in the review pass

A second, text-level check compared every paragraph of the 123 packaged pages on the live site (1,522 paragraphs) with the generated `llms-full.txt`. It found live content the generator had never extracted — most of it already missing in September. All of it is now included and refreshes automatically:

| Content | Pages | Source |
|---|---|---|
| Industry FAQs (30) | 8 industry pages | `faq_section` |
| Hero lead texts | all services and industries | `services_hero` / `industry_hero` `sub_heading` |
| Expertise and benefits intros | industries, services | `icon_box_section` / `benefits_section` `section_description` |
| Second intro blocks, e.g. "Auktoriserad översättning – i Sverige och i andra länder" | `/branscher/juridisk-oversattning`, `/mode-design-och-konst` (+ intro `content` fields on 11 industries) | `industry_intro` |
| Main areas overview (12 areas) | `/branscher/vara-huvudomraden` | accordion block |
| Language-review levels (nivå 1–3), text-type cards (5) | `/tjanster/sprakgranskning`, `/tjanster/texttyper` | `inner_service_section` |
| "Why choose us" blocks and industry-grid intros | 15 services | `inner_why_choose_us`, `industries` |
| Client testimonials on case pages (3) | Julius Production, True Stories, Moderna Museet | `casestudy_testimonial` |
| Side-by-side translation examples and "why a professional translator" | `/kundcase/julius-production` | `case_study_example`, `case_study_about` |
| Case hero summaries and challenge intros | all 4 cases | `casestudy_hero`, `casestudy_challenge` |
| Site-wide testimonials: 10 clients, 5 freelance translators | homepage, services, `/sprak` | `theme/v1/customer-quote-block`, `theme/v1/translator-quote-block` |
| Video descriptions, durations, YouTube embeds, related pages (15) | all `/videor/` pages | VideoObject JSON-LD on each page |
| Homepage blocks (about, services overview, team intro, why choose us) | `/` | `page_sections` |
| Numbered tips before ordering | `/fragor-svar` | `our_approach` |
| Article summaries (63) and author cards (14 articles, 3 authors) | article pages | post ACF, `author-card` |
| Contact details and social profiles now read from the CMS footer instead of hard-coded | site-wide footer | `theme/v1/footer` |

Remaining unmatched text (27 snippets) is repeated calls to action, article-sidebar promos, the homepage AI-agent note, and one-line taglines on index and video pages — not content.

## Pages removed

| Page | Why |
|---|---|
| `/tjanster/oversattning-ads-page` | Ad landing page marked `noindex, nofollow`, and a duplicate of `/tjanster/oversattning` (same heading, description, benefits, process; no FAQs). Services: 16 → 15. |
| `/videos` | Replaced by `/videor` (canonical). |
| 15 × `/watch/…` | Replaced by `/videor/…` (canonical). The old URLs still respond 200 but declare the `/videor/` URL as canonical. |

## Pages moved (`/watch/` → `/videor/`)

| Video | Old URL | New URL |
|---|---|---|
| Finansiell översättning för årsredovisningar, rapporter och prospekt | `/watch/finansiell-oversattning-arsredovisningar-rapporter-prospekt` | `/videor/finansiell-oversattning-arsredovisningar-rapporter-prospekt` |
| Juridisk översättning för avtal, rättsliga dokument och affärsjuridik | `/watch/juridisk-oversattning-avtal-rattsliga-dokument-affarsjuridik` | `/videor/juridisk-oversattning-avtal-rattsliga-dokument-affarsjuridik` |
| Medicinsk översättning för läkemedel, medicinteknik och Life Science | `/watch/medicinsk-oversattning-lakemedel-medicinteknik-life-science` | `/videor/medicinsk-oversattning-lakemedel-medicinteknik-life-science` |
| Novoterm – översättning och språktjänster för företag | `/watch/oversattning-spraktjanster` | `/videor/oversattning-spraktjanster` |
| Översättning av bygg- och konstruktionsdokument | `/watch/oversattning-bygg-konstruktion` | `/videor/oversattning-bygg-konstruktion` |
| Översättning av dokument och texter för energisektorn | `/watch/oversattning-energisektorn` | `/videor/oversattning-energisektorn` |
| Översättning av utbildnings- och ledarskapsmaterial | `/watch/oversattning-utbildning-ledarskap` | `/videor/oversattning-utbildning-ledarskap` |
| Översättning inom hållbarhet, CSR och miljökommunikation | `/watch/oversattning-hallbarhet-csr` | `/videor/oversattning-hallbarhet-csr` |
| Översättning inom marknadsföring och PR | `/watch/oversattning-marknadsforing-pr` | `/videor/oversattning-marknadsforing-pr` |
| Översättningar för försvarsbranschen | `/watch/oversattningar-forsvarsbranschen` | `/videor/oversattningar-forsvarsbranschen` |
| Översättningar för fysisk och digital säkerhet | `/watch/oversattningar-fysisk-digital-sakerhet` | `/videor/oversattningar-fysisk-digital-sakerhet` |
| Översättningar inom HR och personalutveckling | `/watch/oversattningar-hr-personalutveckling` | `/videor/oversattningar-hr-personalutveckling` |
| Översättningar inom konst, design och mode | `/watch/oversattning-konst-design-mode` | `/videor/oversattning-konst-design-mode` |
| Teknisk översättning för manualer, specifikationer och tekniska dokument | `/watch/teknisk-oversattning-manualer-specifikationer-tekniska-dokument` | `/videor/teknisk-oversattning-manualer-specifikationer-tekniska-dokument` |
| Webb- och IT-översättning av professionella översättare | `/watch/webb-it-oversattning-professionella-oversattare` | `/videor/webb-it-oversattning-professionella-oversattare` |

## Live but deliberately not added

| Page | Why |
|---|---|
| `/tjanster/korrekturlasning-ads` | New ad landing page (2026-09-16), `noindex, nofollow`, duplicate of `/tjanster/korrekturlasning` without FAQs — same rule as `oversattning-ads-page`. |
| `/thank-you-ads`, other thank-you, test and unsubscribe pages | Utility pages (`noindex`). |
| 84 English pages under `/en/` | Out of scope — English coverage kept as in September, by decision. |

---

## Asset changes

| Asset | Change |
|---|---|
| `/agent` | New **Landing Pages**, **Videos** and **Testimonials** sections; industry FAQs, case testimonials and examples, service/industry lead texts and homepage blocks shown; 15 `VideoObject` entries in JSON-LD;  overview now shows postal address, email, phone, and the 44-language list. JSON-LD Organization gains `streetAddress`, `postalCode`, `email`, `telephone`, `ContactPoint`, and `sameAs` (LinkedIn, Facebook). Dates: published 2026-07-28, crawled/updated/verified 2026-10-14. |
| `/llms.txt` | Address, contact line and language list in Summary; Key Pages lists the 6 new company pages; video index → `/videor`; agent note on contacts corrected. |
| `/llms-full.txt` | New "Landing pages", "Videos" and "Testimonials" sections; all review-pass content above; articles now show published date, author and summary; 30-year article added; oversattning-ads-page removed; teknisk-oversattning updated. |
| `/ai.txt` | `Contact-Email` and `Contact-Phone` keys, postal address, language list; "no general inbox" statements replaced. |
| `/api-catalog.json` | Contact entry, maintainers and `X-organization` now include address, email, phone, social profiles; `pages.json` endpoint listed automatically. |
| `/openapi.json` | New `/agent/v1/pages.json` and `/agent/v1/videos.json` paths (11 paths, 24 schemas); new `ContentSection`, `LandingPage`, `Video`, `Testimonial` schemas; `Service`, `Industry`, `CaseStudy`, `Article` document their new fields; `Company` schema documents `address`, `sameAs`, `languageList`, and the full `contact` object. (API spec version stays 1.0.0 — no breaking change.) |
| `/agent/v1/` REST API | New `pages.json` and `videos.json` endpoints (11 endpoints, was 9). `company.json` adds `testimonials`. `faq.json` 123 entries (adds 30 industry FAQs; same question with a different answer kept per scope). `company.json` adds `address`, `sameAs`, `languageList`; contact block adds email/phone/postal address. `services.json` 16 → 15. `articles.json` 63 → 64. `faq.json` includes the 5 `/sprak` FAQs. |
| MCP server | Version 1.2.0. New read-only tools `list_pages` and `list_videos` (14 tools, was 12). `get_industry` / `get_case_study` return the new FAQs, testimonials and examples; `get_company` returns address, social profiles and language list; `search_faq` covers landing-page FAQs. |
| `server.json`, `package.json`, `package-lock.json` | Version 1.1.0 → 1.2.0. |
| `scripts/refresh-content.mjs` | Generator fixes so next month's refresh stays correct: skips anything Yoast marks `noindex` (services and posts), except the explicit allowlist `INCLUDE_DESPITE_NOINDEX` (`novoterm-30-ar`); strips stray U+FEFF characters (whitespace-only effect on 5 articles); builds video URLs as `/videor/`; extracts the two landing pages; fetches the language list from `theme/v1/languages`; adds the 6 company index pages to the site index; reads every block listed under "Content captured in the review pass" (generic `readSection()` for blocks without a dedicated extractor). |
| `lib/agent/contact.ts` | Comment documenting the new reCAPTCHA field (no behaviour change). |
| `tsconfig.json` | `Versions` excluded so the archived version folders cannot break the root build's type check. |

## Sitemap coverage (https://www.novoterm.se/sitemap.xml, checked 2026-10-14)

| Group | URLs | Firecrawl-scraped | In package |
|---|---|---|---|
| Swedish content pages | 121 | 121 | 121 (all) |
| Agentic files (`/agent`, `/llms.txt`, `/llms-full.txt`, `/ai.txt`) | 4 | 4 | they are the package |
| Swedish utility / non-canonical (`/videos`, `/event-registration`, `/newsletter-unsubscribe`) | 3 | 3 | no — `/videos` is canonicalised to `/videor` (included); the other two are forms |
| English (`/en/…`) | 83 | 82 | no — out of scope by decision (`/en/newsletter-unsubscribe` not scraped; utility page) |
| **Total** | **211 entries (210 unique)** | | |

The package additionally covers `/videor` and `/artiklar/novoterm-30-ar`, which are not in the sitemap (see "Needs attention").

## Bug review (second pass) — fixed

| Issue | Fix |
|---|---|
| FAQ de-duplication by question text dropped two different answers ("Vilka språk översätter ni till och från?" homepage version; "När behöver man en auktoriserad översättning?" juridisk version) — the agent page FAQPage had 19 instead of 20 entries | De-duplicate on question **and** answer; `faq.json` now 123 entries, FAQPage 20 |
| Video `/videor/oversattningar-forsvarsbranschen` republished the site's broken "Läs mer" link `/branscher/forsvarsindustrin` (404) | Generator validates every video's related page against known package URLs and drops unknown ones with a warning |
| VideoObject JSON-LD had no `thumbnailUrl` (required by Google) | `thumbnailUrl` extracted for all 15 videos and output in JSON-LD, `videos.json`, OpenAPI |
| `/agent` canonical and `og:url` were relative (`/agent`) — carried over from September | Absolute `https://www.novoterm.se/agent` |
| Organization `logo` pointed to `/logo.png` (404) | Real logo from the CMS header (`theme/v1/header`), now also in the Organization JSON-LD |
| Two CMS links pointed to the backend host (`backend.novoterm.se/sprakoversattning/`, `/personalutveckling-och-hr/`) | Rewritten to the public site and resolved to their final pages (`/tjanster/oversattning`, `/branscher/personalutveckling-och-hr`); the generator now resolves any redirecting site link in CMS text |
| Zero-width spaces (U+200B) in 2 articles, `\r\n` in a team bio, trailing space in a case's "services" field | Stripped / normalised / trimmed in the generator |
| Case challenge heading and intro were merged into one long bold line in `llms-full.txt` | Stored as `challengeHeading` + `challengeText` and rendered separately |
| `get_company` (MCP) returned `address` as a string, `company.json` as an object | Both return the object, plus `postalAddress` as one formatted line |
| Email/phone hard-coded in the contact note, agent instruction and `ai.txt` | All read from the CMS footer data via `SITE_CONFIG` |
| OpenAPI `info.contact` still "contact form" only | Adds `info@novoterm.se` |
| Address parsing assumed exactly 3 footer lines; empty contact data would publish silently | Address located by its postcode line; generator stops with an error if footer contact details are incomplete |
| Video extraction failed silently; `@graph` / array JSON-LD and array `potentialAction` not handled | Handled, with a warning when a page has no VideoObject |
| Article `publishedAt` had no timezone (invalid `date-time`) | Now UTC from WordPress `date_gmt` (e.g. `2018-06-19T05:46:11Z`) |
| Swedish sort order (Å/Ä/Ö sorted as A/O) | `localeCompare(…, "sv")` for articles and videos |
| CMS paragraph breaks collapsed into one `<p>` on the agent page | Rendered as separate paragraphs |
| `llms.txt` had 3 bare URLs in link positions | Converted to Markdown links |

## External review (Codex) — dispositions

Each point was checked against the code before acting.

| # | Finding | Decision | What changed |
|---|---|---|---|
| 1 | Unrecognised HTTP 2xx from the contact backend was reported as `submitted: true` | **Agreed — fixed** | Only an explicit `status: "mail_sent"` or `success: true` (on 2xx) counts as sent. `success: false` or a failure status → `rejected`; anything else (unknown body, non-2xx, timeout, contradictory "mail_sent" on 5xx) → `unconfirmed`, never submitted. The MCP tool returns an error for `unconfirmed` telling the agent not to claim success or resubmit, and to give the user the email/phone/form. Tested with mocked responses, including Codex's `{"success":false}` case. |
| 2 | reCAPTCHA compatibility of the contact tool is unverified | **Agreed it is unverified; not disabled** | Disabling is a business decision: the live contact form itself tells AI agents to use this tool. With #1 fixed, a reCAPTCHA rejection is reported as a failure, not a false success. Kept under "Needs attention": Novoterm's developer must confirm the route, and agreed abuse protection is needed if it is exempted. Then one genuine test submission. |
| 3 | Abuse controls for the contact action | **Partly agreed — fixed what the code can own** | New dedicated limit: 5 contact submissions per client IP per hour, on top of 100 MCP requests/min. Request bodies over 64 KB are rejected (413). Field limits: name 200, email 254, phone 40, company 200, message 5,000. Client IP handling revised in the second review (item R3). **Not done:** a shared rate-limit store. That needs infrastructure (e.g. Upstash/Vercel KV credentials, or a WAF rule on `POST /mcp`); documented in `lib/rate-limit.ts`. |
| 4 | MCP accepted requests from untrusted browser origins | **Agreed — fixed** | Requests with an `Origin` header are rejected (403) unless it is novoterm.se, www.novoterm.se, or listed in `MCP_ALLOWED_ORIGINS`. Non-browser MCP clients send no Origin and are unaffected. |
| 5 | `/agent/v1/schema.json` contained unresolvable `$ref`s | **Agreed — fixed** | All references are inlined, so each endpoint schema is self-contained; the response also links `/openapi.json`. |
| 6 | Dependency audit findings | **Agreed — dispositioned individually** | Updated: Next.js 15.5.25 → 15.5.28 (fixes the SSG/ISR cache-poisoning advisories), sharp 0.35.5, source-map-js 1.2.2. **Kept:** `mcp-handler` 1.1.0 + MCP SDK 1.26.0, pinned exactly. `npm audit fix` tried to downgrade `mcp-handler` to 1.0.6 to satisfy the SDK advisory; that would reintroduce GHSA-w2fm-25vw-vh7f (tool responses leaking across concurrent sessions), and `mcp-handler` 1.1.0 requires SDK 1.26.0. **Not applicable:** SDK GHSA-6qxp-vccf-f47h affects the SDK's OAuth *client*, which this server does not use. PostCSS advisories concern processing attacker-controlled CSS/source maps; PostCSS is only used by Next.js at build time on the package's own styles. Upgrading these needs Next.js 16 (major) — a separate, tested upgrade. |
| 7 | No integration/deployment guide | **Partly agreed** | This package has been deployed standalone behind www.novoterm.se since July 2026 (the September version is live), so it is not a new integration. Added a post-deploy verification step below rather than guessing the hosting set-up. |
| 8 | `fetchAll()` read only the first 100 items | **Agreed — fixed** | Follows WordPress `X-WP-TotalPages` pagination. Output unchanged today (largest collection: 64). |
| 9 | Refresh could write incomplete data under a fresh date | **Agreed — fixed** | The generator validates before writing: required collections non-empty, key fields present (incl. every video's description/embed/thumbnail), CEO/history present, and no collection shrinking by over 25 % unless `--allow-shrink` is passed. On failure it exits with an error and the previous `data/` snapshot is kept (tested). |
| 10 | Sync is manual; landing pages hard-coded | **Partly agreed** | Monthly manual refresh + versioned release is the agreed process, so no automation added. Added detection: every refresh now warns about any indexable WordPress page that the package does not cover. |
| 11 | No upstream timeout; error body lost after `json()` | **Agreed — fixed** | 15 s timeout (reported as `unconfirmed`); the body is read once as text and then parsed, so non-JSON error pages are preserved. |
| 12 | Verification script not configurable / no assertions; FAQ count 121 vs 123 | **Agreed — fixed** | `scripts/verify-mcp.mjs [baseUrl]` (or `VERIFY_BASE_URL`) asserts the handshake, all 14 tools and their read-only flags, real tool results, error handling, the origin policy and the self-contained schema document. It never sends a real inquiry: its contact check uses an invalid email, so it is rejected on any version. Changelog count corrected to 123. |

## External review (Codex), second round — dispositions

| # | Finding | Decision | What changed |
|---|---|---|---|
| R1 | 64 KB limit checked only the declared `Content-Length`; a chunked 70 KB request was accepted | **Agreed — fixed** | The MCP route now reads the body itself, counting bytes actually received, and stops at 64 KB (413) before any JSON parsing. The handler gets a request rebuilt from that buffer. |
| R2 | `{"status":"mail_sent","success":false}` was still reported as sent | **Agreed — fixed** | All signals present must agree. Conflicting ones (that pair, or `success: true` with a failure status, or "mail_sent" on a non-2xx) are `unconfirmed`. The real response contract still needs confirming with one genuine submission (Needs attention 1). |
| R3 | `x-vercel-forwarded-for` was trusted on every host, so a client could rotate it to get fresh rate-limit buckets | **Agreed — fixed** | Only one configured header is trusted: `RATE_LIMIT_IP_HEADER` if set; otherwise `x-vercel-forwarded-for` only when running on Vercel (`VERCEL` is set by the platform, whose edge sets that header itself); otherwise `x-real-ip` / `x-forwarded-for`. Production is on Vercel (`server: Vercel`). Requests reach this deployment through the main site's rewrite, though, so which client IP that header carries must be confirmed once in production. If it is the main site's proxy rather than the visitor, set `RATE_LIMIT_IP_HEADER`. A shared (cross-instance) limit is still an infrastructure decision. |
| R4 | `MCP_ALLOWED_ORIGINS` had no matching CORS, so allowed browser clients could not connect | **Agreed — fixed** | `/mcp` answers preflight (`OPTIONS`) and adds `Access-Control-Allow-Origin` (plus methods, headers incl. `Mcp-Session-Id`, exposed headers, `Vary: Origin`) only for allowed origins. |
| R5 | Validator accepted loss of a landing page, 43 of 44 languages, all nested FAQs, and an emptied CEO/history text | **Agreed — fixed** | Shrink checks now cover 17 measures, including nested FAQs, benefits, expertise, testimonials, languages and homepage blocks. Every configured landing page must be present, and the CEO message, history, philosophy and tagline must have text. Codex's exact mutations are in `npm test`. |
| R6 | HTML-to-text lost `<br>`/heading/attribute-paragraph breaks and turned `A &lt; B &gt; C` into `A C` | **Agreed — fixed** | Structure is read from the raw markup first, tags removed, then entities decoded in a single pass. This also fixed a double-decoding bug (`&amp;lt;` → `&lt;`, not `<`). Headings stay on one line. Regenerated content changed only in whitespace and structure: 100 fields, mostly paragraph breaks around headings, list bullets restored on `<li class=…>` items, and non-breaking spaces normalised. No wording changed. |
| R7 | The two data files were overwritten one after the other | **Agreed — fixed** | Both are written to `*.tmp`, parsed back, then renamed; if the second rename fails the first file is restored from a backup. Both carry the same `meta.generatedAt`, and the build fails if they differ, so a pair from different runs can never be deployed. |
| R8 | Verification did not independently prove the safeguards | **Agreed — fixed** | New offline `npm test` (39 tests; 40 after R9): text conversion, validator mutations, safe-write recovery, contact responses incl. conflicts/timeout/field limits. All tests mock the network and send nothing. `verify-mcp.mjs` now also asserts each contact field's `maxLength` in the tool schema, the chunked-body 413, and allowed-origin preflight + CORS. |

| R9 | (third round) Snapshot backup and rollback errors were swallowed, so the message could claim "restored" when nothing was | **Agreed — fixed** | A backup is now required before any file is replaced: if it cannot be made, the run stops with both live files untouched. A failed restore is reported as such, with the location of the `.bak` copy. A leftover `.bak` is reported, not hidden. The backup-failure path is covered by `npm test`. |

| R10 | (fourth round) The contact tool was registered unconditionally, so "deploy everything except the contact tool" was not actually possible | **Agreed — fixed** | New switch `CONTACT_TOOL_ENABLED` (`config/features.ts`). It was first shipped off by default; by Novoterm's decision it is now **on by default**, and `CONTACT_TOOL_ENABLED=false` is the emergency off switch. When off, the tool is not registered, and nothing advertises it: ai.txt says no actions are available, and the agent instructions, contact note, API catalog, company/contact data and `/mcp/tools` omit it. Verified in both modes: off = 13 tools and no mention in any output; on = 14 tools with all field limits. |
| R11 | `/mcp/health` returned the derived client IP with `Access-Control-Allow-Origin: *`, so any website's script could read a visitor's address | **Agreed — fixed** | The IP diagnostic is returned only when the request sends the secret from `HEALTH_DIAGNOSTICS_TOKEN` in an `x-diagnostics-token` header, and that response has no CORS header. Without the variable set it is never returned. Public health output adds `contact_tool_enabled` only. Unset the token after check D2. |

Third-round assessment from Codex: ready for staging verification. Production sign-off for the enabled contact action depends on the three deployment checks below.

## Deployment checks (before enabling the contact action in production)

| # | Check | Who | How |
|---|---|---|---|
| D1 | Contact delivery and response format | Novoterm developer + Novoterm (authorised test) | Confirm whether reCAPTCHA is enforced on `custom-cf7/v1/submit/321`. If it is, the developer lets requests that carry a valid `X-Novoterm-Agent-Key` header skip only the reCAPTCHA check (all other validation stays), and the same secret is set as `CONTACT_BACKEND_KEY` here. Then submit one genuine inquiry through the MCP tool. Confirm it arrives in Novoterm's inbox and that the tool reported `status: "sent"`. If it reported `unconfirmed`, record the backend's actual response body so the success check can match the real contract. |
| D2 | Production client IP | Developer | Temporarily set `HEALTH_DIAGNOSTICS_TOKEN` on this deployment. From your own machine run `curl -H "x-diagnostics-token: <token>" https://www.novoterm.se/mcp/health`: `rateLimit.clientKey` must equal your public IP, not a Vercel or main-site proxy address. Repeat with `-H "x-vercel-forwarded-for: 1.2.3.4" -H "x-forwarded-for: 1.2.3.4" -H "x-real-ip: 1.2.3.4"`; the value must not change. If either fails, set `RATE_LIMIT_IP_HEADER` to the header that carries the real visitor IP through the rewrite, redeploy, and repeat. Then remove `HEALTH_DIAGNOSTICS_TOKEN`. |
| D3 | Shared abuse protection | Developer / hosting owner | The built-in limits (100 MCP requests/min, 5 contact submissions/hour per IP, 64 KB bodies) are per server instance. Add a cross-instance limit, e.g. a Vercel Firewall rate-limit rule or a shared store (Upstash / Vercel KV). The rule must cover every route that reaches the MCP handler: `/mcp` on www.novoterm.se, the internal `/mcp/mcp` path, and this project's own deployment URL if it is publicly reachable. Any reCAPTCHA exemption from D1 depends on this. |

**The contact tool is ON by default** (Novoterm's decision). The safeguards in this package (honest success reporting, field and body limits, per-IP limits, origin policy) are active. D1–D3 are what remain to make delivery and abuse protection certain in production. If the tool ever needs to be stopped quickly, set `CONTACT_TOOL_ENABLED=false` and redeploy.

## Configuration (environment variables on this deployment)

| Variable | Default | Purpose |
|---|---|---|
| `CONTACT_TOOL_ENABLED` | on | `false` unregisters `submit_contact_inquiry` and removes every mention of it (emergency off switch). Vercel environment variables apply to build and runtime alike. |
| `CONTACT_BACKEND_KEY` | none | Shared secret sent as `X-Novoterm-Agent-Key`, only to the WordPress submit route, so the backend can skip reCAPTCHA for this server alone (D1). Must match the value configured in WordPress. |
| `RATE_LIMIT_IP_HEADER` | Vercel: `x-vercel-forwarded-for` | The one request header trusted for the client IP (see D2). |
| `MCP_ALLOWED_ORIGINS` | none | Extra browser origins allowed to call `/mcp`, comma-separated (novoterm.se and www.novoterm.se are always allowed). |
| `HEALTH_DIAGNOSTICS_TOKEN` | none | Temporary: lets `/mcp/health` return rate-limit diagnostics to callers sending it in `x-diagnostics-token` (check D2 only). |

## Verification

- `tsc --noEmit` and `next build` pass (21 routes).
- All 20 public endpoints return 200 locally; OpenAPI has no dangling `$ref`s; every one of the 138 site URLs referenced in `llms.txt`, `llms-full.txt`, `ai.txt` and the data returns 200 on the live site (except `/mcp`, which correctly answers a plain GET with 405); `openapi.json`, `api-catalog.json`, `index.json`, `schema.json`, `/mcp/tools` parse as valid JSON.
- `npm test`: 40 offline tests pass.
- `node scripts/verify-mcp.mjs http://localhost:3131`: all assertions pass with the contact tool off (default) and on (`CONTACT_TOOL_ENABLED=true`); the script detects the mode from `/mcp/health`. Also tested by hand: allowed origin 200, missing origin 200, 70 KB body 413, sixth contact call from one IP 429 (other IPs and read tools unaffected).
- Contact response handling unit-tested with mocked backend replies (sent / rejected / unconfirmed / timeout / over-long fields).
- After deploying, run `node scripts/verify-mcp.mjs https://www.novoterm.se` (or the staging URL) to check the live deployment, and confirm `/agent` shows the four dates.
- Firecrawl API key used only for the crawl — not written to any file in this package.

## Needs attention

1. **Contact form reCAPTCHA.** The live CF7 form (id 321) now includes `[recaptcha]`. If the backend enforces it on `custom-cf7/v1/submit/321`, the `submit_contact_inquiry` MCP tool will be rejected; it reports the failure and does not bypass reCAPTCHA. Novoterm's developer should confirm whether it is enforced on that route. If the route is exempted, agree on replacement protection (for example a shared rate limit or WAF rule; see review item 3). Then send one genuine test submission. Until then, the tool's ability to deliver is unverified.
2. **`/artiklar/novoterm-30-ar` is `noindex` on the live site** but is included in the package by decision. Likely unintentional for an anniversary article linked from 26 pages — Novoterm should make it indexable. If they decide to keep it hidden, remove `novoterm-30-ar` from `INCLUDE_DESPITE_NOINDEX` in `scripts/refresh-content.mjs`.
3. **Broken links on the live site** (found by the crawl, not caused by the package):
   - `/tjanster/oversattning-ads-page` links to `/tjanster/info@novoterm.se` and `/tjanster/08-211719` (missing `mailto:` / `tel:`) → 404.
   - `/videor/oversattningar-forsvarsbranschen` links to `/branscher/forsvarsindustrin` → 404 (correct page: `/branscher/forsvarsbranschen`).
   - `/artiklar/7-anledningar-att-inte-oversatta-dokument-med-google-translate` links to `/en/articles/7-reasons-not-to-use-google-to-translate-your-documents` → 404.
   - The forsvarsbranschen video's own structured data (`potentialAction.target`) also points to `/branscher/forsvarsindustrin` — the package drops that link until it is fixed.
   - CMS text links to the backend host on `/branscher/juridisk-oversattning` and the article `oversattning-av-hr-material-…` (`backend.novoterm.se/sprakoversattning/`, `/personalutveckling-och-hr/`) — corrected in the package, but should be fixed in WordPress.
4. **Sitemap anomalies** (live site): `/en` is listed twice; `/videos` is listed although its canonical is `/videor`, and `/videor` itself is missing.
