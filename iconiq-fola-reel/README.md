# Iconiq Fest: Cloud 9 × Fola, 25 s reel

A 25-second brutalist motion reel built from the flyer and three live clips. It's cut on a 120 bpm original score with the event's own crowd audio underneath. One timeline renders two formats:

- **Story:** 1080×1920 (9:16)
- **Feed:** 1080×1350 (4:5)

Layout is in `rem` (1rem = min(1vw, .75vh)) and `vh`, so the same scenes reflow for both.

| Time (s) | Scene |
|---|---|
| 0–2 | ICONIQ / FEST / Cloud 9 badge / CLOUD lockup. One slam per beat. |
| 2–5 | Pyro footage with the stamps THE NIGHT / ABUJA / GOES UP. |
| 5–6 | 3-2-1-GO strobe over the portrait |
| 6–9.5 | Hands-up footage, hand-drawn circle, "HANDS UP, ABUJA!", red ABUJA marquee |
| 9.5–11.5 | Headliner: portrait wipe, then the FOLA wordmark scratches on in steps with misregistration |
| 11.5–14 | ONE NIGHT. / ONE CITY. / ONE CLOUD 9. |
| 14–16 | 16TH DEC 2026 as the flyer's folded 3D box |
| 16–19 | Footage triptych with venue bands (Bali Recreational Park, Abuja) |
| 19–22 | GET YOUR TICKETS AT → typed ICONIQFEST.COM, marker underline, "link in bio" |
| 22–25 | End card: the flyer rebuilt and staggered in. It holds to the loop point. |

Humanised touches:
- handheld drift plus decaying camera kicks on every hit
- stepped (on-twos) wipes
- footage stutter
- 1-frame flash cuts
- marker scribbles
- slightly off-axis stamps
- film grain
- shaker timing jitter in the score

## Files

- `reel.html`: the timeline (`window.renderAt(t)`)
- `score.py`: the score and crowd mix, written to `out/mix.wav`
- `render.mjs`: `node render.mjs story|feed` renders `out/iconiq-fola-<fmt>.mp4`. Add times to render stills instead.
- `assets/`: flyer crops (wordmarks, badge, logos), fonts (Anton, Archivo Black, Space Mono, Permanent Marker; all OFL) and grain

Footage frames and audio (`clips/`) and the renders (`out/`) are git-ignored because they contain artist footage and this repository is public.

To rebuild them, run `bash clips.sh <folder with the three source clips>`, then `python3 score.py`, then `node render.mjs story` and `node render.mjs feed`.
