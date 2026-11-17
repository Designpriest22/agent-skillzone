import Link from "next/link";
import { asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { leads, clients, followUps, proposals, interactions, services, LEAD_STAGES } from "@/db/schema";
import { PageHeader, Panel, StatusBadge, Tabs, Table, Th, Td, Badge, Field, inputClass, textareaClass, ErrorNote, Empty } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { createLeadAction, moveLeadAction, completeFollowUpAction } from "../actions";
import { STAGE_LABEL } from "@/services/scoring";
import { formatMoney } from "@/lib/money";
import { timeAgo, formatDate } from "@/lib/utils";

export const metadata = { title: "CRM" };

function StageSelect({ id, stage, back }: { id: string; stage: string; back: string }) {
  return (
    <form action={moveLeadAction} className="flex items-center gap-1">
      <input type="hidden" name="leadId" value={id} /><input type="hidden" name="back" value={back} />
      <select name="stage" defaultValue={stage} className="h-6 rounded border border-line bg-panel px-1 text-[11.5px]">{LEAD_STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}</select>
      <button className="text-[11.5px] text-fg-3 hover:text-accent">Move</button>
    </form>
  );
}

export default async function CRM({ searchParams }: { searchParams: Promise<{ tab?: string; error?: string; q?: string }> }) {
  const sp = await searchParams;
  const tab = sp.tab ?? "pipeline";
  const [counts] = await db.select({
    leads: sql<number>`(select count(*)::int from leads)`, clients: sql<number>`(select count(*)::int from clients)`,
    fu: sql<number>`(select count(*)::int from follow_ups where status='open')`, props: sql<number>`(select count(*)::int from proposals)`,
  }).from(sql`(select 1) x`);
  const tabs = [
    { href: "/os/crm", label: "Pipeline", count: counts.leads }, { href: "/os/crm?tab=table", label: "Leads table" },
    { href: "/os/crm?tab=clients", label: "Clients", count: counts.clients }, { href: "/os/crm?tab=follow-ups", label: "Follow-ups", count: counts.fu },
    { href: "/os/crm?tab=proposals", label: "Proposals", count: counts.props }, { href: "/os/crm?tab=history", label: "Contact history" },
    { href: "/os/crm?tab=new", label: "Add lead" },
  ];
  const activeLabel = ({ pipeline: "Pipeline", table: "Leads table", clients: "Clients", "follow-ups": "Follow-ups", proposals: "Proposals", history: "Contact history", new: "Add lead" } as Record<string, string>)[tab] ?? "Pipeline";

  return (
    <>
      <PageHeader title="CRM" subtitle="Leads, clients, contact history and proposals. Estimated values are opportunity estimates, never revenue." />
      {sp.error && <div className="mb-3"><ErrorNote>{sp.error}</ErrorNote></div>}
      <Tabs tabs={tabs} active={activeLabel} />
      {tab === "pipeline" && <Pipeline />}
      {tab === "table" && <LeadsTable q={sp.q} />}
      {tab === "clients" && <Clients />}
      {tab === "follow-ups" && <FollowUps />}
      {tab === "proposals" && <Proposals />}
      {tab === "history" && <History />}
      {tab === "new" && <NewLead />}
    </>
  );
}

async function Pipeline() {
  const rows = await db.select().from(leads).orderBy(desc(leads.score)).limit(500);
  const cols = LEAD_STAGES;
  return (
    <div className="flex gap-3 overflow-x-auto pb-3">
      {cols.map((stage) => {
        const items = rows.filter((l) => l.stage === stage);
        const value = items.reduce((a, l) => a + (l.estimatedValueMinor ?? 0), 0);
        return (
          <div key={stage} className="w-[250px] shrink-0">
            <div className="mb-2 flex items-center justify-between px-1"><span className="text-[12px] font-semibold">{STAGE_LABEL[stage]} <span className="num text-fg-3">{items.length}</span></span><span className="num text-[11.5px] text-fg-3">{value ? formatMoney(value, "NGN", { compact: true }) : ""}</span></div>
            <div className="space-y-2 rounded-lg bg-panel-2 p-2" style={{ minHeight: 120 }}>
              {items.map((l) => (
                <div key={l.id} className="rounded-md border border-line bg-panel p-2.5">
                  <div className="flex items-start justify-between gap-2"><Link href={`/os/crm/leads/${l.id}`} className="font-medium leading-tight hover:text-accent">{l.companyName}</Link><Badge tone={l.priority === "hot" ? "bad" : l.priority === "warm" ? "warn" : "neutral"}>{l.score}</Badge></div>
                  <div className="mt-0.5 text-[11.5px] text-fg-3">{[l.industry, l.location].filter(Boolean).join(" · ")}</div>
                  {l.estimatedValueMinor ? <div className="num mt-1 text-[12px] text-fg-2">est. {formatMoney(l.estimatedValueMinor, "NGN", { compact: true })}</div> : null}
                  <div className="mt-1.5"><StageSelect id={l.id} stage={l.stage} back="/os/crm" /></div>
                </div>
              ))}
              {!items.length && <div className="py-6 text-center text-[12px] text-fg-3">—</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

async function LeadsTable({ q }: { q?: string }) {
  const rows = await db.select().from(leads).where(q ? sql`${leads.companyName} ilike ${"%" + q + "%"} or ${leads.industry} ilike ${"%" + q + "%"}` : undefined).orderBy(desc(leads.createdAt)).limit(300);
  return (
    <Panel pad={false} title={<form className="flex gap-2 normal-case"><input type="hidden" name="tab" value="table" /><input name="q" defaultValue={q} placeholder="Search company or industry" className={inputClass + " h-7 w-64"} /></form>}>
      <Table><thead><tr><Th>Company</Th><Th>Industry</Th><Th>Location</Th><Th>Stage</Th><Th className="text-right">Score</Th><Th>Contact</Th><Th className="text-right">Est. value</Th><Th>Source</Th><Th>Identified</Th></tr></thead><tbody>
        {rows.map((l) => (
          <tr key={l.id} className="hover:bg-panel-2">
            <Td><Link href={`/os/crm/leads/${l.id}`} className="font-medium hover:text-accent">{l.companyName}</Link>{l.website && <div className="max-w-[200px] truncate text-[11.5px] text-fg-3">{l.website}</div>}</Td>
            <Td className="text-fg-2">{l.industry ?? "—"}</Td><Td className="text-fg-2">{l.location ?? "—"}</Td><Td><StatusBadge status={l.stage} /></Td>
            <Td className="num text-right"><Badge tone={l.priority === "hot" ? "bad" : l.priority === "warm" ? "warn" : "neutral"}>{l.score}</Badge></Td>
            <Td className="text-[12px] text-fg-2">{l.email ?? l.phone ?? <span className="text-fg-3">not public</span>}</Td>
            <Td className="num text-right">{formatMoney(l.estimatedValueMinor)}</Td><Td className="text-fg-2">{l.source}</Td><Td className="whitespace-nowrap text-fg-3">{timeAgo(l.identifiedAt)}</Td>
          </tr>
        ))}
        {!rows.length && <tr><Td colSpan={9} className="py-8 text-center text-fg-3">No leads yet. Ask the Sales agent to prospect from the Command centre, or add one manually.</Td></tr>}
      </tbody></Table>
    </Panel>
  );
}

async function Clients() {
  const rows = await db.execute(sql`SELECT c.*, coalesce((SELECT sum(amount_base_minor) FROM transactions t WHERE t.client_id = c.id AND t.type='income'),0)::bigint AS ltv,
    (SELECT count(*) FROM projects p WHERE p.client_id = c.id)::int AS projects FROM clients c ORDER BY c.created_at DESC`);
  const list = rows as unknown as { id: string; name: string; industry: string | null; email: string | null; phone: string | null; status: string; ltv: string; projects: number; created_at: string }[];
  return (
    <Panel pad={false}><Table><thead><tr><Th>Client</Th><Th>Industry</Th><Th>Contact</Th><Th>Status</Th><Th className="text-right">Projects</Th><Th className="text-right">Lifetime revenue</Th><Th>Since</Th></tr></thead><tbody>
      {list.map((c) => <tr key={c.id}><Td className="font-medium">{c.name}</Td><Td className="text-fg-2">{c.industry ?? "—"}</Td><Td className="text-fg-2">{c.email ?? c.phone ?? "—"}</Td><Td><StatusBadge status={c.status} /></Td><Td className="num text-right">{c.projects}</Td><Td className="num text-right">{formatMoney(Number(c.ltv))}</Td><Td className="text-fg-3">{formatDate(c.created_at)}</Td></tr>)}
      {!list.length && <tr><Td colSpan={7} className="py-8 text-center text-fg-3">No clients yet. Leads become clients when marked Won.</Td></tr>}
    </tbody></Table></Panel>
  );
}

async function FollowUps() {
  const rows = await db.select({ f: followUps, company: leads.companyName, client: clients.name }).from(followUps).leftJoin(leads, eq(leads.id, followUps.leadId)).leftJoin(clients, eq(clients.id, followUps.clientId)).where(eq(followUps.status, "open")).orderBy(asc(followUps.dueAt)).limit(200);
  return (
    <Panel pad={false}><Table><thead><tr><Th>Due</Th><Th>Lead / client</Th><Th>Reason</Th><Th>Responsible</Th><Th /></tr></thead><tbody>
      {rows.map(({ f, company, client }) => (
        <tr key={f.id}><Td className={`whitespace-nowrap ${f.dueAt < new Date() ? "text-bad" : ""}`}>{formatDate(f.dueAt, true)}{f.dueAt < new Date() && <div className="text-[11.5px]">overdue</div>}</Td>
          <Td>{f.leadId ? <Link href={`/os/crm/leads/${f.leadId}`} className="hover:text-accent">{company}</Link> : client}</Td><Td className="max-w-[420px] text-fg-2">{f.reason}</Td><Td className="text-fg-2">{f.agentSlug}{f.remindedAt && <div className="text-[11.5px] text-fg-3">task created</div>}</Td>
          <Td><form action={completeFollowUpAction} className="flex gap-1"><input type="hidden" name="id" value={f.id} /><SubmitButton size="sm" variant="secondary" name="status" value="done">Done</SubmitButton><SubmitButton size="sm" variant="ghost" name="status" value="cancelled">Cancel</SubmitButton></form></Td></tr>
      ))}
      {!rows.length && <tr><Td colSpan={5} className="py-8 text-center text-fg-3">No open follow-ups.</Td></tr>}
    </tbody></Table></Panel>
  );
}

async function Proposals() {
  const rows = await db.select({ p: proposals, company: leads.companyName, client: clients.name }).from(proposals).leftJoin(leads, eq(leads.id, proposals.leadId)).leftJoin(clients, eq(clients.id, proposals.clientId)).orderBy(desc(proposals.createdAt)).limit(200);
  return (
    <div className="space-y-3">
      {rows.map(({ p, company, client }) => (
        <Panel key={p.id} title={<span className="normal-case tracking-normal text-fg">{p.title}</span>} actions={<StatusBadge status={p.status} />}>
          <div className="mb-2 flex flex-wrap gap-4 text-[12.5px] text-fg-2"><span>{company ?? client}</span><span className="num">{formatMoney(p.totalMinor, p.currency)}</span><span>by {p.createdBy}</span>{p.validUntil && <span>valid until {p.validUntil}</span>}{p.sentAt && <span>sent {formatDate(p.sentAt)}</span>}</div>
          <details><summary className="cursor-pointer text-[12.5px] text-accent">View proposal</summary><div className="mt-2 whitespace-pre-wrap text-[13px]">{p.body}</div>
            <ul className="mt-2 text-[12.5px]">{p.lineItems.map((l, i) => <li key={i}>• {l.description} × {l.quantity} — {formatMoney(l.unitPriceMinor * l.quantity, p.currency)}</li>)}</ul></details>
        </Panel>
      ))}
      {!rows.length && <Empty title="No proposals yet">The Client Management agent drafts proposals; sending them requires your approval.</Empty>}
    </div>
  );
}

async function History() {
  const rows = await db.select({ i: interactions, company: leads.companyName, client: clients.name }).from(interactions).leftJoin(leads, eq(leads.id, interactions.leadId)).leftJoin(clients, eq(clients.id, interactions.clientId)).orderBy(desc(interactions.occurredAt)).limit(200);
  return (
    <Panel pad={false}><Table><thead><tr><Th>When</Th><Th>Who</Th><Th>Channel</Th><Th>Summary</Th><Th>By</Th></tr></thead><tbody>
      {rows.map(({ i, company, client }) => <tr key={i.id}><Td className="whitespace-nowrap text-fg-3">{formatDate(i.occurredAt, true)}</Td><Td>{i.leadId ? <Link className="hover:text-accent" href={`/os/crm/leads/${i.leadId}`}>{company}</Link> : client}</Td><Td><Badge>{i.direction} · {i.channel}</Badge></Td><Td className="max-w-[460px]">{i.summary}</Td><Td className="text-fg-3">{i.actor.split(":").slice(0, 2).join(":").slice(0, 28)}</Td></tr>)}
      {!rows.length && <tr><Td colSpan={5} className="py-8 text-center text-fg-3">No interactions recorded.</Td></tr>}
    </tbody></Table></Panel>
  );
}

async function NewLead() {
  const svc = await db.select({ slug: services.slug, name: services.name }).from(services).orderBy(services.sortOrder);
  return (
    <Panel title="Add a lead manually" className="max-w-3xl">
      <form action={createLeadAction} className="grid gap-3 md:grid-cols-2">
        <Field label="Company name"><input name="companyName" required className={inputClass} /></Field>
        <Field label="Industry"><input name="industry" className={inputClass} /></Field>
        <Field label="Website"><input name="website" type="url" className={inputClass} /></Field>
        <Field label="Location"><input name="location" className={inputClass} placeholder="Lagos" /></Field>
        <Field label="Contact name"><input name="contactName" className={inputClass} /></Field>
        <Field label="Email"><input name="email" type="email" className={inputClass} /></Field>
        <Field label="Phone / WhatsApp"><input name="phone" className={inputClass} /></Field>
        <Field label="Estimated value (₦)"><input name="estimatedValue" className={inputClass} /></Field>
        <Field label="Source"><select name="source" className={inputClass}>{["manual", "referral", "event", "website_form", "whatsapp", "social"].map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Services needed"><select name="services" multiple className={inputClass + " h-24"}>{svc.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}</select></Field>
        <Field label="Notes / identified need" className="md:col-span-2"><textarea name="notes" rows={3} className={textareaClass} /></Field>
        <div className="md:col-span-2"><SubmitButton>Add lead</SubmitButton></div>
      </form>
    </Panel>
  );
}
