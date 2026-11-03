import Link from "next/link";
import { StatusBadge } from "./ui";
import { truncate } from "@/lib/utils";

type T = { id: string; title: string; agentSlug: string; status: string; parentTaskId: string | null; resultSummary: string | null; error: string | null; dependsOn: string[] };

/** Renders a delegation tree: root task with nested subtasks, statuses and outcomes. */
export function TaskTree({ tasks, rootId }: { tasks: T[]; rootId: string }) {
  const byParent = new Map<string, T[]>();
  for (const t of tasks) if (t.parentTaskId) byParent.set(t.parentTaskId, [...(byParent.get(t.parentTaskId) ?? []), t]);
  const root = tasks.find((t) => t.id === rootId);
  if (!root) return null;
  const Node = ({ t, depth }: { t: T; depth: number }) => (
    <li>
      <div className="flex items-start gap-2 py-1" style={{ paddingLeft: depth * 18 }}>
        <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-line-strong" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/os/tasks/${t.id}`} className="font-medium hover:text-accent">{t.title}</Link>
            <span className="text-[12px] text-fg-3">{t.agentSlug}</span>
            <StatusBadge status={t.status} />
            {t.dependsOn.length > 0 && <span className="text-[11.5px] text-fg-3">after {t.dependsOn.length} prerequisite{t.dependsOn.length > 1 ? "s" : ""}</span>}
          </div>
          {(t.resultSummary || t.error) && <div className={`mt-0.5 text-[12.5px] ${t.error && t.status === "failed" ? "text-bad" : "text-fg-2"}`}>{truncate(t.status === "failed" ? t.error : t.resultSummary, 260)}</div>}
        </div>
      </div>
      {(byParent.get(t.id) ?? []).length > 0 && <ul>{byParent.get(t.id)!.map((c) => <Node key={c.id} t={c} depth={depth + 1} />)}</ul>}
    </li>
  );
  return <ul><Node t={root} depth={0} /></ul>;
}
