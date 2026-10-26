import Link from "next/link";
import { Suspense } from "react";
import { Eyebrow, RevealWords } from "@/components/brand";
import { DestinationExplorer } from "@/components/DestinationExplorer";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { HeroFilm, type HeroScene } from "@/components/home/HeroFilm";
import { HeroSearch } from "@/components/home/HeroSearch";
import { JsonLd } from "@/components/JsonLd";
import { NigeriaMap } from "@/components/NigeriaMap";
import { CampaignTimeline, ExperiencePanels, explorerItems, mapProps, Pathways, PlanningTools, StoryCard, Worlds } from "@/components/sections";
import { Welcome } from "@/components/Welcome";
import { destinationBySlug } from "@/content/destinations";
import { heroFilm } from "@/content/media";
import { ntwStatus, offers, partners, proposition, prospectivePartnerTypes, visitorJourney } from "@/content/platform";
import { site } from "@/content/site";
import { states } from "@/content/states";
import { stories } from "@/content/stories";
import { heroScenes } from "@/lib/content";
import { plateKey, plateSvg } from "@/lib/plates";
import { itemListLd, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: site.title, description: site.description, path: "/" });

const worldSlugs = ["osun-osogbo-sacred-grove", "obudu-mountain-resort", "kano-old-city", "yankari-national-park", "zuma-rock", "lagos-food-and-creative-scene"];

export default function HomePage() {
  const scenes: HeroScene[] = heroScenes.map((h, i) => ({
    svg: i === 0 ? plateSvg(h.plate) : null,
    src: `/plates/${plateKey(h.plate)}.svg`,
    caption: h.caption,
    alt: h.alt,
  }));
  const worlds = worldSlugs.map((s) => destinationBySlug.get(s)!);
  const items = explorerItems();

  return (
    <>
      <Welcome />
      <JsonLd data={itemListLd("Featured destinations in Nigeria", worlds.map((d) => ({ name: d.name, path: `/destinations/${d.slug}` })))} />

      {/* A — Cinematic hero */}
      <HeroFilm scenes={scenes} video={heroFilm}>
        <div className="container hero-inner">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="hero-logo" src="/brand/destination-nigeria-logo-reverse.svg" alt="Destination Nigeria" width={224} height={88} data-enter style={{ "--i": 0 } as React.CSSProperties} />
            <p className="eyebrow" data-enter style={{ "--i": 1, color: "var(--sun)" } as React.CSSProperties}>
              A Nation of Extraordinary Experiences
            </p>
            <h1 className="display t-hero" data-enter style={{ "--i": 2, marginTop: "1rem" } as React.CSSProperties}>
              Nigeria Is More Than You <em>Imagine.</em>
            </h1>
            <p className="hero-copy" data-enter style={{ "--i": 3 } as React.CSSProperties}>
              Discover remarkable landscapes, living cultures, unforgettable flavours and new opportunities across one of Africa&apos;s most diverse destinations.
            </p>
            <div className="hero-ctas" data-enter style={{ "--i": 4 } as React.CSSProperties}>
              <Link href="/destinations" className="btn btn--sun">
                Explore Nigeria <span className="arrow" aria-hidden="true">→</span>
              </Link>
              <Link href="/invest" className="btn btn--ghost-light">
                Invest in Tourism
              </Link>
            </div>
          </div>
          <HeroSearch />
        </div>
      </HeroFilm>

      {/* B — Destination discovery */}
      <section className="section section--paper" id="find-your-nigeria" aria-labelledby="b-title">
        <div className="container">
          <div className="section-head section-head--split">
            <div className="stack">
              <Eyebrow>Destination discovery</Eyebrow>
              <RevealWords id="b-title" as="h2" className="display t-2" text="Find Your Nigeria." />
            </div>
            <p className="lede">
              Search by region, state or the kind of experience you are after. Every listing shows where it is and what has been checked, so you can plan with confidence.
            </p>
          </div>
          <Suspense fallback={<p className="muted">Loading destinations…</p>}>
            <DestinationExplorer items={items} states={states} limit={8} />
          </Suspense>
        </div>
      </section>

      {/* C — A country of distinct experiences */}
      <section className="section" aria-labelledby="c-title">
        <div className="container">
          <div className="section-head">
            <Eyebrow>A country of distinct experiences</Eyebrow>
            <h2 id="c-title" className="display t-2 reveal-words" data-reveal-words aria-label="Different Worlds. One Destination.">
              {"Different Worlds. One Destination.".split(" ").map((w, i) => (
                <span key={i} aria-hidden="true">
                  <span className="w" style={{ "--w": i } as React.CSSProperties}>
                    {i === 1 ? <em>{w}</em> : w}
                  </span>{" "}
                </span>
              ))}
            </h2>
            <p className="lede">
              From sacred forest to savanna, earthen cities to lagoon nightlife: six places that show how much ground one journey through Nigeria can cover.
            </p>
          </div>
          <Worlds items={worlds} />
        </div>
      </section>

      {/* D — Interactive map */}
      <section className="section section--deep" id="map" aria-labelledby="d-title">
        <div className="container">
          <div className="section-head section-head--split">
            <div className="stack">
              <Eyebrow>State by state</Eyebrow>
              <h2 id="d-title" className="display t-2">
                Explore the map of Nigeria.
              </h2>
            </div>
            <p className="lede">
              Select any of the 36 states or the Federal Capital Territory to see its region, capital and the destinations published so far. Prefer typing? Use the state finder.
            </p>
          </div>
          <NigeriaMap {...mapProps()} />
        </div>
      </section>

      {/* E — Experience Nigeria */}
      <section className="section" aria-labelledby="e-title">
        <div className="container">
          <div className="section-head">
            <Eyebrow>Experience Nigeria</Eyebrow>
            <RevealWords id="e-title" as="h2" className="display t-2" text="Come for the Experience. Leave with a Story." />
          </div>
          <ExperiencePanels />
        </div>
      </section>

      {/* F — Plan your journey */}
      <section className="section section--sage" aria-labelledby="f-title">
        <div className="container">
          <div className="section-head section-head--split">
            <div className="stack">
              <Eyebrow>Plan your journey</Eyebrow>
              <h2 id="f-title" className="display t-2">
                Your Journey Starts Here.
              </h2>
            </div>
            <div className="stack">
              <p className="lede">
                Practical tools and official sources in one place. Inspiration is clearly marked as inspiration; bookable products appear only once a provider is verified.
              </p>
              <p>
                <Link href="/plan#itinerary" className="btn btn--forest">
                  Open the itinerary builder <span className="arrow" aria-hidden="true">→</span>
                </Link>
              </p>
            </div>
          </div>
          <PlanningTools />
        </div>
      </section>

      {/* G — Invest in Nigerian tourism */}
      <section className="section section--forest" id="invest" aria-labelledby="g-title">
        <div className="container stack-lg">
          <div className="section-head section-head--split" style={{ marginBottom: 0 }}>
            <div className="stack">
              <Eyebrow>Invest in tourism</Eyebrow>
              <h2 id="g-title" className="display t-2">
                Help Build the Next Chapter of Nigerian Tourism.
              </h2>
            </div>
            <div className="stack">
              <p className="lede">{proposition.purpose}</p>
              <p className="muted">
                Investment-ready products depend on the whole visitor journey working. The platform maps opportunities to each stage, so investors, states and partners can see who needs to act and where.
              </p>
            </div>
          </div>
          <ol className="journey" aria-label="The visitor journey">
            {visitorJourney.map((j) => (
              <li key={j.id}>{j.label}</li>
            ))}
          </ol>
          <Pathways />
          <div className="cluster">
            <Link href="/invest#enquiry" className="btn btn--sun">
              Make an investment enquiry <span className="arrow" aria-hidden="true">→</span>
            </Link>
            <Link href="/invest#opportunities" className="btn btn--ghost-light">
              View the opportunity framework
            </Link>
          </div>
        </div>
      </section>

      {/* H — National Tourism Week */}
      <section className="section section--paper" id="ntw" aria-labelledby="h-title">
        <div className="container">
          <div className="section-head section-head--split">
            <div className="stack">
              <Eyebrow>Flagship programme</Eyebrow>
              <h2 id="h-title" className="display t-2">
                National Tourism Week
              </h2>
            </div>
            <div className="stack">
              <p className="lede">
                A proposed seven-day national convening that links tourism promotion to practical improvement across the visitor journey, backed by an eight-week campaign and a 12-month action agenda.
              </p>
              <p className="status status--info" style={{ gridTemplateColumns: "1fr" }}>
                <span>
                  <strong>Dates, venue and host state: {ntwStatus.dates ?? "to be announced"}.</strong> Register interest to hear first when they are confirmed.
                </span>
              </p>
            </div>
          </div>
          <CampaignTimeline />
          <div className="cluster" style={{ marginTop: "2rem" }}>
            <Link href="/national-tourism-week" className="btn btn--forest">
              See the programme framework <span className="arrow" aria-hidden="true">→</span>
            </Link>
            <Link href="/national-tourism-week#register-interest" className="btn btn--ghost">
              Register interest
            </Link>
          </div>
        </div>
      </section>

      {/* I — Stories */}
      <section className="section" aria-labelledby="i-title">
        <div className="container">
          <div className="section-head section-head--split">
            <div className="stack">
              <Eyebrow>Journal</Eyebrow>
              <h2 id="i-title" className="display t-2">
                Stories from Nigeria
              </h2>
            </div>
            <p className="lede">Guides, itineraries and context from the Destination Nigeria editorial team.</p>
          </div>
          <div className="card-grid">
            {stories.slice(0, 3).map((s, i) => (
              <StoryCard key={s.slug} s={s} i={i} />
            ))}
          </div>
          <p style={{ marginTop: "2rem" }}>
            <Link href="/stories" className="link-arrow">
              All stories <span className="arrow" aria-hidden="true">→</span>
            </Link>
          </p>
        </div>
      </section>

      {/* J — Offers & bookings  /  K — Partnerships */}
      <section className="section section--paper" aria-label="Offers and partnerships">
        <div className="container split">
          <div className="stack" aria-labelledby="j-title" role="region">
            <Eyebrow>Offers &amp; bookings</Eyebrow>
            <h2 id="j-title" className="display t-3" style={{ fontSize: "var(--step-3)" }}>
              Verified offers, booked directly with providers.
            </h2>
            {offers.length === 0 ? (
              <div className="empty">
                <p>
                  <strong>No verified offers are listed yet.</strong> Packages, accommodation, tours and events appear here only after the provider, terms and booking link have been checked. We do not take bookings ourselves.
                </p>
                <div className="cluster">
                  <Link href="/offers" className="btn btn--ghost btn--sm">
                    How listings work
                  </Link>
                  <Link href="/partners?interest=list-offer#enquiry" className="btn btn--forest btn--sm">
                    List a verified offer
                  </Link>
                </div>
              </div>
            ) : (
              <Link href="/offers" className="btn btn--forest">
                Browse {offers.length} verified offers
              </Link>
            )}
          </div>
          <div className="stack" aria-labelledby="k-title" role="region">
            <Eyebrow>Partnerships</Eyebrow>
            <h2 id="k-title" className="display t-3" style={{ fontSize: "var(--step-3)" }}>
              Built with institutions, states, businesses and communities.
            </h2>
            <p className="muted">
              {partners.length === 0
                ? "No partners have been announced yet. Organisations listed below are the types we are inviting, not confirmed participants."
                : `${partners.length} confirmed partners.`}
            </p>
            <ul className="chip-row" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {prospectivePartnerTypes.map((p) => (
                <li key={p.title} className="tag" style={{ fontSize: "0.85rem", padding: "0.35rem 0.8rem" }}>
                  {p.title}
                </li>
              ))}
            </ul>
            <p>
              <Link href="/partners#enquiry" className="link-arrow">
                Express interest in partnering <span className="arrow" aria-hidden="true">→</span>
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* L — Newsletter & lead generation */}
      <section className="section section--adire" id="newsletter" aria-labelledby="l-title">
        <div className="container newsletter on-dark">
          <div className="stack">
            <Eyebrow>Stay in touch</Eyebrow>
            <h2 id="l-title" className="display t-2">
              Be first to know what&apos;s <em>next.</em>
            </h2>
            <p className="lede">New destinations as they are verified, National Tourism Week announcements, and investment updates — for travellers, businesses, investors, media and partners.</p>
            <ul className="stack" style={{ listStyle: "none", padding: 0, margin: "1rem 0 0", gap: "0.6rem" }}>
              <li>
                <Link href="/invest#enquiry" className="link-arrow">
                  Investors: make an enquiry <span className="arrow" aria-hidden="true">→</span>
                </Link>
              </li>
              <li>
                <Link href="/partners#enquiry" className="link-arrow">
                  Businesses &amp; institutions: partner with us <span className="arrow" aria-hidden="true">→</span>
                </Link>
              </li>
              <li>
                <Link href="/media" className="link-arrow">
                  Media: press resources <span className="arrow" aria-hidden="true">→</span>
                </Link>
              </li>
            </ul>
          </div>
          <div className="glass" style={{ borderRadius: "var(--r-lg)", padding: "var(--space-6)" }}>
            <NewsletterForm />
          </div>
        </div>
      </section>
    </>
  );
}
