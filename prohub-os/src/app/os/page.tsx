import Link from "next/link";
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { transactions, clients, leads, projects, tasks, approvals, reports, activityLog, invoices } from "@/db/schema";
import { financeSummary, receivables, pipelineSummary, conversionStats, targetStatus } from "@/services/finance";
import { monthPeriod } from "@/lib/time";
import { formatMoney, pct } from "@/lib/money";
import { PageHeader, Panel, Stat, Progress, StatusBadge, Empty, Badge, InfoNote } from "@/components/ui";
import { BarChart, HBar } from "@/components/charts";
import { AutoRefresh, SubmitButton } from "@/components/client";
import { runCycleNowAction } from "./actions";
import { STAGE_LABEL } from "@/services/scoring";
import { timeAgo } from "@/lib/utils";
import type { ReportData } from "@/services/reports";

export const metadata = { title: "Executive overview" };

export default async function Overview({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const month = monthPeriod();
  const [allTime] = await db.select({ v: sql<string>`coalesce(sum(case when type='income' then amount_base_minor when type='refund' then -amount_base_minor else 0 end),0)` }).from(transactions);
  const [fin, recv, pipe, conv, target] = await Promise.all([financeSummary(month), receivables(), pipelineSummary(), conversionStats(month), targetStatus("month")]);
  const [[activeProjects], [pendingTasks], [newClients], [wonValue], [invoicedMonth]] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(projects).where(inArray(projects.status, ["planning", "active", "in_review"])),
    db.select({ n: sql<number>`count(*)::int` }).from(tasks).where(inArray(tasks.status, ["proposed", "approved", "queued", "in_progress", "awaiting_subtasks", "awaiting_approval"])),
    db.select({ n: sql<number>`count(*)::int` }).from(clients).where(gte(clients.createdAt, month.start)),
    db.select({ n: sql<number>`count(*)::int`, v: sql<string>`coalesce(sum(estimated_value_minor),0)` }).from(leads).where(and(eq(leads.stage, "won"), gte(leads.stageChangedAt, month.start))),
    db.select({ n: sql<number>`count(*)::int`, v: sql<string>`coalesce(sum(total_minor),0)` }).from(invoices).where(and(inArray(invoices.status, ["sent", "partially_paid", "paid"]), gte(invoices.issueDate, month.start.toISOString().slice(0, 10)))),
  ]);
  const monthsBack = await Promise.all(Array.from({ length: 6 }, (_, i) => financeSummary(monthPeriod(new Date(), i - 5))));
  const pendingApprovals = await db.select().from(approvals).where(eq(approvals.status, "pending")).orderBy(desc(approvals.createdAt)).limit(5);
  const [briefing] = await db.select().from(reports).where(eq(reports.kind, "daily_briefing")).orderBy(desc(reports.createdAt)).limit(1);
  const recent = await db.select().from(activityLog).where(sql`${activityLog.action} not like 'tool.%'`).orderBy(desc(activityLog.createdAt)).limit(10);
  const running = await db.select({ id: tasks.id, title: tasks.title, agent: tasks.agentSlug, status: tasks.status }).from(tasks).where(inArray(tasks.status, ["queued", "in_progress", "awaiting_subtasks"])).orderBy(desc(tasks.updatedAt)).limit(6);

  const m = (v: number) => formatMoney(v, "NGN", { compact: true });
  const briefingItems = briefing ? ((briefing.data as unknown as ReportData).sections ?? []).filter((s) => s.title.startsWith("9.") || s.title.startsWith("10.") || s.title.startsWith("8.")) : [];

  return (
    <>
      <PageHeader title="Executive overview" subtitle={`${month.label} · all figures from recorded transactions; pipeline shown separately as estimates`}
        actions={<><AutoRefresh active={running.length > 0} />
          <form action={runCycleNowAction}><input type="hidden" name="type" value="cycle.morning" /><SubmitButton variant="secondary" size="sm">Run morning cycle</SubmitButton></form>
          <form action={runCycleNowAction}><input type="hidden" name="type" value="cycle.evening" /><SubmitButton variant="secondary" size="sm">Run evening review</SubmitButton></form></>} />
      {sp.ok && <div className="mb-4"><InfoNote>{sp.ok}</InfoNote></div>}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Total revenue" value={m(Number(allTime.v))} sub="All-time, net of refunds" href="/os/finance" />
        <Stat label="Revenue this month" value={m(fin.incomeMinor - fin.refundMinor)} sub={target.configured ? `${pct(target.pctAchieved, 0)} of target` : "No target set"} tone={target.configured ? (target.onTrack ? "ok" : "warn") : undefined} href="/os/finance" />
        <Stat label="Sales generated" value={wonValue.n} sub={`deals won · ${m(Number(invoicedMonth.v))} invoiced`} href="/os/crm" />
        <Stat label="New clients" value={newClients.n} sub="this month" href="/os/crm?tab=clients" />
        <Stat label="New leads" value={conv.leadsCreated} sub="this month" href="/os/crm" />
        <Stat label="Conversion rate" value={pct(conv.winRatePct, 0)} sub={`${conv.won} won · ${conv.lost} lost (decided this month)`} />
        <Stat label="Outstanding invoices" value={m(recv.totalOutstandingMinor)} sub={recv.overdueCount ? `${m(recv.overdueMinor)} overdue` : `${recv.count} open`} tone={recv.overdueCount ? "bad" : undefined} href="/os/finance?tab=invoices" />
        <Stat label="Active projects" value={activeProjects.n} href="/os/projects" />
        <Stat label="Pending tasks" value={pendingTasks.n} href="/os/tasks" />
        <Stat label="Profitability" value={pct(fin.marginPct, 0)} sub={`net ${m(fin.netMinor)} this month`} tone={fin.netMinor < 0 ? "bad" : undefined} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Revenue target" className="lg:col-span-1">
          {target.configured ? (
            <div className="space-y-3">
              <div className="flex items-baseline justify-between"><span className="num text-[22px] font-semibold">{m(target.achievedMinor)}</span><span className="text-fg-2">of {m(target.target.revenueTargetMinor)}</span></div>
              <Progress value={target.pctAchieved} tone={target.onTrack ? "ok" : "warn"} />
              <div className="text-[12px] text-fg-3">{pct(target.period.elapsedPct, 0)} of the month elapsed · {target.onTrack ? "on pace" : "behind pace"}</div>
              <dl className="grid grid-cols-2 gap-2 text-[12.5px]">
                <div><dt className="text-fg-3">Remaining</dt><dd className="num">{m(target.remainingMinor)}</dd></div>
                <div><dt className="text-fg-3">Deals required</dt><dd className="num">{target.dealsRequired ?? "Set avg deal value"}</dd></div>
                <div><dt className="text-fg-3">Weighted pipeline</dt><dd className="num">{m(target.pipeline.weightedValueMinor)}</dd></div>
                <div><dt className="text-fg-3">Pipeline coverage</dt><dd className="num">{target.pipelineCoverage !== null ? `${target.pipelineCoverage.toFixed(1)}×` : "—"}</dd></div>
                <div><dt className="text-fg-3">Qualified opportunities</dt><dd className="num">{target.pipeline.qualifiedCount}</dd></div>
                <div><dt className="text-fg-3">Opportunities needed</dt><dd className="num">{target.opportunitiesNeeded ?? "—"}</dd></div>
              </dl>
            </div>
          ) : <Empty title="No revenue target for this month">Set monthly targets in <Link className="text-accent" href="/os/settings">Settings</Link> so the Managing Director can track pace and act when behind.</Empty>}
        </Panel>
        <Panel title="Recorded revenue vs expenses — 6 months" className="lg:col-span-2">
          <BarChart data={monthsBack.map((f) => ({ label: f.period.label.split(" ")[0].slice(0, 3), value: f.incomeMinor, secondary: f.expenseMinor }))} format={(v) => formatMoney(v)} />
          <div className="mt-2 flex gap-4 text-[11.5px] text-fg-3"><span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-accent" />Income</span><span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-line-strong" />Expenses</span></div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Pipeline (estimates, not revenue)">
          <HBar rows={pipe.byStage.filter((s) => s.stage !== "lost").map((s) => ({ label: `${STAGE_LABEL[s.stage]} · ${s.count}`, value: s.valueMinor }))} format={(v) => m(v)} />
          <div className="mt-3 text-[12px] text-fg-3">Open: {pipe.openCount} leads · {m(pipe.openValueMinor)} unweighted · {m(pipe.weightedValueMinor)} weighted</div>
        </Panel>
        <Panel title="Awaiting your approval" actions={<Link href="/os/approvals" className="text-[12px] text-accent">All</Link>}>
          {pendingApprovals.length ? <ul className="space-y-2">{pendingApprovals.map((a) => (
            <li key={a.id}><Link href={`/os/approvals?focus=${a.id}`} className="block hover:text-accent"><div className="flex items-center gap-2"><Badge tone={a.level === 3 ? "bad" : "warn"}>L{a.level}</Badge><span className="truncate font-medium">{a.title}</span></div><div className="mt-0.5 truncate text-[12px] text-fg-3">{a.agentSlug} · {timeAgo(a.createdAt)}</div></Link></li>
          ))}</ul> : <div className="text-fg-3">Nothing waiting.</div>}
        </Panel>
        <Panel title="Workforce now" actions={<Link href="/os/tasks" className="text-[12px] text-accent">Tasks</Link>}>
          {running.length ? <ul className="space-y-2">{running.map((t) => (
            <li key={t.id}><Link href={`/os/tasks/${t.id}`} className="flex items-center justify-between gap-2 hover:text-accent"><span className="truncate">{t.title}</span><StatusBadge status={t.status} /></Link><div className="text-[12px] text-fg-3">{t.agent}</div></li>
          ))}</ul> : <div className="text-fg-3">No agents running. Issue a command or wait for the next scheduled cycle.</div>}
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Latest executive briefing" actions={briefing && <Link href={`/os/reports/${briefing.id}`} className="text-[12px] text-accent">Open</Link>}>
          {briefing ? (
            <div className="space-y-3">
              <div className="text-[12px] text-fg-3">{briefing.title} · {timeAgo(briefing.createdAt)}</div>
              {briefing.narrative && <p className="line-clamp-4 text-fg-2">{briefing.narrative.replace(/[#*]/g, "")}</p>}
              {briefingItems.map((s) => s.kind === "list" && (
                <div key={s.title}><div className="text-[12px] font-semibold text-fg-2">{s.title}</div><ul className="mt-1 list-disc pl-4 text-[12.5px]">{(s.items.length ? s.items : [s.empty ?? "—"]).slice(0, 4).map((i) => <li key={i}>{i}</li>)}</ul></div>
              ))}
            </div>
          ) : <Empty title="No briefing yet">The evening review generates it daily at 18:00, or run it now from the button above.</Empty>}
        </Panel>
        <Panel title="Recent activity" actions={<Link href="/os/activity" className="text-[12px] text-accent">Activity log</Link>}>
          <ul className="space-y-1.5 text-[12.5px]">{recent.map((r) => (
            <li key={r.id} className="flex justify-between gap-3"><span className="truncate"><span className="text-fg-3">{r.actorType}:{r.actorId.slice(0, 18)}</span> {r.action}</span><span className="shrink-0 text-fg-3">{timeAgo(r.createdAt)}</span></li>
          ))}</ul>
        </Panel>
      </div>
    </>
  );
}
