"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="page-hero page-hero--plain on-dark" style={{ minHeight: "70vh" }}>
      <div className="container stack">
        <p className="eyebrow">Something went wrong</p>
        <h1 className="display t-1">This page didn&apos;t load properly.</h1>
        <p className="lede">Try again. If it keeps happening, go back to the home page and try another route.</p>
        <div className="cluster">
          <button type="button" className="btn btn--sun" onClick={() => reset()}>
            Try again
          </button>
          <Link href="/" className="btn btn--ghost-light">
            Go to the home page
          </Link>
        </div>
      </div>
    </section>
  );
}
