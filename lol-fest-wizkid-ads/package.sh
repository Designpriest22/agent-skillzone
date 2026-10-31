#!/usr/bin/env bash
# Sorts rendered spots into the delivery folders, derives 1080p versions from the 4K masters,
# and builds storyboards / cue sheets / the editable project archive.   ->  out/01..07
set -euo pipefail
cd "$(dirname "$0")"
W=out/_work; P=LOLFEST_WIZKID
D1=out/01-CINEMATIC-VIDEO-ADS D2=out/02-SOCIAL-STORY-ANIMATIONS D3=out/03-INSTAGRAM-FACEBOOK D4=out/04-TIKTOK D5=out/05-BILLBOARD-ADVERTISEMENTS D6=out/06-MASTER-EXPORTS D7=out/07-PROJECT-FILES-ASSETS
rm -rf $D1 $D2 $D3 $D4 $D5 $D6 $D7; mkdir -p $D1 $D2 $D3 $D4 $D5 $D6 $D7/storyboards $D7/soundtracks $D7/cue-sheets
FF="ffmpeg -y -v error"
ENC="-c:v libx264 -preset slow -profile:v high -pix_fmt yuv420p -colorspace bt709 -color_primaries bt709 -color_trc bt709 -c:a copy -movflags +faststart"
for C in C1-The-Superstar-Experience C2-The-Festival-Is-Calling C3-The-Big-Wiz-Moment; do
  B="${P}_${C}_20s"
  # 01 hero landscape (downscaled from the 4K master)  + 06 master
  $FF -i "$W/${B}_3840x2160_16x9_MASTER.mp4" -vf scale=1920:1080:flags=lanczos $ENC -crf 17 -level 4.2 "$D1/${B}_1920x1080_16x9_Landscape.mp4"
  cp "$W/${B}_3840x2160_16x9_MASTER.mp4" "$D6/"
  # 03 Instagram / Facebook
  cp "$W/${B}_1080x1920_9x16_IG-FB-Stories.mp4" "$D3/"
  cp "$W/${B}_1080x1920_9x16_Reels-TikTok-SafeZone.mp4" "$D3/${B}_1080x1920_9x16_IG-Reels.mp4"
  cp "$W/${B}_1080x1350_4x5_IG-FB-Feed.mp4" "$D3/"
  cp "$W/${B}_1080x1080_1x1_Square-Social.mp4" "$D3/"
  # 04 TikTok (UI-safe layout)
  cp "$W/${B}_1080x1920_9x16_Reels-TikTok-SafeZone.mp4" "$D4/${B}_1080x1920_9x16_TikTok.mp4"
  # 05 billboards
  cp "$W/${B}_3840x2160_16x9_Billboard-Landscape-MASTER.mp4" "$D5/${B}_3840x2160_16x9_Billboard-Landscape-4K.mp4"
  $FF -i "$W/${B}_3840x2160_16x9_Billboard-Landscape-MASTER.mp4" -vf scale=1920:1080:flags=lanczos $ENC -crf 16 -level 4.2 "$D5/${B}_1920x1080_16x9_Billboard-Landscape.mp4"
  cp "$W/${B}_1080x1920_9x16_Billboard-Portrait.mp4" "$D5/"
done
for f in "$W"/${P}_S*_MASTER.mp4; do
  n=$(basename "$f" _MASTER.mp4)
  cp "$f" "$D6/"
  $FF -i "$f" -c:v libx264 -preset slow -crf 19 -profile:v high -level 4.2 -pix_fmt yuv420p -colorspace bt709 -color_primaries bt709 -color_trc bt709 -c:a copy -movflags +faststart "$D2/${n}.mp4"
  cp "$D2/${n}.mp4" "$D4/${n/Story-Reels-TikTok/TikTok}.mp4"
done
# 07: storyboards (one still per second, timecoded), soundtracks, cue sheets, audit, editable project
FONT=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf
for f in "$D1"/*.mp4 "$D2"/*.mp4; do
  n=$(basename "$f" .mp4); d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f" | cut -d. -f1)
  $FF -i "$f" -vf "fps=1,scale=480:-2,drawtext=fontfile=$FONT:text='%{pts\:hms}':x=10:y=10:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.6,tile=10x$(( (d + 9) / 10 )):padding=6:color=0x222222" -frames:v 1 -q:v 3 "$D7/storyboards/${n}_storyboard.jpg"
done
cp $W/*.cues.json $D7/cue-sheets/ ; for w in $W/*.wav; do case "$w" in *.raw.wav) ;; *) cp "$w" "$D7/soundtracks/$(basename "$w" .wav)_soundtrack_-14LUFS.wav";; esac; done
cp out/content-audit.json $D7/ 2>/dev/null || true
tar --exclude=node_modules --exclude=footage --exclude=out -czf "$D7/${P}_editable-project.tar.gz" -C .. "$(basename "$PWD")"
du -sh out/0*
