#!/usr/bin/env python3
"""Builds the LOL Festival 2026 brand placement & floor plan document.

All plan geometry is traced in the pixel space of the three supplied drawings
(source/*.jpg, 2000 x 1414 px), so every element sits exactly where the
organiser drew it. Brand-slot segments were measured from the drawings by
colour (orange / green / blue), one segment = one brand slot.

Output: index.html (web + artifact) — render to PDF with render_pdf.mjs.
"""
from pathlib import Path

OUT = Path(__file__).parent / "index.html"

# ---------------------------------------------------------------- palette
INK = "#1d1a17"
PAPER = "#f7f6f3"
SITE = "#e4e2dd"
SITE2 = "#cfccc5"
DARK = "#3a3532"
STAGE = "#56514d"
PINK = "#e8197a"
ORANGE = "#f4801f"
GREEN = "#1fc44f"
BLUE = "#14b8e6"
REG = "#6b3fd6"      # regular guest route
TBL = "#b5860c"      # table guest route
CAR = "#7a756f"      # vehicles
BAR_FILL = "#d5e4e8"
BAR_STROKE = "#8fb0b9"

# ---------------------------------------------------------------- slot data
# (id, zone, group, w_ft, h_ft, location, faces, segment(x, y0, y1) or (y, x0, x1), orient)
SLOTS = []


def add(prefix, start, group, w, segs, orient, axis, location, faces, pill_off):
    for i, (a, b) in enumerate(segs):
        sid = f"{prefix}{start + i:02d}"
        SLOTS.append(dict(id=sid, zone=prefix, group=group, w=w, h=10, a=a, b=b,
                          orient=orient, axis=axis, loc=location, faces=faces,
                          pill=pill_off, n=i + 1, of=len(segs)))


# Zone V — Validation point / general parking (blue)
add("V", 1, "Ticket Purchase Wall", 36, [(356, 473)], "v", 1073,
    "North-east corner, beside the ticket kiosk", "Ticket buyers and every regular guest queuing to validate", 62)
add("V", 2, "Validation Wall West", 32,
    [(465, 528), (532, 594), (598, 660), (665, 727), (732, 794), (798, 861), (864, 926), (930, 993)],
    "v", 657, "West side of the regular walk-in corridor, north to south",
    "Regular guests at the turnstiles and walking out of validation", -34)
add("V", 10, "Validation Wall East", 39,
    [(470, 547), (553, 630), (635, 712), (718, 795), (801, 879), (884, 961), (965, 1043), (1048, 1126)],
    "v", 1052, "East side of the regular walk-in corridor, running down to the walk lane",
    "Regular guests in the walk-in corridor and the walk lane", 38)
add("V", 18, "Car Park Gate Wall", 80, [(1148, 1213), (1221, 1286)], "v", 613,
    "South-west, at the pedestrian gate out of general parking",
    "Every guest who parks in general parking", -34)

# Zone T — Table parking (green)
add("T", 1, "Regular Walk-In Wall (outer)", 50,
    [(285, 356), (362, 432), (439, 509), (515, 585), (591, 662)], "v", 483,
    "West edge of the regular walk-in lane, northern run",
    "Regular guests walking from validation to the arena", 32)
add("T", 6, "Table Parking Wall", 49, [(295, 376), (383, 464), (472, 553)], "v", 670,
    "East edge of the regular walk-in lane, along the table car park",
    "Regular guests in the walk-in lane", -30)
add("T", 9, "Regular Walk-In Wall (south)", 32, [(683, 818), (830, 965), (977, 1113)], "v", 483,
    "West edge of the regular walk-in lane, southern run",
    "Regular guests on the final approach to the arena", 32)

# Zone A — Event arena (orange)
add("A", 1, "Table Entry Brands Wall", 30,
    [(690, 742), (746, 799), (802, 855), (859, 912), (916, 969), (973, 1026), (1029, 1081), (1085, 1138)],
    "v", 358, "West side, along the table guest corridor, north to south",
    "Table guests (Gold, Black, Platinum) entering from the Table Entry Point", 66)
add("A", 9, "Brands Experience Zone", 40,
    [(675, 746), (752, 823), (827, 899), (904, 975), (981, 1053), (1057, 1129), (1134, 1206), (1210, 1282)],
    "h", 1097, "South of WIZKID FC, west to east",
    "Every regular guest walking from the Regular Entry Point into WIZKID FC", -24)
add("A", 17, "Brands Sales Point", 20, [(868, 940), (945, 1016), (1024, 1095)], "v", 1493,
    "East side, beside the Starboy Marketplace stalls, north to south",
    "Regular guests at the Starboy Marketplace and the east bars", -50)

ZONE_COLOR = {"V": BLUE, "T": GREEN, "A": ORANGE}


def slot_svg(zone):
    out = []
    for s in SLOTS:
        if s["zone"] != zone:
            continue
        c = ZONE_COLOR[zone]
        if s["orient"] == "v":
            x, y0, y1 = s["axis"], s["a"], s["b"]
            seg = f'<rect x="{x-5}" y="{y0}" width="10" height="{y1-y0}" rx="2" fill="{c}"/>'
            px, py = x + s["pill"], (y0 + y1) / 2
        else:
            y, x0, x1 = s["axis"], s["a"], s["b"]
            seg = f'<rect x="{x0}" y="{y-5}" width="{x1-x0}" height="10" rx="2" fill="{c}"/>'
            px, py = (x0 + x1) / 2, y + s["pill"]
        out.append(
            f'<g class="slot" data-slot="{s["id"]}" tabindex="0">'
            f'<title>{s["id"]} · {s["group"]} · {s["w"]} × 10 ft</title>{seg}'
            f'<g class="pill"><rect x="{px-22}" y="{py-11}" width="44" height="22" rx="11" fill="{INK}"/>'
            f'<text x="{px}" y="{py+5}" class="pill-t">{s["id"]}</text></g></g>')
    return "\n".join(out)


def arrowdefs(uid):
    return f'''<defs>
<marker id="ar-reg-{uid}" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="{REG}"/></marker>
<marker id="ar-tbl-{uid}" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="{TBL}"/></marker>
<marker id="ar-car-{uid}" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="{CAR}"/></marker>
<pattern id="hatch-{uid}" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="{SITE2}"/><line x1="0" y1="0" x2="0" y2="10" stroke="#b9b5ad" stroke-width="4"/></pattern>
</defs>'''


def route(d, kind, uid, width=7, mid=False):
    col = {"reg": REG, "tbl": TBL, "car": CAR}[kind]
    dash = ' stroke-dasharray="16 10"' if kind == "car" else (' stroke-dasharray="2 12"' if kind == "tbl" else "")
    cap = "round"
    mk = f' marker-end="url(#ar-{kind}-{uid})"'
    if mid:
        mk += f' marker-mid="url(#ar-{kind}-{uid})"'
    return (f'<path d="{d}" fill="none" stroke="{col}" stroke-width="{width}" stroke-linecap="{cap}" '
            f'stroke-linejoin="round"{dash}{mk} class="route route-{kind}"/>')


def step(x, y, n, kind="reg"):
    col = {"reg": REG, "tbl": TBL}[kind]
    return (f'<g class="step"><circle cx="{x}" cy="{y}" r="17" fill="{col}" stroke="{PAPER}" stroke-width="4"/>'
            f'<text x="{x}" y="{y+6}" class="step-t">{n}</text></g>')


def label(x, y, txt, size=18, cls="lbl", rot=None, anchor="middle", fill=None):
    t = f' transform="rotate({rot} {x} {y})"' if rot is not None else ""
    f = f' fill="{fill}"' if fill else ""
    lines = txt.split("|")
    if len(lines) == 1:
        return f'<text x="{x}" y="{y}" class="{cls}" font-size="{size}" text-anchor="{anchor}"{t}{f}>{txt}</text>'
    tsp = "".join(f'<tspan x="{x}" dy="{0 if i == 0 else size*1.1}">{l}</tspan>' for i, l in enumerate(lines))
    return f'<text x="{x}" y="{y}" class="{cls}" font-size="{size}" text-anchor="{anchor}"{t}{f}>{tsp}</text>'


def pinkline(pts, w=5):
    return f'<polyline points="{pts}" fill="none" stroke="{PINK}" stroke-width="{w}" stroke-linejoin="miter"/>'


# ================================================================ ZONE V
def svg_validation():
    u = "v"
    s = [f'<svg viewBox="330 230 1390 1110" class="plan" role="img" aria-label="Zone 1 plan: validation point and general parking">',
         arrowdefs(u)]
    s.append(f'<rect x="491" y="267" width="1079" height="755" fill="{SITE2}"/>')
    # fixed structures (orange blocks on the supplied plan = existing structures, no brand use)
    for x, y, w, h in [(512, 276, 222, 67), (1111, 280, 426, 27), (501, 435, 145, 560)]:
        s.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="4" fill="#efc9a6" stroke="#d9a271" stroke-width="2"/>')
    s.append(label(573, 720, "FIXED STRUCTURE", 15, "lbl-m", rot=-90))
    s.append(label(1324, 298, "FIXED STRUCTURE", 13, "lbl-m"))
    # branding line + ticket purchase
    s.append(f'<rect x="735" y="351" width="323" height="8" rx="3" fill="{DARK}"/>')
    s.append(label(896, 336, "LOL FESTIVAL BRANDING", 15, "lbl-s"))
    s.append(f'<rect x="1004" y="370" width="33" height="57" fill="#111"/>')
    s.append(label(1020, 450, "KIOSK", 11, "lbl-s"))
    for x in (663, 810, 973):
        s.append(f'<rect x="{x}" y="440" width="83" height="25" rx="5" fill="{STAGE}"/>')
    s.append(label(905, 412, "TICKET PURCHASE AREA", 18, "lbl"))
    s.append(label(905, 492, "3 ticket booths", 13, "lbl-m"))
    # turnstiles
    for x in (724, 767, 810, 852, 894, 938, 983):
        s.append(f'<rect x="{x}" y="637" width="23" height="29" fill="{DARK}"/>')
    s.append(label(905, 760, "REGULAR TICKET|VALIDATION POINT", 22, "lbl-big"))
    s.append(label(905, 692, "7 validation turnstiles (as drawn)", 13, "lbl-m"))
    s.append(f'<rect x="1064" y="483" width="57" height="467" rx="5" fill="{STAGE}"/>')
    s.append(label(920, 950, "REGULAR WALK-IN CORRIDOR", 15, "lbl-m"))
    # walk lane
    s.append(f'<rect x="491" y="1022" width="1079" height="100" fill="#ffffff"/>')
    s.append(label(1300, 1012, "WALK LANE · regular guests + table cars (segregate with barriers)", 12, "lbl-m"))
    s.append(f'<rect x="485" y="1027" width="27" height="116" fill="{PINK}"/>')
    s.append(label(540, 1085, "NO ACCESS", 18, "lbl", rot=-90, fill=PINK))
    # lower parcels
    s.append(f'<rect x="485" y="1147" width="121" height="141" fill="{SITE2}"/>')
    s.append(f'<rect x="738" y="1122" width="832" height="164" fill="{SITE2}"/>')
    s.append(f'<rect x="749" y="1141" width="161" height="131" rx="5" fill="{STAGE}"/>')
    s.append(label(1250, 1180, "GENERAL PARKING", 26, "lbl-big"))
    s.append(f'<line x1="749" y1="1297" x2="1092" y2="1297" stroke="{PINK}" stroke-width="5"/>')
    s.append(f'<line x1="1203" y1="1299" x2="1546" y2="1299" stroke="{PINK}" stroke-width="5"/>')
    # wall labels
    s.append(label(698, 728, "BRANDS WALL · 32 × 10 FT PER BRAND", 13, "lbl-w", rot=-90))
    s.append(label(1022, 798, "BRANDS WALL · 39 × 10 FT PER BRAND", 13, "lbl-w", rot=-90))
    s.append(label(1100, 414, "36 × 10 FT", 12, "lbl-w", rot=-90))
    s.append(label(652, 1218, "80 × 10 FT PER BRAND", 11, "lbl-w", rot=-90))
    # routes
    s.append(route("M1155,1335 L1155,1215", "car", u))
    s.append(label(1210, 1328, "CAR ENTRY", 15, "lbl", anchor="start"))
    s.append(route("M1700,1060 L1590,1060", "car", u))
    s.append(route("M1590,1092 L1700,1092", "car", u))
    s.append(label(1650, 1040, "TABLE CARS", 13, "lbl-s"))
    s.append(route("M1060,1215 L672,1215 L672,1318 L445,1318 L445,372 L778,372 L778,1072 L1520,1072", "reg", u))
    s.append(label(1540, 1140, "TO ZONE 2 ›", 15, "lbl", anchor="start", fill=REG))
    s.append(step(980, 1215, 1))
    s.append(step(445, 900, 2))
    s.append(step(778, 452, 3))
    s.append(step(778, 651, 4))
    s.append(step(778, 880, 5))
    s.append(step(1350, 1072, 6))
    s.append(label(405, 470, "WALK-IN|ENTRANCE", 16, "lbl", rot=-90))
    s.append(slot_svg("V"))
    s.append("</svg>")
    return "\n".join(s)


# ================================================================ ZONE T
def svg_table():
    u = "t"
    s = [f'<svg viewBox="340 190 1390 1130" class="plan" role="img" aria-label="Zone 2 plan: table parking and walk-in">',
         arrowdefs(u)]
    s.append(f'<rect x="668" y="286" width="1010" height="366" fill="{SITE2}"/>')
    s.append(pinkline("670,286 1015,286"))
    s.append(pinkline("1127,289 1470,289 1470,643 681,643"))
    s.append(label(1110, 470, "TABLE PARKING", 56, "lbl-hero"))
    s.append(label(1070, 320, "TABLE CAR ENTRANCE", 17, "lbl"))
    s.append(f'<rect x="668" y="683" width="1010" height="389" fill="{SITE}"/>')
    s.append(label(1105, 905, "TABLE WALK-IN", 40, "lbl-hero"))
    s.append(f'<rect x="667" y="790" width="6" height="278" fill="{DARK}"/>')
    s.append(f'<rect x="711" y="912" width="162" height="138" rx="8" fill="#4a4a4a"/>')
    s.append(label(792, 985, "LOL", 22, "lbl-inv"))
    s.append(label(690, 930, "LOL BRANDING", 13, "lbl-s", rot=-90))
    s.append(pinkline("670,1070 670,1165"))
    s.append(f'<rect x="668" y="1160" width="902" height="130" fill="{SITE}"/>')
    for x in (691, 1242):
        s.append(f'<rect x="{x}" y="1187" width="212" height="85" rx="5" fill="{BAR_FILL}" stroke="{BAR_STROKE}" stroke-width="2"/>')
        s.append(label(x + 106, 1240, "BAR", 22, "lbl"))
    s.append(f'<rect x="969" y="1187" width="212" height="85" rx="5" fill="#4a4a4a"/>')
    s.append(pinkline("882,1186 980,1186"))
    s.append(pinkline("1170,1186 1267,1186"))
    s.append(f'<rect x="368" y="1120" width="120" height="6" fill="{DARK}"/>')
    # gates (hatched turnstile lines)
    for x0, x1, y in [(503, 655, 284), (492, 535, 680), (616, 662, 680)]:
        s.append(f'<rect x="{x0}" y="{y-6}" width="{x1-x0}" height="12" fill="url(#hatch-{u})" stroke="{INK}" stroke-width="2"/>')
    s.append(label(580, 255, "REGULAR WALK-IN GATE", 15, "lbl"))
    s.append(label(447, 475, "BRANDS WALL · 50 × 10 FT PER BRAND", 13, "lbl-w", rot=-90))
    s.append(label(700, 425, "BRANDS WALL · 49 × 10 FT PER BRAND", 12, "lbl-w", rot=-90))
    s.append(label(447, 898, "BRANDS WALL · 32 × 10 FT PER BRAND", 13, "lbl-w", rot=-90))
    # routes
    s.append(route("M1070,200 L1070,345", "car", u))
    s.append(route("M1010,600 L705,600 L705,700 L800,745 L1105,950 L1105,1112 L1645,1112 L1645,1300", "tbl", u, 7))
    s.append(route("M580,215 L580,1310", "reg", u))
    s.append(step(580, 395, 6))
    s.append(step(580, 1010, 7))
    s.append(label(625, 1310, "TO ZONE 3 · REGULAR ENTRY POINT ›", 14, "lbl", anchor="start", fill=REG))
    s.append(label(1660, 1312, "TO TABLE ENTRY POINT", 13, "lbl", anchor="end", fill=TBL))
    s.append(label(1400, 1100, "TABLE GUEST WALK", 14, "lbl", fill=TBL))
    s.append(slot_svg("T"))
    s.append("</svg>")
    return "\n".join(s)


# ================================================================ ZONE A
def svg_arena():
    u = "a"
    s = [f'<svg viewBox="190 150 1530 1200" class="plan" role="img" aria-label="Zone 3 plan: event arena">',
         arrowdefs(u)]
    s.append(f'<rect x="206" y="211" width="1484" height="1112" rx="6" fill="{SITE}"/>')
    s.append(f'<rect x="494" y="316" width="874" height="694" fill="#b9b6b0"/>')
    # back line / gates
    s.append(f'<line x1="350" y1="311" x2="1507" y2="311" stroke="{DARK}" stroke-width="7"/>')
    s.append(f'<polyline points="1388,212 1488,212 1488,311" fill="none" stroke="{DARK}" stroke-width="7"/>')
    s.append(f'<line x1="370" y1="212" x2="478" y2="212" stroke="{DARK}" stroke-width="9"/>')
    s.append(label(424, 196, "PLATINUM ACCESS GATE", 15, "lbl"))
    s.append(label(1440, 196, "TALENT ENTRANCE", 15, "lbl"))
    s.append(label(1567, 265, "POWER SUPPLY", 14, "lbl"))
    for x in (852, 958, 1065, 1172):
        s.append(f'<rect x="{x}" y="220" width="100" height="50" fill="#bfeec9" stroke="#46b85d" stroke-width="3"/>')
        s.append(f'<path d="M{x},220 L{x+100},270 M{x+100},220 L{x},270" stroke="#46b85d" stroke-width="2"/>')
    s.append(label(1062, 293, "GREEN ROOMS ×4 · FENCE", 15, "lbl"))
    # stage
    s.append(f'<rect x="744" y="386" width="373" height="84" fill="{STAGE}"/>')
    s.append(label(930, 440, "MAIN STAGE", 30, "lbl-inv"))
    s.append(f'<line x1="624" y1="470" x2="744" y2="470" stroke="#fff" stroke-width="6"/>')
    s.append(f'<line x1="1117" y1="470" x2="1213" y2="470" stroke="#fff" stroke-width="6"/>')
    s.append(label(690, 459, "SCREEN 12 M", 11, "lbl-s"))
    s.append(label(1160, 459, "SCREEN 12 M", 11, "lbl-s"))
    # GA
    s.append(f'<rect x="648" y="476" width="565" height="522" fill="{DARK}"/>')
    s.append(f'<rect x="889" y="465" width="79" height="80" fill="{STAGE}"/>')
    s.append(label(928, 510, "RUNWAY", 12, "lbl-inv", rot=90))
    s.append(f'<rect x="904" y="550" width="48" height="200" fill="{PINK}"/>')
    s.append(label(928, 650, "CRASH BARRIERS", 13, "lbl-inv", rot=90))
    s.append(f'<rect x="893" y="749" width="73" height="37" fill="#f2a3c6" stroke="{PINK}" stroke-width="3"/>')
    s.append(label(929, 774, "FOH", 16, "lbl"))
    s.append(label(930, 900, "WIZKID FC", 92, "lbl-ga"))
    s.append(label(930, 945, "GENERAL ADMISSION", 16, "lbl-inv-m"))
    # Starboy marketplace
    s.append(f'<rect x="1221" y="480" width="226" height="515" fill="{DARK}"/>')
    s.append(label(1334, 720, "STARBOY|MARKETPLACE", 28, "lbl-inv-m"))
    for x in (1336, 1393, 1449):
        s.append(f'<rect x="{x}" y="488" width="51" height="25" fill="#d6d3f0" stroke="#8b85c9" stroke-width="2"/>')
    for y in range(525, 856, 56):
        s.append(f'<rect x="1470" y="{y}" width="27" height="52" fill="#d6d3f0" stroke="#8b85c9" stroke-width="2"/>')
    s.append(label(1334, 960, "ENTRY / EXIT", 14, "lbl-inv-m"))
    # tables
    for (x, y, w, h, t) in [(468, 553, 160, 117, "PLATINUM|TABLE"), (463, 692, 168, 120, "BLACK|TABLE"),
                            (463, 840, 168, 158, "GOLD|TABLE")]:
        s.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{DARK}"/>')
        s.append(label(x + w / 2, y + h / 2 - 6, t, 20, "lbl-inv-m"))
    # bars
    for (x, y, w, h) in [(256, 309, 92, 228), (256, 585, 92, 244), (256, 881, 92, 236),
                         (1514, 309, 92, 228), (1514, 585, 92, 244), (1514, 881, 92, 236),
                         (530, 1116, 224, 102), (824, 1116, 224, 102), (1113, 1116, 225, 102)]:
        s.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="{BAR_FILL}" stroke="{BAR_STROKE}" stroke-width="2"/>')
        s.append(label(x + w / 2, y + h / 2 + 8, "BAR", 20, "lbl"))
    # barricades (pink lines traced from supplied plan)
    for pts in ["612,212 612,472 527,472 527,433", "494,433 494,470 449,470 449,1013 516,1013 516,1082",
                "349,678 645,678", "400,735 449,735", "449,826 645,826", "645,476 645,1113",
                "578,1082 578,1012 645,1012", "745,472 880,472 880,550 977,550 977,472 1117,472",
                "1213,472 1513,472", "1216,476 1216,1028", "333,541 333,581", "333,836 333,876",
                "338,1117 338,1157 398,1157 398,1140", "457,1140 457,1155 527,1155",
                "1512,545 1512,582", "1516,836 1516,874"]:
        s.append(pinkline(pts))
    s.append(label(1365, 461, "BARRICADES", 12, "lbl-s", fill=PINK))
    s.append(label(387, 914, "BRANDS WALL · 30 × 10 FT PER BRAND", 13, "lbl-w", rot=-90))
    s.append(label(980, 1062, "BRANDS EXPERIENCE ZONE · 40 × 10 FT PER BRAND", 16, "lbl-w"))
    s.append(label(1468, 985, "SALES POINT · 20 × 10 FT", 12, "lbl-w", rot=-90))
    # routes
    s.append(route("M1428,1335 L1428,1030 L955,1030 L955,1005", "reg", u))
    s.append(route("M1335,1030 L1335,1004", "reg", u, 6))
    s.append(route("M424,1335 L424,1172 L547,1172 L547,1006", "tbl", u, 7))
    s.append(route("M424,150 L424,262", "tbl", u, 6))
    s.append(label(1435, 1270, "REGULAR ENTRY POINT", 17, "lbl", anchor="start", fill=REG))
    s.append(label(435, 1265, "TABLE ENTRY POINT", 17, "lbl", anchor="start", fill=TBL))
    s.append(step(1428, 1180, 8))
    s.append(step(1100, 1030, 9))
    s.append(step(955, 985, 10))
    s.append(slot_svg("A"))
    s.append("</svg>")
    return "\n".join(s)


# ================================================================ SITE KEY PLAN
def svg_site():
    u = "s"
    s = [f'<svg viewBox="0 0 1600 760" class="plan" role="img" aria-label="Site key plan of Eagle Square with the guest route">',
         arrowdefs(u)]
    # roads
    s.append(f'<rect x="0" y="40" width="1600" height="70" fill="#5b5753"/>')
    s.append(label(800, 84, "ROAD FRONTAGE · MAIN GATE & TABLE CAR ENTRY (gate names to be confirmed with venue)", 17, "lbl-road"))
    s.append(f'<rect x="0" y="650" width="1600" height="70" fill="#5b5753"/>')
    s.append(label(800, 694, "ROAD FRONTAGE · PEDESTRIAN WALK-IN SIDE", 17, "lbl-road"))
    s.append(f'<rect x="20" y="120" width="1560" height="520" rx="10" fill="{SITE}"/>')
    # zone blocks
    zones = [(40, "1", "VALIDATION POINT|& GENERAL PARKING", 450, BLUE, "19 slots · 764 linear ft"),
             (510, "2", "TABLE PARKING|& WALK-IN", 420, GREEN, "11 slots · 493 linear ft"),
             (950, "3", "EVENT ARENA", 610, ORANGE, "19 slots · 620 linear ft")]
    for x, n, t, w, c, sub in zones:
        s.append(f'<rect x="{x}" y="140" width="{w}" height="420" rx="8" fill="{PAPER}" stroke="{c}" stroke-width="6"/>')
        s.append(f'<rect x="{x}" y="140" width="{w}" height="46" rx="8" fill="{c}"/>')
        s.append(label(x + 18, 172, f"ZONE {n}", 22, "lbl-inv", anchor="start"))
        s.append(label(x + w / 2, 300, t, 30, "lbl-big2"))
        s.append(label(x + w / 2, 380, sub, 18, "lbl-m"))
    # arena inner sketch
    s.append(f'<rect x="1130" y="200" width="250" height="40" fill="{STAGE}"/>')
    s.append(label(1255, 227, "MAIN STAGE", 16, "lbl-inv"))
    s.append(label(1255, 440, "WIZKID FC · GA", 16, "lbl-m"))
    # car park sketch
    s.append(f'<rect x="70" y="470" width="390" height="70" rx="6" fill="{SITE2}"/>')
    s.append(label(265, 512, "GENERAL PARKING", 16, "lbl"))
    s.append(f'<rect x="540" y="200" width="360" height="70" rx="6" fill="{SITE2}"/>')
    s.append(label(720, 242, "TABLE CAR PARK", 16, "lbl"))
    # routes
    s.append(route("M265,25 L265,0", "car", u))
    s.append(route("M150,645 L150,545", "car", u, 6))
    s.append(route("M720,112 L720,200", "car", u, 6))
    s.append(route("M265,505 L120,505 L120,420 L330,420 L330,600 L1300,600 L1300,470", "reg", u, 9))
    s.append(route("M720,270 L860,330 L860,610 L1010,610 L1010,500", "tbl", u, 7))
    for x, y, n in [(265, 505, 1), (120, 462, 2), (190, 420, 3), (270, 420, 4), (330, 510, 5), (580, 600, 6),
                    (850, 600, 7), (1180, 600, 8), (1300, 545, 9), (1300, 470, 10)]:
        s.append(step(x, y, n))
    s.append(label(1020, 480, "TABLE ENTRY", 14, "lbl", fill=TBL))
    s.append("</svg>")
    return "\n".join(s)


# ================================================================ tables
def ft_to_m(ft):
    return ft * 0.3048


def slot_rows(zone=None, brand_col=False):
    rows = []
    for s in SLOTS:
        if zone and s["zone"] != zone:
            continue
        w_m, h_m = ft_to_m(s["w"]), ft_to_m(10)
        brand = '<td class="brand-cell"></td>' if brand_col else ""
        rows.append(
            f'<tr data-slot="{s["id"]}"><td><span class="sid sid-{s["zone"]}">{s["id"]}</span></td>'
            f'<td>{s["group"]}<span class="sub">Slot {s["n"]} of {s["of"]}</span></td>'
            f'<td class="num">{s["w"]} × 10 ft<span class="sub">{w_m:.2f} × {h_m:.2f} m</span></td>'
            f'<td class="num">{s["w"]*10:,} ft²<span class="sub">{w_m*h_m:.1f} m²</span></td>'
            + (f'<td>{s["loc"]}</td><td>{s["faces"]}</td>' if not brand_col else "")
            + brand + "</tr>")
    return "\n".join(rows)


def sched_tables():
    rows = slot_rows(brand_col=True).split("\n")
    half = (len(rows) + 1) // 2
    head = '<thead><tr><th>Slot</th><th>Wall</th><th>Size (W × H)</th><th>Face area</th><th>Assigned brand</th></tr></thead>'
    return "".join(f'<div class="tbl-wrap"><table class="slots">{head}<tbody>{"".join(c)}</tbody></table></div>'
                   for c in (rows[:half], rows[half:]))


def zone_table(zone):
    groups = {}
    for x in SLOTS:
        if x["zone"] == zone:
            groups.setdefault(x["group"], []).append(x)
    rows = []
    for g, ss in groups.items():
        f = ss[0]
        ids = f'{ss[0]["id"]}–{ss[-1]["id"]}' if len(ss) > 1 else ss[0]["id"]
        w_m = ft_to_m(f["w"])
        rows.append(
            f'<tr data-slot="{ss[0]["id"]}"><td><span class="sid sid-{zone}">{ids}</span>'
            f'<span class="sub">{len(ss)} brand{"s" if len(ss) > 1 else ""}</span></td>'
            f'<td><b>{g}</b><span class="sub">{f["loc"]}</span><span class="sub">Seen by: {f["faces"]}</span></td>'
            f'<td class="num"><b>{f["w"]} × 10 ft</b><span class="sub">{w_m:.2f} × 3.05 m</span>'
            f'<span class="sub">{f["w"]*10:,} ft² per brand</span></td></tr>')
    return f'''<div class="tbl-wrap"><table class="slots">
<thead><tr><th>Slots</th><th>Wall &amp; position</th><th>Per brand</th></tr></thead>
<tbody>{"".join(rows)}</tbody></table></div>'''


def totals(zone=None):
    ss = [s for s in SLOTS if not zone or s["zone"] == zone]
    return len(ss), sum(s["w"] for s in ss)


# ================================================================ page
def build():
    nv, lv = totals("V")
    nt, lt = totals("T")
    na, la = totals("A")
    n, l = totals()
    html = f'''<title>LOL Festival Brand Placement Plan</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;700&display=swap">
<style>
/* Layout: production drawing set. A title block per sheet, plan on the left, schedule beside or below; one sheet = one printed A3 page. */
:root {{
  --paper: {PAPER}; --ink: {INK}; --muted: #6d6760; --rule: #d8d4cc; --panel: #ffffff;
  --ember: #e4521b; --reg: {REG}; --tbl: {TBL}; --car: {CAR};
  --z-v: {BLUE}; --z-t: {GREEN}; --z-a: {ORANGE}; --pink: {PINK};
  --f-display: "Oswald", "Arial Narrow", "Roboto Condensed", Impact, sans-serif;
  --f-body: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --f-mono: "JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, monospace;
  color-scheme: light;
}}
html, body {{ background: var(--paper); color: var(--ink); }}
body {{ font-family: var(--f-body); font-size: 15px; line-height: 1.5;
  padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); padding-block: 24px 64px; }}
.doc {{ max-width: 1280px; margin: 0 auto; display: grid; gap: 40px; }}
h1, h2, h3 {{ font-family: var(--f-display); font-weight: 600; text-transform: uppercase; letter-spacing: .01em; line-height: 1.05; margin: 0; text-wrap: balance; }}
h1 {{ font-size: clamp(40px, 7vw, 84px); font-weight: 700; }}
h2 {{ font-size: clamp(28px, 3.6vw, 40px); }}
h3 {{ font-size: 20px; }}
p {{ margin: 0; max-width: 68ch; }}
.eyebrow {{ font-family: var(--f-mono); font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); }}
.sheet {{ background: var(--panel); border: 1px solid var(--rule); border-radius: 4px; padding: clamp(16px, 3vw, 36px); display: grid; gap: 24px; min-width: 0; }}
.titleblock {{ display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 12px 32px; border-bottom: 3px solid var(--ink); padding-bottom: 14px; }}
.titleblock .meta {{ display: grid; grid-template-columns: auto auto; gap: 2px 16px; font-family: var(--f-mono); font-size: 12px; color: var(--muted); }}
.titleblock .meta b {{ color: var(--ink); font-weight: 700; }}
.zone-chip {{ display: inline-flex; align-items: center; gap: 8px; font-family: var(--f-mono); font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }}
.zone-chip i {{ width: 26px; height: 10px; border-radius: 2px; display: inline-block; }}

/* cover */
.cover {{ background: var(--ink); color: var(--paper); border: 0; padding: clamp(24px, 5vw, 56px); gap: 28px; }}
.cover .eyebrow {{ color: #bdb6ac; }}
.cover h1 span {{ color: var(--ember); }}
.cover p {{ color: #e7e2da; font-size: 17px; }}
.wave {{ height: 14px; width: 180px; background: radial-gradient(circle at 10px -4px, transparent 9px, var(--ember) 10px 14px, transparent 15px) 0 0/20px 14px repeat-x; }}
.kpis {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1px; background: #3d3833; border: 1px solid #3d3833; }}
.kpi {{ background: var(--ink); padding: 16px 18px; display: grid; gap: 2px; }}
.kpi b {{ font-family: var(--f-display); font-size: 40px; font-weight: 600; line-height: 1; font-variant-numeric: tabular-nums; }}
.kpi span {{ font-size: 13px; color: #bdb6ac; }}

/* legend */
.legend {{ display: flex; flex-wrap: wrap; gap: 10px 22px; font-size: 13px; }}
.legend > span {{ display: inline-flex; align-items: center; gap: 8px; }}
.sw {{ width: 28px; height: 10px; border-radius: 2px; display: inline-block; flex: none; }}
.ln {{ width: 34px; height: 0; border-top: 5px solid; display: inline-block; flex: none; }}
.ln.dot {{ border-top-style: dotted; }} .ln.dash {{ border-top-style: dashed; border-top-width: 4px; }}

/* plans */
.plan-wrap {{ overflow-x: auto; border: 1px solid var(--rule); border-radius: 4px; background: var(--paper); }}
.plan {{ display: block; width: 100%; min-width: 640px; height: auto; font-family: var(--f-display); }}
.plan text {{ font-family: var(--f-display); text-transform: uppercase; }}
.lbl {{ fill: {INK}; font-weight: 600; letter-spacing: .02em; }}
.lbl-s {{ fill: {INK}; font-weight: 500; letter-spacing: .06em; }}
.lbl-m {{ fill: #6d6760; font-weight: 500; letter-spacing: .04em; }}
.lbl-w {{ fill: {INK}; font-weight: 700; letter-spacing: .03em; }}
.lbl-big {{ fill: #fff; font-weight: 700; }}
.lbl-big2 {{ fill: {INK}; font-weight: 700; }}
.lbl-hero {{ fill: #fff; font-weight: 700; }}
.lbl-inv {{ fill: #fff; font-weight: 600; letter-spacing: .04em; }}
.lbl-inv-m {{ fill: #cbc6bf; font-weight: 600; letter-spacing: .03em; }}
.lbl-ga {{ fill: #6b625c; font-weight: 700; letter-spacing: -.01em; }}
.lbl-road {{ fill: #f1eee9; font-weight: 500; letter-spacing: .08em; }}
.pill-t {{ fill: #fff; font-family: var(--f-mono) !important; font-size: 13px; font-weight: 700; text-anchor: middle; text-transform: none; }}
.step-t {{ fill: #fff; font-size: 18px; font-weight: 700; text-anchor: middle; }}
.slot {{ cursor: pointer; outline: none; }}
.slot.on .pill rect, .slot:focus-visible .pill rect {{ fill: var(--ember); }}
.slot.on > rect {{ stroke: var(--ink); stroke-width: 4; }}

.split {{ display: grid; grid-template-columns: minmax(0, 1fr); gap: 20px; }}
.notes {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px 28px; }}
.note h3 {{ font-size: 16px; margin-bottom: 6px; }}
.note p, .note li {{ font-size: 14px; color: #3c3732; }}
.note ul {{ margin: 0; padding-left: 18px; display: grid; gap: 4px; }}

/* journey */
.journey {{ list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; counter-reset: s; }}
.journey li {{ display: grid; grid-template-columns: 34px 1fr; gap: 10px; align-items: start; font-size: 14px; }}
.journey li b {{ display: block; font-weight: 600; }}
.journey .n {{ width: 30px; height: 30px; border-radius: 50%; background: var(--reg); color: #fff; font-family: var(--f-display); font-weight: 700; display: grid; place-items: center; font-size: 15px; }}
.journey.tbl .n {{ background: var(--tbl); }}

/* tables */
.tbl-wrap {{ overflow-x: auto; }}
table.slots {{ width: 100%; border-collapse: collapse; font-size: 13.5px; font-variant-numeric: tabular-nums; }}
.slots th {{ text-align: left; font-family: var(--f-mono); font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); font-weight: 500; padding: 8px 10px; border-bottom: 2px solid var(--ink); white-space: nowrap; }}
.slots td {{ padding: 9px 10px; border-bottom: 1px solid var(--rule); vertical-align: top; }}
.slots td.num {{ white-space: nowrap; }}
.slots .sub {{ display: block; font-size: 12px; color: var(--muted); }}
.slots tr.on td {{ background: #fdeee6; }}
.slots tbody tr {{ cursor: pointer; }}
.sid {{ font-family: var(--f-mono); font-weight: 700; font-size: 13px; padding: 3px 8px; border-radius: 99px; color: var(--ink); white-space: nowrap; }}
.sid-V {{ background: color-mix(in srgb, var(--z-v) 28%, white); }}
.sid-T {{ background: color-mix(in srgb, var(--z-t) 28%, white); }}
.sid-A {{ background: color-mix(in srgb, var(--z-a) 30%, white); }}
.brand-cell {{ min-width: 180px; border-bottom: 1px solid #9c968d !important; }}
.zone-sum {{ display: flex; flex-wrap: wrap; gap: 8px 28px; font-family: var(--f-mono); font-size: 12px; color: var(--muted); }}
.zone-sum b {{ color: var(--ink); }}
.caveat {{ border-left: 4px solid var(--pink); padding: 10px 14px; background: #fff2f7; font-size: 13.5px; }}
.src {{ font-size: 12.5px; color: var(--muted); }}
.src a {{ color: inherit; }}
a {{ color: var(--ember); }}

@media (min-width: 1000px) {{ .split.side {{ grid-template-columns: minmax(0, 1.7fr) minmax(0, 1fr); align-items: start; }} }}
@media (prefers-reduced-motion: no-preference) {{ .slot .pill rect {{ transition: fill .15s; }} }}
@page {{ size: A3 landscape; margin: 10mm; }}
@media print {{
  body {{ padding: 0; background: #fff; font-size: 12px; }}
  .doc {{ max-width: none; gap: 0; }}
  .sheet {{ break-after: page; border: 0; border-radius: 0; padding: 0; gap: 14px; }}
  .sheet:last-child {{ break-after: auto; }}
  .cover {{ padding: 36px; min-height: 255mm; box-sizing: border-box; align-content: space-between; }}
  .plan {{ min-width: 0; }}
  .split.side {{ grid-template-columns: minmax(0, 1.75fr) minmax(0, 1fr); align-items: start; }}
  .split.side p {{ font-size: 12px; }}
  .slots .sub {{ font-size: 10.5px; }}
  .slots td {{ padding: 5px 8px; }}
  .slots {{ font-size: 11.5px; }}
  .no-print {{ display: none; }}
  .print-tight .plan {{ max-height: 238mm; width: 100%; }}
  .site-plan .plan {{ max-height: 150mm; }}
  #site .journey {{ grid-template-columns: repeat(5, 1fr); }}
  #site .journey li {{ font-size: 11px; }}
  #schedule .sched {{ grid-template-columns: 1fr 1fr; }}
  #schedule .slots {{ font-size: 10.5px; }}
  #schedule .slots td {{ white-space: nowrap; }}
  #schedule .slots td:nth-child(2) .sub {{ display: none; }}
  #schedule .slots td {{ padding: 2px 8px; }}
  #schedule .slots .sub {{ display: inline; margin-left: 6px; }}
}}
</style>

<main class="doc">

<!-- ============ COVER ============ -->
<section class="sheet cover">
  <div class="titleblock" style="border-color:#3d3833">
    <div class="eyebrow">Live Out Loud Music Festival 2026 · Partner pack</div>
    <div class="eyebrow">Rev C · issued 11 Nov 2026</div>
  </div>
  <div style="display:grid;gap:18px">
    <div class="wave" aria-hidden="true"></div>
    <h1>Brand placement &amp;<br><span>floor plan</span></h1>
    <p>Eagle Square, Abuja · Sunday 13 December 2026. This pack shows every branding position on site, its size, where it sits and who walks past it. Find your slot code below, then turn to its zone sheet.</p>
  </div>
  <div class="kpis">
    <div class="kpi"><b>{n}</b><span>brand slots</span></div>
    <div class="kpi"><b>3</b><span>branded zones on the guest route</span></div>
    <div class="kpi"><b>{l:,}</b><span>linear feet of brand walls</span></div>
    <div class="kpi"><b>10 ft</b><span>standard height on every wall</span></div>
  </div>
  <div class="legend" style="color:#e7e2da">
    <span><i class="sw" style="background:var(--z-v)"></i>Zone 1 · Validation (blue)</span>
    <span><i class="sw" style="background:var(--z-t)"></i>Zone 2 · Table parking (green)</span>
    <span><i class="sw" style="background:var(--z-a)"></i>Zone 3 · Event arena (orange)</span>
    <span><i class="sw" style="background:var(--pink)"></i>Barricades &amp; barriers</span>
  </div>
</section>

<!-- ============ SITE ============ -->
<section class="sheet" id="site">
  <div class="titleblock">
    <div style="display:grid;gap:6px"><div class="eyebrow">Sheet 01 · Site key plan</div><h2>From the car park to the stage</h2></div>
    <div class="meta"><span>Venue</span><b>Eagle Square, Shehu Shagari Way, Abuja</b><span>Scale</span><b>Schematic, not to scale</b></div>
  </div>
  <div class="plan-wrap site-plan">{svg_site()}</div>
  <div class="legend">
    <span><i class="ln" style="border-color:var(--reg)"></i>Regular guest route</span>
    <span><i class="ln dot" style="border-color:var(--tbl)"></i>Table guest route</span>
    <span><i class="ln dash" style="border-color:var(--car)"></i>Vehicles</span>
    <span><i class="sw" style="background:var(--z-v)"></i>Zone 1</span>
    <span><i class="sw" style="background:var(--z-t)"></i>Zone 2</span>
    <span><i class="sw" style="background:var(--z-a)"></i>Zone 3</span>
  </div>
  <div style="display:grid;gap:12px">
    <h3>Regular guest journey · car park to regular entry point</h3>
    <ol class="journey">
      <li><span class="n">1</span><span><b>Park</b>Cars enter general parking from the road (Zone 1).</span></li>
      <li><span class="n">2</span><span><b>Walk to the entrance</b>Leave the car park by the pedestrian gate (slots V18–V19). The lane shortcut is closed (No Access), so everyone goes round to the walk-in entrance.</span></li>
      <li><span class="n">3</span><span><b>Buy</b>Ticket purchase area: 3 booths and a kiosk (slot V01).</span></li>
      <li><span class="n">4</span><span><b>Validate</b>7 turnstiles at the regular ticket validation point.</span></li>
      <li><span class="n">5</span><span><b>Walk-in corridor</b>Between brands walls V02–V09 and V10–V17.</span></li>
      <li><span class="n">6</span><span><b>Regular walk-in lane</b>Along the walk lane and through the regular walk-in gate into Zone 2 (T01–T08).</span></li>
      <li><span class="n">7</span><span><b>Final approach</b>Past T09–T11 to the arena.</span></li>
      <li><span class="n">8</span><span><b>Regular entry point</b>Arena search and entry (Zone 3).</span></li>
      <li><span class="n">9</span><span><b>Brands Experience Zone</b>Walk west past A09–A16 and the Starboy Marketplace entry (A17–A19 beside it).</span></li>
      <li><span class="n">10</span><span><b>WIZKID FC</b>Into general admission in front of the main stage.</span></li>
    </ol>
    <p class="src">Table guests drive to the table car park, walk through the table walk-in plaza and enter at the Table Entry Point, passing A01–A08 on the way to the Gold, Black and Platinum tables.</p>
  </div>
</section>

<!-- ============ ZONE 1 ============ -->
<section class="sheet" id="zone-1">
  <div class="titleblock">
    <div style="display:grid;gap:6px"><div class="zone-chip"><i style="background:var(--z-v)"></i>Sheet 02 · Zone 1 · Blue walls</div><h2>Validation point &amp; general parking</h2></div>
    <div class="zone-sum"><span><b>{nv}</b> slots</span><span><b>{lv}</b> linear ft</span><span><b>{lv*10:,}</b> ft² of face</span><span>Slots V01–V19</span></div>
  </div>
  <div class="split side print-tight">
    <div class="plan-wrap">{svg_validation()}</div>
    <div style="display:grid;gap:14px;min-width:0">
      <p>The first branded space every regular guest meets. Queues at the ticket booths and turnstiles hold people still for several minutes, so the walls on either side of the walk-in corridor get long viewing time.</p>
      <div class="legend"><span><i class="sw" style="background:var(--z-v)"></i>Brand wall slot</span><span><i class="sw" style="background:#efc9a6"></i>Fixed structure, not for brand use</span><span><i class="ln" style="border-color:var(--reg)"></i>Regular route</span><span><i class="ln dash" style="border-color:var(--car)"></i>Cars</span></div>
      <p class="src">Orange blocks on the supplied validation drawing are existing structures. In this zone only the blue lines are brand space.</p>
      {zone_table("V")}
    </div>
  </div>
</section>

<!-- ============ ZONE 2 ============ -->
<section class="sheet" id="zone-2">
  <div class="titleblock">
    <div style="display:grid;gap:6px"><div class="zone-chip"><i style="background:var(--z-t)"></i>Sheet 03 · Zone 2 · Green walls</div><h2>Table parking &amp; walk-in</h2></div>
    <div class="zone-sum"><span><b>{nt}</b> slots</span><span><b>{lt}</b> linear ft</span><span><b>{lt*10:,}</b> ft² of face</span><span>Slots T01–T11</span></div>
  </div>
  <div class="split side print-tight">
    <div class="plan-wrap">{svg_table()}</div>
    <div style="display:grid;gap:14px;min-width:0">
      <p>The regular walk-in lane runs the full length of this zone, with green brand walls on both sides of its northern run. These are the largest single slots on site: 49 and 50 ft each, read by every regular guest walking from validation to the arena.</p>
      <div class="legend"><span><i class="sw" style="background:var(--z-t)"></i>Brand wall slot</span><span><i class="sw" style="background:var(--pink)"></i>Barricade</span><span><i class="ln" style="border-color:var(--reg)"></i>Regular route</span><span><i class="ln dot" style="border-color:var(--tbl)"></i>Table guests</span></div>
      <p class="src">Table guests park inside the pink barricade line and walk out through the table walk-in plaza (LOL branding block), so they do not cross the regular lane.</p>
      {zone_table("T")}
    </div>
  </div>
</section>

<!-- ============ ZONE 3 ============ -->
<section class="sheet" id="zone-3">
  <div class="titleblock">
    <div style="display:grid;gap:6px"><div class="zone-chip"><i style="background:var(--z-a)"></i>Sheet 04 · Zone 3 · Orange walls</div><h2>Event arena</h2></div>
    <div class="zone-sum"><span><b>{na}</b> slots</span><span><b>{la}</b> linear ft</span><span><b>{la*10:,}</b> ft² of face</span><span>Slots A01–A19</span></div>
  </div>
  <div class="split side print-tight">
    <div class="plan-wrap">{svg_arena()}</div>
    <div style="display:grid;gap:14px;min-width:0">
      <p>Three brand positions inside the arena fence. The Brands Experience Zone (A09–A16) lines the walkway every regular guest takes from the Regular Entry Point into WIZKID FC. The Table Entry Brands Wall (A01–A08) is the premium table-guest audience. The Sales Points (A17–A19) sit beside the Starboy Marketplace stalls for brands that sell on site.</p>
      <div class="legend"><span><i class="sw" style="background:var(--z-a)"></i>Brand slot</span><span><i class="sw" style="background:var(--pink)"></i>Barricades &amp; crash barriers</span><span><i class="sw" style="background:{BAR_FILL};outline:1px solid {BAR_STROKE}"></i>Bar unit</span><span><i class="ln" style="border-color:var(--reg)"></i>Regular route</span><span><i class="ln dot" style="border-color:var(--tbl)"></i>Table guests</span></div>
      {zone_table("A")}
    </div>
  </div>
</section>

<!-- ============ SCHEDULE ============ -->
<section class="sheet" id="schedule">
  <div class="titleblock">
    <div style="display:grid;gap:6px"><div class="eyebrow">Sheet 05 · Allocation schedule</div><h2>All {n} slots</h2></div>
    <div class="zone-sum"><span>Zone 1 <b>{nv}</b></span><span>Zone 2 <b>{nt}</b></span><span>Zone 3 <b>{na}</b></span><span>Total <b>{l:,} ft</b> · <b>{l*10:,} ft²</b></span></div>
  </div>
  <p>The organiser fills in the brand column once contracts are confirmed. Brands: check that the slot code on your contract matches a row here.</p>
  <div class="sched" style="display:grid;gap:8px 28px;min-width:0">{sched_tables()}</div>
</section>

<!-- ============ SPECS ============ -->
<section class="sheet" id="specs">
  <div class="titleblock">
    <div style="display:grid;gap:6px"><div class="eyebrow">Sheet 06 · Artwork &amp; build guide</div><h2>Building on Eagle Square</h2></div>
    <div class="meta"><span>Event</span><b>13 Dec 2026, gates 16:00</b><span>Headline</span><b>Wizkid, 22:00</b></div>
  </div>
  <div class="notes">
    <div class="note"><h3>Artwork</h3><ul>
      <li>Supply artwork at the exact slot size: width × 10 ft high.</li>
      <li>Vector PDF or AI with fonts outlined, CMYK. Raster images at 100 dpi at full size.</li>
      <li>Keep logos and copy inside a 6 in (150 mm) safe margin. Add 2 in (50 mm) bleed.</li>
      <li>Keep key messages above 3 ft from the ground. Crowds block the bottom of each wall.</li>
      <li>Name files with your slot code, e.g. <code>T03_BrandName_50x10.pdf</code>.</li>
    </ul></div>
    <div class="note"><h3>The venue</h3><ul>
      <li>Eagle Square is a concrete parade ground of about 3 ha with about 2 ha of parking, on Shehu Shagari Way in the Central Business District.</li>
      <li>The surface cannot take stakes or anchors. Every frame stands on ballast or weighted bases.</li>
      <li>December is Harmattan season: dry, dusty and gusty. Use wind-permeable mesh on long walls and wind-rated frames.</li>
      <li>The event runs after dark, so light or backlight any wall you want seen after 18:30.</li>
    </ul></div>
    <div class="note"><h3>On site</h3><ul>
      <li>Every pink line on the plans is a barricade line. Do not move, lean on or fix branding to barricades without production sign-off.</li>
      <li>Walls stay inside the slot's footprint. Nothing projects into a walk lane, corridor or crash-barrier zone.</li>
      <li>Activations in the Brands Experience Zone need a separate layout approval: power, staff numbers and footprint depth.</li>
      <li>Build and strike times are issued by production after slots are confirmed.</li>
    </ul></div>
  </div>
  <div class="caveat"><b>Before you print, confirm with production:</b> (1) gate and road names around the site; (2) footprint depth behind each wall and in the Brands Experience Zone; (3) the 80 × 10 ft slots V18–V19, which are drawn shorter than their stated size on the supplied plan; (4) turnstile count (the validation drawing shows 7). All sizes come from the organiser's floor plans. The plans are diagrammatic, so a site survey confirms the final dimensions.</div>
  <p class="src">Venue research: <a href="https://en.wikipedia.org/wiki/Eagle_Square,_Abuja">Eagle Square, Abuja (Wikipedia)</a> · <a href="https://icsc.ohcsf.gov.ng/venue.html">ICSC venue notes, OHCSF</a> · <a href="https://www.riotimesonline.com/wizkid-abuja-eagle-square-concert-2026/">Rio Times, Wizkid at Eagle Square 2026</a>. Plans traced from the organiser's Event Arena, Table Parking and Validation Point drawings.</p>
</section>

</main>
<script>
(() => {{
  const all = (id) => document.querySelectorAll('[data-slot="' + id + '"]');
  let cur = null;
  const set = (id) => {{
    if (cur) all(cur).forEach(e => e.classList.remove('on'));
    cur = id; if (id) all(id).forEach(e => e.classList.add('on'));
  }};
  document.querySelectorAll('[data-slot]').forEach(el => {{
    el.addEventListener('mouseenter', () => set(el.dataset.slot));
    el.addEventListener('focus', () => set(el.dataset.slot));
    el.addEventListener('click', () => {{
      const id = el.dataset.slot;
      const target = el.tagName === 'TR' ? document.querySelector('svg [data-slot="' + id + '"]') : document.querySelector('#' + (id[0]==='V'?'zone-1':id[0]==='T'?'zone-2':'zone-3') + ' tr[data-slot="' + id + '"]');
      set(id);
      if (target) target.scrollIntoView({{ behavior: 'smooth', block: 'center' }});
    }});
  }});
}})();
</script>
'''
    OUT.write_text(html, encoding="utf-8")
    print("wrote", OUT, len(SLOTS), "slots")


if __name__ == "__main__":
    build()
