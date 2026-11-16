# Iconiq Fest: Cloud 9 × Fola, 25 s reel

A 25-second brutalist motion reel built from the flyer and three live clips. It's cut on a 120 bpm original score with the event's own crowd audio underneath. One timeline renders two formats:

- **Story:** 1080×1920 (9:16)
- **Feed:** 1080×1350 (4:5)

Layout is in `rem` (1rem = min(1vw, .75vh)) and `vh`, so the same scenes reflow for both.

| Time (s) | Scene |
|---|---|
| 0–2 | ICONIQ / FEST / Cloud 9 badge / CLOUD lockup. One slam per beat. |
| 2–5 | Pyro footage. Torn paper slips (THIS DECEMBER, / ICONIQ FEST / TAKES ABUJA.) are slapped on, then peeled off. |
| 5–6 | F-O-L-A: one cut-paper letter per eighth note over a photocopied portrait |
| 6–9.5 | Footage of the fist with a scribbled circle, an arrow and "FOLA", plus a torn red strip: FOLA LIVE ✦ CLOUD 9 ✦ ABUJA |
| 9.5–11.5 | Taped photocopy portrait, the FOLA wordmark scratched on, HEADLINING CLOUD 9 |
| 11.5–14 | LIVE AT / BALI / RECREATIONAL / PARK, / ABUJA, pasted word by word |
| 14–16 | 16TH DEC 2026 as the flyer's folded box in torn paper |
| 16–19 | Footage triptych with torn paper bands (date, headliner, venue) |
| 19–22 | GET YOUR TICKETS AT → typed ICONIQFEST.COM with a marker underline |
| 22–25 | End card: the flyer rebuilt as a paste-up. It holds to the loop point. |

## Look

- **Copy:** only event facts (who, what, where, when, tickets), no filler slogans.
- **No interface chrome:** no timecodes, labels, progress bar or glow.
- **Paper chips:** every chip has a torn edge generated per element, paper fibre texture and a hard cut-paper shadow. Photos and stamps are held down with tape.
- **Stop-motion:** paper moves at 12 fps. Each chip is slapped down (one oversized, twisted frame, then it lands) and keeps a slight boil.
- **Transitions:** torn-paper sheet wipes on four cuts, with the white paper core showing along the tear.
- **Light grunge:** a multiply paper pass over everything, three cycling grunge plates (specks, hairs, scratches), grain, and a photocopy treatment on the portrait.
- **Sound:** an original score written for FOLA's sound. It's warm Afro-R&B in E♭ major, the key his live set sits in on the source clips. Highlife guitar plucks (Karplus-Strong), a Rhodes Ebmaj9–Cm9–Abmaj9–Bb7sus4 progression, swung shaker, congas, talking drum and log drum. The beat drops out under the name. The live crowd audio comes only from clips in a compatible key. Paper slaps and tears are mixed in.

## Files

- `reel.html`: the timeline (`window.renderAt(t)`)
- `score.py`: the score and crowd mix, written to `out/mix.wav`
- `render.mjs`: `node render.mjs story|feed` renders `out/iconiq-fola-<fmt>.mp4`. Add times to render stills instead.
- `assets/`: flyer crops (wordmarks, badge, logos); fonts (Anton, Archivo Black, Permanent Marker, all OFL); and generated paper, tape, grunge and grain textures

Footage frames and audio (`clips/`) and the renders (`out/`) are git-ignored because they contain artist footage and this repository is public.

To rebuild them, run `bash clips.sh <folder with the three source clips>`, then `python3 score.py`, then `node render.mjs story` and `node render.mjs feed`.
