"""Original 20 s score for the reel, 120 bpm, cut-locked to reel.html's scene list.  python3 score.py -> out/score.wav"""
import wave
import numpy as np
from scipy.signal import butter, sosfilt
SR, D, B = 48000, 20.0, 0.5
N = int(SR * D); rng = np.random.default_rng(3)
def env(n, a, d): x = np.arange(n) / SR; return np.minimum(1, x / a) * np.exp(-x / d)
def add(buf, x, at, g=1.0): i = int(at * SR); x = x[:max(0, N - i)]; buf[i:i + len(x)] += x * g
f = lambda x, k, c, o=2: sosfilt(butter(o, c, btype=k, fs=SR, output='sos'), x)
def kick(d=.18):
    t = np.arange(int(.5 * SR)) / SR; return np.tanh(2.2 * np.sin(2 * np.pi * np.cumsum(44 + 110 * np.exp(-t * 32)) / SR) * env(len(t), .001, d))
def noise(d, lo, hi, dec): x = f(rng.standard_normal(int(d * SR)), 'bandpass', [lo, hi]); return x * env(len(x), .001, dec)
def hat(): return noise(.05, 7000, 16000, .012)
def clap(): return noise(.25, 900, 3800, .07)
def hit():                                                           # cut slam
    x = noise(.6, 60, 9000, .18); k = kick(.3); x[:len(k)] += k * .8; return x
def sub(freq, d):
    t = np.arange(int(d * SR)) / SR; return np.tanh(1.6 * np.sin(2 * np.pi * freq * t)) * np.minimum(1, t / .01) * np.exp(-t / (d * .7))
def riser(d):
    t = np.arange(int(d * SR)) / SR; x = rng.standard_normal(len(t)); out = np.zeros(len(t)); seg = int(.02 * SR)
    for i in range(0, len(t), seg):
        p = i / len(t); c = 300 + 8000 * p ** 2
        out[i:i + seg] = f(x[i:i + seg + 2000], 'bandpass', [c * .7, c * 1.3])[:seg][: len(out[i:i + seg])] * p ** 1.6
    return out
drums = np.zeros(N); bass = np.zeros(N); fx = np.zeros(N)
ROOT = [41.2, 41.2, 49.0, 36.7]   # E1 E1 G1 D1, one per bar
def groove(a, b, full=True):
    s = a
    while s < b - 1e-6:
        beat = round(s / B, 3)
        if abs(beat - round(beat)) < 1e-3:
            add(drums, kick(), s, .9)
            if int(round(beat)) % 2 == 1: add(drums, clap(), s, .35)
            if full: add(bass, sub(ROOT[int(beat // 4) % 4], .42), s + .02, .55)
        add(drums, hat(), s + B / 4, .18)
        s += B / 2
# 0-2 title: one hit per word, then the groove
for k, at in enumerate((0, .5, 1.0)): add(fx, hit(), at, .55 + .1 * k)
add(fx, hit(), 1.5, .9)
groove(2, 7.5)
add(fx, riser(1.5), 6.0, .35)
add(fx, hit(), 7.5, .8); add(fx, noise(.5, 200, 2000, .3), 7.5, .3)     # 13 DEC slam, groove drops out
add(fx, kick(.5), 8.0, 1.0); add(fx, noise(1.2, 3000, 14000, .5), 8.0, .25)   # drop on the stage footage
groove(8, 15)
for at in (10, 12.5, 15): add(fx, hit(), at, .45)
groove(15, 17.5)
add(fx, riser(1.0), 16.5, .3)
add(fx, hit(), 18.0, 1.0); add(fx, sub(41.2, 1.6), 18.0, .7)          # logo lands; 17.5-18 is silence
mix = drums * .75 + bass * .7 + fx * .8
t = np.arange(N) / SR
mix[(t >= 17.5) & (t < 18.0)] = 0
mix *= np.minimum(1, (D - t) / .6)
mix = f(mix, 'highpass', 30)
mix = np.tanh(mix * 1.3); mix *= 10 ** (-1 / 20) / np.abs(mix).max()
with wave.open('out/score.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.stack([mix, mix], 1) * 32767).astype(np.int16).tobytes())
print('score ok')
