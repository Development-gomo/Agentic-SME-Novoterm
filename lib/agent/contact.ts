import { WP_BACKEND_ORIGIN } from "@/config/site-origin";

/**
 * Submits Novoterm's real "Kontakta oss" contact form (kontakta-oss) on
 * behalf of an AI agent's end user.
 *
 * novoterm.se is a decoupled Next.js frontend over a WordPress/Contact
 * Form 7 backend. The live site's own contact page doesn't POST to CF7's
 * standard REST feedback route — it calls a site-specific wrapper,
 * `custom-cf7/v1/submit/{id}`, discovered by inspecting the deployed form
 * (GET custom-cf7/v1/forms -> id 321, title "Contact sv"; GET
 * custom-cf7/v1/form/321 for the field definitions below). This module
 * mirrors that exact request so a tool call here behaves identically to a
 * human filling in https://www.novoterm.se/kontakta-oss.
 *
 * Field names, radio/select option strings, and the required set are taken
 * verbatim from the live CF7 form definition:
 *   [radio user_type default:1 "FÖRETAG" "PRIVATPERSON"]
 *   [text* company_name] [text* full_name] [tel* phone] [email* email]
 *   [select* area first_as_label "..." "Översättning" "Granskning" "Annat"]
 *   [textarea message] [file ...] [hidden page-title] [hidden page-url]
 *
 * NOTE ON VERIFICATION: this has been validated against the live schema
 * endpoints (custom-cf7/v1/forms, custom-cf7/v1/form/321) but a real
 * end-to-end submission has deliberately not been fired during development,
 * to avoid creating a fake lead/email in Novoterm's real inbox. Test with one
 * genuine inquiry after deploying.
 */

const CONTACT_FORM_ID = 321;
const SUBMIT_URL = `${WP_BACKEND_ORIGIN}/wp-json/custom-cf7/v1/submit/${CONTACT_FORM_ID}`;

/** Origin page recorded on the submission — our own agent surface, since no human loaded the real /kontakta-oss page for an agent-submitted inquiry. */
const AGENT_ORIGIN_PAGE_TITLE = "Novoterm MCP Server — Agent-Submitted Inquiry";
const AGENT_ORIGIN_PAGE_URL = "https://www.novoterm.se/mcp";

export type ContactInquiryInput = {
  /** Whether the inquiry is on behalf of a company or a private individual. Maps to the form's FÖRETAG/PRIVATPERSON radio. */
  inquiryType: "company" | "private";
  fullName: string;
  email: string;
  phone: string;
  /** Required by the live form when inquiryType is "company"; ignored (defaulted) for "private". */
  companyName?: string;
  /** Maps to the form's "ÖNSKAD SPRÅKTJÄNST" (desired language service) select. */
  serviceArea: "translation" | "review" | "other";
  message?: string;
};

export type ContactInquiryResult = {
  submitted: boolean;
  /** Best-effort interpretation of the upstream response; see the module doc note on verification. */
  status: "sent" | "rejected" | "unknown";
  message: string;
  httpStatus: number;
  raw: unknown;
};

const USER_TYPE_LABEL: Record<ContactInquiryInput["inquiryType"], string> = {
  company: "FÖRETAG",
  private: "PRIVATPERSON",
};

const SERVICE_AREA_LABEL: Record<ContactInquiryInput["serviceArea"], string> = {
  translation: "Översättning",
  review: "Granskning",
  other: "Annat",
};

export class ContactInquiryValidationError extends Error {}

function validate(input: ContactInquiryInput): void {
  if (!input.fullName?.trim()) throw new ContactInquiryValidationError("fullName is required.");
  if (!input.phone?.trim()) throw new ContactInquiryValidationError("phone is required.");
  if (!input.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    throw new ContactInquiryValidationError("A valid email is required.");
  }
  if (input.inquiryType === "company" && !input.companyName?.trim()) {
    throw new ContactInquiryValidationError("companyName is required when inquiryType is \"company\".");
  }
}

/**
 * Submits the inquiry to Novoterm's real contact form backend. Throws
 * ContactInquiryValidationError for caller input problems (caught by the
 * MCP tool / REST route and turned into a normal error response, not a
 * network call) and lets network/fetch failures propagate as-is.
 */
export async function submitContactInquiry(input: ContactInquiryInput): Promise<ContactInquiryResult> {
  validate(input);

  const messageBody = [
    "[Submitted via the Novoterm MCP server's submit_contact_inquiry tool, on behalf of a visitor interacting with an AI agent — not a direct website visit.]",
    input.message?.trim() || "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const form = new FormData();
  form.set("user_type", USER_TYPE_LABEL[input.inquiryType]);
  form.set("company_name", input.inquiryType === "company" ? input.companyName!.trim() : "Privatperson");
  form.set("full_name", input.fullName.trim());
  form.set("phone", input.phone.trim());
  form.set("email", input.email.trim());
  form.set("area", SERVICE_AREA_LABEL[input.serviceArea]);
  form.set("message", messageBody);
  form.set("page-title", AGENT_ORIGIN_PAGE_TITLE);
  form.set("page-url", AGENT_ORIGIN_PAGE_URL);

  const response = await fetch(SUBMIT_URL, { method: "POST", body: form });

  let raw: unknown = null;
  try {
    raw = await response.json();
  } catch {
    raw = await response.text().catch(() => null);
  }

  return interpretResponse(response.status, raw);
}

/**
 * Contact Form 7's standard submission contract reports outcome via a
 * `status` field ("mail_sent" | "validation_failed" | "spam" | "mail_failed"
 * | "aborted") and a human-readable `message`. The custom-cf7 wrapper this
 * site uses is unverified against a live call (see module doc note), so this
 * only claims a confident "sent"/"rejected" reading when that shape is
 * actually present, and otherwise reports "unknown" with the raw upstream
 * body attached so the caller can judge for themselves.
 */
function interpretResponse(httpStatus: number, raw: unknown): ContactInquiryResult {
  const body = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : null;
  const cf7Status = typeof body?.status === "string" ? body.status : null;
  const cf7Message = typeof body?.message === "string" ? body.message : null;

  if (cf7Status === "mail_sent") {
    return {
      submitted: true,
      status: "sent",
      message: cf7Message || "Message sent.",
      httpStatus,
      raw,
    };
  }

  if (cf7Status) {
    return {
      submitted: false,
      status: "rejected",
      message: cf7Message || `Submission rejected (status: ${cf7Status}).`,
      httpStatus,
      raw,
    };
  }

  if (httpStatus >= 200 && httpStatus < 300) {
    return {
      submitted: true,
      status: "unknown",
      message:
        "The backend accepted the request (HTTP 2xx) but returned a response shape this integration doesn't recognize, so success could not be confirmed with certainty. Raw response is attached.",
      httpStatus,
      raw,
    };
  }

  return {
    submitted: false,
    status: "unknown",
    message: `The backend returned HTTP ${httpStatus}. Raw response is attached.`,
    httpStatus,
    raw,
  };
}
