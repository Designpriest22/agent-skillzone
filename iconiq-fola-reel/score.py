"""Original 25 s score + live crowd bed, 120 bpm, cut-locked to reel.html.  python3 score.py -> out/mix.wav
Drums/bass/fx are synthesised here; the crowd is the event's own audio from clips/aud (git-ignored)."""
import wave
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile
SR, D, B = 48000, 25.0, 0.5
N = int(SR * D); rng = np.random.default_rng(16)
t_all = np.arange(N) / SR
def env(n, a, d): x = np.arange(n) / SR; return np.minimum(1, x / a) * np.exp(-x / d)
def add(buf, x, at, g=1.0):
    i = int(at * SR); x = x[:max(0, N - i)]; buf[i:i + len(x)] += x * g
f = lambda x, k, c, o=2: sosfilt(butter(o, c, btype=k, fs=SR, output='sos'), x, axis=0)
def kick(d=.2, top=120):
    t = np.arange(int(.6 * SR)) / SR; return np.tanh(2.4 * np.sin(2 * np.pi * np.cumsum(46 + top * np.exp(-t * 30)) / SR) * env(len(t), .001, d))
def noise(d, lo, hi, dec): x = f(rng.standard_normal(int(d * SR)), 'bandpass', [lo, hi]); return x * env(len(x), .001, dec)
def shaker(): return noise(.07, 5000, 15000, .02)
def clap(): return sum(np.pad(noise(.2, 900, 4000, .05), (int(k * .008 * SR), int(.05 * SR)))[:int(.25 * SR)] for k in range(3))
def rim(): return noise(.05, 1800, 5000, .01) * 1.4
def logdrum(freq, d=.35):                                     # the amapiano log drum: pitched, slides down, a bit of grit
    t = np.arange(int(d * SR)) / SR; ph = 2 * np.pi * np.cumsum(freq * (1 + .6 * np.exp(-t * 40))) / SR
    return np.tanh(2.0 * (np.sin(ph) + .25 * np.sin(2 * ph))) * env(len(t), .003, d * .45)
def hit(g=1.0):
    x = noise(.8, 50, 9000, .2); k = kick(.35, 160); x[:len(k)] += k * .9; return x * g
def sub(freq, d):
    t = np.arange(int(d * SR)) / SR; return np.tanh(1.8 * np.sin(2 * np.pi * freq * t)) * np.minimum(1, t / .008) * np.exp(-t / (d * .6))
def riser(d, lo=300, hi=9000):
    n = int(d * SR); x = rng.standard_normal(n + 4000); out = np.zeros(n); seg = int(.015 * SR)
    for i in range(0, n, seg):
        p = i / n; c = lo + (hi - lo) * p ** 2
        out[i:i + seg] = f(x[i:i + seg + 2000], 'bandpass', [c * .75, c * 1.25])[:len(out[i:i + seg])] * p ** 1.5
    return out
def whoosh(d=.45): return riser(d, 800, 6000)[::-1] * .8 + riser(d, 200, 3000)
def click(): return noise(.03, 3000, 12000, .006) * 1.3
drums = np.zeros(N); bass = np.zeros(N); fx = np.zeros(N)
LOG = [55, 55, 65.4, 49]          # A1 A1 C2 G1
def groove(a, b, full=True, logs=True):
    s = a
    while s < b - 1e-6:
        st = int(round((s - a) / (B / 4)))                    # 16th-note index inside the section
        if st % 4 == 0:
            add(drums, kick(), s, .85)
            if st % 8 == 4: add(drums, clap(), s, .4)
        if full and st % 2 == 1: add(drums, shaker(), s + .004 * rng.standard_normal(), .22)   # humanised timing
        if full and st % 16 in (3, 6, 11, 14): add(drums, rim(), s, .25)
        if logs and st % 16 in (0, 3, 6, 10, 12): add(bass, logdrum(LOG[int(s // 2) % 4] * (1.5 if st % 16 == 10 else 1)), s + .01, .5)
        s += B / 4
# 0-2: one slam per word
for at, g in ((0, .8), (.5, .7), (1.0, .95), (1.5, 1.0)): add(fx, hit(g), at); add(bass, sub(41, .45), at, .5)
add(fx, riser(.45, 2000, 10000), 1.55, .25)
groove(2, 5); add(fx, hit(.9), 2.0)
for at in (2.3, 2.8, 3.3): add(fx, noise(.15, 400, 4000, .04), at, .5)    # stamp thuds
# 5-6: countdown, pitched-up hits on the 8ths
for i, at in enumerate((5, 5.25, 5.5, 5.75)): add(fx, kick(.15, 160 + 80 * i), at, .9); add(fx, noise(.2, 1500 + 900 * i, 9000, .05), at, .4)
add(fx, riser(1.0), 5.0, .35)
add(fx, hit(1.2), 6.0); add(bass, sub(55, 1.0), 6.0, .7)
groove(6, 9.5)
add(fx, whoosh(.5), 9.0, .45)
# 9.5-11.5: half-time breakdown for the name
add(fx, hit(1.0), 9.5); add(bass, sub(41, 1.4), 9.5, .7)
for k in range(6): add(fx, noise(.06, 1000, 7000, .015), 9.88 + k * .07, .5)   # stepped wipe = scratches
for s in (10.5, 11.0): add(drums, kick(.25), s, .7)
add(fx, riser(.5), 11.0, .3)
groove(11.5, 14)
for at in (11.5, 12.25, 13.0): add(fx, hit(.6), at)
add(fx, hit(1.3), 14.0); add(bass, sub(41, 1.0), 14.0, .8)
for at in (14.5, 15.0): add(fx, hit(.5), at)
groove(14.5, 16, full=False, logs=False)
add(fx, riser(.5), 15.5, .3)
groove(16, 19); add(fx, hit(.9), 16.0)
for at in (16.6, 18.0): add(fx, whoosh(.35), at - .1, .35)
# 19-22: filtered groove, typing clicks, marker swipe
g = np.zeros(N); tmp_d, tmp_b = drums.copy(), bass.copy(); drums[:] = 0; bass[:] = 0
groove(19, 22); g = f(drums + bass, 'lowpass', 900); drums[:] = tmp_d; bass[:] = tmp_b; drums += g * 1.1
for i in range(14): add(fx, click(), 19.55 + i * .065, .7)
add(fx, noise(.45, 800, 5000, .2), 20.75, .35)
add(fx, whoosh(.55), 21.6, .5)
# 22-25: the card lands, groove plays out
add(fx, hit(1.3), 22.0); add(bass, sub(55, 2.2), 22.0, .7)
groove(22.5, 25)
music = drums * .8 + bass * .75 + fx * .75
# crowd: the event's own audio, hi-passed so it sits behind the score
def load(n):
    sr, x = wavfile.read(f'clips/aud/{n}.wav'); x = x.astype(float) / 32768; return f(x, 'highpass', 180)
crowd = np.zeros((N, 2))
def place(n, at, g, fade=.08):
    x = load(n); i = int(at * SR); x = x[:N - i].copy(); r = int(fade * SR)
    x[:r] *= np.linspace(0, 1, r)[:, None]; x[-r:] *= np.linspace(1, 0, r)[:, None]; crowd[i:i + len(x)] += x * g
place('bed', 0, .18, .5); place('bed', 12, .18, .5)
place('pyro', 2.0, .55); place('hand', 6.0, .6); place('red', 11.5, .5); place('trip', 16.0, .5)
bed2 = load('bed')[:int(3 * SR)]; crowd[int(22 * SR):int(25 * SR)] += bed2[:N - int(22 * SR)] * .35
mix = np.stack([music, music], 1) * 1.0 + crowd
mix *= np.minimum(1, (D - t_all) / .5)[:, None]
mix = f(mix, 'highpass', 28)
mix = np.tanh(mix * 1.0); mix *= 10 ** (-1 / 20) / np.abs(mix).max()
with wave.open('out/mix.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype(np.int16).tobytes())
print('mix ok')
