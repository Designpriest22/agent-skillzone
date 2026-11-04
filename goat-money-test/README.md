# The Goat Money Test

An original 22-second, 9:16 cartoon (1080×1920, 30 fps). It reuses the hook structure of a viral "money or lollipop" choice video, with new characters, a new setting and a new punchline.

**Premise:** Bisi the goat, in a blue polka-dot head-tie, is offered ₦50,000 or one plantain. Uncle Sege and Aunty Funke beg her to take the money. She does, then she eats it, burps one note back out, and takes the plantain too.

## How the source video hooks people

The source is a 54-second handheld POV clip shot in a compound yard. Notes from the frames:

| Source moment | What keeps people watching |
|---|---|
| 0s: two hands in frame, a fan of naira notes on the left and a lollipop on the right, a toddler between them | The choice is clear before anyone speaks, so the viewer picks a side in the first second |
| Toddler in a blue head-tie | An innocent chooser who can't understand money, so the "wrong" choice is very likely |
| Man on a bench pointing and shouting | A hype man voices what the viewer is thinking |
| Woman in pink bends down to coach the child, waving a green hand fan | Adults interfere, which raises the stakes |
| Repeated reaches toward the lollipop | Near misses reset the tension and stretch out retention |
| Ends on the man with his hands on his head | The reaction is the payoff, and a still reaction shot loops cleanly |

## How the remake maps to it

| Time | Beat | Hook device |
|---|---|---|
| 0.0 | Cash fan vs plantain, plus the caption "We gave our goat a choice" | Choice is visible on the first frame, with a text hook for silent autoplay |
| 2.0 | Uncle Sege: "BISI!! TAKE THE MONEY!" | Hype man |
| 4.0 | Bisi goes for the plantain, which gets pulled back | Near miss 1 |
| 6.0 | Aunty Funke with her fan: "PLANTAIN NO DEY PAY RENT!" | Coach steps in |
| 9.0 | Naira eyes, "DING!", Uncle celebrates | False hope |
| 10.5 | She turns back to the plantain, Uncle grabs his head | Near miss 2 |
| 12.0 | "moment of truth...", music drops out, heartbeat, camera push | Peak suspense |
| 14.0 | CHOMP | Payoff |
| 16.5 | Record scratch, "wait...", she is eating the money | Twist |
| 18.5 | Gulp, burp, one note floats down | Second punchline |
| 19.5 | Uncle with hands on head: "FIFTY THOUSAND... DON ENTER GOAT BELLE!" | Reaction shot |
| 20.4 | She takes the plantain too: "She chose BOTH. Rate her financial IQ 1-10" | Comment prompt, then the video loops |

## Files

- `index.html`: the whole animation: inline SVG characters with 2-bone IK arms, one deterministic `renderAt(t)` timeline, and a player with play/pause, a scrub bar and a clickable hook map
- `score.py`: generates the original 104 bpm afro-groove loop and all the sound effects, timed to the same beats (`out/score.wav`)
- `score.mp3`: the encoded score the page plays through Web Audio
- `render.mjs`: renders the MP4 with headless Chromium and ffmpeg. `node render.mjs 3 14.2` renders stills instead

```sh
python3 score.py && ffmpeg -y -i out/score.wav -b:a 128k score.mp3   # audio
node render.mjs                                                       # -> out/goat-money-test.mp4
```

The browser and the MP4 use the same timeline, so they always match. While the page is playing, the Web Audio clock drives the animation, which keeps the picture in sync with the sound. `out/` is git-ignored.
