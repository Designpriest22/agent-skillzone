import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { leads, interactions, followUps, proposals, deliverables, tasks, approvals } from "@/db/schema";
import { PageHeader, Panel, StatusBadge, KV, Badge, Field, inputClass, textareaClass, ErrorNote, Progress } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { moveLeadAction, addInteractionAction, scheduleFollowUpAction, submitCommandAction } from "../../../actions";
import { STAGE_LABEL } from "@/services/scoring";
import { LEAD_STAGES } from "@/db/schema";
import { formatMoney } from "@/lib/money";
import { formatDate, timeAgo } from "@/lib/utils";

export default async function LeadPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const [l] = await db.select().from(leads).where(eq(leads.id, id));
  if (!l) notFound();
  const [hist, fus, props, work, relatedTasks, appr] = await Promise.all([
    db.select().from(interactions).where(eq(interactions.leadId, id)).orderBy(desc(interactions.occurredAt)),
    db.select().from(followUps).where(eq(followUps.leadId, id)).orderBy(desc(followUps.dueAt)),
    db.select().from(proposals).where(eq(proposals.leadId, id)),
    db.select({ id: deliverables.id, title: deliverables.title, status: deliverables.status }).from(deliverables).where(eq(deliverables.leadId, id)),
    db.select({ id: tasks.id, title: tasks.title, status: tasks.status, agent: tasks.agentSlug }).from(tasks).where(eq(tasks.leadId, id)).orderBy(desc(tasks.createdAt)),
    db.select().from(approvals).orderBy(desc(approvals.createdAt)).limit(200),
  ]);
  const leadApprovals = appr.filter((a) => (a.payload as { leadId?: string }).leadId === id);
  const back = `/os/crm/leads/${id}`;
  return (
    <>
      <PageHeader title={l.companyName} subtitle={[l.industry, l.location, `source: ${l.source}`, `identified ${timeAgo(l.identifiedAt)} by ${l.createdBy}`].filter(Boolean).join(" · ")}
        actions={<><StatusBadge status={l.stage} /><Badge tone={l.priority === "hot" ? "bad" : l.priority === "warm" ? "warn" : "neutral"}>{l.priority} · {l.score}</Badge></>} />
      {sp.error && <div className="mb-3"><ErrorNote>{sp.error}</ErrorNote></div>}
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Panel title="Opportunity">
            <div className="space-y-3">
              {l.problemIdentified && <div><div className="text-[11.5px] font-medium uppercase tracking-[0.04em] text-fg-3">Identified problem</div><div>{l.problemIdentified}</div></div>}
              {l.recommendedApproach && <div><div className="text-[11.5px] font-medium uppercase tracking-[0.04em] text-fg-3">Recommended approach</div><div>{l.recommendedApproach}</div></div>}
              <div className="grid gap-3 md:grid-cols-2">
                <div><div className="mb-1 text-[11.5px] font-medium uppercase tracking-[0.04em] text-ok">Verified facts</div>{l.verifiedFacts.length ? <ul className="list-disc space-y-0.5 pl-4 text-[12.5px]">{l.verifiedFacts.map((f) => <li key={f}>{f}</li>)}</ul> : <div className="text-fg-3">None recorded</div>}</div>
                <div><div className="mb-1 text-[11.5px] font-medium uppercase tracking-[0.04em] text-warn">Assumptions</div>{l.assumptions.length ? <ul className="list-disc space-y-0.5 pl-4 text-[12.5px]">{l.assumptions.map((f) => <li key={f}>{f}</li>)}</ul> : <div className="text-fg-3">None recorded</div>}</div>
              </div>
              {l.sourceUrls.length > 0 && <div><div className="mb-1 text-[11.5px] font-medium uppercase tracking-[0.04em] text-fg-3">Sources</div><ul className="space-y-0.5 text-[12.5px]">{l.sourceUrls.map((u) => <li key={u}><a href={u} target="_blank" rel="noreferrer" className="break-all text-accent">{u}</a></li>)}</ul></div>}
            </div>
          </Panel>
          <Panel title="Contact history">
            <form action={addInteractionAction} className="mb-4 grid gap-2 md:grid-cols-[140px_140px_1fr_auto]">
              <input type="hidden" name="leadId" value={id} /><input type="hidden" name="back" value={back} />
              <select name="channel" className={inputClass}>{["note", "phone", "meeting", "email", "whatsapp", "social", "other"].map((c) => <option key={c}>{c}</option>)}</select>
              <select name="direction" className={inputClass}>{["internal", "inbound", "outbound"].map((c) => <option key={c}>{c}</option>)}</select>
              <input name="summary" required placeholder="What happened?" className={inputClass} />
              <SubmitButton size="sm" variant="secondary">Log</SubmitButton>
            </form>
            <ol className="space-y-3 border-l border-line pl-4">
              {hist.map((h) => <li key={h.id}><div className="flex flex-wrap items-center gap-2 text-[12px] text-fg-3"><Badge>{h.direction} · {h.channel}</Badge>{formatDate(h.occurredAt, true)} · {h.actor.slice(0, 32)}</div><div className="mt-0.5">{h.summary}</div>{h.content && <div className="mt-0.5 whitespace-pre-wrap text-[12.5px] text-fg-2">{h.content.slice(0, 1200)}</div>}</li>)}
            </ol>
          </Panel>
          {props.length > 0 && <Panel title="Proposals">{props.map((p) => <div key={p.id} className="flex justify-between border-b border-line py-1.5 last:border-0"><span>{p.title}</span><span className="flex items-center gap-2"><span className="num">{formatMoney(p.totalMinor)}</span><StatusBadge status={p.status} /></span></div>)}</Panel>}
        </div>
        <div className="space-y-4">
          <Panel title="Pipeline stage">
            <form action={moveLeadAction} className="space-y-2">
              <input type="hidden" name="leadId" value={id} /><input type="hidden" name="back" value={back} />
              <select name="stage" defaultValue={l.stage} className={inputClass}>{LEAD_STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}</select>
              <input name="note" placeholder="Reason / evidence (required for Lost)" className={inputClass} />
              <SubmitButton size="sm">Update stage</SubmitButton>
            </form>
          </Panel>
          <Panel title="Ask the workforce">
            <form action={submitCommandAction} className="space-y-2">
              <input type="hidden" name="text" value={`For lead ${l.companyName} (lead_id=${l.id}): research their current digital presence, prepare a tailored pitch with a sample content direction and visual concept, and request approval to send personalised outreach.`} />
              <div className="text-[12.5px] text-fg-2">Run the full prospecting pipeline for this lead: research → content direction → visual concept → personalised pitch → approval to send.</div>
              <SubmitButton size="sm" variant="secondary">Start pitch workflow</SubmitButton>
            </form>
          </Panel>
          <Panel title="Details">
            <KV rows={[
              { label: "Contact", value: [l.contactName, l.contactRole].filter(Boolean).join(", ") || "—" },
              { label: "Email", value: l.email ?? "—" }, { label: "Phone", value: l.phone ?? "—" },
              { label: "Website", value: l.website ? <a href={l.website} target="_blank" rel="noreferrer" className="text-accent">{l.website.replace(/^https?:\/\//, "")}</a> : "—" },
              ...Object.entries(l.socialProfiles).map(([k, v]) => ({ label: k, value: <a href={v} target="_blank" rel="noreferrer" className="break-all text-accent">{v}</a> })),
              { label: "Services", value: l.servicesNeeded.join(", ") || "—" },
              { label: "Est. value", value: formatMoney(l.estimatedValueMinor) },
              { label: "Follow-up status", value: fus.find((f) => f.status === "open") ? `due ${formatDate(fus.find((f) => f.status === "open")!.dueAt, true)}` : "none scheduled" },
            ]} />
          </Panel>
          <Panel title="Score breakdown">
            <div className="space-y-2">{Object.entries(l.scoreBreakdown).map(([k, v]) => <div key={k}><div className="flex justify-between text-[12px]"><span className="text-fg-2">{k}</span><span className="num">{v}</span></div><Progress value={(v / 25) * 100} /></div>)}</div>
          </Panel>
          <Panel title="Schedule follow-up">
            <form action={scheduleFollowUpAction} className="space-y-2">
              <input type="hidden" name="leadId" value={id} /><input type="hidden" name="back" value={back} />
              <Field label="Due"><input type="datetime-local" name="dueAt" required className={inputClass} /></Field>
              <Field label="Reason"><textarea name="reason" rows={2} required className={textareaClass} /></Field>
              <SubmitButton size="sm" variant="secondary">Schedule</SubmitButton>
            </form>
          </Panel>
          {(relatedTasks.length > 0 || work.length > 0 || leadApprovals.length > 0) && <Panel title="Related work"><ul className="space-y-1 text-[12.5px]">
            {relatedTasks.map((t) => <li key={t.id} className="flex justify-between gap-2"><Link href={`/os/tasks/${t.id}`} className="truncate hover:text-accent">{t.title}</Link><StatusBadge status={t.status} /></li>)}
            {work.map((w) => <li key={w.id} className="flex justify-between gap-2"><Link href={`/os/deliverables/${w.id}`} className="truncate hover:text-accent">{w.title}</Link><StatusBadge status={w.status} /></li>)}
            {leadApprovals.map((a) => <li key={a.id} className="flex justify-between gap-2"><Link href={`/os/approvals?focus=${a.id}`} className="truncate hover:text-accent">{a.title}</Link><StatusBadge status={a.status} /></li>)}
          </ul></Panel>}
        </div>
      </div>
    </>
  );
}
