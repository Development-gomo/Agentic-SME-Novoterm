import {
  LAST_MODIFIED,
  caseStudies,
  contact,
  generalFaqs,
  industries,
  organization,
  services,
} from "@/app/agent/content";
import { SITE_ORIGIN } from "@/config/site-origin";
import { siteIndex } from "@/lib/agent/site-index";

const abs = (path: string) => `${SITE_ORIGIN}${path}`;

export function buildLlmsText(): string {
  const serviceLinks = services
    .map((s) => `- [${s.title}](${s.url})${s.heading ? `: ${s.heading}` : ""}`)
    .join("\n");
  const industryLinks = industries.map((i) => `- [${i.title}](${i.url})`).join("\n");
  const caseLinks = caseStudies
    .map((c) => `- [${c.title}](${c.url}): ${c.client} — ${c.servicesUsed}`)
    .join("\n");

  const keyPagesGroups = siteIndex
    .filter((g) => ["Company", "Services", "Industries", "Client Cases"].includes(g.title))
    .map((g) => `### ${g.title}\n${g.entries.map((e) => `- [${e.name}](${e.url})`).join("\n")}`)
    .join("\n\n");

  const articleGroup = siteIndex.find((g) => g.title === "Article Library");
  const videoGroup = siteIndex.find((g) => g.title === "Video Highlights");
  const selectedFaqLines = generalFaqs
    .slice(0, 8)
    .map((f) => `- **${f.question}** — ${f.answer}`)
    .join("\n");

  return `# Novoterm

> ${organization.tagline}. ${organization.lead}

Novoterm Translation was founded in ${organization.founded} and is based in ${organization.headquarters}. The in-house team of ${organization.inHouseTeamSize} works with a network of ${organization.freelanceNetworkSize} freelance translators and reviewers to provide translation and language-review services in ${organization.languages} languages.

## Summary

- Founded: ${organization.founded}
- Headquarters: ${organization.headquarters}
- Languages: ${organization.languages}
- In-house team: ${organization.inHouseTeamSize}, backed by ${organization.freelanceNetworkSize} freelance translators/reviewers
- CEO: ${organization.ceo}
- Pricing model: ${organization.pricingModel}
- Philosophy: ${organization.philosophy}

## Services

${serviceLinks}

## Industries (${industries.length})

${industryLinks}

## Client Cases

${caseLinks}

## Key Pages

${keyPagesGroups}

## Frequently Asked Questions (selected)

${selectedFaqLines}

Full FAQ: ${abs("/fragor-svar")} (and see [llms-full.txt](${abs("/llms-full.txt")}) for every question, including per-service FAQs)

## Machine-Readable Version

- [Agent page](${abs("/agent")})
- [Full content (llms-full.txt)](${abs("/llms-full.txt")})
- [Agent JSON API](${abs("/agent/v1/index.json")})
- [OpenAPI spec](${abs("/openapi.json")})
- [API catalog](${abs("/api-catalog.json")})
- [MCP server](${abs("/mcp")}) ([tool discovery](${abs("/mcp/tools")}))

## Article Library (${articleGroup?.entries.length ?? 0} articles)

Full index: ${abs("/artiklar")}

## Video Highlights (${videoGroup?.entries.length ?? 0} videos)

Full index: ${abs("/videos")}

## Notes for AI Agents

- Bilingual site: Swedish (primary) and English (under /en/, partially mirrored — not every article has an English translation).
- Contact: [${contact.email.address}](${contact.email.url}), ${contact.phone.number}, or the [contact form](${contact.form.url}).
- Last verified: ${LAST_MODIFIED}.
`;
}
