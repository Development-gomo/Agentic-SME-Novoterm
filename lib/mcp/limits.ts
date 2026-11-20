/**
 * MCP request limits, shared by the MCP route (app/mcp/[transport]/route.ts),
 * which enforces them, and the MCP documentation page (/agent/mcp), which
 * publishes them — so the documented limits are always the real ones.
 * All limits are per server instance (see lib/rate-limit.ts).
 */

/** General limit: requests per client IP per window. */
export const MCP_RATE_LIMIT_MAX_REQUESTS = 100;
export const MCP_RATE_LIMIT_WINDOW_MS = 60_000;

/** submit_contact_inquiry (only when enabled): submissions per client IP per window. */
export const MCP_CONTACT_LIMIT_MAX_REQUESTS = 5;
export const MCP_CONTACT_LIMIT_WINDOW_MS = 60 * 60_000;

/** JSON-RPC requests here are small; anything larger is not a legitimate MCP call. */
export const MCP_MAX_BODY_BYTES = 64 * 1024;
