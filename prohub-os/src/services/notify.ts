import { db } from "@/db/client";
import { notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendTelegram, sendSlack } from "@/integrations/notify-channels";
import { env } from "@/lib/env";

/** In-app notification + best-effort push to configured channels (Telegram, Slack). */
export async function notifyOwner(n: { kind: "approval" | "alert" | "report" | "info"; title: string; body: string; href?: string; push?: boolean }) {
  const [row] = await db.insert(notifications).values({ kind: n.kind, title: n.title, body: n.body, href: n.href ?? null }).returning();
  if (n.push === false) return row;
  const text = `${n.title}\n\n${n.body}${n.href ? `\n\n${env.appUrl}${n.href}` : ""}`;
  const delivered: string[] = [];
  for (const [name, fn] of [["telegram", sendTelegram], ["slack", sendSlack]] as const) {
    try {
      if (await fn(text)) delivered.push(name);
    } catch (e) {
      console.error(`[notify] ${name} delivery failed:`, e instanceof Error ? e.message : e);
    }
  }
  if (delivered.length) await db.update(notifications).set({ deliveredVia: delivered }).where(eq(notifications.id, row.id));
  return row;
}
