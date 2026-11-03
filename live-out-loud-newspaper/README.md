# The Live Out Loud Times: newspaper carousel

A 4-page vintage-newspaper Instagram carousel (1080 × 1350) selling Live Out Loud Music Festival: Wizkid, Sunday 13 December 2026, Eagle Square, Abuja, tickets at **wizkid.tix.africa**.

It was produced through Prohub's creative workflow. See `production/`: MD brief → copy → design → MD review.

## Outputs (`out/`)
- `page-1.png` … `page-4.png`: carousel slides
- `live-out-loud-times.pdf`: all four pages
- `live-out-loud-times.pptx`: PowerPoint, one 4:5 slide per page (2× resolution images), with each page's text in the speaker notes
- `contact-sheet.png`: overview

## Editing
- **Copy and layout:** `index.html`
- **Puzzle words, categories and secret message:** `tools/wordsearch.py`. Rerun it to regenerate `wordsearch.js`.
- **Assets:** `python3 tools/prep_assets.py <dir with the reference PDF's extracted images>`. This rebuilds the sponsor strip from the official flyer, the photos and the paper texture.

## Build
```
npm install
python3 tools/wordsearch.py
node build.mjs        # needs Playwright + Chromium
python3 tools/make_pptx.py   # PowerPoint export (pip install python-pptx)
```
