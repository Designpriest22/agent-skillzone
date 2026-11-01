import { desc, eq, and } from "drizzle-orm";
import { db } from "@/db/client";
import { intelItems, INTEL_CATEGORIES } from "@/db/schema";
import { PageHeader, Panel, Tabs, Badge, StatusBadge, Empty } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { intelStatusAction, intelToTaskAction } from "../actions";
import { formatMoney } from "@/lib/money";
import { timeAgo } from "@/lib/utils";

export const metadata = { title: "Intelligence centre" };
const LABEL: Record<string, string> = { industry_trend: "Industry trends", technology: "New technologies", competitor: "Competitors", potential_client: "Potential clients", business_opportunity: "Opportunities", revenue_opportunity: "Revenue", marketing_recommendation: "Marketing", operational_improvement: "Operations" };

export default async function Intelligence({ searchParams }: { searchParams: Promise<{ cat?: string; status?: string }> }) {
  const sp = await searchParams;
  const cat = INTEL_CATEGORIES.includes(sp.cat as (typeof INTEL_CATEGORIES)[number]) ? (sp.cat as (typeof INTEL_CATEGORIES)[number]) : undefined;
  const status = (sp.status ?? "new") as "new" | "actioned" | "dismissed";
  const rows = await db.select().from(intelItems).where(and(cat ? eq(intelItems.category, cat) : undefined, eq(intelItems.status, status))).orderBy(desc(intelItems.createdAt)).limit(120);
  return (
    <>
      <PageHeader title="Intelligence centre" subtitle="Daily research from the agents. Confidence: verified = sourced from a page the agent read; likely = supported inference; assumption = unverified." />
      <Tabs active={cat ? LABEL[cat] : "All"} tabs={[{ href: `/os/intelligence?status=${status}`, label: "All" }, ...INTEL_CATEGORIES.map((c) => ({ href: `/os/intelligence?cat=${c}&status=${status}`, label: LABEL[c] }))]} />
      <div className="mb-3 flex gap-3 text-[12.5px]">{(["new", "actioned", "dismissed"] as const).map((s) => <a key={s} href={`/os/intelligence?status=${s}${cat ? `&cat=${cat}` : ""}`} className={s === status ? "font-semibold text-fg" : "text-fg-3 hover:text-fg"}>{s}</a>)}</div>
      <div className="grid gap-3 md:grid-cols-2">
        {rows.map((i) => (
          <Panel key={i.id} title={<span className="flex items-center gap-2 normal-case tracking-normal"><Badge>{LABEL[i.category]}</Badge><StatusBadge status={i.confidence} /></span>} actions={<span className="text-[12px] text-fg-3">{i.agentSlug} · {timeAgo(i.createdAt)}</span>}>
            <h3 className="font-semibold">{i.title}</h3>
            <p className="mt-1 text-fg-2">{i.summary}</p>
            {i.recommendation && <p className="mt-2"><span className="font-medium">Recommendation: </span>{i.recommendation}</p>}
            {i.economics && <div className="mt-2 grid grid-cols-2 gap-2 rounded-md bg-panel-2 p-2 text-[12.5px]">
              <div><span className="text-fg-3">Est. cost </span><span className="num">{formatMoney(i.economics.estCostMinor ?? null)}</span></div><div><span className="text-fg-3">Est. revenue </span><span className="num">{formatMoney(i.economics.estRevenueMinor ?? null)}</span></div>
              {i.economics.requirements && <div className="col-span-2"><span className="text-fg-3">Requires: </span>{i.economics.requirements}</div>}{i.economics.risks && <div className="col-span-2"><span className="text-fg-3">Risks: </span>{i.economics.risks}</div>}</div>}
            {i.sourceUrls.length > 0 && <ul className="mt-2 space-y-0.5 text-[12px]">{i.sourceUrls.map((u) => <li key={u}><a href={u} target="_blank" rel="noreferrer" className="break-all text-accent">{u}</a></li>)}</ul>}
            {status === "new" && <div className="mt-3 flex gap-2">
              <form action={intelToTaskAction}><input type="hidden" name="id" value={i.id} /><SubmitButton size="sm">Act on this</SubmitButton></form>
              <form action={intelStatusAction}><input type="hidden" name="id" value={i.id} /><input type="hidden" name="status" value="dismissed" /><input type="hidden" name="back" value={`/os/intelligence?status=new${cat ? `&cat=${cat}` : ""}`} /><SubmitButton size="sm" variant="ghost">Dismiss</SubmitButton></form>
            </div>}
          </Panel>
        ))}
      </div>
      {!rows.length && <Empty title="No intelligence in this view">The Research agent publishes findings every morning; you can also ask for specific research in the Command centre.</Empty>}
    </>
  );
}
