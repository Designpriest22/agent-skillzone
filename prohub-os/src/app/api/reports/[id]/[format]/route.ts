import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { reports } from "@/db/schema";
import { getUser } from "@/lib/auth";
import { reportToCsv, reportToPdf, reportToXlsx } from "@/services/report-render";
import { logActivity } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string; format: string }> }) {
  const user = await getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const { id, format } = await ctx.params;
  const [r] = await db.select().from(reports).where(eq(reports.id, id));
  if (!r) return new Response("Not found", { status: 404 });
  const base = `${r.kind}-${r.createdAt.toISOString().slice(0, 10)}`;
  await logActivity({ type: "user", id: user.id }, "report.downloaded", { type: "report", id }, { format });
  if (format === "csv") return new Response(reportToCsv(r), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${base}.csv"` } });
  if (format === "xlsx") return new Response(new Uint8Array(await reportToXlsx(r)), { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="${base}.xlsx"` } });
  if (format === "pdf") return new Response(new Uint8Array(await reportToPdf(r)), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${base}.pdf"` } });
  return new Response("Unsupported format", { status: 400 });
}
