"""Destination Nigeria sonic identity — original composition, fully synthesised (no samples).

Instruments are modelled in code:
  dùndún-style talking drum (pitch-gliding membrane), thumb piano (lamellophone tines),
  shekere-style shaker (band-passed noise), bell, warm pad, sub bass, low drum.
Key: D major pentatonic. Outputs 48 kHz / 24-bit WAV masters + 320 kbps MP3 in 08_SONIC_IDENTITY.
Run: python3 sonic.py   (needs numpy, scipy, ffmpeg)
"""
import subprocess
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile
from brand import KIT

SR = 48000
OUT = KIT / "08_SONIC_IDENTITY"
OUT.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(2026)

N = {"D2": 73.42, "G1": 49.0, "A1": 55.0, "B1": 61.74, "D3": 146.83, "F#3": 185.0, "G3": 196.0, "A3": 220.0, "B3": 246.94,
     "D4": 293.66, "E4": 329.63, "F#4": 369.99, "G4": 392.0, "A4": 440.0, "B4": 493.88, "D5": 587.33, "E5": 659.25,
     "F#5": 739.99, "A5": 880.0, "B5": 987.77, "D6": 1174.66}


def t_(d):
    return np.arange(int(d * SR)) / SR


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype="band", fs=SR, output="sos"), x)


def lp(x, hi, order=2):
    return sosfilt(butter(order, hi, btype="low", fs=SR, output="sos"), x)


def thumb_piano(f, d=1.6, vel=1.0):
    t = t_(d)
    env = np.exp(-t / 0.55)
    x = np.sin(2 * np.pi * f * t) * env
    x += 0.32 * np.sin(2 * np.pi * f * 6.27 * t) * np.exp(-t / 0.07)   # inharmonic tine partial
    x += 0.12 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t / 0.25)
    click = bp(rng.standard_normal(len(t)), 1800, 6000) * np.exp(-t / 0.004) * 0.25
    att = np.clip(t / 0.002, 0, 1)
    return (x + click) * att * vel


def talking_drum(f0, d=0.7, bend=0.4, vel=1.0, glide=0.25):
    """Pitch rises (bend>0) or falls (bend<0) as the player squeezes the tension cords."""
    t = t_(d)
    shape = np.clip(t / glide, 0, 1)
    shape = shape * shape * (3 - 2 * shape)
    f = f0 * (1 + bend * shape)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / 0.32) + 0.35 * np.sin(1.59 * ph) * np.exp(-t / 0.12)
    slap = bp(rng.standard_normal(len(t)), 400, 2500) * np.exp(-t / 0.012) * 0.5
    return np.tanh(1.4 * (body + slap)) * vel * 0.8


def low_drum(f0=78, d=1.2, vel=1.0):
    t = t_(d)
    f = f0 * (1 + 0.6 * np.exp(-t / 0.04))
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.tanh(1.8 * np.sin(ph) * np.exp(-t / 0.35)) * vel


def shaker(d=0.12, vel=1.0):
    t = t_(d)
    env = np.minimum(t / 0.015, 1) * np.exp(-np.maximum(t - 0.015, 0) / 0.035)
    return bp(rng.standard_normal(len(t)), 3500, 11000) * env * vel * 0.5


def bell(f, d=2.5, vel=1.0):
    t = t_(d)
    x = sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-t / tau) for m, a, tau in [(1, 1, 1.4), (2.76, .45, .5), (5.4, .25, .2), (8.93, .1, .08)])
    return x * np.clip(t / 0.001, 0, 1) * vel * 0.5


def pad(freqs, d, attack=1.0, release=1.5, bright=900, vel=1.0):
    t = t_(d)
    x = np.zeros_like(t)
    for f in freqs:
        for det in (-0.004, 0, 0.0045):
            ph = 2 * np.pi * f * (1 + det) * t + rng.uniform(0, 6.28)
            # soft saw (first 6 harmonics)
            x += sum(np.sin(k * ph) / k for k in range(1, 7)) * 0.18
    env = np.minimum(t / attack, 1) * np.clip((d - t) / release, 0, 1)
    return lp(x, bright, 2) * env * vel / max(len(freqs), 1)


def sub(f, d, vel=1.0):
    t = t_(d)
    env = np.minimum(t / 0.01, 1) * np.exp(-t / 1.6)
    return np.tanh(1.2 * np.sin(2 * np.pi * f * t)) * env * vel


class Mix:
    def __init__(self, dur):
        self.L = np.zeros(int(dur * SR) + SR * 4)
        self.R = np.zeros_like(self.L)
        self.verb = np.zeros((2, len(self.L)))
        self.dur = dur

    def add(self, x, at, pan=0.0, gain=1.0, send=0.25):
        i = int(at * SR)
        x = x.copy()
        k = min(len(x), int(0.03 * SR))
        x[-k:] *= np.linspace(1, 0, k) ** 2      # release taper: no clicks when a voice ends
        n = min(len(x), len(self.L) - i)
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        self.L[i:i + n] += x[:n] * l * gain
        self.R[i:i + n] += x[:n] * r * gain
        self.verb[0, i:i + n] += x[:n] * l * gain * send
        self.verb[1, i:i + n] += x[:n] * r * gain * send

    def render(self, rt=2.2, loop=False):
        n = int(rt * SR)
        tt = np.arange(n) / SR
        out = []
        for ch in range(2):
            ir = lp(rng.standard_normal(n), 5000) * np.exp(-tt * 6.9 / rt)
            ir[: int(.012 * SR)] = 0
            wet = np.fft.irfft(np.fft.rfft(self.verb[ch], len(self.verb[ch]) + n) * np.fft.rfft(ir, len(self.verb[ch]) + n))[: len(self.L)]
            out.append((self.L if ch == 0 else self.R) + wet * 0.12)
        y = np.stack(out, 1)
        if loop:   # fold the tail back onto the start → seamless loop
            L = int(self.dur * SR)
            tail = y[L:]
            y = y[:L].copy()
            y[: len(tail)] += tail[: L]
        else:
            # trim to duration + natural tail, then fade the last 150 ms
            L = int(self.dur * SR)
            y = y[:L]
            f = int(0.15 * SR)
            y[-f:] *= np.linspace(1, 0, f)[:, None]
        return y / (np.abs(y).max() + 1e-9) * 0.89


def export(y, stem, lufs=-16):
    raw = OUT / f"_{stem}_raw.wav"
    wavfile.write(raw, SR, y.astype(np.float32))
    wav = OUT / f"{stem}.wav"
    mp3 = OUT / f"{stem}.mp3"
    # two-pass linear loudness normalisation (keeps the dynamics and the loop seam intact)
    import json as _j
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(raw), "-af", f"loudnorm=I={lufs}:TP=-1.0:LRA=11:print_format=json",
                        "-f", "null", "-"], capture_output=True, text=True).stderr
    ms = _j.loads(r[r.rindex("{"):r.rindex("}") + 1])
    af = (f"loudnorm=I={lufs}:TP=-1.0:LRA=11:linear=true:measured_I={ms['input_i']}:measured_TP={ms['input_tp']}:"
          f"measured_LRA={ms['input_lra']}:measured_thresh={ms['input_thresh']}:offset={ms['target_offset']}")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw), "-af", af, "-ar", str(SR), "-c:a", "pcm_s24le", str(wav)], check=True)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-c:a", "libmp3lame", "-b:a", "320k",
                    "-metadata", "title=" + stem, "-metadata", "artist=Destination Nigeria",
                    "-metadata", "copyright=Original composition for Destination Nigeria", str(mp3)], check=True)
    raw.unlink()


# ------------------------------------------------------------------ 1. primary sonic logo (6.5 s)
def sonic_logo():
    m = Mix(6.5)
    m.add(pad([N["D3"], N["A3"]], 6.5, attack=1.4, bright=700), 0.0, 0, .55, .4)
    for k, tt in enumerate(np.arange(0.2, 1.9, 0.2)):          # shekere, 12/8 eighths, crescendo
        m.add(shaker(vel=.25 + .5 * k / 9 * (1.3 if k % 3 == 0 else 1)), tt, .35, 1, .15)
    m.add(talking_drum(140, .5, .45), 0.9, -.25, .9)              # "Ex-"
    m.add(talking_drum(172, .4, -.25), 1.15, -.25, .75)           # "-pe-"
    m.add(talking_drum(150, .9, .55, glide=.4), 1.4, -.25, .9)    # "-rience" (rising)
    m.add(low_drum(76), 1.9, 0, .7, .1)
    m.add(sub(N["D2"], 1.4), 1.9, 0, .45, 0)
    for f, tt, p in [("A4", 2.1, .3), ("B4", 2.35, .1), ("D5", 2.6, -.1), ("F#5", 2.95, -.25)]:  # ascent
        m.add(thumb_piano(N[f]), tt, p, .7, .35)
    # sun moment
    m.add(bell(N["A5"], 3.0), 3.3, .4, .5, .5)
    m.add(bell(N["D6"], 3.0), 3.33, -.4, .35, .5)
    m.add(thumb_piano(N["D5"], 2.5), 3.3, 0, .6, .4)
    m.add(thumb_piano(N["A5"], 2.5, .7), 3.31, .2, .5, .4)
    m.add(pad([N["D3"], N["A3"], N["E4"], N["F#4"]], 3.2, attack=.15, release=2.4, bright=1600), 3.3, 0, .8, .5)
    m.add(low_drum(70, 1.6), 3.3, 0, .9, .15)
    m.add(sub(N["D2"], 3.0), 3.3, 0, .6, 0)
    m.add(talking_drum(165, .8, -.3, .5, glide=.35), 3.95, -.3, .6)   # the drum answers, falling
    return m.render(2.6)


# ------------------------------------------------------------------ 2. sting (2.5 s)
def sting():
    m = Mix(2.5)
    m.add(talking_drum(150, .6, .5, glide=.3), 0.0, -.25, .9)
    for f, tt in [("D5", .25), ("F#5", .42), ("A5", .6)]:
        m.add(thumb_piano(N[f], 1.4), tt, .2, .7, .35)
    m.add(bell(N["D6"], 1.6), .85, .3, .45, .5)
    m.add(low_drum(72, 1.2), .85, 0, .85, .1)
    m.add(sub(N["D2"], 1.6), .85, 0, .55, 0)
    m.add(pad([N["D3"], N["A3"], N["F#4"]], 1.65, attack=.05, release=1.4, bright=1500), .85, 0, .7, .4)
    return m.render(1.8)


# ------------------------------------------------------------------ 3. intro bed (30 s seamless loop)
def bed():
    bar, eighth = 2.5, 2.5 / 12
    dur = 12 * bar
    m = Mix(dur)
    bellp = [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1]      # 12/8 standard bell pattern
    prog = [("D", ["D3", "A3", "F#4"], "D2"), ("Bm", ["B3", "D4", "F#4"], "B1"),
            ("G", ["G3", "B3", "D4"], "G1"), ("A", ["A3", "E4", "A4"], "A1")]
    arp = {"D": ["D4", "F#4", "A4", "D5"], "Bm": ["B3", "D4", "F#4", "B4"], "G": ["G4", "B4", "D5", "G4"], "A": ["A4", "E5", "A4", "E4"]}
    for b in range(12):
        t0 = b * bar
        name, chord, bass = prog[b % 4]
        fade_in = min(1, .35 + b * .2)
        m.add(pad([N[c] for c in chord], bar + .3, attack=.6, release=.6, bright=800), t0, 0, .35, .4)
        m.add(sub(N[bass] * 2 if N[bass] < 60 else N[bass], 1.2), t0, 0, .35 * fade_in, 0)
        m.add(sub(N[bass] * 2 if N[bass] < 60 else N[bass], .8), t0 + 6 * eighth, 0, .25 * fade_in, 0)
        for i in range(12):
            tt = t0 + i * eighth
            m.add(shaker(vel=.35 if i % 3 else .55), tt, .4, .7 * fade_in, .1)
            if bellp[i] and b >= 1:
                m.add(bell(N["E5"] * 1.5 if i % 2 else N["E5"] * 1.25, .3, .25), tt, -.45, .35, .15)
        for beat in (0, 6):
            m.add(low_drum(78, .8, .6), t0 + beat * eighth, 0, .6 * fade_in, .05)
        if b >= 2:
            notes = arp[name]
            for i, k in enumerate([0, 2, 3, 5, 6, 8, 9, 11]):
                m.add(thumb_piano(N[notes[i % 4]], 1.0, .45), t0 + k * eighth, .25 if i % 2 else -.1, .55, .3)
        if b % 2 == 1:   # talking drum phrase answering every two bars
            for k, (f0, bd, d) in enumerate([(145, .4, .35), (175, -.2, .3), (150, .5, .6)]):
                m.add(talking_drum(f0, d, bd, .8), t0 + (7 + k * 1.5) * eighth, -.3, .6)
    return m.render(2.0, loop=True)


if __name__ == "__main__":
    export(sonic_logo(), "DN_sonic-logo_primary_6-5s", -16)
    export(sting(), "DN_sonic-sting_2-5s", -16)
    export(bed(), "DN_sonic-intro-bed_30s_seamless-loop", -18)
    for f in sorted(OUT.glob("*.wav")):
        print(f.name, subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(f)],
                                     capture_output=True, text=True).stdout.strip())
