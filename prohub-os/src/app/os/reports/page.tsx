import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { reports } from "@/db/schema";
import { PageHeader, Panel, Table, Th, Td, Badge, ErrorNote } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { generateReportAction } from "../actions";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Reports" };
const KINDS = [["daily_briefing", "Daily executive briefing"], ["daily_finance", "Daily financial report"], ["weekly_business", "Weekly business performance"], ["monthly_finance", "Monthly financial report"], ["social_weekly", "Weekly social report"], ["social_monthly", "Monthly social report"]] as const;

export default async function Reports({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const rows = await db.select().from(reports).orderBy(desc(reports.createdAt)).limit(200);
  return (
    <>
      <PageHeader title="Reports centre" subtitle="Generated on schedule and on demand. Numbers come from the database; agents add narrative. Download as PDF, Excel or CSV." />
      {sp.error && <div className="mb-3"><ErrorNote>{sp.error}</ErrorNote></div>}
      <Panel title="Generate now" className="mb-4"><div className="flex flex-wrap gap-2">{KINDS.map(([k, l]) => <form key={k} action={generateReportAction}><input type="hidden" name="kind" value={k} /><SubmitButton size="sm" variant="secondary">{l}</SubmitButton></form>)}</div></Panel>
      <Panel pad={false}><Table><thead><tr><Th>Report</Th><Th>Period</Th><Th>Narrative</Th><Th>Generated</Th><Th>Download</Th></tr></thead><tbody>
        {rows.map((r) => <tr key={r.id} className="hover:bg-panel-2"><Td><Link href={`/os/reports/${r.id}`} className="font-medium hover:text-accent">{r.title}</Link></Td><Td className="whitespace-nowrap text-fg-2">{formatDate(r.periodStart)} – {formatDate(r.periodEnd)}</Td><Td>{r.narrative ? <Badge tone="ok">written</Badge> : <Badge>data only</Badge>}</Td><Td className="text-fg-3">{formatDate(r.createdAt, true)} · {r.generatedBy.split(":")[0]}</Td>
          <Td className="space-x-2 whitespace-nowrap">{["pdf", "xlsx", "csv"].map((f) => <a key={f} href={`/api/reports/${r.id}/${f}`} className="text-accent">{f.toUpperCase()}</a>)}</Td></tr>)}
        {!rows.length && <tr><Td colSpan={5} className="py-8 text-center text-fg-3">No reports yet.</Td></tr>}
      </tbody></Table></Panel>
    </>
  );
}
