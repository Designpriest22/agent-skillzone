import "server-only";
import postgres from "postgres";
import { env } from "./env";

export type Sql = postgres.Sql;
export type Tx = postgres.TransactionSql;

const globalForDb = globalThis as unknown as { __oversabiSql?: Sql };

/**
 * The privileged connection. Use it directly ONLY for system work: authentication,
 * verified webhooks, cron jobs, public content reads and admin actions that have
 * already passed a server-side role check. Learner data goes through `withUser`.
 */
export function db(): Sql {
  if (!globalForDb.__oversabiSql) {
    globalForDb.__oversabiSql = postgres(env().DATABASE_URL, {
      max: Number(process.env.DATABASE_POOL_SIZE ?? 10),
      idle_timeout: 20,
      onnotice: () => {},
      // postgres.js prepares statements by default; transaction poolers (e.g.
      // Supabase's port 6543) need prepare:false.
      prepare: process.env.DATABASE_PREPARE !== "false",
    });
  }
  return globalForDb.__oversabiSql;
}

/**
 * Runs `fn` in a transaction as the restricted `oversabi_app` role with
 * `app.user_id` set, so row-level security limits every query to this learner's rows.
 */
export async function withUser<T>(userId: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return db().begin(async (tx) => {
    await tx`set local role oversabi_app`;
    await tx`select set_config('app.user_id', ${userId}, true)`;
    return fn(tx);
  }) as Promise<T>;
}
