import { JsonLd } from "@/components/JsonLd";
import { PageHero } from "@/components/PageHero";
import { StoriesIndex } from "@/components/StoriesIndex";
import { stories } from "@/content/stories";
import { pagePlate } from "@/lib/content";
import { itemListLd, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Stories from Nigeria: travel guides, itineraries and culture",
  description: "Nigeria travel guides, itineraries, food, festivals, culture and tourism investment stories from the Destination Nigeria editorial team.",
  path: "/stories",
  plate: pagePlate.stories,
});

export default function StoriesPage() {
  return (
    <>
      <PageHero
        crumbs={[{ name: "Stories", path: "/stories" }]}
        eyebrow="Journal"
        title={
          <>
            Stories from <em>Nigeria</em>
          </>
        }
        lede="Guides, itineraries and context, written to help you plan well and travel responsibly."
        plate={pagePlate.stories}
      />
      <JsonLd data={itemListLd("Stories from Nigeria", stories.map((s) => ({ name: s.title, path: `/stories/${s.slug}` })))} />
      <section className="section" aria-label="All stories">
        <div className="container">
          <StoriesIndex stories={stories} />
        </div>
      </section>
    </>
  );
}
