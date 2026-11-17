/**
 * Executors for governed (L2/L3) actions. These run only after a human approves,
 * via the `approval.execute` job. Each executor records what actually happened.
 */
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { approvals, leads, interactions, followUps, proposals, invoices, contentItems, sitePages, campaigns, clients } from "@/db/schema";
import { sendEmail } from "@/integrations/email";
import { sendWhatsApp } from "@/integrations/whatsapp";
import { publishToPlatform } from "@/integrations/social";
import { createPaymentLink } from "@/integrations/paystack";
import { commitFileToGitHub, triggerVercelDeploy } from "@/integrations/creative";
import { isConfigured } from "@/integrations/registry";
import { logActivity } from "@/lib/audit";
import { formatMoney } from "@/lib/money";
import { env } from "@/lib/env";
import { errMessage } from "@/lib/utils";
import { notifyOwner } from "@/services/notify";

type Approval = typeof approvals.$inferSelect;
type P = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));

async function markContacted(leadId: string | undefined, channel: "email" | "whatsapp", summary: string, content: string, actor: string) {
  if (!leadId) return;
  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
  if (!lead) return;
  await db.insert(interactions).values({ leadId, channel, direction: "outbound", summary, content, actor });
  if (lead.stage === "new_lead" || lead.stage === "follow_up_required") {
    await db.update(leads).set({ stage: "contacted", stageChangedAt: new Date(), updatedAt: new Date() }).where(eq(leads.id, leadId));
  }
  await db.insert(followUps).values({
    leadId, agentSlug: "client-management", dueAt: new Date(Date.now() + 3 * 86400_000),
    reason: `No-reply check after ${channel} outreach: "${summary.slice(0, 80)}"`, createdBy: "system",
  });
}

const executors: Record<string, (p: P, a: Approval) => Promise<Record<string, unknown>>> = {
  async "email.send"(p, a) {
    const res = await sendEmail({ to: str(p.to), subject: str(p.subject), text: str(p.body) });
    await markContacted(p.leadId as string | undefined, "email", str(p.subject), str(p.body), `approval:${a.id}`);
    if (p.clientId) await db.insert(interactions).values({ clientId: str(p.clientId), channel: "email", direction: "outbound", summary: str(p.subject), content: str(p.body), actor: `approval:${a.id}` });
    return res;
  },

  async "email.bulk"(p, a) {
    const recipients = (p.recipients as { email: string; leadId?: string }[]) ?? [];
    const results: { to: string; ok: boolean; error?: string }[] = [];
    for (const r of recipients.slice(0, 200)) {
      try {
        await sendEmail({ to: r.email, subject: str(p.subject), text: str(p.body) });
        await markContacted(r.leadId, "email", str(p.subject), str(p.body), `approval:${a.id}`);
        results.push({ to: r.email, ok: true });
      } catch (e) {
        results.push({ to: r.email, ok: false, error: errMessage(e) });
      }
      await new Promise((r) => setTimeout(r, 400)); // gentle pacing for SMTP providers
    }
    return { sent: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length, results };
  },

  async "whatsapp.send"(p, a) {
    const res = await sendWhatsApp({ to: str(p.to), text: p.text as string | undefined, template: p.template as { name: string; language: string; params?: string[] } | undefined });
    await markContacted(p.leadId as string | undefined, "whatsapp", "WhatsApp outreach", str(p.text ?? (p.template as { name?: string })?.name), `approval:${a.id}`);
    return res;
  },

  async "proposal.send"(p, a) {
    const [prop] = await db.select().from(proposals).where(eq(proposals.id, str(p.proposalId)));
    if (!prop) throw new Error("Proposal no longer exists");
    const body = `${str(p.coverMessage)}\n\n---\n\n${prop.body}\n\nTotal: ${formatMoney(prop.totalMinor, prop.currency)}${prop.validUntil ? `\nValid until: ${prop.validUntil}` : ""}`;
    const res = await sendEmail({ to: str(p.to), subject: str(p.subject) || prop.title, text: body });
    await db.update(proposals).set({ status: "sent", sentAt: new Date(), updatedAt: new Date() }).where(eq(proposals.id, prop.id));
    if (prop.leadId) {
      await db.insert(interactions).values({ leadId: prop.leadId, channel: "email", direction: "outbound", summary: `Proposal sent: ${prop.title}`, content: body, actor: `approval:${a.id}` });
      await db.update(leads).set({ stage: "proposal_sent", stageChangedAt: new Date(), updatedAt: new Date() }).where(eq(leads.id, prop.leadId));
      await db.insert(followUps).values({ leadId: prop.leadId, agentSlug: "client-management", dueAt: new Date(Date.now() + 4 * 86400_000), reason: `Follow up on proposal "${prop.title}"`, createdBy: "system" });
    }
    return { ...res, proposalId: prop.id };
  },

  async "invoice.send"(p, a) {
    const [inv] = await db.select().from(invoices).where(eq(invoices.id, str(p.invoiceId)));
    if (!inv) throw new Error("Invoice no longer exists");
    const [client] = await db.select().from(clients).where(eq(clients.id, inv.clientId));
    const to = str(p.to) || client?.email || "";
    if (!to) throw new Error("No recipient email for invoice");
    let link = inv.paymentLink;
    if (!link && (await isConfigured("paystack")) && inv.currency === "NGN") {
      const pl = await createPaymentLink({ email: to, amountMinor: inv.totalMinor - inv.amountPaidMinor, reference: `${inv.number}-${Date.now()}`, invoiceId: inv.id, callbackUrl: `${env.appUrl}/` });
      link = pl.url;
      await db.update(invoices).set({ paymentLink: pl.url, paymentReference: pl.reference }).where(eq(invoices.id, inv.id));
    }
    const lines = inv.lineItems.map((l) => `• ${l.description} × ${l.quantity} — ${formatMoney(l.unitPriceMinor * l.quantity, inv.currency)}`).join("\n");
    const text = `${str(p.message)}\n\nInvoice ${inv.number}\n${lines}\n\nTotal due: ${formatMoney(inv.totalMinor - inv.amountPaidMinor, inv.currency)}\nDue date: ${inv.dueDate}${link ? `\n\nPay securely: ${link}` : ""}`;
    const res = await sendEmail({ to, subject: `Invoice ${inv.number} from Prohub Creative Solutions`, text });
    await db.update(invoices).set({ status: inv.status === "draft" || inv.status === "awaiting_approval" ? "sent" : inv.status, updatedAt: new Date() }).where(eq(invoices.id, inv.id));
    await db.insert(interactions).values({ clientId: inv.clientId, channel: "email", direction: "outbound", summary: `Invoice ${inv.number} sent`, content: text, actor: `approval:${a.id}` });
    return { ...res, paymentLink: link };
  },

  async "social.publish"(p) {
    const [item] = await db.select().from(contentItems).where(eq(contentItems.id, str(p.contentItemId)));
    if (!item) throw new Error("Content item no longer exists");
    if (item.scheduledAt && item.scheduledAt.getTime() > Date.now() + 60_000) {
      await db.update(contentItems).set({ status: "scheduled", updatedAt: new Date() }).where(eq(contentItems.id, item.id));
      return { scheduled: item.scheduledAt.toISOString() };
    }
    return publishContentItem(item.id);
  },

  async "site_page.publish"(p) {
    const [page] = await db.update(sitePages).set({ status: "published", publishedAt: new Date(), updatedAt: new Date() }).where(eq(sitePages.id, str(p.pageId))).returning();
    if (!page) throw new Error("Page no longer exists");
    return { url: `${env.appUrl}/p/${page.slug}` };
  },

  async "campaign.launch"(p) {
    const [c] = await db.update(campaigns).set({ status: "active", updatedAt: new Date() }).where(eq(campaigns.id, str(p.campaignId))).returning();
    if (!c) throw new Error("Campaign no longer exists");
    const note = c.budgetMinor ? "Paid media spend is NOT executed automatically — ad budget requires a separate owner spend authorisation and is placed manually in the ad platform." : undefined;
    return { campaignId: c.id, status: c.status, note };
  },

  async "github.commit"(p) {
    return commitFileToGitHub({ path: str(p.path), content: str(p.content), message: str(p.message) || "Update from Prohub Web Development agent" });
  },

  async "vercel.deploy"() {
    return (await triggerVercelDeploy()) as Record<string, unknown>;
  },
};

/** L3 decisions are authorisations, not automated transfers: the system never moves money itself. */
const OWNER_AUTHORISATIONS = ["spend.authorize", "contract.sign", "refund.issue", "finance.record_change", "access.grant", "data.delete_critical"];

export async function publishContentItem(id: string) {
  const [item] = await db.select().from(contentItems).where(eq(contentItems.id, id));
  if (!item) throw new Error("Content item not found");
  try {
    const res = await publishToPlatform({ platform: item.platform, caption: item.caption, hashtags: item.hashtags, mediaUrl: item.mediaUrl });
    if (res.mode === "api") {
      await db.update(contentItems).set({ status: "published", externalPostId: res.externalId, publishedAt: new Date(), error: null, updatedAt: new Date() }).where(eq(contentItems.id, id));
      return { published: true, externalId: res.externalId };
    }
    await db.update(contentItems).set({ status: "manual_publish", error: res.reason, updatedAt: new Date() }).where(eq(contentItems.id, id));
    return { published: false, manual: true, reason: res.reason };
  } catch (e) {
    await db.update(contentItems).set({ status: "failed", error: errMessage(e), updatedAt: new Date() }).where(eq(contentItems.id, id));
    throw e;
  }
}

export async function executeApproval(approvalId: string) {
  const [a] = await db.select().from(approvals).where(eq(approvals.id, approvalId));
  if (!a) throw new Error("Approval not found");
  if (a.status !== "approved" && a.status !== "failed") return { skipped: `status is ${a.status}` };
  await db.update(approvals).set({ status: "executing" }).where(eq(approvals.id, a.id));
  try {
    let result: Record<string, unknown>;
    if (OWNER_AUTHORISATIONS.includes(a.actionType)) {
      result = { authorised: true, note: "Authorisation recorded. Execute the financial/legal step manually; record resulting transactions in Finance." };
    } else {
      const exec = executors[a.actionType];
      if (!exec) throw new Error(`No executor for ${a.actionType}`);
      result = await exec(a.payload, a);
    }
    await db.update(approvals).set({ status: "executed", executionResult: result, error: null }).where(eq(approvals.id, a.id));
    await logActivity({ type: "system", id: "executor" }, "approval.executed", { type: "approval", id: a.id }, { actionType: a.actionType, result });
    return result;
  } catch (e) {
    const msg = errMessage(e);
    await db.update(approvals).set({ status: "failed", error: msg }).where(eq(approvals.id, a.id));
    await logActivity({ type: "system", id: "executor" }, "approval.failed", { type: "approval", id: a.id }, { actionType: a.actionType, error: msg });
    await notifyOwner({ kind: "alert", title: `Approved action failed: ${a.title}`, body: `${msg}\n\nFix the cause (often a missing integration) and press Retry on the approval.`, href: `/os/approvals?focus=${a.id}` });
    throw e;
  }
}

/** When a human rejects, revert the governed record to an editable state so agents can revise. */
export async function rejectGovernedRecord(a: Approval) {
  const p = a.payload;
  if (a.actionType === "proposal.send" && p.proposalId) await db.update(proposals).set({ status: "draft" }).where(eq(proposals.id, str(p.proposalId)));
  if (a.actionType === "social.publish" && p.contentItemId) await db.update(contentItems).set({ status: "draft" }).where(eq(contentItems.id, str(p.contentItemId)));
  if (a.actionType === "site_page.publish" && p.pageId) await db.update(sitePages).set({ status: "draft" }).where(eq(sitePages.id, str(p.pageId)));
  if (a.actionType === "campaign.launch" && p.campaignId) await db.update(campaigns).set({ status: "planning" }).where(eq(campaigns.id, str(p.campaignId)));
  if (a.actionType === "invoice.send" && p.invoiceId) await db.update(invoices).set({ status: "draft" }).where(eq(invoices.id, str(p.invoiceId)));
}
