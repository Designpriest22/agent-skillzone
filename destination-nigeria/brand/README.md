# Destination Nigeria: identity concepts and brand guide

Draft 1 for review. This folder holds four logo concepts for Destination Nigeria
(the national platform for tourism development, investment and destination
marketing, theme "Experience. Invest. Explore.") and a working brand guide.

Open `brand-guide.html` in a browser to see everything: the brief, the four
concepts with construction and size tests, a scored comparison, and the guide
(logo suite, clear space, misuse, colour, pattern, type, theme pillars,
architecture, voice, imagery, applications). A switcher in the guide shows any
of the four marks carried through the same system.

## The concepts

| # | Name | Idea |
|---|------|------|
| 01 | Confluence (recommended) | The Niger and the Benue meeting at Lokoja and running on side by side. |
| 02 | Ƙofa | A Kano city gate: battered mud wall, zanko pinnacles, the sun on the threshold. |
| 03 | Aso-oke | Narrow-band strips sewn into one cloth, lifting like a flag. |
| 04 | Nok | The eye of a Nok terracotta head under a crescent brow. |

Recommended route: 01 as the master mark, with the 37-strip cloth from 03 as
the supporting pattern (one strip per state plus the FCT).

## Files

```
logos/<nn-concept>/
  mark-*.svg, horizontal-*.svg, stacked-*.svg   outlined vector masters
    positive  full colour on light grounds
    reverse   full colour on Forest Night
    black     one colour, Forest Night
    white     one colour, Cotton
  horizontal-tagline-positive.svg               with "Experience. Invest. Explore."
  mark-small-positive.svg                       03 only: three-strip mark below 32 px
  png/                                          raster copies for slides and documents
brand-guide.html                                the guide, standalone
scripts/                                        the build (see below)
```

All type in the logo files is converted to outlines, so the files need no fonts.

## Palette

| Name | HEX | Use |
|------|-----|-----|
| Niger Green | #00754A | Main brand colour, text-safe on white |
| Forest Night | #0B2A1F | Text, dark grounds, reverse panels |
| Etu Indigo | #232C63 | Explore |
| Palm Gold | #F2A93B | Highlights only, never text on white |
| Laterite | #B4472A | Heritage and warmth, sparingly |
| Cotton | #FFFFFF | Main ground |

Flag Green (#008751) is kept for official contexts that require it.

## Type

Unbounded (display), Onest (text) and Martian Mono (data), all SIL OFL from
Google Fonts. Unbounded and Onest cover the full Hausa, Yoruba and Igbo
character sets (ɓ ɗ ƙ ẹ ọ ṣ ụ ị and tone marks). Martian Mono has no Hausa
hooked letters, so it is for figures and references only.

## Rebuilding

Every mark is drawn from geometry in `scripts/build_logos.py`, and the guide
page reuses that geometry, so the two cannot drift apart.

```sh
pip install fonttools uharfbuzz
sh scripts/fetch_fonts.sh /tmp/dn-fonts
python3 scripts/build_logos.py /tmp/dn-fonts logos
python3 scripts/build_guide.py /tmp/dn-fonts scripts/brand-guide.template.html brand-guide.html
node scripts/export_png.js logos   # needs Playwright
```

## Before adoption

- Test the concepts with audiences in all six geopolitical zones.
- Run a trademark search on the chosen mark.
- Concept 01 echoes the wavy band on the national coat of arms; clear this with
  the federal office responsible for national symbols.
- Proof the CMYK values on the chosen paper stock.
