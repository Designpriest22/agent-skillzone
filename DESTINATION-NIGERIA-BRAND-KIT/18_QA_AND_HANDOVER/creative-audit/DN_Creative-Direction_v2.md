# Creative direction v2: the land, drawn and photographed

Destination Nigeria's logo is a drawing of a real kind of place: an inselberg (a granite dome like Zuma Rock or Idanre) with a sun beside it, set on a horizon above the name. Version 1 of the kit ignored that drawing. It surrounded the logo with generic hills, rings, ribbons and patterns. Version 2 extends the logo's own idea in two honest ways:

1. **Photographs of real places.** These are the client-supplied images, verified, graded and captioned with place and state.
2. **Engraved plates traced from those photographs.** These are vector line engravings in the tradition of banknote, stamp and survey-plate engraving. Each plate depicts a real place, and the logo's gold sun is the only colour added to it.

There are no invented landscapes, no decoration that stands in for meaning, and no imagery that pretends to be Nigeria when it is not.

## 1. The horizon composition

Every layout is divided by a horizon, the way the logo is: the land above, the words below. The horizon is a photograph's edge, a plate's edge or a single hairline. Its height changes with the job, so compositions vary while the system stays recognisable.

| Horizon | Image : words | Used for |
|---|---|---|
| Low | 70 : 30 | Campaign posters, social posts that lead with a place, film end frames |
| Middle | 50 : 50 | Presentation openers, invitations, web hero |
| High | 25–35 : 65–75 | Reports, proposals, letterheads, data slides (words lead) |
| None | 0 : 100 | Data, quotes and announcements: type alone on Paper or Forest, with a hairline |

**The plate composition** is a second, quieter layout. An engraved plate is mounted on Paper with a wide margin and a caption set beneath it like a museum print: *Pl. 01 · Zuma Rock, Niger State*. It is used for covers, section openers, certificates and premium print.

## 2. Captions replace ornament

Every photograph and plate carries its place, set small in Public Sans, Stone or Paper: *Agbokim Waterfalls, Cross River State*. The caption is the system's signature detail. It does what v1's overlines, gold dots and badges tried to do, but it carries information.

## 3. Typography

- **Newsreader Display** for titles and figures. Its contrast and ball terminals belong to the same family of letterforms as the wordmark, but it does not imitate it.
- **Newsreader Text** for long reading.
- **Public Sans** for information. It is a neutral government-system sans with tabular figures and the Naira sign (₦).

Rules:
- One display line per layout.
- Uppercase is for short labels only, tracked at +0.08 em and used once per block.
- Sizes follow hierarchy, not drama.

v1's fonts are retired: Playfair has no ₦ and no tabular figures, and Inter is the generic default.

## 4. Colour

Ten values, down from fifteen. Paper and Forest carry the system and photography brings the rest of the colour.

- **Sun Gold** is the sun: the disc, one figure or one call to action, under 3 % of any layout. It is never used for text on Paper; *Gold Text* (#8A5A0C) is the accessible alternative.
- **Sage** is for data only.
- Laterite, Savannah, Confluence Blue and Canopy are retired.

## 5. Removed from the system

- Procedural hills, domes and sunsets.
- Concentric sun rings.
- Gold and ivory swoosh ribbons.
- Contour, wave and dot wallpaper.
- Radial glows, bloom, grain, vignettes and gradient skies.
- Pill buttons, rounded cards and soft shadows.
- Circular-text seals and badges.
- Gold full stops scattered after words.
- CSS "device" mockups.
- In motion: sun blooms, rings, iris wipes, embers and pop-in UI cards.

## 6. Logo family, reduced

- Primary (full colour, reversed, Forest, white, black) plus a small-size version.
- The roundel is kept only for avatars and favicons.
- The stacked lockup and the stand-alone landscape symbol are retired: neither had a job the primary does not do better.

## 7. Photography

Sources are the client-supplied images in `06/SUPPLIED_BY_CLIENT`; see the register for each file's identification confidence and rights status. Three supplied images are rejected:
- **Nusa Penida:** Indonesia.
- **caption.jpg:** almost certainly Chamarel Falls, Mauritius.
- **images (6):** a composite.

The grade is consistent and restrained: a gentle curve, reined-in saturation, shadows towards Forest and highlights towards Paper. Low-resolution images (under 800 px) are used only at small sizes. They are never stretched into heroes.

**Licensing.** The supplied images arrived without photographer or licence information, and several look like web downloads. They are used in this kit as layout material. Before publication, each one needs its rights confirmed and recorded in the register.

## 8. Motion

Motion uses the same two materials:
- **Plates:** a plate is engraved stroke by stroke, then resolves into the photograph of the same place.
- **The logo's drawing:** the horizon draws, the sun sets in place and the name settles.

Cuts are clean, timing is unhurried and every move lands on a beat of the existing synthesised score.

## 9. Prioritised revision plan

The worst and most visible problems come first.

1. **Photography and plates:** the materials everything else depends on.
2. **Tokens:** type, colour, contact details and photo library in `brand.py`.
3. **Social and campaign:** the most visible, and the most templated in v1.
4. **Presentation:** information-first layouts.
5. **Documents:** an editorial restyle with the real contact details.
6. **Web, events and cards.**
7. **Backgrounds:** reduce to a small purposeful set.
8. **Logo family:** prune.
9. **Motion:** a new intro built from plates and photographs; logo animations simplified.
10. **Guidelines, QA, before/after comparison and change report.**
