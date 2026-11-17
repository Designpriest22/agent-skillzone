/**
 * Bootstraps the first administrator: `npm run make-admin -- someone@example.com [role]`.
 * There is deliberately no UI path to the first admin role.
 */
import postgres from "postgres";
import { loadEnv } from "./load-env";

loadEnv();

async function main() {
  const [email, role = "admin"] = process.argv.slice(2);
  if (!email)
    throw new Error("Usage: npm run make-admin -- <email> [learner|contributor|reviewer|editor|admin]");
  if (!["learner", "contributor", "reviewer", "editor", "admin"].includes(role))
    throw new Error(`Unknown role ${role}`);
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  try {
    const rows =
      await sql`update users set role = ${role}, updated_at = now() where email = ${email.toLowerCase()} returning id`;
    if (!rows.length) throw new Error(`No user with email ${email}. Sign up first.`);
    await sql`insert into audit_events (actor_id, action, entity_type, entity_id, details)
              values (null, 'cli.set_role', 'user', ${rows[0]!.id}, ${sql.json({ role })})`;
    console.log(`${email} is now ${role}.`);
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
