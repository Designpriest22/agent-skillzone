import { z } from "zod";
import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { leads, interactions, followUps, proposals, clients, projects, LEAD_STAGES } from "@/db/schema";
import { defineTool, ToolError } from "./types";
import { scoreLead } from "@/services/scoring";
import { requestApproval } from "@/governance/approvals";
import { formatMoney } from "@/lib/money";

const signalsSchema = z.object({
  industry_fit: z.boolean().optional(),
  observed_weaknesses: z.number().int().min(0).max(5).optional().describe("Number of concrete weaknesses you OBSERVED (outdated site, inactive socials, poor visuals…)"),
  budget_signal: z.enum(["none", "weak", "strong"]).optional(),
  timing_trigger: z.boolean().optional(),
  verified_contact: z.boolean().optional(),
  decision_maker_known: z.boolean().optional(),
  inbound: z.boolean().optional(),
});

function computeScore(s: z.infer<typeof signalsSchema>) {
  return scoreLead({
    industryFit: s.industry_fit, observedWeaknesses: s.observed_weaknesses, budgetSignal: s.budget_signal, timingTrigger: s.timing_trigger,
    verifiedContact: s.verified_contact, decisionMakerKnown: s.decision_maker_known, inbound: s.inbound,
  });
}

export const createLead = defineTool({
  name: "create_lead",
  description:
    "Add a real prospect to the CRM. Only for businesses you found evidence of via research (source_urls required unless the lead came inbound). " +
    "Put facts you saw on a source page in verified_facts; anything inferred goes in assumptions. Contact details must be publicly listed — never guess emails or phone numbers. " +
    "The score is computed by the system from your signals. Duplicates (same company name) are rejected.",
  governance: "autonomous",
  schema: z.object({
    company_name: z.string().min(2),
    industry: z.string(),
    website: z.string().url().optional(),
    social_profiles: z.record(z.string(), z.string()).default({}),
    contact_name: z.string().optional(),
    contact_role: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    services_needed: z.array(z.string()).min(1),
    problem_identified: z.string().min(10),
    estimated_value_ngn: z.number().nonnegative().optional().describe("Estimated opportunity value in Naira — an estimate, not revenue"),
    recommended_approach: z.string().min(10),
    source: z.enum(["agent_research", "website_form", "whatsapp", "social", "referral", "event", "procurement_portal", "manual"]).default("agent_research"),
    source_urls: z.array(z.string().url()).default([]),
    verified_facts: z.array(z.string()).default([]),
    assumptions: z.array(z.string()).default([]),
    signals: signalsSchema,
    campaign_id: z.string().uuid().optional(),
  }),
  async run(input, ctx) {
    if (input.source === "agent_research" && input.source_urls.length === 0) throw new ToolError("Researched leads need at least one source URL proving the business exists.");
    const [dupe] = await db.select({ id: leads.id, stage: leads.stage }).from(leads).where(sql`lower(${leads.companyName}) = lower(${input.company_name})`);
    if (dupe) throw new ToolError(`"${input.company_name}" is already in the CRM (lead ${dupe.id}, stage ${dupe.stage}). Use update_lead instead.`);
    const { score, priority, breakdown } = computeScore(input.signals);
    const [row] = await db.insert(leads).values({
      companyName: input.company_name, industry: input.industry, website: input.website ?? null, socialProfiles: input.social_profiles,
      contactName: input.contact_name ?? null, contactRole: input.contact_role ?? null, email: input.email ?? null, phone: input.phone ?? null,
      location: input.location ?? null, servicesNeeded: input.services_needed, problemIdentified: input.problem_identified,
      estimatedValueMinor: input.estimated_value_ngn !== undefined ? Math.round(input.estimated_value_ngn * 100) : null,
      score, priority, scoreBreakdown: breakdown, recommendedApproach: input.recommended_approach, source: input.source,
      sourceUrls: input.source_urls, verifiedFacts: input.verified_facts, assumptions: input.assumptions, ownerAgent: ctx.agentSlug,
      campaignId: input.campaign_id ?? null, createdBy: `agent:${ctx.agentSlug}`,
    }).returning({ id: leads.id });
    await db.insert(interactions).values({ leadId: row.id, channel: "note", direction: "internal", summary: `Lead identified by ${ctx.agentSlug} (score ${score}, ${priority})`, content: input.problem_identified, actor: `agent:${ctx.agentSlug}` });
    ctx.produced.push({ type: "lead", id: row.id });
    return { lead_id: row.id, score, priority, breakdown };
  },
});

export const updateLead = defineTool({
  name: "update_lead",
  description: "Update a lead's stage, details, signals (re-scores) or notes. Stage changes are logged in the interaction history. Moving to 'won' requires a confirmed client decision recorded in notes.",
  governance: "autonomous",
  schema: z.object({
    lead_id: z.string().uuid(),
    stage: z.enum(LEAD_STAGES).optional(),
    note: z.string().optional().describe("Why the change was made (evidence)"),
    contact_name: z.string().optional(), contact_role: z.string().optional(), email: z.string().email().optional(), phone: z.string().optional(),
    estimated_value_ngn: z.number().nonnegative().optional(),
    recommended_approach: z.string().optional(),
    signals: signalsSchema.optional(),
    add_verified_facts: z.array(z.string()).default([]),
    add_assumptions: z.array(z.string()).default([]),
    add_source_urls: z.array(z.string().url()).default([]),
    lost_reason: z.string().optional(),
  }),
  async run(input, ctx) {
    const [lead] = await db.select().from(leads).where(eq(leads.id, input.lead_id));
    if (!lead) throw new ToolError("Lead not found");
    if (input.stage === "won" && !input.note) throw new ToolError("Provide a note with the evidence of the client's decision before marking won.");
    if (input.stage === "lost" && !input.lost_reason) throw new ToolError("Provide lost_reason when marking a lead lost.");
    const patch: Partial<typeof leads.$inferInsert> = { updatedAt: new Date() };
    if (input.stage && input.stage !== lead.stage) { patch.stage = input.stage; patch.stageChangedAt = new Date(); }
    for (const k of ["contact_name", "contact_role", "email", "phone", "recommended_approach", "lost_reason"] as const) {
      if (input[k] !== undefined) {
        const map = { contact_name: "contactName", contact_role: "contactRole", email: "email", phone: "phone", recommended_approach: "recommendedApproach", lost_reason: "lostReason" } as const;
        (patch as Record<string, unknown>)[map[k]] = input[k];
      }
    }
    if (input.estimated_value_ngn !== undefined) patch.estimatedValueMinor = Math.round(input.estimated_value_ngn * 100);
    if (input.signals) { const s = computeScore(input.signals); patch.score = s.score; patch.priority = s.priority; patch.scoreBreakdown = s.breakdown; }
    if (input.add_verified_facts.length) patch.verifiedFacts = [...lead.verifiedFacts, ...input.add_verified_facts];
    if (input.add_assumptions.length) patch.assumptions = [...lead.assumptions, ...input.add_assumptions];
    if (input.add_source_urls.length) patch.sourceUrls = [...new Set([...lead.sourceUrls, ...input.add_source_urls])];
    await db.update(leads).set(patch).where(eq(leads.id, lead.id));
    if (patch.stage || input.note) {
      await db.insert(interactions).values({ leadId: lead.id, channel: "note", direction: "internal", summary: patch.stage ? `Stage: ${lead.stage} → ${patch.stage}` : "Lead updated", content: input.note ?? null, actor: `agent:${ctx.agentSlug}` });
    }
    ctx.produced.push({ type: "lead", id: lead.id });
    return { lead_id: lead.id, stage: patch.stage ?? lead.stage, score: patch.score ?? lead.score };
  },
});

export const searchLeads = defineTool({
  name: "search_leads",
  description: "Search the CRM by company name/industry text, stage or priority. Always check before creating leads to avoid duplicates.",
  governance: "autonomous",
  schema: z.object({ text: z.string().optional(), stages: z.array(z.enum(LEAD_STAGES)).optional(), priority: z.enum(["hot", "warm", "cold"]).optional(), limit: z.number().int().max(50).default(20) }),
  async run(input) {
    const conds = [];
    if (input.text) conds.push(or(ilike(leads.companyName, `%${input.text}%`), ilike(leads.industry, `%${input.text}%`), ilike(leads.location, `%${input.text}%`)));
    if (input.stages?.length) conds.push(inArray(leads.stage, input.stages));
    if (input.priority) conds.push(eq(leads.priority, input.priority));
    return db.select({ id: leads.id, company: leads.companyName, industry: leads.industry, stage: leads.stage, score: leads.score, priority: leads.priority, email: leads.email, phone: leads.phone, website: leads.website, estimatedValueMinor: leads.estimatedValueMinor, updatedAt: leads.updatedAt })
      .from(leads).where(conds.length ? and(...conds) : undefined).orderBy(desc(leads.score)).limit(input.limit);
  },
});

export const getLeadHistory = defineTool({
  name: "get_lead_history",
  description: "Full lead profile with interaction history, open follow-ups and proposals.",
  governance: "autonomous",
  schema: z.object({ lead_id: z.string().uuid() }),
  async run(input) {
    const [lead] = await db.select().from(leads).where(eq(leads.id, input.lead_id));
    if (!lead) throw new ToolError("Lead not found");
    const [hist, fu, props] = await Promise.all([
      db.select().from(interactions).where(eq(interactions.leadId, lead.id)).orderBy(desc(interactions.occurredAt)).limit(30),
      db.select().from(followUps).where(and(eq(followUps.leadId, lead.id), eq(followUps.status, "open"))),
      db.select({ id: proposals.id, title: proposals.title, status: proposals.status, totalMinor: proposals.totalMinor }).from(proposals).where(eq(proposals.leadId, lead.id)),
    ]);
    return { lead, interactions: hist, open_follow_ups: fu, proposals: props };
  },
});

export const logInteraction = defineTool({
  name: "log_interaction",
  description: "Record an interaction (inbound message received, meeting notes, call summary) on a lead or client. Only log things that actually happened.",
  governance: "autonomous",
  schema: z.object({
    lead_id: z.string().uuid().optional(), client_id: z.string().uuid().optional(),
    channel: z.enum(["email", "whatsapp", "phone", "meeting", "social", "website", "note", "telegram", "other"]),
    direction: z.enum(["inbound", "outbound", "internal"]),
    summary: z.string().min(5), content: z.string().optional(),
  }),
  async run(input, ctx) {
    if (!input.lead_id && !input.client_id) throw new ToolError("Provide lead_id or client_id");
    if (input.direction === "outbound" && input.channel !== "note") throw new ToolError("Outbound messages are logged automatically when an approved send executes. Use request_send_email / request_send_whatsapp.");
    const [row] = await db.insert(interactions).values({ leadId: input.lead_id ?? null, clientId: input.client_id ?? null, channel: input.channel, direction: input.direction, summary: input.summary, content: input.content ?? null, actor: `agent:${ctx.agentSlug}` }).returning({ id: interactions.id });
    ctx.produced.push({ type: "interaction", id: row.id });
    return { interaction_id: row.id };
  },
});

export const scheduleFollowUp = defineTool({
  name: "schedule_follow_up",
  description: "Schedule a follow-up for a lead or client. When due, the responsible agent is reminded automatically and a task is created.",
  governance: "autonomous",
  schema: z.object({ lead_id: z.string().uuid().optional(), client_id: z.string().uuid().optional(), due_in_days: z.number().min(0.04).max(90), reason: z.string().min(5), agent: z.string().default("client-management") }),
  async run(input, ctx) {
    if (!input.lead_id && !input.client_id) throw new ToolError("Provide lead_id or client_id");
    const [row] = await db.insert(followUps).values({ leadId: input.lead_id ?? null, clientId: input.client_id ?? null, agentSlug: input.agent, dueAt: new Date(Date.now() + input.due_in_days * 86400_000), reason: input.reason, createdBy: `agent:${ctx.agentSlug}` }).returning({ id: followUps.id });
    ctx.produced.push({ type: "follow_up", id: row.id });
    return { follow_up_id: row.id };
  },
});

export const completeFollowUp = defineTool({
  name: "complete_follow_up",
  description: "Mark a follow-up done (after the follow-up action was taken or an approval was filed) or cancelled.",
  governance: "autonomous",
  schema: z.object({ follow_up_id: z.string().uuid(), outcome: z.enum(["done", "cancelled"]), note: z.string().min(5) }),
  async run(input, ctx) {
    const [fu] = await db.update(followUps).set({ status: input.outcome, completedAt: new Date() }).where(eq(followUps.id, input.follow_up_id)).returning();
    if (!fu) throw new ToolError("Follow-up not found");
    if (fu.leadId || fu.clientId) await db.insert(interactions).values({ leadId: fu.leadId, clientId: fu.clientId, channel: "note", direction: "internal", summary: `Follow-up ${input.outcome}: ${fu.reason}`, content: input.note, actor: `agent:${ctx.agentSlug}` });
    ctx.produced.push({ type: "follow_up", id: fu.id });
    return { follow_up_id: fu.id, status: fu.status };
  },
});

export const convertToClient = defineTool({
  name: "convert_lead_to_client",
  description: "Register a client after a lead is WON (client confirmed). Creates the client profile and links it to the lead.",
  governance: "autonomous",
  schema: z.object({ lead_id: z.string().uuid(), confirmation_note: z.string().min(10).describe("Evidence: who confirmed, how, when") }),
  async run(input, ctx) {
    const [lead] = await db.select().from(leads).where(eq(leads.id, input.lead_id));
    if (!lead) throw new ToolError("Lead not found");
    if (lead.clientId) return { client_id: lead.clientId, note: "Already converted" };
    const [c] = await db.insert(clients).values({ name: lead.companyName, industry: lead.industry, website: lead.website, primaryContact: lead.contactName, email: lead.email, phone: lead.phone, location: lead.location, leadId: lead.id, createdBy: `agent:${ctx.agentSlug}` }).returning({ id: clients.id });
    await db.update(leads).set({ stage: "won", stageChangedAt: lead.stage === "won" ? lead.stageChangedAt : new Date(), clientId: c.id, updatedAt: new Date() }).where(eq(leads.id, lead.id));
    await db.insert(interactions).values({ leadId: lead.id, clientId: c.id, channel: "note", direction: "internal", summary: "Converted to client", content: input.confirmation_note, actor: `agent:${ctx.agentSlug}` });
    ctx.produced.push({ type: "client", id: c.id });
    return { client_id: c.id };
  },
});

export const createProposal = defineTool({
  name: "create_proposal",
  description:
    "Draft a commercial proposal / quotation for a lead or client. Use owner-configured service prices from list_services where set; where a price is not configured, " +
    "set unit_price_ngn to your recommended figure AND say so in the body ('indicative — pending owner confirmation'). Returns a draft; sending requires approval.",
  governance: "autonomous",
  schema: z.object({
    lead_id: z.string().uuid().optional(), client_id: z.string().uuid().optional(),
    title: z.string().min(5), summary: z.string().min(10), body_markdown: z.string().min(100),
    line_items: z.array(z.object({ description: z.string(), quantity: z.number().positive(), unit_price_ngn: z.number().nonnegative() })).min(1),
    valid_days: z.number().int().min(1).max(90).default(14),
  }),
  async run(input, ctx) {
    if (!input.lead_id && !input.client_id) throw new ToolError("Provide lead_id or client_id");
    const items = input.line_items.map((l) => ({ description: l.description, quantity: l.quantity, unitPriceMinor: Math.round(l.unit_price_ngn * 100) }));
    const total = items.reduce((a, l) => a + Math.round(l.unitPriceMinor * l.quantity), 0);
    const validUntil = new Date(Date.now() + input.valid_days * 86400_000).toISOString().slice(0, 10);
    const [row] = await db.insert(proposals).values({ leadId: input.lead_id ?? null, clientId: input.client_id ?? null, title: input.title, summary: input.summary, body: input.body_markdown, lineItems: items, totalMinor: total, validUntil, createdBy: `agent:${ctx.agentSlug}` }).returning({ id: proposals.id });
    ctx.produced.push({ type: "proposal", id: row.id });
    return { proposal_id: row.id, total: formatMoney(total), status: "draft" };
  },
});

export const requestSendProposal = defineTool({
  name: "request_send_proposal",
  description: "Request approval to email a proposal to the prospect/client (Level 2). It is sent automatically once approved, the lead moves to 'Proposal Sent' and a follow-up is scheduled.",
  governance: "files_approval",
  schema: z.object({ proposal_id: z.string().uuid(), to: z.string().email(), subject: z.string().min(5), cover_message: z.string().min(30) }),
  async run(input, ctx) {
    const [p] = await db.select().from(proposals).where(eq(proposals.id, input.proposal_id));
    if (!p) throw new ToolError("Proposal not found");
    if (!["draft", "approved"].includes(p.status)) throw new ToolError(`Proposal is ${p.status}`);
    await db.update(proposals).set({ status: "awaiting_approval" }).where(eq(proposals.id, p.id));
    const a = await requestApproval({ actionType: "proposal.send", agentSlug: ctx.agentSlug, taskId: ctx.taskId, title: `Send proposal "${p.title}" to ${input.to}`, summary: `${formatMoney(p.totalMinor)} · ${p.summary ?? ""}`, payload: { proposalId: p.id, to: input.to, subject: input.subject, coverMessage: input.cover_message } });
    ctx.produced.push({ type: "approval", id: a.id });
    return { approval_id: a.id, status: "pending_approval" };
  },
});

export const requestSendEmail = defineTool({
  name: "request_send_email",
  description: "Request approval to send a personalised email to ONE prospect/client (Level 2). Only to publicly listed or client-provided addresses. Executes after approval and logs the interaction.",
  governance: "files_approval",
  schema: z.object({ to: z.string().email(), subject: z.string().min(3), body: z.string().min(30), lead_id: z.string().uuid().optional(), client_id: z.string().uuid().optional(), purpose: z.string().min(5) }),
  async run(input, ctx) {
    const a = await requestApproval({ actionType: "email.send", agentSlug: ctx.agentSlug, taskId: ctx.taskId, title: `Email ${input.to}: ${input.subject}`, summary: input.purpose, payload: { to: input.to, subject: input.subject, body: input.body, leadId: input.lead_id, clientId: input.client_id } });
    ctx.produced.push({ type: "approval", id: a.id });
    return { approval_id: a.id, status: "pending_approval" };
  },
});

export const requestBulkEmail = defineTool({
  name: "request_bulk_email",
  description: "Request approval to send the same email to multiple CRM leads (max 200). Recipients must be leads with emails in the CRM.",
  governance: "files_approval",
  schema: z.object({ lead_ids: z.array(z.string().uuid()).min(2).max(200), subject: z.string().min(3), body: z.string().min(30), purpose: z.string().min(5) }),
  async run(input, ctx) {
    const rows = await db.select({ id: leads.id, email: leads.email }).from(leads).where(inArray(leads.id, input.lead_ids));
    const recipients = rows.filter((r) => r.email).map((r) => ({ email: r.email as string, leadId: r.id }));
    if (!recipients.length) throw new ToolError("None of these leads have an email address.");
    const a = await requestApproval({ actionType: "email.bulk", agentSlug: ctx.agentSlug, taskId: ctx.taskId, title: `Bulk email (${recipients.length}): ${input.subject}`, summary: input.purpose, payload: { recipients, subject: input.subject, body: input.body } });
    ctx.produced.push({ type: "approval", id: a.id });
    return { approval_id: a.id, recipients: recipients.length, skipped_without_email: rows.length - recipients.length };
  },
});

export const requestSendWhatsApp = defineTool({
  name: "request_send_whatsapp",
  description: "Request approval to send a WhatsApp message (Level 2). For first contact outside a 24h customer window, Meta requires an approved template — provide template name/params.",
  governance: "files_approval",
  schema: z.object({ to: z.string().min(7), text: z.string().optional(), template: z.object({ name: z.string(), language: z.string().default("en"), params: z.array(z.string()).default([]) }).optional(), lead_id: z.string().uuid().optional(), purpose: z.string().min(5) }),
  async run(input, ctx) {
    if (!input.text && !input.template) throw new ToolError("Provide text or template");
    const a = await requestApproval({ actionType: "whatsapp.send", agentSlug: ctx.agentSlug, taskId: ctx.taskId, title: `WhatsApp ${input.to}`, summary: `${input.purpose}${input.text ? `: "${input.text.slice(0, 160)}"` : ""}`, payload: { to: input.to, text: input.text, template: input.template, leadId: input.lead_id } });
    ctx.produced.push({ type: "approval", id: a.id });
    return { approval_id: a.id, status: "pending_approval" };
  },
});

export const createProject = defineTool({
  name: "create_project",
  description: "Open a project for a client (or an internal Prohub project) once work is confirmed.",
  governance: "autonomous",
  schema: z.object({ client_id: z.string().uuid().optional(), is_internal: z.boolean().default(false), name: z.string().min(3), service_slug: z.string().optional(), description: z.string().min(10), lead_agent: z.string().optional(), budget_ngn: z.number().nonnegative().optional(), deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() }),
  async run(input, ctx) {
    if (!input.client_id && !input.is_internal) throw new ToolError("Client projects need client_id (or set is_internal for Prohub's own work)");
    const [row] = await db.insert(projects).values({ clientId: input.client_id ?? null, isInternal: input.is_internal, name: input.name, serviceSlug: input.service_slug ?? null, description: input.description, leadAgent: input.lead_agent ?? ctx.agentSlug, budgetMinor: input.budget_ngn !== undefined ? Math.round(input.budget_ngn * 100) : null, deadline: input.deadline ?? null, startDate: new Date().toISOString().slice(0, 10), status: "active", createdBy: `agent:${ctx.agentSlug}` }).returning({ id: projects.id });
    ctx.produced.push({ type: "project", id: row.id });
    return { project_id: row.id };
  },
});

export const updateProject = defineTool({
  name: "update_project",
  description: "Update project status/progress. Progress should reflect approved deliverables, not effort spent.",
  governance: "autonomous",
  schema: z.object({ project_id: z.string().uuid(), status: z.enum(["planning", "active", "in_review", "on_hold", "completed", "cancelled"]).optional(), progress_pct: z.number().int().min(0).max(100).optional(), note: z.string().optional() }),
  async run(input, ctx) {
    const [p] = await db.update(projects).set({ ...(input.status ? { status: input.status } : {}), ...(input.progress_pct !== undefined ? { progressPct: input.progress_pct } : {}), updatedAt: new Date() }).where(eq(projects.id, input.project_id)).returning();
    if (!p) throw new ToolError("Project not found");
    if (input.note && p.clientId) await db.insert(interactions).values({ clientId: p.clientId, channel: "note", direction: "internal", summary: `Project ${p.name}: ${input.status ?? "update"}`, content: input.note, actor: `agent:${ctx.agentSlug}` });
    ctx.produced.push({ type: "project", id: p.id });
    return { project_id: p.id, status: p.status, progress: p.progressPct };
  },
});

export const listProjects = defineTool({
  name: "list_projects",
  description: "List projects with client, status, deadline and progress.",
  governance: "autonomous",
  schema: z.object({ status: z.array(z.enum(["planning", "active", "in_review", "on_hold", "completed", "cancelled"])).optional() }),
  async run(input) {
    return db.select({ id: projects.id, name: projects.name, client: clients.name, status: projects.status, deadline: projects.deadline, progress: projects.progressPct, leadAgent: projects.leadAgent })
      .from(projects).leftJoin(clients, eq(clients.id, projects.clientId))
      .where(input.status?.length ? inArray(projects.status, input.status) : undefined).orderBy(projects.deadline).limit(50);
  },
});
