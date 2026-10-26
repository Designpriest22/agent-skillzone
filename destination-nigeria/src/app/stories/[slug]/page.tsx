import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eyebrow } from "@/components/brand";
import { DestinationCard } from "@/components/DestinationCard";
import { JsonLd } from "@/components/JsonLd";
import { PageHero } from "@/components/PageHero";
import { ShareLinks } from "@/components/ShareLinks";
import { StoryCard } from "@/components/sections";
import { storyCategories } from "@/content/categories";
import { destinationBySlug } from "@/content/destinations";
import { siteUrl } from "@/content/site";
import { stories, storyBySlug } from "@/content/stories";
import { stateOf } from "@/lib/content";
import { articleLd, pageMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return stories.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/stories/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const s = storyBySlug.get(slug);
  if (!s) return {};
  return pageMetadata({ title: s.title, description: s.dek, path: `/stories/${s.slug}`, plate: s.plate, type: "article", publishedTime: s.published, modifiedTime: s.updated });
}

const fmt = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

export default async function StoryPage({ params }: PageProps<"/stories/[slug]">) {
  const { slug } = await params;
  const s = storyBySlug.get(slug);
  if (!s) notFound();
  const related = s.relatedDestinations.map((r) => destinationBySlug.get(r)).filter((d) => d !== undefined);
  const more = stories.filter((x) => x.slug !== s.slug && (x.category === s.category || x.relatedDestinations.some((r) => s.relatedDestinations.includes(r)))).slice(0, 3);
  const moreStories = more.length > 0 ? more : stories.filter((x) => x.slug !== s.slug).slice(0, 3);

  return (
    <>
      <JsonLd data={articleLd(s)} />
      <PageHero
        crumbs={[
          { name: "Stories", path: "/stories" },
          { name: s.title, path: `/stories/${s.slug}` },
        ]}
        eyebrow={storyCategories[s.category]}
        title={s.title}
        lede={s.dek}
        plate={s.plate}
      />
      <article className="section">
        <div className="container split split--wide-left">
          <div className="prose">
            {s.body.map((b, i) => {
              if (b.type === "h2") return <h2 key={i}>{b.text}</h2>;
              if (b.type === "ul")
                return (
                  <ul key={i}>
                    {b.items.map((it) => (
                      <li key={it}>{it}</li>
                    ))}
                  </ul>
                );
              if (b.type === "note")
                return (
                  <p key={i} className="note">
                    {b.text}
                  </p>
                );
              return (
                <p key={i} style={i === 0 ? { fontSize: "var(--step-1)" } : undefined}>
                  {b.text}
                </p>
              );
            })}
            {s.sources.length > 0 ? (
              <>
                <h2>Sources</h2>
                <ul>
                  {s.sources.map((src) => (
                    <li key={src.url}>
                      <a href={src.url} rel="noopener" target="_blank">
                        {src.label}
                        <span className="visually-hidden"> (opens in a new tab)</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
          <aside className="stack" aria-label="About this article">
            <div className="panel stack">
              <dl className="facts" style={{ borderTop: 0 }}>
                <div>
                  <dt>Author</dt>
                  <dd>{s.author}</dd>
                </div>
                <div>
                  <dt>Published</dt>
                  <dd>
                    <time dateTime={s.published}>{fmt(s.published)}</time>
                  </dd>
                </div>
                <div>
                  <dt>Updated</dt>
                  <dd>
                    <time dateTime={s.updated}>{fmt(s.updated)}</time>
                  </dd>
                </div>
                <div>
                  <dt>Review</dt>
                  <dd>{s.reviewStatus === "reviewed" ? `Reviewed by ${s.reviewer}` : "Awaiting editorial and subject review"}</dd>
                </div>
              </dl>
              <p className="mono muted">{s.readingMinutes} min read</p>
            </div>
            <ShareLinks url={`${siteUrl()}/stories/${s.slug}`} title={s.title} />
          </aside>
        </div>
      </article>

      {related.length > 0 ? (
        <section className="section section--paper" aria-labelledby="places">
          <div className="container">
            <div className="section-head">
              <Eyebrow>Places in this story</Eyebrow>
              <h2 id="places" className="display t-2">
                Add them to your trip
              </h2>
            </div>
            <div className="card-grid">
              {related.map((d, i) => (
                <DestinationCard key={d.slug} d={d} state={stateOf(d.state)} i={i} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="section" aria-labelledby="more">
        <div className="container">
          <div className="section-head">
            <Eyebrow>Keep reading</Eyebrow>
            <h2 id="more" className="display t-2">
              Related stories
            </h2>
          </div>
          <div className="card-grid">
            {moreStories.map((x, i) => (
              <StoryCard key={x.slug} s={x} i={i} />
            ))}
          </div>
          <p style={{ marginTop: "2rem" }}>
            <Link href="/stories" className="link-arrow">
              All stories <span className="arrow" aria-hidden="true">→</span>
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
