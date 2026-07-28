import { buildAiText } from "@/lib/agent/ai-txt";
import { corsPreflight } from "@/lib/agent/api";

export const dynamic = "force-static";
export const OPTIONS = corsPreflight;

export function GET() {
  return new Response(buildAiText(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
