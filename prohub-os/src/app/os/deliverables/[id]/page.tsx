import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { deliverables } from "@/db/schema";
import { PageHeader, Panel, StatusBadge, KV, Badge, textareaClass, ErrorNote } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { reviewDeliverableAction } from "../../actions";
import { formatDate } from "@/lib/utils";

function Content({ d }: { d: typeof deliverables.$inferSelect }) {
  if (d.format === "svg") return <img alt={d.title} className="mx-auto max-h-[720px] max-w-full rounded border border-line bg-white" src={`data:image/svg+xml;base64,${Buffer.from(d.content).toString("base64")}`} />;
  if (d.format === "html") return <iframe title={d.title} sandbox="" srcDoc={d.content} className="h-[720px] w-full rounded border border-line bg-white" />;
  if (d.format === "url") {
    const src = d.fileUrl ?? d.content;
    if (/^(https:|data:image\/)/.test(src) && d.kind === "image") return <img alt={d.title} src={src} className="mx-auto max-h-[720px] max-w-full rounded border border-line" />;
    if (/^https:/.test(src) && d.kind === "video") return <video src={src} controls className="mx-auto max-h-[720px] max-w-full rounded border border-line" />;
    return <a href={src.startsWith("http") ? src : "#"} className="break-all text-accent" target="_blank" rel="noreferrer">{src}</a>;
  }
  if (d.format === "json") { let pretty = d.content; try { pretty = JSON.stringify(JSON.parse(d.content), null, 2); } catch {} return <pre className="overflow-auto rounded bg-panel-2 p-3 text-[12px]">{pretty}</pre>; }
  return <div className="prose-os"><ReactMarkdown remarkPlugins={[remarkGfm]}>{d.content}</ReactMarkdown></div>;
}

export default async function DeliverablePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const [d] = await db.select().from(deliverables).where(eq(deliverables.id, id));
  if (!d) notFound();
  const act = (decision: string, label: string, variant: "primary" | "secondary" | "danger" = "secondary") => <SubmitButton variant={variant} size="sm" name="decision" value={decision}>{label}</SubmitButton>;
  return (
    <>
      <PageHeader title={d.title} subtitle={<>{d.kind.replace(/_/g, " ")} by <Link className="text-accent" href={`/os/workforce/${d.agentSlug}`}>{d.agentSlug}</Link> · v{d.version} · {formatDate(d.createdAt, true)}</>} actions={<StatusBadge status={d.status} />} />
      {sp.error && <div className="mb-3"><ErrorNote>{sp.error}</ErrorNote></div>}
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <Panel><Content d={d} /></Panel>
        <div className="space-y-4">
          <Panel title="Review">
            <form action={reviewDeliverableAction} className="space-y-2">
              <input type="hidden" name="id" value={d.id} />
              <textarea name="notes" rows={3} placeholder="Notes — required when requesting changes (a revision task is created for the agent)" className={textareaClass} />
              <div className="flex flex-wrap gap-1.5">{act("approve", "Approve", "primary")}{act("changes", "Request changes")}{act("reject", "Reject", "danger")}</div>
              <div className="pt-2 text-[12px] font-medium text-fg-2">Client approval: <StatusBadge status={d.clientApproval} /></div>
              <div className="flex flex-wrap gap-1.5">{act("client_pending", "Sent to client")}{act("client_approved", "Client approved")}{act("client_changes", "Client requested changes")}</div>
            </form>
          </Panel>
          <Panel title="Quality control">
            {d.qc.length ? <ul className="space-y-1.5 text-[12.5px]">{d.qc.map((q, i) => <li key={i} className="flex gap-2"><Badge tone={q.pass ? "ok" : "bad"}>{q.pass ? "pass" : "fail"}</Badge><span>{q.item}{q.note && <span className="text-fg-3"> — {q.note}</span>}</span></li>)}</ul> : <div className="text-fg-3">No QC checklist recorded.</div>}
            {d.reviewNotes && <div className="mt-3 border-t border-line pt-2 text-[12.5px]"><div className="font-medium text-fg-2">Review notes</div>{d.reviewNotes}</div>}
          </Panel>
          <Panel title="Details">
            <KV rows={[
              { label: "Format", value: d.format }, { label: "Platform", value: d.platform ?? "—" },
              ...(d.taskId ? [{ label: "Task", value: <Link className="text-accent" href={`/os/tasks/${d.taskId}`}>open</Link> }] : []),
              ...(d.projectId ? [{ label: "Project", value: <Link className="text-accent" href={`/os/projects/${d.projectId}`}>open</Link> }] : []),
              ...(d.leadId ? [{ label: "Lead", value: <Link className="text-accent" href={`/os/crm/leads/${d.leadId}`}>open</Link> }] : []),
              ...(d.previousVersionId ? [{ label: "Previous version", value: <Link className="text-accent" href={`/os/deliverables/${d.previousVersionId}`}>v{d.version - 1}</Link> }] : []),
            ]} />
          </Panel>
        </div>
      </div>
    </>
  );
}
