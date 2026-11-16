#!/bin/sh
# Mux the silent renders with the score -> out/LOLFEST_WIZKID_ANIMATED-AD_25s_<format>.mp4
cd "$(dirname "$0")/out"
for f in story:1080x1920_9x16 feed:1080x1350_4x5 square:1080x1080_1x1 wide:1920x1080_16x9; do
  k=${f%%:*}; n=${f#*:}
  ffmpeg -y -loglevel error -i _$k.mp4 -i score.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -t 25 -movflags +faststart "LOLFEST_WIZKID_ANIMATED-AD_25s_${n}.mp4"
done
