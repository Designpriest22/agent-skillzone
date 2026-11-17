import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { agents, tasks, agentRuns, agentMemories, deliverables } from "@/db/schema";
import { getDefinition } from "@/agents/definitions";
import { AVAILABLE_MODELS } from "@/agents/llm";
import { agentStats, performanceScore, computeKpi } from "@/services/kpis";
import { PageHeader, Panel, StatusBadge, Table, Th, Td, Field, inputClass, textareaClass, Stat, ErrorNote, InfoNote, Badge } from "@/components/ui";
import { SubmitButton, AutoRefresh } from "@/components/client";
import { updateAgentAction, setAgentStatusAction, submitCommandAction } from "../../actions";
import { timeAgo, formatDate } from "@/lib/utils";

export default async function AgentPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const [a] = await db.select().from(agents).where(eq(agents.slug, slug));
  const def = getDefinition(slug);
  if (!a || !def) notFound();
  const [stats, recentTasks, runs, memories, work] = await Promise.all([
    agentStats(),
    db.select().from(tasks).where(eq(tasks.agentSlug, slug)).orderBy(desc(tasks.updatedAt)).limit(25),
    db.select().from(agentRuns).where(eq(agentRuns.agentSlug, slug)).orderBy(desc(agentRuns.startedAt)).limit(15),
    db.select().from(agentMemories).where(eq(agentMemories.agentSlug, slug)).orderBy(desc(agentMemories.createdAt)).limit(15),
    db.select({ id: deliverables.id, title: deliverables.title, kind: deliverables.kind, status: deliverables.status, createdAt: deliverables.createdAt }).from(deliverables).where(eq(deliverables.agentSlug, slug)).orderBy(desc(deliverables.createdAt)).limit(12),
  ]);
  const s = stats.get(slug);
  const kpis = await Promise.all(def.kpis.map(async (k) => ({ ...k, value: await computeKpi(k.key, slug) })));
  const score = performanceScore(s);

  return (
    <>
      <PageHeader title={`${a.name} — ${a.title}`} subtitle={`${a.department} · ${def.mission}`}
        actions={<><AutoRefresh active={!!s?.currentTask} /><StatusBadge status={a.status} />
          {(["active", "paused", "disabled"] as const).filter((x) => x !== a.status).map((x) => (
            <form key={x} action={setAgentStatusAction}><input type="hidden" name="slug" value={slug} /><input type="hidden" name="status" value={x} />
              <SubmitButton variant={x === "disabled" ? "danger" : "secondary"} size="sm">{x === "active" ? (a.status === "paused" ? "Resume" : "Enable") : x === "paused" ? "Pause" : "Disable"}</SubmitButton></form>
          ))}</>} />
      {sp.error && <div className="mb-3"><ErrorNote>{sp.error}</ErrorNote></div>}
      {sp.ok && <div className="mb-3"><InfoNote>{sp.ok}</InfoNote></div>}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        <Stat label="Performance score" value={score ?? "—"} sub={score === null ? "No decided tasks yet" : "30-day verified success"} />
        <Stat label="Completed (30d)" value={s?.completed30 ?? 0} sub={`${s?.completedTotal ?? 0} all-time`} />
        <Stat label="Pending" value={s?.open ?? 0} />
        {kpis.map((k) => <Stat key={k.key} label={k.label} value={k.value} />)}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <Panel title="Assign a task directly">
            <form action={submitCommandAction} className="space-y-2">
              <input type="hidden" name="agent" value={slug} />
              <textarea name="text" required rows={3} className={textareaClass} placeholder={`What should ${a.name} do? Be specific about quantity, audience and the outcome you want.`} />
              <SubmitButton>Assign to {a.name}</SubmitButton>
            </form>
          </Panel>
          <Panel title="Tasks" pad={false}>
            <Table><thead><tr><Th>Task</Th><Th>Status</Th><Th>From</Th><Th>Updated</Th></tr></thead><tbody>
              {recentTasks.map((t) => <tr key={t.id}><Td><Link href={`/os/tasks/${t.id}`} className="hover:text-accent">{t.title}</Link></Td><Td><StatusBadge status={t.status} /></Td><Td className="text-fg-3">{t.createdBy.split(":")[0]}</Td><Td className="text-fg-3">{timeAgo(t.updatedAt)}</Td></tr>)}
              {!recentTasks.length && <tr><Td colSpan={4} className="text-center text-fg-3">No tasks yet</Td></tr>}
            </tbody></Table>
          </Panel>
          <Panel title="Runs (model usage)" pad={false}>
            <Table><thead><tr><Th>Started</Th><Th>Status</Th><Th className="text-right">Turns</Th><Th className="text-right">Tools</Th><Th className="text-right">Searches</Th><Th className="text-right">Tokens in/out (cached)</Th><Th className="text-right">Cost</Th></tr></thead><tbody>
              {runs.map((r) => <tr key={r.id}><Td className="text-fg-2">{formatDate(r.startedAt, true)}</Td><Td><StatusBadge status={r.status} /></Td><Td className="num text-right">{r.turns}</Td><Td className="num text-right">{r.toolCalls}</Td><Td className="num text-right">{r.webSearches}</Td><Td className="num text-right">{r.inputTokens.toLocaleString()} / {r.outputTokens.toLocaleString()} ({r.cacheReadTokens.toLocaleString()})</Td><Td className="num text-right">${r.costUsd.toFixed(3)}</Td></tr>)}
              {!runs.length && <tr><Td colSpan={7} className="text-center text-fg-3">No runs yet</Td></tr>}
            </tbody></Table>
          </Panel>
          <Panel title="Recent deliverables">
            {work.length ? <ul className="space-y-1">{work.map((w) => <li key={w.id} className="flex items-center justify-between gap-2"><Link href={`/os/deliverables/${w.id}`} className="truncate hover:text-accent">{w.title}</Link><span className="flex shrink-0 items-center gap-2"><span className="text-[12px] text-fg-3">{w.kind.replace(/_/g, " ")}</span><StatusBadge status={w.status} /></span></li>)}</ul> : <div className="text-fg-3">No deliverables yet</div>}
          </Panel>
        </div>
        <div className="space-y-4">
          <Panel title="Configuration">
            <form action={updateAgentAction} className="space-y-3">
              <input type="hidden" name="slug" value={slug} />
              <Field label="Model"><select name="model" defaultValue={a.model} className={inputClass}>{AVAILABLE_MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}</select></Field>
              <Field label="Effort" hint="Higher effort = deeper reasoning and more tokens."><select name="effort" defaultValue={a.effort} className={inputClass}>{["low", "medium", "high", "xhigh", "max"].map((e) => <option key={e}>{e}</option>)}</select></Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Max turns per task"><input name="maxTurns" type="number" min={4} max={60} defaultValue={a.maxTurns} className={inputClass} /></Field>
                <Field label="Daily budget (USD)"><input name="dailyBudgetUsd" type="number" step="0.5" min={0} defaultValue={a.dailyBudgetUsd} className={inputClass} /></Field>
              </div>
              <Field label="Standing instructions" hint="Appended to this agent's job description."><textarea name="extraInstructions" rows={4} defaultValue={a.extraInstructions ?? ""} className={textareaClass} /></Field>
              <SubmitButton variant="secondary">Save configuration</SubmitButton>
            </form>
          </Panel>
          <Panel title="Job description">
            <div className="space-y-3 text-[12.5px]">
              <div><div className="mb-1 font-semibold text-fg-2">Responsibilities</div><ul className="list-disc space-y-0.5 pl-4">{def.responsibilities.map((r) => <li key={r}>{r}</li>)}</ul></div>
              <div><div className="mb-1 font-semibold text-fg-2">Objectives</div><ul className="list-disc space-y-0.5 pl-4">{def.objectives.map((r) => <li key={r}>{r}</li>)}</ul></div>
              <div><div className="mb-1 font-semibold text-fg-2">Quality bar</div><ul className="list-disc space-y-0.5 pl-4">{def.qualityBar.map((r) => <li key={r}>{r}</li>)}</ul></div>
              <div><div className="mb-1 font-semibold text-fg-2">Tools ({def.tools.length}{def.web ? " + web search/fetch" : ""})</div><div className="flex flex-wrap gap-1">{def.tools.map((t) => <Badge key={t.name} tone={t.governance === "files_approval" ? "warn" : "neutral"}>{t.name}</Badge>)}</div><div className="mt-1 text-[11.5px] text-fg-3">Amber tools file approval requests instead of acting directly.</div></div>
            </div>
          </Panel>
          <Panel title="Memory">
            {memories.length ? <ul className="space-y-2 text-[12.5px]">{memories.map((m) => <li key={m.id}><Badge>{m.kind}</Badge> {m.content}</li>)}</ul> : <div className="text-fg-3">No memories yet. Agents save lessons as they complete work.</div>}
          </Panel>
        </div>
      </div>
    </>
  );
}
