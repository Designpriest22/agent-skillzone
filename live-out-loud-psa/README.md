# Live Out Loud: "PSA: How to pull up on Dec 13th"

A 32-second, 1080×1920, 30 fps ad built on a supplied clip (`assets/source.mov`).

| Time | What's on screen |
|---|---|
| 0–3.6 s | Title card over the dimmed, blurred clip: **PUBLIC SERVICE ANNOUNCEMENT (PSA)**, *Your guide on how to pull up to* **LIVE OUT LOUD** *on Dec 13th*, framed by hazard stripes |
| 4–18.4 s | The clip plays clean, with a small "⚠ PSA · HOW TO PULL UP · DEC 13TH" tag under the burned-in lyrics |
| 19 s → end | Event artwork: the original flyer over the blurred skyline footage, with "13 DEC 2026 · EAGLE SQUARE, ABUJA" and the **WIZKID.TIX.AFRICA** button |

The clip's own audio runs throughout. It is faded out over the last 0.6 s and normalised to −14 LUFS.

## Files
- `config.js`: all on-screen text, timings and the crop of the source clip
- `overlay.html`: the animated overlay, rendered with a transparent background. Opening it in a browser previews it over the clip.
- `render.mjs`: renders the overlay frames and composites them onto the cropped clip with ffmpeg

The source clip and rendered MP4 are git-ignored. This repository is public, and the clip contains a commercial recording and identifiable people.

## Build
```
node render.mjs   # -> out/live-out-loud-psa.mp4 + out/preview-*.jpg (needs Playwright + Chromium + ffmpeg)
```
