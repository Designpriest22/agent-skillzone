import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eyebrow } from "@/components/brand";
import { DestinationCard } from "@/components/DestinationCard";
import { JsonLd } from "@/components/JsonLd";
import { PageHero } from "@/components/PageHero";
import { destinationsInState } from "@/content/destinations";
import { advisorySummary, resources } from "@/content/resources";
import { getState, states, zones } from "@/content/states";
import { stateLabel, statesWithContent } from "@/lib/content";
import { itemListLd, pageMetadata } from "@/lib/seo";

export const dynamicParams = false;

/** Only states with published destinations get a page, to avoid thin, near-duplicate pages. */
export function generateStaticParams() {
  return statesWithContent().map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/states/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const s = getState(slug);
  if (!s) return {};
  const list = destinationsInState(slug);
  return pageMetadata({
    title: `Places to visit in ${stateLabel(s)}`,
    description: `${s.summary ?? `${stateLabel(s)}, ${zones[s.zone].name}.`} Explore ${list.map((d) => d.name).slice(0, 3).join(", ")} and plan your visit.`.slice(0, 300),
    path: `/states/${s.slug}`,
    plate: list[0]?.plate,
  });
}

export default async function StatePage({ params }: PageProps<"/states/[slug]">) {
  const { slug } = await params;
  const s = getState(slug);
  const list = destinationsInState(slug);
  if (!s || list.length === 0) notFound();
  const neighbours = states.filter((x) => x.zone === s.zone && x.slug !== s.slug);
  const indexable = new Set(statesWithContent().map((x) => x.slug));

  return (
    <>
      <JsonLd data={itemListLd(`Places to visit in ${stateLabel(s)}`, list.map((d) => ({ name: d.name, path: `/destinations/${d.slug}` })))} />
      <PageHero
        crumbs={[
          { name: "States", path: "/states" },
          { name: stateLabel(s), path: `/states/${s.slug}` },
        ]}
        eyebrow={`${zones[s.zone].name} · Capital: ${s.capital}`}
        title={s.slug === "fct" ? "Federal Capital Territory" : `${s.name} State`}
        lede={s.summary}
        plate={list[0]!.plate}
      />
      <section className="section section--paper" aria-labelledby="in-state">
        <div className="container">
          <div className="section-head">
            <Eyebrow>Destinations</Eyebrow>
            <h2 id="in-state" className="display t-2">
              Places to visit in {s.name}
            </h2>
          </div>
          <div className="card-grid">
            {list.map((d, i) => (
              <DestinationCard key={d.slug} d={d} state={s} i={i} />
            ))}
          </div>
        </div>
      </section>
      <section className="section" aria-label="Planning and nearby states">
        <div className="container split">
          <div className="panel panel--advisory stack">
            <h2 className="t-3" style={{ fontWeight: 600, fontSize: "1.1rem" }}>
              Read current advice for {s.name}
            </h2>
            <p style={{ fontSize: "0.925rem" }}>{advisorySummary}</p>
            <ul className="stack" style={{ gap: "0.4rem", paddingLeft: "1.1rem", margin: 0, fontSize: "0.9rem" }}>
              {resources
                .filter((r) => r.topic === "advice")
                .map((r) => (
                  <li key={r.id}>
                    <a href={r.url} rel="noopener" target="_blank">
                      {r.publisher}: {r.title}
                      <span className="visually-hidden"> (opens in a new tab)</span>
                    </a>
                  </li>
                ))}
            </ul>
          </div>
          <div className="stack">
            <Eyebrow>Also in the {zones[s.zone].name}</Eyebrow>
            <ul className="chip-row" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {neighbours.map((n) => (
                <li key={n.slug}>
                  {indexable.has(n.slug) ? (
                    <Link className="chip" href={`/states/${n.slug}`}>
                      {n.name}
                    </Link>
                  ) : (
                    <span className="chip" style={{ cursor: "default", opacity: 0.7 }}>
                      {n.name}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <p className="muted" style={{ fontSize: "0.9rem" }}>
              State tourism authority? <Link href="/partners?interest=showcase#enquiry">Showcase your destinations</Link>.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
