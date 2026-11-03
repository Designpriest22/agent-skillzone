"""Synthesise the original soundtrack + UI sounds, timed from config.js.

Everything here is generated from scratch (no samples, no Wizkid recordings):
an amapiano-style instrumental that builds into the closing frame, plus
WhatsApp-style receive pops, send swooshes and scene transitions.

    python3 audio.py            -> out/audio.wav
"""
import json, re, wave
from pathlib import Path
import numpy as np
from scipy.signal import butter, sosfilt

ROOT = Path(__file__).parent
SR = 48000
cfg = json.loads(re.sub(r"^\s*window\.CONFIG\s*=\s*|;\s*$", "", (ROOT / "config.js").read_text().strip()))
DUR = cfg["duration"]
N = int(SR * DUR)
rng = np.random.default_rng(13)

def t_arr(d): return np.arange(int(SR * d)) / SR
def env(n, a=0.002, d=0.1):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / d)
def add(buf, x, at, g=1.0):
    i = int(at * SR)
    if i >= len(buf): return
    if i < 0: x, i = x[-i:], 0
    x = x[: len(buf) - i]
    buf[i:i + len(x)] += x * g
def filt(x, kind, f, order=2):
    return sosfilt(butter(order, f, btype=kind, fs=SR, output="sos"), x)
def db(v): return 10 ** (v / 20)

# ---------------- music ----------------
BPM = 113
beat = 60 / BPM
s16 = beat / 4
bar = beat * 4
g0, g1 = cfg["scenes"]["toGroup"]
c0, c1 = cfg["scenes"]["toClosing"]

music = np.zeros(N); drums = np.zeros(N); bass = np.zeros(N); pads = np.zeros(N)

def kick():
    t = t_arr(0.45); f = 48 + 90 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.001, 0.16)
def shaker(acc):
    n = rng.standard_normal(int(SR * 0.07)); n = filt(n, "highpass", 6500)
    return n * env(len(n), 0.003, 0.018 if not acc else 0.03) * (0.5 + 0.5 * acc)
def clap():
    n = rng.standard_normal(int(SR * 0.25)); n = filt(n, "bandpass", [900, 3500])
    e = env(len(n), 0.001, 0.07)
    for k in (0.008, 0.017):  # flam
        e[int(k * SR):] += 0.6 * env(len(n) - int(k * SR), 0.001, 0.05)
    return n * e
def logdrum(freq, d=0.32):
    t = t_arr(d); f = freq * (1 + 0.6 * np.exp(-t * 40)) * (1 - 0.06 * t / d)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    return np.tanh(1.8 * x * env(len(t), 0.002, 0.12))
def chord(freqs, d, bright=0.5):
    t = t_arr(d); x = np.zeros(len(t))
    for f in freqs:
        for det in (-0.12, 0.12):
            for h in range(1, 7):
                x += np.sin(2 * np.pi * f * h * (1 + det / 100) * t + h) * (bright ** (h - 1)) / h
    a = np.minimum(1, t / 0.02) * np.exp(-t / (d * 0.55))
    return x * a / len(freqs)

def hz(m): return 440 * 2 ** ((m - 69) / 12)
prog_chords = [[57, 60, 64, 67, 71], [53, 57, 60, 64, 67], [55, 59, 62, 66], [52, 55, 59, 62, 66]]  # Am9 Fmaj9 G(maj7) Em9
roots = [45, 41, 43, 40]

nbars = int(DUR / bar) + 2
for b in range(nbars):
    t0 = b * bar
    ch = prog_chords[b % 4]; root = roots[b % 4]
    for s in range(16):
        ts = t0 + s * s16
        if ts >= DUR: break
        sw = s16 * 0.12 if s % 2 else 0  # swing
        ts += sw
        # kick: four on the floor, lighter in the intro
        if s % 4 == 0: add(drums, kick(), ts, 0.9)
        add(drums, shaker(1 if s % 4 == 2 else 0.3), ts, 0.22)
        if s in (4, 12) and ts > g0: add(drums, clap(), ts, 0.35)
        # log drum pattern (enters with the group chat)
        if ts > g0 - 0.05 and s in (0, 3, 6, 10, 11, 14):
            add(bass, logdrum(hz(root + (12 if s == 11 else 0))), ts, 0.55)
        # chord stabs on off-beats
        if s in (2, 7, 10, 15):
            add(pads, chord([hz(m) for m in ch], s16 * 2.4, 0.45), ts, 0.16)
    add(pads, chord([hz(m - 12) for m in ch[:3]], bar, 0.3), t0, 0.12)

# intensity automation
tt = np.arange(N) / SR
def ramp(a, b): return np.clip((tt - a) / (b - a), 0, 1)
intro = 0.42 + 0.18 * ramp(0, g0)
lvl = intro + (0.75 - intro) * ramp(g0 - 0.2, g1) + 0.25 * ramp(c0, c0 + 0.1)
# riser into the closing frame: filtered noise sweep + snare roll
rise_a, rise_b = c0 - 1.0, c0
noise = rng.standard_normal(N)
riser = np.zeros(N)
seg = int(0.02 * SR)
for i in range(int(rise_a * SR), int(rise_b * SR), seg):
    p = (i / SR - rise_a) / (rise_b - rise_a)
    f = 400 + 7000 * p ** 2
    riser[i:i + seg] = filt(noise[i:i + seg + 2000], "bandpass", [f * 0.7, f * 1.3])[:seg] * p ** 1.5
roll_t = rise_a
while roll_t < rise_b:
    p = (roll_t - rise_a) / (rise_b - rise_a)
    add(drums, clap(), roll_t, 0.08 + 0.25 * p)
    roll_t += s16 if p < 0.5 else s16 / 2
# duck drums/bass during the riser for a cleaner drop
duck = 1 - 0.6 * ramp(rise_a, rise_a + 0.3) * (1 - ramp(c0, c0 + 0.02))

# low-pass the intro so it sounds like it's coming from the party next door, then open up
mus = drums * duck + bass * duck + pads
lp_intro = filt(mus, "lowpass", 1400, 2)
openp = ramp(g0 - 0.3, g1 + 0.6) * 0.6 + 0.4 * ramp(c0 - 0.6, c0)
mus = lp_intro * (1 - openp) + mus * openp
music = mus * lvl + riser * 0.35

# drop impact at the closing frame
t = t_arr(1.6)
boom = np.sin(2 * np.pi * np.cumsum(38 + 60 * np.exp(-t * 18)) / SR) * env(len(t), 0.002, 0.45)
add(music, boom, c0 + 0.02, 0.9)
add(music, filt(rng.standard_normal(len(t)), "highpass", 3000) * env(len(t), 0.002, 0.6), c0 + 0.02, 0.16)

# tail fade
music *= 1 - 0.85 * ramp(DUR - 0.35, DUR)

# ---------------- UI sounds ----------------
ui = np.zeros(N)
def pop():   # WhatsApp-style in-chat receive "pop"
    t = t_arr(0.12)
    a = np.sin(2 * np.pi * 1180 * t) * env(len(t), 0.001, 0.022)
    b = np.sin(2 * np.pi * 1760 * t) * env(len(t), 0.001, 0.03)
    out = np.zeros(len(t)); out += a; out[int(0.045 * SR):] += b[: len(t) - int(0.045 * SR)]
    return out
def send():  # soft upward swoosh + tick
    t = t_arr(0.16)
    n = filt(rng.standard_normal(len(t)), "bandpass", [1800, 6000])
    sw = n * np.sin(np.pi * np.clip(t / 0.12, 0, 1)) ** 2 * 0.35
    tick = np.sin(2 * np.pi * 2400 * t) * env(len(t), 0.0005, 0.008)
    out = sw.copy(); i = int(0.1 * SR); out[i:] += tick[: len(t) - i]
    return out
def swoosh(d=0.45):
    t = t_arr(d); n = rng.standard_normal(len(t)); out = np.zeros(len(t)); seg2 = int(0.01 * SR)
    for i in range(0, len(t), seg2):
        p = i / len(t); f = 600 + 5000 * np.sin(np.pi * p)
        out[i:i + seg2] = filt(n[i:i + seg2 + 800], "bandpass", [f * 0.6, f * 1.4])[:seg2]
    return out * np.sin(np.pi * t / d) ** 2
def react():
    t = t_arr(0.1); return np.sin(2 * np.pi * 2100 * t) * env(len(t), 0.001, 0.02)

for chat in ("privateChat", "groupChat"):
    for m in cfg[chat]["messages"]:
        at = m["at"]
        if at < 0 or m.get("type") in ("typing",): continue
        if m.get("type") == "chip": continue
        if m["from"] == "teni": add(ui, send(), at, db(-10))
        else: add(ui, pop(), at, db(-11))
        if "reactions" in m: add(ui, react(), m["reactions"]["at"], db(-16))
add(ui, swoosh(0.5), g0 - 0.05, db(-12))
add(ui, swoosh(0.6), c0 - 0.1, db(-14))

mix = music * db(-9) + ui
mix = filt(mix, "highpass", 28)
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
mix *= db(-1) / np.max(np.abs(mix))
# tiny stereo widening via Haas on the music only
d = int(0.008 * SR)
left = mix; right = np.concatenate([mix[:d], mix[:-d]]) * 0.15 + mix * 0.85
st = np.stack([left, right], 1)
st = st / np.max(np.abs(st)) * db(-1)
(ROOT / "out").mkdir(exist_ok=True)
with wave.open(str(ROOT / "out" / "audio.wav"), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((st * 32767).astype(np.int16).tobytes())
print("wrote out/audio.wav", DUR, "s")
