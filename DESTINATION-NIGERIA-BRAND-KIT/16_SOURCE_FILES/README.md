# 16 Source files: the build system

The whole kit is generated from one source of truth: `build/brand.py`. It holds the colours, type scale and the **logo path data parsed from the supplied master SVG**. Change a value, run `build/build_all.sh`, and every logo, template, background, video and the guidelines update together.

| Script | Produces |
|---|---|
| `brand.py` | Tokens, logo geometry, colourways, roundel, SVG helpers |
| `gfx.py` | HarfBuzz-shaped outlined text, tapered horizon ribbons, contour fields, ridges, map projection |
| `logos.py` | 02 logo family (SVG, PDF, PNG; EPS via `pdftops`) |
| `tokens.py` | 03 specs, ASE/GPL/CSV/JSON palettes; 12 CSS/JSON tokens |
| `icons.py`, `graphics.py` | 04 icons, patterns, ribbons, maps, lockups, badges, avatars, watermarks; 06 placeholders |
| `backgrounds.py` | 05 background library |
| `sonic.py` | 08 sonic identity (synthesised) |
| `motion.py`, `intro.py`, `lottie.py` | 07 motion data, 25 s brand-intro timeline + soundtrack, Lottie; render with `07_MOTION_IDENTITY/SOURCE_PROJECTS/render_motion.mjs` |
| `docbase.py`, `documents.py`, `cards.py` | 09 Word/Excel templates, business cards, email signature, DOTX |
| `pptx_build.py` | 10 PowerPoint master and deck |
| `social.py` | 11 social templates (from `11_SOCIAL_MEDIA_TEMPLATES/content.json`) |
| `website.py` | 12 web assets and components |
| `events.py` | 13 event and signage |
| `mockups.py` | 15 mockups |
| `guidelines.py`, `mdpdf.py` | 14 guidelines, quick reference, PDF versions of the Markdown documents |
| `qa.py` | 18 automated QA report |
| `render.mjs` | Generic Chromium renderer (SVG/HTML → PNG/JPG/PDF) |

`data/` holds the Natural Earth boundaries (public domain) used for the maps.
