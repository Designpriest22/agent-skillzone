import { PageHero } from "./PageHero";

/** Layout for policy pages. `updated` is shown so readers know how current the text is. */
export function PolicyPage({ title, path, updated, children }: { title: string; path: string; updated: string; children: React.ReactNode }) {
  return (
    <>
      <PageHero crumbs={[{ name: title, path }]} eyebrow="Policies" title={title} />
      <section className="section">
        <div className="container">
          <div className="prose">
            <p className="mono muted">Last updated: {new Date(updated).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
            {children}
          </div>
        </div>
      </section>
    </>
  );
}

/** Marks text the platform owner must confirm before launch. */
export function ToConfirm({ children }: { children: React.ReactNode }) {
  return (
    <mark style={{ background: "#fbf0d6", padding: "0 0.25em", borderRadius: 3 }}>
      [To be confirmed by the platform owner: {children}]
    </mark>
  );
}
