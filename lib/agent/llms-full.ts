import {
  LAST_MODIFIED,
  about,
  articles,
  caseStudies,
  generalFaqs,
  industries,
  organization,
  pages,
  services,
  team,
  testimonials,
  videos,
  type ContentSection,
  type Testimonial,
} from "@/app/agent/content";
import { SITE_ORIGIN } from "@/config/site-origin";

const abs = (path: string) => `${SITE_ORIGIN}${path}`;

function renderSection(sec: ContentSection): string {
  return [
    sec.heading ? `**${sec.heading}**` : "",
    sec.text,
    sec.items
      .map((i) => `- ${i.title && i.content ? `**${i.title}:** ${i.content}` : i.title ? `**${i.title}**` : i.content}`)
      .join("\n"),
  ]
    .filter(Boolean)
    .join("\n");
}

function buildServicesSection(): string {
  const entries = services.map((s) => {
    const faqLines = s.faqs.map((f) => `**${f.question}**\n${f.answer}`).join("\n\n");
    const processLines = s.process.length
      ? s.process.map((p) => `${p.step}. **${p.tag} — ${p.title}:** ${p.description}`).join("\n")
      : "";
    return [
      `### ${s.title}`,
      s.heading ? `> ${s.heading}` : "",
      s.heroText,
      s.description,
      s.benefitsIntro,
      s.benefits.length ? s.benefits.map((b) => `- **${b.title}:** ${b.content}`).join("\n") : "",
      processLines ? `**Process**\n${processLines}` : "",
      ...s.extraSections.map(renderSection),
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
    const faqLines = i.faqs.map((f) => `**${f.question}**\n${f.answer}`).join("\n\n");
    return [
      `### ${i.title}`,
      i.heroText && i.heroText !== i.description ? i.heroText : "",
      i.description,
      ...i.extraSections.map(renderSection),
      whatWeTranslate,
      i.expertiseIntro,
      expertise,
      why,
      docs,
      faqLines,
      `Source: ${i.url}`,
    ]
      .filter(Boolean)
      .join("\n\n");
  });
  return ["## Industries", ...entries].join("\n\n");
}

function buildPagesSection(): string {
  const entries = pages.map((p) => {
    const docs = p.documentExamples.length ? `**Example documents:** ${p.documentExamples.join(", ")}` : "";
    const faqLines = p.faqs.map((f) => `**${f.question}**\n${f.answer}`).join("\n\n");
    return [`### ${p.title}`, p.description, p.sections.map(renderSection).join("\n\n"), docs, faqLines, `Source: ${p.url}`]
      .filter(Boolean)
      .join("\n\n");
  });
  return ["## Landing pages", ...entries].join("\n\n");
}

function buildCaseStudiesSection(): string {
  const entries = caseStudies.map((c) => {
    const challenges = c.challenges.map((ch) => `- **${ch.title}:** ${ch.content}`).join("\n");
    const solutionCards = c.solution.cards.map((sc) => `- **${sc.title}:** ${sc.content}`).join("\n");
    const resultPoints = c.results.points.map((r) => `- **${r.title}:** ${r.content}`).join("\n");
    return [
      `### ${c.title}`,
      `Client: ${c.client} | Industry: ${c.industry} | Service: ${c.servicesUsed}`,
      c.heroSubheading ? `> ${c.heroSubheading}` : "",
      c.narrative,
      c.aboutClient ? `**About ${c.client}**\n${c.aboutClient}` : "",
      challenges ? [`**${c.challengeHeading || "Challenge"}**`, c.challengeText, challenges].filter(Boolean).join("\n") : "",
      c.solution.text ? `**${c.solution.heading || "Solution"}**\n${c.solution.text}\n${solutionCards}` : "",
      c.results.text ? `**${c.results.heading || "Results"}**\n${c.results.text}\n${resultPoints}` : "",
      ...c.extraSections.map(renderSection),
      c.testimonial ? `**From the client**\n> ${c.testimonial.quote}\n> — ${c.testimonial.author}, ${c.testimonial.role}` : "",
      `Source: ${c.url}`,
    ]
      .filter(Boolean)
      .join("\n\n");
  });
  return ["## Client case studies", ...entries].join("\n\n");
}

function buildVideosSection(): string {
  const entries = videos.map((v) =>
    [`### ${v.title}`, v.description, v.relatedPage ? `Related page: ${v.relatedPage}` : "", `Source: ${v.url}`]
      .filter(Boolean)
      .join("\n\n"),
  );
  return ["## Videos", ...entries].join("\n\n");
}

function renderQuote(q: Testimonial): string {
  return `> ${q.quote.replace(/\n+/g, " ")}\n> — ${[q.name, q.role].filter(Boolean).join(", ")}`;
}

function buildTestimonialsSection(): string {
  return [
    "## Testimonials",
    "### From clients",
    ...testimonials.clients.map(renderQuote),
    "### From freelance translators",
    ...testimonials.translators.map(renderQuote),
  ].join("\n\n");
}

function buildTeamSection(): string {
  const entries = team.map((t) => `- **${t.name}** — ${t.position}. ${t.bio}${t.quote ? ` "${t.quote}"` : ""}`);
  return ["## Team", ...entries].join("\n\n");
}

function buildFaqSection(): string {
  const entries = generalFaqs.map((f) => `**${f.question}**\n${f.answer}`);
  return ["## Frequently asked questions", ...entries].join("\n\n");
}

function buildAboutSection(): string {
  const parts = [
    about.heroTagline ? `**${about.heroTagline}**\n${about.heroLead}` : "",
    ...about.homeSections.map(renderSection),
    ...about.faqPageSections.map(renderSection),
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
    [
      `### ${a.title}`,
      `Published: ${a.publishedAt.slice(0, 10)}${a.author ? ` | Author: ${a.author.name}` : ""}`,
      a.summary ? `> ${a.summary}` : "",
      a.content,
      a.author?.bio ? `**About the author:** ${a.author.bio}` : "",
      `Source: ${a.url}`,
    ]
      .filter(Boolean)
      .join("\n\n"),
  );
  return ["## Article library", ...entries].join("\n\n");
}

export function buildLlmsFullText(): string {
  const sections = [
    "# Novoterm — Full Content for AI",
    `> ${organization.tagline}. ${organization.lead}`,
    `This file inlines the full content of every Novoterm service, industry, landing page, case study, video, testimonial, team bio, FAQ, and article, so AI systems can ingest everything in a single request. It is the full-content companion to ${abs("/llms.txt")}. Last verified: ${LAST_MODIFIED}.`,
    buildAboutSection(),
    buildServicesSection(),
    buildIndustriesSection(),
    buildPagesSection(),
    buildCaseStudiesSection(),
    buildVideosSection(),
    buildTestimonialsSection(),
    buildTeamSection(),
    buildFaqSection(),
    buildArticlesSection(),
  ];
  return `${sections.join("\n\n")}\n`;
}
