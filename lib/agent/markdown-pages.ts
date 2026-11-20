import {
  LAST_MODIFIED,
  about,
  articles,
  caseStudies,
  contact,
  faqs,
  industries,
  organization,
  pages,
  services,
  team,
  videos,
} from "@/app/agent/content";
import { SITE_ORIGIN } from "@/config/site-origin";
import {
  renderArticleBody,
  renderCaseStudyBody,
  renderIndustryBody,
  renderLandingPageBody,
  renderSection,
  renderServiceBody,
  renderVideoBody,
} from "@/lib/agent/llms-full";

/**
 * Clean markdown versions of every page the package covers, one file per page
 * (the llms.txt convention of a ".md" companion per page), served under
 * /agent/md/ so they work through the existing /agent rewrite on
 * www.novoterm.se. Built from the same data and renderers as /llms-full.txt.
 *
 *   https://www.novoterm.se/agent/md/<page path>.md   e.g. /agent/md/tjanster/oversattning.md
 *   https://www.novoterm.se/agent/md/index.md          the homepage
 *   https://www.novoterm.se/agent/md/pages.md          list of every markdown page
 *
 * /integritetspolicy is listed in the site index but its text is not part of
 * the package data, so it has no markdown version.
 */

export const MD_BASE_PATH = "/agent/md";
export const MD_INDEX_PATH = `${MD_BASE_PATH}/pages.md`;

export type MarkdownPage = {
  /** Path of the .md file, e.g. /agent/md/tjanster/oversattning.md (decoded). */
  mdPath: string;
  /** Canonical HTML page on www.novoterm.se. */
  pageUrl: string;
  title: string;
  group: string;
  markdown: string;
};

const join = (parts: string[]) => parts.filter(Boolean).join("\n\n");
const pagePath = (url: string) => {
  const p = new URL(url).pathname.replace(/\/$/, "");
  return p.split("/").map((seg) => { try { return decodeURIComponent(seg); } catch { return seg; } }).join("/");
};
const mdUrl = (mdPath: string) => `${SITE_ORIGIN}${encodeURI(mdPath)}`;

function page(group: string, title: string, url: string, body: string): MarkdownPage {
  const path = pagePath(url);
  const mdPath = path === "" ? `${MD_BASE_PATH}/index.md` : `${MD_BASE_PATH}${path}.md`;
  const markdown = `${join([
    `# ${title}`,
    `> Markdown version of ${url} — Novoterm Translation. Last verified: ${LAST_MODIFIED}. All pages: ${mdUrl(MD_INDEX_PATH)}`,
    body,
  ])}\n`;
  return { mdPath, pageUrl: url, title, group, markdown };
}

const faqBlock = (list: { question: string; answer: string }[]) => list.map((f) => `**${f.question}**\n${f.answer}`).join("\n\n");
const link = (title: string, url: string) => `- [${title}](${url}) — markdown: ${mdUrl(`${MD_BASE_PATH}${pagePath(url)}.md`)}`;

function companyPages(): MarkdownPage[] {
  const home = page(
    "Company",
    `${organization.name} — ${organization.tagline}`,
    `${SITE_ORIGIN}/`,
    join([
      about.heroTagline ? `**${about.heroTagline}**\n${about.heroLead}` : "",
      ...about.homeSections.map(renderSection),
      faqBlock(faqs.filter((f) => f.scope === "homepage")) ? `## Frågor & svar\n\n${faqBlock(faqs.filter((f) => f.scope === "homepage"))}` : "",
      `Source: ${SITE_ORIGIN}/`,
    ]),
  );
  const aboutPage = page(
    "Company",
    "Om oss",
    `${SITE_ORIGIN}/om-oss`,
    join([
      about.ceo ? `## ${about.ceo.role} — ${about.ceo.name}\n\n${about.ceo.message}` : "",
      about.philosophy ? `## ${about.philosophy.heading}\n\n${about.philosophy.text}` : "",
      about.history ? `## ${about.history.heading}\n\n${about.history.text}` : "",
      `## Team\n\n${team.map((t) => `- **${t.name}** — ${t.position}. ${t.bio}${t.quote ? ` "${t.quote}"` : ""}`).join("\n")}`,
      `Source: ${SITE_ORIGIN}/om-oss`,
    ]),
  );
  const contactPage = page(
    "Company",
    "Kontakta oss",
    contact.form.url,
    join([
      `${contact.postalAddress}`,
      `- E-post: ${contact.email.address}\n- Telefon: ${contact.phone.label}\n- Kontaktformulär: ${contact.form.url}`,
      `Source: ${contact.form.url}`,
    ]),
  );
  const faqPage = page(
    "Company",
    "Frågor och svar",
    `${SITE_ORIGIN}/fragor-svar`,
    join([...about.faqPageSections.map(renderSection), faqBlock(faqs.filter((f) => f.scope === "general")), `Source: ${SITE_ORIGIN}/fragor-svar`]),
  );
  const casesIndex = page(
    "Company",
    "Kundcase",
    `${SITE_ORIGIN}/kundcase`,
    join([caseStudies.map((c) => `${link(c.title, c.url)} (${c.client} — ${c.servicesUsed})`).join("\n"), `Source: ${SITE_ORIGIN}/kundcase`]),
  );
  const articlesIndex = page(
    "Company",
    "Artiklar",
    `${SITE_ORIGIN}/artiklar`,
    join([
      [...articles].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).map((a) => `${link(a.title, a.url)} (${a.publishedAt.slice(0, 10)})`).join("\n"),
      `Source: ${SITE_ORIGIN}/artiklar`,
    ]),
  );
  const videosIndex = page(
    "Company",
    "Videor",
    `${SITE_ORIGIN}/videor`,
    join([videos.map((v) => link(v.title, v.url)).join("\n"), `Source: ${SITE_ORIGIN}/videor`]),
  );
  return [home, aboutPage, contactPage, faqPage, casesIndex, articlesIndex, videosIndex];
}

let cache: MarkdownPage[] | null = null;

export function markdownPages(): MarkdownPage[] {
  if (cache) return cache;
  cache = [
    ...companyPages(),
    ...pages.map((p) => page("Landing pages", p.title, p.url, renderLandingPageBody(p))),
    ...services.map((s) => page("Services", s.title, s.url, renderServiceBody(s))),
    ...industries.map((i) => page("Industries", i.title, i.url, renderIndustryBody(i))),
    ...caseStudies.map((c) => page("Client cases", c.title, c.url, renderCaseStudyBody(c))),
    ...articles.map((a) => page("Articles", a.title, a.url, renderArticleBody(a))),
    ...videos.map((v) => page("Videos", v.title, v.url, renderVideoBody(v))),
  ];
  const seen = new Set<string>();
  for (const p of cache) {
    if (seen.has(p.mdPath)) throw new Error(`Duplicate markdown path ${p.mdPath}`);
    seen.add(p.mdPath);
  }
  return cache;
}

export function markdownPage(mdPath: string): MarkdownPage | undefined {
  return markdownPages().find((p) => p.mdPath === mdPath);
}

export function markdownIndex(): string {
  const groups = new Map<string, MarkdownPage[]>();
  for (const p of markdownPages()) groups.set(p.group, [...(groups.get(p.group) ?? []), p]);
  return `${join([
    "# Novoterm — markdown versions of every page",
    `> Clean markdown for each page of ${SITE_ORIGIN}/ (Swedish), for AI agents and LLMs. Each file names its canonical HTML page. Last verified: ${LAST_MODIFIED}. Full content in one file: ${SITE_ORIGIN}/llms-full.txt`,
    ...[...groups].map(([g, list]) => `## ${g} (${list.length})\n\n${list.map((p) => `- [${p.title}](${mdUrl(p.mdPath)}) — ${p.pageUrl}`).join("\n")}`),
  ])}\n`;
}
