# All About R&B: concert screen loops

There are 10 screen animations for an All About R&B concert. Each one is a 15 s seamless loop timed to 96 BPM (24 beats), rendered at 16:9 (1920×1080) and 2:1 (2160×1080).

| # | Loop | Source | What happens |
|---|---|---|---|
| 01 | Heartbeat in the Clouds | Brief 1, logo hero | The heart logo beats lub-dub in a sunset sky while the camera flies through clouds. Shockwave rings land on the beat. |
| 02 | Radio Tuning | Brief 2 | A vintage car radio scans the dial and locks on 101.1 FM, All About R&B. Then SING. FEEL. CONNECT. |
| 03 | The Vinyl Reveal | Brief 3 | The record spins down and the label turns into the logo, landing upright. Then the record spins back up. |
| 04 | In Plain Sight: Home & Holiday | Brief 4 | A kitchen mug, a fridge magnet and a beach ball, joined by heart-iris wipes. |
| 05 | In Plain Sight: Out & About | Brief 4 | A padel-court tote, a gym bottle and a rear-view mirror sticker on an Abuja drive. |
| 06 | The Receipt | Brief 4 | A restaurant receipt of feelings prints out, totals PRICELESS and gets stamped PAID IN FULL. |
| 07 | Departures Board | Brief 4 | A split-flap board shows ABJ → R&B, then flips to ALL FLIGHTS ARE HEADED TO R&B. |
| 08 | Red Means R&B | Brief 4 | A Lagos traffic light with a danfo. The red lamp is a heart reading R&B. |
| 09 | Neon Signature | Logo hero | The signature logo writes on in neon. The heart beats, with a wet-floor reflection. |
| 10 | Phones Up | New idea | Crowd phone lights lift into a beating heart, a MAKE SOME NOISE meter fills, then a sing-along. |

The two further ideas, Text From Your Ex and The Dedication Mixtape, are described in `index.html`.

## Files
- `index.html`: live preview with a ratio toggle and scrubber (serve the folder over HTTP).
- `core.js`, `scenes-a.js`, `scenes-b.js`, `scenes-c.js`: the engine and scenes. Each scene is a pure function of time, drawn in a 1080-unit-tall space so it fills either ratio.
- `render.html`, `render.mjs`: the offline renderer (Playwright + ffmpeg).
- `assets/`: logo masks cut from the supplied artwork (`tools_logos.py`) and the font files.

## Render
```
node render.mjs video all both         # -> out/16x9/*.mp4, out/2x1/*.mp4
node render.mjs stills 3 2,7.5 2x1     # stills of scene 3 at 2 s and 7.5 s
```
The MP4s are H.264, 30 fps, 450 frames, with no audio. Frame 450 continues into frame 0, so set the player to loop.
