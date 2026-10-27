# Meat & Greet — Halloween BBQ Party: print pack

Every item on the print checklist (37 items), designed from the event plan's palette, type and rules,
and built as print-ready PDFs (vector type, bleed + TrimBox/BleedBox, dielines for shaped items).

- **Deliverable:** `MeatAndGreet_Halloween_Print-Pack.zip`. Open `00_Proof-Book.pdf` first.
- **Source:** `src/`. `python3 src/build.py` renders every PDF, then `python3 src/package.py` builds the proof book, schedule and zip.
  Needs Python 3 (Pillow, numpy, scipy, pypdf), Node + Playwright Chromium, and poppler-utils.
- Prices, token costs, case-card count and run-of-show times are data at the top of `p_menus.py`, `p_access.py` and `p_decor_crew.py`.
  Change them and rebuild.
