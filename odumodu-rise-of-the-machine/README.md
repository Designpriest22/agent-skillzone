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

All files are 30 fps, H.264 High (CRF 18, capped at 20 Mbps for the social sizes, 25 Mbps for 1080p and 60 Mbps for 4K) with AAC 320k, 48 kHz audio, loudness-normalised to -14 LUFS with a -1 dBTP ceiling. Each format has its own layout. In 16:9 the vertical phone footage runs as a triptych (centre panel in colour, neighbouring shots in black and white either side). The hero moments run full-bleed, and the end card uses a two-column layout.

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

---

# Coca-Cola × Rise of the Machine: 20 s sponsor spot and flyers

Date on all Coca-Cola assets: **DEC. 18TH** (18.12).

A "Powered by Coca-Cola" cut (the supplied logo is used as-is, with POWERED BY set above it) that applies Coca-Cola's design language to the event system. It uses the logo red (sampled at `#EA1F25`), white space, the dynamic white ribbon and rising fizz bubbles. The event system supplies Anton block type (with Coca-Cola inversion: red type in white boxes), the cyborg key art, stop-motion steps and the crowd footage. Treatments are recoloured to a red-to-white Coca-Cola duotone, the 16:9 triptych gutters are Coca-Cola red, and a "POWERED BY" + logo badge sits bottom-centre through the clips. Only Coca-Cola and the organiser (Kalacious) appear. No other partner logos are shown.

| Time (s) | Scene |
|---|---|
| 0–2.6 | Straight into three crowd clips. POWERED BY and the logo sit bottom-centre (no box) |
| 2.6–4.0 | REFRESH / THE / MACHINE over stop-motion crowd frames in Coca-Cola duotone with a riser |
| **4.0** | **Drop:** ODUMODUBLVCK on red, then on white with a red ribbon |
| 4.7–12.4 | Crowd montage cut on the kicks: ABUJA · ICE COLD. · TURN IT UP · LOUDER · 18.12 · BIG KALA · REFRESH THE MACHINE |
| 12.4–15.3 | Chrome RISE OF THE MACHINE title over the crowd, ribbon and a ticker that includes "Powered by Coca-Cola" |
| 15.3–20 | End card: key art, name, title, DEC. 18TH ★ ABUJA, ticket URL, POWERED BY / Coca-Cola, Kalacious |

Videos (20 s, 30 fps, -14 LUFS): `COKE_ROTM_20s_9x16_1080x1920.mp4`, `_4x5_1080x1350`, `_1x1_1080x1080`, `_16x9_1920x1080`.
The audio is the song only (no added SFX): source 7.877–27.877 s, so the track's drop lands at 4.0 s, with a 1 s fade-out.

Flyers (`out/coke-flyers/`, rendered at 2× and downsampled): **01 Main** (Coca-Cola red key-art poster), **02 Refresh** (Coca-Cola duotone crowd with the white-box headline) and **03 White** (white field, red-framed photo cards, the chrome title on a red band, the Coca-Cola logo with a red POWERED BY). Each comes in story 1080×1920, feed 1080×1350 and square 1080×1080.

```
ffmpeg -ss 7.877 -t 20 -i src.mp4 -vn -af "afade=t=in:d=0.03,afade=t=out:st=19:d=1,loudnorm=I=-14:TP=-1.0:LRA=11" -ar 48000 out/coke_song.wav
python3 tools/coke.py 1080 1920 out/COKE_ROTM_20s_9x16_1080x1920.mp4 out/coke_song.wav 20
python3 tools/coke.py 2160 3840 flyers     # also 2160 2700, 2160 2160
```
Get Coca-Cola's brand team to approve the logo use, the lockup and the copy ("REFRESH THE MACHINE", "ICE COLD.") before release.
