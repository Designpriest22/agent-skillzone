import type { Metadata } from "next";
import type { Destination, State, Story } from "@/content/schema";
import { site, siteUrl } from "@/content/site";
import { plateKey } from "./plates";
import type { Plate } from "@/content/schema";

/** Per-page metadata with canonical URL and social cards. */
export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  plate?: Plate;
  noindex?: boolean;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
}): Metadata {
  const url = `${siteUrl()}${opts.path}`;
  const image = opts.plate ? `/og/${plateKey(opts.plate)}.png` : "/opengraph-image";
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url },
    robots: opts.noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: opts.type ?? "website",
      url,
      siteName: site.name,
      title: opts.title,
      description: opts.description,
      locale: site.locale,
      images: [{ url: image, width: 1200, height: 630, alt: "" }],
      ...(opts.type === "article" ? { publishedTime: opts.publishedTime, modifiedTime: opts.modifiedTime } : {}),
    },
    twitter: { card: "summary_large_image", title: opts.title, description: opts.description, images: [image] },
  };
}

type Crumb = { name: string; path: string };

export function breadcrumbLd(items: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: `${siteUrl()}${c.path}` })),
  };
}

export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl()}/#organization`,
    name: site.name,
    url: siteUrl(),
    logo: `${siteUrl()}/brand/destination-nigeria-logo.svg`,
    slogan: site.tagline,
    description:
      "A national tourism development, investment and destination-marketing platform connecting public institutions, states, tourism businesses, communities, creative partners, investors and travellers.",
  };
}

export function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl()}/#website`,
    name: site.name,
    url: siteUrl(),
    inLanguage: site.lang,
    publisher: { "@id": `${siteUrl()}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${siteUrl()}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * TouristAttraction for a destination. Only fields supported by the content are
 * included: no coordinates, opening hours, prices or ratings.
 */
export function attractionLd(d: Destination, s: State) {
  return {
    "@context": "https://schema.org",
    "@type": d.categories.includes("festivals-events") && !d.categories.includes("nature-adventure") ? "Place" : "TouristAttraction",
    name: d.name,
    description: d.summary,
    url: `${siteUrl()}/destinations/${d.slug}`,
    address: {
      "@type": "PostalAddress",
      ...(d.locality ? { addressLocality: d.locality } : {}),
      addressRegion: s.slug === "fct" ? "Federal Capital Territory" : `${s.name} State`,
      addressCountry: "NG",
    },
    containedInPlace: { "@type": "AdministrativeArea", name: s.slug === "fct" ? "Federal Capital Territory" : `${s.name} State` },
    sameAs: d.verification.sources.filter((x) => x.url.includes("unesco.org")).map((x) => x.url),
  };
}

export function itemListLd(name: string, items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, url: `${siteUrl()}${it.path}` })),
  };
}

export function articleLd(s: Story) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: s.title,
    description: s.dek,
    datePublished: s.published,
    dateModified: s.updated,
    inLanguage: site.lang,
    author: { "@type": "Organization", name: s.author, url: siteUrl() },
    publisher: { "@id": `${siteUrl()}/#organization` },
    mainEntityOfPage: `${siteUrl()}/stories/${s.slug}`,
    image: `${siteUrl()}/og/${plateKey(s.plate)}.png`,
  };
}
