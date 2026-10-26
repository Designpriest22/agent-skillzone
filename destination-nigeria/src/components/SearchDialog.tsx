"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { type SearchDoc, searchDocs } from "@/lib/search";

let indexPromise: Promise<SearchDoc[]> | null = null;
export function loadSearchIndex(): Promise<SearchDoc[]> {
  indexPromise ??= fetch("/search-index.json")
    .then((r) => (r.ok ? (r.json() as Promise<SearchDoc[]>) : []))
    .catch(() => {
      indexPromise = null;
      return [];
    });
  return indexPromise;
}

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [q, setQ] = useState("");
  const [docs, setDocs] = useState<SearchDoc[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      loadSearchIndex().then((r) => {
        setDocs(r);
        setFailed(r.length === 0);
      });
    }
    if (!open && d.open) d.close();
  }, [open]);

  const results = useMemo(() => (docs ? searchDocs(docs, q, 8) : []), [docs, q]);

  return (
    <dialog ref={ref} className="search-dialog on-light" aria-label="Search Destination Nigeria" onClose={onClose}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (!q.trim()) return;
          onClose();
          router.push(`/search?q=${encodeURIComponent(q.trim())}`);
        }}
        style={{ padding: "1rem", borderBottom: "1px solid var(--line)", display: "flex", gap: "0.5rem" }}
      >
        <label htmlFor="site-search" className="visually-hidden">
          Search destinations, states, experiences and stories
        </label>
        <input
          id="site-search"
          className="input"
          type="search"
          autoComplete="off"
          placeholder="Search destinations, states, stories…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-controls="site-search-results"
          aria-describedby="site-search-status"
        />
        <button type="button" className="btn btn--ghost" onClick={onClose}>
          Close
        </button>
      </form>
      <p id="site-search-status" className="visually-hidden" aria-live="polite">
        {q.trim() ? `${results.length} result${results.length === 1 ? "" : "s"}` : ""}
      </p>
      {q.trim() === "" ? (
        <p className="muted" style={{ padding: "1rem 1.25rem" }}>
          Try “waterfall”, “Lagos”, “festival” or “heritage”. Press Enter to see all results.
        </p>
      ) : docs === null ? (
        <p className="muted" style={{ padding: "1rem 1.25rem" }}>
          Loading the search index…
        </p>
      ) : failed ? (
        <p className="muted" style={{ padding: "1rem 1.25rem" }}>
          Search could not load. Check your connection, or browse <Link href="/destinations">all destinations</Link>.
        </p>
      ) : results.length === 0 ? (
        <p className="muted" style={{ padding: "1rem 1.25rem" }}>
          No matches for “{q}”. Try a state name, a type of place or a festival.
        </p>
      ) : (
        <ul id="site-search-results" className="search-results">
          {results.map((r) => (
            <li key={r.url}>
              <Link href={r.url} onClick={onClose}>
                <span className="kind">{r.kind}</span>
                <strong>{r.title}</strong>
                {r.text ? <span className="muted" style={{ fontSize: "0.875rem" }}>{r.text}</span> : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </dialog>
  );
}
