import { db } from "@/db/client";
import { activityLog } from "@/db/schema";

export type Actor = { type: "user" | "agent" | "system" | "webhook"; id: string };

export const actorString = (a: Actor) => `${a.type}:${a.id}`;

/** Append-only audit trail. Failures to log never break the calling operation, but are reported. */
export async function logActivity(
  actor: Actor,
  action: string,
  entity?: { type: string; id: string } | null,
  details: Record<string, unknown> = {},
) {
  try {
    await db.insert(activityLog).values({
      actorType: actor.type,
      actorId: actor.id,
      action,
      entityType: entity?.type ?? null,
      entityId: entity?.id ?? null,
      details,
    });
  } catch (e) {
    console.error("[audit] failed to write activity log", action, e);
  }
}
