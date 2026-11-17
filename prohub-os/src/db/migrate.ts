import { migrate } from "drizzle-orm/postgres-js/migrator";
import { getDb, closeDb } from "./client";

async function main() {
  await migrate(getDb(), { migrationsFolder: "./drizzle" });
  console.log("✓ migrations applied");
  await closeDb();
}

main().catch(async (e) => {
  console.error("Migration failed:", e);
  await closeDb();
  process.exit(1);
});
