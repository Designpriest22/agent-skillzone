import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin",
          "/home",
          "/learn",
          "/speak",
          "/settings",
          "/vocabulary",
          "/review",
          "/progress",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
