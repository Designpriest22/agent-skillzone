#!/bin/bash
# sheet.sh dir out.jpg [cols]
cols=${3:-7}
montage -label '%t' $(ls $1/*.png) -tile ${cols}x -geometry 300x375+3+3 -background '#222' -fill '#ddd' -pointsize 15 -quality 85 $2
