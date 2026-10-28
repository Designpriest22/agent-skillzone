"""MEATING GAMES - Instagram story games for Meat & Greet x FirstKlaz (1080 x 1920).

python3 stories.py -> ../export/frames (clean, to post) + ../export/guide (with sticker placements marked)

Every game is built for Instagram's native stickers (quiz, poll, question, countdown, link).
Frames leave a clear zone for the sticker; the guide version shows where it goes.
"""
import json
import math
import os
import random
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'src'))
sys.path.insert(0, os.path.join(ROOT, 'firstklaz-carousel', 'src'))
import art                                       # noqa: E402  (vector illustration library from the print pack)
from carousel import FONTS, TEX, LOGO, crosshair, placket   # noqa: E402

PHOTOS = os.path.join(ROOT, 'firstklaz-carousel', 'src', 'photos')
OUT = os.path.abspath(os.path.join(HERE, '..', 'export'))
PH = lambda n: 'file://' + os.path.join(PHOTOS, n)

CHAR, AMBER, CREAM, RED, EMBER, BLACK = '#17120F', '#C8641E', '#EFE6D6', '#B3121C', '#E0592A', '#0B0909'
W, H = 1080, 1920
EVENT = 'SAT 31 OCT &middot; DOXA PARK, ABUJA &middot; 5PM'
LINK = 'pv.rsvp/firstklaz-meating'

CSS = f"""
@font-face{{font-family:Anton;src:url(file://{FONTS}/Anton.ttf)}}
@font-face{{font-family:Brush;src:url(file://{FONTS}/SedgwickAveDisplay.ttf)}}
@font-face{{font-family:Archivo;font-weight:500;src:url(file://{FONTS}/Archivo-500.ttf)}}
@font-face{{font-family:Archivo;font-weight:700;src:url(file://{FONTS}/Archivo-700.ttf)}}
@font-face{{font-family:Mono;font-weight:400;src:url(file://{FONTS}/PlexMono-400.ttf)}}
@font-face{{font-family:Mono;font-weight:600;src:url(file://{FONTS}/PlexMono-600.ttf)}}
*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{width:{W}px;height:{H}px;background:{CHAR};overflow:hidden}}
.s{{position:relative;width:{W}px;height:{H}px;overflow:hidden;background:{CHAR};color:{CREAM}}}
.a{{position:absolute}} .full{{position:absolute;inset:0}}
.h{{font-family:Anton;text-transform:uppercase;line-height:.95}}
.br{{font-family:Brush;line-height:1}}
.b{{font-family:Archivo;font-weight:500;font-size:40px;line-height:1.35}}
.m{{font-family:Mono;font-size:24px;letter-spacing:.16em;text-transform:uppercase}}
.photo{{position:absolute;background-size:cover;background-position:center;filter:sepia(.16) saturate(.94) contrast(1.06)}}
.mg-keyline{{fill:#fff}}.mg-panel{{fill:#0B0909}}.mg-amp{{fill:#D81E1E}}.mg-flame{{fill:#F05A28}}.mg-steak{{fill:#A3171E}}
svg{{display:block}}
.zone{{position:absolute;border:5px dashed rgba(255,255,255,.9);border-radius:34px;background:rgba(255,255,255,.14);
display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:10px}}
.zone b{{font-family:Mono;font-weight:600;font-size:30px;letter-spacing:.12em;color:#fff}}
.zone i{{font-family:Archivo;font-style:normal;font-weight:500;font-size:28px;color:#fff;opacity:.9;padding:0 30px}}
"""


def logo(w, x, y):
    h = w * 761.8 / 959.2
    return f'<div class="a" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px">{LOGO.replace("<svg ", "<svg width=\"100%\" height=\"100%\" ", 1)}</div>'


def grain(op=.14):
    g = os.path.join(ROOT, 'firstklaz-carousel', 'src', 'grain.png')
    return f'<img class="full" src="file://{g}" style="width:100%;height:{H}px;object-fit:cover;opacity:{op};mix-blend-mode:overlay">'


def tex(name, op=1, style=''):
    return f'<img class="full" src="file://{TEX}/{name}" style="width:100%;height:100%;object-fit:cover;opacity:{op};{style}">'


def frame(T=26):
    s = T / 44
    def cell(i, x, y, rot=0):
        g = f'<g transform="translate({x},{y}) rotate({rot} {T/2} {T/2}) scale({s})">'
        if i % 2 == 0:
            g += (f'<rect x="5" y="5" width="34" height="34" fill="none" stroke="#7a3a2c" stroke-width="3"/>'
                  f'<path d="M22,10 L34,22 L22,34 L10,22 Z" fill="{RED}"/><rect x="19" y="19" width="6" height="6" fill="#120E0C"/>')
        else:
            g += (f'<path d="M5,8 L22,20 L39,8 M5,22 L22,34 L39,22" fill="none" stroke="{EMBER}" stroke-width="3" opacity=".8"/>'
                  f'<rect x="19" y="36" width="6" height="6" fill="#7a3a2c"/>')
        return g + '</g>'
    c = []
    for i in range(int(W / T) + 1):
        c.append(cell(i, i * T, 0)); c.append(cell(i + 1, i * T, H - T))
    for j in range(1, int(H / T)):
        c.append(cell(j, 0, j * T, 90)); c.append(cell(j + 1, W - T, j * T, 90))
    return (f'<svg class="full" width="{W}" height="{H}"><path d="M0,0 H{W} V{H} H0 Z M{T},{T} V{H - T} H{W - T} V{T} Z" fill="#120E0C" fill-rule="evenodd"/>'
            f'{"".join(c)}</svg>')


def header(game, title, step=''):
    """Top bar inside Instagram's safe zone (progress bar + profile sit above y~200)."""
    return (logo(130, 64, 150) +
            f'<div class="a" style="right:64px;top:160px;text-align:right">'
            f'<div class="m" style="font-size:22px;color:{EMBER};font-weight:600">MEATING GAMES &middot; {game}</div>'
            f'<div class="h" style="font-size:44px;margin-top:8px">{title}</div>'
            + (f'<div class="m" style="font-size:20px;margin-top:8px;opacity:.75">{step}</div>' if step else '') + '</div>')


def footer(txt=EVENT):
    return f'<div class="a m" style="left:0;width:{W}px;text-align:center;bottom:250px;font-size:22px;opacity:.85">{txt}</div>'


def zone(x, y, w, h, kind, note=''):
    return dict(x=x, y=y, w=w, h=h, kind=kind, note=note)


FRAMES = []


def add(name, html, zones=(), caption=''):
    FRAMES.append(dict(name=name, html=html, zones=list(zones), caption=caption))


# ------------------------------------------------------------------ 00 cover
def cover():
    games = [('01', 'How FirstKlaz are you?', 'Quiz'), ('02', 'This or that', 'Polls'), ('03', 'Unscramble the night', 'Puzzle'),
             ('04', 'Count the skulls', 'Seek &amp; find'), ('05', 'Your Halloween alias', 'Birth month'), ('06', 'Choose your night', 'Story game')]
    rows = ''.join(f'<div style="display:flex;align-items:baseline;gap:22px;padding:11px 0;border-top:2px solid rgba(239,230,214,.18)">'
                   f'<div class="h" style="font-size:40px;color:{EMBER};width:60px">{n}</div><div class="h" style="font-size:40px;flex:1">{t}</div>'
                   f'<div class="m" style="font-size:20px;opacity:.75">{k}</div></div>' for n, t, k in games)
    add('00_Cover',
        f'<div class="photo" style="left:0;top:0;width:{W}px;height:900px;background-image:url({PH("fk-black-leaning.jpg")});background-position:50% 18%"></div>'
        f'<div class="a" style="left:0;top:0;width:{W}px;height:900px;background:linear-gradient(180deg,rgba(11,9,9,.55),rgba(11,9,9,0) 25%,rgba(11,9,9,0) 55%,{CHAR} 98%)"></div>'
        + grain() + logo(170, 64, 150) +
        f'<div class="a m" style="left:72px;top:680px;color:{EMBER};font-weight:600">FirstKlaz &times; Meat &amp; Greet</div>'
        f'<div class="a br" style="left:64px;top:715px;font-size:140px;color:{CREAM}">Meating</div>'
        f'<div class="a br" style="left:64px;top:845px;font-size:140px;color:{RED};text-shadow:0 0 30px rgba(179,18,28,.5)">Games</div>'
        f'<div class="a" style="left:72px;top:1080px;width:936px">{rows}</div>'
        f'<div class="a b" style="left:72px;top:1010px;font-size:30px;opacity:.85">Six games before the gates open. Tap through. Play along.</div>'
        + footer())


# ------------------------------------------------------------------ 01 quiz
QUIZ = [
    ('Whose voice is sampled on &ldquo;Gen-Z Fuji&rdquo;?', ['Sikiru Ayinde Barrister', 'Kollington Ayinla', 'Ayuba Adewale'], 0, 'fk-brown-profile.jpg'),
    ('Who features on &ldquo;Gen-Z Faaji&rdquo;?', ['Zlatan', 'Joeboy', 'Terry Apala'], 1, 'fk-blue-seated.jpg'),
    ('&ldquo;Gen-Z Arewa&rdquo; was made with which Northern band?', ['Iliya Entertainment Music', 'The Talking Drums', 'Doxa Park Band'], 0, 'fk-black-standing.jpg'),
    ('Wa. Zo. Bia. In Yoruba, Hausa and Igbo they all mean&hellip;', ['Eat', 'Come', 'Dance'], 1, 'fk-silver-portrait.jpg'),
]


def quiz():
    for i, (q, opts, ans, ph) in enumerate(QUIZ):
        add(f'01-{i + 1}_Quiz-Q{i + 1}',
            f'<div class="photo" style="left:0;top:0;width:{W}px;height:{H}px;background-image:url({PH(ph)});background-position:50% 22%"></div>'
            f'<div class="full" style="background:linear-gradient(180deg,rgba(11,9,9,.82) 0%,rgba(11,9,9,.35) 30%,rgba(11,9,9,.55) 48%,rgba(11,9,9,.92) 62%,{CHAR} 100%)"></div>'
            + grain() + header('01', 'How FirstKlaz are you?', f'Question {i + 1} of 4') +
            f'<div class="a h" style="left:72px;top:640px;width:120px;font-size:150px;color:{EMBER}">Q{i + 1}</div>'
            f'<div class="a h" style="left:72px;top:820px;width:936px;font-size:84px">{q}</div>'
            + footer('Answers in the next story &rarr;'),
            [zone(140, 1170, 800, 430, 'QUIZ STICKER', 'Options: ' + ' / '.join(opts) + f' &mdash; correct: {opts[ans]}')])
    rows = ''.join(f'<div style="padding:26px 0;border-top:2px solid rgba(239,230,214,.2)"><div class="m" style="color:{EMBER};font-size:22px">Q{i + 1}</div>'
                   f'<div class="b" style="font-size:34px;margin-top:6px;opacity:.85">{q}</div>'
                   f'<div class="h" style="font-size:62px;margin-top:10px;color:{CREAM}">&#10003; {opts[ans]}</div></div>'
                   for i, (q, opts, ans, _) in enumerate(QUIZ))
    add('01-5_Quiz-Answers',
        tex('board_black.jpg') + f'<div class="full" style="background:radial-gradient(ellipse 70% 30% at 50% 10%, rgba(179,18,28,.55), rgba(11,9,9,0) 70%)"></div>'
        + grain() + header('01', 'How FirstKlaz are you?', 'Answers') +
        f'<div class="a" style="left:72px;top:380px;width:936px">{rows}</div>'
        f'<div class="a b" style="left:72px;top:1480px;width:936px;font-size:36px">4/4? You&rsquo;re front row on 31.10.<br>Under that? Study up. The set list won&rsquo;t wait.</div>'
        + footer())


# ------------------------------------------------------------------ 02 this or that
TOT = [('Suya', 'Ribs', 'Your first plate?'), ('Costume', 'All-black', 'The dress code. Pick a side.'),
       ('Gen-Z Fuji', 'Gen-Z Arewa', 'One record. Loudest singalong.'), ('Poison Bar', 'Blood Bank', 'Where are we meeting?')]


def this_or_that():
    for i, (a, b, q) in enumerate(TOT):
        add(f'02-{i + 1}_This-or-That',
            f'<div class="a" style="left:0;top:0;width:{W}px;height:{H // 2}px;background:{RED}"></div>' + tex('board_red.jpg', .55, f'height:{H // 2}px') +
            f'<div class="a" style="left:0;top:{H // 2}px;width:{W}px;height:{H // 2}px;background:{CHAR}"></div>'
            + grain(.16) + header('02', 'This or that', f'{i + 1} of 4') +
            f'<div class="a h" style="left:0;width:{W}px;top:440px;text-align:center;font-size:{230 if len(a) < 8 else 170}px;color:{CREAM}">{a}</div>'
            f'<div class="a" style="left:{W // 2 - 90}px;top:{H // 2 - 90}px;width:180px;height:180px;border-radius:50%;background:{CREAM};'
            f'display:flex;align-items:center;justify-content:center"><div class="br" style="font-size:96px;color:{BLACK}">or</div></div>'
            f'<div class="a h" style="left:0;width:{W}px;top:1090px;text-align:center;font-size:{230 if len(b) < 8 else 170}px;color:{EMBER}">{b}</div>'
            f'<div class="a m" style="left:0;width:{W}px;text-align:center;top:{H // 2 - 150}px;font-size:24px;color:{CREAM}">{q}</div>'
            + footer(),
            [zone(240, 1400, 600, 220, 'POLL STICKER', f'Options: {a} / {b}')])


# ------------------------------------------------------------------ 03 unscramble
WORDS = [('GNITAEM', 'MEATING'), ('JUIF', 'FUJI'), ('WAERA', 'AREWA'), ('ODXA RAPK', 'DOXA PARK'), ('ZLAKTRIFS', 'FIRSTKLAZ'), ('NEWOLELAH', 'HALLOWEEN')]


def tiles(word, size=96, fill=CREAM, ink=BLACK, hl=False):
    out = []
    for ch in word:
        if ch == ' ':
            out.append(f'<div style="width:{size * .45}px"></div>')
            continue
        out.append(f'<div style="width:{size}px;height:{size}px;background:{fill};border-radius:10px;box-shadow:0 6px 0 rgba(0,0,0,.45);'
                   f'display:flex;align-items:center;justify-content:center" class="h"><span style="font-size:{size * .62}px;color:{ink}">{ch}</span></div>')
    return f'<div style="display:flex;gap:{size * .12}px;justify-content:center">{"".join(out)}</div>'


def unscramble():
    rows = ''.join(f'<div style="margin-bottom:34px">{tiles(s, 92)}</div>' for s, _ in WORDS)
    add('03-1_Unscramble',
        tex('board_black.jpg') + f'<div class="full" style="background:radial-gradient(ellipse 80% 30% at 50% 22%, rgba(224,89,42,.35), rgba(11,9,9,0) 70%)"></div>'
        + grain() + header('03', 'Unscramble the night', 'Six words &middot; one night') +
        f'<div class="a b" style="left:72px;top:400px;width:936px;font-size:38px">Every word is part of 31.10. Unscramble all six and send them in.</div>'
        f'<div class="a" style="left:0;top:520px;width:{W}px">{rows}</div>'
        + footer('Answers tomorrow'),
        [zone(140, 1310, 800, 300, 'QUESTION STICKER', '&ldquo;Drop your answers&rdquo; &mdash; reshare the best replies')])
    rows = ''.join(f'<div style="margin-bottom:34px">{tiles(a, 92, fill=EMBER, ink=BLACK)}</div>' for _, a in WORDS)
    add('03-2_Unscramble-Answers',
        tex('board_black.jpg') + grain() + header('03', 'Unscramble the night', 'Answers') +
        f'<div class="a" style="left:0;top:470px;width:{W}px">{rows}</div>'
        f'<div class="a b" style="left:72px;top:1380px;width:936px;font-size:38px;text-align:center">Six for six? Then you already know where you&rsquo;re going.</div>'
        + footer())


# ------------------------------------------------------------------ 04 count the skulls
SKULLS = 13


def ghost(c=CREAM):
    return (f'<svg viewBox="0 0 100 120"><path d="M50,4 C78,4 92,26 92,54 L92,112 L78,100 L64,112 L50,100 L36,112 L22,100 L8,112 L8,54 C8,26 22,4 50,4 Z" fill="{c}"/>'
            f'<ellipse cx="36" cy="50" rx="8" ry="12" fill="{BLACK}"/><ellipse cx="64" cy="50" rx="8" ry="12" fill="{BLACK}"/></svg>')


def icon(kind):
    if kind == 'skull':
        return art.skull_svg(glow_on=False, crack=False)
    if kind == 'flame':
        return art.flame()
    if kind == 'bone':
        return f'<svg viewBox="-110 -30 220 60"><g fill="{CREAM}">{art.bone_shape(200, 22, 17)}</g></svg>'
    if kind == 'ghost':
        return ghost()
    if kind == 'coffin':
        return art.coffin_svg(fill='#5a463c', stroke=CREAM, sw=4, cross=RED)


def skull_field(highlight=False):
    rnd = random.Random(31)
    cols, rows = 6, 7
    cells = [(c, r) for r in range(rows) for c in range(cols)]
    kinds = ['skull'] * SKULLS + [rnd.choice(['flame', 'bone', 'ghost', 'coffin']) for _ in range(len(cells) - SKULLS)]
    rnd.shuffle(kinds)
    x0, y0, cw, ch = 110, 500, 860 / cols, 900 / rows
    out = []
    for (c, r), k in zip(cells, kinds):
        sz = rnd.uniform(.62, .82) * min(cw, ch)
        x = x0 + c * cw + (cw - sz) / 2 + rnd.uniform(-14, 14)
        y = y0 + r * ch + (ch - sz) / 2 + rnd.uniform(-14, 14)
        rot = rnd.uniform(-28, 28)
        dim = 'opacity:.22;' if highlight and k != 'skull' else ''
        out.append(f'<div class="a" style="left:{x:.0f}px;top:{y:.0f}px;width:{sz:.0f}px;height:{sz:.0f}px;transform:rotate({rot:.0f}deg);{dim}">'
                   f'{icon(k).replace("<svg ", "<svg width=\"100%\" height=\"100%\" ", 1)}</div>')
        if highlight and k == 'skull':
            out.append(f'<div class="a" style="left:{x - 14:.0f}px;top:{y - 14:.0f}px;width:{sz + 28:.0f}px;height:{sz + 28:.0f}px;border:7px solid {RED};border-radius:50%"></div>')
    return ''.join(out)


def count_skulls():
    bg = tex('board_black.jpg') + f'<div class="full" style="background:radial-gradient(ellipse 80% 40% at 50% 50%, rgba(179,18,28,.35), rgba(11,9,9,0) 75%)"></div>'
    add('04-1_Count-the-Skulls',
        bg + grain() + header('04', 'Count the skulls', 'Seek &amp; find') +
        f'<div class="a h" style="left:72px;top:360px;font-size:70px">How many skulls<br><span style="color:{EMBER}">are hiding at the grill?</span></div>'
        + skull_field() + footer('Answer in the next story &rarr;'),
        [zone(190, 1430, 700, 180, 'QUIZ STICKER', f'Options: 11 / {SKULLS} / 15 / 17 &mdash; correct: {SKULLS}')])
    add('04-2_Count-the-Skulls-Answer',
        bg + grain() + header('04', 'Count the skulls', 'Answer') +
        f'<div class="a h" style="left:72px;top:360px;font-size:70px">There were <span style="color:{RED}">{SKULLS}.</span><br><span style="color:{EMBER}">Did you see them all?</span></div>'
        + skull_field(True) + footer())


# ------------------------------------------------------------------ 05 birth month alias
ALIASES = [('JAN', 'The Butcher', 'butcher'), ('FEB', 'The Suya Snatcher', 'bandit'), ('MAR', 'The Ringmaster', 'ringmaster'),
           ('APR', 'The Jollof Judge', 'judge'), ('MAY', 'The Bone Collector', 'bones'), ('JUN', 'DJ Deadline', 'dj'),
           ('JUL', 'The Plantain Witch', 'witch'), ('AUG', 'Dr. Transfusion', 'doctor'), ('SEP', 'Giggles', 'clown'),
           ('OCT', 'The Grill Ghost', 'hood'), ('NOV', 'The Token Thief', 'bandit'), ('DEC', 'The Uninvited Plus-One', 'unknown')]


def birth_month():
    cards = ''.join(
        f'<div style="background:{"#24191a" if i % 2 else "#2c1c19"};border:2px solid rgba(239,230,214,.16);border-radius:16px;padding:12px 10px;display:flex;flex-direction:column;align-items:center">'
        f'<div class="m" style="font-size:24px;color:{EMBER};font-weight:600">{m}</div>'
        f'<div style="width:110px;height:120px;margin:4px 0">{art.suspect(k, fill="#0B0909", accent=RED).replace("<svg ", "<svg width=\"100%\" height=\"100%\" ", 1)}</div>'
        f'<div class="h" style="font-size:26px;text-align:center;line-height:1.05">{n}</div></div>'
        for i, (m, n, k) in enumerate(ALIASES))
    add('05_Halloween-Alias',
        tex('board_black.jpg') + f'<div class="full" style="background:radial-gradient(ellipse 80% 25% at 50% 12%, rgba(179,18,28,.6), rgba(11,9,9,0) 70%)"></div>'
        + grain() + header('05', 'Your Halloween alias', 'Birth month decides') +
        f'<div class="a h" style="left:72px;top:350px;width:936px;font-size:66px">Your birth month is<br><span style="color:{EMBER}">your alias on 31.10.</span></div>'
        f'<div class="a" style="left:72px;top:520px;width:936px;display:grid;grid-template-columns:repeat(3,1fr);gap:14px">{cards}</div>'
        f'<div class="a b" style="left:72px;top:1458px;width:936px;font-size:32px;text-align:center">Screenshot. Share yours. Tag who&rsquo;s pulling up.</div>'
        ,
        [zone(240, 1520, 600, 110, 'ADD YOURS STICKER', '&ldquo;Your alias + your fit&rdquo;')])


# ------------------------------------------------------------------ 06 choose your night
def choose():
    shade = 'linear-gradient(180deg,rgba(11,9,9,.75) 0%,rgba(11,9,9,.2) 26%,rgba(11,9,9,.35) 45%,rgba(11,9,9,.92) 62%,#0B0909 100%)'
    steps = [
        ('crowd-red-suya.jpg', '50% 100%;background-size:1700px auto', '5PM. Doxa Park.', 'The gates open. Smoke is already rolling off the grill. Somewhere behind the curtain, a stage is waiting. First move?', 'FOLLOW THE SMOKE', 'GET BOOKED'),
        ('crowd-skewer.jpg', '50% 40%', 'Fed. Booked. Thirsty.', 'Skewer in one hand, case number in the other. Two bars. One poison, one blood bank. Where are you going?', 'POISON BAR', 'BLOOD BANK'),
        ('crowd-red-group.jpg', '50% 25%', 'The lights drop to red.', 'A figure in a butcher&rsquo;s apron steps out of the haze and points straight at you. You&hellip;', 'DANCE', 'RUN'),
    ]
    add('06-1_Choose-Your-Night',
        f'<div class="photo full" style="background-image:url({PH("crowd-singing.jpg")});background-position:55% 30%"></div>'
        f'<div class="full" style="background:{shade}"></div>' + grain() + header('06', 'Choose your night', 'Start') +
        f'<div class="a br" style="left:64px;top:1000px;font-size:140px">Choose</div>'
        f'<div class="a br" style="left:64px;top:1130px;font-size:140px;color:{RED}">your night.</div>'
        f'<div class="a b" style="left:72px;top:1320px;width:936px;font-size:40px">Three choices. Vote on each one. Tap through to see how the night ends.</div>'
        + footer())
    for i, (ph, pos, head, body, a, b) in enumerate(steps):
        add(f'06-{i + 2}_Choose-Your-Night',
            f'<div class="photo full" style="background-image:url({PH(ph)});background-position:{pos}"></div>'
            f'<div class="full" style="background:{shade}"></div>' + grain() + header('06', 'Choose your night', f'Choice {i + 1} of 3') +
            f'<div class="a h" style="left:72px;top:930px;width:936px;font-size:96px">{head}</div>'
            f'<div class="a b" style="left:72px;top:1040px;width:936px;font-size:40px">{body}</div>'
            + footer(),
            [zone(240, 1380, 600, 220, 'POLL STICKER', f'Options: {a} / {b}')])
    add('06-5_Choose-Your-Night-Ending',
        f'<div class="photo full" style="background-image:url({PH("fk-silver-portrait.jpg")});background-position:50% 20%"></div>'
        f'<div class="full" style="background:linear-gradient(180deg,rgba(11,9,9,.6) 0%,rgba(11,9,9,0) 22%,rgba(11,9,9,0) 40%,rgba(11,9,9,.9) 56%,#0B0909 70%)"></div>'
        + grain() + header('06', 'Choose your night', 'The ending') +
        f'<div class="a h" style="left:72px;top:1000px;width:936px;font-size:100px">Doesn&rsquo;t matter<br>what you picked.</div>'
        f'<div class="a b" style="left:72px;top:1210px;width:936px;font-size:40px">Every road at Doxa Park ends the same way: the curtain opens, and <b style="font-weight:700;color:{EMBER}">FirstKlaz</b> is on stage.</div>'
        + footer(),
        [zone(190, 1450, 700, 150, 'LINK STICKER', f'{LINK} &mdash; label &ldquo;GET TICKETS&rdquo;')])


# ------------------------------------------------------------------ 07 countdown
def countdown():
    add('07_Countdown',
        f'<div class="photo full" style="background-image:url({PH("fk-blue-seated.jpg")});background-position:50% 30%"></div>'
        f'<div class="full" style="background:linear-gradient(180deg,rgba(11,9,9,.6) 0%,rgba(11,9,9,0) 22%,rgba(11,9,9,.1) 38%,rgba(11,9,9,.92) 58%,#0B0909 72%)"></div>'
        + grain() + logo(170, 64, 150) +
        f'<div class="a br" style="left:64px;top:1000px;font-size:132px">FirstKlaz</div>'
        f'<div class="a br" style="left:64px;top:1120px;font-size:132px;color:{RED}">Meating</div>'
        f'<div class="a m" style="left:72px;top:1270px;font-weight:600">{EVENT} &middot; 18+</div>'
        ,
        [zone(140, 1320, 800, 210, 'COUNTDOWN STICKER', '&ldquo;FIRSTKLAZ MEATING&rdquo; &mdash; ends Sat 31 Oct, 5PM'),
         zone(240, 1550, 600, 100, 'LINK STICKER', LINK)])


def render():
    for f in (cover, quiz, this_or_that, unscramble, count_skulls, birth_month, choose, countdown):
        f()
    hd = os.path.join(HERE, 'html')
    os.makedirs(hd, exist_ok=True)
    jobs = []
    for fr in FRAMES:
        zones = ''.join(f'<div class="zone" style="left:{z["x"]}px;top:{z["y"]}px;width:{z["w"]}px;height:{z["h"]}px">'
                        f'<b>{z["kind"]}</b><i>{z["note"]}</i></div>' for z in fr['zones'])
        for mode, extra in (('frames', ''), ('guide', zones)):
            p = os.path.join(hd, f'{mode}_{fr["name"]}.html')
            open(p, 'w').write(f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head>'
                               f'<body><div class="s">{fr["html"]}{frame()}{extra}</div></body></html>')
            os.makedirs(os.path.join(OUT, mode), exist_ok=True)
            jobs.append([p, os.path.join(OUT, mode, f'MeatingGames_{fr["name"]}.png')])
    js = os.path.join(HERE, '_shoot.js')
    open(js, 'w').write("""const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const p=await b.newPage({viewport:{width:1080,height:1920}});
for(const [h,o] of JSON.parse(require('fs').readFileSync(process.argv[2]))){await p.goto('file://'+h);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(150);await p.screenshot({path:o});}
await b.close();})();""")
    jf = os.path.join(HERE, '_jobs.json')
    json.dump(jobs, open(jf, 'w'))
    subprocess.run(['node', js, jf], check=True)
    os.remove(js); os.remove(jf)
    # contact sheet of the guide versions
    from PIL import Image
    ims = [Image.open(o) for h, o in jobs if '/guide/' in o]
    tw, th, g, cols = 360, 640, 20, 7
    rows = math.ceil(len(ims) / cols)
    sheet = Image.new('RGB', (cols * tw + (cols + 1) * g, rows * th + (rows + 1) * g), (40, 34, 31))
    for i, im in enumerate(ims):
        sheet.paste(im.resize((tw, th), Image.LANCZOS), (g + (i % cols) * (tw + g), g + (i // cols) * (th + g)))
    sheet.save(os.path.join(OUT, 'MeatingGames_Overview.jpg'), quality=88)
    print(len(FRAMES), 'frames')


if __name__ == '__main__':
    render()
