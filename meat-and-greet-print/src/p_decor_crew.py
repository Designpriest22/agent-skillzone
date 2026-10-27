"""Checklist items 31-37: decor labels/decals and crew documents."""
from lib import *
import art
from p_signage import floorplan_svg, ZONES

F = '05_Decor'
FC = '06_Crew'


# ------------------------------------------------------------------ 31 Hazard decals
def hazard_decals():
    d = Doc('31', 'Poison-and-Radiation-Hazard-Decals', 'Poison and radiation hazard decals', 'Decor', 'Perimeter, bar ends', '20 (10 of each)',
            'Weatherproof laminated vinyl stickers 300 x 300 mm, rounded corners r10, contour cut', 300, 300, bleed=3, folder=F)
    W = d.w
    tri = art.hazard_triangle(fill=EMBER)
    d.page(f'<div class="full" style="background:{BLACK}"></div>' + d.T(
        svgbox(tri, 35, 22, 230, 207) +
        fit('POISON', 40, 232, 220, 40, 'anton center', f'color:{EMBER}', maxs=44) +
        text('DO NOT FEED THE GUESTS', 0, 274, W, 9, 'anton center', f'color:{BONE};letter-spacing:.18em')) + ov('wear_black.png', .4), label='POISON')
    d.page(f'<div class="full" style="background:{BLACK}"></div>' + d.T(
        svgbox(art.trefoil(fill=BLACK, bg=EMBER), 50, 18, 200, 200) +
        fit('CAUTION', 60, 226, 180, 40, 'anton center', f'color:{EMBER}', maxs=40) +
        text('RADIOACTIVE FLAVOUR', 0, 270, W, 11, 'anton center', f'color:{BONE};letter-spacing:.14em')) + ov('wear_black.png', .4), label='RADIATION')
    d.proof_pages = [0, 1]
    d.notes = ['Ember stands in for hazard yellow so the decals stay on-palette (rule 2) while reading instantly as "hazard". Stick on body bags, drums, bar ends.']
    return register(d)


# ------------------------------------------------------------------ 32 Ghost balloon faces (cut file)
def ghost_faces():
    d = Doc('32', 'Ghost-Balloon-Faces_Vinyl-Cut-Sheet', 'Ghost balloon faces - vinyl cut sheet', 'Decor', 'Registration, VIP', '40-60 sets (4-5 sheets)',
            'Matt black self-adhesive vinyl, plotter cut + weed. A3 sheet = 12 face sets sized for 12 in (30 cm) white balloons', 297, 420, bleed=0, folder=F)
    W, H = d.w, d.h
    names = list(art.GHOST_FACES)
    cells = ''
    k = 0
    for j in range(4):
        for i in range(3):
            cx, cy = 52 + i * 96.5, 62 + j * 100
            nm = names[k % len(names)]
            cells += f'<g transform="translate({cx},{cy}) scale(.95)">{art.ghost_face_group(nm, BLACK)}</g>'
            cells += f'<text x="{cx}" y="{cy + 50}" text-anchor="middle" font-family="Mono" font-size="3" fill="#999">{nm}</text>'
            k += 1
    svgsheet = f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}mm" height="{H}mm" viewBox="0 0 {W} {H}">{cells}</svg>'
    path = os.path.join(BUILD, 'extras', '32_Ghost-Balloon-Faces_cut-sheet_A3.svg')
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, 'w').write(svgsheet)
    d.extras.append((f'{F}/32_Ghost-Balloon-Faces_cut-sheet_A3.svg', path))
    d.page(d.T(f'<svg class="abs" style="inset:0" viewBox="0 0 {W} {H}">{cells}</svg>' +
               text('GHOST BALLOON FACES &middot; CUT IN BLACK VINYL &middot; 6 EXPRESSIONS x 2 &middot; grey labels are not cut', 10, H - 12, W - 20, 3.2, 'mono center', 'color:#999')),
           bg=WHITE, label='CUT SHEET')
    # mock-up page for the proof
    mock = ''
    for i, nm in enumerate(names):
        x, y = 52 + (i % 3) * 97, 130 + (i // 3) * 150
        mock += (f'<g transform="translate({x},{y})"><path d="M0,56 Q-4,75 4,95" stroke="#9a9089" stroke-width="1" fill="none"/>'
                 f'<ellipse cx="0" cy="0" rx="42" ry="50" fill="#FBF7EF"/><path d="M-5,48 L5,48 L0,56 Z" fill="#FBF7EF"/>'
                 f'<ellipse cx="-16" cy="-24" rx="9" ry="14" fill="#fff" opacity=".7"/>'
                 f'<g transform="scale(.62) translate(0,4)">{art.ghost_face_group(nm, BLACK)}</g></g>')
    d.page(ov('board_black.jpg') + d.T(f'<svg class="abs" style="inset:0" viewBox="0 0 {W} {H}">{mock}</svg>' +
                                       text('GHOST BALLOON WALL', 0, 26, W, 16, 'anton center', f'color:{BONE}') +
                                       text('Mock-up: white 12 in balloons + black vinyl faces. Cluster at registration and the VIP wings.', 0, 40, W, 5, 'sans center', f'color:{BONE};opacity:.8')),
           label='MOCK-UP')
    d.proof_pages = [1, 0]
    d.notes = ['Vector cut file also supplied as SVG (32_Ghost-Balloon-Faces_cut-sheet_A3.svg) for the vinyl plotter. Page 2 is a mock-up only - do not print.']
    return register(d)


# ------------------------------------------------------------------ 33 Bottle hazard labels
BOTTLES = [('POISON', 'No. 13', 'Take one sip. Then another.'), ('VENOM', 'No. 06', 'Milked fresh at midnight.'),
           ('ANTIDOTE', 'No. 01', 'For emergencies (and refills).'), ('TOXIC', 'No. 31', 'Handle with gloves. Or don\'t.'),
           ("WITCH'S BREW", 'No. 10', 'Stirred, not shaken. Cursed.'), ('SNAKE OIL', 'No. 99', 'Cures nothing. Tastes great.')]


def bottle_labels():
    d = Doc('33', 'Bottle-Hazard-Labels_x6', 'Bottle hazard labels', 'Decor', 'Bars', 'TBC (6 designs)',
            'Sticker labels 70 x 95 mm, wet-strength paper or vinyl, 4/0', 70, 95, bleed=2, folder=F)
    W, H = d.w, d.h
    for name, num, line in BOTTLES:
        d.page(ov('paper.jpg') + d.T(
            box(3, 3, W - 6, H - 6, '', f'border:.7mm solid {BLACK}') + box(5, 5, W - 10, H - 10, '', f'border:.3mm solid {BLACK}') +
            text('MEAT &amp; GREET APOTHECARY', 0, 9, W, 2.4, 'anton center', f'color:{BLACK};letter-spacing:.3em') +
            svgbox(art.skull_crossbones(fill=BLACK, socket=BONE, glow=RED), W / 2 - 13, 15, 26, 29) +
            fit(name, 9, 47, W - 18, 14, 'rye center', f'color:{RED}', maxs=15) +
            text(num, 0, 64, W, 4.4, 'rye center', f'color:{BLACK}') +
            box(16, 72, W - 32, .4, '', f'background:{BLACK}') +
            text(line, 8, 75, W - 16, 3, 'case center', f'color:{BLACK}') +
            text('PROP LABEL &middot; NOT A REAL HAZARD', 0, 85, W, 1.9, 'anton center', f'color:{BLACK};letter-spacing:.2em;opacity:.6')) +
            ov('wear_char.png', .3), bg=BONE, label=name)
    d.proof_pages = [0, 4]
    return register(d)


# ------------------------------------------------------------------ 34 IV-bag cocktail labels
IVS = [('BLOOD TRANSFUSION', 'O-POSITIVE', 'CONTAINS ALCOHOL', RED), ('EMBALMING FLUID', 'PRESERVED', 'CONTAINS ALCOHOL', EMBER),
       ('BLOOD TRANSFUSION', 'O-NEGATIVE', '0% ALCOHOL &middot; ZERO-PROOF', RED), ('EMBALMING FLUID', 'UNPRESERVED', '0% ALCOHOL &middot; ZERO-PROOF', EMBER)]


def iv_labels():
    d = Doc('34', 'IV-Bag-Cocktail-Labels_x4', 'IV-bag cocktail labels ("Blood Transfusion", "Embalming Fluid")', 'Decor', 'Bars', 'Per stock (4 designs)',
            'FOOD-SAFE sticker labels 60 x 90 mm (applied to outside of bag only), 4/0', 60, 90, bleed=2, folder=F)
    W, H = d.w, d.h
    for i, (name, typ, alc, col) in enumerate(IVS):
        d.page(f'<div class="full" style="background:#FBF8F2"></div>' + d.T(
            box(-2, -2, W + 4, 20, '', f'background:{col}') +
            text('MEAT &amp; GREET BLOOD BANK', 4, 3, W - 8, 2.4, 'anton', f'color:{BONE if col == RED else BLACK};letter-spacing:.24em') +
            fit(name, 4, 7, W - 8, 8, 'anton', f'color:{BONE if col == RED else BLACK}', maxs=9) +
            text('UNIT No.', 4, 22, 20, 2.4, 'mono', f'color:{BLACK}') + text(f'MG-3110-{i + 1:03d}', 4, 25, 30, 3.2, 'mono', f'color:{BLACK};font-weight:600') +
            text('TYPE', W - 30, 22, 26, 2.4, 'mono', f'color:{BLACK};text-align:right') +
            text(typ, W - 34, 25, 30, 4, 'anton', f'color:{col};text-align:right') +
            box(4, 33, W - 8, .3, '', f'background:{BLACK}') +
            text(alc, 4, 36, W - 8, 4.6, 'anton', f'color:{BLACK}') +
            text('FOR ORAL USE ONLY. DO NOT INJECT.<br>Collected 31.10 &middot; Use before sunrise.<br>Free water at the bar &mdash; drink responsibly.', 4, 43, W - 8, 2.5, 'sans', f'color:{BLACK};line-height:1.4;font-weight:500') +
            svgbox(art.barcode(80, 14, seed=i + 7), 4, 60, W - 8, 10) +
            svgbox(art.blood_drop(col), W - 12, 76, 7, 10) +
            text('NOT A MEDICAL PRODUCT', 4, 79, 40, 2.2, 'anton', f'color:{BLACK};letter-spacing:.2em;opacity:.6')), bg='#FBF8F2', label=f'{name} {typ}')
    d.proof_pages = [0, 3]
    d.notes = ['Labels go on the OUTSIDE of food-grade bags; specify food-contact-safe adhesive anyway. Zero-proof versions are clearly marked 0%.']
    return register(d)


# ------------------------------------------------------------------ 35 Sponsor responsible-drinking lockups
def sponsor_frames():
    d = Doc('35', 'Sponsor-Responsible-Drinking-Lockup-Frames', 'Sponsor responsible-drinking lockups (frames)', 'Decor', 'Bars', 'As required',
            'A4 counter cards / bar-front panels. Sponsor artwork placed AS SUPPLIED, UNALTERED in the clear zone', 210, 297, bleed=3, folder=F)
    W, H = d.w, d.h
    for n in (1, 2):
        zones = ''
        if n == 1:
            zones = box(25, 110, W - 50, 120, '<div class="anton center" style="font-size:7mm;color:#888;padding-top:52mm">SPONSOR LOCKUP<br>AS SUPPLIED</div>', 'border:.6mm dashed #888')
        else:
            zones = (box(25, 110, W - 50, 56, '<div class="anton center" style="font-size:6mm;color:#888;padding-top:22mm">SPONSOR 1 &mdash; AS SUPPLIED</div>', 'border:.6mm dashed #888') +
                     box(25, 174, W - 50, 56, '<div class="anton center" style="font-size:6mm;color:#888;padding-top:22mm">SPONSOR 2 &mdash; AS SUPPLIED</div>', 'border:.6mm dashed #888'))
        d.page(ov('board_black.jpg') + d.T(
            box(18, 18, 50, 40, logo_svg(style='width:100%;height:100%')) +
            text('POISON BAR &middot; BLOOD BANK BAR', 76, 24, 120, 4, 'anton', f'color:{EMBER};letter-spacing:.2em') +
            text('DRINK LIKE YOU WANT TO REMEMBER IT.', 76, 33, 118, 14, 'anton', f'color:{BONE};line-height:1') +
            box(25, 80, W - 50, 22, f'<div class="flex" style="height:100%;align-items:center;justify-content:center;gap:5mm;background:{RED}">'
                f'<div class="anton" style="font-size:9mm;color:{BONE};letter-spacing:.08em">FREE WATER AT EVERY BAR</div></div>') +
            zones +
            text('We refuse service to anyone who has had enough. Never drink and drive.', 25, 245, W - 50, 4.6, 'sans center', f'color:{BONE};font-weight:600') +
            text('MEAT &amp; GREET &middot; HALLOWEEN BBQ PARTY &middot; 31.10', 0, 270, W, 3.4, 'anton center', f'color:{BONE};letter-spacing:.3em;opacity:.6')),
            label=f'{n} sponsor')
    d.proof_pages = [0]
    d.notes = ['Frame only: sponsor lockups must be placed exactly as supplied (no recolouring, no distress). Delete dashed placeholders before print.']
    return register(d)


# ------------------------------------------------------------------ 36 Crew pack
RUN = [
    ('D-1  FRI 30', 'Site build: drapes, tunnel, stage, truss. Power + lighting rig. Night lighting focus. Bars + grill with fire kit.', 'Production'),
    ('T-6:00', 'Dress set: balloons, tables, coffins, signage, props. Work lights still allowed.', 'Production'),
    ('T-4:00', 'Tech run. Haze test (check exits + aisles stay readable).', 'Stage + Tech'),
    ('T-3:00', 'Scare rehearsal in the tunnel. Opt-out door walked with FOH.', 'Actors + FOH'),
    ('T-2:00', 'STAFF BRIEF (all crew). Radios out. Channels checked.', 'Event director'),
    ('T-0:30', 'Work light OFF in guest view. Red light + haze on. Stewards to positions.', 'All'),
    ('T  DOORS', 'Gate opens. Booking desk live: wristband, case card, tokens.', 'FOH + Security'),
    ('T+ ...', 'Curtain reveal at the arch: red stage, smoke, strobes. Grill smell first.', 'Stage'),
    ('T+ ...', 'Costume contest shortlist on the floor. Final 5 on stage.', 'MC + Stage'),
    ('T+ ...', 'FIRSTKLAZ MEATING on stage. Haze cut before any crowd surge.', 'Stage + Security'),
    ('T+ ...', 'Second-wave bar stock released. Grill holds pre-cooked stock.', 'Bar + Grill leads'),
    ('CLOSE', 'Exit: case card swapped for RELEASED card. Last shot at the coffin.', 'FOH'),
    ('D+1  SUN 1', 'Strike + clean. Return hires. Store props. Recap content + sponsor report.', 'Production'),
]
RISKS = [
    ('Fire near drapes', 'Grill 3 m from fabric; extinguishers at grill and bars; flame-retardant drapes', 'Production'),
    ('Low visibility', 'Haze cut before crowd surge; lit exits; white-lit aisles; stewards with torches', 'Stage / security'),
    ('Weapon look-alikes', 'All prop blades plastic or foam; real blades refused at gate', 'Security'),
    ('Tunnel crowding', 'One-way flow; stewards both ends; actors never touch guests; opt-out door', 'Front of house'),
    ('Rain', 'Covered grill and bars; secured drapes; standby gazebos; electrics off ground', 'Production'),
    ('Grill queues', 'Tokens; two lines; pre-cooked hold stock', 'Grill lead'),
    ('Alcohol', 'Free water at bars; refuse service when intoxicated; sponsor lockups as supplied', 'Bar leads'),
    ('Medical / power', 'Marked first aid point; medical radio channel; backup generator', 'Event director'),
]


def crew_pack():
    d = Doc('36', 'Crew-Pack_Run-of-Show_Floor-Plan_Emergency', 'Crew pack: run of show, floor plan, emergency plan', 'Crew', 'Crew', 'Per crew',
            'A4, 6 pages, 100 gsm office print or digital, stapled top-left', 210, 297, bleed=3, folder=FC)
    W, H = d.w, d.h

    def head(title, sub, n):
        return (box(-3, -3, W + 6, 31, '', f'background:{BLACK}') +
                box(14, 6, 22, 17, logo_img('width:100%;height:100%;object-fit:contain')) +
                text(title, 42, 7, 140, 9, 'anton', f'color:{BONE}') +
                text(sub, 42, 18, 150, 3.2, 'anton', f'color:{EMBER};letter-spacing:.24em') +
                text(f'{n}/6', W - 30, 10, 16, 5, 'anton', f'color:{BONE};text-align:right') +
                text('MEAT &amp; GREET &middot; HALLOWEEN BBQ PARTY &middot; SAT 31 OCTOBER &middot; CREW ONLY - DO NOT LEAVE IN GUEST AREAS', 14, H - 12, W - 28, 2.4, 'anton', f'color:#777;letter-spacing:.16em'))

    def table(rows, widths, hdr, fs=3.3):
        th = ''.join(f'<th style="width:{w}%;text-align:left;padding:2mm 2.4mm;background:{RED};color:{BONE};font-family:Anton;font-weight:400;font-size:3.4mm;letter-spacing:.06em">{h}</th>' for h, w in zip(hdr, widths))
        tr = ''.join('<tr>' + ''.join(f'<td style="padding:2.2mm 2.4mm;border-bottom:.25mm solid #ccc;vertical-align:top;{"font-family:Anton;font-size:3.7mm" if i == 0 else ""}">{c}</td>' for i, c in enumerate(r)) + '</tr>' for r in rows)
        return f'<table style="width:100%;border-collapse:collapse;font-family:Archivo;font-size:{fs}mm;line-height:1.35;color:#111"><tr>{th}</tr>{tr}</table>'
    # 1 cover
    d.page(ov('board_black.jpg') + f'<div class="full" style="background:radial-gradient(ellipse 80% 45% at 50% 35%, rgba(179,18,28,.7), rgba(11,9,9,0) 70%)"></div>' +
           d.T(box(45, 50, 120, 95, logo_svg(style='width:100%;height:100%')) +
               fit('CREW PACK', 25, 160, W - 50, 50, 'brush center', f'color:{BONE}') +
               text('Run of show &middot; Floor plan &middot; Emergency plan &middot; Roles', 0, 208, W, 5, 'anton center', f'color:{EMBER};letter-spacing:.14em') +
               text('SATURDAY 31 OCTOBER', 0, 230, W, 9, 'anton center', f'color:{BONE};letter-spacing:.2em') +
               text('Red light and haze do the theming. Work light never in guest view.<br>No purple or green. Fun-scary, never gory. Every prop flame is LED.',
                    20, 252, W - 40, 3.8, 'sans center', f'color:{BONE};opacity:.8;line-height:1.5') +
               text('A TCM PRODUCTION &middot; CREW ONLY', 0, 280, W, 3, 'anton center', f'color:{BONE};letter-spacing:.3em;opacity:.6')), label='COVER')
    # 2 run of show
    d.page(d.T(head('RUN OF SHOW', 'T = DOORS (TIME TBC ONCE VENUE + TIMES ARE LOCKED)', 2) +
               box(14, 40, W - 28, 240, table(RUN, [16, 62, 22], ['WHEN', 'WHAT', 'WHO']))), bg=WHITE, label='RUN OF SHOW')
    # 3 floor plan
    leg = ''.join(f'<div style="break-inside:avoid;margin-bottom:1.8mm"><b style="font-family:Anton;font-weight:400;color:{RED}">{n}</b>&nbsp; <b>{esc(t)}</b> &mdash; {esc(s)}</div>' for n, t, s in ZONES)
    d.page(d.T(head('FLOOR PLAN', 'ONE AXIS: TUNNEL UP THE MIDDLE, STAGE AT THE HEAD, SERVICE ZONES ON THE WALLS', 3) +
               svgbox(floorplan_svg(ink=BLACK, ground='#F1ECE4', wall='#888', light=True), 14, 38, W - 28, 180) +
               box(14, 222, W - 28, 60, leg, 'column-count:2;column-gap:8mm;font-family:Archivo;font-size:3mm;line-height:1.3;color:#111')), bg=WHITE, label='FLOOR PLAN')
    # 4 emergency
    proc = [('FIRE', 'Shout it, radio CODE RED + location. Extinguisher only if safe. Production kills grill/bar circuit. Stewards open lit exits.'),
            ('MEDICAL', 'Radio CODE BLUE + location on the medical channel. Stay with them. Medic brings them to the first aid point.'),
            ('CROWD / HAZE', 'Radio CODE AMBER. Stage cuts haze and strobes, house lights to white on the aisles. Hold the tunnel.'),
            ('EVACUATE', 'Event director calls ALL STOP. Music off, white light on, MC announcement. Stewards walk guests to exits. Nobody re-enters.')]
    procs = ''.join(f'<div style="margin-bottom:3.4mm"><span style="font-family:Anton;font-size:4.4mm;color:{RED}">{a}</span>&nbsp; <span style="font-family:Archivo;font-size:3.3mm;color:#111">{b}</span></div>' for a, b in proc)
    d.page(d.T(head('EMERGENCY PLAN', 'THE THEME RAISES THREE RISKS: FIRE NEAR DRAPES, SMOKE IN LOW LIGHT, WEAPON LOOK-ALIKES', 4) +
               box(14, 40, W - 28, 140, table(RISKS, [22, 56, 22], ['RISK', 'CONTROL', 'OWNER'], fs=3.1)) +
               text('IF IT HAPPENS', 14, 188, 100, 6, 'anton', f'color:{BLACK}') +
               box(14, 198, W - 28, 80, procs)), bg=WHITE, label='EMERGENCY PLAN')
    # 5 roles + contacts
    roles = [('Event director', 'CONTROL'), ('Production lead', 'PRODUCTION'), ('Stage + tech', 'STAGE'), ('Security lead', 'SECURITY 1'),
             ('Front of house', 'FOH'), ('Bar lead - Poison Bar', 'POISON'), ('Bar lead - Blood Bank', 'BLOOD BANK'), ('Grill lead', 'GRILL'),
             ('Medic / first aid', 'MEDIC'), ('Tunnel + actors', 'TUNNEL'), ('MC', 'MC'), ('Content / media', 'MEDIA')]
    d.page(d.T(head('ROLES + CONTACTS', 'FILL IN NAMES AND NUMBERS AT THE STAFF BRIEF', 5) +
               box(14, 40, W - 28, 180, table([(a, b, '', '') for a, b in roles], [32, 22, 26, 20], ['ROLE', 'CALL SIGN', 'NAME', 'PHONE'])) +
               text('SETUP RULES', 14, 230, 100, 6, 'anton', f'color:{BLACK}') +
               text('1. Red light and haze do the theming. Work light never in guest view.<br>2. No purple or green.<br>3. Fun-scary, never gory.<br>4. Every prop flame is LED. The grill is the only live fire.',
                    14, 240, W - 28, 3.4, 'sans', 'color:#111;line-height:1.55')), bg=WHITE, label='ROLES')
    # 6 build timeline
    tl = [('LOCK (by WED)', 'Venue, times, capacity. Sponsors + branding. Caterer, stage, light, sound, power. Order props + print. Brief actors, MC, content.'),
          ('WED 28 - THU 29', 'Build off-site: paint pallets, fence, coffins, signs. Stuff body bags + figures. Print plan, menus, case cards. Darts board + target. Final run of show.'),
          ('FRI 30', 'Site build: drapes, tunnel, stage, truss. Power + lighting rig. Night lighting focus. Bars + grill with fire kit.'),
          ('SAT 31', 'SHOW DAY: dress set, balloons, tables. Tech run, haze test. Scare rehearsal. Staff brief 2 hrs before doors.'),
          ('SUN 1 NOV', 'Strike + clean. Return hires. Store props. Recap content, sponsor report.')]
    d.page(d.T(head('BUILD TIMELINE', 'ANYTHING NOT LOCKED BY WEDNESDAY GETS CUT, NOT RUSHED', 6) +
               box(14, 40, W - 28, 200, table(tl, [24, 76], ['WHEN', 'WHAT'])) +
               box(14, 200, W - 28, 50, f'<div style="border:.8mm solid {RED};padding:4mm;font-family:Archivo;font-size:3.4mm;line-height:1.45;color:#111">'
                   f'<b style="font-family:Anton;font-weight:400;font-size:4.4mm;color:{RED}">PRINT DEADLINE: WEDNESDAY 28 OCTOBER.</b><br>All artwork to the printer so print lands for the Friday site build.</div>')),
           bg=WHITE, label='BUILD TIMELINE')
    d.proof_pages = [0, 1, 2, 3]
    d.notes = ['Run of show uses T = doors because times are not locked yet; swap in real clock times in p_decor_crew.py RUN and rebuild.',
               'Office-printable (white pages, black type, red accents only).']
    return register(d)


# ------------------------------------------------------------------ 37 Radio call sheet
def radio_sheet():
    d = Doc('37', 'Radio-Call-Sheet', 'Radio call sheet', 'Crew', 'Crew', 'Per radio',
            'A5 card 148 x 210 mm, 350 gsm, 4/4 (laminate recommended)', 148, 210, bleed=3, folder=FC)
    W, H = d.w, d.h
    ch = [('1', 'CONTROL / ALL CALL', 'Event director, all leads'), ('2', 'SECURITY + FOH', 'Gate, tunnel, booking desk, stewards'),
          ('3', 'BARS + GRILL', 'Poison Bar, Blood Bank Bar, grill, runners'), ('4', 'STAGE + TECH', 'Stage, lighting, haze, sound, power'),
          ('5', 'MEDICAL', 'Emergencies only. Keep clear.')]
    codes = [('CODE RED', 'Fire / smoke', RED), ('CODE BLUE', 'Medical', BONE), ('CODE AMBER', 'Crowd / haze / flow', EMBER), ('ALL STOP', 'Stop show: music off, white light on', BONE)]
    rows = ''.join(f'<div class="flex" style="gap:4mm;align-items:center;padding:2.4mm 0;border-bottom:.3mm solid rgba(239,230,214,.25)">'
                   f'<div class="anton center" style="flex:none;width:11mm;height:11mm;border-radius:50%;background:{RED if c != "5" else BONE};color:{BONE if c != "5" else BLACK};font-size:6.4mm;line-height:11mm">{c}</div>'
                   f'<div><div class="anton" style="font-size:5mm;color:{BONE}">{a}</div><div class="sans" style="font-size:3.2mm;color:{BONE};opacity:.75">{b}</div></div></div>' for c, a, b in ch)
    cr = ''.join(f'<div style="border:.6mm solid {c};padding:2.4mm 3mm"><div class="anton" style="font-size:5.6mm;color:{c}">{a}</div><div class="sans" style="font-size:3mm;color:{BONE};margin-top:.6mm">{b}</div></div>' for a, b, c in codes)
    d.page(ov('board_black.jpg') + d.T(
        box(10, 10, 30, 24, logo_img('width:100%;height:100%;object-fit:contain')) +
        text('RADIO CALL SHEET', 46, 11, 92, 10, 'anton', f'color:{BONE}') +
        text('PROPOSED - CONFIRM AT STAFF BRIEF', 46, 24, 92, 3, 'anton', f'color:{EMBER};letter-spacing:.2em') +
        text('CHANNELS', 10, 42, 60, 4, 'anton', f'color:{EMBER};letter-spacing:.3em') +
        box(10, 48, W - 20, 90, rows) +
        text('CODES', 10, 146, 60, 4, 'anton', f'color:{EMBER};letter-spacing:.3em') +
        box(10, 152, W - 20, 48, cr, 'display:grid;grid-template-columns:1fr 1fr;gap:3mm')), label='FRONT')
    calls = [('CONTROL', 'Event director'), ('PRODUCTION', 'Production lead'), ('STAGE', 'Stage + tech'), ('SECURITY 1-4', 'Security'),
             ('FOH', 'Front of house'), ('TUNNEL', 'Tunnel + actors'), ('POISON', 'Poison Bar lead'), ('BLOOD BANK', 'Blood Bank Bar lead'),
             ('GRILL', 'Grill lead'), ('MEDIC', 'First aid'), ('MC', 'MC'), ('MEDIA', 'Content lead')]
    cl = ''.join(f'<div class="flex" style="justify-content:space-between;padding:1.6mm 0;border-bottom:.3mm solid #ccc"><span class="anton" style="font-size:4.2mm">{a}</span><span class="sans" style="font-size:3.2mm">{b}</span></div>' for a, b in calls)
    d.page(d.T(text('CALL SIGNS', 10, 10, 80, 7, 'anton', f'color:{BLACK}') + box(10, 20, W - 20, 95, cl, 'color:#111') +
               text('HOW TO CALL', 10, 122, 80, 7, 'anton', f'color:{BLACK}') +
               text(f'<b>"[Who you want], [who you are]"</b> &mdash; wait for the reply.<br><b>Then: WHAT, WHERE, WHAT YOU NEED.</b><br>'
                    f'Keep it short. Never say "fire", "injury" or "evacuate" on an open channel - use the codes.<br>'
                    f'Emergency traffic has priority: if you hear a CODE, stay off the channel.<br><br>'
                    f'<span class="mono" style="font-size:2.9mm">ALPHA BRAVO CHARLIE DELTA ECHO FOXTROT GOLF HOTEL INDIA JULIET KILO LIMA MIKE NOVEMBER OSCAR PAPA QUEBEC ROMEO SIERRA TANGO UNIFORM VICTOR WHISKEY X-RAY YANKEE ZULU</span>',
                    10, 132, W - 20, 3.5, 'sans', 'color:#111;line-height:1.5') +
               box(-3, H - 16, W + 6, 19, '', f'background:{RED}') +
               text('RED LIGHT. HAZE. NO WORK LIGHT IN GUEST VIEW.', 0, H - 10.5, W, 3.6, 'anton center', f'color:{BONE};letter-spacing:.14em')), bg=WHITE, label='BACK')
    d.proof_pages = [0, 1]
    d.notes = ['Channel plan, call signs and codes are a proposal built from the safety plan owners - confirm at the staff brief.']
    return register(d)


def build():
    hazard_decals()
    ghost_faces()
    bottle_labels()
    iv_labels()
    sponsor_frames()
    crew_pack()
    radio_sheet()
