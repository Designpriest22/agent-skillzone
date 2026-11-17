"""Original 25 s score for velvet.html: late-night Afro-R&B in G minor at 96 bpm (ten bars of 2.5 s), opening like a curtain
going up. Rhodes Gm9-Ebmaj9-Cm9-D7b9, finger snaps, log drum, brass stabs on the big words, vinyl crackle, and foley for
the paper, the polaroids, the stamp and the ticket.   python3 velvet_score.py -> out/velvet-mix.wav"""
import wave
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
SR, D, BPM = 48000, 25.0, 96
BT = 60 / BPM; S16 = BT / 4; BAR = 4 * BT
N = int(SR * D); rng = np.random.default_rng(96)
t_all = np.arange(N) / SR
f = lambda x, k, c, o=2: sosfilt(butter(o, c, btype=k, fs=SR, output='sos'), x, axis=0)
def env(n, a, d): x = np.arange(n) / SR; return np.minimum(1, x / max(a, 1e-4)) * np.exp(-x / d)
def add(buf, x, at, g=1.0):
    i = int(round(at * SR))
    if i >= N or i + len(x) <= 0: return
    if i < 0: x = x[-i:]; i = 0
    x = x[:N - i]; buf[i:i + len(x)] += x * g
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
noise = lambda d, lo, hi, dec: (lambda x: x * env(len(x), .001, dec))(f(rng.standard_normal(int(d * SR)), 'bandpass', [lo, hi]))

CH = [[50, 53, 57, 58, 62], [51, 55, 58, 62, 65], [48, 51, 55, 58, 62], [50, 54, 57, 60, 63]]   # Gm9  Ebmaj9  Cm9  D7b9
ROOT = [31, 27, 36, 38]
chord = lambda s: CH[int(s // BAR) % 4]; root = lambda s: ROOT[int(s // BAR) % 4]

# ---- instruments ----
def rhodes(m, d=1.2, vel=1.0):
    t = np.arange(int(d * SR)) / SR; fc = hz(m); idx = 1.7 * vel * np.exp(-t * 5)
    x = np.sin(2 * np.pi * fc * t + idx * np.sin(2 * np.pi * fc * t)) + .22 * np.sin(4 * np.pi * fc * t) * np.exp(-t * 9)
    return x * env(len(t), .004, d * .5) * (1 + .15 * np.sin(2 * np.pi * 4 * t))
def ep(notes, d=1.0, vel=1.0): return sum(rhodes(m, d, vel) for m in notes) / len(notes) * 1.6
def pad(notes, d, att=.6):
    t = np.arange(int(d * SR)) / SR; x = 0
    for m in notes:
        for det in (-.1, 0, .09): x = x + 2 * ((hz(m + det) * t) % 1) - 1
    x = f(x / (len(notes) * 3), 'lowpass', 1600); return x * np.minimum(1, t / att) * np.minimum(1, (d - t) / .5)
def brass(notes, d=.45):                                          # synth brass stab: saw stack, the filter opens and shuts
    t = np.arange(int(d * SR)) / SR; x = 0
    for m in notes:
        for det in (-.07, .07): x = x + 2 * ((hz(m + det) * t) % 1) - 1
    x /= len(notes) * 2; out = np.zeros_like(x); seg = int(.01 * SR)
    for i in range(0, len(x), seg):
        c = 600 + 4200 * np.exp(-(i / SR) * 9); out[i:i + seg] = f(x[max(0, i - 2000):i + seg], 'lowpass', c)[-len(x[i:i + seg]):]
    return out * env(len(t), .012, d * .45) * 1.8
def pluck(freq, d=.7, bright=.55):
    n = int(d * SR); P = max(2, int(SR / freq)); y = np.zeros(n + P); y[:P] = f(rng.uniform(-1, 1, P), 'lowpass', 1500 + 6000 * bright) if P > 30 else rng.uniform(-1, 1, P)
    k = P
    while k < n + P:
        e = min(k + P, n + P); seg = y[k - P:e - P]; prev = np.concatenate(([y[k - P - 1] if k - P - 1 >= 0 else 0], seg[:-1])); y[k:e] = .996 * .5 * (seg + prev); k = e
    return y[P:] * env(n, .002, d * .5)
def sub(m, d):
    t = np.arange(int(d * SR)) / SR; return np.tanh(1.5 * np.sin(2 * np.pi * hz(m) * t)) * np.minimum(1, t / .01) * np.exp(-t / (d * .55))
def kick(d=.25, top=100):
    t = np.arange(int(.55 * SR)) / SR; return np.tanh(2.3 * np.sin(2 * np.pi * np.cumsum(46 + top * np.exp(-t * 28)) / SR) * env(len(t), .001, d))
def snap():                                                         # finger snap: a sharp click and a short papery body
    x = noise(.12, 1800, 7000, .022) * 1.5; c = noise(.01, 3000, 12000, .0015) * 3; x[:len(c)] += c; return x
def shaker(acc): return noise(.08, 4500, 14000, .016 + .01 * acc) * (1 + .5 * acc)
def logdrum(m, d=.45):
    t = np.arange(int(d * SR)) / SR; ph = 2 * np.pi * np.cumsum(hz(m) * (1 + .5 * np.exp(-t * 40))) / SR
    return np.tanh(2 * (np.sin(ph) + .3 * np.sin(2 * ph))) * env(len(t), .003, d * .4)
def talk(f0, bend, d=.3):
    t = np.arange(int(d * SR)) / SR; fr = f0 * (1 + bend * np.sin(np.pi * np.minimum(1, t / (d * .7))))
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * env(len(t), .002, d * .45) + noise(d, 300, 1500, .015)[:len(t)] * .3
def timp(d=.9, fr=65):
    t = np.arange(int(d * SR)) / SR; return np.sin(2 * np.pi * fr * (1 + .04 * np.exp(-t * 10)) * t) * env(len(t), .003, .45) + noise(d, 80, 600, .08)[:len(t)] * .4
def roll(d, fr=65):                                                # timpani roll, crescendo
    out = np.zeros(int(d * SR) + int(.9 * SR)); k = 0
    while k * .045 < d: add_(out, timp(.6, fr) * (.15 + .85 * (k * .045 / d) ** 2), k * .045 + rng.normal(0, .004)); k += 1
    return out
def add_(buf, x, at):
    i = max(0, int(at * SR)); x = x[:len(buf) - i]; buf[i:i + len(x)] += x
def hit(g=1.0):
    x = noise(.9, 50, 9000, .2); k = kick(.4, 140); x[:len(k)] += k * .9; return x * g
def riser(d, lo=300, hi=9000):
    n = int(d * SR); x = rng.standard_normal(n + 4000); out = np.zeros(n); seg = int(.015 * SR)
    for i in range(0, n, seg):
        p = i / n; c = lo + (hi - lo) * p ** 2; out[i:i + seg] = f(x[i:i + seg + 2000], 'bandpass', [c * .75, c * 1.25])[:len(out[i:i + seg])] * p ** 1.5
    return out
def scratch(d=.45):                                                # vinyl scratch: a pitched swirl, forward and back
    t = np.arange(int(d * SR)) / SR; sp = np.sin(np.pi * 2 * t / d * 1.5); ph = np.cumsum(300 + 900 * sp) / SR
    x = f(np.sign(np.sin(2 * np.pi * ph)) * .6 + rng.standard_normal(len(t)) * .4, 'bandpass', [400, 5000]); return x * np.abs(sp) * env(len(t), .005, d)
def shutter():
    a = noise(.03, 2000, 9000, .005) * 2; b = noise(.05, 800, 5000, .01) * 1.4; x = np.zeros(int(.12 * SR)); x[:len(a)] += a; x[int(.06 * SR):int(.06 * SR) + len(b)] += b; return x
def stamp():
    x = noise(.25, 60, 1800, .06) * 1.6; k = kick(.12, 70); x[:len(k[:len(x)])] += k[:len(x)] * 1.2; return x
def tear(d=.42):
    n = int(d * SR); x = f(rng.standard_normal(n), 'bandpass', [1200, 9000]); am = (rng.random(n // 120 + 1) ** 3).repeat(120)[:n]
    return x * am * np.sin(np.pi * np.arange(n) / n) ** .6 * 2.2
def slap():
    x = noise(.12, 150, 2500, .03) * 1.4; th = kick(.05, 60)[:len(x)] * .6; x[:len(th)] += th[:len(x)]; return x
def crackle():
    x = np.zeros(N); idx = rng.integers(0, N, 900); x[idx] = rng.standard_normal(900) * rng.random(900) ** 3 * 3
    return f(x, 'bandpass', [1000, 9000]) + f(rng.standard_normal(N), 'bandpass', [200, 2000]) * .01

drums, perc, bass, keys, gtr, padb, brs, fx = (np.zeros(N) for _ in range(8))
sw = lambda i: .02 if i % 2 else 0
hum = lambda: rng.normal(0, .004)

def groove(a, b, *, full=True, logs=True, keys_on=True):
    s = a; i = int(round(a / S16))
    while s < b - 1e-6:
        st = i % 16; tt = s + sw(i) + hum()
        if st in (0, 7, 10): add(drums, kick(), s, .85)
        if st in (4, 12): add(drums, snap(), tt, .75)
        if full: add(perc, shaker(st % 4 == 2), tt, .17)
        if full and st in (3, 11, 14): add(perc, talk(190 + 30 * (st == 14), .25, .18), tt, .18)
        if logs and st in (0, 3, 6, 10): add(bass, logdrum(root(s) + 12 + (7 if st == 6 else 0)), s + .01, .45)
        elif st in (0, 10): add(bass, sub(root(s) + 12, .6), s + .01, .5)
        if keys_on and st == 0 and int(round(s / BT)) % 4 == 0: add(keys, ep(chord(s), BAR * .95, .9), s + .01, .55)
        if keys_on and st in (6, 14): add(keys, ep(chord(s)[2:], .4, .6), tt, .3)
        s += S16; i += 1

# ---- arrangement ----
add(fx, crackle(), 0, .5)
# bar 1 · the curtain: timpani roll and a string swell up to the mark, snaps on "presents", Rhodes pick-up
add(fx, roll(.6, 49), 0, .55); add(padb, pad(CH[0], 2.6, 1.2), 0, .35)
add(fx, riser(.6, 1500, 9000), .02, .18); add(fx, hit(.8), BT); add(bass, sub(31, 1.2), BT, .55); add(fx, slap(), BT, .5)
for k in range(2): add(drums, snap(), 2 * BT + k * BT, .7)
add(fx, slap(), 1.25, .4)
for i, m in enumerate((62, 65, 69, 70)): add(gtr, pluck(hz(m), .9, .6), 1.875 + i * .15 + hum(), .4)
# bar 2 · the beat drops on the face; scratch as the wordmark is drawn on
add(fx, hit(1.0), BAR); add(fx, slap(), BAR + .2, .5)
groove(BAR, 2 * BAR); add(fx, scratch(.45), BAR + BT, .4)
# bar 3 · LIVE / in / ABUJA: a brass stab on each word
groove(2 * BAR, 3 * BAR)
for k, st in enumerate((0, 1, 2)):
    add(brs, brass([m + 12 for m in chord(2 * BAR)[1:4]] if k < 2 else [m + 12 for m in (50, 55, 58, 62)], .5), 2 * BAR + st * BT, .55); add(fx, slap(), 2 * BAR + st * BT, .4)
# bar 4 · polaroids: kick and snaps only, a shutter on every photo, the stamp lands hard
groove(3 * BAR, 4 * BAR, full=False, logs=False, keys_on=False); add(padb, pad(CH[3], BAR), 3 * BAR, .25)
for at in (3 * BAR, 3 * BAR + BT, 3 * BAR + 2 * BT, 3 * BAR + 3 * BT - .3): add(fx, shutter(), at, .7); add(fx, slap(), at + .02, .35)
add(fx, stamp(), 3 * BAR + 3 * BT, 1.0); add(brs, brass([62, 66, 69, 72], .6), 3 * BAR + 3 * BT, .5); add(fx, riser(.5), 4 * BAR - .5, .25)
# bar 5 · the date
add(fx, tear(), 4 * BAR - .22, .45); add(fx, hit(1.0), 4 * BAR); groove(4 * BAR, 5 * BAR)
for k, at in enumerate((4 * BAR + .15, 4 * BAR + BT, 4 * BAR + 2 * BT)):
    add(brs, brass([m + 12 for m in chord(4 * BAR)[k:k + 3]], .45), at, .5); add(fx, slap(), at, .4)
# bar 6 · the venue, talking-drum fill into the break
groove(5 * BAR, 6 * BAR)
for at in (5 * BAR + BT, 5 * BAR + 2 * BT, 5 * BAR + 3 * BT): add(fx, slap(), at, .45)
for i, (dt, f0, bd) in enumerate([(.0, 160, .5), (.15, 190, -.3), (.25, 170, .4), (.35, 210, .6)]): add(perc, talk(f0, bd, .22), 6 * BAR - .45 + dt, .5)
# bar 7 · break on the macro, then the flash brings everything back
add(keys, ep(CH[2], 2.0, 1.0), 6 * BAR, .6); add(padb, pad(CH[2], BAR), 6 * BAR, .3)
for i, m in enumerate((67, 70, 74, 72, 70, 67)): add(gtr, pluck(hz(m), .8, .65), 6 * BAR + .1 + i * .19 + hum(), .4)
add(fx, slap(), 6 * BAR + .2, .4); add(fx, riser(1.0), 6 * BAR + .25, .3)
add(fx, hit(1.2), 6 * BAR + 2 * BT); add(bass, sub(38, .9), 6 * BAR + 2 * BT, .55); add(brs, brass([62, 66, 69, 72], .6), 6 * BAR + 2 * BT, .55)
groove(6 * BAR + 2 * BT, 7 * BAR); add(fx, slap(), 6 * BAR + BT + .2, .4)
# bar 8 · the ticket: tear in, a slide, the stub ripped off
add(fx, tear(), 7 * BAR - .22, .45); groove(7 * BAR, 8 * BAR)
add(fx, noise(.4, 600, 4000, .15), 7 * BAR + .25, .35); add(fx, tear(.35), 7 * BAR + 3 * BT, .7)
# bar 9 · tickets: typing, marker swipe
groove(8 * BAR, 9 * BAR); add(fx, hit(.8), 8 * BAR); add(fx, slap(), 8 * BAR + .1, .4); add(fx, slap(), 8 * BAR + .5, .4)
for i in range(14): add(fx, noise(.03, 3000, 12000, .006) * 1.3, 8 * BAR + .6 + i * .06, .55)
add(fx, noise(.4, 800, 5000, .18), 8 * BAR + 1.6, .3); add(fx, riser(.5), 9 * BAR - .5, .25)
# bar 10 · the card: tear, brass, two beats of groove, then Gm9 rings out under the crowd-less hush
add(fx, tear(), 9 * BAR - .22, .45); add(fx, hit(1.2), 9 * BAR); add(brs, brass([62, 65, 69, 74], .9), 9 * BAR, .6)
for k, at in enumerate((9 * BAR, 9 * BAR + .45, 9 * BAR + .7)): add(fx, slap(), at + .02, .4)
groove(9 * BAR, 9 * BAR + 2 * BT); add(keys, ep(CH[0], 2.0, 1.0), 9 * BAR + 2 * BT, .6); add(padb, pad(CH[0], 1.3, .3), 9 * BAR + 2 * BT, .3)
add(fx, roll(.5, 49), D - .9, .3)
for i, m in enumerate([55, 58, 62, 65, 69]): add(gtr, pluck(hz(m), 1.4, .6), 9 * BAR + 2 * BT + i * .03, .3)

# ---- mix ----
def verb(x, secs=2.2, wet=.3):
    n = int(secs * SR); ir = rng.standard_normal(n) * np.exp(-np.arange(n) / SR * 3.2 / secs); ir = f(ir, 'lowpass', 5500); ir /= np.sqrt((ir ** 2).sum())
    return x + fftconvolve(x, ir)[:len(x)] * wet
kenv = np.abs(f(drums, 'lowpass', 120)); kenv = np.convolve(kenv, np.ones(int(.06 * SR)) / int(.06 * SR), 'same'); duck = 1 - .3 * np.clip(kenv / (kenv.max() + 1e-9) * 3, 0, 1)
dry = drums * .55 + perc * .8 + bass * .75 + fx * .45
wet = verb(keys * 1.5 + padb * 1.8 + gtr * 1.6 + brs * 1.1, 2.2, .38) * duck
L = dry + wet + verb(gtr, 1.0, .2) * .12; Rr = dry + wet * .94 - verb(gtr, 1.0, .2) * .12
mix = np.stack([L, Rr], 1)
mix *= np.minimum(1, (D - t_all) / .7)[:, None]
mix = f(mix, 'highpass', 28); mix = np.tanh(mix * 1.05); mix *= 10 ** (-1 / 20) / np.abs(mix).max()
with wave.open('out/velvet-mix.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype(np.int16).tobytes())
print('velvet mix ok')
