import { MD_BASE_PATH, MD_INDEX_PATH, markdownIndex, markdownPage, markdownPages } from "@/lib/agent/markdown-pages";

/**
 * Markdown version of every page: /agent/md/<page path>.md (see
 * lib/agent/markdown-pages.ts), plus the list of all of them at
 * /agent/md/pages.md. Each response names its canonical HTML page in a Link
 * header, so search engines treat the markdown as an alternate, not a duplicate.
 */

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return [MD_INDEX_PATH, ...markdownPages().map((p) => p.mdPath)].map((mdPath) => ({
    path: mdPath.slice(MD_BASE_PATH.length + 1).split("/"),
  }));
}

const headers = (extra: Record<string, string> = {}) => ({
  "Content-Type": "text/markdown; charset=utf-8",
  "Cache-Control": "public, max-age=3600, s-maxage=3600",
  "Access-Control-Allow-Origin": "*",
  ...extra,
});

export async function GET(_request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const mdPath = `${MD_BASE_PATH}/${path.map((s) => { try { return decodeURIComponent(s); } catch { return s; } }).join("/")}`;
  if (mdPath === MD_INDEX_PATH) return new Response(markdownIndex(), { headers: headers() });
  const page = markdownPage(mdPath);
  if (!page) return new Response("Not Found", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  return new Response(page.markdown, { headers: headers({ Link: `<${page.pageUrl}>; rel="canonical"` }) });
}
