# 16 Source files: the build system (v2)

Everything is generated from `build/brand.py`: tokens, contacts, the photo library index and the **logo path data parsed from the supplied master SVG**. To rebuild the whole kit, run `build/build_all.sh`.

| Script | Produces |
|---|---|
| `brand.py` | Colours, type, contacts, photo index, logo geometry and colourways |
| `photo.py` | 06: graded photo library and image register, from the supplied originals |
| `engrave.py`, `plates.py` | 04: engraved plates (flow-following line engraving, aspect-preserving crops) |
| `v2.py` | Shared HTML artboard foundation (fonts, tokens, logo, plates, photos) |
| `logos.py`, `tokens.py`, `icons.py`, `graphics2.py` | 02 logos; 03 specs and palettes, 12 tokens; icons; proposition lockups |
| `backgrounds2.py` | 05: eight grounds |
| `social2.py` | 11: social (from `content.json`) |
| `pptx_build.py`, `pptx2.py` | 10: PowerPoint master and sample deck |
| `docbase.py`, `documents.py`, `cards.py` | 09: Word and Excel templates, cards, signatures, DOTX |
| `web2.py`, `events2.py`, `boards.py` | 12 web; 13 events; 15 presentation boards |
| `sonic.py`, `motion.py`, `film.py`, `lottie.py` | 08 sound; 07 motion data, film timeline and score, Lottie |
| `guidelines2.py`, `mdpdf.py` | 14 guidelines and quick reference; PDFs of the Markdown documents |
| `compare.py`, `qa2.py` | 18: before/after sheets and the QA report |
| `render.mjs` | Chromium renderer (SVG/HTML → PNG/JPG/PDF) |

`_archive_v1/` holds the retired v1 generators, for reference. `data/` holds Natural Earth boundaries (public domain).

**Dependencies:**
- Python 3 with numpy, scipy, pillow, opencv-python-headless, python-docx, python-pptx, openpyxl, fonttools, uharfbuzz, svgelements and markdown.
- Node with Playwright (Chromium).
- ffmpeg, LibreOffice and poppler-utils.
