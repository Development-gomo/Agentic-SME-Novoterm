import { corsPreflight } from "@/lib/agent/api";
import { buildArdManifest } from "@/lib/agent/discovery";

export const dynamic = "force-static";
export const OPTIONS = corsPreflight;

/** Agentic Resource Discovery manifest (ARD v0.91) — see lib/agent/discovery.ts. */
export function GET() {
  return new Response(JSON.stringify(buildArdManifest(), null, 2), {
    headers: {
      // application/ard+json is requested for registration in the IETF draft but not yet
      // registered; plain JSON is what every consumer can read.
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
