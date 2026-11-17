# Over Sabi — Brand guidelines (v1.0)

The same guidelines are published as a page at `/brand` and as a PDF at `public/brand/over-sabi-brand-guidelines.pdf` (printed from that page by `npm run brand:export`).

## 1. Strategy

**Idea — Call & Response.** Being *sabi* isn't memorising words; it's understanding how people communicate. African oral traditions run on call and response: someone speaks, someone answers. The identity is built from that exchange and from the melody of tonal languages.

**Positioning.** For Africans and the diaspora who want to *speak* — not just recognise — the languages of their families, friends and futures, Over Sabi is the conversation-first language app that teaches the culture inside the words, and is honest about what technology can and can't do yet.

**Mission.** Help people speak African languages with confidence through real conversation and culturally accurate teaching.
**Vision.** A world where no one loses their family's language for lack of a good way to learn it.

**Values.** Respect · Accuracy · Warmth · Honesty · Plurality.

**Personality.** Confident, culturally intelligent, playful without being childish, modern and premium, welcoming, occasionally witty. A consumer technology brand — not a school portal.

## 2. Directions explored
| Direction | Summary | Decision |
| --- | --- | --- |
| **A. Call & Response** | S drawn as two answering arcs; tone line tracing real tones; sand / forest / ember | **Chosen** — grounded in how language works rather than decoration; travels across regions |
| B. Indigo Cloth | Indigo resist-dye grids and repeats | Rejected — borrows one community's textile tradition to stand for many; pattern-as-decoration risks stereotype |
| C. Market Signage | Hand-painted signage lettering, loud yellows/reds | Rejected — too Lagos-specific for Accra, Nairobi, Johannesburg; weak accessibility at small sizes |

## 3. Logo
- **Mark:** a rounded Forest square with a Sand "S" made of two arcs (the call and the response) and an Ember dot (the voice that answers). It is the app icon.
- **Wordmark:** `oversabi`, lowercase, Bricolage Grotesque ExtraBold, tight tracking; "over" in Ink, "sabi" in Forest. Outlined in the SVG files — no font needed.
- **Lockups:** horizontal (primary), stacked, reversed on Ink (sabi in Mint #8FD4B2), monochrome (Ink, dot in Sand).
- **Clear space:** the Ember dot's height (¼ of the mark) on all sides.
- **Minimum size:** mark 24 px / 6 mm; horizontal 120 px / 30 mm wide.
- **Don't:** stretch, rotate, recolour the dot green, add effects, place on busy photography, rebuild the wordmark in another font.

Files (`public/brand/`): `over-sabi-mark.svg` (+ `-mono`, `-reversed`), `over-sabi-logo-horizontal.svg` (+ `-reversed`, `-mono`), `over-sabi-logo-stacked.svg`, `over-sabi-icon-maskable.svg`; PNGs in `png/`; favicon at `/favicon.ico`; PWA icons in `/icons/`.

## 4. Signature: the tone line
Where text is written with tone marks, the tone line traces its pitch: acute = high, unmarked = mid, grave = low. It appears under target-language phrases, in the hero, on social cards and as the tutors' mouths. **Never** drawn for text without tone marks, and never invented. Implementation: `src/lib/tone.ts`, `ToneContour`.

## 5. Colour
| Name | HEX | RGB | Role |
| --- | --- | --- | --- |
| Sand | #F4EDE1 | 244 237 225 | Page background |
| Paper | #FBF7F0 | 251 247 240 | Cards, inputs |
| Clay | #EADBC6 | 234 219 198 | Quiet surfaces |
| Ink | #16130F | 22 19 15 | Text, dark sections |
| Forest | #0E4A37 | 14 74 55 | Primary actions, the mark |
| Ember | #E0552A | 224 85 42 | Accent: tone line, highlights (large/graphic only on Sand) |
| Ember Deep | #B23F17 | 178 63 23 | Accent used as text on light backgrounds |
| Indigo | #27306B | 39 48 107 | Focus rings, information |
| Spark | #C8F03C | 200 240 60 | Reserved for the "listening" state |
| Mint (dark mode primary) | #8FD4B2 | 143 212 178 | Forest replacement on dark |

Measured contrast (WCAG 2.2): Ink/Sand 15.9:1 · Forest/Sand 8.8:1 · Ember Deep/Sand 5.0:1 · Ink/Ember 4.9:1 · Ink/Spark 14.1:1 · Ember/Sand 3.3:1 (large text and graphics only). Pan-African flag colours are not used as a set.

Design tokens are CSS variables in `src/app/globals.css` and exposed to Tailwind (`bg-primary`, `text-accent-safe`, `bg-surface`, …). Dark mode follows `prefers-color-scheme` or `data-theme`.

## 6. Typography
- **Bricolage Grotesque** (OFL) — display and wordmark; 700–800; letter-spacing −0.02em.
- **Noto Sans** (OFL) — body and *all* target-language text: correct stacked tone marks, under-dots and hooked letters (ẹ ọ ṣ ị ụ ṅ ɓ ɗ ƙ ƴ). The display face misplaces combining marks, so African-language text always uses Noto Sans (`.lang-text`).
- **IBM Plex Mono** (OFL) — eyebrows, labels, tone legends, data.
- Scale: 14 / 16 / 18 / 24 / 30 / 36 / 48 / 72 px. Body line height 1.55; display 0.95–1.1. Fonts are self-hosted.

## 7. Iconography & illustration
24 px grid, 2 px round strokes, `currentColor` (`src/components/ui/icons.tsx`). Tutor portraits are abstract, stylised and varied in skin tone and headwear, each with the tone line as a mouth, always paired with an "AI tutor" label so no one mistakes them for real people. Empty states use a dashed tone line.

## 8. Components
Buttons (primary Forest, secondary outline, accent Ember, ghost, danger), fields with hints/errors, cards, badges (review statuses: Reviewed / Draft · awaiting review / In review / AI draft / Disputed), notices (info/warning/danger/success), progress bars, skeletons, empty states, dialogs (native `<dialog>`), bottom navigation. All in `src/components/ui`.

## 9. Voice & copy
Plain verbs, sentence case, specific over clever. Errors say what happened and what to do, never apologise. Celebrate in-language when it fits ("You sabi!").
- ✓ "Almost — check the tone marks. They change meaning."
- ✕ "Unlock the secrets of the Motherland!" ✕ "Native-level fluency in 30 days." ✕ invented learner counts or testimonials.
Avoid: safari clichés, "exotic", "tribal", treating Africa as one country.

## 10. Motion
The tone line draws itself (1.2 s, ease-in-out) when a phrase first appears. Listening pulses in Spark, speaking in Ember. Nothing moves purely for decoration. `prefers-reduced-motion` disables all of it.

## 11. Photography direction
Real people, real places: family kitchens, markets, offices, campuses, buses, video calls home — Lagos, Abuja, Kano, Enugu, Accra, Nairobi, Johannesburg, London, Houston. Natural light, warm grade, candid moments of talking and laughing. No safari animals, no costume "tribal" shoots, no poverty imagery. Model releases and consent always.

## 12. App store & social
- **Store screenshots:** real screens on Sand, one headline each in Bricolage, the tone line under the target phrase. Order: Speak → Learn → Keep it → Languages. Icon: the mark, Forest background (maskable version provided).
- **Social templates** (`brand/social/template.html`, rendered to `public/brand/social/`): phrase card 1080×1080, story 1080×1920, achievement card, Open Graph 1200×630. Parameters: phrase, meaning, kicker, format.
