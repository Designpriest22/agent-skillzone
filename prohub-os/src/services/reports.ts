/**
 * Report builders. All figures are computed here from the database — models only add narrative.
 * Every report is a list of typed sections so one renderer can produce dashboard, PDF, XLSX and CSV.
 */
import { and, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { tasks, leads, intelItems, transactions, approvals, followUps, jobs, reports, invoices, contentItems, agentRuns, clients } from "@/db/schema";
import { financeSummary, receivables, pipelineSummary, conversionStats, targetStatus, campaignRoi, topClientsByLtv } from "./finance";
import { dayPeriod, weekPeriod, monthPeriod, type Period } from "@/lib/time";
import { formatMoney, pct } from "@/lib/money";
import { STAGE_LABEL } from "./scoring";

export type Section =
  | { kind: "kv"; title: string; rows: { label: string; value: string }[] }
  | { kind: "table"; title: string; columns: string[]; rows: (string | number)[][]; empty?: string }
  | { kind: "list"; title: string; items: string[]; empty?: string }
  | { kind: "text"; title: string; body: string };

export type ReportData = { sections: Section[]; generatedAt: string };
export type ReportKind = typeof reports.$inferSelect.kind;

/** Expense categories treated as direct cost of delivering client work (for gross profit). */
export const DIRECT_COST_CATEGORIES = ["freelancers", "production", "media_buying", "project_costs", "printing", "equipment_rental"];

const m = (v: number) => formatMoney(v);

async function tasksCompletedIn(p: Period) {
  return db.select({ title: tasks.title, agent: tasks.agentSlug, summary: tasks.resultSummary }).from(tasks)
    .where(and(eq(tasks.status, "completed"), gte(tasks.completedAt, p.start), lt(tasks.completedAt, p.end))).orderBy(desc(tasks.completedAt)).limit(40);
}

async function operationalProblems(since: Date) {
  const [failed, dead, overdue, staleApprovals, failedApprovals] = await Promise.all([
    db.select({ title: tasks.title, agent: tasks.agentSlug, error: tasks.error }).from(tasks).where(and(eq(tasks.status, "failed"), gte(tasks.updatedAt, since))).limit(20),
    db.select({ type: jobs.type, error: jobs.lastError }).from(jobs).where(and(eq(jobs.status, "dead"), gte(jobs.createdAt, since))).limit(10),
    db.select({ n: sql<number>`count(*)::int` }).from(followUps).where(and(eq(followUps.status, "open"), sql`${followUps.dueAt} < now()`)),
    db.select({ n: sql<number>`count(*)::int` }).from(approvals).where(and(eq(approvals.status, "pending"), sql`${approvals.createdAt} < now() - interval '24 hours'`)),
    db.select({ title: approvals.title, error: approvals.error }).from(approvals).where(and(eq(approvals.status, "failed"), gte(approvals.createdAt, since))).limit(10),
  ]);
  const items: string[] = [];
  for (const f of failed) items.push(`Task failed — [${f.agent}] ${f.title}: ${(f.error ?? "").slice(0, 160)}`);
  for (const d of dead) items.push(`Background job ${d.type} exhausted retries: ${(d.error ?? "").slice(0, 160)}`);
  if (overdue[0].n) items.push(`${overdue[0].n} follow-up(s) overdue`);
  if (staleApprovals[0].n) items.push(`${staleApprovals[0].n} approval request(s) waiting more than 24h`);
  for (const a of failedApprovals) items.push(`Approved action failed — ${a.title}: ${(a.error ?? "").slice(0, 160)}`);
  return items;
}

export async function buildDailyBriefing(now = new Date()): Promise<{ data: ReportData; period: Period }> {
  const today = dayPeriod(now), yesterday = dayPeriod(now, -1);
  const last24 = new Date(now.getTime() - 24 * 3600_000);
  const [doneYesterday, doneToday, opps, newLeads, finYesterday, finToday, recv, problems, target, wonToday, invoicedToday, pendingApprovals, spend] = await Promise.all([
    tasksCompletedIn(yesterday),
    tasksCompletedIn(today),
    db.select({ title: intelItems.title, category: intelItems.category, confidence: intelItems.confidence, rec: intelItems.recommendation }).from(intelItems)
      .where(and(gte(intelItems.createdAt, last24), inArray(intelItems.category, ["business_opportunity", "revenue_opportunity", "potential_client", "marketing_recommendation"]))).limit(20),
    db.select({ company: leads.companyName, industry: leads.industry, score: leads.score, priority: leads.priority, source: leads.source, value: leads.estimatedValueMinor }).from(leads).where(gte(leads.createdAt, last24)).orderBy(desc(leads.score)).limit(40),
    financeSummary(yesterday),
    financeSummary(today),
    receivables(now),
    operationalProblems(last24),
    targetStatus("month", now),
    db.select({ company: leads.companyName, value: leads.estimatedValueMinor }).from(leads).where(and(eq(leads.stage, "won"), gte(leads.stageChangedAt, last24))),
    db.select({ number: invoices.number, total: invoices.totalMinor }).from(invoices).where(and(inArray(invoices.status, ["sent", "partially_paid", "paid"]), gte(invoices.issueDate, today.start.toISOString().slice(0, 10)))),
    db.select({ n: sql<number>`count(*)::int` }).from(approvals).where(eq(approvals.status, "pending")),
    db.select({ s: sql<number>`coalesce(sum(${agentRuns.costUsd}),0)::float` }).from(agentRuns).where(gte(agentRuns.startedAt, last24)),
  ]);

  const recommended: string[] = [];
  const priorities: string[] = [];
  if (target.configured && !target.onTrack) recommended.push(`Revenue is behind pace: ${pct(target.pctAchieved)} of target with ${pct(target.period.elapsedPct, 0)} of the month elapsed. ${target.dealsRequired !== null ? `About ${target.dealsRequired} more deal(s) at the average deal value are needed.` : ""}`);
  if (!target.configured) recommended.push("Set this month's revenue target in Settings so progress can be tracked.");
  if (recv.overdueCount) recommended.push(`Chase ${recv.overdueCount} overdue invoice(s) totalling ${m(recv.overdueMinor)}.`);
  if (pendingApprovals[0].n) priorities.push(`Review ${pendingApprovals[0].n} pending approval(s) — outreach and publishing are blocked until then.`);
  const hot = newLeads.filter((l) => l.priority === "hot");
  if (hot.length) priorities.push(`Prioritise outreach to ${hot.length} hot lead(s): ${hot.slice(0, 5).map((l) => l.company).join(", ")}.`);
  if (problems.length) priorities.push(`Resolve ${problems.length} operational issue(s) listed above.`);
  if (!newLeads.length) recommended.push("No new leads in the last 24h — check that the morning prospecting cycle ran and the Sales agent has budget.");

  const sections: Section[] = [
    { kind: "list", title: "1. What happened yesterday", items: [
      `${doneYesterday.length} task(s) completed`,
      `Income recorded: ${m(finYesterday.incomeMinor)} · Expenses: ${m(finYesterday.expenseMinor)}`,
      ...doneYesterday.slice(0, 12).map((t) => `[${t.agent}] ${t.title}`),
    ] },
    { kind: "list", title: "2. Completed today", items: doneToday.map((t) => `[${t.agent}] ${t.title}`), empty: "No tasks completed yet today." },
    { kind: "list", title: "3. New business opportunities", items: opps.map((o) => `${o.title} (${o.category.replace(/_/g, " ")}, ${o.confidence})${o.rec ? ` — ${o.rec}` : ""}`), empty: "No new opportunities recorded in the last 24h." },
    { kind: "table", title: "4. New client leads", columns: ["Company", "Industry", "Score", "Priority", "Source", "Est. value"], rows: newLeads.map((l) => [l.company, l.industry ?? "—", l.score, l.priority, l.source, l.value ? m(l.value) : "—"]), empty: "No new leads in the last 24h." },
    { kind: "kv", title: "5. Sales generated", rows: [
      { label: "Deals won (24h)", value: `${wonToday.length}${wonToday.length ? ` — ${wonToday.map((w) => w.company).join(", ")}` : ""}` },
      { label: "Invoiced today", value: `${invoicedToday.length} invoice(s), ${m(invoicedToday.reduce((a, i) => a + i.total, 0))}` },
    ] },
    { kind: "kv", title: "6. Revenue received", rows: [
      { label: "Today", value: m(finToday.incomeMinor) },
      { label: "Month to date", value: m(target.achievedMinor) },
      ...(target.configured ? [{ label: "Monthly target", value: `${m(target.target.revenueTargetMinor)} (${pct(target.pctAchieved)} achieved)` }] : []),
    ] },
    { kind: "kv", title: "7. Pending payments", rows: [
      { label: "Outstanding receivables", value: `${m(recv.totalOutstandingMinor)} across ${recv.count} invoice(s)` },
      { label: "Overdue", value: `${m(recv.overdueMinor)} across ${recv.overdueCount} invoice(s)` },
    ] },
    { kind: "list", title: "8. Operational problems", items: problems, empty: "No operational problems detected." },
    { kind: "list", title: "9. Recommended actions", items: recommended, empty: "No system-generated recommendations." },
    { kind: "list", title: "10. Priorities for the next 24 hours", items: priorities, empty: "No urgent priorities flagged by the system." },
    { kind: "kv", title: "AI workforce cost (24h)", rows: [{ label: "Estimated model + search spend", value: `$${spend[0].s.toFixed(2)}` }] },
  ];
  return { data: { sections, generatedAt: now.toISOString() }, period: { start: yesterday.start, end: today.end, label: today.label } };
}

export async function buildDailyFinance(now = new Date()) {
  const p = dayPeriod(now);
  const [fin, recv, won] = await Promise.all([
    financeSummary(p), receivables(now),
    db.select({ company: leads.companyName }).from(leads).where(and(eq(leads.stage, "won"), gte(leads.stageChangedAt, p.start), lt(leads.stageChangedAt, p.end))),
  ]);
  const tx = await db.select().from(transactions).where(and(gte(transactions.occurredAt, p.start), lt(transactions.occurredAt, p.end))).orderBy(transactions.occurredAt);
  const sections: Section[] = [
    { kind: "kv", title: "Sales", rows: [{ label: "Deals won", value: `${won.length}${won.length ? ` (${won.map((w) => w.company).join(", ")})` : ""}` }] },
    { kind: "kv", title: "Revenue", rows: [{ label: "Income recorded", value: m(fin.incomeMinor) }, { label: "Refunds", value: m(fin.refundMinor) }] },
    { kind: "table", title: "Expenses", columns: ["Category", "Amount"], rows: fin.expensesByCategory.map((e) => [e.category, m(e.amountMinor)]), empty: "No expenses recorded today." },
    { kind: "kv", title: "Outstanding payments", rows: [{ label: "Receivables", value: m(recv.totalOutstandingMinor) }, { label: "Overdue", value: `${m(recv.overdueMinor)} (${recv.overdueCount})` }] },
    { kind: "table", title: "Transactions", columns: ["Time", "Type", "Category", "Description", "Amount", "Source"], rows: tx.map((t) => [t.occurredAt.toISOString(), t.type, t.category, t.description, m(t.amountBaseMinor), t.source]), empty: "No transactions recorded today." },
  ];
  return { data: { sections, generatedAt: now.toISOString() }, period: p };
}

export async function buildWeeklyBusiness(now = new Date(), weekOffset = -1) {
  const p = weekPeriod(now, weekOffset);
  const [fin, conv, pipe, productivity, newClients] = await Promise.all([
    financeSummary(p), conversionStats(p), pipelineSummary(),
    db.execute(sql`SELECT agent_slug, count(*) FILTER (WHERE status='completed')::int AS completed, count(*) FILTER (WHERE status='failed')::int AS failed
      FROM tasks WHERE updated_at >= ${p.start.toISOString()} AND updated_at < ${p.end.toISOString()} GROUP BY agent_slug ORDER BY completed DESC`),
    db.select({ name: clients.name }).from(clients).where(and(gte(clients.createdAt, p.start), lt(clients.createdAt, p.end))),
  ]);
  const prod = productivity as unknown as { agent_slug: string; completed: number; failed: number }[];
  const sections: Section[] = [
    { kind: "kv", title: "Business performance", rows: [
      { label: "Income", value: m(fin.incomeMinor) }, { label: "Expenses", value: m(fin.expenseMinor) }, { label: "Net", value: m(fin.netMinor) },
      { label: "Pipeline (open, unweighted estimate)", value: m(pipe.openValueMinor) }, { label: "Pipeline (weighted estimate)", value: m(pipe.weightedValueMinor) },
    ] },
    { kind: "list", title: "New clients", items: newClients.map((c) => c.name), empty: "No new clients this week." },
    { kind: "kv", title: "Leads & conversion", rows: [
      { label: "Leads generated", value: String(conv.leadsCreated) }, { label: "Won", value: String(conv.won) }, { label: "Lost", value: String(conv.lost) },
      { label: "Win rate (decided leads)", value: pct(conv.winRatePct) },
    ] },
    { kind: "table", title: "Pipeline by stage", columns: ["Stage", "Leads", "Est. value"], rows: pipe.byStage.map((s) => [STAGE_LABEL[s.stage] ?? s.stage, s.count, m(s.valueMinor)]) },
    { kind: "table", title: "Departmental productivity", columns: ["Agent", "Completed", "Failed", "Success rate"], rows: prod.map((r) => [r.agent_slug, r.completed, r.failed, r.completed + r.failed ? pct((r.completed / (r.completed + r.failed)) * 100, 0) : "—"]), empty: "No agent activity this week." },
  ];
  return { data: { sections, generatedAt: now.toISOString() }, period: p };
}

export async function buildMonthlyFinance(now = new Date(), monthOffset = -1) {
  const p = monthPeriod(now, monthOffset);
  const [fin, recv, roi, ltv, opps] = await Promise.all([
    financeSummary(p), receivables(p.end), campaignRoi(), topClientsByLtv(10),
    db.select({ title: intelItems.title, economics: intelItems.economics, confidence: intelItems.confidence }).from(intelItems)
      .where(and(eq(intelItems.category, "revenue_opportunity"), gte(intelItems.createdAt, p.start), lt(intelItems.createdAt, p.end))).limit(15),
  ]);
  const direct = fin.expensesByCategory.filter((e) => DIRECT_COST_CATEGORIES.includes(e.category)).reduce((a, e) => a + e.amountMinor, 0);
  const gross = fin.incomeMinor - fin.refundMinor - direct;
  const sections: Section[] = [
    { kind: "kv", title: "Summary", rows: [
      { label: "Total revenue", value: m(fin.incomeMinor) }, { label: "Refunds", value: m(fin.refundMinor) },
      { label: "Total expenses", value: m(fin.expenseMinor) }, { label: "Direct costs", value: m(direct) },
      { label: "Gross profit", value: m(gross) }, { label: "Net profit", value: m(fin.netMinor) }, { label: "Net margin", value: pct(fin.marginPct) },
      { label: "Outstanding receivables (period end)", value: m(recv.totalOutstandingMinor) },
    ] },
    { kind: "table", title: "Revenue by service", columns: ["Service", "Revenue"], rows: fin.byService.map((s) => [s.service, m(s.incomeMinor)]), empty: "No revenue recorded." },
    { kind: "table", title: "Revenue by client", columns: ["Client", "Revenue"], rows: fin.byClient.map((c) => [c.client, m(c.incomeMinor)]), empty: "No revenue recorded." },
    { kind: "table", title: "Expenses by category", columns: ["Category", "Amount"], rows: fin.expensesByCategory.map((e) => [e.category, m(e.amountMinor)]), empty: "No expenses recorded." },
    { kind: "table", title: "Marketing ROI by campaign (all time)", columns: ["Campaign", "Spend", "Leads", "Won", "Attributed revenue", "ROI"], rows: roi.map((r) => [r.name, m(r.spendMinor), r.leads, r.won, m(r.revenueMinor), pct(r.roiPct, 0)]), empty: "No campaigns recorded." },
    { kind: "table", title: "Top clients by lifetime value", columns: ["Client", "Lifetime revenue"], rows: ltv.map((c) => [c.name, m(c.ltvMinor)]), empty: "No clients yet." },
    { kind: "list", title: "Growth opportunities identified (estimates)", items: opps.map((o) => `${o.title}${o.economics?.estRevenueMinor ? ` — est. revenue ${m(o.economics.estRevenueMinor)}` : ""}${o.economics?.estCostMinor ? `, est. cost ${m(o.economics.estCostMinor)}` : ""} (${o.confidence})`), empty: "No revenue opportunities recorded this month." },
  ];
  return { data: { sections, generatedAt: now.toISOString() }, period: p };
}

export async function buildSocialReport(now = new Date(), kind: "social_weekly" | "social_monthly") {
  const p = kind === "social_weekly" ? weekPeriod(now, -1) : monthPeriod(now, -1);
  const items = await db.select().from(contentItems).where(and(gte(contentItems.createdAt, p.start), lt(contentItems.createdAt, p.end)));
  const published = items.filter((i) => i.status === "published");
  const byPlatform = new Map<string, { planned: number; published: number; manual: number; metrics: Record<string, number> }>();
  for (const i of items) {
    const b = byPlatform.get(i.platform) ?? { planned: 0, published: 0, manual: 0, metrics: {} };
    b.planned++;
    if (i.status === "published") b.published++;
    if (i.status === "manual_publish") b.manual++;
    if (i.metricsSource) for (const [k, v] of Object.entries(i.metrics)) b.metrics[k] = (b.metrics[k] ?? 0) + v;
    byPlatform.set(i.platform, b);
  }
  const socialLeads = await db.select({ n: sql<number>`count(*)::int` }).from(leads).where(and(eq(leads.source, "social"), gte(leads.createdAt, p.start), lt(leads.createdAt, p.end)));
  const sections: Section[] = [
    { kind: "kv", title: "Overview", rows: [{ label: "Content items planned", value: String(items.length) }, { label: "Published via API", value: String(published.length) }, { label: "Leads from social", value: String(socialLeads[0].n) }] },
    { kind: "table", title: "By platform", columns: ["Platform", "Planned", "Published", "Manual queue", "Sourced metrics"], rows: [...byPlatform.entries()].map(([k, v]) => [k, v.planned, v.published, v.manual, Object.keys(v.metrics).length ? Object.entries(v.metrics).map(([a, b]) => `${a}: ${b}`).join(", ") : "not connected"]), empty: "No social content in this period." },
    { kind: "text", title: "Data note", body: "Engagement and follower figures appear only when imported from a connected platform API or entered manually with a source. Nothing here is estimated." },
  ];
  return { data: { sections, generatedAt: now.toISOString() }, period: p };
}

const TITLES: Record<string, string> = {
  daily_briefing: "Daily Executive Briefing", daily_finance: "Daily Financial Report", weekly_business: "Weekly Business Performance",
  monthly_finance: "Monthly Financial Report", social_weekly: "Weekly Social Media Report", social_monthly: "Monthly Social Media Report",
};

export async function generateReport(kind: Exclude<ReportKind, "custom">, generatedBy = "system", now = new Date()) {
  const built =
    kind === "daily_briefing" ? await buildDailyBriefing(now)
    : kind === "daily_finance" ? await buildDailyFinance(now)
    : kind === "weekly_business" ? await buildWeeklyBusiness(now)
    : kind === "monthly_finance" ? await buildMonthlyFinance(now)
    : await buildSocialReport(now, kind);
  const [row] = await db.insert(reports).values({
    kind, title: `${TITLES[kind]} — ${built.period.label}`, periodStart: built.period.start, periodEnd: built.period.end,
    data: built.data as unknown as Record<string, unknown>, generatedBy,
  }).returning();
  return row;
}

