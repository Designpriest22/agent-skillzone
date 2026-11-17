import Link from "next/link";
import { asc, desc, gte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { socialAccounts, contentItems, campaigns, sitePages, portfolioItems, testimonials, services, SOCIAL_PLATFORMS } from "@/db/schema";
import { PageHeader, Panel, StatusBadge, Tabs, Table, Th, Td, Badge, Field, inputClass, textareaClass, ErrorNote, Stat, Empty, InfoNote } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { addSocialAccountAction, contentItemAction, websiteContentAction } from "../actions";
import { campaignRoi } from "@/services/finance";
import { formatMoney, pct } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { isConfigured } from "@/integrations/registry";

export const metadata = { title: "Marketing centre" };

export default async function Marketing({ searchParams }: { searchParams: Promise<{ tab?: string; error?: string }> }) {
  const sp = await searchParams;
  const tab = sp.tab ?? "overview";
  const labels: Record<string, string> = { overview: "Overview", calendar: "Content calendar", campaigns: "Campaigns", website: "Website" };
  return (
    <>
      <PageHeader title="Marketing centre" subtitle="Prohub's own marketing engine: channels, content, campaigns and the agency website. Metrics appear only from connected APIs or manual entry." />
      {sp.error && <div className="mb-3"><ErrorNote>{sp.error}</ErrorNote></div>}
      <Tabs active={labels[tab] ?? "Overview"} tabs={Object.entries(labels).map(([k, v]) => ({ href: `/os/marketing?tab=${k}`, label: v }))} />
      {tab === "overview" && <Overview />}
      {tab === "calendar" && <Calendar />}
      {tab === "campaigns" && <Campaigns />}
      {tab === "website" && <Website />}
    </>
  );
}

async function Overview() {
  const since = new Date(Date.now() - 30 * 86400_000);
  const [accounts, [stats], leadsFromMarketing, spend, meta, linkedin] = await Promise.all([
    db.select().from(socialAccounts),
    db.select({ scheduled: sql<number>`count(*) filter (where status='scheduled')::int`, published: sql<number>`count(*) filter (where status='published' and published_at > ${since.toISOString()})::int`, awaiting: sql<number>`count(*) filter (where status='awaiting_approval')::int`, manual: sql<number>`count(*) filter (where status='manual_publish')::int` }).from(contentItems),
    db.execute(sql`SELECT count(*)::int n FROM leads WHERE source IN ('website_form','social','whatsapp') AND created_at > ${since.toISOString()}`),
    db.execute(sql`SELECT coalesce(sum(amount_base_minor),0)::bigint v FROM transactions WHERE type='expense' AND category IN ('ads','marketing') AND occurred_at > ${since.toISOString()}`),
    isConfigured("meta"), isConfigured("linkedin"),
  ]);
  const l = (leadsFromMarketing as unknown as { n: number }[])[0];
  const sp = (spend as unknown as { v: string }[])[0];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Scheduled posts" value={stats.scheduled} /><Stat label="Published (30d)" value={stats.published} /><Stat label="Awaiting approval" value={stats.awaiting} href="/os/approvals" />
        <Stat label="Inbound leads (30d)" value={l.n} sub="website, social, WhatsApp" /><Stat label="Marketing spend (30d)" value={formatMoney(Number(sp.v), "NGN", { compact: true })} sub="recorded expenses" />
      </div>
      {stats.manual > 0 && <InfoNote>{stats.manual} approved item(s) are in the manual-publish queue (platform API not connected). See the Content calendar tab.</InfoNote>}
      <Panel title="Social accounts">
        <Table><thead><tr><Th>Platform</Th><Th>Handle</Th><Th>API connection</Th><Th className="text-right">Followers</Th><Th>As of</Th></tr></thead><tbody>
          {accounts.map((a) => <tr key={a.id}><Td className="capitalize">{a.platform}</Td><Td>{a.handle}</Td><Td>{(["facebook", "instagram"].includes(a.platform) && meta) || (a.platform === "linkedin" && linkedin) ? <Badge tone="ok">connected</Badge> : <Badge>manual</Badge>}</Td><Td className="num text-right">{a.followers?.toLocaleString() ?? "—"}</Td><Td className="text-fg-3">{formatDate(a.followersUpdatedAt)}</Td></tr>)}
          {!accounts.length && <tr><Td colSpan={5} className="py-6 text-center text-fg-3">Add Prohub's social accounts below.</Td></tr>}
        </tbody></Table>
        <form action={addSocialAccountAction} className="mt-3 flex flex-wrap items-end gap-2">
          <Field label="Platform"><select name="platform" className={inputClass + " w-36"}>{SOCIAL_PLATFORMS.map((p) => <option key={p}>{p}</option>)}</select></Field>
          <Field label="Handle"><input name="handle" required className={inputClass + " w-48"} placeholder="@prohub" /></Field>
          <Field label="Current followers (optional)"><input name="followers" type="number" className={inputClass + " w-40"} /></Field>
          <SubmitButton variant="secondary">Add account</SubmitButton>
        </form>
      </Panel>
    </div>
  );
}

async function Calendar() {
  const from = new Date(Date.now() - 14 * 86400_000);
  const items = await db.select().from(contentItems).where(gte(sql`coalesce(${contentItems.scheduledAt}, ${contentItems.createdAt})`, from.toISOString())).orderBy(asc(sql`coalesce(${contentItems.scheduledAt}, ${contentItems.createdAt})`)).limit(300);
  const byDay = new Map<string, typeof items>();
  for (const i of items) { const k = (i.scheduledAt ?? i.createdAt).toISOString().slice(0, 10); byDay.set(k, [...(byDay.get(k) ?? []), i]); }
  if (!items.length) return <Empty title="No content planned">Ask the Social Media or Content agent to build a calendar from the Command centre.</Empty>;
  return (
    <div className="space-y-3">
      {[...byDay.entries()].map(([day, list]) => (
        <Panel key={day} title={formatDate(day)} pad={false}>
          <Table><tbody>{list.map((i) => (
            <tr key={i.id}>
              <Td className="w-[110px] capitalize">{i.platform}<div className="text-[11.5px] text-fg-3">{i.format}</div></Td>
              <Td><div className="font-medium">{i.title}</div><div className="line-clamp-2 text-[12.5px] text-fg-2">{i.caption}</div><div className="mt-0.5 text-[11.5px] text-fg-3">objective: {i.objective.replace(/_/g, " ")}{i.scheduledAt ? ` · ${formatDate(i.scheduledAt, true)}` : ""}</div>{i.error && <div className="text-[12px] text-warn">{i.error}</div>}</Td>
              <Td className="w-[130px]"><StatusBadge status={i.status} />{i.mediaDeliverableId && <div><Link className="text-[12px] text-accent" href={`/os/deliverables/${i.mediaDeliverableId}`}>media</Link></div>}</Td>
              <Td className="w-[300px]">
                {i.status === "manual_publish" && <form action={contentItemAction} className="flex gap-1"><input type="hidden" name="id" value={i.id} /><input type="hidden" name="op" value="manual_published" /><input name="url" placeholder="Post URL" className={inputClass + " h-7"} /><SubmitButton size="sm" variant="secondary">Mark published</SubmitButton></form>}
                {i.status === "published" && <details><summary className="cursor-pointer text-[12px] text-accent">{Object.keys(i.metrics).length ? Object.entries(i.metrics).map(([k, v]) => `${k} ${v}`).join(" · ") : "Enter metrics"}</summary>
                  <form action={contentItemAction} className="mt-1 grid grid-cols-3 gap-1"><input type="hidden" name="id" value={i.id} /><input type="hidden" name="op" value="metrics" />{["impressions", "reach", "likes", "comments", "shares", "clicks"].map((k) => <input key={k} name={k} placeholder={k} defaultValue={i.metrics[k] ?? ""} className={inputClass + " h-7 text-[12px]"} />)}<SubmitButton size="sm" variant="secondary">Save</SubmitButton></form></details>}
              </Td>
            </tr>
          ))}</tbody></Table>
        </Panel>
      ))}
    </div>
  );
}

async function Campaigns() {
  const [rows, roi] = await Promise.all([db.select().from(campaigns).orderBy(desc(campaigns.createdAt)), campaignRoi()]);
  const roiMap = new Map(roi.map((r) => [r.id, r]));
  return (
    <Panel pad={false}><Table><thead><tr><Th>Campaign</Th><Th>Objective</Th><Th>Channels</Th><Th>Status</Th><Th>Dates</Th><Th className="text-right">Budget</Th><Th className="text-right">Recorded spend</Th><Th className="text-right">Leads</Th><Th className="text-right">Won</Th><Th className="text-right">Attributed revenue</Th><Th className="text-right">ROI</Th></tr></thead><tbody>
      {rows.map((c) => { const r = roiMap.get(c.id); return (
        <tr key={c.id}><Td className="font-medium">{c.name}{c.planDeliverableId && <div><Link className="text-[12px] text-accent" href={`/os/deliverables/${c.planDeliverableId}`}>plan</Link></div>}</Td><Td className="text-fg-2">{c.objective.replace(/_/g, " ")}</Td><Td className="text-fg-2">{c.channels.join(", ")}</Td><Td><StatusBadge status={c.status} /></Td><Td className="whitespace-nowrap text-fg-3">{c.startDate ?? "—"} → {c.endDate ?? "—"}</Td>
          <Td className="num text-right">{formatMoney(c.budgetMinor)}</Td><Td className="num text-right">{formatMoney(r?.spendMinor ?? 0)}</Td><Td className="num text-right">{r?.leads ?? 0}</Td><Td className="num text-right">{r?.won ?? 0}</Td><Td className="num text-right">{formatMoney(r?.revenueMinor ?? 0)}</Td><Td className="num text-right">{pct(r?.roiPct ?? null, 0)}</Td></tr>
      ); })}
      {!rows.length && <tr><Td colSpan={11} className="py-8 text-center text-fg-3">No campaigns yet.</Td></tr>}
    </tbody></Table></Panel>
  );
}

async function Website() {
  const [pages, port, tests, svc] = await Promise.all([db.select().from(sitePages).orderBy(desc(sitePages.updatedAt)), db.select().from(portfolioItems).orderBy(desc(portfolioItems.createdAt)), db.select().from(testimonials).orderBy(desc(testimonials.createdAt)), db.select({ slug: services.slug, name: services.name }).from(services)]);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Landing pages" className="lg:col-span-2" pad={false}><Table><thead><tr><Th>Page</Th><Th>Status</Th><Th>Updated</Th><Th /></tr></thead><tbody>
        {pages.map((p) => <tr key={p.id}><Td><span className="font-medium">{p.title}</span><div className="text-[12px] text-fg-3">/p/{p.slug}</div></Td><Td><StatusBadge status={p.status} /></Td><Td className="text-fg-3">{formatDate(p.updatedAt, true)}</Td><Td><Link target="_blank" className="text-accent" href={`/p/${p.slug}${p.status === "published" ? "" : "?preview=1"}`}>{p.status === "published" ? "View" : "Preview"} ↗</Link></Td></tr>)}
        {!pages.length && <tr><Td colSpan={4} className="py-6 text-center text-fg-3">The Web Development agent creates landing pages; publishing requires approval.</Td></tr>}
      </tbody></Table></Panel>
      <Panel title="Portfolio (owner-verified work only)">
        <ul className="mb-3 space-y-1">{port.map((p) => <li key={p.id} className="flex justify-between gap-2"><span>{p.title} <span className="text-fg-3">{p.clientName}</span></span><Badge tone={p.published ? "ok" : "neutral"}>{p.published ? "published" : "hidden"}</Badge></li>)}{!port.length && <li className="text-fg-3">No portfolio items. The site hides this section until you add real work.</li>}</ul>
        <form action={websiteContentAction} className="space-y-2"><input type="hidden" name="kind" value="portfolio" />
          <input name="title" required placeholder="Project title" className={inputClass} /><input name="clientName" placeholder="Client (with permission)" className={inputClass} />
          <select name="serviceSlug" className={inputClass}><option value="">Service</option>{svc.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}</select>
          <textarea name="summary" required rows={2} placeholder="What we did" className={textareaClass} /><input name="results" placeholder="Verified results (optional)" className={inputClass} /><input name="imageUrl" type="url" placeholder="Image URL" className={inputClass} />
          <label className="flex items-center gap-2 text-[12.5px]"><input type="checkbox" name="published" /> Publish on website</label><SubmitButton size="sm" variant="secondary">Add portfolio item</SubmitButton></form>
      </Panel>
      <Panel title="Testimonials (genuine, consented only)">
        <ul className="mb-3 space-y-1">{tests.map((t) => <li key={t.id} className="flex justify-between gap-2"><span className="truncate">“{t.quote.slice(0, 60)}” — {t.author}</span><Badge tone={t.verified ? "ok" : "neutral"}>{t.verified ? "verified" : "unverified"}</Badge></li>)}{!tests.length && <li className="text-fg-3">No testimonials. Only verified ones are shown on the site.</li>}</ul>
        <form action={websiteContentAction} className="space-y-2"><input type="hidden" name="kind" value="testimonial" />
          <textarea name="quote" required rows={2} placeholder="Quote" className={textareaClass} /><input name="author" required placeholder="Name, role" className={inputClass} /><input name="company" placeholder="Company" className={inputClass} />
          <label className="flex items-center gap-2 text-[12.5px]"><input type="checkbox" name="verified" /> I confirm this is genuine and the client consented</label><SubmitButton size="sm" variant="secondary">Add testimonial</SubmitButton></form>
      </Panel>
    </div>
  );
}

