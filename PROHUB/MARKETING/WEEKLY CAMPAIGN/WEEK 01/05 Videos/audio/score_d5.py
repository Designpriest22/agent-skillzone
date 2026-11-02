"""DAY 5 score — UK garage 2-step, 128.57 BPM, G minor. Notification pings are notes of the key."""
import json, sys
import numpy as np
from studio import *

cues = json.load(open(sys.argv[1])); out = sys.argv[2]
S = Session(cues["duration"], cues["bpm"], cues.get("offset", 0), seed=55)
b = S.beat
sec = {s["name"]: (s["from"], s["to"]) for s in cues["music"]["sections"]}
def inside(beat, *names): return any(sec[n][0] <= beat < sec[n][1] for n in names)
SW = 0.58
def st_time(bar, st): return b(bar * 4 + st * 0.25 + (st % 2) * (SW - 0.5) * 0.5)  # swung 16ths

CH = [("G1", ["Bb3", "D4", "F4", "A4"]), ("Eb2", ["G3", "Bb3", "D4", "F4"]), ("C2", ["Eb4", "G4", "Bb4", "D5"]), ("D2", ["C4", "F4", "A4", "D5"])]
total = int(cues["duration"] * cues["bpm"] / 60) + 1
for bar in range(total // 4 + 1):
    root, voicing = CH[bar % 4]
    for st in range(16):
        bt = bar * 4 + st / 4; t = st_time(bar, st)
        if bt >= total: break
        full = inside(bt, "fixes"); flood = inside(bt, "flood"); build = inside(bt, "grid")
        if (full and st in (0, 10)) or (full and st == 7 and bar % 2 == 0) or (flood and bt >= 4 and st in (0, 10)):
            S.add("drums", kick("house", seed=bar + st), t, -2); S.kick_marks.append(t)
        if full and st in (4, 12):
            S.add("drums", snare(seed=bar * 3 + st, tone=200), t, -8, pan=0.03); S.add("drums", clap(seed=bar + st), t + 0.004, -10)
        if full and st in (15,) and bar % 2: S.add("drums", snare(seed=st, tone=240), t, -18)  # ghost
        if full or flood or build:
            acc = 1.0 if st % 2 else 0.55
            S.add("drums", hat(seed=bar * 16 + st) * acc, t, -11 if full else -16, pan=0.3, human=0.002)
        if full and st in (2, 6, 10, 14): S.add("drums", hat(True, seed=st + bar) * 0.6, t, -17, pan=-0.3)
        if build: S.add("drums", snare(seed=st, tone=220), t, -20 + (bt - 36) * 4)
        # sub bass (2-step bounce)
        if full and st in (0, 6, 11):
            S.add("bass", sub(root, 0.42 if st == 0 else 0.2, glide_from=None if st else (CH[(bar - 1) % 4][0])), t, -2)
        # chord stabs: sampled piano + short supersaw on the syncopations
        if full and st in (3, 10):
            for k, nt in enumerate(voicing):
                S.add("music", piano(nt, 3)[: int(0.2 * SR)] * np.linspace(1, 0, int(0.2 * SR))[:, None] ** 0.7, t + k * 0.003, -11, pan=-0.3 + k * 0.2)
            S.add("music", supersaw(voicing[:3], 0.12, cutoff=3200, attack=0.003, release=0.1), t, -15, width=0.5)
    if inside(bar * 4, "type", "logo") or inside(bar * 4, "flood"):
        S.add("music", supersaw(voicing[:3], b(4), cutoff=1300, attack=0.4, release=0.8), b(bar * 4), -5 if inside(bar * 4, "type") else -10, width=0.7)

S.add("sfx", riser(b(40) - b(37), seed=12, f0=300, f1=10000), b(37), -9)
S.add("drums", crash(seed=7), b(6), -13); S.add("drums", crash(seed=8), b(36), -15)
S.add("amb", lp(np.random.default_rng(5).standard_normal(S.n), 350) * 0.02, 0, -4)
for k, nt in enumerate(["G1", "D3", "Bb3", "F4", "A4"]): S.add("music", piano(nt, 2), b(44.5) + k * 0.02, -9, pan=-0.3 + k * 0.15)

def d_ping(sp):
    x = mallet(sp["note"], "bell", 0.9) * 0.9; x[: int(0.4 * SR)] += mallet(sp["note"], "marimba", 0.4) * 0.5
    return stereo(x, pan=0.15), 0.0
designs = {"ping": d_ping, "sonic-logo": lambda sp: sonic_logo("piano", sp["t"])}
for sp in cues["spots"]: S.place_spot(sp, designs, default_gain=-3.0)

def music_fx(music, bass, drums):
    a = int(b(sec["flood"][1]) * SR)  # muffled until the first fix
    drums[:a] = lp(drums[:a], 1200); music[:a] = lp(music[:a], 1500)
    return music, bass, drums

S.mix(music_fx=music_fx, duck_db=5, pump_db=2.0, reverb_room=0.3, out=out)
json.dump({"spots": S.log, "sections": cues["music"]["sections"]}, open(out.replace(".wav", ".spotting.json"), "w"), indent=1)
print("score written", out)
