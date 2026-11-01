/**
 * Scheduled business cycles. Morning = intelligence, midday = execution, evening = performance review.
 * Mechanical checks (follow-ups, invoices, scheduled publishing) run in code without model cost.
 */
import { and, eq, inArray, isNull, lt, lte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { followUps, invoices, contentItems, tasks, leads } from "@/db/schema";
import { createTask } from "./tasks";
import { enqueue } from "./queue";
import { getSettings } from "@/services/settings";
import { generateReport } from "@/services/reports";
import { notifyOwner } from "@/services/notify";
import { publishContentItem } from "@/governance/actions";
import { localParts } from "@/lib/time";
import { formatMoney } from "@/lib/money";
import { deliverReport } from "@/services/report-delivery";

export async function morningCycle() {
  const s = await getSettings();
  if (!s.autonomousCycles) return { skipped: "autonomous cycles disabled" };
  const day = localParts().day;
  const segment = s.prospectSegments[day % s.prospectSegments.length] ?? "SMEs";
  const t = await createTask({
    agentSlug: "managing-director", createdBy: "system:scheduler", status: "approved", kind: "scheduled", priority: 2,
    title: `Morning business intelligence — ${new Date().toISOString().slice(0, 10)}`,
    instructions: `Run the morning intelligence cycle.

1. Delegate to research: scan the last 24–48h of developments relevant to Prohub (Nigerian marketing/advertising/creative industry, platform changes, notable brand campaigns, competitor agencies) and publish the 3–6 most actionable findings to the Intelligence Centre with sources.
2. Delegate to sales-marketing: find up to ${s.dailyProspectQuota} real prospects in today's focus segment "${segment}" (Lagos/Abuja first, then other Nigerian cities) that show a concrete need for Prohub's services. Check the CRM for duplicates first. Report the real number found.
3. Yourself: review outstanding tasks, active projects and yesterday's sales performance with your data tools (operations_snapshot, sales_metrics, revenue_target_status).
4. When subtasks finish, consolidate into a short morning summary: key intel, new leads (count and hot ones), risks, and the day's priorities. Record any opportunity worth pursuing with record_intel.`,
  });
  return { taskId: t.id, segment };
}

export async function middayCycle() {
  const s = await getSettings();
  if (!s.autonomousCycles) return { skipped: "autonomous cycles disabled" };
  const ops = await createTask({
    agentSlug: "operations-manager", createdBy: "system:scheduler", status: "approved", kind: "scheduled", priority: 2,
    title: `Midday execution cycle — ${new Date().toISOString().slice(0, 10)}`,
    instructions: `Run the midday execution cycle.
- Review every proposed task (list_tasks statuses=["proposed"]) and approve or reject with reasons.
- Check operations_snapshot. For overdue follow-ups, delegate to client-management to act on them (prepare follow-up messages via approval requests, update stages).
- For new hot/warm leads from this morning without outreach, delegate to client-management to prepare personalised first-contact messages (request approval; do not send directly). Have copywriting draft if the message needs a stronger pitch.
- For active projects with deadlines in the next 5 days, check progress and delegate the next deliverable to the right creative agent.
- Delegate to social-media: make sure Prohub's own content calendar covers the next 7 days at the configured cadence (${Object.entries(s.socialCadence).map(([k, v]) => `${k} ${v}/wk`).join(", ")}); fill gaps with drafts and request publishing approval.
- Re-delegate failed tasks from the last 24h if the cause is fixable.
Finish with a summary of what was set in motion.`,
  });
  return { taskId: ops.id };
}

export async function eveningCycle() {
  const report = await generateReport("daily_briefing", "system:scheduler");
  const s = await getSettings();
  let taskId: string | null = null;
  if (s.autonomousCycles) {
    const t = await createTask({
      agentSlug: "managing-director", createdBy: "system:scheduler", status: "approved", kind: "scheduled", priority: 2,
      title: `Evening performance review — ${new Date().toISOString().slice(0, 10)}`,
      instructions: `Run the evening performance review.
The system generated today's executive briefing (report_id=${report.id}) from the database. Read it with read_report.
- Review completed and unfinished work (list_tasks since_hours=24), lead generation, sales activity, revenue vs target, and campaign status.
- Identify operational bottlenecks and their causes.
- Write the executive narrative with write_report_narrative: a 5–8 sentence assessment, then "Recommended actions" and "Priorities for the next 24 hours" as bullet lists. Use only figures from the report or your data tools.
- If revenue is behind target, state the likely causes from the data and delegate one concrete corrective action.
Complete the task referencing the report.`,
    });
    taskId = t.id;
  } else {
    await notifyOwner({ kind: "report", title: report.title, body: "Today's briefing is ready.", href: `/os/reports/${report.id}` });
    await deliverReport(report.id);
  }
  return { reportId: report.id, taskId };
}

/** Hourly: overdue follow-ups become reminders + tasks for the responsible agent (deduplicated per follow-up). */
export async function checkFollowUps() {
  const due = await db.select().from(followUps).where(and(eq(followUps.status, "open"), lte(followUps.dueAt, new Date()), isNull(followUps.remindedAt))).limit(50);
  let created = 0;
  for (const fu of due) {
    const lead = fu.leadId ? (await db.select({ company: leads.companyName, stage: leads.stage }).from(leads).where(eq(leads.id, fu.leadId)))[0] : null;
    await createTask({
      agentSlug: fu.agentSlug, createdBy: "system:follow-ups", status: "approved", kind: "triage", priority: 2,
      leadId: fu.leadId, clientId: fu.clientId,
      title: `Follow-up due${lead ? `: ${lead.company}` : ""}`,
      instructions: `A scheduled follow-up is due (follow_up_id=${fu.id}). Reason: ${fu.reason}.
Read the history (get_lead_history), decide the right next step, prepare it (request approval for any outbound message), update the lead stage if warranted, then complete_follow_up and schedule the next one if needed.`,
    });
    await db.update(followUps).set({ remindedAt: new Date() }).where(eq(followUps.id, fu.id));
    created++;
  }
  if (created) await notifyOwner({ kind: "info", title: `${created} follow-up(s) due`, body: "Assigned to the responsible agents.", href: "/os/crm", push: false });
  return { created };
}

/** Daily: flag overdue invoices to Finance and the owner. */
export async function checkInvoices() {
  const today = new Date().toISOString().slice(0, 10);
  const overdue = await db.select().from(invoices).where(and(inArray(invoices.status, ["sent", "partially_paid"]), lt(invoices.dueDate, today)));
  if (!overdue.length) return { overdue: 0 };
  const total = overdue.reduce((a, i) => a + (i.totalMinor - i.amountPaidMinor), 0);
  await notifyOwner({ kind: "alert", title: `${overdue.length} overdue invoice(s) — ${formatMoney(total)}`, body: overdue.slice(0, 8).map((i) => `${i.number}: ${formatMoney(i.totalMinor - i.amountPaidMinor)} due ${i.dueDate}`).join("\n"), href: "/os/finance" });
  const existing = await db.select({ id: tasks.id }).from(tasks).where(and(eq(tasks.agentSlug, "finance"), eq(tasks.createdBy, "system:invoices"), inArray(tasks.status, ["approved", "queued", "in_progress"])));
  if (!existing.length) {
    await createTask({
      agentSlug: "finance", createdBy: "system:invoices", status: "approved", kind: "triage", priority: 2,
      title: `Overdue receivables review (${overdue.length})`,
      instructions: `There are ${overdue.length} overdue invoices totalling ${formatMoney(total)}. Review them (list_invoices overdue_only=true), prioritise by amount and age, and ask client-management (request_collaboration) to prepare polite payment reminders. Summarise cash-flow risk.`,
    });
  }
  return { overdue: overdue.length };
}

/** Every few minutes: publish approved content whose scheduled time has arrived. */
export async function publishDueContent() {
  const due = await db.select({ id: contentItems.id }).from(contentItems).where(and(eq(contentItems.status, "scheduled"), lte(contentItems.scheduledAt, new Date()))).limit(20);
  const results = [];
  for (const d of due) {
    try { results.push(await publishContentItem(d.id)); } catch (e) { results.push({ id: d.id, error: e instanceof Error ? e.message : String(e) }); }
  }
  return { processed: due.length, results };
}

/** Ensures the Operations Manager reviews agent-proposed tasks promptly (debounced to one pending review). */
export async function enqueueOpsReview() {
  const [pending] = await db.select({ n: sql<number>`count(*)::int` }).from(tasks)
    .where(and(eq(tasks.agentSlug, "operations-manager"), eq(tasks.createdBy, "system:ops-review"), inArray(tasks.status, ["approved", "queued", "in_progress"])));
  if (pending.n > 0) return null;
  const t = await createTask({
    agentSlug: "operations-manager", createdBy: "system:ops-review", status: "approved", kind: "triage", priority: 2,
    title: "Review proposed tasks",
    instructions: "Agents have proposed new work. Review every task with status proposed (list_tasks), approve those that serve current objectives and are not duplicates, reject the rest with a reason. Complete listing the tasks you reviewed.",
  });
  return t.id;
}

export async function weeklyReports() {
  const a = await generateReport("weekly_business", "system:scheduler");
  const b = await generateReport("social_weekly", "system:scheduler");
  for (const r of [a, b]) {
    await notifyOwner({ kind: "report", title: r.title, body: "Weekly report is ready.", href: `/os/reports/${r.id}` });
    await deliverReport(r.id);
  }
  return { reports: [a.id, b.id] };
}

export async function monthlyReports() {
  const a = await generateReport("monthly_finance", "system:scheduler");
  const b = await generateReport("social_monthly", "system:scheduler");
  await createTask({
    agentSlug: "finance", createdBy: "system:scheduler", status: "approved", kind: "scheduled", priority: 2,
    title: `Monthly financial review — ${a.title}`,
    instructions: `Read report ${a.id} (read_report). Write the narrative with write_report_narrative: profitability by service and client, cash-flow and receivables risk, marketing ROI, unnecessary spend, pricing recommendations with quantified impact in Naira, and growth opportunities. Use only figures in the report or from your finance tools.`,
  });
  for (const r of [a, b]) {
    await notifyOwner({ kind: "report", title: r.title, body: "Monthly report is ready.", href: `/os/reports/${r.id}` });
    await deliverReport(r.id);
  }
  return { reports: [a.id, b.id] };
}

export async function dailyFinanceReport() {
  const r = await generateReport("daily_finance", "system:scheduler");
  await deliverReport(r.id);
  return { reportId: r.id };
}

export { enqueue };
