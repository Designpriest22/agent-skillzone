"""Original beat-synced soundtrack for the Dec 13 Checklist spot, built from the beat map in config.js.

    python3 audio.py   -> out/audio.wav

Structure (120 bpm, 1 beat = 0.5 s):
  hook     impact hits on each word
  list     amapiano-style groove, a "tick" on every checked item
  tension  groove cuts out: heartbeat kick, pad, rising noise
  GIRL.    one hard stamp, then a pitched hit per word + snare roll
  drop     boom + full groove with log drums on the flyer reveal
  end      final tick on the ticket box, groove rides out
No samples or existing recordings are used.
"""
import json, re, wave
from pathlib import Path
import numpy as np
from scipy.signal import butter, sosfilt

ROOT = Path(__file__).parent
SR = 48000
cfg = json.loads(re.sub(r"^\s*window\.CONFIG\s*=\s*|;\s*$", "", (ROOT / "config.js").read_text().strip()))
DUR, SPB = cfg["duration"], 60 / cfg["bpm"]
N = int(SR * DUR)
rng = np.random.default_rng(21)
B = lambda b: b * SPB

def t_arr(d): return np.arange(int(SR * d)) / SR
def env(n, a=0.002, d=0.1):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / d)
def add(buf, x, at, g=1.0):
    i = int(at * SR)
    if i >= len(buf): return
    x = x[: len(buf) - i]
    buf[i:i + len(x)] += x * g
def filt(x, kind, f, order=2): return sosfilt(butter(order, f, btype=kind, fs=SR, output="sos"), x)
def db(v): return 10 ** (v / 20)
def hz(m): return 440 * 2 ** ((m - 69) / 12)

def kick(d=0.16):
    t = t_arr(0.45); f = 46 + 95 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.001, d)
def shaker(acc):
    n = filt(rng.standard_normal(int(SR * 0.07)), "highpass", 6500)
    return n * env(len(n), 0.003, 0.03 if acc else 0.016) * (0.5 + 0.5 * acc)
def clap(dec=0.07):
    n = filt(rng.standard_normal(int(SR * 0.3)), "bandpass", [900, 3600])
    e = env(len(n), 0.001, dec)
    for k in (0.008, 0.017): e[int(k * SR):] += 0.6 * env(len(n) - int(k * SR), 0.001, dec * 0.7)
    return n * e
def logdrum(freq, d=0.3):
    t = t_arr(d); f = freq * (1 + 0.6 * np.exp(-t * 40))
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.tanh(1.8 * (np.sin(ph) + 0.3 * np.sin(2 * ph)) * env(len(t), 0.002, 0.11))
def chord(freqs, d, bright=0.45):
    t = t_arr(d); x = np.zeros(len(t))
    for f in freqs:
        for det in (-0.12, 0.12):
            for h in range(1, 7): x += np.sin(2 * np.pi * f * h * (1 + det / 100) * t + h) * bright ** (h - 1) / h
    return x * np.minimum(1, t / 0.015) * np.exp(-t / (d * 0.5)) / len(freqs)
def boom(d=1.4):
    t = t_arr(d); return np.sin(2 * np.pi * np.cumsum(36 + 70 * np.exp(-t * 16)) / SR) * env(len(t), 0.002, 0.42)
def hit(pitch=60):  # punchy tom-ish word hit
    t = t_arr(0.4); f = hz(pitch) * (1 + 1.2 * np.exp(-t * 35))
    out = np.tanh(2 * np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.001, 0.12))
    c = clap(0.05); out[: len(c)] += 0.5 * c[: len(out)]
    return out
def tick():  # pen-tick + bright bell for each checked box
    t = t_arr(0.35)
    click = filt(rng.standard_normal(len(t)), "highpass", 4000) * env(len(t), 0.0005, 0.006)
    bell = (np.sin(2 * np.pi * 1975 * t) + 0.5 * np.sin(2 * np.pi * 2960 * t)) * env(len(t), 0.002, 0.09)
    return click * 0.8 + bell * 0.35
def crash(d=1.6):
    n = filt(rng.standard_normal(int(SR * d)), "highpass", 5000); return n * env(len(n), 0.002, 0.5)
def swoosh(d=0.4):
    t = t_arr(d); n = rng.standard_normal(len(t)); out = np.zeros(len(t)); seg = int(0.01 * SR)
    for i in range(0, len(t), seg):
        f = 600 + 5000 * np.sin(np.pi * i / len(t))
        out[i:i + seg] = filt(n[i:i + seg + 800], "bandpass", [f * 0.6, f * 1.4])[:seg]
    return out * np.sin(np.pi * t / d) ** 2

L = cfg["checklist"]; ta, tb = L["tension"]
girl = cfg["callout"]["girl"]["beat"]; stack = cfg["callout"]["stack"]
drop = cfg["drop"]["beat"]; endb = cfg["end"]["beat"]; total_beats = DUR / SPB

drums = np.zeros(N); bass = np.zeros(N); keys = np.zeros(N); fx = np.zeros(N)
chords = [[57, 60, 64, 67, 71], [53, 57, 60, 64, 67], [55, 59, 62, 66], [52, 55, 59, 62, 66]]
roots = [45, 41, 43, 40]
def groove(b0, b1, logs=True, gain=1.0):
    s = b0
    while s < b1 - 1e-6:
        beat_i = int(np.floor(s)); sub = round((s - beat_i) * 4)
        bar = int(s // 4); ch, root = chords[bar % 4], roots[bar % 4]
        at = B(s) + (SPB / 4 * 0.12 if sub % 2 else 0)
        if sub == 0: add(drums, kick(), at, 0.9 * gain)
        add(drums, shaker(1 if sub == 2 else 0.3), at, 0.22 * gain)
        if sub == 0 and beat_i % 2 == 1: add(drums, clap(), at, 0.33 * gain)
        pos16 = int(round((s % 4) * 4)) % 16
        if logs and pos16 in (0, 3, 6, 10, 11, 14): add(bass, logdrum(hz(root + (12 if pos16 == 11 else 0))), at, 0.5 * gain)
        if pos16 in (2, 7, 10, 15): add(keys, chord([hz(m) for m in ch], SPB * 0.6), at, 0.15 * gain)
        if pos16 == 0: add(keys, chord([hz(m - 12) for m in ch[:3]], SPB * 4, 0.3), at, 0.1 * gain)
        s += 0.25

H = cfg["hook"]
# hook: word impacts + a swelling pad
add(fx, boom(), B(H["line1"]["beat"]), 0.9); add(fx, crash(), B(H["line1"]["beat"]), 0.12)
add(fx, hit(55), B(H["line2"]["beat"]), 0.5); add(fx, hit(58), B(H["line3"]["beat"]), 0.6)
add(keys, chord([hz(m) for m in chords[0]], B(L["start"]), 0.3) * np.linspace(0.2, 1, int(SR * B(L["start"])))[: int(SR * B(L["start"]))], 0, 0.12)
add(fx, swoosh(0.45), B(L["start"]) - 0.35, 0.25)
# checklist groove (log drums join halfway)
groove(L["start"], (L["start"] + ta) / 2, logs=False)
groove((L["start"] + ta) / 2, ta, logs=True)
for it in L["items"]:
    if it["check"] is not None: add(fx, tick(), B(it["check"]), 0.55)
# tension: everything drops out — heartbeat + held pad + faint riser
for b in np.arange(ta, tb, 1.0):
    add(drums, kick(0.12), B(b), 0.65); add(drums, kick(0.1), B(b + 0.25), 0.4)
add(keys, chord([hz(m - 12) for m in chords[3]], B(tb - ta), 0.25), B(ta), 0.18)
nz = filt(rng.standard_normal(int(SR * B(tb - ta))), "bandpass", [2000, 6000]) * np.linspace(0, 1, int(SR * B(tb - ta))) ** 2
add(fx, nz, B(ta), 0.08)
# GIRL. stamp, then word hits with a snare roll into the drop
add(fx, boom(0.9), B(girl), 0.8); add(fx, hit(50), B(girl), 0.7)
for k, s in enumerate(stack): add(fx, hit(57 + 3 * k), B(s["beat"]), 0.55)
r = stack[0]["beat"]
while r < drop - 1e-6:
    p = (r - stack[0]["beat"]) / (drop - stack[0]["beat"])
    add(drums, clap(0.05), B(r), 0.08 + 0.3 * p)
    r += 0.25 if p < 0.5 else 0.125
rl = int(SR * B(drop - stack[0]["beat"]))
riser = np.zeros(rl); n = rng.standard_normal(rl + 2000); seg = int(0.02 * SR)
for i in range(0, rl, seg):
    p = i / rl; f = 400 + 7000 * p ** 2
    riser[i:i + seg] = filt(n[i:i + seg + 2000], "bandpass", [f * 0.7, f * 1.3])[:seg][: len(riser[i:i + seg])] * p ** 1.5
add(fx, riser, B(stack[0]["beat"]), 0.3)
# drop: boom, crash, full groove to the end
add(fx, boom(), B(drop), 1.0); add(fx, crash(), B(drop), 0.2)
groove(drop, total_beats, logs=True, gain=1.0)
add(fx, swoosh(0.4), B(endb) - 0.2, 0.25)
add(fx, tick(), B(cfg["end"]["checkBeat"]), 0.7)
add(fx, hit(62), B(cfg["end"]["ctaBeat"]), 0.25)

music = drums + bass + keys
# slightly muffled until the drop, wide open after
tt = np.arange(N) / SR
openp = np.clip((tt - B(drop) + 0.05) / 0.05, 0, 1)
music = filt(music, "lowpass", 3500, 2) * (1 - openp) * 0.85 + music * openp
mix = music * db(-6) + fx * db(-4)
mix *= 1 - 0.85 * np.clip((tt - (DUR - 0.3)) / 0.3, 0, 1)
mix = filt(mix, "highpass", 28)
mix = np.tanh(mix * 1.2) / np.tanh(1.2)
mix *= db(-1) / np.max(np.abs(mix))
d = int(0.008 * SR)
st = np.stack([mix, np.concatenate([mix[:d], mix[:-d]]) * 0.15 + mix * 0.85], 1)
(ROOT / "out").mkdir(exist_ok=True)
with wave.open(str(ROOT / "out" / "audio.wav"), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((st / np.max(np.abs(st)) * db(-1) * 32767).astype(np.int16).tobytes())
print("wrote out/audio.wav")
