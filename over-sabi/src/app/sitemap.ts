import type { MetadataRoute } from "next";
import { listLanguages } from "@/lib/content/repo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const pages = [
    "",
    "/how-it-works",
    "/languages",
    "/tutors",
    "/try",
    "/pricing",
    "/about",
    "/help",
    "/privacy",
    "/terms",
    "/brand",
  ];
  let langs: { code: string }[] = [];
  try {
    langs = await listLanguages();
  } catch {
    /* database unavailable at build time */
  }
  return [
    ...pages.map((p) => ({ url: `${base}${p}` })),
    ...langs.filter((l) => l.code !== "en").map((l) => ({ url: `${base}/languages/${l.code}` })),
  ];
}
