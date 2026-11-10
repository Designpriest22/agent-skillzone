import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import type { ReportData, Section } from "./reports";

type ReportLike = { title: string; createdAt: Date; data: Record<string, unknown>; narrative: string | null };

const sectionsOf = (r: ReportLike) => ((r.data as unknown as ReportData).sections ?? []) as Section[];

function csvCell(v: unknown) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function reportToCsv(r: ReportLike): string {
  const lines: string[] = [csvCell(r.title), csvCell(`Generated ${r.createdAt.toISOString()}`), ""];
  for (const s of sectionsOf(r)) {
    lines.push(csvCell(s.title));
    if (s.kind === "kv") s.rows.forEach((row) => lines.push([row.label, row.value].map(csvCell).join(",")));
    if (s.kind === "table") { lines.push(s.columns.map(csvCell).join(",")); s.rows.forEach((row) => lines.push(row.map(csvCell).join(","))); }
    if (s.kind === "list") (s.items.length ? s.items : [s.empty ?? "None"]).forEach((i) => lines.push(csvCell(i)));
    if (s.kind === "text") lines.push(csvCell(s.body));
    lines.push("");
  }
  if (r.narrative) lines.push("Narrative", csvCell(r.narrative));
  return lines.join("\n");
}

export async function reportToXlsx(r: ReportLike): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Prohub AI OS";
  const summary = wb.addWorksheet("Report");
  summary.addRow([r.title]).font = { bold: true, size: 14 };
  summary.addRow([`Generated ${r.createdAt.toISOString()}`]);
  summary.addRow([]);
  for (const s of sectionsOf(r)) {
    if (s.kind === "table") {
      const ws = wb.addWorksheet(s.title.replace(/[^\w\s]/g, "").slice(0, 28) || "Table");
      ws.addRow(s.columns).font = { bold: true };
      s.rows.forEach((row) => ws.addRow(row));
      ws.columns.forEach((c) => { c.width = 22; });
      summary.addRow([s.title, `See sheet "${ws.name}" (${s.rows.length} rows)`]).font = { bold: true };
      continue;
    }
    summary.addRow([s.title]).font = { bold: true };
    if (s.kind === "kv") s.rows.forEach((row) => summary.addRow([row.label, row.value]));
    if (s.kind === "list") (s.items.length ? s.items : [s.empty ?? "None"]).forEach((i) => summary.addRow([i]));
    if (s.kind === "text") summary.addRow([s.body]);
    summary.addRow([]);
  }
  if (r.narrative) { summary.addRow(["Narrative"]).font = { bold: true }; summary.addRow([r.narrative]); }
  summary.getColumn(1).width = 48;
  summary.getColumn(2).width = 48;
  return Buffer.from(await wb.xlsx.writeBuffer());
}

/** Built-in PDF fonts lack the Naira glyph; render it as "NGN". */
const pdfText = (s: string) => s.replace(/₦\s?/g, "NGN ").replace(/[^\x09\x0A\x0D\x20-\x7E -ÿ]/g, "");

export function reportToPdf(r: ReportLike): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48, info: { Title: r.title, Author: "Prohub AI OS" } });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.font("Helvetica-Bold").fontSize(16).text(pdfText(r.title));
    doc.font("Helvetica").fontSize(9).fillColor("#666").text(`Generated ${r.createdAt.toISOString()} · Figures computed from recorded data`).fillColor("#000");
    doc.moveDown();
    if (r.narrative) {
      doc.font("Helvetica-Bold").fontSize(11).text("Executive narrative");
      doc.font("Helvetica").fontSize(9.5).text(pdfText(r.narrative.replace(/[#*_`]/g, "")));
      doc.moveDown();
    }
    for (const s of sectionsOf(r)) {
      doc.font("Helvetica-Bold").fontSize(11).text(pdfText(s.title));
      doc.font("Helvetica").fontSize(9.5);
      if (s.kind === "kv") s.rows.forEach((row) => doc.text(pdfText(`${row.label}: ${row.value}`)));
      if (s.kind === "list") (s.items.length ? s.items : [s.empty ?? "None"]).forEach((i) => doc.text(pdfText(`• ${i}`)));
      if (s.kind === "text") doc.text(pdfText(s.body));
      if (s.kind === "table") {
        if (!s.rows.length) doc.text(pdfText(s.empty ?? "No rows"));
        else {
          doc.font("Helvetica-Bold").text(pdfText(s.columns.join("  |  ")));
          doc.font("Helvetica");
          s.rows.slice(0, 200).forEach((row) => doc.text(pdfText(row.join("  |  "))));
        }
      }
      doc.moveDown(0.8);
    }
    doc.end();
  });
}
