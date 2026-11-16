# Live Out Loud × Wizkid: 25 s animated ad

A collage and photocopy style based on the two moodboards: torn paper, tape, halftone, condensed type and hand-drawn marker strokes that "boil" at 8 fps. The palette is LOL orange, ink and newsprint. 0–20 s is the ad and 20–25 s is the partners frame.

| Time (s) | Scene |
|---|---|
| 0–3 | WIZZEMBER / IN ABUJA, circled, with 13.12.2026 written in marker |
| 3–6 | BIG WIZ: halftone artist, a polaroid of the walk-out footage, "LIVE!" |
| 6–9 | The newspaper pages drop in. SAVE *the* DATE, 13 DEC 2026, EAGLE SQUARE, ABUJA |
| 9–12 | THIS IS / LIVE / OUT / LOUD, with crowd photo inside the letters and the LOL logo |
| 12–15 | The drop: stage and pyro footage, 13 / DEC / 2026, torn Eagle Square strip |
| 15–17.5 | DEC 13 CHECKLIST: outfit ✓, squad ✓, ride ✓, TICKET ? |
| 17.5–20 | LOL logo, date and venue strip, "get tickets" → WIZKID.TIX.AFRICA |
| 20–25 | In partnership with: 15 partner logos |

Formats (each laid out for its own canvas, nothing cropped):
- `story`: 1080×1920 (Stories, Reels, TikTok, Status)
- `feed`: 1080×1350
- `square`: 1080×1080
- `wide`: 1920×1080 (YouTube, X, screens)

Build: `python3 tools/prep.py && python3 tools/score.py out/score.wav && node render.mjs <format>`, then mux with ffmpeg (see `mux.sh`).
Footage frames and every render are git-ignored (artist footage, public repo).
