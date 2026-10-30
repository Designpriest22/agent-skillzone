import "server-only";
import { db } from "./db";
import { HttpError } from "./http";

/**
 * Fixed-window rate limiter backed by Postgres, so limits hold across server
 * instances without extra infrastructure.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<void> {
  const rows = await db()`
    insert into rate_limits (key, window_start, count)
    values (${key}, to_timestamp(floor(extract(epoch from now()) / ${windowSeconds}) * ${windowSeconds}), 1)
    on conflict (key, window_start) do update set count = rate_limits.count + 1
    returning count`;
  if ((rows[0]?.count ?? 0) > limit) {
    throw new HttpError(429, "Too many attempts. Wait a moment and try again.", "rate_limited");
  }
}

export async function pruneRateLimits(): Promise<number> {
  const r = await db()`delete from rate_limits where window_start < now() - interval '1 day'`;
  return r.count;
}
