# Handover: 4 new video ads for LOL FEST × WIZKID

**Task for the new session:** create **4 different video ads** for the event.
- **One video per ad:** each ad uses a different supplied video, individually, and never mixes clips between ads.
- **Music:** cut each ad to a strong section of the song in its own video.
- **Ending:** every ad ends on the **sponsor logos**.
- **Look:** exciting and world class, with **bold typography** and **VFX**.

Repository: `Designpriest22/agent-skillzone`. Branch: `claude/great-heisenberg-iqnbhy`. Project folder: `lol-fest-wizkid-ads/`.

---

## 1. Upload these first (they are not in the repository)

The repository is public, so artist footage and music were never committed.

| Item | Why |
|---|---|
| **The 4 source videos** (one per ad) | Footage and song for each ad. Only one video (`IMG_1189.MP4`, 12.3 s, 720×720) was used before. |
| `Final (Baba Nla)` mp3 *(optional)* | A fallback score if a video's own audio is weak or has speech or crowd noise over the music |

Already in the repository:
- all 16 sponsor logos (`assets/logos/`);
- the LOL FEST logo and its layers (`assets/flyer/`);
- the WIZKID text logo (`assets/flyer/wizkid-wordmark.png`);
- the colour Wizkid portrait;
- the fonts.

## 2. Approved copy only (the client is strict about this)

Use these words and nothing else on screen:
- `LIVE OUT LOUD MUSIC FESTIVAL` (prefer the official LOL logo artwork)
- `WIZKID` (use the official text logo, `wizkid-wordmark.png`)
- `DECEMBER 13, 2026` · `13 DEC` · `EAGLE SQUARE, ABUJA` · `LIVE` · `ABUJA`
- `GET TICKETS AT` · `WIZKID.TIX.AFRICA`

No slogans or invented lines. No QR code (the ticket link could not be verified). The list lives in `lib.js` as `APPROVED`.

## 3. What each ad must contain

| Part | Content |
|---|---|
| Opening (0–2 s) | Straight into that ad's footage. No logo card and no slow fade. Motion and bold type from frame 1. |
| Body | Cuts on the beat of that video's song. Big kinetic WIZKID text logo. The LOL logo once early (do not repeat it mid-video). DECEMBER 13, 2026 and EAGLE SQUARE, ABUJA. VFX on hits (see 5). |
| Ticket moment | GET TICKETS AT + a **WIZKID.TIX.AFRICA** button, held at least 3 s, before the sponsor frame |
| **Final 4–5 s** | **The sponsor logos only, all 16** (list below). No other text. |

- **Length:** 15–20 s each.
- **Formats:** 1080×1920 (9:16), 1080×1350 (4:5) and 1080×1080 (1:1). Add 1920×1080 if asked.
- **9:16 safe zone:** keep type and logos out of the top 210 px, the bottom 470 px and the right 160 px.

## 4. Sponsor end frame rules (all 16 logos)

Order:
1. Hennessy
2. Heineken
3. Coca-Cola
4. Desperados
5. BEST
6. AXE
7. Lord's London Dry Gin
8. Transcorp Hotels
9. Vodi Group
10. United Nigeria Airlines
11. TRACE+
12. Square Meter Spaces
13. Nova Flair
14. Blue Poppy
15. The Beat 97.9 FM
16. Soundcity

Files: `assets/logos/01-…` to `16-…`.
- **Sizing:** give every logo **equal optical area** (not equal width). `endcard.js` has a row-packing solver built for 13 logos; extend it to 16.
- **No effects on any logo:** no drop shadows, glows, sheens or tints. Coca-Cola's brand rules forbid shadows, so apply the rule to all.
- **Coca-Cola:** use `03-coca-cola-whiteborder.png` on dark backgrounds and `03-coca-cola-noborder.png` on white.
- **Dark end frame:** most logos are white (Hennessy, AXE, TRACE+, BEST, Transcorp, Square Meter), so a dark frame suits them, with Blue Poppy in its cream version (`14-blue-poppy.png`). Two logos need care on dark:
  - **Soundcity:** its dark ribbon disappears, so give the frame a lighter plum area or a soft light behind it. Not a box.
  - **Vodi:** check that it reads.
- **On light backgrounds:** BEST is black on cream (tint the white file), and Blue Poppy uses `14-blue-poppy-teal.png`.
- **"POWERED BY":** this credit belonged only to the Coca-Cola-sponsored ad. Do not add it to an all-sponsor frame unless the client asks.

## 5. Creative direction: 4 different ads

Each ad gets its own look. Ideas to start from; present them in the preview:

1. **Type Slam:**
   - giant WIZKID text logo slams on the downbeats with camera shake and motion blur;
   - speed ramps into hits, and a freeze-frame with bold date type.
2. **Fire & Light:**
   - built around the pyro and stage lights: light leaks, anamorphic flares, sparks and embers rising;
   - gold film-burn cuts.
3. **Glitch Energy:**
   - RGB split, scan jitter and data-moshing on the beat;
   - strobe cuts, with bold condensed type stacked and offset.
4. **Cinematic Slow:**
   - slow-motion, 2.39 letterbox, deep grade and elegant tracked type;
   - one big crescendo hit before the tickets.

Things the client rejected (do **not** do these):
- background repeating patterns (texture rows, grids, hatching or engraving);
- the artist photo clipped into shapes (stars, circles, arches);
- borders or picture-mount frames around footage;
- logo-on-flat-colour openings;
- invented copy;
- AI-generated images of Wizkid.

## 6. Sound

1. Extract each video's audio with `ffmpeg -i video.mp4 -vn -ac 2 -ar 48000 audio.wav`.
2. Choose the most exciting part (hook or drop) and cut it **on a downbeat** to the ad length, with a short fade-out.
3. Cut on the beat: find the BPM and downbeat (the last song was 107.5 BPM). Lay cuts and type hits on beats.
4. Mix: normalise to **−14 LUFS integrated, −1 dBTP** (two-pass `loudnorm`). Check the encoded AAC true peak and trim if it goes over.
5. Optional SFX layer: `audio.py` has an `sfxOnly` mode for whooshes and hits under the song.
6. **Remind the client:** the music is a commercial recording, so sync or usage rights must be confirmed before paid placement.

## 7. Tools already in the repository (reuse them)

| File | Use |
|---|---|
| `prep.py` | Prepares a source video into denoised, upscaled frames (`footage/rt`, 50 fps `footage/slo`), a luma matte and a point track. **It writes to `footage/`; run it once per video into separate folders** (add an output-directory argument). |
| `lib.js` | Shared drawing: fonts, LOL logo layers, `text()`, `drawCover`, easing, `sweepImg`, `tinted()` (one-colour logo), `grain`, `vignette`, `APPROVED` |
| `sponsors_v3.html` | The latest ad engine, used as a reference for clip timing, masks, speed-ramp `keys`, beats, end frames, `ticketCTA()` and `flash()` |
| `render_v3.mjs` | Renders a page frame by frame in headless Chromium and pipes to ffmpeg (H.264 + AAC). Copy it for the new page. |
| `snap.mjs` | Contact sheets of chosen frames, for checking before rendering: `COLS=6 TW=300 node snap.mjs page.html "query" out.jpg 0.5 2 4 …` |
| `audit_v3.mjs`, `qc_v3.py` | Content audit (approved copy, logos present) and technical QC (duration, size, 25 fps, loudness). Adapt them. |
| `endcard.js` | The sponsor-frame solver with equal-area packing |

Environment: Chromium plus Playwright are preinstalled (`require('playwright')`), and ffmpeg is available. Serve pages through `serve.mjs`, because `file://` fetches are blocked.

## 8. How to work (what the client expects)

1. **Preview first.** Render contact sheets and one format of each ad, and get the client's **OK before rendering everything.** The client asks for this every time.
2. Then render all formats, run the audit and QC, and fix anything that fails.
3. **Package:** one folder per ad (9:16, 4:5 and 1:1 inside), a README and the QC report. Zip so each file is **under 380 MiB** (the chat file limit is 400 MiB).
4. Commit code only. Rendered videos, footage and music stay git-ignored. Push to the branch above.

## 9. Delivery checklist

- [ ] 4 ads, each from its own video and its own song section
- [ ] 3 formats each, exact durations, 25 fps, H.264 + AAC, −14 LUFS
- [ ] Approved copy only; WIZKID.TIX.AFRICA shown at least 3 s before the sponsor frame
- [ ] Final 4–5 s: all 16 sponsor logos only, equal optical area, no effects, correct logo versions
- [ ] No patterns, borders, shape-clipped portraits or invented text
- [ ] Previews approved, then the zips delivered with a README and the QC report
