import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { knowledgeDocs, agentMemories, KNOWLEDGE_CATEGORIES } from "@/db/schema";
import { PageHeader, Panel, Badge, Field, inputClass, textareaClass, ErrorNote, Table, Th, Td } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { saveKnowledgeAction, deleteKnowledgeAction } from "../actions";
import { searchKnowledge } from "@/agents/memory";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Knowledge base" };

export default async function Knowledge({ searchParams }: { searchParams: Promise<{ edit?: string; q?: string; error?: string }> }) {
  const sp = await searchParams;
  const docs = await db.select().from(knowledgeDocs).orderBy(desc(knowledgeDocs.pinned), desc(knowledgeDocs.updatedAt));
  const editing = sp.edit ? docs.find((d) => d.id === sp.edit) : undefined;
  const results = sp.q ? await searchKnowledge(sp.q, { limit: 8 }) : null;
  const memories = await db.select().from(agentMemories).orderBy(desc(agentMemories.createdAt)).limit(40);
  return (
    <>
      <PageHeader title="Knowledge base" subtitle="Shared organisational memory. Pinned documents are given to every agent on every task; others are retrieved by search (RAG)." />
      {sp.error && <div className="mb-3"><ErrorNote>{sp.error}</ErrorNote></div>}
      <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          <Panel title={<form className="flex gap-2 normal-case"><input name="q" defaultValue={sp.q} placeholder="Test retrieval: search as an agent would" className={inputClass + " h-7 w-80"} /></form>}>
            {results ? (results.documents.length ? <ul className="space-y-2">{results.documents.map((d) => <li key={d.id}><a className="font-medium hover:text-accent" href={`/os/knowledge?edit=${d.id}`}>{d.title}</a> <Badge>{d.category}</Badge><div className="line-clamp-2 text-[12.5px] text-fg-2">{d.excerpt}</div></li>)}</ul> : <div className="text-fg-3">No matches.</div>)
              : <Table><thead><tr><Th>Document</Th><Th>Category</Th><Th>Pinned</Th><Th>Updated</Th><Th /></tr></thead><tbody>
                {docs.map((d) => <tr key={d.id}><Td><a className="font-medium hover:text-accent" href={`/os/knowledge?edit=${d.id}`}>{d.title}</a><div className="text-[11.5px] text-fg-3">{d.createdBy} · {d.content.length.toLocaleString()} chars</div></Td><Td><Badge>{d.category.replace(/_/g, " ")}</Badge></Td><Td>{d.pinned ? <Badge tone="accent">pinned</Badge> : ""}</Td><Td className="text-fg-3">{formatDate(d.updatedAt)}</Td>
                  <Td><form action={deleteKnowledgeAction}><input type="hidden" name="id" value={d.id} /><SubmitButton size="sm" variant="ghost" confirm="Delete this document?">Delete</SubmitButton></form></Td></tr>)}
              </tbody></Table>}
          </Panel>
          <Panel title="Agent memories (individual learning)" pad={false}><Table><thead><tr><Th>Agent</Th><Th>Kind</Th><Th>Memory</Th><Th>Saved</Th></tr></thead><tbody>
            {memories.map((m) => <tr key={m.id}><Td className="text-fg-2">{m.agentSlug}</Td><Td><Badge>{m.kind}</Badge></Td><Td>{m.content}</Td><Td className="text-fg-3">{formatDate(m.createdAt)}</Td></tr>)}
            {!memories.length && <tr><Td colSpan={4} className="py-6 text-center text-fg-3">Agents save lessons after completing work.</Td></tr>}
          </tbody></Table></Panel>
        </div>
        <Panel title={editing ? "Edit document" : "Add document"}>
          <form action={saveKnowledgeAction} className="space-y-3" key={editing?.id ?? "new"}>
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <Field label="Title"><input name="title" required defaultValue={editing?.title} className={inputClass} /></Field>
            <Field label="Category"><select name="category" defaultValue={editing?.category ?? "sop"} className={inputClass}>{KNOWLEDGE_CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}</select></Field>
            <Field label="Content" hint="Plain text or Markdown. Be factual — agents treat this as the source of truth."><textarea name="content" required rows={16} defaultValue={editing?.content} className={textareaClass + " font-mono text-[12.5px]"} /></Field>
            <Field label="Tags (comma separated)"><input name="tags" defaultValue={editing?.tags.join(", ")} className={inputClass} /></Field>
            <label className="flex items-center gap-2 text-[12.5px]"><input type="checkbox" name="pinned" defaultChecked={editing?.pinned} /> Pin (include in every agent's context — keep pinned docs concise)</label>
            <div className="flex gap-2"><SubmitButton>{editing ? "Save changes" : "Add document"}</SubmitButton>{editing && <a href="/os/knowledge" className="self-center text-[12.5px] text-fg-3">Cancel</a>}</div>
          </form>
        </Panel>
      </div>
    </>
  );
}

