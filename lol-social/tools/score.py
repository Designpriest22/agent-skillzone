"""Original score for one motion post: 120 bpm, hits on each piece's key moments.
    python3 tools/score.py <id> <seconds> <out.wav>   (normalised to -14 LUFS)"""
import sys, wave, subprocess
import numpy as np
from scipy.signal import butter, sosfilt
cid, D, out = sys.argv[1], float(sys.argv[2]), sys.argv[3]
SR, B = 48000, .5; N = int(SR * D); rng = np.random.default_rng(len(cid))
HITS = {'f01-countdown': [2.6], 'f02-artist-teaser': [0, 3.0, 5.1], 'f03-how-to-buy': [.6, 2.2, 3.8], 'f04-abuja-are-you-ready': [.4, 1.0, 1.6, 2.2, 4.6]}.get(cid, [])
def env(n, a, d): x = np.arange(n) / SR; return np.minimum(1, x / a) * np.exp(-x / d)
def add(buf, x, at, g=1.0): i = int(at * SR); x = x[:max(0, N - i)]; buf[i:i + len(x)] += x * g
f = lambda x, k, c: sosfilt(butter(2, c, btype=k, fs=SR, output='sos'), x)
def kick(d=.18): t = np.arange(int(.5 * SR)) / SR; return np.tanh(2 * np.sin(2 * np.pi * np.cumsum(46 + 105 * np.exp(-t * 30)) / SR) * env(len(t), .001, d))
def nz(d, lo, hi, dec): x = f(rng.standard_normal(int(d * SR)), 'bandpass', [lo, hi]); return x * env(len(x), .001, dec)
def logd(fr): t = np.arange(int(.3 * SR)) / SR; ph = 2 * np.pi * np.cumsum(fr * (1 + .6 * np.exp(-t * 40))) / SR; return np.tanh(1.8 * (np.sin(ph) + .3 * np.sin(2 * ph)) * env(len(t), .002, .11))
def hit(): x = nz(.7, 60, 9000, .2); k = kick(.3); x[:len(k)] += k * .8; return x
mix = np.zeros(N); s = 0.0; roots = [41.2, 41.2, 49.0, 36.7]
while s < D - 1e-6:   # amapiano-leaning groove: four on the floor, shaker, log drum
    q = round(s / (B / 4)) % 16
    if q % 4 == 0: add(mix, kick(), s, .8)
    if q in (4, 12): add(mix, nz(.25, 900, 3600, .07), s, .3)
    add(mix, nz(.06, 6500, 15000, .018 if q % 2 else .01), s, .16)
    if q in (0, 3, 6, 10, 11, 14): add(mix, logd(roots[int(s // 2) % 4] * 2), s, .32)
    s += B / 4
for h in HITS: add(mix, hit(), h, .7)
t = np.arange(N) / SR; mix *= np.minimum(1, t / .05) * np.minimum(1, (D - t) / .5)
mix = np.tanh(f(mix, 'highpass', 30) * 1.2); mix *= 10 ** (-1 / 20) / np.abs(mix).max()
raw = out + '.raw.wav'
with wave.open(raw, 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.stack([mix, mix], 1) * 32767).astype(np.int16).tobytes())
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', raw, '-af', 'loudnorm=I=-14:TP=-1.0', '-ar', '48000', out], check=True)
import os; os.remove(raw)
