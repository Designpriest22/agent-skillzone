import Link from "next/link";
import type { Plate } from "@/content/schema";
import { breadcrumbLd } from "@/lib/seo";
import { plateKey } from "@/lib/plates";
import { Eyebrow } from "./brand";
import { JsonLd } from "./JsonLd";

export type Crumb = { name: string; path: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="breadcrumbs">
      <ol>
        {items.map((c, i) =>
          i === items.length - 1 ? (
            <li key={c.path} aria-current="page">
              {c.name}
            </li>
          ) : (
            <li key={c.path}>
              <Link href={c.path}>{c.name}</Link>
            </li>
          ),
        )}
      </ol>
    </nav>
  );
}

export function PageHero({
  crumbs,
  eyebrow,
  title,
  lede,
  plate,
  children,
}: {
  crumbs: Crumb[];
  eyebrow?: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  plate?: Plate;
  children?: React.ReactNode;
}) {
  const all = [{ name: "Home", path: "/" }, ...crumbs];
  return (
    <header className={`page-hero on-dark ${plate ? "" : "page-hero--plain"}`}>
      {plate ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="plate-bg" src={`/plates/${plateKey(plate)}.svg`} alt="" width={1600} height={1000} />
      ) : null}
      <JsonLd data={breadcrumbLd(all)} />
      <div className="container stack">
        <Breadcrumbs items={all} />
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h1 className="display t-1">{title}</h1>
        {lede ? <p className="lede">{lede}</p> : null}
        {children}
      </div>
    </header>
  );
}
