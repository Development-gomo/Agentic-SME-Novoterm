import novotermContent from "@/data/novoterm-content.json";
import siteIndexData from "@/data/novoterm-site-index.json";

/**
 * Full site index, grouped by category. Sourced from the WordPress REST API
 * (wp/v2/posts, wp/v2/headless-videos) for real page titles, plus the
 * services/industries/case-studies already normalized in content.ts — see
 * scripts/refresh-content.mjs for how data/novoterm-site-index.json is built.
 */

export type SiteIndexEntry = { name: string; url: string };
export type SiteIndexGroup = { title: string; entries: SiteIndexEntry[] };

// Both data files are written by one refresh run and stamped with the same
// generatedAt; a mismatch means an interrupted refresh — fail the build
// instead of deploying content and index from different runs.
if (siteIndexData.meta.generatedAt !== novotermContent.meta.generatedAt) {
  throw new Error(
    `data/novoterm-site-index.json (${siteIndexData.meta.generatedAt}) and data/novoterm-content.json ` +
      `(${novotermContent.meta.generatedAt}) come from different refresh runs. Re-run: node scripts/refresh-content.mjs`,
  );
}

export const siteIndex: SiteIndexGroup[] = siteIndexData.siteIndex;
