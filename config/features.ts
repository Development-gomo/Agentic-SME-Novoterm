/**
 * Feature switches, read from the deployment's environment at build time.
 *
 * CONTACT_TOOL_ENABLED: the submit_contact_inquiry MCP action sends a real
 * inquiry to Novoterm's inbox. It is ON by default (Novoterm's decision);
 * setting the environment variable to "false" is the emergency off switch.
 * When off, the tool is not registered and nothing advertises it (ai.txt,
 * the agent page, the API catalog, company/contact data). See CHANGELOG,
 * "Deployment checks" D1–D3, for what must be verified with it on.
 */
export const CONTACT_TOOL_ENABLED = process.env.CONTACT_TOOL_ENABLED !== "false";

export const CONTACT_TOOL_NAME = "submit_contact_inquiry";
