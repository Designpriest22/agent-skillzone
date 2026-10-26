import { PageHero } from "@/components/PageHero";
import { ExperiencePanels } from "@/components/sections";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Things to do in Nigeria: experiences",
  description:
    "Things to do in Nigeria: nature and adventure, arts and heritage, food, festivals, leisure and community-led tourism, with practical planning notes.",
  path: "/experiences",
  plate: { scene: "festival", tod: "night", seed: 1004 },
});

export default function ExperiencesPage() {
  return (
    <>
      <PageHero
        crumbs={[{ name: "Experiences", path: "/experiences" }]}
        eyebrow="Experience Nigeria"
        title={
          <>
            Come for the experience. <em>Leave with a story.</em>
          </>
        }
        lede="Six ways into Nigeria, each with the places, practical notes and stories to plan around."
        plate={{ scene: "festival", tod: "night", seed: 1004 }}
      />
      <section className="section" aria-label="Experiences">
        <div className="container">
          <ExperiencePanels headingLevel={2} />
        </div>
      </section>
    </>
  );
}
