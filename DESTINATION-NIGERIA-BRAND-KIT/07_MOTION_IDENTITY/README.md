# 07 Motion identity

| | Animation | Duration | Deliverables |
|---|---|---|---|
| A | Primary cinematic logo reveal | 7.0 s | Dark and light MP4 (with the sonic logo), WebM, GIF; transparent lossless QuickTime (PNG codec) MOV and VP9-alpha WebM (reversed and full colour); final-frame PNG |
| B | Minimal digital reveal | 2.5 s | 16:9 light and dark, 1:1, 9:16 MP4 (with sting), WebM, GIF; alpha MOV (PNG codec) and WebM; **Lottie** |
| C | Presentation opener | 8.0 s | MP4 and WebM (bed plus sonic logo), GIF, final frame |
| D | Seamless brand loop | 20.0 s | 16:9 (clean and with logo), 9:16; perfect loop (every motion is periodic); silent |
| F | **Brand intro — illustrated motion graphics** (see `BRAND_INTRO_25s/README.md`) | 25.0 s | 16:9, 1:1, 4:5, 9:16 MP4 with synced soundtrack; 16:9 WebM; captions (SRT); end frames; storyboard |
| E | Symbol animation (Horizon Roundel) | 3.0 s | On ivory and on forest (with sting); alpha MOV (PNG codec) and WebM; **Lottie** |

All are 30 fps, H.264 High (yuv420p, BT.709), with a stable final frame and no flicker. Audio is AAC 256 kbps (MP4) or Opus (WebM).

**Sequence A:** 0–1.4 s a gold horizon glow widens · 1.0–2.9 s the landscape draws in line, then fills · 2.5–3.5 s the sun rises with a bloom (matching the sonic logo’s sun moment at 3.3 s) · 3.4–4.7 s the wordmark resolves with a soft wipe (no distortion) · 4.2–5.0 s NIGERIA settles · uniform 4.5% settle-scale across 0–6.2 s · 5.3–6.5 s the campaign line appears word by word, with gold dots · hold to 7.0 s.

## Sources and editing
`SOURCE_PROJECTS/` holds deterministic HTML/SVG compositions that use the exact logo geometry (`dn-logo-data.js`) and a shared runtime (`dn-motion.js`).
- Preview: open a composition with `?scrub&play`, e.g. `A_cinematic-logo-reveal.html?theme=light&scrub&play`.
- Retime: edit the `seg(t, start, end)` values in `renderAt()`.
- Render: `node render_motion.mjs [job-prefix]` (needs Playwright, Chromium and ffmpeg).

**Limitation:** no After Effects project is included, because After Effects isn’t available in this environment. For AE work, import the SVG masters from `02_LOGO_MASTER_FILES` (AE 2024+ imports SVG as shape layers) or the PDF/EPS, then follow the timing above. The alpha MOVs (lossless PNG codec, about 4 MB per second) drop straight into Premiere, Resolve, Final Cut and AE. For ProRes 4444, run the one-line ffmpeg command in `render_motion.mjs`. Lottie files (B, E) were verified in lottie-web 5.12.2 (`18_QA_AND_HANDOVER/lottie_test`).
