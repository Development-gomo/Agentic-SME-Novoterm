import { about, contact, languageList, organization, testimonials } from "@/app/agent/content";
import { agentApiResponse, corsPreflight } from "@/lib/agent/api";
import { SITE_CONFIG } from "@/lib/json-ld/config";

export const dynamic = "force-static";
export const OPTIONS = corsPreflight;

export function GET() {
  return agentApiResponse("company.json", {
    name: SITE_CONFIG.name,
    legalName: SITE_CONFIG.legalName,
    url: SITE_CONFIG.url,
    description: SITE_CONFIG.description,
    foundingDate: SITE_CONFIG.foundingDate,
    headquarters: organization.headquarters,
    address: SITE_CONFIG.address,
    postalAddress: organization.address,
    sameAs: SITE_CONFIG.sameAs,
    inHouseTeamSize: organization.inHouseTeamSize,
    freelanceNetworkSize: organization.freelanceNetworkSize,
    languages: organization.languages,
    languageList,
    ceo: organization.ceo,
    philosophy: organization.philosophy,
    pricingModel: organization.pricingModel,
    contact,
    about,
    testimonials,
  });
}
