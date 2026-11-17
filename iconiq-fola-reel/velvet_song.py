"""Velvet soundtrack from the clip's own song: 25 s from bar 11 of the track (24.575 s, a downbeat at 112 bpm), so the
curtain opens on the build and the full section lands as FOLA appears. The paper foley from velvet_score.py sits
underneath, re-timed to the song-locked cuts in velvet.html.   python3 velvet_song.py -> out/velvet-song-mix.wav
Needs clips/aud/velvet_song.wav (the clip's audio, 48 kHz stereo; git-ignored)."""
import wave
import numpy as np
from scipy.io import wavfile
src = open('velvet_score.py').read().split('# ---- arrangement ----')[0]
g = {}; exec(src, g)                                          # instruments and foley only, no arrangement
SR, D, add, f = g['SR'], g['D'], g['add'], g['f']
N = int(SR * D)

SONG_IN = 24.575                                              # downbeat of bar 11: 1.004 s + 11 bars of 2.1429 s
sr, song = wavfile.read('clips/aud/velvet_song.wav'); assert sr == SR
song = song.astype(float) / 32768
x = song[int(SONG_IN * SR):int(SONG_IN * SR) + N].copy()
x[:int(.03 * SR)] *= np.linspace(0, 1, int(.03 * SR))[:, None]
fo = int(1.4 * SR); x[-fo:] *= (np.linspace(1, 0, fo) ** 1.5)[:, None]

# the same scene grid as velvet.html
RB = 60 / 112; BT = .625; K = BT / RB
BEATS = [4, 4, 4, 4, 4, 4, 4, 8, 4, 20 / 3]
START = np.concatenate([[0], np.cumsum(BEATS) * RB])
def d2r(d):
    s = min(9, int(d // 2.5 + 1e-9)); return START[s] + (d - 2.5 * s) / K

fx = np.zeros(N)
tear, slap, shutter, stamp, noise = g['tear'], g['slap'], g['shutter'], g['stamp'], g['noise']
for c in (10, 17.5, 22.5): add(fx, tear(), d2r(c) - .22, .45)                      # torn-paper wipes
for d in (.625, 1.25, 2.7, 5, 5.625, 6.25, 10.15, 10.625, 11.25, 13.125, 13.75, 14.375, 15.2, 15.825, 20.1, 20.5, 22.5, 22.6, 22.95, 23.2):
    add(fx, slap(), d2r(d), .4)                                                        # every chip pasted down
for d in (7.5, 8.125, 8.75, 9.075): add(fx, shutter(), d2r(d), .55)                    # the polaroids
add(fx, stamp(), d2r(9.375), .8)                                                       # 16.12.26
add(fx, noise(.4, 600, 4000, .15), START[7] + .25 / K, .3)                             # ticket slides up
add(fx, tear(.35), START[7] + 6 * BT / K, .6)                                          # stub torn off
for i in range(14): add(fx, noise(.03, 3000, 12000, .006) * 1.3, d2r(20.6 + i * .06), .45)   # typing
add(fx, noise(.4, 800, 5000, .18), d2r(21.6), .25)                                     # marker underline

mix = x * .95 + np.stack([fx, fx], 1) * .5
mix *= 10 ** (-1 / 20) / np.abs(mix).max()
with wave.open('out/velvet-song-mix.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype(np.int16).tobytes())
print('velvet song mix ok')
