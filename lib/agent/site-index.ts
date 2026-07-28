import siteIndexData from "@/data/novoterm-site-index.json";

/**
 * Full site index, grouped by category. Sourced from the WordPress REST API
 * (wp/v2/posts, wp/v2/headless-videos) for real page titles, plus the
 * services/industries/case-studies already normalized in content.ts — see
 * scripts/refresh-content.mjs for how data/novoterm-site-index.json is built.
 */

export type SiteIndexEntry = { name: string; url: string };
export type SiteIndexGroup = { title: string; entries: SiteIndexEntry[] };

export const siteIndex: SiteIndexGroup[] = siteIndexData.siteIndex;
