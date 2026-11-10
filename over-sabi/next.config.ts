import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Content-Security-Policy. Next.js injects inline bootstrap scripts, so
// 'unsafe-inline' is required for scripts unless a nonce-based setup is added
// (see SECURITY_AND_PRIVACY.md). Media may come from blob: (learner recordings,
// synthesized tutor audio) and from the configured storage origin.
const storageOrigin = process.env.STORAGE_PUBLIC_ORIGIN ?? "";
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `media-src 'self' blob: data: ${storageOrigin}`.trim(),
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.paystack.com https://accounts.google.com",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // The dev-tools badge overlaps the mobile bottom navigation.
  devIndicators: false,
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          // Microphone only for our own origin, and only when the learner starts speaking.
          { key: "Permissions-Policy", value: "microphone=(self), camera=(), geolocation=()" },
        ],
      },
      {
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache" }],
      },
    ];
  },
};

export default nextConfig;
