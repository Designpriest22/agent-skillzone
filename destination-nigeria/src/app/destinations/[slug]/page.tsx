import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eyebrow } from "@/components/brand";
import { DestinationCard } from "@/components/DestinationCard";
import { JsonLd } from "@/components/JsonLd";
import { PageHero } from "@/components/PageHero";
import { Plate } from "@/components/Plate";
import { ShortlistButton } from "@/components/ShortlistButton";
import { TrackView } from "@/components/TrackView";
import { categories } from "@/content/categories";
import { destinations, getDestination } from "@/content/destinations";
import { experiences } from "@/content/experiences";
import { advisorySummary, resources } from "@/content/resources";
import { zones } from "@/content/states";
import { stories } from "@/content/stories";
import { stateLabel, stateOf } from "@/lib/content";
import { attractionLd, pageMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return destinations.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: PageProps<"/destinations/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const d = getDestination(slug);
  if (!d) return {};
  const s = stateOf(d.state);
  return pageMetadata({
    title: `${d.name}, ${stateLabel(s)}`,
    description: `${d.summary} Plan your visit with sources, practical notes and nearby places in ${s.name}.`.slice(0, 300),
    path: `/destinations/${d.slug}`,
    plate: d.plate,
  });
}

export default async function DestinationPage({ params }: PageProps<"/destinations/[slug]">) {
  const { slug } = await params;
  const d = getDestination(slug);
  if (!d) notFound();
  const s = stateOf(d.state);
  const nearby = destinations.filter((x) => x.slug !== d.slug && x.state === d.state);
  const sameZone = destinations.filter((x) => x.slug !== d.slug && x.state !== d.state && stateOf(x.state).zone === s.zone);
  const related = [...nearby, ...sameZone].slice(0, 3);
  const relatedExperiences = experiences.filter((e) => e.categories.some((c) => d.categories.includes(c))).slice(0, 2);
  const relatedStories = stories.filter((st) => st.relatedDestinations.includes(d.slug));
  const advice = resources.filter((r) => r.topic === "advice");
  const checked = new Date(d.verification.lastChecked).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      <TrackView event="destination_view" props={{ destination: d.slug, state: s.slug }} />
      <JsonLd data={attractionLd(d, s)} />
      <PageHero
        crumbs={[
          { name: "Destinations", path: "/destinations" },
          { name: stateLabel(s), path: `/states/${s.slug}` },
          { name: d.name, path: `/destinations/${d.slug}` },
        ]}
        eyebrow={`${d.locality ? `${d.locality} · ` : ""}${stateLabel(s)} · ${zones[s.zone].name}`}
        title={d.name}
        lede={d.summary}
        plate={d.plate}
      >
        <div className="cluster" style={{ marginTop: "1.5rem" }}>
          <ShortlistButton slug={d.slug} name={d.name} />
          {d.categories.map((c) => (
            <Link key={c} href={`/destinations?cat=${c}`} className="tag tag--glass" style={{ textDecoration: "none" }}>
              {categories[c].label}
            </Link>
          ))}
        </div>
      </PageHero>

      <section className="section">
        <div className="container split split--wide-left">
          <div className="stack-lg">
            <div className="prose">
              {d.intro.map((p) => (
                <p key={p.slice(0, 24)} style={{ fontSize: "var(--step-1)" }}>
                  {p}
                </p>
              ))}
            </div>
            <div className="stack">
              <h2 className="display t-3">Highlights</h2>
              <ul className="prose" style={{ paddingLeft: "1.2em" }}>
                {d.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </div>
            <Plate plate={d.plate} className="plate" alt={`Illustration evoking the landscape type of ${d.name}. Not a photograph of the site.`} />
            <div className="stack">
              <h2 className="display t-3">Practical information</h2>
              <dl className="facts">
                {d.practical.map((p) => (
                  <div key={p.label}>
                    <dt>{p.label}</dt>
                    <dd>{p.value}</dd>
                  </div>
                ))}
                <div>
                  <dt>Location</dt>
                  <dd>
                    {d.locality ? `${d.locality}, ` : ""}
                    <Link href={`/states/${s.slug}`}>{stateLabel(s)}</Link> ({zones[s.zone].name}). State capital: {s.capital}.
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <aside className="stack" aria-label="Before you go">
            <div className="panel panel--advisory stack">
              <h2 className="t-3" style={{ fontWeight: 600, fontSize: "1.1rem" }}>
                Before you go
              </h2>
              <p style={{ fontSize: "0.925rem" }}>{advisorySummary}</p>
              <ul className="stack" style={{ gap: "0.4rem", paddingLeft: "1.1rem", margin: 0, fontSize: "0.9rem" }}>
                {advice.map((r) => (
                  <li key={r.id}>
                    <a href={r.url} rel="noopener" target="_blank">
                      {r.publisher}
                      <span className="visually-hidden"> (opens in a new tab)</span>
                    </a>
                  </li>
                ))}
              </ul>
              <Link href="/plan#before-you-go" className="link-arrow" style={{ fontSize: "0.9rem" }}>
                Entry, health and advice <span className="arrow" aria-hidden="true">→</span>
              </Link>
            </div>

            <div className="panel stack">
              <p className="eyebrow">Information status</p>
              <span className={`status-pill status-pill--${d.verification.status === "verified" ? "live" : "reference"}`}>
                {d.verification.status === "verified" ? `Verified by ${d.verification.verifiedBy}` : "Reference content · awaiting state verification"}
              </span>
              <p style={{ fontSize: "0.9rem" }}>
                Last checked <time dateTime={d.verification.lastChecked}>{checked}</time>. Sources:
              </p>
              <ul className="stack" style={{ gap: "0.35rem", paddingLeft: "1.1rem", margin: 0, fontSize: "0.875rem" }}>
                {d.verification.sources.map((src) => (
                  <li key={src.url}>
                    <a href={src.url} rel="noopener" target="_blank">
                      {src.label}
                      <span className="visually-hidden"> (opens in a new tab)</span>
                    </a>
                  </li>
                ))}
              </ul>
              <p className="muted" style={{ fontSize: "0.85rem" }}>
                Are you the operator or state authority? <Link href="/partners?interest=showcase#enquiry">Help us verify this page</Link>.
              </p>
            </div>

            <div className="panel stack">
              <p className="eyebrow">Bookings</p>
              <p style={{ fontSize: "0.9rem" }}>
                No verified booking options are listed for {d.name} yet. Verified providers will appear on the <Link href="/offers">offers page</Link>.
              </p>
            </div>
          </aside>
        </div>
      </section>

      {related.length > 0 ? (
        <section className="section section--paper" aria-labelledby="related-title">
          <div className="container">
            <div className="section-head">
              <Eyebrow>{nearby.length > 0 ? `More in ${s.name}` : `Also in the ${zones[s.zone].name}`}</Eyebrow>
              <h2 id="related-title" className="display t-2">
                Continue your journey
              </h2>
            </div>
            <div className="card-grid">
              {related.map((x, i) => (
                <DestinationCard key={x.slug} d={x} state={stateOf(x.state)} i={i} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="section" aria-label="Related reading">
        <div className="container split">
          <div className="stack">
            <Eyebrow>Experiences</Eyebrow>
            <ul className="stack" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {relatedExperiences.map((e) => (
                <li key={e.slug}>
                  <Link className="link-arrow" href={`/experiences/${e.slug}`}>
                    {e.name} <span className="arrow" aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="stack">
            <Eyebrow>Stories</Eyebrow>
            <ul className="stack" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {(relatedStories.length ? relatedStories : stories.slice(0, 1)).map((st) => (
                <li key={st.slug}>
                  <Link className="link-arrow" href={`/stories/${st.slug}`}>
                    {st.title} <span className="arrow" aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
