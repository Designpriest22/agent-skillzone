"use client";

import Link from "next/link";
import { useId, useMemo, useRef, useState } from "react";
import geo from "@/content/geo/nigeria-states.json";
import type { State, ZoneId } from "@/content/schema";
import { zones } from "@/content/states";

export type MapDestination = { slug: string; name: string; state: string; plateSrc: string };
type GeoState = { svgId: string; name: string; path: string; cx: number; cy: number };

const shapes = geo.states as GeoState[];

/**
 * Interactive state map. Three equivalent ways in: click/tap a state, use the
 * keyboard on the map (arrow keys move between states alphabetically, Enter
 * selects), or type in the state finder. Pins mark states with published
 * destinations; positions are drawn from the outlines, not geocoded.
 */
export function NigeriaMap({ states, destinations, indexableStates }: { states: State[]; destinations: MapDestination[]; indexableStates: string[] }) {
  const uid = useId().replace(/:/g, "");
  const sorted = useMemo(() => [...states].sort((a, b) => a.name.localeCompare(b.name)), [states]);
  const bySvg = useMemo(() => new Map(states.map((s) => [s.svgId, s])), [states]);
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    destinations.forEach((d) => m.set(d.state, (m.get(d.state) ?? 0) + 1));
    return m;
  }, [destinations]);

  const [selected, setSelected] = useState<string>("osun");
  const [focusable, setFocusable] = useState<string>("osun");
  const [finder, setFinder] = useState("");
  const [zone, setZone] = useState<ZoneId | "">("");
  const svgRef = useRef<SVGSVGElement>(null);
  const panelHeading = useRef<HTMLHeadingElement>(null);

  const sel = states.find((s) => s.slug === selected)!;
  const selDest = destinations.filter((d) => d.state === selected);

  function choose(slug: string, opts: { focusPanel?: boolean } = {}) {
    setSelected(slug);
    setFocusable(slug);
    if (opts.focusPanel) requestAnimationFrame(() => panelHeading.current?.focus());
  }

  function onKey(e: React.KeyboardEvent<SVGPathElement>, slug: string) {
    const i = sorted.findIndex((s) => s.slug === slug);
    let next: string | undefined;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = sorted[(i + 1) % sorted.length]!.slug;
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = sorted[(i - 1 + sorted.length) % sorted.length]!.slug;
    if (e.key === "Home") next = sorted[0]!.slug;
    if (e.key === "End") next = sorted[sorted.length - 1]!.slug;
    if (next) {
      e.preventDefault();
      setFocusable(next);
      const svgId = states.find((s) => s.slug === next)!.svgId;
      svgRef.current?.querySelector<SVGPathElement>(`[data-svg="${svgId}"]`)?.focus();
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(slug, { focusPanel: true });
    }
  }

  const finderMatches = finder.trim()
    ? sorted.filter((s) => `${s.name} ${s.capital}`.toLowerCase().includes(finder.trim().toLowerCase()))
    : [];

  return (
    <div className="map-layout">
      <div>
        <figure className="map-figure">
          <svg
            ref={svgRef}
            className="map-svg"
            viewBox={geo.viewBox}
            role="group"
            aria-label="Map of Nigeria's 36 states and the Federal Capital Territory. Use arrow keys to move between states and Enter to select."
          >
            {shapes.map((g) => {
              const st = bySvg.get(g.svgId);
              if (!st) return null;
              const has = (counts.get(st.slug) ?? 0) > 0;
              const cls = [
                "map-state",
                has ? "has-content" : "",
                st.slug === selected ? "is-selected" : "",
                zone && st.zone === zone && st.slug !== selected ? "is-zone" : "",
              ].join(" ");
              return (
                <g key={g.svgId}>
                  <path
                    d={g.path}
                    className={cls}
                    data-svg={g.svgId}
                    tabIndex={st.slug === focusable ? 0 : -1}
                    role="button"
                    aria-pressed={st.slug === selected}
                    aria-label={`${st.name}${st.slug === "fct" ? "" : " State"}, ${zones[st.zone].name}${has ? `, ${counts.get(st.slug)} destination${counts.get(st.slug) === 1 ? "" : "s"}` : ""}`}
                    onClick={() => choose(st.slug)}
                    onKeyDown={(e) => onKey(e, st.slug)}
                    onFocus={() => setFocusable(st.slug)}
                  />
                  {has ? <circle className="map-pin" cx={g.cx} cy={g.cy} r={st.slug === selected ? 7 : 5} aria-hidden="true" /> : null}
                </g>
              );
            })}
          </svg>
          <figcaption className="map-legend">
            <span>
              <i style={{ background: "#3f6a55" }} /> Has published destinations
            </span>
            <span>
              <i style={{ background: "#2a4c3e" }} /> Content in preparation
            </span>
            <span>
              <i style={{ background: "var(--sun)" }} /> Selected
            </span>
            <span>
              Map outlines:{" "}
              <a href="https://github.com/VictorCazanave/svg-maps/tree/master/packages/nigeria" style={{ color: "inherit" }}>
                svg-maps
              </a>{" "}
              (CC BY 4.0)
            </span>
          </figcaption>
        </figure>
      </div>

      <div className="stack">
        <div className="glass" style={{ borderRadius: "var(--r-lg)", padding: "var(--space-5)" }}>
          <div className="form-grid" style={{ gap: "0.85rem" }}>
            <div className="field">
              <label htmlFor={`${uid}-finder`}>Find a state</label>
              <input
                id={`${uid}-finder`}
                className="input"
                type="search"
                placeholder="Type a state or capital, e.g. Calabar"
                value={finder}
                onChange={(e) => setFinder(e.target.value)}
                aria-controls={`${uid}-finder-list`}
                aria-describedby={`${uid}-finder-count`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && finderMatches[0]) {
                    e.preventDefault();
                    choose(finderMatches[0].slug, { focusPanel: true });
                    setFinder("");
                  }
                }}
              />
              <p id={`${uid}-finder-count`} className="visually-hidden" aria-live="polite">
                {finder.trim() ? `${finderMatches.length} matching state${finderMatches.length === 1 ? "" : "s"}` : ""}
              </p>
              {finderMatches.length > 0 ? (
                <ul id={`${uid}-finder-list`} className="chip-row" style={{ listStyle: "none", padding: 0, margin: "0.25rem 0 0" }}>
                  {finderMatches.slice(0, 8).map((s) => (
                    <li key={s.slug}>
                      <button
                        type="button"
                        className="chip"
                        onClick={() => {
                          choose(s.slug, { focusPanel: true });
                          setFinder("");
                        }}
                      >
                        {s.name}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div className="field">
              <label htmlFor={`${uid}-zone`}>Highlight a region</label>
              <select id={`${uid}-zone`} className="select" value={zone} onChange={(e) => setZone(e.target.value as ZoneId | "")}>
                <option value="">None</option>
                {(Object.keys(zones) as ZoneId[]).map((z) => (
                  <option key={z} value={z}>
                    {zones[z].name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <p className="visually-hidden" aria-live="polite">
          {`${sel.name} selected. ${selDest.length === 0 ? "No published destinations yet." : `${selDest.length} destination${selDest.length === 1 ? "" : "s"}.`}`}
        </p>
        <section className="map-panel glass" aria-labelledby={`${uid}-panel-title`} data-animate key={selected}>
          <p className="eyebrow" style={{ color: "var(--sage)" }}>
            {zones[sel.zone].name} · Capital: {sel.capital}
          </p>
          <h3 id={`${uid}-panel-title`} ref={panelHeading} tabIndex={-1}>
            {sel.slug === "fct" ? "Federal Capital Territory" : `${sel.name} State`}
          </h3>
          {sel.summary ? <p className="muted">{sel.summary}</p> : null}
          {selDest.length > 0 ? (
            <>
              <ul>
                {selDest.map((d) => (
                  <li key={d.slug}>
                    <Link href={`/destinations/${d.slug}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={d.plateSrc} alt="" width={64} height={48} loading="lazy" />
                      <span>
                        <strong>{d.name}</strong>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              {indexableStates.includes(sel.slug) ? (
                <Link className="link-arrow" href={`/states/${sel.slug}`}>
                  Explore {sel.name} <span className="arrow" aria-hidden="true">→</span>
                </Link>
              ) : null}
            </>
          ) : (
            <p className="muted">
              Verified destinations for {sel.name} are in preparation with the state. Tourism authorities and operators can{" "}
              <Link href="/partners#enquiry" style={{ color: "var(--sun)" }}>
                propose destinations for verification
              </Link>
              .
            </p>
          )}
          <p className="muted" style={{ fontSize: "0.8rem", borderTop: "1px solid var(--line-on-dark)", paddingTop: "0.75rem" }}>
            Initial sample content written from public reference sources, pending state verification. Before planning a trip, read{" "}
            <Link href="/plan#before-you-go" style={{ color: "var(--ivory)" }}>
              current official travel advice
            </Link>{" "}
            for {sel.name}.
          </p>
        </section>
      </div>
    </div>
  );
}
