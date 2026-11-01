import Link from "next/link";
import { desc, inArray, eq, and } from "drizzle-orm";
import { db } from "@/db/client";
import { tasks } from "@/db/schema";
import { PageHeader, Panel, StatusBadge, Tabs, Table, Th, Td, Badge } from "@/components/ui";
import { AutoRefresh, SubmitButton } from "@/components/client";
import { taskDecisionAction } from "../actions";
import { timeAgo, truncate } from "@/lib/utils";

export const metadata = { title: "Tasks" };

const GROUPS: Record<string, { label: string; statuses: (typeof tasks.$inferSelect.status)[] }> = {
  active: { label: "Active", statuses: ["approved", "queued", "in_progress", "awaiting_subtasks", "awaiting_approval"] },
  proposed: { label: "Proposed", statuses: ["proposed"] },
  completed: { label: "Completed", statuses: ["completed"] },
  failed: { label: "Failed", statuses: ["failed"] },
  closed: { label: "Rejected / cancelled", statuses: ["rejected", "cancelled"] },
};

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ tab?: string; agent?: string }> }) {
  const sp = await searchParams;
  const tab = GROUPS[sp.tab ?? "active"] ? sp.tab ?? "active" : "active";
  const counts = Object.fromEntries(await Promise.all(Object.entries(GROUPS).map(async ([k, g]) => [k, (await db.select({ id: tasks.id }).from(tasks).where(inArray(tasks.status, g.statuses))).length] as const)));
  const rows = await db.select().from(tasks).where(and(inArray(tasks.status, GROUPS[tab].statuses), sp.agent ? eq(tasks.agentSlug, sp.agent) : undefined)).orderBy(desc(tasks.updatedAt)).limit(150);
  return (
    <>
      <PageHeader title="Tasks" subtitle="Every unit of work across the workforce. Completed means the orchestrator verified the outputs exist." actions={<AutoRefresh active={counts.active > 0} />} />
      <Tabs active={GROUPS[tab].label} tabs={Object.entries(GROUPS).map(([k, g]) => ({ href: `/os/tasks?tab=${k}`, label: g.label, count: counts[k] }))} />
      <Panel pad={false}>
        <Table>
          <thead><tr><Th>Task</Th><Th>Agent</Th><Th>Status</Th><Th>Priority</Th><Th>Requested by</Th><Th>Outcome</Th><Th>Updated</Th>{tab === "proposed" || tab === "failed" ? <Th /> : null}</tr></thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id} className="hover:bg-panel-2">
                <Td className="max-w-[320px]"><Link href={`/os/tasks/${t.id}`} className="font-medium hover:text-accent">{t.title}</Link>{t.parentTaskId && <div className="text-[11.5px] text-fg-3">subtask</div>}</Td>
                <Td><Link href={`/os/workforce/${t.agentSlug}`} className="text-fg-2 hover:text-accent">{t.agentSlug}</Link></Td>
                <Td><StatusBadge status={t.status} />{t.verification?.verified && <Badge tone="ok" className="ml-1">verified {t.verification.checked}</Badge>}</Td>
                <Td className="num">P{t.priority}</Td>
                <Td className="text-fg-2">{t.createdBy.replace(/:.{20,}$/, "")}</Td>
                <Td className="max-w-[360px] text-[12.5px] text-fg-2">{truncate(t.status === "failed" ? t.error : t.resultSummary, 160)}</Td>
                <Td className="whitespace-nowrap text-fg-3">{timeAgo(t.updatedAt)}</Td>
                {tab === "proposed" && <Td className="whitespace-nowrap"><div className="flex gap-1">
                  <form action={taskDecisionAction}><input type="hidden" name="taskId" value={t.id} /><input type="hidden" name="back" value="/os/tasks?tab=proposed" /><SubmitButton size="sm" name="decision" value="approve">Approve</SubmitButton></form>
                  <form action={taskDecisionAction}><input type="hidden" name="taskId" value={t.id} /><input type="hidden" name="back" value="/os/tasks?tab=proposed" /><SubmitButton size="sm" variant="secondary" name="decision" value="reject">Reject</SubmitButton></form>
                </div></Td>}
                {tab === "failed" && <Td><form action={taskDecisionAction}><input type="hidden" name="taskId" value={t.id} /><input type="hidden" name="back" value="/os/tasks?tab=failed" /><SubmitButton size="sm" variant="secondary" name="decision" value="retry">Retry</SubmitButton></form></Td>}
              </tr>
            ))}
            {!rows.length && <tr><Td colSpan={8} className="py-8 text-center text-fg-3">No tasks in this view</Td></tr>}
          </tbody>
        </Table>
      </Panel>
    </>
  );
}
