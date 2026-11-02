# Fizz — a 20-second story film

Made with the `story-animator` skill. A playful, fan-made opinion piece: a little red can called
Fizz is passed over for a shiny blue can, until a hot, tired girl picks her up and the bubbles make
her day. Every frame is drawn in code (Remotion + SVG); the cans are generic drawings, not real logos.

**Status:** picture finished; sound not done. `out/fizz-draft-silent.mp4` is a silent draft timed to
an *estimated* read of the script. The narration couldn't be generated because this cloud
environment's network policy blocks the voice provider's download hosts.

## To finish
1. Generate the narration (script in `src/story.ts`), save it as `public/audio/narration.mp3`.
2. `.venv/bin/python ../.claude/skills/story-animator/scripts/transcribe.py public/audio/narration.mp3`
   and copy the real word frames into `SUBS`, `CUES` and `CAM` in `src/story.ts`.
3. Add music/SFX if wanted, write `public/audio/audio_cues.json`, run `scripts/mix.py`, set
   `STORY.audio = "audio/mix.wav"`.
4. `npm run render` → `out/film.mp4`.
