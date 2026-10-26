import Link from "next/link";
import { Suspense } from "react";
import { Eyebrow } from "@/components/brand";
import { ItineraryBuilder } from "@/components/ItineraryBuilder";
import { PageHero } from "@/components/PageHero";
import { PlanningTools } from "@/components/sections";
import { destinations } from "@/content/destinations";
import { advisorySummary, RESOURCES_LAST_CHECKED, resources } from "@/content/resources";
import { siteUrl } from "@/content/site";
import { stateOf } from "@/lib/content";
import { pagePlate } from "@/lib/content";
import { plateKey } from "@/lib/plates";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Plan your trip to Nigeria: itinerary builder, entry and travel advice",
  description:
    "Plan a trip to Nigeria: build and export an itinerary, and find official sources for e-Visa applications, health requirements and current travel advice.",
  path: "/plan",
  plate: pagePlate.plan,
});

const topicTitle = { entry: "Travel authorization & entry", health: "Health & vaccinations", advice: "Official travel advice", accessibility: "Accessibility" } as const;

export default function PlanPage() {
  const lookup = Object.fromEntries(destinations.map((d) => [d.slug, { d, s: stateOf(d.state), plateSrc: `/plates/${plateKey(d.plate)}.svg` }]));
  const checked = new Date(RESOURCES_LAST_CHECKED).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  return (
    <>
      <PageHero
        crumbs={[{ name: "Plan your trip", path: "/plan" }]}
        eyebrow="Plan your journey"
        title={
          <>
            Your journey <em>starts here.</em>
          </>
        }
        lede="Shortlist destinations, put them in order and take your plan with you. Then check entry, health and advice with the official sources below."
        plate={pagePlate.plan}
      />

      <section className="section section--paper" id="itinerary" aria-labelledby="it-title">
        <div className="container">
          <div className="section-head">
            <Eyebrow>Itinerary builder</Eyebrow>
            <h2 id="it-title" className="display t-2">
              Your trip shortlist
            </h2>
            <p className="lede">Order your stops, set how many days you want in each, add notes, then download, print or share your plan.</p>
          </div>
          <Suspense fallback={<p className="muted">Loading your shortlist…</p>}>
            <ItineraryBuilder lookup={lookup} siteUrl={siteUrl()} />
          </Suspense>
        </div>
      </section>

      <section className="section" id="before-you-go" aria-labelledby="byg-title">
        <div className="container stack-lg">
          <div className="section-head section-head--split" style={{ marginBottom: 0 }}>
            <div className="stack">
              <Eyebrow>Before you go</Eyebrow>
              <h2 id="byg-title" className="display t-2">
                Entry, health and travel advice
              </h2>
            </div>
            <div className="stack">
              <p className="lede">Requirements change. We link to the official source for each topic rather than restating rules, and show when each link was last checked.</p>
              <p className="mono muted">Last checked: {checked}</p>
            </div>
          </div>
          <div className="panel panel--advisory">
            <p>
              <strong>Safety and travel advice.</strong> {advisorySummary}
            </p>
          </div>
          <div className="card-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 20rem), 1fr))" }}>
            {(["entry", "health", "advice"] as const).map((topic) => (
              <div key={topic} className="panel stack">
                <h3 className="display t-3">{topicTitle[topic]}</h3>
                <ul className="stack" style={{ listStyle: "none", padding: 0, margin: 0, gap: "1rem" }}>
                  {resources
                    .filter((r) => r.topic === topic)
                    .map((r) => (
                      <li key={r.id} className="stack" style={{ gap: "0.25rem" }}>
                        <a href={r.url} rel="noopener" target="_blank" style={{ fontWeight: 600 }}>
                          {r.title}
                          <span className="visually-hidden"> (opens in a new tab)</span>
                        </a>
                        <span className="mono muted">{r.publisher}</span>
                        <span style={{ fontSize: "0.9rem" }}>{r.note}</span>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--sage" id="getting-around" aria-labelledby="ga-title">
        <div className="container split">
          <div className="stack">
            <Eyebrow>Getting around</Eyebrow>
            <h2 id="ga-title" className="display t-2">
              Moving between places
            </h2>
          </div>
          <div className="prose">
            <p>Nigeria is large, and road journeys take longer than maps suggest. Domestic flights connect the main cities; for road travel, an experienced driver who knows the route is often worth the cost.</p>
            <p>Plan two or three bases rather than a long chain of one-night stops, and in Lagos group each day&apos;s activities by area to limit time in traffic.</p>
            <p className="note">
              Verified transport operators, routes and schedules will be added as partners confirm them. Until then, confirm schedules and prices directly with operators before you travel.
            </p>
            <p>
              <Link href="/stories/planning-a-first-trip-to-nigeria" className="link-arrow">
                Read the first-trip planning guide <span className="arrow" aria-hidden="true">→</span>
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="tools-title">
        <div className="container">
          <div className="section-head">
            <Eyebrow>Everything in the planning hub</Eyebrow>
            <h2 id="tools-title" className="display t-2">
              What&apos;s here, and what&apos;s coming
            </h2>
            <p className="lede">Each tool shows its status, so you can tell confirmed information from general guidance.</p>
          </div>
          <PlanningTools />
        </div>
      </section>
    </>
  );
}
