# Handover report: Destination Nigeria website

Built 26 October 2026 from the supplied logo (two SVG versions) and the executive concept note.

## What has been delivered

A production-ready Next.js 16 / TypeScript site in `destination-nigeria/`:

| # | Deliverable | Status | Where |
| --- | --- | --- | --- |
| 1 | Responsive website | ✅ | `src/app` |
| 2 | Home page (sections A–M) and templates for destinations, states, experiences, investment, editorial, NTW, offers, partners and policies | ✅ | `src/app/*` |
| 3 | Official logo integration (unaltered, both versions; ridge motif from the logo's own paths) | ✅ | `public/brand`, `src/components/brand.tsx` |
| 4 | Documented design system | ✅ | `docs/DESIGN_SYSTEM.md` |
| 5 | Animations and interactions (CSS opening sequence, layered hero film, scroll reveals, micro-interactions, reduced-motion support) | ✅ | `globals.css`, `HeroFilm.tsx`, `RevealObserver.tsx` |
| 6 | Original welcome sound (synthesised, no samples) with opt-in playback and mute | ✅ | `public/audio`, `scripts/build-sonic-logo.py`, `sound.tsx`, `Welcome.tsx` |
| 7 | Asset library with attribution records | ✅ Illustrations, sound, map data and fonts. ⚠️ No licensed photography or film (see Limitations) | `docs/ASSETS.md`, `src/content/media.ts` |
| 8 | Destination search and filtering (URL-shareable) | ✅ | `DestinationExplorer.tsx`, `src/lib/filter.ts` |
| 9 | Interactive map: 36 states plus FCT, click, keyboard and finder | ✅ | `NigeriaMap.tsx` |
| 10 | Trip shortlist and itinerary builder (reorder, days, notes, text download, print/PDF, share link) | ✅ | `ItineraryBuilder.tsx` |
| 11 | Enquiry and newsletter forms (validated, spam-protected, rate-limited, honest outcomes) | ✅ Built. ⚠️ Delivery needs credentials | `api/forms`, `docs/DEPLOYMENT.md` |
| 12 | SEO implementation (metadata, canonical, sitemap, robots, OG images, JSON-LD, redirects, 404s) | ✅ | `src/lib/seo.ts` etc. |
| 13 | Keyword research and content cluster plan | ✅ Clusters and SERP analysis. ⚠️ Volumes need tool access | `docs/SEO_STRATEGY.md` |
| 14 | 90-day SEO roadmap | ✅ | `docs/SEO_ROADMAP_90_DAYS.md` |
| 15 | Analytics event specification (11 events, consent-gated) | ✅ | `docs/ANALYTICS.md` |
| 16 | Accessibility and performance audit | ✅ | `docs/ACCESSIBILITY_PERFORMANCE_AUDIT.md` |
| 17 | `.env.example` | ✅ | `.env.example` |
| 18 | Installation and local development | ✅ | `README.md` |
| 19 | Production deployment instructions | ✅ | `docs/DEPLOYMENT.md` |
| 20 | This handover report | ✅ | — |

**Content at launch:** 37 states (capital and zone), 31 destinations across all six zones (every entry sourced, all marked "awaiting state verification"), 6 experience themes, 7 original journal articles (marked "awaiting review"), the full National Tourism Week framework and 8-week campaign from the concept note, 8 investment pathways, and an opportunity framework.

**Quality checks passed on the final build:** ESLint, TypeScript, 28 unit tests, 44 browser tests (functional journeys on desktop and mobile, plus axe WCAG 2.2 AA scans of 17 pages), and Lighthouse (best practices and SEO 100 across tested pages, CLS 0).

## Honesty safeguards built in

- No invented partners, dates, venues, speakers, statistics, prices, investment figures, booking inventory, ratings or testimonials. Every empty state says plainly what is missing and how it will be filled.
- Every destination shows its sources, a last-checked date and its verification status, with links to official travel advice. Several governments currently advise against travel to parts of Nigeria; the site says so and links to the official sources rather than hard-coding advisory levels that change.
- Forms show success only when the server confirms delivery. With no delivery configured they say submissions are not switched on yet.
- Illustrations are labelled as illustrations and never presented as photographs of named places.
- Structured data includes only fields the content supports (no coordinates, hours, prices or ratings).

## External dependencies

| Dependency | Needed for | Status |
| --- | --- | --- |
| Hosting (Vercel or a Node server) | Running the site | Ready to deploy |
| Production domain | Canonical URLs, Search Console | **Needed** |
| Form delivery: a webhook/CRM, Resend or Brevo | Receiving enquiries and sign-ups | **Needs credentials** |
| Plausible (or equivalent) | Analytics | Optional; off until configured |
| Google Search Console, Bing Webmaster Tools | SEO monitoring | **Needs domain verification** |
| `@svg-maps/nigeria` (CC BY 4.0) | Map outlines | Bundled; attribution shown |
| Magnific / Higgsfield | Imagery, video, audio | **Blocked** (see Limitations) |

## Outstanding configuration (owner actions)

1. Set `NEXT_PUBLIC_SITE_URL` and deploy (`docs/DEPLOYMENT.md`).
2. Configure form delivery, then submit each form once to confirm receipt.
3. Complete the policy placeholders marked "To be confirmed by the platform owner" (data controller, contacts, retention, processors, governing law) in `/privacy`, `/terms` and `/accessibility`.
4. Add official contact details and verified social links in `src/content/platform.ts`.
5. Verify Search Console and submit the sitemap; optionally enable analytics.
6. Arrange editorial and subject review of the 7 stories and state verification of the 31 destinations (`docs/CONTENT_GUIDE.md`).
7. When available: National Tourism Week details, approved investment opportunities and the information pack, verified offers, confirmed partners (with logo permission), and licensed photography and footage.

## Known limitations

1. **No photography or footage.** Magnific image and video generation was refused for insufficient credits (despite a positive balance shown), premium stock is outside the plan, free stock had no verifiable Nigerian location imagery, and this build environment's network policy blocked the media CDNs. Higgsfield had no credits. The site uses an original, labelled illustration system instead, and the media slots are ready for licensed assets (`docs/ASSETS.md`).
2. **Welcome sound** is synthesised in code rather than produced in an audio tool (Magnific audio was blocked by the same credit issue). It is original and licence-free; a sound designer can replace `public/audio/welcome.*` with no code change.
3. **Keyword volumes** are not included because the SEO tool connectors failed to connect. Clusters are based on intent and SERP analysis and must be validated (`docs/SEO_STRATEGY.md` §1).
4. **Destination content is reference-level**, written from public sources and not yet verified by states or operators. Several destinations are in states covered by current "do not travel" advisories from some governments; the pages flag this and link to official advice.
5. **No CMS.** Content is edited in typed files with validation. A migration path is documented.
6. **Rate limiting is per server instance.** Use the hosting platform's firewall for multi-instance deployments.
7. **No multilingual versions.** English only, by design, until translation and review capacity exists.
8. **Screen-reader testing** with NVDA and VoiceOver is recommended; automated checks pass, but they are not a substitute.
