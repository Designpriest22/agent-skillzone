"""MEAT & GREET x FIRSTKLAZ - 30s animated walkthrough of the night (1080x1920, 30fps).

A first-person walk through the actual venue, dressed with the real print designs from the
print pack (arch sign, skull banners, zone signs, coffin grill menu, bar menus, fence boards,
stage LED still), populated by rigged costumed partygoers that dance on the beat.

python3 walkthrough.py              -> ../export/MeatAndGreet_Walkthrough_30s.mp4 (+ silent, poster)
python3 walkthrough.py frames 0 90  -> render only those frames

STORYBOARD (120 BPM)
 0.0- 4.0  THE GATE    moonlit Doxa Park, bare trees, the Enter-If-You-Dare arch, guests in costume
                       queue, a reaper on the door. Music heard muffled from outside. Camera dives in.
 4.0- 7.0  THE TUNNEL  fly through web-strung arches lit by skull lanterns; a reaper lunges (5.1)
 7.0-11.5  THE GRILL   flash into the compound: drum grills on fire, the Butcher chops on the beat,
                       a plague doctor turns skewers, guests eat suya. Full music kicks in.
11.5-15.5  THE BARS    Poison Bar + Blood Bank: skeleton bartender shaking, IV bags, glowing bottles
15.5-19.0  THE FLOOR   the whole crew of monsters dancing under red beams; lights cut, all look up
19.0-24.5  THE STAGE   tilt up to the stage: LED wall, skull banners, the drop at 20.0, pyro on the beat,
                       FirstKlaz on the screen, the crowd going up with phones
24.5-30.0  THE CALL    "Get your tickets. The BBQ is free." over the still-raving crowd
"""
import math
import os
import random
import shutil
import subprocess
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import chars  # noqa: E402
from promo_mix import MIX_CSS, BAT, logo, embroidery_frame, PHOTOS  # noqa: E402
from promo import FLAME, TEX, GRAIN, W, H, FPS, hook_svg, skull_svg, pumpkin_svg  # noqa: E402

DUR = 30.0
OUT = os.path.abspath(os.path.join(HERE, '..', 'export'))
SCRATCH = os.environ.get('PROMO_TMP', os.path.join(HERE, '_frames_walk'))
NAME = 'MeatAndGreet_Walkthrough_30s'
V = lambda n: 'file://' + os.path.join(HERE, 'venue', n)
PH = lambda n: 'file://' + os.path.join(PHOTOS, n)
N_BATS = 40

CSS = MIX_CSS + """
.scene{position:absolute;inset:0;overflow:hidden;display:none;transform-origin:50% 55%}
.px{position:absolute;left:0;top:0}
.pc{position:absolute}
.pc svg{display:block}
.tshade{position:absolute;left:0;right:0;bottom:0;height:880px;background:linear-gradient(180deg,rgba(5,3,3,0),rgba(5,3,3,.82) 42%,rgba(5,3,3,.92))}
.bulb{position:absolute;width:14px;height:14px;border-radius:50%;background:#ffcf8a;box-shadow:0 0 18px 6px rgba(255,140,50,.55)}
.puff{position:absolute;border-radius:50%;background:radial-gradient(circle,rgba(220,210,200,.30),rgba(220,210,200,0) 68%)}
.beam{position:absolute;top:-80px;width:340px;height:1700px;clip-path:polygon(47% 0,53% 0,100% 100%,0 100%);transform-origin:50% 0;
  background:linear-gradient(180deg,rgba(255,70,40,.75),rgba(208,20,30,.25) 55%,rgba(208,20,30,0) 85%);mix-blend-mode:screen}
.spark{position:absolute;border-radius:50%;background:#ffb347;box-shadow:0 0 10px #ff6a1f}
"""


# ------------------------------------------------------------------ helpers
def place(svg, x, feet, s, move='bounce', ph=0.0, extra=''):
    return (f'<div class="pc" data-move="{move}" data-ph="{ph}" style="left:{x - 140 * s:.0f}px;top:{feet - 585 * s:.0f}px;{extra}">{svg}</div>')


def ch(kind, x, feet, s, move='bounce', ph=0.0, pr='', pl='', skin=0, flip=False):
    return place(chars.character(kind, skin, pr, pl, s, flip=flip), x, feet, s, move, ph)


def blk(id_, top, kick, lines):
    hl = ''.join(f'<div class="hl{" red" if red else ""}" style="font-size:{fs}px"><span class="ln">{txt}</span></div>' for txt, fs, red in lines)
    return f'<div id="{id_}" class="blk" style="top:{top}px"><div class="kick"><span class="rule"></span><span class="kt">{kick}</span><span class="rule"></span></div>{hl}</div>'


def flames(cls, n, x0, x1, base, h, gid):
    return ''.join(
        f'<div class="a {cls}" style="left:{x0 + (x1 - x0) * i / max(1, n - 1) - h * .35:.0f}px;top:{base - h:.0f}px;width:{h * .7:.0f}px;height:{h:.0f}px;transform-origin:50% 100%">'
        f'<svg viewBox="0 0 100 102" width="100%" height="100%" preserveAspectRatio="none"><defs><linearGradient id="{gid}{i}" x1="0" y1="1" x2="0" y2="0">'
        f'<stop offset="0" stop-color="#ffe2a0"/><stop offset=".3" stop-color="#ff8a1a"/><stop offset=".75" stop-color="#d0141e"/><stop offset="1" stop-color="#d0141e" stop-opacity="0"/>'
        f'</linearGradient></defs><path d="{FLAME}" fill="url(#{gid}{i})"/></svg></div>' for i in range(n))


def tree_svg(seed, w=760, h=1500):
    rnd = random.Random(seed)
    paths = []

    def branch(x, y, ang, ln, wd, depth):
        x2, y2 = x + math.cos(ang) * ln, y + math.sin(ang) * ln
        cx, cy = (x + x2) / 2 + rnd.uniform(-20, 20), (y + y2) / 2 + rnd.uniform(-20, 20)
        paths.append(f'<path d="M{x:.0f},{y:.0f} Q{cx:.0f},{cy:.0f} {x2:.0f},{y2:.0f}" stroke="#060303" stroke-width="{wd:.1f}" fill="none" stroke-linecap="round"/>')
        if depth == 0 or wd < 2:
            return
        for _ in range(rnd.choice([2, 2, 3])):
            branch(x2, y2, ang + rnd.uniform(-.75, .75), ln * rnd.uniform(.6, .78), wd * .62, depth - 1)
    branch(w * .5, h, -math.pi / 2 + rnd.uniform(-.1, .1), h * .32, 46, 7)
    return f'<svg viewBox="0 0 {w} {h}" width="{w}" height="{h}" style="overflow:visible">{"".join(paths)}</svg>'


def tunnel_ring(k):
    hole = 'M240,1760 L240,820 C240,540 390,380 540,300 C690,380 840,540 840,820 L840,1760 Z'
    folds = ''.join(f'<path d="M{x},{-200} L{x + (k % 2) * 20},{2120}" stroke="#170d0c" stroke-width="10"/>' for x in range(-180, 1280, 70))
    web = ''.join(f'<path d="M{cx},{cy} L{cx + dx * 150},{cy + dy * 150}" stroke="#d8d0c4" stroke-width="2" opacity=".45"/>'
                  for cx, cy, sx in ((250, 830, 1), (830, 830, -1)) for dx, dy in ((sx * 1, 0), (sx * .7, -.7), (0, -1), (sx * .9, -.4)))
    web += ''.join(f'<path d="M{250 + 40 * r},{830} Q{250 + 30 * r},{830 - 30 * r} {250},{830 - 40 * r}" stroke="#d8d0c4" stroke-width="1.6" fill="none" opacity=".4"/>'
                   f'<path d="M{830 - 40 * r},{830} Q{830 - 30 * r},{830 - 30 * r} {830},{830 - 40 * r}" stroke="#d8d0c4" stroke-width="1.6" fill="none" opacity=".4"/>' for r in (1, 2, 3))
    chain = ''.join(f'<rect x="{x - 8}" y="{360 + j * 26}" width="16" height="30" rx="8" fill="none" stroke="#6f6f6f" stroke-width="5"/>'
                    for x in ((430, 650) if k % 2 else (540,)) for j in range(6 + k % 3))
    sk = ''.join(f'<g transform="translate({x - 45},{880}) scale(.45)"><circle cx="100" cy="110" r="150" fill="#ff5a2a" opacity=".22"/>{skull_svg().replace("<svg ", "<svg width=\"200\" height=\"234\" ", 1)}</g>'
                 for x in (205, 875))
    return (f'<svg viewBox="0 0 1080 1920" width="1080" height="1920" style="overflow:visible">'
            f'<path d="M-400,-400 H1480 V2320 H-400 Z {hole}" fill="#0c0707" fill-rule="evenodd"/>'
            f'<g clip-path="url(#tc{k})">{folds}</g><clipPath id="tc{k}"><path d="M-400,-400 H1480 V2320 H-400 Z {hole}" clip-rule="evenodd"/></clipPath>'
            f'<path d="{hole}" fill="none" stroke="#c4161c" stroke-width="8" opacity=".9"/>{web}{chain}{sk}</svg>')


def drum_grill(i):
    sk = ''.join(f'<g transform="translate({120 + j * 52},{128 + (j % 2) * 6}) rotate(-8)"><line x1="0" y1="-40" x2="0" y2="40" stroke="#c9a46b" stroke-width="4"/>'
                 + ''.join(f'<rect x="-10" y="{-30 + m * 20}" width="20" height="16" rx="5" fill="#7a2a14"/>' for m in range(3)) + '</g>' for j in range(8))
    return (f'<svg viewBox="0 0 640 380" width="640" height="380" style="overflow:visible"><defs><linearGradient id="dg{i}" x1="0" x2="1">'
            f'<stop offset="0" stop-color="#0c0909"/><stop offset=".5" stop-color="#2c2524"/><stop offset="1" stop-color="#0c0909"/></linearGradient>'
            f'<radialGradient id="cg{i}"><stop offset="0" stop-color="#ffcf5a"/><stop offset=".4" stop-color="#ff5a1f"/><stop offset="1" stop-color="#7a0e08"/></radialGradient></defs>'
            f'<path d="M120,230 L80,380 M520,230 L560,380 M320,260 L320,380" stroke="#1d1717" stroke-width="16" stroke-linecap="round"/>'
            f'<path d="M30,130 A290,120 0 0 1 610,130 L600,120 A280,110 0 0 0 40,120 Z" fill="#141010"/>'
            f'<path d="M20,140 L620,140 L620,160 A300,130 0 0 1 20,160 Z" fill="url(#dg{i})" stroke="#3a3232" stroke-width="4"/>'
            f'<ellipse cx="320" cy="140" rx="300" ry="38" fill="url(#cg{i})" class="coalbed"/>'
            + ''.join(f'<line x1="{x}" y1="{112}" x2="{x}" y2="{168}" stroke="#7a7a7a" stroke-width="5" clip-path="url(#ge{i})"/>' for x in range(40, 620, 30))
            + f'<clipPath id="ge{i}"><ellipse cx="320" cy="140" rx="300" ry="38"/></clipPath>{sk}'
            f'<ellipse cx="320" cy="140" rx="300" ry="38" fill="none" stroke="#9a9a9a" stroke-width="6"/>'
            f'<path d="M60,200 C160,250 480,250 580,200" stroke="#5a4c4a" stroke-width="5" fill="none" opacity=".5"/></svg>')


def bottles(n, seed, width):
    rnd = random.Random(seed)
    out = []
    x = 10
    while x < width - 60:
        hgt = rnd.choice([110, 130, 150, 90])
        col = rnd.choice(['#8e0c12', '#c4161c', '#E0592A', '#3a1a10', '#d98a2b'])
        glow = rnd.random() > .5
        out.append(f'<g transform="translate({x},{-hgt})"><path d="M14,0 L26,0 L26,{hgt * .3} C42,{hgt * .36} 44,{hgt * .45} 44,{hgt * .55} L44,{hgt - 6} Q44,{hgt} 38,{hgt} L2,{hgt} Q-4,{hgt} -4,{hgt - 6} L-4,{hgt * .55} C-4,{hgt * .45} -2,{hgt * .36} 14,{hgt * .3} Z" fill="{col}" opacity=".9"/>'
                   f'<rect x="0" y="{hgt * .58}" width="40" height="{hgt * .26}" fill="#e8dfcf"/><circle cx="20" cy="{hgt * .71}" r="7" fill="#0b0707"/>'
                   + (f'<ellipse cx="20" cy="{hgt * .6}" rx="50" ry="{hgt * .6}" fill="{col}" opacity=".18"/>' if glow else '') + '</g>')
        x += rnd.choice([52, 60, 70])
    return f'<svg width="{width}" height="160" viewBox="0 -150 {width} 160" style="overflow:visible">{"".join(out)}</svg>'


def string_lights(width, y0, sag, n, seed):
    s = []
    for i in range(n):
        u = i / (n - 1)
        x = u * width
        y = y0 + sag * 4 * u * (1 - u) + (math.sin(u * 20 + seed) * 6)
        s.append(f'<div class="bulb" style="left:{x:.0f}px;top:{y:.0f}px"></div>')
    wire = f'<svg class="a" style="left:0;top:0" width="{width}" height="{y0 + sag + 40}"><path d="M0,{y0 + 6} Q{width / 2},{y0 + 2 * sag + 6} {width},{y0 + 6}" stroke="#222" stroke-width="3" fill="none"/></svg>'
    return wire + ''.join(s)


# ------------------------------------------------------------------ scenes
def scene_gate():
    stars = ''.join(f'<div class="a" style="left:{(i * 197) % 1080}px;top:{(i * 131) % 900}px;width:3px;height:3px;border-radius:50%;background:#f3e6d0;opacity:{.3 + (i % 5) / 8}"></div>' for i in range(60))
    return f"""
<div id="s1" class="scene" data-t0="0" data-t1="4.15">
  <div class="px" data-f="0" style="width:1080px;height:1920px;background:radial-gradient(ellipse 80% 50% at 50% 25%, #2c0a08, #0a0404 60%, #050303)"></div>
  <div class="px" data-f=".05">{stars}</div>
  <div class="px" data-f=".12" style="left:270px;top:170px;width:540px;height:540px;border-radius:50%;
     background:radial-gradient(circle at 45% 40%, #f6ead6, #e3c3a2 55%, #c98d6e);box-shadow:0 0 160px 40px rgba(255,90,50,.45), 0 0 40px 10px rgba(255,200,160,.35)">
     <div class="a" style="left:120px;top:150px;width:90px;height:90px;border-radius:50%;background:#d7b394;opacity:.6"></div>
     <div class="a" style="left:300px;top:260px;width:60px;height:60px;border-radius:50%;background:#d7b394;opacity:.55"></div>
     <div class="a" style="left:220px;top:380px;width:110px;height:70px;border-radius:50%;background:#d7b394;opacity:.45"></div></div>
  <img class="px cloud" data-f=".2" src="file://{TEX}/smoke_bone.png" style="left:-300px;top:300px;width:1700px;height:500px;opacity:.35">
  <div class="px" data-f=".45" style="left:-330px;top:260px">{tree_svg(3)}</div>
  <div class="px" data-f=".45" style="left:650px;top:300px;transform:scaleX(-1)">{tree_svg(8)}</div>
  <div class="px" data-f=".7" style="left:0;top:1180px;width:1080px;height:760px;background:linear-gradient(180deg,#0c0606,#050303)"></div>
  <img class="px" data-f=".8" src="{V('fence-haunted.png')}" style="left:-60px;top:1230px;width:330px;transform:rotate(-6deg);filter:brightness(.8)">
  <img class="px" data-f=".8" src="{V('fence-beware.png')}" style="left:820px;top:1250px;width:310px;transform:rotate(5deg);filter:brightness(.8)">
  <div class="px" data-f="1" style="left:0;top:0;width:1080px;height:1920px">
    <div class="a" style="left:300px;top:740px;width:480px;height:700px;background:radial-gradient(ellipse 60% 55% at 50% 60%, #ff4a2a 0%, #b3121c 30%, #2a0606 70%, #0c0505)"></div>
    <div class="a" id="gateDoor" style="left:300px;top:740px;width:480px;height:700px">
      <svg width="480" height="700" viewBox="0 0 480 700"><path d="M60,700 L60,300 C60,180 160,120 240,100 C320,120 420,180 420,300 L420,700" fill="none" stroke="#0a0505" stroke-width="40"/>
      <path d="M130,700 L130,360 C130,280 190,240 240,226 C290,240 350,280 350,360 L350,700" fill="none" stroke="#0a0505" stroke-width="30" opacity=".85"/></svg></div>
    <div class="a" style="left:252px;top:640px;width:50px;height:820px;background:linear-gradient(90deg,#1d1210,#3a2620,#140c0a)"></div>
    <div class="a" style="left:778px;top:640px;width:50px;height:820px;background:linear-gradient(90deg,#1d1210,#3a2620,#140c0a)"></div>
    <img class="a" src="{V('skullL.png')}" style="left:110px;top:740px;width:150px;box-shadow:0 0 30px rgba(0,0,0,.7)">
    <img class="a" src="{V('skullR.png')}" style="left:820px;top:740px;width:150px;box-shadow:0 0 30px rgba(0,0,0,.7)">
    <img class="a" id="archImg" src="{V('arch.png')}" style="left:160px;top:440px;width:760px;box-shadow:0 20px 60px rgba(0,0,0,.8)">
    <div class="a swing" style="left:330px;top:735px;width:80px;transform-origin:40px 0"><div style="width:4px;height:30px;background:#444;margin:0 auto"></div>{skull_svg().replace('<svg ', '<svg width="80" height="94" style="filter:drop-shadow(0 0 18px rgba(255,80,40,.8))" ', 1)}</div>
    <div class="a swing" style="left:670px;top:735px;width:80px;transform-origin:40px 0"><div style="width:4px;height:30px;background:#444;margin:0 auto"></div>{skull_svg().replace('<svg ', '<svg width="80" height="94" style="filter:drop-shadow(0 0 18px rgba(255,80,40,.8))" ', 1)}</div>
    {ch('pumpkin', 470, 1420, .5, 'idle', .2, pr='phone', skin=1)}
    {ch('devil', 620, 1425, .52, 'bounce', .6, skin=2)}
    {ch('reaper', 880, 1470, .78, 'idle', .1, pr='lantern')}
  </div>
  <div class="px" data-f="1.25">
    {ch('vampire', 150, 1700, 1.05, 'idle', .3, skin=0)}
    {ch('witch', 960, 1730, 1.0, 'bounce', .7, pr='ivbag', skin=3)}
  </div>
  <img class="px fog" data-f="1.1" src="file://{TEX}/smoke_bone.png" style="left:-300px;top:1250px;width:1700px;height:700px;opacity:.4">
</div>"""


def scene_tunnel():
    rings = ''.join(f'<div class="ring" data-z="{k * .9:.2f}" style="position:absolute;left:0;top:0;width:1080px;height:1920px;transform-origin:540px 1000px">{tunnel_ring(k)}</div>' for k in range(9))
    return f"""
<div id="s2" class="scene" data-t0="3.9" data-t1="7.1" style="background:#050303">
  <div id="tEnd" class="a" style="left:240px;top:600px;width:600px;height:800px;background:radial-gradient(ellipse 50% 50% at 50% 50%, #ffd0a0, #ff4a2a 25%, #b3121c 45%, rgba(0,0,0,0) 72%)"></div>
  {rings}
  <div id="scare" class="a" style="left:0;top:0">{place(chars.character('reaper', 0, '', '', 1.5), 0, 0, 1.5, 'lunge', 0)}</div>
  <img class="a fog" src="file://{TEX}/smoke_red.png" style="left:-300px;top:1200px;width:1700px;height:800px;opacity:.5">
</div>"""


def scene_grill():
    hooks = ''.join(f'<div class="a hook" data-ph="{i * .7}" data-sc=".8" style="left:{i * 260 - 40}px;top:-60px;transform-origin:60px 0">{hook_svg(["ham", None, "rack", None][i % 4], 40 + (i * 37) % 80)}</div>' for i in range(10))
    puffs = ''.join(f'<div class="puff" data-g="{i % 2}" style="width:{260 + (i * 37) % 140}px;height:{260 + (i * 37) % 140}px"></div>' for i in range(18))
    sparks = ''.join(f'<div class="spark gs" data-g="{i % 2}" style="width:{4 + i % 4}px;height:{4 + i % 4}px"></div>' for i in range(40))
    return f"""
<div id="s3" class="scene" data-t0="6.9" data-t1="11.65" style="background:#070404">
  <div class="px" data-f=".35" style="width:2600px;height:1920px;left:-200px;background:repeating-linear-gradient(90deg,#0b0606 0 46px,#140909 46px 70px,#0b0606 70px 110px)"></div>
  <div class="px" data-f=".4" style="left:-200px;top:0">{string_lights(2600, 210, 120, 40, 1)}</div>
  <div class="px" data-f=".5" style="left:180px;top:330px"><img src="{V('zone6.png')}" style="width:620px;box-shadow:0 0 60px rgba(255,90,40,.35)"></div>
  <div class="px" data-f=".7" style="left:-100px;top:0">{hooks}</div>
  <div class="px" data-f=".8" style="left:1660px;top:470px"><img src="{V('coffin-menu.png')}" style="width:280px;filter:drop-shadow(0 0 40px rgba(255,90,40,.35))"></div>
  <div class="px" data-f="1" style="left:0;top:0;width:2400px;height:1920px">
    <div class="a" style="left:120px;top:700px;width:2200px;height:700px;background:radial-gradient(ellipse 40% 50% at 25% 60%, rgba(255,90,30,.45), rgba(0,0,0,0) 70%),radial-gradient(ellipse 40% 50% at 68% 60%, rgba(255,90,30,.45), rgba(0,0,0,0) 70%)"></div>
    {ch('butcher', 560, 1290, 1.12, 'chop', 0, pr='cleaver', pl='skewer', skin=1)}
    {ch('plague', 1500, 1290, 1.08, 'hold', .4, pr='skewer')}
    <div class="a" id="gr0" style="left:250px;top:930px">{drum_grill(0)}</div>
    <div class="a" id="gr1" style="left:1180px;top:930px">{drum_grill(1)}</div>
    <div class="a" style="left:0;top:0">{flames('gfl', 8, 300, 860, 1080, 150, 'ga')}{flames('gfl', 8, 1230, 1790, 1080, 150, 'gb')}</div>
    {puffs}{sparks}
  </div>
  <div class="px" data-f="1.35">
    {ch('vampire', 260, 1840, 1.25, 'eat', .1, pr='skewer', skin=0)}
    {ch('witch', 980, 1860, 1.2, 'eat', .5, pr='skewer', skin=2)}
    {ch('clown', 1560, 1850, 1.22, 'bounce', .3, pl='balloon', pr='skewer')}
    {ch('devil', 2080, 1850, 1.2, 'eat', .8, pr='skewer', skin=3)}
  </div>
</div>"""


def scene_bars():
    ivs = ''.join(f'<div class="a ivh" data-ph="{i}" style="left:{1180 + i * 120}px;top:520px;transform-origin:30px 0"><svg width="70" height="220" viewBox="-35 -10 70 220" style="overflow:visible">'
                  f'<path d="M0,-10 L0,40" stroke="#888" stroke-width="3"/><g transform="translate(0,150) scale(1.4)">{chars.prop("ivbag")}</g>'
                  f'<path d="M0,176 C4,210 -4,260 2,300" stroke="#c4161c" stroke-width="4" fill="none"/></svg></div>' for i in range(7))
    skulls_front = ''.join(f'<g transform="translate({60 + i * 150},40) scale(.3)">{skull_svg().replace("<svg ", "<svg width=\"200\" height=\"234\" ", 1)}</g>' for i in range(17))
    return f"""
<div id="s4" class="scene" data-t0="11.35" data-t1="15.65" style="background:#070404">
  <div class="px" data-f=".4" style="left:-200px;top:0;width:2700px;height:1920px"><img src="file://{TEX}/wood_dark.jpg" style="width:100%;height:100%;object-fit:cover;filter:brightness(.45)"></div>
  <div class="px" data-f=".4" style="left:-200px;top:0;width:2700px;height:1100px">
    {''.join(f'<div class="a" style="left:0;top:{y}px;width:2700px;height:16px;background:linear-gradient(#3a2a22,#140c0a);box-shadow:0 12px 20px rgba(0,0,0,.6)"></div><div class="a" style="left:0;top:{y - 150}px">{bottles(18, y, 2700)}</div>' for y in (640, 830, 1020))}
  </div>
  <div class="px" data-f=".5" style="left:120px;top:250px"><img src="{V('zone4.png')}" style="width:600px;box-shadow:0 0 70px rgba(255,60,40,.5)"></div>
  <div class="px" data-f=".5" style="left:1250px;top:250px"><img src="{V('zone5.png')}" style="width:600px;box-shadow:0 0 70px rgba(255,60,40,.5)"></div>
  <div class="px" data-f=".62" style="left:0;top:0"><div class="a" style="left:1150px;top:515px;width:900px;height:8px;background:#777"></div>{ivs}</div>
  <div class="px" data-f=".85" style="left:0;top:0;width:2400px">
    {ch('skeleton', 620, 1300, 1.0, 'shake', 0, pr='shaker')}
    {ch('bride', 1500, 1300, 1.0, 'hold', .3, pr='ivbag')}
    <div class="a" style="left:-300px;top:1150px;width:3000px;height:30px;background:linear-gradient(#5a3a2a,#1d120e);box-shadow:0 0 40px rgba(255,60,40,.5)"></div>
    <div class="a" style="left:-300px;top:1180px;width:3000px;height:500px;background:linear-gradient(#5e0a0e,#2a0406)">
      <svg width="3000" height="120" style="position:absolute;left:0;top:40px">{skulls_front}</svg></div>
    <div class="a" style="left:900px;top:860px"><img src="{V('menu-poison.png')}" style="width:210px;transform:rotate(-4deg);box-shadow:0 10px 30px rgba(0,0,0,.6)"></div>
    <div class="a" style="left:1820px;top:860px"><img src="{V('menu-blood.png')}" style="width:210px;transform:rotate(3deg);box-shadow:0 10px 30px rgba(0,0,0,.6)"></div>
    <div class="a" style="left:300px;top:1010px">{bottles(4, 9, 300)}</div>
    <div class="a" style="left:1100px;top:1030px"><svg width="300" height="140" viewBox="-40 -120 300 140">{''.join(f'<g transform="translate({k * 70},0)">{chars.prop("ivbag")}</g>' for k in range(4))}</svg></div>
  </div>
  <div class="px" data-f="1.3">
    {ch('devil', 260, 1860, 1.2, 'phone', .2, pr='phone', skin=1)}
    {ch('mummy', 900, 1880, 1.22, 'hold', .6, pr='ivbag')}
    {ch('pumpkin', 1520, 1870, 1.2, 'pump', .1, pr='ivbag', skin=0)}
  </div>
</div>"""


def scene_floor():
    beams = ''.join(f'<div class="beam fb" style="left:{-60 + i * 230}px"></div>' for i in range(5))
    back = [('skeleton', 'hands', '', 0), ('witch', 'pump', 'ivbag', 2), ('pumpkin', 'hands', 'phone', 1), ('bride', 'bounce', '', 0), ('devil', 'pump', 'phone', 3)]
    mid = [('vampire', 'pump', '', 0), ('mummy', 'hands', '', 0), ('clown', 'bounce', 'balloon', 0), ('plague', 'pump', 'lantern', 0)]
    return f"""
<div id="s5" class="scene" data-t0="15.35" data-t1="19.15" style="background:radial-gradient(ellipse 80% 40% at 50% 0%, #4a0a08, #0a0404 60%, #050303)">
  <div class="px" data-f=".3" style="left:0;top:0;width:1080px;height:1920px">{beams}</div>
  <div class="px" data-f=".5" style="left:-100px;top:1120px;width:1280px;height:900px;background:radial-gradient(ellipse 60% 40% at 50% 30%, rgba(208,20,30,.45), rgba(0,0,0,0) 70%)"></div>
  <div class="px" data-f=".7" style="left:0;top:0">{''.join(ch(k, 120 + i * 210, 1250, .66, m, i * .27, pr=p, skin=s) for i, (k, m, p, s) in enumerate(back))}</div>
  <img class="px fog" data-f=".8" src="file://{TEX}/smoke_bone.png" style="left:-300px;top:1000px;width:1700px;height:600px;opacity:.35">
  <div class="px" data-f="1" style="left:0;top:0">{''.join(ch(k, 150 + i * 260, 1560, .95, m, .13 + i * .31, pr=('' if k == 'clown' else p), pl=(p if k == 'clown' else ''), skin=i) for i, (k, m, p, s) in enumerate(mid))}</div>
</div>"""


def scene_stage():
    beams = ''.join(f'<div class="beam sb" style="left:{40 + i * 170}px;top:290px;height:1400px;width:260px"></div>' for i in range(6))
    truss = ''.join(f'<path d="M{x},0 L{x + 20},40 L{x + 40},0" stroke="#8a8a8a" stroke-width="3" fill="none"/>' for x in range(0, 900, 40))
    crowd_b = ''.join(f'<div class="pc" data-move="crowd" data-ph="{i * .23}" style="left:{-60 + i * 150}px;top:1250px">{chars.back_view(v, .9, phone=(i % 3 == 1))}</div>'
                      for i, v in enumerate(['plain', 'witch', 'braids', 'horns', 'hood', 'pumpkin', 'bunny', 'plain']))
    crowd_f = ''.join(f'<div class="pc" data-move="crowd" data-ph="{.5 + i * .31}" style="left:{-120 + i * 230}px;top:1440px">{chars.back_view(v, 1.25, phone=(i % 2 == 0))}</div>'
                      for i, v in enumerate(['horns', 'braids', 'witch', 'plain', 'pumpkin', 'hood']))
    return f"""
<div id="s6" class="scene" data-t0="18.85" data-t1="99" style="background:radial-gradient(ellipse 80% 45% at 50% 20%, #3a0806, #0a0404 60%, #050303)">
  <div id="stageW" class="a" style="left:0;top:0;width:1080px;height:2600px">
    <div id="led" class="a" style="left:160px;top:330px;width:760px;height:428px;background:#000;overflow:hidden;box-shadow:0 0 120px rgba(255,60,40,.45)">
      <img id="ledStill" src="{V('led.png')}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
      <div id="ledFK" style="position:absolute;inset:0;opacity:0"><div style="position:absolute;inset:-4%;background:url({PH('fk-silver-portrait.jpg')}) 50% 22%/cover;filter:grayscale(.8) contrast(1.3) brightness(1.15)"></div>
        <div style="position:absolute;inset:0;background:#B0101A;mix-blend-mode:multiply;opacity:.42"></div></div>
      <div style="position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,.25) 0 2px,rgba(0,0,0,0) 2px 5px)"></div></div>
    <img class="a" src="{V('skullL.png')}" style="left:-20px;top:330px;width:170px;box-shadow:0 0 40px rgba(0,0,0,.8)">
    <img class="a" src="{V('skullR.png')}" style="left:930px;top:330px;width:170px;box-shadow:0 0 40px rgba(0,0,0,.8)">
    <div class="a" style="left:90px;top:250px;width:900px;height:44px;background:#141414;border:3px solid #6a6a6a"><svg width="900" height="40">{truss}</svg></div>
    {''.join(f'<div class="a" style="left:{150 + i * 150}px;top:292px;width:40px;height:34px;border-radius:6px;background:#2a2a2a"></div>' for i in range(6))}
    <div class="a" style="left:0;top:0">{beams}</div>
    <div class="a" style="left:70px;top:770px;width:150px;height:240px;background:linear-gradient(#1a1312,#0b0807);border:4px solid #2e2524"></div>
    <div class="a" style="left:860px;top:770px;width:150px;height:240px;background:linear-gradient(#1a1312,#0b0807);border:4px solid #2e2524"></div>
    {place(chars.character('singer', 0, 'mic', '', .62), 540, 1010, .62, 'sing', 0)}
    <div class="a" style="left:40px;top:1005px;width:1000px;height:110px;background:linear-gradient(#141010,#060404);border-top:8px solid #c4161c;box-shadow:0 -10px 40px rgba(196,22,28,.6)"></div>
    <div id="pyro" class="a" style="left:0;top:0">{flames('pyro', 2, 120, 960, 1010, 520, 'pa')}{flames('pyro2', 2, 360, 720, 1010, 360, 'pb')}</div>
    <img class="a fog" src="file://{TEX}/smoke_bone.png" style="left:-300px;top:880px;width:1700px;height:500px;opacity:.35">
    <div class="a" style="left:0;top:1150px;width:1080px;height:800px;background:radial-gradient(ellipse 70% 40% at 50% 0%, rgba(208,20,30,.35), rgba(0,0,0,0) 70%)"></div>
    {crowd_b}{crowd_f}
  </div>
</div>"""


def html():
    bats = ''.join(f'<div class="bat" id="bat{i}">{BAT}</div>' for i in range(N_BATS))
    embers = ''.join(f'<div class="a em" style="width:{3 + i % 5}px;height:{3 + i % 5}px;border-radius:50%;background:{"#ffb347" if i % 3 else "#ff5a1f"};box-shadow:0 0 10px #ff6a1f"></div>' for i in range(40))
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>
<div id="stage"><div id="cam" class="L">
{scene_gate()}{scene_tunnel()}{scene_grill()}{scene_bars()}{scene_floor()}{scene_stage()}
<div id="bats" class="L">{bats}</div>
<div id="embers" class="L">{embers}</div>
<div id="shade" class="tshade"></div>
{blk('b1', 1230, 'Doxa Park &middot; Sat 31 Oct', [('Enter', 210, False), ('if you dare.', 150, True)])}
{blk('b2', 1240, 'One way in', [('Survive', 200, False), ('the tunnel.', 150, True)])}
{blk('b3', 1230, 'The BBQ is free', [('The grill', 200, False), ('is the show.', 150, True)])}
{blk('b4', 1240, 'Name your poison', [('Poison Bar.', 170, False), ('Blood Bank.', 170, True)])}
{blk('b5', 330, 'Costume or all-black', [('Come dressed', 150, False), ('to kill.', 200, True)])}
{blk('b6', 1180, 'Live on stage', [('FirstKlaz', 200, False), ('Meating.', 170, True)])}
<div id="endDim" class="L" style="background:rgba(5,3,3,.62);opacity:0"></div>
<div id="end" class="L" style="opacity:0">
  <div id="lg" class="a" style="left:{W / 2 - 100}px;top:250px;width:200px;height:159px">{logo(200, 0, 0)}</div>
  <div id="l3" class="a minor c" style="top:1130px;font-size:44px;opacity:0">Sat 31 Oct &middot; 5PM &middot; Doxa Park, Abuja</div>
  <div id="tix" class="a" style="left:110px;top:1220px;width:860px;height:150px;display:flex">
    <div style="flex:1;background:#B3121C;display:flex;flex-direction:column;justify-content:center;padding:0 36px;-webkit-mask:radial-gradient(circle 18px at 100% 50%,transparent 98%,#000)">
      <div style="font-family:Anton;font-size:70px;line-height:1;text-transform:uppercase">Get tickets</div>
      <div style="font-family:Anton;font-size:30px;letter-spacing:.14em;margin-top:6px;opacity:.95">PV.RSVP/FIRSTKLAZ-MEATING</div></div>
    <div style="width:0;border-left:4px dashed #050303"></div>
    <div style="width:180px;background:#B3121C;display:flex;align-items:center;justify-content:center;-webkit-mask:radial-gradient(circle 18px at 0 50%,transparent 98%,#000)">
      <div style="font-family:Anton;font-size:60px">18+</div></div></div>
</div>
{blk('b7', 520, 'This Saturday &middot; 5PM', [('Get your tickets.', 128, False), ('The BBQ', 200, True), ('is free.', 200, True)])}
<div id="mini" class="a" style="left:64px;top:150px;width:150px;height:119px;opacity:0">{logo(150, 0, 0)}</div>
</div>
<img id="grain" class="L" src="file://{GRAIN}" style="width:130%;height:130%;opacity:.18;mix-blend-mode:overlay">
<div class="L" style="background:radial-gradient(ellipse 80% 65% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,.65))"></div>
<div id="bolt" class="a" style="left:520px;top:0;opacity:0"><svg width="260" height="900"><path d="M150,0 L90,300 L150,300 L60,620 L120,620 L20,900" fill="none" stroke="#e8efff" stroke-width="8" stroke-linejoin="bevel" style="filter:drop-shadow(0 0 18px #9fb6ff)"/></svg></div>
<div id="flash" class="L" style="background:#fff1e6;opacity:0;mix-blend-mode:screen"></div>
<div id="border" class="L">{embroidery_frame()}</div>
<div id="black" class="L" style="background:#000;opacity:0"></div>
</div>
<script>{JS}</script></body></html>"""


JS = r"""
const $=id=>document.getElementById(id);
const cl=(x,a=0,b=1)=>Math.min(b,Math.max(a,x)), P=(t,a,b)=>cl((t-a)/(b-a)), L=(a,b,x)=>a+(b-a)*x;
const E={out3:x=>1-Math.pow(1-x,3),in3:x=>x*x*x,io3:x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2,outX:x=>x===1?1:1-Math.pow(2,-10*x),
  inX:x=>x===0?0:Math.pow(2,10*x-10),back:x=>{const c1=1.9,c3=c1+1;return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2)}};
const rnd=i=>{const s=Math.sin(i*127.1+311.7)*43758.5453;return s-Math.floor(s)};
const op=(el,v)=>el.style.opacity=v;
const BEAT=.5;
const LIGHTNING=[[.15,1],[.4,1],[18.95,1],[20.0,1.3]];
const FLASHES=[[4.0,.5,'#ff3a20'],[7.0,1,'#fff1e6'],[11.5,.35,'#fff1e6'],[15.5,.35,'#fff1e6'],[20.0,1,'#fff1e6']];
const HITS=[.4,4.0,5.1,7.0,11.5,15.5,20.0,21.0,22.0,23.0,24.0,24.6];

// ---------- rigs
const rigs=[...document.querySelectorAll('.pc')].map(pc=>{const s=pc.querySelector('svg');return {pc,move:pc.dataset.move,ph:+pc.dataset.ph,
  scene:pc.closest('.scene'),root:s.querySelector('.root'),legs:[...s.querySelectorAll('.leg')],shins:[...s.querySelectorAll('.shin')],
  arms:[...s.querySelectorAll('.arm')],fores:[...s.querySelectorAll('.fore')],head:s.querySelector('.head')}});
function rot(el,a){ if(el) el.setAttribute('transform',`rotate(${a.toFixed(2)} ${el.dataset.px} ${el.dataset.py})`); }
function armAng(move,side,k,intens){
  const s=Math.sin, PI=Math.PI, bob=Math.abs(s(PI*k));
  switch(move){
    case 'pump': return side>0?[150+18*s(2*PI*k),20+10*s(2*PI*k)]:[25+20*bob,55];
    case 'hands': return [150+14*s(PI*k+side),18*s(PI*k*2+side)];
    case 'chop': { if(side<0) return [55,70]; const p=(k/2)%1; const r=p<.75?L(25,145,E.out3(p/.75)):L(145,25,E.in3((p-.75)/.25)); return [r,35]; }
    case 'shake': return side>0?[105+22*s(2*PI*k*2),65+18*s(2*PI*k*2)]:[35,85+12*s(2*PI*k*2)];
    case 'eat': return side>0?[38+4*s(PI*k),118+8*s(2*PI*k)]:[18+14*bob,40];
    case 'hold': return side>0?[28,95+6*s(PI*k)]:[18+16*bob,45];
    case 'phone': return side>0?[163+3*s(PI*k),8]:[20+22*bob,50];
    case 'sing': return side>0?[34,128]:[60+80*Math.abs(s(PI*k/2)),10];
    case 'lunge': return [95+12*s(PI*k*3+side),25];
    case 'idle': return [10+6*s(PI*k*.5+side),18];
    default: return [22+30*Math.abs(s(PI*k+side*.6)),45+15*s(PI*k)];   // bounce
  }
}
function animRig(r,t){
  const k=t/BEAT+r.ph, PI=Math.PI;
  if(r.move==='crowd'){
    const y=-34*Math.abs(Math.sin(PI*k)), sw=Math.sin(PI*k*.5+r.ph*3);
    r.root.setAttribute('transform',`translate(0,${y.toFixed(1)}) rotate(${(sw*4).toFixed(1)} 0 330)`);
    r.arms.forEach(a=>rot(a,+a.dataset.side*(8*Math.sin(PI*k+r.ph*5))+sw*6)); rot(r.head,sw*-6);
    return;
  }
  const amp={idle:.25,eat:.6,hold:.6,shake:.7,chop:.6,sing:.8,lunge:.4,phone:.8}[r.move]??1;
  const bob=Math.abs(Math.sin(PI*k)), sway=Math.sin(PI*k*.5);
  r.root.setAttribute('transform',`translate(0,${(-22*amp*bob).toFixed(1)}) rotate(${(sway*5*amp).toFixed(2)} 0 260)`);
  rot(r.head, -sway*6*amp + Math.sin(2*PI*k)*7*amp + (r.move==='lunge'?10:0));
  r.legs.forEach(l=>{const sd=+l.dataset.side; rot(l, sway*4*amp + sd*5*amp*(1-bob));});
  r.shins.forEach((sh,i)=>rot(sh, (i?-1:1)*-8*amp*(1-bob)));
  r.arms.forEach((a,i)=>{const sd=+a.dataset.side; const [raise,fore]=armAng(r.move,sd,k,amp); rot(a,-sd*raise); rot(r.fores[i],-sd*fore);});
}

// ---------- brand text
function block(id,t,t0,t1,stag=.14){
  const el=$(id); if(t<t0||t>=t1){op(el,0);return}
  op(el,1-P(t,t1-.12,t1));
  const k=E.out3(P(t,t0,t0+.45)); el.querySelectorAll('.rule').forEach(r=>r.style.width=(k*64)+'px');
  const kt=el.querySelector('.kt'); kt.style.opacity=P(t,t0+.1,t0+.4); kt.style.letterSpacing=L(.6,.34,E.out3(P(t,t0,t0+.6)))+'em';
  el.querySelectorAll('.hl .ln').forEach((ln,i)=>{const s=t0+.15+i*stag, e=E.outX(P(t,s,s+.5));
    ln.style.transform=`translateY(${(1-e)*108}%)`; ln.style.filter=`blur(${(1-e)*6}px)`;});
}
// ---------- bats
function bat(i,t){
  const el=$('bat'+i); let x,y,s,rot2=0,vis=1;
  if(i<24){ const burst=i<12?.3:4.2, t0=burst+rnd(i)*.4, d=.9+rnd(i+5)*.6, p=P(t,t0,t0+d); if(t<t0||p>=1){op(el,0);return}
    const a=rnd(i+9)*Math.PI*2, e=p*p, cx=i<12?540:540, cy=i<12?460:1000; x=cx+Math.cos(a)*1500*e; y=cy+Math.sin(a)*1700*e-200*p; s=L(.25,3.2,p); rot2=Math.cos(a)*25;
  } else { const k=i-24, per=4.5+rnd(k)*3, ph=(t/per+rnd(k+20))%1, dir=k%2?1:-1;
    x=dir>0?L(-260,1340,ph):L(1340,-260,ph); y=160+rnd(k+33)*900+Math.sin(t*2.2+k)*70; s=.45+rnd(k+44)*.6;
    vis=(t>1.2?1:0)*(t>=7&&t<19?.6:1); rot2=Math.sin(t*3+k)*12; }
  const flap=Math.sin(t*(22+(i%5)*3)+i), fy=.3+.7*flap;
  el.querySelector('.wl').setAttribute('transform',`scale(1,${fy})`); el.querySelector('.wr').setAttribute('transform',`scale(-1,${fy})`);
  el.style.transform=`translate(${x-100}px,${y-50}px) scale(${s}) rotate(${rot2}deg)`; op(el,vis);
}
function flameSet(sel,t,amt){document.querySelectorAll(sel).forEach((f,i)=>{const s=amt*(.75+.25*Math.sin(t*(9+i)+i*2)+.12*Math.sin(t*23+i));
  f.style.transform=`scaleY(${Math.max(0,s)}) scaleX(${.9+.1*Math.sin(t*7+i)}) skewX(${Math.sin(t*3+i)*6}deg)`;});}
function parallax(scene,cx,cy){ scene.querySelectorAll('.px').forEach(p=>{const f=+p.dataset.f; p.style.transform=`translate(${-cx*f}px,${-cy*f}px)`;}); }
// whip in/out between scenes
function whip(el,t,t0,t1,inDir=1){
  const a=P(t,t0,t0+.18), b=P(t,t1-.18,t1); let x=0, bl=0;
  if(t<t0+.18){x=(1-E.out3(a))*45*inDir; bl=(1-a)*24;} if(t>t1-.18){x=-E.in3(b)*45; bl=b*24;}
  return [x,bl];
}

function render(t){
  // lightning / flashes / shake / grain
  let fl=0,bolt=0; for(const [s,len] of LIGHTNING){const d=(t-s)/len; if(d>=0&&d<.35){const k=(d<.05?1:d<.09?.25:d<.14?.85:Math.max(0,1-(d-.14)/.2)); fl=Math.max(fl,k); if(d<.16) bolt=1;}}
  let ff=0, fc='#fff1e6'; for(const [s,a,c] of FLASHES){const d=t-s; if(d>=0&&d<.3){const v=a*(1-d/.3); if(v>ff){ff=v;fc=c;}}}
  $('flash').style.background=ff>fl*.6?fc:'#eef2ff'; op($('flash'),Math.max(fl*.6,ff*.8));
  op($('bolt'),bolt*fl); $('bolt').style.left=(t<2?620:t<20.0?250:700)+'px';
  let sx=0,sy=0; for(const s of HITS){ if(t>=s){const d=t-s,a=Math.exp(-d*10)*12; sx+=a*Math.sin(d*70); sy+=a*Math.cos(d*53);} }
  if(t>=20) {const kd=((t-20)%BEAT); sx+=Math.exp(-kd*14)*4*Math.sin(t*90);}
  $('cam').style.transform=`translate(${sx}px,${sy}px)`;
  $('grain').style.transform=`translate(${-rnd(Math.floor(t*30))*20}%,${-rnd(Math.floor(t*30)+5)*20}%)`;
  op($('border'),E.out3(P(t,.1,1.0)));
  op($('mini'),(t>.6&&t<24.5)?cl(P(t,.6,1.0))*(1-P(t,24.4,24.6)):0);

  // scene visibility
  document.querySelectorAll('.scene').forEach(s=>{s.style.display=(t>=+s.dataset.t0&&t<+s.dataset.t1)?'block':'none';});

  // rigs (only in visible scenes)
  for(const r of rigs){ if(r.scene && r.scene.style.display==='none') continue; animRig(r,t); }
  document.querySelectorAll('.hook').forEach(h=>{const ph=+h.dataset.ph,s=+h.dataset.sc; h.style.transform=`scale(${s}) rotate(${Math.sin(t*1.4+ph)*4}deg)`;});
  document.querySelectorAll('.swing').forEach((h,i)=>h.style.transform=`rotate(${Math.sin(t*1.8+i*2)*7}deg)`);
  document.querySelectorAll('.fog').forEach((f,i)=>f.style.transform=`translateX(${Math.sin(t*.3+i)*80-t*8}px)`);

  // S1 GATE
  if(t<4.15){ const s1=$('s1'); parallax(s1, Math.sin(t*.6)*30, 0);
    const push=L(1,1.1,E.io3(P(t,0,3.0))), dive=E.in3(P(t,3.0,4.05));
    s1.style.transformOrigin='540px 1130px'; s1.style.transform=`scale(${push*L(1,7,dive)})`; s1.style.filter=`blur(${dive*10}px) brightness(${1-dive*.3})`;
    document.querySelectorAll('#s1 .cloud').forEach(c=>c.style.left=(-300+t*40)+'px');
  }
  // S2 TUNNEL
  if(t>=3.9&&t<7.1){ const camZ=(t-4.0)*2.25;
    document.querySelectorAll('.ring').forEach((r,i)=>{const d=+r.dataset.z-camZ+1.0;
      if(d<.32){r.style.display='none';return} r.style.display='block';
      const s=1/d; r.style.transform=`scale(${s})`; r.style.zIndex=Math.round(200-d*20); op(r,cl(2.2-d*.32)*cl((d-.32)*4));
      r.style.filter=`brightness(${cl(1.4-d*.15,.25,1.2)})`;});
    const end=E.in3(P(t,5.5,7.0)); $('tEnd').style.transform=`scale(${L(.5,3.5,end)})`; op($('tEnd'),L(.6,1,end));
    const sc=$('scare'), a=P(t,5.0,5.25), b=P(t,5.9,6.6);
    sc.style.transform=`translate(${L(1300,700,E.outX(a))+L(0,600,E.in3(b))}px,${1450+L(0,200,b)}px) scale(${L(1,.6,b)})`; op(sc,t>=5.0&&t<6.6?1:0);
    sc.style.zIndex=300;
    const [wx,wb]=whip($('s2'),t,3.9,7.1,1); $('s2').style.filter=`blur(${t>6.9?(t-6.9)*60:0}px)`;
  }
  // S3 GRILL
  if(t>=6.9&&t<11.65){ const s3=$('s3'); const camX=L(0,980,E.io3(P(t,7.0,11.5))); parallax(s3,camX,0);
    const [wx,wb]=whip(s3,t,6.9,11.65,0); s3.style.transform=`translateX(${wx}%)`; s3.style.filter=`blur(${wb}px)`;
    flameSet('.gfl',t,.9+.2*Math.abs(Math.sin(Math.PI*t/BEAT)));
    document.querySelectorAll('.coalbed').forEach((c,i)=>c.style.opacity=.75+.25*Math.sin(t*9+i));
    document.querySelectorAll('#s3 .puff').forEach((p,i)=>{const g=+p.dataset.g, per=2.4+rnd(i)*1.4, ph=((t-7)/per+rnd(i+3))%1;
      p.style.left=((g?1230:300)+rnd(i+7)*480+Math.sin(t+i)*40)+'px'; p.style.top=(1000-ph*900)+'px'; p.style.transform=`scale(${.6+ph*1.6})`; op(p,Math.sin(ph*Math.PI)*.9);});
    document.querySelectorAll('#s3 .gs').forEach((s,i)=>{const g=+s.dataset.g, per=.9+rnd(i)*.8, ph=((t-7)/per+rnd(i+11))%1;
      s.style.left=((g?1230:300)+rnd(i+2)*560+Math.sin(t*3+i)*30)+'px'; s.style.top=(1060-ph*560)+'px'; op(s,1-ph);});
  }
  // S4 BARS
  if(t>=11.35&&t<15.65){ const s4=$('s4'); const camX=L(1000,40,E.io3(P(t,11.5,15.5))); parallax(s4,camX,0);
    const [wx,wb]=whip(s4,t,11.35,15.65,1); s4.style.transform=`translateX(${wx}%)`; s4.style.filter=`blur(${wb}px)`;
    document.querySelectorAll('.ivh').forEach((h,i)=>h.style.transform=`rotate(${Math.sin(t*1.6+i)*5}deg)`);
  }
  // S5 FLOOR
  if(t>=15.35&&t<19.15){ const s5=$('s5'); parallax(s5,Math.sin((t-15.5)*.7)*90,0);
    const [wx,wb]=whip(s5,t,15.35,19.15,1); const cut=P(t,18.55,18.65)*(1-P(t,18.95,19.0));
    s5.style.transform=`translateX(${wx}%) scale(${L(1,1.08,P(t,15.5,18.5))})`; s5.style.filter=`blur(${wb}px) brightness(${1-cut*.75})`;
    const kp=Math.exp(-((t)%BEAT)*7);
    document.querySelectorAll('.fb').forEach((b,i)=>{b.style.transform=`rotate(${Math.sin(t*1.7+i*1.3)*30}deg)`; op(b,(.4+.6*kp)*(1-cut));});
    if(t>18.55) rigs.filter(r=>r.scene===s5).forEach(r=>{rot(r.head,-14); r.arms.forEach((a,i)=>{const sd=+a.dataset.side; rot(a,-sd*(i?150:20)); rot(r.fores[i],0);});});
  }
  // S6 STAGE + S7 END
  if(t>=18.85){ const s6=$('s6'), w=$('stageW');
    const tilt=E.io3(P(t,19.0,20.0)), push=L(1,1.1,E.out3(P(t,20,30)));
    w.style.transform=`translateY(${L(-560,0,tilt)}px)`; s6.style.transformOrigin='540px 700px';
    s6.style.transform=`scale(${push})`;
    const drop=t>=20; op($('ledStill'),drop?0:.55+.45*Math.abs(Math.sin(t*13))); op($('ledFK'),drop?1:0);
    $('ledFK').firstElementChild.style.transform=`scale(${L(1.15,1.0,E.out3(P(t,20,24)))})`;
    const kp=t>=20?Math.exp(-((t-20)%BEAT)*7):0;
    document.querySelectorAll('.sb').forEach((b,i)=>{b.style.transform=`rotate(${Math.sin(t*1.5+i*1.1)*(drop?32:12)}deg)`; op(b,drop?.35+.65*kp:.25);});
    // pyro every 2 beats after the drop
    const pk=t>=20?((t-20)%1):9; const fire=t>=20?Math.max(0,1-pk*2.2):0;
    flameSet('.pyro',t,fire*1.1); flameSet('.pyro2',t,t>=20?Math.max(0,1-((t-20.5)%1+1)%1*2.6)*.9:0);
    if(t>=24.5){ s6.style.filter=`blur(${E.out3(P(t,24.5,25.2))*3}px)`; } else s6.style.filter='none';
  }
  op($('endDim'),E.out3(P(t,24.5,25.1)));
  const end=t>=24.5; op($('end'),end?1:0);
  if(end){ $('lg').style.transform=`scale(${E.back(P(t,24.6,25.0))})`;
    const l3=E.out3(P(t,25.9,26.3)); op($('l3'),l3); $('l3').style.transform=`translateY(${L(40,0,l3)}px)`;
    let pulse=0; for(let k=26.5;k<30;k+=BEAT*2) if(t>=k) pulse=Math.max(pulse,1-P(t,k,k+.3));
    const tx=E.back(P(t,26.1,26.5)); $('tix').style.transform=`translateY(${L(500,0,tx)}px) scale(${1+pulse*.035})`; op($('tix'),t>=26.1?1:0); }

  // text
  op($('shade'), (t<18.85||t>=19.6)&&!(t>=15.35&&t<19.15)&&t<24.5 ? 1 : 0);
  block('b1',t,.8,3.0,.25); block('b2',t,4.45,6.85,.2); block('b3',t,7.4,11.35,.2); block('b4',t,11.85,15.4,.2);
  block('b5',t,15.8,18.55,.2); block('b6',t,20.1,24.45,.2); block('b7',t,25.0,99,.28);

  // embers / bats / fade
  const emOn = (t>=6.9&&t<11.6)||t>=20 ? 1 : .35;
  document.querySelectorAll('.em').forEach((el,i)=>{const sp=160+rnd(i)*300,x0=rnd(i+40)*1080,y=(1950+rnd(i+80)*1950-t*sp)%2000;
    el.style.left=(x0+Math.sin(t*1.5+i)*40)+'px'; el.style.top=y+'px'; op(el,emOn*(.3+.7*rnd(i+3))*(.6+.4*Math.sin(t*8+i)));});
  for(let i=0;i<40;i++) bat(i,t);
  op($('black'),P(t,29.7,30.0)*.5);
}
window.render=render;
"""


def render_frames():
    os.makedirs(SCRATCH, exist_ok=True)
    hp = os.path.join(HERE, '_walk.html')
    open(hp, 'w').write(html())
    js = os.path.join(HERE, '_shoot_walk.js')
    open(js, 'w').write(f"""const {{chromium}}=require('playwright');(async()=>{{const b=await chromium.launch();
const p=await b.newPage({{viewport:{{width:{W},height:{H}}}}});p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('file://{hp}');await p.evaluate(()=>document.fonts.ready);
await p.waitForTimeout(1000);const n={int(FPS * DUR)};const only=process.argv.slice(2).map(Number);
for(let f=0;f<n;f++){{ if(only.length&&!only.includes(f)) continue; await p.evaluate(t=>render(t),f/{FPS});
await p.screenshot({{path:'{SCRATCH}/f_'+String(f).padStart(4,'0')+'.jpg',type:'jpeg',quality:93}});}}
await b.close();}})();""")
    subprocess.run(['node', js] + sys.argv[2:], check=True)


# ------------------------------------------------------------------ sound (synthesised; 120 BPM party track heard from outside, then inside)
SR = 44100


def audio(path):
    from scipy.signal import butter, lfilter
    n = int(SR * DUR); rng = np.random.default_rng(77)
    tt = lambda d: np.arange(int(SR * d)) / SR
    filt = lambda kind, f, x: lfilter(*butter(2, np.array(f) / (SR / 2), kind), x)
    music = np.zeros(n); fx = np.zeros(n)

    def put(buf, sig, t0, g=1.0):
        i = int(t0 * SR)
        if 0 <= i < n:
            sig = sig[:n - i]; buf[i:i + len(sig)] += sig * g

    def kick():
        t = tt(.45); return np.sin(2 * np.pi * np.cumsum(46 + 120 * np.exp(-t * 30)) / SR) * np.exp(-t * 7)

    def shaker(a=1.0):
        t = tt(.08); return filt('high', 6000, rng.normal(0, 1, len(t))) * np.exp(-t * 60) * .15 * a

    def hat(d=.12):
        t = tt(d); return filt('high', 8000, rng.normal(0, 1, len(t))) * np.exp(-t * 25) * .12

    def clap():
        t = tt(.25)
        env = np.exp(-t * 25) + .6 * np.exp(-np.abs(t - .012) * 400) + .5 * np.exp(-np.abs(t - .024) * 400)
        return filt('band', [900, 2500], rng.normal(0, 1, len(t))) * env * .42

    def log_drum(f):
        t = tt(.42); fr = f * (1 + 1.2 * np.exp(-t * 40))
        return np.tanh(2.2 * np.sin(2 * np.pi * np.cumsum(fr) / SR)) * np.exp(-t * 6) * .5

    def talking_drum(f0, f1, dur=.3):
        t = tt(dur); fr = f1 + (f0 - f1) * np.exp(-t * 9)
        return (np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 7) + filt('band', [800, 3000], rng.normal(0, 1, len(t))) * np.exp(-t * 60) * .5) * .45

    def stab(f):
        t = tt(.35); x = sum(np.sign(np.sin(2 * np.pi * f * m * t)) * .3 / m for m in (1, 1.5, 2))
        return filt('low', 2500, x) * np.exp(-t * 8) * .35

    def boom():
        t = tt(1.6); return np.sin(2 * np.pi * np.cumsum(30 + 80 * np.exp(-t * 8)) / SR) * np.exp(-t * 2.3)

    def thunder(d=2.0):
        t = tt(d)
        return filt('high', 1500, rng.normal(0, 1, len(t))) * np.exp(-t * 18) * .8 + filt('low', 180, rng.normal(0, 1, len(t))) * (1 - np.exp(-t * 8)) * np.exp(-t * 1.6) * 3

    def flutter(d=1.6, dens=1.0):
        t = tt(d); x = np.zeros(len(t))
        for _ in range(int(6 * dens)):
            f = rng.uniform(16, 26); ph = rng.uniform(0, 6.28)
            x += filt('band', [600, 3500], rng.normal(0, 1, len(t))) * np.clip(np.sin(2 * np.pi * f * t + ph), 0, 1) ** 3
        return x * np.sin(np.pi * t / d) * .18

    def heartbeat():
        t = tt(.35); a = np.sin(2 * np.pi * (45 + 40 * np.exp(-t * 30)) * t) * np.exp(-t * 14)
        x = np.zeros(int(SR * .6)); x[:len(a)] += a; x[int(SR * .2):int(SR * .2) + len(a)] += a * .7
        return x

    def screech(d=.7):
        t = tt(d); f = 900 + 600 * np.sin(2 * np.pi * 7 * t) + 400 * t
        return (np.sin(2 * np.pi * np.cumsum(f) / SR) + .5 * filt('band', [1500, 5000], rng.normal(0, 1, len(t)))) * np.exp(-t * 4) * .3

    def sizzle(d, g=1.0):
        t = tt(d); x = filt('high', 3500, rng.normal(0, 1, len(t)))
        cr = filt('high', 2000, (rng.random(len(t)) > .9992) * rng.uniform(.5, 1.5, len(t)))
        return (x * (.5 + .5 * np.abs(np.sin(2 * np.pi * 3.1 * t))) * .1 + cr) * g * np.minimum(1, t / .3) * np.minimum(1, (d - t) / .3)

    def thud():
        t = tt(.3); return (np.sin(2 * np.pi * 90 * t) * np.exp(-t * 20) + filt('band', [300, 1200], rng.normal(0, 1, len(t))) * np.exp(-t * 40) * .6) * .7

    def clink(f=2600):
        t = tt(.6); return (np.sin(2 * np.pi * f * t) + .6 * np.sin(2 * np.pi * f * 1.51 * t)) * np.exp(-t * 7) * .12

    def ice(d):
        t = tt(d); x = filt('band', [2500, 7000], rng.normal(0, 1, len(t)))
        return x * np.clip(np.sin(2 * np.pi * 8 * t), 0, 1) ** 4 * .25

    def crowd(d, g=1.0):
        t = tt(d); x = filt('band', [300, 2200], rng.normal(0, 1, len(t))) + .5 * filt('band', [800, 3500], rng.normal(0, 1, len(t)))
        return x * np.sin(np.pi * t / d) ** 1.5 * .32 * g

    def whoosh(d=.45, up=True):
        t = tt(d); x = rng.normal(0, 1, len(t)); y = np.zeros_like(x)
        for k, f in enumerate(np.linspace(300, 4000, 8) if up else np.linspace(4000, 300, 8)):
            seg = slice(int(len(x) * k / 8), int(len(x) * (k + 1) / 8)); y[seg] = filt('band', [f * .7, f * 1.3], x)[seg]
        return y * np.sin(np.pi * t / d) * .45

    def riser(d):
        t = tt(d); return filt('band', [400, 6000], rng.normal(0, 1, len(t))) * (t / d) ** 2 * .45

    def wind(d):
        t = tt(d); return filt('band', [150, 700], rng.normal(0, 1, len(t))) * (.6 + .4 * np.sin(2 * np.pi * .4 * t)) * .25

    # ---- music
    notes = [55, 55, 65.4, 49, 55, 73.4, 65.4, 49]
    for k in range(int(DUR / .25)):
        tb = k * .25; beat = tb / .5
        brk = 18.5 <= tb < 20.0
        if abs(beat - round(beat)) < 1e-6 and not brk:
            put(music, kick(), tb, .9)
        put(music, shaker(1 if k % 2 else .6), tb, 1)
        if k % 2 == 1 and tb >= 15.5 and not brk:
            put(music, hat(), tb, 1)
        if (k % 8) in (2, 6) and tb >= 7.0 and not brk:
            put(music, clap(), tb, .9)
        if k % 8 in (0, 3, 4, 6) and not brk:
            put(music, log_drum(notes[(k // 8 + k % 8) % 8]), tb, .85 if tb >= 7 else .6)
        if tb >= 11.5 and k % 16 in (5, 13) and not brk:
            put(music, talking_drum(240, 140), tb, .7)
        if tb >= 20.0 and k % 8 in (1, 5):
            put(music, stab(220 if (k // 16) % 2 else 196), tb, .8)
    # muffle: outside the gate / inside the tunnel
    lp_out = filt('low', 260, music); lp_tun = filt('low', 900, music)
    tt_all = np.arange(n) / SR
    w_out = np.clip((4.0 - tt_all) / .3, 0, 1)
    w_tun = np.clip((tt_all - 3.7) / .3, 0, 1) * np.clip((7.0 - tt_all) / .15, 0, 1)
    w_full = np.clip(1 - w_out - w_tun, 0, 1)
    mix = lp_out * w_out * 1.6 + lp_tun * w_tun * 1.1 + music * w_full
    # ---- fx
    put(fx, wind(4.2), 0, 1); put(fx, thunder(), .15, .55); put(fx, flutter(1.8, 1.4), .3, 1)
    put(fx, whoosh(.9), 3.1, .9)
    for tb in np.arange(4.0, 7.0, .55):
        put(fx, heartbeat(), tb, .8)
    put(fx, flutter(1.6, 1.2), 4.2, .9)
    put(fx, screech(), 5.05, 1); put(fx, boom()[:int(SR * .8)], 5.05, .8)
    put(fx, boom(), 7.0, .9); put(fx, crowd(3.0, .7), 7.0, 1)
    put(fx, sizzle(4.4), 7.0, 1)
    for s in (7.0, 8.0, 9.0, 10.0, 11.0):
        put(fx, thud(), s + .0, 1)
    for s in (11.5, 15.5):
        put(fx, whoosh(.35), s - .2, .9)
    put(fx, ice(3.8), 11.6, 1)
    for s in (12.25, 13.25, 14.25):
        put(fx, clink(2600 + 300 * (s % 2)), s, 1)
    put(fx, crowd(3.0, .8), 15.5, 1)
    put(fx, riser(1.5), 18.5, 1); put(fx, crowd(1.5, 1.2), 18.6, 1)
    put(fx, thunder(), 18.95, .5)
    put(fx, boom(), 20.0, 1.2); put(fx, thunder(), 20.0, .7); put(fx, crowd(4.0, 1.4), 20.0, 1)
    for s in (21.0, 22.0, 23.0, 24.0):
        put(fx, whoosh(.5, False), s, .5)
    put(fx, crowd(5.0, .9), 24.5, 1); put(fx, flutter(1.4, .6), 26.0, .6)
    out = mix * .9 + fx
    fade = np.ones(n); fe = int(SR * 1.0); fade[-fe:] = np.linspace(1, 0, fe)
    out = np.tanh(out * 1.25) * fade
    out = out / np.max(np.abs(out)) * .78
    import wave
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.stack([out, out], 1) * 32767).astype('<i2').tobytes())


def encode():
    os.makedirs(OUT, exist_ok=True)
    wav = os.path.join(HERE, '_bed_walk.wav')
    audio(wav)
    v = ['-framerate', str(FPS), '-i', f'{SCRATCH}/f_%04d.jpg']
    enc = ['-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart']
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error'] + v + enc + [os.path.join(OUT, NAME + '_NO-AUDIO.mp4')], check=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error'] + v + ['-i', wav] + enc +
                   ['-af', 'alimiter=limit=0.8:level=false,volume=-2dB', '-c:a', 'aac', '-b:a', '192k', '-shortest', os.path.join(OUT, NAME + '.mp4')], check=True)
    shutil.copy(f'{SCRATCH}/f_{int(28.0 * FPS):04d}.jpg', os.path.join(OUT, NAME + '_poster.jpg'))
    os.remove(wav)
    print('ok', NAME)


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'frames':
        render_frames()
    else:
        render_frames(); encode()
