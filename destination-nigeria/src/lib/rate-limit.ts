/**
 * Fixed-window, in-memory rate limiter keyed by client fingerprint.
 * Adequate for a single instance. On multi-instance or serverless hosting,
 * also enable the platform's WAF / rate limiting (see docs/DEPLOYMENT.md).
 */
type Bucket = { count: number; resetAt: number };

export function createRateLimiter(limit: number, windowMs: number) {
  const buckets = new Map<string, Bucket>();
  return {
    check(key: string, now = Date.now()): { ok: boolean; retryAfter: number } {
      if (buckets.size > 5000) {
        for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
      }
      const b = buckets.get(key);
      if (!b || b.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return { ok: true, retryAfter: 0 };
      }
      b.count += 1;
      if (b.count > limit) return { ok: false, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
      return { ok: true, retryAfter: 0 };
    },
  };
}
