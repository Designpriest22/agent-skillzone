# Creative audit of kit v1.0 (before the reset)

This audit is based on rendered contact sheets of the actual files (`before/`), not on source code. It is deliberately blunt. The question for every element: *would anyone notice if this were moved, unchanged, onto a random hotel, airline or tourism start-up?*

## Verdict
The kit is technically complete but creatively generic. It has the correct logo, a reasonable palette and working files. But most of the visual language around the logo is stock "AI travel brand" vocabulary. Rolling green hills with a sun, concentric rings, gold swooshes, contour patterns, pill buttons and a "luxury serif + Inter" pairing could belong to any tourism brand anywhere. The supplied logo is the only truly specific thing in the system, and the system does not use its drawing at all; it replaces it with generic substitutes.

## The most damaging recurring problems (ranked)

| # | Problem | Where it appears | Why it is damaging |
|---|---|---|---|
| 1 | **Generic layered "hills + dome + sun" landscapes** that are procedurally generated, unrelated to the logo’s actual inselberg drawing | Backgrounds 05/06/09/11/14, all image placeholders, report cover, OG image, website hero, invitation, roll-up, presentation covers, mockups, intro film | This is the single most "AI-generated" signal in the kit. It competes with, and dilutes, the real mountain in the logo. |
| 2 | **Illustrated placeholders presented in the place of photography** | Every photo slot: templates, social, slides, web cards, mockups | Synthetic images where Nigeria should be shown. A tourism brand without real places looks like a template. |
| 3 | **Concentric "sun rings" / radiating circles** | Investment background, stage screen, NTW social, KPI slides, programme cover, motion C and D, guidelines cover | A sci-fi or tech cliché with no meaning for this brand. |
| 4 | **Gold + ivory tapered "horizon ribbons" / swooshes** along bottom edges | Stage screen, certificate, ceremonial letterhead, social, closing slides, intro end card | A generic swoosh. It loosely imitates the logo’s swashes but is redrawn, so it is neither the logo nor a meaningful new idea. |
| 5 | **Decorative pattern library**: contour lines, sine "confluence" waves, dot grids | Patterns, backgrounds 07/08/13, map overlays, motion D | Texture used to fill space. The "Niger–Benue confluence" rationale was written after the fact. |
| 6 | **Typography: Playfair Display + Inter** | Everywhere | This is the default "elegant serif + neutral sans" pairing of generated branding. Playfair has no ₦ glyph and no tabular figures, so it is unsuitable for an investment brand. Display sizes are often large for drama rather than hierarchy. |
| 7 | **Over-tracked uppercase overlines (+0.22 em) on almost every block**, gold full stops after words, the campaign line forced in everywhere | Social, slides, documents, web, events | Turns every layout into the same formula and makes the proposition wallpaper. |
| 8 | **One composition reused at every size**: logo top-left, overline, big serif headline, gold pill CTA, swoosh at the bottom | Social (all 8 families), slides, events | It is a template, not a system. No editorial range. |
| 9 | **Rounded cards, pill buttons, pill tags, soft shadows** | Web components, social CTAs, investment cards | Generic SaaS/UI aesthetic, not institutional or editorial. |
| 10 | **Unconvincing mockups**: CSS rectangles posing as laptops, phones, lanyards and stages | 15_MOCKUPS (12 scenes) | They read as fake and undermine credibility. Better to present artwork honestly or on real photography. |
| 11 | **Seals, badges and the roundel used as ornament** | Campaign seal, partner badge, stage, NTW, avatars | The circular-text seal is a cliché and edges towards an "official seal". The roundel is over-used outside its job (avatar and favicon). |
| 12 | **Gradients and glows**: radial "glow" behind every dark layout, golden-sky gradients, bloom on the sun, grain, vignette | Backgrounds, motion A/C/D, intro film | Effects used to compensate for weak composition. |
| 13 | **Motion clichés**: sun bloom, radiating rings, ribbon wipes, iris transitions, floating embers, a growth line with nodes, UI cards popping in | Motion A, C, D and the 25 s intro | Stock-template reveal grammar. |
| 14 | **Redundant logo variants**: a stacked lockup that repeats the primary, the landscape symbol with no clear job, and three roundel colourways | 02 | File count over use case. |
| 15 | **Too many colours**: 15 swatches, including invented "Laterite", "Savannah" and "Confluence Blue" accents | Charts, social, documents | Fragments the identity. The logo itself uses three colours. |
| 16 | **Document details**: tinted table headers on every table, a coloured call-out box on every page, a full-bleed generic landscape on the report cover, a chapter divider with a forest gradient, a certificate swoosh | 09 | Templates look decorated rather than designed for long-form reading. |
| 17 | **Icon family**: technically consistent, but generic (leaf, calendar, bus, bell, mic) | 04/icons | Acceptable as a utility set, but it shouldn’t be presented as brand language. |

## What is genuinely strong and must be preserved
- **The supplied logo**: its inselberg and sun, the swashes, the high-contrast serif wordmark with the river-like tail of the “D”, and the spaced NIGERIA. Geometry is preserved exactly, and the i-dot correction stands.
- **The core palette sampled from the logo**: Forest `#103428`, Ridge `#2C5040`, Sun Gold `#E8A432`.
- **Technical infrastructure**: single source of truth, vector logo masters (SVG/PDF/EPS), Word content controls, a real PPTX master, the motion renderer, the original synthesised audio and the QA script.
- **The illustrated characters in the intro film** were explicitly requested and are carefully built. Keep them, but remove the cliché transitions and effects around them.

## Inconsistencies and technical findings
- Documents use Playfair/Inter while some web and social files depend on Google Fonts; the Office fallback (Georgia/Calibri) changes the look considerably.
- Background raster exports are correct. Their SVG sources contain feTurbulence filters (grain), which Illustrator and Figma don’t reproduce, so the "editable" source differs from the export.
- Placeholder images were clearly labelled, so nothing was misrepresented, but they look synthetic.
- No raster images are embedded in logo SVGs (verified by QA). The logo vector files are clean.

## Direction for the reset (summary; see `DN_Creative-Direction_v2.md`)
1. **Use the logo’s own drawing**, not substitutes. The landscape artwork becomes a single, monumental, cropped "plate". No more procedural hills.
2. **Photography leads** wherever a place, person or food is meant. It is sourced from credible, licensed, Nigeria-specific stock and recorded. Illustration is never used as a stand-in for photography.
3. **An editorial typographic system** with real numerals and the Naira sign.
4. **Fewer, purposeful assets**: 8 backgrounds, 6–8 slide types done properly, a reduced logo set.
5. **Remove** rings, ribbons, pattern wallpaper, glows, pills, seals, fake mockups and gold dots outside the campaign lockup.
