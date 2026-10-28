"""Meat & Greet x FirstKlaz - 8-slide Instagram carousel (1080 x 1350).

python3 carousel.py  ->  ../export/*.png + carousel preview.
All copy lives in SLIDES / EVENT below; edit and re-run.
"""
import os
import subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
PRINT_SRC = os.path.join(HERE, '..', '..', 'src')
FONTS = os.path.abspath(os.path.join(PRINT_SRC, 'fonts'))
LOGO = open(os.path.join(PRINT_SRC, 'assets', 'mg-logo-paths.svg')).read()
TEX = os.path.abspath(os.path.join(HERE, '..', '..', 'build', 'tex'))
OUT = os.path.abspath(os.path.join(HERE, '..', 'export'))
PH = lambda n: 'file://' + os.path.join(HERE, 'photos', n)

CHAR, EARTH, AMBER, CREAM, RED, EMBER = '#17120F', '#4A2A1C', '#C8641E', '#EFE6D6', '#B3121C', '#E0592A'

# Only verified / supplied details. Add venue / time / link when confirmed and re-run.
EVENT = {
    'date': 'SATURDAY 31 OCTOBER',
    'place': 'ABUJA',
    'venue': None,          # e.g. 'XYZ GARDENS, WUSE 2'
    'time': None,           # e.g. '7PM'
    'tickets': 'TICKETS ON PARTYVERSE',
    'link': 'LINK IN BIO',
}

CSS = f"""
@font-face{{font-family:Anton;src:url(file://{FONTS}/Anton.ttf)}}
@font-face{{font-family:Brush;src:url(file://{FONTS}/SedgwickAveDisplay.ttf)}}
@font-face{{font-family:Archivo;font-weight:400;src:url(file://{FONTS}/Archivo-400.ttf)}}
@font-face{{font-family:Archivo;font-weight:500;src:url(file://{FONTS}/Archivo-500.ttf)}}
@font-face{{font-family:Archivo;font-weight:700;src:url(file://{FONTS}/Archivo-700.ttf)}}
@font-face{{font-family:Mono;font-weight:400;src:url(file://{FONTS}/PlexMono-400.ttf)}}
@font-face{{font-family:Mono;font-weight:600;src:url(file://{FONTS}/PlexMono-600.ttf)}}
*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{width:1080px;height:1350px;background:{CHAR};overflow:hidden}}
.s{{position:relative;width:1080px;height:1350px;overflow:hidden;background:{CHAR};color:{CREAM}}}
.a{{position:absolute}}
.full{{position:absolute;inset:0}}
.h{{font-family:Anton;text-transform:uppercase;line-height:.94;letter-spacing:.004em}}
.b{{font-family:Archivo;font-weight:500;font-size:33px;line-height:1.38;color:{CREAM}}}
.m{{font-family:Mono;font-size:19px;letter-spacing:.14em;text-transform:uppercase}}
.photo{{position:absolute;background-size:cover;background-position:center}}
.photo:not(.raw){{filter:sepia(.16) saturate(.94) contrast(1.06) brightness(.98) !important}}
.mg-keyline{{fill:#fff}}.mg-panel{{fill:#0B0909}}.mg-amp{{fill:#D81E1E}}.mg-flame{{fill:#F05A28}}.mg-steak{{fill:#A3171E}}
svg{{display:block}}
"""


def logo(w, x=72, y=64):
    h = w * 761.8 / 959.2
    return f'<div class="a" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px">{LOGO.replace("<svg ", "<svg width=\"100%\" height=\"100%\" ", 1)}</div>'


def crosshair(size=46, color=CREAM):
    return (f'<svg width="{size}" height="{size}" viewBox="-50 -50 100 100"><circle r="34" fill="none" stroke="{color}" stroke-width="5"/>'
            f'<path d="M-50,0 L-14,0 M14,0 L50,0 M0,-50 L0,-14 M0,14 L0,50" stroke="{color}" stroke-width="5"/><circle r="7" fill="{EMBER}"/></svg>')


def topbar(n, dark=False, logo_on=True):
    c = CREAM
    return ((logo(150) if logo_on else '') +
            f'<div class="a" style="right:72px;top:70px;display:flex;align-items:center;gap:16px">'
            f'<div style="text-align:right"><div class="m" style="color:{c};font-weight:600;font-size:21px">{n:02d} / 08</div>'
            f'<div class="m" style="color:{c};opacity:.72;font-size:15px;margin-top:6px">ABJ 9.0765&deg;N 7.3986&deg;E</div></div>'
            f'{crosshair(48, c)}</div>')


def swipe():
    chev = ''.join(f'<path d="M{x},2 L{x + 12},14 L{x},26" fill="none" stroke="{AMBER}" stroke-width="5" stroke-linecap="square"/>' for x in (2, 16, 30))
    return (f'<div style="display:flex;align-items:center;gap:12px"><svg width="46" height="28">{chev}</svg>'
            f'<span class="m" style="color:{CREAM};font-weight:600;font-size:20px;letter-spacing:.3em">SWIPE</span></div>')


def bottombar(left='MEAT &amp; GREET &times; FIRSTKLAZ', right='SWIPE', color=CREAM):
    rt = swipe() if right == 'SWIPE' else f'<div class="m" style="color:{color};opacity:.8;font-size:17px">{right}</div>'
    return (f'<div class="a m" style="left:72px;bottom:56px;color:{color};opacity:.8;font-size:17px">{left}</div>'
            f'<div class="a" style="right:72px;bottom:50px">{rt}</div>')


def frame(T=28):
    """Series frame: the kaftan-embroidery band around every slide."""
    s = T / 44
    def cell(i, x, y, rot=0):
        g = f'<g transform="translate({x},{y}) rotate({rot} {T/2} {T/2}) scale({s})">'
        if i % 2 == 0:
            g += (f'<rect x="5" y="5" width="34" height="34" fill="none" stroke="#7a5a44" stroke-width="3"/>'
                  f'<path d="M22,10 L34,22 L22,34 L10,22 Z" fill="{AMBER}"/><rect x="19" y="19" width="6" height="6" fill="#120E0C"/>')
        else:
            g += (f'<path d="M5,8 L22,20 L39,8 M5,22 L22,34 L39,22" fill="none" stroke="{AMBER}" stroke-width="3" opacity=".75"/>'
                  f'<rect x="19" y="36" width="6" height="6" fill="#7a5a44"/>')
        return g + '</g>'
    c = []
    for i in range(int(1080 / T) + 1):
        c.append(cell(i, i * T, 0)); c.append(cell(i + 1, i * T, 1350 - T))
    for j in range(1, int(1350 / T)):
        c.append(cell(j, 0, j * T, 90)); c.append(cell(j + 1, 1080 - T, j * T, 90))
    return (f'<svg class="full" width="1080" height="1350" style="pointer-events:none">'
            f'<path d="M0,0 H1080 V1350 H0 Z M{T},{T} V{1350 - T} H{1080 - T} V{T} Z" fill="#120E0C" fill-rule="evenodd"/>{"".join(c)}'
            f'<rect x="{T + 6}" y="{T + 6}" width="{1080 - 2 * T - 12}" height="{1350 - 2 * T - 12}" fill="none" stroke="{CREAM}" stroke-opacity=".35" stroke-width="1.5"/></svg>')


def placket(w, h, vertical=True, c1=AMBER, c2=CREAM, bg=CHAR):
    """Embroidered strip drawn from the placket/pocket patterns on his kaftans (original geometry)."""
    u = 44
    cells = []
    count = int((h if vertical else w) / u) + 2
    for i in range(count):
        o = i * u
        x, y = (0, o) if vertical else (o, 0)
        g = f'<g transform="translate({x},{y})">'
        if i % 2 == 0:
            g += (f'<rect x="5" y="5" width="34" height="34" fill="none" stroke="{c2}" stroke-width="3"/>'
                  f'<path d="M22,10 L34,22 L22,34 L10,22 Z" fill="{c1}"/><rect x="19" y="19" width="6" height="6" fill="{bg}"/>')
        else:
            g += (f'<path d="M5,8 L22,20 L39,8 M5,22 L22,34 L39,22" fill="none" stroke="{c1}" stroke-width="3"/>'
                  f'<rect x="19" y="36" width="6" height="6" fill="{c2}"/>')
        cells.append(g + '</g>')
    vw, vh = (u, h) if vertical else (w, u)
    return (f'<svg width="{w}" height="{h}" viewBox="0 0 {vw} {vh}" preserveAspectRatio="xMidYMin slice">'
            f'<rect width="{vw}" height="{vh}" fill="{bg}"/>{"".join(cells)}</svg>')


def grain(op=.16):
    return f'<img class="full" src="file://{HERE}/grain.png" style="width:100%;height:100%;opacity:{op};mix-blend-mode:overlay">'


def tex(name, op=1, style=''):
    return f'<img class="full" src="file://{TEX}/{name}" style="width:100%;height:100%;object-fit:cover;opacity:{op};{style}">'


# ---------------------------------------------------------------- slides
def s1():
    return (f'<div class="photo full" style="background-image:url({PH("fk-brown-profile.jpg")});background-position:58% 20%;filter:saturate(.92) contrast(1.04)"></div>'
            f'<div class="full" style="background:linear-gradient(180deg, rgba(23,18,15,.55) 0%, rgba(23,18,15,0) 22%, rgba(23,18,15,0) 42%, rgba(23,18,15,.88) 66%, {CHAR} 84%)"></div>'
            + grain(.14) + topbar(1) +
            f'<div class="a" style="left:0;top:262px;width:14px;height:500px">{placket(14, 500)}</div>'
            f'<div class="a m" style="left:72px;top:782px;color:{AMBER};font-weight:600">Meat &amp; Greet presents &middot; FirstKlaz</div>'
            f'<div class="a h" style="left:68px;top:826px;width:950px;font-size:104px;color:{CREAM}">Abuja didn&rsquo;t just<br>hear the sound.</div>'
            f'<div class="a h" style="left:68px;top:1026px;width:950px;font-size:104px;color:{AMBER}">It helped shape it.</div>'
            f'<div class="a b" style="left:72px;top:1150px;width:880px;font-size:31px;opacity:.92">A city where North and South share the same streets. On 31 October, FirstKlaz brings that sound home.</div>'
            + bottombar())


def s2():
    grid = ''.join(f'<path d="M{x},0 L{x},1350" stroke="{CREAM}" stroke-width="1" opacity=".07"/>' for x in range(0, 1081, 60))
    grid += ''.join(f'<path d="M0,{y} L1080,{y}" stroke="{CREAM}" stroke-width="1" opacity=".07"/>' for y in range(0, 1351, 60))
    rings = ''.join(f'<circle cx="540" cy="520" r="{r}" fill="none" stroke="{AMBER}" stroke-width="{w}" opacity="{o}" stroke-dasharray="{d}"/>'
                    for r, w, o, d in ((120, 3, .9, '0'), (230, 2, .55, '6 10'), (340, 1.5, .35, '2 10')))
    axes = (f'<path d="M540,140 L540,860 M160,520 L920,520" stroke="{CREAM}" stroke-width="2" opacity=".45"/>'
            f'<circle cx="540" cy="520" r="14" fill="{EMBER}"/><circle cx="540" cy="520" r="34" fill="none" stroke="{CREAM}" stroke-width="3"/>')
    labels = ''.join(f'<text x="{x}" y="{y}" text-anchor="{a}" font-family="Mono" font-size="19" letter-spacing="3" fill="{CREAM}" opacity=".75">{t}</text>'
                     for x, y, a, t in ((540, 128, 'middle', 'NORTH'), (540, 888, 'middle', 'SOUTH'), (150, 512, 'end', 'WEST'), (930, 512, 'start', 'EAST')))
    langs = ''.join(f'<text x="{x}" y="{y}" text-anchor="middle" font-family="Anton" font-size="{fs}" fill="{c}" opacity="{o}">{t}</text>'
                    for x, y, fs, c, o, t in ((540, 300, 40, CREAM, .9, 'HAUSA'), (300, 600, 40, CREAM, .9, 'YORUBA'), (790, 610, 40, CREAM, .9, 'IGBO'),
                                              (420, 410, 26, AMBER, .9, 'FULFULDE'), (690, 440, 26, AMBER, .9, 'GBAGYI'), (470, 760, 26, AMBER, .9, 'PIDGIN'),
                                              (660, 720, 26, AMBER, .9, 'AFROBEATS')))
    return (f'<div class="full" style="background:radial-gradient(ellipse 60% 45% at 50% 38%, #3a2216, {CHAR} 75%)"></div>'
            f'<svg class="full" width="1080" height="1350" viewBox="0 0 1080 1350">{grid}{rings}{axes}{labels}{langs}</svg>'
            + grain(.12) + topbar(2) +
            f'<div class="a h" style="left:68px;top:905px;width:950px;font-size:104px">Built where<br><span style="color:{AMBER}">Nigeria meets.</span></div>'
            f'<div class="a b" style="left:72px;top:1110px;width:900px;font-size:30px;opacity:.92">Abuja was planned at the centre of the country, a capital meant to belong to all of it. Grow up here and your soundtrack is never one language.</div>'
            + bottombar(left='CAPITAL SINCE 1991 &middot; PLANNED CITY'))


def s3():
    sprockets = ''.join(f'<rect x="{x}" y="10" width="26" height="18" rx="4" fill="{CHAR}"/><rect x="{x}" y="652" width="26" height="18" rx="4" fill="{CHAR}"/>' for x in range(20, 900, 52))
    return (f'<div class="full" style="background:{CHAR}"></div>' + tex('paper.jpg', .06) +
            topbar(3) +
            f'<div class="a" style="left:72px;top:190px;width:936px;height:680px;background:#0a0807;transform:rotate(-1.2deg);box-shadow:0 30px 60px rgba(0,0,0,.6)">'
            f'<div class="photo raw" style="left:18px;top:40px;width:900px;height:600px;background-image:url({PH("fk-black-leaning.jpg")});background-position:50% 20%;filter:grayscale(1) sepia(.55) contrast(1.15) brightness(.95)"></div>'
            f'<div class="photo" style="left:18px;top:40px;width:900px;height:600px;background:{AMBER};mix-blend-mode:multiply;opacity:.35"></div>'
            f'<svg class="a" style="left:0;top:0" width="936" height="680">{sprockets}</svg>'
            f'<div class="a m" style="left:22px;top:648px;color:{AMBER};font-size:14px">FK-03 &nbsp;&#9654; &nbsp;KODAK-STYLE CONTACT &middot; ARCHIVE</div></div>' +
            f'<div class="a m" style="left:72px;top:908px;color:{AMBER};font-weight:600">Before 2024 &middot; by his own account</div>'
            f'<div class="a h" style="left:68px;top:948px;width:960px;font-size:76px">Before the name travelled,<br><span style="color:{AMBER}">the sound was taking shape.</span></div>'
            f'<div class="a b" style="left:72px;top:1100px;width:930px;font-size:28.5px;opacity:.92">Roots in Nasarawa, raised in Abuja. A church choir. His father&rsquo;s R&amp;B, rock and reggae on repeat. A school nickname, &ldquo;first class&rdquo;, he decided to keep. Then years of putting singles out himself.</div>'
            + grain(.18) + bottombar())


def s4():
    return (f'<div class="photo" style="left:0;top:0;width:1080px;height:830px;background-image:url({PH("fk-blue-seated.jpg")});background-position:50% 30%;filter:contrast(1.04)"></div>'
            f'<div class="a" style="left:0;top:0;width:1080px;height:240px;background:linear-gradient(180deg, rgba(23,18,15,.7), rgba(23,18,15,0))"></div>'
            f'<div class="a" style="left:0;top:830px;width:1080px;height:22px">{placket(1080, 22, vertical=False, bg=EARTH)}</div>'
            f'<div class="a" style="left:0;top:852px;width:1080px;height:498px;background:{CHAR}"></div>'
            + topbar(4) +
            f'<div class="a m" style="left:72px;top:880px;color:{AMBER};font-weight:600">2024 &middot; the formula</div>'
            f'<div class="a h" style="left:68px;top:920px;width:960px;font-size:92px"><span style="color:{AMBER}">Fuji</span> in one hand.<br><span style="color:{AMBER}">Arewa</span> in the other.</div>'
            f'<div class="a b" style="left:72px;top:1110px;width:936px;font-size:29.5px;opacity:.94">Fuji grit. Northern melodies and talking drums. Afrobeats bounce underneath. Old-school sounds, new-school melodies, he says. That&rsquo;s why every title starts with Gen-Z.</div>'
            + grain(.12) + bottombar(left='OLD RECORDS / NEW BLOOD'))


TRACKS = [
    ('01', 'GEN-Z FUJI', '2024', 'Afrobeats over Fuji, with a cleared sample of the late Sikiru Ayinde Barrister.'),
    ('02', 'GEN-Z FUJI II', 'FEAT. TERRY APALA', 'The run-back. Grittier.'),
    ('03', 'GEN-Z FAAJI', 'FEAT. JOEBOY', 'The crossover.'),
    ('04', 'GEN-Z AREWA', 'WITH ILIYA ENTERTAINMENT MUSIC', 'A veteran Northern band on a Gen-Z record.'),
]


def s5():
    rows = ''.join(
        f'<div style="display:flex;gap:22px;padding:20px 0;border-top:2px solid rgba(239,230,214,.18)">'
        f'<div class="h" style="font-size:58px;color:{AMBER};width:72px;flex:none">{n}</div>'
        f'<div><div class="h" style="font-size:46px">{t}</div>'
        f'<div class="m" style="font-size:15px;color:{AMBER};margin-top:8px">{meta}</div>'
        f'<div class="b" style="font-size:22.5px;margin-top:8px;opacity:.88;line-height:1.3">{d}</div></div></div>'
        for n, t, meta, d in TRACKS)
    return (f'<div class="full" style="background:{CHAR}"></div>'
            f'<div class="photo" style="left:676px;top:0;width:404px;height:1350px;background-image:url({PH("fk-black-standing.jpg")});background-position:52% 50%;filter:sepia(.25) contrast(1.05)"></div>'
            f'<div class="a" style="left:654px;top:0;width:22px;height:1350px">{placket(22, 1350, bg=EARTH)}</div>'
            f'<div class="a" style="left:0;top:0;width:654px;height:300px;background:linear-gradient(180deg,{CHAR},rgba(23,18,15,0))"></div>'
            + logo(150) +
            f'<div class="a" style="left:740px;top:70px;display:flex;flex-direction:column;align-items:flex-end;width:268px">'
            f'<div class="m" style="color:{CREAM};font-weight:600;font-size:21px;text-shadow:0 2px 10px rgba(0,0,0,.6)">05 / 08</div></div>'
            f'<div class="a m" style="left:72px;top:250px;color:{AMBER};font-weight:600">2024 &middot; side A &middot; the Gen-Z series</div>'
            f'<div class="a h" style="left:68px;top:292px;width:580px;font-size:96px">Four records.<br><span style="color:{AMBER}">One identity.</span></div>'
            f'<div class="a" style="left:72px;top:500px;width:560px">{rows}</div>'
            f'<div class="a b" style="left:72px;top:1196px;width:560px;font-size:21px;opacity:.85;line-height:1.35">Then came <i>Dejavu</i>, and in 2026, <i>Tsammani</i> and <i>Salama</i>. The story kept moving.</div>'
            + grain(.12) +
            f'<div class="a m" style="left:72px;bottom:54px;color:{CREAM};opacity:.8;font-size:17px">MEAT &amp; GREET &times; FIRSTKLAZ</div>'
            f'<div class="a" style="right:72px;bottom:50px;padding:8px 12px;background:rgba(23,18,15,.75)">{swipe()}</div>')


def s6():
    word = lambda t, c, lang, top: (f'<div class="a h" style="left:64px;top:{top}px;font-size:250px;line-height:.86;color:{c}">{t}</div>'
                                   f'<div class="a" style="left:560px;top:{top + 70}px"><div class="m" style="font-size:20px;color:{CREAM};opacity:.75">{lang}</div>'
                                   f'<div class="h" style="font-size:44px;color:{CREAM};margin-top:6px">&ldquo;COME&rdquo;</div></div>')
    return (f'<div class="full" style="background:radial-gradient(ellipse 70% 50% at 30% 40%, #2c1a12, {CHAR} 70%)"></div>'
            f'<div class="photo" style="left:880px;top:0;width:200px;height:1350px;background-image:url({PH("fk-silver-portrait.jpg")});background-repeat:no-repeat;background-size:2200px auto;background-position:-1010px -1420px;filter:grayscale(.2) contrast(1.1)"></div>'
            f'<div class="a" style="left:880px;top:0;width:200px;height:1350px;background:linear-gradient(90deg,{CHAR},rgba(23,18,15,.1) 60%)"></div>'
            + topbar(6) +
            word('WA.', CREAM, 'YORUBA', 190) + word('ZO.', AMBER, 'HAUSA', 420) + word('BIA.', RED, 'IGBO', 650) +
            f'<div class="a b" style="left:72px;top:930px;width:780px;font-size:31px">When &ldquo;Gen-Z Arewa&rdquo; grew into <b style="font-weight:700;color:{AMBER}">&ldquo;Gen-Z Arewazobia&rdquo;</b>, the title said what Abuja has always known: one city, every tongue.</div>'
            f'<div class="a b" style="left:72px;top:1100px;width:780px;font-size:31px;opacity:.85">Abuja didn&rsquo;t build this sound alone. But it&rsquo;s where those sounds were already in the same room.</div>'
            + grain(.12) + bottombar(left='THE CAPITAL IN THE CONVERSATION'))


def s7():
    rays = ''.join(f'<path d="M540,1350 L{540 + 2200 * __import__("math").cos(a):.0f},{1350 - 2200 * __import__("math").sin(a):.0f} L{540 + 2200 * __import__("math").cos(a + .07):.0f},{1350 - 2200 * __import__("math").sin(a + .07):.0f} Z" fill="#000" opacity=".22"/>'
                   for a in [i * .14 for i in range(23)])
    return (tex('board_red.jpg') +
            f'<svg class="full" width="1080" height="1350">{rays}</svg>'
            f'<div class="full" style="background:radial-gradient(ellipse 70% 55% at 50% 100%, rgba(224,89,42,.35), rgba(11,9,9,.55) 80%)"></div>'
            + tex('smoke_bone.png', .35, 'top:55%;height:50%;object-fit:fill') + tex('smoke_red.png', .9, 'top:50%;height:55%;object-fit:fill') +
            topbar(7) +
            f'<div class="a h" style="left:40px;top:230px;width:1000px;font-size:430px;color:transparent;-webkit-text-stroke:3px rgba(239,230,214,.22);line-height:.85">31.10</div>'
            f'<img class="a" src="file://{HERE}/art/stage-led.png" style="left:96px;top:196px;width:640px;transform:rotate(-3.5deg);border:8px solid {CREAM};box-shadow:0 26px 50px rgba(0,0,0,.55)">'
            f'<img class="a" src="file://{HERE}/art/skull-banner.png" style="left:790px;top:150px;width:160px;transform:rotate(4deg);border:6px solid {CREAM};box-shadow:0 26px 50px rgba(0,0,0,.55)">'
            f'<div class="a m" style="left:100px;top:582px;color:{CREAM};opacity:.85;font-size:15px;transform:rotate(-3.5deg)">STAGE ART &middot; FIRSTKLAZ MEATING</div>'
            f'<div class="a m" style="left:72px;top:660px;color:{CREAM};font-weight:600">31 October &middot; Halloween BBQ Party &middot; Meat &amp; Greet</div>'
            f'<div class="a h" style="left:68px;top:704px;width:960px;font-size:122px">Now the next<br>chapter gets<br><span style="color:{BLACK if False else "#0B0909"}">louder.</span></div>'
            f'<div class="a b" style="left:72px;top:1080px;width:920px;font-size:32px">Red light. Smoke. Suya and ribs off the grill. A whole compound in costume. Then the curtain opens on FirstKlaz.</div>'
            + grain(.14) + bottombar(left='COSTUME OR ALL-BLACK &middot; COME DRESSED TO KILL'))


def s8():
    place = EVENT['place'] + (f' &middot; {EVENT["venue"]}' if EVENT['venue'] else '') + (f' &middot; {EVENT["time"]}' if EVENT['time'] else '')
    return (f'<div class="photo" style="left:0;top:0;width:1080px;height:860px;background-image:url({PH("fk-silver-portrait.jpg")});background-position:50% 22%;filter:contrast(1.05) sepia(.08)"></div>'
            f'<div class="a" style="left:0;top:560px;width:1080px;height:300px;background:linear-gradient(180deg,rgba(23,18,15,0),{CHAR})"></div>'
            f'<div class="a" style="left:0;top:0;width:1080px;height:220px;background:linear-gradient(180deg,rgba(23,18,15,.55),rgba(23,18,15,0))"></div>'
            + topbar(8, logo_on=False) +
            logo(250, 72, 600) +
            f'<div class="a h" style="left:68px;top:812px;width:960px;font-size:108px">Abuja, this chapter<br><span style="color:{AMBER}">is yours.</span></div>'
            f'<div class="a" style="left:72px;top:1030px;font-family:Brush;font-size:56px;color:{CREAM};line-height:1">FirstKlaz Meating</div>'
            f'<div class="a m" style="left:72px;top:1100px;color:{CREAM};font-weight:600;font-size:21px">{EVENT["date"]} &middot; {place}</div>'
            f'<div class="a m" style="left:72px;top:1136px;color:{CREAM};opacity:.75;font-size:17px">Halloween BBQ Party &middot; costume or all-black</div>'
            # ticket stub CTA
            f'<div class="a" style="left:72px;top:1172px;width:936px;height:96px;display:flex">'
            f'<div style="flex:1;background:{RED};display:flex;align-items:center;justify-content:space-between;padding:0 30px;'
            f'-webkit-mask:radial-gradient(circle 14px at 100% 50%, transparent 98%, #000)">'
            f'<div class="h" style="font-size:46px;color:{CREAM}">{EVENT["tickets"]}</div>'
            f'<div class="m" style="color:{CREAM};font-weight:600;font-size:20px">{EVENT["link"]} &rarr;</div></div>'
            f'<div style="width:0;border-left:3px dashed {CHAR}"></div>'
            f'<div style="width:150px;background:{RED};display:flex;align-items:center;justify-content:center;-webkit-mask:radial-gradient(circle 14px at 0 50%, transparent 98%, #000)">'
            f'<div class="h" style="font-size:40px;color:{CREAM}">31.10</div></div></div>'
            + grain(.12) +
            f'<div class="a m" style="left:72px;bottom:46px;color:{CREAM};opacity:.75;font-size:16px">Send this to who you&rsquo;re pulling up with.</div>'
            f'<div class="a m" style="right:72px;bottom:46px;color:{CREAM};opacity:.75;font-size:16px">A TCM PRODUCTION</div>')


SLIDES = [s1, s2, s3, s4, s5, s6, s7, s8]
NAMES = ['01_Statement', '02_The-City', '03_Before-The-Name', '04_The-Sound', '05_The-Records', '06_Wa-Zo-Bia', '07_The-Night', '08_The-Invitation']


def main():
    os.makedirs(os.path.join(HERE, 'html'), exist_ok=True)
    os.makedirs(OUT, exist_ok=True)
    paths = []
    for fn, name in zip(SLIDES, NAMES):
        p = os.path.join(HERE, 'html', name + '.html')
        open(p, 'w').write(f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body><div class="s">{fn()}{frame()}</div></body></html>')
        paths.append((p, os.path.join(OUT, f'MG-x-FirstKlaz_{name}.png')))
    js = os.path.join(HERE, 'shoot.js')
    open(js, 'w').write("""const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const p=await b.newPage({viewport:{width:1080,height:1350},deviceScaleFactor:1});
for(const [h,o] of JSON.parse(process.argv[2])){await p.goto('file://'+h);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(250);await p.screenshot({path:o});}
await b.close();})();""")
    import json
    subprocess.run(['node', js, json.dumps(paths)], check=True)
    # preview
    from PIL import Image
    ims = [Image.open(o) for _, o in paths]
    tw, th, gap = 540, 675, 24
    sheet = Image.new('RGB', (4 * tw + 5 * gap, 2 * th + 3 * gap), (40, 34, 31))
    for i, im in enumerate(ims):
        sheet.paste(im.resize((tw, th), Image.LANCZOS), (gap + (i % 4) * (tw + gap), gap + (i // 4) * (th + gap)))
    sheet.save(os.path.join(OUT, 'MG-x-FirstKlaz_Carousel-Preview.png'))
    strip = Image.new('RGB', (8 * 540, 675))
    for i, im in enumerate(ims):
        strip.paste(im.resize((540, 675), Image.LANCZOS), (i * 540, 0))
    strip.save(os.path.join(OUT, 'MG-x-FirstKlaz_Carousel-Strip.jpg'), quality=88)
    print('done', len(ims))


if __name__ == '__main__':
    main()
