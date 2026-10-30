# Brand film, 25 s (v2)

**Story.** An engraver's plate of Zuma Rock is cut stroke by stroke on a horizon line, and the sun sets in place. The plate becomes the photograph it was traced from: *Experience.* A second plate becomes Agbokim Waterfalls: *Invest.* Four real places arrive on the beat: *Explore.* Finally the logo's own drawing resolves on the horizon, and its sun lands on the final bell.

| File | Format |
|---|---|
| `DN_motion_G_brand-film-25s_16x9_1920x1080.mp4` / `.webm` | YouTube, web, presentations, screens |
| `DN_motion_G_brand-film-25s_1x1_1080x1080.mp4` | Feed (square) |
| `DN_motion_G_brand-film-25s_4x5_1080x1350.mp4` | Instagram and Facebook feed |
| `DN_motion_G_brand-film-25s_9x16_1080x1920.mp4` | Reels, Stories, TikTok, Shorts |
| `*_final-frame.png` | Poster frames |
| `DN_brand-film-25s_storyboard_16x9.jpg`, `_9x16.jpg` | Twelve frames from the rendered film |
| `DN_brand-film-25s_on-screen-text_en.srt` | On-screen text as captions (the film has no voice-over) |

**Specification.** 30 fps, H.264 (High, yuv420p, CRF 17, BT.709) with AAC 256 kbps, plus VP9/Opus WebM for 16:9. The soundtrack is `08_SONIC_IDENTITY/DN_sonic-brand-film_25s.wav`: original, fully synthesised, −16 LUFS.

**How it is made.** `SOURCE_PROJECTS/G_brand-film-25s.html` is the composition. `16_SOURCE_FILES/build/film.py` writes the shared timeline, the plate stroke data and the score, so every cut, word and the sun land on their musical cues. To re-render, run `node SOURCE_PROJECTS/render_motion.mjs G_`.

**Imagery.** All imagery is client-supplied photographs and plates traced from them. Confirm their licences before broadcast (see `06/SOURCE_RECORDS/image-register.csv`).

**Replaces.** This film replaces the v1 illustrated intro (F), which is archived in `ARCHIVE_v1/`.
