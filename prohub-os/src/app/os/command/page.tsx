import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { commands, tasks, agents } from "@/db/schema";
import { PageHeader, Panel, StatusBadge, textareaClass, inputClass, ErrorNote, Empty } from "@/components/ui";
import { AutoRefresh, SubmitButton } from "@/components/client";
import { TaskTree } from "@/components/task-tree";
import { submitCommandAction } from "../actions";
import { timeAgo, truncate } from "@/lib/utils";

export const metadata = { title: "Command centre" };

const EXAMPLES = [
  "Find 30 new hospitality businesses in Lagos that need social media management.",
  "Develop a campaign to acquire 20 new corporate clients this month.",
  "Create a marketing campaign for Prohub with a landing page and a two-week content calendar.",
  "Generate 10 qualified leads today.",
  "Show me our revenue for October.",
  "Which agent has the most outstanding tasks?",
  "Prepare a report on our business performance this week.",
];

export default async function CommandCentre({ searchParams }: { searchParams: Promise<{ c?: string; error?: string }> }) {
  const sp = await searchParams;
  const history = await db.select().from(commands).orderBy(desc(commands.createdAt)).limit(30);
  const selected = sp.c ? history.find((c) => c.id === sp.c) ?? (await db.select().from(commands).where(eq(commands.id, sp.c)))[0] : history[0];
  const tree = selected ? await db.select().from(tasks).where(eq(tasks.commandId, selected.id)) : [];
  const roster = await db.select({ slug: agents.slug, name: agents.name, title: agents.title }).from(agents).orderBy(agents.department);
  const live = tree.some((t) => ["queued", "in_progress", "awaiting_subtasks", "approved"].includes(t.status)) || history.some((h) => h.status === "executing" || h.status === "planning");

  return (
    <>
      <PageHeader title="Command centre" subtitle="Instruct the business in plain language. The AI Managing Director interprets, delegates to departments, and reports verified results." actions={<AutoRefresh active={live} />} />
      {sp.error && <div className="mb-3"><ErrorNote>{sp.error}</ErrorNote></div>}
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Panel>
            <form action={submitCommandAction} className="space-y-3">
              <textarea name="text" required minLength={3} rows={3} placeholder="e.g. Develop a campaign to acquire 20 new corporate clients this month." className={textareaClass + " text-[14px]"} />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-[12.5px] text-fg-2">Route to
                  <select name="agent" className={inputClass + " w-auto"} defaultValue="">
                    <option value="">Managing Director (recommended)</option>
                    {roster.filter((a) => a.slug !== "managing-director").map((a) => <option key={a.slug} value={a.slug}>{a.name} — {a.title}</option>)}
                  </select>
                </label>
                <SubmitButton>Issue command</SubmitButton>
              </div>
            </form>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {EXAMPLES.map((e) => <span key={e} className="rounded border border-line bg-panel-2 px-2 py-0.5 text-[12px] text-fg-2">{e}</span>)}
            </div>
          </Panel>

          {selected ? (
            <Panel title="Execution" actions={<StatusBadge status={selected.status} />}>
              <div className="mb-3">
                <div className="text-[12px] text-fg-3">Command · {timeAgo(selected.createdAt)}</div>
                <div className="mt-0.5 whitespace-pre-wrap text-[14px] font-medium">{selected.text}</div>
              </div>
              {selected.rootTaskId && <TaskTree tasks={tree} rootId={selected.rootTaskId} />}
              {selected.response && (
                <div className="mt-4 rounded-md border border-line bg-panel-2 p-3">
                  <div className="mb-1 text-[12px] font-semibold uppercase tracking-[0.04em] text-fg-3">{selected.status === "completed" ? "Managing Director's report" : "Outcome"}</div>
                  <div className="prose-os"><ReactMarkdown remarkPlugins={[remarkGfm]}>{selected.response}</ReactMarkdown></div>
                </div>
              )}
            </Panel>
          ) : <Empty title="No commands yet">Issue your first instruction above.</Empty>}
        </div>

        <Panel title="History" pad={false}>
          <ul className="divide-y divide-line">
            {history.map((c) => (
              <li key={c.id}>
                <Link href={`/os/command?c=${c.id}`} className={`block px-4 py-2.5 hover:bg-panel-2 ${selected?.id === c.id ? "bg-panel-2" : ""}`}>
                  <div className="line-clamp-2 text-[13px]">{truncate(c.text, 140)}</div>
                  <div className="mt-1 flex items-center gap-2 text-[11.5px] text-fg-3"><StatusBadge status={c.status} />{timeAgo(c.createdAt)}</div>
                </Link>
              </li>
            ))}
            {!history.length && <li className="px-4 py-6 text-center text-fg-3">No history</li>}
          </ul>
        </Panel>
      </div>
    </>
  );
}
