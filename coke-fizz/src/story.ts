// "Fizz" — a 20-second fan-made story: why Coke is better than Pepsi (a playful opinion piece).
// The ONE place every frame number lives.
//
// TIMING STATUS: PROVISIONAL. These frames are estimated from the script at about 2.6 words per
// second, because the narration couldn't be generated yet (network policy). Once the voice exists:
// run scripts/transcribe.py on it and replace SUBS / CUES / CAM with the real word frames.

export const FPS = 30;
export const OFFSET = 15; // the narration starts 0.5 s in

export const SHAPES = {
  "16:9": { width: 1920, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
  "4:5": { width: 1080, height: 1350 },
  "1:1": { width: 1080, height: 1080 },
} as const;

const SHAPE = SHAPES["16:9"];

export const STORY = {
  title: "Fizz",
  fps: FPS,
  width: SHAPE.width,
  height: SHAPE.height,
  durationFrames: 600, // exactly 20 s, as asked
  // Path inside public/ of the final audio mix, ALWAYS made by scripts/mix.py. null until the voice exists.
  audio: null as string | null,
};

// The narration, exactly as it will be voiced:
//   Meet Fizz, a little red can, saving her best bubbles.
//   Everyone grabbed the shiny blue can.
//   "Too sweet," they said, and set it down.
//   Then a hot, tired girl picked up Fizz.
//   Pssht! Crisp, cold... just right.
//   Some sodas are sweet. Coke is classic.

// Subtitles: [startFrame, endFrame, text].
export const SUBS: [number, number, string][] = [
  [15, 74, "Meet Fizz, a little red can,"],
  [74, 124, "saving her best bubbles."],
  [134, 200, "Everyone grabbed the shiny blue can."],
  [210, 286, "“Too sweet,” they said, and set it down."],
  [296, 372, "Then a hot, tired girl picked up Fizz."],
  [380, 462, "Pssht! Crisp, cold... just right."],
  [472, 552, "Some sodas are sweet. Coke is classic."],
];

// Story beats by frame.
export const CUES = {
  fizzName: 22, // "Fizz": a little hello hop
  tabGlint: 92, // "best bubbles": the token (her pull-tab) glints, two bubbles peek out
  reach: 132, // "Everyone": a hand reaches in from the right
  grab: 162, // "grabbed": the hand closes on the blue can
  lift: 168, // the blue can is lifted
  fizzSad: 182, // Fizz is passed over
  tooSweet: 212, // "Too sweet": sugar cubes pop out of the blue can
  setDown: 250, // "set it down"
  handGone: 290,
  girlRise: 292, // "Then a hot, tired girl": she rises behind the table
  girlReach: 330, // "picked up": her hand reaches for Fizz
  fizzLift: 344,
  pop: 382, // "Pssht!": the tab pops, the bubbles burst
  joy: 392, // the girl lights up
  frost: 400, // "Crisp, cold": frost sparkles
  heart: 444, // "just right"
  pullOut: 470, // "Some sodas are sweet"
  wink: 522, // "classic": Fizz winks
  credit: 540, // "a fan-made story" card
  end: 600,
};

// Camera keyframes: [frame, centreX, centreY, zoom] in the 1920 × 1080 world.
export const CAM: [number, number, number, number][] = [
  [0, 960, 560, 1.0],
  [12, 960, 560, 1.0],
  [126, 860, 620, 1.5], // 1: slow push in on Fizz
  [134, 860, 620, 1.5],
  [204, 1010, 560, 1.28], // 2: pan right to the blue can and the hand
  [286, 1030, 575, 1.34], // 3: hold (slow creep)
  [296, 1030, 575, 1.34],
  [372, 780, 520, 1.3], // 4: tilt up to the girl
  [380, 780, 520, 1.3],
  [392, 790, 470, 1.62], // 5: punch in on the pop
  [462, 790, 490, 1.5],
  [470, 790, 490, 1.5],
  [552, 960, 560, 1.04], // 6: pull out to the payoff
  [600, 960, 560, 1.02],
];
