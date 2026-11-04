# python3 score.py -> out/score.wav : original afrobeat-ish loop + SFX cues locked to the animation timeline
import numpy as np, wave, os
SR = 44100; DUR = 22.0; N = int(SR * DUR)
mix = np.zeros(N); sfx = np.zeros(N)
t_all = np.arange(N) / SR
rng = np.random.default_rng(7)

def put(buf, t0, sig, g=1.0):
    i = int(t0 * SR); j = min(N, i + len(sig))
    if i < N: buf[i:j] += g * sig[:j - i]
def env(n, a=0.005, r=0.2):
    t = np.arange(n) / SR; return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / r)
def tone(f, d, r=0.2, shape='sin'):
    n = int(d * SR); t = np.arange(n) / SR
    f = (np.pad(f, (0, max(0, n - len(f))), mode='edge')[:n]) if np.ndim(f) else np.full(n, f)
    ph = 2 * np.pi * np.cumsum(f) / SR
    w = np.sin(ph) if shape == 'sin' else (2 * ((ph / (2 * np.pi)) % 1) - 1)
    return w * env(n, 0.004, r)
def noise(d, r=0.1): n = int(d * SR); return rng.uniform(-1, 1, n) * env(n, 0.002, r)
def lp(x, k):  # cheap one-pole low-pass
    y = np.empty_like(x); a = 0.0
    for i, v in enumerate(x): a += k * (v - a); y[i] = a
    return y
def glide(f0, f1, d): return np.linspace(f0, f1, int(d * SR))

# ---- music: 104 bpm, A minor afro groove ----
BPM = 104; beat = 60 / BPM; s16 = beat / 4
bass = [57, 57, 60, 55]  # midi roots per bar
def hz(m): return 440 * 2 ** ((m - 69) / 12)
def music_on(t): return (t < 12.0) or (15.0 <= t < 16.5) or (t >= 20.3)
bar = 0; t = 0.0
while t < DUR:
    root = bass[bar % 4]
    for step in range(16):
        ts = t + step * s16
        if ts >= DUR or not music_on(ts): continue
        if step in (0, 6, 8, 11): put(mix, ts, tone(glide(120, 45, 0.25), 0.25, 0.12), 0.9)          # kick
        if step in (4, 12): put(mix, ts, lp(noise(0.12, 0.05), 0.5) + tone(190, 0.12, 0.05), 0.35)   # snare/clap
        put(mix, ts, noise(0.04, 0.012) * (0.25 if step % 2 else 0.12), 1.0)                        # shaker
        if step in (0, 3, 7, 10, 14):                                                                # log drum
            f = hz(root - 12 + (7 if step == 10 else 0)); put(mix, ts, tone(glide(f * 1.6, f, 0.3), 0.35, 0.18), 0.55)
        if step in (2, 6, 10, 14):                                                                   # marimba stabs
            for iv in (12, 15, 19): put(mix, ts, tone(hz(root + iv), 0.25, 0.07), 0.09)
    t += 16 * s16; bar += 1

# ---- SFX on the story beats (seconds must match index.html BEATS) ----
def whoosh(t0, d=0.4): n = int(d * SR); x = lp(rng.uniform(-1, 1, n), 0.25) * np.sin(np.linspace(0, np.pi, n)); put(sfx, t0, x, 0.6)
def ding(t0): put(sfx, t0, tone(1760, 0.8, 0.3) + 0.5 * tone(2637, 0.8, 0.2), 0.35)
def boing(t0): put(sfx, t0, tone(220 + 90 * np.sin(np.linspace(0, 40, int(0.5 * SR))), 0.5, 0.25), 0.4)
def heart(t0): put(sfx, t0, tone(glide(70, 40, 0.15), 0.15, 0.08), 1.0); put(sfx, t0 + 0.18, tone(glide(65, 38, 0.15), 0.15, 0.07), 0.8)
def chomp(t0): put(sfx, t0, lp(noise(0.12, 0.04), 0.6) + tone(glide(160, 60, 0.12), 0.12, 0.05), 0.9)
def munch(t0): put(sfx, t0, lp(noise(0.07, 0.02), 0.4), 0.5)
def scratch(t0): put(sfx, t0, tone(np.concatenate([glide(900, 150, 0.15), glide(150, 700, 0.12)]), 0.27, 0.3, 'saw') * 0.5 + noise(0.27, 0.2) * 0.3, 0.6)
def gulp(t0): put(sfx, t0, tone(glide(420, 110, 0.25), 0.25, 0.15), 0.7)
def burp(t0): f = 85 + 12 * np.sin(np.linspace(0, 60, int(0.7 * SR))); put(sfx, t0, lp(tone(f, 0.7, 0.4, 'saw'), 0.08) * 3, 0.6)
def pop(t0): put(sfx, t0, tone(glide(600, 1200, 0.06), 0.08, 0.03), 0.4)
def gasp(t0): n = int(0.6 * SR); put(sfx, t0, lp(rng.uniform(-1, 1, n), 0.15) * np.sin(np.linspace(0, np.pi, n)) ** 2, 0.6)
def cheer(t0): n = int(1.4 * SR); put(sfx, t0, lp(rng.uniform(-1, 1, n), 0.35) * np.sin(np.linspace(0, np.pi, n)), 0.45)
def sad(t0):
    for k, m in enumerate([58, 57, 56]): put(sfx, t0 + k * 0.35, lp(tone(hz(m), 0.34, 0.5, 'saw'), 0.1) * 3, 0.35)
    f = hz(55) * (1 + 0.03 * np.sin(np.linspace(0, 70, int(0.9 * SR)))); put(sfx, t0 + 1.05, lp(tone(f, 0.9, 0.6, 'saw'), 0.1) * 3, 0.35)

for t0 in (0.0, 6.0, 14.0): whoosh(t0)
for t0 in (0.15, 2.1, 6.9, 10.6, 15.1, 20.4): pop(t0)
boing(4.2); gasp(5.5); ding(9.2); ding(9.35); gasp(10.6)
for k in range(6): heart(12.0 + k * 0.33)
chomp(14.0); chomp(14.18); chomp(14.36); cheer(15.0)
scratch(16.5)
for k in range(8): munch(16.9 + k * 0.2)
gulp(18.5); burp(18.95); sad(19.5)

out = mix * 0.45 + sfx
out /= max(1e-9, np.abs(out).max()) / 0.9
fade = np.minimum(1, (DUR - t_all) / 0.3); out *= fade
os.makedirs(os.path.join(os.path.dirname(__file__) or '.', 'out'), exist_ok=True)
with wave.open(os.path.join(os.path.dirname(__file__) or '.', 'out', 'score.wav'), 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out * 32767).astype('<i2').tobytes())
print('wrote out/score.wav')
