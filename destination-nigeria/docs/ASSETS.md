# Asset register and media workflow

Every asset shipped with the site is listed here with its source and licence. Update this file whenever an asset is added or replaced.

## Current assets

| Asset | Path | Source | Licence / permission | Attribution |
| --- | --- | --- | --- | --- |
| Logo (green) | `public/brand/destination-nigeria-logo.svg` | Supplied by the client | Client-owned | — |
| Logo (reverse) | `public/brand/destination-nigeria-logo-reverse.svg` | Supplied by the client | Client-owned | — |
| Logo ridge and sun paths | `src/components/logo-paths.ts` | Extracted verbatim from the supplied logo | Client-owned | — |
| Favicon | `src/app/icon.svg` | Original simplified mark in brand colours | Created for the project | — |
| Illustration plates (52) | Generated at `/plates/*.svg` by `src/lib/plates.ts` | Original procedural artwork created for this project | Created for the project; no third-party material | — |
| Social cards | Generated at `/og/*.png`, `/opengraph-image` | Plates plus official logo | As above | — |
| Welcome sound | `public/audio/welcome.ogg`, `welcome.mp3` | Synthesised by `scripts/build-sonic-logo.py` | Created for the project; no samples | — |
| State outlines | `src/content/geo/nigeria-states.json` | `@svg-maps/nigeria` 2.0.0 by Michael Chukwu (svg-maps project) | CC BY 4.0 | Required. Shown in the map legend, footer and terms |
| Fonts | via `next/font/local` from `@fontsource-variable/bodoni-moda`, `@fontsource-variable/instrument-sans`, `@fontsource/ibm-plex-mono` | Google Fonts families | SIL Open Font License 1.1 | Not required on page |

## Why the site uses illustrations instead of photographs

The brief asked for Magnific to source or generate imagery and footage. What happened when each route was tried during the build (26 October 2026):

- **Magnific image and video generation** was refused with "not enough credits", even though the account showed 12,575 credits. The error said this is a plan limit.
- **Magnific premium stock** (including the only Zuma Rock photographs found) is outside the current plan.
- **Magnific free stock** had no photographs verifiably taken at Nigerian destinations. Results for Nigerian places were mostly flags, unrelated locations or generic stock models.
- The Magnific image CDN and other photo hosts (Wikimedia, Unsplash, Pexels, Pixabay) were also blocked by this build environment's network policy, so files could not be downloaded.
- **Higgsfield** (also connected) has a zero credit balance.

Using generic African stock photographs labelled as named Nigerian destinations would break the brief's rule against misleading imagery. Instead, the site ships an original illustration system in the logo's visual language. Each plate depicts a landscape type (highland, inselberg, waterfall, earthen city and so on), never a specific named place. Each is tagged "Illustration", alt text describes the illustration, and the footer states that illustrations are not photographs of the places named.

## Adding licensed photography or film

The media slots are already built.

### Hero film

Edit `src/content/media.ts` and set `heroFilm`:

```ts
export const heroFilm: HeroFilm | null = {
  sources: [
    { src: "/media/hero/hero-1080.webm", type: "video/webm", media: "(min-width: 48rem)" },
    { src: "/media/hero/hero-1080.mp4", type: "video/mp4", media: "(min-width: 48rem)" },
    { src: "/media/hero/hero-720.mp4", type: "video/mp4" },
  ],
  poster: "/media/hero/poster.avif",
  captions: "/media/hero/descriptions.vtt",
  transcript: "Sunrise over the Obudu Plateau, then … (describe each shot and its location)",
  credits: [{ src: "...", type: "video/mp4", depicts: "Obudu Plateau, Cross River State", creator: "...", source: "...", licence: "...", attributionRequired: false, commercialUseConfirmed: true }],
};
```

The hero then plays the video muted and looped, with the same pause control, poster fallback and "Describe film" text alternative. Encoding targets: H.264 MP4 and VP9 WebM, 1080p at 4–6 Mbps and 720p at 2–3 Mbps for mobile, no audio track, 20–40s with cuts every 3–5s, and a poster frame as AVIF and JPEG.

### Destination photography

Add entries to `destinationPhotos` in `src/content/media.ts`, then render them in the destination template (`src/app/destinations/[slug]/page.tsx`) with `next/image` (AVIF and WebP, responsive `sizes`). Keep plates as the fallback.

### Approval checklist (every asset)

1. The location depicted is confirmed and matches the page it appears on.
2. The licence permits commercial use on a government or brand website, and any model or property releases are on file.
3. The creator, source URL, licence and attribution requirement are recorded in this file.
4. Faces of identifiable people in sacred or ceremonial contexts have consent appropriate to that community.
5. Meaningful alt text describes what is shown; decorative images use empty alt text.
6. Variants are exported for desktop (16:9 or 3:2) and mobile (4:5) crops; source files are not shipped to mobile.
