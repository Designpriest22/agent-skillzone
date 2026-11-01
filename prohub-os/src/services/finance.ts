/**
 * Financial analytics. Every number here is derived from recorded transactions and invoices.
 * Leads, proposals and pipeline are reported separately and never counted as revenue.
 */
import { and, gte, lt, eq, sql, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { transactions, invoices, clients, leads, revenueTargets } from "@/db/schema";
import { STAGE_PROBABILITY } from "./scoring";
import { monthPeriod, quarterPeriod, type Period, isoDate } from "@/lib/time";

export type FinanceSummary = {
  period: { start: string; end: string; label: string };
  incomeMinor: number;
  expenseMinor: number;
  refundMinor: number;
  netMinor: number;
  marginPct: number | null;
  transactionCount: number;
  byService: { service: string; incomeMinor: number }[];
  byClient: { clientId: string | null; client: string; incomeMinor: number }[];
  expensesByCategory: { category: string; amountMinor: number }[];
};

export async function financeSummary(period: Period): Promise<FinanceSummary> {
  const inPeriod = and(gte(transactions.occurredAt, period.start), lt(transactions.occurredAt, period.end));
  const totals = await db
    .select({ type: transactions.type, total: sql<string>`coalesce(sum(${transactions.amountBaseMinor}),0)`, n: sql<number>`count(*)::int` })
    .from(transactions).where(inPeriod).groupBy(transactions.type);
  const get = (t: string) => Number(totals.find((r) => r.type === t)?.total ?? 0);
  const income = get("income");
  const expense = get("expense");
  const refund = get("refund");
  const net = income - refund - expense;

  const byService = await db
    .select({ service: sql<string>`coalesce(${transactions.serviceSlug}, 'unassigned')`, total: sql<string>`sum(${transactions.amountBaseMinor})` })
    .from(transactions).where(and(inPeriod, eq(transactions.type, "income")))
    .groupBy(sql`coalesce(${transactions.serviceSlug}, 'unassigned')`).orderBy(sql`2 desc`);

  const byClient = await db
    .select({ clientId: transactions.clientId, client: sql<string>`coalesce(${clients.name}, 'Unattributed')`, total: sql<string>`sum(${transactions.amountBaseMinor})` })
    .from(transactions).leftJoin(clients, eq(clients.id, transactions.clientId))
    .where(and(inPeriod, eq(transactions.type, "income")))
    .groupBy(transactions.clientId, clients.name).orderBy(sql`3 desc`).limit(20);

  const expCat = await db
    .select({ category: transactions.category, total: sql<string>`sum(${transactions.amountBaseMinor})` })
    .from(transactions).where(and(inPeriod, eq(transactions.type, "expense")))
    .groupBy(transactions.category).orderBy(sql`2 desc`);

  return {
    period: { start: period.start.toISOString(), end: period.end.toISOString(), label: period.label },
    incomeMinor: income,
    expenseMinor: expense,
    refundMinor: refund,
    netMinor: net,
    marginPct: income > 0 ? (net / income) * 100 : null,
    transactionCount: totals.reduce((a, r) => a + r.n, 0),
    byService: byService.map((r) => ({ service: r.service, incomeMinor: Number(r.total) })),
    byClient: byClient.map((r) => ({ clientId: r.clientId, client: r.client, incomeMinor: Number(r.total) })),
    expensesByCategory: expCat.map((r) => ({ category: r.category, amountMinor: Number(r.total) })),
  };
}

export async function receivables(asOf = new Date()) {
  const open = await db.select().from(invoices).where(inArray(invoices.status, ["sent", "partially_paid"]));
  const today = isoDate(asOf);
  const rows = open.map((i) => ({
    id: i.id, number: i.number, clientId: i.clientId, dueDate: i.dueDate,
    outstandingMinor: i.totalMinor - i.amountPaidMinor, overdue: i.dueDate < today,
  }));
  return {
    totalOutstandingMinor: rows.reduce((a, r) => a + r.outstandingMinor, 0),
    overdueMinor: rows.filter((r) => r.overdue).reduce((a, r) => a + r.outstandingMinor, 0),
    count: rows.length,
    overdueCount: rows.filter((r) => r.overdue).length,
    invoices: rows,
  };
}

export async function pipelineSummary() {
  const rows = await db
    .select({ stage: leads.stage, n: sql<number>`count(*)::int`, value: sql<string>`coalesce(sum(${leads.estimatedValueMinor}),0)` })
    .from(leads).groupBy(leads.stage);
  const open = rows.filter((r) => r.stage !== "won" && r.stage !== "lost");
  const qualifiedStages = ["interested", "meeting_scheduled", "proposal_sent", "negotiation"];
  return {
    byStage: rows.map((r) => ({ stage: r.stage, count: r.n, valueMinor: Number(r.value) })),
    openCount: open.reduce((a, r) => a + r.n, 0),
    openValueMinor: open.reduce((a, r) => a + Number(r.value), 0),
    weightedValueMinor: Math.round(open.reduce((a, r) => a + Number(r.value) * (STAGE_PROBABILITY[r.stage] ?? 0), 0)),
    qualifiedCount: rows.filter((r) => qualifiedStages.includes(r.stage)).reduce((a, r) => a + r.n, 0),
    wonCount: rows.find((r) => r.stage === "won")?.n ?? 0,
    lostCount: rows.find((r) => r.stage === "lost")?.n ?? 0,
  };
}

export async function conversionStats(period: Period) {
  const [created] = await db.select({ n: sql<number>`count(*)::int` }).from(leads)
    .where(and(gte(leads.createdAt, period.start), lt(leads.createdAt, period.end)));
  const [won] = await db.select({ n: sql<number>`count(*)::int` }).from(leads)
    .where(and(eq(leads.stage, "won"), gte(leads.stageChangedAt, period.start), lt(leads.stageChangedAt, period.end)));
  const [lost] = await db.select({ n: sql<number>`count(*)::int` }).from(leads)
    .where(and(eq(leads.stage, "lost"), gte(leads.stageChangedAt, period.start), lt(leads.stageChangedAt, period.end)));
  const [newClients] = await db.select({ n: sql<number>`count(*)::int` }).from(clients)
    .where(and(gte(clients.createdAt, period.start), lt(clients.createdAt, period.end)));
  const decided = won.n + lost.n;
  return {
    leadsCreated: created.n,
    won: won.n,
    lost: lost.n,
    newClients: newClients.n,
    /** Win rate of leads decided in the period. Null when nothing was decided. */
    winRatePct: decided > 0 ? (won.n / decided) * 100 : null,
  };
}

/** Revenue-target tracker: compares recorded income to the configured target and derives what is needed. */
export async function targetStatus(periodType: "month" | "quarter" = "month", now = new Date()) {
  const period = periodType === "month" ? monthPeriod(now) : quarterPeriod(now);
  const [target] = await db.select().from(revenueTargets)
    .where(and(eq(revenueTargets.periodType, periodType), eq(revenueTargets.periodStart, isoDate(new Date(period.start.getTime() + 12 * 3600_000)))));
  const fin = await financeSummary(period);
  const pipe = await pipelineSummary();
  const conv = await conversionStats(period);
  const achieved = fin.incomeMinor - fin.refundMinor;
  if (!target) {
    return { configured: false as const, period: { label: period.label }, achievedMinor: achieved, pipeline: pipe, conversion: conv };
  }
  const remaining = Math.max(0, target.revenueTargetMinor - achieved);
  const elapsed = Math.min(1, Math.max(0, (now.getTime() - period.start.getTime()) / (period.end.getTime() - period.start.getTime())));
  const pctAchieved = target.revenueTargetMinor > 0 ? (achieved / target.revenueTargetMinor) * 100 : 0;
  const dealsRequired = target.avgDealValueMinor && target.avgDealValueMinor > 0 ? Math.ceil(remaining / target.avgDealValueMinor) : null;
  const winRate = conv.winRatePct ?? target.conversionTargetPct ?? null;
  const opportunitiesNeeded = dealsRequired !== null && winRate ? Math.ceil(dealsRequired / (winRate / 100)) : null;
  const [mktSpend] = await db.select({ total: sql<string>`coalesce(sum(${transactions.amountBaseMinor}),0)` }).from(transactions)
    .where(and(eq(transactions.type, "expense"), inArray(transactions.category, ["ads", "marketing"]), gte(transactions.occurredAt, period.start), lt(transactions.occurredAt, period.end)));
  return {
    configured: true as const,
    period: { label: period.label, start: period.start.toISOString(), end: period.end.toISOString(), elapsedPct: elapsed * 100 },
    target,
    achievedMinor: achieved,
    remainingMinor: remaining,
    pctAchieved,
    /** Behind pace when achievement lags elapsed time by more than 10 points. */
    onTrack: pctAchieved + 10 >= elapsed * 100,
    dealsRequired,
    opportunitiesNeeded,
    pipeline: pipe,
    pipelineCoverage: remaining > 0 ? pipe.weightedValueMinor / remaining : null,
    conversion: conv,
    leadsVsTarget: target.leadTarget ? { actual: conv.leadsCreated, target: target.leadTarget } : null,
    newClientsVsTarget: target.newClientsTarget ? { actual: conv.newClients, target: target.newClientsTarget } : null,
    marketingSpendMinor: Number(mktSpend.total),
  };
}

/** Marketing ROI per campaign: attributed income (from clients whose lead came from the campaign) vs. recorded spend. */
export async function campaignRoi() {
  const rows = await db.execute(sql`
    SELECT c.id, c.name, c.status,
      coalesce((SELECT sum(t.amount_base_minor) FROM transactions t WHERE t.campaign_id = c.id AND t.type = 'expense'),0)::bigint AS spend,
      coalesce((SELECT count(*) FROM leads l WHERE l.campaign_id = c.id),0)::int AS leads,
      coalesce((SELECT count(*) FROM leads l WHERE l.campaign_id = c.id AND l.stage = 'won'),0)::int AS won,
      coalesce((SELECT sum(t.amount_base_minor) FROM transactions t JOIN clients cl ON cl.id = t.client_id JOIN leads l ON l.id = cl.lead_id
                WHERE l.campaign_id = c.id AND t.type = 'income'),0)::bigint AS revenue
    FROM campaigns c ORDER BY c.created_at DESC LIMIT 50`);
  return (rows as unknown as { id: string; name: string; status: string; spend: string; leads: number; won: number; revenue: string }[]).map((r) => {
    const spend = Number(r.spend), revenue = Number(r.revenue);
    return { id: r.id, name: r.name, status: r.status, spendMinor: spend, leads: r.leads, won: r.won, revenueMinor: revenue, roiPct: spend > 0 ? ((revenue - spend) / spend) * 100 : null };
  });
}

/** Client lifetime value from recorded income. */
export async function topClientsByLtv(limit = 10) {
  const rows = await db
    .select({ id: clients.id, name: clients.name, total: sql<string>`coalesce(sum(${transactions.amountBaseMinor}),0)` })
    .from(clients).leftJoin(transactions, and(eq(transactions.clientId, clients.id), eq(transactions.type, "income")))
    .groupBy(clients.id, clients.name).orderBy(sql`3 desc`).limit(limit);
  return rows.map((r) => ({ id: r.id, name: r.name, ltvMinor: Number(r.total) }));
}

export async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getUTCFullYear();
  const [r] = await db.select({ n: sql<number>`count(*)::int` }).from(invoices).where(sql`${invoices.number} like ${`PH-${year}-%`}`);
  return `PH-${year}-${String(r.n + 1).padStart(4, "0")}`;
}

