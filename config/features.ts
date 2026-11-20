/**
 * Feature switches, read from the deployment's environment at build time.
 *
 * CONTACT_TOOL_ENABLED: the submit_contact_inquiry MCP action sends a real
 * inquiry to Novoterm's inbox. From November 2026 it is OFF by default: it is
 * registered only when the deployment sets CONTACT_TOOL_ENABLED=true, which
 * should happen only after deployment checks D1–D3 (DEPLOYMENT.md) are done —
 * the built-in rate limits are per server instance and do not protect a
 * serverless fleet on their own. (October 2026 shipped it on by default.)
 * When off, the tool is not registered and nothing advertises it (ai.txt,
 * the agent page, the API catalog, company/contact data).
 */
export const CONTACT_TOOL_ENABLED = process.env.CONTACT_TOOL_ENABLED === "true";

export const CONTACT_TOOL_NAME = "submit_contact_inquiry";
