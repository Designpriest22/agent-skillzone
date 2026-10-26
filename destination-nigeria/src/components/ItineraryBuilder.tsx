"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import type { Destination, State } from "@/content/schema";
import { track } from "@/lib/analytics";
import { decodePlan, encodePlan, itineraryText } from "@/lib/itinerary";
import { shortlist, useShortlist } from "@/lib/shortlist";

function subscribeLocation(cb: () => void) {
  window.addEventListener("popstate", cb);
  return () => window.removeEventListener("popstate", cb);
}

type Lookup = Record<string, { d: Destination; s: State; plateSrc: string }>;

export function ItineraryBuilder({ lookup, siteUrl }: { lookup: Lookup; siteUrl: string }) {
  const stops = useShortlist();
  const [copied, setCopied] = useState<"idle" | "copied" | "failed">("idle");
  const shared = useSyncExternalStore(subscribeLocation, () => new URLSearchParams(window.location.search).get("plan"), () => null);
  const sharedStops = useMemo(() => (shared ? decodePlan(shared, (slug) => slug in lookup) : []), [shared, lookup]);
  const valid = stops.filter((s) => lookup[s.slug]);
  const totalDays = valid.reduce((n, s) => n + s.days, 0);

  const text = () => itineraryText(valid, (slug) => lookup[slug], siteUrl, new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }));

  function download() {
    const blob = new Blob([text()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "destination-nigeria-trip-plan.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    track("itinerary_export", { format: "txt", stops: valid.length });
  }

  async function copyLink() {
    const url = `${window.location.origin}/plan?plan=${encodeURIComponent(encodePlan(valid))}#itinerary`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied("copied");
      track("itinerary_export", { format: "link", stops: valid.length });
    } catch {
      setCopied("failed");
    }
  }

  return (
    <div className="itinerary">
      <div className="stack">
        {sharedStops.length > 0 ? (
          <div className="status status--info no-print">
            <span aria-hidden="true">↗</span>
            <div className="stack" style={{ gap: "0.6rem" }}>
              <p>
                <strong>Someone shared a trip plan with you</strong> ({sharedStops.length} stops: {sharedStops.map((s) => lookup[s.slug]!.d.name).join(", ")}).
              </p>
              <div className="cluster">
                <button type="button" className="btn btn--forest btn--sm" onClick={() => shortlist.replace(sharedStops)}>
                  Replace my shortlist with this plan
                </button>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => shortlist.replace([...valid, ...sharedStops.filter((s) => !valid.some((v) => v.slug === s.slug))])}
                >
                  Add to my shortlist
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="print-only">
          <h2 className="display t-3">My Destination Nigeria trip plan</h2>
          <p>
            {valid.length} stops · {totalDays} days
          </p>
        </div>

        {valid.length === 0 ? (
          <div className="empty">
            <p>
              <strong>Your shortlist is empty.</strong> Save destinations with the <span aria-hidden="true">●</span> Save button on any destination, then come back here to put them in order.
            </p>
            <Link href="/destinations" className="btn btn--forest btn--sm">
              Browse destinations
            </Link>
          </div>
        ) : (
          <ol className="stops" aria-label="Trip stops, in order">
            {valid.map((stop, i) => {
              const { d, s, plateSrc } = lookup[stop.slug]!;
              return (
                <li key={stop.slug} className="stop">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={plateSrc} alt="" width={80} height={60} loading="lazy" />
                  <div className="stop-main">
                    <p>
                      <Link href={`/destinations/${d.slug}`} style={{ fontWeight: 600 }}>
                        {d.name}
                      </Link>
                      <span className="muted"> · {s.slug === "fct" ? "FCT" : `${s.name} State`}</span>
                    </p>
                    <div className="stop-controls no-print">
                      <label className="mono" htmlFor={`days-${d.slug}`}>
                        Days
                      </label>
                      <input
                        id={`days-${d.slug}`}
                        className="days-input"
                        type="number"
                        min={1}
                        max={30}
                        value={stop.days}
                        onChange={(e) => shortlist.update(d.slug, { days: Math.min(30, Math.max(1, Number(e.target.value) || 1)) })}
                      />
                      <button type="button" className="icon-btn" onClick={() => shortlist.move(d.slug, -1)} disabled={i === 0} aria-label={`Move ${d.name} earlier`}>
                        ↑
                      </button>
                      <button type="button" className="icon-btn" onClick={() => shortlist.move(d.slug, 1)} disabled={i === valid.length - 1} aria-label={`Move ${d.name} later`}>
                        ↓
                      </button>
                      <button type="button" className="btn btn--ghost btn--sm" onClick={() => shortlist.remove(d.slug)} aria-label={`Remove ${d.name}`}>
                        Remove
                      </button>
                    </div>
                    <label className="visually-hidden" htmlFor={`note-${d.slug}`}>
                      Note for {d.name}
                    </label>
                    <input
                      id={`note-${d.slug}`}
                      className="input no-print"
                      style={{ minHeight: "2.5rem", fontSize: "0.9rem" }}
                      placeholder="Add a note (e.g. who to contact, what to book)"
                      maxLength={280}
                      value={stop.note}
                      onChange={(e) => shortlist.update(d.slug, { note: e.target.value })}
                    />
                    {stop.note ? <p className="print-only">Note: {stop.note}</p> : null}
                    <p className="print-only">
                      {stop.days} day{stop.days === 1 ? "" : "s"} · {siteUrl}/destinations/{d.slug}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <aside className="panel stack no-print" aria-label="Plan summary and export">
        <p className="eyebrow">Your plan</p>
        <p className="display t-3">
          {valid.length} stop{valid.length === 1 ? "" : "s"} · {totalDays} day{totalDays === 1 ? "" : "s"}
        </p>
        <p className="muted" style={{ fontSize: "0.9rem" }}>
          Saved in this browser only. Nothing is sent to us. This is a planning aid, not a booking.
        </p>
        <div className="stack" style={{ gap: "0.5rem" }}>
          <button type="button" className="btn btn--forest" onClick={download} disabled={valid.length === 0}>
            Download as text
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            disabled={valid.length === 0}
            onClick={() => {
              track("itinerary_export", { format: "print", stops: valid.length });
              window.print();
            }}
          >
            Print or save as PDF
          </button>
          <button type="button" className="btn btn--ghost" onClick={copyLink} disabled={valid.length === 0}>
            Copy shareable link
          </button>
          <p aria-live="polite" className="mono" style={{ minHeight: "1.2em" }}>
            {copied === "copied" ? "Link copied." : copied === "failed" ? "Couldn't copy automatically. Use Download as text instead." : ""}
          </p>
          {valid.length > 0 ? (
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => {
                if (window.confirm("Remove all stops from your shortlist?")) shortlist.clear();
              }}
            >
              Clear shortlist
            </button>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
