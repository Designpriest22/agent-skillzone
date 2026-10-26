# Destination Nigeria

**Experience. Invest. Explore.**

The website for Destination Nigeria, a proposed national tourism development, investment and destination-marketing platform. It brings travellers, investors, state authorities, tourism businesses, communities and creative partners together around the visitor journey.

Built with Next.js 16 (App Router, TypeScript), React 19 and Tailwind CSS 4. The whole site is statically generated except form submission, search results and the partnership page.

> Start with **[HANDOVER.md](./HANDOVER.md)**: what is built, what still needs configuring, and the known limitations.

## What's inside

| Area | Where |
| --- | --- |
| Home page, sections A–M | `src/app/page.tsx` |
| Destination explorer, details, states, experiences | `src/app/destinations`, `src/app/states`, `src/app/experiences` |
| Interactive state map | `src/components/NigeriaMap.tsx` + `src/content/geo/nigeria-states.json` |
| Trip shortlist and itinerary builder | `src/lib/shortlist.ts`, `src/components/ItineraryBuilder.tsx`, `src/app/plan` |
| Investment, partnerships, offers, National Tourism Week | `src/app/invest`, `src/app/partners`, `src/app/offers`, `src/app/national-tourism-week` |
| Journal (stories) | `src/app/stories`, `src/content/stories.ts` |
| Forms API (validation, spam guard, rate limit, delivery) | `src/app/api/forms/route.ts`, `src/lib/forms.ts`, `src/lib/delivery.ts` |
| Illustration plates (original artwork) | `src/lib/plates.ts`, served at `/plates/*.svg`, social cards at `/og/*.png` |
| Welcome sound | `scripts/build-sonic-logo.py` → `public/audio/welcome.{ogg,mp3}` |
| All content (structured, validated) | `src/content/*` |
| SEO plumbing | `src/lib/seo.ts`, `src/app/sitemap.ts`, `src/app/robots.ts`, `next.config.ts` |

## Local development

Requirements: Node.js 20.18 or newer. Python 3 with numpy and ffmpeg are needed only to regenerate the welcome sound.

```bash
cd destination-nigeria
npm install
cp .env.example .env.local      # then set NEXT_PUBLIC_SITE_URL=http://localhost:3000 and FORMS_FILE_STORE=1
npm run dev                     # http://localhost:3000
```

With `FORMS_FILE_STORE=1`, form submissions are written to `.data/submissions.jsonl`. Without any delivery configured, forms tell visitors that online submissions are not switched on yet; they never show a false success.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run check` | Lint, typecheck and unit tests |
| `npm test` | Unit tests (content integrity, search, filters, itinerary, forms API) |
| `npm run content:check` | Validate only the content files. Run after any content edit |
| `npm run test:e2e` | Browser tests (desktop and mobile, including axe accessibility scans). Run `npm run build` first |
| `npm run audio:build` | Regenerate the welcome sound from source |
| `npm run map:build` | Rebuild the state outlines and pin positions from `@svg-maps/nigeria` |
| `npm run export:html` | With the production server running (`EXPORT_FROM=http://localhost:3000`), write a single self-contained, offline HTML file of the home page to `export/destination-nigeria-home.html` |

## Standalone HTML export

`export/destination-nigeria-home.html` is a single file (about 2 MB) that opens in any modern browser with no server or network. It inlines styles, fonts, logo, illustrations and the welcome sound, and includes a small script for the welcome screen and sound, hero film, destination filters, shortlist, state map, search, menu and destination details. Links to other pages show a notice, and forms are disabled because they need the live server. Regenerate it with `npm run export:html` after content or design changes.

## Documentation

- [HANDOVER.md](./HANDOVER.md): delivery summary, dependencies, outstanding configuration, limitations
- [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md): production deployment, environment, security headers, Search Console
- [docs/CONTENT_GUIDE.md](./docs/CONTENT_GUIDE.md): content model, editing, verification and editorial workflow
- [docs/DESIGN_SYSTEM.md](./docs/DESIGN_SYSTEM.md): brand, tokens, type, components, motion, sound
- [docs/ASSETS.md](./docs/ASSETS.md): asset register, licences and how to add licensed photography or film
- [docs/SEO_STRATEGY.md](./docs/SEO_STRATEGY.md): keyword clusters, templates, structured data, content plan, measurement
- [docs/SEO_ROADMAP_90_DAYS.md](./docs/SEO_ROADMAP_90_DAYS.md): 90-day plan
- [docs/ANALYTICS.md](./docs/ANALYTICS.md): event specification and set-up
- [docs/ACCESSIBILITY_PERFORMANCE_AUDIT.md](./docs/ACCESSIBILITY_PERFORMANCE_AUDIT.md): test results and remaining risks
