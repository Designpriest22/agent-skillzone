import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { env } from "@/lib/env";

type DB = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as { __prohubSql?: postgres.Sql; __prohubDb?: DB };

function init() {
  const client = postgres(env.databaseUrl, {
    max: Number(process.env.DATABASE_POOL_SIZE ?? 10),
    idle_timeout: 30,
    // Supabase's transaction pooler (port 6543) does not support prepared statements.
    prepare: process.env.DATABASE_PREPARE !== "false",
    onnotice: () => {},
  });
  return { client, db: drizzle(client, { schema }) };
}

export function getDb(): DB {
  if (!globalForDb.__prohubDb) {
    const { client, db } = init();
    globalForDb.__prohubSql = client;
    globalForDb.__prohubDb = db;
  }
  return globalForDb.__prohubDb;
}

/** Proxy so modules can `import { db }` without forcing a connection at import time. */
export const db = new Proxy({} as DB, {
  get(_t, prop) {
    const real = getDb() as unknown as Record<string | symbol, unknown>;
    const v = real[prop];
    return typeof v === "function" ? (v as (...a: unknown[]) => unknown).bind(real) : v;
  },
});

export async function closeDb() {
  await globalForDb.__prohubSql?.end({ timeout: 5 });
  globalForDb.__prohubSql = undefined;
  globalForDb.__prohubDb = undefined;
}

export { schema };
