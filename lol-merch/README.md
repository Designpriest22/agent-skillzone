# LOL FEST 2026: Official Merch Collection

A concept board and studio mockups for Live Out Loud Music Festival merchandise. The festival is headlined by Wizkid on Sunday 13 December 2026 at Eagle Square, Abuja.

**Concept, "Fixture: DEC 13":** the official LOL logo is worn like a club crest on the chest, and "DEC 13" like a squad number on the back.

## Outputs (`out/`)
- `LOL-FEST-2026-merch-board.png` / `.pdf`: the full concept board (2400 px wide)
- `mockups/`: 18 garment views plus 6 close-ups
  - Views are named `<tee|jersey|polo>-<onyx|chalk|ember>-<front|back>.png`
  - Close-ups are named `…-front-logo.png` and `…-back-number.png`

## How it's built
- `tools/cut_logo.py` cuts the logo from the official flyer. The original pixels are kept and only the background is removed. For production, use the festival's master logo file.
- `merch.js` contains everything that defines the garments:
  - the silhouettes, colourways and custom 1/3 numerals
  - the layered tackle-twill number treatment and the crest badge
  - the trims, fabric textures, lighting and print warp
- `view.html` renders one view. `render.mjs` renders them all, and `board.mjs` builds the board.

```
npm install
node render.mjs && node board.mjs     # needs Playwright + Chromium
```

To change a colourway, edit `CW` in `merch.js`. To move a print, edit the `crestFront` and `numBack` values on each garment in `G`.
