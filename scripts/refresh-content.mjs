#!/usr/bin/env node
/**
 * Re-fetches Novoterm's content from the live WordPress REST API and
 * regenerates data/novoterm-content.json and data/novoterm-site-index.json.
 *
 * No API key required — this reads the same public, read-only WP REST API
 * (backend.novoterm.se/wp-json) the live novoterm.se frontend itself calls,
 * including the ACF page_sections on the home, /om-oss, and /fragor-svar
 * pages (hero tagline, CEO letter, philosophy, history, homepage FAQ) as well
 * as the service/industry/case_study/our-team custom post types and the
 * standard posts/headless-videos types for the article library and videos.
 * Firecrawl was used to map the site's URL structure before this WP REST
 * pipeline was identified, and again on 2026-09-15 (this rebuild) to
 * re-verify the current URL structure and to discover the live contact
 * form's real submission mechanics (see lib/agent/contact.ts) — but nothing
 * in this ongoing content refresh depends on it.
 *
 * Run: node scripts/refresh-content.mjs
 * Bumps `meta.crawledAt` to today, which becomes LAST_MODIFIED throughout the
 * app (the HTML page, JSON API, llms.txt/llms-full.txt/ai.txt) — so freshness
 * reflects an actual re-verification pass, not a hand-typed guess.
 */

import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND = "https://backend.novoterm.se/wp-json/wp/v2";
const BASE = "https://www.novoterm.se";

async function fetchAll(type, params = "per_page=100") {
  const res = await fetch(`${BACKEND}/${type}?${params}`);
  if (!res.ok) throw new Error(`Failed to fetch ${type}: ${res.status}`);
  return res.json();
}

/**
 * Named entities WordPress/Gutenberg commonly emit beyond the XML-safe five
 * (amp/lt/gt/quot/apos). &hellip; in particular is WP's excerpt-truncation
 * marker ("Read more" cutoff), so leaving it undecoded means every truncated
 * excerpt ends in the literal text "&hellip;" instead of "…".
 */
const NAMED_ENTITIES = {
  hellip: "…", mdash: "—", ndash: "–",
  rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“",
  copy: "©", reg: "®", trade: "™", deg: "°",
};

function decodeEntities(s) {
  return (s || "")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&(hellip|mdash|ndash|rsquo|lsquo|rdquo|ldquo|copy|reg|trade|deg);/g, (_, name) => NAMED_ENTITIES[name])
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function cleanTitle(t) {
  return decodeEntities((t || "").replace(/<[^>]+>/g, "")).trim();
}

function htmlToText(s) {
  if (!s) return "";
  let out = decodeEntities(s);
  out = out.replace(/<a\s+[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gis, (_, href, rawText) => {
    const text = rawText.replace(/<[^>]+>/g, "");
    // Avoid "https://x (https://x)" when the visible link text is just the URL itself.
    return text.trim() === href.trim() ? href : `${text} (${href})`;
  });
  out = out.replace(/<\/p>\s*<p>/g, "\n\n");
  out = out.replace(/<li>/g, "\n- ").replace(/<\/li>/g, "");
  out = out.replace(/<[^>]+>/g, "");
  // Strip literal WordPress shortcodes (e.g. "[author_card]", "[gallery ids=1,2]",
  // "[/caption]") that survive because they're plain text, not HTML tags — the
  // theme renders them server-side on the live site, but the REST API returns
  // the raw shortcode syntax verbatim in content.rendered for anything the
  // block renderer doesn't expand.
  out = out.replace(/\[\/?[a-z][a-z0-9_-]*(?:\s[^\]]*)?\]/gi, "");
  out = out.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n");
  return out.trim();
}

async function buildContent() {
  const [servicesRaw, industriesRaw, casesRaw, teamRaw, faqPages, postsRaw, homePages, aboutPages] = await Promise.all([
    fetchAll("service"),
    fetchAll("industry"),
    fetchAll("case_study"),
    fetchAll("our-team"),
    fetchAll("pages", "slug=fragor-svar"),
    fetchAll("posts", "per_page=100&_fields=slug,title,excerpt,content,date"),
    fetchAll("pages", "slug=home"),
    fetchAll("pages", "slug=om-oss"),
  ]);

  const services = servicesRaw.map((s) => {
    const sections = s.acf?.sections || [];
    let heading = "", description = "";
    const benefits = [];
    const faqs = [];
    const process = [];
    for (const sec of sections) {
      if (sec.acf_fc_layout === "service_intro" && !description) {
        heading = htmlToText(sec.heading);
        description = htmlToText(sec.sub_heading || sec.description || "");
        if (!description && Array.isArray(sec.content_blocks)) {
          description = sec.content_blocks
            .map((b) => (b.title ? `${cleanTitle(b.title)}: ${htmlToText(b.content)}` : htmlToText(b.content)))
            .filter(Boolean)
            .join("\n\n");
        }
      }
      if (sec.acf_fc_layout === "benefits_section") {
        for (const b of sec.benefits || []) {
          const title = cleanTitle(b.title || "");
          const content = htmlToText(b.benefit_description || "");
          if (title || content) benefits.push({ title, content });
        }
      }
      if (sec.acf_fc_layout === "faq_section") {
        for (const f of sec.faqs || []) {
          faqs.push({ question: cleanTitle(f.faq_title), answer: htmlToText(f.faq_answer), scope: s.slug });
        }
      }
      if (sec.acf_fc_layout === "our_approach" && !process.length) {
        for (const step of sec.steps || []) {
          process.push({
            step: Number(step.step_number || 0),
            tag: cleanTitle(step.step_tag || ""),
            title: cleanTitle(step.step_title || ""),
            description: htmlToText(step.step_description || ""),
          });
        }
      }
    }
    return { slug: s.slug, title: cleanTitle(s.title.rendered), url: `${BASE}/tjanster/${s.slug}`, heading, description, benefits, faqs, process };
  });

  const industries = industriesRaw.map((ind) => {
    const sections = ind.acf?.sections || [];
    let heading = "", description = "", whyNovoterm = null, whatWeTranslate = null;
    let heroHeading = "", heroDescription = "";
    const expertise = [];
    const documentExamples = [];
    for (const sec of sections) {
      if (sec.acf_fc_layout === "industry_hero") {
        // Only the "vara-huvudomraden" overview page has no industry_intro
        // section (it lists categories via an accordion widget instead, which
        // is not real FAQ content despite reusing the faq_section layout —
        // deliberately not extracted as FAQs). Its hero is the fallback
        // description source so this one entry isn't left empty.
        heroHeading = htmlToText(sec.heading);
        heroDescription = htmlToText(sec.sub_heading);
      } else if (sec.acf_fc_layout === "industry_intro") {
        const h = htmlToText(sec.heading);
        const t = htmlToText(sec.main_content);
        if (sec.section_theme === "light" && !description) {
          heading = h; description = t;
        } else if (sec.section_theme === "dark" && !whyNovoterm) {
          whyNovoterm = { heading: h, text: t };
        }
      } else if (sec.acf_fc_layout === "icon_box_section") {
        for (const b of sec.box_details || []) {
          const title = cleanTitle(b.title || "");
          const content = htmlToText(b.benefit_description || "");
          if (title || content) expertise.push({ title, content });
        }
      } else if (sec.acf_fc_layout === "industry_special_heading" && !whatWeTranslate) {
        whatWeTranslate = { heading: htmlToText(sec.heading), text: htmlToText(sec.main_content) };
      } else if (sec.acf_fc_layout === "number_documents_examples") {
        for (const d of sec.document_lists || []) {
          const name = cleanTitle(d.document_name || "");
          if (name) documentExamples.push(name);
        }
      }
    }
    return {
      slug: ind.slug, title: cleanTitle(ind.title.rendered), url: `${BASE}/branscher/${ind.slug}`,
      heading: heading || heroHeading || cleanTitle(ind.title.rendered),
      description: description || heroDescription,
      whyNovoterm, expertise, whatWeTranslate, documentExamples,
    };
  });

  const caseStudies = casesRaw.map((cs) => {
    const sections = cs.acf?.sections || [];
    let heroHeading = "", heroSubheading = "", client = "", industry = "", servicesUsed = "";
    let introHeading = "", narrative = "", aboutClient = "";
    let challenges = [];
    let solution = { heading: "", text: "", cards: [] };
    let results = { heading: "", text: "", points: [] };
    for (const sec of sections) {
      if (sec.acf_fc_layout === "casestudy_hero") {
        heroHeading = htmlToText(sec.heading);
        heroSubheading = htmlToText(sec.sub_heading);
      } else if (sec.acf_fc_layout === "casestudy_introduction") {
        client = sec.client || ""; industry = sec.industry || ""; servicesUsed = sec.services || "";
        // sub_heading carries the substantive narrative (what was actually
        // delivered); left_content is a short "about the client" sidebar —
        // both are real content, neither should be dropped in favor of the other.
        introHeading = htmlToText(sec.heading);
        narrative = htmlToText(sec.sub_heading);
        aboutClient = htmlToText(sec.left_content);
      } else if (sec.acf_fc_layout === "casestudy_challenge") {
        challenges = (sec.challenges || []).map((c) => ({ title: cleanTitle(c.title), content: htmlToText(c.content) }));
      } else if (sec.acf_fc_layout === "casestudy_solution") {
        solution = {
          heading: cleanTitle(sec.heading),
          text: htmlToText(sec.description),
          cards: (sec.solution_cards || []).map((c) => ({ title: cleanTitle(c.title), content: htmlToText(c.content) })),
        };
      } else if (sec.acf_fc_layout === "casestudy_results") {
        results = {
          heading: cleanTitle(sec.heading),
          text: htmlToText(sec.description),
          points: (sec.results_points || []).map((r) => ({ title: cleanTitle(r.title), content: htmlToText(r.content) })),
        };
      }
    }
    return {
      slug: cs.slug, title: cleanTitle(cs.title.rendered), url: `${BASE}/kundcase/${cs.slug}`,
      client, industry, servicesUsed, heroHeading, heroSubheading,
      introHeading, narrative, aboutClient, challenges, solution, results,
    };
  });

  const team = teamRaw
    .map((t) => ({
      slug: t.slug,
      name: cleanTitle(t.title.rendered),
      position: t.acf?.position || "",
      email: t.acf?.email || "",
      bio: htmlToText(t.acf?.bio || ""),
      quote: htmlToText(t.acf?.quote || ""),
      displayOrder: Number(t.acf?.display_order || 0),
    }))
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const faq = [];
  const faqPage = faqPages[0];
  for (const sec of faqPage?.acf?.page_sections || []) {
    if (sec.acf_fc_layout === "faq_section") {
      for (const f of sec.faqs || []) {
        faq.push({ question: cleanTitle(f.faq_title), answer: htmlToText(f.faq_answer), scope: "general" });
      }
    }
  }

  // The homepage carries its own distinct FAQ block (faq_section_global) —
  // a different, non-overlapping set of questions from /fragor-svar (pricing,
  // text types, confidentiality, location, private clients, etc.), not a
  // duplicate of the master FAQ page.
  const homePage = homePages[0];
  let heroTagline = "", heroLead = "", geoAgentNote = "";
  for (const sec of homePage?.acf?.page_sections || []) {
    if (sec.acf_fc_layout === "hero_section") {
      heroTagline = htmlToText(sec.heading);
      heroLead = htmlToText(sec.subheading);
    } else if (sec.acf_fc_layout === "geo_agent_section") {
      geoAgentNote = htmlToText(sec.content);
    } else if (sec.acf_fc_layout === "faq_section_global") {
      for (const f of sec.faqs || []) {
        faq.push({ question: cleanTitle(f.faq_title), answer: htmlToText(f.faq_answer), scope: "homepage" });
      }
    }
  }

  // The /om-oss page carries the CEO's letter, company philosophy, and
  // founding history as their own structured ACF sections — real narrative
  // content distinct from the summary facts already in `organization`.
  const aboutPage = aboutPages[0];
  let ceo = null;
  let philosophy = null;
  let history = null;
  for (const sec of aboutPage?.acf?.page_sections || []) {
    if (sec.acf_fc_layout === "leadership_message") {
      ceo = { name: sec.name || "", role: sec.role || "", message: htmlToText(sec.message || "") };
    } else if (sec.acf_fc_layout === "philosophy_section") {
      const text = [htmlToText(sec.left_description || ""), htmlToText(sec.right_description || "")]
        .filter(Boolean)
        .join("\n\n");
      philosophy = { heading: cleanTitle(sec.heading || ""), text };
    } else if (sec.acf_fc_layout === "history_section") {
      history = { heading: cleanTitle(sec.heading || ""), text: htmlToText(sec.description || "") };
    }
  }

  const articles = postsRaw
    .map((p) => ({
      slug: p.slug,
      title: cleanTitle(p.title.rendered),
      url: `${BASE}/artiklar/${p.slug}`,
      excerpt: htmlToText(p.excerpt?.rendered || ""),
      content: htmlToText(p.content?.rendered || ""),
      publishedAt: p.date,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));

  const about = { heroTagline, heroLead, geoAgentNote, ceo, philosophy, history };

  return {
    meta: { source: "novoterm.se WordPress REST API", crawledAt: new Date().toISOString().slice(0, 10) },
    services, industries, caseStudies, team, faq, articles, about,
  };
}

async function buildSiteIndex(content) {
  const videos = await fetchAll("headless-videos");

  const services = content.services.map((s) => ({ name: s.title, url: s.url }));
  const industries = content.industries.map((i) => ({ name: i.title, url: i.url }));
  const caseStudies = content.caseStudies.map((c) => ({ name: c.title, url: c.url }));
  const articles = content.articles
    .map((a) => ({ name: a.title, url: a.url }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const videoEntries = videos
    .map((v) => ({ name: cleanTitle(v.title.rendered), url: `${BASE}/watch/${v.slug}` }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const company = [
    { name: "Homepage", url: BASE },
    { name: "Om oss (About us — team, CEO's word, philosophy, history)", url: `${BASE}/om-oss` },
    { name: "Kontakta oss (Contact us)", url: `${BASE}/kontakta-oss` },
    { name: "Frågor och svar (FAQ)", url: `${BASE}/fragor-svar` },
  ];

  return {
    siteIndex: [
      { title: "Company", entries: company },
      { title: "Services", entries: services },
      { title: "Industries", entries: industries },
      { title: "Client Cases", entries: caseStudies },
      { title: "Article Library", entries: articles },
      { title: "Video Highlights", entries: videoEntries },
    ],
  };
}

async function main() {
  const content = await buildContent();
  const siteIndex = await buildSiteIndex(content);

  const dataDir = path.join(__dirname, "..", "data");
  await writeFile(path.join(dataDir, "novoterm-content.json"), JSON.stringify(content, null, 2));
  await writeFile(path.join(dataDir, "novoterm-site-index.json"), JSON.stringify(siteIndex, null, 2));

  console.log(`Refreshed content as of ${content.meta.crawledAt}`);
  console.log(
    `services=${content.services.length} industries=${content.industries.length} ` +
      `cases=${content.caseStudies.length} team=${content.team.length} faq=${content.faq.length} ` +
      `articles=${content.articles.length} ` +
      `videos=${siteIndex.siteIndex.find((g) => g.title === "Video Highlights").entries.length}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
