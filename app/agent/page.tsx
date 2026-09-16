import type { Metadata } from "next";
import { SITE_ORIGIN } from "@/config/site-origin";
import { SITE_CONFIG } from "@/lib/json-ld/config";
import { siteIndex } from "@/lib/agent/site-index";
import {
  AGENT_PATH,
  AGENT_URL,
  LAST_MODIFIED,
  PAGE_PUBLISHED,
  SITE_CRAWLED,
  about,
  agentInstructions,
  caseStudies,
  contact,
  generalFaqs,
  industries,
  machineReadableSources,
  organization,
  services,
  team,
} from "./content";

const PAGE_TITLE = "Novoterm — Machine-Readable Site for AI Agents and LLMs";
const PAGE_DESCRIPTION =
  "Machine-readable overview of Novoterm Translation for AI agents: services, industries, team, case studies, FAQ, and a full site index.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: AGENT_PATH },
  openGraph: { title: PAGE_TITLE, description: PAGE_DESCRIPTION, url: AGENT_PATH },
  other: {
    "date-published": PAGE_PUBLISHED,
    "last-modified": LAST_MODIFIED,
    "date-modified": LAST_MODIFIED,
    "last-crawled": SITE_CRAWLED,
  },
};

const ORG_ID = `${SITE_ORIGIN}/#organization`;

function buildGraph() {
  const organizationLd = {
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE_CONFIG.name,
    legalName: SITE_CONFIG.legalName,
    url: SITE_CONFIG.url,
    description: SITE_CONFIG.description,
    foundingDate: SITE_CONFIG.foundingDate,
    address: {
      "@type": "PostalAddress",
      addressLocality: SITE_CONFIG.address.locality,
      addressCountry: SITE_CONFIG.address.country,
    },
    knowsAbout: industries.map((i) => i.title),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Novoterm Services",
      itemListElement: services.map((s) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s.title, url: s.url },
      })),
    },
  };

  const webPage = {
    "@type": "WebPage",
    "@id": AGENT_URL,
    name: "Novoterm Machine-Readable Site",
    url: AGENT_URL,
    datePublished: PAGE_PUBLISHED,
    dateModified: LAST_MODIFIED,
    publisher: { "@id": ORG_ID },
  };

  const breadcrumb = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Novoterm", item: SITE_ORIGIN },
      { "@type": "ListItem", position: 2, name: "Machine-Readable Site", item: AGENT_URL },
    ],
  };

  const faqPage = {
    "@type": "FAQPage",
    "@id": `${AGENT_URL}#faq`,
    mainEntity: generalFaqs
      .map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
  };

  return {
    "@context": "https://schema.org",
    "@graph": [organizationLd, webPage, breadcrumb, faqPage],
  };
}

const STYLE = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0d0f12; --bg-alt: #111418; --border: #1e2530;
    --cyan: #58d4e8; --amber: #f0a500; --muted: #4a5568;
    --text: #c9d1d9; --text-dim: #6e7681; --link: #58a6ff;
    --font: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Courier New', monospace;
  }
  html { font-size: 14px; }
  body { font-family: var(--font); background: var(--bg); color: var(--text);
         line-height: 1.75; padding: 48px 32px; max-width: 900px; margin: 0 auto; }
  h1, h2, h3, h4 { font-family: var(--font); font-size: 1rem; font-weight: 700; color: #6dd5fa; margin: 2rem 0 .5rem; }
  h1 { color: var(--cyan); font-size: 1.3rem; }
  h1::before { content: '# '; color: var(--muted); }
  h2::before { content: '## '; color: var(--muted); }
  h3::before { content: '### '; color: var(--muted); }
  p { margin: .5rem 0 1rem; }
  a { color: var(--link); text-decoration: none; }
  a:hover { text-decoration: underline; color: var(--cyan); }
  section { border-top: 1px solid var(--border); padding: 2rem 0 1rem; }
  section:first-of-type { border-top: none; }
  ul, ol { padding-left: 1.6em; margin: .5rem 0 1rem; }
  li { margin-bottom: .3rem; }
  article { border-left: 3px solid var(--border); padding: .75rem 0 .75rem 1.25rem; margin: 1rem 0; }
  article:hover { border-left-color: var(--cyan); }
  dl { margin: .5rem 0 1rem; }
  dt { color: var(--text-dim); font-size: .85rem; margin-top: .75rem; }
  dd { color: var(--text); padding-left: 1em; }
  code { background: #161b22; color: var(--amber); padding: .1em .35em; border-radius: 3px; font-size: .92em; }
  details { border: 1px solid var(--border); border-radius: 4px; padding: .75rem 1rem; margin: .5rem 0; background: var(--bg-alt); }
  summary { cursor: pointer; color: var(--amber); font-weight: 700; }
`;

export default function AgentPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />
      <script
        type="application/ld+json"
        // Escape "<" so a CMS field containing a literal "</script>" (or "<!--")
        // can never break out of this script tag — the escape is invisible to
        // JSON-LD parsers, which read < exactly like a literal "<".
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildGraph()).replace(/</g, "\\u003c") }}
      />

      <h1>Novoterm Translation</h1>
      <p style={{ color: "var(--text-dim)" }}>
        Machine-readable reference for AI agents and LLMs. Human site:{" "}
        <a href={SITE_ORIGIN}>novoterm.se</a>
      </p>

      <section id="metadata">
        <h2>Page Metadata</h2>
        <dl>
          <dt>Page published</dt>
          <dd><time dateTime={PAGE_PUBLISHED}>{PAGE_PUBLISHED}</time></dd>
          <dt>Site crawled</dt>
          <dd><time dateTime={SITE_CRAWLED}>{SITE_CRAWLED}</time></dd>
          <dt>Page last updated</dt>
          <dd><time dateTime={LAST_MODIFIED}>{LAST_MODIFIED}</time></dd>
          <dt>Last verified</dt>
          <dd>{LAST_MODIFIED}</dd>
          <dt>Source site</dt>
          <dd><a href={SITE_ORIGIN}>{SITE_ORIGIN}/</a></dd>
          <dt>Purpose</dt>
          <dd>Complete machine-readable representation of novoterm.se for AI agents, LLMs, and automated retrieval systems.</dd>
        </dl>
      </section>

      <nav id="site-nav">
        <h2>Site Navigation Index</h2>
        <ul>
          {[
            "llm-discovery", "agent-instructions", "overview", "about", "services",
            "industries", "cases", "team", "faq", "site-index",
          ].map((id) => (
            <li key={id}><a href={`#${id}`}>{id.replace(/-/g, " ")}</a></li>
          ))}
        </ul>
      </nav>

      <section id="llm-discovery">
        <h2>LLM Discovery Files</h2>
        <ul>
          {machineReadableSources.map((s) => (
            <li key={s.url}><a href={s.url}>{s.label}</a> — {s.description}</li>
          ))}
        </ul>
      </section>

      <section id="agent-instructions">
        <h2>Agent Instructions</h2>
        <p>{agentInstructions.intro}</p>
        <h3>An AI system should</h3>
        <ul>{agentInstructions.should.map((item) => <li key={item}>{item}</li>)}</ul>
        <h3>An AI system should not</h3>
        <ul>{agentInstructions.shouldNot.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section id="overview">
        <h2>Company Overview</h2>
        <dl>
          <dt>Founded</dt><dd>{organization.founded}</dd>
          <dt>Headquarters</dt><dd>{organization.headquarters}</dd>
          <dt>In-house team</dt><dd>{organization.inHouseTeamSize}, backed by a network of {organization.freelanceNetworkSize} freelance translators/reviewers worldwide</dd>
          <dt>Languages</dt><dd>{organization.languages}</dd>
          <dt>CEO</dt><dd>{organization.ceo}</dd>
          <dt>Philosophy</dt><dd>{organization.philosophy}</dd>
          <dt>Pricing model</dt><dd>{organization.pricingModel}</dd>
          <dt>Contact</dt><dd><a href={contact.form.url}>{contact.form.label}</a></dd>
        </dl>
        <p>{organization.lead}</p>
      </section>

      <section id="about">
        <h2>About Novoterm</h2>
        {about.ceo && (
          <article>
            <h3>{about.ceo.role} — {about.ceo.name}</h3>
            <p>{about.ceo.message}</p>
          </article>
        )}
        {about.philosophy && (
          <article>
            <h3>{about.philosophy.heading}</h3>
            <p>{about.philosophy.text}</p>
          </article>
        )}
        {about.history && (
          <article>
            <h3>{about.history.heading}</h3>
            <p>{about.history.text}</p>
          </article>
        )}
      </section>

      <section id="services">
        <h2>Services</h2>
        {services.map((s) => (
          <article key={s.slug}>
            <h3><a href={s.url}>{s.title}</a></h3>
            {s.heading && <p><strong>{s.heading}</strong></p>}
            {s.description && <p>{s.description}</p>}
            {s.process.length > 0 && (
              <p style={{ color: "var(--text-dim)" }}>
                Process: {s.process.map((p) => p.tag).join(" → ")} (full text: <a href="/llms-full.txt">llms-full.txt</a>)
              </p>
            )}
          </article>
        ))}
      </section>

      <section id="industries">
        <h2>Industries ({industries.length})</h2>
        {industries.map((i) => (
          <article key={i.slug}>
            <h3><a href={i.url}>{i.title}</a></h3>
            {i.description && <p>{i.description}</p>}
            {i.documentExamples.length > 0 && (
              <p style={{ color: "var(--text-dim)" }}>Example documents: {i.documentExamples.join(", ")}</p>
            )}
          </article>
        ))}
      </section>

      <section id="cases">
        <h2>Client Cases</h2>
        {caseStudies.map((c) => (
          <article key={c.slug}>
            <h3><a href={c.url}>{c.title}</a></h3>
            <dl>
              <dt>Client</dt><dd>{c.client}</dd>
              <dt>Industry</dt><dd>{c.industry}</dd>
              <dt>Service</dt><dd>{c.servicesUsed}</dd>
            </dl>
            <p>{c.narrative}</p>
            {c.aboutClient && (
              <p style={{ color: "var(--text-dim)" }}>
                <strong>About {c.client}:</strong> {c.aboutClient}
              </p>
            )}
          </article>
        ))}
      </section>

      <section id="team">
        <h2>Team</h2>
        <dl>
          {team.map((t) => (
            <div key={t.slug}>
              <dt>{t.name}</dt>
              <dd>{t.position} — {t.bio}</dd>
            </div>
          ))}
        </dl>
        <p style={{ color: "var(--text-dim)" }}>{contact.note}</p>
      </section>

      <section id="faq">
        <h2>FAQ</h2>
        {generalFaqs.map((f) => (
          <details key={f.question}>
            <summary>{f.question}</summary>
            <p>{f.answer}</p>
          </details>
        ))}
      </section>

      <section id="site-index">
        <h2>Full Site Index</h2>
        {siteIndex.map((group) => (
          <div key={group.title}>
            <h3>{group.title} ({group.entries.length})</h3>
            <ul>
              {group.entries.map((e) => (
                <li key={e.url}><a href={e.url}>{e.name}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </>
  );
}
