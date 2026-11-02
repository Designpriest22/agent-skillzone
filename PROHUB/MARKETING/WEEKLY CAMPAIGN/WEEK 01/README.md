# PROHUB / MARKETING / WEEKLY CAMPAIGN / WEEK 01 — "Make it obvious."

Seven-day social campaign for Prohub Creative Solutions · **Mon 9 – Sun 15 Nov 2026** · Abuja and Lagos first.
**Status:** produced and MD-approved · **not published**, waiting on owner approval → start with `08 Reports/campaign-report.md`.

| Folder | What's inside |
|---|---|
| `01 Research/` | Market, platform, trust, seasonal and competitor research with sources; 5 content opportunities; competitor audit template |
| `02 Content Strategy/` | Campaign idea, weekly arc, MD changes to the brief, platform roles, creative direction · lead-generation and conversion strategy (DM scripts, qualification, follow-ups, CRM mapping) |
| `03 Copywriting/` | Copy deck: headline, opening, main copy, commercial message, CTA, captions for Instagram, Facebook, LinkedIn and TikTok, Stories, alt text, hashtags, for all 7 days |
| `04 Graphics/` | Source code for every graphic (`build/`), Ember & Yaji brand boards (`boards/`), contact sheets (`previews/`) |
| `05 Videos/` | Round 2 reels: edit engine, four reel timelines, Sound Studio and four scores, sonic logo, QA reports, process/sound/licence docs (Round 1 in `archive-round-1/`) |
| `06 Final Exports/` | **Everything to publish**, one folder per day: PNGs (4:5, 1:1, 9:16), MP4 Reels (9:16 + 4:5), LinkedIn PDFs |
| `07 Publishing Calendar/` | Day / time (WAT) / platform / format / asset / caption / CTA / audience / objective, as `.md`, `.csv` and `.xlsx` |
| `08 Reports/` | MD report, WhatsApp summary, MD QC log, measurement framework, lead tracker, performance log |

## Asset naming
`D<day>-<nn>_<type>_<ratio>_<slug>` · e.g. `D2-04_carousel_4x5_leak-3.png`, `D7-R2_reel_december-is-booked_9x16.mp4` (R2 = Round 2 reels).
Carousel slides sort in posting order.

## Rebuild
```bash
# graphics (needs Playwright + Chromium; Node 20+)
cd "04 Graphics/build" && node build.mjs --sheets          # or: node build.mjs 3   (one day)
# reels (Round 2 engine + Sound Studio) — see 05 Videos/README.md
cd "05 Videos" && node engine/render.mjs reels/reel-d1-cover-your-logo.js --picture && python3 audio/score_d1.py build/D1-cover-your-logo.cues.json build/D1-cover-your-logo_mix.wav && engine/finish.sh D1-cover-your-logo "../06 Final Exports/Day 01 - Cover Your Logo" D1-R2_reel_cover-your-logo
```
