import Link from "next/link";
import { Eyebrow } from "@/components/brand";
import { NigeriaMap } from "@/components/NigeriaMap";
import { PageHero } from "@/components/PageHero";
import { ExperiencePanels, mapProps, Worlds } from "@/components/sections";
import { destinations } from "@/content/destinations";
import type { ZoneId } from "@/content/schema";
import { states, zones } from "@/content/states";
import { pagePlate } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Discover Nigeria: regions, landscapes and culture",
  description:
    "Discover Nigeria's six geopolitical zones, from Atlantic coast and rainforest to highlands, savanna and historic cities, and find places to visit in each region.",
  path: "/discover",
  plate: pagePlate.discover,
});

const zoneIntro: Record<ZoneId, string> = {
  "south-west": "Yoruba heartland: Lagos, sacred groves, granite hills, waterfalls and festivals.",
  "south-south": "Niger Delta, Atlantic beaches, rainforest, the Obudu Plateau and Calabar.",
  "south-east": "Escarpments, caves, lakes and the commercial energy of the Igbo heartland.",
  "north-central": "The capital, granite inselbergs, the Jos Plateau and great rivers.",
  "north-east": "Savanna wildlife, mountain heritage landscapes and the highest peaks.",
  "north-west": "Ancient trading cities, earthen architecture, durbars and river festivals.",
};

export default function DiscoverPage() {
  const featured = destinations.filter((d) => d.featured).slice(0, 6);
  return (
    <>
      <PageHero
        crumbs={[{ name: "Discover Nigeria", path: "/discover" }]}
        eyebrow="Discover Nigeria"
        title={
          <>
            One country. <em>Six regions.</em> Countless stories.
          </>
        }
        lede="Nigeria stretches from Atlantic mangroves to the edge of the Sahel. Start with the regions, then follow the places that call to you."
        plate={pagePlate.discover}
      />
      <section className="section" aria-labelledby="zones">
        <div className="container">
          <div className="section-head">
            <Eyebrow>Geopolitical zones</Eyebrow>
            <h2 id="zones" className="display t-2">
              The regions
            </h2>
          </div>
          <div className="tool-grid">
            {(Object.keys(zones) as ZoneId[]).map((z) => {
              const n = destinations.filter((d) => states.find((s) => s.slug === d.state)?.zone === z).length;
              return (
                <Link key={z} href={`/destinations?zone=${z}`} className="tool">
                  <span className="status-pill status-pill--reference">
                    {n} destination{n === 1 ? "" : "s"}
                  </span>
                  <h3>{zones[z].name}</h3>
                  <p>{zoneIntro[z]}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
      <section className="section section--deep" aria-labelledby="map">
        <div className="container">
          <div className="section-head">
            <Eyebrow>State by state</Eyebrow>
            <h2 id="map" className="display t-2">
              Explore the map
            </h2>
          </div>
          <NigeriaMap {...mapProps()} />
        </div>
      </section>
      <section className="section" aria-labelledby="featured">
        <div className="container">
          <div className="section-head">
            <Eyebrow>Featured</Eyebrow>
            <h2 id="featured" className="display t-2">
              Different worlds. <em>One destination.</em>
            </h2>
          </div>
          <Worlds items={featured} />
        </div>
      </section>
      <section className="section section--paper" aria-labelledby="ways">
        <div className="container">
          <div className="section-head">
            <Eyebrow>Ways to travel</Eyebrow>
            <h2 id="ways" className="display t-2">
              Choose your experience
            </h2>
          </div>
          <ExperiencePanels />
        </div>
      </section>
    </>
  );
}
