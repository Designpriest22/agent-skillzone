"""VIP table packages menu (added after the checklist): A2 board, A4 table menu, 4:5 social image."""
from lib import *
import art

F = '07_VIP-Tables'

# (tier name, price, guests, [(qty, item)], featured)
PACKAGES = [
    ('THE COFFIN', '300K', 5, [(1, 'Hennessy VS'), (1, 'Juice'), (3, 'Mixers'), (5, 'Red Bull'), (2, 'Shisha'), (2, 'Cocktails'),
                               (1, 'Hell Fire Grilled Chicken')], False),
    ('THE CRYPT', '500K', 8, [(1, 'Casamigos'), (2, 'Juice'), (5, 'Mixers'), (8, 'Red Bull'), (3, 'Shisha'), (3, 'Cocktails'),
                              (1, 'Hell Fire Grilled Chicken')], False),
    ('THE MAUSOLEUM', '1M', 8, [(1, 'Don Julio Blanco'), (1, 'Belaire Ros&eacute;'), (3, 'Juice'), (10, 'Red Bull'), (8, 'Mixers'),
                                (4, 'Shisha'), (5, 'Cocktails'), (2, 'Hell Fire Grilled Chicken')], True),
]


def card(name, price, guests, items, featured, h):
    bg, ink, acc, sub = (RED, BONE, BLACK, BLACK) if featured else (CHAR, BONE, RED, EMBER)
    rows = ''.join(
        f'<div class="flex" style="align-items:center;gap:3mm;padding:2.6mm 0;border-bottom:.4mm solid rgba(239,230,214,.2)">'
        f'<div style="flex:none;width:17mm;display:flex;align-items:baseline;gap:.6mm">'
        f'<span class="anton" style="font-size:10mm;line-height:1;color:{acc if featured else RED}">{q}</span>'
        f'<span class="sans" style="font-size:4.6mm;font-weight:800;color:{acc if featured else RED}">x</span></div>'
        f'<div class="anton" style="font-size:8.6mm;line-height:1.05;color:{ink};letter-spacing:.02em">{i if "&" in i else esc(i)}</div></div>'
        for q, i in items)
    tag = (f'<div class="anton abs" style="right:-3mm;top:-6mm;background:{BLACK};color:{BONE};font-size:4.4mm;letter-spacing:.2em;'
           f'padding:2mm 4mm;transform:rotate(4deg);border:.6mm solid {BONE}">MOST WANTED</div>') if featured else ''
    return (f'<div style="position:relative;flex:1;height:{h}mm;background:{bg};padding:8mm 7mm 0;display:flex;flex-direction:column;'
            f'{"box-shadow:0 0 0 1.4mm " + BONE + ", 0 6mm 20mm rgba(179,18,28,.45)" if featured else "border:.5mm solid rgba(239,230,214,.18)"}">{tag}'
            f'<div class="anton" style="font-size:5mm;color:{sub};letter-spacing:.28em">{name}</div>'
            f'<div class="anton" style="font-size:31mm;line-height:1;color:{ink};margin-top:2mm">&#8358;{price}</div>'
            f'<div class="anton" style="align-self:flex-start;margin:3mm 0 4mm;font-size:4.6mm;letter-spacing:.2em;padding:1.6mm 3mm;'
            f'background:{BONE if featured else RED};color:{BLACK if featured else BONE}">TABLE OF {guests}</div>'
            f'<div style="flex:1;min-height:0;display:flex;flex-direction:column;justify-content:space-evenly;padding-bottom:4mm">{rows}</div>'
            f'<div class="flex" style="align-items:center;gap:3mm;margin:0 -7mm;padding:4mm 7mm;background:{BLACK if featured else "rgba(0,0,0,.35)"}">'
            f'<div style="flex:none;width:7mm;height:7mm">{art.flame().replace("<svg ", "<svg width=\"100%\" height=\"100%\" ", 1)}</div>'
            f'<div class="anton" style="font-size:4.3mm;line-height:1.15;color:{BONE};letter-spacing:.04em">EXCLUSIVE ACCESS<br>TO THE GRILL STATION</div></div></div>')


def layout(d, H, social=False):
    W = 420
    top = 150 if not social else 140
    foot = 70 if not social else 62
    ch = H - top - foot - 14
    cards = ''.join(card(*p, h=ch) for p in PACKAGES)
    return (ov('board_black.jpg') +
            f'<div class="full" style="background:radial-gradient(ellipse 70% 30% at 50% 0%, rgba(179,18,28,.75), rgba(11,9,9,0) 70%)"></div>' +
            f'<img class="ov fill" src="{tex("smoke_red.png")}" style="top:70%;height:35%;opacity:.7">' +
            d.T(box(22, 22, 92, 73, logo_svg(style='width:100%;height:100%')) +
                text('MEAT &amp; GREET &nbsp;·&nbsp; HALLOWEEN BBQ PARTY &nbsp;·&nbsp; 31.10', 128, 26, 280, 5, 'anton', f'color:{EMBER};letter-spacing:.24em') +
                fit('VIP TABLES', 126, 36, 272, 80, 'brush', f'color:{BONE}', maxs=86) +
                text('Raised. Roped. Reserved. &nbsp;Pick your plot.', 128, 112, 280, 7.4, 'anton', f'color:{RED};letter-spacing:.06em') +
                box(22, top - 16, W - 44, .5, '', f'background:{BONE};opacity:.25') +
                box(22, top, W - 44, ch, f'<div class="flex" style="gap:8mm;height:100%;align-items:stretch">{cards}</div>')) +
            ov('wear_black.png', .25) +
            d.T(box(0, H - foot, W, foot,
                    f'<div style="height:100%;background:{BLACK};border-top:1.2mm solid {RED};display:flex;align-items:center;justify-content:space-between;padding:0 22mm">'
                    f'<div><div class="anton" style="font-size:9.5mm;color:{BONE}">LIMITED TABLES. BOOK EARLY.</div>'
                    f'<div class="sans" style="font-size:4.6mm;color:{BONE};opacity:.8;margin-top:2mm;font-weight:500">Every table includes exclusive access to the grill station.</div></div>'
                    f'<div class="anton" style="text-align:right;font-size:6mm;color:{EMBER};letter-spacing:.14em;line-height:1.3">SATURDAY<br>31 OCTOBER</div></div>')))


def vip_menus():
    a2 = Doc('38', 'VIP-Table-Packages-Menu_A2-Board', 'VIP table packages menu - A2 board (added)', 'Menus', 'VIP wings, registration', '2',
             'A2 foam board 5 mm', 420, 594, bleed=3, folder=F)
    a2.page(layout(a2, 594))
    a2.notes = ['Packages exactly as supplied: 300K table of 5, 500K table of 8, 1M table of 8. Tier names (Coffin / Crypt / Mausoleum) are added for the theme - drop them if you prefer.',
                'Brand names are set as type, not logos.']
    register(a2)
    a4 = Doc('38', 'VIP-Table-Packages-Menu_A4-Table', 'VIP table packages menu - A4 table menu (added)', 'Menus', 'VIP tables', 'Per VIP table',
             'A4 350 gsm silk, or in an A4 menu holder', 420, 594, bleed=6, scale=2, folder=F)
    a4.page(layout(a4, 594))
    a4.notes = ['Same design as the A2 board, output at 210 x 297 mm with 3 mm bleed.']
    register(a4)
    so = Doc('38', 'VIP-Table-Packages_Social-1080x1350', 'VIP table packages - social image (added)', 'Menus', 'WhatsApp / Instagram', '-',
             'Digital: 1080 x 1350 PNG (4:5) for selling tables ahead of the night', 420, 525, bleed=0, folder=F)
    so.page(layout(so, 525, social=True))
    so.png_px = (1080, 1350)
    so.notes = ['Screen file. Add booking contact (number / link) in the caption, or send it to me and I will put it on the image.']
    register(so)


def build():
    vip_menus()
