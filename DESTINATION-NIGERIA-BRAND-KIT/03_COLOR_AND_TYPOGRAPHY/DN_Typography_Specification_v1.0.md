# Destination Nigeria — Typography Specification v1.0

All brand typefaces are released under the **SIL Open Font License 1.1**. They are free for commercial use, embedding and redistribution, and the licence texts are included in `fonts/`. All three are available in **Google Workspace** (Docs, Slides) from the font menu, and on the web through Google Fonts.

| Role | Typeface | Weights supplied | Office fallback | Web fallback | Use |
|---|---|---|---|---|---|
| Display | **Playfair Display** | Regular, Medium, SemiBold, Bold + Italics | Georgia | Georgia, 'Times New Roman', serif | Display headlines, document titles, campaign lines. Echoes the high-contrast serif of the wordmark. |
| Editorial | **Source Serif 4** | Regular, SemiBold, Bold + Italics | Cambria | Georgia, Cambria, serif | Long-form editorial reading, report introductions, pull quotes, captions in print. |
| Sans | **Inter** | Light, Regular, Medium, SemiBold, Bold, Italic | Calibri | 'Segoe UI', Calibri, Arial, sans-serif | UI, body copy in documents, labels, tables, data (tabular figures), overlines echoing NIGERIA. |

Data and numerical typography: **Inter** with tabular figures (`font-feature-settings: 'tnum' 1`, which is on by default in the kit's CSS for tables). Use Inter Light for large KPIs and Inter SemiBold for labels.
Optional campaign headline: **Playfair Display Italic** (Medium). Use it for one line per piece at most, never in full paragraphs.

## Hierarchy (digital px · print pt)

| Token | Face | Weight | Size px | Print pt | Line height | Tracking | Use |
|---|---|---|---|---|---|---|---|
| `hero` | Playfair Display | 500 | 72 | 54 | 1.04 | -0.01 em | Hero headlines, campaign posters, cover titles |
| `h1` | Playfair Display | 500 | 48 | 30 | 1.1 | -0.005 em | Section headings, slide titles, document titles |
| `h2` | Playfair Display | 500 | 34 | 20 | 1.15 | 0 em | Sub-section headings |
| `h3` | Inter | 600 | 22 | 13 | 1.3 | 0 em | Subheadings, card titles |
| `overline` | Inter | 600 | 13 | 8 | 1.4 | 0.22 em | Eyebrows / kickers in caps, echoing NIGERIA in the logo |
| `lead` | Source Serif 4 | 400 | 21 | 13 | 1.5 | 0 em | Standfirst, introductions, executive summary lead |
| `body` | Inter | 400 | 16 | 10.5 | 1.6 | 0 em | Body text (digital); 10.5 pt in documents |
| `body-editorial` | Source Serif 4 | 400 | 17 | 10.5 | 1.6 | 0 em | Long-form print reading; 10.5 pt in reports |
| `caption` | Inter | 400 | 13 | 8.5 | 1.45 | 0.01 em | Captions, image credits, metadata |
| `footnote` | Inter | 400 | 11 | 7 | 1.4 | 0.01 em | Footnotes, legal lines, sources |
| `table` | Inter | 400 | 14 | 9 | 1.35 | 0 em | Tables, with tabular figures (font-feature-settings: 'tnum') |
| `data` | Inter | 300 | 64 | 40 | 1.0 | -0.02 em | Key statistics / KPIs (Inter Light, tabular) |
| `button` | Inter | 600 | 15 | 9 | 1.0 | 0.04 em | Buttons and labels |

## Rules
- Headlines are sentence case in Playfair Display. Don't set long headlines in all capitals in the serif.
- Overlines and labels are set in **Inter SemiBold, ALL CAPS, +0.22 em**. This echoes the spaced NIGERIA in the logo.
- Keep to two typefaces per page: Playfair with Inter, or Source Serif with Inter. Playfair with Source Serif on its own is acceptable only in long editorial documents.
- Body text is ranged left with a ragged right. Don't justify text on screen.
- Ideal line length is 60–75 characters.
- Use real quotation marks (“ ”), en dashes for ranges (2026–2027), and the ₦ symbol for Naira. **Playfair Display has no ₦ glyph and no tabular figures, so always set prices, currency and data in Inter.** Inter and Source Serif 4 both include ₦ (U+20A6).
- Never stretch, outline or add shadows to type.

## Installing
- **Windows:** right-click each `.ttf` in `fonts/` → *Install for all users*. **macOS:** double-click → *Install Font*.
- **Microsoft 365 / Word / PowerPoint:** install the fonts first. When sending editable files to people who don't have the fonts, either embed them (*File → Options → Save → Embed fonts in the file*) or tell them which fallback to use: Georgia for Playfair Display, Calibri for Inter.
- **Google Docs/Slides:** *Font → More fonts*, then add Playfair Display, Inter and Source Serif 4.
