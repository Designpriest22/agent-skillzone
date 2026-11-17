/**
 * Report builders. All figures are computed here from the database — models only add narrative.
 * Every report is a list of typed sections so one renderer can produce dashboard, PDF, XLSX and CSV.
 */
import { and, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { tasks, leads, intelItems, transactions, approvals, followUps, jobs, reports, invoices, contentItems, agentRuns, clients, projects, campaigns, interactions } from "@/db/schema";
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

/**
 * The 17:00 daily business report — the twelve sections the owner specified. Every figure is a database
 * query; the Managing Director only adds the narrative. Estimates are labelled as estimates.
 */
export async function buildDailyBriefing(now = new Date()): Promise<{ data: ReportData; period: Period }> {
  const today = dayPeriod(now);
  const last24 = new Date(now.getTime() - 24 * 3600_000);
  const QUALIFIED = ["qualified", "meeting_scheduled", "proposal_sent", "negotiation"] as const;
  const [newLeads, qualified, enquiries, won, finToday, recv, target, projectsDone, projectsActive, published, scheduledPosts, activeCampaigns, outreach, opps, problems, pendingApprovals, doneToday, spend] = await Promise.all([
    db.select({ company: leads.companyName, industry: leads.industry, score: leads.score, priority: leads.priority, source: leads.source, value: leads.estimatedValueMinor, location: leads.location }).from(leads).where(gte(leads.createdAt, last24)).orderBy(desc(leads.score)).limit(40),
    db.select({ company: leads.companyName, stage: leads.stage, value: leads.estimatedValueMinor }).from(leads).where(and(inArray(leads.stage, [...QUALIFIED]), gte(leads.stageChangedAt, last24))).limit(40),
    db.select({ company: leads.companyName, source: leads.source, problem: leads.problemIdentified }).from(leads).where(and(gte(leads.createdAt, last24), inArray(leads.source, ["website_form", "whatsapp", "social", "referral"]))).limit(30),
    db.select({ company: leads.companyName, value: leads.estimatedValueMinor }).from(leads).where(and(eq(leads.stage, "won"), gte(leads.stageChangedAt, last24))),
    financeSummary(today),
    receivables(now),
    targetStatus("month", now),
    db.select({ name: projects.name }).from(projects).where(and(eq(projects.status, "completed"), gte(projects.updatedAt, last24))),
    db.select({ name: projects.name, status: projects.status }).from(projects).where(inArray(projects.status, ["planning", "active", "in_review"])).limit(30),
    db.select({ title: contentItems.title, platform: contentItems.platform, metrics: contentItems.metrics, metricsSource: contentItems.metricsSource }).from(contentItems).where(and(eq(contentItems.status, "published"), gte(contentItems.publishedAt, last24))),
    db.select({ n: sql<number>`count(*)::int` }).from(contentItems).where(inArray(contentItems.status, ["scheduled", "approved", "awaiting_approval"])),
    db.select({ name: campaigns.name, status: campaigns.status }).from(campaigns).where(inArray(campaigns.status, ["active", "awaiting_approval"])),
    db.select({ n: sql<number>`count(*)::int` }).from(interactions).where(and(eq(interactions.direction, "outbound"), gte(interactions.occurredAt, last24))),
    db.select({ title: intelItems.title, category: intelItems.category, confidence: intelItems.confidence, rec: intelItems.recommendation, priority: intelItems.priority }).from(intelItems)
      .where(and(gte(intelItems.createdAt, last24), inArray(intelItems.category, ["business_opportunity", "revenue_opportunity", "potential_client", "marketing_recommendation"]))).limit(20),
    operationalProblems(last24),
    db.select({ n: sql<number>`count(*)::int` }).from(approvals).where(eq(approvals.status, "pending")),
    tasksCompletedIn(today),
    db.select({ s: sql<number>`coalesce(sum(${agentRuns.costUsd}),0)::float` }).from(agentRuns).where(gte(agentRuns.startedAt, last24)),
  ]);

  const tomorrow: string[] = [];
  if (pendingApprovals[0].n) tomorrow.push(`Review ${pendingApprovals[0].n} pending approval(s) — outreach and publishing wait on them.`);
  const hot = newLeads.filter((l) => l.priority === "hot");
  if (hot.length) tomorrow.push(`Contact ${hot.length} hot lead(s) first: ${hot.slice(0, 5).map((l) => l.company).join(", ")}.`);
  if (target.configured && !target.onTrack) tomorrow.push(`Revenue is behind pace (${pct(target.pctAchieved)} of target, ${pct(target.period.elapsedPct, 0)} of the month gone)${target.dealsRequired !== null ? ` — about ${target.dealsRequired} more deal(s) needed at the average deal size` : ""}.`);
  if (!target.configured) tomorrow.push("Set this month's revenue target in Settings so progress can be tracked.");
  if (recv.overdueCount) tomorrow.push(`Chase ${recv.overdueCount} overdue invoice(s) totalling ${m(recv.overdueMinor)}.`);
  if (!newLeads.length) tomorrow.push("No new leads in 24h — check the 08:00 prospecting assignment ran and the Sales agent has budget.");
  for (const o of opps.filter((o) => o.priority === "high").slice(0, 3)) tomorrow.push(`Act on opportunity: ${o.title}${o.rec ? ` — ${o.rec}` : ""}`);

  const sections: Section[] = [
    { kind: "table", title: "1. New leads generated", columns: ["Company", "Industry", "Location", "Score", "Priority", "Source", "Est. value (estimate)"], rows: newLeads.map((l) => [l.company, l.industry ?? "—", l.location ?? "—", l.score, l.priority, l.source, l.value ? m(l.value) : "—"]), empty: "No new leads in the last 24h." },
    { kind: "list", title: "2. Qualified leads", items: qualified.map((q) => `${q.company} — ${STAGE_LABEL[q.stage] ?? q.stage}${q.value ? ` (est. ${m(q.value)})` : ""}`), empty: "No leads moved into a qualified stage in the last 24h." },
    { kind: "list", title: "3. New client enquiries", items: enquiries.map((e) => `${e.company} via ${e.source.replace("_", " ")}${e.problem ? ` — ${e.problem.slice(0, 120)}` : ""}`), empty: "No inbound enquiries in the last 24h." },
    { kind: "kv", title: "4. Sales closed", rows: [{ label: "Deals won (24h)", value: `${won.length}${won.length ? ` — ${won.map((w) => w.company).join(", ")}` : ""}` }] },
    { kind: "kv", title: "5. Revenue generated (recorded payments only)", rows: [
      { label: "Received today", value: m(finToday.incomeMinor) },
      { label: "Month to date", value: m(target.achievedMinor) },
      ...(target.configured ? [{ label: "Monthly target", value: `${m(target.target.revenueTargetMinor)} (${pct(target.pctAchieved)} achieved)` }] : []),
      { label: "Expenses today", value: m(finToday.expenseMinor) },
    ] },
    { kind: "kv", title: "6. Outstanding payments", rows: [
      { label: "Outstanding invoices", value: `${m(recv.totalOutstandingMinor)} across ${recv.count} invoice(s)` },
      { label: "Overdue", value: `${m(recv.overdueMinor)} across ${recv.overdueCount} invoice(s)` },
    ] },
    { kind: "list", title: "7. Projects completed", items: projectsDone.map((p) => p.name), empty: "No projects completed in the last 24h." },
    { kind: "list", title: "8. Projects in progress", items: projectsActive.map((p) => `${p.name} (${p.status.replace("_", " ")})`), empty: "No active projects." },
    { kind: "list", title: "9. Social media performance", items: [
      `${published.length} post(s) published in 24h · ${scheduledPosts[0].n} queued or awaiting approval`,
      ...published.map((p) => `${p.platform}: ${p.title}${p.metricsSource && Object.keys(p.metrics).length ? ` — ${Object.entries(p.metrics).map(([k, v]) => `${k} ${v}`).join(", ")} (source: ${p.metricsSource})` : " — no platform metrics connected"}`),
    ] },
    { kind: "list", title: "10. Marketing activities", items: [
      `${outreach[0].n} outbound message(s) recorded in 24h`,
      ...activeCampaigns.map((c) => `Campaign: ${c.name} (${c.status.replace("_", " ")})`),
      ...opps.map((o) => `Opportunity: ${o.title} (${o.priority} priority, ${o.confidence})`),
      `${doneToday.length} agent task(s) completed today`,
    ] },
    { kind: "list", title: "11. Operational challenges", items: problems, empty: "No operational problems detected." },
    { kind: "list", title: "12. Recommendations for tomorrow", items: tomorrow, empty: "No urgent items flagged by the system." },
    { kind: "kv", title: "AI workforce cost (24h)", rows: [{ label: "Estimated model + search spend", value: `$${spend[0].s.toFixed(2)}` }] },
  ];
  return { data: { sections, generatedAt: now.toISOString() }, period: { start: today.start, end: today.end, label: today.label } };
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
  daily_briefing: "Daily Business Report", daily_finance: "Daily Financial Report", weekly_business: "Weekly Business Performance",
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

