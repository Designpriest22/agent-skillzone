#!/usr/bin/env sh
# Download the static font files the build scripts outline. All SIL OFL,
# served by Google Fonts. Usage: sh fetch_fonts.sh <fonts-dir>
set -eu
dir=${1:-fonts}
mkdir -p "$dir"
g=https://fonts.gstatic.com/s
get() { curl -fsSL -o "$dir/$1" "$2"; }
get Unbounded-500.ttf    $g/unbounded/v12/Yq6F-LOTXCb04q32xlpat-6uR42XTqtG6yrx040.ttf
get Unbounded-700.ttf    $g/unbounded/v12/Yq6F-LOTXCb04q32xlpat-6uR42XTqtG6__2040.ttf
get Onest-700.ttf        "$(curl -fsSL -A 'Mozilla/4.0' 'https://fonts.googleapis.com/css2?family=Onest:wght@700' | grep -oE 'https://[^)]+\.ttf' | head -1)"
get Martian-400.ttf      $g/martianmono/v6/2V08KIcADoYhV6w87xrTKjs4CYElh_VS9YA4TlTnQzaVMIE6j15dYY1qu86W.ttf
get Gloock-400.ttf       $g/gloock/v8/Iurb6YFw84WUY4N5jw.ttf
get ArchivoCond-800.ttf  $g/archivo/v25/k3k6o8UDI-1M0wlSV9XAw6lQkqWY8Q9osJaRE-NWIDdgffTTtDRp8A.ttf
echo "fonts in $dir"
