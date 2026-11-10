/**
 * Claude command centre — a remote MCP server (Streamable HTTP) that lets Claude (claude.ai, Claude Desktop,
 * Claude Code) operate Prohub AI as the signed-in user: issue instructions to the AI Managing Director,
 * follow progress, read the business, and decide Level-2 approvals.
 *
 * Stateless: a fresh server per HTTP request, bound to the user resolved from the API token. Every action
 * goes through the same services as the dashboard, so permissions, approvals and the audit log apply.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { agents, approvals, deliverables, invoices, leads, reports, interactions, LEAD_STAGES } from "@/db/schema";
import type { SessionUser } from "@/lib/auth";
import { submitCommand } from "@/orchestrator/commands";
import { commandStatus, recentCommands, resolveRef, shortRef, taskBoard, agentLabel } from "@/orchestrator/command-status";
import { decideApproval, requestChanges } from "@/governance/approvals";
import { ACTION_POLICY } from "@/governance/permissions";
import { businessSnapshot, snapshotText } from "@/services/snapshot";
import { generateReport, type ReportData, type Section } from "@/services/reports";
import { searchKnowledge } from "@/agents/memory";
import { AGENTS } from "@/agents/definitions";
import { listFileMeta } from "@/services/files";
import { logActivity } from "@/lib/audit";
import { env } from "@/lib/env";
import { formatMoney } from "@/lib/money";
import { errMessage, truncate } from "@/lib/utils";

const RANK = { viewer: 0, manager: 1, owner: 2 } as const;
const AGENT_SLUGS = AGENTS.map((a) => a.slug) as [string, ...string[]];

type ToolResult = { content: { type: "text"; text: string }[]; structuredContent?: Record<string, unknown>; isError?: boolean };
const ok = (text: string, data?: unknown): ToolResult => ({ content: [{ type: "text", text: data === undefined ? text : `${text}\n\n${JSON.stringify(data, null, 2)}` }] });
const fail = (text: string): ToolResult => ({ content: [{ type: "text", text }], isError: true });

function sectionText(sec: Section): string {
  if (sec.kind === "kv") return `## ${sec.title}\n${sec.rows.map((r) => `- ${r.label}: ${r.value}`).join("\n")}`;
  if (sec.kind === "list") return `## ${sec.title}\n${sec.items.length ? sec.items.map((i) => `- ${i}`).join("\n") : `_${sec.empty ?? "—"}_`}`;
  if (sec.kind === "table") return `## ${sec.title}\n${sec.rows.length ? [`| ${sec.columns.join(" | ")} |`, `|${sec.columns.map(() => "---").join("|")}|`, ...sec.rows.slice(0, 40).map((r) => `| ${r.join(" | ")} |`)].join("\n") : `_${sec.empty ?? "—"}_`}`;
  return `## ${sec.title}\n${sec.body}`;
}

async function formatStatus(id: string) {
  const s = await commandStatus(id);
  if (!s) return null;
  const lines = [
    `Instruction ${s.command.ref} — ${s.command.status} (channel: ${s.command.channel})`,
    `"${truncate(s.command.text, 300)}"`,
    `Tasks: ${s.counts.completed} completed · ${s.counts.pending} pending · ${s.counts.failed} failed · ${s.counts.awaiting_approval} awaiting approval`,
    ...s.tasks.map((t) => `${"  ".repeat(t.depth)}- [${t.bucket}] ${t.agentLabel}: ${t.title}${t.verified ? " (outputs verified)" : ""}${t.summary ? ` — ${truncate(t.summary, 240)}` : ""}`),
  ];
  if (s.pendingApprovals.length) lines.push("", "Awaiting the owner's approval:", ...s.pendingApprovals.map((a) => `- ${a.ref} ${a.title} (${ACTION_POLICY[a.actionType]?.label ?? a.actionType}, level ${a.level})`));
  if (s.command.response && s.command.status !== "executing") lines.push("", "Final report from the Managing Director:", s.command.response);
  lines.push("", `Dashboard: ${env.appUrl}/os/command?c=${s.command.id}`);
  return { text: lines.join("\n"), status: s };
}

export function buildMcpServer(user: SessionUser) {
  const server = new McpServer(
    { name: "prohub-ai", title: "Prohub AI — Business Operating System", version: "1.0.0" },
    {
      instructions:
        "Prohub AI is the AI workforce of Prohub Creative Solutions (a Nigerian creative and digital agency). " +
        "Use send_instruction for anything that needs work done (research, leads, campaigns, content, design, video, websites, proposals, invoices) — " +
        "the AI Managing Director plans it, delegates to specialist agents and returns a verified report. Then poll get_instruction_status until it is completed. " +
        "For questions about the business, prefer business_snapshot, task_board, pipeline and reports (instant, computed from the database). " +
        "Amounts are in Naira (NGN). Never present pipeline estimates as revenue. Approving an item executes a real external action (publishing, sending).",
    },
  );
  const canAct = RANK[user.role] >= RANK.manager;
  const audit = (action: string, details: Record<string, unknown> = {}) => logActivity({ type: "user", id: user.id }, `mcp.${action}`, null, details);

  server.registerTool("send_instruction", {
    title: "Send an instruction to the AI Managing Director",
    description: "Give Prohub AI a task in plain language (e.g. 'Find 10 businesses in Abuja that may need branding services', 'Create an Instagram campaign for our branding services'). The Managing Director breaks it down, assigns agents, verifies results and reports back. Optionally address one agent directly. Returns a reference; use get_instruction_status to follow it. wait_seconds (max 50) waits briefly for quick answers.",
    inputSchema: {
      instruction: z.string().min(3).max(8000),
      agent: z.enum(AGENT_SLUGS).optional().describe("Assign directly to one agent instead of the Managing Director"),
      wait_seconds: z.number().int().min(0).max(50).default(0),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
  }, async ({ instruction, agent, wait_seconds }) => {
    if (!canAct) return fail("Your role is view-only; ask the owner for manager access to issue instructions.");
    const { commandId } = await submitCommand(instruction, user.id, { agentSlug: agent, channel: "claude" });
    await audit("instruction", { commandId });
    const deadline = Date.now() + (wait_seconds ?? 0) * 1000;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 2500));
      const s = await commandStatus(commandId);
      if (s && ["completed", "failed", "cancelled"].includes(s.command.status)) break;
    }
    const st = await formatStatus(commandId);
    return ok(`Instruction received — reference ${shortRef(commandId)} (id ${commandId}). ${agent ? `Assigned to ${agentLabel(agent)}.` : "The Managing Director is planning and delegating."}\n\n${st?.text ?? ""}`);
  });

  server.registerTool("get_instruction_status", {
    title: "Status and result of an instruction",
    description: "Progress of an instruction: every task by agent, split into completed / pending / failed / awaiting approval, items waiting for approval, and the Managing Director's verified final report once done.",
    inputSchema: { ref: z.string().min(4).describe("Reference (e.g. 3F9A2C) or full id") },
    annotations: { readOnlyHint: true },
  }, async ({ ref }) => {
    const r = await resolveRef("commands", ref);
    if ("error" in r) return fail(r.error);
    const st = await formatStatus(r.id);
    return st ? ok(st.text) : fail("Not found");
  });

  server.registerTool("list_instructions", {
    title: "Recent instructions",
    description: "The most recent instructions given to Prohub AI (from any channel) and their status.",
    inputSchema: { limit: z.number().int().min(1).max(30).default(10), mine_only: z.boolean().default(false) },
    annotations: { readOnlyHint: true },
  }, async ({ limit, mine_only }) => {
    const rows = await recentCommands({ userId: mine_only ? user.id : undefined, limit });
    return ok(rows.map((r) => `- ${shortRef(r.id)} [${r.status}] via ${r.channel}, ${r.createdAt.toISOString().slice(0, 16)}: ${truncate(r.text, 140)}`).join("\n") || "No instructions yet.");
  });

  server.registerTool("task_board", {
    title: "What's done, pending, failed and awaiting approval",
    description: "Workforce-wide view of tasks over a time window: completed (verified), pending, failed, and items awaiting the owner's approval. Use for 'what was completed today' or 'what is outstanding'.",
    inputSchema: { since_hours: z.number().int().min(1).max(720).default(24) },
    annotations: { readOnlyHint: true },
  }, async ({ since_hours }) => {
    const b = await taskBoard(since_hours);
    const fmt = (xs: { title: string; agentLabel: string }[]) => xs.map((x) => `- ${x.agentLabel}: ${x.title}`).join("\n") || "- none";
    return ok([
      `Completed in the last ${since_hours}h (${b.completed.length}):`, fmt(b.completed),
      `\nPending (${b.pending.length}):`, fmt(b.pending),
      `\nFailed / rejected / cancelled (${b.failed.length}):`, fmt(b.failed),
      `\nAwaiting the owner's approval (${b.pendingApprovals.length}):`, b.pendingApprovals.map((a) => `- ${a.ref} ${a.title} (level ${a.level})`).join("\n") || "- none",
      b.pausedAgents.length ? `\nPaused agents: ${b.pausedAgents.join(", ")}` : "",
    ].join("\n"));
  });

  server.registerTool("business_snapshot", {
    title: "Business performance snapshot",
    description: "Real figures for this month: actual revenue (recorded payments), expenses, net profit, target progress, outstanding and overdue invoices, pipeline estimates, leads, outreach, responses, deals won, win rate, clients (new/active/repeat), marketing spend, cost per lead, CAC, active projects and pending approvals.",
    inputSchema: {},
    annotations: { readOnlyHint: true },
  }, async () => {
    const s = await businessSnapshot();
    return ok(snapshotText(s), s);
  });

  server.registerTool("pipeline", {
    title: "Sales pipeline and leads",
    description: "Search the CRM. Filter by stage (new_lead → contacted → responded → qualified → meeting_scheduled → proposal_sent → negotiation → won/lost) and/or text (company, industry, location).",
    inputSchema: { stage: z.enum(LEAD_STAGES).optional(), query: z.string().max(100).optional(), limit: z.number().int().min(1).max(50).default(20) },
    annotations: { readOnlyHint: true },
  }, async ({ stage, query, limit }) => {
    const q = query ? `%${query}%` : null;
    const rows = await db.select({ id: leads.id, company: leads.companyName, industry: leads.industry, location: leads.location, stage: leads.stage, score: leads.score, priority: leads.priority, value: leads.estimatedValueMinor, website: leads.website, services: leads.servicesNeeded, source: leads.source })
      .from(leads).where(and(stage ? eq(leads.stage, stage) : undefined, q ? or(ilike(leads.companyName, q), ilike(leads.industry, q), ilike(leads.location, q)) : undefined))
      .orderBy(desc(leads.score)).limit(limit);
    if (!rows.length) return ok("No matching leads.");
    return ok(rows.map((l) => `- ${l.company} [${l.stage}] score ${l.score} (${l.priority}) · ${l.industry ?? "?"} · ${l.location ?? "?"}${l.value ? ` · est. ${formatMoney(l.value)}` : ""}${l.services.length ? ` · needs ${l.services.join(", ")}` : ""}${l.website ? ` · ${l.website}` : ""} · id ${l.id}`).join("\n"));
  });

  server.registerTool("get_lead", {
    title: "Lead detail and history",
    description: "Full CRM record for one lead: verified facts vs assumptions, sources, problem identified, recommended approach and contact history.",
    inputSchema: { id: z.string().uuid() },
    annotations: { readOnlyHint: true },
  }, async ({ id }) => {
    const [l] = await db.select().from(leads).where(eq(leads.id, id));
    if (!l) return fail("Lead not found");
    const hist = await db.select({ at: interactions.occurredAt, channel: interactions.channel, direction: interactions.direction, summary: interactions.summary }).from(interactions).where(eq(interactions.leadId, id)).orderBy(desc(interactions.occurredAt)).limit(20);
    return ok(`${l.companyName} — ${l.stage}`, { ...l, history: hist });
  });

  server.registerTool("list_approvals", {
    title: "Items awaiting approval",
    description: "Actions the agents want to take that need a human decision (publishing, sending messages/proposals/invoices, launching campaigns). Level 3 items are owner-only and must be decided in the dashboard.",
    inputSchema: {},
    annotations: { readOnlyHint: true },
  }, async () => {
    const rows = await db.select().from(approvals).where(eq(approvals.status, "pending")).orderBy(approvals.createdAt).limit(30);
    if (!rows.length) return ok("Nothing is awaiting approval.");
    return ok(rows.map((a) => `- ${shortRef(a.id)} · level ${a.level} · ${ACTION_POLICY[a.actionType]?.label ?? a.actionType}${a.agentSlug ? ` · from ${agentLabel(a.agentSlug)}` : ""}\n  ${a.title}\n  ${truncate(a.summary, 400)}`).join("\n"));
  });

  server.registerTool("decide_approval", {
    title: "Approve, reject or request changes",
    description: "Decide a pending Level-2 approval. 'approve' executes the real external action (e.g. publishes or sends). 'request_changes' sends it back to the agent with your notes; the revision returns for approval. Level-3 (restricted) items cannot be decided here.",
    inputSchema: { ref: z.string().min(4), decision: z.enum(["approve", "reject", "request_changes"]), note: z.string().max(2000).optional() },
    annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true },
  }, async ({ ref, decision, note }) => {
    if (!canAct) return fail("Your role cannot decide approvals.");
    const r = await resolveRef("approvals", ref);
    if ("error" in r) return fail(r.error);
    const [a] = await db.select().from(approvals).where(eq(approvals.id, r.id));
    if (!a) return fail("Approval not found");
    if (a.level >= 3) return fail(`${shortRef(a.id)} is a Level-3 (restricted) action — ${ACTION_POLICY[a.actionType]?.label}. It can only be authorised by the owner in the dashboard: ${env.appUrl}/os/approvals?focus=${a.id}`);
    try {
      if (decision === "request_changes") {
        if (!note) return fail("Add a note describing the changes.");
        const res = await requestChanges({ approvalId: a.id, userId: user.id, role: user.role, notes: note, channel: { kind: "claude" } });
        return ok(`Changes requested. ${agentLabel(res.agentSlug)} is revising it under instruction ${shortRef(res.commandId)}.`);
      }
      await decideApproval({ approvalId: a.id, userId: user.id, role: user.role, decision, note: note ? `${note} (via Claude)` : "via Claude" });
    } catch (e) { return fail(errMessage(e)); }
    return ok(decision === "approve" ? `Approved ${shortRef(a.id)} — "${a.title}". It is executing now; the outcome is recorded in the audit log.` : `Rejected ${shortRef(a.id)} — "${a.title}".`);
  });

  server.registerTool("list_reports", {
    title: "Reports",
    description: "Generated reports (daily business report, daily finance, weekly business, monthly finance, social weekly/monthly).",
    inputSchema: { kind: z.enum(["daily_briefing", "daily_finance", "weekly_business", "monthly_finance", "social_weekly", "social_monthly"]).optional(), limit: z.number().int().min(1).max(30).default(10) },
    annotations: { readOnlyHint: true },
  }, async ({ kind, limit }) => {
    const rows = await db.select({ id: reports.id, title: reports.title, kind: reports.kind, createdAt: reports.createdAt }).from(reports).where(kind ? eq(reports.kind, kind) : undefined).orderBy(desc(reports.createdAt)).limit(limit);
    return ok(rows.map((r) => `- ${r.title} (${r.kind}) · ${r.createdAt.toISOString().slice(0, 16)} · id ${r.id}`).join("\n") || "No reports yet — use generate_report.");
  });

  server.registerTool("get_report", {
    title: "Read a report",
    description: "Full content of a report (computed sections plus the Managing Director's narrative).",
    inputSchema: { id: z.string().uuid() },
    annotations: { readOnlyHint: true },
  }, async ({ id }) => {
    const [r] = await db.select().from(reports).where(eq(reports.id, id));
    if (!r) return fail("Report not found");
    const data = r.data as unknown as ReportData;
    return ok(`# ${r.title}\n${r.narrative ? `\n${r.narrative}\n` : ""}\n${data.sections.map(sectionText).join("\n\n")}\n\nPDF: ${env.appUrl}/api/reports/${r.id}/pdf`);
  });

  server.registerTool("generate_report", {
    title: "Generate a report now",
    description: "Builds a report from live data immediately (numbers computed by the system, not a model).",
    inputSchema: { kind: z.enum(["daily_briefing", "daily_finance", "weekly_business", "monthly_finance", "social_weekly", "social_monthly"]) },
    annotations: { readOnlyHint: false, destructiveHint: false },
  }, async ({ kind }) => {
    const r = await generateReport(kind, `user:${user.id}`);
    const data = r.data as unknown as ReportData;
    await audit("report.generated", { kind, reportId: r.id });
    return ok(`# ${r.title}\n\n${data.sections.map(sectionText).join("\n\n")}\n\nid ${r.id} · PDF: ${env.appUrl}/api/reports/${r.id}/pdf`);
  });

  server.registerTool("list_agents", {
    title: "The AI workforce",
    description: "All agents with role, status (active/paused/disabled), and current workload.",
    inputSchema: {},
    annotations: { readOnlyHint: true },
  }, async () => {
    const rows = await db.select().from(agents);
    const load = (await db.execute(sql`SELECT agent_slug, status, count(*)::int AS n FROM tasks WHERE status IN ('queued','in_progress','awaiting_subtasks','approved','awaiting_approval') GROUP BY agent_slug, status`)) as unknown as { agent_slug: string; status: string; n: number }[];
    return ok(AGENTS.map((d) => {
      const r = rows.find((x) => x.slug === d.slug);
      const busy = load.filter((l) => l.agent_slug === d.slug).map((l) => `${l.n} ${l.status}`).join(", ");
      return `- ${d.title} — ${d.name} (${d.slug}) · ${r?.status ?? "unknown"}${busy ? ` · ${busy}` : " · idle"}\n  ${d.mission}`;
    }).join("\n"));
  });

  server.registerTool("set_agent_status", {
    title: "Pause or activate an agent",
    description: "Pause an agent (it stops picking up tasks) or reactivate it.",
    inputSchema: { agent: z.enum(AGENT_SLUGS), status: z.enum(["active", "paused"]) },
    annotations: { readOnlyHint: false, destructiveHint: false },
  }, async ({ agent, status }) => {
    if (!canAct) return fail("Your role cannot change agents.");
    await db.update(agents).set({ status, updatedAt: new Date() }).where(eq(agents.slug, agent));
    await logActivity({ type: "user", id: user.id }, "agent.status", { type: "agent", id: agent }, { status, via: "claude" });
    return ok(`${agentLabel(agent)} is now ${status}.`);
  });

  server.registerTool("list_deliverables", {
    title: "Work produced by the agents",
    description: "Deliverables (strategies, copy, designs, storyboards, rendered videos, reports) with review status and file links.",
    inputSchema: { status: z.enum(["draft", "in_review", "approved", "changes_requested", "rejected", "published"]).optional(), kind: z.string().optional(), limit: z.number().int().min(1).max(40).default(15) },
    annotations: { readOnlyHint: true },
  }, async ({ status, kind, limit }) => {
    const rows = await db.select({ id: deliverables.id, title: deliverables.title, kind: deliverables.kind, status: deliverables.status, agent: deliverables.agentSlug, fileIds: deliverables.fileIds, createdAt: deliverables.createdAt })
      .from(deliverables).where(and(status ? eq(deliverables.status, status) : undefined, kind ? eq(deliverables.kind, kind as typeof deliverables.$inferSelect.kind) : undefined)).orderBy(desc(deliverables.createdAt)).limit(limit);
    return ok(rows.map((d) => `- ${d.title} [${d.kind}, ${d.status}] by ${agentLabel(d.agent)} · ${d.fileIds.length ? `${d.fileIds.length} file(s) · ` : ""}id ${d.id}`).join("\n") || "No deliverables.");
  });

  server.registerTool("get_deliverable", {
    title: "Read a deliverable",
    description: "Full content of a deliverable, its QC checklist, and links to any rendered files (e.g. MP4 videos in each aspect ratio).",
    inputSchema: { id: z.string().uuid() },
    annotations: { readOnlyHint: true },
  }, async ({ id }) => {
    const [d] = await db.select().from(deliverables).where(eq(deliverables.id, id));
    if (!d) return fail("Deliverable not found");
    const fl = await listFileMeta(d.fileIds);
    return ok([
      `# ${d.title} (${d.kind}, ${d.status}, v${d.version}) — ${agentLabel(d.agentSlug)}`,
      d.qc.length ? `QC: ${d.qc.map((q) => `${q.pass ? "✓" : "✗"} ${q.item}`).join("; ")}` : "",
      fl.length ? `Files:\n${fl.map((f) => `- ${f.name} (${f.mimeType}, ${(f.sizeBytes / 1048576).toFixed(1)} MB): ${env.appUrl}/api/files/${f.id}`).join("\n")}` : "",
      `Dashboard: ${env.appUrl}/os/deliverables/${d.id}`,
      "", truncate(d.content, 12000),
    ].filter(Boolean).join("\n"));
  });

  server.registerTool("outstanding_payments", {
    title: "Outstanding and overdue invoices",
    description: "Which clients owe money: invoices sent or partially paid, with amounts outstanding and due dates. Paid status only comes from verified payment records.",
    inputSchema: { overdue_only: z.boolean().default(false) },
    annotations: { readOnlyHint: true },
  }, async ({ overdue_only }) => {
    const today = new Date().toISOString().slice(0, 10);
    const rows = await db.select().from(invoices).where(inArray(invoices.status, ["sent", "partially_paid"])).orderBy(invoices.dueDate);
    const list = rows.filter((i) => !overdue_only || (i.dueDate && i.dueDate < today));
    if (!list.length) return ok(overdue_only ? "No overdue invoices." : "No outstanding invoices.");
    const total = list.reduce((a, i) => a + (i.totalMinor - i.amountPaidMinor), 0);
    return ok(`${list.length} invoice(s), ${formatMoney(total)} outstanding:\n${list.map((i) => `- ${i.number}: ${formatMoney(i.totalMinor - i.amountPaidMinor)} of ${formatMoney(i.totalMinor)} · due ${i.dueDate ?? "—"}${i.dueDate && i.dueDate < today ? " (OVERDUE)" : ""} · ${i.status}`).join("\n")}`);
  });

  server.registerTool("search_knowledge", {
    title: "Search the business knowledge base",
    description: "Search company profile, services, pricing policy, brand guidelines, SOPs and other stored business knowledge.",
    inputSchema: { query: z.string().min(2).max(200) },
    annotations: { readOnlyHint: true },
  }, async ({ query }) => {
    const res = await searchKnowledge(query, { limit: 6 });
    return ok(JSON.stringify(res, null, 2).slice(0, 15000));
  });

  return server;
}
