#!/usr/bin/env bash
# Rebuild the Destination Nigeria brand kit v2 from source.
# Needs: python3 (numpy scipy pillow opencv-python-headless python-docx python-pptx openpyxl fonttools uharfbuzz svgelements markdown),
#        node + playwright (Chromium), ffmpeg, LibreOffice (soffice), poppler-utils.
# Install the fonts in ../../03_COLOR_AND_TYPOGRAPHY/fonts_v2/static first.
# The client-supplied photographs live in ../../06_PHOTOGRAPHY_AND_MEDIA/SUPPLIED_BY_CLIENT (photo.py re-grades them).
set -euo pipefail
cd "$(dirname "$0")"
R() { node render.mjs "_jobs/$1"; }
SUP=../../06_PHOTOGRAPHY_AND_MEDIA/SUPPLIED_BY_CLIENT
python3 photo.py "$SUP"                                  # 06 graded library + register (copies originals back in place)
python3 plates.py && R _jobs_plates.json && R _jobs_plates_x.json   # 04 engraved plates
python3 logos.py && R _jobs_logos.json && (cd ../../02_LOGO_MASTER_FILES && mkdir -p EPS && for f in PDF/*.pdf; do pdftops -eps "$f" "EPS/$(basename "${f%.pdf}").eps"; done)
python3 tokens.py && python3 icons.py && python3 graphics2.py && R _jobs_graphics2.json
python3 backgrounds2.py && R _jobs_bg2.json
python3 social2.py && R _jobs_social2.json
python3 pptx2.py && (cd ../../10_PRESENTATION_TEMPLATES && soffice --headless --convert-to pdf DN_Presentation-Template_16x9.pptx >/dev/null)
python3 documents.py && (cd ../../09_DOCUMENT_TEMPLATES && for f in */*.docx; do soffice --headless --convert-to pdf --outdir "$(dirname "$f")" "$f" >/dev/null; done)
python3 cards.py && R _jobs_cards.json
python3 web2.py && R _jobs_web2.json
python3 events2.py && R _jobs_events2.json
python3 boards.py && R _jobs_boards.json
python3 sonic.py && python3 motion.py && python3 film.py && python3 lottie.py
(cd ../../07_MOTION_IDENTITY/SOURCE_PROJECTS && node render_motion.mjs)
python3 guidelines2.py && R _jobs_guidelines2.json
python3 mdpdf.py
python3 compare.py
python3 qa2.py
