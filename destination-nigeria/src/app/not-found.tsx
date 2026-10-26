import Link from "next/link";
import { PageHero } from "@/components/PageHero";

export const metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <>
      <PageHero crumbs={[{ name: "Page not found", path: "/404" }]} eyebrow="404" title="This path doesn't lead anywhere yet." lede="The page may have moved, or the address may be mistyped. Here are some good places to pick up the trail." />
      <section className="section">
        <div className="container cluster">
          <Link href="/destinations" className="btn btn--forest">
            Browse destinations
          </Link>
          <Link href="/states" className="btn btn--ghost">
            Explore by state
          </Link>
          <Link href="/search" className="btn btn--ghost">
            Search the site
          </Link>
          <Link href="/" className="btn btn--ghost">
            Go to the home page
          </Link>
        </div>
      </section>
    </>
  );
}
