# Live Out Loud: "Yar Uwa, Kin Sayi Tikitin Wizkid?" (Hausa WhatsApp story)

The Hausa version of the WhatsApp campaign: 15 s, 1080×1920, 30 fps, H.264 + AAC.

- **Private chat:** Aisha (whose phone we see) and Zainab.
- **Group chat:** **ABJ YAN MATAN GARI**, 18 members.
- **Closing CTA:** "KI SAYI TICKET ƊINKI YANZU" plus **WIZKID.TIX.AFRICA**.

The WhatsApp interface (Today, online, typing…, members, "added") stays in English, like most phones in Abuja. Only the conversation is in Hausa, Pidgin and English.

## Outputs (`out/`)
- `live-out-loud-hausa-whatsapp-story.mp4`
- `preview-cover.jpg`, `preview-group.jpg`, `preview-final.jpg`
- `abj-yan-matan-gari-group-icon.png`: 1024 px, transparent background

## Editing
All messages, senders, timings, typing indicators, closing copy and the group name are in `config.js`. `"me"` sets whose phone it is.

Profile photos: put square images at the paths in `config.js` → `people`, e.g. `assets/avatars/aisha.jpg`. Anyone without a photo shows initials.

Hausa hooked letters (ɓ ɗ ƙ ƴ) render in Inter (chat) and in Montserrat/Oswald via their latin-ext font files.

## Build
```
pip install numpy scipy
python3 audio.py && node render.mjs     # needs Playwright + Chromium + ffmpeg
```
The soundtrack is an original synthesised instrumental with UI sounds. No Wizkid recordings are used.
