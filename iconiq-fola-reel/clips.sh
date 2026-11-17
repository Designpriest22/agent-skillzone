#!/usr/bin/env bash
# bash clips.sh <dir with the three source clips>  -> clips/ (frames) and clips/aud (audio)
set -e; U=$1
ex(){ mkdir -p clips/$1; ffmpeg -v error -y -ss $3 -t $4 -i $U/*$2*.mp4 -vf "fps=30,scale=720:960" -q:v 3 clips/$1/%03d.jpg; }
ex pyro 1794823863 0 3.2; ex hand 1794592114 7.4 3.8; ex red 1794823851 0 3.2
ex t1 1794823863 7.5 3.2; ex t2 1794592114 1.0 3.2; ex t3 1794823851 6 3.2
mkdir -p clips/aud
au(){ ffmpeg -v error -y -ss $3 -t $4 -i $U/*$2*.mp4 -vn -ac 2 -ar 48000 clips/aud/$1.wav; }
au pyro 1794823863 0 3; au hand 1794592114 7.4 3.6; au red 1794823851 0 2.6; au trip 1794592114 1.0 3.2; au bed 1794592114 12 12
# velvet.html: the red-curtain editorial clip (1794831030)
V=$(ls $U/*1794831030*.mp4)
vx(){ mkdir -p clips/v/$1; ffmpeg -v error -y -ss $2 -t $3 -i "$V" -vf "fps=30,scale=720:1280" -q:v 3 clips/v/$1/%03d.jpg; }
vx chain 0 2.7; vx face 60.4 2.7; vx dance 47 2.7; vx gloves 13 2.7; vx splitA 4 2.7; vx splitB 52 2.7
vx macro 16 1.2; vx close 38 1.6; vx ticket 26 2.7; vx url 72 2.7; vx end 42 3.2
mkdir -p clips/v/stills; for t in 24.3 40.2 49.3 71.6; do ffmpeg -v error -y -ss $t -i "$V" -frames:v 1 -vf scale=720:1280 -q:v 2 clips/v/stills/$t.jpg; done
