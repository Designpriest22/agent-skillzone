# 02 Logo master files

Every file reuses the supplied vector paths. Nothing has been redrawn. The originals are in `_SUPPLIED_ORIGINALS/` and are untouched.

| # | Variant | File stem | Use |
|---|---|---|---|
| 1 | Primary, full colour (**master**) | `SVG/DN_logo_primary_fullcolour` | The default, on Paper or White |
| 2 | Reversed (white plus gold sun, as supplied) | `REVERSED/DN_logo_primary_reversed` | On Forest, Ink and dark photography |
| 3 | White | `REVERSED/DN_logo_primary_white` | One-colour white: video, embossing, busy dark grounds |
| 4 | One-colour Forest | `MONOCHROME/*_green-1c` | One-colour print |
| 5 | Black | `MONOCHROME/*_black-1c` | Newsprint, fax, stamps |
| 6 | Production compound path | `MONOCHROME/DN_logo_primary_production-1c-compound` | Dies, foil, emboss, laser, vinyl, embroidery |
| 7 | Small format | `*_small-format` | 100–160 px / 25–35 mm |
| 8 | Horizon roundel (Forest, Paper) | `SVG/DN_symbol_roundel_*` | **Only** for avatars, app icons and favicons, where the full logo cannot be read |

**Retired in v2:** the stacked lockup, the horizontal lockup, the stand-alone landscape symbol and the gold roundel. Each repeated the primary logo less well, and none had a use the primary does not serve. They remain in the git history (v1.1).

**Formats:** `SVG/` `REVERSED/` `MONOCHROME/` hold the editable vector sources. `PDF/` holds vector PDFs that open as editable artwork in Illustrator. `EPS/` holds vector EPS converted from those PDFs. `PNG/` holds transparent PNGs from 64 to 4000 px.

**Documented changes:** (1) the reversed masters centre the first “i” dot, correcting the supplied Asset_1. (2) The small-format version drops the hairline secondary horizon and adds a 0.35-unit optical stroke to NIGERIA. (3) The Horizon Roundel is a crop of the original landscape, made for avatar and favicon sizes.

**Clear space:** 1x on all sides, where x is the height of the lowercase “n” (about 11% of the logo width). **Minimum width:** 35 mm / 140 px for the primary, 25 mm / 100 px for small-format and 8 mm / 16 px for the roundel.
