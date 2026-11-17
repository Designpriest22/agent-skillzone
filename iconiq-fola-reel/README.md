# Iconiq Fest: Cloud 9 × Fola, 25 s reel

A 25-second brutalist motion reel built from the flyer and three live clips. It's cut on a 120 bpm original score with the event's own crowd audio underneath. One timeline renders two formats:

- **Story:** 1080×1920 (9:16)
- **Feed:** 1080×1350 (4:5)

Layout is in `rem` (1rem = min(1vw, .75vh)) and `vh`, so the same scenes reflow for both.

| Time (s) | Scene |
|---|---|
| 0–2 | ICONIQ / FEST / Cloud 9 badge / CLOUD lockup. One slam per beat. |
| 2–5 | Pyro footage. Torn paper slips (THIS DECEMBER, / ICONIQ FEST / TAKES ABUJA.) are slapped on, then peeled off. |
| 5–6 | F-O-L-A: one cut-paper letter per eighth note over a photocopied portrait |
| 6–9.5 | Footage of the fist with a scribbled circle, an arrow and "FOLA", plus a torn red strip: FOLA LIVE ✦ CLOUD 9 ✦ ABUJA |
| 9.5–11.5 | Taped photocopy portrait, the FOLA wordmark scratched on, HEADLINING CLOUD 9 |
| 11.5–14 | LIVE AT / BALI / RECREATIONAL / PARK, / ABUJA, pasted word by word |
| 14–16 | 16TH DEC 2026 as the flyer's folded box in torn paper |
| 16–19 | Footage triptych with torn paper bands (date, headliner, venue) |
| 19–22 | GET YOUR TICKETS AT → typed ICONIQFEST.COM with a marker underline |
| 22–25 | End card: the flyer rebuilt as a paste-up. It holds to the loop point. |

## Look

- **Copy:** only event facts (who, what, where, when, tickets), no filler slogans.
- **No interface chrome:** no timecodes, labels, progress bar or glow.
- **Paper chips:** every chip has a torn edge generated per element, paper fibre texture and a hard cut-paper shadow. Photos and stamps are held down with tape.
- **Stop-motion:** paper moves at 12 fps. Each chip is slapped down (one oversized, twisted frame, then it lands) and keeps a slight boil.
- **Transitions:** torn-paper sheet wipes on four cuts, with the white paper core showing along the tear.
- **Light grunge:** a multiply paper pass over everything, three cycling grunge plates (specks, hairs, scratches), grain, and a photocopy treatment on the portrait.
- **Sound:** an original score written for FOLA's sound. It's warm Afro-R&B in E♭ major, the key his live set sits in on the source clips. Highlife guitar plucks (Karplus-Strong), a Rhodes Ebmaj9–Cm9–Abmaj9–Bb7sus4 progression, swung shaker, congas, talking drum and log drum. The beat drops out under the name. The live crowd audio comes only from clips in a compatible key. Paper slaps and tears are mixed in.

## Files

- `reel.html`: the timeline (`window.renderAt(t)`)
- `score.py`: the score and crowd mix, written to `out/mix.wav`
- `render.mjs`: `node render.mjs story|feed` renders `out/iconiq-fola-<fmt>.mp4`. Add times to render stills instead.
- `assets/`: flyer crops (wordmarks, badge, logos); fonts (Anton, Archivo Black, Permanent Marker, all OFL); and generated paper, tape, grunge and grain textures

Footage frames and audio (`clips/`) and the renders (`out/`) are git-ignored because they contain artist footage and this repository is public.

To rebuild them, run `bash clips.sh <folder with the three source clips>`, then `python3 score.py`, then `node render.mjs story` and `node render.mjs feed`.

---

# Velvet: the second 25 s reel

`velvet.html` uses the red-curtain editorial clip and the same event information. It runs at 96 bpm: ten bars of 2.5 s, cut on the bar.

| Time (s) | Scene |
|---|---|
| 0–2.5 | Torn velvet curtain parts on the chain macro: ICONIQ FEST *presents* |
| 2.5–5 | Close-up: HEADLINING, FOLA wordmark scratched on |
| 5–7.5 | The dance: LIVE / *in* / ABUJA, one word per beat |
| 7.5–10 | Four taped photocopy freeze frames, then a rubber stamp: 16.12.26 |
| 10–12.5 | WEDNESDAY / 16 DEC / *2026* |
| 12.5–15 | Split screen: BALI / RECREATIONAL / PARK, ABUJA |
| 15–17.5 | Chain macro, white flash, close-up: ICONIQ FEST CLOUD 9 |
| 17.5–20 | An "admit one" ticket slides up; the stub is torn off |
| 20–22.5 | GET YOUR TICKETS AT / typed ICONIQFEST.COM |
| 22.5–25 | End card paste-up over the blurred footage, with a compact layout for 4:5 |

- **Safe zone:** `AUDIT=1 PAGE=velvet.html node render.mjs story|feed` measures every visible `.chk` text element at 6 fps. It fails any that leaves the safe zone:
  - story: 4% sides, 10% top, 14% bottom (clear of the platform's top bar and reply field)
  - feed: 4% all round
  - Both formats pass.
- **Score:** `velvet_score.py` writes `out/velvet-mix.wav`. It's original late-night Afro-R&B in G minor (Gm9–Ebmaj9–Cm9–D7b9):
  - a timpani roll and string swell for the curtain
  - finger snaps, log drum and Rhodes
  - brass stabs on the big words
  - vinyl crackle
  - a scratch for the wordmark, camera shutters for the polaroids, a stamp thud and paper tears for the ticket
- **Song version:** `velvet_song.py` cuts 25 s from the clip's own song, starting at 24.575 s, a downbeat of bar 11 at 112 bpm. The curtain opens on the build, and the full section lands as FOLA appears. Paper foley sits underneath, and the result is normalised to −14 LUFS. In this version the timeline is locked to the song:
  - each scene starts on a downbeat
  - the ticket holds for two bars, and the end card takes the rest
  - footage plays at natural speed
  - every cut lands within a frame of a kick
- **Render:** `PAGE=velvet.html node render.mjs story|feed` writes `out/iconiq-fola-velvet-<fmt>.mp4`. Add `AUDIO_FILE=velvet-song-mix-ln.wav` to use the song.
- **Rights:** the song belongs to the artist and their label. Use the song version only with their clearance.
