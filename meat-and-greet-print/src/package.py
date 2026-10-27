"""Assemble the deliverable: proof book, schedule, README, overview, zip.
usage: python3 package.py   (after build.py has produced every PDF)"""
import csv
import glob
import os
import shutil
import subprocess
import zipfile

from PIL import Image

import lib
from lib import *
import textures
import finalize

PACK = 'MeatAndGreet_Halloween_Print-Pack'
OUT = os.path.join(lib.BUILD, 'package', PACK)
DEADLINE = 'Wednesday 28 October'


def load_docs():
    for m in ('p_signage', 'p_menus', 'p_access', 'p_activations', 'p_decor_crew'):
        __import__(m).build()
    return lib.REGISTRY


def jpg_preview(d, i, longest=1500):
    src = os.path.join(finalize.PREV, f'{d.fname()}_p{i + 1}.png')
    if not os.path.exists(src):
        finalize.preview(d, i)
    dst = os.path.join(lib.BUILD, 'jpg', f'{d.fname()}_p{i + 1}.jpg')
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    if not os.path.exists(dst) or os.path.getmtime(dst) < os.path.getmtime(src):
        im = Image.open(src).convert('RGB')
        im.thumbnail((longest, longest))
        im.save(dst, quality=86, optimize=True)
    return dst


def size_str(d):
    s = f'{d.w:g} x {d.h:g} mm'
    if d.scale == 10:
        s += ' (file at 1:10)'
    return s


def proof_book(docs):
    pb = Doc('00', 'Proof-Book', 'Proof book', '', '', '', '', 420, 297, bleed=0, folder='')
    W, H = 420, 297
    # cover
    pb.page(ov('board_black.jpg') +
            f'<div class="full" style="background:radial-gradient(ellipse 55% 70% at 70% 50%, rgba(179,18,28,.75), rgba(11,9,9,0) 70%)"></div>' +
            f'<img class="ov fill" src="{tex("smoke_red.png")}" style="top:55%;height:50%;opacity:.8">' +
            box(225, 40, 170, 135, logo_svg(style='width:100%;height:100%')) +
            text('HALLOWEEN BBQ PARTY &middot; SATURDAY 31 OCTOBER', 30, 40, 200, 5, 'anton', f'color:{EMBER};letter-spacing:.28em') +
            text('PRINT<br>PACK', 28, 52, 200, 58, 'brush', f'color:{BONE};line-height:.9') +
            text(f'Every printed item on the checklist, designed and print-ready.<br>{len(set(d.num for d in docs))} checklist items &middot; {len(docs)} files &middot; {sum(len(d.pages) for d in docs)} pages of artwork.',
                 30, 170, 190, 5, 'sans', f'color:{BONE};line-height:1.5;font-weight:500') +
            box(30, 205, 175, 26, f'<div style="border:.8mm solid {RED};height:100%;padding:4mm 5mm"><div class="anton" style="font-size:6mm;color:{RED}">ARTWORK DEADLINE</div>'
                f'<div class="anton" style="font-size:7.4mm;color:{BONE};margin-top:1mm">{DEADLINE.upper()}</div></div>') +
            text('A TCM PRODUCTION &middot; ENTER IF YOU DARE. LEAVE FULL.', 30, 270, 360, 3.6, 'anton', f'color:{BONE};letter-spacing:.3em;opacity:.7'))
    # brand page
    sw = ''.join(f'<div style="flex:1"><div style="height:46mm;background:{c};border:.3mm solid #444"></div>'
                 f'<div class="anton" style="font-size:5mm;color:{BONE};margin-top:3mm">{n}</div><div class="mono" style="font-size:3mm;color:{BONE};opacity:.7">{c} &middot; {u}</div></div>'
                 for n, c, u in (('Black', BLACK, 'base, drapes'), ('Charcoal', CHAR, 'structure'), ('Blood red', RED, 'light, signage'),
                                 ('Ember', EMBER, 'fire, accents'), ('Bone', BONE, 'type, ghosts')))
    fonts = [('Anton', 'anton', 'HEADLINES, ZONES, WAYFINDING', 'The brand voice from the deck.'),
             ('Sedgwick Ave Display', 'brush', 'Hand-painted brush', 'The "painted, never printed clean" voice.'),
             ('Special Elite', 'case', 'Case files &amp; evidence', 'Crime Scene world only.'),
             ('Rye', 'rye', 'Carnival games', 'Carnival of Shadows world only.'),
             ('Archivo', 'sans', 'Small print and crew documents', 'Invisible workhorse.')]
    ft = ''.join(f'<div style="margin-bottom:6mm"><div class="{c}" style="font-size:12mm;color:{BONE};line-height:1">{s}</div>'
                 f'<div class="mono" style="font-size:2.8mm;color:{EMBER};margin-top:1.6mm">{n} &mdash; {note}</div></div>' for n, c, s, note in fonts)
    worlds = [('01 CARNIVAL OF SHADOWS', 'Stripes, bulbs, sunbursts, Rye woodtype.', 'Arch, games, stage'),
              ('02 CRIME SCENE', 'Danger tape, case files, fingerprints, stamps.', 'Registration, media areas, perimeter'),
              ('03 GRAVEYARD BBQ', 'Coffins, flames, skulls, painted wood.', 'Grill zone, bars, VIP')]
    wd = ''.join(f'<div style="flex:1;border-top:1.2mm solid {RED};padding-top:3mm"><div class="anton" style="font-size:5.4mm;color:{BONE}">{a}</div>'
                 f'<div class="sans" style="font-size:3.4mm;color:{BONE};opacity:.8;margin-top:1.5mm">{b}</div>'
                 f'<div class="anton" style="font-size:3mm;color:{EMBER};letter-spacing:.2em;margin-top:2mm">{c.upper()}</div></div>' for a, b, c in worlds)
    pb.page(ov('board_black.jpg') +
            text('THE SYSTEM', 24, 18, 200, 14, 'anton', f'color:{BONE}') +
            text('One brand, three worlds. Five colours, no purple, no green. Fun-scary, never gory.', 24, 36, 360, 5, 'sans', f'color:{EMBER};font-weight:600') +
            box(24, 52, 220, 70, f'<div class="flex" style="gap:4mm">{sw}</div>') +
            box(24, 140, 220, 50, f'<div class="flex" style="gap:6mm">{wd}</div>') +
            box(262, 52, 140, 200, ft) +
            box(24, 205, 220, 70, f'<div class="flex" style="gap:8mm;align-items:center;height:100%">'
                f'<div style="width:62mm;height:49mm">{logo_svg(style="width:100%;height:100%")}</div>'
                f'<div class="sans" style="font-size:3.3mm;color:{BONE};line-height:1.5;opacity:.85">Logo redrawn as flat vector from the deck artwork so it holds on 8 m backdrops. '
                f'If the original vector exists, drop it into <span class="mono">src/assets</span> and rebuild.<br><br>'
                f'Distress is a separate texture layer over live vector type: it never touches the sponsor zones or safety signs.</div></div>'))
    # contents table
    rows = ''
    for d in docs:
        rows += (f'<tr><td class="anton" style="color:{RED}">{d.num}</td><td>{esc(d.title)}</td><td>{esc(d.zone)}</td><td>{esc(d.qty)}</td>'
                 f'<td class="mono">{size_str(d)}</td><td class="mono">{d.bleed:g} mm</td></tr>')
    tbl = (f'<table style="width:100%;border-collapse:collapse;font-family:Archivo;font-size:2.7mm;color:{BONE}">'
           f'<tr style="font-family:Anton;color:{EMBER};letter-spacing:.1em"><td>#</td><td>ITEM</td><td>ZONE</td><td>QTY</td><td>FINISHED SIZE</td><td>BLEED</td></tr>{rows}</table>')
    pb.css = 'td{padding:1.15mm 2mm;border-bottom:.2mm solid rgba(239,230,214,.18)}'
    pb.page(ov('board_black.jpg') + text('PRINT SCHEDULE', 24, 16, 200, 12, 'anton', f'color:{BONE}') +
            text(f'All artwork to the printer by {DEADLINE} so print lands for the Friday site build.', 24, 32, 380, 4.4, 'sans', f'color:{EMBER};font-weight:600') +
            box(24, 44, W - 48, 240, tbl))
    # one spread per doc
    for d in docs:
        imgs = [jpg_preview(d, i) for i in d.proof_pages if i < len(d.pages)]
        n = len(imgs)
        area_w, area_h = 270, 245
        cols = 1 if n == 1 else 2
        rws = (n + cols - 1) // cols
        cell_w, cell_h = (area_w - (cols - 1) * 6) / cols, (area_h - (rws - 1) * 6) / rws
        grid = ''.join(f'<div style="width:{cell_w}mm;height:{cell_h}mm;display:flex;align-items:center;justify-content:center">'
                       f'<img src="file://{p}" style="max-width:100%;max-height:100%;box-shadow:0 2mm 8mm rgba(0,0,0,.6)"></div>' for p in imgs)
        notes = ''.join(f'<li style="margin-bottom:2mm">{n_}</li>' for n_ in d.notes)
        files = d.fname() + '.pdf'
        spec = [('ZONE', d.zone), ('QUANTITY', d.qty), ('FINISHED SIZE', size_str(d)), ('BLEED', f'{d.bleed:g} mm all round'),
                ('PAGES', f'{len(d.pages)}'), ('SPEC', d.spec)]
        sp = ''.join(f'<div style="margin-bottom:3mm"><div class="anton" style="font-size:2.9mm;color:{EMBER};letter-spacing:.2em">{a}</div>'
                     f'<div class="sans" style="font-size:3.5mm;color:{BONE};line-height:1.35;margin-top:.6mm">{esc(b)}</div></div>' for a, b in spec)
        pb.page(f'<div class="full" style="background:#1a1616"></div>' +
                box(12, 12, area_w + 16, H - 24, '', 'background:#100d0d') +
                box(20, 26, area_w, area_h, f'<div class="flex" style="flex-wrap:wrap;gap:6mm;height:100%;align-content:center;justify-content:center">{grid}</div>') +
                text(f'{d.area.upper()} &middot; {d.folder.replace("_", " ")}', 20, 16, 200, 3, 'anton', f'color:{BONE};letter-spacing:.3em;opacity:.5') +
                text(d.num, 312, 16, 90, 22, 'anton', f'color:{RED}') +
                text(esc(d.title), 312, 42, 96, 8, 'anton', f'color:{BONE};line-height:1.05', h=36, shrink=True) +
                box(312, 82, 96, 120, sp) +
                text(f'<ul style="padding-left:4mm">{notes}</ul>', 312, 200, 96, 2.9, 'sans', f'color:{BONE};opacity:.8;line-height:1.35', h=72, shrink=True) +
                text(files, 312, 278, 96, 2.3, 'mono', f'color:{BONE};opacity:.5;word-break:break-all'))
    return pb


def overview(docs):
    """Single contact-sheet JPG of every design."""
    ims = []
    for d in docs:
        for i in d.proof_pages[:2]:
            if i < len(d.pages):
                ims.append(Image.open(jpg_preview(d, i)).convert('RGB'))
    W, rowh, gap = 3600, 520, 24
    rows, cur, cw = [], [], 0
    for im in ims:
        w = int(im.width * rowh / im.height)
        w = min(w, W - 2 * gap)
        if cur and cw + w > W - gap:
            rows.append((cur, cw)); cur, cw = [], gap
        if not cur:
            cw = gap
        cur.append((im, w)); cw += w + gap
    rows.append((cur, cw))
    H = len(rows) * (rowh + gap) + gap + 260
    sheet = Image.new('RGB', (W, H), (16, 13, 13))
    logo = Image.open(os.path.join(lib.ASSETS, 'mg-logo-color.png'))
    logo.thumbnail((260, 210))
    sheet.paste(logo, (gap, 24), logo)
    from PIL import ImageDraw, ImageFont
    dr = ImageDraw.Draw(sheet)
    f1 = ImageFont.truetype(os.path.join(lib.FONTS, 'Anton.ttf'), 110)
    f2 = ImageFont.truetype(os.path.join(lib.FONTS, 'Anton.ttf'), 46)
    dr.text((320, 40), 'HALLOWEEN BBQ PARTY - PRINT PACK', font=f1, fill=(239, 230, 214))
    dr.text((324, 175), f'{len(set(d.num for d in docs))} CHECKLIST ITEMS  ·  SATURDAY 31 OCTOBER  ·  ARTWORK DEADLINE {DEADLINE.upper()}', font=f2, fill=(224, 89, 42))
    y = 260
    for r, rw in rows:
        x = (W - rw) // 2 + gap
        for im, w in r:
            h = int(im.height * w / im.width)
            sheet.paste(im.resize((w, h), Image.LANCZOS), (x, y + (rowh - h) // 2))
            x += w + gap
        y += rowh + gap
    p = os.path.join(OUT, '00_Overview_All-Designs.jpg')
    sheet.save(p, quality=84, optimize=True)
    return p


README = """MEAT & GREET - HALLOWEEN BBQ PARTY - PRINT PACK
Saturday 31 October - a TCM production
=====================================================================

ARTWORK DEADLINE: {deadline}, so print lands for the Friday site build.

START HERE
  00_Proof-Book.pdf            Visual proof of every item + spec, print schedule, brand system
  00_Overview_All-Designs.jpg  Every design on one sheet
  00_Print-Schedule.csv        Item / file / size / bleed / qty / material - send to the printer

FOLDERS (numbers match the print checklist)
  01_Signage      items 01-10   arch, stage backdrop (+ LED still), skull banners, perimeter,
                                brush backdrop, floor plan board, zone signs, directional,
                                house rules, fence boards
  02_Menus        items 11-13   coffin grill menu (+ dieline), bar menus, token boards
  03_Access       items 14-20   wristbands, numbered case cards, tokens, VIP tents,
                                coffin table numbers 1-24, crew passes, media passes
  04_Activations  items 21-30   height chart, charge placards, photo overlay (PNG),
                                Suspects header + 10 WANTED posters, Released cards,
                                balloon darts wrap, knife target, Jar of Heads template,
                                specimen labels, costume contest tags
  05_Decor        items 31-35   hazard decals, ghost balloon cut file (PDF + SVG), bottle
                                labels, IV-bag labels, sponsor lockup frames
  06_Crew         items 36-37   crew pack (6pp A4), radio call sheet
  _source         Build scripts + fonts. Change data (prices, counts, copy) and rebuild.

FILE FORMAT
  - Print-ready PDF, RGB, fonts embedded, type and shapes vector. Textures are image layers.
  - Bleed is built into the page; TrimBox/BleedBox are set, so the RIP knows where to cut.
  - Files over ~3 m are supplied at 1:10 (filename says SCALE-1to10): output at 1000%.
  - Shaped items (coffin menu, coffin table numbers, tokens, knife target) carry a separate
    dieline page: 100% magenta hairline = cut, cyan dash = fold.
  - Printers converting to CMYK: keep the reds rich (Blood red #B3121C, Ember #E0592A).

BEFORE YOU SEND - CONFIRM THESE
  1. Token costs and naira prices (menus + token boards print as write-on circles/lines until set).
  2. Capacity -> case card count (file has 0001-0500), costume tags (001-100).
  3. Sponsor artwork: placeholders on perimeter panel D, bar menus and lockup frames must be
     replaced with supplied files, unaltered.
  4. Venue times -> run of show uses "T = doors"; radio channels/codes are a proposal.
  5. Toilets / first aid positions -> add to the floor plan once known.
  6. Existing balloon-dart board size (file assumes 1220 x 2440 mm).
  7. Hashtag on the Released card (#MEATANDGREET) and house-rules wording.
  8. Logo was redrawn from the deck artwork as flat vector; swap in the master vector if you have it.

RULES THE DESIGN FOLLOWS (from the event plan)
  Red light and haze do the theming. No purple or green. Fun-scary, never gory.
  Every prop flame is LED. Impact/Anton for headlines and wayfinding; hand-painted brush for
  signage. Safety and facilities signs stay clean and high-contrast.
"""


def package():
    docs = load_docs()
    if os.path.exists(OUT):
        shutil.rmtree(OUT)
    os.makedirs(OUT)
    # print files
    for d in docs:
        dst = os.path.join(OUT, d.folder)
        os.makedirs(dst, exist_ok=True)
        shutil.copy(finalize.pdf_path(d), dst)
        for png in glob.glob(os.path.join(lib.BUILD, 'pdf', d.folder, d.fname() + '*.png')):
            shutil.copy(png, dst)
        for rel, src in d.extras:
            shutil.copy(src, os.path.join(OUT, rel))
    # proof book
    pb = proof_book(docs)
    man = os.path.join(lib.BUILD, 'manifest_pb.json')
    lib.write_manifest([pb], man)
    subprocess.run(['node', os.path.join(lib.ROOT, 'render.js'), man], check=True)
    shutil.copy(finalize.pdf_path(pb), os.path.join(OUT, '00_Proof-Book.pdf'))
    overview(docs)
    with open(os.path.join(OUT, '00_Print-Schedule.csv'), 'w', newline='') as f:
        w = csv.writer(f)
        w.writerow(['Item', 'Title', 'Area', 'Zone', 'Qty', 'Finished W mm', 'Finished H mm', 'Bleed mm', 'File scale', 'Pages', 'Spec', 'File', 'Notes'])
        for d in docs:
            w.writerow([d.num, d.title, d.area, d.zone, d.qty, d.w, d.h, d.bleed, '1:10' if d.scale == 10 else '1:1', len(d.pages), d.spec,
                        f'{d.folder}/{d.fname()}.pdf', ' | '.join(d.notes)])
    with open(os.path.join(OUT, '00_README.txt'), 'w') as f:
        f.write(README.format(deadline=DEADLINE))
    # source
    src = os.path.join(OUT, '_source')
    shutil.copytree(lib.ROOT, src, ignore=shutil.ignore_patterns('__pycache__', 'mg-logo.png'))
    # zip
    zp = os.path.join(lib.BUILD, 'package', PACK + '.zip')
    if os.path.exists(zp):
        os.remove(zp)
    with zipfile.ZipFile(zp, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for root, _, fs in os.walk(OUT):
            for fn in sorted(fs):
                full = os.path.join(root, fn)
                z.write(full, os.path.relpath(full, os.path.dirname(OUT)))
    print('zip', zp, os.path.getsize(zp) / 1e6, 'MB')


if __name__ == '__main__':
    package()
