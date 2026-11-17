/**
 * Idempotent bootstrap: business, AI workforce, service catalogue, schedules, starter knowledge and the owner account.
 * Seeds NO operational data (leads, clients, transactions, metrics) — those come only from real activity.
 */
import { eq, sql } from "drizzle-orm";
import { getDb, closeDb } from "./client";
import { businesses, agents, services, schedules, knowledgeDocs, users, integrationConfigs, authorizedSenders } from "./schema";
import { AGENTS } from "@/agents/definitions";
import { DEFAULT_SCHEDULES, nextRun } from "@/orchestrator/scheduler";
import { DEFAULT_SETTINGS } from "@/services/settings";
import { INTEGRATIONS } from "@/integrations/registry";
import { hashPassword, randomToken } from "@/lib/crypto";
import { env } from "@/lib/env";
import { pathToFileURL } from "node:url";

export const SERVICE_CATALOGUE = [
  { slug: "brand-strategy-identity", name: "Brand Strategy & Identity", summary: "Positioning, naming, verbal identity and visual identity systems that make a business instantly recognisable.", deliverables: ["Brand audit", "Positioning & messaging framework", "Logo & identity system", "Brand guidelines"] },
  { slug: "graphic-design", name: "Graphic Design", summary: "Campaign visuals, marketing collateral, print and digital design produced to a consistent brand system.", deliverables: ["Social & ad creatives", "Brochures, flyers, posters", "Presentation design", "Stationery"] },
  { slug: "video-production-animation", name: "Video Production & Animation", summary: "Promotional films, product ads, motion graphics and animated brand content for every platform.", deliverables: ["Concept & script", "Storyboard", "Production & edit", "Platform cut-downs (9:16, 4:5, 16:9)"] },
  { slug: "digital-marketing", name: "Digital Marketing", summary: "Full-funnel digital marketing that turns attention into enquiries and sales.", deliverables: ["Marketing strategy", "Funnel & landing pages", "Email & WhatsApp marketing", "Analytics & reporting"] },
  { slug: "social-media-management", name: "Social Media Management", summary: "Always-on social presence: strategy, content calendars, publishing, community management and reporting.", deliverables: ["Monthly content strategy", "Content calendar & production", "Community management", "Monthly performance report"] },
  { slug: "content-creation", name: "Content Creation", summary: "Photography, short-form video, copy and carousels built around a clear commercial objective.", deliverables: ["Content pillars", "Short-form video", "Carousels & posts", "Brand storytelling"] },
  { slug: "website-design-development", name: "Website Design & Development", summary: "Fast, conversion-focused websites, landing pages and portals built on modern technology.", deliverables: ["UX & sitemap", "Design & build", "SEO foundations", "Analytics setup"] },
  { slug: "advertising-campaigns", name: "Advertising & Campaign Management", summary: "Paid campaigns across Meta, Google, TikTok and LinkedIn — planned, produced, launched and optimised.", deliverables: ["Campaign strategy", "Ad creative & copy", "Targeting & launch", "Optimisation & ROI reporting"] },
  { slug: "event-marketing-production", name: "Event Marketing & Production", summary: "Event branding, promotion and production that fills rooms and extends reach beyond the day.", deliverables: ["Event identity", "Promotional campaign", "On-site production", "Event recap content"] },
  { slug: "creative-consulting", name: "Creative Consulting", summary: "Senior creative and marketing direction for teams that need strategy, audits or a second opinion.", deliverables: ["Marketing & brand audits", "Creative direction", "Team workshops", "Roadmaps"] },
];

const COMPANY_PROFILE = `Prohub Creative Solutions is a creative agency based in Nigeria that also serves international clients.

Services: brand strategy and identity; graphic design; video production and animation; digital marketing; social media management; content creation; website design and development; advertising and campaign management; event marketing and production; creative consulting.

Primary market: Nigeria (Lagos and Abuja first), with capacity for international clients.
Commercial objective: consistent revenue through digital marketing, client acquisition, creative services, automation and effective client management.
Priority segments: SMEs, corporate organisations, hospitality, restaurants, hotels, event companies, entertainment brands, real estate, financial institutions, NGOs, government organisations, technology companies, international businesses.

[Owner: add founding year, team size, office address, notable past clients (with permission), differentiators and preferred tone of voice here. Agents treat this document as the source of truth.]`;

const BRAND_NOTE = `Prohub brand guidelines have not been uploaded yet.

Until they are: write in a confident, warm, plain-spoken voice; lead with business outcomes; avoid hype words and stock agency clichés. Visual work for Prohub should be clean, editorial and high-contrast with generous whitespace.

[Owner: replace with the official logo files, colour palette (hex), typefaces, tone of voice and do/don't examples.]`;

const SOP_OUTREACH = `Standard procedure: prospect outreach
1. Research: verify the business exists (website or official social page) and capture source URLs.
2. Audit: note 2–4 specific, observable weaknesses or opportunities (e.g. last Instagram post 5 months ago; website not mobile-friendly; no online booking).
3. Personalise: open with something specific to them, connect it to one outcome Prohub can deliver, propose one low-friction next step (15-minute call, free mini-audit, sample concept).
4. Channel: email when a business address is public; WhatsApp Business only where the business publicly invites WhatsApp contact; respect opt-outs.
5. Approval: all first-contact messages go through owner approval.
6. Follow-up: one follow-up after 3 days, a final one after 7 days, then move to Follow-up Required or Lost.`;

export async function seed(opts: { quiet?: boolean } = {}) {
  const db = getDb();
  const log = (...a: unknown[]) => { if (!opts.quiet) console.log(...a); };

  await db.insert(businesses).values({ slug: "prohub", name: "Prohub Creative Solutions", description: "Creative agency — Nigeria & international", settings: DEFAULT_SETTINGS })
    .onConflictDoNothing({ target: businesses.slug });

  for (const a of AGENTS) {
    await db.insert(agents).values({
      slug: a.slug, name: a.name, department: a.department, title: a.title, model: process.env.DEFAULT_AGENT_MODEL_FORCE === "true" ? env.defaultModel : a.defaultModel,
      effort: a.defaultEffort, maxTurns: a.maxTurns, dailyBudgetUsd: a.dailyBudgetUsd,
    }).onConflictDoUpdate({ target: agents.slug, set: { name: a.name, department: a.department, title: a.title, updatedAt: new Date() } });
  }

  for (const [i, s] of SERVICE_CATALOGUE.entries()) {
    await db.insert(services).values({ ...s, sortOrder: i, seoTitle: `${s.name} in Lagos & Nigeria | Prohub Creative Solutions`, seoDescription: s.summary })
      .onConflictDoNothing({ target: services.slug });
  }

  for (const s of DEFAULT_SCHEDULES) {
    await db.insert(schedules).values({ slug: s.slug, name: s.name, cron: s.cron, jobType: s.jobType, payload: s.payload ?? {}, timezone: env.timezone, nextRunAt: nextRun(s.cron, env.timezone) })
      .onConflictDoNothing({ target: schedules.slug });
  }

  for (const i of INTEGRATIONS) {
    await db.insert(integrationConfigs).values({ slug: i.slug, enabled: true }).onConflictDoNothing({ target: integrationConfigs.slug });
  }

  const [{ n: docCount }] = await db.select({ n: sql<number>`count(*)::int` }).from(knowledgeDocs);
  if (docCount === 0) {
    await db.insert(knowledgeDocs).values([
      { category: "company_profile", title: "Company profile", content: COMPANY_PROFILE, pinned: true, createdBy: "system:seed", tags: ["profile"] },
      { category: "brand_guidelines", title: "Prohub brand guidelines (placeholder)", content: BRAND_NOTE, pinned: true, createdBy: "system:seed", tags: ["brand"] },
      { category: "services", title: "Service catalogue", content: SERVICE_CATALOGUE.map((s) => `${s.name}: ${s.summary} Deliverables: ${s.deliverables.join(", ")}.`).join("\n"), pinned: true, createdBy: "system:seed", tags: ["services"] },
      { category: "pricing", title: "Pricing policy", content: "Indicative prices are configured per service by the owner in Settings → Services. Where no price is configured, agents may propose an indicative figure in drafts, clearly labelled 'indicative — pending owner confirmation'. Final prices are confirmed by the owner before any proposal is sent.", pinned: true, createdBy: "system:seed", tags: ["pricing"] },
      { category: "sop", title: "SOP: prospect outreach", content: SOP_OUTREACH, createdBy: "system:seed", tags: ["sales", "outreach"] },
    ]);
  }

  const [{ n: userCount }] = await db.select({ n: sql<number>`count(*)::int` }).from(users);
  if (userCount === 0) {
    const email = process.env.OWNER_EMAIL ?? "owner@prohub.local";
    const generated = !process.env.OWNER_PASSWORD;
    const password = process.env.OWNER_PASSWORD ?? randomToken(12);
    await db.insert(users).values({ email, name: process.env.OWNER_NAME ?? "Owner", passwordHash: await hashPassword(password), role: "owner" });
    log(`✓ owner account created: ${email}`);
    if (generated) log(`  generated password (shown once — change it after login): ${password}`);
  }

  // WhatsApp command centre: bind the numbers in WHATSAPP_OWNER_NUMBERS to the first owner account.
  const ownerNumbers = (process.env.WHATSAPP_OWNER_NUMBERS ?? "").split(",").map((n) => n.replace(/[^\d]/g, "")).filter((n) => n.length >= 8);
  if (ownerNumbers.length) {
    const [owner] = await db.select({ id: users.id }).from(users).where(eq(users.role, "owner")).orderBy(users.createdAt).limit(1);
    if (owner) {
      for (const address of ownerNumbers) {
        await db.insert(authorizedSenders).values({ channel: "whatsapp", address, userId: owner.id, label: "Owner (from WHATSAPP_OWNER_NUMBERS)" }).onConflictDoNothing();
      }
      log(`✓ ${ownerNumbers.length} authorised WhatsApp number(s) bound to the owner`);
    }
  }

  log(`✓ seed complete: ${AGENTS.length} agents, ${SERVICE_CATALOGUE.length} services, ${DEFAULT_SCHEDULES.length} schedules`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seed()
    .then(() => closeDb())
    .catch(async (e) => {
      console.error("Seed failed:", e);
      await closeDb();
      process.exit(1);
    });
}
