# Prohub Video & Sound Production Process

Adopted for Round 2 after the owner's brief: *"look up professional process to create videos and do sound design…
go crazy… the sound design has to be top notch… don't repeat the same background sound."*

## Where the process comes from
- **`ishuagrawal/video-by-reference`** (LLM SkillHub, MIT): a pipeline for code-generated video at a high quality bar.
  It covers a measured style bible, cue-sheet-first pre-production, deterministic frame rendering, motion-blur
  subframes, a synthesized frame-locked score, and measured QA. We adopted its method and adapted its `review.py`.
  Install for the team: `llmsh install ishuagrawal/video-by-reference@1.0.0`.
- **`hyperframes-animation`** (repo skill): single paused GSAP timeline, seek-safe, no randomness, and transform-only
  motion for determinism.
- **wyzowl SFX Kit `GUIDE.md`** (CC0): sound placement by sync point (*start = moment − sync.at*) and level matching.
- Industry practice on whooshes, risers, impacts and loudness:
  [Krotos: sound design in video editing](https://krotos.studio/blog/what-is-sound-design-in-video-editing),
  [IRPR: riser](https://sounddesign.irpr.agency/glossary/riser/), [IRPR: whoosh](https://sounddesign.irpr.agency/glossary/whoosh/),
  [IRPR: LUFS](https://sounddesign.irpr.agency/guides/what-is-lufs-loudness/).

## The pipeline (each step has a file)

1. **Brief → style bible.** One distinct visual language per film, written at the top of each `reels/*.js`, and
   checked against what Prohub has already published so we don't repeat ourselves.
2. **Tempo first.** BPM chosen so a beat is a whole number of frames at 30 fps (120 → 15, 112.5 → 16, 128.57 → 14,
   100 → 18). Cuts and hits land on frame boundaries.
3. **Cue sheet = single source of truth.** Every shot, transition, hit and sound is placed with `E.beat(n)` in one file.
   The picture pass writes `build/<film>.cues.json` (cues, sound spots, the music section map). The score reads that
   file, so picture and sound cannot drift.
4. **Pacing for comprehension.** Read time ≈ 0.3 s per word + 0.5 s. One idea at a time. Payoffs are held.
   Action can be fast; information cannot.
5. **Look-dev before render.** 12–16 stills per film into a contact sheet, MD critique, fix, repeat. Round 2 logged
   fixes for overflowing type, collapsed layout, a calendar grid missing 30 Nov, words losing colour when split, a
   letterbox hiding a headline, and an off-centre split screen.
6. **Picture.** Headless Chromium renders each frame from `seek(t)`. Frames are captured at 90 fps and folded to 30 fps
   (`tmix`) for **real motion blur**, with a forward shutter so hard cuts stay clean. The post pass (camera shake, punch-ins,
   flash frames, chromatic aberration, glitch, film grain, vignette) is computed from time, not keyframed by hand.
7. **Score.** An original composition per film in the right genre and key, arranged to the section map: drops on the
   hook, drop-outs for tension, a tape stop or silence before the payoff, a crash into the CTA.
8. **Sound design: spotting.** Every visible action gets a sound placed by its sync point. Layers are built from a
   transient (impact/click), a body (whoosh/tone) and a tail (reverb). Designed sounds (sizzle, neon, match, braam,
   firework, tick, tuned pings) are synthesized for the film.
9. **Mix.** Buses for drums, bass, music, SFX, ambience and logo. Bus EQ/compression, kick sidechain pump (genre),
   and SFX ducking the music bed so every hit reads. Room tone under "silence".
10. **Master.** Glue compression → 17.5 kHz low-pass → loudness to −14 LUFS → 4× oversampled look-ahead brick-wall at
    −2.6 dBFS → AAC 256k using the `fast` coder. Measured after encoding: true peak ≤ −2.2 dBTP. The default AAC coder
    overshot by 2.4 dB, which is why this setting exists.
11. **QA by measurement.** `engine/review.py` produces integrated loudness and true peak, an RMS trace every 0.5 s
    annotated with cue names (so we can see the drop land on "drop" and the silence sit on "zero"), a spectrogram
    (rumble and stuck tones), and a 1-fps contact sheet (every title on screen for at least 2 samples).
12. **Deliver.** 9:16 master plus a 4:5 crop. All story-critical content sits in the centre band (y 285–1635), so the
    crop never cuts it.

## Roles (Prohub agents)
Video Production Director (Segun) owns steps 2–6 and 12. Copywriting (Femi) owns on-screen lines and read-time.
Graphic Design (Ife) owns the style bibles, type and the Ember & Yaji boards. Sound is a new **Sound Design** function
inside Video Production, covering steps 7–11. The MD (Adaeze) reviews look-dev sheets and QA reports before sign-off.
