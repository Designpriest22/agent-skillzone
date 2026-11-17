#!/bin/sh
# CMYK print exports from the RGB PDF (needs Ghostscript):
#   out/print/live-out-loud-times_CMYK.pdf     all 4 pages, DeviceCMYK
#   out/print/page-N_CMYK_300dpi.tif           CMYK TIFF per page, 300 dpi, LZW
cd "$(dirname "$0")/.."
mkdir -p out/print
gs -q -o out/print/live-out-loud-times_CMYK.pdf -sDEVICE=pdfwrite -sColorConversionStrategy=CMYK -sProcessColorModel=DeviceCMYK \
   -dPDFSETTINGS=/prepress -dAutoRotatePages=/None out/live-out-loud-times.pdf
gs -q -o out/print/page-%d_CMYK_300dpi.tif -sDEVICE=tiff32nc -r300 -sCompression=lzw -dTextAlphaBits=4 -dGraphicsAlphaBits=4 out/live-out-loud-times.pdf
