import { corsPreflight } from "@/lib/agent/api";
import { API_CATALOG_CONTENT_TYPE, API_CATALOG_WELL_KNOWN_URL, buildApiCatalogLinkset } from "@/lib/agent/discovery";

export const dynamic = "force-static";
export const OPTIONS = corsPreflight;

/** RFC 9727 API catalog — see lib/agent/discovery.ts. RFC 9727 asks for HEAD support with an api-catalog Link. */
const headers = {
  "Content-Type": API_CATALOG_CONTENT_TYPE,
  "Cache-Control": "public, max-age=3600, s-maxage=3600",
  "Access-Control-Allow-Origin": "*",
  Link: `<${API_CATALOG_WELL_KNOWN_URL}>; rel="api-catalog"`,
};

export function GET() {
  return new Response(JSON.stringify(buildApiCatalogLinkset(), null, 2), { headers });
}

export function HEAD() {
  return new Response(null, { headers });
}
