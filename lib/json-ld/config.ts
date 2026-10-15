import { SITE_ORIGIN } from "@/config/site-origin";
import novotermContent from "@/data/novoterm-content.json";

/**
 * General contact details, social profiles and logo, read by
 * scripts/refresh-content.mjs from the site-wide footer and header
 * (theme/v1/footer, theme/v1/header). The address is located by its
 * "<postcode> <city>" line, with the street on the line before it, so an
 * added or removed company-name line does not shift the fields.
 */
const footer = novotermContent.contact;
const postalIndex = footer.addressLines.findIndex((l) => /^(SE-)?\d{3}\s?\d{2}\s+\S/.test(l));
const postalMatch = footer.addressLines[postalIndex]?.match(/^(?:SE-)?(\d{3}\s?\d{2})\s+(.+)$/);
const streetLine = postalIndex > 0 ? footer.addressLines[postalIndex - 1] : "";

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
  logo: footer.logo,
  description:
    "Novoterm Translation is a Stockholm-based language and translation agency, founded in 1996, that combines human accuracy with AI-assisted translation to deliver translation and language-review services in 40+ languages.",
  foundingDate: "1996",
  address: {
    streetAddress: streetLine,
    postalCode: postalMatch?.[1] ?? "",
    locality: postalMatch?.[2] ?? "Stockholm",
    country: "SE",
  },
  sameAs: footer.socialLinks as string[],
  /**
   * General company contact, as published in the footer of every page on
   * novoterm.se. Named staff emails on individual team-member profiles (see
   * the `team` array) are personal channels, not company contacts.
   */
  contactPoint: {
    type: "customer service",
    email: footer.email,
    telephone: footer.phone,
    /** E.164-style form of the Swedish number: "08-21 17 19" -> "+46 8 21 17 19". */
    telephoneInternational: footer.phone.replace(/^0/, "+46 ").replace("-", " "),
    url: `${SITE_ORIGIN}/kontakta-oss`,
  },
} as const;
