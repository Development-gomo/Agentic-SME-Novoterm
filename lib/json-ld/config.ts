import { SITE_ORIGIN } from "@/config/site-origin";

/**
 * Shared organization identity, consumed by the agent page JSON-LD, the
 * /agent/v1/company.json endpoint, /openapi.json, /api-catalog.json, and the
 * MCP get_company tool — so the company's identity can never drift between
 * surfaces.
 */
export const SITE_CONFIG = {
  name: "Novoterm Translation",
  legalName: "Novoterm Translation AB",
  url: SITE_ORIGIN,
  logo: `${SITE_ORIGIN}/logo.png`,
  description:
    "Novoterm Translation is a Stockholm-based language and translation agency, founded in 1996, that combines human accuracy with AI-assisted translation to deliver translation and language-review services in 40+ languages.",
  foundingDate: "1996",
  address: {
    locality: "Stockholm",
    country: "SE",
  },
  sameAs: [] as string[],
  contactPoint: {
    type: "customer service",
    email: "info@novoterm.se",
    telephone: "+46 8 21 17 19",
    url: `${SITE_ORIGIN}/kontakta-oss`,
  },
} as const;
