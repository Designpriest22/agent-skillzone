#!/usr/bin/env bash
# Rebuild the entire Destination Nigeria brand kit from source.
# Needs: python3 (numpy scipy pillow python-docx python-pptx openpyxl fonttools uharfbuzz svgelements contourpy markdown),
#        node + playwright (Chromium), ffmpeg, LibreOffice (soffice), poppler-utils. Install the fonts in ../../03_COLOR_AND_TYPOGRAPHY/fonts first.
set -euo pipefail
cd "$(dirname "$0")"
J=_jobs; mkdir -p $J
R() { node render.mjs "$J/$1"; }
python3 logos.py && R _jobs_logos.json && (cd ../../02_LOGO_MASTER_FILES && mkdir -p EPS && for f in PDF/*.pdf; do pdftops -eps "$f" "EPS/$(basename "${f%.pdf}").eps"; done)
python3 tokens.py
python3 icons.py
python3 graphics.py && R _jobs_graphics.json
python3 backgrounds.py && R _jobs_backgrounds.json
python3 sonic.py
python3 motion.py && python3 intro.py && python3 lottie.py && (cd ../../07_MOTION_IDENTITY/SOURCE_PROJECTS && node render_motion.mjs)
python3 documents.py && (cd ../../09_DOCUMENT_TEMPLATES && for f in */*.docx; do soffice --headless --convert-to pdf --outdir "$(dirname "$f")" "$f" >/dev/null; done)
python3 cards.py && R _jobs_cards.json
python3 pptx_build.py && (cd ../../10_PRESENTATION_TEMPLATES && soffice --headless --convert-to pdf DN_Presentation-Template_16x9.pptx >/dev/null)
python3 social.py && R _jobs_social.json
python3 website.py && R _jobs_web.json
python3 events.py && R _jobs_events.json
python3 mockups.py && R _jobs_mockups.json
python3 guidelines.py && R _jobs_guidelines.json
python3 mdpdf.py
python3 qa.py
