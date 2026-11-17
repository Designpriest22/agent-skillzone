# Live Out Loud — "Girl, Have You Bought Your Wizkid Ticket?"

A 15-second, 1080×1920, 30 fps WhatsApp-conversation story ad. It is built as an editable HTML/JS composition and rendered to MP4.

## Deliverables (`out/`)
- `live-out-loud-whatsapp-story.mp4`: H.264 High + AAC 192k, exactly 15.000 s / 450 frames, loudness-normalised to −14 LUFS
- `preview-cover.jpg` (flyer moment), `preview-group.jpg`, `preview-final.jpg`
- `abj-babes-outside-group-icon.png`: 1024 px group profile picture with a transparent background

## Editing
| What | Where |
|---|---|
| Messages, senders, timestamps, timings (`at` in seconds), typing indicators, header status lines, reactions | `config.js` |
| Names, name colours, profile photo paths | `config.js` → `people` |
| Closing-frame copy, ticket URL | `config.js` → `closing`, `ticketUrl`, `ticketDisplay` |
| Scene transition timings | `config.js` → `scenes` |
| Look of the bubbles, header, closing frame | `index.html` (chat CSS is written in iPhone points, `u`) |
| Music / SFX | `audio.py` (sound cues follow the message timings in `config.js` automatically) |

Profile photos: drop square images at the paths in `config.js` (e.g. `assets/avatars/teni.jpg`). Any person without a file falls back to an initials avatar.

## Build
```
npm install            # fonts (Anton, Montserrat, Oswald) are already copied to assets/fonts
pip install numpy scipy
python3 audio.py       # -> out/audio.wav
node render.mjs        # -> out/*.mp4, previews, group icon  (needs Playwright + Chromium + ffmpeg)
node snap.mjs 4.6 12.3 # optional: render single frames to out/frames/ for review
```
Open `index.html` in a browser for a live, looping preview.

All music and sound effects are synthesised from scratch in `audio.py`. No Wizkid recordings or third-party samples are used.
