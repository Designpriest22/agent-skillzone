# Accessibility and performance audit

Audit date: 26 October 2026, on the production build (`next build` + `next start`), Chromium 1243 (Playwright 1.63) and Lighthouse 12.

## Summary

| Area | Result |
| --- | --- |
| Automated accessibility (axe-core, WCAG 2.0/2.1/2.2 A and AA) | **0 violations on 17 pages** (`e2e/a11y.spec.ts`) |
| Lighthouse accessibility | 100 on every page tested (after fixing the `/states` heading order found in this audit) |
| Lighthouse SEO | 100 on every page tested |
| Lighthouse best practices | 100 on every page tested |
| Lighthouse performance, desktop | 99–100 |
| Lighthouse performance, mobile (simulated slow 4G, 4× CPU) | 89–95 on interior pages; 72 on the home page (see note) |
| Cumulative Layout Shift | 0 on every page tested |
| Browser journeys (desktop and mobile) | 27 functional tests pass |
| Unit tests | 28 pass |

## Lighthouse results

| Page | Device | Perf | A11y | Best pr. | SEO | LCP | CLS | TBT |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | mobile | 72 | 100 | 100 | 100 | 4.6 s* | 0 | 440 ms |
| `/` | desktop | 99 | 100 | 100 | 100 | 1.0 s | 0 | 0 ms |
| `/destinations` | mobile | 90 | 100 | 100 | 100 | 3.3 s | 0 | 160 ms |
| `/destinations` | desktop | 100 | 100 | 100 | 100 | 0.7 s | 0 | 0 ms |
| `/destinations/obudu-mountain-resort` | mobile | 94 | 100 | 100 | 100 | 2.9 s | 0 | 140 ms |
| `/destinations/obudu-mountain-resort` | desktop | 100 | 100 | 100 | 100 | 0.6 s | 0 | 10 ms |
| `/states` | mobile | 92 | 100† | 100 | 100 | 3.3 s | 0 | 90 ms |
| `/states` | desktop | 100 | 100† | 100 | 100 | 0.7 s | 0 | 0 ms |
| `/plan` | mobile | 90 | 100 | 100 | 100 | 3.3 s | 0 | 170 ms |
| `/plan` | desktop | 100 | 100 | 100 | 100 | 0.8 s | 0 | 0 ms |
| `/invest` | mobile | 95 | 100 | 100 | 100 | 2.9 s | 0 | 80 ms |
| `/invest` | desktop | 100 | 100 | 100 | 100 | 0.8 s | 0 | 0 ms |
| `/national-tourism-week` | mobile | 90 | 100 | 100 | 100 | 3.6 s | 0 | 80 ms |
| `/national-tourism-week` | desktop | 100 | 100 | 100 | 100 | 0.7 s | 0 | 0 ms |
| `/stories/nigerias-highlands` | mobile | 89 | 100 | 100 | 100 | 3.5 s | 0 | 160 ms |
| `/stories/nigerias-highlands` | desktop | 100 | 100 | 100 | 100 | 0.8 s | 0 | 10 ms |

† Measured at 99 because of a heading-order issue (the map panel `h3` had no preceding `h2`). Fixed after this run by adding a section heading.

\* **Home page mobile LCP.** Lighthouse's simulated model attributes main-thread hydration work (the hero film, map and explorer are interactive on the home page) to the LCP. Measured directly in Chromium with 4× CPU and slow-4G throttling, the real LCP is **2.3 s on a first visit** (with the welcome screen) and **2.0 s for returning visitors** (the hero headline). Both are within the 2.5 s "good" threshold. Field data (Chrome UX Report / Search Console Core Web Vitals) should be monitored after launch.

## Fixes made during this audit

| Finding | Fix |
| --- | --- |
| Mobile menu and search dialog could not be clicked (inside a `pointer-events: none` header) | Restored pointer events on header dialogs; found by the mobile e2e test |
| Hero controls overlapped the search panel on phones | Controls move into the normal flow below 768px; guarded by a mobile test |
| `.h-2` type classes collided with Tailwind height utilities and collapsed headings | Renamed the type scale to `.t-*` |
| `aria-controls` pointed at lists that were not rendered (axe critical) | Set only when the list exists |
| CSP violation from Zod's runtime JIT probe (`Function("")`) | Zod set to `jitless` |
| Layout shift on `/plan` (0.25) and `/destinations` (0.16) | Fonts moved to `next/font` with metric-adjusted fallbacks; explorer and itinerary no longer use Suspense fallbacks |
| Hero text waited for JavaScript before appearing | Opening sequence is pure CSS; the welcome is server-rendered |
| Low-contrast muted text in the welcome dialog | Dialog uses on-dark text tokens |
| Share link used the configured origin instead of the visitor's | Uses `window.location.origin` |

## WCAG 2.2 AA conformance notes (manual review)

- **Perceivable:** text alternatives describe illustrations as illustrations; decorative plates use `alt=""`. The hero film has a "Describe film" text alternative and a pause control. Contrast is measured for every token pair (see `DESIGN_SYSTEM.md`). Information is never conveyed by colour alone: selected filters show a dot plus a pressed state, the selected map state uses a fill plus `aria-pressed`, and errors have text plus an icon.
- **Operable:** everything works by keyboard. The map uses roving tabindex (arrow keys, Home/End, Enter), with a text finder as an alternative. There is a skip link, visible 3px focus rings, no keyboard traps (native `<dialog>` handles Escape), and targets of at least 40px. Motion is pausable and reduced automatically with `prefers-reduced-motion`. No content flashes.
- **Understandable:** `lang="en-NG"`; forms have visible labels, hints and specific error messages, focus the first invalid field, and show outcome messages that say exactly what happened ("Not sent…" / "Enquiry sent").
- **Robust:** semantic landmarks, native controls, live regions for result counts and map selection, and valid ARIA (axe-clean).

**Not machine-testable; recommended before launch:** a screen-reader pass with NVDA + Firefox and VoiceOver + Safari (iOS) on the home page, map, itinerary and forms; 200% and 400% zoom checks; and a usability session with keyboard-only and low-vision users.

## Performance architecture

- About 195 statically generated routes; only form submission, `/search` and `/partners` run per request.
- Original illustrations are vector SVG (7–33 KB each) with no raster images to resize. Hero scenes after the first are fetched just before they play.
- Fonts are self-hosted and preloaded with metric-matched fallbacks (CLS 0). No third-party requests by default.
- No animation library: CSS animations and a single IntersectionObserver.
- The welcome sound (about 70 KB) loads only after the visitor turns sound on.
- Analytics loads only after consent, and only if configured.

**Next steps when licensed media arrives:** serve photos through `next/image` (AVIF/WebP, responsive `sizes`), preload only the hero poster, keep hero video under about 3 MB for mobile with a 720p source, and lazy-load everything below the fold.
