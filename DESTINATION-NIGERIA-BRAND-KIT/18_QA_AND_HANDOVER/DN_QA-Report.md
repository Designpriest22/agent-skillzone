# Quality assurance report

Automated checks run by `16_SOURCE_FILES/build/qa.py`: **59 / 59 passed.**

Kit size: 213.8 MB · 1104 files (1021 deliverables outside the build sources).

| Area | Check | Result | Detail |
|---|---|---|---|
| Vector | 373 SVG files parse as valid XML | ✅ Pass |  |
| Vector | Every SVG (except the sprite) has a viewBox | ✅ Pass |  |
| Vector | Logo SVGs contain no embedded raster images | ✅ Pass |  |
| Logo | Primary master reuses all 24 supplied paths verbatim | ✅ Pass | 24 supplied paths |
| Logo | Logo family files present | ✅ Pass | 26 SVG masters |
| Logo | 63 logo PNGs have transparent backgrounds | ✅ Pass |  |
| Backgrounds | Raster backgrounds match their declared dimensions | ✅ Pass |  |
| Backgrounds | At least 12 distinct backgrounds | ✅ Pass | 14 backgrounds |
| Backgrounds | Every background exported as 16x9_1920x1080.jpg | ✅ Pass |  |
| Backgrounds | Every background exported as 4x5_1080x1350.jpg | ✅ Pass |  |
| Backgrounds | Every background exported as 9x16_1080x1920.jpg | ✅ Pass |  |
| Backgrounds | Every background exported as A4-portrait.pdf | ✅ Pass |  |
| Backgrounds | Every background exported as A4-landscape.pdf | ✅ Pass |  |
| PDF | 114 PDFs open | ✅ Pass |  |
| Documents | 22 template PDFs are A4 | ✅ Pass |  |
| Guidelines | Guidelines PDF is A4 landscape with at least 30 pages | ✅ Pass | 36 pages |
| Guidelines | All fonts embedded in the guidelines PDF | ✅ Pass | 12 fonts; 0 not embedded |
| Guidelines | Guidelines use only the brand typefaces (+ Arial in the misuse example) | ✅ Pass | DejaVuSans, DejaVuSansMono, Inter, LiberationSans, PlayfairDisplay, SourceSerif4 |
| Documents | 22 DOCX templates open in python-docx | ✅ Pass |  |
| Documents | Templates use Word content controls for placeholders | ✅ Pass | 524 content controls |
| Documents | Every DOCX has a PDF export | ✅ Pass |  |
| Documents | No invented phone numbers, bank details or lorem ipsum | ✅ Pass |  |
| Presentation | PPTX master has ≥ 19 named layouts | ✅ Pass | 21 layouts, 21 sample slides |
| Presentation | Sample deck contains native editable chart and table | ✅ Pass | 1 chart(s), 1 table(s) |
| Documents | Invoice XLSX calculates (formulas present) | ✅ Pass | 13 formulas |
| Motion | DN_motion_A_cinematic-reveal_dark_1920x1080.mp4 is H.264 yuv420p | ✅ Pass | yuv420p |
| Motion | DN_motion_A_cinematic-reveal_fullcolour_ALPHA_1920x1080.webm carries an alpha channel | ✅ Pass | yuv420p |
| Motion | DN_motion_A_cinematic-reveal_fullcolour_ALPHA_1920x1080_alpha-PNG.mov carries an alpha channel | ✅ Pass | rgba |
| Motion | DN_motion_A_cinematic-reveal_light_1920x1080.mp4 is H.264 yuv420p | ✅ Pass | yuv420p |
| Motion | DN_motion_A_cinematic-reveal_reversed_ALPHA_1920x1080.webm carries an alpha channel | ✅ Pass | yuv420p |
| Motion | DN_motion_A_cinematic-reveal_reversed_ALPHA_1920x1080_alpha-PNG.mov carries an alpha channel | ✅ Pass | rgba |
| Motion | DN_motion_B_minimal-reveal_dark_1080x1920.mp4 is H.264 yuv420p | ✅ Pass | yuv420p |
| Motion | DN_motion_B_minimal-reveal_dark_1920x1080.mp4 is H.264 yuv420p | ✅ Pass | yuv420p |
| Motion | DN_motion_B_minimal-reveal_fullcolour_ALPHA_1920x1080.webm carries an alpha channel | ✅ Pass | yuv420p |
| Motion | DN_motion_B_minimal-reveal_fullcolour_ALPHA_1920x1080_alpha-PNG.mov carries an alpha channel | ✅ Pass | rgba |
| Motion | DN_motion_B_minimal-reveal_light_1080x1080.mp4 is H.264 yuv420p | ✅ Pass | yuv420p |
| Motion | DN_motion_B_minimal-reveal_light_1920x1080.mp4 is H.264 yuv420p | ✅ Pass | yuv420p |
| Motion | DN_motion_C_presentation-opener_1920x1080.mp4 is H.264 yuv420p | ✅ Pass | yuv420p |
| Motion | DN_motion_E_symbol_ALPHA_1080x1080.webm carries an alpha channel | ✅ Pass | yuv420p |
| Motion | DN_motion_E_symbol_ALPHA_1080x1080_alpha-PNG.mov carries an alpha channel | ✅ Pass | rgba |
| Motion | DN_motion_E_symbol_on-forest_1080x1080.mp4 is H.264 yuv420p | ✅ Pass | yuv420p |
| Motion | DN_motion_E_symbol_on-ivory_1080x1080.mp4 is H.264 yuv420p | ✅ Pass | yuv420p |
| Motion | DN_motion_D_brand-loop_1080x1920.mp4 is H.264 yuv420p | ✅ Pass | yuv420p |
| Motion | DN_motion_D_brand-loop_1920x1080.mp4 is H.264 yuv420p | ✅ Pass | yuv420p |
| Motion | DN_motion_D_brand-loop_with-logo_1920x1080.mp4 is H.264 yuv420p | ✅ Pass | yuv420p |
| Motion | All five animations (A–E) rendered | ✅ Pass | A, B, C, D, E |
| Motion | Loop D is seamless (seam ≤ 2× typical frame step) | ✅ Pass | seam 0.363 vs step 0.281 |
| Motion | 5 Lottie files are valid Bodymovin JSON (rendered in lottie-web 5.12.2) | ✅ Pass |  |
| Sonic | DN_sonic-intro-bed_30s_seamless-loop.wav: 48 kHz 24-bit stereo | ✅ Pass | 48000 pcm_s24le 2ch 30.00s |
| Sonic | DN_sonic-intro-bed_30s_seamless-loop.wav: loudness -18.0 LUFS, true peak -5.3 dBFS ≤ −1 | ✅ Pass |  |
| Sonic | Intro bed loop seam is continuous | ✅ Pass | seam 0.00009, mean step 0.00597 |
| Sonic | DN_sonic-logo_primary_6-5s.wav: 48 kHz 24-bit stereo | ✅ Pass | 48000 pcm_s24le 2ch 6.50s |
| Sonic | DN_sonic-logo_primary_6-5s.wav: loudness -15.6 LUFS, true peak -2.6 dBFS ≤ −1 | ✅ Pass |  |
| Sonic | DN_sonic-sting_2-5s.wav: 48 kHz 24-bit stereo | ✅ Pass | 48000 pcm_s24le 2ch 2.50s |
| Sonic | DN_sonic-sting_2-5s.wav: loudness -16.0 LUFS, true peak -5.3 dBFS ≤ −1 | ✅ Pass |  |
| Sonic | MP3 versions exist for every WAV | ✅ Pass | 3 MP3 |
| Social | At least 8 template families with PNG examples | ✅ Pass | 8 families, 40 PNGs |
| Organisation | No spaces in file names | ✅ Pass |  |
| Organisation | Deliverables follow the DN_ naming convention | ✅ Pass |  |

## Rendered video inventory

| File | Codec | Size | Duration | Pixel format | Audio |
|---|---|---|---|---|---|
| DN_motion_A_cinematic-reveal_dark_1920x1080.mp4 | h264 | 1920x1080 | 7.00s | yuv420p | yes |
| DN_motion_A_cinematic-reveal_dark_1920x1080.webm | vp9 | 1920x1080 | 7.01s | yuv420p | yes |
| DN_motion_A_cinematic-reveal_fullcolour_ALPHA_1920x1080.webm | vp9 | 1920x1080 | 7.00s | yuv420p | no |
| DN_motion_A_cinematic-reveal_fullcolour_ALPHA_1920x1080_alpha-PNG.mov | png | 1920x1080 | 7.00s | rgba | no |
| DN_motion_A_cinematic-reveal_light_1920x1080.mp4 | h264 | 1920x1080 | 7.00s | yuv420p | yes |
| DN_motion_A_cinematic-reveal_light_1920x1080.webm | vp9 | 1920x1080 | 7.01s | yuv420p | yes |
| DN_motion_A_cinematic-reveal_reversed_ALPHA_1920x1080.webm | vp9 | 1920x1080 | 7.00s | yuv420p | no |
| DN_motion_A_cinematic-reveal_reversed_ALPHA_1920x1080_alpha-PNG.mov | png | 1920x1080 | 7.00s | rgba | no |
| DN_motion_B_minimal-reveal_dark_1080x1920.mp4 | h264 | 1080x1920 | 2.50s | yuv420p | yes |
| DN_motion_B_minimal-reveal_dark_1920x1080.mp4 | h264 | 1920x1080 | 2.50s | yuv420p | yes |
| DN_motion_B_minimal-reveal_dark_1920x1080.webm | vp9 | 1920x1080 | 2.51s | yuv420p | yes |
| DN_motion_B_minimal-reveal_fullcolour_ALPHA_1920x1080.webm | vp9 | 1920x1080 | 2.50s | yuv420p | no |
| DN_motion_B_minimal-reveal_fullcolour_ALPHA_1920x1080_alpha-PNG.mov | png | 1920x1080 | 2.50s | rgba | no |
| DN_motion_B_minimal-reveal_light_1080x1080.mp4 | h264 | 1080x1080 | 2.50s | yuv420p | yes |
| DN_motion_B_minimal-reveal_light_1920x1080.mp4 | h264 | 1920x1080 | 2.50s | yuv420p | yes |
| DN_motion_B_minimal-reveal_light_1920x1080.webm | vp9 | 1920x1080 | 2.51s | yuv420p | yes |
| DN_motion_C_presentation-opener_1920x1080.mp4 | h264 | 1920x1080 | 8.00s | yuv420p | yes |
| DN_motion_C_presentation-opener_1920x1080.webm | vp9 | 1920x1080 | 8.01s | yuv420p | yes |
| DN_motion_E_symbol_ALPHA_1080x1080.webm | vp9 | 1080x1080 | 3.00s | yuv420p | no |
| DN_motion_E_symbol_ALPHA_1080x1080_alpha-PNG.mov | png | 1080x1080 | 3.00s | rgba | no |
| DN_motion_E_symbol_on-forest_1080x1080.mp4 | h264 | 1080x1080 | 3.00s | yuv420p | yes |
| DN_motion_E_symbol_on-forest_1080x1080.webm | vp9 | 1080x1080 | 3.01s | yuv420p | yes |
| DN_motion_E_symbol_on-ivory_1080x1080.mp4 | h264 | 1080x1080 | 3.00s | yuv420p | no |
| DN_motion_D_brand-loop_1080x1920.mp4 | h264 | 1080x1920 | 20.00s | yuv420p | no |
| DN_motion_D_brand-loop_1920x1080.mp4 | h264 | 1920x1080 | 20.00s | yuv420p | no |
| DN_motion_D_brand-loop_1920x1080.webm | vp9 | 1920x1080 | 20.00s | yuv420p | no |
| DN_motion_D_brand-loop_with-logo_1920x1080.mp4 | h264 | 1920x1080 | 20.00s | yuv420p | no |

## Visual checks (manual)

These were reviewed by rendering contact sheets during production:
- Logo family on light and dark grounds, roundel framing, minimum-size renders.
- Icon grid (line and solid) at 2.5× and 1×.
- All 14 backgrounds at 16:9; the portrait and A4 variants were spot-checked.
- Motion keyframes for A–E: the frames sampled at each phase match the storyboard, and the final frames are stable.
- Every DOCX → PDF conversion (LibreOffice), checked page by page: cover full-bleed, footer page numbers right-aligned, no text collisions.
- PPTX → PDF, all 21 slides: no overflow after the timeline fix.
- Social templates in every format: the NTW square and explore-business square layouts were corrected.
- Guidelines PDF, all 36 pages: anatomy labels and the misuse examples were corrected.
- Lottie: frames rendered in lottie-web (`lottie_test/`).

## Defects corrected during QA

- Supplied reversed logo: the first “i” dot was 1 unit off-centre. Corrected in the kit’s reversed masters.
- Roundel crop cut the monolith. Reframed the window (centre 93/7.5, r 32).
- Ridges in the backgrounds were too high-frequency. Reduced the harmonics.
- Investment background had a hard-edged block. Redesigned with sun rings.
- Report cover title collided with the sun. Made a dedicated cover background.
- Footer page numbers inherited Word’s default tab stops. Reset the footer style.
- Proposal numbering continued between lists. Switched to explicit numbering.
- Seal bottom text read upside down. Set the lower arc to read upright.
- Sonic logo had a click where a bell note was cut. Added a 30 ms release taper to every voice.
- Motion D logo was missing its wordmark (closed mask). Opened the mask.
- ffmpeg fade parameter format failed. Fixed the render script.
