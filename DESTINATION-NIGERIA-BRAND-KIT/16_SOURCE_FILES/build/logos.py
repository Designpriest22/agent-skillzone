"""Build the logo family (02_LOGO_MASTER_FILES) from the supplied master geometry.

No glyph or landscape path is redrawn: every variant re-uses the supplied path data,
only re-coloured, re-positioned or clipped. Run: python3 logos.py && node render.mjs ../../17_EXPORTS/_jobs_logos.json
"""
import json
from brand import *

L = "02_LOGO_MASTER_FILES"
OWNER = "Destination Nigeria"
jobs = []
files = []  # (relpath, w, h, kind)

WM_X0, WM_Y0, WM_X1, WM_Y1 = WORDMARK_BOX
WM_W, WM_H = WM_X1 - WM_X0, WM_Y1 - WM_Y0


def wordmark(cw, x, y, s=1.0):
    return (f'<g transform="translate({x:.3f},{y:.3f}) scale({s}) translate(0,{-WM_Y0})">'
            + logo_group(WORD_DESTINATION + WORD_NIGERIA, cw) + "</g>")


def primary(cw, small=False):
    parts = ALL_PARTS if not small else [p for p in ALL_PARTS if p != "horizon_small"]
    return logo_group(parts, cw, stroke_names=WORD_NIGERIA if small else (), stroke_w=0.35)


ROUNDEL_FOR = {"fullcolour": "forest", "reversed": "ivory", "green": "mono-green", "white": "mono-white",
               "black": "mono-black"}


def horizontal(cw_name):
    d = WM_H
    gap = 0.62 * X_HEIGHT
    body = roundel_inline(0, 0, d, ROUNDEL_FOR[cw_name], uid=f"h-{cw_name}") + wordmark(COLOURWAYS[cw_name], d + gap, 0)
    return d + gap + WM_W, WM_H, body


def stacked(cw_name):
    d = 52.0
    gap = 0.55 * X_HEIGHT
    body = roundel_inline((WM_W - d) / 2, 0, d, ROUNDEL_FOR[cw_name], uid=f"s-{cw_name}") + wordmark(COLOURWAYS[cw_name], 0, d + gap)
    return WM_W, d + gap + WM_H, body


def landscape(cw):
    x0, y0, x1, y1 = LANDSCAPE_BOX
    body = (f'<g transform="translate({-x0},{-y0})">'
            + logo_group(LANDSCAPE_DARK + LANDSCAPE_LIGHT + SUN, cw) + "</g>")
    return x1 - x0, y1 - y0, body


def emit(rel, w, h, body, title, desc, png_widths=(1000, 2000), bg_preview="#ffffff"):
    px = (round(w * 4), round(h * 4))
    write(rel, svg_doc(w, h, body, title, desc, px=px))
    stem = rel.rsplit("/", 1)[1][:-4]
    sub = rel.split("/")[1]
    files.append((rel, w, h))
    pdf = f"{L}/PDF/{stem}.pdf"
    jobs.append(dict(src=str(KIT / rel), out=str(KIT / pdf), w=w * 4, h=h * 4, format="pdf"))
    for pw in png_widths:
        jobs.append(dict(src=str(KIT / rel), out=str(KIT / f"{L}/PNG/{stem}_{pw}px.png"),
                         w=pw, h=round(pw * h / w), transparent=True))


DESC = ("Official Destination Nigeria logo. Geometry reproduced from the supplied master artwork "
        "without redrawing. Do not alter, stretch or recolour outside the approved colourways.")

# 1 Primary full colour (master)
emit(f"{L}/SVG/DN_logo_primary_fullcolour.svg", LOGO_W, LOGO_H, primary(COLOURWAYS["fullcolour"]),
     "Destination Nigeria — primary logo, full colour", DESC, png_widths=(500, 1000, 2000, 4000))
# 10 Small-format digital
emit(f"{L}/SVG/DN_logo_primary_fullcolour_small-format.svg", LOGO_W, LOGO_H, primary(COLOURWAYS["fullcolour"], small=True),
     "Destination Nigeria — small-format logo, full colour",
     "Small-format version for 100–160 px / 25–35 mm widths: the hairline secondary horizon is omitted and NIGERIA "
     "carries a 0.35-unit optical stroke so it survives screen rendering.", png_widths=(120, 160, 240))
# 2 Horizontal, 3 Stacked
w, h, b = horizontal("fullcolour")
emit(f"{L}/SVG/DN_logo_horizontal_fullcolour.svg", w, h, b, "Destination Nigeria — horizontal lockup, full colour",
     "Secondary lockup: Horizon Roundel + wordmark on one line, for headers, footers and narrow bands.")
w, h, b = stacked("fullcolour")
emit(f"{L}/SVG/DN_logo_stacked_fullcolour.svg", w, h, b, "Destination Nigeria — stacked lockup, full colour",
     "Secondary lockup: Horizon Roundel above the wordmark, for square and portrait formats.")
# 4 Compact symbol (roundel) and 5 symbol-only (landscape)
R = 41.0
for sch in ["forest", "ivory", "gold"]:
    emit(f"{L}/SVG/DN_symbol_roundel_{sch}.svg", R, R, roundel_inline(0, 0, R, sch, uid=f"rd-{sch}"),
         f"Destination Nigeria — Horizon Roundel compact symbol ({sch})",
         "Compact symbol: the logo's inselberg, sun and horizon seen through a circular window. For avatars, favicons, app icons.",
         png_widths=(64, 256, 512, 1024))
w, h, b = landscape(COLOURWAYS["fullcolour"])
emit(f"{L}/SVG/DN_symbol_landscape_fullcolour.svg", w, h, b, "Destination Nigeria — landscape symbol, full colour",
     "Symbol-only: inselberg, sun and horizon lines exactly as positioned in the master logo.")

# Reversed
for cwn, tag in [("reversed", "reversed"), ("white", "white")]:
    emit(f"{L}/REVERSED/DN_logo_primary_{tag}.svg", LOGO_W, LOGO_H, primary(COLOURWAYS[cwn]),
         f"Destination Nigeria — primary logo, {tag}", DESC + " For dark and photographic backgrounds.",
         png_widths=(1000, 2000, 4000))
    w, h, b = horizontal(cwn)
    emit(f"{L}/REVERSED/DN_logo_horizontal_{tag}.svg", w, h, b, f"Destination Nigeria — horizontal lockup, {tag}", DESC)
    w, h, b = stacked(cwn)
    emit(f"{L}/REVERSED/DN_logo_stacked_{tag}.svg", w, h, b, f"Destination Nigeria — stacked lockup, {tag}", DESC)
    w, h, b = landscape(COLOURWAYS[cwn])
    emit(f"{L}/REVERSED/DN_symbol_landscape_{tag}.svg", w, h, b, f"Destination Nigeria — landscape symbol, {tag}", DESC)
emit(f"{L}/REVERSED/DN_logo_primary_reversed_small-format.svg", LOGO_W, LOGO_H, primary(COLOURWAYS["reversed"], small=True),
     "Destination Nigeria — small-format logo, reversed", DESC, png_widths=(120, 160, 240))

# Monochrome
for cwn in ["green", "black"]:
    emit(f"{L}/MONOCHROME/DN_logo_primary_{cwn}-1c.svg", LOGO_W, LOGO_H, primary(COLOURWAYS[cwn]),
         f"Destination Nigeria — primary logo, one colour {cwn}", DESC)
    w, h, b = horizontal(cwn)
    emit(f"{L}/MONOCHROME/DN_logo_horizontal_{cwn}-1c.svg", w, h, b, f"Destination Nigeria — horizontal lockup, one colour {cwn}", DESC)
    w, h, b = stacked(cwn)
    emit(f"{L}/MONOCHROME/DN_logo_stacked_{cwn}-1c.svg", w, h, b, f"Destination Nigeria — stacked lockup, one colour {cwn}", DESC)
    emit(f"{L}/MONOCHROME/DN_symbol_roundel_{cwn}-1c.svg", R, R,
         roundel_inline(0, 0, R, "mono-green" if cwn == "green" else "mono-black", uid=f"rm-{cwn}"),
         f"Destination Nigeria — Horizon Roundel, one colour {cwn}", DESC, png_widths=(256, 1024))
# 9 Production: one compound path, 100K — for vinyl, laser, embroidery digitising, foil/emboss dies
compound = " ".join(PATH[n] for n in ALL_PARTS)
emit(f"{L}/MONOCHROME/DN_logo_primary_production-1c-compound.svg", LOGO_W, LOGO_H,
     f'<path id="DN-logo-compound" fill="#000000" d="{compound}"/>',
     "Destination Nigeria — production one-colour compound path",
     "Single compound path, 100% K. For die-cutting, vinyl plotting, laser engraving, embossing, foil and embroidery "
     "digitising. Minimum reproduction width 40 mm (hairline tapers).", png_widths=(2000,))

json.dump(jobs, open(KIT / "16_SOURCE_FILES/build/_jobs/_jobs_logos.json", "w"), indent=1)
json.dump(files, open(KIT / "16_SOURCE_FILES/build/_jobs/_logo_files.json", "w"), indent=1)
print(len(files), "svgs,", len(jobs), "render jobs")
