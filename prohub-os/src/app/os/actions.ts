"use server";
/**
 * Dashboard mutations. Every action checks the caller's role, writes an audit entry, and revalidates.
 * Financial records and integration credentials are owner-only (Level 3).
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import {
  agents, leads, interactions, clients, followUps, projects, deliverables, transactions, invoices, revenueTargets, knowledgeDocs,
  integrationConfigs, schedules, users, services, socialAccounts, contentItems, intelItems, notifications, portfolioItems,
  testimonials, approvals, LEAD_STAGES, type LeadStage,
} from "@/db/schema";
import { requireUser, type SessionUser } from "@/lib/auth";
import { logActivity } from "@/lib/audit";
import { submitCommand } from "@/orchestrator/commands";
import { approveTask, rejectTask, retryTask, cancelTask } from "@/orchestrator/tasks";
import { decideApproval } from "@/governance/approvals";
import { enqueue, retryJob, type JobType } from "@/orchestrator/queue";
import { generateReport } from "@/services/reports";
import { nextInvoiceNumber } from "@/services/finance";
import { updateSettings } from "@/services/settings";
import { encryptJson, decryptJson, hashPassword } from "@/lib/crypto";
import { getIntegration } from "@/integrations/registry";
import { testIntegration } from "@/integrations/test";
import { nextRun } from "@/orchestrator/scheduler";
import { errMessage } from "@/lib/utils";
import { scoreLead } from "@/services/scoring";
import { AVAILABLE_MODELS } from "@/agents/llm";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const opt = (f: FormData, k: string) => s(f, k) || null;
const naira = (f: FormData, k: string) => { const v = s(f, k).replace(/[,₦\s]/g, ""); return v ? Math.round(Number(v) * 100) : null; };
const back = (f: FormData, fallback: string) => s(f, "back") || fallback;

function bounce(path: string, msg: string, kind: "error" | "ok" = "error"): never {
  redirect(`${path}${path.includes("?") ? "&" : "?"}${kind}=${encodeURIComponent(msg)}`);
}

async function guarded<T>(f: FormData, fallback: string, role: "viewer" | "manager" | "owner", fn: (u: SessionUser) => Promise<T>) {
  const user = await requireUser("viewer");
  const rank = { viewer: 0, manager: 1, owner: 2 };
  if (rank[user.role] < rank[role]) bounce(back(f, fallback), `This action requires the ${role} role.`);
  try {
    return await fn(user);
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e && String((e as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")) throw e;
    bounce(back(f, fallback), errMessage(e));
  }
}

/* ── Command centre & tasks ─────────────────────────────────────────────── */

export async function submitCommandAction(f: FormData) {
  const r = await guarded(f, "/os/command", "manager", (u) => submitCommand(s(f, "text"), u.id, { agentSlug: opt(f, "agent") ?? undefined }));
  revalidatePath("/os");
  redirect(`/os/command?c=${r.commandId}`);
}

export async function taskDecisionAction(f: FormData) {
  await guarded(f, "/os/tasks", "manager", async (u) => {
    const id = s(f, "taskId"), d = s(f, "decision");
    if (d === "approve") await approveTask(id, `user:${u.id}`);
    else if (d === "reject") await rejectTask(id, `user:${u.id}`, s(f, "reason") || "Rejected by owner");
    else if (d === "retry") await retryTask(id);
    else if (d === "cancel") await cancelTask(id, `user:${u.id}`);
    await logActivity({ type: "user", id: u.id }, `task.${d}`, { type: "task", id });
  });
  revalidatePath("/os/tasks");
  redirect(back(f, "/os/tasks"));
}

/* ── Workforce ───────────────────────────────────────────────────────────── */

export async function updateAgentAction(f: FormData) {
  const slug = s(f, "slug");
  await guarded(f, `/os/workforce/${slug}`, "owner", async (u) => {
    const model = s(f, "model");
    if (!AVAILABLE_MODELS.some((m) => m.id === model)) throw new Error("Unknown model");
    const effort = s(f, "effort") as "low" | "medium" | "high" | "xhigh" | "max";
    await db.update(agents).set({
      model, effort, maxTurns: Math.min(60, Math.max(4, Number(s(f, "maxTurns")) || 14)),
      dailyBudgetUsd: Math.min(500, Math.max(0, Number(s(f, "dailyBudgetUsd")) || 0)), extraInstructions: opt(f, "extraInstructions"), updatedAt: new Date(),
    }).where(eq(agents.slug, slug));
    await logActivity({ type: "user", id: u.id }, "agent.configured", { type: "agent", id: slug }, { model, effort });
  });
  revalidatePath(`/os/workforce/${slug}`);
  bounce(`/os/workforce/${slug}`, "Configuration saved", "ok");
}

export async function setAgentStatusAction(f: FormData) {
  const slug = s(f, "slug");
  await guarded(f, `/os/workforce/${slug}`, "manager", async (u) => {
    const status = s(f, "status") as "active" | "paused" | "disabled";
    if (!["active", "paused", "disabled"].includes(status)) throw new Error("Invalid status");
    await db.update(agents).set({ status, updatedAt: new Date() }).where(eq(agents.slug, slug));
    await logActivity({ type: "user", id: u.id }, `agent.${status}`, { type: "agent", id: slug });
  });
  revalidatePath("/os/workforce");
  redirect(back(f, `/os/workforce/${slug}`));
}

/* ── Approvals ───────────────────────────────────────────────────────────── */

export async function approvalDecisionAction(f: FormData) {
  await guarded(f, "/os/approvals", "manager", async (u) => {
    const id = s(f, "approvalId"), d = s(f, "decision");
    if (d === "retry") {
      const [a] = await db.select().from(approvals).where(eq(approvals.id, id));
      if (a?.status !== "failed") throw new Error("Only failed actions can be retried");
      await enqueue("approval.execute", { approvalId: id }, { priority: 2 });
      await logActivity({ type: "user", id: u.id }, "approval.retry", { type: "approval", id });
      return;
    }
    await decideApproval({ approvalId: id, userId: u.id, role: u.role, decision: d === "approve" ? "approve" : "reject", note: opt(f, "note") ?? undefined });
  });
  revalidatePath("/os/approvals");
  redirect(back(f, "/os/approvals"));
}

/* ── CRM ─────────────────────────────────────────────────────────────────── */

export async function createLeadAction(f: FormData) {
  await guarded(f, "/os/crm", "manager", async (u) => {
    const scored = scoreLead({ industryFit: true, inbound: s(f, "source") !== "manual", verifiedContact: !!(s(f, "email") || s(f, "phone")) });
    const [l] = await db.insert(leads).values({
      companyName: s(f, "companyName"), industry: opt(f, "industry"), website: opt(f, "website"), contactName: opt(f, "contactName"),
      email: opt(f, "email"), phone: opt(f, "phone"), location: opt(f, "location"), source: s(f, "source") || "manual",
      problemIdentified: opt(f, "notes"), estimatedValueMinor: naira(f, "estimatedValue"), servicesNeeded: f.getAll("services").map(String),
      score: scored.score, priority: scored.priority, scoreBreakdown: scored.breakdown, createdBy: `user:${u.id}`,
      verifiedFacts: ["Entered by a team member"],
    }).returning();
    await db.insert(interactions).values({ leadId: l.id, channel: "note", direction: "internal", summary: "Lead created manually", content: opt(f, "notes"), actor: `user:${u.id}` });
    await logActivity({ type: "user", id: u.id }, "lead.created", { type: "lead", id: l.id });
  });
  revalidatePath("/os/crm");
  redirect(back(f, "/os/crm"));
}

export async function moveLeadAction(f: FormData) {
  const id = s(f, "leadId");
  await guarded(f, `/os/crm/leads/${id}`, "manager", async (u) => {
    const stage = s(f, "stage") as LeadStage;
    if (!LEAD_STAGES.includes(stage)) throw new Error("Invalid stage");
    const [l] = await db.select().from(leads).where(eq(leads.id, id));
    if (!l) throw new Error("Lead not found");
    await db.update(leads).set({ stage, stageChangedAt: new Date(), updatedAt: new Date(), ...(stage === "lost" ? { lostReason: opt(f, "note") } : {}) }).where(eq(leads.id, id));
    await db.insert(interactions).values({ leadId: id, channel: "note", direction: "internal", summary: `Stage: ${l.stage} → ${stage}`, content: opt(f, "note"), actor: `user:${u.id}` });
    if (stage === "won" && !l.clientId) {
      const [c] = await db.insert(clients).values({ name: l.companyName, industry: l.industry, website: l.website, primaryContact: l.contactName, email: l.email, phone: l.phone, location: l.location, leadId: l.id, createdBy: `user:${u.id}` }).returning();
      await db.update(leads).set({ clientId: c.id }).where(eq(leads.id, id));
    }
    await logActivity({ type: "user", id: u.id }, "lead.stage_changed", { type: "lead", id }, { from: l.stage, to: stage });
  });
  revalidatePath("/os/crm");
  redirect(back(f, `/os/crm/leads/${id}`));
}

export async function addInteractionAction(f: FormData) {
  const leadId = opt(f, "leadId"), clientId = opt(f, "clientId");
  await guarded(f, "/os/crm", "manager", async (u) => {
    const channel = s(f, "channel") as typeof interactions.$inferInsert.channel;
    await db.insert(interactions).values({ leadId, clientId, channel, direction: (s(f, "direction") || "internal") as "inbound" | "outbound" | "internal", summary: s(f, "summary"), content: opt(f, "content"), actor: `user:${u.id}` });
  });
  revalidatePath("/os/crm");
  redirect(back(f, "/os/crm"));
}

export async function scheduleFollowUpAction(f: FormData) {
  await guarded(f, "/os/crm", "manager", async (u) => {
    const due = s(f, "dueAt");
    if (!due) throw new Error("Due date required");
    await db.insert(followUps).values({ leadId: opt(f, "leadId"), clientId: opt(f, "clientId"), agentSlug: s(f, "agent") || "client-management", dueAt: new Date(due), reason: s(f, "reason"), createdBy: `user:${u.id}` });
  });
  revalidatePath("/os/crm");
  redirect(back(f, "/os/crm"));
}

export async function completeFollowUpAction(f: FormData) {
  await guarded(f, "/os/crm", "manager", async () => {
    await db.update(followUps).set({ status: s(f, "status") === "cancelled" ? "cancelled" : "done", completedAt: new Date() }).where(eq(followUps.id, s(f, "id")));
  });
  revalidatePath("/os/crm");
  redirect(back(f, "/os/crm?tab=follow-ups"));
}

/* ── Projects & deliverables ─────────────────────────────────────────────── */

export async function createProjectAction(f: FormData) {
  await guarded(f, "/os/projects", "manager", async (u) => {
    const [p] = await db.insert(projects).values({
      name: s(f, "name"), clientId: opt(f, "clientId"), isInternal: !opt(f, "clientId"), serviceSlug: opt(f, "serviceSlug"), description: opt(f, "description"),
      ownerName: opt(f, "ownerName"), leadAgent: opt(f, "leadAgent"), budgetMinor: naira(f, "budget"), deadline: opt(f, "deadline"),
      startDate: new Date().toISOString().slice(0, 10), status: "active", createdBy: `user:${u.id}`,
    }).returning();
    await logActivity({ type: "user", id: u.id }, "project.created", { type: "project", id: p.id });
  });
  revalidatePath("/os/projects");
  redirect(back(f, "/os/projects"));
}

export async function updateProjectAction(f: FormData) {
  const id = s(f, "id");
  await guarded(f, `/os/projects/${id}`, "manager", async () => {
    await db.update(projects).set({ status: s(f, "status") as typeof projects.$inferInsert.status, progressPct: Math.min(100, Math.max(0, Number(s(f, "progress")) || 0)), updatedAt: new Date() }).where(eq(projects.id, id));
  });
  revalidatePath(`/os/projects/${id}`);
  redirect(back(f, `/os/projects/${id}`));
}

export async function reviewDeliverableAction(f: FormData) {
  const id = s(f, "id");
  await guarded(f, `/os/deliverables/${id}`, "manager", async (u) => {
    const d = s(f, "decision");
    const map: Record<string, Partial<typeof deliverables.$inferInsert>> = {
      approve: { status: "approved" }, changes: { status: "changes_requested" }, reject: { status: "rejected" },
      client_pending: { clientApproval: "pending" }, client_approved: { clientApproval: "approved" }, client_changes: { clientApproval: "changes_requested" },
    };
    if (!map[d]) throw new Error("Invalid decision");
    await db.update(deliverables).set({ ...map[d], reviewNotes: opt(f, "notes") ?? undefined, updatedAt: new Date() }).where(eq(deliverables.id, id));
    if ((d === "changes" || d === "client_changes") && s(f, "notes")) {
      const [del] = await db.select().from(deliverables).where(eq(deliverables.id, id));
      const { createTask } = await import("@/orchestrator/tasks");
      await createTask({ agentSlug: del.agentSlug, createdBy: `user:${u.id}`, status: "approved", priority: 2, kind: "review", projectId: del.projectId, clientId: del.clientId,
        title: `Revise: ${del.title}`, instructions: `${d === "client_changes" ? "The client" : "The owner"} requested changes to deliverable ${del.id} ("${del.title}"):\n\n${s(f, "notes")}\n\nRead it with read_record and save a revision with revises_deliverable_id=${del.id}.` });
    }
    await logActivity({ type: "user", id: u.id }, `deliverable.${d}`, { type: "deliverable", id });
  });
  revalidatePath(`/os/deliverables/${id}`);
  redirect(back(f, `/os/deliverables/${id}`));
}

/* ── Finance (owner only for ledger changes) ─────────────────────────────── */

export async function recordTransactionAction(f: FormData) {
  await guarded(f, "/os/finance", "owner", async (u) => {
    const amount = naira(f, "amount");
    if (!amount || amount <= 0) throw new Error("Amount must be greater than zero");
    const currency = s(f, "currency") || "NGN";
    const fx = currency === "NGN" ? 1 : Number(s(f, "fxRate"));
    if (!fx || fx <= 0) throw new Error("Provide the exchange rate to NGN for non-Naira transactions");
    const [t] = await db.insert(transactions).values({
      type: s(f, "type") as "income" | "expense" | "refund", amountMinor: amount, currency, fxRate: fx, amountBaseMinor: Math.round(amount * fx),
      category: s(f, "category") || "uncategorised", serviceSlug: opt(f, "serviceSlug"), clientId: opt(f, "clientId"), invoiceId: opt(f, "invoiceId"),
      campaignId: opt(f, "campaignId"), projectId: opt(f, "projectId"), description: s(f, "description") || "—", source: "manual", externalReference: opt(f, "reference"),
      recordedBy: `user:${u.id}`, occurredAt: s(f, "occurredAt") ? new Date(s(f, "occurredAt")) : new Date(),
    }).returning();
    if (t.invoiceId && t.type === "income") await applyPaymentToInvoice(t.invoiceId, t.amountBaseMinor);
    await logActivity({ type: "user", id: u.id }, "finance.transaction_recorded", { type: "transaction", id: t.id }, { type: t.type, amount: t.amountBaseMinor });
  });
  revalidatePath("/os/finance");
  redirect(back(f, "/os/finance"));
}

async function applyPaymentToInvoice(invoiceId: string, amountMinor: number) {
  const [inv] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
  if (!inv) return;
  const paid = inv.amountPaidMinor + amountMinor;
  await db.update(invoices).set({ amountPaidMinor: paid, status: paid >= inv.totalMinor ? "paid" : "partially_paid", updatedAt: new Date() }).where(eq(invoices.id, invoiceId));
}

export async function createInvoiceAction(f: FormData) {
  await guarded(f, "/os/finance", "manager", async (u) => {
    const descs = f.getAll("itemDesc").map(String), qtys = f.getAll("itemQty").map(Number), prices = f.getAll("itemPrice").map((v) => Math.round(Number(String(v).replace(/[,₦\s]/g, "")) * 100));
    const items = descs.map((d, i) => ({ description: d.trim(), quantity: qtys[i] || 1, unitPriceMinor: prices[i] || 0, serviceSlug: opt(f, "serviceSlug") ?? undefined })).filter((i) => i.description && i.unitPriceMinor > 0);
    if (!items.length) throw new Error("Add at least one line item with a price");
    const subtotal = items.reduce((a, i) => a + i.unitPriceMinor * i.quantity, 0);
    const tax = Math.round(subtotal * (Number(s(f, "vat")) || 0) / 100);
    const [inv] = await db.insert(invoices).values({
      number: await nextInvoiceNumber(), clientId: s(f, "clientId"), projectId: opt(f, "projectId"), lineItems: items, subtotalMinor: subtotal, taxMinor: tax, totalMinor: subtotal + tax,
      issueDate: new Date().toISOString().slice(0, 10), dueDate: s(f, "dueDate") || new Date(Date.now() + 14 * 86400_000).toISOString().slice(0, 10), createdBy: `user:${u.id}`,
    }).returning();
    await logActivity({ type: "user", id: u.id }, "invoice.created", { type: "invoice", id: inv.id });
  });
  revalidatePath("/os/finance");
  redirect(back(f, "/os/finance?tab=invoices"));
}

export async function invoiceStatusAction(f: FormData) {
  await guarded(f, "/os/finance", "owner", async (u) => {
    const id = s(f, "id"), status = s(f, "status");
    if (status === "sent") await db.update(invoices).set({ status: "sent", updatedAt: new Date() }).where(eq(invoices.id, id));
    else if (status === "void") await db.update(invoices).set({ status: "void", updatedAt: new Date() }).where(eq(invoices.id, id));
    else throw new Error("Unsupported status");
    await logActivity({ type: "user", id: u.id }, `invoice.${status}`, { type: "invoice", id });
  });
  revalidatePath("/os/finance");
  redirect(back(f, "/os/finance?tab=invoices"));
}

export async function setTargetAction(f: FormData) {
  await guarded(f, "/os/settings", "owner", async (u) => {
    const values = {
      periodType: (s(f, "periodType") || "month") as "month" | "quarter", periodStart: s(f, "periodStart"),
      revenueTargetMinor: naira(f, "revenueTarget") ?? 0, newClientsTarget: Number(s(f, "newClients")) || null, avgDealValueMinor: naira(f, "avgDeal"),
      retainerTargetMinor: naira(f, "retainerTarget"), marketingBudgetMinor: naira(f, "marketingBudget"), leadTarget: Number(s(f, "leadTarget")) || null,
      conversionTargetPct: Number(s(f, "conversionTarget")) || null, createdBy: `user:${u.id}`,
    };
    if (!/^\d{4}-\d{2}-01$/.test(values.periodStart)) throw new Error("Period start must be the first day of a month (YYYY-MM-01)");
    await db.insert(revenueTargets).values(values).onConflictDoUpdate({ target: [revenueTargets.periodType, revenueTargets.periodStart], set: values });
    await logActivity({ type: "user", id: u.id }, "targets.set", null, { period: values.periodStart, target: values.revenueTargetMinor });
  });
  revalidatePath("/os");
  bounce("/os/settings", "Target saved", "ok");
}

/* ── Knowledge ──────────────────────────────────────────────────────────── */

export async function saveKnowledgeAction(f: FormData) {
  await guarded(f, "/os/knowledge", "manager", async (u) => {
    const id = opt(f, "id");
    const values = { category: s(f, "category") as typeof knowledgeDocs.$inferInsert.category, title: s(f, "title"), content: s(f, "content"), pinned: f.get("pinned") === "on", tags: s(f, "tags").split(",").map((t) => t.trim()).filter(Boolean) };
    if (values.category === "pricing" && u.role !== "owner") throw new Error("Only the owner can edit pricing knowledge");
    if (id) await db.update(knowledgeDocs).set({ ...values, updatedAt: new Date() }).where(eq(knowledgeDocs.id, id));
    else await db.insert(knowledgeDocs).values({ ...values, createdBy: `user:${u.id}` });
    await logActivity({ type: "user", id: u.id }, id ? "knowledge.updated" : "knowledge.created", id ? { type: "knowledge", id } : null, { title: values.title });
  });
  revalidatePath("/os/knowledge");
  redirect("/os/knowledge");
}

export async function deleteKnowledgeAction(f: FormData) {
  await guarded(f, "/os/knowledge", "owner", async (u) => {
    await db.delete(knowledgeDocs).where(eq(knowledgeDocs.id, s(f, "id")));
    await logActivity({ type: "user", id: u.id }, "knowledge.deleted", { type: "knowledge", id: s(f, "id") });
  });
  revalidatePath("/os/knowledge");
  redirect("/os/knowledge");
}

/* ── Integrations (owner only) ──────────────────────────────────────────── */

export async function saveIntegrationAction(f: FormData) {
  const slug = s(f, "slug");
  await guarded(f, "/os/integrations", "owner", async (u) => {
    const def = getIntegration(slug);
    if (!def) throw new Error("Unknown integration");
    const [row] = await db.select().from(integrationConfigs).where(eq(integrationConfigs.slug, slug));
    const existing = row?.credentialsEncrypted ? decryptJson<Record<string, string>>(row.credentialsEncrypted) : {};
    const next: Record<string, string> = { ...existing };
    for (const field of def.fields) {
      const v = s(f, field.key);
      if (v) next[field.key] = v; // blank keeps the stored secret
      if (f.get(`clear_${field.key}`) === "on") delete next[field.key];
    }
    await db.insert(integrationConfigs).values({ slug, enabled: f.get("enabled") === "on", credentialsEncrypted: encryptJson(next) })
      .onConflictDoUpdate({ target: integrationConfigs.slug, set: { enabled: f.get("enabled") === "on", credentialsEncrypted: encryptJson(next), updatedAt: new Date() } });
    await logActivity({ type: "user", id: u.id }, "integration.configured", { type: "integration", id: slug }, { fields: Object.keys(next) });
  });
  revalidatePath("/os/integrations");
  bounce(`/os/integrations?focus=${slug}`, "Saved", "ok");
}

export async function testIntegrationAction(f: FormData) {
  const slug = s(f, "slug");
  const user = await requireUser("manager");
  let msg: string, ok: boolean;
  try { msg = await testIntegration(slug); ok = true; } catch (e) { msg = errMessage(e); ok = false; }
  await db.insert(integrationConfigs).values({ slug, lastTestedAt: new Date(), lastTestOk: ok, lastError: ok ? null : msg })
    .onConflictDoUpdate({ target: integrationConfigs.slug, set: { lastTestedAt: new Date(), lastTestOk: ok, lastError: ok ? null : msg } });
  await logActivity({ type: "user", id: user.id }, "integration.tested", { type: "integration", id: slug }, { ok });
  revalidatePath("/os/integrations");
  bounce(`/os/integrations?focus=${slug}`, msg, ok ? "ok" : "error");
}

/* ── Settings, schedules, users, services, website content ──────────────── */

export async function saveSettingsAction(f: FormData) {
  await guarded(f, "/os/settings", "owner", async (u) => {
    await updateSettings({
      dailyProspectQuota: Math.min(50, Math.max(0, Number(s(f, "dailyProspectQuota")) || 0)),
      prospectSegments: s(f, "prospectSegments").split("\n").map((x) => x.trim()).filter(Boolean),
      autonomousCycles: f.get("autonomousCycles") === "on",
      reportEmail: opt(f, "reportEmail"),
    });
    await logActivity({ type: "user", id: u.id }, "settings.updated", null);
  });
  revalidatePath("/os/settings");
  bounce("/os/settings", "Settings saved", "ok");
}

export async function scheduleAction(f: FormData) {
  await guarded(f, "/os/settings", "owner", async (u) => {
    const slug = s(f, "slug"), op = s(f, "op");
    const [row] = await db.select().from(schedules).where(eq(schedules.slug, slug));
    if (!row) throw new Error("Schedule not found");
    if (op === "toggle") await db.update(schedules).set({ enabled: !row.enabled, nextRunAt: nextRun(row.cron, row.timezone) }).where(eq(schedules.slug, slug));
    if (op === "run") await enqueue(row.jobType as JobType, row.payload, { priority: 2 });
    if (op === "cron") {
      const cron = s(f, "cron");
      if (!nextRun(cron, row.timezone)) throw new Error("Invalid cron expression");
      await db.update(schedules).set({ cron, nextRunAt: nextRun(cron, row.timezone) }).where(eq(schedules.slug, slug));
    }
    await logActivity({ type: "user", id: u.id }, `schedule.${op}`, { type: "schedule", id: slug });
  });
  revalidatePath("/os/settings");
  bounce("/os/settings?tab=schedules", "Done", "ok");
}

export async function createUserAction(f: FormData) {
  await guarded(f, "/os/settings", "owner", async (u) => {
    const pw = s(f, "password");
    if (pw.length < 10) throw new Error("Password must be at least 10 characters");
    const role = s(f, "role") as "owner" | "manager" | "viewer";
    await db.insert(users).values({ email: s(f, "email").toLowerCase(), name: s(f, "name"), role, passwordHash: await hashPassword(pw) });
    await logActivity({ type: "user", id: u.id }, "user.created", null, { email: s(f, "email"), role });
  });
  revalidatePath("/os/settings");
  bounce("/os/settings?tab=users", "User created", "ok");
}

export async function setUserActiveAction(f: FormData) {
  await guarded(f, "/os/settings", "owner", async (u) => {
    if (s(f, "id") === u.id) throw new Error("You cannot deactivate yourself");
    await db.update(users).set({ active: s(f, "active") === "true" }).where(eq(users.id, s(f, "id")));
  });
  revalidatePath("/os/settings");
  redirect("/os/settings?tab=users");
}

export async function changePasswordAction(f: FormData) {
  await guarded(f, "/os/settings", "viewer", async (u) => {
    const pw = s(f, "password");
    if (pw.length < 10) throw new Error("Password must be at least 10 characters");
    await db.update(users).set({ passwordHash: await hashPassword(pw) }).where(eq(users.id, u.id));
    await logActivity({ type: "user", id: u.id }, "user.password_changed", null);
  });
  bounce("/os/settings?tab=users", "Password changed", "ok");
}

export async function updateServiceAction(f: FormData) {
  await guarded(f, "/os/settings", "owner", async (u) => {
    await db.update(services).set({ priceFromMinor: naira(f, "priceFrom"), pricingModel: (s(f, "pricingModel") || "custom") as typeof services.$inferInsert.pricingModel, published: f.get("published") === "on", updatedAt: new Date() }).where(eq(services.slug, s(f, "slug")));
    await logActivity({ type: "user", id: u.id }, "service.pricing_updated", { type: "service", id: s(f, "slug") });
  });
  revalidatePath("/os/settings");
  redirect("/os/settings?tab=services");
}

export async function websiteContentAction(f: FormData) {
  await guarded(f, "/os/marketing", "owner", async (u) => {
    const kind = s(f, "kind");
    if (kind === "portfolio") await db.insert(portfolioItems).values({ title: s(f, "title"), clientName: opt(f, "clientName"), serviceSlug: opt(f, "serviceSlug"), summary: s(f, "summary"), results: opt(f, "results"), imageUrl: opt(f, "imageUrl"), published: f.get("published") === "on" });
    else if (kind === "testimonial") await db.insert(testimonials).values({ quote: s(f, "quote"), author: s(f, "author"), company: opt(f, "company"), verified: f.get("verified") === "on" });
    else throw new Error("Unknown content kind");
    await logActivity({ type: "user", id: u.id }, `website.${kind}_added`, null);
  });
  revalidatePath("/");
  redirect("/os/marketing?tab=website");
}

/* ── Marketing ──────────────────────────────────────────────────────────── */

export async function addSocialAccountAction(f: FormData) {
  await guarded(f, "/os/marketing", "manager", async () => {
    await db.insert(socialAccounts).values({ platform: s(f, "platform") as typeof socialAccounts.$inferInsert.platform, handle: s(f, "handle"), followers: Number(s(f, "followers")) || null, followersUpdatedAt: s(f, "followers") ? new Date() : null });
  });
  revalidatePath("/os/marketing");
  redirect("/os/marketing");
}

export async function contentItemAction(f: FormData) {
  await guarded(f, "/os/marketing", "manager", async (u) => {
    const id = s(f, "id"), op = s(f, "op");
    if (op === "manual_published") {
      await db.update(contentItems).set({ status: "published", publishedAt: new Date(), externalPostId: opt(f, "url"), updatedAt: new Date() }).where(eq(contentItems.id, id));
    } else if (op === "metrics") {
      const metrics: Record<string, number> = {};
      for (const k of ["impressions", "reach", "likes", "comments", "shares", "saves", "clicks"]) { const v = Number(s(f, k)); if (s(f, k) && !Number.isNaN(v)) metrics[k] = v; }
      await db.update(contentItems).set({ metrics, metricsSource: `manual:user:${u.id}`, updatedAt: new Date() }).where(eq(contentItems.id, id));
    } else throw new Error("Unknown operation");
  });
  revalidatePath("/os/marketing");
  redirect(back(f, "/os/marketing?tab=calendar"));
}

export async function intelStatusAction(f: FormData) {
  await guarded(f, "/os/intelligence", "manager", async () => {
    await db.update(intelItems).set({ status: s(f, "status") as "new" | "actioned" | "dismissed" }).where(eq(intelItems.id, s(f, "id")));
  });
  revalidatePath("/os/intelligence");
  redirect(back(f, "/os/intelligence"));
}

export async function intelToTaskAction(f: FormData) {
  await guarded(f, "/os/intelligence", "manager", async (u) => {
    const [item] = await db.select().from(intelItems).where(eq(intelItems.id, s(f, "id")));
    if (!item) throw new Error("Not found");
    await submitCommand(`Act on this intelligence finding: "${item.title}". ${item.summary} ${item.recommendation ? `Recommendation: ${item.recommendation}` : ""} Sources: ${item.sourceUrls.join(", ") || "none"}.`, u.id);
    await db.update(intelItems).set({ status: "actioned" }).where(eq(intelItems.id, item.id));
  });
  redirect("/os/command");
}

/* ── Reports, jobs, notifications ───────────────────────────────────────── */

export async function generateReportAction(f: FormData) {
  const r = await guarded(f, "/os/reports", "manager", async (u) => {
    const kind = s(f, "kind") as Parameters<typeof generateReport>[0];
    const row = await generateReport(kind, `user:${u.id}`);
    await logActivity({ type: "user", id: u.id }, "report.generated", { type: "report", id: row.id }, { kind });
    return row;
  });
  redirect(`/os/reports/${r.id}`);
}

export async function retryJobAction(f: FormData) {
  await guarded(f, "/os/activity", "manager", async () => { await retryJob(s(f, "id")); });
  revalidatePath("/os/activity");
  redirect("/os/activity?tab=jobs");
}

export async function markNotificationsReadAction() {
  await requireUser();
  await db.update(notifications).set({ readAt: new Date() }).where(isNull(notifications.readAt));
  revalidatePath("/os");
  redirect("/os/activity?tab=notifications");
}

export async function runCycleNowAction(f: FormData) {
  await guarded(f, "/os", "owner", async (u) => {
    const type = s(f, "type") as JobType;
    if (!["cycle.morning", "cycle.midday", "cycle.evening"].includes(type)) throw new Error("Unknown cycle");
    await enqueue(type, {}, { priority: 2 });
    await logActivity({ type: "user", id: u.id }, "cycle.triggered", null, { type });
  });
  bounce(back(f, "/os"), "Cycle queued — the worker will start it within seconds.", "ok");
}

