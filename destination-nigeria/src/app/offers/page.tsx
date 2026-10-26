import Link from "next/link";
import { BookingLink } from "@/components/BookingLink";
import { Eyebrow } from "@/components/brand";
import { PageHero } from "@/components/PageHero";
import { offers } from "@/content/platform";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Nigeria tour packages, accommodation and verified offers",
  description:
    "Verified travel packages, accommodation, tours and events in Nigeria, booked directly with the provider. Every listing is checked before publication.",
  path: "/offers",
  plate: { scene: "coast", tod: "dusk", seed: 1005 },
});

const checks = [
  "The provider is a registered business and the person listing it is authorised to do so.",
  "The destination, dates and inclusions match what the provider will deliver.",
  "Prices and booking terms are shown exactly as the provider states them.",
  "The booking link goes directly to the provider or an established booking platform.",
  "Contact details have been tested.",
];

export default function OffersPage() {
  return (
    <>
      <PageHero
        crumbs={[{ name: "Offers & bookings", path: "/offers" }]}
        eyebrow="Offers & bookings"
        title={
          <>
            Verified offers, <em>booked direct.</em>
          </>
        }
        lede="Travel packages, accommodation, tours, events and experiences from verified providers. Destination Nigeria does not take bookings or payments: every booking is made with the provider."
        plate={{ scene: "coast", tod: "dusk", seed: 1005 }}
      />
      <section className="section section--paper" aria-labelledby="listings">
        <div className="container stack-lg">
          <div className="section-head" style={{ marginBottom: 0 }}>
            <Eyebrow>Listings</Eyebrow>
            <h2 id="listings" className="display t-2">
              Current offers
            </h2>
          </div>
          {offers.length === 0 ? (
            <div className="empty">
              <p>
                <strong>There are no verified offers yet.</strong> Listings will appear here as hotels, airlines, tour operators and event organisers complete verification. We won&apos;t publish sample or placeholder deals.
              </p>
              <div className="cluster">
                <Link className="btn btn--forest btn--sm" href="/partners?interest=list-offer#enquiry">
                  List your offer
                </Link>
                <Link className="btn btn--ghost btn--sm" href="/#newsletter">
                  Get notified about new offers
                </Link>
              </div>
            </div>
          ) : (
            <div className="card-grid">
              {offers.map((o) => (
                <article key={o.id} className="panel stack">
                  <p className="eyebrow">
                    {o.category} · {o.destination}
                  </p>
                  <h3 className="display t-3">{o.provider}</h3>
                  <p>{o.description}</p>
                  <dl className="facts">
                    {o.validFrom || o.validTo ? (
                      <div>
                        <dt>Valid</dt>
                        <dd>
                          {o.validFrom ?? "now"} – {o.validTo ?? "until further notice"}
                        </dd>
                      </div>
                    ) : null}
                    {o.price ? (
                      <div>
                        <dt>Price</dt>
                        <dd>{o.price}</dd>
                      </div>
                    ) : null}
                    {o.terms ? (
                      <div>
                        <dt>Terms</dt>
                        <dd>{o.terms}</dd>
                      </div>
                    ) : null}
                    {o.contact ? (
                      <div>
                        <dt>Contact</dt>
                        <dd>{o.contact}</dd>
                      </div>
                    ) : null}
                  </dl>
                  <BookingLink href={o.bookingUrl} provider={o.provider} offerId={o.id} />
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
      <section className="section" aria-labelledby="how">
        <div className="container split">
          <div className="stack">
            <Eyebrow>How listings work</Eyebrow>
            <h2 id="how" className="display t-2">
              What we check before an offer goes live
            </h2>
          </div>
          <div className="prose">
            <ul>
              {checks.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            <p className="note">
              Third-party booking links are clearly marked and open the provider&apos;s own site. Your contract is with the provider; read their terms and cancellation policy before paying.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
