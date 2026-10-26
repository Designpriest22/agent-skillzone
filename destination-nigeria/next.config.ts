import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Optional analytics origin, allowed only when configured (see docs/ANALYTICS.md).
const analyticsOrigin = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ? new URL(process.env.NEXT_PUBLIC_PLAUSIBLE_SRC ?? "https://plausible.io/js/script.js").origin : "";

// Next.js injects inline bootstrap scripts, so 'unsafe-inline' is required for
// scripts unless a nonce-based setup is added (see docs/DEPLOYMENT.md).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} ${analyticsOrigin}`.trim(),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "media-src 'self'",
  `connect-src 'self' ${analyticsOrigin}`.trim(),
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  devIndicators: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
          ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
        ],
      },
      {
        source: "/search",
        headers: [{ key: "X-Robots-Tag", value: "noindex, follow" }],
      },
      {
        source: "/audio/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
  async redirects() {
    // Friendly and legacy paths. Add campaign vanity URLs here (301s).
    return [
      { source: "/visit", destination: "/destinations", permanent: true },
      { source: "/explore", destination: "/destinations", permanent: true },
      { source: "/invest-in-tourism", destination: "/invest", permanent: true },
      { source: "/ntw", destination: "/national-tourism-week", permanent: true },
      { source: "/journal", destination: "/stories", permanent: true },
      { source: "/journal/:slug", destination: "/stories/:slug", permanent: true },
      { source: "/contact", destination: "/partners#enquiry", permanent: false },
    ];
  },
};

export default nextConfig;
