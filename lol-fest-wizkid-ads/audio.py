"""Original score + sound design for every LOL FEST x WIZKID spot.

    python3 audio.py cues.json out.wav

cues.json is exported by the page (window.cues()): {name, bpm, dur, cues:[{t, k, g?, d?}]}.
The music bed (tempo, harmony, arrangement arc) is chosen from the spot name; every edit accent
(hits, whooshes, risers, shutters...) is placed at the exact cut times the page reports.
Everything is synthesised here from oscillators and noise: no samples, no third-party or artist recordings,
so the soundtrack is cleared for paid advertising use.
"""
import json, sys, wave, zlib
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
spec = json.load(open(sys.argv[1]))
OUT = sys.argv[2]
DUR = float(spec['dur']); N = int(SR * DUR)
BPM = float(spec['bpm']); BEAT = 60 / BPM
rng = np.random.default_rng(zlib.crc32((spec['name'] + spec.get('sponsor', '')).encode()))

def ta(d): return np.arange(int(SR * d)) / SR
def env(n, a=.002, d=.12):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)
def adsr(n, a, r):
    e = np.ones(n); na = min(n, int(a * SR)); nr = min(n, int(r * SR))
    if na: e[:na] = np.linspace(0, 1, na)
    if nr: e[-nr:] *= np.linspace(1, 0, nr)
    return e
def filt(x, kind, f, order=2): return sosfilt(butter(order, f, btype=kind, fs=SR, output='sos'), x)
def add(buf, x, at, g=1.0):
    i = int(round(at * SR))
    if i < 0: x, i = x[-i:], 0
    if i >= len(buf): return
    x = x[:len(buf) - i]; buf[i:i + len(x)] += x * g
def note(m): return 440 * 2 ** ((m - 69) / 12)
def saw(f, t):
    return 2 * ((f * t) % 1) - 1

# ---------------- instruments ----------------
def kick(punch=1.0):
    t = ta(.5); f = 46 + 110 * np.exp(-t * 32 * punch)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), .001, .2)
    click = filt(rng.standard_normal(len(t)), 'highpass', 3000) * env(len(t), .0005, .004) * .4
    return np.tanh(1.6 * (x + click))
def logdrum(freq, d=.34):
    t = ta(d); f = freq * (1 + .7 * np.exp(-t * 45)) * (1 - .05 * t / d)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.tanh(2.2 * (np.sin(ph) + .35 * np.sin(2 * ph)) * env(len(t), .002, .13))
def clap():
    n = rng.standard_normal(int(SR * .3)); n = filt(n, 'bandpass', [900, 4200])
    e = env(len(n), .001, .08)
    for k in (.009, .019): e[int(k * SR):] += .6 * env(len(n) - int(k * SR), .001, .05)
    return n * e * .8
def shaker(acc=.6):
    n = filt(rng.standard_normal(int(SR * .08)), 'highpass', 6500)
    return n * env(len(n), .004, .02 + .02 * acc) * (.45 + .55 * acc)
def hat(o=False):
    n = filt(rng.standard_normal(int(SR * (.25 if o else .06))), 'highpass', 8000)
    return n * env(len(n), .001, .08 if o else .015)
def rim():
    t = ta(.08); x = np.sin(2 * np.pi * 1750 * t) * env(len(t), .0005, .012) + filt(rng.standard_normal(len(t)), 'bandpass', [2000, 6000]) * env(len(t), .0005, .006)
    return x * .7
def sub(m, d):
    t = ta(d); f = note(m)
    x = np.sin(2 * np.pi * f * t) + .25 * np.sin(4 * np.pi * f * t)
    return np.tanh(1.3 * x) * adsr(len(t), .01, .08)
def pad(ms, d, cut=1600, bright=1.0):
    t = ta(d); x = np.zeros(len(t))
    for m in ms:
        for det in (-.11, 0, .09):
            x += saw(note(m) * 2 ** (det / 12), t + rng.random())
    x = filt(x / (len(ms) * 3), 'lowpass', cut * bright)
    return x * adsr(len(t), min(.6, d * .3), min(.8, d * .4))
def pluck(m, d=.5):
    t = ta(d); f = note(m)
    return (np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * 2 * f * t) + .12 * np.sin(2 * np.pi * 3.01 * f * t)) * env(len(t), .002, .16)
def bell(m, d=1.6):
    t = ta(d); f = note(m)
    mod = np.sin(2 * np.pi * f * 3.5 * t) * 2.2 * np.exp(-t * 3)
    return np.sin(2 * np.pi * f * t + mod) * env(len(t), .002, .55)

# ---------------- sound design ----------------
def noise(d): return rng.standard_normal(int(SR * d))
def whoosh(d=.55):
    n = noise(d); t = ta(d); out = np.zeros(len(n)); seg = 512
    for i in range(0, len(n), seg):
        c = 400 + 5200 * np.sin(np.pi * i / len(n)) ** 2
        out[i:i + seg] = filt(n[max(0, i - 2048):i + seg], 'bandpass', [c * .6, min(c * 1.6, 20000)])[-len(n[i:i + seg]):]
    return out * np.sin(np.pi * t / d) ** 2 * .9
def riser(d):
    t = ta(d); n = filt(noise(d), 'highpass', 1500)
    f = 180 * 2 ** (3 * t / d); tone = saw(f, t) * .25
    return (n * .5 + filt(tone, 'lowpass', 4000)) * (t / d) ** 2.2
def reverse(d=.6):
    n = filt(noise(d), 'highpass', 2500); t = ta(d)
    return n * (t / d) ** 3 * .9
def boom(d=2.2):
    t = ta(d); f = 30 + 70 * np.exp(-t * 6)
    return np.tanh(2 * np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), .002, .7))
def impact(g=1.0):
    t = ta(2.0); b = boom(2.0) * .9
    n = filt(noise(2.0), 'lowpass', 5000) * env(len(t), .001, .12) * .7
    k = np.zeros(len(t)); kk = kick(1.3); k[:len(kk)] = kk
    return (b + n + k * .8) * g
def hit(g=1.0):
    t = ta(.6); k = np.zeros(len(t)); kk = kick(1.1); k[:len(kk)] = kk[:len(t)]
    n = filt(noise(.6), 'bandpass', [800, 6000]) * env(len(t), .001, .05)
    tone = np.sin(2 * np.pi * 98 * t) * env(len(t), .002, .25)
    return (k * .8 + n * .6 + tone * .5) * g
def thump(): return kick(.8) * .9
def tick():
    t = ta(.05); return np.sin(2 * np.pi * 2600 * t) * env(len(t), .0003, .006) * .7
def shutter():
    x = np.zeros(int(SR * .25))
    for at, g in ((0, 1), (.075, .7)):
        c = filt(noise(.03), 'bandpass', [1500, 9000]) * env(int(SR * .03), .0003, .004)
        add(x, c, at, g)
    add(x, filt(noise(.12), 'bandpass', [300, 1800]) * env(int(SR * .12), .002, .03) * .4, .01)
    return x
def glitch():
    x = np.zeros(int(SR * .45))
    for i in range(9):
        seg = np.sign(np.sin(2 * np.pi * (200 + 900 * rng.random()) * ta(.03))) * .5
        add(x, seg * env(len(seg), .0005, .02), i * .045)
    return x
def subdrop(d=1.8):
    t = ta(d); f = 70 * np.exp(-t * 1.4) + 28
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * adsr(len(t), .01, .6)
def chime():
    x = np.zeros(int(SR * 2.4))
    for i, m in enumerate((81, 88, 93)): add(x, bell(m, 2.0) * .35, i * .04)
    return x
def shimmer():
    x = np.zeros(int(SR * 2.6))
    for i, m in enumerate((88, 93, 95, 100, 105)): add(x, bell(m, 1.6) * .18, i * .07)
    return filt(x, 'highpass', 900)
def swell(d):
    t = ta(d); n = filt(noise(d), 'bandpass', [300, 2600]) * .25
    return (n + pad((57, 64, 69), d, 900) * .9) * (t / d) ** 1.5

# ---------------- music beds ----------------
STYLES = {
    # chords as MIDI note lists per bar, arc = intensity keyframes (time, 0..1)
    'superstar':        dict(chords=[(57, 60, 64, 67), (53, 57, 60, 64), (48, 52, 55, 60), (55, 59, 62, 65)], bass=[45, 41, 36, 43], groove='afro', arc=[(0, .15), (4.9, .3), (5.0, .5), (10.6, .6), (10.65, 1), (13.7, 1), (13.75, .45), (15, .8), (20, .6)]),
    'festival-calling': dict(chords=[(50, 53, 57, 60), (46, 50, 53, 57), (48, 52, 55, 58), (45, 48, 52, 55)], bass=[38, 34, 36, 33], groove='piano', arc=[(0, .1), (1.9, .25), (2.0, .85), (9.9, .85), (10.0, 1), (13.4, 1), (13.5, .6), (15, .9), (20, .8)]),
    'big-wiz-moment':   dict(chords=[(52, 55, 59, 62), (48, 52, 55, 59), (45, 48, 52, 55), (47, 50, 54, 57)], bass=[40, 36, 33, 35], groove='half', arc=[(0, .2), (2.6, .35), (6.6, .55), (9.3, 1), (11.6, .3), (13.0, .7), (15, .75), (20, .6)]),
    'typographic-explosion': dict(chords=[(50, 53, 57, 60), (46, 50, 53, 57), (48, 52, 55, 58), (45, 48, 52, 55)], bass=[38, 34, 36, 33], groove='piano', arc=[(0, .3), (1.5, .9), (4.2, 1), (6, .8), (10, .85), (15, .75)]),
    'festival-countdown':    dict(chords=[(57, 60, 64), (53, 57, 60), (55, 59, 62), (52, 55, 59)], bass=[45, 41, 43, 40], groove='afro', arc=[(0, .3), (7.7, .7), (7.8, 1), (10, .85), (15, .75)]),
    'visual-experience':     dict(chords=[(52, 56, 59, 63), (49, 52, 56, 59), (45, 49, 52, 56), (47, 51, 54, 58)], bass=[40, 37, 33, 35], groove='half', arc=[(0, .2), (7.8, .55), (7.9, .95), (10, .8), (15, .7)]),
    'wizkid-takeover':       dict(chords=[(50, 53, 57), (48, 51, 55), (46, 50, 53), (48, 51, 55)], bass=[38, 36, 34, 36], groove='piano', arc=[(0, .4), (1.6, 1), (5, .85), (10, .75)]),
    'ultimate-announcement': dict(chords=[(57, 60, 64, 67), (53, 57, 60, 64), (48, 52, 55, 60), (55, 59, 62, 65)], bass=[45, 41, 36, 43], groove='afro', arc=[(0, .15), (1.8, .6), (4.4, .7), (6.6, .85), (10, .8), (15, .7)]),
    # sponsor co-branded spots (15 s): 0-4 intro, 4-10 festival, 10-15 lock-up
    'sp-lux':      dict(chords=[(57, 60, 64, 67), (53, 57, 60, 64), (50, 53, 57, 60), (52, 55, 59, 62)], bass=[45, 41, 38, 40], groove='half', arc=[(0, .15), (3.9, .35), (4.0, .6), (9.9, .75), (10, .5), (15, .45)]),
    'sp-lux2':     dict(chords=[(52, 55, 59, 62), (48, 52, 55, 59), (50, 53, 57, 60), (47, 50, 54, 57)], bass=[40, 36, 38, 35], groove='afro', arc=[(0, .2), (3.9, .4), (4.0, .7), (9.9, .8), (10, .55), (15, .5)]),
    'sp-groove':   dict(chords=[(50, 53, 57, 60), (46, 50, 53, 57), (48, 52, 55, 58), (45, 48, 52, 55)], bass=[38, 34, 36, 33], groove='piano', arc=[(0, .35), (3.9, .5), (4.0, .9), (9.9, .9), (10, .7), (15, .6)]),
    'sp-bright':   dict(chords=[(60, 64, 67, 71), (57, 60, 64, 67), (53, 57, 60, 64), (55, 59, 62, 65)], bass=[48, 45, 41, 43], groove='afro', arc=[(0, .3), (3.9, .5), (4.0, .9), (9.9, .9), (10, .7), (15, .6)]),
    'sp-party':    dict(chords=[(50, 53, 57), (48, 51, 55), (46, 50, 53), (45, 48, 52)], bass=[38, 36, 34, 33], groove='piano', arc=[(0, .6), (3.9, .7), (4.0, 1), (9.9, 1), (10, .8), (15, .7)]),
    'sp-dark':     dict(chords=[(45, 48, 52), (43, 46, 50), (41, 45, 48), (43, 46, 50)], bass=[33, 31, 29, 31], groove='half', arc=[(0, .4), (3.9, .5), (4.0, .95), (9.9, .95), (10, .7), (15, .6)]),
    'sp-heritage': dict(chords=[(55, 59, 62, 66), (52, 55, 59, 62), (48, 52, 55, 59), (50, 54, 57, 60)], bass=[43, 40, 36, 38], groove='afro', arc=[(0, .2), (3.9, .45), (4.0, .75), (9.9, .8), (10, .55), (15, .5)]),
    'sp-minimal':  dict(chords=[(53, 57, 60, 64), (50, 53, 57, 60), (55, 59, 62, 65), (52, 55, 59, 62)], bass=[41, 38, 43, 40], groove='half', arc=[(0, .25), (3.9, .4), (4.0, .7), (9.9, .75), (10, .5), (15, .45)]),
}
st = STYLES[spec['name']]
def arc(t):
    k = st['arc']; ts = [a for a, _ in k]; vs = [b for _, b in k]
    return float(np.interp(t, ts, vs))

mus = np.zeros(N); drm = np.zeros(N)
bar = BEAT * 4
nbars = int(DUR / bar) + 2
for b in range(nbars):
    t0 = b * bar; ch = st['chords'][b % 4]; bs = st['bass'][b % 4]
    I = arc(t0 + bar / 2)
    add(mus, pad(ch, bar + .4, 1100 + 2400 * I), t0, .22 + .12 * I)
    if I > .3:  # syncopated bass figure (16th positions within the bar)
        figure = ((0, 1.4), (6, .9), (12, 1.0)) if st['groove'] != 'half' else ((0, 2.2), (10, 1.2))
        for pos, ln in figure:
            add(mus, sub(bs, BEAT * ln), t0 + pos * BEAT / 4, .32 * min(1, I * 1.3))
    if I > .45:  # plucked motif on the off-beats
        mot = [ch[-1] + 12, ch[1] + 12, ch[2] + 12, ch[0] + 24]
        for k in range(8):
            if (k * 3 + b) % 5 in (0, 2):
                add(mus, pluck(mot[k % 4], .45), t0 + k * BEAT / 2 + BEAT / 4, .12 * I)
for i in range(int(DUR / (BEAT / 4)) + 1):
    t = i * BEAT / 4; I = arc(t); s16 = i % 16
    g = st['groove']
    if I > .4: add(drm, shaker(1 if s16 % 4 == 2 else .4), t, .32 * I)
    if g == 'half':
        if I > .5 and s16 in (0, 10): add(drm, kick(), t, .7 * I)
        if I > .5 and s16 == 8: add(drm, clap(), t, .45 * I)
        if I > .35 and s16 in (6, 14): add(drm, rim(), t, .35 * I)
        if I > .65 and s16 in (3, 11): add(drm, logdrum(55, .5), t, .45 * I)
    else:
        if I > .55 and s16 % 4 == 0: add(drm, kick(), t, .72 * I)
        if I > .6 and s16 in (4, 12): add(drm, clap(), t, .42 * I)
        if I > .5 and s16 % 4 == 2: add(drm, hat(), t, .25 * I)
        if I > .65:  # amapiano log-drum figure
            pat = (3, 6, 7, 11, 14) if g == 'piano' else (3, 7, 10, 14)
            if s16 in pat: add(drm, logdrum(55 if s16 % 2 else 49), t, .55 * I)

# ---------------- sound effects at the edit points ----------------
fx = np.zeros(N); duck = np.ones(N)
for c in spec['cues']:
    t, k, g, d = c['t'], c['k'], c.get('g', 1.0), c.get('d', .8)
    if k == 'hit': add(fx, hit(), t, .8 * g)
    elif k == 'impact': add(fx, impact(), t, .95 * g)
    elif k == 'boom': add(fx, boom(), t, .8 * g)
    elif k == 'thump': add(fx, thump(), t, .7 * g)
    elif k == 'whoosh': add(fx, whoosh(.55), t - .3, .55 * g)
    elif k == 'riser': add(fx, riser(d), t, .5 * g)
    elif k == 'reverse': add(fx, reverse(d), t, .55 * g)
    elif k == 'tick': add(fx, tick(), t, .5 * g)
    elif k == 'shutter': add(fx, shutter(), t, .9 * g)
    elif k == 'glitch': add(fx, glitch(), t, .45 * g)
    elif k == 'sub': add(fx, subdrop(), t, .7 * g)
    elif k == 'chime': add(fx, chime(), t, .6 * g)
    elif k == 'shimmer': add(fx, shimmer(), t, .8 * g)
    elif k == 'swell': add(fx, swell(d), t, .6 * g)
    if k in ('impact', 'boom', 'hit'):  # sidechain the music under big accents (+ a pre-hit breath for impacts)
        i = int(t * SR); n = int(SR * .45)
        if i < N:
            seg = 1 - .55 * g * np.exp(-np.arange(min(n, N - i)) / (SR * .12)); duck[i:i + len(seg)] = np.minimum(duck[i:i + len(seg)], seg)
        if k == 'impact':
            j = max(0, int((t - .12) * SR)); duck[j:i] = np.minimum(duck[j:i], .35)

# reverb send
ir_t = ta(1.9); ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t * 3.2); ir = filt(ir, 'lowpass', 6000); ir /= np.sqrt((ir ** 2).sum())
music = (mus + drm * .9) * duck
wet = fftconvolve(music * .25 + fx * .35, ir)[:N]
mix = music + fx + wet * .5
# fades
fi = int(.02 * SR); mix[:fi] *= np.linspace(0, 1, fi)
fo = int(.9 * SR); mix[-fo:] *= np.linspace(1, 0, fo) ** 1.5
mix = filt(mix, 'highpass', 28)
mix = np.tanh(mix / (np.abs(mix).max() + 1e-9) * 1.4) * .9
st2 = np.stack([mix, mix], 1)
# subtle stereo width from the reverb only
st2[:, 0] += wet * .06; st2[:, 1] -= wet * .06
st2 = np.clip(st2, -1, 1)
with wave.open(OUT, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st2 * 32767).astype('<i2').tobytes())
print('wrote', OUT, f'{DUR}s', spec['name'])
