# Live Out Loud — "Dec 13 Checklist" (kinetic typography)

A second creative direction for the Live Out Loud × Wizkid ticket push: a 15 s, 1080×1920, 30 fps kinetic-typography spot cut to a 120 bpm beat. It has no faces and no phone UI.

**Story (in beats; 1 beat = 0.5 s)**
| Beats | Time | What happens |
|---|---|---|
| 0–4 | 0–2 s | Hook: "ABUJA, / ARE YOU / OUTSIDE?" slams in word by word |
| 4–12 | 2–6 s | DEC 13 CHECKLIST: Outfit ✓, Lashes ✓, The Girls ✓, The Ride ✓, ticked on the beat |
| 12–15 | 6–7.5 s | "WIZKID TICKET ☐". The music cuts, the empty box blinks, "STILL PENDING 👀" |
| 15–18 | 7.5–9 s | "GIRL." stamp, then "BIG WIZ / IS COMING / TO ABUJA" over a snare roll |
| 18–24 | 9–12 s | Drop: the original flyer slams in. Top and bottom bands swap on the beat: LIVE OUT LOUD, 13.12.2026, MUSIC FESTIVAL, EAGLE SQUARE, BIG WIZ · LIVE, ABUJA |
| 24–30 | 12–15 s | End card: "WIZKID TICKET ✓" finally ticks. Flyer, 13 DECEMBER 2026 · EAGLE SQUARE, ABUJA, and a **WIZKID.TIX.AFRICA** call-to-action button |

## Files
- `out/live-out-loud-dec13-checklist.mp4`: H.264 + AAC, exactly 15.000 s / 450 frames, −14 LUFS
- `out/preview-checklist.jpg`, `out/preview-drop.jpg`, `out/preview-final.jpg`
- `config.js`: all copy and beat timings (checklist items, callouts, band words, end card)
- `index.html`: the composition (open in a browser for a live preview)
- `audio.py`: the original synthesised soundtrack. It reads the same beat map, so moving a beat in `config.js` moves its sound too.

## Build
```
pip install numpy scipy
python3 audio.py && node render.mjs    # needs Playwright + Chromium + ffmpeg
node snap.mjs 3.2 9.5 14.9             # optional single-frame previews -> out/frames/
```
