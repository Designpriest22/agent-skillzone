/**
 * Business snapshot — the revenue-intelligence numbers in one place, computed from the ledger, invoices
 * and CRM. Used by the Claude connector and the overview. Every figure is labelled with what it is:
 * actual revenue (recorded payments), outstanding invoices, expenses, and pipeline *estimates*.
 */
import { and, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { approvals, clients, interactions, leads, projects, transactions } from "@/db/schema";
import { financeSummary, receivables, pipelineSummary, conversionStats, targetStatus } from "./finance";
import { monthPeriod } from "@/lib/time";
import { formatMoney, pct } from "@/lib/money";

export async function businessSnapshot(now = new Date()) {
  const month = monthPeriod(now);
  const inMonth = (col: Parameters<typeof gte>[0]) => and(gte(col, month.start), lt(col, month.end));
  const [fin, recv, pipe, conv, target, mktSpend, outreach, responses, activeClients, newClients, activeProjects, pendingApprovals, repeat, sources] = await Promise.all([
    financeSummary(month),
    receivables(now),
    pipelineSummary(),
    conversionStats(month),
    targetStatus("month", now),
    db.select({ total: sql<string>`coalesce(sum(${transactions.amountBaseMinor}),0)` }).from(transactions)
      .where(and(eq(transactions.type, "expense"), inArray(transactions.category, ["ads", "marketing"]), inMonth(transactions.occurredAt))),
    db.select({ n: sql<number>`count(*)::int` }).from(interactions).where(and(eq(interactions.direction, "outbound"), inMonth(interactions.occurredAt))),
    db.select({ n: sql<number>`count(*)::int` }).from(interactions).where(and(eq(interactions.direction, "inbound"), inMonth(interactions.occurredAt))),
    db.select({ n: sql<number>`count(*)::int` }).from(clients).where(eq(clients.status, "active")),
    db.select({ n: sql<number>`count(*)::int` }).from(clients).where(inMonth(clients.createdAt)),
    db.select({ n: sql<number>`count(*)::int` }).from(projects).where(inArray(projects.status, ["planning", "active", "in_review"])),
    db.select({ n: sql<number>`count(*)::int` }).from(approvals).where(eq(approvals.status, "pending")),
    db.execute(sql`SELECT count(*)::int AS n FROM (SELECT client_id FROM transactions WHERE type = 'income' AND client_id IS NOT NULL GROUP BY client_id HAVING count(*) > 1) x`),
    db.select({ source: leads.source, n: sql<number>`count(*)::int` }).from(leads).where(inMonth(leads.createdAt)).groupBy(leads.source),
  ]);
  const spend = Number(mktSpend[0].total);
  const leadsMonth = conv.leadsCreated;
  return {
    asOf: now.toISOString(),
    period: month.label,
    currency: "NGN",
    revenue: {
      actualThisMonthMinor: fin.incomeMinor,
      expensesThisMonthMinor: fin.expenseMinor,
      netProfitThisMonthMinor: fin.netMinor,
      marginPct: fin.marginPct,
      note: "Actual revenue = payments recorded in the ledger (owner entries or verified Paystack webhooks). Leads, proposals and pipeline are never revenue.",
    },
    target: target.configured
      ? { configured: true, targetMinor: target.target.revenueTargetMinor, achievedPct: target.pctAchieved, onTrack: target.onTrack, remainingMinor: target.remainingMinor, dealsRequired: target.dealsRequired }
      : { configured: false },
    receivables: { outstandingMinor: recv.totalOutstandingMinor, outstandingInvoices: recv.count, overdueMinor: recv.overdueMinor, overdueInvoices: recv.overdueCount },
    pipeline: { openLeads: pipe.openCount, qualifiedLeads: pipe.qualifiedCount, openValueEstimateMinor: pipe.openValueMinor, weightedValueEstimateMinor: pipe.weightedValueMinor, byStage: pipe.byStage },
    acquisition: {
      leadsThisMonth: leadsMonth,
      leadSources: sources,
      outreachMessagesThisMonth: outreach[0].n,
      responsesThisMonth: responses[0].n,
      dealsWonThisMonth: conv.won,
      winRatePct: conv.winRatePct,
      newClientsThisMonth: newClients[0].n,
      activeClients: activeClients[0].n,
      repeatCustomers: (repeat as unknown as { n: number }[])[0]?.n ?? 0,
      marketingSpendThisMonthMinor: spend,
      costPerLeadMinor: leadsMonth ? Math.round(spend / leadsMonth) : null,
      customerAcquisitionCostMinor: newClients[0].n ? Math.round(spend / newClients[0].n) : null,
    },
    operations: { activeProjects: activeProjects[0].n, pendingApprovals: pendingApprovals[0].n },
  };
}

export function snapshotText(s: Awaited<ReturnType<typeof businessSnapshot>>) {
  const m = (v: number | null | undefined) => (v === null || v === undefined ? "—" : formatMoney(v));
  return [
    `Business snapshot — ${s.period} (as of ${s.asOf.slice(0, 16).replace("T", " ")} UTC)`,
    `Revenue (recorded payments): ${m(s.revenue.actualThisMonthMinor)} · Expenses: ${m(s.revenue.expensesThisMonthMinor)} · Net: ${m(s.revenue.netProfitThisMonthMinor)}`,
    s.target.configured ? `Target: ${m(s.target.targetMinor)} — ${pct(s.target.achievedPct ?? 0)} achieved, ${s.target.onTrack ? "on track" : "behind pace"}${s.target.dealsRequired !== null ? `, ~${s.target.dealsRequired} deal(s) still needed` : ""}` : "Target: not set",
    `Outstanding invoices: ${m(s.receivables.outstandingMinor)} (${s.receivables.outstandingInvoices}) · Overdue: ${m(s.receivables.overdueMinor)} (${s.receivables.overdueInvoices})`,
    `Pipeline (estimates, not revenue): ${s.pipeline.openLeads} open leads, ${s.pipeline.qualifiedLeads} qualified, est. value ${m(s.pipeline.openValueEstimateMinor)} (weighted ${m(s.pipeline.weightedValueEstimateMinor)})`,
    `This month: ${s.acquisition.leadsThisMonth} leads · ${s.acquisition.outreachMessagesThisMonth} outreach messages · ${s.acquisition.responsesThisMonth} responses · ${s.acquisition.dealsWonThisMonth} won · win rate ${s.acquisition.winRatePct === null ? "—" : pct(s.acquisition.winRatePct)}`,
    `Clients: ${s.acquisition.activeClients} active · ${s.acquisition.newClientsThisMonth} new · ${s.acquisition.repeatCustomers} repeat`,
    `Marketing spend: ${m(s.acquisition.marketingSpendThisMonthMinor)} · Cost per lead: ${m(s.acquisition.costPerLeadMinor)} · CAC: ${m(s.acquisition.customerAcquisitionCostMinor)}`,
    `Active projects: ${s.operations.activeProjects} · Pending approvals: ${s.operations.pendingApprovals}`,
  ].join("\n");
}
