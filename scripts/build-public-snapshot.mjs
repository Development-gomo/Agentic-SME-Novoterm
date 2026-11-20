#!/usr/bin/env node
/**
 * Fallback content source for scripts/refresh-content.mjs, for when the
 * WordPress REST API on backend.novoterm.se cannot be reached (in November
 * 2026 it answered every request with a SiteGround bot challenge).
 *
 * Every public page on www.novoterm.se is a statically generated Next.js page
 * that embeds, in its __NEXT_DATA__ script, the exact WordPress REST object it
 * was rendered from (service, industry, case_study, post, page — with all ACF
 * fields), plus the site-wide header, footer, quote blocks, language list and
 * video list. This script collects those objects into one snapshot file that
 * scripts/public-pages-source.mjs serves to the unchanged generator in place
 * of the backend API.
 *
 * Two collections are not embedded in any page and are carried over from the
 * previous data/novoterm-content.json, but only after their text is verified
 * against the live rendered page (the run stops otherwise):
 *   - our-team (rendered client-side on /om-oss)
 *   - author-card bios (rendered at the end of each article); an author not in
 *     the previous data is read from that rendered author block.
 *
 * Usage:
 *   node scripts/build-public-snapshot.mjs --out <snapshot.json> --firecrawl <batch.json> [<batch.json> ...]
 * Page HTML (rawHtml) and rendered text (markdown) come from Firecrawl
 * batch-scrape result files ({ docs: [{ metadata, rawHtml, markdown }] }) of
 * every Swedish page. Rendered text is required: the team list and the
 * article author blocks are loaded by the browser after the page arrives, so
 * they are not in the server HTML a plain fetch returns, and the checks above
 * could not run on it.
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { htmlToText } from "./refresh-content.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const outIdx = args.indexOf("--out");
const fcFiles = [];
for (let i = 0; i < args.length; i++) if (args[i] === "--firecrawl") while (args[i + 1] && !args[i + 1].startsWith("--")) fcFiles.push(args[++i]);
if (outIdx < 0 || !args[outIdx + 1] || !fcFiles.length) {
  console.error("Usage: node scripts/build-public-snapshot.mjs --out <snapshot.json> --firecrawl <batch.json> [<batch.json> ...]");
  console.error("Rendered page text from Firecrawl is required (team and author blocks are rendered in the browser).");
  process.exit(1);
}
const OUT = args[outIdx + 1];

const pathOf = (u) => {
  let p = new URL(u).pathname;
  try { p = decodeURI(p); } catch { /* keep encoded */ }
  return p.length > 1 ? p.replace(/\/$/, "") : p;
};
const isSwedish = (p) => !/^\/(en|articles)(\/|$)/.test(p);

/** @returns {Promise<{path: string, html: string, text: string}[]>} */
async function loadPages() {
  const pages = [];
  for (const f of fcFiles) {
    const batch = JSON.parse(await readFile(f, "utf8"));
    for (const d of batch.docs || []) {
      const src = d.metadata?.sourceURL || d.metadata?.url;
      if (!src || d.metadata?.statusCode !== 200) continue;
      pages.push({ path: pathOf(src), html: d.rawHtml || "", text: d.markdown || "" });
    }
  }
  return pages;
}

function nextData(html) {
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  return m ? JSON.parse(m[1]) : null;
}

const key = (s) => htmlToText(s || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

async function main() {
  const pages = (await loadPages()).filter((p) => isSwedish(p.path));
  const byPath = new Map(pages.map((p) => [p.path, p]));
  const collections = { service: new Map(), industry: new Map(), case_study: new Map(), posts: new Map(), pages: new Map(), "headless-videos": new Map() };
  const theme = {};
  const videoPageObjects = new Map();
  const videoPageLd = {};

  for (const pg of pages) {
    const nd = nextData(pg.html);
    if (!nd) continue;
    const { props } = nd;
    const pp = props.pageProps || {};
    if (props.initialHeader && !theme.header) theme.header = props.initialHeader;
    if (props.initialFooter && !theme.footer) theme.footer = props.initialFooter;
    if (pp.initialCustomerQuotes?.length && !theme["customer-quote-block"]) theme["customer-quote-block"] = pp.initialCustomerQuotes;
    if (pp.initialTranslatorQuotes?.length && !theme["translator-quote-block"]) theme["translator-quote-block"] = pp.initialTranslatorQuotes;
    if (pp.initialLanguages?.length && !theme.languages) theme.languages = { list_of_languages: pp.initialLanguages };
    if (pp.initialHeadlessVideos?.length) for (const v of pp.initialHeadlessVideos) collections["headless-videos"].set(v.slug, v);
    if (pp.service) collections.service.set(pp.service.slug, pp.service);
    if (pp.industry) collections.industry.set(pp.industry.slug, pp.industry);
    if (pp.caseStudy) collections.case_study.set(pp.caseStudy.slug, pp.caseStudy);
    if (pp.post && pg.path.startsWith("/artiklar/")) collections.posts.set(pp.post.slug, pp.post);
    if (pp.page?.slug) collections.pages.set(pp.page.slug, pp.page);
    if (pp.video?.slug) videoPageObjects.set(pp.video.slug, pp.video);
    // The generator reads each video's VideoObject JSON-LD from its public
    // page; keep those blocks so the run uses the crawled page, not a later
    // live fetch (the live pages intermittently lose the YouTube duration).
    if (pg.path.startsWith("/videor/")) {
      videoPageLd[pg.path] = [...pg.html.matchAll(/<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/g)].map((m) => m[0]).join("\n");
    }
  }

  // The theme REST route returns the header logo as an object; the page props carry the bare URL.
  if (typeof theme.header?.logo === "string") theme.header = { ...theme.header, logo: { url: theme.header.logo } };
  // The video list in page props has plain-string titles; the REST API returns { rendered }.
  for (const [slug, v] of collections["headless-videos"]) {
    const full = videoPageObjects.get(slug);
    const title = typeof v.title === "string" ? v.title : v.title?.rendered ?? full?.title?.rendered ?? full?.title;
    collections["headless-videos"].set(slug, { ...v, title: { rendered: title } });
  }

  const previous = JSON.parse(await readFile(path.join(__dirname, "..", "data", "novoterm-content.json"), "utf8"));

  // our-team: carried over from the previous data, verified against the live /om-oss page.
  const about = byPath.get("/om-oss");
  if (!about) throw new Error("/om-oss was not crawled — cannot verify the team");
  const aboutText = key(about.text);
  const team = previous.team.map((t) => {
    for (const [field, value] of Object.entries({ name: t.name, position: t.position, bio: t.bio, quote: t.quote })) {
      if (value && !aboutText.includes(key(value))) throw new Error(`Team member ${t.name}: ${field} no longer matches the live /om-oss page — team cannot be carried over`);
    }
    return { slug: t.slug, title: { rendered: t.name }, acf: { position: t.position, email: t.email, bio: t.bio, quote: t.quote, display_order: String(t.displayOrder) } };
  });

  // author-card: IDs and names from each post's ACF; bios from previous data (verified) or the rendered author block.
  const previousBios = new Map(previous.articles.filter((a) => a.author).map((a) => [a.author.name, a.author.bio]));
  const authorCards = new Map();
  for (const post of collections.posts.values()) {
    const card = post.acf?.display_author_card ? post.acf.author_card : null;
    if (!card?.ID || authorCards.has(card.ID)) continue;
    const name = card.post_title;
    const pg = byPath.get(`/artiklar/${post.slug}`);
    let bio = previousBios.get(name);
    if (bio !== undefined) {
      if (bio && !key(pg.text).includes(key(bio))) throw new Error(`Author ${name}: bio no longer matches the live page /artiklar/${post.slug}`);
    } else {
      // Rendered block: "#### <name>" followed by the bio, ending before the share prompt.
      const lines = pg.text.split("\n");
      const start = lines.findIndex((l) => l.trim() === `#### ${name}`);
      const end = lines.findIndex((l, i) => i > start && /Gillar du vad du ser/i.test(l));
      if (start < 0 || end < 0) throw new Error(`Author ${name}: no rendered author block found on /artiklar/${post.slug}`);
      bio = lines.slice(start + 1, end).map((l) => l.trim().replace(/^_([^_]+)_/, "$1")).filter(Boolean).join("\n\n");
      console.log(`new author card read from /artiklar/${post.slug}: ${name}`);
    }
    authorCards.set(card.ID, { id: card.ID, slug: card.post_name, title: { rendered: name }, acf: { individual_author_card: [{ name, description: bio }] } });
  }

  for (const route of ["header", "footer", "customer-quote-block", "translator-quote-block", "languages"]) if (!theme[route]) throw new Error(`theme/v1/${route} not found in any page`);

  const snapshot = {
    meta: { source: `Firecrawl batch scrape of ${pages.length} pages`, builtAt: new Date().toISOString(), pages: pages.length },
    collections: {
      ...Object.fromEntries(Object.entries(collections).map(([k, m]) => [k, [...m.values()]])),
      "our-team": team,
      "author-card": [...authorCards.values()],
    },
    theme,
    videoPageLd,
  };
  await writeFile(OUT, JSON.stringify(snapshot));
  console.log(`snapshot written: ${OUT}`);
  console.log(Object.entries(snapshot.collections).map(([k, v]) => `${k}=${v.length}`).join(" "), "| theme:", Object.keys(theme).join(","));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
