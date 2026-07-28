import { articles } from "@/app/agent/content";
import { agentApiResponse, corsPreflight } from "@/lib/agent/api";

export const dynamic = "force-static";
export const OPTIONS = corsPreflight;

export function GET() {
  return agentApiResponse("articles.json", articles);
}
