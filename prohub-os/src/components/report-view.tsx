import type { Section } from "@/services/reports";
import { Panel, Table, Th, Td, KV } from "./ui";

export function ReportSections({ sections }: { sections: Section[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {sections.map((s) => (
        <Panel key={s.title} title={s.title} className={s.kind === "table" ? "md:col-span-2" : ""} pad={s.kind !== "table"}>
          {s.kind === "kv" && <KV rows={s.rows} />}
          {s.kind === "list" && (s.items.length ? <ul className="list-disc space-y-1 pl-4">{s.items.map((i, n) => <li key={n}>{i}</li>)}</ul> : <div className="text-fg-3">{s.empty ?? "None"}</div>)}
          {s.kind === "text" && <p className="text-fg-2">{s.body}</p>}
          {s.kind === "table" && (s.rows.length ? <Table><thead><tr>{s.columns.map((c) => <Th key={c}>{c}</Th>)}</tr></thead><tbody>{s.rows.map((r, n) => <tr key={n}>{r.map((c, k) => <Td key={k} className={typeof c === "number" ? "num" : ""}>{c}</Td>)}</tr>)}</tbody></Table> : <div className="p-4 text-fg-3">{s.empty ?? "No rows"}</div>)}
        </Panel>
      ))}
    </div>
  );
}
