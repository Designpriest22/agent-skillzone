import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { desc, eq, inArray, or } from "drizzle-orm";
import { db } from "@/db/client";
import { tasks, agentRuns, approvals, deliverables } from "@/db/schema";
import { PageHeader, Panel, StatusBadge, KV, Badge, Table, Th, Td, ErrorNote, textareaClass } from "@/components/ui";
import { AutoRefresh, SubmitButton } from "@/components/client";
import { TaskTree } from "@/components/task-tree";
import { taskDecisionAction } from "../../actions";
import { formatDate, timeAgo } from "@/lib/utils";

const OUTPUT_LINK: Record<string, (id: string) => string> = {
  deliverable: (id) => `/os/deliverables/${id}`, lead: (id) => `/os/crm/leads/${id}`, task: (id) => `/os/tasks/${id}`, approval: (id) => `/os/approvals?focus=${id}`,
  report: (id) => `/os/reports/${id}`, project: (id) => `/os/projects/${id}`, intel: () => `/os/intelligence`, campaign: () => `/os/marketing?tab=campaigns`,
  content_item: () => `/os/marketing?tab=calendar`, site_page: () => `/os/marketing?tab=website`, proposal: () => `/os/crm?tab=proposals`, invoice: () => `/os/finance?tab=invoices`,
  client: () => `/os/crm?tab=clients`, knowledge: () => `/os/knowledge`,
};

export default async function TaskPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const [t] = await db.select().from(tasks).where(eq(tasks.id, id));
  if (!t) notFound();
  const tree = t.commandId ? await db.select().from(tasks).where(eq(tasks.commandId, t.commandId)) : await db.select().from(tasks).where(or(eq(tasks.id, id), eq(tasks.parentTaskId, id)));
  const rootId = t.commandId ? tree.find((x) => !x.parentTaskId)?.id ?? id : id;
  const [runs, taskApprovals, taskDeliverables, deps] = await Promise.all([
    db.select().from(agentRuns).where(eq(agentRuns.taskId, id)).orderBy(desc(agentRuns.startedAt)),
    db.select().from(approvals).where(eq(approvals.taskId, id)),
    db.select({ id: deliverables.id, title: deliverables.title, status: deliverables.status, kind: deliverables.kind }).from(deliverables).where(eq(deliverables.taskId, id)),
    t.dependsOn.length ? db.select({ id: tasks.id, title: tasks.title, status: tasks.status }).from(tasks).where(inArray(tasks.id, t.dependsOn)) : Promise.resolve([]),
  ]);
  const live = ["queued", "in_progress", "awaiting_subtasks", "approved"].includes(t.status);
  const decision = (d: string, label: string, variant: "primary" | "secondary" | "danger" = "secondary") => (
    <form action={taskDecisionAction}><input type="hidden" name="taskId" value={t.id} /><input type="hidden" name="back" value={`/os/tasks/${t.id}`} /><SubmitButton size="sm" variant={variant} name="decision" value={d}>{label}</SubmitButton></form>
  );

  return (
    <>
      <PageHeader title={t.title} subtitle={<>Assigned to <Link href={`/os/workforce/${t.agentSlug}`} className="text-accent">{t.agentSlug}</Link> · requested by {t.createdBy} · {timeAgo(t.createdAt)}</>}
        actions={<><AutoRefresh active={live} /><StatusBadge status={t.status} />
          {t.status === "proposed" && <>{decision("approve", "Approve", "primary")}{decision("reject", "Reject")}</>}
          {(t.status === "failed" || t.status === "cancelled") && decision("retry", "Retry", "primary")}
          {!["completed", "failed", "rejected", "cancelled"].includes(t.status) && decision("cancel", "Cancel", "danger")}</>} />
      {sp.error && <div className="mb-3"><ErrorNote>{sp.error}</ErrorNote></div>}
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Panel title="Instructions"><div className="whitespace-pre-wrap text-[13px]">{t.instructions}</div></Panel>
          {(t.resultSummary || t.error) && (
            <Panel title={t.status === "failed" ? "Failure" : "Result"}>
              {t.status === "failed" && t.error ? <ErrorNote>{t.error}</ErrorNote> : <div className="prose-os"><ReactMarkdown remarkPlugins={[remarkGfm]}>{t.resultSummary ?? ""}</ReactMarkdown></div>}
            </Panel>
          )}
          {t.planNotes && <Panel title="Manager plan notes"><div className="whitespace-pre-wrap text-fg-2">{t.planNotes}</div></Panel>}
          {tree.length > 1 && <Panel title="Delegation tree"><TaskTree tasks={tree} rootId={rootId} /></Panel>}
          {runs.map((r) => (
            <Panel key={r.id} title={`Run · ${formatDate(r.startedAt, true)}`} actions={<span className="flex items-center gap-2 text-[12px] text-fg-3">{r.turns} turns · {r.toolCalls} tool calls · ${r.costUsd.toFixed(3)} <StatusBadge status={r.status} /></span>}>
              {r.error && <div className="mb-2"><ErrorNote>{r.error}</ErrorNote></div>}
              <details><summary className="cursor-pointer text-[12.5px] text-fg-2">Transcript ({(r.transcript as unknown[]).length} entries)</summary>
                <pre className="mt-2 max-h-[480px] overflow-auto rounded-md bg-panel-2 p-3 text-[11.5px] leading-relaxed">{JSON.stringify(r.transcript, null, 1)}</pre>
              </details>
            </Panel>
          ))}
        </div>
        <div className="space-y-4">
          <Panel title="Details">
            <KV rows={[
              { label: "Status", value: <StatusBadge status={t.status} /> }, { label: "Priority", value: `P${t.priority}` }, { label: "Kind", value: t.kind },
              { label: "Attempts", value: t.attempts }, { label: "Started", value: formatDate(t.startedAt, true) }, { label: "Finished", value: formatDate(t.completedAt, true) },
              { label: "Due", value: formatDate(t.dueAt, true) },
              ...(t.parentTaskId ? [{ label: "Parent", value: <Link className="text-accent" href={`/os/tasks/${t.parentTaskId}`}>open</Link> }] : []),
              ...(t.commandId ? [{ label: "Command", value: <Link className="text-accent" href={`/os/command?c=${t.commandId}`}>open</Link> }] : []),
            ]} />
          </Panel>
          {deps.length > 0 && <Panel title="Prerequisites"><ul className="space-y-1">{deps.map((d) => <li key={d.id} className="flex justify-between gap-2"><Link href={`/os/tasks/${d.id}`} className="truncate hover:text-accent">{d.title}</Link><StatusBadge status={d.status} /></li>)}</ul></Panel>}
          <Panel title="Verified outputs" actions={t.verification && <Badge tone={t.verification.verified ? "ok" : "bad"}>{t.verification.verified ? `${t.verification.checked} verified` : "unverified"}</Badge>}>
            {t.outputs.length ? <ul className="space-y-1">{t.outputs.map((o) => <li key={o.id} className="flex justify-between gap-2"><Link href={(OUTPUT_LINK[o.type] ?? (() => "#"))(o.id)} className="hover:text-accent">{o.type.replace(/_/g, " ")}</Link><span className="font-mono text-[11px] text-fg-3">{o.id.slice(0, 8)}</span></li>)}</ul> : <div className="text-fg-3">{t.status === "completed" ? "Answer-only task (data retrieved via tools)." : "None yet."}</div>}
          </Panel>
          {taskDeliverables.length > 0 && <Panel title="Deliverables"><ul className="space-y-1">{taskDeliverables.map((d) => <li key={d.id} className="flex justify-between gap-2"><Link href={`/os/deliverables/${d.id}`} className="truncate hover:text-accent">{d.title}</Link><StatusBadge status={d.status} /></li>)}</ul></Panel>}
          {taskApprovals.length > 0 && <Panel title="Approval requests"><ul className="space-y-1">{taskApprovals.map((a) => <li key={a.id} className="flex justify-between gap-2"><Link href={`/os/approvals?focus=${a.id}`} className="truncate hover:text-accent">{a.title}</Link><StatusBadge status={a.status} /></li>)}</ul></Panel>}
          {t.status === "proposed" && <Panel title="Reject with reason"><form action={taskDecisionAction} className="space-y-2"><input type="hidden" name="taskId" value={t.id} /><input type="hidden" name="decision" value="reject" /><textarea name="reason" rows={2} className={textareaClass} /><SubmitButton variant="secondary" size="sm">Reject</SubmitButton></form></Panel>}
        </div>
      </div>
    </>
  );
}
