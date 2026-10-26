"use client";

import { track } from "@/lib/analytics";
import { shortlist, useShortlist } from "@/lib/shortlist";

export function ShortlistButton({ slug, name, variant = "glass" }: { slug: string; name: string; variant?: "glass" | "light" }) {
  const stops = useShortlist();
  const saved = stops.some((s) => s.slug === slug);
  return (
    <button
      type="button"
      className={`shortlist-btn${variant === "light" ? " shortlist-btn--light" : ""}`}
      aria-pressed={saved}
      onClick={() => {
        const added = shortlist.toggle(slug);
        if (added) track("trip_shortlist_add", { destination: slug });
      }}
    >
      <span className="dot" aria-hidden="true" />
      <span aria-hidden="true">{saved ? "Saved" : "Save"}</span>
      <span className="visually-hidden">{saved ? `Remove ${name} from trip shortlist` : `Save ${name} to trip shortlist`}</span>
    </button>
  );
}
