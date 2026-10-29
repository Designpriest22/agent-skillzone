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
    ("forest", "Forest Deep", "#103428", "primary", "sampled",
     "Primary brand colour. Wordmark, headlines, institutional backgrounds, body text on light grounds."),
    ("ridge", "Ridge Green", "#2C5040", "primary", "sampled",
     "Mountain tone in the logo. Secondary backgrounds, panels, charts, hover states."),
    ("gold", "Sun Gold", "#E8A432", "primary", "sampled",
     "The sun. Single focal accent: sun disc, key numbers, buttons on dark. Never for small text on light."),
    ("ivory", "Harmattan Ivory", "#F5F0E6", "primary", "recommended",
     "Default light ground for documents, presentations and web. Warmer than white."),
    ("white", "White", "#FFFFFF", "primary", "sampled",
     "Reversed logo, paper white, UI surfaces."),
    ("mist", "Mist", "#EAEAEA", "secondary", "sampled",
     "Horizon line tone in the supplied reversed logo. Hairlines and dividers on dark grounds."),
    ("canopy", "Canopy Green", "#4E7A62", "secondary", "recommended",
     "Supporting green for charts, icons and illustration layers."),
    ("sage", "Sage", "#A9BFA9", "secondary", "recommended",
     "Light green tint for table bands, map land, background contours."),
    ("charcoal", "Charcoal", "#1B201E", "neutral", "recommended",
     "Darkest neutral (green-black). Cinematic backgrounds, long-form body text alternative."),
    ("stone", "Stone", "#5F6662", "neutral", "recommended",
     "Captions, metadata, footnotes, secondary UI text (passes AA on white and ivory)."),
    ("haze", "Haze", "#E7DFCF", "neutral", "recommended",
     "Deeper ivory for cards, table headers and print panels."),
    ("laterite", "Laterite", "#B4532A", "landscape", "recommended",
     "Red-earth accent drawn from Nigeria's laterite soils. Culture and heritage stories; sparingly."),
    ("savannah", "Savannah", "#D8C49B", "landscape", "recommended",
     "Dry-season grass and sand. Illustration layers, photo-overlay warmth, map water-free land."),
    ("confluence", "Confluence Blue", "#2E6E76", "landscape", "recommended",
     "River and coastline tone (Niger–Benue). Maps, routes, information graphics, digital links on light."),
    ("golddeep", "Harvest Gold", "#9A6510", "secondary", "recommended",
     "Accessible gold for text and icons on light grounds (AA for large text and UI on ivory)."),
]
C = {k: h for k, _, h, *_ in COLORS}

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
    "display": {"family": "Playfair Display", "fallback": "Georgia, 'Times New Roman', serif",
                "office": "Georgia", "role": "Display headlines, document titles, campaign lines. Echoes the high-contrast serif of the wordmark."},
    "editorial": {"family": "Source Serif 4", "fallback": "Georgia, Cambria, serif",
                  "office": "Cambria", "role": "Long-form editorial reading, report introductions, pull quotes, captions in print."},
    "sans": {"family": "Inter", "fallback": "'Segoe UI', Calibri, Arial, sans-serif",
             "office": "Calibri", "role": "UI, body copy in documents, labels, tables, data (tabular figures), overlines echoing NIGERIA."},
}
SERIF = "'Playfair Display', Georgia, serif"
EDIT = "'Source Serif 4', Georgia, serif"
SANS = "Inter, 'Segoe UI', Arial, sans-serif"

TYPE_SCALE = [
    # token, family, weight, size px, line-height, tracking em, use
    ("hero", "display", 500, 72, 1.04, -0.01, "Hero headlines, campaign posters, cover titles"),
    ("h1", "display", 500, 48, 1.1, -0.005, "Section headings, slide titles, document titles"),
    ("h2", "display", 500, 34, 1.15, 0, "Sub-section headings"),
    ("h3", "sans", 600, 22, 1.3, 0, "Subheadings, card titles"),
    ("overline", "sans", 600, 13, 1.4, 0.22, "Eyebrows / kickers in caps, echoing NIGERIA in the logo"),
    ("lead", "editorial", 400, 21, 1.5, 0, "Standfirst, introductions, executive summary lead"),
    ("body", "sans", 400, 16, 1.6, 0, "Body text (digital); 10.5 pt in documents"),
    ("body-editorial", "editorial", 400, 17, 1.6, 0, "Long-form print reading; 10.5 pt in reports"),
    ("caption", "sans", 400, 13, 1.45, 0.01, "Captions, image credits, metadata"),
    ("footnote", "sans", 400, 11, 1.4, 0.01, "Footnotes, legal lines, sources"),
    ("table", "sans", 400, 14, 1.35, 0, "Tables, with tabular figures (font-feature-settings: 'tnum')"),
    ("data", "sans", 300, 64, 1.0, -0.02, "Key statistics / KPIs (Inter Light, tabular)"),
    ("button", "sans", 600, 15, 1.0, 0.04, "Buttons and labels"),
]

# Spacing: 8-pt base
SPACE = [4, 8, 12, 16, 24, 32, 48, 64, 96, 128]
RADIUS = {"sm": 4, "md": 8, "lg": 16, "pill": 999}

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
    "reversed":     dict(word=C["white"], hz=C["mist"], mt=C["white"], hzs=C["mist"], sun=C["gold"]),
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
