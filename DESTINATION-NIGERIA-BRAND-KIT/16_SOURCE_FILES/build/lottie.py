"""Lottie (Bodymovin JSON) exports of the simple vector animations: B (minimal reveal) and E (symbol).

Logo paths are converted segment-by-segment from the supplied SVG geometry (arcs → cubic béziers).
Output: 07_MOTION_IDENTITY/LOTTIE/*.json — play with lottie-web, lottie-ios/android, Webflow, etc.
"""
import json
import svgelements as se
from brand import *

FPS = 30
OUT = KIT / "07_MOTION_IDENTITY" / "LOTTIE"
OUT.mkdir(parents=True, exist_ok=True)


def rgba(hx, a=1):
    r, g, b = hex_rgb(hx)
    return [round(r / 255, 4), round(g / 255, 4), round(b / 255, 4), a]


def shapes_from_d(d):
    """SVG path data → list of Lottie 'sh' shapes (one per closed sub-path)."""
    path = se.Path(d)
    path.approximate_arcs_with_cubics()
    out, cur = [], None

    def flush():
        if cur and cur["v"]:
            n = len(cur["v"])
            cur["i"] = cur["i"][:n]
            cur["o"] = cur["o"][:n]
            out.append({"ty": "sh", "ks": {"a": 0, "k": {"i": cur["i"], "o": cur["o"], "v": cur["v"], "c": cur["c"]}}})

    for seg in path:
        if isinstance(seg, se.Move):
            flush()
            cur = {"v": [[seg.end.x, seg.end.y]], "i": [[0, 0]], "o": [[0, 0]], "c": False}
            continue
        if isinstance(seg, se.Close):
            if cur:
                # drop duplicate end vertex that equals the start
                if len(cur["v"]) > 1 and abs(cur["v"][-1][0] - cur["v"][0][0]) < 1e-6 and abs(cur["v"][-1][1] - cur["v"][0][1]) < 1e-6:
                    cur["i"][0] = cur["i"][-1]
                    cur["v"].pop(); cur["i"].pop(); cur["o"].pop()
                cur["c"] = True
            continue
        s, e = seg.start, seg.end
        if isinstance(seg, se.QuadraticBezier):
            c1 = s + (seg.control - s) * (2 / 3)
            c2 = e + (seg.control - e) * (2 / 3)
        elif isinstance(seg, se.CubicBezier):
            c1, c2 = seg.control1, seg.control2
        else:  # Line
            c1, c2 = s, e
        cur["o"][-1] = [c1.x - s.x, c1.y - s.y]
        cur["v"].append([e.x, e.y])
        cur["i"].append([c2.x - e.x, c2.y - e.y])
        cur["o"].append([0, 0])
    flush()
    for sh in out:
        k = sh["ks"]["k"]
        for key in ("i", "o", "v"):
            k[key] = [[round(a, 3), round(b, 3)] for a, b in k[key]]
    return out


def static(v):
    return {"a": 0, "k": v}


def anim(keys, ease="out"):
    """keys = [(frame, value), ...]; value scalar or list."""
    eases = {"out": ({"x": [0.2], "y": [1]}, {"x": [0.3], "y": [0]}), "inout": ({"x": [0.6], "y": [1]}, {"x": [0.4], "y": [0]}),
             "back": ({"x": [0.3], "y": [1.35]}, {"x": [0.3], "y": [0]})}
    i, o = eases[ease]
    k = []
    for n, (f, v) in enumerate(keys):
        item = {"t": f, "s": v if isinstance(v, list) else [v]}
        if n < len(keys) - 1:
            item["i"], item["o"] = i, o
        k.append(item)
    return {"a": 1, "k": k}


def tr(p=(0, 0), a=(0, 0), s=(100, 100), o=100, r=0):
    def v(x):
        return x if isinstance(x, dict) else static(list(x) if not isinstance(x, (int, float)) else x)
    return {"o": v(o), "r": v(r), "p": v(list(p) + [0] if isinstance(p, tuple) else p),
            "a": v(list(a) + [0] if isinstance(a, tuple) else a), "s": v(list(s) + [100] if isinstance(s, tuple) else s)}


def group(name, ds, fill, gtr=None):
    it = []
    for d in ds:
        it += shapes_from_d(d)
    it.append({"ty": "fl", "c": static(rgba(fill)), "o": static(100), "r": 1, "nm": "Fill"})
    t = {"ty": "tr", "p": static([0, 0]), "a": static([0, 0]), "s": static([100, 100]), "r": static(0), "o": static(100), "sk": static(0), "sa": static(0)}
    if gtr:
        t.update(gtr)
    it.append(t)
    return {"ty": "gr", "nm": name, "it": it}


def layer(ind, name, shapes, op, ks=None, parent=None, masks=None):
    L = {"ddd": 0, "ind": ind, "ty": 4, "nm": name, "sr": 1, "ks": ks or tr(), "ao": 0, "shapes": shapes,
         "ip": 0, "op": op, "st": 0, "bm": 0}
    if parent:
        L["parent"] = parent
    if masks:
        L["hasMask"] = True
        L["masksProperties"] = masks
    return L


def null(ind, name, ks, op):
    return {"ddd": 0, "ind": ind, "ty": 3, "nm": name, "sr": 1, "ks": ks, "ao": 0, "ip": 0, "op": op, "st": 0, "bm": 0}


def circle_mask(cx, cy, r):
    k = 0.5523 * r
    return {"inv": False, "mode": "a", "nm": "window", "o": static(100), "x": static(0),
            "pt": static({"c": True, "v": [[cx, cy - r], [cx + r, cy], [cx, cy + r], [cx - r, cy]],
                          "i": [[-k, 0], [0, -k], [k, 0], [0, k]], "o": [[k, 0], [0, k], [-k, 0], [0, -k]]})}


def rect_shape(x0, y0, x1, y1):
    return {"c": True, "v": [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], "i": [[0, 0]] * 4, "o": [[0, 0]] * 4}


def doc(name, w, h, frames, layers):
    return {"v": "5.7.4", "fr": FPS, "ip": 0, "op": frames, "w": w, "h": h, "nm": name, "ddd": 0, "assets": [],
            "layers": layers, "meta": {"g": "Destination Nigeria brand kit — generated from supplied logo geometry"}}


# ------------------------------------------------------------------ E: symbol animation
def symbol(scheme="forest"):
    W = H = 1080
    op = 90
    cx, cy, r = 93.0, 7.5, 32.0
    S = W * .72 / (2 * r) * 100
    bg, cw = (C["forest"], COLOURWAYS["reversed"]) if scheme == "forest" else (C["ivory"], COLOURWAYS["fullcolour"])
    root = null(1, "roundel (scale)", tr(p=(540, 540), a=(cx, cy),
                                       s=anim([(0, [S * .82, S * .82, 100]), (21, [S * 1.02, S * 1.02, 100]), (27, [S, S, 100])], "out")), op)
    disc = layer(2, "disc", [group("disc", [f"M{cx},{cy - r} A{r},{r} 0 1 1 {cx - .001},{cy - r} Z"], bg)], op,
                 ks=tr(o=anim([(0, 0), (9, 100)])), parent=1)
    hz = layer(3, "horizon", [group("horizon", [PATH["horizon"]], cw["hz"]), group("horizon small", [PATH["horizon_small"]], cw["hzs"])], op,
               ks=tr(o=anim([(14, 0), (40, 100)], "inout")), parent=1, masks=[circle_mask(cx, cy, r)])
    mt = layer(4, "inselberg", [group("mountains", [PATH["monolith"], PATH["ridge"]], cw["mt"],
                                      {"p": anim([(25, [0, 26]), (52, [0, 0])], "out")})], op, parent=1, masks=[circle_mask(cx, cy, r)])
    sun = layer(5, "sun", [group("sun", [PATH["sun"]], cw["sun"],
                                 {"a": static([104.07, 6.62]), "p": static([104.07, 6.62]),
                                  "s": anim([(46, [0, 0]), (60, [112, 112]), (66, [100, 100])], "out")})], op, parent=1)
    return doc(f"DN symbol animation ({scheme})", W, H, op, [sun, mt, hz, disc, root])


# ------------------------------------------------------------------ B: minimal reveal
def minimal(cwname="fullcolour", w=1920, h=1080):
    op = 75
    cw = COLOURWAYS[cwname]
    LW = min(w * .52, h * 1.1)
    S = LW / LOGO_W * 100
    x0, y0 = (w - LW) / 2, (h - LOGO_H * LW / LOGO_W) / 2
    root = null(1, "logo", tr(p=(x0, y0), s=(S, S)), op)
    sun = layer(2, "sun", [group("sun", [PATH["sun"]], cw["sun"], {"a": static([104.07, 6.62]), "p": static([104.07, 6.62]),
                                                                   "s": anim([(0, [0, 0]), (12, [112, 112]), (16, [100, 100])], "out")})], op, parent=1)
    land = layer(3, "landscape", [group("horizon", [PATH["horizon"]], cw["hz"]), group("horizon small", [PATH["horizon_small"]], cw["hzs"]),
                                  group("mountains", [PATH["monolith"], PATH["ridge"]], cw["mt"])], op,
                 ks=tr(o=anim([(7, 0), (28, 100)]), p=anim([(7, [0, 3, 0]), (28, [0, 0, 0])])), parent=1)
    wipe = {"inv": False, "mode": "a", "nm": "wipe", "o": static(100), "x": static(0),
            "pt": anim([(16, rect_shape(-2, 15, -1, 62)), (44, rect_shape(-2, 15, 153, 62))], "inout")}
    word = layer(4, "Destination", [group("wordmark", [PATH[n] for n in WORD_DESTINATION], cw["word"])], op,
                 ks=tr(o=anim([(16, 0), (34, 100)])), parent=1, masks=[wipe])
    nig = layer(5, "NIGERIA", [group("NIGERIA", [PATH[n] for n in WORD_NIGERIA], cw["word"])], op,
                ks=tr(o=anim([(33, 0), (51, 100)]), p=anim([(33, [0, 2, 0]), (51, [0, 0, 0])])), parent=1)
    return doc(f"DN minimal logo reveal ({cwname})", w, h, op, [nig, word, land, sun, root])


if __name__ == "__main__":
    files = {
        "DN_lottie_E_symbol_forest_1080.json": symbol("forest"),
        "DN_lottie_E_symbol_ivory_1080.json": symbol("ivory"),
        "DN_lottie_B_minimal-reveal_fullcolour_1920x1080.json": minimal("fullcolour"),
        "DN_lottie_B_minimal-reveal_reversed_1920x1080.json": minimal("reversed"),
        "DN_lottie_B_minimal-reveal_fullcolour_800x400.json": minimal("fullcolour", 800, 400),
    }
    for n, d in files.items():
        (OUT / n).write_text(json.dumps(d, separators=(",", ":")))
        print(n, (OUT / n).stat().st_size // 1024, "KB")
