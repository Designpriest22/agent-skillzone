#!/usr/bin/env python3
"""
Destination Nigeria welcome sound ("sonic logo").

Fully original: every sound is synthesised from first principles in this
script (additive/modal synthesis, filtered noise and an algorithmic reverb).
No samples, recordings or third-party audio are used, so the output carries
no third-party licence. It does not imitate any specific cultural instrument.

Concept: three rising mallet notes trace the mountain ridge in the logo, then
land on a bright, sustained tone, the sun, over a warm swell and a soft pulse.

Requires: numpy, ffmpeg.  Run:  npm run audio:build
Outputs:  public/audio/welcome.mp3, public/audio/welcome.ogg
"""
import os
import subprocess
import tempfile
import wave

import numpy as np

SR = 44100
DUR = 4.4
N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(20261026)


def env_exp(start, decay, attack=0.004):
    e = np.zeros(N)
    i0 = int(start * SR)
    tt = t[i0:] - start
    a = np.clip(tt / attack, 0, 1)
    e[i0:] = a * np.exp(-tt / decay)
    return e


def mallet(freq, start, amp=1.0):
    """Modal mallet: inharmonic partials with fast-decaying upper modes."""
    out = np.zeros(N)
    for ratio, a, d in [(1.0, 1.0, 1.5), (3.93, 0.32, 0.45), (9.54, 0.1, 0.12), (2.0, 0.12, 0.9)]:
        out += a * np.sin(2 * np.pi * freq * ratio * t) * env_exp(start, d)
    # soft felt contact: a few ms of low-passed noise
    click = rng.standard_normal(N) * env_exp(start, 0.006, attack=0.0008)
    click = np.convolve(click, np.ones(12) / 12, mode="same")
    return amp * (out + 0.12 * click)


def pad(freqs, start, peak, end):
    """Warm additive pad with slow attack, gently detuned."""
    out = np.zeros(N)
    for fq in freqs:
        for det in (-0.12, 0.12):
            f0 = fq * (1 + det / 100 * 1.0)
            for h in range(1, 7):
                out += (1.0 / h**1.6) * np.sin(2 * np.pi * f0 * h * t + rng.random() * 6.28)
    e = np.zeros(N)
    i0, ip, ie = int(start * SR), int(peak * SR), int(end * SR)
    e[i0:ip] = np.linspace(0, 1, ip - i0) ** 2
    e[ip:ie] = np.linspace(1, 0, ie - ip) ** 1.5
    return out * e / (len(freqs) * 2)


def pulse(start, amp=1.0):
    """Soft low pulse: a sine with a falling pitch."""
    i0 = int(start * SR)
    tt = np.maximum(t - start, 0)
    f = 52 + 60 * np.exp(-tt / 0.05)
    ph = 2 * np.pi * np.cumsum(f) / SR
    e = env_exp(start, 0.28, attack=0.002)
    out = np.sin(ph) * e
    out[:i0] = 0
    return amp * out


def shaker(start, end, step, amp=0.018):
    out = np.zeros(N)
    noise = rng.standard_normal(N)
    hp = noise - np.convolve(noise, np.ones(6) / 6, mode="same")  # crude high-pass
    k = 0
    tt = start
    while tt < end:
        accent = 1.0 if k % 4 == 0 else 0.55
        out += hp * env_exp(tt, 0.035, attack=0.004) * accent
        tt += step
        k += 1
    return amp * out


def reverb(x, seconds=2.4, seed=1):
    r = np.random.default_rng(seed)
    n = int(SR * seconds)
    tt = np.arange(n) / SR
    ir = r.standard_normal(n) * np.exp(-tt / (seconds / 5.5))
    ir = np.convolve(ir, np.ones(4) / 4, mode="same")  # darken the tail
    ir[: int(0.012 * SR)] = 0  # pre-delay
    ir /= np.sqrt(np.sum(ir**2))
    size = 1 << int(np.ceil(np.log2(len(x) + n)))
    y = np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[: len(x)]
    return y


# A3  D4  E4  ->  A4 (+ D5 shimmer). D major pentatonic.
notes = [(220.0, 0.22, 0.8), (293.66, 0.52, 0.85), (329.63, 0.82, 0.9)]
dry = np.zeros(N)
for fq, st, a in notes:
    dry += mallet(fq, st, a)
dry += mallet(440.0, 1.22, 1.0)
dry += mallet(587.33, 1.22, 0.32)
dry += mallet(880.0, 1.24, 0.12)

swell = pad([146.83, 220.0, 369.99], 0.0, 1.5, DUR)  # D3 A3 F#4
low = pulse(0.2, 0.55) + pulse(1.2, 0.7)
shk = shaker(0.22, 1.2, 0.15)

left = 0.62 * dry + 0.22 * swell + 0.5 * low + shk
right = 0.62 * dry + 0.22 * swell + 0.5 * low + np.roll(shk, int(0.011 * SR))
wet_l = reverb(left, seed=11)
wet_r = reverb(right, seed=23)
mix_l = left + 0.32 * wet_l
mix_r = right + 0.32 * wet_r

# gentle fade-out and normalisation to -1 dBFS
fade = np.ones(N)
fs = int(0.9 * SR)
fade[-fs:] = np.linspace(1, 0, fs) ** 2
stereo = np.stack([mix_l * fade, mix_r * fade], axis=1)
stereo /= np.max(np.abs(stereo)) / (10 ** (-1 / 20))

root = os.path.join(os.path.dirname(__file__), "..", "public", "audio")
os.makedirs(root, exist_ok=True)
with tempfile.TemporaryDirectory() as tmp:
    wav = os.path.join(tmp, "welcome.wav")
    with wave.open(wav, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((stereo * 32767).astype("<i2").tobytes())
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-c:a", "libmp3lame", "-b:a", "128k", os.path.join(root, "welcome.mp3")], check=True)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-c:a", "libopus", "-b:a", "96k", os.path.join(root, "welcome.ogg")], check=True)

for name in ("welcome.mp3", "welcome.ogg"):
    print(name, os.path.getsize(os.path.join(root, name)), "bytes")
