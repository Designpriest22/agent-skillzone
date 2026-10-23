#!/usr/bin/env python3
"""Build the Destination Nigeria brand guide page from its template.

Usage: python3 build_guide.py <fonts-dir> <template> <standalone-out> [<fragment-out>]

The template carries the copy and layout. This script fills in what has to be
computed: the logo symbols (from build_logos.py, so the page uses the exact
geometry of the files), each concept's view boxes, the colourway CSS, the
palette's print values and the WCAG contrast table.
"""
import json
import math
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_logos as bl  # noqa: E402

KEYS = list(bl.MARKS)
ROLES = {"a": "a", "b": "b", "c": "c", "type": "t", "sub": "s"}


def vb(w, h):
    return f"0 0 {bl.n(w)} {bl.n(h)}"


# ---------------------------------------------------------------- symbols

def construction(key):
    """Thin construction lines drawn from the same numbers as each mark."""
    L, Cc = [], []
    if key == "confluence":
        w, gap, R, ys = 13.5, 3.2, 27, 60
        xs = 50 - (w + gap) / 2
        for x in (xs - R, 100 - xs + R):
            Cc += [(x, ys, R), (x, ys, R - w / 2), (x, ys, R + w / 2)]
        Cc.append((50, 27.5, 8.2))
        L += [(0, 9, 100, 9), (0, ys, 100, ys), (0, 95, 100, 95), (50, 0, 50, 100)]
        a = math.radians(38)
        for sx in (1, -1):
            ax = xs - R + R * math.cos(a)
            ay = ys - R * math.sin(a)
            x0 = 50 + sx * (ax - 50)
            L.append((x0, ay, 50 + sx * (ax - 50 - 60 * math.sin(a)), ay - 60 * math.cos(a)))
    elif key == "gate":
        L += [(0, 30.5, 100, 30.5), (0, 95, 100, 95), (0, 44, 100, 44), (50, 0, 50, 100),
              (12, 95, 19 - 7 * 25.5 / 64.5, 5), (88, 95, 81 + 7 * 25.5 / 64.5, 5),
              (35.8, 44, 35.8, 100), (64.2, 44, 64.2, 100)]
        Cc += [(50, 95, 9.6)]
    elif key == "strips":
        x0, x1, gap = 8, 92, 2.4
        sw = (x1 - x0 - gap * 6) / 7
        for i in range(8):
            x = x0 + i * (sw + gap) - (gap / 2 if 0 < i < 7 else 0) - (gap if i == 7 else 0)
            L.append((x, 6, x, 94))
        for base in (21, 79):
            pts = [(x0 + t, base + 6.2 * math.sin(2 * math.pi * t / 84)) for t in range(0, 85, 4)]
            L += [(*pts[i], *pts[i + 1]) for i in range(len(pts) - 1)]
    elif key == "nok":
        c = 35
        ro = (38 * 38 + c * c) / 76
        ri = (26 * 26 + c * c) / 52
        Cc += [(50, 19 + ro, ro), (50, 31 + ri, ri), (50, 55, 27), (50, 63.5, 7)]
        L += [(0, 57, 100, 57), (0, 55, 100, 55), (50, 0, 50, 100)]
    grid = "".join(f'<path d="M{i} 0V100M0 {i}H100"/>' for i in range(10, 100, 10))
    lines = "".join(f'<path d="M{bl.n(a)} {bl.n(b)}L{bl.n(c)} {bl.n(d)}"/>' for a, b, c, d in L)
    circles = "".join(f'<circle cx="{bl.n(x)}" cy="{bl.n(y)}" r="{bl.n(r)}"/>' for x, y, r in Cc)
    return (f'<g fill="none" style="stroke:var(--grid)" stroke-width=".3">{grid}</g>'
            f'<g fill="none" style="stroke:var(--cl)" stroke-width=".45">{lines}{circles}</g>')


def symbols():
    out, boxes = [], {}
    for key in KEYS:
        box = {}
        mark = bl.shapes_markup(bl.mark_shapes(key), bl.var_fill)
        out.append(f'<symbol id="m-{key}" viewBox="0 0 100 100">{mark}</symbol>')
        small = bl.shapes_markup(bl.mark_shapes(key, small=True), bl.var_fill)
        out.append(f'<symbol id="ms-{key}" viewBox="0 0 100 100">{small}</symbol>')
        box["m"] = box["ms"] = box["c"] = "0 0 100 100"
        out.append(f'<symbol id="c-{key}" viewBox="0 0 100 100">{construction(key)}</symbol>')
        for kind, (inner, w, h) in {
            "h": bl.lockup_horizontal(key, bl.var_fill),
            "t": bl.lockup_horizontal(key, bl.var_fill, with_tag=True),
            "s": bl.lockup_stacked(key, bl.var_fill),
        }.items():
            out.append(f'<symbol id="{kind}-{key}" viewBox="{vb(w, h)}">{inner}</symbol>')
            box[kind] = vb(w, h)
        boxes[key] = box
    # The 37-strip cloth: 36 states and the FCT.
    out.append(f'<symbol id="cloth" viewBox="0 0 {37 * 10} 120" preserveAspectRatio="none">{cloth()}</symbol>')
    defs = ('<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">'
            + "".join(out) + "</svg>")
    return defs, boxes


def cloth():
    """37 strips, each with its own tone and weft placement, from a fixed rule
    so the pattern is the same every build."""
    # No Forest Night strips: the cloth often runs along a Forest Night ground.
    tones = ["--p-green", "--p-flag", "--p-indigo", "--p-green", "--p-laterite", "--p-gold", "--p-flag"]
    wefts = ["--p-gold", "--p-cotton", "--p-gold", "--p-alaari", "--p-gold", "--p-forest", "--p-gold"]
    parts = []
    for i in range(37):
        x = i * 10
        t = tones[(i * 3) % 7]
        wf = wefts[(i * 5 + 2) % 7]
        if (t, wf) in (("--p-laterite", "--p-gold"), ("--p-gold", "--p-gold"), ("--p-laterite", "--p-alaari")):
            wf = "--p-forest" if t == "--p-gold" else "--p-cotton"
        parts.append(f'<rect x="{x}" y="0" width="9.2" height="120" style="fill:var({t})"/>')
        y1 = 14 + (i * 7) % 23
        y2 = 62 + (i * 11) % 31
        parts.append(f'<rect x="{x}" y="{y1}" width="9.2" height="{3 + i % 3}" style="fill:var({wf})"/>')
        parts.append(f'<rect x="{x}" y="{y2}" width="9.2" height="{7 + (i * 2) % 5}" style="fill:var({wf})"/>')
    return "".join(parts)


def logo_css():
    """Colourway custom properties for every concept.

    .k-<key> follows the page theme. A .pos or .rev panel, or a .cw-pos or
    .cw-rev class on the logo itself, pins the colourway for a fixed ground."""
    const, theme_light, theme_dark, rules = [], [], [], []
    for key in KEYS:
        ways = bl.COLOURWAYS[key]
        for role, short in ROLES.items():
            pos = ways["positive"].get(role, ways["positive"]["a"])
            rev = ways["reverse"].get(role, ways["reverse"]["a"])
            const.append(f"--{key}-{short}-pos:{pos};--{key}-{short}-rev:{rev};")
            theme_light.append(f"--{key}-{short}:var(--{key}-{short}-pos);")
            theme_dark.append(f"--{key}-{short}:var(--{key}-{short}-rev);")
        decl = lambda mode: "".join(f"--r{s}:var(--{key}-{s}{mode});" for s in ROLES.values())
        rules.append(f".k-{key}{{{decl('')}}}")
        rules.append(f".pos .k-{key},.k-{key}.cw-pos{{{decl('-pos')}}}")
        rules.append(f".rev .k-{key},.k-{key}.cw-rev{{{decl('-rev')}}}")
    rules.append(".lg.mono,.mono .lg{--ra:currentColor;--rb:currentColor;--rc:currentColor;--rt:currentColor;--rs:currentColor}")
    return ("".join(const), "".join(theme_light), "".join(theme_dark), "\n".join(rules))


# ---------------------------------------------------------------- colour maths

def rgb(hexv):
    hexv = hexv.lstrip("#")
    return tuple(int(hexv[i:i + 2], 16) for i in (0, 2, 4))


def luminance(hexv):
    def ch(c):
        c /= 255
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (ch(c) for c in rgb(hexv))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a, b):
    la, lb = sorted((luminance(a), luminance(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def cmyk(hexv):
    r, g, b = (c / 255 for c in rgb(hexv))
    k = 1 - max(r, g, b)
    if k >= 1:
        return (0, 0, 0, 100)
    return tuple(round(v * 100) for v in ((1 - r - k) / (1 - k), (1 - g - k) / (1 - k), (1 - b - k) / (1 - k), k))


PALETTE = [
    ("Niger Green", bl.C["green"], "--p-green",
     "A deeper take on the flag green, dark enough to pass as text on white. The main brand colour."),
    ("Forest Night", bl.C["forest"], "--p-forest",
     "Rainforest green taken almost to black. Text, dark grounds and reverse panels."),
    ("Etu Indigo", bl.C["indigo"], "--p-indigo",
     "From etu, the guinea-fowl aso-oke, and the indigo of adire. Carries Explore."),
    ("Palm Gold", bl.C["gold"], "--p-gold",
     "Palm oil and the dry-season sun. Highlights and accents, never body text on white."),
    ("Laterite", bl.C["laterite"], "--p-laterite",
     "The red earth of laterite roads, Nok clay and Zaria walls. Heritage and warmth, used sparingly."),
    ("Cotton", bl.C["cotton"], "--p-cotton",
     "Hand-spun cotton white. The main ground, and there should be plenty of it."),
]


def palette_html():
    cards = []
    for name, hexv, var, note in PALETTE:
        r, g, b = rgb(hexv)
        c, m, y, k = cmyk(hexv)
        light = luminance(hexv) > 0.4
        cards.append(
            f'<article class="sw{" sw-light" if light else ""}" style="--sw:var({var})">'
            f'<div class="sw-chip"><span class="sw-name">{name}</span></div>'
            f'<div class="sw-body"><p>{note}</p><dl class="sw-codes">'
            f"<div><dt>HEX</dt><dd>{hexv.upper()}</dd></div>"
            f"<div><dt>RGB</dt><dd>{r} {g} {b}</dd></div>"
            f"<div><dt>CMYK</dt><dd>{c} {m} {y} {k}</dd></div>"
            f"</dl></div></article>")
    return "\n".join(cards)


PAIRS = [
    ("Forest Night", "Cotton"), ("Niger Green", "Cotton"), ("Cotton", "Niger Green"),
    ("Cotton", "Etu Indigo"), ("Palm Gold", "Forest Night"), ("Forest Night", "Palm Gold"),
    ("Laterite", "Cotton"), ("Palm Gold", "Cotton"),
]


def contrast_html():
    lookup = {name: (hexv, var) for name, hexv, var, _ in PALETTE}
    rows = []
    for fg, bg in PAIRS:
        ratio = contrast(lookup[fg][0], lookup[bg][0])
        if ratio >= 7:
            verdict, cls = "AAA, any text", "ok"
        elif ratio >= 4.5:
            verdict, cls = "AA, any text", "ok"
        elif ratio >= 3:
            verdict, cls = "AA large text only", "mid"
        else:
            verdict, cls = "Decoration only", "no"
        rows.append(
            f'<tr><td><span class="pair" style="--fg:var({lookup[fg][1]});--bg:var({lookup[bg][1]})">Aa</span></td>'
            f"<td>{fg} on {bg}</td><td class=\"num\">{ratio:.2f}:1</td>"
            f'<td><span class="verdict v-{cls}">{verdict}</span></td></tr>')
    return "\n".join(rows)


# ---------------------------------------------------------------- build

def main():
    bl.FONTS_DIR = sys.argv[1]
    template, standalone_out = sys.argv[2], sys.argv[3]
    fragment_out = sys.argv[4] if len(sys.argv) > 4 else None
    src = open(template, encoding="utf-8").read()
    defs, boxes = symbols()
    const, light, dark, rules = logo_css()
    palette_vars = "".join(f"{var}:{hexv};" for _, hexv, var, _ in PALETTE) + f"--p-alaari:{bl.C['alaari']};--p-flag:{bl.C['flag']};"

    out = src.replace("<!--SYMBOLS-->", defs)
    out = out.replace("/*LOGO-CONST*/", palette_vars + const)
    out = out.replace("/*LOGO-LIGHT*/", light).replace("/*LOGO-DARK*/", dark)
    out = out.replace("/*LOGO-RULES*/", rules)
    out = out.replace("/*VB*/", json.dumps(boxes, separators=(",", ":")))
    out = out.replace("<!--PALETTE-->", palette_html()).replace("<!--CONTRAST-->", contrast_html())
    out = re.sub(r"\{\{vb:(\w+):(\w+)\}\}", lambda m: boxes[m.group(2)][m.group(1)], out)
    missing = re.findall(r"\{\{[^}]+\}\}|<!--[A-Z]+-->|/\*[A-Z-]+\*/", out)
    if missing:
        sys.exit(f"unfilled placeholders: {missing}")

    if fragment_out:
        with open(fragment_out, "w", encoding="utf-8") as f:
            f.write(out)
    with open(standalone_out, "w", encoding="utf-8") as f:
        f.write('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
                '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
                + out.replace("</style>", "</style>\n</head>\n<body>", 1) + "\n</body>\n</html>\n")


if __name__ == "__main__":
    main()
