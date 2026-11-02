"""Prohub Sound Studio — original score + sound design, rendered offline and frame-locked to the edit.

Sources (all safe for commercial use):
  * Synthesis in this file (drums, log drum, bass, mallets, pads, brass, braams, risers, Shepard tones,
    tape stops, sizzle, neon hum, crowd wash) — owned by Prohub.
  * Meta Open Sound (CC0): multi-sampled grand piano and guitars, selected foley.
  * wyzowl SFX Kit (CC0): 320 levelled, sync-pointed effects placed by their own sync data.
Mix: stems → bus processing (pedalboard) → sidechain ducking → master glue → loudness to -14 LUFS, TP ≤ -1 dBTP.
"""
from __future__ import annotations
import json, math, os, subprocess, functools
import numpy as np
from scipy import signal
import pedalboard as pb
import pyloudnorm as pyln

SR = 48000
KIT = "/home/user/wyzowl/sfx-kit"
META = "/home/user/facebookincubator/meta-open-sound"
NOTE = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11}


def midi(n: str) -> int:
    name, octv = (n[:-1], int(n[-1])) if n[-2] not in "-" else (n[:-2], int(n[-2:]))
    return 12 * (octv + 1) + NOTE[name]


def hz(n) -> float:
    m = midi(n) if isinstance(n, str) else n
    return 440.0 * 2 ** ((m - 69) / 12)


def db(x):
    return 10 ** (x / 20)


def rng(seed):
    return np.random.default_rng(seed)


def tt(d):
    return np.arange(int(d * SR)) / SR


def env_adsr(n, a=0.002, d=0.1, s=0.0, r=0.05, hold=None):
    a_n, d_n, r_n = int(a * SR), int(d * SR), int(r * SR)
    h_n = int(max(0.0, hold or 0) * SR)
    e = np.concatenate([np.linspace(0, 1, max(a_n, 1)), np.linspace(1, s, max(d_n, 1)), np.full(h_n, s), np.linspace(s, 0, max(r_n, 1))])
    return np.pad(e, (0, max(0, n - len(e))))[:n]


def exp_env(n, tau):
    return np.exp(-np.arange(n) / (tau * SR))


def lp(x, f, order=2):
    b, a = signal.butter(order, min(f, SR * 0.45) / (SR / 2), "low"); return signal.lfilter(b, a, x, axis=0)


def hp(x, f, order=2):
    b, a = signal.butter(order, f / (SR / 2), "high"); return signal.lfilter(b, a, x, axis=0)


def bp(x, f1, f2, order=2):
    b, a = signal.butter(order, [f1 / (SR / 2), min(f2, SR * 0.45) / (SR / 2)], "band"); return signal.lfilter(b, a, x, axis=0)


def sweep_filter(x, f0, f1, kind="band", q=4.0, block=256, curve=2.0):
    """Time-varying biquad (RBJ) — for risers, wah, filter opens."""
    y = np.zeros_like(x); n = len(x); zi = np.zeros(2)
    for i in range(0, n, block):
        p = (i / max(n - 1, 1)) ** curve
        f = f0 * (f1 / f0) ** p
        w0 = 2 * math.pi * min(f, SR * 0.45) / SR; al = math.sin(w0) / (2 * q); c = math.cos(w0)
        if kind == "band": b = [al, 0, -al]
        elif kind == "low": b = [(1 - c) / 2, 1 - c, (1 - c) / 2]
        else: b = [(1 + c) / 2, -(1 + c), (1 + c) / 2]
        a = [1 + al, -2 * c, 1 - al]
        seg, zi = signal.lfilter(np.array(b) / a[0], np.array(a) / a[0], x[i:i + block], zi=zi)
        y[i:i + block] = seg
    return y


def stereo(x, pan=0.0, width=0.0, seed=0):
    x = np.asarray(x, dtype=np.float32)
    if x.ndim == 2: return x
    l, r = math.cos((pan + 1) * math.pi / 4), math.sin((pan + 1) * math.pi / 4)
    out = np.stack([x * l, x * r], axis=1) * math.sqrt(2)
    if width > 0:  # decorrelate with a short Haas offset
        d = int(0.011 * SR); out[d:, 1] = out[d:, 1] * (1 - width) + x[:-d] * width * r * math.sqrt(2)
    return out


def sat(x, drive=2.0):
    return np.tanh(x * drive) / np.tanh(drive)


def saw(f, n, phase=0.0):
    ph = (np.cumsum(np.full(n, f) if np.isscalar(f) else f) / SR + phase) % 1.0
    return 2 * ph - 1


def sine(f, n, phase=0.0):
    ph = np.cumsum(np.full(n, f) if np.isscalar(f) else f) / SR
    return np.sin(2 * math.pi * (ph + phase))


# ───────────────────────── loading (ffmpeg decodes wav/ogg/opus) ─────────────────────────
@functools.lru_cache(maxsize=512)
def load(path: str) -> np.ndarray:
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"], stdout=subprocess.PIPE, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).copy()


@functools.lru_cache(maxsize=1)
def kit_index():
    d = json.load(open(f"{KIT}/sounds.json"))["sounds"]
    return {s["id"]: s for s in d}


def kit(id_: str):
    s = kit_index()[id_]
    return load(f"{KIT}/{s['file']}"), s["sync"]["at"]


def meta_sfx(stem: str):
    p = f"{META}/corpora/oculus-audio-pack/ogg/{stem}.ogg"
    return load(p)


def piano(note, vel=3):
    m = midi(note) if isinstance(note, str) else note
    names = ["C", "Cs", "D", "Ds", "E", "F", "Fs", "G", "Gs", "A", "As", "B"]
    nm = f"{names[m % 12]}{m // 12 - 1}"
    return load(f"{META}/systems/instruments/meta-piano/ogg/INSPiano_Vel0{vel}_{nm}_01.ogg")


def guitar(note, vel=2, kind="nylon"):
    m = midi(note) if isinstance(note, str) else note
    names = ["C", "Cs", "D", "Ds", "E", "F", "Fs", "G", "Gs", "A", "As", "B"]
    nm = f"{names[m % 12]}{m // 12 - 1}"
    base = f"{META}/systems/instruments/meta-{kind}-guitar/ogg"
    for f in sorted(os.listdir(base)):
        if f.endswith(f"_{nm}_01.ogg") and (f"Vel0{vel}" in f):
            return load(f"{base}/{f}")
    for f in sorted(os.listdir(base)):
        if f.endswith(f"_{nm}_01.ogg"): return load(f"{base}/{f}")
    raise FileNotFoundError(nm)


def rate_change(x, rate):
    if abs(rate - 1) < 1e-4: return x
    n = int(len(x) / rate); idx = np.arange(n) * rate
    return np.stack([np.interp(idx, np.arange(len(x)), x[:, c]) for c in range(x.shape[1])], axis=1).astype(np.float32)


# ───────────────────────── drums & percussion (synth) ─────────────────────────
def kick(kind="house", seed=0):
    n = int(0.5 * SR)
    if kind == "808":
        f = 52 + 120 * np.exp(-np.arange(n) / (0.03 * SR)); a = exp_env(n, 0.45); click = 0.5
    elif kind == "afro":
        f = 58 + 140 * np.exp(-np.arange(n) / (0.022 * SR)); a = exp_env(n, 0.16); click = 0.7
    elif kind == "trailer":
        n = int(1.4 * SR); f = 38 + 90 * np.exp(-np.arange(n) / (0.06 * SR)); a = exp_env(n, 0.55); click = 0.9
    else:
        f = 50 + 150 * np.exp(-np.arange(n) / (0.025 * SR)); a = exp_env(n, 0.22); click = 0.6
    body = sine(f, len(a)) * a
    c = hp(rng(seed).standard_normal(int(0.006 * SR)), 2500) * click * np.linspace(1, 0, int(0.006 * SR))
    body[: len(c)] += c
    return sat(body, 1.8) * 0.95


def clap(seed=0):
    r = rng(seed); n = int(0.35 * SR); x = np.zeros(n)
    for k, off in enumerate([0, 0.011, 0.022, 0.031]):
        s = int(off * SR); m = int((0.012 if k < 3 else 0.3) * SR)
        x[s:s + m] += r.standard_normal(m) * (exp_env(m, 0.004 if k < 3 else 0.06))
    return bp(x, 900, 2600) * 1.6


def snare(seed=0, tone=190):
    r = rng(seed); n = int(0.25 * SR)
    noise = bp(r.standard_normal(n), 1500, 7000) * exp_env(n, 0.05)
    body = sine(tone * (1 + 0.3 * exp_env(n, 0.01)), n) * exp_env(n, 0.04)
    return noise * 0.8 + body * 0.6


def rim(seed=0):
    n = int(0.06 * SR); x = sine(1700, n) * exp_env(n, 0.006) + bp(rng(seed).standard_normal(n), 2000, 5000) * exp_env(n, 0.004) * 0.5
    return x


def hat(open_=False, seed=0):
    n = int((0.35 if open_ else 0.05) * SR)
    fs = [205.3, 304.4, 369.6, 522.7, 540.0, 800.0]
    x = sum(np.sign(sine(f * 4.1, n)) for f in fs) / len(fs) + rng(seed).standard_normal(n) * 0.4
    return hp(x, 7500, 4) * exp_env(n, 0.12 if open_ else 0.012) * 0.7


def shaker(seed=0, accent=1.0):
    n = int(0.07 * SR); r = rng(seed)
    e = np.concatenate([np.linspace(0, 1, int(0.012 * SR)), np.exp(-np.arange(n - int(0.012 * SR)) / (0.018 * SR))])
    return bp(r.standard_normal(n), 4500, 12000) * e * 0.5 * accent


def conga(pitch=220, slap=False, seed=0):
    n = int(0.35 * SR)
    f = pitch * (1 + 0.25 * exp_env(n, 0.012))
    body = sine(f, n) * exp_env(n, 0.09 if not slap else 0.05)
    s = bp(rng(seed).standard_normal(n), 1200, 5000) * exp_env(n, 0.01) * (0.8 if slap else 0.25)
    return sat(body + s, 1.3) * 0.8


def log_drum(note, seed=0, length=0.7):
    """Amapiano log drum: punchy pitched sine/tri with downward glide, overdrive and a woody click."""
    n = int(length * SR); f0 = hz(note)
    f = f0 * (1 + 0.6 * exp_env(n, 0.018))
    x = sine(f, n) * 0.8 + (2 * np.abs(saw(f, n)) - 1) * 0.25
    x = sat(x * exp_env(n, length * 0.45), 2.6)
    click = bp(rng(seed).standard_normal(int(0.01 * SR)), 800, 3000) * np.linspace(1, 0, int(0.01 * SR)) * 0.4
    x[: len(click)] += click
    return lp(x, 1800) * 0.9


def tom(pitch=110, seed=0):
    n = int(0.6 * SR); f = pitch * (1 + 0.5 * exp_env(n, 0.03))
    return sat(sine(f, n) * exp_env(n, 0.2) + bp(rng(seed).standard_normal(n), 300, 3000) * exp_env(n, 0.02) * 0.3, 1.5)


def crash(seed=0, length=2.2):
    n = int(length * SR); r = rng(seed)
    return hp(r.standard_normal(n), 3500) * exp_env(n, length * 0.3) * 0.45


# ───────────────────────── tonal instruments (synth) ─────────────────────────
def sub(note, length, glide_from=None):
    n = int(length * SR); f0 = hz(note)
    f = np.full(n, f0) if glide_from is None else f0 * (hz(glide_from) / f0) ** exp_env(n, 0.03)
    x = sine(f, n) + 0.25 * sine(f * 2, n)
    return sat(x, 1.4) * env_adsr(n, 0.004, 0.08, 0.85, 0.06, hold=length - 0.15) * 0.8


def mallet(note, kind="marimba", length=1.2):
    n = int(length * SR); f = hz(note)
    parts = {"marimba": [(1, 1, 0.5), (3.93, 0.35, 0.12), (9.2, 0.12, 0.04)], "kalimba": [(1, 1, 0.9), (5.4, 0.25, 0.15), (9.5, 0.12, 0.06)],
             "bell": [(1, 1, 1.6), (2.756, 0.5, 0.9), (5.404, 0.3, 0.4), (8.9, 0.12, 0.2)]}[kind]
    x = sum(a * sine(f * k, n) * exp_env(n, d) for k, a, d in parts)
    att = np.minimum(1, np.arange(n) / (0.0015 * SR))
    return x * att * 0.5


def pluck(note, length=1.0, bright=0.6, seed=0):
    """Karplus–Strong."""
    f = hz(note); N = max(2, int(SR / f)); n = int(length * SR)
    buf = rng(seed).uniform(-1, 1, N); buf = lp(buf, 1500 + 8000 * bright, 1)
    out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % N]
        buf[i % N] = 0.5 * (buf[i % N] + buf[(i + 1) % N]) * 0.996
    return out * 0.6


def supersaw(notes, length, cutoff=1800, attack=0.4, release=0.8, voices=5, detune=0.012):
    n = int((length + release) * SR); x = np.zeros(n)
    for nt in notes:
        f = hz(nt)
        for v in range(voices):
            d = (v - (voices - 1) / 2) * detune
            x += saw(f * (1 + d), n, phase=(v * 0.37) % 1)
    x = lp(x / (len(notes) * voices), cutoff, 2)
    return x * env_adsr(n, attack, 0.2, 0.8, release, hold=max(0, length - attack - 0.2))


def brass(notes, length, seed=0):
    n = int((length + 0.3) * SR); x = np.zeros(n)
    for nt in notes:
        f = hz(nt)
        for d in (-0.006, 0, 0.007): x += saw(f * (1 + d), n)
    x /= len(notes) * 3
    cut = 400 + 3800 * env_adsr(n, 0.03, 0.25, 0.35, 0.3, hold=length - 0.3)
    y = sweep_filter(x, 400, 400, kind="low", q=0.8) if False else x
    # manual env filter: blockwise lowpass following `cut`
    out = np.zeros(n); zi = None
    for i in range(0, n, 256):
        b, a = signal.butter(2, min(cut[i], 18000) / (SR / 2), "low")
        if zi is None: zi = signal.lfilter_zi(b, a) * 0
        seg, zi = signal.lfilter(b, a, y[i:i + 256], zi=zi); out[i:i + 256] = seg
    return sat(out * env_adsr(n, 0.02, 0.1, 0.9, 0.3, hold=length - 0.1), 1.6) * 0.7


def braam(root="D1", length=2.6, seed=0):
    n = int(length * SR); f0 = hz(root)
    drop = np.concatenate([np.full(int(0.15 * SR), 1.0), np.linspace(1, 0.94, n - int(0.15 * SR))])
    x = np.zeros(n)
    for mult, g in ((1, 1), (2, 0.6), (3, 0.3), (1.5, 0.35)):
        for d in (-0.008, 0, 0.009): x += saw(f0 * mult * drop * (1 + d), n) * g
    x = sat(lp(x / 9, 900, 2) * 2.5, 2.5)
    return x * env_adsr(n, 0.01, 0.4, 0.7, 1.2, hold=length - 1.7) * 0.8


# ───────────────────────── designed FX (synth) ─────────────────────────
def riser(length=2.0, seed=0, f0=300, f1=9000):
    n = int(length * SR); x = rng(seed).standard_normal(n)
    y = sweep_filter(x, f0, f1, "band", q=3.0, curve=1.6) * np.linspace(0.05, 1, n) ** 1.5
    tone = saw(np.geomspace(110, 880, n), n) * np.linspace(0, 0.25, n) ** 2
    return (y * 1.8 + lp(tone, 4000)) * 0.6


def shepard(length=3.0, base=55.0, seed=0):
    n = int(length * SR); t = np.arange(n) / SR; out = np.zeros(n); oct_n = 6
    for k in range(oct_n):
        pos = (k + t / length) % oct_n
        f = base * 2 ** pos; amp = np.exp(-((pos - oct_n / 2) ** 2) / 2.2)
        out += np.sin(2 * math.pi * np.cumsum(f) / SR) * amp
    return lp(out / 3, 6000) * np.linspace(0.1, 1, n)


def downlifter(length=1.5, seed=0):
    n = int(length * SR)
    return sweep_filter(rng(seed).standard_normal(n), 8000, 200, "band", q=2.5, curve=0.6) * np.linspace(1, 0, n) ** 1.2 * 1.5


def impact(seed=0, size=1.0):
    n = int(2.0 * SR)
    boom = sine(30 + 70 * exp_env(n, 0.05), n) * exp_env(n, 0.5 * size)
    crack = hp(rng(seed).standard_normal(n), 1500) * exp_env(n, 0.03) * 0.6
    body = lp(rng(seed + 1).standard_normal(n), 400) * exp_env(n, 0.25) * 1.2
    return sat(boom * 1.2 + crack + body, 2.0) * 0.8


def whoosh(length=0.6, seed=0, f0=400, f1=3500):
    n = int(length * SR); x = rng(seed).standard_normal(n)
    e = np.sin(np.linspace(0, math.pi, n)) ** 2
    return sweep_filter(x, f0, f1, "band", q=1.6, curve=1.0) * e * 1.6


def sizzle(length=3.0, seed=0, density=180):
    """Grill sizzle: hissing fry bed + random fat pops."""
    n = int(length * SR); r = rng(seed)
    bed = bp(r.standard_normal(n), 3000, 11000) * (0.25 + 0.15 * lp(r.standard_normal(n), 3) * 8)
    pops = np.zeros(n)
    for _ in range(int(density * length)):
        i = r.integers(0, n - 400); m = r.integers(40, 300)
        pops[i:i + m] += r.standard_normal(m) * np.exp(-np.arange(m) / (m * 0.25)) * r.uniform(0.2, 1.2)
    return (bed + hp(pops, 1200) * 0.7) * 0.45


def neon_buzz(length=2.0, seed=0, flicker_until=0.8):
    n = int(length * SR); t = np.arange(n) / SR; r = rng(seed)
    hum = saw(100, n) * 0.25 + sine(200, n) * 0.2 + sine(300, n) * 0.1
    hum = bp(hum, 90, 2500)
    gate = np.ones(n)
    k = int(flicker_until * SR); fl = (r.random(k // 400 + 1) > 0.45).repeat(400)[:k]
    gate[:k] = lp(fl.astype(float), 600, 1)
    zaps = np.zeros(n)
    for i in np.nonzero(np.diff(fl.astype(int)) > 0)[0]:
        m = 900; zaps[i:i + m] += bp(r.standard_normal(m), 2000, 9000) * np.exp(-np.arange(m) / 200)
    return (hum * gate + zaps * 0.6) * 0.6


def crowd(length=4.0, seed=0):
    """Distant festival crowd wash: many band-limited 'voices' with slow random swells."""
    n = int(length * SR); r = rng(seed); x = np.zeros(n)
    for v in range(14):
        f = r.uniform(250, 900); src = bp(r.standard_normal(n), f, f * 2.2)
        amp = lp(r.standard_normal(n), 2.5) * 30; x += src * np.clip(amp, 0, None)
    return lp(x, 3500) * 0.08


def tape_stop(x, t0, length):
    """Slow the given stem to a halt starting at t0 (seconds)."""
    s = int(t0 * SR); n = int(length * SR)
    rate = np.linspace(1, 0, n) ** 1.3; pos = s + np.cumsum(rate)
    seg = np.stack([np.interp(pos, np.arange(len(x)), x[:, c]) for c in range(2)], axis=1) * np.linspace(1, 0.0, n)[:, None]
    y = x.copy(); y[s:s + n] = seg; y[s + n:] = 0
    return y


# ───────────────────────── session ─────────────────────────
class Session:
    def __init__(self, duration, bpm, offset=0.0, seed=1):
        self.n = int((duration + 1.5) * SR); self.dur = duration; self.bpm = bpm; self.offset = offset
        self.buses = {k: np.zeros((self.n, 2), np.float32) for k in ("drums", "bass", "music", "sfx", "amb", "logo")}
        self.r = rng(seed); self.kick_marks = []; self.log = []

    def beat(self, b):
        return self.offset + b * 60 / self.bpm

    def add(self, bus, x, t, gain_db=0.0, pan=0.0, width=0.0, human=0.0):
        if human: t += self.r.normal(0, human)
        x = stereo(x, pan, width) * db(gain_db)
        s = int(round(t * SR))
        if s < 0: x = x[-s:]; s = 0
        e = min(self.n, s + len(x))
        if e > s: self.buses[bus][s:e] += x[: e - s]

    def place_spot(self, spot, designs, default_gain=-4.0):
        """Place a picture-spotted sound by its own sync point (sfx-kit rule: start = moment − sync.at)."""
        kind, _, name = spot["id"].partition(":")
        g = default_gain + spot.get("gain", 0); rate = spot.get("rate", 1)
        if kind == "kit":
            x, at = kit(name); x = rate_change(x, rate); at /= rate
        elif kind == "meta":
            x, at = meta_sfx(name), 0.0
        elif kind == "syn":
            x, at = designs[name](spot)
        else:
            raise ValueError(spot["id"])
        bus = "logo" if name == "sonic-logo" else "sfx"
        self.add(bus, x, spot["t"] - at, g, spot.get("pan", 0))
        self.log.append({"t": spot["t"], "id": spot["id"], "gain_db": g, "rate": rate})

    # ── mix
    def mix(self, music_fx=None, duck_db=5.0, pump_db=0.0, reverb_room=0.35, out=None, fade=0.5):
        B = self.buses
        rv = pb.Pedalboard([pb.Reverb(room_size=reverb_room, damping=0.5, wet_level=1.0, dry_level=0.0, width=1.0)])
        hall = rv(B["music"].T.astype(np.float32), SR).T
        drums = pb.Pedalboard([pb.HighpassFilter(30), pb.Compressor(threshold_db=-14, ratio=3, attack_ms=8, release_ms=90), pb.Gain(1.5)])(B["drums"].T.copy(), SR).T
        bass = pb.Pedalboard([pb.HighpassFilter(28), pb.LowpassFilter(5000), pb.Compressor(threshold_db=-16, ratio=4, attack_ms=5, release_ms=120)])(B["bass"].T.copy(), SR).T
        music = pb.Pedalboard([pb.HighpassFilter(140), pb.Compressor(threshold_db=-18, ratio=2.5, attack_ms=15, release_ms=150)])(B["music"].T.copy(), SR).T + hall * 0.22
        if music_fx: music, bass, drums = music_fx(music, bass, drums)
        # kick pump on bass + music (genre sidechain)
        if pump_db and self.kick_marks:
            g = np.ones(self.n)
            for k in self.kick_marks:
                s = int(k * SR); m = min(self.n - s, int(0.22 * SR))
                if m > 0: g[s:s + m] = np.minimum(g[s:s + m], 1 - (1 - db(-pump_db)) * np.exp(-np.arange(m) / (0.07 * SR)))
            music *= g[:, None]; bass *= g[:, None]
        sfx = pb.Pedalboard([pb.HighpassFilter(25), pb.Compressor(threshold_db=-12, ratio=2, attack_ms=3, release_ms=80)])(B["sfx"].T.copy(), SR).T
        sfx_rv = pb.Pedalboard([pb.Reverb(room_size=0.5, wet_level=1.0, dry_level=0.0)])(B["sfx"].T.copy(), SR).T * 0.12
        # SFX ducks the music bed (envelope follower) so every hit reads
        envf = lp(np.abs(B["sfx"]).max(axis=1), 12, 1)
        duck = 1 - np.clip(envf / (np.percentile(envf, 99) + 1e-6), 0, 1) * (1 - db(-duck_db))
        bed = (music + bass + drums * 0.0) * duck[:, None] + drums * (0.5 + 0.5 * duck[:, None])
        logo = B["logo"] + pb.Pedalboard([pb.Reverb(room_size=0.7, wet_level=1.0, dry_level=0.0)])(B["logo"].T.copy(), SR).T * 0.3
        mix = bed + sfx + sfx_rv + B["amb"] + logo
        mix = pb.Pedalboard([pb.HighpassFilter(32), pb.LowpassFilter(17500), pb.Compressor(threshold_db=-16, ratio=2, attack_ms=12, release_ms=160)])(mix.T.astype(np.float32), SR).T
        n_out = int(self.dur * SR); mix = mix[:n_out]
        fn = int(fade * SR); mix[-fn:] *= np.linspace(1, 0, fn)[:, None] ** 1.5
        # loudness → -14 LUFS with a true-peak-aware look-ahead brick-wall at -1.5 dBFS (iterate to converge)
        meter = pyln.Meter(SR)
        for _ in range(4):
            L = meter.integrated_loudness(mix); mix = mix * db(-14.0 - L)
            mix = brickwall(mix, -2.6)
        self.stems = {"drums": drums[:n_out], "bass": bass[:n_out], "music": music[:n_out], "sfx": (sfx + sfx_rv)[:n_out], "amb": B["amb"][:n_out], "logo": logo[:n_out]}
        if out: write_wav(out, mix)
        return mix


def brickwall(x, ceiling_db=-1.5, look_ms=4.0, release_ms=80.0):
    """Look-ahead limiter with 4× oversampled peak detection (true-peak aware). No make-up gain."""
    c = db(ceiling_db)
    up = signal.resample_poly(x, 4, 1, axis=0)
    pk = np.abs(up).max(axis=1).reshape(-1, 4).max(axis=1)[: len(x)]
    pk = np.pad(pk, (0, len(x) - len(pk)), mode="edge")
    need = np.minimum(1.0, c / np.maximum(pk, 1e-9))
    la = max(1, int(look_ms * SR / 1000))
    from scipy.ndimage import minimum_filter1d
    g = minimum_filter1d(need, size=2 * la + 1, origin=0)
    # release smoothing (attack instant thanks to look-ahead window)
    a = math.exp(-1 / (release_ms * SR / 1000)); out = np.empty_like(g); cur = 1.0
    gl = g.tolist()
    for i, v in enumerate(gl):
        cur = v if v < cur else v + (cur - v) * a
        out[i] = cur
    return (x * out[:, None]).astype(np.float32)


def write_wav(path, x):
    x = np.clip(x, -1, 1)
    from scipy.io import wavfile
    wavfile.write(path, SR, (x * 32767).astype(np.int16))


def sonic_logo(timbre: str, t_hit: float):
    """Prohub mnemonic: G4 → C5 (on the hit) → E5+G5 bloom. Same melody, a new instrument per film."""
    pick = {"marimba": lambda n, L: mallet(n, "marimba", L), "kalimba": lambda n, L: mallet(n, "kalimba", L), "bell": lambda n, L: mallet(n, "bell", L),
            "piano": lambda n, L: piano(n, 3)[: int(L * SR)], "log": lambda n, L: log_drum(n, length=L), "brass": lambda n, L: brass([n], L)}[timbre]
    n = int(3.2 * SR); x = np.zeros((n, 2), np.float32)
    lead = 0.5
    def put(sig, at, g):
        s = stereo(sig) if np.ndim(sig) == 1 else sig; i = int(at * SR); e = min(n, i + len(s)); x[i:e] += s[: e - i] * db(g)
    put(pick("G4", 0.6), lead - 0.25, -3); put(pick("C5", 1.6), lead, 0)
    for nt in ("E5", "G5"): put(pick(nt, 2.4), lead + 0.18, -4)
    put(mallet("C6", "bell", 2.4), lead + 0.18, -12)
    put(whoosh(0.5, seed=9, f0=600, f1=6000) * 0.6, lead - 0.42, -8)
    put(sine(hz("C2"), int(0.6 * SR)) * exp_env(int(0.6 * SR), 0.18), lead, -6)
    return x, lead  # sync point = the C5 on the hit
