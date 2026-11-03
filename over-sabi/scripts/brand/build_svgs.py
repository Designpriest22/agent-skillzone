"""
Builds the Over Sabi logo SVGs with the wordmark converted to outlines (no font
dependency). Requires: pip install fonttools brotli. Run: python3 scripts/brand/build_svgs.py
Source font: Bricolage Grotesque (OFL), from node_modules/@fontsource-variable.
"""
import io
import os
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FONT = os.path.join(ROOT, "node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2")
OUT = os.path.join(ROOT, "public/brand")
os.makedirs(OUT, exist_ok=True)

FOREST, SAND, INK, EMBER, MINT = "#0e4a37", "#f4ede1", "#16130f", "#e0552a", "#8fd4b2"
MARK_PATH = "M43 19.5c-2.6-3.4-6.6-5.5-11-5.5-7.2 0-12.5 4.6-12.5 10.6 0 5.3 3.8 7.9 12.5 9.4 8.7 1.5 12.5 4.1 12.5 9.4 0 6-5.3 10.6-12.5 10.6-4.4 0-8.4-2.1-11-5.5"

font = TTFont(FONT)
font = instantiateVariableFont(font, {"wght": 800})
glyphset = font.getGlyphSet()
cmap = font.getBestCmap()
upem = font["head"].unitsPerEm
ascender = font["hhea"].ascent


def text_paths(text, size, x0, baseline, tracking=-0.02):
    """Return (list of (path_d) per character, advance width) for text at `size` px."""
    scale = size / upem
    x = x0
    paths = []
    for ch in text:
        gname = cmap[ord(ch)]
        pen = SVGPathPen(glyphset)
        tpen = TransformPen(pen, (scale, 0, 0, -scale, x, baseline))
        glyphset[gname].draw(tpen)
        paths.append(pen.getCommands())
        x += glyphset[gname].width * scale + tracking * size
    return paths, x - x0


def mark(x, y, s, bg=FOREST, stroke=SAND, dot=EMBER):
    k = s / 64
    return (
        f'<g transform="translate({x} {y}) scale({k})">'
        f'<rect width="64" height="64" rx="16" fill="{bg}"/>'
        f'<path d="{MARK_PATH}" fill="none" stroke="{stroke}" stroke-width="6.5" stroke-linecap="round"/>'
        f'<circle cx="47.5" cy="14.5" r="5" fill="{dot}"/></g>'
    )


def wordmark(x, baseline, size, over_fill, sabi_fill):
    over, w1 = text_paths("over", size, x, baseline)
    sabi, w2 = text_paths("sabi", size, x + w1, baseline)
    d1 = "".join(f'<path d="{p}" fill="{over_fill}"/>' for p in over)
    d2 = "".join(f'<path d="{p}" fill="{sabi_fill}"/>' for p in sabi)
    return d1 + d2, w1 + w2


def svg(w, h, body, title):
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.1f} {h:.1f}" width="{w:.0f}" height="{h:.0f}" role="img" aria-label="{title}">'
        f"<title>{title}</title>{body}</svg>\n"
    )


def write(name, content):
    with open(os.path.join(OUT, name), "w", encoding="utf-8") as f:
        f.write(content)
    print("wrote", name)


# App icon / mark
write("over-sabi-mark.svg", svg(64, 64, mark(0, 0, 64), "Over Sabi"))
write("over-sabi-mark-mono.svg", svg(64, 64, mark(0, 0, 64, bg=INK, stroke=SAND, dot=SAND), "Over Sabi"))
write("over-sabi-mark-reversed.svg", svg(64, 64, mark(0, 0, 64, bg=SAND, stroke=FOREST, dot=EMBER), "Over Sabi"))

# Horizontal lockups
size, m = 64, 72
for name, over_fill, sabi_fill, bg in [
    ("over-sabi-logo-horizontal.svg", INK, FOREST, None),
    ("over-sabi-logo-horizontal-reversed.svg", SAND, MINT, INK),
    ("over-sabi-logo-horizontal-mono.svg", INK, INK, None),
]:
    words, ww = wordmark(m + 18, 54, size, over_fill, sabi_fill)
    w = m + 18 + ww + 8
    back = f'<rect width="{w + 32}" height="104" x="-16" y="-16" fill="{bg}"/>' if bg else ""
    mk = mark(0, 0, m, bg=INK if "mono" in name else FOREST, dot=SAND if "mono" in name else EMBER)
    body = f'<g transform="translate({16 if bg else 0} {16 if bg else 0})">{back}{mk}{words}</g>'
    write(name, svg(w + (32 if bg else 0), m + (32 if bg else 0), body, "Over Sabi"))

# Stacked lockup
words, ww = text_paths("oversabi", 56, 0, 0)
_, wo = text_paths("over", 56, 0, 0)
over_p, w_over = wordmark(0, 0, 56, INK, FOREST)
W = max(ww, 120) + 16
body = mark((W - 112) / 2, 0, 112) + f'<g transform="translate({(W - ww) / 2} 172)">{over_p}</g>'
write("over-sabi-logo-stacked.svg", svg(W, 190, body, "Over Sabi"))

# Maskable / store icon: mark on a full-bleed forest square with safe-zone padding
write(
    "over-sabi-icon-maskable.svg",
    svg(512, 512, f'<rect width="512" height="512" fill="{FOREST}"/>' + mark(106, 106, 300), "Over Sabi"),
)
