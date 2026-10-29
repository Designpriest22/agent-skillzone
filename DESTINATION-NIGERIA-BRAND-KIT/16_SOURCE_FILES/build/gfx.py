"""Graphic helpers: outlined text, tapered horizon ribbons, contour fields, ridges, map projection."""
import json
import math
import numpy as np
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from brand import KIT

FONT_DIR = KIT / "03_COLOR_AND_TYPOGRAPHY" / "fonts"
_fonts = {}


def _font(name):
    if name not in _fonts:
        path = FONT_DIR / f"{name}.ttf"
        blob = hb.Blob.from_file_path(str(path))
        face = hb.Face(blob)
        f = hb.Font(face)
        tt = TTFont(str(path))
        _fonts[name] = (f, tt, tt.getGlyphSet(), tt["head"].unitsPerEm, tt.getGlyphOrder())
    return _fonts[name]


def text_path(text, font="Inter-SemiBold", size=10.0, tracking=0.0, x=0.0, y=0.0, anchor="start"):
    """Shape text with HarfBuzz and return (svg path d, advance width). y is the baseline."""
    f, tt, gs, upm, order = _font(font)
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(f, buf, {"kern": True, "liga": True})
    s = size / upm
    track = tracking * size
    total = sum(p.x_advance for p in buf.glyph_positions) * s + track * max(len(buf.glyph_infos) - 1, 0)
    if anchor == "middle":
        x -= total / 2
    elif anchor == "end":
        x -= total
    pen_x = x
    parts = []
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        gname = order[info.codepoint]
        pen = SVGPathPen(gs)
        tp = TransformPen(pen, (s, 0, 0, -s, pen_x + pos.x_offset * s, y - pos.y_offset * s))
        gs[gname].draw(tp)
        d = pen.getCommands()
        if d:
            parts.append(d)
        pen_x += pos.x_advance * s + track
    d = " ".join(parts)
    return _round_d(d), total


def _round_d(d):
    import re
    return re.sub(r"-?\d+\.\d+", lambda m: f"{float(m.group()):.2f}".rstrip("0").rstrip("."), d)


def text_el(text, fill, **kw):
    d, w = text_path(text, **kw)
    return f'<path fill="{fill}" d="{d}"/>', w


# ------------------------------------------------------------------ horizon ribbons
def bezier(p0, p1, p2, p3, n=80):
    t = np.linspace(0, 1, n)[:, None]
    return ((1 - t) ** 3) * p0 + 3 * ((1 - t) ** 2) * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3 * p3


def ribbon(p0, p1, p2, p3, width, bias=0.5, n=90, power=0.9):
    """Tapered swash along a cubic bezier: thin at both ends, max `width` near `bias` (0..1)."""
    P = [np.array(p, float) for p in (p0, p1, p2, p3)]
    pts = bezier(*P, n=n)
    tan = np.gradient(pts, axis=0)
    nor = np.stack([-tan[:, 1], tan[:, 0]], 1)
    nor /= np.linalg.norm(nor, axis=1, keepdims=True) + 1e-9
    t = np.linspace(0, 1, n)
    # asymmetric bell: peak at bias
    prof = np.where(t < bias, np.sin(np.pi / 2 * t / bias), np.sin(np.pi / 2 * (1 - t) / (1 - bias))) ** power
    w = width / 2 * prof
    a = pts + nor * w[:, None]
    b = pts - nor * w[:, None] * 0.35   # asymmetric: belly hangs below the spine, like the logo swashes
    poly = np.vstack([a, b[::-1]])
    return "M" + " L".join(f"{x:.2f},{y:.2f}" for x, y in poly) + "Z"


def stroke_curve(p0, p1, p2, p3):
    return f"M{p0[0]:.1f},{p0[1]:.1f} C{p1[0]:.1f},{p1[1]:.1f} {p2[0]:.1f},{p2[1]:.1f} {p3[0]:.1f},{p3[1]:.1f}"


# ------------------------------------------------------------------ noise + contours
def periodic_field(nx, ny, seed=1, octaves=((1, 1.0), (2, 0.5), (3, 0.33), (5, 0.18)), periodic=True):
    rng = np.random.default_rng(seed)
    X, Y = np.meshgrid(np.linspace(0, 1, nx, endpoint=not periodic), np.linspace(0, 1, ny, endpoint=not periodic))
    Z = np.zeros_like(X)
    for f, amp in octaves:
        for _ in range(3):
            kx, ky = rng.integers(-f, f + 1), rng.integers(-f, f + 1)
            if kx == 0 and ky == 0:
                kx = f
            ph = rng.uniform(0, 2 * np.pi)
            Z += amp * np.sin(2 * np.pi * (kx * X + ky * Y) + ph)
    return X, Y, Z


def contour_paths(Z, w, h, levels, closed_only=False, simplify=1):
    import contourpy
    ny, nx = Z.shape
    gen = contourpy.contour_generator(np.linspace(0, w, nx), np.linspace(0, h, ny), Z, line_type="Separate")
    out = []
    for lv in levels:
        for seg in gen.lines(lv):
            if len(seg) < 4:
                continue
            seg = seg[::simplify] if simplify > 1 else seg
            out.append((lv, "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in seg)))
    return out


# ------------------------------------------------------------------ ridges / landscape
def ridge(w, h, base, amp, seed=0, freq=3, rocks=(), samples=240):
    """Filled ridge silhouette from x=0..w closing to the bottom. rocks=[(x_center, width, height)] add inselberg domes."""
    rng = np.random.default_rng(seed)
    xs = np.linspace(0, w, samples)
    y = np.full_like(xs, base, dtype=float)
    for k in range(1, 4):
        y -= amp * np.sin(2 * np.pi * (freq * k * xs / w) + rng.uniform(0, 6.28)) * (0.42 ** (k - 1))
    for cx, rw, rh in rocks:
        t = np.clip(1 - ((xs - cx) / (rw / 2)) ** 2, 0, None)
        y -= rh * t ** 0.45  # steep-sided granite dome
    pts = " L".join(f"{x:.1f},{yy:.1f}" for x, yy in zip(xs, y))
    return f"M0,{h} L{pts} L{w},{h} Z"


# ------------------------------------------------------------------ map
CITIES = {  # decimal degrees (lat, lon) — approximate city centres
    "Lagos": (6.5244, 3.3792), "Abuja": (9.0765, 7.3986), "Kano": (12.0022, 8.5920),
    "Port Harcourt": (4.8156, 7.0498), "Ibadan": (7.3775, 3.9470), "Calabar": (4.9757, 8.3417),
    "Enugu": (6.4584, 7.5464), "Jos": (9.8965, 8.8583), "Kaduna": (10.5105, 7.4165),
    "Benin City": (6.3350, 5.6037), "Maiduguri": (11.8311, 13.1510), "Sokoto": (13.0059, 5.2476),
    "Lokoja": (7.8023, 6.7333), "Yola": (9.2035, 12.4954), "Abeokuta": (7.1475, 3.3619),
}


def load_geo():
    return json.loads((KIT / "16_SOURCE_FILES/data/nigeria_and_neighbours_ne10m.geojson").read_text())


class Proj:
    """Equirectangular projection scaled by cos(lat0) — adequate at Nigeria's scale (4–14°N)."""

    def __init__(self, bbox=(2.6, 4.2, 14.8, 13.95), width=1000, pad=20):
        self.lon0, self.lat0, self.lon1, self.lat1 = bbox
        self.k = math.cos(math.radians((self.lat0 + self.lat1) / 2))
        self.s = (width - 2 * pad) / ((self.lon1 - self.lon0) * self.k)
        self.pad = pad
        self.w = width
        self.h = (self.lat1 - self.lat0) * self.s + 2 * pad

    def __call__(self, lon, lat):
        return (self.pad + (lon - self.lon0) * self.k * self.s, self.pad + (self.lat1 - lat) * self.s)


def country_path(feature, proj, step=1):
    out = []
    for poly in feature["geometry"]["coordinates"]:
        for ring in poly:
            pts = [proj(*p) for p in ring[::step]]
            out.append("M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in pts) + "Z")
    return " ".join(out)
