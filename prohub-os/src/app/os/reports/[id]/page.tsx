import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { reports } from "@/db/schema";
import { PageHeader, Panel, LinkButton, InfoNote } from "@/components/ui";
import { ReportSections } from "@/components/report-view";
import type { ReportData } from "@/services/reports";
import { formatDate } from "@/lib/utils";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [r] = await db.select().from(reports).where(eq(reports.id, id));
  if (!r) notFound();
  const data = r.data as unknown as ReportData;
  return (
    <>
      <PageHeader title={r.title} subtitle={`Generated ${formatDate(r.createdAt, true)} by ${r.generatedBy}`} actions={["pdf", "xlsx", "csv"].map((f) => <LinkButton key={f} href={`/api/reports/${r.id}/${f}`} size="sm">{f.toUpperCase()}</LinkButton>)} />
      {r.narrative ? <Panel title="Executive narrative" className="mb-4"><div className="prose-os"><ReactMarkdown remarkPlugins={[remarkGfm]}>{r.narrative}</ReactMarkdown></div></Panel>
        : <div className="mb-4"><InfoNote>No narrative yet. Scheduled reviews add one when the AI engine is connected; the figures below are complete without it.</InfoNote></div>}
      <ReportSections sections={data.sections ?? []} />
    </>
  );
}
