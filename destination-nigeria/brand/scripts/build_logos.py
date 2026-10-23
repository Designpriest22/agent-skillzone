#!/usr/bin/env python3
"""Build the four Destination Nigeria logo concepts as outlined SVG files.

Every mark is drawn from geometry on a 100-unit grid, and every wordmark is
converted to outlines with HarfBuzz shaping, so the files render the same
everywhere without the fonts installed.

Usage: python3 build_logos.py <fonts-dir> <out-dir>

The brand guide build (build_guide.py) imports this module for the same
geometry, so the page and the files never drift apart.

<fonts-dir> needs the static TTFs named below (all SIL Open Font License,
from Google Fonts): Unbounded, Onest, Martian Mono, Archivo Condensed, Gloock.
"""
import json
import math
import os
import sys

import uharfbuzz as hb
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

FONTS_DIR = os.environ.get("DN_FONTS", "fonts")

# Brand palette. Names come from Nigerian materials; see the brand guide.
C = {
    "green": "#00754A",     # Niger Green, a deeper, text-safe take on the flag green
    "flag": "#008751",      # Flag Green, the national reference
    "forest": "#0B2A1F",    # Forest Night, dark ground
    "indigo": "#232C63",    # Etu Indigo, adire and etu aso-oke
    "gold": "#F2A93B",      # Palm Gold, palm oil and the dry-season sun
    "laterite": "#B4472A",  # Laterite, red earth, Nok clay, Zaria walls
    "alaari": "#A3263F",    # Alaari, the crimson aso-oke
    "cotton": "#FFFFFF",
}


def n(v):
    s = f"{v:.2f}".rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s


# ---------------------------------------------------------------- text

_fonts = {}


def _font(name):
    if name not in _fonts:
        path = os.path.join(FONTS_DIR, name)
        tt = TTFont(path)
        face = hb.Face(hb.Blob.from_file_path(path))
        _fonts[name] = (tt, hb.Font(face), tt.getGlyphSet(), tt["head"].unitsPerEm)
    return _fonts[name]


def text(font, s, size, x=0.0, baseline=0.0, tracking=0, align="left"):
    """Outline `s` at `size`. tracking is in 1/1000 em. Returns (d, ink_bbox).

    Alignment uses the ink edges, not the sidebearings, so a line of type
    sits flush against a mark or a column edge."""
    tt, hbf, gs, upem = _font(font)
    buf = hb.Buffer()
    buf.add_str(s)
    buf.guess_segment_properties()
    hb.shape(hbf, buf, {"kern": True, "liga": True})
    order = tt.getGlyphOrder()
    k = size / upem
    track = tracking * upem / 1000
    placed, pen_x = [], 0.0
    for i, (info, pos) in enumerate(zip(buf.glyph_infos, buf.glyph_positions)):
        placed.append((order[info.codepoint], pen_x + pos.x_offset, pos.y_offset))
        pen_x += pos.x_advance + (track if i < len(buf.glyph_infos) - 1 else 0)

    def draw(pen_factory, dx):
        for g, gx, gy in placed:
            gs[g].draw(TransformPen(pen_factory, (k, 0, 0, -k, dx + gx * k, baseline - gy * k)))

    bp = BoundsPen(gs)
    draw(bp, 0)
    x0, y0, x1, y1 = bp.bounds
    dx = {"left": x - x0, "right": x - x1, "center": x - (x0 + x1) / 2}[align]
    sp = SVGPathPen(gs, ntos=n)
    draw(sp, dx)
    return sp.getCommands(), (x0 + dx, y0, x1 + dx, y1)


# ---------------------------------------------------------------- marks
# Each mark returns a list of (role, d, fill_rule) on a 100 x 100 grid.


def confluence_band(xs, w, alpha, R, ys, ytop, ybot, mirror=False):
    """One river: a straight reach, a bend of radius R, then a vertical run.

    Built from parallel lines and concentric arcs, so the band keeps an exact
    width all the way round the bend."""
    a = math.radians(alpha)
    cx = xs - R  # centre of the bend sits outside the arm

    def edge(o):
        r = R + o
        ax, ay = cx + r * math.cos(a), ys - r * math.sin(a)
        t = (ay - ytop) / math.cos(a)
        return r, (ax - t * math.sin(a), ytop), (ax, ay), (xs + o, ys)

    ri, ti, ai, ei = edge(-w / 2)
    ro, to, ao, eo = edge(+w / 2)
    X = (lambda x: 100 - x) if mirror else (lambda x: x)
    s1, s0 = ("0", "1") if mirror else ("1", "0")
    p = lambda pt: f"{n(X(pt[0]))} {n(pt[1])}"
    return (
        f"M{p(ti)}L{p(ai)}A{n(ri)} {n(ri)} 0 0 {s1} {p(ei)}"
        f"L{n(X(ei[0]))} {n(ybot)}L{n(X(eo[0]))} {n(ybot)}L{p(eo)}"
        f"A{n(ro)} {n(ro)} 0 0 {s0} {p(ao)}L{p(to)}Z"
    )


def circle(cx, cy, r, ccw=False):
    s = "0" if ccw else "1"
    return (f"M{n(cx - r)} {n(cy)}A{n(r)} {n(r)} 0 1 {s} {n(cx + r)} {n(cy)}"
            f"A{n(r)} {n(r)} 0 1 {s} {n(cx - r)} {n(cy)}Z")


def mark_confluence():
    w, gap = 13.5, 3.2
    xs = 50 - (w + gap) / 2
    kw = dict(w=w, alpha=38, R=27, ys=60, ytop=9, ybot=95)
    return [
        ("a", confluence_band(xs, **kw), "nonzero"),
        ("b", confluence_band(xs, mirror=True, **kw), "nonzero"),
        ("c", circle(50, 27.5, 8.2), "nonzero"),
    ]


def mark_gate():
    # Battered (tapering) mud wall crowned with three zanko pinnacles, a
    # parabolic doorway of the kind built in Zaria and Kano, and the sun
    # sitting on the threshold.
    def zanko(left, right, tip_x, tip_y, base_y):
        return (f"L{n(left)} {n(base_y)}"
                f"C{n(left + (tip_x - left) * 0.35)} {n(base_y - 6)} {n(tip_x - 1)} {n(tip_y + 5)} {n(tip_x)} {n(tip_y)}"
                f"C{n(tip_x + 1)} {n(tip_y + 5)} {n(right - (right - tip_x) * 0.35)} {n(base_y - 6)} {n(right)} {n(base_y)}")

    top = 30.5
    wall = ("M12 95" + zanko(19, 31.6, 22.4, 12.5, top) + zanko(43.4, 56.6, 50, 16, top)
            + zanko(68.4, 81, 77.6, 12.5, top) + "L88 95Z")
    door = "M35.8 95C35.8 68 41.6 47.6 50 44C58.4 47.6 64.2 68 64.2 95Z"
    sun = "M40.4 95A9.6 9.6 0 0 1 59.6 95Z"
    return [("a", wall + door, "evenodd"), ("c", sun, "nonzero")]


def mark_strips(count=7):
    # Narrow-band strips sewn edge to edge. The cloth waves on one sine, so
    # the whole reads as a flag in the wind; two weft bands run through every
    # strip and become the gold threads that tie it together.
    x0, x1 = 8, 92
    gap = 2.4 if count == 7 else 4.4
    sw = (x1 - x0 - gap * (count - 1)) / count
    A, L, top0, H = 6.2, 84, 21, 58
    f = lambda x: A * math.sin(2 * math.pi * (x - x0) / L)
    fp = lambda x: A * 2 * math.pi / L * math.cos(2 * math.pi * (x - x0) / L)

    def curve(xa, xb, off):
        # Cubic Hermite segment of the wave from xa to xb, shifted by off.
        d = (xb - xa) / 3
        ya, yb = off + f(xa), off + f(xb)
        return (f"C{n(xa + d)} {n(ya + fp(xa) * d)} {n(xb - d)} {n(yb - fp(xb) * d)} {n(xb)} {n(yb)}")

    def band(xa, xb, ytop, ybot):
        d = f"M{n(xa)} {n(ytop + f(xa))}" + curve(xa, xb, ytop)
        d += f"L{n(xb)} {n(ybot + f(xb))}"
        # back along the bottom edge (reverse direction)
        dd = (xa - xb) / 3
        ya, yb = ybot + f(xb), ybot + f(xa)
        d += f"C{n(xb + dd)} {n(ya + fp(xb) * dd)} {n(xa - dd)} {n(yb - fp(xa) * dd)} {n(xa)} {n(yb)}Z"
        return d

    tones = {7: "a b a b a b a".split(), 3: "a b a".split()}[count]
    out = []
    for i in range(count):
        xa = x0 + i * (sw + gap)
        xb = xa + sw
        out.append((tones[i], band(xa, xb, top0, top0 + H), "nonzero"))
        for rel, h in ((0.2, 4.2), (0.62, 9.5)) if count == 7 else ((0.56, 12),):
            y = top0 + H * rel
            out.append(("c", band(xa, xb, y, y + h), "nonzero"))
    return out


def mark_nok():
    # The Nok eye: a flat upper lid, a full lower lid and a pierced pupil,
    # under a crescent brow whose tips taper into the corners of the eye.
    eye = "M23 55A27 27 0 0 0 77 55Z"
    pupil = circle(50, 63.5, 7, ccw=True)
    e1, e2, c = (15, 57), (85, 57), 35

    def arc_r(h):
        return (h * h + c * c) / (2 * h)
    ro, ri = arc_r(57 - 19), arc_r(57 - 31)
    brow = (f"M{e1[0]} {e1[1]}A{n(ro)} {n(ro)} 0 1 1 {e2[0]} {e2[1]}"
            f"A{n(ri)} {n(ri)} 0 0 0 {e1[0]} {e1[1]}Z")
    return [("b", brow, "nonzero"), ("a", eye + pupil, "evenodd")]


MARKS = {
    "confluence": mark_confluence,
    "gate": mark_gate,
    "strips": mark_strips,
    "nok": mark_nok,
}

# role -> colour, per colourway. "positive" sits on white, "reverse" on Forest Night.
COLOURWAYS = {
    "confluence": {
        "positive": {"a": C["green"], "b": C["indigo"], "c": C["gold"], "type": C["forest"], "sub": C["green"]},
        "reverse": {"a": "#3DBE7F", "b": "#8C9BFF", "c": C["gold"], "type": C["cotton"], "sub": "#9FD9BB"},
    },
    "gate": {
        "positive": {"a": C["laterite"], "c": C["gold"], "type": C["forest"], "sub": C["laterite"]},
        "reverse": {"a": "#E0714F", "c": C["gold"], "type": C["cotton"], "sub": "#F0A88F"},
    },
    "strips": {
        "positive": {"a": C["green"], "b": C["indigo"], "c": C["gold"], "type": C["forest"], "sub": C["green"]},
        "reverse": {"a": "#2FA86E", "b": "#6F7DE0", "c": C["gold"], "type": C["cotton"], "sub": "#9FD9BB"},
    },
    "nok": {
        "positive": {"a": C["laterite"], "b": C["forest"], "type": C["forest"], "sub": C["laterite"]},
        "reverse": {"a": "#E0714F", "b": C["cotton"], "type": C["cotton"], "sub": "#F0A88F"},
    },
}


def mono(colour):
    return {k: colour for k in ("a", "b", "c", "type", "sub")}


ROLE_VARS = {"a": "--ra", "b": "--rb", "c": "--rc", "type": "--rt", "sub": "--rs"}


def hex_fill(colours):
    return lambda role: f'fill="{colours[role]}"'


def var_fill(role):
    return f'style="fill:var({ROLE_VARS[role]})"'


def shapes_markup(shapes, fill, dx=0, dy=0, s=1.0):
    tf = f' transform="translate({n(dx)} {n(dy)}) scale({n(s)})"' if (dx or dy or s != 1) else ""
    body = "".join(
        f'<path {fill(r)}{" fill-rule=\"evenodd\"" if fr == "evenodd" else ""} d="{d}"/>'
        for r, d, fr in shapes)
    return f"<g{tf}>{body}</g>"


# ---------------------------------------------------------------- wordmarks
# Each returns ([(role, d)], bbox) laid out with the cap line at y=0.

def wm_confluence():
    c, b2 = text("Unbounded-700.ttf", "NIGERIA", 34.6, 0, 11.4 + 8 + 26, tracking=10)
    # Track DESTINATION out until it spans exactly the width of NIGERIA.
    w_target = b2[2] - b2[0]
    lo, hi = 0, 800
    for _ in range(30):
        mid = (lo + hi) / 2
        _, bb = text("Unbounded-500.ttf", "DESTINATION", 15.2, 0, 11.4, tracking=mid)
        lo, hi = (mid, hi) if bb[2] - bb[0] < w_target else (lo, mid)
    a, b1 = text("Unbounded-500.ttf", "DESTINATION", 15.2, 0, 11.4, tracking=lo)
    return [("sub", a), ("type", c)], (0, 0, max(b1[2], b2[2]), b2[3])


def wm_gate():
    a, b1 = text("ArchivoCond-800.ttf", "DESTINATION", 34, 0, 23.3, tracking=8)
    c, b2 = text("ArchivoCond-800.ttf", "NIGERIA", 34, 0, 23.3 + 8 + 23.3, tracking=8)
    return [("type", a), ("sub", c)], (0, 0, max(b1[2], b2[2]), b2[3])


def wm_strips():
    a, b1 = text("Onest-700.ttf", "destination", 36, 0, 26, tracking=-28)
    c, b2 = text("Onest-700.ttf", "nigeria", 36, 0, 26 + 33, tracking=-28)
    return [("type", a), ("sub", c)], (0, b1[1], max(b1[2], b2[2]), b2[3])


def wm_nok():
    a, b = text("Gloock-400.ttf", "Destination Nigeria", 40, 0, 30, tracking=-6)
    return [("type", a)], (0, 0, b[2], b[3])


WORDMARKS = {"confluence": wm_confluence, "gate": wm_gate, "strips": wm_strips, "nok": wm_nok}

# Mark height in the horizontal lockup, as a share of the 100-unit grid, and
# the gap between mark and words. Set by eye per concept.
H_LOCKUP = {"confluence": (56, 9), "gate": (60, 8), "strips": (60, 6), "nok": (54, 10)}


def tagline(width, fill, justify=True, font="Martian-400.ttf", size=7.2):
    parts = ["EXPERIENCE.", "INVEST.", "EXPLORE."]
    boxes = [text(font, p, size, 0, 0, tracking=120)[1] for p in parts]
    total = sum(b[2] - b[0] for b in boxes)
    space = (width - total) / 2 if justify else size * 2.2
    ds, x = [], 0
    for p in parts:
        d, bb = text(font, p, size, x, 0, tracking=120)
        ds.append(d)
        x = bb[2] + space
    return f'<path {fill("sub")} d="{"".join(ds)}"/>'


# ---------------------------------------------------------------- lockups
# Each returns (inner markup, width, height).

def lockup_horizontal(key, fill, with_tag=False):
    parts, bb = WORDMARKS[key]()
    ww, wh = bb[2] - bb[0], bb[3] - bb[1]
    mark_h, gap = H_LOCKUP[key]
    ty = (mark_h - wh) / 2 - bb[1]
    tx = mark_h + gap
    words = "".join(f'<path {fill(r)} d="{d}"/>' for r, d in parts)
    body = shapes_markup(MARKS[key](), fill, 0, 0, mark_h / 100)
    body += f'<g transform="translate({n(tx)} {n(ty)})">{words}</g>'
    W, H = tx + ww, mark_h
    if with_tag:
        y = ty + bb[3] + 13
        body += f'<g transform="translate({n(tx)} {n(y)})">{tagline(ww, fill, justify=key != "nok")}</g>'
        H = max(H, y + 2)
    return body, W, H


def lockup_stacked(key, fill):
    parts, bb = WORDMARKS[key]()
    ww = bb[2] - bb[0]
    mark_h, gap = 74, 14
    W = max(ww, mark_h)
    words = "".join(f'<path {fill(r)} d="{d}"/>' for r, d in parts)
    tx, ty = (W - ww) / 2 - bb[0], mark_h + gap - bb[1]
    body = shapes_markup(MARKS[key](), fill, (W - mark_h) / 2, 0, mark_h / 100)
    body += f'<g transform="translate({n(tx)} {n(ty)})">{words}</g>'
    return body, W, ty + bb[3]


def mark_shapes(key, small=False):
    return mark_strips(3) if (key == "strips" and small) else MARKS[key]()


def svg_file(inner, w, h, title="Destination Nigeria"):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {n(w)} {n(h)}" '
            f'width="{n(w * 4)}" height="{n(h * 4)}" role="img" aria-label="{title}">'
            f"<title>{title}</title>{inner}</svg>\n")


def colourways(key):
    ways = dict(COLOURWAYS[key])
    ways["black"] = mono(C["forest"])
    ways["white"] = mono(C["cotton"])
    return ways


def write_files(out_dir):
    index = {}
    for i, key in enumerate(MARKS, 1):
        folder = os.path.join(out_dir, f"{i:02d}-{key}")
        os.makedirs(folder, exist_ok=True)
        files = {}
        for way, colours in colourways(key).items():
            fill = hex_fill(colours)
            files[f"mark-{way}.svg"] = svg_file(shapes_markup(mark_shapes(key), fill), 100, 100)
            files[f"horizontal-{way}.svg"] = svg_file(*lockup_horizontal(key, fill))
            files[f"stacked-{way}.svg"] = svg_file(*lockup_stacked(key, fill))
        files["horizontal-tagline-positive.svg"] = svg_file(
            *lockup_horizontal(key, hex_fill(COLOURWAYS[key]["positive"]), with_tag=True))
        if key == "strips":
            files["mark-small-positive.svg"] = svg_file(
                shapes_markup(mark_shapes(key, small=True), hex_fill(COLOURWAYS[key]["positive"])), 100, 100)
        for name, content in files.items():
            with open(os.path.join(folder, name), "w") as f:
                f.write(content)
        index[f"{i:02d}-{key}"] = sorted(files)
    return index


if __name__ == "__main__":
    FONTS_DIR = sys.argv[1]
    print(json.dumps(write_files(sys.argv[2]), indent=1))
