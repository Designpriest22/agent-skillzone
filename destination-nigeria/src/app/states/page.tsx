import Link from "next/link";
import { Eyebrow } from "@/components/brand";
import { NigeriaMap } from "@/components/NigeriaMap";
import { PageHero } from "@/components/PageHero";
import { mapProps } from "@/components/sections";
import type { ZoneId } from "@/content/schema";
import { states, zones } from "@/content/states";
import { destinationsInState } from "@/content/destinations";
import { pagePlate, statesWithContent } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "States of Nigeria: explore by state and region",
  description:
    "An interactive map of Nigeria's 36 states and the Federal Capital Territory. Explore each state's region, capital and published destinations.",
  path: "/states",
  plate: pagePlate.states,
});

export default function StatesPage() {
  const indexable = new Set(statesWithContent().map((s) => s.slug));
  return (
    <>
      <PageHero
        crumbs={[{ name: "States", path: "/states" }]}
        eyebrow="State by state"
        title="The states of Nigeria"
        lede="Thirty-six states and the Federal Capital Territory across six geopolitical zones. Select a state on the map, use the finder, or browse the list below."
        plate={pagePlate.states}
      />
      <section className="section section--deep" aria-labelledby="map-title">
        <div className="container">
          <h2 id="map-title" className="visually-hidden">
            Interactive map of Nigeria
          </h2>
          <NigeriaMap {...mapProps()} />
        </div>
      </section>
      <section className="section" aria-labelledby="by-zone">
        <div className="container">
          <div className="section-head">
            <Eyebrow>All states</Eyebrow>
            <h2 id="by-zone" className="display t-2">
              By geopolitical zone
            </h2>
            <p className="lede">States with published destinations link to their own page. The others are in preparation with state authorities.</p>
          </div>
          <div className="card-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 15rem), 1fr))" }}>
            {(Object.keys(zones) as ZoneId[]).map((z) => (
              <div key={z} className="panel stack">
                <h3 className="display t-3">{zones[z].name}</h3>
                <ul className="stack" style={{ listStyle: "none", padding: 0, margin: 0, gap: "0.4rem" }}>
                  {states
                    .filter((s) => s.zone === z)
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((s) => (
                      <li key={s.slug}>
                        {indexable.has(s.slug) ? (
                          <Link href={`/states/${s.slug}`}>
                            <strong>{s.name}</strong>
                          </Link>
                        ) : (
                          <span>{s.name}</span>
                        )}{" "}
                        <span className="muted" style={{ fontSize: "0.85rem" }}>
                          · {s.capital}
                          {indexable.has(s.slug) ? ` · ${destinationsInState(s.slug).length} destination${destinationsInState(s.slug).length === 1 ? "" : "s"}` : ""}
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
