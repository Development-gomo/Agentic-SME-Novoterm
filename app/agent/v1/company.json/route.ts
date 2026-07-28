import { about, contact, organization } from "@/app/agent/content";
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
    inHouseTeamSize: organization.inHouseTeamSize,
    freelanceNetworkSize: organization.freelanceNetworkSize,
    languages: organization.languages,
    ceo: organization.ceo,
    philosophy: organization.philosophy,
    pricingModel: organization.pricingModel,
    contact,
    about,
  });
}
