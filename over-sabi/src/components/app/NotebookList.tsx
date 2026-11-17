"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ToneContour } from "@/components/brand/ToneContour";
import { ReportButton } from "@/components/content/ReportButton";
import { Button } from "@/components/ui/Button";
import { Badge, EmptyState, ReviewBadge } from "@/components/ui/primitives";
import { api, ApiError } from "@/lib/client/api";

export interface NotebookItem {
  id: string;
  vocab_id: string | null;
  language_code: string;
  term: string;
  meaning: string;
  context_note: string | null;
  literal_meaning: string | null;
  review_status: string | null;
  source: string;
  saved: boolean;
  due_at: string;
  repetitions: number;
}

export function NotebookList({ items }: { items: NotebookItem[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "saved" | "due" | "conversation">("all");
  const [error, setError] = useState<string | null>(null);
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((i) => {
      if (filter === "saved" && !i.saved) return false;
      if (filter === "due" && new Date(i.due_at) > new Date()) return false;
      if (filter === "conversation" && i.source !== "conversation") return false;
      return !needle || i.term.toLowerCase().includes(needle) || i.meaning.toLowerCase().includes(needle);
    });
  }, [items, q, filter]);

  async function remove(id: string) {
    if (!window.confirm("Remove this from your notebook? It will also leave your revision queue.")) return;
    try {
      await api(`/api/vocabulary?id=${id}`, { method: "DELETE" });
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't remove it.");
    }
  }

  if (!items.length) {
    return (
      <EmptyState title="Your notebook is empty">
        Words from your lessons appear here automatically. You can also save phrases from conversations.
      </EmptyState>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="q" className="sr-only">
          Search your words
        </label>
        <input
          id="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search words or meanings"
          className="lang-text min-h-11 flex-1 rounded-xl border-2 border-border bg-surface px-3"
        />
        {(["all", "saved", "due", "conversation"] as const).map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className="rounded-full border-2 border-border px-3 py-1.5 text-sm font-semibold aria-[pressed=true]:border-primary aria-[pressed=true]:bg-primary aria-[pressed=true]:text-on-primary"
          >
            {{ all: "All", saved: "Saved", due: "Due now", conversation: "From conversations" }[f]}
          </button>
        ))}
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <p className="text-sm text-muted" aria-live="polite">
        {shown.length} of {items.length}
      </p>
      <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
        {shown.map((i) => (
          <li
            key={i.id}
            className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="lang-text text-lg font-semibold" lang={i.language_code}>
                {i.term}
              </p>
              {i.language_code === "yo" ? <ToneContour text={i.term} /> : null}
              <p className="text-sm text-muted">
                {i.meaning}
                {i.literal_meaning ? ` · literally “${i.literal_meaning}”` : ""}
              </p>
              {i.context_note ? <p className="text-xs text-muted">{i.context_note}</p> : null}
              <div className="mt-1 flex flex-wrap gap-1.5">
                {i.vocab_id ? (
                  <ReviewBadge status={i.review_status ?? "editorial_draft"} />
                ) : (
                  <Badge tone="danger">Unverified · from a conversation</Badge>
                )}
                {i.saved ? <Badge>Saved</Badge> : null}
                <Badge tone={new Date(i.due_at) <= new Date() ? "accent" : "neutral"}>
                  {new Date(i.due_at) <= new Date()
                    ? "Due now"
                    : `Review ${new Date(i.due_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {i.vocab_id ? (
                <ReportButton entityType="vocabulary" entityId={i.vocab_id} language={i.language_code} />
              ) : null}
              <Button size="sm" variant="ghost" onClick={() => remove(i.id)}>
                Remove
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
