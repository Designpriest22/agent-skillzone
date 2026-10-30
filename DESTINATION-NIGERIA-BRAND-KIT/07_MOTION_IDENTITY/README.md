# 07 Motion identity (v2)

| | Piece | Duration | Deliverables |
|---|---|---|---|
| G | **Brand film** (`BRAND_FILM_25s/`) | 25 s | 16:9 (MP4 and WebM), 1:1, 4:5, 9:16 MP4; poster frames, storyboards, on-screen-text SRT; synced score |
| H | Logo reveal (`LOGO_ANIMATIONS/`) | 6.5 s | Light and dark 16:9 (MP4, WebM, GIF), 1:1, 9:16; alpha MOV (PNG codec) and VP9-alpha WebM, full colour and reversed. The sun lands on the sonic logo's bell at 3.3 s |
| I | Logo sting (`LOGO_ANIMATIONS/`) | 2.5 s | Light and dark 16:9, 9:16, alpha; **Lottie** in `LOTTIE/` (16:9, 9:16, 800 × 400; full colour and reversed) |
| J | Plate loop (`LOOPS/`) | 20 s | Seamless (first frame = last frame). Zuma Rock engraved tone-on-tone on Forest: 16:9, 16:9 with logo, 9:16. Silent, for screens |

**Principles.** Hard cuts on the downbeat, unhurried moves, one thing at a time. There are no blooms, rings, swooshes, particles or pop-in cards. The moves are the system's own: a horizon draws, a plate is engraved stroke by stroke, a plate becomes its photograph, the sun sets in place.

**Sources.** `SOURCE_PROJECTS/` holds:
- the HTML compositions `G_` to `J_`;
- `dn-v2.js` (shared helpers);
- `dn-film-data.js` (timeline and plate strokes, from `build/film.py`);
- `dn-logo-data.js` (exact logo paths);
- `render_motion.mjs`.

Preview any composition in a browser with `?t=seconds` or `?play`. To render, run `node render_motion.mjs [G_ H_ I_ J_]`. This needs Playwright and ffmpeg.

`ARCHIVE_v1/` holds the v1 illustrated intro (F) and the v1 compositions, for reference only.
