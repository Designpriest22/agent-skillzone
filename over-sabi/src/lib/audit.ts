import "server-only";
import { db, type Sql, type Tx } from "./db";

/** Records an administrative or security-relevant action. */
export async function audit(
  actorId: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  details: Record<string, unknown> = {},
  sql: Sql | Tx = db(),
) {
  await sql`
    insert into audit_events (actor_id, action, entity_type, entity_id, details)
    values (${actorId}, ${action}, ${entityType}, ${entityId}, ${sql.json(details as never)})`;
}
