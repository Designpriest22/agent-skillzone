# Handover report: Destination Nigeria brand identity kit v2.0

## What is delivered
- **Idea and strategy:**
  - creative audit of v1;
  - creative direction v2 (*the land, drawn and photographed*);
  - brand foundation v2.
- **Logo:**
  - the supplied master, preserved exactly, in five colourways;
  - a small format and a production path;
  - the roundel, for avatars only.
  - Formats: SVG, PDF, EPS, PNG.
- **Colour and type:** 10 colours with specifications and swatch files; Newsreader and Public Sans (OFL), static and variable.
- **Photography:** 9 graded, captioned library images; untouched originals; 4 rejections with reasons; a register with identification confidence and rights status.
- **Engraved plates:** Zuma Rock (with sun, quiet sky and vignette versions) and Agbokim Waterfalls, in Forest and Paper inks, as SVG, PDF and PNG.
- **Backgrounds:** 8 grounds, in 16:9 (including 4K), 4:5, 9:16 and A4 (vector PDF).
- **Social:** 7 compositions × 4 formats, with live HTML sources and `content.json`.
- **Presentation:** 19-layout master and a 16-slide sample deck (PPTX, POTX, PDF).
- **Documents:** 22 Word templates (PDF, DOTX), calculating spreadsheets, business cards (general, Eddie Madaki, Lulu) and three email signatures.
- **Website:** homepage design (desktop and mobile), tokens, components, web images, hero, OG image, favicons and map style.
- **Events:** programme, invitation, badge, wayfinding, roll-up, media wall, stage, speaker and partner screens.
- **Motion and sound:**
  - a 25 s brand film in four formats;
  - logo reveal and sting, with alpha versions;
  - a seamless plate loop and a Lottie sting;
  - sonic logo, sting, film score and bed.
- **Guidelines:** 31-page PDF and a quick reference, with HTML sources.
- **Presentation boards:** 6.
- **QA:** before/after comparisons, QA report (31/31) and change report.

## Supplied contact details, as applied
- **Telephone:** +234 909 884 3308
- **General:** info@destinationnigeria.org
- **Eddie Madaki:** eddiemadaki@destinationnigeria.org
- **Lulu:** lulu@destinationnigeria.org
- **Web:** destinationnigeria.org, inferred from the email domain. Confirm it.

Email addresses are set in lower case; they are case-insensitive.

## To confirm before publication
1. **Photo rights.** Photographer and licence for every supplied image, including derivatives, since the plates are traced from them.
2. **Tarkwa Bay.** The location of the Tarkwa Bay image.
3. **Idanre release.** A model release for the person in the Idanre image, or use crops that exclude him.
4. **Website address.**
5. **Roles and surnames** for cards and signatures, if wanted.
6. **Postal address, registration and bank details** for letterheads and invoices, which stay as placeholders.

## Editable sources vs. exports
| Editable source | Export |
|---|---|
| SVG logos, plates and lockups | PDF, EPS, PNG |
| HTML artboards (social, web, events, backgrounds, boards, guidelines) | PNG, JPG, vector PDF |
| DOCX, PPTX, XLSX (real styles, layouts and formulas) | PDF, DOTX, POTX |
| HTML motion compositions plus `film.py` timeline | MP4, WebM, alpha MOV and WebM, GIF, Lottie |
| `sonic.py` and `film.py` scores | WAV 48 kHz / 24-bit, MP3 |

## Rebuilding
Install the fonts and dependencies (`16_SOURCE_FILES/README.md`), then run `16_SOURCE_FILES/build/build_all.sh`. To add a place:
1. Put a verified, licensed, high-resolution photograph in `SUPPLIED_BY_CLIENT`.
2. Add it to `photo.py` and `brand.PHOTOS`.
3. Optionally add a plate in `plates.py`.
4. Rebuild.
