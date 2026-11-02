# Sound Design — Week 01 Round 2

Four films, four original scores, four sound worlds. One shared element: the Prohub sonic logo, re-orchestrated each time.

## The Prohub sonic logo
A three-note mnemonic: **G4 (pick-up) → C5 on the logo hit → E5 + G5 bloom**, with a bell overtone, an air sweep
into the hit and a soft sub thump. It rises a fourth and resolves to a major third: confident and open. Like the orange
swoosh, it's a distinctive brand asset, so it should appear at the end of every Prohub video but be **played on that
film's own instrument**:

| Film | Timbre |
|---|---|
| D1 Cover your logo | Marimba |
| D3 Ember & Yaji | Log drum |
| D5 Problem → fix | Grand piano (sampled) |
| D7 December | Brass |

Ready-to-use files: `audio/sonic-logo/prohub-sonic-logo_{marimba,log,piano,brass,kalimba,bell}.wav`. The sync point
is at 0.50 s: put that on the frame the logo lands.

## D1 · Cover your logo — afro-house, 120 BPM, A minor
- **Instruments:** afro kick, claps, off-beat hats, 16th shaker with accents, high/low congas, rims, syncopated sub
  bass, **sampled grand-piano stabs** (Am9 – Fmaj9 – Cmaj9 – G6/9 voicings), marimba hook, kalimba stutter intro.
- **Arrangement to picture:** kalimba stutter under the logo montage → full drop on "COVER" → music low-passed under
  the question so the words come first → riser + snare build → full groove with hook for the triptych → **tape stop
  on "Every post starts from zero"** (the bed slows to a halt; one low piano note in the silence) → slam back on
  MAKE IT OBVIOUS → Am9 ring-out under the marimba sonic logo.
- **Spotting (43 sounds):** mouse clicks pitched up per logo, deep impacts and a cinematic slam on each word, real
  tape rips for every strip, marker write/draw on annotations, pops on each word of the question, highlighter
  underline, colour/shape/voice swish-zoom-whoosh with impacts, card drops, odometer count-down and number land.
- **Measured:** −14.0 LUFS, LRA 4.1 LU. The trace shows the tape-stop silence at −46 dBFS between 13 and 14.5 s,
  exactly on the cue.

## D3 · Ember & Yaji — amapiano, 112.5 BPM, F minor
- **Instruments:** **log drums** (synthesized: pitched sine/triangle with glide, overdrive and wood click) playing the
  bassline, 808 kick on 1 and 3, swung 16th shakers, wooden rims, hats, **jazz piano chords** (sampled grand:
  Fm9 – Db∆9 – Eb6 – Cm7), warm pads, sub drone in the night section.
- **Arrangement to picture:** night intro (pads, piano, sub, ember crackle bed) → **hard drop-out** for the cold
  "before" (fluorescent buzz + glitch) → paper tear + fire whoosh as the flyer shreds → grill **sizzle** under the
  insight, kick enters on "So the brand should glow" → **neon ignition** buzz with flicker zaps and a log-drum roll into
  the montage → full amapiano groove, one camera move per board, each with its own sound (zoom, flip, whip, swish,
  spin) → filtered groove under the CTA → log-drum sonic logo.
- **Designed sounds:** match strike, fire whoosh, fluorescent hum, grill sizzle (fry bed + fat pops), neon buzz with
  flicker-synced zaps, ember crackle bed.
- **Measured:** −14.0 LUFS, LRA 7.4 LU. The intimate intro sits about 6–8 dB under the drop. That's deliberate, and was
  rebalanced after the first pass left it 18 dB under, too quiet for phone speakers.

## D5 · Problem → fix — UK garage 2-step, 128.57 BPM, G minor
- **Instruments:** 2-step kick pattern, snare + clap on 2 and 4 with ghost notes, **swung hats (58%)**, open hats,
  bouncing sub bass with glides, sampled piano + supersaw chord stabs (Gm9 – Eb∆9 – Cm9 – Dm7), pads.
- **Musical UI:** every incoming problem is a **notification ping tuned to the key** (G–Bb–C–D–F–G), so the inbox
  flood plays a melody instead of six random dings.
- **Arrangement to picture:** muffled groove under the flood → slam on "Sound familiar?" → full 2-step through the six
  transformations; each transition has its own sound (swipe, flip, glitch, whoosh, zoom, zip) plus a landing impact,
  and the three deliverables tick up on rising tone steps → riser + snare roll into the grid → breakdown for the typed
  CTA (keyboard, return key, send whoosh) → piano sonic logo.
- **Measured:** −14.0 LUFS, LRA 3.5 LU (an energetic, consistent bed, as the genre expects).

## D7 · December is booked — trailer → afrobeats, 100 BPM, D minor
- **Trailer half:** sub drone, low supersaw pad, **clock ticks** on the beat, slot-machine count-up, a **braam** (detuned saw
  stack with pitch drop) on the ₦396bn landing, toms building, **Shepard-tone rise** under "Customers decide fast",
  camera-shutter flashes, scribble and marker as November is crossed off, real paper rip, a breath of silence and a
  reverse whoosh into the drop.
- **Afrobeats half:** afro kick pattern, snare + clap, rims, shaker, conga slaps, syncopated sub, **sampled nylon-guitar
  highlife figure** over Dm7 – Bb∆7 – Gm7 – A7, brass stabs, a festival crowd wash, firework bursts (kit + designed
  boom-and-crackle), latch clicks on each flip-clock change, tone steps on the offer checklist, brass sonic logo.
- **Measured:** −14.0 LUFS, LRA 5.8 LU. The trace shows a −20 dB trailer half lifting to about −13 on the drop.

## Mix & master chain (all films)
`drums | bass | music | sfx | amb | logo buses` → bus HPF + compression → kick sidechain pump (genre) → SFX
envelope ducks the music bed (up to 4–5 dB) → reverb sends (music, SFX, logo) → master glue (−16 dB, 2:1) →
17.5 kHz low-pass → loudness to **−14 LUFS** → 4× oversampled look-ahead brick-wall at **−2.6 dBFS** → AAC 256k
(fast coder). Final true peak measured on the delivered MP4: **−2.2 to −2.5 dBTP**.
