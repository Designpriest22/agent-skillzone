import { desc, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { activityLog, jobs, notifications } from "@/db/schema";
import { PageHeader, Panel, Tabs, Table, Th, Td, Badge, StatusBadge } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { retryJobAction, markNotificationsReadAction } from "../actions";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Activity & jobs" };

export default async function Activity({ searchParams }: { searchParams: Promise<{ tab?: string; actor?: string }> }) {
  const sp = await searchParams;
  const tab = sp.tab ?? "log";
  const labels: Record<string, string> = { log: "Activity log", jobs: "Background jobs", notifications: "Notifications" };
  return (
    <>
      <PageHeader title="Activity & jobs" subtitle="Append-only audit trail of every significant user, agent, system and webhook action, plus the background job queue." />
      <Tabs active={labels[tab]} tabs={Object.entries(labels).map(([k, v]) => ({ href: `/os/activity?tab=${k}`, label: v }))} />
      {tab === "log" && <Log actor={sp.actor} />}
      {tab === "jobs" && <Jobs />}
      {tab === "notifications" && <Notifications />}
    </>
  );
}

async function Log({ actor }: { actor?: string }) {
  const rows = await db.select().from(activityLog).where(actor ? sql`${activityLog.actorType} = ${actor}` : undefined).orderBy(desc(activityLog.createdAt)).limit(300);
  return (
    <Panel pad={false} title={<span className="flex gap-3 normal-case">{["", "user", "agent", "system", "webhook"].map((a) => <a key={a} href={`/os/activity?tab=log${a ? `&actor=${a}` : ""}`} className={(actor ?? "") === a ? "text-fg" : "text-fg-3"}>{a || "all"}</a>)}</span>}>
      <Table><thead><tr><Th>When</Th><Th>Actor</Th><Th>Action</Th><Th>Entity</Th><Th>Details</Th></tr></thead><tbody>
        {rows.map((r) => <tr key={r.id}><Td className="whitespace-nowrap text-fg-3">{formatDate(r.createdAt, true)}</Td><Td className="whitespace-nowrap"><Badge>{r.actorType}</Badge> <span className="text-fg-2">{r.actorId.slice(0, 22)}</span></Td><Td className={r.action.endsWith(".error") || r.action.includes("failed") ? "text-bad" : ""}>{r.action}</Td><Td className="text-fg-3">{r.entityType ? `${r.entityType}:${r.entityId?.slice(0, 8)}` : ""}</Td><Td className="max-w-[480px] truncate font-mono text-[11px] text-fg-3">{JSON.stringify(r.details).slice(0, 220)}</Td></tr>)}
      </tbody></Table>
    </Panel>
  );
}

async function Jobs() {
  const rows = await db.select().from(jobs).orderBy(desc(jobs.createdAt)).limit(200);
  const [counts] = await db.select({ queued: sql<number>`count(*) filter (where status='queued')::int`, running: sql<number>`count(*) filter (where status='running')::int`, dead: sql<number>`count(*) filter (where status='dead')::int` }).from(jobs);

  return (
    <Panel pad={false} title={`${counts.queued} queued · ${counts.running} running · ${counts.dead} dead`}>
      <Table><thead><tr><Th>Created</Th><Th>Type</Th><Th>Status</Th><Th className="text-right">Attempts</Th><Th>Run at</Th><Th>Error</Th><Th /></tr></thead><tbody>
        {rows.map((j) => <tr key={j.id}><Td className="whitespace-nowrap text-fg-3">{formatDate(j.createdAt, true)}</Td><Td>{j.type}<div className="font-mono text-[11px] text-fg-3">{JSON.stringify(j.payload).slice(0, 60)}</div></Td><Td><StatusBadge status={j.status} /></Td><Td className="num text-right">{j.attempts}/{j.maxAttempts}</Td><Td className="whitespace-nowrap text-fg-2">{formatDate(j.runAt, true)}</Td><Td className="max-w-[360px] text-[12px] text-bad">{j.lastError?.slice(0, 200)}</Td>
          <Td>{(j.status === "dead" || j.status === "failed") && <form action={retryJobAction}><input type="hidden" name="id" value={j.id} /><SubmitButton size="sm" variant="secondary">Retry</SubmitButton></form>}</Td></tr>)}
        {!rows.length && <tr><Td colSpan={7} className="py-8 text-center text-fg-3">No jobs yet. Is the worker running? (npm run worker)</Td></tr>}
      </tbody></Table>
    </Panel>
  );
}

async function Notifications() {
  const rows = await db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(150);
  return (
    <Panel pad={false} actions={<form action={markNotificationsReadAction}><SubmitButton size="sm" variant="ghost">Mark all read</SubmitButton></form>} title="Notifications">
      <Table><tbody>{rows.map((n) => <tr key={n.id} className={n.readAt ? "" : "bg-accent-soft/40"}><Td className="w-[150px] whitespace-nowrap text-fg-3">{formatDate(n.createdAt, true)}</Td><Td className="w-[90px]"><Badge tone={n.kind === "alert" ? "bad" : n.kind === "approval" ? "warn" : "neutral"}>{n.kind}</Badge></Td><Td>{n.href ? <a href={n.href} className="font-medium hover:text-accent">{n.title}</a> : <span className="font-medium">{n.title}</span>}<div className="whitespace-pre-wrap text-[12.5px] text-fg-2">{n.body.slice(0, 400)}</div></Td><Td className="text-[11.5px] text-fg-3">{n.deliveredVia.join(", ")}</Td></tr>)}
        {!rows.length && <tr><Td className="py-8 text-center text-fg-3">No notifications</Td></tr>}</tbody></Table>
    </Panel>
  );
}
