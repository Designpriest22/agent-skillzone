# Prohub × Live Out Loud: case-study carousel

An 8-slide animated Instagram carousel (1080×1350, 4:5) that presents the Live Out Loud × Wizkid campaign as Prohub's work. It focuses on the creative output only.

| # | Slide | Shows |
|---|---|---|
| 1 | Cover | LOL logo, "Live Out Loud × Wizkid" |
| 2 | Every spot. Every screen. | The story animations (Typographic Explosion, Festival Countdown, Ultimate Announcement) playing in phones, plus the formats delivered |
| 3 | Story ads in two languages | The English and Hausa WhatsApp story ads, playing |
| 4 | The DEC 13 checklist | The kinetic-type spot, playing; mentions the PSA edits |
| 5 | How to get your ticket | The ticket-guide feed graphic |
| 6 | The Live Out Loud Times | The four newspaper pages fanning out |
| 7 | Official merch collection | Merch mockups |
| 8 | The campaign, delivered | 13 video spots · 81 platform exports · 4 newspaper pages · 24 merch mockups → "Your event, next." |

## Outputs (`out/`)
- `slide-1.mp4` … `slide-8.mp4`: 6 s each, with an original sound bed (`bed.py`). Post them as a mixed-media carousel.
- `slide-1.png` … `slide-8.png`: stills of each slide's final frame.

## Sources
- Clips: `live-out-loud-campaign`, `live-out-loud-hausa` and `live-out-loud-checklist` renders, plus the story animations from `lol-fest-wizkid-ads` (branch `claude/great-heisenberg-iqnbhy`).
- The "81 platform exports" count comes from that project's QC report (all PASS).
- Ticket guide: the "Wizkid Live Abuja — How to Buy Tickets" design canvas. The weekday is corrected to Sunday here.
- Prohub logo: `prohub-os/assets/brand/prohub/prohub-logo.svg`.

## Build
```
python3 bed.py && node render.mjs     # node render.mjs stills  -> PNGs only
```
