#!/usr/bin/env bash
# out/_work/sponsors/<NN-Name>/*.mp4  ->  out/08-SPONSOR-CO-BRANDED-ADS/<NN-Name>/ (3 formats + storyboard), + inventory + audit
set -euo pipefail
cd "$(dirname "$0")"
D=out/08-SPONSOR-CO-BRANDED-ADS; rm -rf "$D"; mkdir -p "$D"
FONT=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf
for d in out/_work/sponsors/*/; do
  n=$(basename "$d"); mkdir -p "$D/$n"; cp "$d"*.mp4 "$D/$n/"
  v=$(ls "$D/$n"/*9x16*.mp4)
  ffmpeg -y -v error -i "$v" -vf "fps=1,scale=300:-2,drawtext=fontfile=$FONT:text='%{pts\:hms}':x=8:y=8:fontsize=16:fontcolor=white:box=1:boxcolor=black@0.6,tile=15x1:padding=4:color=0x222222" -frames:v 1 -q:v 3 "$D/$n/${n}_storyboard_9x16.jpg"
done
cp SPONSOR-INVENTORY.md "$D/"; cp out/sponsor-content-audit.json "$D/" 2>/dev/null || true
du -sh "$D"
