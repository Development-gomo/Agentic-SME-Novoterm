/**
 * Named OpenAPI 3.0.3 component schemas for the read-only /agent/v1 JSON API.
 * Hand-authored to mirror the payloads built in app/agent/v1/*\/route.ts.
 * Referenced by $ref from /openapi.json so the spec never inlines definitions.
 */

export type OpenApiSchema = Record<string, unknown>;

const envelopeRequired = ["name", "description", "url", "modified", "usage"];
const envelopeProps = {
  name: { type: "string", description: "Machine-friendly name of the endpoint." },
  description: { type: "string", description: "Plain-language description of what the endpoint returns." },
  url: { type: "string", format: "uri", description: "Canonical absolute URL of the endpoint." },
  modified: { type: "string", format: "date", description: "Freshness signal (YYYY-MM-DD); agents use it to detect stale data." },
  usage: { type: "string", description: "Usage and licensing note for the payload." },
};

export const OPENAPI_SCHEMAS: Record<string, OpenApiSchema> = {
  ResponseEnvelope: {
    type: "object",
    description: "Standard metadata envelope wrapping every /agent/v1 response.",
    required: envelopeRequired,
    properties: envelopeProps,
  },

  ErrorResponse: {
    type: "object",
    description: "Typed error payload returned when a request cannot be fulfilled.",
    required: ["status", "title"],
    properties: {
      status: { type: "integer", description: "HTTP status code duplicated in the body for convenience.", example: 404 },
      title: { type: "string", description: "Short, stable, machine-comparable summary of the error.", example: "Not Found" },
      detail: { type: "string", description: "Optional longer, human-readable explanation of the error." },
    },
  },

  Faq: {
    type: "object",
    description: "A single question/answer pair.",
    required: ["question", "answer", "scope"],
    properties: {
      question: { type: "string" },
      answer: { type: "string" },
      scope: { type: "string", description: "\"general\" for the master FAQ, or a service slug for a service-specific FAQ." },
    },
  },

  ContentSection: {
    type: "object",
    description: "A titled block of page content with optional list items (cards, accordion entries, examples).",
    properties: {
      heading: { type: "string" },
      text: { type: "string" },
      items: { type: "array", items: { type: "object", properties: { title: { type: "string" }, content: { type: "string" } } } },
    },
  },

  Service: {
    type: "object",
    description: "A single Novoterm translation or language-review service.",
    required: ["slug", "title", "url", "heading", "description"],
    properties: {
      slug: { type: "string" },
      title: { type: "string" },
      url: { type: "string", format: "uri" },
      heading: { type: "string" },
      heroText: { type: "string", description: "Lead text under the page title." },
      description: { type: "string" },
      benefitsIntro: { type: "string" },
      benefits: { type: "array", items: { type: "object", properties: { title: { type: "string" }, content: { type: "string" } } } },
      faqs: { type: "array", items: { $ref: "#/components/schemas/Faq" } },
      process: {
        type: "array",
        description: "The 4-step delivery process (Analys/Uppstart/Översättning/Leverans), where present.",
        items: { type: "object", properties: { step: { type: "integer" }, tag: { type: "string" }, title: { type: "string" }, description: { type: "string" } } },
      },
      extraSections: { type: "array", items: { $ref: "#/components/schemas/ContentSection" }, description: "Further content blocks, e.g. language-review levels or text-type cards." },
    },
  },

  Industry: {
    type: "object",
    description: "A single industry Novoterm serves.",
    required: ["slug", "title", "url", "heading", "description"],
    properties: {
      slug: { type: "string" },
      title: { type: "string" },
      url: { type: "string", format: "uri" },
      heading: { type: "string" },
      description: { type: "string" },
      heroText: { type: "string", description: "Lead text under the page title." },
      whyNovoterm: { type: "object", nullable: true, properties: { heading: { type: "string" }, text: { type: "string" } } },
      expertiseIntro: { type: "string" },
      expertise: { type: "array", items: { type: "object", properties: { title: { type: "string" }, content: { type: "string" } } } },
      whatWeTranslate: { type: "object", nullable: true, properties: { heading: { type: "string" }, text: { type: "string" } } },
      documentExamples: { type: "array", items: { type: "string" }, description: "Example document types translated within this industry." },
      extraSections: { type: "array", items: { $ref: "#/components/schemas/ContentSection" }, description: "Further intro/heading blocks beyond the first." },
      faqs: { type: "array", items: { $ref: "#/components/schemas/Faq" }, description: "The industry page's own FAQ." },
    },
  },

  CaseStudy: {
    type: "object",
    description: "A single client case study.",
    required: ["slug", "title", "url", "client", "industry"],
    properties: {
      slug: { type: "string" },
      title: { type: "string" },
      url: { type: "string", format: "uri" },
      client: { type: "string" },
      industry: { type: "string" },
      servicesUsed: { type: "string" },
      heroHeading: { type: "string" },
      heroSubheading: { type: "string" },
      introHeading: { type: "string" },
      narrative: { type: "string", description: "The substantive narrative: what was actually delivered for the client." },
      aboutClient: { type: "string", description: "Short 'about the client' sidebar blurb." },
      challengeHeading: { type: "string" },
      challengeText: { type: "string" },
      challenges: { type: "array", items: { type: "object" } },
      solution: { type: "object" },
      results: { type: "object" },
      testimonial: {
        type: "object",
        nullable: true,
        description: "Client quote shown on the case page.",
        properties: { quote: { type: "string" }, author: { type: "string" }, role: { type: "string" } },
      },
      extraSections: { type: "array", items: { $ref: "#/components/schemas/ContentSection" }, description: "Further blocks, e.g. side-by-side translation examples." },
    },
  },

  Testimonial: {
    type: "object",
    properties: { quote: { type: "string" }, name: { type: "string" }, role: { type: "string" } },
  },

  Video: {
    type: "object",
    description: "A Novoterm video page, with the description from its VideoObject structured data.",
    required: ["slug", "title", "url"],
    properties: {
      slug: { type: "string" },
      title: { type: "string" },
      url: { type: "string", format: "uri" },
      description: { type: "string" },
      embedUrl: { type: "string", description: "YouTube embed URL; empty string if the page has no VideoObject data." },
      thumbnailUrl: { type: "string", description: "Video thumbnail image URL; empty string if unavailable." },
      duration: { type: "string", description: "ISO 8601 duration, e.g. PT1M3S; empty string if unavailable." },
      uploadDate: { type: "string", description: "ISO 8601 upload date-time; empty string if unavailable." },
      relatedPage: { type: "string", description: "The service or industry page the video links to; empty string if none or if the site's link is broken." },
    },
  },

  TeamMember: {
    type: "object",
    description: "A single Novoterm in-house team member.",
    required: ["slug", "name", "position"],
    properties: {
      slug: { type: "string" },
      name: { type: "string" },
      position: { type: "string" },
      email: { type: "string", format: "email" },
      bio: { type: "string" },
      quote: { type: "string" },
    },
  },

  Company: {
    type: "object",
    description: "Novoterm Translation company identity.",
    required: ["name", "url", "description", "foundingDate"],
    properties: {
      name: { type: "string" },
      legalName: { type: "string" },
      url: { type: "string", format: "uri" },
      description: { type: "string" },
      foundingDate: { type: "string" },
      headquarters: { type: "string" },
      address: {
        type: "object",
        description: "Postal address as published in the site footer.",
        properties: {
          streetAddress: { type: "string" },
          postalCode: { type: "string" },
          locality: { type: "string" },
          country: { type: "string", description: "ISO 3166-1 alpha-2 country code." },
        },
      },
      postalAddress: { type: "string", description: "The address as one formatted line." },
      sameAs: { type: "array", items: { type: "string", format: "uri" }, description: "Official social profiles." },
      testimonials: {
        type: "object",
        description: "Site-wide quote carousels.",
        properties: {
          clients: { type: "array", items: { $ref: "#/components/schemas/Testimonial" } },
          translators: { type: "array", items: { $ref: "#/components/schemas/Testimonial" } },
        },
      },
      inHouseTeamSize: { type: "integer" },
      freelanceNetworkSize: { type: "string" },
      languages: { type: "string" },
      languageList: { type: "array", items: { type: "string" }, description: "Every language listed on /sprak (Swedish names)." },
      ceo: { type: "string" },
      philosophy: { type: "string" },
      pricingModel: { type: "string" },
      contact: {
        type: "object",
        description: "General contact channels: email, phone, postal address, contact form, and the MCP contact tool.",
        properties: {
          email: { type: "object", properties: { label: { type: "string" }, address: { type: "string", format: "email" }, url: { type: "string" } } },
          phone: { type: "object", properties: { label: { type: "string" }, number: { type: "string" }, url: { type: "string" } } },
          postalAddress: { type: "string" },
          form: { type: "object", properties: { label: { type: "string" }, url: { type: "string", format: "uri" } } },
          faqUrl: { type: "string", format: "uri" },
          note: { type: "string" },
          mcpTool: { type: "string", nullable: true, description: "Name of the MCP contact action, or null when it is switched off on this deployment." },
        },
      },
      about: {
        type: "object",
        description: "Homepage prose blocks plus the CEO's letter, company philosophy, and founding history from the /om-oss page.",
        properties: {
          heroTagline: { type: "string" },
          heroLead: { type: "string" },
          homeSections: { type: "array", items: { $ref: "#/components/schemas/ContentSection" }, description: "Homepage prose blocks." },
          faqPageSections: { type: "array", items: { $ref: "#/components/schemas/ContentSection" }, description: "Numbered tips before ordering, from /fragor-svar." },
          ceo: { type: "object", nullable: true, properties: { name: { type: "string" }, role: { type: "string" }, message: { type: "string" } } },
          philosophy: { type: "object", nullable: true, properties: { heading: { type: "string" }, text: { type: "string" } } },
          history: { type: "object", nullable: true, properties: { heading: { type: "string" }, text: { type: "string" } } },
        },
      },
    },
  },

  LandingPage: {
    type: "object",
    description: "A standalone marketing page with its own content (e.g. /sprak), with its sections and FAQs.",
    required: ["slug", "title", "url"],
    properties: {
      slug: { type: "string" },
      title: { type: "string" },
      url: { type: "string", format: "uri" },
      heading: { type: "string" },
      description: { type: "string" },
      sections: { type: "array", items: { $ref: "#/components/schemas/ContentSection" } },
      documentExamples: { type: "array", items: { type: "string" } },
      faqs: { type: "array", items: { $ref: "#/components/schemas/Faq" } },
    },
  },

  Article: {
    type: "object",
    description: "A single Novoterm article, with full body text.",
    required: ["slug", "title", "url", "content"],
    properties: {
      slug: { type: "string" },
      title: { type: "string" },
      url: { type: "string", format: "uri" },
      excerpt: { type: "string" },
      summary: { type: "string", description: "Lead summary shown under the article title." },
      content: { type: "string", description: "Full plain-text article body." },
      author: {
        type: "object",
        nullable: true,
        description: "Author card shown on the article, where enabled.",
        properties: { name: { type: "string" }, bio: { type: "string" } },
      },
      publishedAt: { type: "string", format: "date-time", description: "Publication time in UTC." },
    },
  },

  IndexResponse: {
    allOf: [
      { $ref: "#/components/schemas/ResponseEnvelope" },
      { type: "object", properties: { data: { type: "object", description: "Directory of every /agent/v1 endpoint." } } },
    ],
  },
  SchemaResponse: {
    allOf: [
      { $ref: "#/components/schemas/ResponseEnvelope" },
      { type: "object", properties: { data: { type: "object", description: "Response shape definitions for each endpoint." } } },
    ],
  },
  CompanyResponse: {
    allOf: [
      { $ref: "#/components/schemas/ResponseEnvelope" },
      { type: "object", properties: { data: { $ref: "#/components/schemas/Company" } } },
    ],
  },
  ServicesResponse: {
    allOf: [
      { $ref: "#/components/schemas/ResponseEnvelope" },
      { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/Service" } } } },
    ],
  },
  IndustriesResponse: {
    allOf: [
      { $ref: "#/components/schemas/ResponseEnvelope" },
      { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/Industry" } } } },
    ],
  },
  CaseStudiesResponse: {
    allOf: [
      { $ref: "#/components/schemas/ResponseEnvelope" },
      { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/CaseStudy" } } } },
    ],
  },
  TeamResponse: {
    allOf: [
      { $ref: "#/components/schemas/ResponseEnvelope" },
      { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/TeamMember" } } } },
    ],
  },
  FaqResponse: {
    allOf: [
      { $ref: "#/components/schemas/ResponseEnvelope" },
      { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/Faq" } } } },
    ],
  },
  ArticlesResponse: {
    allOf: [
      { $ref: "#/components/schemas/ResponseEnvelope" },
      { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/Article" } } } },
    ],
  },
  VideosResponse: {
    allOf: [
      { $ref: "#/components/schemas/ResponseEnvelope" },
      { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/Video" } } } },
    ],
  },
  PagesResponse: {
    allOf: [
      { $ref: "#/components/schemas/ResponseEnvelope" },
      { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/LandingPage" } } } },
    ],
  },
};
