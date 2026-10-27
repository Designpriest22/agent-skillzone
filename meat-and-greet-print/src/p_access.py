"""Checklist items 14-20: access, tokens, table cards, passes."""
from lib import *
import art
from p_menus import token_face

F = '03_Access'
CASE_CARD_COUNT = 500      # capacity TBC - change and rebuild


# ------------------------------------------------------------------ 14 Wristbands
def wristbands():
    d = Doc('14', 'Custom-Wristbands_GA-VIP-CREW', 'Custom wristbands', 'Access', 'Registration', 'Per capacity (split GA / VIP / Crew)',
            'Tyvek 254 x 25 mm (or fabric + lock), 1/1 or full colour; keep 25 mm adhesive tab end (right) clear', 254, 25, bleed=2, folder=F)
    W, H = d.w, d.h
    for lab, bg, ink, acc, word in (('GA', BLACK, BONE, RED, 'CASE FILE OPEN'), ('VIP', RED, BONE, BLACK, 'VIP · RESTRICTED'),
                                    ('CREW', EMBER, BLACK, BLACK, 'CREW · ALL ACCESS')):
        sk = art.skull_svg(fill=ink, socket=bg, glow_on=False, crack=False)
        d.page(d.T(
            box(6, 3.5, 22, 18, logo_img('width:100%;height:100%;object-fit:contain', 'bone' if bg != BLACK else 'color')) +
            text('MEAT &amp; GREET', 32, 4.2, 70, 6.6, 'anton', f'color:{ink}') +
            text('HALLOWEEN BBQ PARTY &middot; 31.10', 32, 13.4, 80, 3.4, 'anton', f'color:{ink};letter-spacing:.16em;opacity:.85') +
            svgbox(sk, 106, 4, 14, 17) +
            fit(word, 125, 6, 72, 9, 'anton', f'color:{acc if bg != BLACK else RED};', maxs=10) +
            text('ENTER IF YOU DARE', 125, 16.2, 72, 3.2, 'anton', f'color:{ink};letter-spacing:.22em;opacity:.8') +
            box(W - 27, 0, 27, H, '', f'background:{ink};opacity:.12')), bg=bg, label=lab)
    d.proof_pages = [0, 1, 2]
    d.notes = ['Three variants: GA (black), VIP (red), CREW (ember). The shaded 25 mm at the right end marks the adhesive tab - it does not print.']
    return register(d)


# ------------------------------------------------------------------ 15 Case number cards
def case_cards():
    d = Doc('15', 'Case-Number-Cards_numbered', 'Case number cards (numbered)', 'Access', 'Registration', f'Per capacity (file numbered 0001-{CASE_CARD_COUNT:04d})',
            '85 x 55 mm, 400 gsm uncoated, printed 4/4; numbered fronts + one shared back (last page)', 85, 55, bleed=3, folder=F)
    W, H = d.w, d.h
    fp = art.fingerprint(ink=RED, sw=2.4)
    for n in range(1, CASE_CARD_COUNT + 1):
        d.page(ov('paper.jpg', 1) + d.T(
            box(-3, -3, W + 6, 15, '', f'background:{BLACK}') +
            text('MEAT &amp; GREET POLICE DEPT.', 5, 2.6, 60, 3.6, 'anton', f'color:{BONE};letter-spacing:.12em') +
            text('BOOKING RECORD', 5, 7.4, 60, 2.3, 'anton', f'color:{EMBER};letter-spacing:.35em') +
            text('31.10', W - 25, 3.2, 20, 5, 'anton', f'color:{RED};text-align:right') +
            text('CASE No.', 5, 16.5, 30, 3, 'case', f'color:{BLACK}') +
            text(f'{n:04d}', 4, 19, 50, 15.5, 'anton', f'color:{RED};letter-spacing:.04em') +
            text('CHARGE: <span style="display:inline-block;width:33mm;border-bottom:.25mm solid #0B0909"></span>', 5, 38, 60, 2.9, 'case', f'color:{BLACK}') +
            text('ARRESTING OFFICER: THE GRILL', 5, 44, 60, 2.4, 'case', f'color:{BLACK};opacity:.8') +
            svgbox(fp, 58, 15.5, 22, 26) +
            text('<span class="stamp" style="font-size:3.4mm;border-width:.5mm;padding:.8mm 1.4mm;color:#B3121C;border-color:#B3121C">IN CUSTODY</span>',
                 52, 43, 30, 3.4, 'anton', 'transform:rotate(-8deg)')), bg=BONE, label=f'{n:04d}')
    d.page(ov('board_black.jpg') + d.T(
        box(5, 5, 26, 21, logo_img('width:100%;height:100%;object-fit:contain')) +
        text('KEEP THIS CARD.', 35, 6, 46, 6.4, 'anton', f'color:{BONE}') +
        text('It&rsquo;s your way out.', 35, 14, 46, 3.2, 'sans', f'color:{EMBER};font-weight:700') +
        text(f'<div style="line-height:1.45"><b style="color:{RED}">1</b>&nbsp; Get booked at the Mugshot Booth.<br>'
             f'<b style="color:{RED}">2</b>&nbsp; Find your face on the Suspect Wall.<br>'
             f'<b style="color:{RED}">3</b>&nbsp; Hand this in at the exit for your RELEASED card.</div>', 5, 30, W - 10, 3, 'sans', f'color:{BONE};font-weight:500') +
        text('ENTER IF YOU DARE. LEAVE FULL.', 5, 47.5, W - 10, 2.6, 'anton', f'color:{BONE};letter-spacing:.22em;opacity:.6')), label='BACK')
    d.proof_pages = [136, CASE_CARD_COUNT]
    d.notes = [f'Pages 1-{CASE_CARD_COUNT} are numbered fronts (0001-{CASE_CARD_COUNT:04d}); last page is the shared back. Capacity TBC: change CASE_CARD_COUNT in p_access.py and rebuild.',
               'Journey hook: booking desk issues it, Mugshot Booth references it, exit swaps it for the "Released" card (item 25).']
    return register(d)


# ------------------------------------------------------------------ 16 Tokens
def tokens():
    d = Doc('16', 'Grill-and-Drink-Tokens', 'Grill and drink tokens', 'Access', 'Registration, bars', 'Per capacity',
            'Round 38 mm, 600 gsm board or plastic, 4/4, die-cut (dieline = trim circle). Two colours tell grill from bar', 38, 38, bleed=2, folder=F)
    W = d.w
    back = lambda bg, v: (f'<div class="full" style="background:{bg};border-radius:50%"></div>' + d.T(
        box(7, 7.5, 24, 19, logo_img('width:100%;height:100%;object-fit:contain', v)) +
        text('NO CASH VALUE &middot; 31.10', 3, 28, 32, 2.3, 'anton center', f'color:{BONE if bg != EMBER else BLACK};letter-spacing:.12em')))
    d.page(d.T(svgbox(token_face('grill'), 0, 0, W, W)), bg=EMBER, label='GRILL front')
    d.page(back(EMBER, 'color'), bg=EMBER, label='GRILL back')
    d.page(d.T(svgbox(token_face('bar'), 0, 0, W, W)), bg=RED, label='BAR front')
    d.page(back(RED, 'color'), bg=RED, label='BAR back')
    d.page(d.T(f'<svg class="abs" style="inset:0;overflow:visible" viewBox="0 0 38 38"><circle cx="19" cy="19" r="19" fill="none" stroke="#FF00FF" stroke-width=".1"/></svg>'),
           bg=WHITE, label='DIELINE')
    d.proof_pages = [0, 2]
    d.notes = ['Pages: grill front/back, bar front/back, dieline. Ember = GRILL, blood red = BAR - readable at a glance in low light.',
               'Printer can impose on SRA3 (48-up at 38 mm). Plastic poker-chip stickers at 38 mm also work with these files.']
    return register(d)


# ------------------------------------------------------------------ 17 VIP reserved tent cards
def vip_tents():
    d = Doc('17', 'VIP-Reserved-Tent-Cards', 'VIP reserved cards (tent)', 'Access', 'VIP wings', 'Per VIP table',
            '148 x 210 mm flat, scored and folded at 105 mm to a 148 x 105 mm tent; 350 gsm silk', 148, 210, bleed=3, folder=F)
    W, H = d.w, d.h

    def face():
        return (f'<div class="abs" style="left:0;top:0;width:{W}mm;height:105mm">'
                + ov('board_black.jpg') +
                f'<div class="full" style="background:radial-gradient(ellipse 60% 60% at 50% 100%, rgba(179,18,28,.75), rgba(11,9,9,0) 70%)"></div>' +
                text('MEAT &amp; GREET &nbsp;·&nbsp; 31.10', 0, 12, W, 3.6, 'anton center', f'color:{EMBER};letter-spacing:.32em') +
                fit('RESERVED', 18, 20, W - 36, 30, 'brush center', f'color:{BONE}') +
                text('VIP', 0, 52, W, 22, 'anton center', f'color:{RED};letter-spacing:.12em') +
                text('TABLE <span style="display:inline-block;width:24mm;border-bottom:.5mm dashed #EFE6D6"></span>', 0, 79, W, 6, 'anton center', f'color:{BONE};letter-spacing:.1em') +
                text('Raised. Roped. Reserved.', 0, 92, W, 3.6, 'sans center', f'color:{BONE};opacity:.7;font-weight:600') + '</div>')
    d.page(d.T(f'<div class="abs" style="left:0;top:0;width:{W}mm;height:105mm;transform:rotate(180deg)">{face()}</div>' +
               f'<div class="abs" style="left:0;top:105mm;width:{W}mm;height:105mm">{face()}</div>') +
           ov('wear_black.png', .35) +
           d.T(box(-3, 104.9, W + 6, .2, '', 'border-top:.2mm dashed rgba(239,230,214,0)')))
    d.notes = ['Fold at 105 mm (score line, not printed). Top half is upside-down on purpose so both faces read when folded. Table number is write-on.']
    d.tent = True
    return register(d)


# ------------------------------------------------------------------ 18 Coffin table numbers
def table_numbers():
    d = Doc('18', 'Table-Numbers_1-24_Coffin-Tent', 'Table numbers 1-24 (coffin tent cards)', 'Access', 'Guest tables', '24',
            '100 x 300 mm flat, die-cut double coffin, scored at 150 mm; 450 gsm board, 4/0', 100, 300, bleed=3, folder=F)
    W, H = d.w, d.h
    pts = [(27, 0), (73, 0), (100, 111), (81, 150), (100, 189), (73, 300), (27, 300), (0, 189), (19, 150), (0, 111)]
    d.dieline = art.poly_path(pts)
    b = 3
    bp = [(27 - 1, -b), (73 + 1, -b), (100 + b, 111), (81 + b, 150), (100 + b, 189), (73 + 1, 300 + b), (27 - 1, 300 + b), (-b, 189), (19 - b, 150), (-b, 111)]
    clip = 'polygon(' + ','.join(f'{x + b}mm {y + b}mm' for x, y in bp) + ')'

    def face(n):
        return (f'<div class="abs" style="left:0;top:0;width:{W}mm;height:150mm">' +
                f'<svg class="abs" style="inset:0" viewBox="0 0 100 150"><path d="M19,0 L81,0 L100,39 L73,150 L27,150 L0,39 Z" transform="translate(50 75) scale(.9) translate(-50 -75)" fill="none" stroke="{RED}" stroke-width=".8"/></svg>' +
                text('TABLE', 0, 14, W, 5, 'anton center', f'color:{EMBER};letter-spacing:.4em') +
                fit(f'{n:02d}', 18, 30, 64, 58, 'anton center', f'color:{BONE};line-height:1', maxs=62) +
                box(46.5, 102, 7, 26, '', f'background:{RED}') + box(40, 108, 20, 6, '', f'background:{RED}') +
                text('REST IN PIECES', 0, 134, W, 3.4, 'anton center', f'color:{BONE};letter-spacing:.25em;opacity:.75') + '</div>')
    for n in range(1, 25):
        d.page(f'<div class="full" style="clip-path:{clip}">' + ov('wood_tall.jpg') +
               f'<div class="full" style="background:radial-gradient(ellipse 80% 22% at 50% 50%, rgba(179,18,28,.6), rgba(11,9,9,0) 70%)"></div>' +
               d.T(f'<div class="abs" style="left:0;top:0;width:{W}mm;height:150mm;transform:rotate(180deg)">{face(n)[face(n).index(">")+1:-6]}</div>' +
                   f'<div class="abs" style="left:0;top:150mm;width:{W}mm;height:150mm">{face(n)[face(n).index(">")+1:-6]}</div>') +
               ov('wear_black.png', .4) + '</div>', bg=WHITE, label=f'TABLE {n:02d}')
    d.page(f'<svg class="abs" style="left:{b}mm;top:{b}mm;width:{W}mm;height:{H}mm;overflow:visible" viewBox="0 0 {W} {H}">'
           f'<path d="{d.dieline}" fill="none" stroke="#FF00FF" stroke-width=".25"/>'
           f'<path d="M19,150 L81,150" stroke="#00AEEF" stroke-width=".25" stroke-dasharray="2 1.5"/></svg>' +
           text('MAGENTA = CUT &nbsp; CYAN DASH = SCORE/FOLD', 5, 155, 90, 3, 'mono center', 'color:#555'), bg=WHITE, label='DIELINE')
    d.proof_pages = [6]
    d.notes = ['24 numbered pages + dieline (last page). Two coffins meet head-to-head at the fold so both faces read upright on the table.',
               'Pairs with the coffin centrepieces on the event plan.']
    d.shape_preview = True
    return register(d)


# ------------------------------------------------------------------ 19 Crew passes / 20 Media passes
ROLES = [
    ('EVENT DIRECTOR', 'ED', BONE, BLACK, 'Owns the plan, the call and the radio channel for emergencies.'),
    ('PRODUCTION', 'PRD', RED, BONE, 'Build, power, drapes, fire kit.'),
    ('STAGE + TECH', 'STG', RED, BONE, 'Stage, lighting, haze, sound, screens.'),
    ('SECURITY', 'SEC', BLACK, RED, 'Gate, bag check, crowd, blades policy.'),
    ('FRONT OF HOUSE', 'FOH', EMBER, BLACK, 'Booking desk, tunnel flow, opt-out door.'),
    ('BAR', 'BAR', RED, BONE, 'Poison Bar + Blood Bank Bar.'),
    ('GRILL', 'GRL', EMBER, BLACK, 'Grill lines, runners, fire safety.'),
    ('SCARE ACTOR', 'ACT', BLACK, BONE, 'Scare, never touch. Stay in your zone.'),
    ('MEDICAL', 'MED', BLACK, BONE, 'First aid point + medical channel.'),
]


def pass_front(d, role, code, band, ink, desc, label='CREW'):
    W, H = d.w, d.h
    return (ov('board_black.jpg') + d.T(
        box(-3, -3, W + 6, 30, '', f'background:{BLACK}') +
        box(W / 2 - 8, 6, 16, 4, '', 'border-radius:2mm;background:#555;opacity:.0') +
        box(6, 13, 24, 19, logo_img('width:100%;height:100%;object-fit:contain')) +
        text(f'{label}', 34, 14, 50, 9, 'anton', f'color:{BONE};letter-spacing:.1em') +
        text('HALLOWEEN BBQ PARTY · 31.10', 34, 24.5, 52, 2.6, 'anton', f'color:{EMBER};letter-spacing:.18em') +
        box(-3, 38, W + 6, 46, f'<div style="height:100%;background:{band};{"border-top:1.2mm solid #B3121C;border-bottom:1.2mm solid #B3121C" if band == BLACK else ""}"></div>') +
        fit(code, 6, 41, W - 12, 34, 'anton center', f'color:{ink};line-height:1', maxs=36) +
        fit(role, 6, 76, W - 12, 6, 'anton center', f'color:{ink};letter-spacing:.12em', maxs=6) +
        text('NAME', 6, 92, 30, 3, 'anton', f'color:{EMBER};letter-spacing:.3em') +
        box(6, 104, W - 12, .4, '', f'background:{BONE};opacity:.6') +
        text(desc, 6, 108, W - 12, 3.2, 'sans', f'color:{BONE};opacity:.75;line-height:1.3;font-weight:500') +
        text('SHOW ON REQUEST &middot; NOT TRANSFERABLE', 6, 121, W - 12, 2.3, 'anton', f'color:{BONE};opacity:.5;letter-spacing:.2em')))


def pass_back(d, lines, title='IF IT GOES WRONG'):
    W, H = d.w, d.h
    rows = ''.join(f'<div style="margin-bottom:4mm"><div class="anton" style="font-size:4.2mm;color:{EMBER};letter-spacing:.12em">{a}</div>'
                   f'<div class="sans" style="font-size:3.3mm;color:{BONE};line-height:1.35;margin-top:1mm">{b}</div></div>' for a, b in lines)
    return (ov('board_black.jpg') + d.T(
        text(title, 6, 26, W - 12, 7, 'anton', f'color:{BONE}') +
        box(6, 36, W - 12, .8, '', f'background:{RED}') + text(rows, 6, 41, W - 12, 3, 'sans', h=70) +
        svgbox(art.skull_svg(), W / 2 - 6, 113, 12, 14)))


BACK_LINES = [
    ('FIRE / SMOKE', 'Extinguishers at the grill and both bars. Clear the area, radio it in, stewards open the lit exits.'),
    ('MEDICAL', 'Bring them to the first aid point or call it on the medical channel. Never move a casualty alone.'),
    ('LOST / OVERWHELMED GUEST', 'Walk them out of the haze to a white-lit aisle. Opt-out door is at the tunnel.'),
    ('RADIO', 'Channels and call signs: see your radio call sheet.'),
]


def crew_passes():
    d = Doc('19', 'Crew-ID-Passes_by-role', 'Crew ID passes (by role)', 'Access', 'Crew', 'Per crew (9 roles)',
            '90 x 130 mm portrait lanyard card, 450 gsm or PVC, 4/4; punch 15 x 3 mm slot top centre (8 mm from top)', 90, 130, bleed=3, folder=F)
    for role, code, band, ink, desc in ROLES:
        d.page(pass_front(d, role, code, band, ink, desc), label=role)
    d.page(pass_back(d, BACK_LINES), label='BACK (all roles)')
    d.proof_pages = [0, 3, 4, 9]
    d.notes = ['9 role fronts + 1 shared back (last page). Big role code reads at a glance across a dark site; band colour groups the teams.',
               'Name is write-on (permanent marker). Slot punch position: centre, 8 mm from top - keep clear (no type there).']
    return register(d)


def media_passes():
    d = Doc('20', 'Media-Passes', 'Media passes', 'Access', 'Media', 'TBC',
            '90 x 130 mm portrait lanyard card, 450 gsm or PVC, 4/4; slot punch top centre', 90, 130, bleed=3, folder=F)
    d.page(pass_front(d, 'PRESS + CONTENT', 'MEDIA', BONE, BLACK, 'Shoot everything. Touch nothing. Media areas, floor and stage front with escort.', label='MEDIA'), label='FRONT')
    d.page(pass_back(d, [('CONTENT RULES', 'Fun-scary, never gory. No shots of the work light or the build. Ask before shooting guests close-up.'),
                         ('MEDIA AREAS', 'Mugshot Booth (11), Suspect Wall (13), Danger Corner (14).'),
                         ('HAZE', 'Haze is cut before crowd surges. Stay out of aisles marked for stewards.'),
                         ('CONTACT', 'Find the event director or any crew with a radio.')], 'MEDIA RULES'), label='BACK')
    d.proof_pages = [0, 1]
    return register(d)


def build():
    wristbands()
    case_cards()
    tokens()
    vip_tents()
    table_numbers()
    crew_passes()
    media_passes()
