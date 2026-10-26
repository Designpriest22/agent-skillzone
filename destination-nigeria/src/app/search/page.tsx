import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { buildSearchIndex } from "@/lib/search-index";
import { searchDocs } from "@/lib/search";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "Search", description: "Search Destination Nigeria.", path: "/search", noindex: true });

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").slice(0, 120);
  const results = q ? searchDocs(buildSearchIndex(), q, 40) : [];
  return (
    <>
      <PageHero crumbs={[{ name: "Search", path: "/search" }]} eyebrow="Search" title={q ? <>Results for “{q}”</> : "Search the site"} />
      <section className="section">
        <div className="container stack-lg" style={{ maxWidth: "52rem" }}>
          <form role="search" action="/search" method="get" className="cluster on-light">
            <label htmlFor="search-page-q" className="visually-hidden">
              Search
            </label>
            <input id="search-page-q" name="q" type="search" className="input" defaultValue={q} placeholder="Destinations, states, stories…" style={{ flex: 1, minWidth: "14rem" }} />
            <button type="submit" className="btn btn--forest">
              Search
            </button>
          </form>
          <p className="mono muted" role="status">
            {q ? `${results.length} result${results.length === 1 ? "" : "s"}` : "Enter a word to search destinations, states, experiences and stories."}
          </p>
          {q && results.length === 0 ? (
            <div className="empty">
              <p>
                <strong>No results for “{q}”.</strong> Check the spelling, try a state name, or browse all destinations.
              </p>
              <Link className="btn btn--forest btn--sm" href="/destinations">
                Browse destinations
              </Link>
            </div>
          ) : (
            <ul className="search-results" style={{ maxHeight: "none", padding: 0 }}>
              {results.map((r) => (
                <li key={r.url}>
                  <Link href={r.url}>
                    <span className="kind">{r.kind}</span>
                    <strong>{r.title}</strong>
                    {r.text ? <span className="muted">{r.text}</span> : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
