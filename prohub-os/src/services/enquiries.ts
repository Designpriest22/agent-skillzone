/** Inbound enquiry intake shared by the website form, WhatsApp and social webhooks. */
import { eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { leads, interactions } from "@/db/schema";
import { scoreLead } from "./scoring";
import { createTask } from "@/orchestrator/tasks";
import { notifyOwner } from "./notify";
import { logActivity } from "@/lib/audit";

export type Enquiry = {
  name: string; company?: string | null; email?: string | null; phone?: string | null; message: string;
  serviceSlug?: string | null; channel: "website" | "whatsapp" | "social"; source: "website_form" | "whatsapp" | "social";
  pageSlug?: string | null; externalId?: string | null; campaignId?: string | null;
};

export async function intakeEnquiry(e: Enquiry) {
  const companyName = (e.company?.trim() || `${e.name.trim()} (individual)`).slice(0, 160);
  let [lead] = e.phone ? await db.select().from(leads).where(eq(leads.phone, e.phone)).limit(1) : [];
  if (!lead && e.email) [lead] = await db.select().from(leads).where(sql`lower(${leads.email}) = lower(${e.email})`).limit(1);
  if (!lead) [lead] = await db.select().from(leads).where(sql`lower(${leads.companyName}) = lower(${companyName})`).limit(1);
  const isNew = !lead;
  if (!lead) {
    const s = scoreLead({ inbound: true, verifiedContact: !!(e.email || e.phone), industryFit: false });
    [lead] = await db.insert(leads).values({
      companyName, contactName: e.name, email: e.email ?? null, phone: e.phone ?? null, source: e.source, campaignId: e.campaignId ?? null,
      servicesNeeded: e.serviceSlug ? [e.serviceSlug] : [], problemIdentified: e.message.slice(0, 1000), score: s.score, priority: s.priority, scoreBreakdown: s.breakdown,
      verifiedFacts: [`Contacted Prohub via ${e.channel}${e.pageSlug ? ` (page /p/${e.pageSlug})` : ""}`], createdBy: `webhook:${e.channel}`,
    }).returning();
  } else if (lead.stage === "lost" || lead.stage === "follow_up_required") {
    await db.update(leads).set({ stage: "responded", stageChangedAt: new Date(), updatedAt: new Date() }).where(eq(leads.id, lead.id));
  }
  await db.insert(interactions).values({ leadId: lead.id, channel: e.channel === "website" ? "website" : e.channel === "whatsapp" ? "whatsapp" : "social", direction: "inbound", summary: `Enquiry from ${e.name}${e.serviceSlug ? ` about ${e.serviceSlug}` : ""}`, content: e.message.slice(0, 5000), externalId: e.externalId ?? null, actor: `webhook:${e.channel}` });
  await createTask({
    agentSlug: "client-management", createdBy: `webhook:${e.channel}`, status: "approved", kind: "triage", priority: 1, leadId: lead.id,
    title: `New ${e.channel} enquiry: ${companyName}`,
    instructions: `A ${isNew ? "new" : "returning"} enquiry arrived via ${e.channel}.\nFrom: ${e.name}${e.company ? ` (${e.company})` : ""}${e.email ? `, ${e.email}` : ""}${e.phone ? `, ${e.phone}` : ""}\nService interest: ${e.serviceSlug ?? "not specified"}\nMessage: """${e.message.slice(0, 2000)}"""\n\nQualify it (update_lead with industry, signals and estimated value if you can infer them; research the company website if given), draft a fast, personal reply and request approval to send it on the same channel, and schedule a follow-up. If this is spam, mark the lead lost with the reason.`,
  });
  await notifyOwner({ kind: "info", title: `New enquiry: ${companyName}`, body: `${e.channel} · ${e.message.slice(0, 300)}`, href: `/os/crm/leads/${lead.id}`, whatsapp: true });
  await logActivity({ type: "webhook", id: e.channel }, "enquiry.received", { type: "lead", id: lead.id }, { isNew });
  return { leadId: lead.id, isNew };
}
