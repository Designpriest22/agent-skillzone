# Prohub × Cibus Musica — “Better Days Are Served”

Client pitch for **Cibus Musica | Abuja — Better Days** (Sat 05 December 2026), prepared by Prohub Creative Solutions on 02 November 2026.

## Deliverables

| Folder | Contents |
|---|---|
| `01_PROJECT_ANALYSIS/Project_Strategy_Report.pdf` | Audit of supplied materials, information gaps, benchmark, diagnosis, positioning, creative direction, marketing strategy, website recommendation, internal review log, MD final review, risks (15 pp, A4) |
| `02_PITCH_PRESENTATION/Prohub_Client_Pitch.pdf` | **The client-facing pitch deck** — 24 slides, 16:9 |
| `02_PITCH_PRESENTATION/Prohub_Client_Pitch.pptx` | Same deck as PowerPoint — full-slide images (pixel-identical, no font installs needed) with a talk track in the speaker notes, in 7 sections |
| `03_CREATIVE_DESIGNS/Main_Event_Flyer/` | Main key visual, 1080×1350 |
| `03_CREATIVE_DESIGNS/Alternative_Flyers/` | Alt A “Order Docket”, Alt B “2026 Owes You One” |
| `03_CREATIVE_DESIGNS/Social_Media_Posts/` | Artist (Now Serving), Experience (On the Menu), Engagement (Pick Your Plate), Proof (Ikom Got Served reel cover), Tickets (Place Your Order), Squad (Tag Your Table) — 4:5 and 1:1 |
| `03_CREATIVE_DESIGNS/Story_Designs/` | Countdown, Artist, Poll, Tickets — 1080×1920 |
| `04_SOCIAL_MEDIA_STRATEGY/Seven_Day_Content_Calendar.pdf` | 9–15 Nov launch week: all 11 fields per day incl. full captions (8 pp, A4 landscape) |
| `05_WEBSITE_CONCEPT/` | Desktop (full page, hero, tickets, experience) and mobile (full page, hero, tickets) renders |
| `06_PROJECT_DOCUMENTATION/Scope_and_Execution_Plan.pdf` | Modules A–F, timeline, workflow, responsibilities, client inputs, assumptions (5 pp) |
| `_source/` | **Editable sources** — every design, the deck, the documents and the landing page are HTML/CSS |

## Editing and re-rendering

All artwork is built in HTML/CSS (`_source/designs/*.html`, `_source/deck/pitch.html`, `_source/docs/*.html`, `_source/web/index.html`) on a shared system:

- `_source/css/campaign.css` — campaign tokens (colours, type, grain, stamp, receipt)
- `_source/js/components.js` — plate-record, fork/knife and stamp components
- `_source/js/calendar.js` — single source for the 7-day calendar (feeds deck, calendar PDF and report)
- `_source/fonts/` — Bricolage Grotesque, Instrument Serif, DM Mono, Inter Tight, JetBrains Mono (OFL)

Re-render (Node + Playwright, from `_source/`):

```bash
node render.js jobs_designs.json   # social + flyer PNGs
node render.js jobs_web.json       # website mockups
node render.js jobs_deck.json      # pitch PDF (uses JPEG copies in deck/assets/)
node render.js jobs_docs.json      # strategy report, calendar, scope PDFs
```

If you change a design, regenerate its JPEG in `_source/deck/assets/d/` before re-exporting the deck.

The landing page (`_source/web/index.html`) is a working responsive prototype — open it in a browser.

## Facts used and open items

Used only facts visible in the supplied materials: SoundBoi BME as headliner, 5 Dec 2026, Abuja, Cibus Musica × The Believers Music Concert, Powered by Patach Konglomerates, cibusmusica.com, “Music · Food · Games · Good Vibes”, Chop Life Edition (Ikom, 25 Oct 2026) and Calabar Edition (4 Apr 2026).

**Client to confirm:** venue and gate time, ticket tiers/prices/price-step dates (shown as “₦ —”), full line-up, ticketing provider, food vendors and sponsors, official handle (`@cibusmusica_` vs `@cibusmusica`) and URL (`.com` vs `.com.ng`), capacity and media budget, recap footage. Tier names (Regular / VIP / Tables) follow the Chop Life structure provisionally.

## Imagery note

The artist portrait is cut from the client’s own SoundBoi BME flyer and treated as a halftone duotone (the source is low-resolution — request a hi-res press photo for production). The Cibus Musica and Believers logos are cut from the supplied flyers; replace with vector masters when available. Concept photography (food, crowd, stage) was generated in the Higgsfield account during preparation but could not be downloaded into this workspace (the image CDN is blocked by the environment’s network policy); the designs are therefore type- and illustration-led, and the photography direction is specified in the report for production.

## Rebuilding the PowerPoint

From `_source/` (needs `pptxgenjs`: `npm install pptxgenjs`):

```bash
mkdir -p pptx/slides && node pptx/snaphi.js deck/pitch.html pptx/slides
node pptx/build_pptx.js ../02_PITCH_PRESENTATION/Prohub_Client_Pitch.pptx pptx/slides
```

Speaker notes live in `pptx/build_pptx.js`.
