# Sound sources & licences — Week 01 Round 2

No commercial music library was used, and no track is reused between films. Everything is either **original to Prohub**
or **CC0 (public domain dedication: commercial use, no attribution required)**.

| Source | What we used | Licence | Where |
|---|---|---|---|
| **Prohub Sound Studio** (`audio/studio.py`, written for this campaign) | All four scores' drums, percussion, log drums, bass, mallets, pads, brass, braams, risers, Shepard tones, tape stops; designed FX (grill sizzle, match strike, fire whoosh, fluorescent buzz, neon ignition, firework crackle, clock tick, tuned notification pings); room tone; the **Prohub sonic logo** | Owned by Prohub (original synthesis) | Generated at render time |
| **Meta Open Sound** · [facebookincubator/meta-open-sound](https://github.com/facebookincubator/meta-open-sound) | Multi-sampled grand piano (stabs, chords, end chords, sonic-logo piano), nylon guitar (D7 highlife lines), paper tear (D3 shred, D7 calendar rip) | **CC0 1.0** (LICENSE in repo) | Cloned to `/home/user/facebookincubator/meta-open-sound` |
| **SFX Kit** · [wyzowl/sfx-kit](https://github.com/wyzowl/sfx-kit) | Whooshes, swishes, swipes, impacts, cinematic slams, booms, pops, flips, zooms, tape, marker/pen writing, keyboard typing, notifications, mechanical shutter and latch, data count-ups, fireworks, shimmers, tone steps | **CC0 1.0** (LICENSE in repo; "free for any use, commercial or not, no credit required") | Cloned to `/home/user/wyzowl/sfx-kit` |
| Fonts in the reels | Prohub kit (Montserrat, Inter, JetBrains Mono, Archivo Black, Anton); Permanent Marker (Apache 2.0); Space Grotesk (OFL 1.1) | As stated; licences in `engine/fonts/` and `prohub-os/assets/fonts/LICENSE.md` | `engine/fonts/` |
| GSAP 3.12.5 | Animation runtime | GreenSock standard licence (free, commercial use permitted) | `engine/vendor/` |

**Not used:** Freesound (licence is per file, often CC-BY/NC), Pixabay (its own licence, not CC0), BBC Sound Effects
(non-commercial), ZapSplat free tier (requires credit), and the Magnific/ElevenLabs AI SFX generator connected to
this workspace. That one is available, but it spends account credits, which is an owner decision. The promo-reel
soundtrack used in Round 1 is no longer used, so its rights question is closed for these films.

Full per-film lists of every placed sound (time, source, gain, rate) are in `audio/masters/*_mix.spotting.json`.
