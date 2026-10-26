"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { categories } from "@/content/categories";
import type { CategoryId, State, ZoneId } from "@/content/schema";
import { zones } from "@/content/states";
import { track } from "@/lib/analytics";
import { type ExplorerItem, filterDestinations } from "@/lib/filter";
import { Plate } from "./Plate";
import { ShortlistButton } from "./ShortlistButton";

type Item = ExplorerItem;

/**
 * Filters live in the URL so results can be shared and bookmarked. The URL is read
 * directly (not with useSearchParams) so the page stays statically rendered with the
 * full grid, instead of swapping in a loading fallback that would shift the layout.
 */
const URL_EVENT = "dn:urlchange";
function subscribeUrl(cb: () => void) {
  window.addEventListener("popstate", cb);
  window.addEventListener(URL_EVENT, cb);
  return () => {
    window.removeEventListener("popstate", cb);
    window.removeEventListener(URL_EVENT, cb);
  };
}
function replaceUrl(url: string) {
  window.history.replaceState(null, "", url);
  window.dispatchEvent(new Event(URL_EVENT));
}

export function DestinationExplorer({ items, states, limit, headingLevel = 3 }: { items: Item[]; states: State[]; limit?: number; headingLevel?: 2 | 3 }) {
  const search = useSyncExternalStore(subscribeUrl, () => window.location.search, () => "");
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const pathname = usePathname();
  const f = {
    q: params.get("q") ?? "",
    cat: params.get("cat") ?? "",
    zone: params.get("zone") ?? "",
    state: params.get("state") ?? "",
  };
  const results = useMemo(() => filterDestinations(items, f), [items, f.q, f.cat, f.zone, f.state]); // eslint-disable-line react-hooks/exhaustive-deps
  const shown = limit ? results.slice(0, limit) : results;
  const searchTimer = useRef<number | undefined>(undefined);
  const [resetKey, setResetKey] = useState(0);

  function update(next: Partial<typeof f>, event?: "destination_search" | "destination_filter") {
    const merged = { ...f, ...next };
    if (next.zone !== undefined && merged.state && states.find((s) => s.slug === merged.state)?.zone !== merged.zone) merged.state = "";
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) if (v) sp.set(k, v);
    const qs = sp.toString();
    replaceUrl(qs ? `${pathname}?${qs}` : pathname);
    if (event === "destination_filter") track("destination_filter", { filter: Object.keys(next)[0] ?? "", value: Object.values(next)[0] ?? "" });
  }

  useEffect(() => () => window.clearTimeout(searchTimer.current), []);

  const stateOptions = f.zone ? states.filter((s) => s.zone === f.zone) : states;
  const H = headingLevel === 2 ? "h2" : "h3";

  return (
    <div>
      <form className="filters on-light" role="search" aria-label="Filter destinations" onSubmit={(e) => e.preventDefault()}>
        <div className="filters-row">
          <div className="field">
            <label htmlFor="dest-q">Search</label>
            <input
              id="dest-q"
              className="input"
              type="search"
              defaultValue={f.q}
              key={resetKey}
              placeholder="Waterfall, festival, Calabar…"
              onChange={(e) => {
                const v = e.target.value;
                window.clearTimeout(searchTimer.current);
                searchTimer.current = window.setTimeout(() => {
                  update({ q: v });
                  if (v.trim().length > 2) track("destination_search", { length: v.trim().length });
                }, 250);
              }}
            />
          </div>
          <div className="field">
            <label htmlFor="dest-zone">Region</label>
            <select id="dest-zone" className="select" value={f.zone} onChange={(e) => update({ zone: e.target.value }, "destination_filter")}>
              <option value="">All regions</option>
              {(Object.keys(zones) as ZoneId[]).map((z) => (
                <option key={z} value={z}>
                  {zones[z].name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="dest-state">State</label>
            <select id="dest-state" className="select" value={f.state} onChange={(e) => update({ state: e.target.value }, "destination_filter")}>
              <option value="">All states</option>
              {stateOptions.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="chip-row" role="group" aria-label="Type of experience">
          <button type="button" className="chip" aria-pressed={f.cat === ""} onClick={() => update({ cat: "" }, "destination_filter")}>
            Everything
          </button>
          {(Object.keys(categories) as CategoryId[]).map((c) => (
            <button key={c} type="button" className="chip" aria-pressed={f.cat === c} onClick={() => update({ cat: f.cat === c ? "" : c }, "destination_filter")}>
              {categories[c].label}
            </button>
          ))}
        </div>
      </form>

      <p className="mono muted" aria-live="polite" style={{ marginBottom: "1.25rem" }}>
        {results.length === 0 ? "No destinations match" : `${results.length} destination${results.length === 1 ? "" : "s"}`}
        {limit && results.length > limit ? ` · showing ${limit}` : ""}
      </p>

      {results.length === 0 ? (
        <div className="empty">
          <p>
            <strong>Nothing matches those filters yet.</strong> The portfolio is growing as states and operators verify new destinations.
          </p>
          <div className="cluster">
            <button type="button" className="btn btn--forest btn--sm" onClick={() => {
                setResetKey((k) => k + 1);
                replaceUrl(pathname);
              }}>
              Clear filters
            </button>
            <Link className="btn btn--ghost btn--sm" href="/partners#enquiry">
              Suggest a destination
            </Link>
          </div>
        </div>
      ) : (
        <div className="card-grid">
          {shown.map((d, i) => (
            <article key={d.slug} className="dest-card">
              <div style={{ position: "relative" }}>
                <Plate plate={d.plate} decorative />
                <span className="tag tag--glass card-loc">{d.stateLabel}</span>
                <ShortlistButton slug={d.slug} name={d.name} />
              </div>
              <H>
                <Link href={`/destinations/${d.slug}`} data-index={i}>
                  {d.name}
                </Link>
              </H>
              <p className="summary">{d.summary}</p>
              <div className="card-foot">
                {d.categories.slice(0, 2).map((c) => (
                  <span key={c} className="tag">
                    {categories[c].short}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
      {limit && results.length > limit ? (
        <p style={{ marginTop: "2rem" }}>
          <Link className="btn btn--forest" href={`/destinations?${params.toString()}`}>
            See all {results.length} destinations <span className="arrow" aria-hidden="true">→</span>
          </Link>
        </p>
      ) : null}
    </div>
  );
}
