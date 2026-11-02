"""DAY 7 score — trailer → afrobeats. 100 BPM, D minor. Braam, ticking clock, Shepard rise, then highlife guitar groove."""
import json, sys
import numpy as np
from studio import *

cues = json.load(open(sys.argv[1])); out = sys.argv[2]
S = Session(cues["duration"], cues["bpm"], cues.get("offset", 0), seed=77)
b = S.beat
sec = {s["name"]: (s["from"], s["to"]) for s in cues["music"]["sections"]}
def inside(beat, *names): return any(sec[n][0] <= beat < sec[n][1] for n in names)
SW = 0.55
def st_time(bar, st): return b(bar * 4 + st * 0.25 + (st % 2) * (SW - 0.5) * 0.5)

CH = [("D2", ["D3", "F3", "A3", "C4"], ["D4", "F4", "A4", "C5"]), ("Bb1", ["Bb2", "D3", "F3", "A3"], ["D4", "F4", "A4", "Bb4"]),
      ("G1", ["G2", "Bb2", "D3", "F3"], ["D4", "G4", "Bb4", "F4"]), ("A1", ["A2", "C#3", "E3", "G3"], ["C#4", "E4", "G4", "A4"])]
ARP = [0, 2, 1, 3, 2, 1, 3, 2]  # highlife guitar figure over 8ths
total = int(cues["duration"] * cues["bpm"] / 60) + 1

# ── trailer half: drone, clock, braam, toms, Shepard rise
S.add("bass", sub("D2", b(8)), 0, -12)
S.add("music", supersaw(["D2", "A2", "D3"], b(16), cutoff=600, attack=1.5, release=0.6), 0, -12, width=0.6)
for i in range(3, 16): S.add("sfx", tom(70 if i % 2 else 55, seed=i) * (1.0 if i in (3, 7, 11) else 0.5), b(i), -14 + (i - 3) * 0.6, pan=0.0)
S.add("music", shepard(b(16) - b(8), base=55, seed=3), b(8), -12, width=0.5)
for i in range(48): S.add("drums", snare(seed=i, tone=200), b(12 + i * 0.25 * 1.0) if i < 16 else b(12) + 10, -26 + i * 1.0) if i < 16 else None
S.add("sfx", impact(seed=9, size=1.2), b(16), -6); S.add("drums", crash(seed=4, length=2.6), b(16), -10)

# ── afrobeats from the drop
for bar in range(4, total // 4 + 1):
    root, gt, br = CH[bar % 4]
    for st in range(16):
        bt = bar * 4 + st / 4; t = st_time(bar, st)
        if bt >= total or not inside(bt, "drop"): continue
        if st in (0, 6, 8, 14) or (st == 11 and bar % 2): S.add("drums", kick("afro", seed=bar + st), t, -2); S.kick_marks.append(t)
        if st in (4, 12): S.add("drums", snare(seed=bar + st, tone=230), t, -9); S.add("drums", clap(seed=st), t + 0.005, -12)
        if st in (3, 7, 10, 14): S.add("drums", rim(seed=st + bar), t, -13, pan=-0.3)
        S.add("drums", shaker(seed=bar * 13 + st, accent=1.0 if st % 2 else 0.6), t, -12, pan=0.35, human=0.003)
        if st in (2, 6, 10, 14): S.add("drums", hat(seed=st + bar), t, -14, pan=0.2)
        if st in (5, 13): S.add("drums", conga(300, slap=True, seed=st), t, -12, pan=0.45)
        if st in (0, 3, 6, 10, 12): S.add("bass", sub(root if st != 10 else root[:-1] + str(int(root[-1]) + 1), 0.3 if st in (0, 6) else 0.18), t, -2)
        if st % 2 == 0:  # nylon highlife figure (sampled)
            nt = gt[ARP[(st // 2) % 8]]; up = midi(nt) + 12
            S.add("music", guitar(up, 2, "nylon")[: int(0.6 * SR)], t, -8, pan=0.35 if st % 4 else -0.15, human=0.004)
        if st == 0 and bar % 2 == 0: S.add("music", brass(br[:3], 0.25), t, -11)
        if st == 10: S.add("music", brass(br[1:4], 0.18), t, -13)
    S.add("music", supersaw(gt[1:], b(4), cutoff=1400, attack=0.3, release=0.4), b(bar * 4), -18, width=0.7)

S.add("amb", crowd(cues["duration"] - b(16), seed=8), b(16), -6, width=0.8)
S.add("amb", lp(np.random.default_rng(3).standard_normal(S.n), 300) * 0.02, 0, -4)
for k, nt in enumerate(["D2", "A2", "F3", "C4", "E4"]): S.add("music", piano(nt, 2), b(27.5) + 0.25 + k * 0.02, -9, pan=-0.3 + k * 0.15)

def d_tick(sp):
    n = int(0.08 * SR); x = bp(np.random.default_rng(1).standard_normal(n), 2500, 7000) * np.exp(-np.arange(n) / 90) + sine(3200, n) * np.exp(-np.arange(n) / 120) * 0.3
    return stereo(x), 0.0
def d_braam(sp): return stereo(braam("D1", 2.8, seed=2), width=0.5) * db(2), 0.01
def d_fire(sp):
    r = np.random.default_rng(int(sp["t"] * 100)); n = int(2.0 * SR)
    boom = impact(seed=int(sp["t"] * 10), size=0.6)[:n] * 0.7
    cr = np.zeros(n)
    for _ in range(260):
        i = r.integers(int(0.15 * SR), n - 200); m = r.integers(20, 120); cr[i:i + m] += r.standard_normal(m) * np.exp(-np.arange(m) / (m * 0.3)) * r.uniform(0.1, 0.6)
    return stereo(boom + hp(cr, 2000) * 0.6, width=0.6), 0.0
designs = {"tick": d_tick, "braam": d_braam, "firework": d_fire, "sonic-logo": lambda sp: sonic_logo("brass", sp["t"])}
for sp in cues["spots"]: S.place_spot(sp, designs, default_gain=-3.0)

def music_fx(music, bass, drums):
    g = int(b(16) * SR); gap = int(0.18 * SR)  # a breath of silence before the drop
    for x in (music, bass, drums): x[g - gap:g] *= np.linspace(1, 0, gap)[:, None] ** 0.3 * 0.05
    return music, bass, drums

S.mix(music_fx=music_fx, duck_db=4, pump_db=2.0, reverb_room=0.4, out=out)
json.dump({"spots": S.log, "sections": cues["music"]["sections"]}, open(out.replace(".wav", ".spotting.json"), "w"), indent=1)
print("score written", out)
