#!/usr/bin/env bash
# Finish a reel: mux picture + master mix → 9:16 deliverable, 4:5 centre-safe crop, poster, QA report.
#   engine/finish.sh <build-name> <export-dir> <out-stem>
set -euo pipefail
cd "$(dirname "$0")/.."
NAME="$1"; DEST="$2"; STEM="$3"
PIC="build/${NAME}_picture.mp4"; MIX="build/${NAME}_mix.wav"
mkdir -p "$DEST" qa
# 9:16 master (1080×1920). Audio AAC 256k; tag as stereo; faststart for social upload.
ffmpeg -v error -y -i "$PIC" -i "$MIX" -map 0:v -map 1:a -c:v libx264 -preset slow -crf 20 -maxrate 7M -bufsize 14M -pix_fmt yuv420p -c:a aac -aac_coder fast -b:a 256k -ar 48000 -shortest -movflags +faststart "$DEST/${STEM}_9x16.mp4"
# 4:5 (1080×1350) — every reel keeps its story-critical content inside the centre band y 285–1635.
ffmpeg -v error -y -i "$PIC" -i "$MIX" -map 0:v -map 1:a -vf "crop=1080:1350:0:285" -c:v libx264 -preset slow -crf 20 -maxrate 5M -bufsize 10M -pix_fmt yuv420p -c:a aac -aac_coder fast -b:a 256k -ar 48000 -shortest -movflags +faststart "$DEST/${STEM}_4x5.mp4"
python3 engine/review.py "$DEST/${STEM}_9x16.mp4" --cues "build/${NAME}.cues.json" --out qa
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,codec_name,pix_fmt:format=duration,size -of compact "$DEST/${STEM}_9x16.mp4"
ffprobe -v error -select_streams v:0 -show_entries stream=width,height:format=duration,size -of compact "$DEST/${STEM}_4x5.mp4"
