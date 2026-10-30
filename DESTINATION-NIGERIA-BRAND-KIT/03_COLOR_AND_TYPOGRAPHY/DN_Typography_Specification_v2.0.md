# Destination Nigeria: typography specification v2.0

Both families are released under the **SIL Open Font License 1.1** and are free for commercial use, embedding and redistribution. The licences are in `fonts_v2/`. Both are on Google Fonts and in Google Workspace.

| Role | Typeface | Files supplied | Office fallback | Use |
|---|---|---|---|---|
| Display | **Newsreader Display** | Newsreader Display Regular, Medium, SemiBold + Italics (static, opsz 72) | Georgia | Headlines, titles, figures in editorial use. Its contrast and ball terminals belong to the same family of letterforms as the wordmark. |
| Text | **Newsreader Text** | Newsreader Text Regular, Medium, SemiBold + Italic (static, opsz 16) | Georgia | Long reading: report text, standfirsts, quotations, captions in print. |
| Sans | **Public Sans** | Public Sans Light, Regular, Medium, SemiBold, Bold + Italics | Arial | Information: labels, tables, data with tabular figures and the Naira sign, UI, forms, signage. |

The variable masters (`Newsreader[opsz,wght]`, `PublicSans[wght]`) are also supplied for web and design apps that support optical sizing.

## Scale (digital, px)
| Token | Face | Weight | Size / line | Tracking | Use |
|---|---|---|---|---|---|
| `display` | Newsreader Display | 400 | 96 / 0.98 | -0.02 em | One line per layout at most: covers, campaign posters, the opening slide |
| `h1` | Newsreader Display | 400 | 56 / 1.04 | -0.015 em | Titles: document titles, section openers, slide titles |
| `h2` | Newsreader Display | 500 | 36 / 1.12 | -0.01 em | Sub-section headings |
| `h3` | Public Sans | 600 | 20 / 1.3 | +0 em | Headings inside text, card and table titles |
| `label` | Public Sans | 600 | 12 / 1.3 | +0.08 em | Labels and section markers. Uppercase, used once per block, never as decoration |
| `lead` | Newsreader Text | 400 | 22 / 1.42 | +0 em | Standfirst and executive-summary lead |
| `body` | Public Sans | 400 | 16 / 1.6 | +0 em | Body text in digital and UI; 10 pt in documents |
| `body-long` | Newsreader Text | 400 | 17 / 1.55 | +0 em | Long-form print reading; 10.5 pt in reports |
| `caption` | Public Sans | 400 | 12 / 1.45 | +0 em | Place captions (Place, State), credits, metadata |
| `footnote` | Public Sans | 400 | 10 / 1.4 | +0 em | Sources, notes, legal lines |
| `table` | Public Sans | 400 | 14 / 1.35 | +0 em | Tables, tabular lining figures (tnum, lnum) |
| `figure` | Newsreader Display | 400 | 72 / 1.0 | -0.02 em | A single key figure, with its unit and source in caption size |
| `button` | Public Sans | 600 | 15 / 1.0 | +0.01 em | Buttons and links in UI |

## Why these faces
- **Newsreader** has the contrast and ball terminals of the wordmark's own lettering without imitating it. Display cuts are for titles and figures; Text cuts are for reading.
- **Public Sans** was designed as a neutral typeface for government systems. It is legible at small sizes and has **tabular lining figures** and the **Naira sign (₦, U+20A6)**, both essential for an investment brand.
- **Retired:** Playfair Display, which has no ₦ and no tabular figures, and Inter, which is the default sans of generated branding.

## Rules
- One display line per layout. Size follows hierarchy, not drama.
- Sentence case for all headings. Uppercase only for short labels: Public Sans SemiBold, +0.08 em, used once per block.
- Captions name the place: *Zuma Rock, Niger State*. They are set in Public Sans at caption size, in Stone on light grounds and Paper on dark.
- Set figures, prices and dates in Public Sans with tabular figures (`font-feature-settings: 'tnum', 'lnum'`), or in Newsreader Display for a single large figure.
- Use real quotation marks (“ ”), en dashes for ranges (2026–2027), ₦ for Naira and a thin space before %.

## Installing the fonts
- **Desktop:** install everything in `fonts_v2/static/`.
- **Microsoft Office:** the templates name Newsreader Display, Newsreader Text and Public Sans. On machines without them, Office substitutes Georgia and Arial. Install the fonts, or embed them (File > Options > Save > Embed fonts) before sharing.
- **Google Docs and Slides:** Font > More fonts, then add Newsreader and Public Sans.
- **Web:** self-host the variable fonts, or load them from Google Fonts.