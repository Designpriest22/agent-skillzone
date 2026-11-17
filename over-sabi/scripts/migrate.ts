/**
 * Minimal, dependency-free migration runner. Applies db/migrations/*.sql in
 * filename order, each inside a transaction, and records them in
 * schema_migrations. `--reset` drops and recreates the public schema (local
 * development and tests only; refuses to run when NODE_ENV=production).
 */
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";
import { loadEnv } from "./load-env";

loadEnv();

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local.");
  const sql = postgres(url, { max: 1, onnotice: () => {} });
  try {
    if (process.argv.includes("--reset")) {
      if (process.env.NODE_ENV === "production") throw new Error("Refusing to reset a production database.");
      await sql.unsafe("drop schema public cascade; create schema public;");
      console.log("Schema reset.");
    }
    await sql`create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())`;
    const dir = path.join(process.cwd(), "db", "migrations");
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".sql"))
      .sort();
    const applied = new Set((await sql`select name from schema_migrations`).map((r) => r.name as string));
    for (const file of files) {
      if (applied.has(file)) continue;
      const body = fs.readFileSync(path.join(dir, file), "utf8");
      await sql.begin(async (tx) => {
        await tx.unsafe(body);
        await tx`insert into schema_migrations (name) values (${file})`;
      });
      console.log(`Applied ${file}`);
    }
    console.log("Migrations up to date.");
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
