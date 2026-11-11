#!/usr/bin/env python3
"""LOL Festival 2026 — Brand Placement Plan (clean edition, Rev D).

Styled after the organiser's own floor-plan drawings (source/*.jpg): flat grey
site, dark blocks, condensed caps labels, coloured brand walls, chevron arrows.
All geometry is traced in the pixel space of those drawings (2000 x 1414 px),
so every element sits exactly where the organiser drew it. One coloured
segment on a drawing = one brand slot.

Output: index.html  ->  render with render_pdf.mjs (A3 landscape PDF).
"""
from pathlib import Path

OUT = Path(__file__).parent / "index.html"

# ------------------------------------------------------------ palette (from the drawings)
INK = "#2b2b2b"
SITE = "#e0dfdd"
SITE2 = "#c2c0bb"
BLOCK = "#3a3532"
STAGE = "#595553"
GREY = "#a9a7a4"
PINK = "#ec1e79"
ORANGE = "#f7861d"
GREEN = "#22e03a"
BLUE = "#14d4f0"
BAR = "#bfe6ef"
STRUCT = "#efe7de"
FLOW = "#6b3fd6"     # regular guest flow (the one added colour)
FLOW2 = "#8d8a86"    # vehicles / table guests (secondary)
ZC = {"A": ORANGE, "T": GREEN, "V": BLUE}

# ------------------------------------------------------------ brand slots
SLOTS = []


def add(prefix, start, wall, w, segs, axis, orient, where, pill):
    for i, (a, b) in enumerate(segs):
        SLOTS.append(dict(id=f"{prefix}{start + i:02d}", zone=prefix, wall=wall, w=w,
                          a=a, b=b, axis=axis, orient=orient, where=where, pill=pill))


# Event arena — orange
add("A", 1, "Brands Wall", 30,
    [(690, 742), (746, 799), (802, 855), (859, 912), (916, 969), (973, 1026), (1029, 1081), (1085, 1138)],
    358, "v", "West side, table entry corridor", 64)
add("A", 9, "Brands Experience Zone", 40,
    [(675, 746), (752, 823), (827, 899), (904, 975), (981, 1053), (1057, 1129), (1134, 1206), (1210, 1282)],
    1097, "h", "South of WIZKID FC, on the regular walkway", -26)
add("A", 17, "Brands Sales Point", 20, [(868, 940), (945, 1016), (1024, 1095)],
    1493, "v", "East side, beside Starboy Marketplace", -50)
# Table parking — green
add("T", 1, "Brands Wall", 50, [(285, 356), (362, 432), (439, 509), (515, 585), (591, 662)],
    483, "v", "Regular walk-in lane, west side", 32)
add("T", 6, "Brands Wall", 49, [(295, 376), (383, 464), (472, 553)],
    670, "v", "Regular walk-in lane, east side", -30)
add("T", 9, "Brands Wall", 32, [(683, 818), (830, 965), (977, 1113)],
    483, "v", "Regular walk-in lane, south run", 32)
# Validation point — blue
add("V", 1, "Brands Wall", 36, [(356, 473)], 1073, "v", "Beside ticket kiosk", 60)
add("V", 2, "Brands Wall", 32,
    [(465, 528), (532, 594), (598, 660), (665, 727), (732, 794), (798, 861), (864, 926), (930, 993)],
    657, "v", "Validation corridor, west side", -34)
add("V", 10, "Brands Wall", 39,
    [(470, 547), (553, 630), (635, 712), (718, 795), (801, 879), (884, 961), (965, 1043), (1048, 1126)],
    1052, "v", "Validation corridor, east side", 38)
add("V", 18, "Brands Wall", 80, [(1148, 1213), (1221, 1286)], 613, "v", "Car park pedestrian gate", -34)


# ------------------------------------------------------------ drawing helpers
def T(x, y, s, size=16, color=INK, rot=None, anchor="middle", weight=600, ls=0.5):
    tr = f' transform="rotate({rot} {x} {y})"' if rot is not None else ""
    lines = s.split("|")
    body = lines[0] if len(lines) == 1 else "".join(
        f'<tspan x="{x}" dy="{0 if i == 0 else size * 1.05:.1f}">{l}</tspan>' for i, l in enumerate(lines))
    return (f'<text x="{x}" y="{y}" font-size="{size}" fill="{color}" text-anchor="{anchor}" '
            f'font-weight="{weight}" letter-spacing="{ls}"{tr}>{body}</text>')


def R(x, y, w, h, fill, rx=0, stroke=None, sw=2):
    st = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}"{st}/>'


def PL(pts, color=PINK, w=5):
    return f'<polyline points="{pts}" fill="none" stroke="{color}" stroke-width="{w}"/>'


def chev(x, y, deg, color=INK, size=1.0):
    """Three chevrons side by side, pointing `deg` (0 = up, 90 = right, 180 = down, 270 = left)."""
    paths = "".join(f'<path d="M{dx - 9},7 L{dx},-7 L{dx + 9},7"/>' for dx in (-22, 0, 22))
    return (f'<g transform="translate({x} {y}) rotate({deg}) scale({size})" fill="none" stroke="{color}" '
            f'stroke-width="5" stroke-linejoin="miter" stroke-linecap="butt">{paths}</g>')


def walkline(d, color=FLOW):
    return f'<path d="{d}" fill="none" stroke="{color}" stroke-width="4" stroke-dasharray="3 9" stroke-linecap="round"/>'


def slots_svg(zone):
    out, c = [], ZC[zone]
    for s in (x for x in SLOTS if x["zone"] == zone):
        if s["orient"] == "v":
            out.append(R(s["axis"] - 5, s["a"], 10, s["b"] - s["a"], c, 1))
            px, py = s["axis"] + s["pill"], (s["a"] + s["b"]) / 2
        else:
            out.append(R(s["a"], s["axis"] - 5, s["b"] - s["a"], 10, c, 1))
            px, py = (s["a"] + s["b"]) / 2, s["axis"] + s["pill"]
        out.append(R(px - 21, py - 10, 42, 20, "#ffffff", 10, c, 2.5))
        out.append(f'<text x="{px}" y="{py + 5}" font-size="13" text-anchor="middle" fill="{INK}" '
                   f'font-family="Inter, Arial, sans-serif" font-weight="700">{s["id"]}</text>')
    return "".join(out)


# ------------------------------------------------------------ zone drawings (inner SVG, source coords)
ARENA_BOX = (190, 160, 1530, 1190)      # x, y, w, h
TABLE_BOX = (350, 200, 1370, 1110)
VALID_BOX = (360, 245, 1350, 1095)


def draw_arena():
    s = [R(206, 211, 1484, 1112, SITE, 6), R(494, 316, 874, 694, GREY)]
    s += [f'<line x1="350" y1="311" x2="1507" y2="311" stroke="{INK}" stroke-width="7"/>',
          PL("1388,212 1488,212 1488,311", INK, 7), PL("370,212 478,212", INK, 9)]
    s += [T(424, 196, "PLATINUM ACCESS GATE", 15), T(929, 200, "FENCE", 20), T(1440, 196, "TALENT ENTRANCE", 15),
          T(1567, 265, "POWER SUPPLY AREA", 14), T(1060, 294, "GREEN ROOM", 15)]
    for x in (852, 958, 1065, 1172):
        s += [R(x, 220, 100, 50, "#c9f2cf", 0, "#4cc35e", 3),
              f'<path d="M{x},220 L{x + 100},270 M{x + 100},220 L{x},270" stroke="#4cc35e" stroke-width="2"/>']
    s += [R(744, 386, 373, 84, STAGE), T(930, 440, "MAIN STAGE", 30, "#f1f0ee", weight=700),
          f'<line x1="624" y1="470" x2="744" y2="470" stroke="#fff" stroke-width="6"/>',
          f'<line x1="1117" y1="470" x2="1213" y2="470" stroke="#fff" stroke-width="6"/>',
          T(690, 460, "SCREEN 12M", 11), T(1160, 460, "SCREEN 12M", 11)]
    s += [R(648, 476, 565, 522, BLOCK), R(889, 465, 79, 80, STAGE), T(928, 505, "RUNWAY", 13, "#ddd", rot=90),
          R(904, 550, 48, 200, PINK), T(928, 650, "CRASH BARRIERS", 14, "#3a0a20", rot=90),
          R(893, 749, 73, 37, "#f4a9c9", 0, PINK, 3), T(929, 775, "FOH", 18),
          T(930, 915, "WIZKID FC", 104, "#6e645d", weight=700, ls=0)]
    s += [R(1221, 480, 226, 515, BLOCK), T(1334, 715, "STARBOY|MARKETPLACE", 30, "#8a837d", weight=700),
          T(1336, 958, "ENTRY/EXIT", 15, "#ffffff")]
    for x in (1336, 1393, 1449):
        s.append(R(x, 488, 51, 25, "#d8d5f1", 0, "#8c86cc", 2))
    for y in range(525, 856, 56):
        s.append(R(1470, y, 27, 52, "#d8d5f1", 0, "#8c86cc", 2))
    for x, y, w, h, t in [(468, 553, 160, 117, "PLATINUM|TABLE"), (463, 692, 168, 120, "BLACK|TABLE"),
                          (463, 840, 168, 158, "GOLD|TABLE")]:
        s += [R(x, y, w, h, BLOCK), T(x + w / 2, y + h / 2 - 6, t, 22, "#8a837d", weight=700)]
    for x, y, w, h in [(256, 309, 92, 228), (256, 585, 92, 244), (256, 881, 92, 236),
                       (1514, 309, 92, 228), (1514, 585, 92, 244), (1514, 881, 92, 236),
                       (530, 1116, 224, 102), (824, 1116, 224, 102), (1113, 1116, 225, 102)]:
        s += [R(x, y, w, h, BAR, 6), T(x + w / 2, y + h / 2 + 8, "BAR", 20, "#5b8f9c")]
    for pts in ["612,212 612,472 527,472 527,433", "494,433 494,470 449,470 449,1013 516,1013 516,1082",
                "349,678 645,678", "400,735 449,735", "449,826 645,826", "645,476 645,1113",
                "578,1082 578,1012 645,1012", "745,472 880,472 880,550 977,550 977,472 1117,472",
                "1213,472 1513,472", "1216,476 1216,1028", "333,541 333,581", "333,836 333,876",
                "338,1117 338,1157 398,1157 398,1140", "457,1140 457,1155 527,1155",
                "1512,545 1512,582", "1516,836 1516,874"]:
        s.append(PL(pts))
    s += [T(1365, 462, "B A R R I C A D E S", 12),
          T(392, 914, "BRANDS WALL  30 BY 10 FEET PER BRAND", 15, rot=-90, weight=700),
          T(980, 1052, "BRANDS EXPERIENCE ZONE  40 BY 10 FEET PER BRAND", 19, weight=700),
          T(1474, 982, "BRANDS SALES POINT  20 BY 10 FEET PER BRAND", 11, rot=-90, weight=700)]
    # flow
    s += [walkline("M1428,1300 L1428,1028 L940,1028 L940,1000"),
          chev(1428, 1180, 0, FLOW), chev(1360, 1028, 270, FLOW), chev(1100, 1028, 270, FLOW),
          chev(938, 975, 0, "#ffffff", 0.8),
          T(1428, 1218, "REGULAR ENTRY POINT", 17, FLOW, weight=700),
          chev(424, 1180, 0, FLOW2), T(430, 1218, "TABLE ENTRY POINT", 17, weight=700),
          chev(545, 1072, 0, FLOW2, 0.7), chev(424, 245, 180, FLOW2),
          chev(1336, 930, 180, "#ffffff", 0.7), chev(1336, 982, 0, "#ffffff", 0.7)]
    s.append(slots_svg("A"))
    return "".join(s)


def draw_table():
    s = [R(668, 286, 1010, 366, SITE2), PL("670,286 1015,286"), PL("1127,289 1470,289 1470,643 681,643"),
         T(1110, 470, "TABLE|PARKING", 64, "#ffffff", weight=700, ls=0), T(1070, 318, "TABLE CAR|ENTRANCE", 18)]
    s += [R(668, 683, 1010, 389, SITE), T(1105, 958, "TABLE WALK IN", 38, weight=700),
          R(667, 790, 6, 278, INK), R(711, 912, 162, 138, "#4a4a4a", 8), T(690, 930, "LOL BRANDING", 15, rot=-90),
          PL("670,1070 670,1165"), R(668, 1160, 902, 130, SITE)]
    for x in (691, 1242):
        s += [R(x, 1187, 212, 85, BAR, 5), T(x + 106, 1240, "BAR", 22, "#5b8f9c")]
    s += [R(969, 1187, 212, 85, "#4a4a4a", 5), PL("882,1186 980,1186"), PL("1170,1186 1267,1186"),
          R(368, 1120, 120, 6, INK, 3)]
    for x0, x1, y in [(503, 655, 284), (492, 535, 680), (616, 662, 680)]:
        s.append(R(x0, y - 6, x1 - x0, 12, "#ffffff", 0, INK, 2))
        s += [R(x, y - 6, 6, 12, INK) for x in range(x0 + 4, x1 - 4, 12)]
    s += [T(580, 236, "REGULAR|WALK IN", 18, weight=700),
          T(447, 475, "BRANDS WALL  50 BY 10 FEET PER BRAND", 15, rot=-90, weight=700),
          T(700, 425, "BRANDS WALL  49 BY 10 FEET PER BRAND", 12, rot=-90, weight=700),
          T(447, 898, "BRANDS WALL  32 BY 10 FEET PER BRAND", 15, rot=-90, weight=700),
          T(580, 885, "REGULAR|WALK IN", 18, weight=700), T(580, 1085, "REGULAR|WALK IN", 18, weight=700)]
    # flow
    s += [walkline("M580,200 L580,1300")]
    s += [chev(580, y, 180, FLOW) for y in (330, 500, 800, 995, 1270)]
    s += [chev(1068, 255, 180, FLOW2), chev(694, 598, 270, FLOW2, 0.7), chev(765, 735, 90, FLOW2, 0.7),
          chev(1105, 1012, 180, FLOW2), chev(1284, 1115, 90, FLOW2, 0.7), chev(1530, 1115, 90, FLOW2, 0.7),
          T(1410, 1108, "TABLE|WALK IN", 18, weight=700), chev(1645, 1220, 180, FLOW2),
          T(1645, 1128, "TABLE|WALK IN", 18, weight=700), T(730, 600, "TABLE|WALK IN", 14, rot=90, weight=700)]
    s.append(slots_svg("T"))
    return "".join(s)


def draw_valid():
    s = [R(491, 267, 1079, 755, SITE2)]
    for x, y, w, h in [(512, 276, 222, 67), (1111, 280, 426, 27), (501, 435, 145, 560)]:
        s.append(R(x, y, w, h, STRUCT, 4, "#cdbfae", 2))
    s += [R(735, 351, 323, 8, INK, 3), T(896, 336, "B R A N D I N G", 17, weight=700),
          R(1004, 370, 33, 57, "#111"), T(905, 412, "TICKET PURCHASE AREA", 20, "#8b8781", weight=700)]
    s += [R(x, 440, 83, 25, STAGE, 5) for x in (663, 810, 973)]
    s += [T(905, 555, "REGULAR TICKET|VALIDATION POINT", 32, "#ffffff", weight=700, ls=0)]
    s += [R(x, 637, 23, 29, BLOCK) for x in (724, 767, 810, 852, 894, 938, 983)]
    s += [R(1064, 483, 57, 467, STAGE, 5), T(905, 900, "REGULAR|WALK IN", 22, "#f2f1ee", weight=700),
          R(491, 1022, 1079, 100, "#ffffff"), R(485, 1027, 27, 116, PINK),
          T(452, 1085, "NO ACCESS", 20, rot=-90, weight=700),
          R(485, 1147, 121, 141, SITE2), R(738, 1122, 832, 164, SITE2), R(749, 1141, 161, 131, STAGE, 5),
          T(1260, 1200, "GENERAL PARKING", 26, "#ffffff", weight=700),
          PL("749,1297 1092,1297"), PL("1203,1299 1546,1299"),
          T(686, 728, "BRANDS WALL  32 BY 10 FEET PER BRAND", 15, rot=-90, weight=700),
          T(1030, 795, "BRANDS WALL  39 BY 10 FEET PER BRAND", 15, rot=-90, weight=700),
          T(1100, 414, "36 BY 10 FEET", 14, rot=-90, weight=700),
          T(634, 1218, "80 BY 10 FEET PER BRAND", 11, rot=-90, weight=700)]
    # flow
    s += [walkline("M1000,1215 L672,1215 L672,1318 L410,1318 L410,398 L778,398 L778,1072 L1570,1072")]
    s += [chev(1155, 1265, 0, FLOW2), T(1155, 1330, "CAR ENTRY", 16, weight=700),
          chev(1660, 1072, 270, FLOW2), T(1620, 1135, "TABLE CAR|ENTRY/EXIT", 15, weight=700),
          chev(840, 1215, 270, FLOW), chev(410, 1050, 0, FLOW), chev(410, 700, 0, FLOW),
          chev(460, 398, 90, FLOW), T(375, 470, "WALK IN|ENTRANCE", 17, rot=-90, weight=700),
          chev(778, 600, 180, FLOW, 0.8), chev(778, 790, 180, FLOW), chev(1250, 1072, 90, FLOW),
          chev(1480, 1072, 90, FLOW), T(1340, 1110, "REGULAR WALK IN", 16, FLOW, weight=700)]
    s.append(slots_svg("V"))
    return "".join(s)


def svg(box, inner, label):
    x, y, w, h = box
    return (f'<svg viewBox="{x} {y} {w} {h}" class="plan" role="img" aria-label="{label}" '
            f'font-family="Oswald, \'Arial Narrow\', sans-serif">{inner}</svg>')


# ------------------------------------------------------------ combined site plan
def combined():
    """Full site construct (organiser's combined plan), drawn upright in its own pixel space.
    Arena detail drawing sits rotated 90 deg clockwise on site; validation and table
    parking drawings sit rotated 90 deg anticlockwise."""
    S = 0.4

    def cw(x, y):                      # arena drawing -> site
        return 1742.4 - S * y, 160.8 + S * x

    def cw_rect(x, y, w, h):
        X1, Y1 = cw(x, y + h)
        return X1, Y1, h * S, w * S

    def cw_pts(pts):
        out = []
        for p in pts.split():
            x, y = map(float, p.split(","))
            X, Y = cw(x, y)
            out.append(f"{X:.1f},{Y:.1f}")
        return " ".join(out)

    def RR(t, fill, rx=0, stroke=None, sw=1.5):
        return R(round(t[0], 1), round(t[1], 1), round(t[2], 1), round(t[3], 1), fill, rx, stroke, sw)

    def wall(zone, x0, x1, y=None, x=None):
        """Draw one zone wall's slots evenly along a construct line (horizontal if y given)."""
        ss = [s for s in SLOTS if s["zone"] == zone and x0[0] <= int(s["id"][1:]) <= x0[1]]
        a, b = x1
        n, g = len(ss), 3
        L = (b - a - g * (n - 1)) / n
        out = []
        for i in range(n):
            p = a + i * (L + g)
            if y is not None:
                out.append(R(round(p, 1), y - 4, round(L, 1), 8, ZC[zone], 1))
            else:
                out.append(R(x - 4, round(p, 1), 8, round(L, 1), ZC[zone], 1))
        return "".join(out)

    def tag(x, y, code, size, zone, rot=None):
        tr = f' transform="rotate({rot} {x} {y})"' if rot is not None else ""
        return (f'<g{tr}>{R(x - 46, y - 17, 92, 34, "#ffffff", 5, ZC[zone], 3)}'
                f'<text x="{x}" y="{y - 2}" font-size="13" text-anchor="middle" font-weight="700" fill="{INK}" '
                f'font-family="Inter, Arial, sans-serif">{code}</text>'
                f'<text x="{x}" y="{y + 12}" font-size="11" text-anchor="middle" fill="{INK}" '
                f'font-family="Inter, Arial, sans-serif">{size}</text></g>')

    o = []
    # roads
    RD = "#7a7876"
    o += [R(219, 60, 52, 972, RD), R(1683, 62, 52, 972, RD), R(271, 182, 1471, 52, RD), R(271, 852, 1412, 53, RD),
          R(271, 234, 1412, 618, "#ffffff"),
          T(1077, 218, "HOSPITAL AVE.", 30, "#ffffff", weight=700, ls=1),
          T(1058, 889, "UNITY ROAD", 30, "#ffffff", weight=700, ls=1),
          T(245, 560, "3RD AVENUE ROAD", 28, "#ffffff", rot=-90, weight=700, ls=1),
          T(1709, 560, "KUKWARA ROAD", 28, "#ffffff", rot=90, weight=700, ls=1)]
    # entrances
    o += [T(552, 150, "MAIN ENTRANCE", 30, weight=700), T(552, 172, "Table cars & general parking", 15, "#77736e", weight=500),
          '<path d="M660,145 C700,120 735,135 735,170" fill="none" stroke="#2b2b2b" stroke-width="3"/>',
          chev(733, 196, 180, INK, 0.75),
          T(560, 985, "PEDESTRIAN ENTRANCE", 30, weight=700), T(560, 1007, "Walk-in entrance for all regular guests", 15, "#77736e", weight=500),
          '<path d="M420,985 C370,990 350,960 360,925" fill="none" stroke="#2b2b2b" stroke-width="3"/>']

    # ---------------- validation point
    o += [R(280, 241, 422, 604, SITE2)]
    for r in [(287, 260, 15, 237), (284, 710, 38, 122), (373, 757, 314, 83)]:
        o.append(R(*r, STRUCT, 4, "#cdbfae", 2))
    o += [R(400, 492, 262, 33, STAGE, 4), R(337, 540, 33, 18, "#111"),
          R(326, 529, 6, 178, INK), T(316, 620, "LOL BRANDING", 12, rot=-90, weight=700)]
    o += [R(376, y, 15, 45, STAGE, 3) for y in (530, 620, 702)]
    o += [R(486, y, 17, 15, BLOCK) for y in range(536, 737, 25)]
    o += [T(355, 790, "TICKET|PURCHASE", 13, weight=700),
          T(590, 682, "REGULAR TICKET|VALIDATION POINT", 22, "#ffffff", weight=700, ls=0),
          T(490, 375, "VALIDATION POINT", 22, "#8b8781", weight=700)]
    # lane + general parking
    o += [R(702, 241, 57, 604, "#ffffff"), R(705, 835, 65, 13, PINK), T(737, 930, "NO ACCESS", 14, PINK, weight=700),
          R(759, 241, 91, 464, SITE2), R(769, 611, 73, 90, STAGE, 4),
          T(805, 390, "GENERAL|PARKING", 17, "#ffffff", weight=700),
          R(772, 780, 78, 68, SITE2), R(772, 773, 78, 5, INK)]
    # ---------------- table parking + table walk-in
    o += [R(852, 242, 166, 455, SITE2), PL("854,336 854,492"), PL("854,540 854,692"), PL("854,336 1015,336 1015,692"),
          T(935, 440, "TABLE|PARKING", 28, "#ffffff", weight=700, ls=0),
          T(880, 520, "TABLE CAR|ENTRANCE", 11, weight=700, anchor="start"),
          R(1032, 242, 175, 455, SITE), R(1135, 605, 62, 72, "#4a4a4a", 6), T(1166, 647, "LOL", 16, "#ffffff", weight=700),
          T(1110, 420, "TABLE|WALK IN", 24, weight=700),
          PL("1207,696 1240,696")]
    for x0, x1, y in [(852, 852, 0), (1030, 1030, 0)]:
        o += [R(x0 - 5, yy, 10, 4, INK) for yy in range(703, 776, 8)]
    o += [R(853, 780, 4, 52, INK), R(1228, 780, 4, 50, INK)]
    # ---------------- arena (arena drawing mapped 90 deg clockwise)
    o.append(RR(cw_rect(206, 211, 1484, 1112), SITE, 4))
    o.append(RR(cw_rect(494, 316, 874, 694), GREY))
    o.append(RR(cw_rect(744, 386, 373, 84), STAGE))
    o.append(RR(cw_rect(648, 476, 565, 522), BLOCK))
    o.append(RR(cw_rect(889, 465, 79, 80), STAGE))
    o.append(RR(cw_rect(904, 550, 48, 200), PINK))
    o.append(RR(cw_rect(893, 749, 73, 37), "#f4a9c9", 0, PINK, 2))
    o.append(RR(cw_rect(1221, 480, 226, 515), BLOCK))
    for x in (1336, 1393, 1449):
        o.append(RR(cw_rect(x, 488, 51, 25), "#d8d5f1", 0, "#8c86cc", 1))
    for y in range(525, 856, 56):
        o.append(RR(cw_rect(1470, y, 27, 52), "#d8d5f1", 0, "#8c86cc", 1))
    for x, y, w, h in [(468, 553, 160, 117), (463, 692, 168, 120), (463, 840, 168, 158)]:
        o.append(RR(cw_rect(x, y, w, h), BLOCK))
    bars = [(256, 309, 92, 228, "B"), (256, 585, 92, 244, "H"), (256, 881, 92, 236, "B"),
            (1514, 309, 92, 228, "B"), (1514, 585, 92, 244, "H"), (1514, 881, 92, 236, "B"),
            (530, 1116, 224, 102, "B"), (824, 1116, 224, 102, "OVERFLOW"), (1113, 1116, 225, 102, "B")]
    for x, y, w, h, t in bars:
        X, Y, W_, H_ = cw_rect(x, y, w, h)
        if t == "OVERFLOW":
            o += [R(round(X, 1), round(Y, 1), round(W_, 1), round(H_, 1), BLOCK, 4),
                  T(X + W_ / 2, Y + H_ / 2, "CROWD OVERFLOW", 12, ORANGE, rot=-90, weight=700)]
        else:
            o += [R(round(X, 1), round(Y, 1), round(W_, 1), round(H_, 1), BAR, 4),
                  T(X + W_ / 2, Y + H_ / 2 + 6, t, 17, "#5b8f9c", weight=700)]
    for x in (852, 958, 1065, 1172):
        o.append(RR(cw_rect(x, 220, 100, 50), "#c9f2cf", 0, "#4cc35e", 2))
    o.append(f'<polyline points="{cw_pts("350,311 1507,311")}" fill="none" stroke="{INK}" stroke-width="3"/>')
    for pts in ["612,212 612,472 527,472 527,433", "494,433 494,470 449,470 449,1013 516,1013 516,1082",
                "349,678 645,678", "400,735 449,735", "449,826 645,826", "645,476 645,1113",
                "578,1082 578,1012 645,1012", "745,472 880,472 880,550 977,550 977,472 1117,472",
                "1213,472 1513,472", "1216,476 1216,1028", "333,541 333,581", "333,836 333,876",
                "338,1117 338,1157 398,1157 398,1140", "457,1140 457,1155 527,1155",
                "1512,545 1512,582", "1516,836 1516,874"]:
        o.append(f'<polyline points="{cw_pts(pts)}" fill="none" stroke="{PINK}" stroke-width="2.5"/>')
    o += [T(1447, 612, "WIZKID FC", 36, "#6e645d", weight=700, ls=0),
          T(1572, 533, "MAIN STAGE", 13, "#ffffff", rot=-90, weight=700),
          T(1447, 690, "STARBOY|MARKETPLACE", 15, "#a39b94", weight=700),
          T(1373, 375, "GOLD", 11, "#a39b94", weight=700), T(1441, 375, "BLACK", 11, "#a39b94", weight=700),
          T(1497, 375, "PLAT.", 11, "#a39b94", weight=700),
          T(1610, 386, "GREEN ROOM ×4", 10, rot=90, weight=600, anchor="start"),
          T(1668, 340, "PLATINUM GATE", 10, rot=90, weight=700),
          T(1668, 740, "TALENT ENTRANCE", 10, rot=90, weight=700),
          T(1668, 805, "POWER", 10, rot=90, weight=700),
          T(1232, 330, "TABLE ENTRY", 12, rot=-90, weight=700),
          T(1238, 738, "REGULAR ENTRY", 12, FLOW, rot=-90, weight=700),
          R(1248, 846, 30, 10, PINK), T(1263, 930, "NO ACCESS", 14, PINK, weight=700)]

    # ---------------- brand walls (each slot drawn; one tag per wall)
    o += [wall("V", (10, 17), (380, 755), y=529), wall("V", (2, 9), (377, 697), y=752),
          wall("V", (1, 1), (334, 374), y=529), wall("V", (18, 19), (775, 849), y=775),
          wall("T", (1, 5), (857, 1016), y=780), wall("T", (6, 8), (857, 958), y=696),
          wall("T", (9, 11), (1034, 1226), y=780)]
    # arena walls mapped from the detail drawing
    for s in SLOTS:
        if s["zone"] != "A":
            continue
        if s["orient"] == "v":
            X1, Y1 = cw(s["axis"], s["b"])
            X2, _ = cw(s["axis"], s["a"])
            o.append(R(round(X1, 1), round(Y1 - 4, 1), round(X2 - X1, 1), 8, ORANGE, 1))
        else:
            X1, Y1 = cw(s["a"], s["axis"])
            _, Y2 = cw(s["b"], s["axis"])
            o.append(R(round(X1 - 4, 1), round(Y1, 1), 8, round(Y2 - Y1, 1), ORANGE, 1))
    o += [tag(600, 552, "V10–V17", "39 × 10 ft", "V"), tag(537, 780, "V02–V09", "32 × 10 ft", "V"),
          tag(352, 508, "V01", "36 × 10 ft", "V"), tag(811, 813, "V18–V19", "80 × 10 ft", "V"),
          tag(936, 815, "T01–T05", "50 × 10 ft", "T"), tag(907, 668, "T06–T08", "49 × 10 ft", "T"),
          tag(1131, 815, "T09–T11", "32 × 10 ft", "T"),
          tag(1376, 326, "A01–A08", "30 × 10 ft", "A"), tag(1276, 646, "A09–A16", "40 × 10 ft", "A", rot=-90),
          tag(1348, 822, "A17–A19", "20 × 10 ft", "A"),
          f'<line x1="1348" y1="762" x2="1348" y2="805" stroke="{ORANGE}" stroke-width="2"/>']

    # ---------------- flow
    o.append(f'<path d="M805,705 L805,875 L352,875 L352,597 L730,597 L730,738 L1331,738 L1331,537 L1342,537" '
             f'fill="none" stroke="{FLOW}" stroke-width="4" stroke-dasharray="3 8" stroke-linecap="round"/>')
    o.append(f'<path d="M975,650 L990,712 L1045,712 L1045,330 L1255,330" fill="none" stroke="{FLOW2}" '
             f'stroke-width="3" stroke-dasharray="2 7" stroke-linecap="round"/>')
    o += [chev(805, 742, 180, FLOW, 0.6), chev(600, 875, 270, FLOW, 0.6), chev(352, 700, 0, FLOW, 0.6),
          chev(430, 597, 90, FLOW, 0.6), chev(640, 597, 90, FLOW, 0.6), chev(730, 680, 180, FLOW, 0.6),
          chev(930, 738, 90, FLOW, 0.6), chev(1120, 738, 90, FLOW, 0.6), chev(1331, 640, 0, FLOW, 0.5),
          chev(732, 300, 180, FLOW2, 0.6), chev(732, 460, 180, FLOW2, 0.6), chev(832, 516, 90, FLOW2, 0.5),
          chev(1045, 520, 0, FLOW2, 0.5), chev(1160, 330, 90, FLOW2, 0.5)]
    return (f'<svg viewBox="200 110 1560 935" class="plan" role="img" aria-label="Combined site plan of Eagle Square" '
            f'font-family="Oswald, \'Arial Narrow\', sans-serif">{"".join(o)}</svg>')


# ------------------------------------------------------------ tables
def grouped(zone):
    groups = {}
    for s in SLOTS:
        if s["zone"] == zone:
            groups.setdefault((s["w"], s["where"]), []).append(s)
    rows = []
    for (w, where), ss in groups.items():
        codes = ss[0]["id"] if len(ss) == 1 else f'{ss[0]["id"]}–{ss[-1]["id"]}'
        rows.append(f'<tr><td><span class="code c-{zone}">{codes}</span></td><td>{where}</td>'
                    f'<td class="r"><b>{w} × 10 ft</b></td><td class="r">{len(ss)}</td></tr>')
    n = sum(len(v) for v in groups.values())
    return (f'<table class="t"><thead><tr><th>Slots</th><th>Location</th><th class="r">Size per brand</th>'
            f'<th class="r">Brands</th></tr></thead><tbody>{"".join(rows)}</tbody>'
            f'<tfoot><tr><td colspan="3">Total</td><td class="r">{n}</td></tr></tfoot></table>')


def schedule(zone, title):
    rows = "".join(f'<tr><td><span class="code c-{zone}">{s["id"]}</span></td><td>{s["w"]} × 10 ft</td>'
                   f'<td class="blank"></td></tr>' for s in SLOTS if s["zone"] == zone)
    return (f'<div class="sch"><h3><i class="sw" style="background:{ZC[zone]}"></i>{title}</h3>'
            f'<table class="t"><thead><tr><th>Slot</th><th>Size</th><th>Brand</th></tr></thead>'
            f'<tbody>{rows}</tbody></table></div>')


def key(extra=""):
    return f'''<div class="key">
  <span><i class="sw" style="background:{ORANGE}"></i>Brand space · Event arena</span>
  <span><i class="sw" style="background:{GREEN}"></i>Brand space · Table parking</span>
  <span><i class="sw" style="background:{BLUE}"></i>Brand space · Validation point</span>
  <span><i class="sw" style="background:{PINK}"></i>Barricades &amp; barriers</span>
  <span><svg width="40" height="14" viewBox="-27 -8 54 16" aria-hidden="true">{chev(0, 0, 0, FLOW, 0.7)}</svg>Regular guest flow</span>
  <span><svg width="40" height="14" viewBox="-27 -8 54 16" aria-hidden="true">{chev(0, 0, 0, FLOW2, 0.7)}</svg>Cars &amp; table guests</span>{extra}
</div>'''


ORIENT = {
    "A": "On site this plan is turned a quarter-turn: Hospital Avenue is on its left, Unity Road on its right and the stage faces Kukwara Road. See the combined site plan.",
    "T": "On site this plan is turned a quarter-turn: Hospital Avenue is on its right, Unity Road on its left and the arena is below it. See the combined site plan.",
    "V": "On site this plan is turned a quarter-turn: Hospital Avenue is on its right, Unity Road (pedestrian entrance) on its left and 3rd Avenue Road at the top. See the combined site plan.",
}


def zone_page(num, title, sub, plan, zone):
    n = sum(1 for s in SLOTS if s["zone"] == zone)
    return f'''<section class="page">
  <header><h2>{title}</h2><p class="meta">{sub} · {n} brand slots · Sheet {num} of 6</p></header>
  <div class="zone">
    <div class="plan-box">{plan}</div>
    <aside>{grouped(zone)}<p class="small"><b>Orientation.</b> {ORIENT[zone]}</p><p class="small">Sizes are width × height. Each slot is one brand. Find your slot code on the plan.</p></aside>
  </div>
</section>'''


def build():
    n = len(SLOTS)
    lin = sum(s["w"] for s in SLOTS)
    cnt = {z: sum(1 for s in SLOTS if s["zone"] == z) for z in "ATV"}
    html = f'''<title>LOL Festival Brand Placement Plan</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap">
<style>
/* Layout: one A3 landscape sheet per page, styled like the organiser's floor-plan drawings. */
:root {{
  --paper: #ffffff; --ink: {INK}; --muted: #77736e; --rule: #e3e1dd; --ground: #f1f0ee;
  --display: "Oswald", "Arial Narrow", "Roboto Condensed", sans-serif;
  --body: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color-scheme: light;
}}
html, body {{ background: var(--ground); color: var(--ink); }}
body {{ font-family: var(--body); font-size: 15px; line-height: 1.45; padding-block: 24px 48px;
  padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }}
.doc {{ max-width: 1320px; margin: 0 auto; display: grid; gap: 28px; }}
.page {{ background: var(--paper); padding: clamp(18px, 3.5vw, 44px); display: grid; gap: 22px; align-content: start; min-width: 0; }}
h1, h2, h3 {{ font-family: var(--display); text-transform: uppercase; margin: 0; line-height: 1; letter-spacing: .005em; }}
h1 {{ font-size: clamp(44px, 7vw, 92px); font-weight: 700; }}
h2 {{ font-size: clamp(30px, 4vw, 46px); font-weight: 700; }}
h3 {{ font-size: 19px; font-weight: 600; display: flex; align-items: center; gap: 10px; }}
header {{ display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 6px 24px; }}
.meta {{ margin: 0; color: var(--muted); font-size: 14px; }}
.plan {{ display: block; width: 100%; height: auto; }}
.plan-box {{ min-width: 0; }}
.zone {{ display: grid; gap: 24px; grid-template-columns: minmax(0, 1fr); }}
@media (min-width: 980px) {{ .zone {{ grid-template-columns: minmax(0, 2.4fr) minmax(250px, 1fr); align-items: start; }} }}
aside {{ display: grid; gap: 14px; min-width: 0; }}
.small {{ font-size: 13px; color: var(--muted); margin: 0; }}
.sw {{ width: 26px; height: 9px; display: inline-block; flex: none; }}
.key {{ display: flex; flex-wrap: wrap; gap: 10px 26px; font-size: 13.5px; }}
.key span {{ display: inline-flex; align-items: center; gap: 8px; }}
.t {{ width: 100%; border-collapse: collapse; font-size: 14px; font-variant-numeric: tabular-nums; }}
.t th {{ text-align: left; font-size: 11px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); padding: 6px 8px; border-bottom: 2px solid var(--ink); }}
.t td {{ padding: 9px 8px; border-bottom: 1px solid var(--rule); vertical-align: middle; }}
.t tfoot td {{ font-weight: 700; border-bottom: 0; }}
.t .r {{ text-align: right; white-space: nowrap; }}
.code {{ font-weight: 700; white-space: nowrap; padding: 2px 8px; border-radius: 99px; border: 2px solid; }}
.c-A {{ border-color: {ORANGE}; }} .c-T {{ border-color: {GREEN}; }} .c-V {{ border-color: {BLUE}; }}
.blank {{ width: 55%; border-bottom: 1px solid #a8a49e !important; }}
.tiles {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }}
.tile {{ border-top: 6px solid; padding-top: 12px; display: grid; gap: 4px; }}
.tile b {{ font-family: var(--display); font-size: 44px; font-weight: 600; line-height: 1; }}
.tile span {{ font-size: 14px; color: var(--muted); }}
.cover {{ min-height: 560px; align-content: space-between; }}
.cover p {{ margin: 0; max-width: 60ch; font-size: 17px; }}
.cover p.meta {{ max-width: none; font-size: 14px; }}
.schs {{ display: grid; gap: 28px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); align-items: start; }}
.schs .t td {{ padding: 5px 8px; }}
.notes {{ display: grid; gap: 6px; margin: 0; padding-left: 18px; font-size: 14px; max-width: 120ch; }}
@page {{ size: A3 landscape; margin: 12mm; }}
@media print {{
  html, body {{ background: #fff; }}
  body {{ padding: 0; font-size: 13px; }}
  .doc {{ max-width: none; gap: 0; }}
  .page {{ padding: 0; break-after: page; height: 266mm; box-sizing: border-box; overflow: hidden; }}
  .page:last-child {{ break-after: auto; }}
  .zone {{ grid-template-columns: minmax(0, 2.6fr) minmax(0, 1fr); align-items: start; }}
  .zone .plan {{ max-height: 240mm; }}
  .combined .plan {{ max-height: 228mm; width: auto; max-width: 100%; margin: 0 auto; }}
  .cover {{ min-height: 0; }}
  .schs .t td {{ padding: 3.5px 8px; }}
}}
</style>

<main class="doc">

<section class="page cover">
  <div style="display:grid;gap:18px">
    <p class="meta">Live Out Loud Music Festival 2026 · Eagle Square, Abuja · Sunday 13 December 2026</p>
    <h1>Brand placement plan</h1>
    <p>Where your brand sits at the venue and how big your space is. Find your slot code on the schedule (sheet 6), then on your zone's plan.</p>
  </div>
  <div class="tiles">
    <div class="tile" style="border-color:{ORANGE}"><b>{cnt["A"]}</b><span>slots · Event arena (orange)</span></div>
    <div class="tile" style="border-color:{GREEN}"><b>{cnt["T"]}</b><span>slots · Table parking (green)</span></div>
    <div class="tile" style="border-color:{BLUE}"><b>{cnt["V"]}</b><span>slots · Validation point (blue)</span></div>
    <div class="tile" style="border-color:{INK}"><b>{n}</b><span>brand slots in total · {lin:,} ft of walls, all 10 ft high</span></div>
  </div>
  {key()}
</section>

<section class="page combined">
  <header><h2>Combined site plan</h2><p class="meta">Eagle Square as built: validation, parking and arena between Hospital Ave. and Unity Road · Sheet 2 of 6</p></header>
  <div class="plan-box">{combined()}</div>
  {key()}
</section>

{zone_page(3, "Event arena", "Orange = brand space", svg(ARENA_BOX, draw_arena(), "Event arena plan"), "A")}
{zone_page(4, "Table parking", "Green = brand space", svg(TABLE_BOX, draw_table(), "Table parking plan"), "T")}
{zone_page(5, "Validation point / general parking", "Blue = brand space", svg(VALID_BOX, draw_valid(), "Validation point plan"), "V")}

<section class="page">
  <header><h2>Brand allocation schedule</h2><p class="meta">{n} slots · Sheet 6 of 6</p></header>
  <div class="schs">
    {schedule("A", "Event arena")}
    {schedule("T", "Table parking")}
    {schedule("V", "Validation point")}
  </div>
  <div style="display:grid;gap:10px">
    <h3>Notes for brands</h3>
    <ul class="notes">
      <li>Sizes are width × height. Every wall is 10 ft (3.05 m) high. Send print-ready vector artwork (PDF/AI) at the exact slot size, named with your slot code.</li>
      <li>Eagle Square is a concrete parade ground. Nothing can be staked, so all frames stand on weighted bases.</li>
      <li>December is Harmattan season (dry, dusty, gusty). Long walls use wind-permeable mesh. The show runs after dark, so light your wall if you want it seen at night.</li>
      <li>Pink lines are barricades. Do not fix branding to them without production approval.</li>
      <li>Plans are not to scale. Production confirms final dimensions on site.</li>
    </ul>
  </div>
</section>

</main>
'''
    OUT.write_text(html, encoding="utf-8")
    print("wrote", OUT, n, "slots")


if __name__ == "__main__":
    build()
