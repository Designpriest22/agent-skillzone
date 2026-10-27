"""Checklist items 11-13: menus and token boards.

PRICES / TOKEN COSTS ARE NOT CONFIRMED. Leave a value as None and the file prints a
write-on circle (paint pen / chalk pen). Fill a number in and rebuild to print it.
"""
import math
from lib import *
import art

F = '02_Menus'

GRILL = [
    ("BUTCHER'S CUT", 'Suya and steak skewers. Fire-kissed, pepper-loaded.', None),
    ('GRAVEYARD RIBS', 'Slow-smoked and falling off the bone. Dig in.', None),
    ('BODY BAG CHICKEN', 'Grilled chicken, bagged hot off the coals.', None),
    ('BONE YARD WINGS', 'Sticky, smoky wings. Bones go to the graveyard.', None),
    ('CRIME SCENE ASUN', 'Spicy goat asun. Leaves evidence on your lips.', None),
    ('FRESH KILL FISH', 'Whole grilled fish, caught red-handed.', None),
]
SIDES = [("WITCH'S JOLLOF", None), ('COFFIN FRIES', None), ('PLANTAIN FINGERS', None)]

BAR = [
    ('SIGNATURE IV BAGS', [
        ('BLOOD TRANSFUSION', 'Deep red, sweet and dangerous. Served in an IV bag.', None),
        ('EMBALMING FLUID', 'Pale, sharp, citrus. Preserves you till sunrise.', None)]),
    ('SYRINGE SHOOTERS', [
        ('LETHAL DOSE', 'Shots served by syringe. Pick your dose.', None)]),
    ('ZERO-PROOF', [
        ('TRANSFUSION O-NEGATIVE', 'All of the red, none of the alcohol.', None),
        ('EMBALMING FLUID, UNPRESERVED', 'The citrus hit. Nothing to preserve.', None)]),
    ('EVERYTHING ELSE', [
        ('BEER, SPIRITS, MIXERS, SOFTS', 'Ask behind the bar.', None)]),
]
TOKEN_PRICE = {'grill': None, 'bar': None}    # e.g. 'N2,000'


def coin(val, size_mm, color=EMBER, ink=BLACK, label='TOKENS'):
    """Token-cost coin. val None => write-on circle."""
    inner = (f'<div class="anton" style="font-size:{size_mm*0.55}mm;line-height:1">{val}</div>' if val is not None else '')
    return (f'<div class="center" style="width:{size_mm}mm;height:{size_mm}mm;border-radius:50%;'
            f'border:{size_mm*0.06}mm {"solid" if val is not None else "dashed"} {color};color:{color};'
            f'display:flex;flex-direction:column;align-items:center;justify-content:center;">{inner}'
            f'<div class="anton" style="font-size:{size_mm*0.13}mm;letter-spacing:.12em;margin-top:{size_mm*0.38 if val is None else 0}mm;opacity:.9">{label}</div></div>')


def token_face(kind, ring_text=True):
    """Round token artwork (viewBox -100..100). kind grill | bar."""
    bg, ink, accent = (EMBER, BLACK, BONE) if kind == 'grill' else (RED, BONE, BLACK)
    word = 'GRILL' if kind == 'grill' else 'BAR'
    icon = (f'<g transform="translate(-13,-56) scale(.26)"><path d="{art.FLAME}" fill="{ink}"/></g>' if kind == 'grill'
            else f'<g transform="translate(-9,-56) scale(.3)"><path d="M30,2 C40,22 58,40 58,56 C58,72 46,82 30,82 C14,82 2,72 2,56 C2,40 20,22 30,2 Z" fill="{ink}"/></g>')
    ring = ''
    if ring_text:
        ring = (f'<defs><path id="rt{kind}" d="M-77,0 A77,77 0 1 1 77,0 A77,77 0 1 1 -77,0"/></defs>'
                f'<text font-family="Anton" font-size="12.5" fill="{ink}" dy="4.5"><textPath href="#rt{kind}" startOffset="0" textLength="478" lengthAdjust="spacing">'
                f'MEAT &amp; GREET · 31.10 · {word} TOKEN · MEAT &amp; GREET · 31.10 · {word} TOKEN ·</textPath></text>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-100 -100 200 200">'
            f'<circle r="100" fill="{bg}"/><circle r="92" fill="none" stroke="{ink}" stroke-width="2"/>'
            f'<circle r="64" fill="none" stroke="{ink}" stroke-width="4"/>{ring}{icon}'
            f'<text y="22" text-anchor="middle" font-family="Anton" font-size="{44 if kind == "grill" else 58}" fill="{ink}" letter-spacing="1">{word}</text>'
            f'<text y="46" text-anchor="middle" font-family="Anton" font-size="15" fill="{ink}" letter-spacing="5">TOKEN</text></svg>')


# ------------------------------------------------------------------ 11 Coffin grill menu
def coffin_menu():
    W, H, B = 1000, 2000, 10
    d = Doc('11', 'Coffin-Grill-Menu-Board', 'Coffin grill menu board', 'Menus', 'Grill zone', '1',
            '10 mm foamex / dibond, CNC/router cut to coffin shape (dieline on page 2)', W, H, bleed=B, folder=F)
    pts = art.coffin_points(W, H)
    d.dieline = art.poly_path(pts)
    # bleed polygon (scaled outward ~B mm)
    cx, cy = W / 2, H * 0.45
    bpts = [(x + (x - cx) / abs(x - cx or 1) * B if x != cx else x, y + (B if y > cy else -B)) for x, y in pts]
    clip = 'polygon(' + ','.join(f'{x + B}mm {y + B}mm' for x, y in bpts) + ')'

    def width_at(y):
        if y < H * 0.26:
            return W * (0.62 + 0.38 * y / (H * 0.26))
        return W - (W - W * 0.46) * (y - H * 0.26) / (H * 0.74)

    rows = ''
    y = 560
    for name, desc, val in GRILL:
        wy = width_at(y + 160) - 130
        x0 = (W - wy) / 2
        tw = wy - 150
        rows += fit(name, x0, y, tw, 62, 'anton', f'color:{BONE};line-height:1', maxs=62)
        rows += text(desc, x0, y + 72, tw, 22, 'sans', f'color:{BONE};opacity:.82;font-weight:500;line-height:1.2', h=60, shrink=True)
        rows += box(x0 + wy - 120, y + 8, 120, 120, coin(val, 120))
        y += 178
    sides_w = width_at(1720) - 120
    rows += text(f'SIDES', 0, 1650, W, 40, 'anton center', f'color:{EMBER};letter-spacing:.4em')
    rows += box((W - sides_w) / 2, 1700, sides_w, 3, '', f'background:{EMBER};opacity:.6')
    rows += text(' &nbsp;·&nbsp; '.join(s for s, _ in SIDES), (W - sides_w) / 2, 1720, sides_w, 40, 'anton center', f'color:{BONE};line-height:1.2', h=100, shrink=True)
    art_html = (
        f'<div class="full" style="clip-path:{clip}">' + ov('wood_tall.jpg') +
        f'<div class="full" style="background:radial-gradient(ellipse 70% 30% at 50% 12%, rgba(224,89,42,.45), rgba(11,9,9,0) 70%)"></div>' +
        d.T(f'<svg class="abs" style="left:0;top:0;width:{W}mm;height:{H}mm" viewBox="0 0 {W} {H}"><path d="{art.poly_path(art.coffin_points(W - 60, H - 60), 30, 30)}" fill="none" stroke="{BONE}" stroke-width="6" opacity=".55"/>'
            f'<path d="{art.poly_path(art.coffin_points(W - 84, H - 84), 42, 42)}" fill="none" stroke="{RED}" stroke-width="3"/></svg>' +
            svgbox(art.flame(), W / 2 - 55, 95, 110, 112) +
            fit('GRILL MENU', 230, 220, W - 460, 150, 'brush center', f'color:{BONE}') +
            text('COOKED IN VIEW &nbsp;·&nbsp; SERVED FAST', 150, 400, W - 300, 30, 'anton center', f'color:{EMBER};letter-spacing:.25em') +
            box(330, 470, 340, 4, '', f'background:{RED}') +
            rows +
            fit('ALL GRILL ORDERS BY TOKEN', 300, 1850, 400, 24, 'anton center', f'color:{BONE};letter-spacing:.1em') +
            fit('NO CASH ON THE GRILL LINE', 300, 1895, 400, 24, 'anton center', f'color:{RED};letter-spacing:.1em')) +
        ov('wear_black.png', .55) + '</div>')
    d.page(art_html, bg=WHITE, label='ARTWORK')
    d.page(f'<svg class="abs" style="left:{B}mm;top:{B}mm;width:{W}mm;height:{H}mm;overflow:visible" viewBox="0 0 {W} {H}">'
           f'<path d="{d.dieline}" fill="none" stroke="#FF00FF" stroke-width="0.5"/></svg>'
           + text('CUT LINE (CutContour) - 100% magenta hairline, do not print', B + 200, B + 950, 600, 14, 'mono center', 'color:#FF00FF'),
           bg=WHITE, label='DIELINE')
    d.notes = ['Page 1 artwork (10 mm bleed beyond the coffin outline), page 2 cut path. Matches the "chained coffin" prop on the mood board - chain it on site.',
               'Token costs print as dashed write-on circles until confirmed: fill them with a paint pen, or set values in p_menus.py GRILL and rebuild.']
    d.shape_preview = True
    return register(d)


# ------------------------------------------------------------------ 12 Bar menus
def bar_menu_html(d, bar):
    W, H = d.w, d.h
    blood = bar == 'blood'
    ink = BONE
    accent = BLACK if blood else RED
    sec = ''
    for title, items in BAR:
        sec += (f'<div class="flex" style="align-items:center;gap:5mm;margin:4mm 0 7mm"><div class="anton track" style="font-size:11mm;color:{EMBER if not blood else BLACK};letter-spacing:.24em">{title}</div>'
                f'<div style="flex:1;border-top:.8mm solid {EMBER if not blood else BLACK};opacity:.6"></div></div>')
        for name, desc, val in items:
            sec += (f'<div class="flex" style="justify-content:space-between;align-items:center;gap:6mm;margin-bottom:10mm">'
                    f'<div><div class="anton" style="font-size:21mm;color:{ink};line-height:1">{name}</div>'
                    f'<div class="sans" style="font-size:8.4mm;color:{ink};opacity:.88;margin-top:2.5mm;font-weight:500">{desc}</div></div>'
                    f'<div style="flex:none">{coin(val, 38, ink if blood else EMBER, label="TOKENS")}</div></div>')
    title = ('BLOOD BANK BAR', 'Donations accepted. Transfusions served.') if blood else ('POISON BAR', 'Name your poison.')
    icon = (svgbox(art.iv_bag(fill=BLACK, bag=BONE), W - 120, 40, 70, 110) if blood else
            svgbox(art.hazard_triangle(fill=EMBER), W - 135, 50, 95, 86))
    bg = (ov('board_red.jpg') + f'<div class="full" style="background:radial-gradient(ellipse 80% 40% at 50% 0%, rgba(11,9,9,.35), rgba(11,9,9,0) 70%)"></div>') if blood else (
        ov('board_black.jpg') + f'<div class="full" style="background:radial-gradient(ellipse 80% 35% at 50% 0%, rgba(179,18,28,.7), rgba(11,9,9,0) 70%)"></div>')
    return (bg + d.T(
        text('MEAT &amp; GREET &nbsp;·&nbsp; 31.10', 30, 34, 300, 6.5, 'anton', f'color:{BONE if blood else EMBER};letter-spacing:.3em') +
        fit(title[0], 28, 48, W - 170, 70, 'brush', f'color:{BONE};text-shadow:0 0 6mm rgba(0,0,0,.4)', maxs=72) +
        text(title[1], 30, 128, W - 170, 10, 'anton', f'color:{accent if blood else RED};letter-spacing:.04em') + icon +
        box(30, 165, W - 60, 1.2, '', f'background:{BONE};opacity:.35') +
        text(sec, 30, 182, W - 60, 10, 'sans', h=300, shrink=True) +
        box(30, 495, W - 60, 60,
            f'<div class="flex" style="height:100%;gap:6mm"><div style="flex:1.2;background:{BLACK};padding:5mm 6mm">'
            f'<div class="anton" style="font-size:15mm;color:{BONE}">FREE WATER. ALWAYS.</div>'
            f'<div class="sans" style="font-size:6.6mm;color:{BONE};opacity:.85;margin-top:3mm;line-height:1.35;font-weight:500">Just ask. We will refuse service to anyone who has had enough. Drinks by BAR TOKEN only.</div></div>'
            f'<div style="flex:1;border:.8mm dashed rgba(239,230,214,.5);display:flex;align-items:center;justify-content:center;text-align:center">'
            f'<div class="anton" style="font-size:5mm;color:{BONE};opacity:.7;letter-spacing:.15em">SPONSOR RESPONSIBLE-DRINKING<br>LOCKUP &mdash; AS SUPPLIED</div></div></div>')) +
        ov('wear_black.png', .3))


def bar_menus():
    d = Doc('12', 'Bar-Menus_Poison-Bar_Blood-Bank-Bar', 'Bar menus: Poison Bar, Blood Bank Bar', 'Menus', 'Bars', '2 (1 of each)',
            'A2 foam board 5 mm', 420, 594, bleed=3, folder=F)
    d.page(bar_menu_html(d, 'poison'), label='POISON BAR')
    d.page(bar_menu_html(d, 'blood'), bg=RED, label='BLOOD BANK BAR')
    d.proof_pages = [0, 1]
    d.notes = ['Both bars run identical menus (per the event plan); only the skin changes.',
               'Sponsor lockup box is a placeholder - place the sponsor responsible-drinking lockup exactly as supplied, then delete the dashed box.']
    return register(d)


# ------------------------------------------------------------------ 13 Token price boards
def token_boards():
    d = Doc('13', 'Token-Price-Boards', 'Token price boards', 'Menus', 'Registration, bars', '3',
            'A3 foam board 5 mm', 297, 420, bleed=3, folder=F)
    W, H = d.w, d.h

    def price(v, color):
        if v:
            return f'<div class="anton" style="font-size:22mm;color:{BONE}">{v}</div>'
        return (f'<div class="flex" style="align-items:flex-end;gap:2mm"><div class="anton" style="font-size:20mm;color:{BONE}">&#8358;</div>'
                f'<div style="width:70mm;height:18mm;border-bottom:1mm dashed {color}"></div></div>')
    d.page(ov('board_black.jpg') +
           f'<div class="full" style="background:radial-gradient(ellipse 80% 30% at 50% 0%, rgba(179,18,28,.65), rgba(11,9,9,0) 70%)"></div>' +
           d.T(text('MEAT &amp; GREET &nbsp;·&nbsp; 31.10', 0, 22, W, 5.5, 'anton center', f'color:{EMBER};letter-spacing:.3em') +
               fit('TOKEN EXCHANGE', 24, 34, W - 48, 50, 'brush center', f'color:{BONE}') +
               text('Cash buys tokens. Tokens buy everything.', 0, 92, W, 8, 'anton center', f'color:{RED};letter-spacing:.04em') +
               svgbox(token_face('grill'), 22, 120, 110, 110) + svgbox(token_face('bar'), W - 132, 120, 110, 110) +
               text('GRILL TOKEN', 22, 238, 110, 10, 'anton center', f'color:{EMBER}') + text('BAR TOKEN', W - 132, 238, 110, 10, 'anton center', f'color:{RED}') +
               text('Grill zone only', 22, 251, 110, 4.6, 'sans center', f'color:{BONE};opacity:.75') +
               text('Poison Bar + Blood Bank Bar', W - 140, 251, 126, 4.6, 'sans center', f'color:{BONE};opacity:.75') +
               box(24, 275, W - 48, 1, '', f'background:{BONE};opacity:.3') +
               box(24, 285, W - 48, 34, f'<div class="flex" style="justify-content:space-between;align-items:flex-end;height:100%">'
                   f'<div class="anton" style="font-size:12mm;color:{EMBER}">1 GRILL TOKEN</div>{price(TOKEN_PRICE["grill"], EMBER)}</div>') +
               box(24, 325, W - 48, 34, f'<div class="flex" style="justify-content:space-between;align-items:flex-end;height:100%">'
                   f'<div class="anton" style="font-size:12mm;color:{RED}">1 BAR TOKEN</div>{price(TOKEN_PRICE["bar"], RED)}</div>') +
               box(0, H - 42, W, 42, f'<div class="anton center" style="background:{RED};height:100%;font-size:9mm;line-height:42mm;color:{BONE};letter-spacing:.12em">NO CASH ON THE GRILL LINE</div>')) +
           ov('wear_black.png', .3))
    d.notes = ['Prices print as write-on lines until confirmed. Set TOKEN_PRICE in p_menus.py and rebuild to print them.']
    return register(d)


def build():
    coffin_menu()
    bar_menus()
    token_boards()
