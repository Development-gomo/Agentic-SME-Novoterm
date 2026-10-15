/**
 * Minimal in-memory sliding-window rate limiter.
 *
 * Scoped per serverless instance, not shared across a fleet: counters reset
 * on a cold start and each warm instance counts separately. That is enough to
 * blunt accidental hammering of the read-only API, and it puts a per-instance
 * ceiling on the contact tool (app/mcp/[transport]/route.ts), but it is not a
 * hard global cap. For one, swap in a shared store (e.g. Upstash Redis /
 * Vercel KV) or an edge/WAF rate-limit rule on POST /mcp.
 */

export type RateLimitResult = {
  limited: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

type Bucket = { count: number; windowStart: number };

/**
 * Which request header carries the real client IP depends on the proxy in
 * front of the app, and only a header that proxy sets (overwriting any
 * client-supplied value) can be trusted. RATE_LIMIT_IP_HEADER names it
 * explicitly. Without it: on Vercel (VERCEL is set by the platform) use
 * x-vercel-forwarded-for, which Vercel's edge sets itself; anywhere else fall
 * back to x-real-ip / x-forwarded-for, which are only as trustworthy as the
 * proxy that sets them.
 */
const CLIENT_IP_HEADERS = process.env.RATE_LIMIT_IP_HEADER
  ? [process.env.RATE_LIMIT_IP_HEADER.toLowerCase()]
  : process.env.VERCEL
    ? ["x-vercel-forwarded-for"]
    : ["x-real-ip", "x-forwarded-for"];

/** The rate-limit key for a request: the first address in the trusted client-IP header. */
export function clientKey(headers: Headers): string {
  const raw = CLIENT_IP_HEADERS.map((h) => headers.get(h)).find(Boolean);
  return raw?.split(",")[0]?.trim() || "unknown";
}

/** Which header(s) the limiter trusts on this host, for /mcp/health diagnostics. */
export const CLIENT_IP_SOURCE = CLIENT_IP_HEADERS.join(" | ");

export function createRateLimiter(opts: {
  namespace: string;
  windowMs: number;
  maxRequests: number;
}) {
  const buckets = new Map<string, Bucket>();
  let lastSweep = Date.now();

  /**
   * Opportunistic cleanup: every ~10 windows, drop buckets whose window has
   * already expired. Without this, every distinct caller IP a long-lived
   * instance ever sees stays in the Map forever — a slow unbounded leak.
   */
  function sweepIfDue(now: number) {
    if (now - lastSweep < opts.windowMs * 10) return;
    lastSweep = now;
    for (const [key, bucket] of buckets) {
      if (now - bucket.windowStart >= opts.windowMs) buckets.delete(key);
    }
  }

  function check(key: string): RateLimitResult {
    const now = Date.now();
    sweepIfDue(now);
    const bucketKey = `${opts.namespace}:${key}`;
    const existing = buckets.get(bucketKey);

    if (!existing || now - existing.windowStart >= opts.windowMs) {
      buckets.set(bucketKey, { count: 1, windowStart: now });
      return {
        limited: false,
        remaining: opts.maxRequests - 1,
        resetAt: now + opts.windowMs,
        retryAfterSeconds: Math.ceil(opts.windowMs / 1000),
      };
    }

    existing.count += 1;
    const resetAt = existing.windowStart + opts.windowMs;
    const limited = existing.count > opts.maxRequests;
    return {
      limited,
      remaining: Math.max(opts.maxRequests - existing.count, 0),
      resetAt,
      retryAfterSeconds: Math.max(Math.ceil((resetAt - now) / 1000), 1),
    };
  }

  return {
    checkByHeaders(headers: Headers): Promise<RateLimitResult> {
      return Promise.resolve(check(clientKey(headers)));
    },
  };
}
