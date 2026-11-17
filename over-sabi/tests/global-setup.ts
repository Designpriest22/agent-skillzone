import { execFileSync } from "node:child_process";

/** Fresh schema + seed for the integration test database. */
export default async function setup() {
  const url = process.env.TEST_DATABASE_URL ?? "postgres://oversabi:oversabi@localhost:5432/oversabi_test";
  const env = { ...process.env, DATABASE_URL: url, NODE_ENV: "test" as const };
  execFileSync("npx", ["tsx", "scripts/migrate.ts", "--reset"], { env, stdio: "inherit" });
  execFileSync("npx", ["tsx", "scripts/seed.ts"], { env, stdio: "inherit" });
}
