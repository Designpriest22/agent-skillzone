import Link from "next/link";
import { categories } from "@/content/categories";
import type { Destination, State } from "@/content/schema";
import { stateLabel } from "@/lib/content";
import { Plate } from "./Plate";
import { ShortlistButton } from "./ShortlistButton";

export function DestinationCard({ d, state, headingLevel = 3, i = 0 }: { d: Destination; state: State; headingLevel?: 2 | 3; i?: number }) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <article className="dest-card" data-reveal="up" style={{ "--i": i % 4 } as React.CSSProperties}>
      <div style={{ position: "relative" }}>
        <Plate plate={d.plate} decorative />
        <span className="tag tag--glass card-loc">
          {d.locality && !d.locality.startsWith("near") ? `${d.locality}, ` : ""}
          {stateLabel(state)}
        </span>
        <ShortlistButton slug={d.slug} name={d.name} />
      </div>
      <H>
        <Link href={`/destinations/${d.slug}`}>{d.name}</Link>
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
  );
}
