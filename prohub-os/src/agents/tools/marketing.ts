import { z } from "zod";
import { and, desc, eq, inArray, lte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { campaigns, contentItems, socialAccounts, sitePages, deliverables, brandAssets, invoices, clients, SOCIAL_PLATFORMS, type SiteSection } from "@/db/schema";
import { defineTool, ToolError } from "./types";
import { requestApproval } from "@/governance/approvals";
import { generateImage, generateVideo } from "@/integrations/creative";
import { isConfigured } from "@/integrations/registry";
import { formatMoney } from "@/lib/money";
import { slugify } from "@/lib/utils";
import { nextInvoiceNumber } from "@/services/finance";
import { ACTION_POLICY } from "@/governance/permissions";

/* ── Campaigns & content ────────────────────────────────────────────────── */

const OBJECTIVES = ["brand_awareness", "lead_generation", "customer_acquisition", "product_sales", "client_retention", "website_traffic", "community"] as const;

export const createCampaign = defineTool({
  name: "create_campaign",
  description: "Create a marketing campaign record (planning status) with a commercial objective, target segment, channels and proposed budget. Link the plan deliverable.",
  governance: "autonomous",
  schema: z.object({
    name: z.string().min(3), objective: z.enum(OBJECTIVES), channels: z.array(z.string()).min(1), target_segment: z.string().min(3),
    budget_ngn: z.number().nonnegative().optional(), start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    plan_deliverable_id: z.string().uuid().optional(), client_id: z.string().uuid().optional(),
  }),
  async run(input, ctx) {
    const [row] = await db.insert(campaigns).values({
      name: input.name, objective: input.objective, channels: input.channels, targetSegment: input.target_segment,
      budgetMinor: input.budget_ngn !== undefined ? Math.round(input.budget_ngn * 100) : null, startDate: input.start_date ?? null, endDate: input.end_date ?? null,
      planDeliverableId: input.plan_deliverable_id ?? null, clientId: input.client_id ?? null, isInternal: !input.client_id, createdBy: `agent:${ctx.agentSlug}`,
    }).returning({ id: campaigns.id });
    ctx.produced.push({ type: "campaign", id: row.id });
    return { campaign_id: row.id, status: "planning" };
  },
});

export const requestCampaignLaunch = defineTool({
  name: "request_campaign_launch",
  description: "Request approval to launch a campaign (Level 2). If it involves paid media, ALSO call request_owner_authorisation for the spend (Level 3) — launching never spends money automatically.",
  governance: "files_approval",
  schema: z.object({ campaign_id: z.string().uuid(), launch_summary: z.string().min(20) }),
  async run(input, ctx) {
    const [c] = await db.select().from(campaigns).where(eq(campaigns.id, input.campaign_id));
    if (!c) throw new ToolError("Campaign not found");
    await db.update(campaigns).set({ status: "awaiting_approval" }).where(eq(campaigns.id, c.id));
    const a = await requestApproval({ actionType: "campaign.launch", agentSlug: ctx.agentSlug, taskId: ctx.taskId, title: `Launch campaign "${c.name}"`, summary: `${input.launch_summary}${c.budgetMinor ? ` · Proposed budget ${formatMoney(c.budgetMinor)}` : ""}`, payload: { campaignId: c.id } });
    ctx.produced.push({ type: "approval", id: a.id });
    return { approval_id: a.id };
  },
});

export const createContentItem = defineTool({
  name: "create_content_item",
  description: "Add a post to the content calendar (draft). Every item needs a commercial objective. Attach a media deliverable or public media URL where available.",
  governance: "autonomous",
  schema: z.object({
    platform: z.enum(SOCIAL_PLATFORMS),
    format: z.enum(["post", "carousel", "reel", "short", "story", "video", "article", "thread", "pin"]).default("post"),
    title: z.string().min(3), caption: z.string().min(10), hashtags: z.array(z.string()).max(30).default([]),
    objective: z.enum(OBJECTIVES), scheduled_at: z.string().datetime({ offset: true }).optional().describe("ISO 8601 with timezone, e.g. 2026-11-04T18:00:00+01:00"),
    campaign_id: z.string().uuid().optional(), media_deliverable_id: z.string().uuid().optional(), media_url: z.string().url().optional(),
  }),
  async run(input, ctx) {
    const [row] = await db.insert(contentItems).values({
      platform: input.platform, format: input.format, title: input.title, caption: input.caption, hashtags: input.hashtags, objective: input.objective,
      scheduledAt: input.scheduled_at ? new Date(input.scheduled_at) : null, campaignId: input.campaign_id ?? null,
      mediaDeliverableId: input.media_deliverable_id ?? null, mediaUrl: input.media_url ?? null, createdBy: `agent:${ctx.agentSlug}`,
    }).returning({ id: contentItems.id });
    ctx.produced.push({ type: "content_item", id: row.id });
    return { content_item_id: row.id, status: "draft" };
  },
});

export const requestPublishContent = defineTool({
  name: "request_publish_content",
  description: "Request approval to publish content items (Level 2, one approval per item). After approval they publish via official APIs at their scheduled time, or move to the manual-publish queue where no API access exists.",
  governance: "files_approval",
  schema: z.object({ content_item_ids: z.array(z.string().uuid()).min(1).max(20) }),
  async run(input, ctx) {
    const items = await db.select().from(contentItems).where(inArray(contentItems.id, input.content_item_ids));
    const out: { content_item_id: string; approval_id: string }[] = [];
    for (const item of items) {
      if (!["draft", "approved", "failed"].includes(item.status)) continue;
      await db.update(contentItems).set({ status: "awaiting_approval" }).where(eq(contentItems.id, item.id));
      const a = await requestApproval({ actionType: "social.publish", agentSlug: ctx.agentSlug, taskId: ctx.taskId, title: `Publish ${item.platform} ${item.format}: ${item.title}`, summary: `${item.scheduledAt ? `Scheduled ${item.scheduledAt.toISOString()}` : "Publish on approval"} · ${item.caption.slice(0, 200)}`, payload: { contentItemId: item.id } });
      ctx.produced.push({ type: "approval", id: a.id });
      out.push({ content_item_id: item.id, approval_id: a.id });
    }
    if (!out.length) throw new ToolError("No eligible items (must be draft/approved/failed).");
    return { requested: out };
  },
});

export const contentCalendar = defineTool({
  name: "content_calendar",
  description: "View the content calendar between two dates plus social account status and any API-sourced performance metrics.",
  governance: "autonomous",
  schema: z.object({ from_days: z.number().default(-7), to_days: z.number().default(30) }),
  async run(input) {
    const from = new Date(Date.now() + input.from_days * 86400_000), to = new Date(Date.now() + input.to_days * 86400_000);
    const [items, accounts] = await Promise.all([
      db.select({ id: contentItems.id, platform: contentItems.platform, format: contentItems.format, title: contentItems.title, status: contentItems.status, scheduledAt: contentItems.scheduledAt, objective: contentItems.objective, metrics: contentItems.metrics, metricsSource: contentItems.metricsSource })
        .from(contentItems).where(sql`coalesce(${contentItems.scheduledAt}, ${contentItems.createdAt}) between ${from.toISOString()} and ${to.toISOString()}`).orderBy(contentItems.scheduledAt).limit(100),
      db.select().from(socialAccounts),
    ]);
    return { items, social_accounts: accounts, note: "Metrics appear only when sourced from a connected platform API or manual entry; never estimate engagement." };
  },
});

/* ── Creative production ───────────────────────────────────────────────── */

export const generateImageTool = defineTool({
  name: "generate_image",
  description: "Generate an image with the connected image model and store it as an 'image' deliverable. Write art-directed prompts (composition, lighting, palette, typography area, brand cues); avoid generic AI aesthetics.",
  governance: "autonomous",
  schema: z.object({ prompt: z.string().min(30), size: z.enum(["1024x1024", "1024x1536", "1536x1024"]).default("1024x1024"), title: z.string().min(3), platform: z.string().optional(), client_id: z.string().uuid().optional(), lead_id: z.string().uuid().optional() }),
  async run(input, ctx) {
    if (!(await isConfigured("openai_images"))) throw new ToolError("No image generation service is configured. Produce an SVG layout (save_deliverable format=svg) or a detailed design brief instead, and note the missing integration.");
    const img = await generateImage({ prompt: input.prompt, size: input.size });
    const [row] = await db.insert(deliverables).values({ taskId: ctx.taskId, agentSlug: ctx.agentSlug, kind: "image", title: input.title, format: "url", content: img.url ?? img.dataUrl ?? "", fileUrl: img.url ?? null, platform: input.platform ?? null, clientId: input.client_id ?? null, leadId: input.lead_id ?? null, status: "in_review", qc: [{ item: "Generated from art-directed prompt", pass: true, note: input.prompt.slice(0, 300) }] }).returning({ id: deliverables.id });
    ctx.produced.push({ type: "deliverable", id: row.id });
    return { deliverable_id: row.id };
  },
});

export const generateVideoTool = defineTool({
  name: "generate_video",
  description: "Submit a video generation job to the connected video provider using a finished script/storyboard. Stores a 'video' deliverable with the job ID or URL.",
  governance: "autonomous",
  schema: z.object({ prompt: z.string().min(40), aspect_ratio: z.enum(["9:16", "16:9", "1:1", "4:5"]), duration_seconds: z.number().int().min(3).max(60), title: z.string(), storyboard_deliverable_id: z.string().uuid().optional(), image_url: z.string().url().optional() }),
  async run(input, ctx) {
    if (!(await isConfigured("video_provider"))) throw new ToolError("No video generation provider is configured. Deliver the script, storyboard and animation brief as deliverables and note that rendering requires the video integration.");
    const v = await generateVideo({ prompt: input.prompt, aspectRatio: input.aspect_ratio, durationSeconds: input.duration_seconds, imageUrl: input.image_url });
    const [row] = await db.insert(deliverables).values({ taskId: ctx.taskId, agentSlug: ctx.agentSlug, kind: "video", title: input.title, format: "url", content: v.url ?? `provider-job:${v.jobId}`, fileUrl: v.url, platform: input.aspect_ratio, status: v.url ? "in_review" : "draft", qc: [{ item: `Provider status: ${v.status}`, pass: !!v.url }] }).returning({ id: deliverables.id });
    ctx.produced.push({ type: "deliverable", id: row.id });
    return { deliverable_id: row.id, provider_status: v.status, job_id: v.jobId };
  },
});

export const brandAssetsTool = defineTool({
  name: "brand_assets",
  description: "List or add entries in a client's brand asset library (null client = Prohub). Always load before designing for a client.",
  governance: "autonomous",
  schema: z.object({ action: z.enum(["list", "add"]), client_id: z.string().uuid().optional(), kind: z.enum(["logo", "palette", "typography", "imagery", "template", "guideline", "other"]).optional(), name: z.string().optional(), value: z.string().optional() }),
  async run(input, ctx) {
    if (input.action === "list") {
      return db.select().from(brandAssets).where(input.client_id ? eq(brandAssets.clientId, input.client_id) : sql`${brandAssets.clientId} is null`);
    }
    if (!input.kind || !input.name || !input.value) throw new ToolError("kind, name and value are required to add an asset");
    const [row] = await db.insert(brandAssets).values({ clientId: input.client_id ?? null, kind: input.kind, name: input.name, value: input.value, createdBy: `agent:${ctx.agentSlug}` }).returning({ id: brandAssets.id });
    return { brand_asset_id: row.id };
  },
});

/* ── Website ───────────────────────────────────────────────────────────── */

const sectionSchema: z.ZodType<SiteSection> = z.discriminatedUnion("type", [
  z.object({ type: z.literal("hero"), eyebrow: z.string().optional(), heading: z.string(), subheading: z.string().optional(), ctaLabel: z.string().optional(), ctaHref: z.string().optional() }),
  z.object({ type: z.literal("features"), heading: z.string(), items: z.array(z.object({ title: z.string(), body: z.string() })).min(1).max(9) }),
  z.object({ type: z.literal("text"), heading: z.string().optional(), body: z.string() }),
  z.object({ type: z.literal("steps"), heading: z.string(), items: z.array(z.object({ title: z.string(), body: z.string() })).min(2).max(8) }),
  z.object({ type: z.literal("faq"), heading: z.string(), items: z.array(z.object({ q: z.string(), a: z.string() })).min(1).max(12) }),
  z.object({ type: z.literal("cta"), heading: z.string(), body: z.string().optional(), ctaLabel: z.string(), ctaHref: z.string().optional() }),
  z.object({ type: z.literal("lead_form"), heading: z.string(), body: z.string().optional(), serviceSlug: z.string().optional() }),
]);

export const saveSitePage = defineTool({
  name: "save_site_page",
  description:
    "Create or update a landing/service page on Prohub's website as structured sections (rendered by the site's design system — no raw HTML). " +
    "Saves as draft; publishing requires request_page_publish. Include a lead_form section on conversion pages. Never invent testimonials, client logos or statistics.",
  governance: "autonomous",
  schema: z.object({ slug: z.string().optional(), title: z.string().min(3), seo_description: z.string().min(50).max(170), sections: z.array(sectionSchema).min(2).max(14), campaign_id: z.string().uuid().optional() }),
  async run(input, ctx) {
    const slug = slugify(input.slug || input.title);
    if (["os", "api", "login", "services", "work", "contact"].includes(slug)) throw new ToolError("Reserved slug");
    const [existing] = await db.select().from(sitePages).where(eq(sitePages.slug, slug));
    if (existing) {
      // Editing a live page creates a draft revision; the live version stays until approval.
      const status = existing.status === "published" ? "awaiting_approval" : "draft";
      await db.update(sitePages).set({ title: input.title, seoDescription: input.seo_description, sections: input.sections, status: existing.status === "published" ? existing.status : status, updatedAt: new Date() }).where(eq(sitePages.id, existing.id));
      ctx.produced.push({ type: "site_page", id: existing.id });
      return { page_id: existing.id, slug, status: existing.status, preview: `/p/${slug}?preview=1` };
    }
    const [row] = await db.insert(sitePages).values({ slug, title: input.title, seoDescription: input.seo_description, sections: input.sections, campaignId: input.campaign_id ?? null, createdBy: `agent:${ctx.agentSlug}` }).returning({ id: sitePages.id });
    ctx.produced.push({ type: "site_page", id: row.id });
    return { page_id: row.id, slug, status: "draft", preview: `/p/${slug}?preview=1` };
  },
});

export const requestPagePublish = defineTool({
  name: "request_page_publish",
  description: "Request approval to publish a site page or its changes (Level 2).",
  governance: "files_approval",
  schema: z.object({ page_id: z.string().uuid(), change_summary: z.string().min(10) }),
  async run(input, ctx) {
    const [p] = await db.select().from(sitePages).where(eq(sitePages.id, input.page_id));
    if (!p) throw new ToolError("Page not found");
    if (p.status !== "published") await db.update(sitePages).set({ status: "awaiting_approval" }).where(eq(sitePages.id, p.id));
    const a = await requestApproval({ actionType: "site_page.publish", agentSlug: ctx.agentSlug, taskId: ctx.taskId, title: `Publish page /p/${p.slug}`, summary: input.change_summary, payload: { pageId: p.id } });
    ctx.produced.push({ type: "approval", id: a.id });
    return { approval_id: a.id, preview: `/p/${p.slug}?preview=1` };
  },
});

export const requestRepoCommit = defineTool({
  name: "request_repo_commit",
  description: "For externally hosted (client) websites: request approval to commit a file (HTML/CSS/JS/MD) to the configured GitHub repository, optionally followed by a Vercel redeploy.",
  governance: "files_approval",
  schema: z.object({ path: z.string().min(1), content: z.string().min(1), message: z.string().min(5), redeploy: z.boolean().default(false) }),
  async run(input, ctx) {
    if (!(await isConfigured("github"))) throw new ToolError("GitHub integration is not configured. Save the code as a deliverable (format=html) instead.");
    const a = await requestApproval({ actionType: "github.commit", agentSlug: ctx.agentSlug, taskId: ctx.taskId, title: `Commit ${input.path}`, summary: input.message, payload: { path: input.path, content: input.content, message: input.message } });
    ctx.produced.push({ type: "approval", id: a.id });
    let deployApproval: string | undefined;
    if (input.redeploy && (await isConfigured("vercel"))) {
      const d = await requestApproval({ actionType: "vercel.deploy", agentSlug: ctx.agentSlug, taskId: ctx.taskId, title: "Redeploy website after commit", summary: input.message, payload: {} });
      deployApproval = d.id;
      ctx.produced.push({ type: "approval", id: d.id });
    }
    return { approval_id: a.id, deploy_approval_id: deployApproval };
  },
});

export const listSitePages = defineTool({
  name: "list_site_pages",
  description: "List Prohub website pages and their status.",
  governance: "autonomous",
  schema: z.object({}),
  async run() {
    return db.select({ id: sitePages.id, slug: sitePages.slug, title: sitePages.title, status: sitePages.status, updatedAt: sitePages.updatedAt }).from(sitePages).orderBy(desc(sitePages.updatedAt));
  },
});

/* ── Finance (agent-safe) ──────────────────────────────────────────────── */

export const draftInvoice = defineTool({
  name: "draft_invoice",
  description: "Draft an invoice for a client from agreed work (status draft). Agents cannot record payments or edit the ledger. Sending requires request_send_invoice.",
  governance: "autonomous",
  schema: z.object({ client_id: z.string().uuid(), project_id: z.string().uuid().optional(), proposal_id: z.string().uuid().optional(), line_items: z.array(z.object({ description: z.string(), quantity: z.number().positive(), unit_price_ngn: z.number().nonnegative(), service_slug: z.string().optional() })).min(1), vat_pct: z.number().min(0).max(25).default(0), due_in_days: z.number().int().min(0).max(120).default(14) }),
  async run(input, ctx) {
    const [c] = await db.select({ id: clients.id }).from(clients).where(eq(clients.id, input.client_id));
    if (!c) throw new ToolError("Client not found");
    const items = input.line_items.map((l) => ({ description: l.description, quantity: l.quantity, unitPriceMinor: Math.round(l.unit_price_ngn * 100), serviceSlug: l.service_slug }));
    const subtotal = items.reduce((a, l) => a + Math.round(l.unitPriceMinor * l.quantity), 0);
    const tax = Math.round((subtotal * input.vat_pct) / 100);
    const today = new Date();
    const [row] = await db.insert(invoices).values({ number: await nextInvoiceNumber(), clientId: c.id, projectId: input.project_id ?? null, proposalId: input.proposal_id ?? null, lineItems: items, subtotalMinor: subtotal, taxMinor: tax, totalMinor: subtotal + tax, issueDate: today.toISOString().slice(0, 10), dueDate: new Date(today.getTime() + input.due_in_days * 86400_000).toISOString().slice(0, 10), createdBy: `agent:${ctx.agentSlug}` }).returning({ id: invoices.id, number: invoices.number });
    ctx.produced.push({ type: "invoice", id: row.id });
    return { invoice_id: row.id, number: row.number, total: formatMoney(subtotal + tax) };
  },
});

export const requestSendInvoice = defineTool({
  name: "request_send_invoice",
  description: "Request approval to send an invoice to the client by email (Level 2), with a Paystack payment link when configured.",
  governance: "files_approval",
  schema: z.object({ invoice_id: z.string().uuid(), to: z.string().email().optional(), message: z.string().min(20) }),
  async run(input, ctx) {
    const [inv] = await db.select().from(invoices).where(eq(invoices.id, input.invoice_id));
    if (!inv) throw new ToolError("Invoice not found");
    if (inv.status === "draft") await db.update(invoices).set({ status: "awaiting_approval" }).where(eq(invoices.id, inv.id));
    const a = await requestApproval({ actionType: "invoice.send", agentSlug: ctx.agentSlug, taskId: ctx.taskId, title: `Send invoice ${inv.number} (${formatMoney(inv.totalMinor)})`, summary: input.message.slice(0, 300), payload: { invoiceId: inv.id, to: input.to, message: input.message } });
    ctx.produced.push({ type: "approval", id: a.id });
    return { approval_id: a.id };
  },
});

export const listInvoices = defineTool({
  name: "list_invoices",
  description: "List invoices with status, amounts paid and outstanding.",
  governance: "autonomous",
  schema: z.object({ statuses: z.array(z.enum(["draft", "awaiting_approval", "sent", "partially_paid", "paid", "void"])).optional(), overdue_only: z.boolean().default(false) }),
  async run(input) {
    const conds = [];
    if (input.statuses?.length) conds.push(inArray(invoices.status, input.statuses));
    if (input.overdue_only) conds.push(and(inArray(invoices.status, ["sent", "partially_paid"]), lte(invoices.dueDate, new Date().toISOString().slice(0, 10))));
    return db.select({ id: invoices.id, number: invoices.number, client: clients.name, status: invoices.status, totalMinor: invoices.totalMinor, paidMinor: invoices.amountPaidMinor, dueDate: invoices.dueDate })
      .from(invoices).leftJoin(clients, eq(clients.id, invoices.clientId)).where(conds.length ? and(...conds) : undefined).orderBy(desc(invoices.createdAt)).limit(50);
  },
});

export const requestOwnerAuthorisation = defineTool({
  name: "request_owner_authorisation",
  description: "Ask the OWNER to authorise a Level-3 action: spending money (ad budgets, tools, freelancers), contracts, refunds, financial record corrections, granting external access, deleting critical data. The system never executes these itself.",
  governance: "files_approval",
  schema: z.object({ action: z.enum(["spend.authorize", "contract.sign", "refund.issue", "finance.record_change", "access.grant", "data.delete_critical"]), title: z.string().min(5), justification: z.string().min(30), amount_ngn: z.number().nonnegative().optional(), expected_return: z.string().optional() }),
  async run(input, ctx) {
    const a = await requestApproval({ actionType: input.action, agentSlug: ctx.agentSlug, taskId: ctx.taskId, title: input.title, summary: `${input.justification}${input.amount_ngn ? ` · Amount: ${formatMoney(Math.round(input.amount_ngn * 100))}` : ""}${input.expected_return ? ` · Expected return: ${input.expected_return}` : ""}`, payload: { ...input } });
    ctx.produced.push({ type: "approval", id: a.id });
    return { approval_id: a.id, level: ACTION_POLICY[input.action].level };
  },
});

