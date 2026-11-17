/**
 * Retrieval layer (RAG). PostgreSQL full-text search over shared knowledge and per-agent memory.
 * Zero extra infrastructure or embedding cost; upgrade path to pgvector documented in docs/ARCHITECTURE.md.
 */
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { knowledgeDocs, agentMemories } from "@/db/schema";

export async function searchKnowledge(query: string, opts: { agentSlug?: string; category?: string; limit?: number } = {}) {
  const limit = opts.limit ?? 5;
  const q = sql`websearch_to_tsquery('english', ${query})`;
  const docs = await db
    .select({ id: knowledgeDocs.id, category: knowledgeDocs.category, title: knowledgeDocs.title, content: knowledgeDocs.content, rank: sql<number>`ts_rank(${knowledgeDocs.search}, ${q})` })
    .from(knowledgeDocs)
    .where(and(sql`${knowledgeDocs.search} @@ ${q}`, opts.category ? eq(knowledgeDocs.category, opts.category as typeof knowledgeDocs.$inferSelect.category) : undefined))
    .orderBy(sql`4 desc`).limit(limit);
  // Fallback for very short / unusual queries that FTS stems away.
  const fallback = docs.length ? [] : await db
    .select({ id: knowledgeDocs.id, category: knowledgeDocs.category, title: knowledgeDocs.title, content: knowledgeDocs.content })
    .from(knowledgeDocs).where(sql`${knowledgeDocs.title} ilike ${"%" + query + "%"} or ${knowledgeDocs.content} ilike ${"%" + query + "%"}`).limit(limit);
  const memories = opts.agentSlug ? await relevantMemories(opts.agentSlug, query, 5) : [];
  return {
    documents: [...docs, ...fallback].map((d) => ({ id: d.id, category: d.category, title: d.title, excerpt: d.content.slice(0, 2500) })),
    my_memories: memories,
  };
}

export async function relevantMemories(agentSlug: string, query: string, limit = 6) {
  const q = sql`websearch_to_tsquery('english', ${query})`;
  const matched = await db
    .select({ id: agentMemories.id, kind: agentMemories.kind, content: agentMemories.content })
    .from(agentMemories)
    .where(and(eq(agentMemories.agentSlug, agentSlug), sql`${agentMemories.search} @@ ${q}`))
    .orderBy(desc(agentMemories.importance), desc(agentMemories.createdAt)).limit(limit);
  if (matched.length >= limit) return matched;
  const important = await db
    .select({ id: agentMemories.id, kind: agentMemories.kind, content: agentMemories.content })
    .from(agentMemories)
    .where(and(eq(agentMemories.agentSlug, agentSlug), sql`${agentMemories.importance} >= 4`))
    .orderBy(desc(agentMemories.createdAt)).limit(limit - matched.length);
  const seen = new Set(matched.map((m) => m.id));
  return [...matched, ...important.filter((m) => !seen.has(m.id))];
}

/** Pinned docs (company profile, brand guidelines, services) are part of every agent's stable system context. */
export async function pinnedKnowledge() {
  return db.select({ title: knowledgeDocs.title, category: knowledgeDocs.category, content: knowledgeDocs.content })
    .from(knowledgeDocs).where(eq(knowledgeDocs.pinned, true)).orderBy(knowledgeDocs.createdAt);
}
