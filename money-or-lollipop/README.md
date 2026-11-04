# Money or Lollipop

An animated version of a 54-second phone video shot in a compound yard. A little girl is offered a fan of naira notes in one hand or a lollipop in the other while the adults around her react. The animation keeps the same people, the same yard and the same shots at the same times, and plays the source video's own audio. Nothing has been added: no captions, no speech bubbles, no extra gags.

## Cast

- The girl: blue head-tie, lilac leopard-print dress, barefoot, holding a red soft-drink bottle at the start
- The man on the bench: dark tee with a small logo, camo trousers with green patches, black slides
- The woman in pink: long-sleeve raspberry top, black capri leggings, gold earrings, green hand fan, tan cloth over her arm
- The seated woman: orange-and-red ankara dress, green plastic chair, holding a sheet of paper while her hair is combed
- The woman doing her hair: black floral shirt, grey head-wrap, black shorts
- The POV hands: cash on the left, lollipop on the right

## Shot list (matches the source)

| Time (s) | Shot |
|---|---|
| 0–5 | The girl walks in with her bottle and stops between the cash and the lollipop. The seated woman and her hairdresser are behind her |
| 5–7 | Close-up of the seated woman having her hair combed |
| 7–9.5 | Back to the girl. The hairdresser laughs and steps away |
| 9.5–10.5 | The man leans in and reaches toward the money |
| 10.5–12.5 | The girl with the bottle |
| 13–15 | The man points at the money |
| 15–18.5 | The woman in pink comes in and bends down to talk to the girl, and the hairdresser dances |
| 19–20 | The seated woman puts both hands on her head |
| 20.5–23 | The girl with the woman in pink, who straightens up laughing |
| 23.5–26.5 | The man gets up off the bench laughing and slaps the bench |
| 26.5–31.5 | The woman in pink lifts the girl onto her hip, walks her to the offers and puts her down |
| 32–33.5 | The man with both hands on his head |
| 33.5–36 | The man in the background, the woman in pink bent over in front |
| 36–38.5 | The girl takes the lollipop while the woman in pink holds her hand |
| 39–41 | The girl walks off with the lollipop, crying |
| 41–44.5 | The woman in pink laughing with her fan, then the man with his hands on his head |
| 45–49 | The seated women, and the girl with her lollipop |
| 49.5–54 | The man with his hands on his head is handed a note |

## Files

- `index.html`: the animation (inline SVG characters with 2-bone IK arms, one deterministic `renderAt(t)` timeline) and a minimal player
- `render.mjs`: renders `out/money-or-lollipop.mp4` with headless Chromium and ffmpeg. `node render.mjs 6 19.5` renders stills instead

The soundtrack is the source video's audio. It isn't committed, because the recording has the people's real voices and this repository is public. To get it, extract it next to `index.html`:

```sh
ffmpeg -i <source video> -vn -ac 2 -b:a 128k audio.mp3
node render.mjs
```
