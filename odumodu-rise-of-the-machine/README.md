# ODUMODUBLVCK: Rise of the Machine, 40 s promo

Kalacious Entertainment presents ODUMODUBLVCK, **Rise of the Machine**, Dec. 20th, Abuja. Tickets: odumodublvck.myflextickets.com.

The idea is **"The crowd is the machine."** It takes the poster's cyborg artwork (red eye, okpu agu, chrome) and turns it into a brutalist, machine-themed edit built from the crowd's energy. The look is red, black and off-white: condensed Anton type in hard black and red blocks, JetBrains Mono HUD and terminal text, photocopy-threshold and red-duotone frame treatments, stop-motion stutter (8–15 fps steps with jitter), and a hit on every kick of the track (shake, zoom pulse and RGB split).

| Time (s) | Scene |
|---|---|
| 0–1.1 | Kalacious logo flickers on over black and "PRESENTS" types on. Boot HUD |
| 1.1–2.4 | Extreme close-up of the red eye, pulling back in stop-motion steps. "> MACHINE DETECTED / > TARGET: ABUJA" |
| 2.4–3.0 | ABUJA knockout (crowd footage inside the letters) |
| 3.0–5.7 | THIS DECEMBER, then ARE / YOU / READY? over crowd shots |
| 5.7–7.8 | Stop-motion collage: crowd photo-cards slam down, faster and faster. THE CROWD / IS THE / MACHINE |
| 7.8–8.9 | Strobe build: head art, crowd and black alternate on 3, then 2, then 1 frames. LOADING MACHINE 100% |
| **8.9** | **Drop:** white flash, then the ODUMODUBLVCK slam over the head art (red, then black on the next kick) |
| 9.6–19.9 | Crowd montage cut on the kicks: OKPU AGU ON. · ABUJA · LOUDER · 20.12 · SING IT BACK · HANDS UP · NO SEATS. · ONLY NOISE. · THE MACHINE RUNS ON YOU |
| 19.9–22.3 | Head art stop-motion, then the chrome RISE OF THE MACHINE title slam with scrolling tickers |
| 22.3–26.6 | ONE NIGHT · ONE CITY · LOUD / LOUDER / LOUDEST · ABUJA STAND UP |
| 26.6–28.7 | "CAM" grid: crowd cells reveal in stop-motion, with THE CROWD IS THE MACHINE |
| 28.7–33.3 | Performer close-ups, LIVE IN ABUJA, DEC. 20TH |
| 33.3–40 | End card: name, head art (stop-motion in, eye glow pulsing on the kicks), chrome title, DEC. 20TH ★ ABUJA, ticket URL, Kalacious logo and partner strip |

## Deliverables

| File | Size | Use |
|---|---|---|
| `ROTM_40s_9x16_1080x1920.mp4` | 1080×1920 | Reels, TikTok, Stories, Shorts, Status |
| `ROTM_40s_4x5_1080x1350.mp4` | 1080×1350 | Instagram and Facebook feed |
| `ROTM_40s_1x1_1080x1080.mp4` | 1080×1080 | Square feed and X |
| `ROTM_40s_16x9_1920x1080.mp4` | 1920×1080 | YouTube and TV (HD) |
| `ROTM_40s_16x9_3840x2160_4K.mp4` | 3840×2160 | YouTube 4K and TV / LED screens (UHD) |

All files are 30 fps, H.264 High at CRF 14 with AAC 320k, 48 kHz audio, loudness-normalised to -14 LUFS with a -1 dBTP ceiling. Each format has its own layout. In 16:9 the vertical phone footage runs as a triptych (centre panel in colour, neighbouring shots in black and white either side). The hero moments run full-bleed, and the end card uses a two-column layout.

## Footage rules
- The source is crowd footage from the supplied clip, cropped to the top 1080 px so the ABJ watermark never shows.
- Shots with event or brand signage are not used: THE PLUG, Capital Block Party and Mainland Block Party (src 2.3–3.3 s and 5.0–7.0 s), and the closing ABJ card (41.9 s onward). No Bet9ja branding appears in any shot that is used.

## Audio
The audio is the supplied clip's own track, from 3.0 s to 43.0 s. The track's intro carries the teaser, and its drop (src 11.88 s) lands at 8.88 s in the ad. On top of that is a synthesized SFX layer: eye "beeps", glitch bursts on the word slams, a noise riser into the drop, sub booms on the drop, the title and the end card. `tools/audio.py` builds the mix, and kick times came from low-band onset analysis.

## Build
```
# from this folder, with the supplied clip saved as ./src.mp4
mkdir -p fr out && ffmpeg -i src.mp4 -vf crop=720:1080:0:0 -q:v 2 fr/%05d.jpg
cd tools && python3 audio.py && cd ..
ffmpeg -i out/mix.wav -af loudnorm=I=-14:TP=-1.0:LRA=11 -ar 48000 out/mix_norm.wav
python3 tools/render.py 1080 1920 out/v_916.mp4      # also 1080 1350, 1080 1080, 1920 1080, 3840 2160
ffmpeg -i out/v_916.mp4 -i out/mix_norm.wav -c:v copy -c:a aac -b:a 320k -shortest -movflags +faststart out/ROTM_40s_9x16_1080x1920.mp4
```
Needs `pip install numpy opencv-python-headless pillow scipy`. The source footage, extracted frames and all renders are git-ignored.

## Notes for paid placement
- The music is the recording from the supplied clip. Check that the sync licence covers paid media.
- For broadcast TV, re-run the loudness pass at the station's spec (for example -23 LUFS for EBU R128 or -24 LKFS for ATSC A/85). The video does not need to change.
- Partner logos are cropped from the official poster.
