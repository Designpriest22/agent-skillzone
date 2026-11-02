# Week 01 Reels

| Reel | Style | Length | Formats | Storyboard | Final file(s) |
|---|---|---|---|---|---|
| Day 1: Cover your logo | Cinematic | 16.8 s | 9:16, 4:5 | `storyboards/reel-d1-cover-your-logo.json` | `06 Final Exports/Day 01 …/D1-R1_reel_cover-your-logo_*.mp4` |
| Day 3: We rebranded a suya spot that doesn't exist | Studio | 19.2 s | 9:16, 4:5 | `storyboards/reel-d3-ember-and-yaji.json` | `06 Final Exports/Day 03 …/D3-R1_*` |
| Day 5: Tell us the problem | Studio | 19.2 s | 9:16, 4:5 | `storyboards/reel-d5-problem-to-fix.json` | `06 Final Exports/Day 05 …/D5-R1_*` |
| Day 7: December is booked in November | Cinematic | 16.8 s | 9:16, 4:5 | `storyboards/reel-d7-december.json` | `06 Final Exports/Day 07 …/D7-R1_*` |

- **Renderer:** Prohub OS's own motion system (`prohub-os/src/video`): deterministic HTML scenes → headless Chromium frames → ffmpeg H.264. It runs offline via `prohub-os/scripts/render-offline.ts` (added for this campaign; no database needed).
- **Sound:** every cut, word slam, counter and logo reveal carries a spotted SFX from Prohub's kit, mixed under the music bed with sidechain ducking and normalised to about −14 LUFS. Cue sheets are in `renders/*_qc.json`.
- **Music bed:** `prohub-os/content/ads/prohub-launch/media/soundtrack.m4a` (from Prohub's own promo reel). **Rights must be confirmed before publishing.** On TikTok/Instagram you can also mute it and add a trending in-app sound.
- **Hooks:** text lands inside the first second. Every reel is readable on mute (≤ 3.5 words/s, measured) and ends on a CTA.
- **QC:** all 8 files pass 10/10 measured checks (resolution, duration, H.264/yuv420p, size, hook, readability, CTA ending, SFX cues, loudness, brand palette). See `renders/*_qc.json`.
- **Media:** `media/EY-board_*.jpg` are the Ember & Yaji boards (fictional brand). `media/work_*.jpg` are this campaign's own graphics, used as work samples in the Day 5 bento.
