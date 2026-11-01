/**
 * Prohub AI OS — database schema (PostgreSQL / Supabase).
 *
 * Conventions
 * - Money is stored as integer minor units (kobo for NGN) in bigint columns, never floats.
 * - Every record an agent creates carries `createdBy` ("user:<id>", "agent:<slug>", "system", "webhook:<source>").
 * - Facts about third parties distinguish verified data (with source URLs) from assumptions.
 */
import { sql } from "drizzle-orm";
import {
  pgTable, text, integer, bigint, boolean, timestamp, jsonb, uuid, index, uniqueIndex, customType, real, date,
} from "drizzle-orm/pg-core";

const tsvector = customType<{ data: string }>({ dataType: () => "tsvector" });
const bytea = customType<{ data: Buffer; driverData: Buffer }>({ dataType: () => "bytea" });

const id = () => uuid("id").primaryKey().defaultRandom();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();
const money = (name: string) => bigint(name, { mode: "number" });

/* ───────────────────────────── Identity & access ───────────────────────────── */

export const users = pgTable("users", {
  id: id(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["owner", "manager", "viewer"] }).notNull().default("viewer"),
  active: boolean("active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("users_email_uq").on(sql`lower(${t.email})`)]);

export const sessions = pgTable("sessions", {
  id: id(),
  tokenHash: text("token_hash").notNull(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ip: text("ip"),
  userAgent: text("user_agent"),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("sessions_token_uq").on(t.tokenHash)]);

/* ───────────────────────────── Business configuration ───────────────────────────── */

/** Multi-business ready: every operational row could be scoped by businessId later. MVP runs one business. */
export const businesses = pgTable("businesses", {
  id: id(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  baseCurrency: text("base_currency").notNull().default("NGN"),
  timezone: text("timezone").notNull().default("Africa/Lagos"),
  settings: jsonb("settings").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: createdAt(),
});

export const services = pgTable("services", {
  id: id(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  summary: text("summary").notNull(),
  description: text("description"),
  deliverables: jsonb("deliverables").$type<string[]>().notNull().default([]),
  /** Owner-set indicative pricing. Null until the owner configures it — agents must not invent prices. */
  priceFromMinor: money("price_from_minor"),
  pricingModel: text("pricing_model", { enum: ["project", "retainer", "hourly", "package", "custom"] }).default("custom"),
  published: boolean("published").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const revenueTargets = pgTable("revenue_targets", {
  id: id(),
  periodType: text("period_type", { enum: ["month", "quarter"] }).notNull(),
  periodStart: date("period_start").notNull(),
  revenueTargetMinor: money("revenue_target_minor").notNull(),
  newClientsTarget: integer("new_clients_target"),
  avgDealValueMinor: money("avg_deal_value_minor"),
  retainerTargetMinor: money("retainer_target_minor"),
  marketingBudgetMinor: money("marketing_budget_minor"),
  leadTarget: integer("lead_target"),
  conversionTargetPct: real("conversion_target_pct"),
  createdBy: text("created_by").notNull(),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("revenue_targets_period_uq").on(t.periodType, t.periodStart)]);

/* ───────────────────────────── AI workforce ───────────────────────────── */

export const agents = pgTable("agents", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  department: text("department").notNull(),
  title: text("title").notNull(),
  status: text("status", { enum: ["active", "paused", "disabled"] }).notNull().default("active"),
  model: text("model").notNull(),
  effort: text("effort", { enum: ["low", "medium", "high", "xhigh", "max"] }).notNull().default("medium"),
  maxTurns: integer("max_turns").notNull().default(14),
  dailyBudgetUsd: real("daily_budget_usd").notNull().default(5),
  /** Owner-supplied extra instructions appended to the built-in job description. */
  extraInstructions: text("extra_instructions"),
  lastActiveAt: timestamp("last_active_at", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const commands = pgTable("commands", {
  id: id(),
  text: text("text").notNull(),
  issuedBy: uuid("issued_by").references(() => users.id),
  status: text("status", { enum: ["received", "planning", "executing", "completed", "failed", "cancelled"] }).notNull().default("received"),
  rootTaskId: uuid("root_task_id"),
  response: text("response"),
  /** Where the instruction came from and where progress/results are sent back. */
  channel: text("channel", { enum: ["dashboard", "whatsapp", "claude", "api"] }).notNull().default("dashboard"),
  replyTo: text("reply_to"),
  /** Files sent with the instruction (ids in `files`), shown to the Managing Director as images/documents. */
  attachments: jsonb("attachments").$type<string[]>().notNull().default([]),
  createdAt: createdAt(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const TASK_STATUSES = [
  "proposed", "approved", "queued", "in_progress", "awaiting_subtasks", "awaiting_approval",
  "completed", "failed", "rejected", "cancelled",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const tasks = pgTable("tasks", {
  id: id(),
  title: text("title").notNull(),
  instructions: text("instructions").notNull(),
  agentSlug: text("agent_slug").notNull().references(() => agents.slug),
  status: text("status", { enum: TASK_STATUSES }).notNull().default("proposed"),
  priority: integer("priority").notNull().default(3), // 1 = highest
  kind: text("kind", { enum: ["work", "review", "consolidate", "scheduled", "triage"] }).notNull().default("work"),
  parentTaskId: uuid("parent_task_id"),
  commandId: uuid("command_id").references(() => commands.id),
  projectId: uuid("project_id"),
  leadId: uuid("lead_id"),
  clientId: uuid("client_id"),
  depth: integer("depth").notNull().default(0),
  /** Tasks that must complete before this one is queued (orchestrator-enforced). */
  dependsOn: jsonb("depends_on").$type<string[]>().notNull().default([]),
  /** Working notes a manager agent leaves for itself before awaiting subtasks. */
  planNotes: text("plan_notes"),
  createdBy: text("created_by").notNull(),
  dueAt: timestamp("due_at", { withTimezone: true }),
  resultSummary: text("result_summary"),
  /** References to records the task produced: [{type, id}] — verified on completion. */
  outputs: jsonb("outputs").$type<{ type: string; id: string }[]>().notNull().default([]),
  verification: jsonb("verification").$type<{ verified: boolean; checked: number; missing: string[]; at: string } | null>(),
  error: text("error"),
  attempts: integer("attempts").notNull().default(0),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [
  index("tasks_agent_status_idx").on(t.agentSlug, t.status),
  index("tasks_parent_idx").on(t.parentTaskId),
  index("tasks_command_idx").on(t.commandId),
]);

export const agentRuns = pgTable("agent_runs", {
  id: id(),
  agentSlug: text("agent_slug").notNull().references(() => agents.slug),
  taskId: uuid("task_id").references(() => tasks.id),
  status: text("status", { enum: ["running", "succeeded", "failed", "halted"] }).notNull().default("running"),
  model: text("model").notNull(),
  turns: integer("turns").notNull().default(0),
  toolCalls: integer("tool_calls").notNull().default(0),
  inputTokens: integer("input_tokens").notNull().default(0),
  outputTokens: integer("output_tokens").notNull().default(0),
  cacheReadTokens: integer("cache_read_tokens").notNull().default(0),
  cacheWriteTokens: integer("cache_write_tokens").notNull().default(0),
  webSearches: integer("web_searches").notNull().default(0),
  costUsd: real("cost_usd").notNull().default(0),
  finalText: text("final_text"),
  transcript: jsonb("transcript").$type<unknown[]>().notNull().default([]),
  error: text("error"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
}, (t) => [index("agent_runs_agent_idx").on(t.agentSlug, t.startedAt)]);

/** Inter-agent communication channel routed through the orchestrator. */
export const agentMessages = pgTable("agent_messages", {
  id: id(),
  fromAgent: text("from_agent").notNull(),
  toAgent: text("to_agent").notNull(),
  taskId: uuid("task_id"),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: createdAt(),
}, (t) => [index("agent_messages_to_idx").on(t.toAgent, t.readAt)]);

/* ───────────────────────────── Knowledge & memory (RAG) ───────────────────────────── */

export const KNOWLEDGE_CATEGORIES = [
  "company_profile", "brand_guidelines", "services", "pricing", "past_project", "client_info", "proposal",
  "marketing_strategy", "creative_asset", "contract", "sop", "performance", "decision", "lesson", "other",
] as const;

export const knowledgeDocs = pgTable("knowledge_docs", {
  id: id(),
  category: text("category", { enum: KNOWLEDGE_CATEGORIES }).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  clientId: uuid("client_id"),
  /** Pinned docs are injected into every agent's context; others are retrieved on demand. */
  pinned: boolean("pinned").notNull().default(false),
  createdBy: text("created_by").notNull(),
  search: tsvector("search").generatedAlwaysAs(sql`to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,''))`),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("knowledge_search_idx").using("gin", t.search)]);

export const agentMemories = pgTable("agent_memories", {
  id: id(),
  agentSlug: text("agent_slug").notNull().references(() => agents.slug),
  kind: text("kind", { enum: ["lesson", "fact", "preference", "outcome"] }).notNull().default("lesson"),
  content: text("content").notNull(),
  importance: integer("importance").notNull().default(3),
  sourceTaskId: uuid("source_task_id"),
  search: tsvector("search").generatedAlwaysAs(sql`to_tsvector('english', coalesce(content,''))`),
  createdAt: createdAt(),
}, (t) => [index("agent_memories_search_idx").using("gin", t.search), index("agent_memories_agent_idx").on(t.agentSlug)]);

/* ───────────────────────────── CRM ───────────────────────────── */

export const LEAD_STAGES = [
  "new_lead", "contacted", "responded", "qualified", "meeting_scheduled", "proposal_sent", "negotiation", "won", "lost", "follow_up_required",
] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

export const leads = pgTable("leads", {
  id: id(),
  companyName: text("company_name").notNull(),
  industry: text("industry"),
  website: text("website"),
  socialProfiles: jsonb("social_profiles").$type<Record<string, string>>().notNull().default({}),
  contactName: text("contact_name"),
  contactRole: text("contact_role"),
  email: text("email"),
  phone: text("phone"),
  location: text("location"),
  servicesNeeded: jsonb("services_needed").$type<string[]>().notNull().default([]),
  problemIdentified: text("problem_identified"),
  /** Estimated opportunity value — an estimate, never revenue. */
  estimatedValueMinor: money("estimated_value_minor"),
  score: integer("score").notNull().default(0),
  priority: text("priority", { enum: ["hot", "warm", "cold"] }).notNull().default("cold"),
  scoreBreakdown: jsonb("score_breakdown").$type<Record<string, number>>().notNull().default({}),
  recommendedApproach: text("recommended_approach"),
  stage: text("stage", { enum: LEAD_STAGES }).notNull().default("new_lead"),
  source: text("source").notNull(), // e.g. "agent_research", "website_form", "whatsapp", "referral", "manual"
  campaignId: uuid("campaign_id"),
  sourceUrls: jsonb("source_urls").$type<string[]>().notNull().default([]),
  verifiedFacts: jsonb("verified_facts").$type<string[]>().notNull().default([]),
  assumptions: jsonb("assumptions").$type<string[]>().notNull().default([]),
  ownerAgent: text("owner_agent"),
  lostReason: text("lost_reason"),
  clientId: uuid("client_id"),
  createdBy: text("created_by").notNull(),
  identifiedAt: timestamp("identified_at", { withTimezone: true }).notNull().defaultNow(),
  stageChangedAt: timestamp("stage_changed_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [
  index("leads_stage_idx").on(t.stage),
  uniqueIndex("leads_company_uq").on(sql`lower(${t.companyName})`),
]);

export const clients = pgTable("clients", {
  id: id(),
  name: text("name").notNull(),
  industry: text("industry"),
  website: text("website"),
  primaryContact: text("primary_contact"),
  email: text("email"),
  phone: text("phone"),
  location: text("location"),
  leadId: uuid("lead_id"),
  status: text("status", { enum: ["active", "inactive", "churned"] }).notNull().default("active"),
  satisfaction: integer("satisfaction"), // 1-5, from recorded client feedback only
  notes: text("notes"),
  createdBy: text("created_by").notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const interactions = pgTable("interactions", {
  id: id(),
  leadId: uuid("lead_id"),
  clientId: uuid("client_id"),
  channel: text("channel", { enum: ["email", "whatsapp", "phone", "meeting", "social", "website", "note", "telegram", "other"] }).notNull(),
  direction: text("direction", { enum: ["inbound", "outbound", "internal"] }).notNull(),
  summary: text("summary").notNull(),
  content: text("content"),
  externalId: text("external_id"),
  actor: text("actor").notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: createdAt(),
}, (t) => [index("interactions_lead_idx").on(t.leadId), index("interactions_client_idx").on(t.clientId)]);

export const followUps = pgTable("follow_ups", {
  id: id(),
  leadId: uuid("lead_id"),
  clientId: uuid("client_id"),
  agentSlug: text("agent_slug").notNull(),
  dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
  reason: text("reason").notNull(),
  status: text("status", { enum: ["open", "done", "cancelled"] }).notNull().default("open"),
  remindedAt: timestamp("reminded_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdBy: text("created_by").notNull(),
  createdAt: createdAt(),
}, (t) => [index("follow_ups_due_idx").on(t.status, t.dueAt)]);

export const proposals = pgTable("proposals", {
  id: id(),
  leadId: uuid("lead_id"),
  clientId: uuid("client_id"),
  title: text("title").notNull(),
  summary: text("summary"),
  body: text("body").notNull(), // markdown
  lineItems: jsonb("line_items").$type<{ description: string; quantity: number; unitPriceMinor: number }[]>().notNull().default([]),
  totalMinor: money("total_minor").notNull().default(0),
  currency: text("currency").notNull().default("NGN"),
  status: text("status", { enum: ["draft", "awaiting_approval", "approved", "sent", "accepted", "rejected", "expired"] }).notNull().default("draft"),
  validUntil: date("valid_until"),
  createdBy: text("created_by").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/* ───────────────────────────── Projects & deliverables ───────────────────────────── */

export const projects = pgTable("projects", {
  id: id(),
  clientId: uuid("client_id"),
  name: text("name").notNull(),
  serviceSlug: text("service_slug"),
  description: text("description"),
  status: text("status", { enum: ["planning", "active", "in_review", "on_hold", "completed", "cancelled"] }).notNull().default("planning"),
  ownerName: text("owner_name"),
  leadAgent: text("lead_agent"),
  budgetMinor: money("budget_minor"),
  startDate: date("start_date"),
  deadline: date("deadline"),
  progressPct: integer("progress_pct").notNull().default(0),
  isInternal: boolean("is_internal").notNull().default(false),
  createdBy: text("created_by").notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const DELIVERABLE_KINDS = [
  "research_report", "market_analysis", "prospect_list", "campaign_plan", "content_strategy", "content_calendar",
  "copy", "script", "storyboard", "animation_brief", "design_concept", "design_svg", "image", "video", "landing_page",
  "proposal", "briefing", "report", "brand_guidelines", "other",
] as const;

export const deliverables = pgTable("deliverables", {
  id: id(),
  taskId: uuid("task_id"),
  projectId: uuid("project_id"),
  clientId: uuid("client_id"),
  leadId: uuid("lead_id"),
  agentSlug: text("agent_slug").notNull(),
  kind: text("kind", { enum: DELIVERABLE_KINDS }).notNull(),
  title: text("title").notNull(),
  format: text("format", { enum: ["markdown", "json", "svg", "html", "url"] }).notNull().default("markdown"),
  content: text("content").notNull(),
  fileUrl: text("file_url"),
  /** Rendered/uploaded files belonging to this deliverable (ids in `files`). */
  fileIds: jsonb("file_ids").$type<string[]>().notNull().default([]),
  platform: text("platform"),
  status: text("status", { enum: ["draft", "in_review", "approved", "changes_requested", "rejected", "published"] }).notNull().default("draft"),
  qc: jsonb("qc").$type<{ item: string; pass: boolean; note?: string }[]>().notNull().default([]),
  reviewNotes: text("review_notes"),
  clientApproval: text("client_approval", { enum: ["not_required", "pending", "approved", "changes_requested"] }).notNull().default("not_required"),
  version: integer("version").notNull().default(1),
  previousVersionId: uuid("previous_version_id"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("deliverables_task_idx").on(t.taskId), index("deliverables_project_idx").on(t.projectId)]);

/** Per-client brand asset library (logos, palettes, fonts, references). */
export const brandAssets = pgTable("brand_assets", {
  id: id(),
  clientId: uuid("client_id"), // null = Prohub's own brand
  kind: text("kind", { enum: ["logo", "palette", "typography", "imagery", "template", "guideline", "other"] }).notNull(),
  name: text("name").notNull(),
  value: text("value").notNull(), // hex list, font names, URL, or notes
  createdBy: text("created_by").notNull(),
  createdAt: createdAt(),
});

/* ───────────────────────────── Marketing ───────────────────────────── */

export const campaigns = pgTable("campaigns", {
  id: id(),
  name: text("name").notNull(),
  objective: text("objective", { enum: ["brand_awareness", "lead_generation", "customer_acquisition", "product_sales", "client_retention", "website_traffic", "community"] }).notNull(),
  channels: jsonb("channels").$type<string[]>().notNull().default([]),
  targetSegment: text("target_segment"),
  status: text("status", { enum: ["planning", "awaiting_approval", "active", "paused", "completed", "cancelled"] }).notNull().default("planning"),
  budgetMinor: money("budget_minor"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  planDeliverableId: uuid("plan_deliverable_id"),
  isInternal: boolean("is_internal").notNull().default(true),
  clientId: uuid("client_id"),
  createdBy: text("created_by").notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const SOCIAL_PLATFORMS = ["instagram", "facebook", "tiktok", "linkedin", "x", "youtube", "pinterest"] as const;

export const socialAccounts = pgTable("social_accounts", {
  id: id(),
  platform: text("platform", { enum: SOCIAL_PLATFORMS }).notNull(),
  handle: text("handle").notNull(),
  externalId: text("external_id"),
  connected: boolean("connected").notNull().default(false),
  followers: integer("followers"),
  followersUpdatedAt: timestamp("followers_updated_at", { withTimezone: true }),
  createdAt: createdAt(),
});

export const contentItems = pgTable("content_items", {
  id: id(),
  campaignId: uuid("campaign_id"),
  platform: text("platform", { enum: SOCIAL_PLATFORMS }).notNull(),
  format: text("format", { enum: ["post", "carousel", "reel", "short", "story", "video", "article", "thread", "pin"] }).notNull().default("post"),
  title: text("title").notNull(),
  caption: text("caption").notNull(),
  hashtags: jsonb("hashtags").$type<string[]>().notNull().default([]),
  mediaDeliverableId: uuid("media_deliverable_id"),
  mediaUrl: text("media_url"),
  objective: text("objective").notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  status: text("status", { enum: ["idea", "draft", "awaiting_approval", "approved", "scheduled", "published", "manual_publish", "failed"] }).notNull().default("draft"),
  externalPostId: text("external_post_id"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  /** Only populated from platform APIs or manual entry flagged with metricsSource. */
  metrics: jsonb("metrics").$type<Record<string, number>>().notNull().default({}),
  metricsSource: text("metrics_source"),
  error: text("error"),
  createdBy: text("created_by").notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("content_items_sched_idx").on(t.status, t.scheduledAt)]);

/* ───────────────────────────── Finance ───────────────────────────── */

export const invoices = pgTable("invoices", {
  id: id(),
  number: text("number").notNull().unique(),
  clientId: uuid("client_id").notNull(),
  projectId: uuid("project_id"),
  proposalId: uuid("proposal_id"),
  lineItems: jsonb("line_items").$type<{ description: string; quantity: number; unitPriceMinor: number; serviceSlug?: string }[]>().notNull().default([]),
  subtotalMinor: money("subtotal_minor").notNull(),
  taxMinor: money("tax_minor").notNull().default(0),
  totalMinor: money("total_minor").notNull(),
  amountPaidMinor: money("amount_paid_minor").notNull().default(0),
  currency: text("currency").notNull().default("NGN"),
  status: text("status", { enum: ["draft", "awaiting_approval", "sent", "partially_paid", "paid", "void"] }).notNull().default("draft"),
  issueDate: date("issue_date").notNull(),
  dueDate: date("due_date").notNull(),
  paymentLink: text("payment_link"),
  paymentReference: text("payment_reference"),
  createdBy: text("created_by").notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/**
 * The ledger. Agents can never insert here. Rows come from the owner/manager (manual entry),
 * verified payment-gateway webhooks, or imports from connected accounting systems.
 */
export const transactions = pgTable("transactions", {
  id: id(),
  type: text("type", { enum: ["income", "expense", "refund"] }).notNull(),
  amountMinor: money("amount_minor").notNull(),
  currency: text("currency").notNull().default("NGN"),
  /** Amount converted to base currency (NGN) at the recorded rate. */
  amountBaseMinor: money("amount_base_minor").notNull(),
  fxRate: real("fx_rate").notNull().default(1),
  category: text("category").notNull(), // e.g. "client_payment", "software", "ads", "salaries", "equipment"
  serviceSlug: text("service_slug"),
  clientId: uuid("client_id"),
  invoiceId: uuid("invoice_id"),
  projectId: uuid("project_id"),
  campaignId: uuid("campaign_id"),
  description: text("description").notNull(),
  source: text("source", { enum: ["manual", "paystack", "flutterwave", "import"] }).notNull(),
  externalReference: text("external_reference"),
  recordedBy: text("recorded_by").notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  createdAt: createdAt(),
}, (t) => [
  index("transactions_occurred_idx").on(t.occurredAt),
  uniqueIndex("transactions_ext_ref_uq").on(t.source, t.externalReference),
]);

/* ───────────────────────────── Intelligence ───────────────────────────── */

export const INTEL_CATEGORIES = [
  "industry_trend", "technology", "competitor", "potential_client", "business_opportunity", "revenue_opportunity",
  "marketing_recommendation", "operational_improvement",
] as const;

export const intelItems = pgTable("intel_items", {
  id: id(),
  category: text("category", { enum: INTEL_CATEGORIES }).notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  recommendation: text("recommendation"),
  /** The commercial opportunity for Prohub that follows from the findings. */
  opportunity: text("opportunity"),
  priority: text("priority", { enum: ["high", "medium", "low"] }).notNull().default("medium"),
  sourceUrls: jsonb("source_urls").$type<string[]>().notNull().default([]),
  confidence: text("confidence", { enum: ["verified", "likely", "assumption"] }).notNull(),
  /** For revenue opportunities: estimated cost / revenue / requirements / risks. */
  economics: jsonb("economics").$type<{ estCostMinor?: number; estRevenueMinor?: number; requirements?: string; risks?: string } | null>(),
  agentSlug: text("agent_slug").notNull(),
  taskId: uuid("task_id"),
  status: text("status", { enum: ["new", "actioned", "dismissed"] }).notNull().default("new"),
  createdAt: createdAt(),
}, (t) => [index("intel_items_created_idx").on(t.createdAt)]);

/* ───────────────────────────── Website (Prohub's own digital presence) ───────────────────────────── */

export const sitePages = pgTable("site_pages", {
  id: id(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  seoDescription: text("seo_description"),
  /** Structured sections rendered by trusted components — never raw HTML. */
  sections: jsonb("sections").$type<SiteSection[]>().notNull().default([]),
  status: text("status", { enum: ["draft", "awaiting_approval", "published", "archived"] }).notNull().default("draft"),
  campaignId: uuid("campaign_id"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdBy: text("created_by").notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export type SiteSection =
  | { type: "hero"; eyebrow?: string; heading: string; subheading?: string; ctaLabel?: string; ctaHref?: string }
  | { type: "features"; heading: string; items: { title: string; body: string }[] }
  | { type: "text"; heading?: string; body: string }
  | { type: "steps"; heading: string; items: { title: string; body: string }[] }
  | { type: "faq"; heading: string; items: { q: string; a: string }[] }
  | { type: "cta"; heading: string; body?: string; ctaLabel: string; ctaHref?: string }
  | { type: "lead_form"; heading: string; body?: string; serviceSlug?: string };

export const portfolioItems = pgTable("portfolio_items", {
  id: id(),
  title: text("title").notNull(),
  clientName: text("client_name"),
  serviceSlug: text("service_slug"),
  summary: text("summary").notNull(),
  results: text("results"),
  imageUrl: text("image_url"),
  /** Only owner-verified work is published. */
  published: boolean("published").notNull().default(false),
  createdAt: createdAt(),
});

export const testimonials = pgTable("testimonials", {
  id: id(),
  quote: text("quote").notNull(),
  author: text("author").notNull(),
  company: text("company"),
  /** Must be confirmed by the owner as a genuine, consented testimonial before display. */
  verified: boolean("verified").notNull().default(false),
  createdAt: createdAt(),
});

/* ───────────────────────────── Governance ───────────────────────────── */

export const approvals = pgTable("approvals", {
  id: id(),
  actionType: text("action_type").notNull(),
  level: integer("level").notNull(), // 2 = approval required, 3 = owner only
  agentSlug: text("agent_slug"),
  taskId: uuid("task_id"),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected", "executing", "executed", "failed", "expired"] }).notNull().default("pending"),
  decidedBy: uuid("decided_by"),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  decisionNote: text("decision_note"),
  executionResult: jsonb("execution_result").$type<Record<string, unknown> | null>(),
  error: text("error"),
  createdAt: createdAt(),
}, (t) => [index("approvals_status_idx").on(t.status)]);

export const activityLog = pgTable("activity_log", {
  id: id(),
  actorType: text("actor_type", { enum: ["user", "agent", "system", "webhook"] }).notNull(),
  actorId: text("actor_id").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type"),
  entityId: text("entity_id"),
  details: jsonb("details").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: createdAt(),
}, (t) => [index("activity_log_created_idx").on(t.createdAt), index("activity_log_entity_idx").on(t.entityType, t.entityId)]);

export const notifications = pgTable("notifications", {
  id: id(),
  kind: text("kind", { enum: ["approval", "alert", "report", "info"] }).notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  href: text("href"),
  readAt: timestamp("read_at", { withTimezone: true }),
  deliveredVia: jsonb("delivered_via").$type<string[]>().notNull().default([]),
  createdAt: createdAt(),
});

/* ───────────────────────────── Integrations, jobs & reports ───────────────────────────── */

export const integrationConfigs = pgTable("integration_configs", {
  slug: text("slug").primaryKey(),
  enabled: boolean("enabled").notNull().default(false),
  /** AES-256-GCM encrypted JSON of credential fields. */
  credentialsEncrypted: text("credentials_encrypted"),
  settings: jsonb("settings").$type<Record<string, unknown>>().notNull().default({}),
  lastTestedAt: timestamp("last_tested_at", { withTimezone: true }),
  lastTestOk: boolean("last_test_ok"),
  lastError: text("last_error"),
  updatedAt: updatedAt(),
});

export const jobs = pgTable("jobs", {
  id: id(),
  type: text("type").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
  status: text("status", { enum: ["queued", "running", "succeeded", "failed", "dead"] }).notNull().default("queued"),
  priority: integer("priority").notNull().default(5),
  runAt: timestamp("run_at", { withTimezone: true }).notNull().defaultNow(),
  attempts: integer("attempts").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(3),
  lockedAt: timestamp("locked_at", { withTimezone: true }),
  lockedBy: text("locked_by"),
  lastError: text("last_error"),
  dedupeKey: text("dedupe_key"),
  createdAt: createdAt(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
}, (t) => [
  index("jobs_claim_idx").on(t.status, t.runAt, t.priority),
  uniqueIndex("jobs_dedupe_uq").on(t.dedupeKey),
]);

export const schedules = pgTable("schedules", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  cron: text("cron").notNull(),
  timezone: text("timezone").notNull().default("Africa/Lagos"),
  jobType: text("job_type").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
  enabled: boolean("enabled").notNull().default(true),
  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  nextRunAt: timestamp("next_run_at", { withTimezone: true }),
});

export const reports = pgTable("reports", {
  id: id(),
  kind: text("kind", { enum: ["daily_briefing", "daily_finance", "weekly_business", "monthly_finance", "social_weekly", "social_monthly", "custom"] }).notNull(),
  title: text("title").notNull(),
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
  /** Numbers are computed from the database by code — never written by a model. */
  data: jsonb("data").$type<Record<string, unknown>>().notNull(),
  narrative: text("narrative"),
  generatedBy: text("generated_by").notNull(),
  createdAt: createdAt(),
}, (t) => [index("reports_kind_idx").on(t.kind, t.createdAt)]);

/* ───────────────────────────── Files, channels & API access ───────────────────────────── */

/**
 * Binary storage for rendered videos, report PDFs and media received over WhatsApp.
 * Stored in Postgres so the web app and the worker share it on any host; see docs/ARCHITECTURE.md
 * for moving large media to object storage.
 */
export const files = pgTable("files", {
  id: id(),
  name: text("name").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  data: bytea("data").notNull(),
  sha256: text("sha256").notNull(),
  /** Unguessable token for links sent outside the dashboard (e.g. WhatsApp media fetch). */
  publicToken: text("public_token").notNull(),
  source: text("source").notNull(), // "render", "whatsapp", "report", "upload"
  meta: jsonb("meta").$type<Record<string, unknown>>().notNull().default({}),
  createdBy: text("created_by").notNull(),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("files_public_token_uq").on(t.publicToken)]);

/** Phone numbers allowed to command the system over WhatsApp, each bound to a user (and so a role). */
export const authorizedSenders = pgTable("authorized_senders", {
  id: id(),
  channel: text("channel", { enum: ["whatsapp"] }).notNull().default("whatsapp"),
  /** E.164 digits only, e.g. 2348012345678 */
  address: text("address").notNull(),
  userId: uuid("user_id").notNull().references(() => users.id),
  label: text("label"),
  active: boolean("active").notNull().default(true),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("authorized_senders_uq").on(t.channel, t.address)]);

/** Personal access tokens for the Claude connector (MCP) and the HTTP API. Only a hash is stored. */
export const apiTokens = pgTable("api_tokens", {
  id: id(),
  userId: uuid("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  tokenHash: text("token_hash").notNull(),
  prefix: text("prefix").notNull(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("api_tokens_hash_uq").on(t.tokenHash)]);
