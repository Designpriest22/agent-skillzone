import Link from "next/link";
import { Eyebrow } from "@/components/brand";
import { PageHero } from "@/components/PageHero";
import { inauguralOutcomes, objectives, proposition, visitorJourney } from "@/content/platform";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "About Destination Nigeria",
  description:
    "Destination Nigeria is a national tourism development, investment and destination-marketing platform under the theme Experience. Invest. Explore.",
  path: "/about",
  plate: { scene: "highland", tod: "dawn", seed: 111 },
});

const principles = [
  { title: "National in ambition", text: "Every zone and state has a place in the portfolio." },
  { title: "International in presentation", text: "Built to the standard travellers and investors expect anywhere." },
  { title: "Authentic in storytelling", text: "Real places, original writing and no borrowed imagery." },
  { title: "Responsible with information", text: "Safety and access are handled honestly, with sources and dates." },
  { title: "Commercially credible", text: "Only verified offers and approved opportunities are published." },
  { title: "Inclusive", text: "Nigeria's regions, cultures, landscapes and communities, represented fairly." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        crumbs={[{ name: "About", path: "/about" }]}
        eyebrow={proposition.theme}
        title={
          <>
            More than a travel website. <em>A platform.</em>
          </>
        }
        lede={proposition.purpose}
        plate={{ scene: "highland", tod: "dawn", seed: 111 }}
      />
      <section className="section">
        <div className="container split">
          <div className="stack">
            <Eyebrow>Why it is needed</Eyebrow>
            <h2 className="display t-2">Potential, coordinated</h2>
          </div>
          <div className="prose">
            {proposition.why.map((p) => (
              <p key={p.slice(0, 20)}>{p}</p>
            ))}
            <p className="note">{proposition.honesty}</p>
          </div>
        </div>
      </section>
      <section className="section section--forest" aria-labelledby="journey">
        <div className="container stack-lg">
          <div className="section-head" style={{ marginBottom: 0 }}>
            <Eyebrow>The visitor journey</Eyebrow>
            <h2 id="journey" className="display t-2">
              Nine stages, one experience
            </h2>
            <p className="lede">Destination Nigeria connects promotion to practical improvement at every stage a visitor passes through.</p>
          </div>
          <ol className="journey">
            {visitorJourney.map((j) => (
              <li key={j.id}>{j.label}</li>
            ))}
          </ol>
        </div>
      </section>
      <section className="section" aria-labelledby="principles">
        <div className="container">
          <div className="section-head">
            <Eyebrow>Principles</Eyebrow>
            <h2 id="principles" className="display t-2">
              How we work
            </h2>
          </div>
          <div className="tool-grid">
            {principles.map((p) => (
              <div key={p.title} className="tool">
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section section--paper" aria-label="Objectives and outcomes">
        <div className="container split">
          <div className="stack">
            <h2 className="display t-3">Objectives</h2>
            <ul className="prose" style={{ paddingLeft: "1.2em" }}>
              {objectives.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </div>
          <div className="stack">
            <h2 className="display t-3">Proposed outcomes of the first edition</h2>
            <ul className="prose" style={{ paddingLeft: "1.2em" }}>
              {inauguralOutcomes.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
            <p>
              <Link href="/national-tourism-week" className="link-arrow">
                National Tourism Week <span className="arrow" aria-hidden="true">→</span>
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
