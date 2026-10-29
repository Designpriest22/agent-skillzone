"""Background & texture library → 05_BACKGROUNDS_AND_TEXTURES.

Every background is a parametric SVG (vector source) composed from the brand's horizon,
sun, inselberg and contour devices, exported to each required format.
"""
import json
from brand import *
from gfx import *
from graphics import placeholder

B = "05_BACKGROUNDS_AND_TEXTURES"
FORMATS = {  # tag: (w, h, raster?, pdf size)
    "16x9_1920x1080": (1920, 1080, "jpg", ("508mm", "285.75mm")),
    "4x5_1080x1350": (1080, 1350, "jpg", None),
    "9x16_1080x1920": (1080, 1920, "jpg", None),
    "A4-portrait": (2100, 2970, "a4", ("210mm", "297mm")),
    "A4-landscape": (2970, 2100, "a4", ("297mm", "210mm")),
}
HIRES = {"05_golden-horizon", "09_dark-cinematic", "12_event-stage", "10_investment-premium"}
jobs = []
uid = [0]


def gid(p):
    uid[0] += 1
    return f"{p}{uid[0]}"


def grain(op=0.06):
    g = gid("grain")
    return (f'<filter id="{g}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/>'
            f'<feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 {op} 0"/></filter>', g)


def contour_layer(w, h, color, op, seed=3, n=16, region=None, width=1.0):
    X, Y, Z = periodic_field(220, int(220 * h / w) or 1, seed=seed, periodic=False)
    if region == "right":
        Z = Z * (0.4 + X)          # denser toward the right
    lines = contour_paths(Z, w, h, np.linspace(Z.min() + .1, Z.max() - .1, n))
    return (f'<g fill="none" stroke="{color}" stroke-opacity="{op}" stroke-linecap="round" stroke-linejoin="round" stroke-width="{width * max(w, h) / 1920:.2f}">'
            + "".join(f'<path d="{d}"/>' for _, d in lines) + "</g>")


def ribbons(w, h, y, color, color2, scale=1.0, op=1.0):
    s = scale
    return (f'<g fill-opacity="{op}"><path fill="{color}" d="{ribbon((-.05 * w, y + 60 * s), (.25 * w, y - 40 * s), (.55 * w, y - 50 * s), (1.05 * w, y + 30 * s), 18 * s, .45)}"/>'
            f'<path fill="{color2}" d="{ribbon((.45 * w, y + 70 * s), (.65 * w, y + 10 * s), (.85 * w, y), (1.05 * w, y + 50 * s), 11 * s, .5)}"/>'
            f'<path fill="{color2}" d="{ribbon((.08 * w, y + 92 * s), (.16 * w, y + 76 * s), (.24 * w, y + 72 * s), (.32 * w, y + 70 * s), 7 * s, .6)}"/></g>')


def landscape_layers(w, h, base, cols, seed=1, rock_side=.7, alphas=None):
    out = ""
    rng = np.random.default_rng(seed)
    for i, col in enumerate(cols):
        rocks = [(w * rock_side, w * .16, h * .16)] if i == 0 else ([(w * (1 - rock_side) * .8, w * .1, h * .07)] if i == 1 else [])
        a = f' fill-opacity="{alphas[i]}"' if alphas else ""
        out += f'<path fill="{col}"{a} d="{ridge(w, h, base + i * h * .07, h * .016 * (1 + i * .25), seed * 7 + i, 1 + i * .5, rocks)}"/>'
    return out


def lin(id_, stops, x2=0, y2=1):
    st = "".join(f'<stop offset="{o}" stop-color="{c}"{f" stop-opacity={chr(34)}{a}{chr(34)}" if a is not None else ""}/>' for o, c, a in stops)
    return f'<linearGradient id="{id_}" x1="0" y1="0" x2="{x2}" y2="{y2}">{st}</linearGradient>'


def rad(id_, cx, cy, r, stops):
    st = "".join(f'<stop offset="{o}" stop-color="{c}" stop-opacity="{a}"/>' for o, c, a in stops)
    return f'<radialGradient id="{id_}" cx="{cx}" cy="{cy}" r="{r}" gradientUnits="objectBoundingBox">{st}</radialGradient>'


# ------------------------------------------------------------------ the library
def b01(w, h):  # clean ivory corporate
    m = min(w, h)
    return (f'<rect width="{w}" height="{h}" fill="{C["ivory"]}"/>'
            + f'<g transform="translate({w * .55},{h * .62})">{contour_layer(w * .45, h * .38, C["forest"], .06, 4, 10)}</g>'
            + f'<path d="M{w * .06},{h - m * .07} H{w * .94}" stroke="{C["forest"]}" stroke-opacity=".25" stroke-width="{m / 900:.2f}"/>'
            + f'<circle cx="{w * .94}" cy="{h - m * .07}" r="{m * .008}" fill="{C["gold"]}"/>'), ""


def b02(w, h):  # deep forest institutional
    g = gid("v")
    return (f'<rect width="{w}" height="{h}" fill="{C["forest"]}"/><rect width="{w}" height="{h}" fill="url(#{g})"/>'
            + contour_layer(w, h, C["sage"], .1, 9, 18, "right")), rad(g, .85, .15, .9, [(0, C["ridge"], .55), (1, C["forest"], 0)])


def b03(w, h):  # white minimal
    m = min(w, h)
    return (f'<rect width="{w}" height="{h}" fill="#FFFFFF"/>'
            + f'<path fill="{C["sage"]}" fill-opacity=".55" d="{ribbon((w * .35, h * .93), (w * .6, h * .86), (w * .8, h * .85), (w * 1.02, h * .9), m * .012, .5)}"/>'
            + f'<circle cx="{w * .9}" cy="{h * .8}" r="{m * .012}" fill="{C["gold"]}"/>'), ""


def b04(w, h):  # green-to-ivory editorial gradient
    g = gid("g")
    m = min(w, h)
    return (f'<rect width="{w}" height="{h}" fill="url(#{g})"/>'
            + ribbons(w, h, h * .58, C["ivory"], C["ivory"], m / 1080, .22)), \
        lin(g, [(0, C["forest"], None), (.38, C["ridge"], None), (.72, "#C9CDB8", None), (1, C["ivory"], None)])


def b05(w, h):  # golden horizon
    g, gl = gid("sky"), gid("glow")
    m = min(w, h)
    sy = h * .64
    return (f'<rect width="{w}" height="{h}" fill="url(#{g})"/>'
            f'<ellipse cx="{w * .5}" cy="{sy}" rx="{w * .7}" ry="{h * .35}" fill="url(#{gl})"/>'
            f'<circle cx="{w * .5}" cy="{sy + m * .02}" r="{m * .09}" fill="{C["gold"]}"/>'
            + landscape_layers(w, h, sy + m * .03, ["#3E5B49", C["ridge"], "#173D30", C["forest"]], 4, .22)), \
        lin(g, [(0, C["charcoal"], None), (.45, C["forest"], None), (.66, "#8A6A2E", None), (.7, C["gold"], None)]) + \
        rad(gl, .5, .5, .5, [(0, C["gold"], .55), (1, C["gold"], 0)])


def b06(w, h):  # abstract mountain landscape
    m = min(w, h)
    return (f'<rect width="{w}" height="{h}" fill="{C["ivory"]}"/>'
            f'<circle cx="{w * .76}" cy="{h * .3}" r="{m * .07}" fill="{C["gold"]}"/>'
            + landscape_layers(w, h, h * .62, [C["sage"], C["canopy"], C["ridge"], C["forest"]], 2, .66)), ""


def b07(w, h):  # topographic contour
    return (f'<rect width="{w}" height="{h}" fill="{C["ivory"]}"/>' + contour_layer(w, h, C["forest"], .22, 21, 26, "right", 1.1)), ""


def b08(w, h):  # subtle geometric
    m = min(w, h)
    step = m / 18
    dots = "".join(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{step * .045:.2f}" fill="{C["forest"]}" fill-opacity=".22"/>'
                   for x in np.arange(step / 2, w, step) for y in np.arange(step / 2, h, step))
    arcs = "".join(f'<path d="M{-w * .1},{h * (.2 + .15 * i)} Q{w * .5},{h * (.2 + .15 * i) - m * .08} {w * 1.1},{h * (.2 + .15 * i)}" fill="none" stroke="{C["forest"]}" stroke-opacity=".12" stroke-width="{m / 700:.2f}"/>' for i in range(6))
    return (f'<rect width="{w}" height="{h}" fill="{C["ivory"]}"/>' + dots + arcs
            + f'<circle cx="{w * .82}" cy="{h * .2}" r="{step * .38:.1f}" fill="{C["gold"]}"/>'), ""


def b09(w, h):  # dark cinematic
    g = gid("c")
    gf, gn = grain(.07)
    m = min(w, h)
    return (f'<rect width="{w}" height="{h}" fill="{C["charcoal"]}"/><rect width="{w}" height="{h}" fill="url(#{g})"/>'
            + f'<path d="{ribbon((-.05 * w, h * .7), (w * .3, h * .66), (w * .7, h * .66), (w * 1.05, h * .7), m * .004, .5, power=.6)}" fill="{C["gold"]}" fill-opacity=".55"/>'
            + landscape_layers(w, h, h * .72, ["#162a22", "#101d18"], 6, .7)
            + f'<rect width="{w}" height="{h}" filter="url(#{gn})"/>'), \
        rad(g, .5, .62, .75, [(0, C["ridge"], .7), (.6, C["forest"], .35), (1, C["charcoal"], 0)]) + gf


def b10(w, h):  # premium investment presentation
    m = min(w, h)
    grid = "".join(f'<path d="M{x:.1f},0 V{h}" stroke="{C["ivory"]}" stroke-opacity=".045" stroke-width="{max(1, m / 1080):.2f}"/>' for x in np.linspace(w * .06, w * .94, 13))
    cx, cy = w * .86, h * 1.02
    arcs = "".join(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{m * r:.1f}" fill="none" stroke="{C["gold"]}" stroke-opacity="{o}" stroke-width="{m / 900:.2f}"/>'
                   for r, o in [(.22, .55), (.34, .32), (.48, .2), (.64, .12), (.82, .07)])
    g = gid("iv")
    return (f'<rect width="{w}" height="{h}" fill="{C["forest"]}"/><rect width="{w}" height="{h}" fill="url(#{g})"/>' + grid + arcs
            + f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{m * .12:.1f}" fill="{C["gold"]}"/>'
            + f'<path d="M{w * .06},{h * .12} H{w * .2}" stroke="{C["gold"]}" stroke-width="{m / 360:.2f}"/>'), \
        rad(g, .86, 1, .8, [(0, C["ridge"], .8), (1, C["forest"], 0)])


def b11(w, h):  # tourism photography overlay
    body, defs = placeholder(w, h, "dawn", 3, label=True)
    g = gid("ov")
    return (body + f'<rect width="{w}" height="{h}" fill="url(#{g})"/>'), defs + \
        lin(g, [(0, C["forest"], 0), (.45, C["forest"], .05), (1, C["forest"], .82)])


def b11_overlay_only(w, h):
    g, g2 = gid("ov"), gid("ovl")
    return (f'<rect width="{w}" height="{h}" fill="url(#{g})"/><rect width="{w}" height="{h}" fill="url(#{g2})"/>'), \
        lin(g, [(0, C["forest"], 0), (.5, C["forest"], .05), (1, C["forest"], .82)]) + lin(g2, [(0, C["forest"], .55), (.55, C["forest"], 0)], 1, 0)


def b12(w, h):  # event & stage screen
    m = min(w, h)
    g = gid("st")
    rings = "".join(f'<circle cx="{w * .5}" cy="{h * .44}" r="{m * r}" fill="none" stroke="{C["gold"]}" stroke-opacity="{o}" stroke-width="{m / 600:.2f}"/>'
                    for r, o in [(.16, .5), (.24, .3), (.33, .18), (.44, .1)])
    return (f'<rect width="{w}" height="{h}" fill="{C["forest"]}"/><rect width="{w}" height="{h}" fill="url(#{g})"/>' + rings
            + ribbons(w, h, h * .8, C["gold"], C["ivory"], m / 900, .9)), \
        rad(g, .5, .44, .6, [(0, C["ridge"], .9), (1, C["forest"], 0)])


def b13(w, h):  # confluence campaign (social)
    m = min(w, h)
    xs = np.linspace(-w * .05, w * 1.05, 180)
    lines = ""
    for k in range(9):
        for sgn, col in [(1, C["sage"]), (-1, C["gold"])]:
            ys = h * (.3 + k * .06) + m * .05 * np.sin(xs / w * 2 * np.pi * 1.2 + sgn * .9 + k * .4)
            lines += f'<path d="M' + " L".join(f"{x:.1f},{y:.1f}" for x, y in zip(xs, ys)) + f'" fill="none" stroke="{col}" stroke-opacity="{.22 if sgn > 0 else .16}" stroke-width="{m / 500:.2f}"/>'
    return f'<rect width="{w}" height="{h}" fill="{C["forest"]}"/>' + lines, ""


def b14(w, h):  # savannah warm editorial
    m = min(w, h)
    return (f'<rect width="{w}" height="{h}" fill="{C["haze"]}"/>'
            + f'<path fill="{C["savannah"]}" d="{ridge(w, h, h * .7, h * .02, 12, 2, [(w * .2, w * .22, h * .14)])}"/>'
            + f'<circle cx="{w * .8}" cy="{h * .24}" r="{m * .05}" fill="{C["laterite"]}" fill-opacity=".9"/>'
            + contour_layer(w, h * .3, C["forest"], .08, 30, 8).replace("<g ", f'<g transform="translate(0,{h * .7})" ', 1)), ""


LIB = [("01_ivory-corporate", b01, "Clean ivory corporate"), ("02_forest-institutional", b02, "Deep forest institutional"),
       ("03_white-minimal", b03, "White minimalist"), ("04_green-ivory-editorial-gradient", b04, "Green-to-ivory editorial gradient"),
       ("05_golden-horizon", b05, "Golden horizon"), ("06_abstract-mountain-landscape", b06, "Abstract mountain landscape"),
       ("07_topographic-contour", b07, "Topographic contour"), ("08_subtle-geometric", b08, "Subtle geometric pattern"),
       ("09_dark-cinematic", b09, "Dark cinematic campaign"), ("10_investment-premium", b10, "Premium investment presentation"),
       ("11_tourism-photo-overlay", b11, "Tourism photography overlay (with placeholder image)"),
       ("12_event-stage", b12, "Event and stage-screen"), ("13_confluence-campaign", b13, "Confluence lines — social campaign"),
       ("14_savannah-editorial", b14, "Savannah warm editorial")]


def svg_bg(w, h, fn, title):
    body, defs = fn(w, h)
    s = svg_doc(w, h, body, f"Destination Nigeria background — {title}", "Vector source. Leave the clear zones free for text.",
                px=(w, h), extra_defs=defs)
    return s.replace("<svg ", '<svg preserveAspectRatio="xMidYMid slice" ', 1)


if __name__ == "__main__":
    index = []
    for key, fn, title in LIB:
        for tag, (w, h, kind, pdf) in FORMATS.items():
            rel = f"{B}/{key}/SVG/DN_bg_{key}_{tag}.svg"
            write(rel, svg_bg(w, h, fn, title))
            src = str(KIT / rel)
            if kind == "jpg":
                jobs.append(dict(src=src, out=str(KIT / f"{B}/{key}/DN_bg_{key}_{tag}.jpg"), w=w, h=h, quality=90))
            if kind == "a4":  # 150 dpi JPG for Office backgrounds
                pw, ph = (1240, 1754) if w < h else (1754, 1240)
                jobs.append(dict(src=src, out=str(KIT / f"{B}/{key}/DN_bg_{key}_{tag}_150dpi.jpg"), w=pw, h=ph, quality=88))
            if pdf:
                vw, vh = (1920, 1080) if tag.startswith("16x9") else ((794, 1122) if w < h else (1122, 794))
                jobs.append(dict(src=src, out=str(KIT / f"{B}/{key}/DN_bg_{key}_{tag}.pdf"), w=vw, h=vh, format="pdf",
                                 pdfW=pdf[0], pdfH=pdf[1]))
        if key in HIRES:
            jobs.append(dict(src=str(KIT / f"{B}/{key}/SVG/DN_bg_{key}_16x9_1920x1080.svg"),
                             out=str(KIT / f"{B}/{key}/DN_bg_{key}_16x9_3840x2160.jpg"), w=1920, h=1080, scale=2, quality=90))
        index.append(dict(key=key, title=title))
    # transparent overlay PNGs
    for tag, (w, h) in {"16x9_1920x1080": (1920, 1080), "4x5_1080x1350": (1080, 1350), "9x16_1080x1920": (1080, 1920)}.items():
        rel = f"{B}/11_tourism-photo-overlay/SVG/DN_overlay_forest-gradient_{tag}.svg"
        write(rel, svg_bg(w, h, b11_overlay_only, "Forest gradient overlay (transparent)"))
        jobs.append(dict(src=str(KIT / rel), out=str(KIT / f"{B}/11_tourism-photo-overlay/DN_overlay_forest-gradient_{tag}.png"), w=w, h=h, transparent=True))
    # paper grain texture tile
    gf, gn = grain(.09)
    write(f"{B}/textures/DN_texture_paper-grain_tile1024.svg",
          svg_doc(1024, 1024, f'<rect width="1024" height="1024" filter="url(#{gn})"/>', "Paper grain texture", "Transparent grain tile.", px=(1024, 1024), extra_defs=gf))
    jobs.append(dict(src=str(KIT / f"{B}/textures/DN_texture_paper-grain_tile1024.svg"), out=str(KIT / f"{B}/textures/DN_texture_paper-grain_tile1024.png"), w=1024, h=1024, transparent=True))
    json.dump(jobs, open(KIT / "16_SOURCE_FILES/build/_jobs/_jobs_backgrounds.json", "w"), indent=1)
    json.dump(index, open(KIT / f"{B}/DN_backgrounds_index.json", "w"), indent=1)
    print(len(jobs), "jobs")
