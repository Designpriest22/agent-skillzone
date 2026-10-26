import { Suspense } from "react";
import { DestinationExplorer } from "@/components/DestinationExplorer";
import { JsonLd } from "@/components/JsonLd";
import { PageHero } from "@/components/PageHero";
import { explorerItems } from "@/components/sections";
import { destinations } from "@/content/destinations";
import { states } from "@/content/states";
import { pagePlate } from "@/lib/content";
import { itemListLd, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Places to visit in Nigeria: destinations by state and experience",
  description:
    "Explore places to visit in Nigeria by region, state and experience: waterfalls, highlands, World Heritage sites, festivals, beaches and cities, with sources and visitor guidance.",
  path: "/destinations",
  plate: pagePlate.destinations,
});

export default function DestinationsPage() {
  return (
    <>
      <PageHero
        crumbs={[{ name: "Destinations", path: "/destinations" }]}
        eyebrow="Destination discovery"
        title={
          <>
            Places to visit in <em>Nigeria</em>
          </>
        }
        lede="A growing national portfolio, from sacred groves and granite domes to lagoon cities and festival grounds. Filter by region, state or the kind of experience you want."
        plate={pagePlate.destinations}
      />
      <JsonLd data={itemListLd("Destinations in Nigeria", destinations.map((d) => ({ name: d.name, path: `/destinations/${d.slug}` })))} />
      <section className="section section--paper" id="find-your-nigeria" aria-label="Destination explorer">
        <div className="container">
          <Suspense fallback={<p className="muted">Loading destinations…</p>}>
            <DestinationExplorer items={explorerItems()} states={states} headingLevel={2} />
          </Suspense>
          <p className="muted" style={{ marginTop: "3rem", fontSize: "0.9rem", maxWidth: "48rem" }}>
            Every destination is a well-documented public place, written from the reference sources listed on its page and awaiting verification by the relevant state authority. Visiting arrangements, prices and access are never shown as fact until an operator or authority confirms them.
          </p>
        </div>
      </section>
    </>
  );
}
