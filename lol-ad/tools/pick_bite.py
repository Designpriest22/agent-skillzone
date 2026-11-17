"""Find the best 25 s bite in a song for the ad: energy + section structure, bar-aligned.
    python3 tools/pick_bite.py music/manya.mp3"""
import sys
import numpy as np
import librosa
y, sr = librosa.load(sys.argv[1], sr=22050, mono=True)
tempo, beats = librosa.beat.beat_track(y=y, sr=sr, units='time')
tempo = float(np.atleast_1d(tempo)[0])
rms = librosa.feature.rms(y=y, hop_length=512)[0]; tr = librosa.times_like(rms, sr=sr, hop_length=512)
# per-second loudness (dB) and low-end (kick/bass) energy
S = np.abs(librosa.stft(y, hop_length=512)); freqs = librosa.fft_frequencies(sr=sr)
low = S[freqs < 150].mean(0)
sec = lambda v: np.array([v[(tr >= s) & (tr < s + 1)].mean() for s in range(int(tr[-1]))])
L = 20 * np.log10(sec(rms) + 1e-6); B = 20 * np.log10(sec(low) + 1e-6)
print(f'tempo ≈ {tempo:.1f} bpm, beats {len(beats)}, duration {len(y) / sr:.1f}s')
print('loudness per 5s:', ' '.join(f'{int(i * 5)}s:{L[i * 5:i * 5 + 5].mean():.0f}' for i in range(len(L) // 5)))
# section boundaries from chroma/mfcc novelty
mf = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13, hop_length=512)
bounds = librosa.segment.agglomerative(np.vstack([mf, librosa.feature.chroma_cqt(y=y, sr=sr, hop_length=512)]), 12)
bt = librosa.frames_to_time(bounds, sr=sr, hop_length=512)
print('sections at:', ' '.join(f'{t:.1f}' for t in bt))
# score: start on a beat; reward loud + bass-heavy windows and a boundary (energy step) near +12 s (the visual drop)
bar = 4 * 60 / tempo; best = []
for b in beats[::4]:
    if b + 25 > len(y) / sr - 1: break
    i = int(b); w = L[i:i + 25]; wb = B[i:i + 25]
    step = L[i + 12:i + 15].mean() - L[i + 8:i + 11].mean()       # lift into the drop scene
    near = min(abs(t - (b + 12)) for t in bt)
    score = w[:20].mean() + .5 * wb[:20].mean() + 1.5 * max(step, 0) - .3 * near - .5 * np.std(w[:20])
    best.append((score, b, w[:20].mean(), step, near))
for s, b, m, st, nr in sorted(best, reverse=True)[:6]:
    print(f'start {b:6.2f}s  score {s:6.1f}  loud {m:5.1f}dB  lift@12s {st:+.1f}dB  boundary {nr:.1f}s from drop')
