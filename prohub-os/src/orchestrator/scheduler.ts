/**
 * Central scheduler. Schedules live in the `schedules` table (editable in Settings).
 * Each tick enqueues due schedules with a per-slot dedupe key, so multiple workers never double-fire.
 */
import { Cron } from "croner";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { schedules } from "@/db/schema";
import { enqueue, type JobType } from "./queue";

export const DEFAULT_SCHEDULES: { slug: string; name: string; cron: string; jobType: JobType; payload?: Record<string, unknown> }[] = [
  { slug: "morning-intelligence", name: "Morning business intelligence (MD → Research, Sales)", cron: "0 7 * * 1-6", jobType: "cycle.morning" },
  { slug: "midday-execution", name: "Midday execution cycle (Operations Manager)", cron: "0 12 * * 1-6", jobType: "cycle.midday" },
  { slug: "evening-review", name: "Evening review + daily executive briefing", cron: "0 18 * * *", jobType: "cycle.evening" },
  { slug: "daily-finance", name: "Daily financial report", cron: "30 19 * * *", jobType: "report.generate", payload: { kind: "daily_finance" } },
  { slug: "follow-up-reminders", name: "Overdue follow-up reminders", cron: "15 * * * *", jobType: "followups.check" },
  { slug: "invoice-check", name: "Overdue invoice check", cron: "0 9 * * *", jobType: "invoices.check" },
  { slug: "publish-scheduled", name: "Publish approved scheduled content", cron: "*/5 * * * *", jobType: "content.publish_due" },
  { slug: "weekly-reports", name: "Weekly business & social reports", cron: "0 8 * * 1", jobType: "report.generate", payload: { kind: "weekly" } },
  { slug: "monthly-reports", name: "Monthly financial & social reports", cron: "0 8 1 * *", jobType: "report.generate", payload: { kind: "monthly" } },
];

export function nextRun(cron: string, tz: string, from = new Date()): Date | null {
  return new Cron(cron, { timezone: tz, paused: true }).nextRun(from) ?? null;
}

export async function tickScheduler(now = new Date()) {
  const rows = await db.select().from(schedules).where(eq(schedules.enabled, true));
  const fired: string[] = [];
  for (const s of rows) {
    const next = s.nextRunAt ?? nextRun(s.cron, s.timezone, s.lastRunAt ?? new Date(now.getTime() - 60_000));
    if (!next) continue;
    if (next.getTime() <= now.getTime()) {
      await enqueue(s.jobType as JobType, s.payload, { priority: 3, dedupeKey: `schedule:${s.slug}:${next.toISOString()}` });
      await db.update(schedules).set({ lastRunAt: now, nextRunAt: nextRun(s.cron, s.timezone, now) }).where(eq(schedules.slug, s.slug));
      fired.push(s.slug);
    } else if (!s.nextRunAt) {
      await db.update(schedules).set({ nextRunAt: next }).where(eq(schedules.slug, s.slug));
    }
  }
  return fired;
}
