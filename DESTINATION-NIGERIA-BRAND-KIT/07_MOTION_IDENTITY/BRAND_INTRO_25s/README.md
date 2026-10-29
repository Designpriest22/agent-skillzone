# Brand intro — 25 seconds (motion graphics)

An illustrated motion-graphics brand film built on the proposition **EXPERIENCE. INVEST. EXPLORE.**

| Time | Scene | What happens |
|---|---|---|
| 0–4.6 s | **Dawn** | Stars fade, the sun rises beside a granite inselberg (exfoliation sheets and water streaks), birds cross, mist drifts. *DESTINATION NIGERIA — Horizons, opened.* |
| 4.2–10.3 s | **EXPERIENCE.** | Sun-iris transition into a dusk festival: Hausa-style town with zanko pinnacles, string lights, a pot steaming on the fire, embers. A **dùndún drummer** (adire-pattern buba, fila, curved stick) strikes in time with the soundtrack while a **dancer** in gele, buba and wax-print iro waves an ipele scarf. |
| 9.7–15.9 s | **INVEST.** | Gold ribbon wipe to a waterfront: skyline with lagoon reflections, boats, a tower crane hoisting a beam onto a hotel under construction, a growth line drawn across the sky (no figures). A **professional** in gele and blazer gestures with her tablet. |
| 15.3–21.4 s | **EXPLORE.** | Sun-iris to a contour map; Nigeria’s outline (Natural Earth) draws, routes and pins (Lagos, Abuja, Kano, Calabar) pop in, then the camera dives into a landscape: waterfall, river, palms, an elephant, and a **traveller** walking with backpack and camera. |
| 21–25 s | **Logo** | Iris to Forest, rings radiate, the master logo resolves (landscape → sun at 23.3 s → wordmark → NIGERIA), campaign line, stable end frame. |

## Files
| Format | File | Use on |
|---|---|---|
| 16:9 · 1920×1080 | `DN_motion_F_brand-intro-25s_16x9_1920x1080.mp4` (+ `.webm`) | YouTube, LinkedIn, X, Facebook (landscape), website, presentations, event screens |
| 1:1 · 1080×1080 | `…_1x1_1080x1080.mp4` | Instagram & Facebook feed, LinkedIn feed, WhatsApp |
| 4:5 · 1080×1350 | `…_4x5_1080x1350.mp4` | Instagram & Facebook feed (most screen space in-feed) |
| 9:16 · 1080×1920 | `…_9x16_1080x1920.mp4` | Instagram Reels & Stories, TikTok, YouTube Shorts, Facebook Reels, WhatsApp Status |

All: H.264 High, yuv420p, 30 fps, 25.0 s, AAC 256 kbps 48 kHz stereo, −16 LUFS. `*_final-frame.png` = end card / cover. `DN_brand-intro-25s_captions_en.srt` = captions (on-screen text + sound cues) — upload alongside for accessibility. `DN_brand-intro-25s_storyboard.jpg` = contact sheet.
9:16 keeps all text and the logo inside the platform-safe zone (top ~14% and bottom ~20% free of key content).

## Soundtrack
`08_SONIC_IDENTITY/DN_sonic-brand-intro_25s.wav/.mp3` — original, synthesised (no samples): dawn pad and birdsong → 12/8 groove (bell pattern, shekere, low drum, bass) with the talking drum playing the drummer’s exact strikes → thumb-piano momentum for Invest → map-pin plucks for Explore → the sonic-logo motif landing its “sun” chord on the logo’s sun at 23.3 s.

## Editing
Source: `07_MOTION_IDENTITY/SOURCE_PROJECTS/F_brand-intro-25s.html` (+ `dn-illustration.js` characters & scenery, `dn-intro-data.js` timeline).
- Preview any format: open `F_brand-intro-25s.html?w=1080&h=1920&scrub&play` in Chrome.
- Change copy: edit the `Word(...)` lines; change timing: edit `T` in `16_SOURCE_FILES/build/intro.py`, run it (rebuilds timeline + soundtrack together), then `node render_motion.mjs F_brand-intro`.
- Characters are articulated (shoulder/elbow/hip/knee groups), so poses and gestures can be re-timed in their `update()` functions.

**Representation note.** Characters, clothing (adire, wax print, gele, fila), architecture and wildlife are respectful, generalised illustrations — not depictions of specific people or places. The skyline is generic. Review with the client and community partners before national broadcast.
