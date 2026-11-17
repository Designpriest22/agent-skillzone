import { z } from "zod";
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { tasks, agents, deliverables, approvals, followUps, projects, intelItems, leads } from "@/db/schema";
import { defineTool, ToolError } from "./types";
import { createTask, approveTask, rejectTask, childResults } from "@/orchestrator/tasks";
import { financeSummary, receivables, pipelineSummary, targetStatus, conversionStats, campaignRoi, topClientsByLtv } from "@/services/finance";
import { dayPeriod, weekPeriod, monthPeriod, parseMonth, quarterPeriod } from "@/lib/time";
import { formatMoney } from "@/lib/money";

export const delegateTask = defineTool({
  name: "delegate_task",
  description:
    "Assign work to a specialised agent. The task is approved immediately (you hold internal approval authority) and runs when its depends_on tasks complete. " +
    "Write self-contained instructions: objective, scope, quantities, constraints, the commercial goal, and what records to produce. " +
    "After delegating everything you need, call await_subtasks.",
  governance: "autonomous",
  schema: z.object({
    agent: z.string().describe("Agent slug, e.g. research, sales-marketing, copywriting"),
    title: z.string().min(5),
    instructions: z.string().min(40),
    priority: z.number().int().min(1).max(5).default(3),
    depends_on: z.array(z.string().uuid()).default([]).describe("Task IDs (from earlier delegate_task calls) whose results this task needs"),
    lead_id: z.string().uuid().optional(),
    project_id: z.string().uuid().optional(),
    client_id: z.string().uuid().optional(),
    due_in_hours: z.number().positive().optional(),
  }),
  async run(input, ctx) {
    const [target] = await db.select().from(agents).where(eq(agents.slug, input.agent));
    if (!target) {
      const all = await db.select({ slug: agents.slug }).from(agents);
      throw new ToolError(`Unknown agent "${input.agent}". Available: ${all.map((a) => a.slug).join(", ")}`);
    }
    if (target.status !== "active") throw new ToolError(`${target.name} is ${target.status}. Choose another agent or report the gap.`);
    try {
      const t = await createTask({
        title: input.title, instructions: input.instructions, agentSlug: input.agent, createdBy: `agent:${ctx.agentSlug}`,
        status: "approved", priority: input.priority, parentTaskId: ctx.taskId, dependsOn: input.depends_on,
        leadId: input.lead_id, projectId: input.project_id, clientId: input.client_id,
        dueAt: input.due_in_hours ? new Date(Date.now() + input.due_in_hours * 3600_000) : null,
      });
      ctx.produced.push({ type: "task", id: t.id });
      const [fresh] = await db.select({ status: tasks.status }).from(tasks).where(eq(tasks.id, t.id));
      return { task_id: t.id, agent: input.agent, status: fresh?.status ?? t.status };
    } catch (e) {
      throw new ToolError(e instanceof Error ? e.message : String(e));
    }
  },
});

export const listTasks = defineTool({
  name: "list_tasks",
  description: "List tasks across the workforce, filtered by status and/or agent. Use to review outstanding work, bottlenecks and failures.",
  governance: "autonomous",
  schema: z.object({
    statuses: z.array(z.enum(["proposed", "approved", "queued", "in_progress", "awaiting_subtasks", "awaiting_approval", "completed", "failed", "rejected", "cancelled"])).optional(),
    agent: z.string().optional(),
    since_hours: z.number().positive().optional(),
    limit: z.number().int().max(50).default(25),
  }),
  async run(input) {
    const conds = [];
    if (input.statuses?.length) conds.push(inArray(tasks.status, input.statuses));
    if (input.agent) conds.push(eq(tasks.agentSlug, input.agent));
    if (input.since_hours) conds.push(gte(tasks.updatedAt, new Date(Date.now() - input.since_hours * 3600_000)));
    return db.select({ id: tasks.id, title: tasks.title, agent: tasks.agentSlug, status: tasks.status, priority: tasks.priority, createdBy: tasks.createdBy, result: tasks.resultSummary, error: tasks.error, updatedAt: tasks.updatedAt })
      .from(tasks).where(conds.length ? and(...conds) : undefined).orderBy(desc(tasks.updatedAt)).limit(input.limit);
  },
});

export const getSubtaskResults = defineTool({
  name: "get_subtask_results",
  description: "Get the status, verified outputs and summaries of the subtasks you delegated in this task.",
  governance: "autonomous",
  schema: z.object({}),
  async run(_i, ctx) {
    return childResults(ctx.taskId);
  },
});

export const reviewProposedTask = defineTool({
  name: "review_proposed_task",
  description: "Approve or reject a task another agent proposed. Approve when it serves a current objective and isn't duplicate work; reject with a reason otherwise.",
  governance: "autonomous",
  schema: z.object({ task_id: z.string().uuid(), decision: z.enum(["approve", "reject"]), reason: z.string().min(5) }),
  async run(input, ctx) {
    try {
      if (input.decision === "approve") await approveTask(input.task_id, `agent:${ctx.agentSlug}`);
      else await rejectTask(input.task_id, `agent:${ctx.agentSlug}`, input.reason);
    } catch (e) {
      throw new ToolError(e instanceof Error ? e.message : String(e));
    }
    ctx.produced.push({ type: "task", id: input.task_id });
    return { task_id: input.task_id, decision: input.decision };
  },
});

export const reviewDeliverable = defineTool({
  name: "review_deliverable",
  description: "Quality-review a deliverable produced by an agent. approve → status approved (ready for client/publishing); request_changes → creates a revision task for the author with your notes.",
  governance: "autonomous",
  schema: z.object({ deliverable_id: z.string().uuid(), decision: z.enum(["approve", "request_changes", "reject"]), notes: z.string().min(10) }),
  async run(input, ctx) {
    const [d] = await db.select().from(deliverables).where(eq(deliverables.id, input.deliverable_id));
    if (!d) throw new ToolError("Deliverable not found");
    const status = input.decision === "approve" ? "approved" : input.decision === "reject" ? "rejected" : "changes_requested";
    await db.update(deliverables).set({ status, reviewNotes: input.notes, updatedAt: new Date() }).where(eq(deliverables.id, d.id));
    let revisionTaskId: string | undefined;
    if (input.decision === "request_changes") {
      const t = await createTask({
        title: `Revise: ${d.title}`, agentSlug: d.agentSlug, createdBy: `agent:${ctx.agentSlug}`, status: "approved", priority: 2,
        parentTaskId: ctx.taskId, kind: "review",
        instructions: `Revise deliverable ${d.id} ("${d.title}"). Review notes:\n${input.notes}\n\nRead it with read_record, then save_deliverable with revises_deliverable_id=${d.id}.`,
      });
      revisionTaskId = t.id;
      ctx.produced.push({ type: "task", id: t.id });
    }
    ctx.produced.push({ type: "deliverable", id: d.id });
    return { deliverable_id: d.id, status, revision_task_id: revisionTaskId };
  },
});

export const agentWorkload = defineTool({
  name: "agent_workload",
  description: "Per-agent operational metrics: open/completed/failed tasks (7 days), last activity, spend today. Use to answer 'which agent has the most outstanding tasks' and find bottlenecks.",
  governance: "autonomous",
  schema: z.object({}),
  async run() {
    const rows = await db.execute(sql`
      SELECT a.slug, a.name, a.status, a.last_active_at,
        count(t.*) FILTER (WHERE t.status IN ('proposed','approved','queued','in_progress','awaiting_subtasks','awaiting_approval'))::int AS open,
        count(t.*) FILTER (WHERE t.status = 'completed' AND t.completed_at > now() - interval '7 days')::int AS completed_7d,
        count(t.*) FILTER (WHERE t.status = 'failed' AND t.completed_at > now() - interval '7 days')::int AS failed_7d,
        coalesce((SELECT round(sum(r.cost_usd)::numeric, 2) FROM agent_runs r WHERE r.agent_slug = a.slug AND r.started_at > date_trunc('day', now())), 0) AS spend_today_usd
      FROM agents a LEFT JOIN tasks t ON t.agent_slug = a.slug
      GROUP BY a.slug ORDER BY open DESC`);
    return rows;
  },
});

const periodSchema = z.object({
  period: z.enum(["today", "yesterday", "this_week", "last_week", "this_month", "last_month", "this_quarter", "named_month"]).default("this_month"),
  month: z.string().optional().describe("For named_month: 'October', 'October 2026' or '2026-10'"),
});

function resolvePeriod(p: z.infer<typeof periodSchema>) {
  switch (p.period) {
    case "today": return dayPeriod();
    case "yesterday": return dayPeriod(new Date(), -1);
    case "this_week": return weekPeriod();
    case "last_week": return weekPeriod(new Date(), -1);
    case "last_month": return monthPeriod(new Date(), -1);
    case "this_quarter": return quarterPeriod();
    case "named_month": {
      const m = p.month ? parseMonth(p.month) : null;
      if (!m) throw new ToolError("Provide month like 'October' or '2026-10'");
      return m;
    }
    default: return monthPeriod();
  }
}

export const financeReport = defineTool({
  name: "finance_report",
  description: "Recorded financial results for a period: income, expenses, net profit, revenue by service and client, expense categories. Figures come only from recorded transactions.",
  governance: "autonomous",
  schema: periodSchema,
  async run(input) {
    const s = await financeSummary(resolvePeriod(input));
    const f = (m: number) => formatMoney(m);
    return {
      ...s,
      formatted: { income: f(s.incomeMinor), expenses: f(s.expenseMinor), net: f(s.netMinor) },
      note: s.transactionCount === 0 ? "No transactions recorded in this period. Do not infer revenue from leads or proposals." : undefined,
    };
  },
});

export const salesMetrics = defineTool({
  name: "sales_metrics",
  description: "Pipeline (unweighted & probability-weighted — estimates, not revenue), conversion stats, receivables, campaign ROI and top clients by lifetime value.",
  governance: "autonomous",
  schema: periodSchema,
  async run(input) {
    const period = resolvePeriod(input);
    const [pipeline, conversion, recv, roi, ltv] = await Promise.all([pipelineSummary(), conversionStats(period), receivables(), campaignRoi(), topClientsByLtv(5)]);
    return { period: period.label, pipeline, conversion, receivables: { ...recv, invoices: recv.invoices.slice(0, 15) }, campaign_roi: roi.slice(0, 10), top_clients_ltv: ltv };
  },
});

export const revenueTargetStatus = defineTool({
  name: "revenue_target_status",
  description: "Progress against the owner's revenue target: achieved vs target, % of target, pace, deals required, opportunities needed, pipeline coverage. If below target, investigate causes.",
  governance: "autonomous",
  schema: z.object({ period_type: z.enum(["month", "quarter"]).default("month") }),
  async run(input) {
    return targetStatus(input.period_type);
  },
});

export const operationsSnapshot = defineTool({
  name: "operations_snapshot",
  description: "Operational health: pending approvals, overdue follow-ups, failed tasks (48h), active projects with deadlines, new intel (24h), new leads (24h).",
  governance: "autonomous",
  schema: z.object({}),
  async run() {
    const since48 = new Date(Date.now() - 48 * 3600_000);
    const since24 = new Date(Date.now() - 24 * 3600_000);
    const [pendingApprovals, overdue, failed, active, intel, newLeads] = await Promise.all([
      db.select({ id: approvals.id, title: approvals.title, level: approvals.level, createdAt: approvals.createdAt }).from(approvals).where(eq(approvals.status, "pending")).limit(20),
      db.select({ id: followUps.id, reason: followUps.reason, dueAt: followUps.dueAt, agent: followUps.agentSlug, leadId: followUps.leadId }).from(followUps).where(and(eq(followUps.status, "open"), sql`${followUps.dueAt} < now()`)).limit(20),
      db.select({ id: tasks.id, title: tasks.title, agent: tasks.agentSlug, error: tasks.error }).from(tasks).where(and(eq(tasks.status, "failed"), gte(tasks.updatedAt, since48))).limit(20),
      db.select({ id: projects.id, name: projects.name, status: projects.status, deadline: projects.deadline, progress: projects.progressPct }).from(projects).where(inArray(projects.status, ["planning", "active", "in_review"])).limit(30),
      db.select({ id: intelItems.id, title: intelItems.title, category: intelItems.category, confidence: intelItems.confidence }).from(intelItems).where(gte(intelItems.createdAt, since24)).limit(30),
      db.select({ id: leads.id, company: leads.companyName, score: leads.score, priority: leads.priority, source: leads.source }).from(leads).where(gte(leads.createdAt, since24)).limit(50),
    ]);
    return { pending_approvals: pendingApprovals, overdue_follow_ups: overdue, failed_tasks_48h: failed, active_projects: active, new_intel_24h: intel, new_leads_24h: newLeads };
  },
});

export const writeReportNarrative = defineTool({
  name: "write_report_narrative",
  description: "Attach your executive narrative (analysis, recommended actions, priorities) to a system-generated report. The report's numbers are computed by the system — reference them, never alter or add figures.",
  governance: "autonomous",
  schema: z.object({ report_id: z.string().uuid(), narrative_markdown: z.string().min(80) }),
  async run(input, ctx) {
    const { reports } = await import("@/db/schema");
    const [r] = await db.update(reports).set({ narrative: input.narrative_markdown }).where(eq(reports.id, input.report_id)).returning({ id: reports.id });
    if (!r) throw new ToolError("Report not found");
    ctx.produced.push({ type: "report", id: r.id });
    return { report_id: r.id };
  },
});

export const readReport = defineTool({
  name: "read_report",
  description: "Read a generated report's computed data (sections) by ID, or the latest of a kind.",
  governance: "autonomous",
  schema: z.object({ report_id: z.string().uuid().optional(), kind: z.enum(["daily_briefing", "daily_finance", "weekly_business", "monthly_finance", "social_weekly", "social_monthly"]).optional() }),
  async run(input) {
    const { reports } = await import("@/db/schema");
    const [r] = input.report_id
      ? await db.select().from(reports).where(eq(reports.id, input.report_id))
      : await db.select().from(reports).where(input.kind ? eq(reports.kind, input.kind) : undefined).orderBy(desc(reports.createdAt)).limit(1);
    if (!r) throw new ToolError("No such report");
    return r;
  },
});
