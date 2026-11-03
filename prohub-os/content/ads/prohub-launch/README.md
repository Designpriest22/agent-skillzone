# Prohub launch ad

| File | What |
|---|---|
| `spec.json` | **Main cut** — 30 s brand film in the `cinematic` style, beat-locked (100 BPM, beat 0.6 s) to the soundtrack, 9:16 / 1:1 / 16:9 |
| `spec-studio.json` | Alternate cut in the `studio` style (clean UI-motion, matching Prohub's earlier reel) |
| `media/soundtrack.m4a` | Audio track taken from Prohub's own promo reel |
| `media/*.jpg` | Event photography from this repository (`/assets/events`, `/assets/feed`), resized |

Produce: `npm run ad:produce -- content/ads/prohub-launch/spec.json --out out-ad` (full render through the Video
agent's `render_video` tool; deliverable + files land in the dashboard) or add `--stills 1.2,5,9.5` for quick frames.

Before publishing, confirm: (1) Prohub holds the rights to the soundtrack for paid/organic social use; (2) the event
photos may be shown as Prohub's work; (3) add a real handle, URL or WhatsApp number to the last scene's `contact`
if you want one on the end card — the system does not invent contact details.
