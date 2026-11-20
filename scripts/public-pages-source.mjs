/**
 * Preload module: answers scripts/refresh-content.mjs's requests to the
 * WordPress REST API on backend.novoterm.se from a snapshot made by
 * scripts/build-public-snapshot.mjs, and its requests for the public
 * /videor/ pages from the crawled copies in the same snapshot. The generator
 * itself is unchanged; all other requests (link checks) go to the network.
 *
 * Usage:
 *   PUBLIC_SNAPSHOT=<snapshot.json> node --import ./scripts/public-pages-source.mjs scripts/refresh-content.mjs
 *
 * Use only when the backend API cannot be reached; the normal refresh is
 * `node scripts/refresh-content.mjs`.
 */

import { readFileSync } from "node:fs";

const file = process.env.PUBLIC_SNAPSHOT;
if (!file) throw new Error("PUBLIC_SNAPSHOT must point to a snapshot from scripts/build-public-snapshot.mjs");
const snapshot = JSON.parse(readFileSync(file, "utf8"));
const realFetch = globalThis.fetch;
process.env.CONTENT_SOURCE = `novoterm.se public pages (embedded WordPress REST data), ${snapshot.meta.source}`;

const json = (body) =>
  new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json", "x-wp-totalpages": "1" } });

globalThis.fetch = async (input, init) => {
  const url = new URL(typeof input === "string" ? input : input.url);
  // Video pages: serve the crawled page's JSON-LD, so all content comes from the same crawl.
  if (url.hostname === "www.novoterm.se" && snapshot.videoPageLd?.[url.pathname.replace(/\/$/, "")]) {
    return new Response(`<html><head>${snapshot.videoPageLd[url.pathname.replace(/\/$/, "")]}</head></html>`, {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
  if (url.hostname !== "backend.novoterm.se") return realFetch(input, init);

  const theme = url.pathname.match(/^\/wp-json\/theme\/v1\/([^/]+)\/?$/);
  if (theme) {
    if (!(theme[1] in snapshot.theme)) throw new Error(`public-pages-source: no snapshot data for theme/v1/${theme[1]}`);
    return json(snapshot.theme[theme[1]]);
  }

  const coll = url.pathname.match(/^\/wp-json\/wp\/v2\/([^/]+)\/?$/);
  if (coll) {
    const items = snapshot.collections[coll[1]];
    if (!items) throw new Error(`public-pages-source: no snapshot data for wp/v2/${coll[1]}`);
    if (Number(url.searchParams.get("page") || 1) > 1) return json([]);
    const slugs = url.searchParams.get("slug");
    return json(slugs ? items.filter((i) => slugs.split(",").includes(i.slug)) : items);
  }

  throw new Error(`public-pages-source: unexpected backend request ${url.href}`);
};

console.log(`public-pages-source: serving backend.novoterm.se from ${file} (${snapshot.meta.source})`);
