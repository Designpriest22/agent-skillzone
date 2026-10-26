"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { storyCategories } from "@/content/categories";
import type { Story, StoryCategoryId } from "@/content/schema";
import { normalise } from "@/lib/search";
import { plateKey } from "@/lib/plates";

export function StoriesIndex({ stories }: { stories: Story[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<StoryCategoryId | "">("");
  const used = useMemo(() => [...new Set(stories.map((s) => s.category))], [stories]);
  const results = stories.filter((s) => {
    if (cat && s.category !== cat) return false;
    const nq = normalise(q);
    return !nq || nq.split(" ").every((t) => normalise(`${s.title} ${s.dek} ${storyCategories[s.category]}`).includes(t));
  });

  return (
    <div>
      <form className="filters on-light" role="search" aria-label="Filter stories" onSubmit={(e) => e.preventDefault()}>
        <div className="field">
          <label htmlFor="story-q">Search stories</label>
          <input id="story-q" className="input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Highlands, food, investment…" />
        </div>
        <div className="chip-row" role="group" aria-label="Category">
          <button type="button" className="chip" aria-pressed={cat === ""} onClick={() => setCat("")}>
            All
          </button>
          {used.map((c) => (
            <button key={c} type="button" className="chip" aria-pressed={cat === c} onClick={() => setCat(cat === c ? "" : c)}>
              {storyCategories[c]}
            </button>
          ))}
        </div>
      </form>
      <p className="mono muted" aria-live="polite" style={{ marginBottom: "1.25rem" }}>
        {results.length} {results.length === 1 ? "story" : "stories"}
      </p>
      {results.length === 0 ? (
        <div className="empty">
          <p>
            <strong>No stories match.</strong> Try another word or category.
          </p>
          <button
            type="button"
            className="btn btn--forest btn--sm"
            onClick={() => {
              setQ("");
              setCat("");
            }}
          >
            Show all stories
          </button>
        </div>
      ) : (
        <div className="card-grid">
          {results.map((s) => (
            <article key={s.slug} className="story-card">
              <div className="plate">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/plates/${plateKey(s.plate)}.svg`} alt="" width={1600} height={1000} loading="lazy" />
              </div>
              <p className="eyebrow">{storyCategories[s.category]}</p>
              <h2>
                <Link href={`/stories/${s.slug}`}>{s.title}</Link>
              </h2>
              <p>{s.dek}</p>
              <p className="mono muted">{s.readingMinutes} min read</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
