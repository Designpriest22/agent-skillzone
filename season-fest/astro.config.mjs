// @ts-check
import { defineConfig } from 'astro/config';

// The official domain has not been confirmed. Set SITE_URL at build time
// (e.g. SITE_URL=https://seasonfest.example npm run build) to enable the
// canonical URL, absolute Open Graph image URLs and sitemap-style metadata.
const site = process.env.SITE_URL || undefined;

export default defineConfig({
  site,
  // Serve from a sub-path (e.g. /season-fest/) by setting BASE_PATH.
  base: process.env.BASE_PATH || '/',
  trailingSlash: 'ignore',
  build: {
    inlineStylesheets: 'always',
  },
  image: {
    // Generate modern formats only from the local, supplied artwork.
    remotePatterns: [],
  },
  devToolbar: { enabled: false },
});
