import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { reports } from "@/db/schema";
import { getSettings } from "./settings";
import { isConfigured } from "@/integrations/registry";
import { sendEmail } from "@/integrations/email";
import { sendTelegram } from "@/integrations/notify-channels";
import { reportToPdf } from "./report-render";
import { env } from "@/lib/env";
import type { ReportData } from "./reports";

/** Internal delivery of reports to the owner (email with PDF, Telegram digest). Owner-bound, so Level 1. */
export async function deliverReport(reportId: string) {
  const [r] = await db.select().from(reports).where(eq(reports.id, reportId));
  if (!r) return { delivered: [] as string[] };
  const delivered: string[] = [];
  const s = await getSettings();
  const link = `${env.appUrl}/os/reports/${r.id}`;
  if (s.reportEmail && (await isConfigured("smtp"))) {
    try {
      const pdf = await reportToPdf(r);
      await sendEmail({ to: s.reportEmail, subject: r.title, text: `${r.title}\n\n${r.narrative ?? ""}\n\nOpen in Prohub OS: ${link}`, attachments: [{ filename: `${r.kind}-${r.createdAt.toISOString().slice(0, 10)}.pdf`, content: pdf }] });
      delivered.push("email");
    } catch (e) { console.error("[reports] email delivery failed", e); }
  }
  try {
    const sections = (r.data as unknown as ReportData).sections ?? [];
    const digest = sections.slice(0, 10).map((sec) => {
      const lines = sec.kind === "kv" ? sec.rows.map((x) => `${x.label}: ${x.value}`) : sec.kind === "list" ? (sec.items.length ? sec.items.slice(0, 4) : [sec.empty ?? "—"]) : sec.kind === "table" ? [`${sec.rows.length} row(s)`] : [sec.body.slice(0, 200)];
      return `${sec.title}\n${lines.map((l) => `  ${l}`).join("\n")}`;
    }).join("\n\n");
    if (await sendTelegram(`${r.title}\n\n${digest}\n\n${link}`)) delivered.push("telegram");
  } catch (e) { console.error("[reports] telegram delivery failed", e); }
  return { delivered };
}
