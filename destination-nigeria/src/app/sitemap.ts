import type { MetadataRoute } from "next";
import { destinations } from "@/content/destinations";
import { experiences } from "@/content/experiences";
import { siteUrl } from "@/content/site";
import { stories } from "@/content/stories";
import { statesWithContent } from "@/lib/content";
import { plateKey } from "@/lib/plates";

const CONTENT_DATE = "2026-10-26";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const page = (path: string, priority = 0.6, lastModified = CONTENT_DATE, images?: string[]) => ({ url: `${base}${path}`, lastModified, priority, images });
  const plateUrl = (p: Parameters<typeof plateKey>[0]) => `${base}/og/${plateKey(p)}.png`;
  return [
    page("/", 1),
    page("/discover", 0.8),
    page("/destinations", 0.9),
    page("/states", 0.7),
    page("/experiences", 0.8),
    page("/plan", 0.8),
    page("/invest", 0.8),
    page("/national-tourism-week", 0.8),
    page("/stories", 0.7),
    page("/offers", 0.5),
    page("/partners", 0.6),
    page("/about", 0.5),
    page("/media", 0.3),
    page("/privacy", 0.2),
    page("/cookies", 0.2),
    page("/accessibility", 0.2),
    page("/terms", 0.2),
    ...destinations.map((d) => page(`/destinations/${d.slug}`, 0.8, d.verification.lastChecked, [plateUrl(d.plate)])),
    ...statesWithContent().map((s) => page(`/states/${s.slug}`, 0.6)),
    ...experiences.map((e) => page(`/experiences/${e.slug}`, 0.7, CONTENT_DATE, [plateUrl(e.plate)])),
    ...stories.map((s) => page(`/stories/${s.slug}`, 0.6, s.updated, [plateUrl(s.plate)])),
  ];
}
