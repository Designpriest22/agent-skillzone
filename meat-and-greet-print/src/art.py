"""Vector illustration library: every mark here is drawn in code so it scales
from a 38 mm token to a 4 m banner without loss.

All functions return SVG markup strings. Colours default to the event palette.
"""
import math
import random

BLACK, CHAR, RED, EMBER, BONE = '#0B0909', '#2A2524', '#B3121C', '#E0592A', '#EFE6D6'


def svg(vb, body, cls='', style=''):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" class="{cls}" style="{style}" preserveAspectRatio="xMidYMid meet">{body}</svg>'


# ---------------------------------------------------------------- skull
SKULL_BODY = ("M100,6 C152,6 190,44 190,98 C190,126 180,145 168,156 L168,172 C168,181 161,186 152,186 "
              "L147,186 L147,204 C147,218 135,228 121,228 L79,228 C65,228 53,218 53,204 L53,186 L48,186 "
              "C39,186 32,181 32,172 L32,156 C20,145 10,126 10,98 C10,44 48,6 100,6 Z")
SKULL_EYE_L = "M44,110 C42,88 58,78 76,80 C93,82 99,96 95,112 C91,128 76,138 62,135 C50,132 45,123 44,110 Z"
SKULL_EYE_R = "M156,110 C158,88 142,78 124,80 C107,82 101,96 105,112 C109,128 124,138 138,135 C150,132 155,123 156,110 Z"
SKULL_NOSE = "M100,138 C93,150 86,160 89,167 C92,172 98,169 100,164 C102,169 108,172 111,167 C114,160 107,150 100,138 Z"


def skull(fill=BONE, socket=BLACK, glow=RED, stroke=None, crack=True, teeth=True, glow_on=True, shade=CHAR):
    """Front-facing graphic skull, viewBox 0 0 200 234. Fun-scary: glowing eyes, no gore."""
    s = []
    if stroke:
        s.append(f'<path d="{SKULL_BODY}" fill="{stroke}" stroke="{stroke}" stroke-width="12" stroke-linejoin="round"/>')
    s.append(f'<path d="{SKULL_BODY}" fill="{fill}"/>')
    # temple shading
    s.append(f'<path d="M32,156 C22,140 14,120 16,96 C20,120 30,138 44,150 Z" fill="{shade}" opacity=".35"/>')
    s.append(f'<path d="M168,156 C178,140 186,120 184,96 C180,120 170,138 156,150 Z" fill="{shade}" opacity=".35"/>')
    s.append(f'<path d="M53,186 L147,186 L147,192 L53,192 Z" fill="{shade}" opacity=".35"/>')
    s.append(f'<path d="{SKULL_EYE_L}" fill="{socket}"/><path d="{SKULL_EYE_R}" fill="{socket}"/>')
    if glow_on:
        s.append(f'<defs><radialGradient id="eg"><stop offset="0" stop-color="{glow}" stop-opacity="1"/>'
                 f'<stop offset=".35" stop-color="{glow}" stop-opacity=".85"/><stop offset="1" stop-color="{glow}" stop-opacity="0"/></radialGradient></defs>')
        s.append('<circle cx="72" cy="110" r="17" fill="url(#eg)"/><circle cx="128" cy="110" r="17" fill="url(#eg)"/>')
        s.append(f'<circle cx="72" cy="110" r="4.5" fill="{fill}" opacity=".9"/><circle cx="128" cy="110" r="4.5" fill="{fill}" opacity=".9"/>')
    s.append(f'<path d="{SKULL_NOSE}" fill="{socket}"/>')
    if teeth:
        s.append(f'<rect x="57" y="179" width="86" height="42" rx="11" fill="{socket}"/>')
        for i in range(6):
            x = 59.5 + i * 13.6
            lng = 3 if i in (2, 3) else 0
            s.append(f'<rect x="{x:.1f}" y="178" width="11.4" height="{19 + lng}" rx="4" fill="{fill}"/>')
            s.append(f'<rect x="{x:.1f}" y="{201 + lng}" width="11.4" height="{17 - lng}" rx="4" fill="{fill}"/>')
        s.append(f'<path d="M44,140 C52,152 66,156 80,152" fill="none" stroke="{shade}" stroke-width="3" opacity=".45" stroke-linecap="round"/>')
        s.append(f'<path d="M156,140 C148,152 134,156 120,152" fill="none" stroke="{shade}" stroke-width="3" opacity=".45" stroke-linecap="round"/>')
    if crack:
        s.append(f'<path d="M122,10 L116,26 L126,36 L117,50 L124,58" fill="none" stroke="{socket}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>')
    return ''.join(s)


def skull_svg(cls='', style='', **kw):
    return svg('0 0 200 234', skull(**kw), cls, style)


def bone_shape(length=200, thick=20, knob=15):
    """A cartoon bone centred on origin along x."""
    h = length / 2 - knob
    return (f'<rect x="{-h}" y="{-thick/2}" width="{2*h}" height="{thick}" />'
            f'<circle cx="{-h}" cy="{-knob*0.62}" r="{knob}"/><circle cx="{-h}" cy="{knob*0.62}" r="{knob}"/>'
            f'<circle cx="{h}" cy="{-knob*0.62}" r="{knob}"/><circle cx="{h}" cy="{knob*0.62}" r="{knob}"/>')


def skull_crossbones(fill=BONE, socket=BLACK, glow=RED, bonefill=None):
    bf = bonefill or fill
    return svg('-20 -10 240 270',
               f'<g fill="{bf}" transform="translate(100,190) rotate(32)">{bone_shape(230, 22, 17)}</g>'
               f'<g fill="{bf}" transform="translate(100,190) rotate(-32)">{bone_shape(230, 22, 17)}</g>'
               f'<g transform="translate(18,0) scale(.82)">{skull(fill=fill, socket=socket, glow=glow)}</g>')


# ---------------------------------------------------------------- bull skull (tunnel motif)
def bull_skull(fill=BONE, socket=BLACK):
    return svg('0 0 300 220', f'''
<path fill="{fill}" d="M150,40 C185,40 205,58 208,84 L240,62 C262,46 284,26 292,4 C296,36 280,70 246,92 L212,110
 C210,140 196,170 178,196 C170,210 160,216 150,216 C140,216 130,210 122,196 C104,170 90,140 88,110 L54,92
 C20,70 4,36 8,4 C16,26 38,46 60,62 L92,84 C95,58 115,40 150,40 Z"/>
<path fill="{socket}" d="M106,104 C114,96 128,100 130,112 C126,122 112,124 104,116 Z"/>
<path fill="{socket}" d="M194,104 C186,96 172,100 170,112 C174,122 188,124 196,116 Z"/>
<path fill="{socket}" d="M140,180 C142,170 148,168 150,176 C152,168 158,170 160,180 C156,190 144,190 140,180 Z"/>
<path fill="none" stroke="{socket}" stroke-width="3" d="M150,56 L146,72 L154,82 L148,96"/>''')


# ---------------------------------------------------------------- coffin
def coffin_points(w, h, head=0.62, shoulder=0.26, foot=0.46):
    """Classic six-sided coffin. Returns list of (x,y)."""
    return [((1 - head) / 2 * w, 0), ((1 + head) / 2 * w, 0), (w, shoulder * h),
            ((1 + foot) / 2 * w, h), ((1 - foot) / 2 * w, h), (0, shoulder * h)]


def poly_path(pts, ox=0, oy=0):
    return 'M' + ' L'.join(f'{x + ox:.2f},{y + oy:.2f}' for x, y in pts) + ' Z'


def coffin_svg(fill=CHAR, stroke=None, sw=0, cross=None, w=100, h=200):
    pts = coffin_points(w, h)
    s = f'<path d="{poly_path(pts)}" fill="{fill}" {f"stroke={chr(34)}{stroke}{chr(34)} stroke-width={chr(34)}{sw}{chr(34)}" if stroke else ""}/>'
    if cross:
        cx = w / 2
        s += f'<rect x="{cx - w*0.035}" y="{h*0.3}" width="{w*0.07}" height="{h*0.34}" fill="{cross}"/>'
        s += f'<rect x="{cx - w*0.15}" y="{h*0.38}" width="{w*0.3}" height="{h*0.06}" fill="{cross}"/>'
    return svg(f'0 0 {w} {h}', s)


# ---------------------------------------------------------------- flame / steak (brand icon redraw)
FLAME = ("M50,2 C58,20 72,26 74,46 C80,38 82,30 80,22 C94,38 98,58 92,76 C86,92 70,100 50,100 C30,100 14,92 8,76 "
         "C2,58 8,42 18,32 C18,42 22,50 28,54 C26,36 38,22 50,2 Z")
FLAME_INNER = "M50,40 C55,52 64,58 64,72 C64,84 58,92 50,92 C42,92 36,86 36,76 C36,66 42,62 44,56 C46,64 50,66 52,64 C50,56 48,48 50,40 Z"


def flame(outer=EMBER, inner='#F6A13A', core=None):
    s = f'<path d="{FLAME}" fill="{outer}"/><path d="{FLAME_INNER}" fill="{inner}"/>'
    return svg('0 0 100 102', s)


def cleaver(blade=BONE, handle=BLACK, edge=CHAR):
    return svg('0 0 220 120', f'''
<path fill="{blade}" d="M6,10 L150,10 C156,10 160,14 160,20 L160,96 C160,104 154,110 146,110 L22,110 C12,110 6,102 6,92 Z"/>
<circle cx="136" cy="32" r="9" fill="{handle}"/>
<path d="M10,100 L156,100" stroke="{edge}" stroke-width="3" opacity=".5"/>
<path fill="{handle}" d="M160,38 L214,32 C218,32 220,35 220,39 L220,61 C220,65 218,68 214,68 L160,62 Z"/>
<circle cx="178" cy="50" r="3" fill="{blade}"/><circle cx="198" cy="50" r="3" fill="{blade}"/>''')


def knife(blade=BONE, handle=BLACK):
    return svg('0 0 240 50', f'''
<path fill="{blade}" d="M4,25 C40,6 110,4 150,8 L150,40 C110,42 46,38 4,25 Z"/>
<rect x="150" y="4" width="10" height="40" rx="2" fill="{handle}"/>
<path fill="{handle}" d="M160,14 L232,12 C237,12 238,16 238,20 L238,30 C238,34 237,38 232,38 L160,36 Z"/>''')


# ---------------------------------------------------------------- arrows & pictograms
def arrow(direction='right', fill=BONE):
    body = 'M0,35 L58,35 L58,10 L100,50 L58,90 L58,65 L0,65 Z'
    rot = {'right': 0, 'down': 90, 'left': 180, 'up': -90, 'up-right': -45, 'up-left': -135,
           'down-right': 45, 'down-left': 135}[direction]
    return svg('0 0 100 100', f'<path d="{body}" fill="{fill}" transform="rotate({rot} 50 50)"/>')


def wc_icon(fill=BONE):
    man = ('<circle cx="30" cy="14" r="10"/><path d="M18,30 L42,30 C46,30 49,33 49,37 L49,64 L43,64 L43,98 L33,98 '
           'L33,68 L27,68 L27,98 L17,98 L17,64 L11,64 L11,37 C11,33 14,30 18,30 Z"/>')
    woman = ('<circle cx="80" cy="14" r="10"/><path d="M72,30 L88,30 C92,30 94,32 95,36 L104,66 L95,66 L92,56 '
             'L98,78 L90,78 L90,98 L83,98 L83,78 L77,78 L77,98 L70,98 L70,78 L62,78 L68,56 L65,66 L56,66 L65,36 C66,32 68,30 72,30 Z"/>')
    return svg('0 0 110 100', f'<g fill="{fill}">{man}<rect x="54" y="4" width="2.5" height="94"/>{woman}</g>')


def cross_icon(fill=BONE, bg=None):
    s = ''
    if bg:
        s += f'<rect width="100" height="100" rx="12" fill="{bg}"/>'
    s += f'<path d="M36,14 L64,14 L64,36 L86,36 L86,64 L64,64 L64,86 L36,86 L36,64 L14,64 L14,36 L36,36 Z" fill="{fill}"/>'
    return svg('0 0 100 100', s)


def exit_icon(fill=BONE):
    """Door + running figure (generic, not the ISO pictogram)."""
    return svg('0 0 120 100', f'''<g fill="{fill}">
<path d="M70,4 L116,4 L116,96 L70,96 Z M78,12 L78,88 L108,88 L108,12 Z" fill-rule="evenodd"/>
<circle cx="40" cy="14" r="9"/>
<path d="M34,26 L50,28 L62,42 L72,40 L74,47 L58,50 L50,42 L46,58 L58,70 L58,94 L49,94 L48,74 L36,64 L30,80 L10,86 L8,78 L24,72 L30,48 L22,54 L14,48 Z"/></g>''')


def camera_icon(fill=BONE, cut=BLACK):
    return svg('0 0 100 80', f'<path fill="{fill}" d="M8,18 L30,18 L38,6 L62,6 L70,18 L92,18 C96,18 98,21 98,25 L98,70 C98,74 96,76 92,76 L8,76 C4,76 2,74 2,70 L2,25 C2,21 4,18 8,18 Z"/>'
                           f'<circle cx="50" cy="45" r="21" fill="{cut}"/><circle cx="50" cy="45" r="13" fill="{fill}"/>')


def radio_icon(fill=BONE):
    return svg('0 0 60 100', f'<g fill="{fill}"><rect x="40" y="2" width="6" height="30" rx="3"/><rect x="8" y="28" width="44" height="70" rx="6"/></g>'
                             f'<g fill="#0B0909"><rect x="16" y="38" width="28" height="18" rx="2"/><circle cx="20" cy="70" r="3"/><circle cx="30" cy="70" r="3"/><circle cx="40" cy="70" r="3"/><circle cx="20" cy="82" r="3"/><circle cx="30" cy="82" r="3"/><circle cx="40" cy="82" r="3"/></g>')


# ---------------------------------------------------------------- crime scene
def danger_tape_svg(w, h, text='DANGER · DO NOT CROSS · ', stripe=RED, band=BLACK, ink=BONE, font='Anton', fs=None):
    """A horizontal tape strip w x h (user units). Stripes on both edges + text band."""
    fs = fs or h * 0.5
    sw = h * 0.16
    stripes = []
    step = h * 0.5
    x = -h
    while x < w + h:
        stripes.append(f'<path d="M{x},0 L{x + step/2},0 L{x + step/2 - sw},{sw} L{x - sw},{sw} Z"/>')
        stripes.append(f'<path d="M{x},{h - sw} L{x + step/2},{h - sw} L{x + step/2 - sw},{h} L{x - sw},{h} Z"/>')
        x += step
    rep = int(w / (len(text) * fs * 0.42)) + 2
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" preserveAspectRatio="none">'
            f'<rect width="{w}" height="{h}" fill="{band}"/><g fill="{stripe}">{"".join(stripes)}</g>'
            f'<text x="0" y="{h/2 + fs*0.36}" font-family="{font}" font-size="{fs}" fill="{ink}" letter-spacing="{fs*0.08}" textLength="{w}" lengthAdjust="spacing">{(text * rep)[:int(w/(fs*0.42))]}</text></svg>')


def fingerprint(fill='none', ink=RED, lines=16, seed=4, sw=2.2):
    rnd = random.Random(seed)
    s = []
    for i in range(lines):
        rx, ry = 8 + i * 4.2, 11 + i * 5.2
        gap = rnd.uniform(0.2, 1.2)
        a0 = -math.pi / 2 + gap
        a1 = a0 + 2 * math.pi - gap * rnd.uniform(1.2, 2.2)
        pts = []
        for k in range(0, 70):
            a = a0 + (a1 - a0) * k / 69
            wob = 1 + 0.03 * math.sin(a * 5 + i)
            pts.append((50 + rx * wob * math.cos(a), 60 + ry * wob * math.sin(a) * (0.9 if math.sin(a) > 0 else 1)))
        s.append('<path d="M' + ' L'.join(f'{x:.1f},{y:.1f}' for x, y in pts) + f'" fill="none" stroke="{ink}" stroke-width="{sw}" stroke-linecap="round"/>')
    return svg('-30 -40 160 200', ''.join(s))


def barcode(w=100, h=20, seed=1, ink=BLACK):
    rnd = random.Random(seed)
    x, s = 0, []
    while x < w:
        bw = rnd.choice([0.6, 0.6, 1.0, 1.4, 2.0])
        if rnd.random() > 0.4:
            s.append(f'<rect x="{x:.2f}" y="0" width="{bw}" height="{h}"/>')
        x += bw + rnd.choice([0.5, 0.7, 1.0])
    return svg(f'0 0 {w} {h}', f'<g fill="{ink}">{"".join(s)}</g>')


def stamp_text(text, color=RED, rotate=-8, font='Anton', fs=40, pad=10, border=4):
    return (f'<span class="stamp" style="color:{color};border-color:{color};transform:rotate({rotate}deg);'
            f'font-family:{font}">{text}</span>')


# ---------------------------------------------------------------- carnival
def sunburst(w, h, cx, cy, rays=32, c1=RED, c2=BLACK, r=None):
    r = r or (w + h) * 1.5
    s = [f'<rect width="{w}" height="{h}" fill="{c2}"/>']
    for i in range(rays):
        if i % 2:
            continue
        a0 = 2 * math.pi * i / rays
        a1 = 2 * math.pi * (i + 1) / rays
        s.append(f'<path d="M{cx},{cy} L{cx + r*math.cos(a0):.1f},{cy + r*math.sin(a0):.1f} L{cx + r*math.cos(a1):.1f},{cy + r*math.sin(a1):.1f} Z" fill="{c1}"/>')
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" preserveAspectRatio="none">{"".join(s)}</svg>'


def bulbs_rect(w, h, step, r, inset, fill='#F6C76A', glow=EMBER):
    """Marquee bulbs around a rectangle."""
    s = [f'<defs><radialGradient id="bg1"><stop offset="0" stop-color="#FFF4D6"/><stop offset=".45" stop-color="{fill}"/><stop offset="1" stop-color="{glow}" stop-opacity="0"/></radialGradient></defs>']
    def put(x, y):
        s.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r*2.4}" fill="url(#bg1)" opacity=".55"/><circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="#FFF1C9"/>')
    nx = max(2, int((w - 2 * inset) / step))
    ny = max(2, int((h - 2 * inset) / step))
    for i in range(nx + 1):
        x = inset + (w - 2 * inset) * i / nx
        put(x, inset); put(x, h - inset)
    for j in range(1, ny):
        y = inset + (h - 2 * inset) * j / ny
        put(inset, y); put(w - inset, y)
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}">{"".join(s)}</svg>'


def stripes_v(w, h, n, c1=RED, c2=BLACK):
    sw = w / n
    s = [f'<rect width="{w}" height="{h}" fill="{c2}"/>']
    for i in range(0, n, 2):
        s.append(f'<rect x="{i*sw:.2f}" width="{sw:.2f}" height="{h}" fill="{c1}"/>')
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" preserveAspectRatio="none">{"".join(s)}</svg>'


# ---------------------------------------------------------------- hazard marks
def hazard_triangle(fill=EMBER, edge=BLACK, inner=None):
    inner = inner or skull_crossbones_group(BLACK)
    return svg('0 0 300 270', f'''
<path d="M150,8 L292,258 C294,262 292,266 287,266 L13,266 C8,266 6,262 8,258 Z" fill="{edge}" stroke="{edge}" stroke-width="10" stroke-linejoin="round"/>
<path d="M150,40 L266,244 L34,244 Z" fill="{fill}" stroke="{fill}" stroke-width="8" stroke-linejoin="round"/>
<g transform="translate(150,165)">{inner}</g>''')


def skull_crossbones_group(c=BLACK, holes=None, scale=0.42):
    holes = holes or EMBER
    return (f'<g transform="scale({scale}) translate(-100,-140)">'
            f'<g fill="{c}" transform="translate(100,190) rotate(32)">{bone_shape(230, 22, 17)}</g>'
            f'<g fill="{c}" transform="translate(100,190) rotate(-32)">{bone_shape(230, 22, 17)}</g>'
            f'<g transform="translate(18,0) scale(.82)">{skull(fill=c, socket=holes, glow_on=False, shade=c, crack=False)}</g></g>')


def trefoil(fill=BLACK, bg=EMBER, ring=True):
    """Radiation trefoil, ISO proportions (r=1 centre, 1.5 gap, 5 blade outer)."""
    R1, R2, R3 = 10, 15, 50
    s = [f'<circle cx="0" cy="0" r="{R3 + 22}" fill="{bg}"/>'] if bg else []
    if ring:
        s.append(f'<circle cx="0" cy="0" r="{R3 + 18}" fill="none" stroke="{fill}" stroke-width="5"/>')
    s.append(f'<circle cx="0" cy="0" r="{R1}" fill="{fill}"/>')
    for k in range(3):
        a0 = math.radians(-90 + 120 * k - 30)
        a1 = math.radians(-90 + 120 * k + 30)
        p = (f'M{R2*math.cos(a0):.2f},{R2*math.sin(a0):.2f} L{R3*math.cos(a0):.2f},{R3*math.sin(a0):.2f} '
             f'A{R3},{R3} 0 0 1 {R3*math.cos(a1):.2f},{R3*math.sin(a1):.2f} L{R2*math.cos(a1):.2f},{R2*math.sin(a1):.2f} '
             f'A{R2},{R2} 0 0 0 {R2*math.cos(a0):.2f},{R2*math.sin(a0):.2f} Z')
        s.append(f'<path d="{p}" fill="{fill}"/>')
    return svg('-75 -75 150 150', ''.join(s))


def blood_drop(fill=RED):
    return svg('0 0 60 84', f'<path d="M30,2 C40,22 58,40 58,56 C58,72 46,82 30,82 C14,82 2,72 2,56 C2,40 20,22 30,2 Z" fill="{fill}"/>'
                            f'<path d="M16,52 C16,62 22,70 30,72" stroke="#fff" stroke-opacity=".35" stroke-width="4" fill="none" stroke-linecap="round"/>')


def iv_bag(fill=RED, bag=BONE):
    return svg('0 0 120 190', f'''
<rect x="52" y="0" width="16" height="16" rx="3" fill="{bag}"/>
<path d="M18,16 L102,16 C110,16 114,20 114,28 L114,140 C114,156 100,166 84,166 L36,166 C20,166 6,156 6,140 L6,28 C6,20 10,16 18,16 Z" fill="none" stroke="{bag}" stroke-width="5"/>
<path d="M10,70 L110,70 L110,140 C110,154 98,162 84,162 L36,162 C22,162 10,154 10,140 Z" fill="{fill}"/>
<path d="M60,166 L60,190" stroke="{bag}" stroke-width="6"/>
<g stroke="{bag}" stroke-width="3"><path d="M90,40 L104,40"/><path d="M94,52 L104,52"/><path d="M90,64 L104,64"/><path d="M94,76 L104,76"/><path d="M90,88 L104,88"/></g>''')


def syringe(fill=RED, body=BONE):
    return svg('0 0 240 60', f'''
<rect x="10" y="22" width="20" height="16" fill="{body}"/><rect x="0" y="12" width="10" height="36" rx="2" fill="{body}"/>
<rect x="30" y="26" width="34" height="8" fill="{body}"/>
<rect x="64" y="12" width="120" height="36" rx="3" fill="none" stroke="{body}" stroke-width="5"/>
<rect x="68" y="16" width="70" height="28" fill="{fill}"/>
<path d="M184,22 L198,26 L198,34 L184,38 Z" fill="{body}"/><path d="M198,29 L238,30 L198,31 Z" fill="{body}" stroke="{body}" stroke-width="1.5"/>
<g stroke="{body}" stroke-width="2.5"><path d="M90,12 L90,24"/><path d="M110,12 L110,24"/><path d="M130,12 L130,24"/><path d="M150,12 L150,24"/><path d="M170,12 L170,24"/></g>''')


def bottle(fill=CHAR, label=BONE):
    return svg('0 0 80 200', f'<path d="M30,4 L50,4 L50,50 C50,62 74,70 74,96 L74,188 C74,194 70,198 64,198 L16,198 C10,198 6,194 6,188 L6,96 C6,70 30,62 30,50 Z" fill="{fill}"/>'
                             f'<rect x="12" y="110" width="56" height="60" fill="{label}"/>')


def chain_link_row(w, h, link=26, thick=6, color='#6E6460'):
    """Horizontal chain made of alternating ellipse links."""
    s, x, i = [], 0.0, 0
    while x < w + link:
        if i % 2 == 0:
            s.append(f'<rect x="{x:.1f}" y="{h/2 - link*0.32:.1f}" width="{link*1.25:.1f}" height="{link*0.64:.1f}" rx="{link*0.32:.1f}" fill="none" stroke="{color}" stroke-width="{thick}"/>')
        else:
            s.append(f'<rect x="{x:.1f}" y="{h/2 - thick/2:.1f}" width="{link*1.25:.1f}" height="{thick}" rx="{thick/2}" fill="{color}"/>')
        x += link * 0.95
        i += 1
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" preserveAspectRatio="none">{"".join(s)}</svg>'


# ---------------------------------------------------------------- silhouettes for WANTED posters
HEAD = ("M100,40 C128,40 146,62 146,92 C146,112 140,130 130,142 C126,147 124,152 124,160 L124,172 "
        "C150,180 180,190 192,204 L196,250 L4,250 L8,204 C20,190 50,180 76,172 L76,160 C76,152 74,147 70,142 "
        "C60,130 54,112 54,92 C54,62 72,40 100,40 Z")


def suspect(kind='plain', fill=BLACK, accent=RED):
    """Mugshot silhouette with a costume accessory. viewBox 0 0 200 250."""
    a = []
    if kind == 'butcher':      # chef hat + cleaver on shoulder
        a.append(f'<path fill="{fill}" d="M62,58 C50,40 60,16 82,18 C88,4 112,4 118,18 C140,16 150,40 138,58 Z"/><rect x="66" y="52" width="68" height="14" fill="{fill}"/>')
        a.append(f'<g transform="translate(150,150) rotate(-60) scale(.38)" fill="{accent}"><path d="M6,10 L150,10 L160,20 L160,96 L146,110 L22,110 L6,92 Z"/><rect x="160" y="38" width="60" height="26" rx="4" fill="{fill}"/></g>')
    elif kind == 'ringmaster':
        a.append(f'<path fill="{fill}" d="M70,10 L130,10 L134,52 L156,54 C160,54 160,62 156,62 L44,62 C40,62 40,54 44,54 L66,52 Z"/><rect x="68" y="42" width="64" height="8" fill="{accent}"/>')
        a.append(f'<path d="M84,190 L100,206 L116,190 L116,214 L100,204 L84,214 Z" fill="{accent}"/>')
    elif kind == 'witch':
        a.append(f'<path fill="{fill}" d="M100,0 C108,20 116,36 128,52 L170,60 C176,62 176,68 170,70 L30,70 C24,68 24,62 30,60 L72,52 C84,36 96,16 100,0 Z"/><rect x="74" y="50" width="52" height="7" fill="{accent}"/>')
    elif kind == 'clown':
        a.append(f'<circle cx="54" cy="78" r="22" fill="{fill}"/><circle cx="146" cy="78" r="22" fill="{fill}"/><circle cx="66" cy="58" r="18" fill="{fill}"/><circle cx="134" cy="58" r="18" fill="{fill}"/>')
        a.append(f'<circle cx="100" cy="100" r="9" fill="{accent}"/>')
        a.append(f'<path d="M76,182 L100,196 L124,182 L124,206 L100,196 L76,206 Z" fill="{accent}"/>')
    elif kind == 'hood':
        a.append(f'<path fill="{fill}" d="M100,22 C150,22 172,70 168,120 C166,150 158,170 150,182 L50,182 C42,170 34,150 32,120 C28,70 50,22 100,22 Z"/>')
        a.append(f'<ellipse cx="86" cy="100" rx="7" ry="4" fill="{accent}"/><ellipse cx="114" cy="100" rx="7" ry="4" fill="{accent}"/>')
    elif kind == 'dj':
        a.append(f'<path d="M50,96 C50,48 150,48 150,96" fill="none" stroke="{fill}" stroke-width="10"/><rect x="40" y="84" width="20" height="36" rx="8" fill="{accent}"/><rect x="140" y="84" width="20" height="36" rx="8" fill="{accent}"/>')
    elif kind == 'doctor':
        a.append(f'<path d="M58,70 C70,52 130,52 142,70" fill="none" stroke="{fill}" stroke-width="8"/><circle cx="100" cy="62" r="13" fill="{accent}"/><circle cx="100" cy="62" r="5" fill="{fill}"/>')
        a.append(f'<path d="M84,178 C84,210 70,214 70,230" fill="none" stroke="{accent}" stroke-width="5"/><circle cx="70" cy="232" r="7" fill="{accent}"/>')
    elif kind == 'bandit':
        a.append(f'<path d="M58,104 L142,104 L144,140 C130,150 70,150 56,140 Z" fill="{accent}"/><path d="M144,116 L170,124 L164,134 L142,128 Z" fill="{accent}"/>')
    elif kind == 'judge':
        for i, (x, y) in enumerate([(60, 70), (52, 96), (54, 122), (58, 148), (140, 70), (148, 96), (146, 122), (142, 148), (74, 50), (100, 42), (126, 50)]):
            a.append(f'<circle cx="{x}" cy="{y}" r="15" fill="{fill}"/>')
        a.append(f'<rect x="88" y="182" width="24" height="10" fill="{accent}"/>')
    elif kind == 'bones':
        a.append(f'<path d="M64,60 C40,40 30,20 40,4 C48,20 60,30 78,44 Z M136,60 C160,40 170,20 160,4 C152,20 140,30 122,44 Z" fill="{fill}"/>')
    elif kind == 'unknown':
        a.append(f'<text x="100" y="128" text-anchor="middle" font-family="Anton" font-size="78" fill="{accent}">?</text>')
    head = f'<path d="{HEAD}" fill="{fill}"/>'
    if kind in ('unknown',):
        return svg('0 0 200 250', head + ''.join(a))
    return svg('0 0 200 250', head + ''.join(a))


# ---------------------------------------------------------------- ghost faces (balloon vinyl cut set)
GHOST_FACES = {
    'classic': ['<ellipse cx="-24" cy="-10" rx="11" ry="17"/>', '<ellipse cx="24" cy="-10" rx="11" ry="17"/>',
                '<ellipse cx="0" cy="30" rx="10" ry="15"/>'],
    'boo': ['<ellipse cx="-24" cy="-12" rx="12" ry="12"/>', '<ellipse cx="24" cy="-12" rx="12" ry="12"/>',
            '<ellipse cx="0" cy="30" rx="18" ry="22"/>'],
    'angry': ['<path d="M-38,-22 L-10,-12 L-14,4 C-24,8 -36,2 -38,-8 Z"/>', '<path d="M38,-22 L10,-12 L14,4 C24,8 36,2 38,-8 Z"/>',
              '<path d="M-26,32 L-16,22 L-6,32 L4,22 L14,32 L24,22 L28,38 L-30,38 Z"/>'],
    'grin': ['<ellipse cx="-22" cy="-12" rx="9" ry="14"/>', '<ellipse cx="22" cy="-12" rx="9" ry="14"/>',
             '<path d="M-34,18 C-20,44 20,44 34,18 C20,30 -20,30 -34,18 Z"/>'],
    'wink': ['<path d="M-36,-10 C-28,-20 -16,-20 -8,-10 C-16,-14 -28,-14 -36,-10 Z" />', '<ellipse cx="22" cy="-12" rx="11" ry="16"/>',
             '<path d="M-22,22 C-10,40 14,40 26,20 C12,30 -8,30 -22,22 Z"/>'],
    'scream': ['<ellipse cx="-22" cy="-16" rx="9" ry="19" transform="rotate(12 -22 -16)"/>', '<ellipse cx="22" cy="-16" rx="9" ry="19" transform="rotate(-12 22 -16)"/>',
               '<ellipse cx="0" cy="34" rx="12" ry="26"/>'],
}


def ghost_face_group(name, fill=BLACK, scale=1.0):
    return f'<g fill="{fill}" transform="scale({scale})">{"".join(GHOST_FACES[name])}</g>'


# ---------------------------------------------------------------- misc
def drips(w, h, n=14, seed=2, fill=RED, maxlen=0.9):
    """Paint drips hanging from the top edge of a w x h box."""
    rnd = random.Random(seed)
    s = [f'<rect x="0" y="0" width="{w}" height="{h*0.06:.2f}" fill="{fill}"/>']
    for i in range(n):
        x = rnd.uniform(0.02, 0.98) * w
        dw = rnd.uniform(0.006, 0.02) * w
        ln = rnd.uniform(0.15, maxlen) * h
        s.append(f'<path d="M{x - dw:.1f},0 L{x + dw:.1f},0 L{x + dw*0.7:.1f},{ln - dw:.1f} '
                 f'A{dw*0.95:.1f},{dw*0.95:.1f} 0 1 1 {x - dw*0.7:.1f},{ln - dw:.1f} Z" fill="{fill}"/>')
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" preserveAspectRatio="none">{"".join(s)}</svg>'


def splatter(seed=3, fill=RED, n=40, spread=50):
    rnd = random.Random(seed)
    s = [f'<circle cx="50" cy="50" r="{spread*0.28}" fill="{fill}"/>']
    for _ in range(n):
        a = rnd.uniform(0, 2 * math.pi)
        d = rnd.uniform(spread * 0.25, spread) * (0.9 + rnd.random() * 0.3)
        r = max(0.6, rnd.gauss(2.2, 1.4) * (1.2 - d / spread))
        s.append(f'<circle cx="{50 + d*math.cos(a):.1f}" cy="{50 + d*math.sin(a):.1f}" r="{r:.2f}" fill="{fill}"/>')
    return svg('0 0 100 100', ''.join(s))


def handprint(fill=RED, seed=1):
    return svg('0 0 100 120', f'<g fill="{fill}"><path d="M30,60 C28,90 40,110 62,112 C84,112 92,96 90,74 L88,52 C88,46 80,46 79,52 L78,66 L76,26 C76,19 66,19 66,26 L66,62 L64,14 C64,6 53,6 53,14 L53,62 L50,22 C50,14 40,14 40,22 L41,70 L36,56 C33,48 24,50 26,58 Z"/></g>')


def tcm_wordmark(fill=RED):
    return (f'<span class="brush" style="color:{fill};letter-spacing:-.02em">TCM</span>')
