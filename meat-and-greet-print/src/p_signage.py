"""Checklist items 01-10: signage."""
from lib import *
import art

F = '01_Signage'


# ------------------------------------------------------------------ 01 Arch sign
def arch_sign():
    d = Doc('01', 'Arch-Sign_Enter-If-You-Dare', 'Arch sign "Meat & Greet - Enter If You Dare"', 'Signage', 'Arch',
            '1', 'Distressed print on board (5 mm foamex / dibond) - or use as a paint guide', 2400, 900, bleed=10, folder=F)
    W, H = d.w, d.h
    logo_h = 560
    logo_w = logo_h * 959.2 / 761.8
    inner = (
        ov('wood_dark.jpg') +
        ov('board_red.jpg', .18) +
        f'<div class="full" style="background:radial-gradient(ellipse 40% 75% at 50% 52%, rgba(179,18,28,.55), rgba(11,9,9,0) 70%)"></div>' +
        d.T(
            # frame
            box(28, 28, W - 56, H - 56, '', f'border:14mm solid {BLACK};box-shadow:0 0 0 4mm {RED} inset') +
            svgbox(art.bulbs_rect(W - 56, H - 56, 95, 9, 21), 28, 28, W - 56, H - 56) +
            # sunburst behind logo
            box(W / 2 - 620, 70, 1240, H - 140, art.sunburst(1240, H - 140, 620, (H - 140) / 2, 40, 'rgba(179,18,28,.55)', 'rgba(0,0,0,0)'),
                'mask-image:radial-gradient(ellipse 50% 50% at 50% 50%, #000 30%, transparent 75%);-webkit-mask-image:radial-gradient(ellipse 50% 50% at 50% 50%, #000 30%, transparent 75%)') +
            box(W / 2 - logo_w / 2, (H - logo_h) / 2 + 10, logo_w, logo_h, logo_svg(style='width:100%;height:100%')) +
            # left: ENTER...
            fit('ENTER', 130, 255, 600, 300, 'brush center', f'color:{BONE};line-height:1.05') +
            # right: IF YOU DARE
            fit('IF YOU', W - 760, 150, 600, 210, 'brush center', f'color:{BONE};line-height:1.05') +
            fit('DARE', W - 780, 360, 640, 330, 'brush center', f'color:{RED};line-height:1.05;text-shadow:0 0 6mm rgba(11,9,9,.9),0 0 30mm rgba(11,9,9,.6)')
        ) +
        ov('wear_black.png') + ov('drybrush_black.png', .7) +
        d.T(
            text('THE BUTCHER&rsquo;S CARNIVAL', 120, 165, 640, 44, 'anton center', f'color:{EMBER};letter-spacing:.2em') +
            box(200, 232, 460, 3, '', f'background:{EMBER};opacity:.7') +
            box(200, 585, 180, 3, '', f'background:{RED}') + box(480, 585, 180, 3, '', f'background:{RED}') +
            svgbox(art.skull_svg(), 400, 545, 60, 70) +
            text('SATURDAY 31 OCTOBER', 120, 680, 640, 44, 'anton center', f'color:{BONE};letter-spacing:.2em') +
            text('A TCM PRODUCTION', W - 760, 690, 600, 38, 'anton center', f'color:{BONE};letter-spacing:.3em;opacity:.85')
        )
    )
    d.page(inner)
    d.notes = ['If hand-painting: project this file at full size and trace. Bulbs are drawn as a placement guide for festoon/LED bulbs - print them or fit real lamps on the dots.',
               'Distress is built into the file (grunge layer); no extra ageing needed on site.']
    return register(d)


# ------------------------------------------------------------------ 02 Stage backdrop
def stage_backdrop():
    d = Doc('02', 'Stage-Backdrop_FIRSTKLAZ-MEATING', 'Stage backdrop "FIRSTKLAZ MEATING"', 'Signage', 'Stage', '1',
            'PVC flex banner, hemmed + eyelets every 500 mm; drop if LED wall is booked (LED still supplied)', 8000, 4000,
            bleed=50, scale=10, folder=F)
    W, H = d.w, d.h
    inner = (
        ov('board_black.jpg') +
        f'<div class="full" style="background:radial-gradient(ellipse 45% 60% at 50% 42%, rgba(179,18,28,.95), rgba(179,18,28,.25) 45%, rgba(11,9,9,0) 75%)"></div>' +
        box(0, 0, d.pw, d.ph, art.sunburst(1000, 500, 500, 210, 48, 'rgba(11,9,9,.38)', 'rgba(0,0,0,0)'),
            '-webkit-mask-image:radial-gradient(ellipse 55% 70% at 50% 42%, #000 25%, transparent 80%)') +
        f'<img class="ov fill" src="{tex("smoke_bone.png")}" style="opacity:.35;top:45%;height:60%">' +
        f'<img class="ov fill" src="{tex("smoke_red.png")}" style="opacity:.9;top:40%;height:65%">' +
        d.T(
            box(W / 2 - 450, 170, 900, 715, logo_svg(style='width:100%;height:100%')) +
            fit('FIRSTKLAZ', 700, 1100, W - 1400, 1300, 'brush center', f'color:{BONE};line-height:.95;text-shadow:0 0 120mm rgba(0,0,0,.6)') +
            fit('MEATING', 1300, 2200, W - 2600, 1200, 'brush center', f'color:{RED};line-height:.95;text-shadow:0 0 60mm rgba(11,9,9,.9), 0 0 160mm rgba(224,89,42,.5)') +
            ''
        ) +
        ov('wear_black.png') + ov('drybrush_black.png', .6) +
        d.T(text('HALLOWEEN BBQ PARTY &nbsp;·&nbsp; SATURDAY 31 OCTOBER &nbsp;·&nbsp; A TCM PRODUCTION', 0, 3480, W, 120,
                 'anton center', f'color:{BONE};letter-spacing:.35em'))
    )
    d.page(inner)
    d.notes = ['Supplied at 1:10 - output at 1000%. Vector type; textures hold up at viewing distance.',
               'Keep the bottom 1.2 m clear for the DJ riser/booth: no key content sits there.',
               'LED wall version (3840x2160 PNG) included in the same folder if the LED wall is booked instead.']
    return register(d)


def stage_led():
    d = Doc('02', 'Stage-LED-Wall-Still_3840x2160', 'Stage LED wall still (if LED is booked)', 'Signage', 'Stage', '1',
            'Digital: 3840x2160 PNG for the LED processor', 1016, 571.5, bleed=0, folder=F)
    W, H = d.w, d.h
    inner = (
        ov('board_black.jpg') +
        f'<div class="full" style="background:radial-gradient(ellipse 45% 62% at 50% 44%, rgba(179,18,28,.95), rgba(179,18,28,.25) 45%, rgba(11,9,9,0) 75%)"></div>' +
        f'<img class="ov fill" src="{tex("smoke_red.png")}" style="opacity:.9;top:45%;height:60%">' +
        d.T(
            box(W / 2 - 70, 40, 140, 111, logo_svg(style='width:100%;height:100%')) +
            fit('FIRSTKLAZ', 150, 150, W - 300, 150, 'brush center', f'color:{BONE}') +
            fit('MEATING', 250, 300, W - 500, 150, 'brush center', f'color:{RED};text-shadow:0 0 8mm rgba(11,9,9,.9), 0 0 20mm rgba(224,89,42,.5)') +
            text('HALLOWEEN BBQ PARTY · 31.10 · A TCM PRODUCTION', 0, 505, W, 18, 'anton center', f'color:{BONE};letter-spacing:.35em;opacity:.9')
        ) + ov('wear_black.png')
    )
    d.page(inner)
    d.notes = ['Screen file - not for print. Export of this page at 3840x2160 px is in the folder.']
    d.png_px = (3840, 2160)
    return register(d)


# ------------------------------------------------------------------ 03 Skull side banners
def skull_banners():
    d = Doc('03', 'Skull-Side-Banners_L-R', 'Skull side banners (left + right)', 'Signage', 'Stage', '2 (1 left, 1 right)',
            'Vertical PVC flex, pole pockets top + bottom (75 mm) or eyelets', 1500, 4000, bleed=30, scale=10, folder=F)
    W, H = d.w, d.h
    for side, word1, word2 in (('LEFT', 'ENTER', 'IF YOU DARE'), ('RIGHT', 'LEAVE', 'FULL')):
        inner = (
            ov('board_black.jpg') +
            f'<div class="full" style="background:radial-gradient(ellipse 80% 40% at 50% 46%, rgba(179,18,28,.85), rgba(11,9,9,0) 70%)"></div>' +
            f'<img class="ov fill" src="{tex("smoke_red.png")}" style="opacity:1;top:55%;height:50%">' +
            f'<img class="ov fill" src="{tex("smoke_bone.png")}" style="opacity:.25;top:60%;height:45%">' +
            d.T(
                svgbox(art.drips(1500, 420, 16, seed=5 if side == 'LEFT' else 9, fill=RED), 0, 0, W, 420) +
                box(330, 560, 840, 168 * 840 / 254, logo_svg(style='width:100%;height:100%')) +
                svgbox(art.skull_svg(stroke=BLACK), 150, 1300, 1200, 1404) +
                fit(word1, 120, 2800, W - 240, 500, 'brush center', f'color:{BONE};text-shadow:0 0 40mm rgba(11,9,9,.9)') +
                fit(word2, 120, 3260, W - 240, 400, 'brush center', f'color:{RED};text-shadow:0 0 40mm rgba(11,9,9,.9)', maxs=480)
            ) + ov('wear_black.png') +
            d.T(text('31.10', 0, 3830, W, 100, 'anton center', f'color:{BONE};letter-spacing:.3em;opacity:.85'))
        )
        d.page(inner, label=side)
    d.proof_pages = [0, 1]
    d.notes = ['Supplied at 1:10 - output at 1000%. Page 1 = stage left, page 2 = stage right.',
               'Add 75 mm pole pockets top and bottom at production (not drawn).']
    return register(d)



# ------------------------------------------------------------------ 04 Perimeter banners
def perimeter():
    d = Doc('04', 'Perimeter-Branding-Banners', 'Perimeter branding banners (TCM + sponsors)', 'Signage', 'Perimeter', 'TBC (mix of 4 panel designs)',
            'PVC flex with eyelets every 500 mm, 25 mm in from edge; sponsor artwork as supplied', 3000, 2000, bleed=30, scale=10, folder=F)
    W, H = d.w, d.h
    glow = lambda x, y: f'<div class="full" style="background:radial-gradient(ellipse 55% 60% at {x}% {y}%, rgba(179,18,28,.75), rgba(11,9,9,0) 70%)"></div>'
    # A - Meat & Greet brush panel
    d.page(ov('board_black.jpg') + glow(50, 60) +
           f'<img class="ov fill" src="{tex("smoke_red.png")}" style="top:55%;height:50%">' +
           d.T(svgbox(art.drips(3000, 380, 22, seed=12, fill=RED), 0, 0, W, 380) +
               fit('MEAT &amp;', 260, 430, W - 520, 600, 'brush center', f'color:{BONE};text-shadow:0 0 30mm rgba(0,0,0,.8)') +
               fit('GREET', 220, 1030, W - 440, 760, 'brush center', f'color:{RED};text-shadow:0 0 20mm rgba(11,9,9,.9)')) +
           ov('wear_black.png'), label='A - MEAT & GREET')
    # B - TCM panel
    d.page(ov('board_black.jpg') + glow(50, 45) +
           d.T(svgbox(art.chain_link_row(3000, 120, 70, 14, '#5b5250'), 0, 120, W, 120) +
               fit('TCM', 600, 420, W - 1200, 900, 'brush center', f'color:{RED};text-shadow:0 0 25mm rgba(11,9,9,.9)', maxs=1000) +
               svgbox(art.chain_link_row(3000, 120, 70, 14, '#5b5250'), 0, 1760, W, 120)) +
           ov('wear_black.png') +
           d.T(text('THE CAPITAL MOVEMENT &nbsp;·&nbsp; PRESENTS', 0, 1500, W, 95, 'anton center', f'color:{BONE};letter-spacing:.4em')),
           label='B - TCM')
    # C - Skull panel
    d.page(ov('board_black.jpg') + glow(50, 45) +
           f'<img class="ov fill" src="{tex("smoke_red.png")}" style="top:50%;height:55%">' +
           d.T(svgbox(art.skull_svg(stroke=BLACK), W / 2 - 560, 160, 1120, 1310) +
               fit('ENTER IF YOU DARE', 300, 1500, W - 600, 300, 'brush center', f'color:{BONE};text-shadow:0 0 20mm rgba(0,0,0,.9)')) +
           ov('wear_black.png'), label='C - SKULL')
    # D - Sponsor template
    d.page(ov('board_black.jpg') + glow(50, 50) +
           d.T(box(150, 150, W - 300, H - 300, '', f'border:22mm solid {RED}') +
               box(260, 260, W - 520, H - 520,
                   '<div class="col" style="height:100%;align-items:center;justify-content:center;gap:40mm">'
                   f'<div class="anton" style="font-size:150mm;color:{BONE};opacity:.9">SPONSOR ARTWORK</div>'
                   f'<div class="anton track" style="font-size:60mm;color:{EMBER}">PLACE AS SUPPLIED &nbsp;·&nbsp; DO NOT ALTER</div>'
                   f'<div class="sans" style="font-size:45mm;color:{BONE};opacity:.7">Clear zone 2480 x 1480 mm &mdash; white or red logo versions on black</div></div>',
                   f'border:8mm dashed rgba(239,230,214,.35)')), label='D - SPONSOR TEMPLATE')
    d.proof_pages = [0, 1, 2, 3]
    d.notes = ['Supplied at 1:10 - output at 1000%. Four panel designs; mix along the drape walls (suggested rhythm A-D-B-D-C-D).',
               'Panel D is a TEMPLATE: drop sponsor artwork into the clear zone exactly as supplied, then delete the placeholder text.',
               'TCM panel uses the brush wordmark seen in the concept render; swap for the official TCM vector logo if brand rules require.']
    return register(d)


# ------------------------------------------------------------------ 05 Brush backdrop
def brush_backdrop():
    d = Doc('05', 'Brush-Lettered-Backdrop_Meat-and-Greet', 'Brush-lettered "Meat & Greet" backdrop', 'Signage', 'Stage side, bar front', '1-2',
            'Red vinyl / red PVC banner, black brush lettering (printed - or paint over this as a guide)', 2000, 3000, bleed=30, scale=10, folder=F)
    W, H = d.w, d.h
    rows = [('MEAT &amp;', -260, 40, -3), ('GREET', -120, 560, 2), ('MEAT &amp;', -420, 1120, -2), ('GREET', -60, 1680, 3), ('MEAT &amp;', -300, 2240, -1)]
    big = ''.join(text(t, x, y, 2700, 640, 'brush nowrap', f'color:{BLACK};transform:rotate({r}deg);opacity:{.92 if i % 2 else 1}') for i, (t, x, y, r) in enumerate(rows))
    d.page(ov('board_red.jpg') + d.T(big) + ov('drybrush_red.png', .9) + ov('wear_red.png') +
           d.T(box(W / 2 - 430, 1080, 860, 683, logo_svg(style='width:100%;height:100%'), 'filter:drop-shadow(0 0 25mm rgba(0,0,0,.7))') +
               box(0, 2700, W, 220, f'<div class="anton center" style="font-size:120mm;color:{BONE};letter-spacing:.06em;'
                   f'background:{BLACK};padding:30mm 0 25mm">ENTER IF YOU DARE. LEAVE FULL.</div>')), bg=RED)
    d.notes = ['Supplied at 1:10. Logo sits at 1.2-1.9 m from the floor so it lands in every phone photo.',
               'Reference: the red vinyl "cuts and colors" backdrop on the mood board. Giant lettering deliberately crops off the edges.']
    return register(d)


# ------------------------------------------------------------------ floor plan drawing (shared with crew pack)
ZONES = [
    (1, 'Registration point', 'Police booking desk, wristbands, case cards'),
    (2, 'Entrance tunnel', 'Web gauze, skulls, chains. One scare per group'),
    (3, 'Circus of Shadows arch', 'The reveal into the compound'),
    (4, 'Guest tables (24)', 'Black cloth, LED lanterns, coffin centrepieces'),
    (5, 'Stage', 'FIRSTKLAZ MEATING, skull banners, haze'),
    (6, 'VIP wing, left', 'Raised, roped, ghost balloon cluster'),
    (7, 'VIP wing, right', 'Closest sightline to the stage'),
    (8, 'Poison Bar', 'Name your poison'),
    (9, 'Blood Bank Bar', 'IV-bag cocktails, syringe shooters'),
    (10, 'Grill zone', 'The grill is the show'),
    (11, 'Mugshot Booth', 'Media area 01 - get booked'),
    (12, 'Vendors + games', 'Carnival stalls, darts, knife target'),
    (13, 'Suspect Wall', 'Media area 02 - find your face'),
    (14, 'Danger Corner', 'Media area 03 - proceed with caution'),
]


def floorplan_svg(ink=BONE, ground='#171313', wall=CHAR, accent=RED, label_font='Anton', light=False):
    s = []
    T = lambda x, y, t, fs=24, c=ink, anchor='middle', rot=0, ls=2: s.append(
        f'<text x="{x}" y="{y}" font-family="{label_font}" font-size="{fs}" fill="{c}" text-anchor="{anchor}" letter-spacing="{ls}"'
        + (f' transform="rotate({rot} {x} {y})"' if rot else '') + f'>{t}</text>')
    # compound + tunnel
    s.append(f'<path d="M60,110 L940,110 L940,900 L580,900 L580,1060 L420,1060 L420,900 L60,900 Z" fill="{ground}" stroke="{wall}" stroke-width="14" stroke-linejoin="round"/>')
    s.append(f'<path d="M60,110 L940,110 L940,900 L580,900 M420,900 L60,900 Z" fill="none" stroke="{accent}" stroke-width="3" stroke-dasharray="2 10" opacity=".7"/>')
    # stage
    s.append(f'<rect x="330" y="118" width="340" height="120" fill="{accent}"/><rect x="430" y="238" width="140" height="22" fill="{accent}" opacity=".7"/>')
    T(500, 196, 'STAGE', 52, BONE if not light else '#fff', ls=6)
    # VIP wings
    for x, t in ((90, 'VIP LEFT'), (700, 'VIP RIGHT')):
        s.append(f'<rect x="{x}" y="128" width="210" height="160" fill="none" stroke="{ink}" stroke-width="3" stroke-dasharray="10 6"/>')
        for i in range(3):
            for j in range(2):
                s.append(f'<circle cx="{x + 45 + i*60}" cy="{185 + j*55}" r="15" fill="{ink}" opacity=".85"/>')
        T(x + 105, 160, t, 20, ink, ls=3)
    # guest tables 4 x 6
    for i in range(4):
        for j in range(6):
            cx, cy = 395 + i * 70, 320 + j * 80
            s.append(f'<circle cx="{cx}" cy="{cy}" r="19" fill="{ink}"/>')
            s.append(f'<text x="{cx}" y="{cy + 7}" font-family="{label_font}" font-size="18" fill="{ground}" text-anchor="middle">{j*4 + i + 1}</text>')
    # bars
    s.append(f'<rect x="72" y="340" width="44" height="180" fill="{accent}"/>'); T(100, 430, 'POISON BAR', 22, BONE, rot=-90, ls=3)
    s.append(f'<rect x="884" y="330" width="44" height="160" fill="{accent}"/>'); T(912, 410, 'BLOOD BANK', 22, BONE, rot=90, ls=3)
    # grill
    s.append(f'<rect x="874" y="510" width="54" height="150" fill="{EMBER}"/>'); T(908, 585, 'GRILL', 24, BLACK, rot=90, ls=4)
    # media areas
    s.append(f'<rect x="72" y="560" width="50" height="150" fill="none" stroke="{ink}" stroke-width="4"/>'); T(104, 635, 'MUGSHOTS', 20, ink, rot=-90, ls=2)
    s.append(f'<rect x="878" y="690" width="50" height="150" fill="none" stroke="{ink}" stroke-width="4"/>'); T(910, 765, 'DANGER', 20, ink, rot=90, ls=2)
    s.append(f'<rect x="620" y="836" width="250" height="50" fill="none" stroke="{ink}" stroke-width="4"/>'); T(745, 869, 'SUSPECT WALL', 20, ink, ls=3)
    # vendors
    for k in range(3):
        s.append(f'<rect x="{100 + k*95}" y="826" width="80" height="60" fill="{wall}" stroke="{ink}" stroke-width="3"/>')
    T(232, 812, 'VENDORS + GAMES', 20, ink, ls=3)
    # tunnel + arch
    for y in range(915, 1050, 22):
        s.append(f'<path d="M428,{y} Q500,{y+14} 572,{y}" fill="none" stroke="{ink}" stroke-width="1.5" opacity=".35"/>')
    s.append(f'<path d="M420,906 Q500,860 580,906" fill="none" stroke="{accent}" stroke-width="10"/>')
    T(500, 1000, 'TUNNEL', 22, ink, ls=4)
    s.append(f'<path d="M500,1040 L500,930" stroke="{ink}" stroke-width="5" marker-end="url(#ah)"/>')
    s.append(f'<defs><marker id="ah" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4 Z" fill="{ink}"/></marker></defs>')
    # registration
    s.append(f'<rect x="170" y="960" width="150" height="50" fill="{wall}" stroke="{ink}" stroke-width="3"/>'); T(245, 1046, 'REGISTRATION', 20, ink, ls=3)
    # numbered pins
    pins = {1: (245, 935), 2: (608, 1000), 3: (500, 862), 4: (345, 300), 5: (620, 278), 6: (195, 312), 7: (805, 312), 8: (140, 340),
            9: (860, 330), 10: (850, 520), 11: (146, 580), 12: (380, 805), 13: (600, 820), 14: (850, 700)}
    for n, (x, y) in pins.items():
        s.append(f'<circle cx="{x}" cy="{y}" r="22" fill="{accent}" stroke="{BONE}" stroke-width="3"/>')
        s.append(f'<text x="{x}" y="{y + 8}" font-family="{label_font}" font-size="24" fill="{BONE}" text-anchor="middle">{n}</text>')
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="40 90 920 990">{"".join(s)}</svg>'


def welcome_board():
    d = Doc('06', 'Welcome-Floor-Plan-Board', 'Welcome floor plan board', 'Signage', 'Entrance', '1',
            'A0 foam board 5 mm (or roll-up 850 x 2000 - scale to width)', 841, 1189, bleed=5, folder=F)
    W, H = d.w, d.h
    leg = ''.join(
        f'<div class="flex" style="gap:5mm;align-items:center;margin-bottom:7mm;break-inside:avoid">'
        f'<div class="anton center" style="flex:none;width:19mm;height:19mm;border-radius:50%;background:{RED};color:{BONE};font-size:11mm;line-height:19mm">{n}</div>'
        f'<div><div class="anton" style="font-size:13mm;color:{BONE}">{esc(t)}</div><div class="sans" style="font-size:7mm;color:{BONE};opacity:.75;margin-top:1mm">{esc(s)}</div></div></div>'
        for n, t, s in ZONES)
    d.page(ov('board_black.jpg') +
           f'<div class="full" style="background:radial-gradient(ellipse 70% 30% at 50% 8%, rgba(179,18,28,.55), rgba(11,9,9,0) 70%)"></div>' +
           d.T(box(40, 40, 190, 151, logo_svg(style='width:100%;height:100%')) +
               text('WELCOME TO THE', 260, 50, 540, 26, 'anton', f'color:{EMBER};letter-spacing:.18em') +
               fit('CARNIVAL', 258, 76, 540, 120, 'brush', f'color:{BONE}') +
               text('Find your way around. And out.', 262, 196, 540, 13, 'sans', f'color:{BONE};opacity:.85;font-weight:600') +
               box(40, 238, W - 80, 2, '', f'background:{RED}') +
               svgbox(floorplan_svg(), 60, 250, W - 120, 520) +
               box(60, 775, W - 120, 50,
                   f'<div class="flex" style="align-items:center;gap:8mm;height:100%"><div class="anton" style="font-size:15mm;color:{RED}">YOU ARE HERE: 1</div>'
                   f'<div class="sans" style="font-size:6.2mm;line-height:1.35;color:{BONE};font-weight:500">Registration &rarr; tunnel &rarr; the arch. Toilets, first aid and exits:<br>follow the white-lit signs, or ask any steward with a torch.</div></div>') +
               box(60, 840, W - 120, 250, leg, 'column-count:2;column-gap:14mm') +
               box(0, H - 95, W, 95,
                   f'<div style="height:100%;background:{RED};display:flex;align-items:center;justify-content:space-between;padding:0 40mm">'
                   f'<div class="anton" style="font-size:20mm;color:{BONE}">ENTER IF YOU DARE.</div>'
                   f'<div class="anton" style="font-size:20mm;color:{BLACK}">LEAVE FULL.</div></div>')) +
           ov('wear_black.png', .4))
    d.notes = ['Toilets / first aid are not on the venue plan yet. Once positions are locked, add pins to floorplan_svg() in p_signage.py and rebuild.',
               'The same vector plan is used in the crew pack (item 36).']
    return register(d)


# ------------------------------------------------------------------ 07 Zone signs
ZONE_SIGNS = [
    (1, 'REGISTRATION', 'Police booking desk &middot; get processed', 'crime', 'fingerprint'),
    (6, 'VIP &middot; LEFT WING', 'Raised. Roped. Reserved.', 'grave', 'coffin'),
    (7, 'VIP &middot; RIGHT WING', 'Front-row sightline to the stage', 'grave', 'coffin'),
    (8, 'POISON BAR', 'Name your poison', 'grave', 'poison'),
    (9, 'BLOOD BANK BAR', 'Transfusions served all night', 'grave', 'iv'),
    (10, 'GRILL ZONE', 'The grill is the show', 'grave', 'flame'),
    (11, 'MUGSHOT BOOTH', 'Media area 01 &middot; get booked, get the picture', 'crime', 'camera'),
    (12, 'VENDOR AREA', 'Carnival stalls &middot; games &middot; merch', 'carnival', 'knife'),
    (13, 'SUSPECT WALL', 'Media area 02 &middot; find your face, join the case', 'crime', 'hand'),
    (14, 'DANGER CORNER', 'Media area 03 &middot; proceed with caution', 'crime', 'hazard'),
]
WORLD = {'crime': 'CRIME SCENE', 'grave': 'GRAVEYARD BBQ', 'carnival': 'CARNIVAL OF SHADOWS'}


def zone_icon(k):
    return {
        'fingerprint': art.fingerprint(ink=BONE, sw=2.6), 'coffin': art.coffin_svg(fill=CHAR, stroke=BONE, sw=3, cross=RED),
        'poison': art.skull_crossbones(), 'iv': art.iv_bag(), 'flame': art.flame(), 'camera': art.camera_icon(),
        'knife': art.knife(), 'hand': art.handprint(), 'hazard': art.hazard_triangle(fill=EMBER),
    }[k]


def zone_signs():
    d = Doc('07', 'Zone-Signs_x10', 'Zone signs x10', 'Signage', 'Site-wide', '10 (1 of each page)',
            '5 mm correx / foamex, brush-style type; cable-tie holes in corners', 1200, 400, bleed=5, folder=F)
    W, H = d.w, d.h
    for n, name, tag, world, icon in ZONE_SIGNS:
        if world == 'crime':
            strip = svgbox(art.danger_tape_svg(1220, 46, 'CRIME SCENE · DO NOT CROSS · ', stripe=RED, band=BLACK, ink=BONE), -5, H - 52, W + 10, 52)
        elif world == 'carnival':
            strip = svgbox(art.stripes_v(1220, 40, 40, RED, BLACK), -5, H - 40, W + 10, 45)
        else:
            strip = box(-5, H - 40, W + 10, 45, '', f'background:linear-gradient(90deg,{RED},{EMBER},{RED})')
        d.page(ov('board_black.jpg') +
               f'<div class="full" style="background:radial-gradient(ellipse 40% 90% at 12% 45%, rgba(179,18,28,.6), rgba(11,9,9,0) 70%)"></div>' +
               d.T(box(60, 70, 190, 190, f'<div class="anton center" style="width:100%;height:100%;border-radius:50%;background:{RED};'
                                         f'border:6mm solid {BONE};color:{BONE};font-size:110mm;line-height:178mm">{n}</div>') +
                   fit(name, 300, 70, 640, 175, 'brush', f'color:{BONE}', maxs=190) +
                   svgbox(zone_icon(icon), 990, 70, 170, 190) + strip) +
               ov('wear_black.png', .8) +
               d.T(text(WORLD[world] + f' &nbsp;·&nbsp; ZONE {n:02d}', 60, 290, 600, 20, 'anton', f'color:{EMBER};letter-spacing:.3em') +
                   text(tag, 300, 275, 860, 30, 'anton', f'color:{BONE};letter-spacing:.06em;text-align:right;opacity:.9')),
               label=name.replace('&middot;', '-'))
    d.proof_pages = [3, 6, 9]
    d.notes = ['Numbers match the floor plan pins (item 06) so guests can cross-reference.',
               'World colour-coding: danger tape = Crime Scene, red/ember = Graveyard BBQ, stripes = Carnival.']
    return register(d)


# ------------------------------------------------------------------ 08 Directional
def directional():
    d = Doc('08', 'Directional-and-Facilities-Signs', 'Directional and facilities signs', 'Signage', 'Site-wide', 'TBC (9 designs)',
            '5 mm correx, cable-tie holes; position at eye height or above crowd line', 600, 300, bleed=5, folder=F)
    W, H = d.w, d.h
    items = []
    for lab, icon in (('TOILETS', art.wc_icon()), ('WAY OUT', art.exit_icon()), ('FIRST AID', art.cross_icon(fill=BONE))):
        for dr in ('left', 'up', 'right'):
            items.append((lab, icon, dr))
    for lab, icon, dr in items:
        arrow = svgbox(art.arrow(dr, BLACK), 0, 0, 150, 150, '')
        a_x = 30 if dr == 'left' else W - 210
        i_x = W - 200 if dr == 'left' else 230
        t_x = 210 if dr == 'left' else 40
        content = (box(a_x, 55, 180, 180, f'<div style="width:100%;height:100%;background:{BONE};border-radius:6mm;padding:15mm">{arrow}</div>') +
                   fit(lab, t_x if dr != 'left' else 230, 70, 340 if dr != 'up' else 340, 110, 'anton', f'color:{BONE}', maxs=120) +
                   svgbox(icon, (t_x if dr != 'left' else 230), 200, 110, 70) +
                   text('THIS WAY', (t_x if dr != 'left' else 230) + 125, 222, 220, 28, 'anton', f'color:{EMBER};letter-spacing:.2em'))
        d.page(f'<div class="full" style="background:{BLACK}"></div>' + d.T(content + box(0, 0, 14, H, '', f'background:{RED}') + box(W - 14, 0, 14, H, '', f'background:{RED}')),
               label=f'{lab} {dr}')
    d.proof_pages = [0, 4, 8]
    d.notes = ['Safety signage is deliberately clean (no distress) and high-contrast for low light and haze.',
               'Statutory fire-exit and first-aid signs (ISO 7010 green) must still be installed as the venue requires - these themed signs supplement them.']
    return register(d)


# ------------------------------------------------------------------ 09 House rules
RULES = [
    ('NO REAL BLADES.', 'Prop weapons must be foam or plastic. Real blades are refused at the gate.'),
    ('THE GRILL IS THE ONLY LIVE FIRE.', 'Every other flame here is LED. No flares, sparklers or smoke devices.'),
    ('OUR ACTORS NEVER TOUCH YOU.', 'So don&rsquo;t touch them. Want out of the tunnel? Take the opt-out door.'),
    ('DRINK LIKE YOU WANT TO REMEMBER IT.', 'Free water at both bars. Bar teams will refuse service to anyone who&rsquo;s had enough.'),
    ('COME DRESSED TO KILL.', 'Halloween costume or all-black. Keep it fun-scary &mdash; nothing that frightens for real.'),
    ('FOLLOW THE TORCHES.', 'Stewards carry torches. If they ask you to move, move. Exits are white-lit.'),
]


def house_rules():
    d = Doc('09', 'House-Rules-Sign', 'House rules sign', 'Signage', 'Registration', '1-2',
            'A1 foam board 5 mm', 594, 841, bleed=5, folder=F)
    W, H = d.w, d.h
    rows = ''.join(
        f'<div class="flex" style="gap:12mm;margin-bottom:20mm;align-items:flex-start">'
        f'<div class="anton" style="flex:none;width:56mm;font-size:52mm;color:{RED};line-height:.85">{i + 1:02d}</div>'
        f'<div><div class="anton" style="font-size:27mm;color:{BONE};line-height:1">{t}</div>'
        f'<div class="sans" style="font-size:11.5mm;line-height:1.3;color:{BONE};opacity:.85;margin-top:3mm;font-weight:500">{s}</div></div></div>'
        for i, (t, s) in enumerate(RULES))
    d.page(ov('board_black.jpg') +
           f'<div class="full" style="background:radial-gradient(ellipse 80% 25% at 50% 0%, rgba(179,18,28,.7), rgba(11,9,9,0) 70%)"></div>' +
           d.T(text('MEAT &amp; GREET POLICE DEPT. &nbsp;·&nbsp; NOTICE', 40, 38, W - 80, 9, 'anton', f'color:{EMBER};letter-spacing:.28em') +
               fit('HOUSE RULES', 38, 58, W - 76, 110, 'brush', f'color:{BONE}') +
               text('Break them and you&rsquo;re the next exhibit.', 40, 178, W - 80, 13, 'anton', f'color:{RED};letter-spacing:.03em') +
               box(40, 215, W - 80, 2, '', f'background:{BONE};opacity:.3') +
               text(rows, 40, 245, W - 80, 10, 'sans', h=545, shrink=True) +
               svgbox(art.danger_tape_svg(620, 34, 'BEHAVE · ENJOY · EAT · REPEAT · ', stripe=RED), -10, H - 64, W + 20, 40)) +
           ov('wear_black.png', .35))
    d.notes = ['Copy is drawn from the safety plan (blades, LED flame, actor contact, alcohol, stewards). Approve wording with the event director before print.']
    return register(d)


# ------------------------------------------------------------------ 10 Fence boards
def fence_boards():
    d = Doc('10', 'Fence-Boards_Haunted-Keep-Out-Beware', 'Fence boards "Haunted / Keep Out / Beware"', 'Signage', 'Registration', '3',
            'Wood-effect print on 5 mm board, cut to rough plank shape - or paint on real timber using this as the guide', 900, 280, bleed=5, folder=F)
    W, H = d.w, d.h
    for t, col, rot, seed in (('HAUNTED', BONE, -2, 1), ('KEEP OUT', RED, 1.5, 2), ('BEWARE!', BONE, -1, 3)):
        nails = ''.join(box(x, y, 14, 14, '', 'border-radius:50%;background:radial-gradient(circle at 35% 35%, #8d8580, #2a2524 70%)')
                        for x, y in ((28, 28), (28, H - 42), (W - 42, 28), (W - 42, H - 42)))
        d.page(ov('wood_weathered.jpg') + f'<div class="full" style="box-shadow:inset 0 0 40mm rgba(0,0,0,.75)"></div>' +
               d.T(fit(t, 80, 30, W - 160, 200, 'brush center', f'color:{col};transform:rotate({rot}deg);'
                       f'text-shadow:1.5mm 1.5mm 0 rgba(0,0,0,.35)', maxs=220) +
                   '') +
               ov('wear_char.png', .9) + ov('drybrush_char.png', .6) + d.T(nails), bg='#3a302b', label=t)
    d.proof_pages = [0, 1, 2]
    return register(d)


def build():
    arch_sign()
    stage_backdrop()
    stage_led()
    skull_banners()
    perimeter()
    brush_backdrop()
    welcome_board()
    zone_signs()
    directional()
    house_rules()
    fence_boards()
