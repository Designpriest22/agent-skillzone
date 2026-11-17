import Link from "next/link";
import { desc, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/db/client";
import { approvals, proposals, contentItems, sitePages, invoices } from "@/db/schema";
import { PageHeader, Panel, StatusBadge, Badge, textareaClass, ErrorNote, Tabs, Empty } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { approvalDecisionAction } from "../actions";
import { ACTION_POLICY } from "@/governance/permissions";
import { timeAgo, formatDate } from "@/lib/utils";
import { formatMoney } from "@/lib/money";
import { requireUser } from "@/lib/auth";
import { canApprove } from "@/governance/permissions";

export const metadata = { title: "Approvals" };

async function Preview({ a }: { a: typeof approvals.$inferSelect }) {
  const p = a.payload as Record<string, unknown>;
  const block = (label: string, v: unknown) => v ? <div><div className="text-[11.5px] font-medium uppercase tracking-[0.04em] text-fg-3">{label}</div><div className="whitespace-pre-wrap break-words text-[13px]">{String(v)}</div></div> : null;
  if (a.actionType === "email.send") return <div className="space-y-2">{block("To", p.to)}{block("Subject", p.subject)}{block("Body", p.body)}</div>;
  if (a.actionType === "email.bulk") return <div className="space-y-2">{block("Recipients", (p.recipients as { email: string }[]).map((r) => r.email).join(", "))}{block("Subject", p.subject)}{block("Body", p.body)}</div>;
  if (a.actionType === "whatsapp.send") return <div className="space-y-2">{block("To", p.to)}{block("Message", p.text)}{p.template ? block("Template", JSON.stringify(p.template)) : null}</div>;
  if (a.actionType === "proposal.send") {
    const [pr] = await db.select().from(proposals).where(eq(proposals.id, String(p.proposalId)));
    return <div className="space-y-2">{block("To", p.to)}{block("Subject", p.subject)}{block("Cover message", p.coverMessage)}{pr && <>{block("Proposal", `${pr.title} — ${formatMoney(pr.totalMinor, pr.currency)}`)}{block("Line items", pr.lineItems.map((l) => `• ${l.description} × ${l.quantity} @ ${formatMoney(l.unitPriceMinor)}`).join("\n"))}<details><summary className="cursor-pointer text-[12.5px] text-fg-2">Full proposal body</summary><div className="mt-1 whitespace-pre-wrap text-[12.5px]">{pr.body}</div></details></>}</div>;
  }
  if (a.actionType === "social.publish") {
    const [c] = await db.select().from(contentItems).where(eq(contentItems.id, String(p.contentItemId)));
    return c ? <div className="space-y-2">{block("Platform", `${c.platform} · ${c.format}${c.scheduledAt ? ` · scheduled ${formatDate(c.scheduledAt, true)}` : ""}`)}{block("Caption", c.caption)}{block("Hashtags", c.hashtags.join(" "))}{c.mediaDeliverableId && <Link className="text-accent" href={`/os/deliverables/${c.mediaDeliverableId}`}>View media deliverable</Link>}</div> : <div className="text-fg-3">Content item deleted</div>;
  }
  if (a.actionType === "site_page.publish") {
    const [pg] = await db.select().from(sitePages).where(eq(sitePages.id, String(p.pageId)));
    return pg ? <div className="space-y-2">{block("Page", `/p/${pg.slug} — ${pg.title}`)}<Link className="text-accent" href={`/p/${pg.slug}?preview=1`} target="_blank">Preview draft ↗</Link></div> : null;
  }
  if (a.actionType === "invoice.send") {
    const [inv] = await db.select().from(invoices).where(eq(invoices.id, String(p.invoiceId)));
    return <div className="space-y-2">{inv && block("Invoice", `${inv.number} — ${formatMoney(inv.totalMinor, inv.currency)} due ${inv.dueDate}`)}{block("To", p.to ?? "client email on file")}{block("Message", p.message)}</div>;
  }
  return <pre className="max-h-64 overflow-auto rounded bg-panel-2 p-2 text-[11.5px]">{JSON.stringify(p, null, 2)}</pre>;
}

export default async function ApprovalsPage({ searchParams }: { searchParams: Promise<{ tab?: string; focus?: string; error?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const tab = sp.tab === "history" ? "history" : "pending";
  const rows = tab === "pending"
    ? await db.select().from(approvals).where(inArray(approvals.status, ["pending", "failed"])).orderBy(desc(approvals.level), desc(approvals.createdAt))
    : await db.select().from(approvals).where(ne(approvals.status, "pending")).orderBy(desc(approvals.createdAt)).limit(100);
  const pendingCount = (await db.select({ id: approvals.id }).from(approvals).where(eq(approvals.status, "pending"))).length;
  return (
    <>
      <PageHeader title="Approvals" subtitle="Level 2 actions need owner or manager approval; Level 3 actions need the owner. Nothing external happens until you approve." />
      {sp.error && <div className="mb-3"><ErrorNote>{sp.error}</ErrorNote></div>}
      <Tabs active={tab === "pending" ? "Needs attention" : "History"} tabs={[{ href: "/os/approvals", label: "Needs attention", count: pendingCount }, { href: "/os/approvals?tab=history", label: "History" }]} />
      <div className="space-y-3">
        {rows.map((a) => (
          <Panel key={a.id} className={sp.focus === a.id ? "ring-2 ring-accent" : ""}
            title={<span className="flex items-center gap-2 normal-case tracking-normal"><Badge tone={a.level === 3 ? "bad" : "warn"}>{a.level === 3 ? "L3 · owner only" : "L2"}</Badge><span className="text-[13.5px] font-semibold text-fg">{a.title}</span></span>}
            actions={<StatusBadge status={a.status} />}>
            <div className="grid gap-4 md:grid-cols-[1fr_280px]">
              <div className="space-y-3">
                <div className="text-[12.5px] text-fg-2">{ACTION_POLICY[a.actionType]?.label} · requested by {a.agentSlug ?? "system"} {timeAgo(a.createdAt)}{a.taskId && <> · <Link className="text-accent" href={`/os/tasks/${a.taskId}`}>originating task</Link></>}</div>
                <div className="text-[13px]">{a.summary}</div>
                <Preview a={a} />
                {a.error && <ErrorNote>Execution failed: {a.error}</ErrorNote>}
                {a.executionResult && <pre className="max-h-40 overflow-auto rounded bg-panel-2 p-2 text-[11.5px]">{JSON.stringify(a.executionResult, null, 2)}</pre>}
                {a.decisionNote && <div className="text-[12.5px] text-fg-2">Decision note: {a.decisionNote}</div>}
              </div>
              <div>
                {a.status === "pending" && (canApprove(user.role, a.level) ? (
                  <form action={approvalDecisionAction} className="space-y-2">
                    <input type="hidden" name="approvalId" value={a.id} />
                    <textarea name="note" rows={2} placeholder="Note (optional; shared with the agent)" className={textareaClass} />
                    <div className="flex gap-2"><SubmitButton name="decision" value="approve" confirm={a.level === 3 ? "Authorise this owner-level action?" : undefined}>Approve</SubmitButton><SubmitButton variant="secondary" name="decision" value="reject">Reject</SubmitButton></div>
                  </form>
                ) : <div className="text-[12.5px] text-fg-3">Your role ({user.role}) cannot decide this action.</div>)}
                {a.status === "failed" && <form action={approvalDecisionAction}><input type="hidden" name="approvalId" value={a.id} /><SubmitButton variant="secondary" name="decision" value="retry">Retry execution</SubmitButton></form>}
              </div>
            </div>
          </Panel>
        ))}
        {!rows.length && <Empty title={tab === "pending" ? "Nothing needs your approval" : "No history yet"} />}
      </div>
    </>
  );
}
