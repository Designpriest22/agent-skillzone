# OUTSIDE IN THE CITY — Launch Campaign Studio

**Abuja Lifestyle & Entertainment Concierge · Backed by The Capital Movement**

A self-contained branding system and five-part Instagram launch campaign, built
entirely in code (HTML5 / CSS3 / JavaScript / SVG). Every graphic is a live SVG
composition rendered at **1080 × 1350** (Instagram 4:5) and exported to
pixel-exact PNG. Typography is embedded, so exports match the on-screen preview
byte-for-byte and nothing depends on an external CDN or image host.

---

## Open the studio

Open **`index.html`** in a browser. No build step, no server required.

You can:
- Preview all five graphics and open each one.
- Edit every headline and body copy live.
- Replace any illustration with your own photograph (and set its focal point).
- Edit the five weekly destinations and the six services.
- Export each graphic as a 1080 × 1350 PNG, or all five as a ZIP.
- Export the logo (SVG + PNG) in four treatments and the wallpaper in four sizes.

---

## The campaign

| # | Title | Purpose |
|---|-------|---------|
| 01 | THE CITY HAS A NEW INSIDER. | Brand introduction |
| 02 | ABUJA, ACCORDING TO US. | Our map of the city (the district index) |
| 03 | NOT EVERYONE KNOWS WHERE TO GO. | The value proposition |
| 04 | THE OUTSIDE LIST | A weekly, editable five-place list |
| 05 | YOUR CITY. YOUR WAY. OUR CONNECTIONS. | The services + enquiry CTA |

### Art direction
- **Type:** sans-led / members-club — **Schibsted Grotesk** headlines, **Newsreader**
  italic as a sparing serif accent. The logo keeps its Didone wordmark (**Bodoni Moda**).
- **Imagery:** restrained + architectural. No stock-photo pastiche. Real Abuja
  landmarks are drawn as clean gold line-work — **Aso Rock**, the **National Mosque**
  (dome + four minarets), the **National Christian Centre** spire, and **CBD** towers —
  with generous negative space and controlled gold.
- **No repeated furniture.** Each tile is a pure message; the brand lives on the
  profile and in the logo/wallpaper assets, not as a header/footer bar on every tile.

### Grounded in the real city
Copy references the actual map of Abuja — **Maitama** (fine dining), **Wuse 2**
(nightlife), **Asokoro** (under Aso Rock), **Jabi** (the lake), and the **Central Area**
(the landmarks). No fictitious venue names are used.

> **Honesty note.** Graphic 04 (“The Outside List”) uses each district as an honest,
> verifiable place-name and flags every row **SELECTION PENDING**. Replace these with
> verified venue names, photographs and descriptions before publishing — the layout is
> built for weekly replacement without any redesign.

---

## Project structure

```
outside-in-the-city/
├─ index.html              Studio interface
├─ css/app.css             Studio UI styling
├─ js/
│  ├─ fonts.js             Embedded brand typefaces (base64 woff2)
│  ├─ data.js              Editable campaign data model (single source of truth)
│  ├─ illustrations.js     Abuja landmark system (Aso Rock, mosque, church, towers)
│  ├─ logo.js              Vector logo system + wallpapers
│  ├─ graphics.js          The five 1080×1350 graphic renderers
│  ├─ export.js            SVG→PNG, ZIP, logo/wallpaper export engine
│  ├─ editor.js            Live editing panel
│  └─ app.js               Studio bootstrap
├─ vendor/jszip.min.js     ZIP bundling (vendored, no CDN)
├─ assets/logo/            Logo + wallpaper SVG sources
└─ exports/               Ready-to-post deliverables (PNG + SVG)
   ├─ graphics/            OITC_g01…g05 — 1080×1350 PNG
   ├─ logo/               primary / white / black / symbol — SVG + PNG
   └─ wallpaper/          phone / desktop / square / post — SVG + PNG
```

## Logo system

| Variant | Use |
|---------|-----|
| Primary | Ivory + champagne gold, on dark backgrounds (transparent PNG) |
| White | Monochrome, on dark / photographic backgrounds |
| Black | Monochrome, on light backgrounds |
| Symbol | The location-pin mark alone (Abuja skyline inside) |

The wordmark is recreated as vector + type (not traced from the reference image).
Logo SVGs embed their fonts, so they render identically anywhere without the
typefaces installed. The **wallpaper** places the logo over the Abuja landmark
skyline in four sizes (phone 1080×1920, desktop 2560×1440, square 1080×1080,
post 1080×1350).

## Editing the weekly list (Graphic 04)

The five destinations live in `js/data.js` under `g04.destinations` and can be
edited in the studio panel. Each entry has a category, a name/district, a short
description, a landmark motif (or your own photo), and a `placeholder` flag.
Swap all five each week without touching the layout.

## Typography & licensing

- **Bodoni Moda**, **Schibsted Grotesk**, **Newsreader** — Google Fonts, SIL Open
  Font License 1.1. The latin subsets are embedded as base64 woff2 for portable,
  pixel-exact export.

## Exports

- Graphics: `OITC_g0x_n_1080x1350.png` — exactly 1080 × 1350.
- Logo: SVG (vector, font-embedded) + 2× PNG per variant.
- Wallpaper: SVG + PNG per size.
- `OUTSIDE_IN_THE_CITY_campaign.zip` bundles the full set.
