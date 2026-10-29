# Handover report: Destination Nigeria Brand Identity Kit v1.0

## 1. What was produced
- **Brand foundation:** essence (*Horizons, opened.*), purpose, positioning, promise, personality, values, audiences, messaging hierarchy, tone of voice and visual principles. The visual territory is called “Horizon & Inselberg”.
- **Logo family:** 26 masters built from the supplied paths without redrawing them: primary, horizontal, stacked, Horizon Roundel (compact symbol), landscape symbol, reversed, all-white, one-colour green, black, a production compound path, and small-format versions. Each comes as SVG, PDF, EPS and transparent PNG. Clear-space and minimum-size rules are documented.
- **Colour and type:** 15 documented colours (5 sampled from the logo, 10 recommended) with HEX, RGB, coated-stock CMYK starting values, contrast ratios and usage; UI, document and photo-grading guidance; swatch files in ASE, GPL, CSV and JSON. Type uses Playfair Display, Inter and Source Serif 4 (all OFL) with a 13-step hierarchy and Office fallbacks.
- **Graphic language:** 32 icons in line and solid styles (14 brief categories plus 18 extras), 4 seamless patterns in 3 colourways, horizon ribbons, landscape bands, contour strips, geometric elements, photo masks, dividers, 12 section markers, Nigeria maps and a route kit (Natural Earth data), campaign lockups, a seal, partner and event badges, avatars and watermarks.
- **Backgrounds:** 14 art-directed backgrounds in 5 formats each, with vector PDFs for A4 and 16:9, 4K versions of four, overlays and a grain texture.
- **Motion:** A (7 s cinematic, dark and light, with sonic logo), B (2.5 s minimal, 4 aspect ratios), C (8 s presentation opener with audio), D (20 s seamless loop, 3 versions) and E (3 s symbol). Formats: MP4, WebM, alpha MOV, alpha WebM, GIF, final-frame PNG, and Lottie for B and E.
- **Sonic identity:** an original synthesised sonic logo (6.5 s), sting (2.5 s) and seamless 30 s bed. WAV masters are 48 kHz / 24-bit at −16 or −18 LUFS, with MP3 versions.
- **Documents:** 22 DOCX templates with real Word styles and content controls, PDF exports, DOTX copies, calculating XLSX invoice, quotation and action tracker, business cards (standard and premium, with bleed and crop marks, SVG sources, batch generator) and an HTML email signature.
- **Presentation:** a PowerPoint master with brand theme colours and fonts, 21 layouts, always-on slide numbers, and a 21-slide sample deck with a native chart and table (PPTX, POTX and PDF).
- **Social:** 8 template families in 4:5, 1:1, 9:16 and 16:9, plus YouTube, web banner, MPU and leaderboard (40 templates). They are SVG with live text and are driven by `content.json`.
- **Web:** CSS and JSON design tokens, a component library (buttons, search, three card types, forms, alerts, newsletter, map, 404 and empty states, loader), a complete favicon set and manifest, an OG image, hero images, WebP backgrounds and a MapLibre style.
- **Events and signage:** programme, speaker card, 4K stage screen, 3 × 2.4 m media wall, invitation, A6 badge, A2 wayfinding, sponsor screen, roll-up and exhibition panel. Print items are vector PDFs at true size.
- **Guidelines:** a 36-page A4-landscape PDF with live visual examples, the editable HTML/CSS source, and a one-page quick-reference sheet.
- **Mockups:** 12 application scenes built from the real exported artwork.

## 2. Editable vs. export
| Editable source | Production export |
|---|---|
| SVG (logos, graphics, backgrounds, social, events, cards). They open in Illustrator, Figma, Inkscape and Affinity. Text is live except in logo and campaign artwork, where it is outlined on purpose. | PNG, JPG, WebP |
| PDF and EPS logos are vector and open as editable paths in Illustrator. | PDF print files (vector, true size, bleed where specified) |
| DOCX, DOTX, XLSX, PPTX, POTX | PDF exports of every template |
| HTML/CSS (guidelines, components, motion compositions, mockup scenes), JSON (tokens, social content, Lottie) | MP4, WebM, MOV, GIF, WAV, MP3 |
| Python/Node generators in `16_SOURCE_FILES/build` | — |

## 3. Production-ready now
The logo masters, colour and type system, icons, patterns, backgrounds, motion and sonic files, the PowerPoint master, web tokens and components, favicons, and all document templates once the placeholders are filled. Business-card and print PDFs are ready once the real details are entered and a proof is approved.

## 4. Assets that need an external application or a decision
- **After Effects:** no `.aep` project could be created (no AE in the environment). Equivalents are provided: deterministic HTML compositions, alpha MOVs, Lottie, and SVG/PDF layers for AE import (see `07/README.md`).
- **Adobe Illustrator `.ai` / Figma files:** the Adobe, Canva and Figma connectors failed to connect during this session (proxy 403). The SVG, PDF and EPS files are the editable vector masters. Saving the PDFs as `.ai` from Illustrator is a one-step task.
- **Pantone:** candidates are listed (Forest 3435 C / 553 C; Gold 7409 C / 7563 C). Verify them against a physical guide.
- **CMYK:** coated-stock starting values were tuned by hand. Request press proofs.

## 5. Licensing
Fonts are SIL OFL. Map data is Natural Earth (public domain). Everything else (icons, graphics, backgrounds, placeholders, motion, audio) is original to this kit. **No stock photography or third-party audio is included.** A Freepik search returned no verifiable Nigerian locations, so nothing from it was used. See `06_PHOTOGRAPHY_AND_MEDIA/LICENSES_AND_ATTRIBUTION/LICENSES.md`.

## 6. Missing information (needed from Destination Nigeria)
1. The executive concept note, to validate the strategy wording.
2. Verified contact details: postal address, telephone, email, website, official social handles.
3. Statutory or registration wording for letterhead and invoice footers, and tax/VAT treatment.
4. The name of the brand owner or approver for governance.
5. Licensed photography (use the shot list in `06/README.md`).
6. Partner list with signed permissions and logo files.
7. Confirmed programme details (e.g. National Tourism Week dates and venue) before any announcement.
8. Verified data for investment profiles and statistics.

## 7. Notes on the supplied logo
The supplied reversed file (Asset_1) has the first “i” dot about 1 unit off-centre. The kit’s reversed masters correct this using the full-colour geometry. Both originals are archived untouched.

## 8. Extending the kit
- **New colour or type value:** edit `16_SOURCE_FILES/build/brand.py`, then run `build_all.sh`. Everything regenerates.
- **New social post:** add an entry to `11_SOCIAL_MEDIA_TEMPLATES/content.json` and run `social.py`, or duplicate the SVG in Figma.
- **New staff cards:** add people to `09_DOCUMENT_TEMPLATES/BUSINESS_CARDS/staff.json` and run `cards.py`.
- **New animation timing:** edit the `seg()` values in `07_MOTION_IDENTITY/SOURCE_PROJECTS/*.html`, then run `node render_motion.mjs`.
- **Version control:** record changes in `CHANGELOG.md`, bump versions on derivatives, and never overwrite masters.
- **Recommended v2 work:** commission photography; re-record the sonic motif with Nigerian musicians; add state boundaries to the maps from an authoritative source; set up co-branding lockups for confirmed partners; produce merchandise artwork.
