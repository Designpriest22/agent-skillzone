# Destination Nigeria: colour specification v2.0

The palette is ten values, down from fifteen in v1. Forest, Ridge and Sun Gold are sampled from the supplied logo. Paper and the neutrals were developed for this system. Photography brings every other colour.

CMYK values are starting points for coated stock (ISO Coated v2 / FOGRA39). Always ask the printer for a hard proof. Check Pantone candidates against a physical guide before specifying them.

| Colour | HEX | RGB | CMYK (coated, approx.) | Source | Use | Contrast on White / Paper / Forest |
|---|---|---|---|---|---|---|
| **Forest** | `#103428` | 16, 52, 40 | 85/45/75/60 | sampled | The brand's voice. Wordmark, headlines, text on paper, the dark ground of covers and screens. | 13.6 / 11.98 / 1.0 |
| **Ridge** | `#2C5040` | 44, 80, 64 | 75/35/65/40 | sampled | The mountain tone in the logo. Second surface on Forest, chart series, rules on dark grounds. | 9.02 / 7.94 / 1.51 |
| **Sun Gold** | `#E8A432` | 232, 164, 50 | 5/38/88/0 | sampled | The sun, and only the sun: the disc, one key figure, one call to action. Never text on paper. Under 3 % of any layout. | 2.15 / 1.89 / 6.34 |
| **Paper** | `#F5F0E6` | 245, 240, 230 | 2/4/9/0 | recommended | The default ground for print, slides and web. A warm, uncoated-paper white. | 1.14 / 1.0 / 11.98 |
| **White** | `#FFFFFF` | 255, 255, 255 | 0/0/0/0 | sampled | Reversed logo, UI surfaces, photography mounts. | 1.0 / 1.14 / 13.6 |
| **Ink** | `#1B201E` | 27, 32, 30 | 70/55/60/75 | recommended | Body text in long documents, the darkest ground behind photography and film. | 16.51 / 14.54 / 1.21 |
| **Stone** | `#5F6662` | 95, 102, 98 | 55/40/48/30 | recommended | Captions, metadata, footnotes, secondary text. Passes AA on Paper and White. | 5.89 / 5.19 / 2.31 |
| **Haze** | `#E7DFCF` | 231, 223, 207 | 8/10/20/0 | recommended | Hairlines on Paper, table bands, the second paper tone. | 1.32 / 1.17 / 10.27 |
| **Sage** | `#A9BFA9` | 169, 191, 169 | 35/12/35/0 | recommended | Data only: the second chart series and map land. Not a background colour. | 1.96 / 1.73 / 6.94 |
| **Gold Text** | `#8A5A0C` | 138, 90, 12 | 30/60/100/25 | recommended | Accessible gold for figures and links on Paper (AA for text). Used where Sun Gold would fail contrast. | 5.92 / 5.21 / 2.3 |

## Proportion
In a typical layout, Paper or White takes about 55 %, Forest about 30 % and photography or plates take the rest. Sun Gold stays under 3 %: the sun disc, one figure or one call to action. Never more.

## Rules
- **Sun Gold is the sun.** Never set text in Sun Gold on Paper or White (1.9:1 fails). For a gold figure or link on a light ground, use Gold Text `#8A5A0C` (5.2:1 on Paper).
- **Sage is for data.** Use it for the second chart series and map land, never as a background.
- **No gradients, glows or tints over photographs.** If text needs to sit on an image, move the text off the image (the horizon composition) instead of darkening the photograph.
- **Tables and rules:** a Forest rule under the header and Haze hairlines between rows, with no fills.
- **Retired in v2:** Canopy, Laterite, Savannah and Confluence Blue. They fragmented the identity. Mist (`#EAEAEA`) stays only inside the supplied reversed logo artwork.

## Photography grade
Every library image gets the same restrained grade (see `16_SOURCE_FILES/build/photo.py`):
- a gentle tone curve with slightly lifted blacks;
- saturation reduced by about 8 %;
- shadows cooled towards Forest and highlights warmed towards Paper.

Nothing is added to or removed from an image. There is no sky replacement and no HDR.