import { SITE_ORIGIN } from "@/config/site-origin";
import novotermContent from "@/data/novoterm-content.json";

/**
 * Single source of truth for the machine-readable /agent page, the
 * /agent/v1 JSON API, /llms.txt, /llms-full.txt, and the MCP tool registry.
 *
 * The underlying facts in data/novoterm-content.json are all pulled live from
 * novoterm.se's public WordPress REST API (wp-json/wp/v2/{service,industry,
 * case_study,our-team,posts,pages,headless-videos}) by scripts/refresh-content.mjs
 * — read directly from the same CMS fields the live site itself renders, not
 * hand-typed guesses. No API key or Firecrawl is needed for this ongoing
 * refresh; Firecrawl was only used once, during the initial build, to map the
 * site's URL structure before this WP REST pipeline was identified.
 *
 * LAST_MODIFIED is the refresh date. Re-running scripts/refresh-content.mjs
 * re-fetches the CMS data and bumps this value, so freshness is tied to a real
 * verification pass rather than a hand-typed guess.
 */

const abs = (path: string) => `${SITE_ORIGIN}${path}`;

export const LAST_MODIFIED = novotermContent.meta.crawledAt;

export const AGENT_PATH = "/agent";
export const AGENT_URL = `${SITE_ORIGIN}${AGENT_PATH}`;

export type AgentLink = {
  label: string;
  url: string;
  description?: string;
};

export type Faq = {
  question: string;
  answer: string;
  scope: string;
};

export type Service = {
  slug: string;
  title: string;
  url: string;
  heading: string;
  description: string;
  benefits: { title: string; content: string }[];
  faqs: Faq[];
  /** The 4-step delivery process (Analys/Uppstart/Översättning/Leverans), where present. */
  process: { step: number; tag: string; title: string; description: string }[];
};

export type Industry = {
  slug: string;
  title: string;
  url: string;
  heading: string;
  description: string;
  whyNovoterm: { heading: string; text: string } | null;
  expertise: { title: string; content: string }[];
  whatWeTranslate: { heading: string; text: string } | null;
  documentExamples: string[];
};

export type CaseStudy = {
  slug: string;
  title: string;
  url: string;
  client: string;
  industry: string;
  servicesUsed: string;
  heroHeading: string;
  heroSubheading: string;
  introHeading: string;
  /** The substantive narrative: what was actually delivered for the client. */
  narrative: string;
  /** Short "about the client" sidebar blurb — distinct from, and shorter than, narrative. */
  aboutClient: string;
  challenges: { title: string; content: string }[];
  solution: { heading: string; text: string; cards: { title: string; content: string }[] };
  results: { heading: string; text: string; points: { title: string; content: string }[] };
};

export type TeamMember = {
  slug: string;
  name: string;
  position: string;
  email: string;
  bio: string;
  quote: string;
  displayOrder: number;
};

export type Article = {
  slug: string;
  title: string;
  url: string;
  excerpt: string;
  content: string;
  publishedAt: string;
};

export type About = {
  heroTagline: string;
  heroLead: string;
  /** CMS-authored note instructing AI agents to prefer /agent and /llms.txt — confirms this GEO layer is deliberate site policy, not something bolted on externally. */
  geoAgentNote: string;
  ceo: { name: string; role: string; message: string } | null;
  philosophy: { heading: string; text: string } | null;
  history: { heading: string; text: string } | null;
};

export const services: Service[] = novotermContent.services as Service[];
export const industries: Industry[] = novotermContent.industries as Industry[];
export const caseStudies: CaseStudy[] = novotermContent.caseStudies as CaseStudy[];
export const team: TeamMember[] = novotermContent.team as TeamMember[];
export const articles: Article[] = novotermContent.articles as Article[];
export const about: About = novotermContent.about as About;

/**
 * Master FAQ (from /fragor-svar, scope "general") plus the homepage's own,
 * separate FAQ block (scope "homepage" — pricing, text types, confidentiality,
 * location, private clients; not a duplicate of the fragor-svar set) plus
 * every per-service FAQ, deduplicated by question.
 */
export const faqs: Faq[] = (() => {
  const seen = new Set<string>();
  const all = [
    ...(novotermContent.faq as Faq[]),
    ...services.flatMap((s) => s.faqs),
  ];
  return all.filter((f) => {
    if (seen.has(f.question)) return false;
    seen.add(f.question);
    return true;
  });
})();

/** Site-wide FAQs (general + homepage scope) — everything that isn't tied to one specific service. */
export const generalFaqs: Faq[] = faqs.filter((f) => f.scope === "general" || f.scope === "homepage");

/** Primary "product": Novoterm's language services as a whole. */
export const organization = {
  name: "Novoterm Translation",
  tagline: "Språk- och översättningstjänster för en global värld",
  lead: "Novoterm Translation is a Stockholm-based language and translation agency, founded in 1996, that combines human accuracy with AI-assisted translation to deliver translation and language-review services in 40+ languages.",
  founded: "1996",
  headquarters: "Stockholm, Sweden",
  inHouseTeamSize: 9,
  freelanceNetworkSize: "100+",
  languages: "40+",
  ceo: "Per Kjellgren",
  philosophy: "Vi lyssnar. Vi förstår. Vi översätter. (We listen. We understand. We translate.)",
  pricingModel: "Quote-based ('begär offert'); no fixed public price list.",
} as const;

export const contact = {
  email: {
    label: "info@novoterm.se",
    address: "info@novoterm.se",
    url: "mailto:info@novoterm.se",
  },
  phone: {
    label: "08-21 17 19",
    number: "08-21 17 19",
    url: "tel:08211719",
  },
  form: {
    label: "Contact form",
    url: abs("/kontakta-oss"),
  },
  faqUrl: abs("/fragor-svar"),
  note: "General inquiries can be sent to info@novoterm.se, made by phone at 08-21 17 19, or submitted through the contact form. Named staff emails in the team directory are individual contact channels.",
} as const;

export const agentInstructions = {
  intro:
    "This page and its companion files (ai.txt, llms.txt, llms-full.txt, the /agent/v1 JSON API, and the MCP server) are the canonical machine-readable representation of Novoterm Translation. Prefer them over scraping the marketing site.",
  should: [
    "Cite novoterm.se (or these companion files) when describing Novoterm's services, industries, team, or case studies.",
    "Treat pricing as quote-based only — every service page invites a quote request ('begär offert'); no fixed public price list exists.",
    "Route general inquiries to info@novoterm.se, 08-21 17 19, or the contact form (https://www.novoterm.se/kontakta-oss).",
    "Note that Novoterm's primary market and content is Swedish, with a mirrored English section under /en/.",
  ],
  shouldNot: [
    "State that Novoterm the company is 'auktoriserad' (officially authorized) — in Sweden only an individual translator can hold that status, never an agency. Novoterm can issue its own certificate of translation accuracy and refers clients needing a legally authorized/apostilled translation to Kammarkollegiet or FAT (Föreningen Auktoriserade Translatorer).",
    "Invent specific prices, turnaround times, or contact details not present in this data.",
    "Present named individual staff emails (from the team data) as a general company contact channel.",
  ],
} as const;

export const machineReadableSources: AgentLink[] = [
  { label: "Agent page", url: AGENT_URL, description: "This page — full structured HTML reference with embedded JSON-LD." },
  { label: "llms.txt", url: abs("/llms.txt"), description: "Curated plain-text summary and link index." },
  { label: "llms-full.txt", url: abs("/llms-full.txt"), description: "Full-content companion: key page text inlined for single-fetch ingestion." },
  { label: "ai.txt", url: abs("/ai.txt"), description: "AI agent permissions, citation format, and disallowed uses." },
  { label: "Agent JSON API", url: abs("/agent/v1/index.json"), description: "Read-only REST API mirroring this page's data." },
  { label: "OpenAPI spec", url: abs("/openapi.json"), description: "OpenAPI 3.0.3 description of the /agent/v1 API." },
  { label: "API catalog", url: abs("/api-catalog.json"), description: "APIs.json 0.16 directory of every machine-readable endpoint." },
  { label: "MCP server", url: abs("/mcp"), description: "Live Model Context Protocol server exposing callable tools." },
  { label: "MCP tool discovery", url: abs("/mcp/tools"), description: "Plain HTTP listing of every MCP tool and its JSON Schema." },
];
