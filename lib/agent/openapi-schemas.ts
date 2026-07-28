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

  Service: {
    type: "object",
    description: "A single Novoterm translation or language-review service.",
    required: ["slug", "title", "url", "heading", "description"],
    properties: {
      slug: { type: "string" },
      title: { type: "string" },
      url: { type: "string", format: "uri" },
      heading: { type: "string" },
      description: { type: "string" },
      benefits: { type: "array", items: { type: "object", properties: { title: { type: "string" }, content: { type: "string" } } } },
      faqs: { type: "array", items: { $ref: "#/components/schemas/Faq" } },
      process: {
        type: "array",
        description: "The 4-step delivery process (Analys/Uppstart/Översättning/Leverans), where present.",
        items: { type: "object", properties: { step: { type: "integer" }, tag: { type: "string" }, title: { type: "string" }, description: { type: "string" } } },
      },
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
      whyNovoterm: { type: "object", nullable: true, properties: { heading: { type: "string" }, text: { type: "string" } } },
      expertise: { type: "array", items: { type: "object", properties: { title: { type: "string" }, content: { type: "string" } } } },
      whatWeTranslate: { type: "object", nullable: true, properties: { heading: { type: "string" }, text: { type: "string" } } },
      documentExamples: { type: "array", items: { type: "string" }, description: "Example document types translated within this industry." },
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
      challenges: { type: "array", items: { type: "object" } },
      solution: { type: "object" },
      results: { type: "object" },
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
      inHouseTeamSize: { type: "integer" },
      freelanceNetworkSize: { type: "string" },
      languages: { type: "string" },
      ceo: { type: "string" },
      philosophy: { type: "string" },
      pricingModel: { type: "string" },
      contact: { type: "object" },
      about: {
        type: "object",
        description: "CEO's letter, company philosophy, and founding history, sourced from the /om-oss page.",
        properties: {
          heroTagline: { type: "string" },
          heroLead: { type: "string" },
          ceo: { type: "object", nullable: true, properties: { name: { type: "string" }, role: { type: "string" }, message: { type: "string" } } },
          philosophy: { type: "object", nullable: true, properties: { heading: { type: "string" }, text: { type: "string" } } },
          history: { type: "object", nullable: true, properties: { heading: { type: "string" }, text: { type: "string" } } },
        },
      },
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
      content: { type: "string", description: "Full plain-text article body." },
      publishedAt: { type: "string", format: "date-time" },
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
};
