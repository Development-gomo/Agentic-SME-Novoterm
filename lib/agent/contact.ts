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
 * RECAPTCHA (2026-10-14): the live form definition now also contains
 * [recaptcha size:normal theme:light align:left]. If the backend enforces
 * it for custom-cf7/v1/submit, submissions from this module carry no token
 * and are rejected; the rejection is surfaced to the agent as a failed
 * submission (see interpretResponse) rather than a false success. Novoterm
 * needs to exempt this server-side path from reCAPTCHA or confirm it is not
 * enforced there — this module deliberately does not try to bypass it.
 *
 * NOTE ON VERIFICATION: this has been validated against the live schema
 * endpoints (custom-cf7/v1/forms, custom-cf7/v1/form/321) but a real
 * end-to-end submission has deliberately not been fired during development,
 * to avoid creating a fake lead/email in Novoterm's real inbox. Test with one
 * genuine inquiry after deploying.
 */

const CONTACT_FORM_ID = 321;

/**
 * Optional shared secret for the WordPress submit route (check D1). If the
 * backend enforces reCAPTCHA on custom-cf7/v1/submit, Novoterm's developer can
 * let requests carrying this key skip only the reCAPTCHA step. The same value
 * must be configured on both sides. It is sent only to SUBMIT_URL (Novoterm's
 * own backend) and never logged or returned.
 */
const BACKEND_KEY_HEADER = "X-Novoterm-Agent-Key";
const BACKEND_KEY = process.env.CONTACT_BACKEND_KEY;

/** Upper bound for the backend call, so a hung upstream cannot hold the MCP request open. */
const SUBMIT_TIMEOUT_MS = 15_000;

/** Field length limits — generous for real inquiries, small enough to stop payload stuffing. */
export const CONTACT_FIELD_LIMITS = {
  fullName: 200,
  email: 254,
  phone: 40,
  companyName: 200,
  message: 5_000,
} as const;
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
  /**
   * "sent": the backend explicitly confirmed delivery. "rejected": it
   * explicitly refused. "unconfirmed": no explicit confirmation either way
   * (unrecognised 2xx body, non-2xx, timeout) — the inquiry may or may not
   * have been delivered, so it is never reported as submitted.
   */
  status: "sent" | "rejected" | "unconfirmed";
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
  for (const [field, max] of Object.entries(CONTACT_FIELD_LIMITS)) {
    const value = input[field as keyof typeof CONTACT_FIELD_LIMITS];
    if (typeof value === "string" && value.length > max) {
      throw new ContactInquiryValidationError(`${field} must be at most ${max} characters.`);
    }
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

  let response: Response;
  try {
    response = await fetch(SUBMIT_URL, {
      method: "POST",
      body: form,
      headers: BACKEND_KEY ? { [BACKEND_KEY_HEADER]: BACKEND_KEY } : undefined,
      signal: AbortSignal.timeout(SUBMIT_TIMEOUT_MS),
    });
  } catch (err) {
    const timedOut = err instanceof Error && err.name === "TimeoutError";
    return {
      submitted: false,
      status: "unconfirmed",
      message: timedOut
        ? `The contact form backend did not answer within ${SUBMIT_TIMEOUT_MS / 1000} seconds. The inquiry may or may not have been delivered.`
        : `Could not reach the contact form backend: ${err instanceof Error ? err.message : String(err)}`,
      httpStatus: 0,
      raw: null,
    };
  }

  // Read the body once as text, then try JSON, so a non-JSON error page is kept intact.
  const text = await response.text().catch(() => "");
  let raw: unknown = text || null;
  try {
    raw = JSON.parse(text);
  } catch {
    // Not JSON — keep the text body.
  }

  return interpretResponse(response.status, raw);
}

/**
 * Contact Form 7's standard submission contract reports outcome via a
 * `status` field ("mail_sent" | "validation_failed" | "spam" | "mail_failed"
 * | "aborted") and a human-readable `message`; wrappers commonly add a
 * boolean `success`. The custom-cf7 wrapper this site uses is unverified
 * against a live call (see module doc note), so only an explicit
 * confirmation (`status: "mail_sent"` or `success: true` without a failure
 * status) counts as sent. Everything else is "rejected" (explicit refusal) or
 * "unconfirmed", and never reported as submitted.
 */
function interpretResponse(httpStatus: number, raw: unknown): ContactInquiryResult {
  const body = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : null;
  const cf7Status = typeof body?.status === "string" ? body.status : null;
  const cf7Message = typeof body?.message === "string" ? body.message : null;
  const ok = httpStatus >= 200 && httpStatus < 300;
  const success = typeof body?.success === "boolean" ? body.success : null;

  // Every signal present must agree. "Sent" needs a 2xx plus an explicit
  // confirmation (status "mail_sent" and/or success: true) and no signal
  // saying otherwise; mixed signals (e.g. "mail_sent" with success: false, or
  // "mail_sent" on a 5xx) fall through to "unconfirmed".
  const confirms = cf7Status === "mail_sent" || success === true;
  const contradicts = (cf7Status !== null && cf7Status !== "mail_sent") || success === false;

  if (ok && confirms && !contradicts) {
    return {
      submitted: true,
      status: "sent",
      message: cf7Message || "Message sent.",
      httpStatus,
      raw,
    };
  }

  // Only failure signals, none confirming: an explicit refusal.
  if (contradicts && !confirms) {
    return {
      submitted: false,
      status: "rejected",
      message: cf7Message || `Submission rejected (status: ${cf7Status ?? "success: false"}).`,
      httpStatus,
      raw,
    };
  }

  return {
    submitted: false,
    status: "unconfirmed",
    message: ok
      ? "The backend answered HTTP 2xx without an explicit confirmation, so delivery could not be confirmed. Raw response is attached."
      : `The backend returned HTTP ${httpStatus} without an explicit confirmation. Raw response is attached.`,
    httpStatus,
    raw,
  };
}
