import Link from "next/link";
import { Eyebrow } from "@/components/brand";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { PageHero } from "@/components/PageHero";
import { CampaignTimeline } from "@/components/sections";
import { inauguralOutcomes, ntwProgramme, ntwStatus, proposition, visitorJourney } from "@/content/platform";
import { pagePlate } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "National Tourism Week",
  description:
    "Destination Nigeria's proposed National Tourism Week: a seven-day convening of states, institutions, businesses and communities, with an eight-week campaign and a 12-month action agenda.",
  path: "/national-tourism-week",
  plate: pagePlate.ntw,
});

const tbc = "To be announced";

export default function NtwPage() {
  return (
    <>
      <PageHero
        crumbs={[{ name: "National Tourism Week", path: "/national-tourism-week" }]}
        eyebrow="Flagship programme"
        title={
          <>
            National <em>Tourism Week</em>
          </>
        }
        lede="A proposed seven-day national convening that connects tourism promotion with practical improvements across the visitor journey — and ends with commitments that can be reviewed over the following year."
        plate={pagePlate.ntw}
      >
        <div className="cluster" style={{ marginTop: "1.5rem" }}>
          <Link href="#register-interest" className="btn btn--sun">
            Register interest
          </Link>
          <Link href="/partners?interest=ntw#enquiry" className="btn btn--ghost-light">
            Take part as an organisation
          </Link>
        </div>
      </PageHero>

      <section className="section section--paper" aria-labelledby="status">
        <div className="container">
          <h2 id="status" className="visually-hidden">
            Programme status
          </h2>
          <dl className="facts" style={{ maxWidth: "48rem" }}>
            <div>
              <dt>Status</dt>
              <dd>Proposed. Programme framework published for consultation.</dd>
            </div>
            <div>
              <dt>Dates</dt>
              <dd>{ntwStatus.dates ?? tbc}</dd>
            </div>
            <div>
              <dt>Venue & host state</dt>
              <dd>{ntwStatus.venue ?? tbc}</dd>
            </div>
            <div>
              <dt>Speakers</dt>
              <dd>{ntwStatus.speakers.length ? ntwStatus.speakers.map((s) => s.name).join(", ") : tbc}</dd>
            </div>
            <div>
              <dt>Participating organisations</dt>
              <dd>{ntwStatus.participants.length ? ntwStatus.participants.map((p) => p.name).join(", ") : "None confirmed yet"}</dd>
            </div>
            <div>
              <dt>Registration</dt>
              <dd>{ntwStatus.registrationUrl ? <a href={ntwStatus.registrationUrl}>Register</a> : "Opens when dates are confirmed. Register interest below to be notified."}</dd>
            </div>
            <div>
              <dt>Press materials</dt>
              <dd>{ntwStatus.pressKitUrl ? <a href={ntwStatus.pressKitUrl}>Download press kit</a> : <Link href="/media">Media resources</Link>}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="section" aria-labelledby="role">
        <div className="container split">
          <div className="stack">
            <Eyebrow>Why a national week</Eyebrow>
            <h2 id="role" className="display t-2">
              From promotion to practical improvement
            </h2>
          </div>
          <div className="prose">
            <p>{proposition.why[1]}</p>
            <p>The week brings the people responsible for each stage of the visitor journey into one room, and asks them to leave with commitments:</p>
            <ol className="journey journey--light" aria-label="Visitor journey stages">
              {visitorJourney.map((j) => (
                <li key={j.id}>{j.label}</li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="section section--forest" aria-labelledby="prog">
        <div className="container">
          <div className="section-head">
            <Eyebrow>Proposed programme areas</Eyebrow>
            <h2 id="prog" className="display t-2">
              Seven days, ten strands
            </h2>
            <p className="lede">Sessions, speakers and venues will be published here once confirmed.</p>
          </div>
          <div className="pathways">
            {ntwProgramme.map((p, i) => (
              <article key={p.title} className="pathway glass" data-reveal="up" style={{ "--i": i % 4 } as React.CSSProperties}>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="campaign">
        <div className="container">
          <div className="section-head">
            <Eyebrow>Eight-week campaign</Eyebrow>
            <h2 id="campaign" className="display t-2">
              The countdown
            </h2>
            <p className="lede">A digital and media campaign builds toward the week. Each stage names who leads it and what evidence it must produce.</p>
          </div>
          <CampaignTimeline />
        </div>
      </section>

      <section className="section section--paper" aria-labelledby="outcomes">
        <div className="container split">
          <div className="stack">
            <Eyebrow>Inaugural edition</Eyebrow>
            <h2 id="outcomes" className="display t-2">
              Proposed outcomes
            </h2>
          </div>
          <ul className="prose" style={{ paddingLeft: "1.2em" }}>
            {inauguralOutcomes.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--adire" id="register-interest" aria-labelledby="ri">
        <div className="container newsletter on-dark">
          <div className="stack">
            <Eyebrow>Register interest</Eyebrow>
            <h2 id="ri" className="display t-2">
              Hear first when dates are confirmed
            </h2>
            <p className="lede">We&apos;ll email you with dates, venue, registration and programme updates. Organisations wanting to take part should use the partnership form.</p>
            <p>
              <Link href="/partners?interest=ntw#enquiry" className="link-arrow">
                Take part as an organisation <span className="arrow" aria-hidden="true">→</span>
              </Link>
            </p>
          </div>
          <div className="glass" style={{ borderRadius: "var(--r-lg)", padding: "var(--space-6)" }}>
            <NewsletterForm defaultInterest="ntw" />
          </div>
        </div>
      </section>
    </>
  );
}
