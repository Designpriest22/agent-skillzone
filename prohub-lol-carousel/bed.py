"""Original 6 s sound bed for each carousel slide (120 bpm). python3 bed.py -> out/bed.wav"""
import wave
import numpy as np
from scipy.signal import butter, sosfilt
SR, D = 48000, 6.0
N = int(SR * D); t = np.arange(N) / SR; rng = np.random.default_rng(5)
def env(n, a, d): x = np.arange(n) / SR; return np.minimum(1, x / a) * np.exp(-x / d)
def add(buf, x, at, g): i = int(at * SR); x = x[:max(0, N - i)]; buf[i:i + len(x)] += x * g
f = lambda x, k, c: sosfilt(butter(2, c, btype=k, fs=SR, output='sos'), x)
mix = np.zeros(N)
kt = np.arange(int(.45 * SR)) / SR
kick = np.sin(2 * np.pi * np.cumsum(46 + 95 * np.exp(-kt * 30)) / SR) * env(len(kt), .001, .16)
for b in np.arange(0, D, .5):
    add(mix, kick, b, .8)
    sh = f(rng.standard_normal(int(.06 * SR)), 'highpass', 6500); add(mix, sh * env(len(sh), .002, .02), b + .25, .25)
    if int(b * 2) % 4 == 2:
        cl = f(rng.standard_normal(int(.2 * SR)), 'bandpass', [900, 3500]); add(mix, cl * env(len(cl), .001, .06), b, .3)
pad = sum(np.sin(2 * np.pi * fr * t + k) * .2 / (1 + k * .4) for k, fr in enumerate([110, 220, 261.6, 329.6, 392, 493.9]))
mix += f(pad, 'lowpass', 1800) * np.minimum(1, t / 1.2) * .5
w = f(rng.standard_normal(int(.5 * SR)), 'bandpass', [800, 5000]); add(mix, w * np.sin(np.pi * np.arange(len(w)) / len(w)) ** 2, 0, .3)
mix *= np.minimum(1, (D - t) / .4)
mix = np.tanh(mix * 1.2); mix *= 10 ** (-3 / 20) / np.abs(mix).max()
with wave.open('out/bed.wav', 'wb') as wv:
    wv.setnchannels(2); wv.setsampwidth(2); wv.setframerate(SR); wv.writeframes((np.stack([mix, mix], 1) * 32767).astype(np.int16).tobytes())
print('bed ok')
