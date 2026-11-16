"""Original 25 s score for the reel, written for FOLA's sound: warm Afro-R&B in E-flat major (the key his live set sits in on
the source clips), highlife guitar plucks, Rhodes chords, congas, talking drum and log drum, with the event's own crowd and
live audio woven in. 120 bpm, cut-locked to reel.html.   python3 score.py -> out/mix.wav"""
import wave
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile
SR, D, BPM = 48000, 25.0, 120
B = 60 / BPM; S16 = B / 4
N = int(SR * D); rng = np.random.default_rng(16)
t_all = np.arange(N) / SR
f = lambda x, k, c, o=2: sosfilt(butter(o, c, btype=k, fs=SR, output='sos'), x, axis=0)
def env(n, a, d): x = np.arange(n) / SR; return np.minimum(1, x / max(a, 1e-4)) * np.exp(-x / d)
def mk(): return np.zeros(N)
def add(buf, x, at, g=1.0):
    i = int(round(at * SR));
    if i >= N: return
    x = x[:N - i]; buf[i:i + len(x)] += x * g
hz = lambda m: 440 * 2 ** ((m - 69) / 12)

# ---------- harmony: Ebmaj9 – Cm9 – Abmaj9 – Bb7sus4, one chord per bar (2 s) ----------
CH = [[51, 55, 58, 62, 65], [48, 55, 58, 62, 63], [44, 51, 55, 60, 63], [46, 53, 56, 60, 63]]   # midi voicings
ROOT = [39, 36, 32, 34]                                                                         # Eb1 C1 Ab0 Bb0 (+12 for sub)
chord = lambda s: CH[int(s // 2) % 4]; root = lambda s: ROOT[int(s // 2) % 4]

# ---------- instruments ----------
def pluck(freq, d=.7, bright=.55, g=1.0):                       # Karplus-Strong guitar, computed a period at a time
    n = int(d * SR); P = max(2, int(SR / freq)); y = np.zeros(n + P)
    y[:P] = f(rng.uniform(-1, 1, P), 'lowpass', 1500 + 6000 * bright) if P > 30 else rng.uniform(-1, 1, P)
    k = P
    while k < n + P:
        e = min(k + P, n + P); seg = y[k - P:e - P]; prev = np.concatenate(([y[k - P - 1] if k - P - 1 >= 0 else 0], seg[:-1]))
        y[k:e] = .996 * .5 * (seg + prev); k = e
    out = y[P:] ; return out * env(n, .002, d * .5) * g
def rhodes(m, d=1.2, vel=1.0):                                   # FM electric piano
    t = np.arange(int(d * SR)) / SR; fc = hz(m); idx = 1.8 * vel * np.exp(-t * 6)
    x = np.sin(2 * np.pi * fc * t + idx * np.sin(2 * np.pi * fc * t)) + .25 * np.sin(2 * np.pi * fc * 2 * t) * np.exp(-t * 9)
    return x * env(len(t), .004, d * .45) * (1 + .12 * np.sin(2 * np.pi * 4.5 * t))
def ep_chord(s, d=1.0, vel=1.0, at=None):
    return sum(rhodes(m, d, vel) * (.9 if i else 1.1) for i, m in enumerate(chord(s if at is None else at))) / 4
def pad(notes, d):
    t = np.arange(int(d * SR)) / SR; x = 0
    for m in notes:
        for det in (-.12, .0, .11):
            ph = (hz(m + det) * t) % 1; x = x + (2 * ph - 1)
    x = f(x / (len(notes) * 3), 'lowpass', 1400); return x * np.minimum(1, t / .5) * np.minimum(1, (d - t) / .4)
def sub(m, d):
    t = np.arange(int(d * SR)) / SR; return np.tanh(1.5 * np.sin(2 * np.pi * hz(m) * t)) * np.minimum(1, t / .01) * np.exp(-t / (d * .55))
def kick(d=.22, top=110):
    t = np.arange(int(.5 * SR)) / SR; return np.tanh(2.2 * np.sin(2 * np.pi * np.cumsum(48 + top * np.exp(-t * 30)) / SR) * env(len(t), .001, d))
def noise(d, lo, hi, dec): x = f(rng.standard_normal(int(d * SR)), 'bandpass', [lo, hi]); return x * env(len(x), .001, dec)
def shaker(acc): return noise(.08, 4500, 14000, .018 + .01 * acc) * (1 + .6 * acc)
def rim(): return noise(.04, 1500, 6000, .008) * 1.3 + np.sin(2 * np.pi * 1700 * np.arange(int(.04 * SR)) / SR) * env(int(.04 * SR), .0005, .006) * .5
def clap(): return sum(np.pad(noise(.2, 900, 4200, .05), (int(k * .009 * SR), int(.05 * SR)))[:int(.25 * SR)] for k in range(3))
def conga(fr=210, d=.18):
    t = np.arange(int(d * SR)) / SR; return (np.sin(2 * np.pi * fr * (1 + .25 * np.exp(-t * 60)) * t) * env(len(t), .001, .07) + noise(d, 800, 3000, .01)[:len(t)] * .25)
def talk(f0, bend, d=.3):                                         # talking drum: pitch bends with the squeeze
    t = np.arange(int(d * SR)) / SR; fr = f0 * (1 + bend * np.sin(np.pi * np.minimum(1, t / (d * .7))))
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * env(len(t), .002, d * .45) + noise(d, 300, 1500, .015)[:len(t)] * .3
def logdrum(m, d=.4):
    t = np.arange(int(d * SR)) / SR; ph = 2 * np.pi * np.cumsum(hz(m) * (1 + .5 * np.exp(-t * 40))) / SR
    return np.tanh(2.0 * (np.sin(ph) + .3 * np.sin(2 * ph))) * env(len(t), .003, d * .4)
def riser(d, lo=300, hi=9000):
    n = int(d * SR); x = rng.standard_normal(n + 4000); out = np.zeros(n); seg = int(.015 * SR)
    for i in range(0, n, seg):
        p = i / n; c = lo + (hi - lo) * p ** 2
        out[i:i + seg] = f(x[i:i + seg + 2000], 'bandpass', [c * .75, c * 1.25])[:len(out[i:i + seg])] * p ** 1.5
    return out
def hit(g=1.0):
    x = noise(.8, 50, 9000, .18); k = kick(.35, 150); x[:len(k)] += k * .9; return x * g
def rev_swell(notes, d):                                          # reversed guitar chord swell into a downbeat
    x = sum(pluck(hz(m), d, .4) for m in notes); return x[::-1] * np.linspace(0, 1, len(x)) ** 2

drums, perc, bass, keys, gtr, padb, fx = mk(), mk(), mk(), mk(), mk(), mk(), mk()
sw = lambda i: .018 if i % 2 else 0                                # 16th swing, the lilt in his records
hum = lambda: rng.normal(0, .004)                                  # human timing

# afro-pop groove: kick on 1, the 'and' of 2, and 3; rims on 2 and 4; swung shaker; congas talk back
def groove(a, b, *, kicks=True, logs=False, gtr_arp=True, ep=True, perc_on=True):
    s = a; i = int(round(a / S16))
    while s < b - 1e-6:
        st = i % 16; tt = s + sw(i) + hum()
        if kicks and st in (0, 6, 8, 14 if (i // 16) % 2 else 0): add(drums, kick(), s, .85)
        if st in (4, 12): add(drums, rim(), tt, .55); add(drums, clap(), s, .22)
        if perc_on:
            add(perc, shaker(st % 4 == 2), tt, .2)
            if st in (3, 7, 10, 11, 15): add(perc, conga(330 if st in (10, 15) else 215), tt, .35)
        if logs and st in (0, 3, 6, 10, 13): add(bass, logdrum(root(s) + 12 + (7 if st == 10 else 0)), s + .01, .42)
        elif st in (0, 3, 6, 8, 11): add(bass, sub(root(s) + 12, .32 if st != 0 else .5), s + .01, .5)
        if gtr_arp:                                                # highlife arpeggio, palm-picked
            ch = chord(s); pat = [4, 2, 3, 1, 4, 2, 3, 2]; m = ch[pat[st % 8]] + 12
            add(gtr, pluck(hz(m), .45, .5 + .15 * (st % 4 == 0)), tt, .3 + .1 * (st % 4 == 0))
        if ep and st in (2, 7, 10):                                # off-beat Rhodes stabs
            add(keys, ep_chord(s, .35, .8), tt, .28)
        s += S16; i += 1

# lead guitar motif (original): a soft pentatonic answer phrase in Eb
MOTIF = [(0, 70, .5), (.5, 72, .25), (.75, 75, .5), (1.5, 72, .25), (1.75, 70, .75), (3.0, 67, .25), (3.25, 70, .5), (3.75, 68, 1.0)]
def motif(a, g=.5):
    for dt, m, d in MOTIF: add(gtr, pluck(hz(m), d + .4, .75), a + dt + hum(), g)

# ---------------- arrangement ----------------
# 0-2: title slams. guitar intro under the hits, reversed swell into the drop
for k, at in enumerate((0, .5, 1.0, 1.5)):
    add(fx, hit(.55 + .1 * k), at); add(bass, sub(39 + (0, 0, 5, 7)[k], .45), at, .45)
    add(gtr, pluck(hz((63, 67, 70, 74)[k]), .9, .7), at + .02, .5)
add(keys, ep_chord(0, 1.8, .7), 0, .35)
add(gtr, rev_swell([58, 62, 65, 70], 1.0), 1.0, .35); add(fx, riser(.5, 2000, 10000), 1.5, .2)
# 2-5: groove in
groove(2, 5); add(padb, pad(chord(2), 3.0), 2, .12); add(fx, hit(.8), 2.0)
# 5-6: F-O-L-A — four Rhodes stabs climbing, each answered by the talking drum
for i, at in enumerate((5, 5.25, 5.5, 5.75)):
    add(keys, sum(rhodes(m + (0, 2, 4, 7)[i], .4, 1.1) for m in (63, 67, 70)) / 3, at, .55)
    add(drums, kick(.15, 130 + 40 * i), at, .8); add(perc, talk(140 + 25 * i, .35 + .1 * i, .24), at + .05, .5)
add(fx, riser(1.0), 5.0, .25)
# 6-9.5: full groove with log drum and the motif on top
add(fx, hit(1.1), 6.0); add(bass, sub(27, 1.0), 6.0, .6)
groove(6, 9.5, logs=True); add(padb, pad(chord(6), 3.5), 6, .14)
motif(6.0, .42); add(fx, riser(.5), 9.0, .25)
# 9.5-11.5: the name — drums drop, Rhodes and guitar alone, talking-drum fill into the venue
add(fx, hit(.9), 9.5); add(bass, sub(27, 1.6), 9.5, .55)
add(keys, ep_chord(0, 2.0, .9, at=0), 9.5, .45); add(padb, pad(CH[0], 2.0), 9.5, .2)
for i, m in enumerate([75, 74, 70, 67, 70, 72, 75, 79]): add(gtr, pluck(hz(m), .8, .6), 9.5 + .25 * i + hum(), .35)
for k in range(6): add(fx, noise(.06, 1000, 7000, .015), 9.88 + k * .07, .35)
for i, (at, f0, bd) in enumerate([(10.75, 150, .5), (11.0, 180, -.3), (11.125, 160, .4), (11.25, 200, .6), (11.375, 170, .5)]): add(perc, talk(f0, bd, .22), at, .55)
# 11.5-14: groove with the venue words
groove(11.5, 14); add(padb, pad(chord(12), 2.5), 11.5, .12)
# 14-16: the date — chord hits only, held breath, then the run-up
for at, s in ((14, 14), (14.5, 14), (15, 15)):
    add(fx, hit(.7 + (at == 14) * .5), at); add(keys, ep_chord(s, .9, 1.0), at, .45); add(bass, sub(root(s) + 12, .5), at, .55)
add(fx, riser(.5), 15.5, .3); add(perc, talk(170, .6, .3), 15.6, .5); add(perc, talk(210, .5, .25), 15.8, .5)
# 16-19: everything, motif answered an octave up
add(fx, hit(.9), 16.0); groove(16, 19, logs=True); add(padb, pad(chord(16), 3.0), 16, .14)
motif(16.0, .38); [add(gtr, pluck(hz(m + 12), .5, .8), 18.0 + .25 * i, .28) for i, m in enumerate((70, 72, 75, 79))]
# 19-22: low-passed groove under the typing
tmp = [b.copy() for b in (drums, perc, bass, keys, gtr)]
for b in (drums, perc, bass, keys, gtr): b[:] = 0
groove(19, 22, logs=True)
lp = f(drums + perc + bass + keys + gtr, 'lowpass', 1100)
for b, o in zip((drums, perc, bass, keys, gtr), tmp): b[:] = o
drums += lp * 1.15
add(fx, riser(.6), 21.4, .3)
# 22-25: the card lands on a full Ebmaj9, groove plays out, guitar rings the last chord
add(fx, hit(1.2), 22.0); add(bass, sub(27, 2.0), 22.0, .6)
groove(22, 24.5); add(padb, pad(CH[0], 3.0), 22, .18); add(keys, ep_chord(0, 2.5, 1.0, at=0), 22, .4)
for i, m in enumerate(CH[0] + [70]): add(gtr, pluck(hz(m + 12), 2.2, .6), 24.0 + i * .03, .3)

# paper foley: torn sheets on the wipes, a slap for every chip pasted down, typing
def tear(d=.42):
    n = int(d * SR); x = f(rng.standard_normal(n), 'bandpass', [1200, 9000])
    am = (rng.random(n // 120 + 1) ** 3).repeat(120)[:n]; return x * am * np.sin(np.pi * np.arange(n) / n) ** .6 * 2.2
def slap():
    x = noise(.12, 150, 2500, .03) * 1.4; th = kick(.05, 60)[:len(x)] * .6; x[:len(th)] += th[:len(x)]; return x
for c in (9.5, 14, 19, 22): add(fx, tear(), c - .22, .45)
for at in (2.3, 2.8, 3.3, 10.55, 11.5, 11.75, 12.25, 12.5, 13.0, 14.5, 15.0, 19.15, 22.1, 22.45, 22.7): add(fx, slap(), at, .5)
for i in range(14): add(fx, noise(.03, 3000, 12000, .006) * 1.3, 19.55 + i * .065, .6)

# ---------------- mix ----------------
def verb(x, secs=1.8, wet=.25):
    n = int(secs * SR); ir = rng.standard_normal(n) * np.exp(-np.arange(n) / SR * 3.2 / secs); ir = f(ir, 'lowpass', 6000); ir /= np.sqrt((ir ** 2).sum())
    return x + fftconvolve(x, ir)[:len(x)] * wet
# kick ducks the music bed a touch (sidechain feel)
kenv = np.abs(f(drums, 'lowpass', 120)); kenv = np.convolve(kenv, np.ones(int(.05 * SR)) / int(.05 * SR), 'same'); duck = 1 - .35 * np.clip(kenv / (kenv.max() + 1e-9) * 3, 0, 1)
music_m = drums * .5 + perc * .9 + bass * .75 + fx * .42
music_s = verb(keys * 1.7 + padb * 2.2 + gtr * 2.0, 1.8, .35) * duck
L = music_m + music_s * 1.0 + verb(gtr, 1.2, .2) * .15; Rr = music_m + music_s * .92 - verb(gtr, 1.2, .2) * .15   # a little width from the guitar
# live audio from the footage: only the clips in E-flat (the red-crowd clip is in another key, so its crowd is not used)
def load(n):
    sr, x = wavfile.read(f'clips/aud/{n}.wav'); x = x.astype(float) / 32768; return f(x, 'highpass', 160)
crowd = np.zeros((N, 2))
def place(x, at, g, fade=.1):
    i = int(at * SR); x = x[:N - i].copy(); r = int(fade * SR)
    x[:r] *= np.linspace(0, 1, r)[:, None]; x[-r:] *= np.linspace(1, 0, r)[:, None]; crowd[i:i + len(x)] += x * g
bed = load('bed')
place(bed[:int(2 * SR)], 0, .12, .3); place(load('pyro'), 2.0, .42); place(load('hand'), 6.0, .5)
place(bed[int(2 * SR):int(4.6 * SR)], 9.5, .45, .2)                     # the crowd under the name
place(bed[int(4.6 * SR):int(7.1 * SR)], 11.5, .38); place(load('trip'), 16.0, .38)
place(bed[int(7 * SR):int(12 * SR)], 22.0, .45, .3)
mix = np.stack([L, Rr], 1) + crowd * 1.7
mix *= np.minimum(1, (D - t_all) / .6)[:, None]
mix = f(mix, 'highpass', 28)
mix = np.tanh(mix * 1.05); mix *= 10 ** (-1 / 20) / np.abs(mix).max()
with wave.open('out/mix.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype(np.int16).tobytes())
print('mix ok')
