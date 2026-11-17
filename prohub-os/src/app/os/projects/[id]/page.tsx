import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { projects, clients, deliverables, tasks, invoices } from "@/db/schema";
import { PageHeader, Panel, StatusBadge, KV, inputClass, textareaClass, Table, Th, Td, Progress } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { updateProjectAction, submitCommandAction } from "../../actions";
import { formatMoney } from "@/lib/money";
import { timeAgo } from "@/lib/utils";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [p] = await db.select().from(projects).where(eq(projects.id, id));
  if (!p) notFound();
  const [client] = p.clientId ? await db.select().from(clients).where(eq(clients.id, p.clientId)) : [];
  const [dels, ts, invs] = await Promise.all([
    db.select().from(deliverables).where(eq(deliverables.projectId, id)).orderBy(desc(deliverables.createdAt)),
    db.select().from(tasks).where(eq(tasks.projectId, id)).orderBy(desc(tasks.createdAt)),
    db.select().from(invoices).where(eq(invoices.projectId, id)),
  ]);
  return (
    <>
      <PageHeader title={p.name} subtitle={`${client?.name ?? "Internal"} · ${p.serviceSlug ?? "—"} · deadline ${p.deadline ?? "—"}`} actions={<StatusBadge status={p.status} />} />
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <Panel title="Deliverables" pad={false}><Table><thead><tr><Th>Deliverable</Th><Th>Agent</Th><Th>Internal review</Th><Th>Client approval</Th><Th>Version</Th></tr></thead><tbody>
            {dels.map((d) => <tr key={d.id}><Td><Link href={`/os/deliverables/${d.id}`} className="hover:text-accent">{d.title}</Link><div className="text-[11.5px] text-fg-3">{d.kind.replace(/_/g, " ")}</div></Td><Td className="text-fg-2">{d.agentSlug}</Td><Td><StatusBadge status={d.status} /></Td><Td><StatusBadge status={d.clientApproval} /></Td><Td className="num">v{d.version}</Td></tr>)}
            {!dels.length && <tr><Td colSpan={5} className="py-6 text-center text-fg-3">No deliverables yet</Td></tr>}
          </tbody></Table></Panel>
          <Panel title="Tasks" pad={false}><Table><thead><tr><Th>Task</Th><Th>Agent</Th><Th>Status</Th><Th>Updated</Th></tr></thead><tbody>
            {ts.map((t) => <tr key={t.id}><Td><Link href={`/os/tasks/${t.id}`} className="hover:text-accent">{t.title}</Link></Td><Td className="text-fg-2">{t.agentSlug}</Td><Td><StatusBadge status={t.status} /></Td><Td className="text-fg-3">{timeAgo(t.updatedAt)}</Td></tr>)}
            {!ts.length && <tr><Td colSpan={4} className="py-6 text-center text-fg-3">No tasks linked</Td></tr>}
          </tbody></Table></Panel>
          <Panel title="Assign project work">
            <form action={submitCommandAction} className="space-y-2">
              <textarea name="text" rows={3} required className={textareaClass} defaultValue={`For project "${p.name}" (project_id=${p.id}${p.clientId ? `, client_id=${p.clientId}` : ""}): `} />
              <SubmitButton size="sm">Send to Managing Director</SubmitButton>
            </form>
          </Panel>
        </div>
        <div className="space-y-4">
          <Panel title="Progress">
            <div className="mb-3 flex items-center gap-2"><Progress value={p.progressPct} /><span className="num">{p.progressPct}%</span></div>
            <form action={updateProjectAction} className="space-y-2">
              <input type="hidden" name="id" value={p.id} />
              <select name="status" defaultValue={p.status} className={inputClass}>{["planning", "active", "in_review", "on_hold", "completed", "cancelled"].map((s) => <option key={s}>{s}</option>)}</select>
              <input name="progress" type="number" min={0} max={100} defaultValue={p.progressPct} className={inputClass} />
              <SubmitButton size="sm" variant="secondary">Update</SubmitButton>
            </form>
          </Panel>
          <Panel title="Details"><KV rows={[{ label: "Owner", value: p.ownerName ?? "—" }, { label: "Lead agent", value: p.leadAgent ?? "—" }, { label: "Budget", value: formatMoney(p.budgetMinor) }, { label: "Started", value: p.startDate ?? "—" }, { label: "Invoiced", value: formatMoney(invs.reduce((a, i) => a + i.totalMinor, 0)) }, { label: "Paid", value: formatMoney(invs.reduce((a, i) => a + i.amountPaidMinor, 0)) }]} />{p.description && <p className="mt-3 text-fg-2">{p.description}</p>}</Panel>
        </div>
      </div>
    </>
  );
}
