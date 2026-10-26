"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { categories } from "@/content/categories";
import type { CategoryId } from "@/content/schema";
import { track } from "@/lib/analytics";

/** Glass discovery panel in the hero. Submits to the destination explorer with matching filters. */
export function HeroSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  return (
    <form
      className="hero-search glass"
      role="search"
      aria-label="Find a destination"
      data-enter
      style={{ "--i": 5 } as React.CSSProperties}
      onSubmit={(e) => {
        e.preventDefault();
        const sp = new URLSearchParams();
        if (q.trim()) sp.set("q", q.trim());
        if (cat) sp.set("cat", cat);
        if (q.trim()) track("destination_search", { length: q.trim().length, source: "hero" });
        router.push(`/destinations${sp.size ? `?${sp}` : ""}`);
      }}
    >
      <p className="display" style={{ fontSize: "var(--step-2)" }}>
        Where will you <em>begin</em>?
      </p>
      <div className="field-row">
        <div className="stack" style={{ gap: "0.45rem" }}>
          <label htmlFor="hero-q">Place, state or idea</label>
          <input id="hero-q" type="search" placeholder="Try “waterfall” or “Calabar”" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
        </div>
        <div className="stack" style={{ gap: "0.45rem" }}>
          <label htmlFor="hero-cat">Experience</label>
          <select id="hero-cat" value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="">Any experience</option>
            {(Object.keys(categories) as CategoryId[]).map((c) => (
              <option key={c} value={c}>
                {categories[c].label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button type="submit" className="btn btn--sun">
        Show destinations <span className="arrow" aria-hidden="true">→</span>
      </button>
    </form>
  );
}
