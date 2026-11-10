import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { services, sitePages } from "@/db/schema";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [svc, pages] = await Promise.all([db.select({ slug: services.slug, updatedAt: services.updatedAt }).from(services).where(eq(services.published, true)), db.select({ slug: sitePages.slug, updatedAt: sitePages.updatedAt }).from(sitePages).where(eq(sitePages.status, "published"))]);
  return [
    { url: `${env.appUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${env.appUrl}/contact`, priority: 0.8 },
    { url: `${env.appUrl}/work`, priority: 0.6 },
    ...svc.map((s) => ({ url: `${env.appUrl}/services/${s.slug}`, lastModified: s.updatedAt, priority: 0.8 })),
    ...pages.map((p) => ({ url: `${env.appUrl}/p/${p.slug}`, lastModified: p.updatedAt, priority: 0.7 })),
  ];
}
