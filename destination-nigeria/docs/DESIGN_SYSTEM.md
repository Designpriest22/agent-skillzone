# Design system

## Brand foundation

The official logo is the primary asset and is used unaltered. Two versions are supplied:

- `public/brand/destination-nigeria-logo.svg` (forest green, for light backgrounds)
- `public/brand/destination-nigeria-logo-reverse.svg` (white, for dark backgrounds)

Both are the supplied artwork, copied byte-for-byte. Do not recolour, stretch, redraw or add effects.

**Signature motif: the ridge and the sun.** The logo's mountain line and gold sun recur across the site:

- The **ridge mark** (`RidgeMark` in `src/components/brand.tsx`) uses the logo's own mountain and sun paths, extracted verbatim into `logo-paths.ts`. It prefixes every section eyebrow and closes the footer.
- The **gold sun** is the single point of attention: the sun in every illustration plate, the selected state on the map, the active filter dot, the saved-to-trip dot and the scene progress tick.
- The **illustration plates** are layered ridge-line landscapes in the logo's palette (see `docs/ASSETS.md`).

Brand principles, from the brief: national in ambition, international in presentation, authentic in storytelling, culturally confident, visually adventurous, commercially credible, responsible with information, inclusive.

## Colour tokens (`src/app/globals.css`)

| Token | Hex | Role |
| --- | --- | --- |
| `--forest` | `#103428` | Primary brand surface (logo green) |
| `--forest-deep` | `#0a231b` | Hero, map and footer grounds |
| `--ridge` | `#2c5040` | Secondary green (logo mountain), labels |
| `--sun` | `#e8a432` | Logo sun. Primary actions, highlights. **Never text on light grounds** |
| `--sun-text` | `#8a5a08` | Accessible gold for text and pills on light grounds |
| `--ivory` | `#f6f2e8` | Default page ground |
| `--paper` | `#fcfaf5` | Cards, alternate sections |
| `--sage` / `--sage-soft` | `#b7c2ab` / `#e3e8da` | Secondary sections, tags |
| `--charcoal` | `#141a17` | Body text |
| `--ink-soft` | `#46504a` | Secondary text |
| `--adire` | `#27345c` | Accent from adire indigo resist-dye (Abeokuta). Newsletter band, textile motifs |
| `--laterite` | `#9c4a28` | Reserved accent (red earth) for data or illustration only |

Measured WCAG contrast: charcoal on ivory 15.8:1 · forest on ivory 12.2:1 · charcoal on sun 8.2:1 · sun on forest-deep 7.7:1 · sun-text on ivory 5.3:1 · ink-soft on ivory 7.5:1 · ivory on adire 10.9:1. Sun on ivory is 1.9:1, so it is used only for fills and large shapes.

Gradients appear only inside illustrations and as photographic scrims that protect text contrast.

## Typography

Fonts are self-hosted through `next/font/local`, so they are preloaded, use size-adjusted fallbacks (no layout shift) and need no third-party font requests. All are SIL Open Font License.

| Role | Face | Use |
| --- | --- | --- |
| Display | **Bodoni Moda** (variable, optical size) | Headlines. Italic for a single emphasised word |
| Body and UI | **Instrument Sans** (variable, width) | Text, navigation, forms, data |
| Utility | **IBM Plex Mono** 500 | Eyebrows, labels, metadata, scene captions |

Fluid scale: `--step--1` to `--step-6` (`clamp()`). Type classes are `.t-hero`, `.t-1`, `.t-2` and `.t-3`, combined with `.display`. (They are deliberately not `h-*`, which collides with Tailwind height utilities.)

## Space, shape, depth, motion

- Space: `--space-1` to `--space-9`, section padding `--section-y`, gutter `--gutter`, max width `--max` (82rem).
- Radii: `--r-sm` 6px, `--r-md` 14px, `--r-lg` 24px, `--r-pill`.
- Shadows: `--shadow-1`, `--shadow-2` (used sparingly).
- Motion: `--ease-out`, `--ease-in-out`; durations `--dur-1` 160ms to `--dur-4` 1200ms.

## Glass

`.glass` (dark, over imagery) and `.glass-light` are used only where the brief calls for them: the floating navigation, the hero discovery panel, map controls and panel, investment pathways and programme cards over forest grounds, the newsletter panel and the consent banner. There is a solid fallback when `backdrop-filter` is unsupported.

## Components

| Component | File | Notes |
| --- | --- | --- |
| Header, mobile menu | `Header.tsx` | Glass pill; `/` or Ctrl/⌘-K opens search |
| Search dialog | `SearchDialog.tsx` | Loads `/search-index.json` on first open |
| Hero film | `home/HeroFilm.tsx` | Video if licensed footage is configured, else illustrated scenes; pause, scene ticks, text description |
| Welcome | `Welcome.tsx` | First visit only; server-rendered for fast paint |
| Sound | `sound.tsx` | Preference store and toggle |
| Destination card and explorer | `DestinationCard.tsx`, `DestinationExplorer.tsx` | URL-synced filters |
| Map | `NigeriaMap.tsx` | Click, keyboard (roving tabindex) or finder |
| Itinerary builder | `ItineraryBuilder.tsx` | Reorder, days, notes, text export, print, share link |
| Forms | `forms/*` | Shared validation with the API |
| Page hero, breadcrumbs | `PageHero.tsx` | BreadcrumbList JSON-LD |
| Section building blocks | `sections.tsx` | Worlds, experience panels, planning tools, pathways, campaign timeline, story card |
| Consent and cookie preferences | `Consent.tsx`, `CookiePreferences.tsx` | Rendered only when analytics is configured |

## Motion principles

- **Opening:** the film fades in, then logo, eyebrow, headline, copy and actions enter in a short CSS stagger (about 1s in total). It is pure CSS, so text paints without waiting for JavaScript. After the welcome screen it replays once.
- **Hero film:** each scene holds for 7s with a slow push-in, layers drift for parallax, the sun breathes and water streams. It pauses when off-screen and when the tab is hidden.
- **Scroll:** one IntersectionObserver drives staggered card entrances, clip-path image reveals and word-by-word headline reveals. Nothing is pinned or scroll-jacked.
- **Micro-interactions:** buttons lift 1px, arrows nudge, card images scale 1.045, and chips and the shortlist dot fill with the sun colour.
- **Reduced motion:** all entrances, parallax and loops are disabled, and the film starts paused. Without JavaScript, all content is visible (hidden starting states apply only under `html.js`).

No animation library is used. CSS and native APIs keep JavaScript small.

## Sonic identity

`public/audio/welcome.ogg` (Opus) and `welcome.mp3`, about 70 KB, 4.4s. Three rising mallet notes trace the logo's ridge (A3, D4, E4 in D major pentatonic) and land on a bright A4/D5 "sun" chord over a warm D-major swell and a soft low pulse. It is fully synthesised (`scripts/build-sonic-logo.py`): no samples, and no imitation of a specific cultural instrument. It plays only on an explicit action, never on load or route change, and the preference is stored on the device only.
