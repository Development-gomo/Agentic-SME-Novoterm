import {
  LAST_MODIFIED,
  about,
  articles,
  caseStudies,
  generalFaqs,
  industries,
  organization,
  services,
  team,
} from "@/app/agent/content";
import { SITE_ORIGIN } from "@/config/site-origin";

const abs = (path: string) => `${SITE_ORIGIN}${path}`;

function buildServicesSection(): string {
  const entries = services.map((s) => {
    const faqLines = s.faqs.map((f) => `**${f.question}**\n${f.answer}`).join("\n\n");
    const processLines = s.process.length
      ? s.process.map((p) => `${p.step}. **${p.tag} — ${p.title}:** ${p.description}`).join("\n")
      : "";
    return [
      `### ${s.title}`,
      s.heading ? `> ${s.heading}` : "",
      s.description,
      s.benefits.length ? s.benefits.map((b) => `- **${b.title}:** ${b.content}`).join("\n") : "",
      processLines ? `**Process**\n${processLines}` : "",
      faqLines,
      `Source: ${s.url}`,
    ]
      .filter(Boolean)
      .join("\n\n");
  });
  return ["## Services", ...entries].join("\n\n");
}

function buildIndustriesSection(): string {
  const entries = industries.map((i) => {
    const why = i.whyNovoterm ? `**${i.whyNovoterm.heading}**\n${i.whyNovoterm.text}` : "";
    const whatWeTranslate = i.whatWeTranslate ? `**${i.whatWeTranslate.heading}**\n${i.whatWeTranslate.text}` : "";
    const expertise = i.expertise.map((e) => `- **${e.title}:** ${e.content}`).join("\n");
    const docs = i.documentExamples.length ? `**Example documents:** ${i.documentExamples.join(", ")}` : "";
    return [`### ${i.title}`, i.description, whatWeTranslate, expertise, why, docs, `Source: ${i.url}`]
      .filter(Boolean)
      .join("\n\n");
  });
  return ["## Industries", ...entries].join("\n\n");
}

function buildCaseStudiesSection(): string {
  const entries = caseStudies.map((c) => {
    const challenges = c.challenges.map((ch) => `- **${ch.title}:** ${ch.content}`).join("\n");
    const solutionCards = c.solution.cards.map((sc) => `- **${sc.title}:** ${sc.content}`).join("\n");
    const resultPoints = c.results.points.map((r) => `- **${r.title}:** ${r.content}`).join("\n");
    return [
      `### ${c.title}`,
      `Client: ${c.client} | Industry: ${c.industry} | Service: ${c.servicesUsed}`,
      c.narrative,
      c.aboutClient ? `**About ${c.client}**\n${c.aboutClient}` : "",
      challenges ? `**Challenge**\n${challenges}` : "",
      c.solution.text ? `**${c.solution.heading || "Solution"}**\n${c.solution.text}\n${solutionCards}` : "",
      c.results.text ? `**${c.results.heading || "Results"}**\n${c.results.text}\n${resultPoints}` : "",
      `Source: ${c.url}`,
    ]
      .filter(Boolean)
      .join("\n\n");
  });
  return ["## Client case studies", ...entries].join("\n\n");
}

function buildTeamSection(): string {
  const entries = team.map((t) => `- **${t.name}** — ${t.position}. ${t.bio}`);
  return ["## Team", ...entries].join("\n\n");
}

function buildFaqSection(): string {
  const entries = generalFaqs.map((f) => `**${f.question}**\n${f.answer}`);
  return ["## Frequently asked questions", ...entries].join("\n\n");
}

function buildAboutSection(): string {
  const parts = [
    about.ceo ? `**${about.ceo.role} — ${about.ceo.name}**\n${about.ceo.message}` : "",
    about.philosophy ? `**${about.philosophy.heading}**\n${about.philosophy.text}` : "",
    about.history ? `**${about.history.heading}**\n${about.history.text}` : "",
  ].filter(Boolean);
  return ["## About Novoterm", ...parts].join("\n\n");
}

/**
 * Every article, in full. Unlike a general-purpose company blog, every
 * article here is on-topic for Novoterm's domain (translation, AI
 * translation, proofreading, industry-specific translation advice), so this
 * inlines the complete library rather than excerpting it — this is exactly
 * the long-tail-question content an AI agent gets asked to answer.
 */
function buildArticlesSection(): string {
  const entries = articles.map((a) =>
    [`### ${a.title}`, a.content, `Source: ${a.url}`].filter(Boolean).join("\n\n"),
  );
  return ["## Article library", ...entries].join("\n\n");
}

export function buildLlmsFullText(): string {
  const sections = [
    "# Novoterm — Full Content for AI",
    `> ${organization.tagline}. ${organization.lead}`,
    `This file inlines the full content of every Novoterm service, industry, case study, team bio, FAQ, and article, so AI systems can ingest everything in a single request. It is the full-content companion to ${abs("/llms.txt")}. Last verified: ${LAST_MODIFIED}.`,
    buildAboutSection(),
    buildServicesSection(),
    buildIndustriesSection(),
    buildCaseStudiesSection(),
    buildTeamSection(),
    buildFaqSection(),
    buildArticlesSection(),
  ];
  return `${sections.join("\n\n")}\n`;
}
