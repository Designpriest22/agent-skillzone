# Week 01 Reels — Round 2

Round 1 (made with the Prohub OS templates) was rejected by the owner: the edit style repeated earlier Prohub videos,
and every reel shared one background track. Round 2 was rebuilt from scratch: **four distinct edit styles, four
original scores, a designed sound world per film, and one shared sonic logo.** Round 1 is kept in `archive-round-1/`.

| Day | Reel | Edit style (style bible) | Score | Length | Files (06 Final Exports) |
|---|---|---|---|---|---|
| 1 | Cover your logo. | **Cut & Tape**: warm paper, stop-motion boil at 12 fps, tape slaps on the beat, marker annotations, odometer gag, colour/shape/voice triptych | Afro-house, 120 BPM, A minor: sampled grand-piano stabs, marimba hook, congas, tape stop into silence | 19.0 s | `D1-R2_reel_cover-your-logo_9x16.mp4` / `_4x5.mp4` |
| 3 | We rebranded a suya spot that doesn't exist. | **Ember**: charcoal night, deterministic ember particles, heat haze, cold fluorescent "before" shredded into embers, neon ignition, log-drum-cut montage with five different camera moves | Amapiano, 112.5 BPM, F minor: log drums, jazz piano (sampled), swung shakers, grill sizzle, match strike, neon buzz | 20.8 s | `D3-R2_reel_ember-and-yaji_*` |
| 5 | Tell us the problem. We'll tell you the fix. | **Inbox**: DM thread floods with owners' problems; each bubble transforms with a different transition (swipe, flip, glitch, slide, zoom-through, split); grid; typed-and-sent CTA | UK-garage 2-step, 128.57 BPM, G minor: swung hats, sub bass, piano + supersaw stabs; notification pings tuned to the key | 22.9 s | `D5-R2_reel_problem-to-fix_*` |
| 7 | December is booked in November. | **Festival Trailer**: letterboxed open, slot-machine ₦396bn, anamorphic flare, November crossed off and ripped away, letterbox snaps open on the drop, fireworks, flip-clock countdown | Trailer → afrobeats, 100 BPM, D minor: braam, ticking clock, Shepard rise, tom build, then nylon-guitar highlife lines (sampled), brass stabs, crowd | 18.6 s | `D7-R2_reel_december-is-booked_*` |

**Sonic logo:** every film ends on Prohub's mnemonic (G4 → C5 on the logo hit → E5 + G5 bloom), played on a different instrument
each time: marimba (D1), log drum (D3), piano (D5), brass (D7). The signature stays consistent while the sound is never
repeated. Stems are in `audio/sonic-logo/` for future videos.

**Measured delivery (all four):** 1080×1920 and 1080×1350, 30 fps, H.264 High/yuv420p, AAC 256k. Integrated loudness
**−14.0 LUFS**, true peak **≤ −2.2 dBTP** after encoding. Reports are in `qa/`.

## Folders
| Path | What |
|---|---|
| `reels/` | The four edits: one deterministic GSAP timeline each, cue sheet and sound spotting in the same file |
| `engine/` | Prohub Reel Engine: `runtime.js` (camera, shake, punch, flash, chromatic aberration, glitch, grain, particles), `render.mjs` (page builder + 3× sub-frame motion-blur renderer), `finish.sh` (mux, 4:5 crop, QA), `review.py` (loudness trace + spectrogram + contact sheets) |
| `audio/` | Prohub Sound Studio: `studio.py` (instruments, designed FX, mixer, mastering) and `score_d*.py` (one score per film) · `sonic-logo/` · `masters/` (final WAV mixes + spotting logs) |
| `media/` | Images used in the reels (Ember & Yaji boards, campaign graphics) |
| `qa/` | Per-reel QA: loudness report annotated with cues, spectrogram, 1-fps contact sheet |
| `PRODUCTION-PROCESS.md` | The professional pipeline we now follow |
| `SOUND-DESIGN.md` | Score and sound-design notes per film, mix chain, measurements |
| `SOUND-LICENCES.md` | Every sound source and its licence |

## Rebuild
```bash
cd "05 Videos"
node engine/render.mjs reels/reel-d3-ember-and-yaji.js --stills 1,5,9      # look-dev frames
node engine/render.mjs reels/reel-d3-ember-and-yaji.js --picture --sub 3    # picture (writes build/*.cues.json)
python3 audio/score_d3.py build/D3-ember-and-yaji.cues.json build/D3-ember-and-yaji_mix.wav   # score + SFX + master
engine/finish.sh D3-ember-and-yaji "../06 Final Exports/Day 03 - Ember and Yaji Showcase" D3-R2_reel_ember-and-yaji
```
Requires Node 20+, Playwright Chromium, ffmpeg, Python 3 with numpy, scipy, pedalboard and pyloudnorm, plus the two
CC0 libraries cloned at `/home/user/wyzowl/sfx-kit` and `/home/user/facebookincubator/meta-open-sound` (paths in `audio/studio.py`).
