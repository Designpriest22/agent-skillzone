import Link from "next/link";
import { Eyebrow } from "@/components/brand";
import { InvestmentForm } from "@/components/forms/EnquiryForms";
import { PageHero } from "@/components/PageHero";
import { Pathways } from "@/components/sections";
import { investmentPack, objectives, opportunities, opportunityCategories, opportunityStages, proposition, visitorJourney } from "@/content/platform";
import { zones } from "@/content/states";
import type { ZoneId } from "@/content/schema";
import { pagePlate } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Tourism investment opportunities in Nigeria",
  description:
    "Destination Nigeria connects tourism investors, states, hospitality operators and development partners with a structured framework for approved investment opportunities.",
  path: "/invest",
  plate: pagePlate.invest,
});

export default function InvestPage() {
  return (
    <>
      <PageHero
        crumbs={[{ name: "Invest in tourism", path: "/invest" }]}
        eyebrow="Invest in tourism"
        title={
          <>
            Help build the next chapter of <em>Nigerian tourism.</em>
          </>
        }
        lede={proposition.purpose}
        plate={pagePlate.invest}
      >
        <div className="cluster" style={{ marginTop: "1.5rem" }}>
          <Link href="#enquiry" className="btn btn--sun">
            Make an investment enquiry
          </Link>
          <Link href="#opportunities" className="btn btn--ghost-light">
            Opportunity framework
          </Link>
        </div>
      </PageHero>

      <section className="section" aria-labelledby="why">
        <div className="container split">
          <div className="stack">
            <Eyebrow>The proposition</Eyebrow>
            <h2 id="why" className="display t-2">
              Promotion fills a calendar. Readiness fills it again.
            </h2>
          </div>
          <div className="prose">
            {proposition.why.map((p) => (
              <p key={p.slice(0, 20)}>{p}</p>
            ))}
            <p>
              Destination Nigeria maps opportunities to the whole visitor journey, so investors, states and partners can see where action is needed — and publishes only opportunities that a responsible state or agency has approved.
            </p>
            <p className="note">{proposition.honesty}</p>
          </div>
        </div>
      </section>

      <section className="section section--forest" aria-labelledby="who">
        <div className="container stack-lg">
          <div className="section-head" style={{ marginBottom: 0 }}>
            <Eyebrow>Pathways</Eyebrow>
            <h2 id="who" className="display t-2">
              A route in for every partner
            </h2>
          </div>
          <Pathways />
          <ol className="journey" aria-label="The visitor journey, stage by stage">
            {visitorJourney.map((j) => (
              <li key={j.id}>{j.label}</li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section--paper" id="opportunities" aria-labelledby="opp-title">
        <div className="container stack-lg">
          <div className="section-head section-head--split" style={{ marginBottom: 0 }}>
            <div className="stack">
              <Eyebrow>Opportunity directory</Eyebrow>
              <h2 id="opp-title" className="display t-2">
                Approved opportunities
              </h2>
            </div>
            <p className="lede">
              Each listing will carry an approved project summary, its state and category, its stage and a named contact route. No returns, valuations or guarantees are published.
            </p>
          </div>

          {opportunities.length === 0 ? (
            <div className="empty">
              <p>
                <strong>No opportunities have been approved for publication yet.</strong> The directory opens as state governments and agencies approve project summaries. Register your interest below to be contacted when opportunities in your categories are published.
              </p>
            </div>
          ) : (
            <div className="card-grid">
              {opportunities.map((o) => (
                <article key={o.id} className="panel stack">
                  <span className="status-pill status-pill--live">{opportunityStages[o.stage]}</span>
                  <h3 className="display t-3">{o.title}</h3>
                  <p className="mono muted">
                    {o.state} · {o.category}
                  </p>
                  <p>{o.summary}</p>
                </article>
              ))}
            </div>
          )}

          <div className="split">
            <div className="stack">
              <h3 className="display t-3">Opportunity categories</h3>
              <ul className="chip-row" style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {opportunityCategories.map((c) => (
                  <li key={c.id} className="tag" style={{ padding: "0.35rem 0.8rem", fontSize: "0.85rem" }}>
                    {c.label}
                  </li>
                ))}
              </ul>
            </div>
            <div className="stack">
              <h3 className="display t-3">State-level structure</h3>
              <p className="muted">Opportunities are organised by state and geopolitical zone, so investors can compare priorities across regions:</p>
              <ul className="chip-row" style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {(Object.keys(zones) as ZoneId[]).map((z) => (
                  <li key={z} className="tag" style={{ padding: "0.35rem 0.8rem", fontSize: "0.85rem" }}>
                    {zones[z].name}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="panel stack" style={{ maxWidth: "44rem" }}>
            <h3 className="t-3" style={{ fontWeight: 600, fontSize: "1.1rem" }}>
              Investment information pack
            </h3>
            {investmentPack ? (
              <a className="btn btn--forest" href={investmentPack.url} download>
                Download {investmentPack.label}
              </a>
            ) : (
              <p>The information pack is being prepared and will be published here once approved. Make an enquiry to receive it when it is ready.</p>
            )}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="obj">
        <div className="container split">
          <div className="stack">
            <Eyebrow>Platform objectives</Eyebrow>
            <h2 id="obj" className="display t-2">
              What the platform is designed to achieve
            </h2>
          </div>
          <ul className="prose" style={{ paddingLeft: "1.2em" }}>
            {objectives.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--sage" id="enquiry" aria-labelledby="enq">
        <div className="container split split--wide-left">
          <div className="panel stack-lg on-light">
            <div className="stack">
              <Eyebrow>Investor enquiry</Eyebrow>
              <h2 id="enq" className="display t-2">
                Start a conversation
              </h2>
              <p className="muted">Tell us what you are looking for. We collect only what we need to respond, and never share your details without permission.</p>
            </div>
            <InvestmentForm />
          </div>
          <aside className="stack">
            <h3 className="display t-3">Not an investor?</h3>
            <p>
              State authorities, operators, airlines, training providers, development partners and creative businesses can use the{" "}
              <Link href="/partners#enquiry">partnership form</Link>.
            </p>
            <p className="muted" style={{ fontSize: "0.9rem" }}>
              See how we handle enquiries in our <Link href="/privacy">privacy policy</Link>.
            </p>
          </aside>
        </div>
      </section>
    </>
  );
}
