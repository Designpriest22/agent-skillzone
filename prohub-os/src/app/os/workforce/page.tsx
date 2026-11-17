import Link from "next/link";
import { db } from "@/db/client";
import { agents } from "@/db/schema";
import { AGENTS } from "@/agents/definitions";
import { agentStats, performanceScore } from "@/services/kpis";
import { PageHeader, Panel, StatusBadge, Table, Th, Td, Badge } from "@/components/ui";
import { AutoRefresh } from "@/components/client";
import { timeAgo } from "@/lib/utils";

export const metadata = { title: "AI workforce" };

export default async function Workforce() {
  const rows = await db.select().from(agents);
  const stats = await agentStats();
  const order = AGENTS.map((a) => a.slug);
  rows.sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug));
  const live = [...stats.values()].some((s) => s.currentTask);
  return (
    <>
      <PageHeader title="AI workforce" subtitle="Twelve specialised agents. Performance score = verified task success over 30 days, shrunk toward 50 until there are 10 decided tasks." actions={<AutoRefresh active={live} />} />
      <Panel pad={false}>
        <Table>
          <thead><tr><Th>Agent</Th><Th>Department</Th><Th>Current assignment</Th><Th>Status</Th><Th className="text-right">Completed (30d)</Th><Th className="text-right">Pending</Th><Th className="text-right">Score</Th><Th className="text-right">Spend today</Th><Th>Last activity</Th></tr></thead>
          <tbody>
            {rows.map((a) => {
              const s = stats.get(a.slug);
              const score = performanceScore(s);
              return (
                <tr key={a.slug} className="hover:bg-panel-2">
                  <Td><Link href={`/os/workforce/${a.slug}`} className="font-medium hover:text-accent">{a.name}</Link><div className="text-[12px] text-fg-3">{a.title}</div></Td>
                  <Td className="text-fg-2">{a.department}</Td>
                  <Td className="max-w-[260px]">{s?.currentTask ? <Link href={`/os/tasks/${s.currentTaskId}`} className="line-clamp-2 hover:text-accent">{s.currentTask}</Link> : <span className="text-fg-3">Idle</span>}</Td>
                  <Td><StatusBadge status={a.status} /></Td>
                  <Td className="num text-right">{s?.completed30 ?? 0}{s?.failed30 ? <span className="text-bad"> · {s.failed30} failed</span> : null}</Td>
                  <Td className="num text-right">{s?.open ?? 0}</Td>
                  <Td className="num text-right">{score === null ? <span className="text-fg-3">—</span> : <Badge tone={score >= 80 ? "ok" : score >= 60 ? "warn" : "bad"}>{score}</Badge>}</Td>
                  <Td className="num text-right">${(s?.spendToday ?? 0).toFixed(2)}<span className="text-fg-3"> / ${a.dailyBudgetUsd}</span></Td>
                  <Td className="text-fg-2">{timeAgo(a.lastActiveAt)}</Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Panel>
    </>
  );
}
