#!/usr/bin/env python3
"""Brand masterplan with logos (A2 landscape).

Every brand slot is painted in its brand colour and carries a logo tag
(slot code on a colour band + the brand's logo), on the full site plan and on
the three zone plans. Geometry comes from build.py; allocations, colours and
logos come from the live allocation desk (exported to a JSON file).

    python3 build_logo_masterplan.py <data.json> <logo-dir> <out.html>
"""
import base64
import json
import re
import struct
import sys
from pathlib import Path

import build as B

data_file, logo_dir, out_file = sys.argv[1:4]
DATA = json.loads(Path(data_file).read_text())
BRANDS, ALLOC = DATA["brands"], {k: v["brandId"] for k, v in DATA["alloc"].items()}
SLOT = {s["id"]: s for s in B.SLOTS}
ZNAME = {"A": "Event arena", "T": "Table parking", "V": "Validation point"}
DARK = "#1d1a17"


def png_size(p):
    with open(p, "rb") as f:
        head = f.read(24)
    return struct.unpack(">II", head[16:24])


# ------------------------------------------------------------ logo symbols (embedded once, reused by <use>)
SYMBOLS = []
for bid, b in BRANDS.items():
    p = Path(logo_dir) / f"{b['logoId']}.png"
    w, h = png_size(p)
    b["ar"] = w / h
    href = "data:image/png;base64," + base64.b64encode(p.read_bytes()).decode()
    SYMBOLS.append(f'<symbol id="lg-{bid}" viewBox="0 0 {w} {h}"><image width="{w}" height="{h}" href="{href}"/></symbol>')


def brand_of(sid):
    return BRANDS[ALLOC[sid]]


def esc(s):
    return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")


def chip(cx, cy, w, h, sid, scale=1.0):
    """Logo tag: brand-colour frame, colour band with the slot code, logo below."""
    bid = ALLOC[sid]
    b = BRANDS[bid]
    x, y = cx - w / 2, cy - h / 2
    sw = max(1.6, min(w, h) * 0.07)
    band = max(8.0, h * 0.30)
    pad = max(1.5, h * 0.06)
    lx, ly, lw, lh = x + pad, y + band + pad, w - 2 * pad, h - band - 2 * pad
    bg = f'<rect x="{lx:.1f}" y="{ly:.1f}" width="{lw:.1f}" height="{lh:.1f}" fill="{DARK}"/>' if b.get("logoBg") == "dark" else ""
    fs = band * 0.74
    return (f'<g class="chip"><rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{min(5, w * .1):.1f}" '
            f'fill="#ffffff" stroke="{b["color"]}" stroke-width="{sw:.1f}"/>'
            f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{band:.1f}" fill="{b["color"]}"/>'
            f'<text x="{cx:.1f}" y="{y + band * 0.78:.1f}" font-size="{fs:.1f}" text-anchor="middle" fill="#ffffff" '
            f'font-family="Inter, Arial, sans-serif" font-weight="800">{sid}</text>{bg}'
            f'<use href="#lg-{bid}" x="{lx:.1f}" y="{ly:.1f}" width="{lw:.1f}" height="{lh:.1f}"/></g>')


def leader(x1, y1, x2, y2, color, w=1.6):
    return f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{color}" stroke-width="{w}"/>'


# ------------------------------------------------------------ zone plans: replace slot pills with logo tags
# side, distance from wall to tag centre, tag width, tag height (None = fit the segment)
ZONE_TAGS = {
    "A01": ("left", 52, 84, None), "A09": ("below", 44, None, 58), "A17": ("right", 52, 84, None),
    "T01": ("left", 92, 88, None), "T06": ("right", 58, 88, None), "T09": ("left", 92, 88, 84),
    "V01": ("right", 60, 88, 84), "V02": ("left", 50, 84, None), "V10": ("right", 54, 88, None),
    "V18": ("left", 52, 84, None),
}


def tag_rule(sid):
    z, n = sid[0], int(sid[1:])
    keys = sorted((k for k in ZONE_TAGS if k[0] == z), key=lambda k: int(k[1:]))
    rule = None
    for k in keys:
        if n >= int(k[1:]):
            rule = ZONE_TAGS[k]
    return rule


def logo_slots_svg(zone):
    out = []
    for s in (x for x in B.SLOTS if x["zone"] == zone):
        b = brand_of(s["id"])
        c = b["color"]
        side, off, w, h = tag_rule(s["id"])
        seg = s["b"] - s["a"]
        if s["orient"] == "v":
            out.append(f'<rect x="{s["axis"] - 8}" y="{s["a"] + 1}" width="16" height="{seg - 2}" fill="{c}"/>')
            h = h or seg - 6
            cy = (s["a"] + s["b"]) / 2
            cx = s["axis"] - off if side == "left" else s["axis"] + off
            edge = cx + w / 2 if side == "left" else cx - w / 2
            out.append(leader(s["axis"], cy, edge, cy, c, 3))
        else:
            out.append(f'<rect x="{s["a"] + 1}" y="{s["axis"] - 8}" width="{seg - 2}" height="16" fill="{c}"/>')
            w = w or seg - 6
            cx = (s["a"] + s["b"]) / 2
            cy = s["axis"] + off if side == "below" else s["axis"] - off
            out.append(leader(cx, s["axis"], cx, cy - h / 2, c, 3))
        out.append(chip(cx, cy, w, h, s["id"]))
    return "".join(out)


B.slots_svg = logo_slots_svg
ZONE_SVG = {
    "A": (B.ARENA_BOX, B.draw_arena()),
    "T": ((300, 200, 1420, 1110), B.draw_table()),
    "V": (B.VALID_BOX, B.draw_valid()),
}


def zone_svg(z):
    (x, y, w, h), inner = ZONE_SVG[z]
    return (f'<svg viewBox="{x} {y} {w} {h}" class="plan" role="img" aria-label="{ZNAME[z]} brand plan" '
            f'font-family="Oswald, \'Arial Narrow\', sans-serif">{inner}</svg>')


# ------------------------------------------------------------ site plan: colour every slot and add a tag
site = B.combined(tags=False)
RECT = re.compile(r'<g class="slot" data-slot="(\w+)"><rect class="seg" x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"([^>]*)/></g>')
geo = {}


def recolour(m):
    sid, x, y, w, h = m.group(1), *map(float, m.groups()[1:5])
    geo[sid] = (x, y, w, h)
    c = brand_of(sid)["color"]
    if w >= h:   # horizontal wall: thicken
        return f'<rect x="{x}" y="{y - 2}" width="{w}" height="{h + 4}" fill="{c}"/>'
    return f'<rect x="{x - 2}" y="{y}" width="{w + 4}" height="{h}" fill="{c}"/>'


site = RECT.sub(recolour, site)
assert len(geo) == 49, len(geo)


def ctr(sid):
    x, y, w, h = geo[sid]
    return x + w / 2, y + h / 2


def rng(a, b):
    z = a[0]
    return [f"{z}{i:02d}" for i in range(int(a[1:]), int(b[1:]) + 1)]


tags = []
# walls with room for tags right beside them
for ids, side, w, h, gap in [(rng("V10", "V17"), "above", 43, 40, 6), (["V01"], "above", 38, 40, 6),
                             (rng("V02", "V09"), "below", 37, 38, 6), (rng("V18", "V19"), "below", 34, 36, 5),
                             (rng("T01", "T05"), "below", 30, 34, 5), (rng("T09", "T11"), "below", 56, 34, 5),
                             (rng("T06", "T08"), "above", 31, 34, 5)]:
    for sid in ids:
        cx, cy = ctr(sid)
        _, _, sw, sh = geo[sid]
        ty = cy - sh / 2 - gap - h / 2 if side == "above" else cy + sh / 2 + gap + h / 2
        tags.append(chip(cx, ty, w, h, sid))
# A09–A16 run north–south beside the walkway: tags to the west
for sid in rng("A09", "A16"):
    cx, cy = ctr(sid)
    _, _, sw, sh = geo[sid]
    tags.append(leader(cx, cy, cx - 12, cy, brand_of(sid)["color"], 1.4))
    tags.append(chip(cx - 34, cy, 44, sh - 2, sid))
# A01–A08 (above the tables) and A17–A19 (below Starboy): callout rows on the roads with leader lines


def callout_row(ids, row_y, w, h, pitch, centre_x, from_top):
    ids = sorted(ids, key=lambda s: ctr(s)[0])
    n = len(ids)
    for i, sid in enumerate(ids):
        tx = centre_x + (i - (n - 1) / 2) * pitch
        sx, sy = ctr(sid)
        c = brand_of(sid)["color"]
        ey = row_y + h / 2 if from_top else row_y - h / 2
        rank = abs(i - (n - 1) / 2)          # outer leaders turn nearer the wall, so none cross
        mid = (sy - 14 - (3.5 - rank) * 7) if from_top else (sy + 14 + (1 - rank) * 9 + 18)
        tags.append(f'<polyline points="{sx:.1f},{sy:.1f} {sx:.1f},{mid:.1f} {tx:.1f},{mid:.1f} {tx:.1f},{ey:.1f}" '
                    f'fill="none" stroke="{c}" stroke-width="1.6"/>')
        tags.append(f'<circle cx="{sx:.1f}" cy="{sy:.1f}" r="3" fill="{c}"/>')
        tags.append(chip(tx, row_y, w, h, sid))


callout_row(rng("A01", "A08"), 150, 46, 42, 50, 1376, True)
callout_row(rng("A17", "A19"), 950, 46, 42, 52, 1348, False)
site = site.replace('viewBox="200 110 1560 935"', 'viewBox="200 100 1560 930"')
site = site.replace("</svg>", "".join(tags) + "</svg>")
# keep the A01–A08 row clear of the entrance label
site = site.replace('T(552, 150, "MAIN ENTRANCE"', 'T(552, 150, "MAIN ENTRANCE"')


# ------------------------------------------------------------ legend + schedule
def logo_box(bid, cls="lgo"):
    b = BRANDS[bid]
    dk = " dark" if b.get("logoBg") == "dark" else ""
    return f'<span class="{cls}{dk}"><svg viewBox="0 0 {b["ar"] * 100:.0f} 100"><use href="#lg-{bid}" width="{b["ar"] * 100:.0f}" height="100"/></svg></span>'


def slots_for(bid):
    return [s for s in B.SLOTS if ALLOC[s["id"]] == bid]


order = sorted(BRANDS, key=lambda k: (-len(slots_for(k)), BRANDS[k]["name"].lower()))
legend = "".join(
    f'<div class="lg" style="--c:{BRANDS[k]["color"]}"><i class="bar"></i>{logo_box(k)}'
    f'<div class="txt"><b>{esc(BRANDS[k]["name"])}</b><span class="hex">{BRANDS[k]["color"].upper()}</span>'
    f'<span class="codes">{", ".join(s["id"] for s in slots_for(k))}</span>'
    f'<span class="ft">{len(slots_for(k))} slots · {sum(s["w"] for s in slots_for(k))} ft</span></div></div>'
    for k in order)


def zone_legend(z):
    ks = [k for k in order if any(s["zone"] == z for s in slots_for(k))]
    return "".join(
        f'<div class="lg sm" style="--c:{BRANDS[k]["color"]}"><i class="bar"></i>{logo_box(k)}'
        f'<div class="txt"><b>{esc(BRANDS[k]["name"])}</b><span class="codes">'
        f'{", ".join(s["id"] for s in slots_for(k) if s["zone"] == z)}</span></div></div>' for k in ks)


def sched_rows(ids):
    out = []
    for sid in ids:
        s, bid = SLOT[sid], ALLOC[sid]
        b = BRANDS[bid]
        out.append(f'<tr><td><span class="code" style="background:{b["color"]}">{sid}</span></td>'
                   f'<td>{ZNAME[s["zone"]]}</td><td>{esc(s["where"])}</td><td class="r">{s["w"]} × 10 ft</td>'
                   f'<td><span class="who">{logo_box(bid, "lgo xs")}{esc(b["name"])}</span></td></tr>')
    return "".join(out)


ids = [s["id"] for s in B.SLOTS]
half = (len(ids) + 1) // 2
TH = '<thead><tr><th>Slot</th><th>Zone</th><th>Location</th><th class="r">Size</th><th>Brand</th></tr></thead>'

html = f'''<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>LOL Festival 2026 · Brand masterplan with logos</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600;700;800&display=swap">
<style>
:root {{ --ink: #22201e; --muted: #6f6a64; --rule: #e3e0db; --display: "Oswald", "Arial Narrow", sans-serif; --body: "Inter", system-ui, sans-serif; }}
* {{ box-sizing: border-box; }}
body {{ margin: 0; background: #ffffff; color: var(--ink); font-family: var(--body); }}
.page {{ width: 574mm; height: 400mm; padding: 0; display: grid; grid-template-rows: auto 1fr auto; gap: 5mm; break-after: page; overflow: hidden; }}
.page:last-child {{ break-after: auto; }}
header {{ display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1.2mm solid var(--ink); padding-bottom: 3mm; }}
h1, h2 {{ font-family: var(--display); text-transform: uppercase; margin: 0; line-height: 1; }}
h1 {{ font-size: 15mm; font-weight: 700; }}
h2 {{ font-size: 11mm; font-weight: 700; }}
.eyebrow {{ font-size: 3.4mm; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); margin: 0 0 2mm; }}
.meta {{ font-size: 3.6mm; color: var(--muted); text-align: right; line-height: 1.5; }}
.meta b {{ color: var(--ink); }}
.planbox {{ min-height: 0; display: grid; place-items: center; }}
.plan {{ display: block; width: 100%; height: 100%; max-height: 100%; }}
.legend {{ display: grid; grid-template-columns: repeat(6, 1fr); gap: 2.2mm; }}
.legend.z {{ grid-template-columns: repeat(auto-fill, minmax(62mm, 1fr)); }}
.lg {{ display: grid; grid-template-columns: 2.2mm 24mm 1fr; gap: 2.4mm; align-items: center; border: .35mm solid var(--rule); border-radius: 1.6mm; padding: 2mm; }}
.lg .bar {{ width: 2.2mm; align-self: stretch; background: var(--c); border-radius: .6mm; }}
.lgo {{ width: 24mm; height: 13mm; display: grid; place-items: center; background: #fff; border: .3mm solid var(--rule); border-radius: 1mm; overflow: hidden; }}
.lgo.dark {{ background: #1d1a17; border-color: #1d1a17; }}
.lgo svg {{ max-width: 90%; max-height: 85%; width: 100%; height: 100%; }}
.lgo.xs {{ width: 12mm; height: 6.5mm; }}
.txt {{ display: grid; gap: .4mm; min-width: 0; }}
.txt b {{ font-size: 3.6mm; }}
.hex {{ font-size: 2.6mm; color: var(--muted); letter-spacing: .05em; }}
.codes {{ font-size: 3mm; font-weight: 600; }}
.ft {{ font-size: 2.7mm; color: var(--muted); }}
.lg.sm {{ grid-template-columns: 2mm 20mm 1fr; padding: 1.6mm; }}
.lg.sm .lgo {{ width: 20mm; height: 11mm; }}
.cols {{ display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; align-items: start; }}
table {{ width: 100%; border-collapse: collapse; font-size: 3.2mm; font-variant-numeric: tabular-nums; }}
th {{ text-align: left; font-size: 2.6mm; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); font-weight: 600; padding: 1.4mm 2mm; border-bottom: .5mm solid var(--ink); }}
td {{ padding: 1.05mm 2mm; border-bottom: .25mm solid var(--rule); white-space: nowrap; }}
.r {{ text-align: right; }}
.code {{ color: #fff; font-weight: 800; padding: .5mm 2.2mm; border-radius: 9mm; font-size: 3mm; }}
.who {{ display: inline-flex; align-items: center; gap: 2mm; }}
.note {{ font-size: 3mm; color: var(--muted); margin: 0; }}
@page {{ size: 594mm 420mm; margin: 10mm; }}
</style></head><body>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>{"".join(SYMBOLS)}</defs></svg>

<section class="page">
  <header><div><p class="eyebrow">Live Out Loud Music Festival 2026 · Eagle Square, Abuja · Sunday 13 December 2026</p><h1>Brand masterplan</h1></div>
  <div class="meta"><b>49 of 49 slots allocated · {len(BRANDS)} brands</b><br>Each wall is drawn in its brand's colour and tagged with slot code and logo.<br>Zone sheets 2–4 show every tag at full size.</div></header>
  <div class="planbox">{site}</div>
  <div class="legend">{legend}</div>
</section>
''' + "".join(f'''
<section class="page">
  <header><div><p class="eyebrow">Brand masterplan · Sheet {i + 2} of 5</p><h2>{ZNAME[z]}</h2></div>
  <div class="meta"><b>{sum(1 for s in B.SLOTS if s["zone"] == z)} slots</b><br>Tags show slot code, brand colour and logo.</div></header>
  <div class="planbox">{zone_svg(z)}</div>
  <div class="legend z">{zone_legend(z)}</div>
</section>''' for i, z in enumerate("ATV")) + f'''
<section class="page">
  <header><div><p class="eyebrow">Brand masterplan · Sheet 5 of 5</p><h2>Allocation schedule</h2></div>
  <div class="meta"><b>49 slots · 1,877 ft of brand walls</b><br>All walls 10 ft (3.05 m) high.</div></header>
  <div class="cols"><table>{TH}<tbody>{sched_rows(ids[:half])}</tbody></table><table>{TH}<tbody>{sched_rows(ids[half:])}</tbody></table></div>
  <p class="note">Plans are not to scale; production confirms final dimensions on site. Allocation is subject to contract.</p>
</section>
</body></html>'''
Path(out_file).write_text(html, encoding="utf-8")
print("wrote", out_file, len(html) // 1024, "KB")
