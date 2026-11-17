/** Agent KPIs and performance scores, computed from recorded activity. */
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import type { KpiKey } from "@/agents/definitions";
import { targetStatus, receivables } from "./finance";
import { formatMoney, pct } from "@/lib/money";

export type AgentStats = { slug: string; open: number; completed30: number; failed30: number; completedTotal: number; currentTask: string | null; currentTaskId: string | null; spendToday: number; spend30: number };

export async function agentStats(): Promise<Map<string, AgentStats>> {
  const rows = await db.execute(sql`
    SELECT a.slug,
      count(t.*) FILTER (WHERE t.status IN ('proposed','approved','queued','in_progress','awaiting_subtasks','awaiting_approval'))::int AS open,
      count(t.*) FILTER (WHERE t.status = 'completed' AND t.completed_at > now() - interval '30 days')::int AS completed30,
      count(t.*) FILTER (WHERE t.status = 'failed' AND t.completed_at > now() - interval '30 days')::int AS failed30,
      count(t.*) FILTER (WHERE t.status = 'completed')::int AS completed_total,
      (SELECT title FROM tasks x WHERE x.agent_slug = a.slug AND x.status = 'in_progress' ORDER BY x.started_at DESC LIMIT 1) AS current_task,
      (SELECT id FROM tasks x WHERE x.agent_slug = a.slug AND x.status = 'in_progress' ORDER BY x.started_at DESC LIMIT 1) AS current_task_id,
      coalesce((SELECT sum(r.cost_usd) FROM agent_runs r WHERE r.agent_slug = a.slug AND r.started_at > date_trunc('day', now())), 0)::float AS spend_today,
      coalesce((SELECT sum(r.cost_usd) FROM agent_runs r WHERE r.agent_slug = a.slug AND r.started_at > now() - interval '30 days'), 0)::float AS spend30
    FROM agents a LEFT JOIN tasks t ON t.agent_slug = a.slug GROUP BY a.slug`);
  const out = new Map<string, AgentStats>();
  for (const r of rows as unknown as Record<string, unknown>[]) {
    out.set(String(r.slug), {
      slug: String(r.slug), open: Number(r.open), completed30: Number(r.completed30), failed30: Number(r.failed30), completedTotal: Number(r.completed_total),
      currentTask: (r.current_task as string) ?? null, currentTaskId: (r.current_task_id as string) ?? null, spendToday: Number(r.spend_today), spend30: Number(r.spend30),
    });
  }
  return out;
}

/** Performance score (0–100): verified success rate over 30 days, discounted when there is little evidence. Null with no history. */
export function performanceScore(s: AgentStats | undefined): number | null {
  if (!s) return null;
  const decided = s.completed30 + s.failed30;
  if (decided === 0) return null;
  const rate = s.completed30 / decided;
  const confidence = Math.min(1, decided / 10);
  return Math.round((rate * confidence + 0.5 * (1 - confidence)) * 100);
}

async function one(q: ReturnType<typeof sql>): Promise<number> {
  const r = (await db.execute(q)) as unknown as { v: number | string | null }[];
  return Number(r[0]?.v ?? 0);
}

export async function computeKpi(key: KpiKey, agentSlug: string): Promise<string> {
  const d30 = sql`now() - interval '30 days'`;
  switch (key) {
    case "task_success_rate": {
      const c = await one(sql`SELECT count(*) v FROM tasks WHERE agent_slug=${agentSlug} AND status='completed' AND completed_at > ${d30}`);
      const f = await one(sql`SELECT count(*) v FROM tasks WHERE agent_slug=${agentSlug} AND status='failed' AND completed_at > ${d30}`);
      return c + f ? pct((c / (c + f)) * 100, 0) : "—";
    }
    case "tasks_completed_30d": return String(await one(sql`SELECT count(*) v FROM tasks WHERE agent_slug=${agentSlug} AND status='completed' AND completed_at > ${d30}`));
    case "commands_completed_30d": return String(await one(sql`SELECT count(*) v FROM commands WHERE status='completed' AND completed_at > ${d30}`));
    case "revenue_vs_target": {
      const t = await targetStatus("month");
      return t.configured ? `${pct(t.pctAchieved, 0)} of ${formatMoney(t.target.revenueTargetMinor, "NGN", { compact: true })}` : "No target set";
    }
    case "leads_created_30d": return String(await one(sql`SELECT count(*) v FROM leads WHERE created_by=${`agent:${agentSlug}`} AND created_at > ${d30}`));
    case "hot_leads_30d": return String(await one(sql`SELECT count(*) v FROM leads WHERE created_by=${`agent:${agentSlug}`} AND priority='hot' AND created_at > ${d30}`));
    case "avg_lead_score_30d": { const v = await one(sql`SELECT round(avg(score)) v FROM leads WHERE created_by=${`agent:${agentSlug}`} AND created_at > ${d30}`); return v ? String(v) : "—"; }
    case "intel_items_30d": return String(await one(sql`SELECT count(*) v FROM intel_items WHERE agent_slug=${agentSlug} AND created_at > ${d30}`));
    case "verified_intel_ratio": {
      const all = await one(sql`SELECT count(*) v FROM intel_items WHERE agent_slug=${agentSlug} AND created_at > ${d30}`);
      const src = await one(sql`SELECT count(*) v FROM intel_items WHERE agent_slug=${agentSlug} AND created_at > ${d30} AND jsonb_array_length(source_urls) > 0`);
      return all ? pct((src / all) * 100, 0) : "—";
    }
    case "deliverables_30d": return String(await one(sql`SELECT count(*) v FROM deliverables WHERE agent_slug=${agentSlug} AND created_at > ${d30}`));
    case "deliverable_approval_rate": {
      const rev = await one(sql`SELECT count(*) v FROM deliverables WHERE agent_slug=${agentSlug} AND status IN ('approved','published','changes_requested','rejected')`);
      const ok = await one(sql`SELECT count(*) v FROM deliverables WHERE agent_slug=${agentSlug} AND status IN ('approved','published')`);
      return rev ? pct((ok / rev) * 100, 0) : "—";
    }
    case "content_items_30d": return String(await one(sql`SELECT count(*) v FROM content_items WHERE created_by=${`agent:${agentSlug}`} AND created_at > ${d30}`));
    case "posts_published_30d": return String(await one(sql`SELECT count(*) v FROM content_items WHERE status='published' AND published_at > ${d30}`));
    case "overdue_followups": return String(await one(sql`SELECT count(*) v FROM follow_ups WHERE status='open' AND due_at < now()`));
    case "proposals_sent_30d": return String(await one(sql`SELECT count(*) v FROM proposals WHERE sent_at > ${d30}`));
    case "leads_won_30d": return String(await one(sql`SELECT count(*) v FROM leads WHERE stage='won' AND stage_changed_at > ${d30}`));
    case "receivables_overdue": { const r = await receivables(); return `${formatMoney(r.overdueMinor)} (${r.overdueCount})`; }
    case "proposed_tasks_pending": return String(await one(sql`SELECT count(*) v FROM tasks WHERE status='proposed'`));
    case "site_pages_published": return String(await one(sql`SELECT count(*) v FROM site_pages WHERE status='published'`));
  }
}
