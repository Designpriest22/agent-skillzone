# LIVE OUT LOUD MUSIC FESTIVAL · WIZKID — advertising library

Three 20-second cinematic ads built on the supplied Wizkid footage, and five graphic-led story animations built from the completed flyer. Every spot is exported for every placement.

## Content rules (from the corrective brief)
- **Only approved copy appears on screen.** That means the brief's `LIVE OUT LOUD MUSIC FESTIVAL`, `WIZKID`, `DECEMBER 13, 2026` and `EAGLE SQUARE, ABUJA`, plus the flyer's own lines `LIVE`, `ABUJA`, `13 DEC`, `GET TICKETS AT` and `WIZKID.TIX.AFRICA`. The list is `APPROVED` in `lib.js`.
- The festival name is shown as the **official logo** wherever it is the hero. WIZKID is always the **official flyer wordmark**.
- **The final 5 seconds of every spot is a sponsor frame:** the 13 supplied logos on a plain charcoal backdrop, with no text, no festival logo and no event details.
- The cinematic ads use only the supplied footage. They never use the flyer photograph. The stories use only flyer elements and never use the footage.
- `node audit.mjs` checks all of this on every second frame of every spot and writes `out/content-audit.json`. A spot that fails is not exported.

## Spots
| Spot | Footage / source | Execution |
|---|---|---|
| C1 The Superstar Experience (20 s) | Smoke walk-on, backstage, arrival, walk-out, profile, aerial, stage | 2.39 letterbox, gold-noir grade, speed ramps. The festival title sits in the scope. The WIZKID wordmark is pinned to him with a motion-tracked marker. The date is set in the flyer's thin type. The venue is set over the aerial. The flyer's WIZKID / LIVE ABUJA lock-up lands over the pyro. |
| C2 The Festival Is Calling (20 s) | Same footage, cut on a 120 BPM grid | 13 / DEC on the beats. ABUJA filled with aerial footage before the camera flies through it. The logo lands on the drop. The venue stacks on the beats. DECEMBER / 13 / 2026 arrives one word per cut, then locks. The logo's chevrons track him. WIZKID echo stack. Zigzag wipes and an orange field reveal. |
| C3 The Big Wiz Moment (20 s) | Profile, walk-out, arrival, smoke walk-on, stage | Teal/amber grade. Three shutter flash-freezes, each revealing one fact: the logo, the date, the venue. Viewfinder brackets track him. The WIZKID wordmark sits behind his silhouette in the haze (luma matte), matching how the flyer layers it. |
| S1 Typographic Explosion (15 s) | Flyer type | LIVE stretches open and ABUJA lands. The flyer's type multiplies into a moving wall, which collapses into the logo. WIZKID assembles from sliding bands. The date drops in letter by letter and the venue types on. |
| S2 Festival Countdown (15 s) | Flyer elements | 4-3-2-1 with a ring timer. Each number hands over to one fact (logo, venue, date, WIZKID), then the full lock-up lands. |
| S3 Visual Experience (15 s) | Flyer aerial crowd + elements | A 2.5D camera flies through the flyer's information hung in depth over the crowd, then decelerates onto the logo. |
| S4 Wizkid Takeover (10 s) | Flyer wordmark, portrait, type | Light-swept vertical WIZKID with one short tear on the hit. The flyer is then rebuilt layer by layer in its own stacking order. |
| S5 Ultimate Announcement (15 s) | Flyer elements + aerial crowd | The logo assembles from its chevrons, then WIZKID / LIVE ABUJA, the zigzag rule, the 13 DEC / EAGLE SQUARE, ABUJA grid, and the flyer's ticket line in a glowing pill. |

All cinematic ads run 00:00–00:15 for the story and 00:15–00:20 for sponsors only. All stories end with 5 s of sponsors only.

## Formats
`ads.html?c=c1|c2|c3&f=…` and `stories.html?s=s1…s5`. Each is laid out for its own canvas; nothing is cropped from a master.

| key | size | use |
|---|---|---|
| `story` | 1080×1920 | IG/FB Stories (clear of the top bar and reply field) |
| `reels` | 1080×1920 | Reels + TikTok (clear of the caption, buttons and sound bar) |
| `feed` | 1080×1350 | IG/FB feed 4:5 |
| `square` | 1080×1080 | square social |
| `master` | 3840×2160 | 16:9 master (the 1920×1080 landscape is derived from it) |
| `bbL` / `bb4k` | 1920×1080 / 3840×2160 | billboard landscape: larger type, festival logo, date and venue held on screen |
| `bbP` | 1080×1920 | billboard portrait |

## Build
```
npm install                       # fonts
python3 prep.py IMG_1189.MP4      # footage -> footage/ (graded 2x frames, 50 fps interpolation, matte, track)
node audit.mjs                    # content review (must print ALL SPOTS PASS)
node render.mjs                   # every spot -> out/_work (soundtrack per spot via audio.py, -14 LUFS / -1 dBTP)
./package.sh                      # -> out/01 … out/07
node snap.mjs ads.html "c=c1&f=story" sheet.jpg 1 5 15   # review stills
```
Open `ads.html` or `stories.html` in a browser through any static server for a live preview, for example `npx serve`.

## Audio
`audio.py` synthesises every score and sound effect from scratch, timed to each spot's own cut list. No recordings or samples are used, so it is cleared for paid media.

## Footage and the public repository
This repository is public. The source clip, the prepared footage frames and every render that contains Wizkid footage are git-ignored and delivered privately. Only the code and the flyer-based story animations are committed.
