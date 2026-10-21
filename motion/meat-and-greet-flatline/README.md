# FLATLINE — Meat & Greet, Halloween BBQ Party (20 s showreel)

**Concept:** one blood-red heart-monitor line that never breaks. It spikes, chops itself into a grill,
sears the meat, writes every word, counts the money, burns — and dies back to a flatline, so the
loop starts again.

**Camera language — the rotisserie.** The flatline is the spit. The camera only ever turns on it,
always rolling the same way, landing on the beat with exponential ease-outs. Every scene passes
edge-on through the line before it opens into the next one; blur follows the turn.

| Bars | Time | Technique |
|---|---|---|
| 1–2 | 0–4 s | **Shape morphing** — ECG → grill grate → sear marks → BBQ sauce drip → coal → coal bed → partygoers (bar 1 is the hook) |
| 3–4 | 4–8 s | **2D → 3D** — silhouettes merge into the MEAT & GREET logo; FIRSTKLAZ MEATING slams in as flat chrome, then is ray-marched into extruded metal and turned edge-on |
| 5–6 | 8–12 s | **Kinetic type** — HALLOWEEN BBQ PARTY tears out of the line (variable width/weight, distressed blood ink); 31 OCTOBER \| 5 PM |
| 7–8 | 12–16 s | **Data / UI** — odometer drums count to ₦200,000 BEST COSTUME PRIZE, live ECG, crowd-heat bars; flips into an engraved banknote that burns |
| 9–11 | 16–20 s | **End title** — 2/4 inhale, last full bar (17–19 s): flames engulf, a combustion front burns through to the logo, GET YOUR TICKETS; the button folds back into the flatline (last frame = first frame) |

120 BPM, 40 beats, a kick on every beat, a riser into the last full bar, a hit on every scene change.

## Files

- `meat-and-greet-flatline.mp4` — the final film (1080×1350, 60 fps, H.264 + AAC).
- `flatline.html` — the whole piece in one file. `window.seek(t)` computes every pixel from time
  alone (no CSS animation, timers or carried state); `window.renderSoundtrack()` renders the score
  with an `OfflineAudioContext` and returns a WAV.
- `soundtrack.wav` — the rendered score.
- `tools/` — source and render pipeline:
  - `src.html` + `build.py` → `flatline.html` (embeds `glyphs.json` and `logo-4x.png`)
  - `extract_glyphs.py` — Archivo variable-font outlines (9 masters, kerning) via fontTools/HarfBuzz
  - `upscale_logo.py` — 4× logo upscale
  - `preview.mjs` — render stills (`node preview.mjs out beats`)
  - `render.mjs` — Playwright, 60 fps × 3 sub-frames → ffmpeg `tmix` motion blur → lossless segment
  - `audio.mjs` — renders `soundtrack.wav`

## Rebuild

```bash
cd tools
python3 build.py ../flatline.html
node audio.mjs ../soundtrack.wav
H=$(realpath ../flatline.html)
node render.mjs $H s0.mkv 0 400 & node render.mjs $H s1.mkv 400 800 & node render.mjs $H s2.mkv 800 1200 & wait
printf "file 's0.mkv'\nfile 's1.mkv'\nfile 's2.mkv'\n" > list.txt
ffmpeg -f concat -i list.txt -i ../soundtrack.wav -vf "scale=out_color_matrix=bt709,format=yuv420p" \
  -c:v libx264 -preset slow -crf 19 -tune film -c:a aac -b:a 320k -shortest -movflags +faststart ../meat-and-greet-flatline.mp4
```

Headless Chromium renders WebGL2 through SwiftShader (`--use-angle=swiftshader --enable-unsafe-swiftshader`).
