import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eyebrow } from "@/components/brand";
import { DestinationCard } from "@/components/DestinationCard";
import { JsonLd } from "@/components/JsonLd";
import { PageHero } from "@/components/PageHero";
import { StoryCard } from "@/components/sections";
import { destinations } from "@/content/destinations";
import { experienceBySlug, experiences } from "@/content/experiences";
import { stories } from "@/content/stories";
import { stateOf } from "@/lib/content";
import { itemListLd, pageMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return experiences.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: PageProps<"/experiences/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const e = experienceBySlug.get(slug);
  if (!e) return {};
  return pageMetadata({ title: `${e.name} in Nigeria`, description: `${e.line} ${e.intro[0]}`.slice(0, 300), path: `/experiences/${e.slug}`, plate: e.plate });
}

export default async function ExperiencePage({ params }: PageProps<"/experiences/[slug]">) {
  const { slug } = await params;
  const e = experienceBySlug.get(slug);
  if (!e) notFound();
  const list = destinations.filter((d) => d.categories.some((c) => e.categories.includes(c)));
  const relatedStories = stories.filter((s) => s.relatedDestinations.some((r) => list.some((d) => d.slug === r))).slice(0, 3);
  const others = experiences.filter((x) => x.slug !== e.slug);

  return (
    <>
      <JsonLd data={itemListLd(`${e.name} in Nigeria`, list.map((d) => ({ name: d.name, path: `/destinations/${d.slug}` })))} />
      <PageHero
        crumbs={[
          { name: "Experiences", path: "/experiences" },
          { name: e.name, path: `/experiences/${e.slug}` },
        ]}
        eyebrow="Experience Nigeria"
        title={e.name}
        lede={e.line}
        plate={e.plate}
      />
      <section className="section">
        <div className="container split split--wide-left">
          <div className="prose">
            {e.intro.map((p) => (
              <p key={p.slice(0, 20)} style={{ fontSize: "var(--step-1)" }}>
                {p}
              </p>
            ))}
          </div>
          <aside className="panel stack" aria-labelledby="notes">
            <h2 id="notes" className="eyebrow">
              Planning notes
            </h2>
            <ul className="stack" style={{ paddingLeft: "1.1rem", margin: 0, gap: "0.6rem" }}>
              {e.planningNotes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
            <Link href="/plan#before-you-go" className="link-arrow" style={{ fontSize: "0.9rem" }}>
              Entry, health and advice <span className="arrow" aria-hidden="true">→</span>
            </Link>
          </aside>
        </div>
      </section>
      <section className="section section--paper" aria-labelledby="where">
        <div className="container">
          <div className="section-head">
            <Eyebrow>Where to go</Eyebrow>
            <h2 id="where" className="display t-2">
              {list.length} places for {e.name.toLowerCase()}
            </h2>
          </div>
          <div className="card-grid">
            {list.map((d, i) => (
              <DestinationCard key={d.slug} d={d} state={stateOf(d.state)} i={i} />
            ))}
          </div>
        </div>
      </section>
      {relatedStories.length > 0 ? (
        <section className="section" aria-labelledby="read">
          <div className="container">
            <div className="section-head">
              <Eyebrow>Read</Eyebrow>
              <h2 id="read" className="display t-2">
                Stories to plan with
              </h2>
            </div>
            <div className="card-grid">
              {relatedStories.map((s, i) => (
                <StoryCard key={s.slug} s={s} i={i} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
      <section className="section section--sage" aria-label="Other experiences">
        <div className="container cluster">
          <span className="eyebrow">More experiences</span>
          {others.map((o) => (
            <Link key={o.slug} href={`/experiences/${o.slug}`} className="chip">
              {o.name}
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
