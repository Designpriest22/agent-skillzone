#!/usr/bin/env python3
"""Builds lol-3d.html: an interactive 3D view of every brand banner at Eagle Square.

The ground is the combined site plan (rendered to an image), the venue's
structures are extruded from the same plan geometry, and each of the 49 brand
slots stands as a 10 ft banner carrying its brand's colour and logo.

    python3 build_3d.py <data.json> <logo-dir> <out.html> [--local <three-dir>]

--local points the page at a local copy of three@0.147.0 (for offline testing);
without it the page loads the same version from jsDelivr.
"""
import base64
import io
import os
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image

import build as B

HERE = Path(__file__).parent
args = sys.argv[1:]
local = None
if "--local" in args:
    i = args.index("--local")
    local = args[i + 1]
    args = args[:i] + args[i + 2:]
data_file, logo_dir, out_file = args
DATA = json.loads(Path(data_file).read_text())
BRANDS, ALLOC = DATA["brands"], {k: v["brandId"] for k, v in DATA["alloc"].items()}

VB = (200, 100, 1560, 935)            # site plan window (construct px)
CX, CZ = VB[0] + VB[2] / 2, VB[1] + VB[3] / 2

# ------------------------------------------------------------ site plan geometry
site = B.combined(tags=False)
SLOT_RE = re.compile(r'<g class="slot" data-slot="(\w+)"><rect class="seg" x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"[^>]*/></g>')
slots = []
meta = {s["id"]: s for s in B.SLOTS}
for m in SLOT_RE.finditer(site):
    sid = m.group(1)
    x, y, w, h = map(float, m.groups()[1:])
    s = meta[sid]
    horiz = w >= h
    slots.append(dict(id=sid, zone=sid[0], brand=ALLOC[sid], ft=s["w"], where=s["where"],
                      cx=round(x + w / 2 - CX, 2), cz=round(y + h / 2 - CZ, 2),
                      len=round(w if horiz else h, 2), o="h" if horiz else "v"))
assert len(slots) == 49
ground_svg = SLOT_RE.sub("", site).replace('viewBox="200 110 1560 935"', f'viewBox="{VB[0]} {VB[1]} {VB[2]} {VB[3]}"')

# extrude structures by their plan colour
RECT_RE = re.compile(r'<rect x="([-\d.]+)" y="([-\d.]+)" width="([\d.]+)" height="([\d.]+)" rx="[\d.]+" fill="(#[0-9a-fA-F]{3,6})"')
H = {B.BAR.lower(): 9, B.STRUCT.lower(): 10, "#111": 7, "#4a4a4a": 8, "#c9f2cf": 9, "#d8d5f1": 6,
     "#f4a9c9": 6, B.PINK.lower(): 3, B.INK.lower(): 9}
blocks = []
for m in RECT_RE.finditer(ground_svg):
    x, y, w, h = map(float, m.groups()[:4])
    fill = m.group(5).lower()
    area = w * h
    hgt = None
    if fill == B.STAGE.lower():
        hgt = (16 if area > 3000 else 4) if x > 1500 else 7
    elif fill == B.BLOCK.lower():
        hgt = 6 if area < 400 else (3 if 3500 < area < 4500 and y < 420 else (2 if area < 4000 else None))
    elif fill in H:
        hgt = H[fill] if not (fill == B.INK.lower() and area < 60) else 4
    if hgt:
        blocks.append([round(x - CX, 1), round(y - CZ, 1), round(w, 1), round(h, 1), hgt, fill])

# barricade and fence lines
lines = []
for m in re.finditer(r'<polyline points="([^"]+)" fill="none" stroke="(#[0-9a-fA-F]+)" stroke-width="([\d.]+)"', ground_svg):
    pts = [tuple(map(float, p.split(","))) for p in m.group(1).split()]
    kind = "pink" if m.group(2).lower() == B.PINK.lower() else "fence"
    lines.append(dict(k=kind, p=[[round(x - CX, 1), round(y - CZ, 1)] for x, y in pts]))

# LED screens and stage roof (arena drawing mapped 90 degrees clockwise, as in build.combined)
def cw(x, y):
    return 1742.4 - 0.4 * y - CX, 160.8 + 0.4 * x - CZ


s1, s2 = cw(624, 470), cw(744, 470)
s3, s4 = cw(1117, 470), cw(1213, 470)
extras = dict(screens=[[s1[0], s1[1], s2[1]], [s3[0], s3[1], s4[1]]],
              stage=[*cw(744, 470), *cw(1117, 386)])

# guest route (car park to WIZKID FC), with captions
route = [[805, 600], [805, 875], [352, 875], [352, 597], [730, 597], [730, 738], [1331, 738], [1331, 537], [1430, 537]]
route = [[x - CX, y - CZ] for x, y in route]

# ------------------------------------------------------------ brands + logos
brands = {}
for bid, b in BRANDS.items():
    im = Image.open(Path(logo_dir) / f"{b['logoId']}.png").convert("RGBA")
    im.thumbnail((360, 360))
    buf = io.BytesIO()
    im.save(buf, "PNG", optimize=True)
    slug = re.sub(r"[^a-z0-9]+", "-", b["name"].lower()).strip("-")
    brands[bid] = dict(name=b["name"], tier=b.get("tier", ""), color=b["color"], dark=b.get("logoBg") == "dark",
                       slug=slug, logo="data:image/png;base64," + base64.b64encode(buf.getvalue()).decode())

# ------------------------------------------------------------ ground texture (render the plan with Chromium)
with tempfile.TemporaryDirectory() as td:
    td = Path(td)
    W = 4096
    Hh = round(W * VB[3] / VB[2])
    g_svg = ground_svg.replace('class="plan"', "")
    (td / "g.html").write_text(
        f'<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" '
        f'href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;700&display=swap">'
        f'<style>html,body{{margin:0;background:#fff}}svg{{display:block;width:{W}px;height:{Hh}px}}</style></head>'
        f'<body>{g_svg}</body></html>')
    js = f"""const {{chromium}}=require('playwright');(async()=>{{const b=await chromium.launch();
const p=await b.newPage({{viewport:{{width:{W},height:{Hh}}}}});await p.goto('file://{td}/g.html',{{waitUntil:'networkidle'}});
await p.evaluate(()=>document.fonts.ready);await p.screenshot({{path:'{td}/g.png'}});await b.close();}})();"""
    (td / "r.cjs").write_text(js)
    npm_root = subprocess.run(["npm", "root", "-g"], capture_output=True, text=True).stdout.strip()
    subprocess.run(["node", str(td / "r.cjs")], check=True, env={**os.environ, "NODE_PATH": npm_root})
    g = Image.open(td / "g.png").convert("RGB")
    buf = io.BytesIO()
    g.save(buf, "JPEG", quality=84, optimize=True, progressive=True)
    ground = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()

payload = dict(site=[VB[2], VB[3]], slots=slots, brands=brands, blocks=blocks, lines=lines, extras=extras, route=route)
if local:
    scripts = (f'<script src="{local}/build/three.min.js"></script>\n'
               f'<script src="{local}/examples/js/controls/OrbitControls.js"></script>')
else:
    scripts = ('<script src="https://cdn.jsdelivr.net/npm/three@0.147.0/build/three.min.js"></script>\n'
               '<script src="https://cdn.jsdelivr.net/npm/three@0.147.0/examples/js/controls/OrbitControls.js"></script>')
tpl = (HERE / "3d_template.html").read_text(encoding="utf-8")
html = (tpl.replace("__SCRIPTS__", scripts)
           .replace("__DATA__", json.dumps(payload, separators=(",", ":")).replace("</", "<\\/"))
           .replace("__GROUND__", ground))
Path(out_file).write_text(html, encoding="utf-8")
print("wrote", out_file, len(html) // 1024, "KB;", len(blocks), "blocks,", len(lines), "lines")
