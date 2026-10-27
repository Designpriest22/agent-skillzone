"""Checklist items 21-30: activations (Crime Scene + Carnival worlds)."""
import math
from lib import *
import art

F = '04_Activations'

CHARGES = ['TOO MUCH SUYA', 'GRAND THEFT RIB', 'FIRST-DEGREE JOLLOF', 'ASSAULT WITH A DEADLY WING', 'POSSESSION OF EXCESS PLANTAIN',
           'JUMPING THE GRILL LINE', 'AGGRAVATED ASUN', 'DOUBLE-DIPPING', 'DANCING WITHOUT A LICENCE', 'LOOKING TOO GOOD IN BLACK']

SUSPECTS = [
    ('THE BUTCHER', 'butcher', 'Running an unlicensed carnival.'),
    ('THE SUYA SNATCHER', 'bandit', 'Too much suya. Way too much.'),
    ('THE RINGMASTER', 'ringmaster', 'Disturbing the peace with a megaphone.'),
    ('THE JOLLOF JUDGE', 'judge', 'Starting the jollof war. Again.'),
    ('THE BONE COLLECTOR', 'bones', 'Stealing ribs from the graveyard.'),
    ('DJ DEADLINE', 'dj', 'Killing it on the dancefloor.'),
    ('THE PLANTAIN WITCH', 'witch', 'Vanished with the plantain fingers.'),
    ('DR. TRANSFUSION', 'doctor', 'Running an unlicensed blood bank.'),
    ('GIGGLES', 'clown', 'Smiling too much. Suspicious.'),
    ('UNKNOWN SUSPECT', 'unknown', 'Seen entering the tunnel. Could be you.'),
]


# ------------------------------------------------------------------ 21 Mugshot height chart
def height_chart():
    d = Doc('21', 'Mugshot-Height-Chart-Backdrop', 'Mugshot height-chart backdrop', 'Activations', 'Mugshot Booth', '1',
            'Matt PVC banner / fabric, hang with bottom edge ON THE FLOOR (scale is measured from the bottom trim)', 2000, 2400, bleed=20, folder=F)
    W, H = d.w, d.h
    lines = []
    inch = 25.4
    for k in range(int(900 / (2 * inch)), int(2200 / (2 * inch)) + 1):
        h_mm = k * 2 * inch
        y = H - h_mm
        n_in = k * 2
        major = n_in % 12 == 0
        mid = n_in % 6 == 0
        sw = 6 if major else (3 if mid else 1.5)
        x0 = 0 if (major or mid) else 230
        lines.append(f'<line x1="{x0}" x2="{W - (0 if (major or mid) else 230)}" y1="{y:.1f}" y2="{y:.1f}" stroke="{BLACK}" stroke-width="{sw}" opacity="{1 if major else .8}"/>')
        if major or mid:
            ft, inc = divmod(n_in, 12)
            lab = f"{ft}&#x2032;{inc}&#x2033;" if inc else f"{ft}&#x2032;0&#x2033;"
            lines.append(f'<text x="40" y="{y - 14:.1f}" font-family="Anton" font-size="{90 if major else 54}" fill="{BLACK}">{lab}</text>')
    for cm in range(100, 221, 10):
        y = H - cm * 10
        lines.append(f'<text x="{W - 40}" y="{y - 14:.1f}" text-anchor="end" font-family="Anton" font-size="{60 if cm % 50 == 0 else 44}" fill="{RED}">{cm}</text>')
        lines.append(f'<line x1="{W - 180}" x2="{W}" y1="{y}" y2="{y}" stroke="{RED}" stroke-width="3"/>')
    svgl = f'<svg class="abs" style="left:0;top:0;width:{W}mm;height:{H}mm" viewBox="0 0 {W} {H}">{"".join(lines)}</svg>'
    d.page(f'<div class="full" style="background:#E9E1D2"></div>' + ov('paper.jpg', .35) +
           d.T(svgl +
               box(-20, -20, W + 40, 220, '', f'background:{BLACK}') +
               box(60, 25, 150, 119, logo_svg(style='width:100%;height:100%')) +
               text('MEAT &amp; GREET POLICE DEPT.', 240, 40, 1100, 72, 'anton', f'color:{BONE};letter-spacing:.06em') +
               text('LINEUP &nbsp;·&nbsp; HALLOWEEN BBQ PARTY &nbsp;·&nbsp; 31.10', 244, 125, 1200, 30, 'anton', f'color:{EMBER};letter-spacing:.3em') +
               text('CM', W - 160, 70, 120, 60, 'anton', f'color:{RED};text-align:right') +
               box(-20, H - 420, W + 40, 440, '', f'background:{BLACK}') +
               fit('BOOKED.', 300, H - 380, W - 600, 240, 'brush center', f'color:{BONE}') +
               text('STAND ON THE LINE &nbsp;·&nbsp; HOLD UP YOUR CHARGE &nbsp;·&nbsp; DON&rsquo;T SMILE (YOU WILL)', 0, H - 110, W, 32, 'anton center', f'color:{EMBER};letter-spacing:.18em')) +
           ov('wear_black.png', .25), bg='#E9E1D2')
    d.notes = ['The scale is TRUE only if the banner hangs with its bottom trim edge on the floor. Feet/inches on the left, cm on the right.',
               'Light background on purpose: it reads like the classic police lineup and lifts faces in the photos.']
    return register(d)


# ------------------------------------------------------------------ 22 Charge placards
def placards():
    d = Doc('22', 'Charge-Placards_x10_plus-blank', 'Pre-printed charge placards ("Wanted: Too Much Suya")', 'Activations', 'Mugshot Booth',
            '10 + blanks', 'A4 landscape on 5 mm foamex (chalkboard look). Last page = blank write-on (print on chalkboard vinyl)', 297, 210, bleed=3, folder=F)
    W, H = d.w, d.h

    def board(charge):
        frame = (box(-3, -3, W + 6, H + 6, '', 'border:14mm solid transparent;border-image:none') +
                 f'<div class="full" style="border:14mm solid #4a3a2f;box-shadow:inset 0 0 0 1.5mm #2a1f19, inset 0 0 25mm rgba(0,0,0,.6)"></div>')
        body = (text('MEAT &amp; GREET POLICE DEPT.', 0, 24, W, 6, 'anton center', f'color:{BONE};letter-spacing:.3em;opacity:.85') +
                text('WANTED FOR', 0, 36, W, 13, 'anton center', f'color:{EMBER};letter-spacing:.2em'))
        if charge:
            body += text(charge, 30, 62, W - 60, 30, 'chalk center', f'color:{BONE};line-height:1.15', h=95, shrink=True)
        else:
            body += ''.join(box(38, y, W - 76, .6, '', f'background:{BONE};opacity:.45') for y in (95, 125))
        body += (text('CASE No. ________', 26, 168, 120, 7, 'chalk', f'color:{BONE};opacity:.85') +
                 text('31.10', W - 90, 166, 64, 10, 'chalk', f'color:{BONE};text-align:right;opacity:.85'))
        return ov('chalkboard.jpg') + d.T(body) + ov('chalk_holes.png', .8) + frame
    for c in CHARGES:
        d.page(board(c), label=c)
    d.page(board(None), label='BLANK write-on')
    d.proof_pages = [0, 3, 10]
    d.notes = ['10 pre-printed charges + 1 blank (write in real chalk / chalk pen). Charges are fun-scary and food-led, per the brief.']
    return register(d)


# ------------------------------------------------------------------ 23 Mugshot photo print overlays
def photo_overlay():
    d = Doc('23', 'Mugshot-Photo-Print-Overlay_4x6', 'Mugshot photo paper - print overlay', 'Activations', 'Suspect Wall', 'Bulk (consumable)',
            'Digital overlay for the booth software: 4x6 in (1200 x 1800 px @300 dpi) PNG with transparent photo window. Buy paper/ink for the instant printer to suit.',
            101.6, 152.4, bleed=0, folder=F)
    W, H = d.w, d.h
    d.css = 'html,body{background:transparent!important}'
    win_top, win_bot = 16, 112
    d.page(d.T(
        box(0, 0, W, win_top, '', f'background:{BLACK}') +
        text('MEAT &amp; GREET POLICE DEPT.', 5, 4.2, 70, 4.2, 'anton', f'color:{BONE};letter-spacing:.1em') +
        text('31.10', W - 25, 3.5, 20, 6.5, 'anton', f'color:{RED};text-align:right') +
        ''.join(box(0, win_top + k * 8, 4 if k % 2 else 7, .4, '', f'background:{BONE};opacity:.85') for k in range(12)) +
        box(0, win_bot, W, H - win_bot, '', f'background:{BLACK}') +
        box(5, win_bot + 5, 28, 22, logo_img('width:100%;height:100%;object-fit:contain')) +
        text('BOOKED.', 37, win_bot + 4, 60, 13, 'brush', f'color:{BONE}') +
        text('CASE No. ________', 37, win_bot + 20, 60, 3.6, 'case', f'color:{BONE};opacity:.9') +
        text('HALLOWEEN BBQ PARTY &middot; ENTER IF YOU DARE. LEAVE FULL.', 5, H - 8, W - 10, 2.6, 'anton', f'color:{EMBER};letter-spacing:.16em')),
        bg='transparent', label='4x6 portrait')
    d.notes = ['PNG overlay (transparent photo window) is in this folder for the booth/printer software. One print goes on the Suspect Wall, one goes home.',
               'The PDF is a visual reference only.']
    d.png_px = (1200, 1800)
    d.png_transparent = True
    return register(d)


# ------------------------------------------------------------------ 24 Suspects wall header + WANTED posters
def suspects_header():
    d = Doc('24', 'Suspect-Wall-Header-Banner', '"Suspects" wall header banner', 'Activations', 'Suspect Wall', '1',
            'PVC banner, eyelets every 500 mm', 3000, 600, bleed=20, scale=10, folder=F)
    W, H = d.w, d.h
    strings = ''.join(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{RED}" stroke-width="5"/>'
                      f'<circle cx="{x1}" cy="{y1}" r="12" fill="{RED}"/><circle cx="{x2}" cy="{y2}" r="12" fill="{RED}"/>'
                      for x1, y1, x2, y2 in ((90, 130, 420, 420), (420, 420, 600, 160), (2420, 150, 2650, 440), (2650, 440, 2910, 180)))
    d.page(ov('board_black.jpg') +
           f'<div class="full" style="background:radial-gradient(ellipse 50% 90% at 50% 50%, rgba(179,18,28,.55), rgba(11,9,9,0) 70%)"></div>' +
           d.T(f'<svg class="abs" style="inset:0" viewBox="0 0 {W} {H}">{strings}</svg>' +
               svgbox(art.danger_tape_svg(3000, 70, 'CRIME SCENE · DO NOT CROSS · '), 0, 0, W, 70) +
               svgbox(art.danger_tape_svg(3000, 70, 'CRIME SCENE · DO NOT CROSS · '), 0, H - 70, W, 70) +
               svgbox(art.fingerprint(ink=RED, sw=2.5), 120, 120, 300, 380) +
               fit('THE SUSPECTS', 520, 90, 1960, 360, 'brush center', f'color:{BONE}') +
               svgbox(art.handprint(), 2560, 150, 280, 330)) +
           ov('wear_black.png', .6) +
           d.T(text('EVERYONE&rsquo;S GUILTY OF SOMETHING &nbsp;·&nbsp; FIND YOUR FACE &nbsp;·&nbsp; PIN IT &nbsp;·&nbsp; JOIN THE CASE', 0, 455, W, 42, 'anton center', f'color:{EMBER};letter-spacing:.22em')))
    d.notes = ['Supplied at 1:10. Sits above the Suspect Wall; red string runs from here to the pinned mugshots on site.']
    return register(d)


def wanted_posters():
    d = Doc('24', 'WANTED-Posters_x10', 'WANTED posters x10', 'Activations', 'Suspect Wall', '10 (1 of each)',
            'A3 on 170 gsm uncoated (aged-paper look), or 3 mm foamex for outdoor perimeter use', 297, 420, bleed=3, folder=F)
    W, H = d.w, d.h
    for name, kind, charge in SUSPECTS:
        hl = ''.join(f'<line x1="0" x2="200" y1="{y}" y2="{y}" stroke="#9c9183" stroke-width=".8"/>' for y in range(20, 250, 18))
        d.page(ov('paper.jpg') + d.T(
            fit('WANTED', 18, 12, W - 36, 90, 'anton center', f'color:{BLACK};letter-spacing:.02em') +
            text('FED OR ALIVE', 0, 104, W, 13, 'anton center', f'color:{RED};letter-spacing:.35em') +
            box(48, 128, W - 96, 150, f'<div style="position:absolute;inset:0;background:#d8ccb6;border:1.4mm solid {BLACK}"></div>'
                f'<svg class="abs" style="inset:0;width:100%;height:100%" viewBox="0 0 200 150" preserveAspectRatio="none">{hl}</svg>'
                f'<div class="abs" style="left:50%;top:6%;width:62%;height:94%;transform:translateX(-50%)">{art.suspect(kind, fill=CHAR, accent=RED).replace("<svg ", "<svg width=\"100%\" height=\"100%\" ", 1)}</div>') +
            fit(name, 24, 288, W - 48, 30, 'anton center', f'color:{BLACK}', maxs=30) +
            text(f'FOR: {charge}', 24, 325, W - 48, 9, 'case center', f'color:{BLACK}', h=24, shrink=True) +
            box(60, 352, W - 120, .8, '', f'background:{BLACK}') +
            text('REWARD', 0, 358, W, 7, 'anton center', f'color:{BLACK};letter-spacing:.4em') +
            text('BRAGGING RIGHTS', 0, 367, W, 16, 'anton center', f'color:{RED}') +
            text('MEAT &amp; GREET POLICE DEPT. &nbsp;·&nbsp; 31.10 &nbsp;·&nbsp; IF SEEN, DO NOT FEED', 0, 397, W, 4.2, 'anton center', f'color:{BLACK};letter-spacing:.18em;opacity:.75')) +
            ov('wear_char.png', .35), bg='#E8DCC4', label=name)
    d.proof_pages = [0, 5, 9]
    d.notes = ['Ten fictional "suspects" seed the wall before guests&rsquo; mugshots arrive. All silhouettes - no real faces, nothing gory.']
    return register(d)


# ------------------------------------------------------------------ 25 Released exit cards
def released_cards():
    d = Doc('25', 'Released-Exit-Cards', '"Released" exit cards', 'Activations', 'Exit', 'Per capacity',
            'A6 postcard 148 x 105 mm, 400 gsm uncoated, 4/4', 148, 105, bleed=3, folder=F)
    W, H = d.w, d.h
    d.page(ov('board_black.jpg') +
           f'<div class="full" style="background:radial-gradient(ellipse 60% 70% at 50% 50%, rgba(179,18,28,.5), rgba(11,9,9,0) 70%)"></div>' +
           d.T(text('MEAT &amp; GREET POLICE DEPT. &nbsp;·&nbsp; RELEASE ORDER', 0, 9, W, 3.4, 'anton center', f'color:{EMBER};letter-spacing:.28em') +
               box(16, 20, W - 32, 46, '', f'border:2.2mm solid {RED};transform:rotate(-5deg)') +
               fit('RELEASED', 24, 25, W - 48, 34, 'anton center', f'color:{RED};transform:rotate(-5deg);line-height:1.08', maxs=36) +
               text('Case closed. Charges dropped. Appetite satisfied.', 0, 74, W, 5, 'sans center', f'color:{BONE};font-weight:700') +
               text('CASE No. ________ &nbsp;&nbsp; TIME SERVED ________', 0, 86, W, 3.6, 'case center', f'color:{BONE};opacity:.85')) +
           ov('wear_black.png', .5), label='FRONT')
    d.page(ov('paper.jpg') + d.T(
        box(8, 8, 36, 29, logo_img('width:100%;height:100%;object-fit:contain')) +
        text('PROOF OF SURVIVAL', 50, 10, 90, 9, 'anton', f'color:{BLACK}') +
        text('I entered. I dared. I left full.', 50, 21, 90, 4.4, 'case', f'color:{BLACK}') +
        text('HALLOWEEN BBQ PARTY &middot; SATURDAY 31 OCTOBER &middot; A TCM PRODUCTION', 50, 30, 92, 2.6, 'anton', f'color:{RED};letter-spacing:.14em') +
        box(8, 44, W - 16, .5, '', f'background:{BLACK}') +
        text('Post your mugshot and tag the night', 8, 52, 80, 4, 'sans', f'color:{BLACK};font-weight:600') +
        text('#MEATANDGREET', 8, 59, 90, 12, 'anton', f'color:{BLACK}') +
        svgbox(art.fingerprint(ink=RED, sw=2.2), 106, 48, 32, 40) +
        text('MEAT &amp; GREET POLICE DEPT. &middot; THIS CARD IS YOUR ALIBI', 8, 92, W - 16, 2.6, 'anton', f'color:{BLACK};letter-spacing:.2em;opacity:.7')) +
        ov('wear_char.png', .3), bg=BONE, label='BACK')
    d.proof_pages = [0, 1]
    d.notes = ['Swapped for the case card (item 15) at the exit - the last beat of the guest journey. Confirm the hashtag before print.']
    return register(d)


# ------------------------------------------------------------------ 26 Balloon darts reskin
def balloon_darts():
    d = Doc('26', 'Butchers-Balloon-Darts-Board-Wrap', '"Butcher\'s Balloon Darts" board re-skin', 'Activations', 'Games', '1',
            'Printed vinyl wrap on existing board (assumed 1220 x 2440 mm / 4 x 8 ft - measure and confirm, file scales proportionally)', 1220, 2440, bleed=20, folder=F)
    W, H = d.w, d.h
    cols, rows = 5, 7
    gx, gy, gw, gh = 110, 640, W - 220, 1360
    pins = ''
    for i in range(cols):
        for j in range(rows):
            cx = gx + gw * (i + .5) / cols
            cy = gy + gh * (j + .5) / rows
            col = RED if (i + j) % 2 else BLACK
            pins += (f'<circle cx="{cx}" cy="{cy}" r="78" fill="{col}" opacity=".35"/>'
                     f'<circle cx="{cx}" cy="{cy}" r="78" fill="none" stroke="{BONE}" stroke-width="5" stroke-dasharray="14 10"/>'
                     f'<path d="M{cx - 14},{cy} L{cx + 14},{cy} M{cx},{cy - 14} L{cx},{cy + 14}" stroke="{BONE}" stroke-width="5"/>')
    d.page(f'<div class="full">{art.sunburst(1260, 2480, 630, 1300, 36, RED, BLACK).replace("<svg ", "<svg width=\"100%\" height=\"100%\" ", 1)}</div>' +
           f'<div class="full" style="background:radial-gradient(ellipse 60% 40% at 50% 54%, rgba(11,9,9,.0), rgba(11,9,9,.75) 90%)"></div>' +
           d.T(box(70, 70, W - 140, 500, '', f'background:{BLACK};border:12mm solid {BONE};outline:6mm solid {RED};outline-offset:-30mm') +
               svgbox(art.bulbs_rect(W - 140, 500, 70, 9, 22), 70, 70, W - 140, 500) +
               text('THE BUTCHER&rsquo;S', 0, 150, W, 80, 'rye center', f'color:{EMBER}') +
               fit('BALLOON DARTS', 150, 250, W - 300, 170, 'rye center', f'color:{BONE}') +
               text('STEP RIGHT UP &middot; IF YOU DARE', 0, 450, W, 34, 'anton center', f'color:{RED};letter-spacing:.3em') +
               f'<svg class="abs" style="left:0;top:0;width:{W}mm;height:{H}mm" viewBox="0 0 {W} {H}">{pins}</svg>' +
               box(70, 2080, W - 140, 290, f'<div class="col center" style="height:100%;justify-content:center;background:{BLACK};border:8mm solid {RED}">'
                   f'<div class="anton" style="font-size:95mm;color:{BONE};line-height:1">POP ONE. WIN ONE.</div>'
                   f'<div class="anton" style="font-size:42mm;color:{EMBER};letter-spacing:.2em;margin-top:12mm">DRINK TOKENS &middot; MERCH</div></div>')) +
           ov('wear_black.png', .5))
    d.notes = ['Dashed circles mark balloon positions (35) - alternate red and black balloons, per the mood board. Check the existing board size before print.']
    return register(d)


# ------------------------------------------------------------------ 27 Knife thrower's target
def knife_target():
    D = 1200
    d = Doc('27', 'Knife-Throwers-Target-Face', 'Knife Thrower\'s Target face', 'Activations', 'Games', '1',
            'Vinyl on 1200 mm round board (or paint guide); FOAM KNIVES / SOFT BALLS ONLY', D, D, bleed=10, folder=F)
    r = D / 2
    rings = ''
    radii = [600, 540, 460, 380, 300, 220, 140, 70]
    for k, rr in enumerate(radii):
        if k == 0:
            rings += f'<circle cx="{r}" cy="{r}" r="{rr + 10}" fill="{BLACK}"/>'
            continue
        rings += f'<circle cx="{r}" cy="{r}" r="{rr}" fill="{RED if k % 2 else BONE}"/>'
    pts = [10, 20, 30, 40, 50, 100]
    for k, rr in enumerate(radii[1:-1]):
        nr = radii[k + 2]
        y = r - (rr + nr) / 2 + 22
        rings += f'<text x="{r}" y="{y}" text-anchor="middle" font-family="Anton" font-size="54" fill="{BONE if (k + 1) % 2 else RED}">{pts[k]}</text>'
    rings += (f'<defs><path id="kt" d="M{r - 570},{r} A570,570 0 1 1 {r + 570},{r} A570,570 0 1 1 {r - 570},{r}"/></defs>'
              f'<text font-family="Anton" font-size="44" fill="{BONE}" dy="15"><textPath href="#kt" textLength="3570" lengthAdjust="spacing">'
              f'KNIFE THROWER&#8217;S TARGET · FOAM KNIVES ONLY · BULLSEYE WINS A GRILL VOUCHER · MEAT &amp; GREET · 31.10 ·</textPath></text>')
    rings += f'<g transform="translate({r - 40},{r - 50}) scale(.8)"><path d="{art.FLAME}" fill="{BLACK}"/></g>'
    d.page(f'<svg class="abs" style="left:0;top:0;width:{D + 20}mm;height:{D + 20}mm" viewBox="-10 -10 {D + 20} {D + 20}">'
           f'<circle cx="{r}" cy="{r}" r="{r + 10}" fill="{BLACK}"/>{rings}</svg>' + ov('wear_black.png', .35), bg=WHITE, label='ARTWORK')
    d.page(f'<svg class="abs" style="left:10mm;top:10mm;width:{D}mm;height:{D}mm;overflow:visible" viewBox="0 0 {D} {D}">'
           f'<circle cx="{r}" cy="{r}" r="{r}" fill="none" stroke="#FF00FF" stroke-width="1"/></svg>', bg=WHITE, label='DIELINE')
    d.notes = ['Safety plan: foam knives or soft balls only. Rings carry points; bullseye = grill voucher (from the activation plan).',
               'Leave the centre visible when mounting the clown skeleton - it sits across the outer rings.']
    return register(d)


# ------------------------------------------------------------------ 28 Jar of Heads wrap template
def jar_heads():
    d = Doc('28', 'Jar-of-Heads-Face-Wrap-Template', 'Jar of Heads face prints - wrap template', 'Activations', 'Media area, VIP', '10-20',
            'Print on 160 gsm photo paper, roll inside a ~90 mm diameter jar (circumference 280 mm). Page 1 = guide, page 2 = print template', 280, 120, bleed=3, folder=F)
    W, H = d.w, d.h
    bub = ''.join(f'<circle cx="{x}" cy="{y}" r="{rr}" fill="none" stroke="#f3d9b0" stroke-width=".5" opacity=".55"/>'
                  for x, y, rr in ((30, 90, 3), (40, 60, 2), (52, 100, 4), (230, 30, 3), (245, 80, 2.5), (260, 50, 4), (20, 30, 2), (210, 100, 3)))
    base = (f'<div class="full" style="background:radial-gradient(ellipse 50% 80% at 50% 55%, #8a3a1c, #3a160c 60%, #140806)"></div>' +
            d.T(f'<svg class="abs" style="inset:0" viewBox="0 0 {W} {H}">{bub}</svg>' +
                text(' &nbsp;SPECIMEN &middot;' * 12, -10, 6, W + 20, 5, 'anton nowrap', 'color:#f3d9b0;opacity:.25;letter-spacing:.3em') +
                text(' &nbsp;SPECIMEN &middot;' * 12, -40, H - 12, W + 60, 5, 'anton nowrap', 'color:#f3d9b0;opacity:.25;letter-spacing:.3em')))
    guide = d.T(box(W / 2 - 37, 14, 74, 92, '', 'border:.6mm dashed #fff;border-radius:50%') +
                text('PLACE GUEST FACE HERE<br>approx. 70 x 90 mm, cut out or blended', W / 2 - 50, 52, 100, 3.6, 'mono center', 'color:#fff') +
                text('OVERLAP / GLUE ZONE', 2, 56, 30, 2.6, 'mono center', 'color:#fff;transform:rotate(-90deg)') +
                box(10, 0, .3, H, '', 'background:#fff'))
    d.page(base + guide, label='GUIDE')
    d.page(base, label='TEMPLATE')
    d.proof_pages = [0]
    d.notes = ['Murky amber "preserving fluid" - not green (rule 2: no purple or green). Face goes centre; the wrap shows through the glass.',
               'Faces come from the Mugshot Booth files. Pair each jar with a SPECIMEN label (item 29). VIP giveaway.']
    return register(d)


# ------------------------------------------------------------------ 29 Specimen jar labels
def specimen_labels():
    d = Doc('29', 'Specimen-Jar-Labels_01-20', '"Specimen" jar labels', 'Activations', 'Media area, VIP', '20 (numbered 01-20)',
            'Sticker labels 90 x 55 mm, paper or clear-backed, 4/0', 90, 55, bleed=2, folder=F)
    W, H = d.w, d.h
    for n in range(1, 21):
        d.page(ov('paper.jpg') + d.T(
            box(3, 3, W - 6, H - 6, '', f'border:.6mm solid {BLACK};outline:.3mm solid {BLACK};outline-offset:-1.6mm') +
            text('MEAT &amp; GREET LABORATORY', 7, 6.5, 60, 2.6, 'anton', f'color:{BLACK};letter-spacing:.25em') +
            text('SPECIMEN', 6.5, 9.5, 60, 13, 'anton', f'color:{RED};letter-spacing:.02em') +
            text(f'No. {n:02d}', W - 30, 8, 24, 9, 'anton', f'color:{BLACK};text-align:right') +
            text('SUBJECT: ____________________', 7, 26, 76, 3.1, 'case', f'color:{BLACK}') +
            text('COLLECTED: 31.10 &nbsp; CAUSE: TOO MUCH FUN', 7, 32, 76, 3.1, 'case', f'color:{BLACK}') +
            text('CONDITION: WELL PRESERVED', 7, 38, 60, 3.1, 'case', f'color:{BLACK}') +
            svgbox(art.barcode(60, 10, seed=n), 7, 44, 42, 5.5) +
            text('DO NOT OPEN UNTIL HOME', 50, 45, 34, 2.4, 'anton', f'color:{RED};letter-spacing:.12em;text-align:right')), bg=BONE, label=f'{n:02d}')
    d.proof_pages = [6]
    return register(d)


# ------------------------------------------------------------------ 30 Costume contest tags
def costume_tags(count=100):
    D = 60
    d = Doc('30', 'Costume-Contest-Entry-Tags_001-100', 'Costume contest entry tags (numbered stickers)', 'Activations', 'Floor',
            f'TBC (file numbered 001-{count:03d})', 'Round 60 mm stickers, kiss-cut, 4/0', D, D, bleed=2, folder=F)
    for n in range(1, count + 1):
        d.page(f'<svg class="abs" style="left:0;top:0;width:{D + 4}mm;height:{D + 4}mm" viewBox="-2 -2 {D + 4} {D + 4}">'
               f'<circle cx="30" cy="30" r="32" fill="{BLACK}"/><circle cx="30" cy="30" r="27.5" fill="none" stroke="{EMBER}" stroke-width=".5"/>'
               f'<circle cx="30" cy="30" r="20.5" fill="none" stroke="{EMBER}" stroke-width=".5"/>'
               f'<defs><path id="ct" d="M6,30 A24,24 0 1 1 54,30 A24,24 0 1 1 6,30"/></defs>'
               f'<text font-family="Anton" font-size="3.6" fill="{EMBER}" dy="1.3"><textPath href="#ct" textLength="150" lengthAdjust="spacing">'
               f'COME DRESSED TO KILL · COSTUME CONTEST · MEAT &amp; GREET · 31.10 ·</textPath></text>'
               f'<text x="30" y="20" text-anchor="middle" font-family="Anton" font-size="3.6" fill="{BONE}" letter-spacing=".8">CONTESTANT</text>'
               f'<text x="30" y="38" text-anchor="middle" font-family="Anton" font-size="17" fill="{BONE}">{n:03d}</text>'
               f'<path d="M24,43 L36,43" stroke="{RED}" stroke-width="1"/></svg>', bg=WHITE, label=f'{n:03d}')
    d.proof_pages = [12]
    d.notes = ['Shortlist on the floor, final 5 on stage (per the plan). Prize TBC.']
    return register(d)


def build():
    height_chart()
    placards()
    photo_overlay()
    suspects_header()
    wanted_posters()
    released_cards()
    balloon_darts()
    knife_target()
    jar_heads()
    specimen_labels()
    costume_tags()
