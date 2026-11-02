"""DAY 1 score — afro-house, 120 BPM, A minor. Arranged to the cut (sections come from the reel's MUSIC map)."""
import json, sys
import numpy as np
from studio import *

cues = json.load(open(sys.argv[1])); out = sys.argv[2]
S = Session(cues["duration"], cues["bpm"], cues.get("offset", 0), seed=11)
b = S.beat
sec = {s["name"]: (s["from"], s["to"]) for s in cues["music"]["sections"]}
def inside(beat, *names): return any(sec[n][0] <= beat < sec[n][1] for n in names)

CH = [  # bar-long chords: (bass root, piano voicing)
    ("A1", ["C4", "E4", "G4", "B4"]), ("F1", ["A3", "C4", "E4", "G4"]), ("C2", ["B3", "D4", "E4", "G4"]), ("G1", ["A3", "B3", "D4", "E4"])]
HOOK = [(0, "E5"), (3, "G5"), (6, "A5"), (8, "C6"), (11, "A5"), (14, "G5"), (16, "E5"), (19, "D5"), (22, "E5"), (26, "G5"), (28, "E5")]
total_beats = int(cues["duration"] * cues["bpm"] / 60) + 1

for bar in range(0, total_beats // 4 + 1):
    root, voicing = CH[bar % 4]
    for st in range(16):
        bt = bar * 4 + st / 4; t = b(bt)
        if bt >= total_beats: break
        full = inside(bt, "drop", "groove", "slam")
        # ── drums
        if st % 4 == 0 and (full or inside(bt, "filtered-question") or bt in (32,)):
            S.add("drums", kick("afro", seed=bar), t, -1); S.kick_marks.append(t)
        if full and st in (4, 12): S.add("drums", clap(seed=bar * 16 + st), t, -7, pan=0.05, human=0.003)
        if full and st in (2, 6, 10, 14): S.add("drums", hat(seed=st + bar), t, -9, pan=0.25, human=0.004)
        if full and st == 14 and bar % 2: S.add("drums", hat(True, seed=bar), t, -12, pan=0.25)
        if (full or inside(bt, "intro-stutter", "filtered-question")):
            S.add("drums", shaker(seed=bar * 31 + st, accent=1.0 if st % 4 == 2 else 0.55), t, -12, pan=-0.3, human=0.004)
        if inside(bt, "groove", "slam") or (inside(bt, "drop") and bt >= 5):
            if st in (3, 6, 11): S.add("drums", conga(330, slap=(st == 6), seed=st + bar), t, -10, pan=0.4, human=0.005)
            if st in (10, 14): S.add("drums", conga(220, seed=st + bar * 3), t, -9, pan=0.45, human=0.005)
            if st in (3, 7, 13): S.add("drums", rim(seed=st), t, -16, pan=-0.2)
        if inside(bt, "build"): S.add("drums", snare(seed=st, tone=210), t, -14 + (bt - 15) * 10, pan=0.0)
        # ── bass (syncopated sub, root/fifth)
        if full and st in (0, 3, 8, 11, 14):
            nt = root if st in (0, 3, 8) else (root[:-1] + str(int(root[-1]) + 1) if st == 11 else root)
            S.add("bass", sub(nt, 0.32 if st in (0, 8) else 0.18), t, -3)
        # ── piano stabs (sampled grand), off-beat syncopation
        if full and st in (2, 6, 10, 13):
            for k, nt in enumerate(voicing):
                S.add("music", piano(nt, 3)[: int(0.24 * SR)] * np.linspace(1, 0, int(0.24 * SR))[:, None] ** 0.6, t + k * 0.004, -9, pan=-0.25 + k * 0.17)
        # ── marimba hook
        if inside(bt, "groove", "slam") or inside(bt, "filtered-question"):
            pos = (bar % 2) * 16 + st
            for s_, nt in HOOK:
                if s_ == pos: S.add("music", mallet(nt, "marimba", 0.9), t, -8 if inside(bt, "groove", "slam") else -13, pan=0.3)
        if inside(bt, "intro-stutter") and st % 2 == 0:
            S.add("music", mallet(["A4", "C5", "E5", "A5"][(st // 2) % 4], "kalimba", 0.4), t, -9, pan=0.2)
    # ── pads under the question and the end
    if inside(bar * 4, "filtered-question") or inside(bar * 4 + 2, "filtered-question"):
        S.add("music", supersaw([v for v in voicing[:3]], 2.0, cutoff=1400, attack=0.5), b(bar * 4), -12, width=0.6)

# transitions & designed moments
S.add("sfx", riser(b(16) - b(15) + 0.05, seed=3, f0=500, f1=8000), b(15), -9)
S.add("drums", crash(seed=4), b(16), -14, pan=0.2); S.add("drums", crash(seed=5), b(29), -11, pan=-0.2)
S.add("sfx", impact(seed=6, size=0.9), b(29), -10)
S.add("music", piano("A1", 2)[: int(2.5 * SR)], b(26), -10)  # lone low note in the silence
S.add("amb", lp(np.random.default_rng(1).standard_normal(S.n), 380) * 0.02, 0, -6)  # room tone under everything
# end chord: Am9 rings under the logo
for k, nt in enumerate(["A2", "E3", "C4", "G4", "B4"]):
    S.add("music", piano(nt, 2), b(32) + k * 0.02, -9, pan=-0.3 + k * 0.15)
S.add("music", supersaw(["A3", "E4", "B4"], 2.6, cutoff=1600, attack=0.3, release=1.0), b(32), -16, width=0.7)

designs = {"sonic-logo": lambda sp: sonic_logo("marimba", sp["t"])}
for sp in cues["spots"]: S.place_spot(sp, designs, default_gain=-3.0)

def music_fx(music, bass, drums):
    # low-pass the music bed under the question (comprehension: words first), open it for the build
    a, z = int(b(sec["filtered-question"][0]) * SR), int(b(sec["build"][1]) * SR)
    filt = lp(music, 700, 2); m = music.copy(); ramp = np.ones(len(music))
    ramp[a:z] = 0; ramp[a:a + 2400] = np.linspace(1, 0, 2400); ramp[z - int(b(1) * SR):z] = np.linspace(0, 1, int(b(1) * SR)) ** 2
    m = music * ramp[:, None] + filt * (1 - ramp[:, None])
    # tape stop on "every post starts from zero" — the bed dies, then returns on the slam
    t0 = b(sec["stop-zero"][0]); back = int(b(sec["slam"][0]) * SR)
    def stop(x, L):
        y = tape_stop(x, t0, L); y[back:] = x[back:]; return y
    return stop(m, 0.7), stop(bass, 0.7), stop(drums, 0.55)

final = S.mix(music_fx=music_fx, duck_db=5, pump_db=3.5, reverb_room=0.3, out=out)
json.dump({"spots": S.log, "sections": cues["music"]["sections"]}, open(out.replace(".wav", ".spotting.json"), "w"), indent=1)
print("score written", out)
