import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { projects, clients, services, agents } from "@/db/schema";
import { PageHeader, Panel, StatusBadge, Table, Th, Td, Progress, Field, inputClass, textareaClass, ErrorNote } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { createProjectAction } from "../actions";
import { formatMoney } from "@/lib/money";

export const metadata = { title: "Projects" };

export default async function Projects({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const rows = await db.select({
    p: projects, client: clients.name,
    deliverables: sql<number>`(select count(*)::int from deliverables d where d.project_id = ${projects.id})`,
    pendingApproval: sql<number>`(select count(*)::int from deliverables d where d.project_id = ${projects.id} and d.client_approval = 'pending')`,
    revisions: sql<number>`(select count(*)::int from deliverables d where d.project_id = ${projects.id} and (d.status = 'changes_requested' or d.client_approval = 'changes_requested'))`,
    openTasks: sql<number>`(select count(*)::int from tasks t where t.project_id = ${projects.id} and t.status not in ('completed','failed','rejected','cancelled'))`,
  }).from(projects).leftJoin(clients, eq(clients.id, projects.clientId)).orderBy(desc(projects.updatedAt));
  const [clientList, svc, agentList] = await Promise.all([db.select({ id: clients.id, name: clients.name }).from(clients), db.select({ slug: services.slug, name: services.name }).from(services), db.select({ slug: agents.slug, name: agents.name, title: agents.title }).from(agents)]);
  const today = new Date().toISOString().slice(0, 10);
  return (
    <>
      <PageHeader title="Projects" subtitle="Client and internal projects with owners, assigned agents, deadlines, deliverables and approvals." />
      {sp.error && <div className="mb-3"><ErrorNote>{sp.error}</ErrorNote></div>}
      <Panel pad={false}>
        <Table><thead><tr><Th>Project</Th><Th>Client</Th><Th>Owner / lead agent</Th><Th>Status</Th><Th>Deadline</Th><Th className="w-[160px]">Progress</Th><Th className="text-right">Deliverables</Th><Th className="text-right">Client approvals</Th><Th className="text-right">Revisions</Th><Th className="text-right">Budget</Th></tr></thead><tbody>
          {rows.map(({ p, client, deliverables, pendingApproval, revisions, openTasks }) => (
            <tr key={p.id} className="hover:bg-panel-2">
              <Td><Link href={`/os/projects/${p.id}`} className="font-medium hover:text-accent">{p.name}</Link><div className="text-[11.5px] text-fg-3">{p.serviceSlug ?? (p.isInternal ? "internal" : "")}{openTasks ? ` · ${openTasks} open tasks` : ""}</div></Td>
              <Td className="text-fg-2">{client ?? (p.isInternal ? "Prohub (internal)" : "—")}</Td>
              <Td className="text-fg-2">{p.ownerName ?? "—"}<div className="text-[11.5px] text-fg-3">{p.leadAgent ?? ""}</div></Td>
              <Td><StatusBadge status={p.status} /></Td>
              <Td className={p.deadline && p.deadline < today && p.status !== "completed" ? "text-bad" : "text-fg-2"}>{p.deadline ?? "—"}</Td>
              <Td><div className="flex items-center gap-2"><Progress value={p.progressPct} /><span className="num text-[12px]">{p.progressPct}%</span></div></Td>
              <Td className="num text-right">{deliverables}</Td><Td className="num text-right">{pendingApproval ? `${pendingApproval} pending` : "—"}</Td><Td className="num text-right">{revisions || "—"}</Td>
              <Td className="num text-right">{formatMoney(p.budgetMinor)}</Td>
            </tr>
          ))}
          {!rows.length && <tr><Td colSpan={10} className="py-8 text-center text-fg-3">No projects yet.</Td></tr>}
        </tbody></Table>
      </Panel>
      <Panel title="New project" className="mt-4 max-w-4xl">
        <form action={createProjectAction} className="grid gap-3 md:grid-cols-3">
          <Field label="Name"><input name="name" required className={inputClass} /></Field>
          <Field label="Client"><select name="clientId" className={inputClass}><option value="">Internal (Prohub)</option>{clientList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
          <Field label="Service"><select name="serviceSlug" className={inputClass}><option value="">—</option>{svc.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}</select></Field>
          <Field label="Human owner"><input name="ownerName" className={inputClass} /></Field>
          <Field label="Lead agent"><select name="leadAgent" className={inputClass}><option value="">—</option>{agentList.map((a) => <option key={a.slug} value={a.slug}>{a.name} — {a.title}</option>)}</select></Field>
          <Field label="Deadline"><input name="deadline" type="date" className={inputClass} /></Field>
          <Field label="Budget (₦)"><input name="budget" className={inputClass} /></Field>
          <Field label="Description" className="md:col-span-2"><textarea name="description" rows={2} className={textareaClass} /></Field>
          <div className="md:col-span-3"><SubmitButton>Create project</SubmitButton></div>
        </form>
      </Panel>
    </>
  );
}
