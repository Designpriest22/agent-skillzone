"""Destination Nigeria — single source of truth for the brand kit build.

Everything generated in this kit (logos, graphics, templates, guidelines, motion)
reads its colours, type and logo geometry from here. Change a value once, rebuild.
"""
import json
import re
from pathlib import Path

BUILD = Path(__file__).resolve().parent
KIT = BUILD.parent.parent
SUPPLIED = KIT / "02_LOGO_MASTER_FILES" / "_SUPPLIED_ORIGINALS" / "supplied_Asset_2_full-colour.svg"

# --------------------------------------------------------------------------- colour
# "sampled" = taken directly from the supplied logo artwork.
# "recommended" = developed for this system; not present in the supplied files.
COLORS = [
    # key, name, hex, group, source, use
    ("forest", "Forest", "#103428", "core", "sampled",
     "The brand's voice. Wordmark, headlines, text on paper, the dark ground of covers and screens."),
    ("ridge", "Ridge", "#2C5040", "core", "sampled",
     "The mountain tone in the logo. Second surface on Forest, chart series, rules on dark grounds."),
    ("gold", "Sun Gold", "#E8A432", "core", "sampled",
     "The sun, and only the sun: the disc, one key figure, one call to action. Never text on paper. Under 3 % of any layout."),
    ("ivory", "Paper", "#F5F0E6", "core", "recommended",
     "The default ground for print, slides and web. A warm, uncoated-paper white."),
    ("white", "White", "#FFFFFF", "core", "sampled",
     "Reversed logo, UI surfaces, photography mounts."),
    ("charcoal", "Ink", "#1B201E", "neutral", "recommended",
     "Body text in long documents, the darkest ground behind photography and film."),
    ("stone", "Stone", "#5F6662", "neutral", "recommended",
     "Captions, metadata, footnotes, secondary text. Passes AA on Paper and White."),
    ("haze", "Haze", "#E7DFCF", "neutral", "recommended",
     "Hairlines on Paper, table bands, the second paper tone."),
    ("sage", "Sage", "#A9BFA9", "data", "recommended",
     "Data only: the second chart series and map land. Not a background colour."),
    ("golddeep", "Gold Text", "#8A5A0C", "data", "recommended",
     "Accessible gold for figures and links on Paper (AA for text). Used where Sun Gold would fail contrast."),
]
# Supplied-logo tones and v1 accents kept so archived generators still run. Not part of the published palette.
LEGACY = {"mist": "#EAEAEA", "canopy": "#4E7A62", "laterite": "#B4532A", "savannah": "#D8C49B", "confluence": "#2E6E76"}
C = {k: h for k, _, h, *_ in COLORS}
C.update(LEGACY)

UI_STATES = {"success": "#2E7D4F", "warning": "#9A6510", "error": "#B3261E", "info": "#2E6E76",
             "focus": "#E8A432"}


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def rgb_cmyk(rgb):
    r, g, b = [v / 255 for v in rgb]
    k = 1 - max(r, g, b)
    if k >= 1:
        return (0, 0, 0, 100)
    c, m, y = [(1 - v - k) / (1 - k) for v in (r, g, b)]
    return tuple(round(v * 100) for v in (c, m, y, k))


def luminance(h):
    def ch(v):
        v /= 255
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    r, g, b = hex_rgb(h)
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)


def contrast(a, b):
    la, lb = sorted([luminance(a), luminance(b)], reverse=True)
    return (la + 0.05) / (lb + 0.05)


# --------------------------------------------------------------------------- type
FONTS = {
    "display": {"family": "Newsreader Display", "fallback": "Georgia, 'Times New Roman', serif",
                "office": "Newsreader Display", "office_fallback": "Georgia",
                "role": "Headlines, titles, figures in editorial use. Its contrast and ball terminals belong to the same family of letterforms as the wordmark."},
    "text": {"family": "Newsreader Text", "fallback": "Georgia, Cambria, serif",
             "office": "Newsreader Text", "office_fallback": "Georgia",
             "role": "Long reading: report text, standfirsts, quotations, captions in print."},
    "sans": {"family": "Public Sans", "fallback": "Arial, 'Helvetica Neue', sans-serif",
             "office": "Public Sans", "office_fallback": "Arial",
             "role": "Information: labels, tables, data with tabular figures and the Naira sign, UI, forms, signage."},
}
FONTS["editorial"] = FONTS["text"]   # v1 name, kept for older generators
SERIF = "'Newsreader Display', Georgia, serif"
EDIT = "'Newsreader Text', Georgia, serif"
SANS = "'Public Sans', Arial, sans-serif"

TYPE_SCALE = [
    # token, family, weight, size px, line-height, tracking em, use
    ("display", "display", 400, 96, 0.98, -0.02, "One line per layout at most: covers, campaign posters, the opening slide"),
    ("h1", "display", 400, 56, 1.04, -0.015, "Titles: document titles, section openers, slide titles"),
    ("h2", "display", 500, 36, 1.12, -0.01, "Sub-section headings"),
    ("h3", "sans", 600, 20, 1.3, 0, "Headings inside text, card and table titles"),
    ("label", "sans", 600, 12, 1.3, 0.08, "Labels and section markers. Uppercase, used once per block, never as decoration"),
    ("lead", "text", 400, 22, 1.42, 0, "Standfirst and executive-summary lead"),
    ("body", "sans", 400, 16, 1.6, 0, "Body text in digital and UI; 10 pt in documents"),
    ("body-long", "text", 400, 17, 1.55, 0, "Long-form print reading; 10.5 pt in reports"),
    ("caption", "sans", 400, 12, 1.45, 0, "Place captions (Place, State), credits, metadata"),
    ("footnote", "sans", 400, 10, 1.4, 0, "Sources, notes, legal lines"),
    ("table", "sans", 400, 14, 1.35, 0, "Tables, tabular lining figures (tnum, lnum)"),
    ("figure", "display", 400, 72, 1.0, -0.02, "A single key figure, with its unit and source in caption size"),
    ("button", "sans", 600, 15, 1.0, 0.01, "Buttons and links in UI"),
]
# Spacing: 8-pt base
SPACE = [4, 8, 12, 16, 24, 32, 48, 64, 96, 128]
RADIUS = {"none": 0, "sm": 2, "md": 4}   # square by default; no pills, no soft cards

# --------------------------------------------------------------------------- contact (supplied by the client)
CONTACT = {
    "org": "Destination Nigeria",
    "email": "info@destinationnigeria.org",
    "phone": "+234 909 884 3308",
    "tel": "+2349098843308",
    "web": "destinationnigeria.org",   # inferred from the email domain; confirm before print
    "people": [
        {"name": "Eddie Madaki", "email": "eddiemadaki@destinationnigeria.org"},
        {"name": "Lulu", "email": "lulu@destinationnigeria.org"},
    ],
}
PROPOSITION = ["Experience.", "Invest.", "Explore."]

# --------------------------------------------------------------------------- photography (see 06 register)
LIBRARY = KIT / "06_PHOTOGRAPHY_AND_MEDIA" / "LIBRARY"
PHOTOS = {
    # slug: caption, focal point (x, y as 0–1), largest sensible use, notes
    "zuma-rock": dict(caption="Zuma Rock, Niger State", focus=(0.5, 0.42), size="hero"),
    "agbokim-waterfalls": dict(caption="Agbokim Waterfalls, Cross River State", focus=(0.42, 0.45), size="hero"),
    "idanre-hills": dict(caption="Idanre Hills, Ondo State", focus=(0.4, 0.35), size="large"),
    "tarkwa-bay": dict(caption="Tarkwa Bay, Lagos", focus=(0.45, 0.5), size="medium", confirm=True),
    "obudu-road": dict(caption="Obudu plateau, Cross River State", focus=(0.6, 0.5), size="small"),
    "lekki-ikoyi-bridge": dict(caption="Lekki–Ikoyi Link Bridge, Lagos", focus=(0.55, 0.35), size="small"),
    "bowers-tower": dict(caption="Bower's Tower, Ibadan, Oyo State", focus=(0.65, 0.45), size="small"),
    "highlands-valley": dict(caption="", focus=(0.5, 0.5), size="small"),
    "highlands-ridges": dict(caption="", focus=(0.5, 0.5), size="small"),
}


def photo(slug):
    return LIBRARY / f"DN_photo_{slug}.jpg"


def plate(slug, ink="forest", transparent=False):
    return KIT / "04_VECTOR_GRAPHICS_AND_ICONS" / "ENGRAVED_PLATES" / "SVG" / (
        f"DN_plate_{slug}_{ink}" + ("_transparent" if transparent else "") + ".svg")


# --------------------------------------------------------------------------- logo geometry
# Paths are taken verbatim from the supplied full-colour master (Asset_2), whose
# geometry is the reference. Index order follows that file.
_paths = re.findall(r'<path class="(cls-\d)" d="([^"]+)"', SUPPLIED.read_text())
P = [d for _, d in _paths]
NAMES = ["D", "horizon", "monolith", "ti", "n1", "n2", "a", "o", "ridge", "e", "s", "t", "sun",
         "i", "idot2", "idot1", "horizon_small", "N", "I", "G", "E", "R", "I2", "A"]
assert len(P) == len(NAMES) == 24, len(P)
PATH = dict(zip(NAMES, P))

WORD_DESTINATION = ["D", "e", "s", "ti", "idot1", "n1", "a", "t", "i", "idot2", "o", "n2"]
WORD_NIGERIA = ["N", "I", "G", "E", "R", "I2", "A"]
LANDSCAPE_DARK = ["horizon"]                 # deepest landscape tone
LANDSCAPE_LIGHT = ["monolith", "ridge", "horizon_small"]  # mountain tone
SUN = ["sun"]

LOGO_W, LOGO_H = 150.25, 59.06
# Key measures (logo units)
X_HEIGHT = 46.5 - 30.3      # lowercase n height ≈ 16.2 → clear-space unit
SUN_D = 108.72 - 99.42      # sun diameter ≈ 9.3
SUN_C = (104.07, 6.62)
WORDMARK_BOX = (0, 20.53, 150.25, 59.06)   # Destination + NIGERIA, without landscape
LANDSCAPE_BOX = (29.81, -0.01, 124.05, 22.9)

# Colourways: tone for (wordmark, horizon, mountains, sun)
COLOURWAYS = {
    "fullcolour":   dict(word=C["forest"], hz=C["forest"], mt=C["ridge"], hzs=C["ridge"], sun=C["gold"]),
    "reversed":     dict(word=C["white"], hz=LEGACY["mist"], mt=C["white"], hzs=LEGACY["mist"], sun=C["gold"]),
    "green":        dict(word=C["forest"], hz=C["forest"], mt=C["forest"], hzs=C["forest"], sun=C["forest"]),
    "white":        dict(word="#FFFFFF", hz="#FFFFFF", mt="#FFFFFF", hzs="#FFFFFF", sun="#FFFFFF"),
    "black":        dict(word="#000000", hz="#000000", mt="#000000", hzs="#000000", sun="#000000"),
    "ivory-on-dark": dict(word=C["ivory"], hz=C["ivory"], mt=C["ivory"], hzs=C["ivory"], sun=C["gold"]),
}


def tone_for(name, cw):
    if name in SUN:
        return cw["sun"]
    if name == "horizon":
        return cw["hz"]
    if name == "horizon_small":
        return cw["hzs"]
    if name in ("monolith", "ridge"):
        return cw["mt"]
    return cw["word"]


def logo_group(names, cw, extra="", stroke_names=(), stroke_w=0.0):
    """Return <path> elements for the named logo parts in a colourway."""
    out = []
    for n in names:
        col = tone_for(n, cw)
        s = f' stroke="{col}" stroke-width="{stroke_w}" stroke-linejoin="round"' if n in stroke_names else ""
        out.append(f'<path fill="{col}"{s} d="{PATH[n]}"/>')
    return f'<g{extra}>' + "".join(out) + "</g>"


ALL_PARTS = WORD_DESTINATION + WORD_NIGERIA + LANDSCAPE_DARK + LANDSCAPE_LIGHT + SUN


def svg_doc(w, h, body, title, desc="", vb=None, px=None, extra_defs=""):
    from html import escape
    title, desc = escape(title, quote=False), escape(desc, quote=False)
    vb = vb or f"0 0 {w:g} {h:g}"
    size = f' width="{px[0]:g}" height="{px[1]:g}"' if px else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="{vb}"{size} '
            f'role="img" aria-labelledby="title desc">\n<title id="title">{title}</title>\n'
            f'<desc id="desc">{desc}</desc>\n'
            + (f"<defs>{extra_defs}</defs>\n" if extra_defs else "") + body + "\n</svg>\n")


def write(path, text):
    p = KIT / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding="utf-8")
    return p


def logo_inline(cw="fullcolour", x=0, y=0, width=150.25, parts=None, small=False):
    """Primary logo as an inline <g> positioned at (x,y) with a given width (for templates)."""
    s = width / LOGO_W
    parts = parts or ALL_PARTS
    if small:
        parts = [p for p in parts if p != "horizon_small"]
    return (f'<g transform="translate({x:.3f},{y:.3f}) scale({s:.5f})">'
            + logo_group(parts, COLOURWAYS[cw] if isinstance(cw, str) else cw,
                         stroke_names=WORD_NIGERIA if small else (), stroke_w=0.35) + "</g>")


def roundel_inline(x, y, d, scheme="forest", uid="r"):
    """Compact 'Horizon Roundel' symbol: the logo landscape seen through a circular window."""
    # Window: centre on the monolith/sun pairing, radius in logo units
    cx, cy, r = 93.0, 7.5, 32.0
    s = d / (2 * r)
    schemes = {
        "forest": (C["forest"], COLOURWAYS["reversed"], None),
        "ivory": (C["ivory"], COLOURWAYS["fullcolour"], C["forest"]),
        "white": ("#FFFFFF", COLOURWAYS["fullcolour"], C["forest"]),
        "gold": (C["gold"], dict(word=C["forest"], hz=C["forest"], mt=C["forest"], hzs=C["forest"], sun="#FFFFFF"), None),
        "mono-black": ("#000000", COLOURWAYS["white"], None),
        "mono-white": ("#FFFFFF", COLOURWAYS["black"], None),
        "mono-green": (C["forest"], COLOURWAYS["white"], None),
    }
    bg, cw, ring = schemes[scheme]
    # lift the landscape so the horizon sits just below centre
    land = logo_group(["horizon", "horizon_small", "monolith", "ridge", "sun"], cw)
    ringel = (f'<circle cx="{cx}" cy="{cy}" r="{r - 0.5}" fill="none" stroke="{ring}" stroke-width="1"/>' if ring else "")
    return (f'<g transform="translate({x:.3f},{y:.3f}) scale({s:.5f}) translate({-(cx - r):.3f},{-(cy - r):.3f})">'
            f'<defs><clipPath id="{uid}"><circle cx="{cx}" cy="{cy}" r="{r}"/></clipPath></defs>'
            f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{bg}"/>'
            f'<g clip-path="url(#{uid})"><g>{land}</g>'
            # ground below the horizon so the window reads as landscape, not floating shapes
            f'</g>{ringel}</g>')


if __name__ == "__main__":
    for k, n, h, g, src, use in COLORS:
        print(f"{n:18} {h}  rgb{hex_rgb(h)}  cmyk{rgb_cmyk(hex_rgb(h))}  "
              f"vsWhite {contrast(h, '#FFFFFF'):.2f}  vsIvory {contrast(h, C['ivory']):.2f}  vsForest {contrast(h, C['forest']):.2f}")
