/** Canonical origin for novoterm.se. Every absolute URL in the agent layer is built from this. */
export const SITE_ORIGIN = "https://www.novoterm.se";

/**
 * Origin of the headless WordPress backend behind novoterm.se. The frontend
 * at SITE_ORIGIN is a decoupled Next.js app; both the public content REST API
 * (wp-json/wp/v2/*, used by scripts/refresh-content.mjs) and the Contact Form
 * 7 submission endpoint (wp-json/custom-cf7/v1/submit/*, used by
 * lib/agent/contact.ts) live here, not on SITE_ORIGIN.
 */
export const WP_BACKEND_ORIGIN = "https://backend.novoterm.se";
