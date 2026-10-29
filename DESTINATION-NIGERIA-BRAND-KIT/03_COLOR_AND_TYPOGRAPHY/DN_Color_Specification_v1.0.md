# Destination Nigeria — Colour Specification v1.0

**Sampled** colours come straight from the supplied logo artwork: #103428, #2C5040, #E8A432, #EAEAEA and #FFFFFF. **Recommended** colours were developed for this system and are not in the supplied files.

CMYK values are starting points for coated stock (ISO Coated v2 / FOGRA39), adjusted by hand from screen values. Always ask the printer for a hard proof. Pantone candidates must be checked against a physical Pantone guide before you specify them.

| Colour | HEX | RGB | CMYK (coated, approx.) | Source | Use | Contrast vs white / ivory / forest |
|---|---|---|---|---|---|---|
| **Forest Deep** (primary) | `#103428` | 16, 52, 40 | 85/45/75/60 | sampled | Primary brand colour. Wordmark, headlines, institutional backgrounds, body text on light grounds. | 13.6 / 11.98 / 1.0 |
| **Ridge Green** (primary) | `#2C5040` | 44, 80, 64 | 75/35/65/40 | sampled | Mountain tone in the logo. Secondary backgrounds, panels, charts, hover states. | 9.02 / 7.94 / 1.51 |
| **Sun Gold** (primary) | `#E8A432` | 232, 164, 50 | 5/38/88/0 | sampled | The sun. Single focal accent: sun disc, key numbers, buttons on dark. Never for small text on light. | 2.15 / 1.89 / 6.34 |
| **Harmattan Ivory** (primary) | `#F5F0E6` | 245, 240, 230 | 2/4/9/0 | recommended | Default light ground for documents, presentations and web. Warmer than white. | 1.14 / 1.0 / 11.98 |
| **White** (primary) | `#FFFFFF` | 255, 255, 255 | 0/0/0/0 | sampled | Reversed logo, paper white, UI surfaces. | 1.0 / 1.14 / 13.6 |
| **Mist** (secondary) | `#EAEAEA` | 234, 234, 234 | 0/0/0/10 | sampled | Horizon line tone in the supplied reversed logo. Hairlines and dividers on dark grounds. | 1.2 / 1.06 / 11.31 |
| **Canopy Green** (secondary) | `#4E7A62` | 78, 122, 98 | 68/25/62/10 | recommended | Supporting green for charts, icons and illustration layers. | 4.9 / 4.32 / 2.77 |
| **Sage** (secondary) | `#A9BFA9` | 169, 191, 169 | 35/12/35/0 | recommended | Light green tint for table bands, map land, background contours. | 1.96 / 1.73 / 6.94 |
| **Charcoal** (neutral) | `#1B201E` | 27, 32, 30 | 70/55/60/75 | recommended | Darkest neutral (green-black). Cinematic backgrounds, long-form body text alternative. | 16.51 / 14.54 / 1.21 |
| **Stone** (neutral) | `#5F6662` | 95, 102, 98 | 55/40/48/30 | recommended | Captions, metadata, footnotes, secondary UI text (passes AA on white and ivory). | 5.89 / 5.19 / 2.31 |
| **Haze** (neutral) | `#E7DFCF` | 231, 223, 207 | 8/10/20/0 | recommended | Deeper ivory for cards, table headers and print panels. | 1.32 / 1.17 / 10.27 |
| **Laterite** (landscape) | `#B4532A` | 180, 83, 42 | 15/75/95/5 | recommended | Red-earth accent drawn from Nigeria's laterite soils. Culture and heritage stories; sparingly. | 4.99 / 4.39 / 2.73 |
| **Savannah** (landscape) | `#D8C49B` | 216, 196, 155 | 15/20/42/0 | recommended | Dry-season grass and sand. Illustration layers, photo-overlay warmth, map water-free land. | 1.71 / 1.5 / 7.96 |
| **Confluence Blue** (landscape) | `#2E6E76` | 46, 110, 118 | 82/35/45/15 | recommended | River and coastline tone (Niger–Benue). Maps, routes, information graphics, digital links on light. | 5.82 / 5.12 / 2.34 |
| **Harvest Gold** (secondary) | `#9A6510` | 154, 101, 16 | 25/55/100/15 | recommended | Accessible gold for text and icons on light grounds (AA for large text and UI on ivory). | 4.95 / 4.36 / 2.75 |

## Palettes
- **Primary:** Forest Deep, Ridge Green, Sun Gold, Harmattan Ivory, White.
- **Secondary:** Canopy Green, Sage, Mist, Harvest Gold.
- **Neutral:** Charcoal, Stone, Haze.
- **Landscape (muted accents):** Laterite, Savannah, Confluence Blue. Use at most one landscape accent per piece, never more than about 10% of the area.
- **Campaign accents (optional):** Use full-strength Sun Gold on Forest or Charcoal for campaign hero moments. Don't add new hues per campaign; vary the photography instead.

### Proportion (typical layout)
Ivory/White 60% · Forest Deep 25% · Ridge/Canopy/Sage 10% · Sun Gold ≤5%.

### Digital UI palette
| Role | Token | Value |
|---|---|---|
| Surface | --dn-surface | Ivory #F5F0E6 (alt. White) |
| Text | --dn-text | Forest Deep #103428 |
| Muted text | --dn-text-muted | Stone #5F6662 |
| Primary button | | Forest Deep fill, white text (13.6:1) |
| Accent button on dark | | Sun Gold fill, Forest Deep text (6.3:1) |
| Link on light | --dn-link | Confluence Blue #2E6E76 (5.1:1 on ivory) |
| Focus ring | --dn-focus | Sun Gold 3px outline + 2px offset |
| Success | --dn-success | #2E7D4F |
| Warning | --dn-warning | #9A6510 |
| Error | --dn-error | #B3261E |
| Info | --dn-info | #2E6E76 |

### Document palette
Body text: Forest Deep (or Charcoal for long reads) on White. Headings: Forest Deep. Rules and table lines: Sage or Mist. Table header band: Haze. Highlight figures: Harvest Gold. Sun Gold is for graphic marks only, never for text on white (2.1:1 fails).

### Accessibility rules
- Body text must reach at least 4.5:1. Forest, Ridge, Charcoal, Stone, Confluence and Canopy on white or ivory all pass.
- Sun Gold on light grounds fails for text. On light grounds use Harvest Gold (#9A6510) for gold text and icons.
- On Forest Deep, use White, Ivory, Mist, Sage or Sun Gold for text. All pass AA.
- Never use colour alone to carry meaning in charts or maps. Add labels, patterns or icons.

### Photography and campaign grading
- **Warm, natural light.** Shoot at golden hour where possible. Keep highlights creamy, never clipped.
- **Grade:** lift the shadows slightly toward Forest (#103428 at 5–10% in the shadows). Keep skin tones natural and true. Never grade skin toward green or grey.
- **Overlay for text:** use a Forest Deep → transparent gradient (bottom or left, 0–70% opacity), never a black overlay.
- **Duotone (graphic use only):** Forest Deep shadows → Savannah highlights, for backgrounds and texture. Don't use it on portraits.
- **Avoid:** heavy HDR, teal-and-orange looks, desaturated 'poverty' aesthetics, and oversaturated greens.
