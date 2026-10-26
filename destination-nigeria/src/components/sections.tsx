import Link from "next/link";
import { categories, storyCategories } from "@/content/categories";
import { destinations } from "@/content/destinations";
import { experiences } from "@/content/experiences";
import { campaignWeeks, investPathways } from "@/content/platform";
import type { Destination, Story } from "@/content/schema";
import { stateBySlug, states, zones } from "@/content/states";

import { stateLabel, statesWithContent } from "@/lib/content";
import { plateKey } from "@/lib/plates";
import type { MapDestination } from "./NigeriaMap";
import { Plate } from "./Plate";

/** Serializable items for the client-side destination explorer. */
export function explorerItems() {
  return destinations.map((d) => {
    const s = stateBySlug.get(d.state)!;
    return { ...d, stateName: s.name, stateLabel: stateLabel(s), zone: s.zone };
  });
}

export function mapProps() {
  return {
    states,
    destinations: destinations.map<MapDestination>((d) => ({ slug: d.slug, name: d.name, state: d.state, plateSrc: `/plates/${plateKey(d.plate)}.svg` })),
    indexableStates: statesWithContent().map((s) => s.slug),
  };
}

/** Section C: asymmetric editorial grid of distinct worlds. */
export function Worlds({ items }: { items: Destination[] }) {
  return (
    <div className="worlds">
      {items.map((d) => {
        const s = stateBySlug.get(d.state)!;
        const firstPractical = d.practical[0];
        return (
          <article key={d.slug} className="world" data-reveal="mask">
            <Plate plate={d.plate} decorative />
            <div className="world-meta">
              <span>{stateLabel(s)}</span>
              <span aria-hidden="true">·</span>
              <span>{zones[s.zone].name}</span>
              <span aria-hidden="true">·</span>
              <span>{categories[d.categories[0]!].label}</span>
            </div>
            <h3>{d.name}</h3>
            <p>{d.intro[0]}</p>
            {firstPractical ? (
              <p className="practical-note">
                <strong>{firstPractical.label}:</strong> {firstPractical.value}
              </p>
            ) : null}
            <p>
              <Link className="link-arrow" href={`/destinations/${d.slug}`}>
                Discover {d.name} <span className="arrow" aria-hidden="true">→</span>
              </Link>
            </p>
          </article>
        );
      })}
    </div>
  );
}

/** Section E: experience panels. */
export function ExperiencePanels({ headingLevel = 3 }: { headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <div className="exp-grid">
      {experiences.map((e, i) => (
        <Link key={e.slug} href={`/experiences/${e.slug}`} className="exp-panel" data-reveal="up" style={{ "--i": i % 3 } as React.CSSProperties}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/plates/${plateKey(e.plate)}.svg`} alt="" width={1600} height={1000} loading="lazy" />
          <div className="exp-body">
            <H>{e.name}</H>
            <p>{e.line}</p>
            <span className="link-arrow" style={{ justifySelf: "start", color: "var(--sun)" }}>
              Explore <span className="arrow" aria-hidden="true">→</span>
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

/** Section F: what the planning hub contains, with honest status labels. */
export const planningTools: { title: string; text: string; href: string; status: "live" | "reference" | "pending"; statusLabel: string }[] = [
  { title: "Destination discovery", text: "Search and filter the national portfolio by region, state and experience.", href: "/destinations", status: "live", statusLabel: "Available" },
  { title: "Trip shortlist & itinerary", text: "Save places, order your stops, set days and export or print your plan.", href: "/plan#itinerary", status: "live", statusLabel: "Available" },
  { title: "Suggested itineraries", text: "Route ideas that combine cities with nearby nature and heritage.", href: "/stories/planning-a-first-trip-to-nigeria", status: "reference", statusLabel: "Editorial guide" },
  { title: "Travel authorization", text: "Links to the official e-Visa portal and immigration guidance.", href: "/plan#before-you-go", status: "live", statusLabel: "Official sources" },
  { title: "Health & safety advice", text: "Vaccination guidance and government travel advisories, with last-checked dates.", href: "/plan#before-you-go", status: "live", statusLabel: "Official sources" },
  { title: "Transport & movement", text: "Getting between cities and around them. Verified operator information will be added as partners confirm it.", href: "/plan#getting-around", status: "reference", statusLabel: "General guidance" },
  { title: "Accommodation & bookings", text: "Verified hotels, packages and tours with direct booking links.", href: "/offers", status: "pending", statusLabel: "Awaiting verified providers" },
  { title: "Events & festivals", text: "Festival guides now; a dated calendar once organisers confirm dates.", href: "/experiences/festivals-and-live-entertainment", status: "reference", statusLabel: "Dates unconfirmed" },
  { title: "Accessibility information", text: "Step-free access and facilities, recorded site by site as operators verify them.", href: "/accessibility#visitor-access", status: "pending", statusLabel: "In preparation" },
];

export function PlanningTools() {
  return (
    <div className="tool-grid">
      {planningTools.map((t) => (
        <Link key={t.title} href={t.href} className="tool">
          <span className={`status-pill status-pill--${t.status}`}>{t.statusLabel}</span>
          <h3>{t.title}</h3>
          <p>{t.text}</p>
        </Link>
      ))}
    </div>
  );
}

export function Pathways() {
  return (
    <div className="pathways">
      {investPathways.map((p, i) => (
        <article key={p.id} className="pathway glass" data-reveal="up" style={{ "--i": i % 4 } as React.CSSProperties}>
          <h3>{p.title}</h3>
          <p>{p.text}</p>
        </article>
      ))}
    </div>
  );
}

/** The eight-week countdown is a genuine sequence, so it is numbered. */
export function CampaignTimeline() {
  return (
    <ol className="timeline" aria-label="Eight-week pre-event campaign, counting down to National Tourism Week">
      {campaignWeeks.map((w) => (
        <li key={w.week}>
          <p className="wk">
            <small>Weeks to go</small>
            {w.week}
          </p>
          <p>{w.activity}</p>
          <p>
            <span className="k">Led by</span>
            {w.leads}
          </p>
          <p>
            <span className="k">Evidence / call to action</span>
            {w.evidence}
          </p>
        </li>
      ))}
    </ol>
  );
}

export function StoryCard({ s, i = 0 }: { s: Story; i?: number }) {
  return (
    <article className="story-card" data-reveal="up" style={{ "--i": i % 3 } as React.CSSProperties}>
      <Plate plate={s.plate} decorative />
      <p className="eyebrow">{storyCategories[s.category]}</p>
      <h3>
        <Link href={`/stories/${s.slug}`}>{s.title}</Link>
      </h3>
      <p>{s.dek}</p>
      <p className="mono muted">
        <time dateTime={s.published}>{new Date(s.published).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</time> · {s.readingMinutes} min read
      </p>
    </article>
  );
}
