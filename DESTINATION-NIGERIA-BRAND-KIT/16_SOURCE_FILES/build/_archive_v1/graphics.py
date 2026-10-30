"""Supporting graphic language → 04_VECTOR_GRAPHICS_AND_ICONS and 06 placeholders.

Patterns, horizon ribbons, dividers, section markers, map & routes, campaign lockups,
badges, avatars, watermarks, photo masks and image placeholders.
"""
import json
import math
from brand import *
from gfx import *

G = "04_VECTOR_GRAPHICS_AND_ICONS"
jobs = []


def out(rel, w, h, body, title, desc="", png=None, bg=None, defs=""):
    write(rel, svg_doc(w, h, body, title, desc, px=(w, h), extra_defs=defs))
    if png:
        jobs.append(dict(src=str(KIT / rel), out=str(KIT / rel.replace(".svg", ".png").replace(f"{G}/", f"{G}/_previews/")),
                         w=w, h=h, scale=png, transparent=bg is None, bg=bg or "transparent"))


# ===================================================================== campaign line
def campaign_line(color, dot=C["gold"], size=10.0, x=0, y=0, track=0.22):
    """EXPERIENCE. INVEST. EXPLORE. — words outlined in Inter SemiBold; full stops are gold sun dots."""
    parts, cx = [], x
    cap = size * 0.727
    r = cap * 0.17
    for i, wd in enumerate(["EXPERIENCE", "INVEST", "EXPLORE"]):
        d, w = text_path(wd, "Inter-SemiBold", size, track, cx, y)
        parts.append(f'<path fill="{color}" d="{d}"/>')
        cx += w + size * 0.16
        parts.append(f'<circle cx="{cx + r:.2f}" cy="{y - r:.2f}" r="{r:.2f}" fill="{dot}"/>')
        cx += 2 * r + (size * 0.62 if i < 2 else 0)
    return "".join(parts), cx - x


def circle_text(text, cx, cy, radius, size, font="Inter-SemiBold", track=0.2, color="#000", center_deg=-90, bottom=False):
    """Outlined glyphs on an arc centred at center_deg. bottom=True reads upright along the lower arc."""
    glyphs = []
    for ch in text:
        d, w = text_path(ch, font, size, 0, 0, 0)
        glyphs.append((d, w, w + track * size))
    total = sum(g[2] for g in glyphs) - track * size
    cap = size * 0.727
    r = radius + (cap if bottom else 0)
    sign = -1 if bottom else 1
    ang = math.radians(center_deg) - sign * (total / 2) / r
    els = []
    for d, w, adv in glyphs:
        mid = ang + sign * (w / 2) / r
        x, y = cx + r * math.cos(mid), cy + r * math.sin(mid)
        rot = math.degrees(mid) + (90 if not bottom else -90)
        if d:
            els.append(f'<path fill="{color}" transform="translate({x:.2f},{y:.2f}) rotate({rot:.2f}) translate({-w / 2:.2f},0)" d="{d}"/>')
        ang += sign * adv / r
    return "".join(els), total


# ===================================================================== patterns (seamless)
def pattern_contour(fg, bg, op=0.35, tile=480, seed=7):
    X, Y, Z = periodic_field(240, 240, seed=seed)
    # wrap the field by one cell so contours meet at the tile edge
    Zw = np.pad(Z, ((0, 1), (0, 1)), mode="wrap")
    lv = np.linspace(Z.min() + .2, Z.max() - .2, 14)
    import contourpy
    gen = contourpy.contour_generator(np.linspace(0, tile, 241), np.linspace(0, tile, 241), Zw, line_type="Separate")
    ps = []
    for i, l in enumerate(lv):
        for seg in gen.lines(l):
            if len(seg) < 3:
                continue
            d = "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in seg)
            ps.append(f'<path d="{d}" stroke-width="{1.4 if i % 4 == 0 else 0.8}"/>')
    return (f'<rect width="{tile}" height="{tile}" fill="{bg}"/>' if bg else "") + \
        f'<g fill="none" stroke="{fg}" stroke-opacity="{op}" stroke-linecap="round" stroke-linejoin="round">{"".join(ps)}</g>'


def pattern_horizon(fg, bg, op=0.5, tile=480):
    rows = []
    for j in range(8):
        y0 = 30 + j * 60
        amp = 10 + 4 * ((j * 3) % 5)
        ph = j * 1.3
        xs = np.linspace(0, tile, 160)
        ys = y0 + amp * np.sin(2 * np.pi * xs / tile * (1 + j % 2) + ph)
        d = "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in zip(xs, ys))
        rows.append(f'<path d="{d}" stroke-width="{2.2 if j % 3 == 0 else 1}"/>')
    return (f'<rect width="{tile}" height="{tile}" fill="{bg}"/>' if bg else "") + \
        f'<g fill="none" stroke="{fg}" stroke-opacity="{op}" stroke-linecap="round">{"".join(rows)}</g>'


def pattern_sundots(fg, bg, accent=C["gold"], tile=480, op=0.28):
    els = []
    step = 40
    for i in range(tile // step):
        for j in range(tile // step):
            x, y = i * step + step / 2, j * step + step / 2
            if (i, j) in [(3, 2), (9, 8)]:
                els.append(f'<circle cx="{x}" cy="{y}" r="7" fill="{accent}"/>')
            else:
                els.append(f'<circle cx="{x}" cy="{y}" r="1.6" fill="{fg}" fill-opacity="{op}"/>')
    # horizon arcs every third row
    for j in range(0, tile // step, 3):
        y = j * step + step / 2 + 20
        els.append(f'<path d="M0,{y} Q{tile / 2},{y - 18} {tile},{y}" fill="none" stroke="{fg}" stroke-opacity="{op * .8}" stroke-width="1"/>')
    return (f'<rect width="{tile}" height="{tile}" fill="{bg}"/>' if bg else "") + "".join(els)


def pattern_confluence(fg, bg, fg2=None, tile=480, op=0.45):
    fg2 = fg2 or fg
    els = []
    xs = np.linspace(0, tile, 200)
    for k in range(6):
        y0 = k * tile / 6 + 30
        for fam, col, sgn in [(0, fg, 1), (1, fg2, -1)]:
            ys = y0 + 22 * np.sin(2 * np.pi * xs / tile * 2 + sgn * 1.2 + k) + sgn * 6 * np.sin(2 * np.pi * xs / tile * 4)
            d = "M" + " L".join(f"{x:.1f},{y % tile:.1f}" if False else f"{x:.1f},{y:.1f}" for x, y in zip(xs, ys))
            els.append(f'<path d="{d}" stroke="{col}" stroke-width="{1.2 if fam else 1.8}" stroke-opacity="{op}" fill="none"/>')
    return (f'<rect width="{tile}" height="{tile}" fill="{bg}"/>' if bg else "") + "".join(els)


PATTERNS = {
    "contour": pattern_contour, "horizon-lines": pattern_horizon, "sun-grid": pattern_sundots,
    "confluence": pattern_confluence,
}


def build_patterns():
    for name, fn in PATTERNS.items():
        for cw, fg, bg in [("on-ivory", C["forest"], C["ivory"]), ("on-forest", C["ivory"], C["forest"]),
                           ("transparent-forest", C["forest"], None)]:
            body = fn(fg, bg) if name != "confluence" else fn(fg, bg, C["confluence"] if cw == "on-ivory" else C["sage"])
            out(f"{G}/patterns/DN_pattern_{name}_{cw}_tile480.svg", 480, 480, body,
                f"Destination Nigeria pattern — {name} ({cw})",
                "Seamless 480 × 480 tile. Use as a CSS background-image, Illustrator pattern swatch or Figma fill.",
                png=1 if cw != "transparent-forest" else None)


# ===================================================================== horizon ribbons & landscape shapes
def horizon_set(color, color2):
    """A family of three swashes echoing the logo's horizon lines."""
    return (f'<path fill="{color}" d="{ribbon((0, 120), (260, 40), (520, 30), (900, 110), 16, .45)}"/>'
            f'<path fill="{color2}" d="{ribbon((520, 140), (700, 80), (880, 70), (1200, 128), 11, .5)}"/>'
            f'<path fill="{color2}" d="{ribbon((120, 156), (220, 140), (300, 136), (380, 132), 6, .6)}"/>')


def build_shapes():
    out(f"{G}/horizon-shapes/DN_horizon-ribbons_forest.svg", 1200, 180, horizon_set(C["forest"], C["ridge"]),
        "Horizon ribbons (forest)", "Tapered swashes derived from the logo's horizon lines.", png=1)
    out(f"{G}/horizon-shapes/DN_horizon-ribbons_ivory.svg", 1200, 180, horizon_set(C["ivory"], C["mist"]),
        "Horizon ribbons (ivory)", "For dark grounds.", png=1, bg=C["forest"])
    out(f"{G}/horizon-shapes/DN_horizon-ribbons_gold.svg", 1200, 180, horizon_set(C["gold"], C["savannah"]),
        "Horizon ribbons (gold)", "Celebratory accent for campaign use on Forest.", png=1, bg=C["forest"])
    # layered landscape band (abstract, original — not the logo mountain)
    W, H = 1920, 480
    lay = [(C["sage"], ridge(W, H, 260, 26, 3, 2, [(1320, 260, 120)])),
           (C["canopy"], ridge(W, H, 320, 22, 5, 3, [(420, 180, 70)])),
           (C["ridge"], ridge(W, H, 370, 18, 9, 2)),
           (C["forest"], ridge(W, H, 420, 12, 11, 4))]
    body = "".join(f'<path fill="{c}" d="{d}"/>' for c, d in lay)
    out(f"{G}/horizon-shapes/DN_landscape-band_layered_1920x480.svg", W, H,
        f'<circle cx="1500" cy="150" r="56" fill="{C["gold"]}"/>' + body,
        "Layered landscape band", "Abstract ridges with an inselberg dome; footer band for documents, web and stage.", png=1)
    body2 = "".join(f'<path fill="{c}" fill-opacity="{o}" d="{d}"/>' for (c0, d), (c, o) in
                    zip(lay, [(C["ivory"], .10), (C["ivory"], .16), (C["ivory"], .24), (C["ivory"], .34)]))
    out(f"{G}/horizon-shapes/DN_landscape-band_translucent-ivory_1920x480.svg", W, H,
        f'<circle cx="1500" cy="150" r="56" fill="{C["gold"]}"/>' + body2, "Layered landscape band, translucent",
        "Translucent ivory layers for use over Forest or photography.", png=1, bg=C["forest"])
    # contour lines decorative strip
    X, Y, Z = periodic_field(300, 80, seed=3, periodic=False)
    cl = contour_paths(Z, 1920, 512, np.linspace(-1.5, 1.5, 11))
    out(f"{G}/horizon-shapes/DN_contour-lines_strip_1920x512.svg", 1920, 512,
        f'<g fill="none" stroke="{C["forest"]}" stroke-linecap="round" stroke-opacity=".5">' +
        "".join(f'<path d="{d}" stroke-width="{1.6 if abs(l) < .05 else 1}"/>' for l, d in cl) + "</g>",
        "Topographic contour strip", "Decorative contour lines; recolour to Sage or Ivory as required.", png=1, bg=C["ivory"])
    # geometric elements
    geo = {
        "sun-disc": (200, 200, f'<circle cx="100" cy="100" r="100" fill="{C["gold"]}"/>'),
        "rising-sun": (200, 100, f'<path d="M0,100 A100,100 0 0 1 200,100 Z" fill="{C["gold"]}"/>'),
        "sun-rings": (240, 240, f'<circle cx="120" cy="120" r="34" fill="{C["gold"]}"/>' + "".join(
            f'<circle cx="120" cy="120" r="{r}" fill="none" stroke="{C["gold"]}" stroke-opacity="{o}" stroke-width="1.5"/>'
            for r, o in [(56, .7), (78, .45), (100, .25), (118, .12)])),
        "inselberg-dome": (300, 160, f'<path fill="{C["forest"]}" d="{ridge(300, 160, 158, 0, 1, 1, [(150, 240, 140)])}"/>'),
        "arch-frame": (300, 400, f'<path fill="none" stroke="{C["forest"]}" stroke-width="3" d="M10,390 V150 A140,140 0 0 1 290,150 V390 Z"/>'),
        "quarter-horizon": (300, 300, f'<path fill="{C["ridge"]}" d="M0,300 V120 C80,80 200,70 300,140 V300 Z"/>'),
    }
    for n, (w, h, b) in geo.items():
        out(f"{G}/geometric-elements/DN_{n}.svg", w, h, b, f"Geometric element — {n}", png=2)


# ===================================================================== photo masks
def build_masks():
    masks = {
        "horizon-arch_4x5": (800, 1000, "M0,1000 V260 C170,120 330,90 400,90 C470,90 630,120 800,260 V1000 Z"),
        "inselberg-window_4x5": (800, 1000, "M0,1000 V420 C120,400 180,140 330,110 C430,90 520,120 580,260 C640,400 700,430 800,430 V1000 Z"),
        "horizon-base_16x9": (1920, 1080, "M0,0 H1920 V880 C1500,1000 1180,1010 960,980 C640,940 300,980 0,1060 Z"),
        "sun-window_1x1": (1000, 1000, "M500,0 A500,500 0 1 1 499.9,0 Z"),
        "rounded-card_3x2": (1200, 800, "M32,0 H1168 A32,32 0 0 1 1200,32 V768 A32,32 0 0 1 1168,800 H32 A32,32 0 0 1 0,768 V32 A32,32 0 0 1 32,0 Z"),
    }
    for n, (w, h, d) in masks.items():
        out(f"{G}/photo-masks/DN_mask_{n}.svg", w, h,
            f'<clipPath id="dn-mask-{n}"><path d="{d}"/></clipPath><path d="{d}" fill="#000"/>',
            f"Photo mask — {n}", "Black shape = visible image area. Use as clipping mask (Illustrator/Figma) or CSS clip-path / mask-image.",
            png=None)


# ===================================================================== dividers & section markers
def build_dividers():
    W = 1200
    dv = {
        "horizon": f'<path fill="{C["forest"]}" d="{ribbon((0, 34), (300, 14), (700, 10), (1080, 30), 7, .45)}"/>'
                   f'<path fill="{C["ridge"]}" d="{ribbon((640, 42), (820, 26), (980, 24), (1200, 38), 5, .5)}"/>',
        "hairline-sun": f'<path d="M0,30 H570 M630,30 H1200" stroke="{C["forest"]}" stroke-width="1" stroke-opacity=".4"/><circle cx="600" cy="30" r="8" fill="{C["gold"]}"/>',
        "contour-band": "".join(f'<path d="M0,{20 + i * 7} C300,{8 + i * 7} 700,{34 + i * 7} 1200,{18 + i * 7}" fill="none" stroke="{C["forest"]}" stroke-opacity="{.6 - i * .15}" stroke-width="1.2"/>' for i in range(4)),
        "route": f'<path d="M14,30 C300,0 500,60 800,26 S1100,20 1186,30" fill="none" stroke="{C["confluence"]}" stroke-width="2" stroke-dasharray="2 9" stroke-linecap="round"/>'
                 f'<circle cx="14" cy="30" r="6" fill="{C["forest"]}"/><circle cx="1186" cy="30" r="9" fill="{C["gold"]}"/>',
    }
    for n, b in dv.items():
        out(f"{G}/dividers/DN_divider_{n}.svg", W, 60, b, f"Divider — {n}", png=1)
    # section markers 01–12 (outlined numerals)
    for i in range(1, 13):
        d, w = text_path(f"{i:02d}", "Inter-SemiBold", 34, 0.02, 60, 72, anchor="middle")
        out(f"{G}/section-markers/DN_section-marker_{i:02d}.svg", 120, 120,
            f'<circle cx="60" cy="60" r="58" fill="{C["gold"]}"/><path fill="{C["forest"]}" d="{d}"/>',
            f"Section marker {i:02d}", png=1 if i in (1, 2, 3) else None)
        d2, w2 = text_path(f"{i:02d}", "PlayfairDisplay-Regular", 120, 0, 0, 120)
        out(f"{G}/section-markers/DN_chapter-numeral_{i:02d}.svg", round(w2 + 20), 170,
            f'<path fill="{C["forest"]}" d="{d2}"/><path fill="{C["gold"]}" d="{ribbon((0, 152), (w2 * .3, 140), (w2 * .7, 138), (w2 + 10, 150), 6, .5)}"/>',
            f"Chapter numeral {i:02d}", png=None)


# ===================================================================== map & routes
def build_map():
    geo = load_geo()
    pj = Proj(width=1000, pad=30)
    W, H = pj.w, pj.h
    ng = [f for f in geo["features"] if f["properties"]["name"] == "Nigeria"][0]
    others = [f for f in geo["features"] if f["properties"]["name"] != "Nigeria"]
    ngd = country_path(ng, pj)
    neigh = "".join(f'<path d="{country_path(f, pj)}" fill="{C["haze"]}" stroke="{C["ivory"]}" stroke-width="1.5"/>' for f in others)
    clip = f'<clipPath id="mapclip"><rect width="{W:.0f}" height="{H:.0f}"/></clipPath>'
    base = f'<rect width="{W:.0f}" height="{H:.0f}" fill="{C["ivory"]}"/><g clip-path="url(#mapclip)">{neigh}</g>'
    cities = {k: pj(lon, lat) for k, (lat, lon) in CITIES.items()}

    def pins(names, col=C["forest"]):
        s = ""
        for n in names:
            x, y = cities[n]
            big = n == "Abuja"
            s += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{7 if big else 4.5}" fill="{C["gold"] if big else col}" stroke="{C["ivory"]}" stroke-width="1.5"/>'
            s += (f'<text x="{x + 9:.1f}" y="{y + 4:.1f}" font-family="Inter, Arial, sans-serif" font-size="{14 if big else 12}" '
                  f'font-weight="{600 if big else 500}" fill="{C["forest"]}">{n}</text>')
        return s

    def route(a, b, bend=.18):
        (x1, y1), (x2, y2) = cities[a], cities[b]
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        dx, dy = x2 - x1, y2 - y1
        cx, cy = mx - dy * bend, my + dx * bend
        return f'<path d="M{x1:.1f},{y1:.1f} Q{cx:.1f},{cy:.1f} {x2:.1f},{y2:.1f}" fill="none" stroke="{C["confluence"]}" stroke-width="2.2" stroke-dasharray="1 7" stroke-linecap="round"/>'

    main = list(CITIES)
    attrib = (f'<text x="{W - 12:.0f}" y="{H - 10:.0f}" text-anchor="end" font-family="Inter, Arial" font-size="9" fill="{C["stone"]}">'
              f'Boundaries: Natural Earth (public domain). Illustrative; not an authority on international boundaries.</text>')
    body = base + f'<path d="{ngd}" fill="{C["sage"]}" stroke="{C["forest"]}" stroke-width="1.6" stroke-linejoin="round"/>' + \
        "".join(route(a, b) for a, b in [("Lagos", "Abuja"), ("Abuja", "Kano"), ("Abuja", "Calabar"), ("Abuja", "Jos"), ("Lagos", "Abeokuta"), ("Port Harcourt", "Calabar")]) + \
        pins(main) + attrib
    out(f"{G}/maps/DN_map_nigeria_routes_light.svg", round(W), round(H), body, "Nigeria destination map — routes (light)",
        "Natural Earth 1:10m boundary. City positions approximate. Labels are live text for editing. Routes are illustrative.",
        png=2, bg=C["ivory"], defs=clip)
    dark = (f'<rect width="{W:.0f}" height="{H:.0f}" fill="{C["forest"]}"/>'
            f'<g clip-path="url(#mapclip)">' + "".join(f'<path d="{country_path(f, pj)}" fill="{C["ridge"]}" fill-opacity=".45"/>' for f in others) + "</g>"
            f'<path d="{ngd}" fill="{C["ridge"]}" stroke="{C["sage"]}" stroke-width="1.4"/>' +
            "".join(route(a, b).replace(C["confluence"], C["gold"]) for a, b in [("Lagos", "Abuja"), ("Abuja", "Kano"), ("Abuja", "Calabar")]) +
            pins(main, C["ivory"]).replace(f'fill="{C["forest"]}">', f'fill="{C["ivory"]}">') + attrib.replace(C["stone"], C["sage"]))
    out(f"{G}/maps/DN_map_nigeria_routes_dark.svg", round(W), round(H), dark, "Nigeria destination map — routes (dark)", png=2, defs=clip)
    # outline-only country shape (for icons, badges, infographics)
    pj2 = Proj(bbox=(2.66, 4.25, 14.7, 13.9), width=600, pad=6)
    out(f"{G}/maps/DN_map_nigeria_silhouette_forest.svg", round(pj2.w), round(pj2.h),
        f'<path d="{country_path(ng, pj2)}" fill="{C["forest"]}"/>', "Nigeria silhouette", "Natural Earth 1:10m.", png=1)
    out(f"{G}/maps/DN_map_nigeria_outline_contour.svg", round(pj2.w), round(pj2.h),
        "".join(f'<path d="{country_path(ng, Proj(bbox=(2.66 - i * .12, 4.25 - i * .12, 14.7 + i * .12, 13.9 + i * .12), width=600, pad=6))}" '
                f'fill="none" stroke="{C["forest"]}" stroke-opacity="{1 - i * .22:.2f}" stroke-width="1.2"/>' for i in range(4)),
        "Nigeria outline, contour echo", "Decorative outline with offset echoes. Not to scale for inner rings.", png=1, bg=C["ivory"])
    # route kit
    rk = (f'<path d="M20,40 C120,10 220,70 320,40" fill="none" stroke="{C["confluence"]}" stroke-width="2.2" stroke-dasharray="1 7" stroke-linecap="round"/>'
          f'<circle cx="20" cy="40" r="6" fill="{C["forest"]}"/><circle cx="320" cy="40" r="9" fill="{C["gold"]}"/>'
          f'<path d="M380,40 h260" stroke="{C["forest"]}" stroke-width="2.5" stroke-linecap="round"/><circle cx="380" cy="40" r="6" fill="#fff" stroke="{C["forest"]}" stroke-width="2.5"/>'
          f'<circle cx="640" cy="40" r="6" fill="{C["forest"]}"/>'
          f'<g transform="translate(690,16) scale(2)">'
          f'<path d="M12 21.25s-6.75-5.9-6.75-11.25a6.75 6.75 0 0 1 13.5 0c0 5.35-6.75 11.25-6.75 11.25z" fill="{C["forest"]}"/><circle cx="12" cy="10" r="2.6" fill="{C["gold"]}"/></g>')
    out(f"{G}/maps/DN_route-kit.svg", 760, 80, rk, "Route graphic kit", "Dashed travel route, solid connection, start/end markers and destination pin.", png=2)


# ===================================================================== lockups, badges, avatars, watermarks
def build_lockups():
    for cw, col in [("forest", C["forest"]), ("white", "#FFFFFF")]:
        body, w = campaign_line(col, size=20, y=20)
        out(f"{G}/campaign-lockups/DN_campaign-line_{cw}.svg", round(w + 2), 26, body,
            "EXPERIENCE. INVEST. EXPLORE. — campaign line", "Outlined Inter SemiBold, +0.22 em tracking, Sun Gold full stops.",
            png=4, bg=None if cw == "forest" else C["forest"])
        # stacked: logo above, line below, scaled to 92% of logo width
        lw = LOGO_W * 4
        lb, lw2 = campaign_line(col, size=20, y=0)
        k = lw * 0.92 / lw2
        H = LOGO_H * 4 + 46 + 20 * k
        logo = logo_inline("fullcolour" if cw == "forest" else "reversed", 0, 0, lw)
        rule = f'<path d="M{lw * .3:.1f},{LOGO_H * 4 + 22:.1f} H{lw * .7:.1f}" stroke="{col}" stroke-opacity=".35" stroke-width="1.2"/>'
        out(f"{G}/campaign-lockups/DN_lockup_logo-campaign_stacked_{cw}.svg", round(lw), round(H + 4),
            logo + rule + f'<g transform="translate({lw * .04:.1f},{LOGO_H * 4 + 46 + 20 * k * .727:.1f}) scale({k:.4f})">{lb}</g>',
            "Logo with campaign line — stacked",
            "Approved combined lockup: the campaign line sits outside the logo artwork, separated by a horizon rule.",
            png=2, bg=None if cw == "forest" else C["forest"])
        # horizontal: logo | rule | line (two lines of words stacked? keep one line)
        gap = 40
        lb2, lw3 = campaign_line(col, size=26, y=0)
        Hh = LOGO_H * 4
        out(f"{G}/campaign-lockups/DN_lockup_logo-campaign_horizontal_{cw}.svg", round(lw + gap * 2 + lw3), round(Hh),
            logo + f'<path d="M{lw + gap:.1f},{Hh * .3:.1f} V{Hh * .95:.1f}" stroke="{col}" stroke-opacity=".35" stroke-width="1.5"/>'
            + f'<g transform="translate({lw + gap * 2:.1f},{Hh * .72:.1f})">{lb2}</g>',
            "Logo with campaign line — horizontal", png=2, bg=None if cw == "forest" else C["forest"])


def build_badges():
    # campaign seal
    S = 400
    for tag, bg, fg, sch in [("ivory", C["ivory"], C["forest"], "forest"), ("forest", C["forest"], C["ivory"], "ivory")]:
        ring, _ = circle_text("EXPERIENCE · INVEST · EXPLORE", 200, 200, 160, 20, track=0.2, color=fg, center_deg=-90)
        ring2, _ = circle_text("DESTINATION NIGERIA", 200, 200, 160, 20, track=0.3, color=fg, center_deg=90, bottom=True)
        body = (f'<circle cx="200" cy="200" r="198" fill="{bg}"/><circle cx="200" cy="200" r="190" fill="none" stroke="{fg}" stroke-width="2"/>'
                + ring + ring2 + f'<circle cx="28" cy="200" r="4" fill="{C["gold"]}"/><circle cx="372" cy="200" r="4" fill="{C["gold"]}"/>'
                + f'<circle cx="200" cy="200" r="142" fill="none" stroke="{fg}" stroke-width="1" stroke-opacity=".4"/>'
                + roundel_inline(200 - 128, 200 - 128, 256, sch, uid=f"seal{tag}"))
        out(f"{G}/badges/DN_badge_campaign-seal_{tag}.svg", S, S, body, f"Campaign seal ({tag})",
            "Circular campaign seal for merchandise, stickers and digital moments. Not an official seal or certification mark.", png=1)
    # partner badge (approved partners only)
    d, w = text_path("IN PARTNERSHIP WITH", "Inter-SemiBold", 13, 0.22, 200, 46, anchor="middle")
    body = (f'<rect x="1" y="1" width="398" height="198" rx="18" fill="#fff" stroke="{C["forest"]}" stroke-opacity=".25" stroke-width="2"/>'
            f'<path fill="{C["stone"]}" d="{d}"/>' + logo_inline("fullcolour", 200 - 132, 66, 264))
    out(f"{G}/badges/DN_badge_partner_light.svg", 400, 200, body, "Partner badge",
        "For organisations with a written partnership agreement only. See guidelines §27 Governance.", png=2)
    # editable event badge (live text placeholders)
    body = (f'<rect width="600" height="300" rx="24" fill="{C["forest"]}"/>'
            + roundel_inline(40, 50, 200, "ivory", uid="evb")
            + f'<text x="270" y="118" font-family="Inter, Arial" font-weight="600" font-size="15" letter-spacing="3.3" fill="{C["gold"]}">DESTINATION NIGERIA</text>'
            f'<text x="270" y="166" font-family="\'Playfair Display\', Georgia, serif" font-weight="500" font-size="40" fill="{C["ivory"]}">[Event name]</text>'
            f'<text x="270" y="206" font-family="Inter, Arial" font-size="18" fill="{C["sage"]}">[Dates · City — to be confirmed]</text>')
    out(f"{G}/badges/DN_badge_event_editable.svg", 600, 300, body, "Event badge — editable",
        "Live-text template for programmes such as National Tourism Week. Replace bracketed text only once details are confirmed.", png=1)


def build_avatars():
    A = 1080
    for sch in ["forest", "ivory", "gold"]:
        out(f"{G}/social-avatars/DN_avatar_roundel_{sch}_1080.svg", A, A,
            f'<rect width="{A}" height="{A}" fill="{ {"forest": C["forest"], "ivory": C["ivory"], "gold": C["gold"]}[sch]}"/>'
            + roundel_inline(A * .08, A * .08, A * .84, sch, uid=f"av{sch}"),
            f"Social avatar — roundel ({sch})", "1080 × 1080. Platforms crop to a circle; the roundel sits inside the safe circle.", png=1)
    out(f"{G}/social-avatars/DN_avatar_logo_ivory_1080.svg", A, A,
        f'<rect width="{A}" height="{A}" fill="{C["ivory"]}"/>' + logo_inline("fullcolour", A * .14, A / 2 - LOGO_H * (A * .72 / LOGO_W) / 2, A * .72),
        "Social avatar — full logo on ivory", "For platforms that show a square avatar (LinkedIn pages, YouTube banner icon).", png=1)


def build_watermarks():
    out(f"{G}/watermarks/DN_watermark_logo_white-35pct.svg", 600, round(600 * LOGO_H / LOGO_W),
        f'<g opacity=".35">{logo_inline("white", 0, 0, 600)}</g>', "Watermark — logo white 35%", "For photography and video. Bottom-right, 1/6 of frame width.", png=1, bg=C["ridge"])
    out(f"{G}/watermarks/DN_watermark_roundel_white-35pct.svg", 300, 300,
        f'<g opacity=".35">{roundel_inline(0, 0, 300, "mono-white", uid="wm")}</g>', "Watermark — roundel 35%", png=1, bg=C["ridge"])
    # proof tile (for review copies / drafts)
    cells = "".join(f'<g opacity=".09">{logo_inline("green", x, y, 220)}</g>' for y in range(40, 1080, 200) for x in range(-60 + (y // 200 % 2) * 160, 1920, 330))
    d, w = text_path("DRAFT — FOR REVIEW ONLY", "Inter-SemiBold", 22, .22, 960, 1050, anchor="middle")
    out(f"{G}/watermarks/DN_watermark_proof-overlay_1920x1080.svg", 1920, 1080, cells + f'<path fill="{C["laterite"]}" fill-opacity=".7" d="{d}"/>',
        "Proof overlay", "Transparent overlay for draft artwork circulated for review.", png=None)


# ===================================================================== image placeholders (06)
def placeholder(w, h, mood="dawn", seed=1, label=True):
    skies = {"dawn": ("#F3D9A6", "#E8A432", "#F7EAD0"), "day": ("#CFE0DA", "#F5F0E6", "#E7DFCF"),
             "dusk": ("#1B3A30", "#2C5040", "#C98A3A")}
    top, mid, low = skies[mood]
    sun_y = h * (.34 if mood != "dusk" else .5)
    lay_cols = {"dawn": ["#D7B98A", "#9C9A72", "#4E7A62", "#2C5040", "#103428"],
                "day": ["#B8C9B6", "#8FA88E", "#4E7A62", "#2C5040", "#103428"],
                "dusk": ["#3E5B49", "#2C5040", "#1F4234", "#163A2D", "#0C2A1F"]}[mood]
    rng = np.random.default_rng(seed)
    gid = f"sky{mood}{seed}"
    defs = (f'<linearGradient id="{gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{top}"/>'
            f'<stop offset=".55" stop-color="{mid}"/><stop offset="1" stop-color="{low}"/></linearGradient>'
            f'<radialGradient id="{gid}g" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFE7B0" stop-opacity=".9"/><stop offset="1" stop-color="#FFE7B0" stop-opacity="0"/></radialGradient>')
    sx = w * rng.uniform(.58, .74)
    body = (f'<rect width="{w}" height="{h}" fill="url(#{gid})"/>'
            f'<circle cx="{sx:.0f}" cy="{sun_y:.0f}" r="{min(w, h) * .32:.0f}" fill="url(#{gid}g)"/>'
            f'<circle cx="{sx:.0f}" cy="{sun_y:.0f}" r="{min(w, h) * .06:.0f}" fill="#F6C86A"/>')
    for i, col in enumerate(lay_cols):
        base = h * (.55 + i * .1)
        rocks = [(w * rng.uniform(.15, .45), w * rng.uniform(.18, .3), h * rng.uniform(.18, .28))] if i == 1 else \
                ([(w * rng.uniform(.6, .9), w * .14, h * .1)] if i == 2 else [])
        body += f'<path fill="{col}" d="{ridge(w, h, base, h * .02 * (1 + i * .3), seed * 10 + i, 1 + i * .5, rocks)}"/>'
    if label:
        d, tw = text_path("IMAGE PLACEHOLDER — REPLACE WITH LICENSED PHOTOGRAPHY", "Inter-SemiBold", max(10, w / 110), .18, w / 2, h - h * .04, anchor="middle")
        body += f'<path fill="#FFFFFF" fill-opacity=".8" d="{d}"/>'
    return body, defs


def build_placeholders():
    P = "06_PHOTOGRAPHY_AND_MEDIA/placeholders"
    for mood, seed in [("dawn", 2), ("day", 5), ("dusk", 8)]:
        for (w, h, tag) in [(1920, 1280, "3x2"), (1080, 1350, "4x5"), (1080, 1920, "9x16")]:
            b, d = placeholder(w, h, mood, seed)
            rel = f"{P}/DN_placeholder_landscape-{mood}_{tag}.svg"
            write(rel, svg_doc(w, h, b, f"Image placeholder ({mood})", "Illustrative stand-in. Not a photograph of a real place.", px=(w, h), extra_defs=d))
            jobs.append(dict(src=str(KIT / rel), out=str(KIT / rel.replace(".svg", ".jpg")), w=w, h=h, quality=88))


if __name__ == "__main__":
    build_patterns()
    build_shapes()
    build_masks()
    build_dividers()
    build_map()
    build_lockups()
    build_badges()
    build_avatars()
    build_watermarks()
    build_placeholders()
    json.dump(jobs, open(KIT / "16_SOURCE_FILES/build/_jobs/_jobs_graphics.json", "w"), indent=1)
    print(len(jobs), "render jobs")
