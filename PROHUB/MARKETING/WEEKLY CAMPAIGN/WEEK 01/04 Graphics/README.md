# Week 01 Graphics

All graphics are **code-built** (HTML/CSS/SVG → Chromium → PNG at exact pixel sizes). Copy changes are a text edit and a re-render, not a redesign.

| Path | What |
|---|---|
| `build/brand.mjs` | Brand tokens: Prohub orange `#FD8D18`, ink `#0C0C0D`, paper `#F3EFE8`; fonts from `prohub-os/assets/fonts`; logo, monogram and **swoosh** pulled from `prohub-os/assets/brand/prohub/prohub-logo.svg` |
| `build/layout.mjs` | Shared frame: margins, mono meta lines, mark, grain |
| `build/day1.mjs` … `day7.mjs` | Every asset for each day |
| `build/emberyaji.mjs` | The fictional **Ember & Yaji** identity (symbol, wordmark, palette, packaging, menu, signage, social) |
| `build/build.mjs` | Renderer: `node build.mjs [days…] [--sheets]` |
| `boards/ember-and-yaji/` | 7 identity boards at 1080×1080 |
| `previews/` | Contact sheets per day, for review |

## Sizes produced
- Instagram/Facebook portrait **1080×1350**: all carousels and feed statics
- Square **1080×1080**: LinkedIn/Facebook singles (D1-02, D4-07, D5-09, D6-02, D7-03)
- Story **1080×1920**: 2–4 frames per day, with clear space left for in-app stickers (poll, quiz, question, countdown, link)

## Brand notes
- Uses Prohub's existing logo, colour and font kit. No new identity was invented.
- A **dark-ink version** of the logo/mark is used on cream and orange grounds (the master is white on dark). This needs owner confirmation.
- Typography (Montserrat / Inter / JetBrains Mono / Archivo Black) follows what Prohub OS and the launch reel already use. If Prohub has official brand fonts, swap them in `brand.mjs` and re-render.
