#!/usr/bin/env bash
# Builds the Prohub SFX kit (assets/sfx/kit/*.wav) from CC0 source one-shots by classic sound-design processing:
# layering, pitch-shifting for weight, time-stretching, reversing for risers, reverb tails and stutter edits.
# Reproducible: re-run after changing a recipe. Requires ffmpeg.
set -euo pipefail
cd "$(dirname "$0")/../assets/sfx"
S=source; K=kit; mkdir -p "$K"
AR=48000
# pitch shift by semitones keeping duration roughly: asetrate then aresample (duration scales — intended for weight)
p() { echo "asetrate=${AR}*$(python3 -c "print(2**($1/12))"),aresample=${AR}"; }
ff() { ffmpeg -v error -y "$@"; }
VERB="aecho=0.8:0.55:23|41|67|97|131|173|229:0.32|0.27|0.22|0.17|0.13|0.09|0.06"
LONGVERB="aecho=0.8:0.65:29|53|89|131|181|241|313|397|491|601:0.36|0.32|0.28|0.24|0.2|0.16|0.13|0.1|0.07|0.05"

# hit — text slam: tight transient + octave-down body
ff -i $S/cinematic-press.ogg -i $S/cinematic-forward.ogg -filter_complex \
 "[0]aresample=$AR,volume=1.0[a];[1]$(p -7),lowpass=f=3500,volume=0.9[b];[a][b]amix=2:normalize=0,$VERB,afade=t=out:st=0.5:d=0.25,atrim=0:0.75" -ac 1 -ar $AR $K/hit.wav
# impact — scene punch: sub-weighted layered hit
ff -i $S/cinematic-wake.ogg -i $S/cinematic-start.ogg -i $S/cinematic-press.ogg -filter_complex \
 "[0]$(p -12),lowpass=f=900,volume=1.4[a];[1]$(p -5),volume=0.7[b];[2]aresample=$AR,highpass=f=1500,volume=0.6[c];[a][b][c]amix=3:normalize=0,$VERB,afade=t=out:st=0.9:d=0.5,atrim=0:1.4" -ac 1 -ar $AR $K/impact.wav
# boom — logo reveal sub drop with long tail
ff -i $S/cinematic-drop.ogg -i $S/cinematic-wake.ogg -filter_complex \
 "[0]$(p -19),lowpass=f=500,volume=2.0[a];[1]$(p -24),lowpass=f=300,volume=1.6[b];[a][b]amix=2:normalize=0,$LONGVERB,afade=t=out:st=1.6:d=1.2,atrim=0:2.8" -ac 1 -ar $AR $K/boom.wav
# riser — reversed long-verb texture swell (ends at its loudest)
ff -i $S/cinematic-processing.ogg -i $S/cinematic-scanning.ogg -filter_complex \
 "[0]$(p -5)[a];[1]$(p 3),volume=0.6[b];[a][b]amix=2:normalize=0,$LONGVERB,atrim=0:2.2,areverse,afade=t=in:st=0:d=1.2,highpass=f=120" -ac 1 -ar $AR $K/riser.wav
# whoosh — stretched airy swipe; whoosh_in = reversed (builds into a cut)
ff -i $S/cinematic-swipe.ogg -af "aresample=$AR,atempo=0.7,$(p -3),$VERB,afade=t=out:st=0.7:d=0.3,atrim=0:1.0" -ac 1 -ar $AR $K/whoosh.wav
ff -i $K/whoosh.wav -af "areverse,afade=t=in:st=0:d=0.3" -ac 1 -ar $AR $K/whoosh_in.wav
# glitch — stuttered digital error
ff -i $S/scifi-error.ogg -i $S/scifi-error.ogg -i $S/scifi-error.ogg -i $S/cinematic-blocked.ogg -filter_complex \
 "[0]aresample=$AR,atrim=0:0.06[a];[1]aresample=$AR,atrim=0.02:0.07,$(p 5)[b];[2]aresample=$AR,atrim=0:0.05,$(p -4)[c];[3]aresample=$AR,atrim=0:0.25,volume=0.7[d];[a][b][c][d]concat=n=4:v=0:a=1" -ac 1 -ar $AR $K/glitch.wav
# tick / blip / node — HUD layer
ff -i $S/scifi-typing.ogg -af "aresample=$AR,volume=0.9" -ac 1 -ar $AR $K/tick.wav
ff -i $S/scifi-select.ogg -af "aresample=$AR,$VERB" -ac 1 -ar $AR $K/blip.wav
ff -i $S/scifi-progress-step.ogg -af "aresample=$AR,$(p -2),$VERB" -ac 1 -ar $AR $K/node.wav
# scan — data texture bed
ff -i $S/scifi-scanning.ogg -af "aresample=$AR,$VERB,volume=0.8" -ac 1 -ar $AR $K/scan.wav
# streak — light-streak swish: pitched-up sci-fi swipe + shimmer
ff -i $S/scifi-swipe.ogg -i $S/cinematic-reward.ogg -filter_complex \
 "[0]aresample=$AR,atempo=0.6,$(p 4)[a];[1]$(p 7),highpass=f=2000,volume=0.5[b];[a][b]amix=2:normalize=0,$LONGVERB,afade=t=out:st=0.9:d=0.6,atrim=0:1.5" -ac 1 -ar $AR $K/streak.wav
# sparkle — CTA / tagline accent
ff -i $S/cinematic-achievement.ogg -af "aresample=$AR,$(p 5),highpass=f=600,$LONGVERB,afade=t=out:st=1.4:d=0.6,atrim=0:2.0" -ac 1 -ar $AR $K/sparkle.wav
# drone — low room tone for 3D spaces (loops cleanly enough at low level)
ff -i $S/cinematic-processing.ogg -af "aresample=$AR,$(p -12),lowpass=f=400,$LONGVERB,aloop=loop=2:size=$((AR*2)),afade=t=in:st=0:d=0.4,afade=t=out:st=3.2:d=0.6,atrim=0:3.8,volume=1.6" -ac 1 -ar $AR $K/drone.wav
echo "kit built: $(ls $K | wc -l) sounds"
# peak-normalise every kit sound to -3 dBFS so cue gains in the mixer are meaningful
for f in $K/*.wav; do
  mx=$(ffmpeg -i "$f" -af volumedetect -f null - 2>&1 | grep -oE "max_volume: [-0-9.]+" | awk '{print $2}')
  g=$(python3 -c "print(-3-($mx))"); ffmpeg -v error -y -i "$f" -af "volume=${g}dB" -ar $AR -ac 1 "$f.tmp.wav" && mv "$f.tmp.wav" "$f"
done
echo "normalised to -3 dBFS peak"
