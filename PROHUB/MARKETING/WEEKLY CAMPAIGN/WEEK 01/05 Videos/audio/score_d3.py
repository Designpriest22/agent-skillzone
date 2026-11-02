"""DAY 3 score — amapiano, 112.5 BPM, F minor. Log drums, jazz piano (sampled), swung shakers, grill foley."""
import json, sys
import numpy as np
from studio import *

cues = json.load(open(sys.argv[1])); out = sys.argv[2]
S = Session(cues["duration"], cues["bpm"], cues.get("offset", 0), seed=33)
b = S.beat
sec = {s["name"]: (s["from"], s["to"]) for s in cues["music"]["sections"]}
def inside(beat, *names): return any(sec[n][0] <= beat < sec[n][1] for n in names)
SW = 0.54  # 16th swing
def st_time(bar, st): return b(bar * 4 + st * 0.25 + (st % 2) * (SW - 0.5) * 0.5)  # swung 16ths

CH = [("F", ["Ab3", "C4", "Eb4", "G4"]), ("Db", ["F3", "Ab3", "C4", "Eb4"]), ("Eb", ["G3", "Bb3", "C4", "F4"]), ("C", ["G3", "Bb3", "Eb4", "G4"])]
LOG = {"F": ["F2", "Ab2", "C3", "Eb3"], "Db": ["Db2", "F2", "Ab2", "C3"], "Eb": ["Eb2", "G2", "Bb2", "Db3"], "C": ["C2", "Eb2", "G2", "Bb2"]}
LOG_PAT = [(0, 0, 0.55), (3, 0, 0.3), (6, 1, 0.45), (10, 2, 0.35), (11, 3, 0.3), (14, 0, 0.5)]
total = int(cues["duration"] * cues["bpm"] / 60) + 1

for bar in range(total // 4 + 1):
    root, voicing = CH[bar % 4]
    for st in range(16):
        bt = bar * 4 + st / 4; t = st_time(bar, st)
        if bt >= total: break
        groove = inside(bt, "montage", "cta")
        light = inside(bt, "insight")
        if (groove and st in (0, 8)) or (light and bt >= 13 and st == 0) or (groove and st == 14 and bar % 2):
            S.add("drums", kick("808", seed=bar), t, -3); S.kick_marks.append(t)
        if groove and st in (4, 12): S.add("drums", snare(seed=bar + st, tone=230) * 0.6 + 0, t, -12, pan=0.05)
        if (groove or light) and True:
            S.add("drums", shaker(seed=bar * 17 + st, accent=1.0 if st % 2 else 0.6), t, -9 if light else -11, pan=0.35, human=0.003)
        if (groove or light) and st in (3, 7, 10, 13): S.add("drums", rim(seed=st + bar), t, -14, pan=-0.35, human=0.003)
        if groove and st in (2, 6, 10, 14): S.add("drums", hat(seed=st), t, -15, pan=-0.15)
        # log drum bassline (the amapiano signature)
        if groove or inside(bt, "logo") and bt < sec["logo"][0] + 1:
            for s_, deg, L in LOG_PAT:
                if s_ == st: S.add("bass", log_drum(LOG[root][deg], seed=bar * 7 + st, length=L + 0.2), t, -2, pan=0.0)
        # ignite: log-drum roll rising into the montage
        if inside(bt, "ignite") and bt >= 17:
            S.add("bass", log_drum(["F2", "Ab2", "C3", "Eb3", "F3"][int((bt - 17) * 2) % 5], seed=st, length=0.25), t, -8 + (bt - 17) * 3)
        # jazz piano (sampled): chord on 1, pickups on the "and"s
        if (groove or light or inside(bt, "night")) and st in ((0, 7, 11) if groove else (0,)):
            vel = 2 if not groove else 3
            for k, nt in enumerate(voicing):
                L = int((0.9 if st == 0 else 0.3) * SR)
                S.add("music", piano(nt, vel)[:L] * np.linspace(1, 0, L)[:, None] ** 0.5, t + k * 0.012, -10 if groove else -5, pan=-0.3 + k * 0.2)
    if inside(bar * 4, "night", "insight", "montage", "cta") or inside(bar * 4 + 2, "night"):
        S.add("music", supersaw(voicing[:3], b(4), cutoff=1100, attack=0.6, release=0.9), b(bar * 4), -15 if inside(bar * 4, "montage", "cta") else -7, width=0.7)
        S.add("bass", sub(LOG[root][0].replace("2", "1"), b(4) - 0.05), b(bar * 4), -12) if inside(bar * 4, "night", "insight") else None

S.add("sfx", riser(b(19) - b(17), seed=8, f0=400, f1=9000), b(17), -10)
S.add("drums", crash(seed=2), b(19), -13); S.add("sfx", impact(seed=3, size=0.8), b(19), -11)
S.add("amb", lp(np.random.default_rng(2).standard_normal(S.n), 300) * 0.02, 0, -4)
S.add("amb", sizzle(b(16), seed=21, density=25) * 0.8, 0, -8, width=0.6)  # ember crackle bed under the night
for k, nt in enumerate(["F2", "C3", "Ab3", "Eb4", "G4"]): S.add("music", piano(nt, 2), b(34.5) + k * 0.025, -9, pan=-0.3 + k * 0.15)

def d_match(sp):
    n = int(0.6 * SR); r = np.random.default_rng(5)
    scratch = bp(r.standard_normal(n), 1500, 7000) * np.exp(-np.arange(n) / (0.05 * SR)) * 0.8
    flare = lp(r.standard_normal(n), 2500) * np.concatenate([np.linspace(0, 1, int(0.06 * SR)), np.exp(-np.arange(n - int(0.06 * SR)) / (0.2 * SR))]) * 0.6
    return stereo(scratch + flare), 0.02
def d_fire(sp): return stereo(lp(whoosh(1.0, seed=7, f0=150, f1=1800), 3000) * 1.5 + sizzle(1.0, seed=7, density=60) * 0.5), 0.45
def d_fluoro(sp):
    n = int(b(10) - b(6)) * SR if False else int((b(8.5) - b(6)) * SR)
    x = saw(120, n) * 0.2 + sine(240, n) * 0.15; return stereo(bp(x, 100, 3000) * 0.7), 0.0
def d_sizzle(sp): return stereo(sizzle(sp.get("len", 3.0), seed=11), width=0.5) * db(6), 0.0
def d_neon(sp): return stereo(neon_buzz(b(19) - b(16), seed=4, flicker_until=0.9)), 0.0
designs = {"match-strike": d_match, "fire-whoosh": d_fire, "fluoro-buzz": d_fluoro, "sizzle": d_sizzle, "neon-buzz": d_neon,
           "sonic-logo": lambda sp: (sonic_logo("log", sp["t"])[0] * db(-3), sonic_logo("log", sp["t"])[1])}
for sp in cues["spots"]: S.place_spot(sp, designs, default_gain=-3.0)

def music_fx(music, bass, drums):
    # hard drop-out for the cold "before" (6→10), filter on the CTA
    a, z = int(b(sec["before"][0]) * SR), int(b(sec["before"][1]) * SR)
    for x in (music, bass, drums): x[a:z] *= np.r_[np.linspace(1, 0, 600), np.zeros(z - a - 600)][:, None]
    c0, c1 = int(b(sec["cta"][0]) * SR), int(b(sec["cta"][1]) * SR)
    f = lp(music, 900); music[c0:c1] = f[c0:c1]
    return music, bass, drums

S.mix(music_fx=music_fx, duck_db=5, pump_db=2.5, reverb_room=0.45, out=out)
json.dump({"spots": S.log, "sections": cues["music"]["sections"]}, open(out.replace(".wav", ".spotting.json"), "w"), indent=1)
print("score written", out)
