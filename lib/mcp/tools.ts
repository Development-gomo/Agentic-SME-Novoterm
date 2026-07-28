import {
  about,
  articles,
  caseStudies,
  contact,
  faqs,
  generalFaqs,
  industries,
  organization,
  services,
  team,
} from "@/app/agent/content";
import { SITE_ORIGIN } from "@/config/site-origin";
import { SITE_CONFIG } from "@/lib/json-ld/config";
import { z } from "zod";
import { errorContent, jsonContent, type McpTool } from "./types";

/** Identity advertised over the MCP protocol and on /mcp/health. */
export const MCP_SERVER_NAME = "novoterm";
export const MCP_SERVER_VERSION = "1.0.0";

/** Base URL of the read-only REST API the MCP tools mirror. */
export const MCP_API_BASE = `${SITE_ORIGIN}/agent/v1`;

const readOnly = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

const getCompany: McpTool = {
  name: "get_company",
  title: "Get Company",
  description:
    "Returns Novoterm Translation's company identity: founding year, headquarters, team size, languages served, philosophy, pricing model, confirmed contact pathways, and the CEO's letter/company history from the /om-oss page.",
  inputSchema: {},
  annotations: readOnly,
  handler: () =>
    jsonContent({
      name: SITE_CONFIG.name,
      legalName: SITE_CONFIG.legalName,
      url: SITE_CONFIG.url,
      founded: organization.founded,
      headquarters: organization.headquarters,
      inHouseTeamSize: organization.inHouseTeamSize,
      freelanceNetworkSize: organization.freelanceNetworkSize,
      languages: organization.languages,
      ceo: organization.ceo,
      philosophy: organization.philosophy,
      pricingModel: organization.pricingModel,
      contact,
      about,
    }),
};

const listServices: McpTool = {
  name: "list_services",
  title: "List Services",
  description:
    "Returns all Novoterm translation and language-review services (Premium Translation, AI Translation, Proofreading, Text Review, Text Processing, and more), each with its slug, title, and URL.",
  inputSchema: {},
  annotations: readOnly,
  handler: () =>
    jsonContent({
      count: services.length,
      services: services.map((s) => ({ slug: s.slug, title: s.title, url: s.url, heading: s.heading })),
    }),
};

const getService: McpTool = {
  name: "get_service",
  title: "Get Service",
  description:
    "Returns a single Novoterm service by slug, including its full description, benefits, and service-specific FAQs. Use list_services to discover valid slugs.",
  inputSchema: {
    slug: z.string().min(1).describe("Service slug, e.g. 'premiumoversattning' or 'ai-oversattning'."),
  },
  annotations: readOnly,
  handler: (args) => {
    const slug = typeof args.slug === "string" ? args.slug.trim() : "";
    const service = services.find((s) => s.slug === slug);
    if (!service) {
      return errorContent(`No service found with slug "${slug}". Use list_services to see available slugs.`);
    }
    return jsonContent(service);
  },
};

const listIndustries: McpTool = {
  name: "list_industries",
  title: "List Industries",
  description:
    `Returns all ${industries.length} industries Novoterm serves (financial, legal, medical, technical, IT, marketing/PR, sustainability, HR, education, construction, energy, defence, security, fashion/design/art, plus an overview entry), each with its slug, title, and URL.`,
  inputSchema: {},
  annotations: readOnly,
  handler: () =>
    jsonContent({
      count: industries.length,
      industries: industries.map((i) => ({ slug: i.slug, title: i.title, url: i.url })),
    }),
};

const getIndustry: McpTool = {
  name: "get_industry",
  title: "Get Industry",
  description:
    "Returns a single industry by slug, including its full description of the sector-specific translation expertise Novoterm offers. Use list_industries to discover valid slugs.",
  inputSchema: {
    slug: z.string().min(1).describe("Industry slug, e.g. 'finansiell-oversattning' or 'juridisk-oversattning'."),
  },
  annotations: readOnly,
  handler: (args) => {
    const slug = typeof args.slug === "string" ? args.slug.trim() : "";
    const industry = industries.find((i) => i.slug === slug);
    if (!industry) {
      return errorContent(`No industry found with slug "${slug}". Use list_industries to see available slugs.`);
    }
    return jsonContent(industry);
  },
};

const listCaseStudies: McpTool = {
  name: "list_case_studies",
  title: "List Case Studies",
  description:
    "Returns Novoterm's client case studies (Naturvårdsverket, Julius Production, Moderna Museet, True Stories/Viking Line), each with the client, industry, services used, and a short introduction.",
  inputSchema: {},
  annotations: readOnly,
  handler: () =>
    jsonContent({
      count: caseStudies.length,
      caseStudies: caseStudies.map((c) => ({
        slug: c.slug,
        title: c.title,
        url: c.url,
        client: c.client,
        industry: c.industry,
        servicesUsed: c.servicesUsed,
        narrative: c.narrative,
      })),
    }),
};

const getCaseStudy: McpTool = {
  name: "get_case_study",
  title: "Get Case Study",
  description:
    "Returns a single client case study by slug in full: introduction, challenges, solution, and results. Use list_case_studies to discover valid slugs.",
  inputSchema: {
    slug: z.string().min(1).describe("Case study slug, e.g. 'naturvardsverket' or 'julius-production'."),
  },
  annotations: readOnly,
  handler: (args) => {
    const slug = typeof args.slug === "string" ? args.slug.trim() : "";
    const study = caseStudies.find((c) => c.slug === slug);
    if (!study) {
      return errorContent(`No case study found with slug "${slug}". Use list_case_studies to see available slugs.`);
    }
    return jsonContent(study);
  },
};

const listTeam: McpTool = {
  name: "list_team",
  title: "List Team",
  description:
    `Returns Novoterm's in-house team: name, role, and bio for each of the ${team.length} team members based in Stockholm.`,
  inputSchema: {},
  annotations: readOnly,
  handler: () =>
    jsonContent({
      count: team.length,
      team: team.map((t) => ({ name: t.name, position: t.position, bio: t.bio })),
    }),
};

const searchFaq: McpTool = {
  name: "search_faq",
  title: "Search FAQ",
  description:
    "Searches Novoterm's FAQ (the general FAQ page, the homepage's own separate FAQ, and every per-service FAQ) for questions matching a keyword. Returns matching question/answer pairs. Omit the query to return the site-wide FAQ (general + homepage) in full.",
  inputSchema: {
    query: z.string().optional().describe("Keyword to search for in the FAQ questions and answers, e.g. 'auktoriserad' or 'pricing'."),
  },
  annotations: readOnly,
  handler: (args) => {
    const query = typeof args.query === "string" ? args.query.trim().toLowerCase() : "";
    const matches = query
      ? faqs.filter(
          (f) => f.question.toLowerCase().includes(query) || f.answer.toLowerCase().includes(query),
        )
      : generalFaqs;
    return jsonContent({ query: query || null, count: matches.length, faqs: matches });
  },
};

const searchArticles: McpTool = {
  name: "search_articles",
  title: "Search Articles",
  description:
    `Searches Novoterm's article library (${articles.length} articles on translation, AI translation, proofreading, and industry-specific translation advice) by keyword in the title or body. Returns matching articles with their full text. Omit the query to list all article titles.`,
  inputSchema: {
    query: z.string().optional().describe("Keyword to search for, e.g. 'transcreation' or 'certifierad översättare'."),
  },
  annotations: readOnly,
  handler: (args) => {
    const query = typeof args.query === "string" ? args.query.trim().toLowerCase() : "";
    if (!query) {
      return jsonContent({
        count: articles.length,
        articles: articles.map((a) => ({ slug: a.slug, title: a.title, url: a.url, excerpt: a.excerpt })),
      });
    }
    const matches = articles.filter(
      (a) => a.title.toLowerCase().includes(query) || a.content.toLowerCase().includes(query),
    );
    return jsonContent({ query, count: matches.length, articles: matches });
  },
};

const getArticle: McpTool = {
  name: "get_article",
  title: "Get Article",
  description: "Returns a single Novoterm article by slug, in full. Use search_articles to discover valid slugs.",
  inputSchema: {
    slug: z.string().min(1).describe("Article slug, e.g. 'vad-ar-transcreation'."),
  },
  annotations: readOnly,
  handler: (args) => {
    const slug = typeof args.slug === "string" ? args.slug.trim() : "";
    const article = articles.find((a) => a.slug === slug);
    if (!article) {
      return errorContent(`No article found with slug "${slug}". Use search_articles to see available slugs.`);
    }
    return jsonContent(article);
  },
};

/** The full ordered tool registry. Every tool is read-only. */
export const mcpTools: McpTool[] = [
  getCompany,
  listServices,
  getService,
  listIndustries,
  getIndustry,
  listCaseStudies,
  getCaseStudy,
  listTeam,
  searchFaq,
  searchArticles,
  getArticle,
];
