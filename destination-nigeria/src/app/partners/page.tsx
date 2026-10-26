import { Eyebrow } from "@/components/brand";
import { PartnershipForm } from "@/components/forms/EnquiryForms";
import { PageHero } from "@/components/PageHero";
import { partners, prospectivePartnerTypes } from "@/content/platform";
import { partnerInterests } from "@/lib/forms";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Tourism partnerships and institutional collaboration",
  description:
    "Partner with Destination Nigeria: government bodies, state tourism agencies, tourism businesses, communities, media, education institutions and development partners.",
  path: "/partners",
  plate: { scene: "terraces", tod: "day", seed: 1006 },
});

const model = [
  { title: "Shared agenda", text: "Partners agree a 12-month action agenda with named owners, reviewed publicly." },
  { title: "Verified information", text: "States and operators confirm facts, permissions and booking details before anything is published." },
  { title: "Community benefit", text: "Community tourism activity records consent, a safety plan and local benefit." },
  { title: "Measured results", text: "Commitments are tracked and reported in a first-year measurement report." },
];

export default async function PartnersPage({ searchParams }: PageProps<"/partners">) {
  const sp = await searchParams;
  const raw = typeof sp.interest === "string" ? sp.interest : undefined;
  const interest = partnerInterests.find((p) => p.value === raw)?.value;
  return (
    <>
      <PageHero
        crumbs={[{ name: "Partnerships", path: "/partners" }]}
        eyebrow="Partnerships"
        title={
          <>
            Built <em>together.</em>
          </>
        }
        lede="Destination Nigeria brings public institutions, states, businesses, communities and creative partners together around the visitor journey."
        plate={{ scene: "terraces", tod: "day", seed: 1006 }}
      />
      <section className="section" aria-labelledby="model">
        <div className="container">
          <div className="section-head">
            <Eyebrow>The collaborative model</Eyebrow>
            <h2 id="model" className="display t-2">
              How partners work together
            </h2>
          </div>
          <div className="tool-grid">
            {model.map((m) => (
              <div key={m.title} className="tool">
                <h3>{m.title}</h3>
                <p>{m.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section section--paper" aria-label="Partners">
        <div className="container split">
          <div className="stack" role="region" aria-labelledby="confirmed">
            <Eyebrow>Confirmed partners</Eyebrow>
            <h2 id="confirmed" className="display t-3" style={{ fontSize: "var(--step-3)" }}>
              Announced partners
            </h2>
            {partners.length === 0 ? (
              <div className="empty">
                <p>No partners have been announced yet. Confirmed partners will be listed here, with logos shown only where use has been approved.</p>
              </div>
            ) : (
              <ul className="chip-row" style={{ listStyle: "none", padding: 0 }}>
                {partners.map((p) => (
                  <li key={p.name} className="tag">
                    {p.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="stack" role="region" aria-labelledby="prospective">
            <Eyebrow>Who we are inviting</Eyebrow>
            <h2 id="prospective" className="display t-3" style={{ fontSize: "var(--step-3)" }}>
              Prospective partner types
            </h2>
            <p className="muted" style={{ fontSize: "0.9rem" }}>
              These are categories of organisation we are inviting. They are not confirmed participants.
            </p>
            <dl className="facts">
              {prospectivePartnerTypes.map((p) => (
                <div key={p.title}>
                  <dt>{p.title}</dt>
                  <dd>{p.text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
      <section className="section section--sage" id="enquiry" aria-labelledby="eoi">
        <div className="container">
          <div className="panel stack-lg on-light" style={{ maxWidth: "56rem" }}>
            <div className="stack">
              <Eyebrow>Expression of interest</Eyebrow>
              <h2 id="eoi" className="display t-2">
                Partner with Destination Nigeria
              </h2>
              <p className="muted">For institutions, state authorities, operators, communities, media and development partners. Listing an offer? Choose “List a verified offer or experience”.</p>
            </div>
            <PartnershipForm defaultInterest={interest} />
          </div>
        </div>
      </section>
    </>
  );
}
