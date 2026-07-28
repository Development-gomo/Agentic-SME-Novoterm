/**
 * Minimal in-memory sliding-window rate limiter.
 *
 * Scoped per serverless instance, not shared across a fleet — acceptable for
 * a public, read-only, low-traffic agent API where the goal is to blunt
 * accidental hammering, not enforce a hard global cap. Swap for a shared
 * store (e.g. Upstash Redis) if traffic grows enough for that gap to matter.
 */

export type RateLimitResult = {
  limited: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

type Bucket = { count: number; windowStart: number };

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
      const key =
        headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        headers.get("x-real-ip") ??
        "unknown";
      return Promise.resolve(check(key));
    },
  };
}
