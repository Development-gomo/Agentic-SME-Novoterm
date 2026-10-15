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
 * form's real submission mechanics (see lib/agent/contact.ts), and on
 * 2026-10-14 for the October rebuild's live-site comparison — but nothing in
 * this ongoing content refresh depends on it.
 *
 * Run: node scripts/refresh-content.mjs
 * Bumps `meta.crawledAt` to today, which becomes LAST_MODIFIED throughout the
 * app (the HTML page, JSON API, llms.txt/llms-full.txt/ai.txt) — so freshness
 * reflects an actual re-verification pass, not a hand-typed guess.
 */

import { copyFile, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND = "https://backend.novoterm.se/wp-json/wp/v2";
const BASE = "https://www.novoterm.se";

/**
 * Standalone marketing pages (WP `pages`, not a custom post type) with real,
 * indexable content of their own: the language overview (/sprak) and the
 * landing page for production and communications agencies. Extracted into
 * `pages` with their sections and FAQs.
 */
const LANDING_PAGE_SLUGS = ["sprak", "produktions-byraer-kommunikations-byraer"];

/** The /sprak page's full language list ("Se fler språk"), served by the theme's own REST route. */
async function fetchLanguages() {
  const res = await fetch(`${BACKEND.replace("/wp/v2", "")}/theme/v1/languages`);
  if (!res.ok) throw new Error(`Failed to fetch languages: ${res.status}`);
  const body = await res.json();
  return (body.list_of_languages || []).map((l) => cleanTitle(l.name)).filter(Boolean);
}

/**
 * Video pages carry no ACF content in the WP REST API — their description,
 * duration and YouTube embed are rendered from YouTube data into a
 * VideoObject JSON-LD block on the public page, so that block is read here.
 */
async function fetchVideos() {
  const raw = await fetchAll("headless-videos");
  const videos = [];
  // No isNoindex() filter here: Yoast marks every headless video noindex in
  // the backend, but the public /videor/ pages are indexable and in the
  // sitemap — the backend flag does not reach the frontend for this type.
  for (const v of raw) {
    const url = `${BASE}/videor/${v.slug}`;
    let ld = null;
    const res = await fetch(url);
    if (res.ok) {
      const html = await res.text();
      for (const m of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
        try {
          const data = JSON.parse(m[1]);
          const nodes = [data, ...(Array.isArray(data) ? data : []), ...(data["@graph"] || [])];
          ld = nodes.find((n) => n?.["@type"] === "VideoObject") || ld;
        } catch {
          // Not valid JSON-LD — ignore this block.
        }
      }
    }
    if (!ld) console.warn(`warning: no VideoObject JSON-LD on ${url} (HTTP ${res.status})`);
    const first = (x) => (Array.isArray(x) ? x[0] : x);
    const action = first(ld?.potentialAction);
    videos.push({
      slug: v.slug,
      title: cleanTitle(v.title.rendered),
      url,
      description: (ld?.description || "").replace(/\r\n/g, "\n").trim(),
      embedUrl: ld?.embedUrl || "",
      thumbnailUrl: first(ld?.thumbnailUrl) || "",
      duration: ld?.duration || "",
      uploadDate: ld?.uploadDate || "",
      relatedPage: typeof first(action?.target) === "string" ? first(action.target) : "",
    });
  }
  return videos.sort((a, b) => a.title.localeCompare(b.title, "sv"));
}

/**
 * Fetches every item of a WP REST collection, following the X-WP-TotalPages
 * header, so a collection that outgrows one page (100 items) is not cut off.
 */
async function fetchAll(type, params = "per_page=100") {
  const query = /(^|&)per_page=/.test(params) ? params : `${params}&per_page=100`;
  const items = [];
  for (let page = 1; ; page++) {
    const res = await fetch(`${BACKEND}/${type}?${query}&page=${page}`);
    if (!res.ok) throw new Error(`Failed to fetch ${type} (page ${page}): ${res.status}`);
    items.push(...(await res.json()));
    const totalPages = Number(res.headers.get("x-wp-totalpages") || 1);
    if (page >= totalPages) return items;
  }
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

const BASIC_ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

/**
 * Decodes HTML entities in one pass, so an encoded entity such as
 * "&amp;lt;" correctly becomes the literal text "&lt;" (not "<"). Unknown
 * named entities are left as they are.
 */
function decodeEntities(s) {
  return (s || "").replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (match, entity) => {
    if (entity[0] === "#") {
      const code = entity[1] === "x" || entity[1] === "X" ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
    }
    const name = entity.toLowerCase();
    return BASIC_ENTITIES[name] ?? NAMED_ENTITIES[name] ?? match;
  });
}

/**
 * Yoast's robots directive for a WP object. Ad landing pages (e.g.
 * tjanster/oversattning-ads-page, tjanster/korrekturlasning-ads) are
 * published as noindex duplicates of a real service page, so anything the
 * site itself keeps out of search is kept out of the agent layer too —
 * except the slugs in INCLUDE_DESPITE_NOINDEX.
 */
function isNoindex(item) {
  return item?.yoast_head_json?.robots?.index === "noindex" && !INCLUDE_DESPITE_NOINDEX.includes(item.slug);
}

/**
 * Real, linked content that is published as noindex (most likely by
 * mistake) but is included by explicit decision. artiklar/novoterm-30-ar —
 * the 30-year anniversary article, linked from 26 pages — added Oct 2026.
 */
const INCLUDE_DESPITE_NOINDEX = ["novoterm-30-ar"];

function cleanTitle(t) {
  return decodeEntities((t || "").replace(/<[^>]+>/g, "")).trim();
}

/** Elements whose start or end marks a paragraph-level break in the text. */
const BLOCK_TAGS = /<\/?(?:p|div|h[1-6]|blockquote|section|article|header|footer|ul|ol|table|thead|tbody|tr|figure|figcaption|pre|hr)\b[^>]*>/gi;

/**
 * Converts CMS HTML to plain text. Order matters: structure (links, line and
 * block breaks) is read from the raw markup, tags are removed, and only then
 * are entities decoded — so encoded text such as "A &lt; B &gt; C" survives
 * as "A < B > C" instead of being mistaken for a tag.
 */
function htmlToText(s) {
  if (!s) return "";
  let out = s.replace(/\r\n?/g, "\n");
  out = out.replace(/<a\s+[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gis, (_, rawHref, rawText) => {
    // Editors sometimes link to the headless backend host; point readers at the public site instead.
    const href = rawHref.replace(/^https?:\/\/backend\.novoterm\.se\/(?!wp-content\/|wp-json\/)/, `${BASE}/`);
    const text = rawText.replace(/<[^>]+>/g, "");
    // Avoid "https://x (https://x)" when the visible link text is just the URL itself.
    return text.trim() === href.trim() ? href : `${text} (${href})`;
  });
  out = out.replace(/<br\s*\/?>[ \t]*\n?/gi, "\n");
  out = out.replace(/<li\b[^>]*>/gi, "\n- ").replace(/<\/li>/gi, "");
  out = out.replace(BLOCK_TAGS, "\n\n");
  out = out.replace(/<\/?(?:td|th)\b[^>]*>/gi, " ");
  out = out.replace(/<[^>]+>/g, "");
  // Strip literal WordPress shortcodes (e.g. "[author_card]", "[gallery ids=1,2]",
  // "[/caption]") that survive because they're plain text, not HTML tags — the
  // theme renders them server-side on the live site, but the REST API returns
  // the raw shortcode syntax verbatim in content.rendered for anything the
  // block renderer doesn't expand. Done before decoding, so an encoded
  // bracket (&#91;) in real text is not mistaken for a shortcode.
  out = out.replace(/\[\/?[a-z][a-z0-9_-]*(?:\s[^\]]*)?\]/gi, "");
  out = decodeEntities(out);
  // Zero-width characters (U+200B–U+200D, U+2060, U+FEFF) pasted in from Word leave "empty" paragraphs.
  out = out.replace(/[\u200B-\u200D\u2060\uFEFF]/g, "");
  out = out
    .replace(/[ \t\u00A0]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    // A list directly after a paragraph keeps a single line break, as before.
    .replace(/\n\n- /g, "\n- ");
  return out.trim();
}

/** htmlToText for one-line fields (headings, titles): any line break becomes a space. */
function htmlToLine(s) {
  return htmlToText(s).replace(/\s+/g, " ");
}

/**
 * Generic reader for an ACF flexible-content section: its heading, every
 * prose field the theme renders, and any card/list items. Used for blocks
 * that have no dedicated extractor (homepage sections, landing pages, the
 * "why choose us" columns) so their text is not silently dropped.
 */
function readSection(sec) {
  const right = sec.right_column || {};
  const heading = htmlToLine(sec.heading || sec.section_title || right.heading || sec.section_label || "");
  const text = [
    sec.description, sec.section_description, sec.paragraph, sec.intro_paragraph,
    sec.main_content, sec.content, right.description, sec.highlight?.content,
  ]
    .map((t) => htmlToText(t || ""))
    .filter(Boolean)
    .join("\n\n");
  const item = (title, content) => ({ title: cleanTitle(title || ""), content: htmlToText(content || "") });
  const items = [
    ...(sec.benefits || []).map((b) => item(b.title, b.benefit_description)),
    ...(sec.box_details || []).map((b) => item(b.title, b.benefit_description)),
    ...(sec.results_points || []).map((r) => item(r.title, r.content)),
    ...(sec.steps || []).map((st) => ({
      title: [`${st.step_number}.`, [cleanTitle(st.step_tag || ""), cleanTitle(st.step_title || "")].filter(Boolean).join(" — ")]
        .filter(Boolean)
        .join(" "),
      content: htmlToText(st.step_description || ""),
    })),
    ...(sec.translation_methods || []).map((m) => item(m.card_title, m.description)),
    ...(sec.service_slide || []).map((c) => {
      const highlights = (c.service_highlights || []).map((h) => cleanTitle(h.highlight_text || "")).filter(Boolean);
      return item(c.heading, [c.description_text, highlights.length ? `(${highlights.join(", ")})` : ""].filter(Boolean).join(" "));
    }),
    ...(sec.left_column?.why_items || []).map((w) => item(w.item_label, "")),
  ].filter((i) => i.title || i.content);
  return { heading, text, items };
}

/** Customer or translator quote block entry → { quote, name, role }. */
function readQuote(q) {
  const c = q.client_section || {};
  return {
    quote: htmlToText(q.quote || "").replace(/^[”"“]+|[”"“]+$/g, ""),
    name: cleanTitle(c.client_name || ""),
    role: [cleanTitle(c.position || ""), cleanTitle(c.company_name || "")].filter(Boolean).join(", "),
  };
}

async function fetchTheme(route) {
  const res = await fetch(`${BACKEND.replace("/wp/v2", "")}/theme/v1/${route}`);
  if (!res.ok) throw new Error(`Failed to fetch theme/v1/${route}: ${res.status}`);
  return res.json();
}

async function buildContent() {
  const [servicesAll, industriesRaw, casesRaw, teamRaw, faqPages, postsRaw, homePages, aboutPages, landingPagesRaw] = await Promise.all([
    fetchAll("service"),
    fetchAll("industry"),
    fetchAll("case_study"),
    fetchAll("our-team"),
    fetchAll("pages", "slug=fragor-svar"),
    fetchAll("posts", "per_page=100&_fields=slug,title,excerpt,content,date,date_gmt,acf,yoast_head_json.robots"),
    fetchAll("pages", "slug=home"),
    fetchAll("pages", "slug=om-oss"),
    fetchAll("pages", `slug=${LANDING_PAGE_SLUGS.join(",")}`),
  ]);
  const authorCardsRaw = await fetchAll("author-card");
  const languages = await fetchLanguages();
  const videos = await fetchVideos();
  const [customerQuotes, translatorQuotes, footer, header] = await Promise.all([
    fetchTheme("customer-quote-block"),
    fetchTheme("translator-quote-block"),
    fetchTheme("footer"),
    fetchTheme("header"),
  ]);
  // Client and freelance-translator testimonials shown in the site-wide quote carousels.
  const testimonials = {
    clients: customerQuotes.map(readQuote).filter((q) => q.quote),
    translators: translatorQuotes.map(readQuote).filter((q) => q.quote),
  };
  // General contact details and social profiles as published in the site-wide footer.
  const addressLines = htmlToText(footer.contact?.address || "").split("\n").map((l) => l.trim()).filter(Boolean);
  const contact = {
    addressLines,
    email: (footer.contact?.email || "").trim(),
    phone: (footer.contact?.phone || "").trim(),
    socialLinks: (footer.cta?.social_links || []).map((l) => l.url).filter(Boolean),
    logo: header.logo?.url || "",
  };
  if (!contact.email || !contact.phone || addressLines.length < 2) {
    throw new Error(`Footer contact details incomplete: ${JSON.stringify(contact)}`);
  }

  const servicesRaw = servicesAll.filter((s) => !isNoindex(s));

  const services = servicesRaw.map((s) => {
    const sections = s.acf?.sections || [];
    let heading = "", description = "";
    const benefits = [];
    const faqs = [];
    const process = [];
    const extraSections = [];
    let heroText = "", benefitsIntro = "";
    for (const sec of sections) {
      if (sec.acf_fc_layout === "services_hero") heroText = htmlToText(sec.sub_heading);
      if (sec.acf_fc_layout === "benefits_section") benefitsIntro = htmlToText(sec.section_description);
      // The industries grid carries a service-specific intro on some pages (e.g. AI-översättning).
      if (sec.acf_fc_layout === "industries" && sec.section_description) extraSections.push(readSection(sec));
      if (sec.acf_fc_layout === "inner_why_choose_us") {
        const why = readSection(sec);
        if (why.text || why.items.length) extraSections.push(why);
      }
      if (sec.acf_fc_layout === "inner_service_section") {
        // Card carousel: the language-review levels on /tjanster/sprakgranskning,
        // the text types on /tjanster/texttyper.
        extraSections.push({
          heading: htmlToLine(sec.heading),
          text: htmlToText(sec.description),
          items: (sec.service_slide || [])
            .map((c) => ({ title: cleanTitle(c.heading || ""), content: htmlToText(c.description_text || "") }))
            .filter((i) => i.title || i.content),
        });
      }
      if (sec.acf_fc_layout === "service_intro" && !description) {
        heading = htmlToLine(sec.heading);
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
    return { slug: s.slug, title: cleanTitle(s.title.rendered), url: `${BASE}/tjanster/${s.slug}`, heading, heroText, description, benefitsIntro, benefits, faqs, process, extraSections };
  });

  const industries = industriesRaw.map((ind) => {
    const sections = ind.acf?.sections || [];
    let heading = "", description = "", whyNovoterm = null, whatWeTranslate = null;
    let heroHeading = "", heroDescription = "", expertiseIntro = "";
    const expertise = [];
    const documentExamples = [];
    const extraSections = [];
    const faqs = [];
    for (const sec of sections) {
      if (sec.acf_fc_layout === "faq_section") {
        const items = (sec.faqs || [])
          .map((f) => ({ question: cleanTitle(f.faq_title), answer: htmlToText(f.faq_answer) }))
          .filter((f) => f.question || f.answer);
        if (ind.slug === "vara-huvudomraden") {
          // The overview page reuses the faq_section layout as an accordion of
          // its main areas ("Finans", "Juridik", …) — real content, but area
          // descriptions rather than questions.
          extraSections.push({
            heading: htmlToLine(sec.section_title || "") || cleanTitle(ind.title.rendered),
            text: htmlToText(sec.section_description || ""),
            items: items.map((i) => ({ title: i.question, content: i.answer })),
          });
        } else {
          for (const f of items) faqs.push({ ...f, scope: ind.slug });
        }
      } else if (sec.acf_fc_layout === "industry_hero") {
        // Only the "vara-huvudomraden" overview page has no industry_intro
        // section; its hero is the fallback description source so this one
        // entry isn't left empty.
        heroHeading = htmlToLine(sec.heading);
        heroDescription = htmlToText(sec.sub_heading);
      } else if (sec.acf_fc_layout === "industry_intro") {
        const h = htmlToLine(sec.heading);
        // Some intros split their prose over main_content and content.
        const t = [htmlToText(sec.main_content), htmlToText(sec.content)].filter(Boolean).join("\n\n");
        if (sec.section_theme === "light" && !description) {
          heading = h; description = t;
        } else if (sec.section_theme === "dark" && !whyNovoterm) {
          whyNovoterm = { heading: h, text: t };
        } else if (h || t) {
          extraSections.push({ heading: h, text: t, items: [] });
        }
      } else if (sec.acf_fc_layout === "icon_box_section") {
        if (!expertiseIntro) {
          expertiseIntro = [htmlToLine(sec.heading), htmlToText(sec.section_description)].filter(Boolean).join(": ");
        }
        for (const b of sec.box_details || []) {
          const title = cleanTitle(b.title || "");
          const content = htmlToText(b.benefit_description || "");
          if (title || content) expertise.push({ title, content });
        }
      } else if (sec.acf_fc_layout === "industry_special_heading") {
        const special = { heading: htmlToLine(sec.heading), text: htmlToText(sec.main_content) };
        if (!whatWeTranslate) whatWeTranslate = special;
        else if (special.heading || special.text) extraSections.push({ ...special, items: [] });
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
      heroText: heroDescription,
      description: description || heroDescription,
      whyNovoterm, expertiseIntro, expertise, whatWeTranslate, documentExamples, extraSections, faqs,
    };
  });

  const caseStudies = casesRaw.map((cs) => {
    const sections = cs.acf?.sections || [];
    let heroHeading = "", heroSubheading = "", client = "", industry = "", servicesUsed = "";
    let introHeading = "", narrative = "", aboutClient = "";
    let challenges = [];
    let challengeHeading = "", challengeText = "";
    let solution = { heading: "", text: "", cards: [] };
    let results = { heading: "", text: "", points: [] };
    let testimonial = null;
    const extraSections = [];
    for (const sec of sections) {
      if (sec.acf_fc_layout === "casestudy_testimonial") {
        testimonial = {
          quote: htmlToText(sec.quote).replace(/^[”"“]+|[”"“]+$/g, ""),
          author: cleanTitle(sec.author_title || ""),
          role: cleanTitle(sec.author_company || ""),
        };
      } else if (sec.acf_fc_layout === "case_study_about") {
        const text = [htmlToText(sec.description), htmlToText(sec.text_below_image)].filter(Boolean).join("\n\n");
        extraSections.push({ heading: htmlToLine(sec.heading), text, items: [] });
      } else if (sec.acf_fc_layout === "case_study_example") {
        // Side-by-side translation examples (original / our version / earlier version).
        extraSections.push({
          heading: htmlToLine(sec.heading),
          text: htmlToText(sec.description),
          items: (sec.solution_cards || []).flatMap((ex) => [
            ...(ex.example_description ? [{ title: cleanTitle(ex.example_title || ""), content: htmlToText(ex.example_description) }] : []),
            ...(ex.example_card || []).map((c) => ({
              title: [cleanTitle(ex.example_title || ""), cleanTitle(c.card_heading || "")].filter(Boolean).join(" — "),
              content: htmlToText(c.card_description || ""),
            })),
          ]),
        });
      } else if (sec.acf_fc_layout === "casestudy_hero") {
        heroHeading = htmlToLine(sec.heading);
        heroSubheading = htmlToText(sec.sub_heading);
      } else if (sec.acf_fc_layout === "casestudy_introduction") {
        client = (sec.client || "").trim(); industry = (sec.industry || "").trim(); servicesUsed = (sec.services || "").trim();
        // sub_heading carries the substantive narrative (what was actually
        // delivered); left_content is a short "about the client" sidebar —
        // both are real content, neither should be dropped in favor of the other.
        introHeading = htmlToLine(sec.heading);
        narrative = htmlToText(sec.sub_heading);
        aboutClient = htmlToText(sec.left_content);
      } else if (sec.acf_fc_layout === "casestudy_challenge") {
        challengeHeading = htmlToLine(sec.heading);
        challengeText = htmlToText(sec.description);
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
      introHeading, narrative, aboutClient, challengeHeading, challengeText, challenges, solution, results, testimonial, extraSections,
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
  // Non-FAQ prose on /fragor-svar, e.g. the step-by-step ordering guide.
  const faqPageSections = [];
  const faqPage = faqPages[0];
  for (const sec of faqPage?.acf?.page_sections || []) {
    if (sec.acf_fc_layout === "our_approach") {
      const section = readSection(sec);
      // The numbered tips carry no heading in the CMS; label them descriptively.
      if (!section.heading) section.heading = "Before you order (numbered tips on /fragor-svar)";
      if (section.text || section.items.length) faqPageSections.push(section);
    }
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
  // Homepage prose blocks (about, services overview, team intro, why choose us).
  const HOME_SECTION_LAYOUTS = ["about_section", "service_section", "fullwidth_experts_section", "why_choose_us"];
  const homeSections = [];
  for (const sec of homePage?.acf?.page_sections || []) {
    if (sec.acf_fc_layout === "hero_section") {
      heroTagline = htmlToLine(sec.heading);
      heroLead = htmlToText(sec.subheading);
    } else if (HOME_SECTION_LAYOUTS.includes(sec.acf_fc_layout)) {
      const section = readSection(sec);
      if (section.text || section.items.length) homeSections.push(section);
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

  // Article author cards ("author-card" CPT), referenced by ID from each post's ACF.
  const authorsById = new Map(
    authorCardsRaw.map((a) => {
      const card = a.acf?.individual_author_card?.[0] || {};
      return [a.id, { name: cleanTitle(card.name || a.title.rendered), bio: htmlToText(card.description || "") }];
    }),
  );

  const articles = postsRaw
    .filter((p) => !isNoindex(p))
    .map((p) => ({
      slug: p.slug,
      title: cleanTitle(p.title.rendered),
      url: `${BASE}/artiklar/${p.slug}`,
      excerpt: htmlToText(p.excerpt?.rendered || ""),
      summary: htmlToText(p.acf?.article_summary || ""),
      content: htmlToText(p.content?.rendered || ""),
      author: p.acf?.display_author_card ? authorsById.get(p.acf?.author_card?.ID) ?? null : null,
      // date_gmt carries no offset; mark it as UTC so it is a valid ISO 8601 date-time.
      publishedAt: p.date_gmt ? `${p.date_gmt}Z` : p.date,
    }))
    .sort((a, b) => a.title.localeCompare(b.title, "sv"));

  const about = { heroTagline, heroLead, geoAgentNote, homeSections, faqPageSections, ceo, philosophy, history };

  const pages = LANDING_PAGE_SLUGS.map((slug) => landingPagesRaw.find((p) => p.slug === slug))
    .filter((p) => p && !isNoindex(p))
    .map((p) => {
      let heading = "", description = "";
      const sections = [];
      const faqs = [];
      const documentExamples = [];
      for (const sec of p.acf?.page_sections || []) {
        const layout = sec.acf_fc_layout;
        if (layout === "inner_hero_section" && !heading) {
          heading = htmlToLine(sec.heading);
          description = htmlToText(sec.sub_heading);
        } else if (layout === "faq_section") {
          for (const f of sec.faqs || []) {
            faqs.push({ question: cleanTitle(f.faq_title), answer: htmlToText(f.faq_answer), scope: p.slug });
          }
        } else if (layout === "number_documents_examples") {
          for (const d of sec.document_lists || []) {
            const name = cleanTitle(d.document_name || "");
            if (name) documentExamples.push(name);
          }
        } else if (layout !== "contact_section") {
          // Layout-only blocks (contact form, testimonial carousel, industry grid) carry no text of their own.
          const section = readSection(sec);
          if (section.text || section.items.length) sections.push(section);
        }
      }
      const title = heading || cleanTitle(p.title.rendered);
      return { slug: p.slug, title, url: `${BASE}/${p.slug}`, heading, description, sections, documentExamples, faqs };
    });

  // A video's "Läs mer" target comes from the site's own JSON-LD; keep it only
  // if it is a page this package knows, so a CMS typo (e.g. the 404
  // /branscher/forsvarsindustrin, Oct 2026) is not republished as fact.
  const knownUrls = new Set([
    ...services.map((x) => x.url), ...industries.map((x) => x.url), ...caseStudies.map((x) => x.url),
    ...pages.map((x) => x.url), `${BASE}/kontakta-oss`,
  ]);
  for (const v of videos) {
    const target = v.relatedPage.replace(/\/$/, "");
    if (target && !knownUrls.has(target)) {
      console.warn(`warning: ${v.url} links to unknown page ${v.relatedPage} — dropped`);
      v.relatedPage = "";
    } else {
      v.relatedPage = target;
    }
  }

  return {
    meta: { source: "novoterm.se WordPress REST API", crawledAt: new Date().toISOString().slice(0, 10) },
    services, industries, caseStudies, team, faq, articles, about, pages, languages, videos, testimonials, contact,
  };
}

async function buildSiteIndex(content) {

  const services = content.services.map((s) => ({ name: s.title, url: s.url }));
  const industries = content.industries.map((i) => ({ name: i.title, url: i.url }));
  const caseStudies = content.caseStudies.map((c) => ({ name: c.title, url: c.url }));
  const articles = content.articles
    .map((a) => ({ name: a.title, url: a.url }))
    .sort((a, b) => a.name.localeCompare(b.name, "sv"));
  const videoEntries = content.videos.map((v) => ({ name: v.title, url: v.url }));

  const company = [
    { name: "Homepage", url: BASE },
    { name: "Om oss (About us — team, CEO's word, philosophy, history)", url: `${BASE}/om-oss` },
    { name: "Kontakta oss (Contact us)", url: `${BASE}/kontakta-oss` },
    { name: "Frågor och svar (FAQ)", url: `${BASE}/fragor-svar` },
    { name: "Språk (Languages — 40+ languages)", url: `${BASE}/sprak` },
    { name: "Språktjänster för produktions- och kommunikationsbyråer (Agencies)", url: `${BASE}/produktions-byraer-kommunikations-byraer` },
    { name: "Kundcase (Client cases index)", url: `${BASE}/kundcase` },
    { name: "Artiklar (Article library index)", url: `${BASE}/artiklar` },
    { name: "Videor (Video index)", url: `${BASE}/videor` },
    { name: "Integritetspolicy (Privacy policy)", url: `${BASE}/integritetspolicy` },
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

/**
 * Replaces site links inside CMS text that only reach a page through
 * redirects (e.g. legacy /sprakoversattning/ -> /tjanster/oversattning) with
 * their final URL, so the agent layer never hands out redirect chains.
 */
async function resolveRedirectedLinks(content) {
  const json = JSON.stringify(content);
  const urls = new Set(json.match(/https:\/\/www\.novoterm\.se\/[^\s"()<>\\]*/g) || []);
  const known = new Set(
    [...content.services, ...content.industries, ...content.caseStudies, ...content.articles, ...content.pages, ...content.videos].map((x) => x.url),
  );
  const replacements = new Map();
  for (const url of urls) {
    const bare = url.replace(/[.,;:!?]+$/, "");
    if (known.has(bare) || replacements.has(bare)) continue;
    try {
      const res = await fetch(bare, { redirect: "follow" });
      const final = res.url.replace(/\/$/, "");
      if (res.ok && final !== bare.replace(/\/$/, "")) replacements.set(bare, final);
      if (!res.ok) console.warn(`warning: link in CMS text is broken (HTTP ${res.status}): ${bare}`);
    } catch (err) {
      console.warn(`warning: could not check ${bare}: ${err.message}`);
    }
  }
  if (!replacements.size) return content;
  let out = json;
  // Longest first, so a URL that is a prefix of another is not replaced inside it.
  for (const [from, to] of [...replacements].sort((a, b) => b[0].length - a[0].length)) {
    out = out.split(`${from}"`).join(`${to}"`).split(`${from})`).join(`${to})`).split(`${from} `).join(`${to} `);
    console.log(`resolved redirect: ${from} -> ${to}`);
  }
  return JSON.parse(out);
}

/**
 * WP pages the package already covers or deliberately leaves out. Any other
 * indexable page is reported as new, so it can be added (usually to
 * LANDING_PAGE_SLUGS) instead of being silently missed.
 */
const KNOWN_PAGE_SLUGS = new Set([
  "home", "om-oss", "fragor-svar", "kontakta-oss", "kundcase", "artiklar", "videos", "integritetspolicy",
  "event-registration", "newsletter-unsubscribe", ...LANDING_PAGE_SLUGS,
]);

async function reportNewPages() {
  const allPages = await fetchAll("pages", "_fields=slug,link,yoast_head_json.robots");
  const unknown = allPages.filter((p) => !isNoindex(p) && !KNOWN_PAGE_SLUGS.has(p.slug));
  for (const p of unknown) {
    console.warn(`warning: indexable WP page not covered by the package: ${p.slug} (${p.link}) — add it to LANDING_PAGE_SLUGS or KNOWN_PAGE_SLUGS`);
  }
}

/** Collection sizes compared between refreshes, including nested FAQs and other sub-collections. */
function contentMetrics(c) {
  const sum = (list, key) => list.reduce((n, x) => n + (x[key]?.length ?? 0), 0);
  return {
    services: c.services.length,
    industries: c.industries.length,
    caseStudies: c.caseStudies.length,
    team: c.team.length,
    articles: c.articles.length,
    pages: c.pages.length,
    videos: c.videos.length,
    languages: c.languages.length,
    faq: c.faq.length,
    serviceFaqs: sum(c.services, "faqs"),
    industryFaqs: sum(c.industries, "faqs"),
    pageFaqs: sum(c.pages, "faqs"),
    serviceBenefits: sum(c.services, "benefits"),
    industryExpertise: sum(c.industries, "expertise"),
    clientTestimonials: c.testimonials.clients.length,
    translatorTestimonials: c.testimonials.translators.length,
    homeSections: c.about.homeSections.length,
  };
}

/**
 * Refuses to write a snapshot that is incomplete, so a CMS or network hiccup
 * cannot publish empty content under a fresh "last verified" date — the last
 * good files in data/ are kept instead. Checks that every collection (nested
 * FAQs included) is non-empty, that key text fields have content, that every
 * configured landing page is present, and that no collection shrank by more
 * than a quarter since the previous snapshot unless --allow-shrink is passed
 * (for a deliberate removal).
 */
function validateContent(content, previous, allowShrink) {
  const problems = [];
  const metrics = contentMetrics(content);
  for (const [name, count] of Object.entries(metrics)) {
    if (!count) problems.push(`${name} is empty`);
  }
  const missing = (list, label, fields) => {
    for (const item of list) {
      for (const f of fields) if (!item[f]) problems.push(`${label} ${item.slug}: empty ${f}`);
    }
  };
  missing(content.services, "service", ["title", "description"]);
  missing(content.industries, "industry", ["title", "description"]);
  missing(content.caseStudies, "case study", ["title", "client", "narrative"]);
  missing(content.articles, "article", ["title", "content"]);
  missing(content.pages, "landing page", ["title", "description"]);
  missing(content.videos, "video", ["title", "description", "embedUrl", "thumbnailUrl"]);
  missing(content.team, "team member", ["name", "position"]);
  const about = content.about || {};
  if (!about.heroTagline) problems.push("about: empty homepage tagline");
  if (!about.ceo?.name || !about.ceo?.message) problems.push("about: CEO letter missing or empty");
  if (!about.history?.text) problems.push("about: history text missing or empty");
  if (!about.philosophy?.text) problems.push("about: philosophy text missing or empty");
  for (const slug of LANDING_PAGE_SLUGS) {
    if (!content.pages.some((p) => p.slug === slug)) problems.push(`landing page ${slug} missing (noindex, unpublished, or renamed?)`);
  }
  if (!content.contact?.email || !content.contact?.phone) problems.push("footer contact details missing");

  if (previous?.services && !allowShrink) {
    const before = contentMetrics({
      ...previous,
      pages: previous.pages ?? [], videos: previous.videos ?? [], languages: previous.languages ?? [],
      testimonials: previous.testimonials ?? { clients: [], translators: [] },
      about: { homeSections: [], ...previous.about },
      industries: (previous.industries ?? []).map((i) => ({ faqs: [], ...i })),
    });
    for (const [name, count] of Object.entries(metrics)) {
      if (before[name] && count < before[name] * 0.75) {
        problems.push(`${name} dropped from ${before[name]} to ${count} (use --allow-shrink if intended)`);
      }
    }
  }
  if (problems.length) {
    throw new Error(`Refusing to write an incomplete snapshot — previous data kept:\n  - ${problems.join("\n  - ")}`);
  }
}

/**
 * Writes both data files so a failed or interrupted refresh cannot leave a
 * truncated file or a content/index pair from different runs:
 *  1. both files are written to *.tmp and parsed back;
 *  2. each tmp file is renamed over its target (rename is atomic per file);
 *  3. if the second rename fails, the first file is restored from its backup.
 * Both files carry the same meta.generatedAt; lib/agent/site-index.ts fails
 * the build if they differ (the one remaining window: a crash between the two
 * renames), so a mismatched pair can never be deployed — rerun the refresh.
 */
async function publishSnapshot(dataDir, content, siteIndex) {
  const generatedAt = new Date().toISOString();
  const files = [
    ["novoterm-content.json", { ...content, meta: { ...content.meta, generatedAt } }],
    ["novoterm-site-index.json", { meta: { generatedAt }, ...siteIndex }],
  ].map(([name, data]) => ({ target: path.join(dataDir, name), text: JSON.stringify(data, null, 2) }));

  for (const f of files) {
    await writeFile(`${f.target}.tmp`, f.text);
    JSON.parse(await readFile(`${f.target}.tmp`, "utf8"));
  }
  const [first, second] = files;
  // A backup is required before anything is replaced. Only a missing original
  // (first run) is acceptable; any other backup failure stops the run here,
  // with both live files untouched.
  let hasBackup = true;
  try {
    await copyFile(first.target, `${first.target}.bak`);
  } catch (err) {
    if (err.code !== "ENOENT") {
      throw new Error(`Could not back up ${first.target}; nothing was changed. ${err.message}`);
    }
    hasBackup = false;
  }
  await rename(`${first.target}.tmp`, first.target);
  try {
    await rename(`${second.target}.tmp`, second.target);
  } catch (err) {
    if (!hasBackup) {
      throw new Error(`Could not write ${second.target}, and ${first.target} had no previous version to restore. The build will refuse this pair (generatedAt mismatch); re-run the refresh. ${err.message}`);
    }
    try {
      await rename(`${first.target}.bak`, first.target);
    } catch (restoreErr) {
      throw new Error(
        `Could not write ${second.target} (${err.message}), and restoring ${first.target} also failed (${restoreErr.message}). ` +
          `The previous version is in ${first.target}.bak. The build will refuse this pair (generatedAt mismatch); re-run the refresh.`,
      );
    }
    throw new Error(`Could not write ${second.target}; ${first.target} restored to its previous version. ${err.message}`);
  }
  // Leaving a stale .bak behind is harmless; report it rather than hide it.
  await unlink(`${first.target}.bak`).catch((err) => {
    if (hasBackup) console.warn(`warning: could not remove ${first.target}.bak: ${err.message}`);
  });
}

async function main() {
  const dataDir = path.join(__dirname, "..", "data");
  const previous = await readFile(path.join(dataDir, "novoterm-content.json"), "utf8").then(JSON.parse).catch(() => null);

  const content = await resolveRedirectedLinks(await buildContent());
  validateContent(content, previous, process.argv.includes("--allow-shrink"));
  const siteIndex = await buildSiteIndex(content);
  await reportNewPages();

  await publishSnapshot(dataDir, content, siteIndex);

  console.log(`Refreshed content as of ${content.meta.crawledAt}`);
  console.log(
    `services=${content.services.length} industries=${content.industries.length} ` +
      `cases=${content.caseStudies.length} team=${content.team.length} faq=${content.faq.length} ` +
      `articles=${content.articles.length} pages=${content.pages.length} languages=${content.languages.length} ` +
      `testimonials=${content.testimonials.clients.length}+${content.testimonials.translators.length} ` +
      `videos=${siteIndex.siteIndex.find((g) => g.title === "Video Highlights").entries.length}`,
  );
}

// Run only when executed directly, so tests can import the helpers below.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export { htmlToText, decodeEntities, validateContent, publishSnapshot };
