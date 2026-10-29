window.CONFIG = {
  "duration": 15,
  "fps": 30,
  "bpm": 120,
  "_note": "All 'beat' values are in beats at the bpm above (120 bpm = 0.5 s per beat). Audio cues in audio.py follow the same beats.",

  "hook": {
    "line1": { "text": "ABUJA,", "beat": 0 },
    "line2": { "text": "ARE YOU", "beat": 2 },
    "line3": { "text": "OUTSIDE?", "beat": 3 }
  },

  "checklist": {
    "title": "DEC 13 CHECKLIST",
    "start": 4,
    "items": [
      { "text": "OUTFIT",    "in": 4,  "check": 5 },
      { "text": "LASHES",    "in": 6,  "check": 7 },
      { "text": "THE GIRLS", "in": 8,  "check": 9 },
      { "text": "THE RIDE",  "in": 10, "check": 11 },
      { "text": "WIZKID TICKET", "in": 12, "check": null }
    ],
    "tension": [13, 15]
  },

  "callout": {
    "girl": { "text": "GIRL.", "beat": 15 },
    "stack": [
      { "text": "BIG WIZ",   "beat": 16 },
      { "text": "IS COMING", "beat": 16.5 },
      { "text": "TO ABUJA",  "beat": 17 }
    ]
  },

  "drop": {
    "beat": 18,
    "flyer": "assets/flyer_hero.jpg",
    "top":    [ { "text": "LIVE OUT LOUD", "beat": 18 }, { "text": "MUSIC FESTIVAL", "beat": 20 }, { "text": "BIG WIZ · LIVE", "beat": 22 } ],
    "bottom": [ { "text": "13.12.2026", "beat": 19 }, { "text": "EAGLE SQUARE", "beat": 21 }, { "text": "ABUJA", "beat": 23 } ]
  },

  "end": {
    "beat": 24,
    "eyebrow": "LIVE OUT LOUD MUSIC FESTIVAL",
    "item": "WIZKID TICKET",
    "checkBeat": 24.5,
    "date": "13 DECEMBER 2026",
    "venue": "EAGLE SQUARE, ABUJA",
    "ctaLabel": "GET YOURS AT",
    "cta": "WIZKID.TIX.AFRICA",
    "ctaBeat": 26
  }
};
