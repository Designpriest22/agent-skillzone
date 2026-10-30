# Change report: v1.1 → v2.0 (creative quality reset)

## In one paragraph
v1 was technically complete but visually generic. It surrounded the supplied logo with procedurally generated hills, concentric rings, gold swooshes, contour wallpaper, pill buttons and fake device mockups, set in Playfair and Inter. v2 rebuilds the system around the logo's own idea: **the land, drawn and photographed**. The client-supplied photographs of real Nigerian places were verified, graded and captioned. Engraved plates are traced from them, as vector line engravings, to give the brand an illustration language with craft and a real subject. Every deliverable was rebuilt on a horizon composition, a new type system (Newsreader and Public Sans), a reduced palette and the supplied contact details. Fewer assets, each with a job.

## What changed, and why
| Area | v1.1 | v2.0 | Why |
|---|---|---|---|
| Imagery | Illustrated landscape placeholders standing in for photography | 9 verified client photographs, graded consistently and captioned; 4 rejected (Indonesia, Mauritius, a composite, a duplicate) | Show real places; never misrepresent the destination |
| Illustration | Procedural hills, domes and sunsets | Engraved plates (Zuma Rock, Agbokim Waterfalls), traced from the photographs, pure vector | Art with a real subject; prints sharp at any size |
| Typography | Playfair Display, Inter, Source Serif 4 | Newsreader Display, Newsreader Text, Public Sans | Playfair lacks ₦ and tabular figures; Inter is the generic default |
| Colour | 15 colours, including invented landscape accents | 10 colours; Sun Gold under 3 %; Gold Text for accessible gold | One identity, not a paint box |
| Composition | One template everywhere: logo top left, overline, big serif, pill, swoosh | The horizon composition (low, middle, high, none) plus the plate composition; captions as the signature detail | Variety within a recognisable system |
| Logo family | 26 masters, including stacked, horizontal, landscape symbol and three roundels | Primary in five colourways, small format, production path, roundel (avatars only) | Each variant has a use |
| Backgrounds | 14, built on gradients, glows, grain and contours | 8 grounds made only from Paper, Forest, the horizon, the sun, plates and photographs | Fewer, purposeful |
| Social | 8 families, one composition repeated | 7 compositions with distinct jobs, in 4 formats (28) | Recognisable without sameness |
| Presentation | 21 layouts on illustrated backgrounds | 19 information-first layouts: summary, finding, data, figures, timeline, investment, partnership, financials, recommendations | Built for the work a tourism body presents |
| Documents | Tinted tables, coloured call-outs, illustrated covers, placeholder contacts | Editorial restyle: hairline tables, photo and plate covers, real contacts | Working documents, not decoration |
| Stationery | Placeholder name and contacts, contour pattern | Cards and signatures for Destination Nigeria, Eddie Madaki and Lulu, with the real details | Supplied contacts applied |
| Website | Rounded cards, pills, illustrated hero | Homepage design (desktop and mobile), square components, real photography | Credible and editorial |
| Events | Rings, ribbons, seals | Programme, invitation, badge, wayfinding, roll-up, media wall, screens: vector plates at true size | Legible, honest, scalable |
| Mockups | 12 CSS "device" scenes | 6 flat presentation boards, labelled as such | Fake mockups undermined credibility |
| Motion | Bloom, rings, ribbon wipes, iris, embers, pop-in cards | Brand film (engraving becomes photograph), logo reveal, sting, seamless plate loop, Lottie sting | The simplest strong motion, on the beat |
| Sound | Intro score with whooshes | New film score: burin scrape, groove, motif; no whooshes | Synced to the new picture |

## Before and after
See `creative-audit/compare/` (nine side-by-side sheets), `creative-audit/before/` and `creative-audit/after/`.

## Defects found and fixed during the rebuild
- **Stretched plates.** A non-uniform resize made Zuma Rock about 25 % taller. The crop now keeps true proportions, and every dependent file was rebuilt.
- **Wrong fonts in Word.** Theme fonts overrode the brand fonts, so Word titles rendered in Calibri. Theme attributes are now removed.
- **Glyph fallback.** Arrow glyphs missing from the brand fonts fell back to other faces in a report caption and on the wayfinding sign. The text was rewritten and the arrow is now drawn.
- **Layout.** Fixed layout collisions in social, the hero crop, the sun position on one background, and the guidelines' contents page and page size.

## Verified, not assumed
- Every v2 asset was rendered and inspected as an image.
- The film was checked frame by frame at both plate-to-photograph transitions.
- QA v2 (`DN_QA-Report.md`) passes 31 of 31 automated checks. They cover:
  - fonts embedded in 40 PDFs;
  - retired colours;
  - contacts in every template;
  - rejected images unused;
  - plate proportions;
  - logo path integrity;
  - Office editability;
  - exact social sizes;
  - true-size print PDFs;
  - film duration, frame rate and audio;
  - a seamless loop;
  - −16 LUFS score.

## Limitations, stated precisely
- **Photo rights.** The supplied images have no photographer or licence data. The register records them as *to be confirmed by client*. Clear each one before publication.
- **Tarkwa Bay.** The location is not confirmed: turquoise water and white sand are unusual for Lagos. The image appears only on a presentation board.
- **Low resolution.** Five images are under 800 px. They are used only at small sizes, and only two subjects proved strong enough to engrave well. The Idanre, Obudu, Lekki and Ibadan engravings were tried and rejected because they read as noise.
- **Website address.** The address is inferred from the email domain. No postal address, roles or surnames were supplied, so none are invented. Cards and signatures omit roles.
- **Connectors.** Adobe, Canva and Figma could not be reached from this environment (proxy 403). Magnific stock downloads were rate-limited and are not used. Deliverables are in open formats that import into those tools.
- **Office fonts.** Office needs Newsreader and Public Sans installed or embedded to render as designed.

## Retired (still in git history at v1.1)
- Stacked, horizontal, landscape-symbol and gold-roundel logos.
- Patterns, ribbons, badges, dividers, section markers, photo masks and watermarks.
- 14 v1 backgrounds and the illustrated placeholders.
- v1 social families, the loader and the CSS mockups.
- Motion A–E and the D loop.
- The v1 fonts and v1 specifications.

The illustrated 25 s intro (F) is kept in `07_MOTION_IDENTITY/ARCHIVE_v1/` because it was commissioned separately.
