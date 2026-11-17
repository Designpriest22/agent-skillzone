# Live Out Loud × Wizkid: 25 s animated ad

A collage and photocopy style based on the two moodboards: torn paper, tape, halftone, condensed type and hand-drawn marker strokes that "boil" at 8 fps. The palette is LOL orange, ink and newsprint. 0–20 s is the ad and 20–25 s is the partners frame.

| Time (s) | Scene |
|---|---|
| 0–3 | WIZZEMBER / IN ABUJA, circled, with 13.12.2026 written in marker |
| 3–6 | BIG WIZ: halftone artist, a polaroid of the walk-out footage, "LIVE!" |
| 6–9 | Stop motion (10 fps): threshold cut-out of Wizkid's walk-out over a linocut sketch crowd. PULL UP WITH / THE LOUD GANG / & THE FC |
| 9–12 | THIS IS / LIVE / OUT / LOUD, with crowd photo inside the letters and the LOL logo |
| 12–15 | The drop: stage and pyro footage, 13 / DEC / 2026, torn Eagle Square strip |
| 15–17.5 | DEC 13 ESSENTIALS: power bank ✓, comfy shoes ✓, card only ✓, TICKET ? |
| 17.5–20 | LOL logo, date and venue strip, "get tickets" → WIZKID.TIX.AFRICA |
| 20–25 | In partnership with: 15 partner logos |

Formats (each laid out for its own canvas, nothing cropped):
- `story`: 1080×1920 (Stories, Reels, TikTok, Status)
- `feed`: 1080×1350
- `square`: 1080×1080
- `wide`: 1920×1080 (YouTube, X, screens)

Build: `python3 tools/prep.py && python3 tools/stopmo.py` (needs `pip install rembg onnxruntime`; frames from the C3 footage in `clips/src/`), then ` && python3 tools/score.py out/score.wav && node render.mjs <format>`, then mux with ffmpeg (see `mux.sh`).
Footage frames and every render are git-ignored (artist footage, public repo).

## Music
The ad runs on a bite from **Wizkid – "Manya" (feat. Mut4y)**, 0:34.94–0:59.94. The bite starts on the downbeat of the hook. The song moves in 4-bar phrases of 8.73 s at 110 BPM, and the hook block (34.94–52.41) is the most repeated and loudest part. It ends at 17.5 s, as the end card lands, and the calmer next section carries the end card and partners, with a 1.5 s fade-out. `tools/pick_bite.py` does the analysis.

```
ffmpeg -ss 34.94 -t 25 -i music/manya.mp3 -af "afade=t=in:d=0.02,afade=t=out:st=23.5:d=1.5,loudnorm=I=-14:TP=-1.0" -ar 48000 out/bite.wav
./mux.sh bite.wav      # or ./mux.sh score.wav for the original, cleared score
```
The song file is git-ignored. Paid placements need a sync licence for the recording; the original score versions are cleared.
