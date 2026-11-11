# LOL Festival 2026 — Brand Placement & Floor Plan

Partner pack for Eagle Square, Abuja (13 Dec 2026): site key plan with guest flow,
three zone plans and the 49 brand slot allocations.

- `out/LOL-Festival-2026-Brand-Placement-Plan.pdf` — 6-page A3 landscape document (cover, combined site plan, 3 zone plans, schedule) to send to brands
- `index.html` — web version (generated)
- `build.py` — source of truth: slot data and plan geometry (traced from `source/*.jpg`)
- `render_pdf.mjs` — renders the PDF with Playwright

Rebuild: `python3 build.py && NODE_PATH=$(npm root -g) node render_pdf.mjs`

To change a slot size or count, edit the `add(...)` calls in `build.py`.
