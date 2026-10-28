"""MEAT & GREET - 25s animated story: "This Saturday" (1080x1920, 30fps).

Same brand system as the MIX edit (Anton only, cream + blood red, kicker with red rules,
line-reveal motion, kaftan border, bats), told as an animated countdown to Saturday:

python3 bbq_story.py              -> ../export/MeatAndGreet_BBQ-Story_25s.mp4 (+ silent, poster)
python3 bbq_story.py frames 0 90  -> render only those frames

STORYBOARD (120 BPM, 1 beat = 0.5s)
 0.0- 3.0  COUNTDOWN  bat burst, calendar flips WED 28 > THU 29 > FRI 30 > SAT 31   "The countdown / is on."
 3.0- 7.0  THE GRILL  coals ignite, flames rise, four skewers drop on the beat, smoke   "The grill / is heating up."
 7.0-11.0  THE MENU   SUYA. RIBS. WINGS. ASUN. one dish per bar, spinning plate
11.0-15.0  THE PARTY  light beams, speakers pumping, crowd silhouettes jumping        "The party / takes over."
15.0-18.5  THE ACT    lightning cut to FirstKlaz                                    "FirstKlaz / shuts it down."
18.5-21.5  CHECKLIST  empty stomach / costume or all-black / your whole crew, ticked on the beat
21.5-25.0  THE CALL   "Get your tickets. / The BBQ is free." + date line + ticket stub
"""
import os
import shutil
import subprocess
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from promo_mix import MIX_CSS, BAT, photo, logo, embroidery_frame  # noqa: E402
from promo import FLAME, TEX, GRAIN, W, H, FPS, hook_svg, pumpkin_svg  # noqa: E402

DUR = 25.0
OUT = os.path.abspath(os.path.join(HERE, '..', 'export'))
SCRATCH = os.environ.get('PROMO_TMP', os.path.join(HERE, '_frames_bbq'))
NAME = 'MeatAndGreet_BBQ-Story_25s'
N_BATS = 40

CSS = MIX_CSS + """
.cal{position:absolute;left:330px;top:330px;width:420px;height:520px;border-radius:26px;background:#EFE6D6;overflow:hidden;
  box-shadow:0 30px 80px rgba(0,0,0,.7),0 0 0 8px #120c0b;transform-origin:50% 0}
.cal .top{height:130px;background:#B3121C;display:flex;align-items:center;justify-content:center;font-family:Anton;font-size:64px;letter-spacing:.3em;color:#EFE6D6}
.cal .rings{position:absolute;top:-22px;left:0;right:0;display:flex;justify-content:space-around;padding:0 80px}
.cal .rings i{width:26px;height:60px;border-radius:13px;background:#2a2020;border:5px solid #6b6b6b}
.cal .day{font-family:Anton;font-size:96px;color:#0B0909;text-align:center;margin-top:24px;letter-spacing:.1em}
.cal .num{font-family:Anton;font-size:230px;line-height:1;color:#0B0909;text-align:center;margin-top:-6px}
.cal.sat .num,.cal.sat .day{color:#B3121C}
.row{position:absolute;left:150px;display:flex;align-items:center;gap:40px;opacity:0}
.row .box{width:96px;height:96px;border:7px solid #EFE6D6;border-radius:12px;position:relative;flex:none}
.row .lab{font-family:Anton;font-size:84px;text-transform:uppercase;color:#EFE6D6;white-space:nowrap}
.spk{position:absolute;bottom:250px;width:240px;height:420px;border-radius:14px;background:linear-gradient(#1a1312,#0b0807);border:5px solid #2e2524;
  display:flex;flex-direction:column;align-items:center;justify-content:space-evenly}
.cone{border-radius:50%;background:radial-gradient(circle,#3a2e2c 0 18%,#0a0707 20% 55%,#2b2120 57% 62%,#0d0909 64%);border:6px solid #3a3030}
.beam{position:absolute;top:-80px;width:340px;height:1700px;clip-path:polygon(47% 0,53% 0,100% 100%,0 100%);transform-origin:50% 0;
  background:linear-gradient(180deg,rgba(255,70,40,.75),rgba(208,20,30,.25) 55%,rgba(208,20,30,0) 85%);mix-blend-mode:screen}
"""

DAYS = [('WED', '28'), ('THU', '29'), ('FRI', '30'), ('SAT', '31')]
MENU = ['Suya.', 'Ribs.', 'Wings.', 'Asun.']
CHECK = ['Empty stomach', 'Costume or all-black', 'Your whole crew']


def blk(id_, top, kick, lines):
    hl = ''.join(f'<div class="hl{" red" if red else ""}" style="font-size:{fs}px"><span class="ln">{txt}</span></div>' for txt, fs, red in lines)
    return f'<div id="{id_}" class="blk" style="top:{top}px"><div class="kick"><span class="rule"></span><span class="kt">{kick}</span><span class="rule"></span></div>{hl}</div>'


# ------------------------------------------------------------------ illustrations
CHUNK = '#7a2a14'


def skewer_svg(n=5, w=560):
    s = [f'<line x1="0" y1="40" x2="{w}" y2="40" stroke="#c9a46b" stroke-width="9" stroke-linecap="round"/>']
    for k in range(n):
        x = 70 + k * (w - 140) / (n - 1)
        s.append(f'<g transform="translate({x},40) rotate({(-1) ** k * 8})"><rect x="-38" y="-30" width="76" height="60" rx="16" fill="{CHUNK}"/>'
                 f'<path d="M-30,-14 L26,-24 M-32,6 L30,-4 M-26,22 L30,12" stroke="#2e0d06" stroke-width="7" stroke-linecap="round"/>'
                 + ''.join(f'<circle cx="{(j * 23) % 60 - 28}" cy="{(j * 17) % 46 - 22}" r="3.2" fill="#d98a2b"/>' for j in range(7)) + '</g>')
        if k < n - 1:
            s.append(f'<ellipse cx="{x + (w - 140) / (n - 1) / 2}" cy="40" rx="9" ry="26" fill="none" stroke="#efe0c8" stroke-width="6"/>')
    return f'<svg viewBox="-10 0 {w + 20} 80" width="100%" height="100%" style="overflow:visible">{"".join(s)}</svg>'


def grill_svg():
    bars = ''.join(f'<line x1="{x}" y1="230" x2="{x}" y2="290" stroke="#9a9a9a" stroke-width="7"/>' for x in range(90, 620, 36))
    coals = ''.join(f'<circle class="coal" cx="{80 + (i * 53) % 540}" cy="{275 + (i * 7) % 26}" r="{22 + (i * 5) % 14}" fill="#ff5a1f"/>' for i in range(22))
    return (f'<svg viewBox="0 0 700 640" width="100%" height="100%"><defs><clipPath id="gr"><ellipse cx="350" cy="262" rx="290" ry="30"/></clipPath>'
            f'<linearGradient id="bw" x1="0" x2="1"><stop offset="0" stop-color="#0c0909"/><stop offset=".45" stop-color="#2c2524"/><stop offset="1" stop-color="#0c0909"/></linearGradient></defs>'
            f'<path d="M200,450 L120,630 M500,450 L580,630 M350,500 L350,630" stroke="#1d1717" stroke-width="16" stroke-linecap="round"/>'
            f'<path d="M60,262 A290,230 0 0 0 640,262 Z" fill="url(#bw)" stroke="#3a3232" stroke-width="5"/>'
            f'<path d="M110,330 A250,180 0 0 0 300,470" fill="none" stroke="#5a4c4a" stroke-width="6" opacity=".6"/>'
            f'<g id="coals" clip-path="url(#gr)"><ellipse cx="350" cy="262" rx="290" ry="30" fill="#1a0705"/>{coals}</g>'
            f'<g clip-path="url(#gr)">{bars}</g><ellipse cx="350" cy="262" rx="290" ry="30" fill="none" stroke="#b5b5b5" stroke-width="8"/>'
            f'<rect x="20" y="248" width="40" height="18" rx="6" fill="#2a2222"/><rect x="640" y="248" width="40" height="18" rx="6" fill="#2a2222"/></svg>')


def food_svg(kind):
    if kind == 0:   # suya skewer, diagonal
        return f'<div style="width:100%;height:100%;transform:rotate(-38deg) scale(1.15)">{skewer_svg(4, 380)}</div>'
    if kind == 1:   # rack of ribs
        bones = ''.join(f'<rect x="{70 + k * 52}" y="250" width="24" height="70" rx="12" fill="#efe0c8"/><circle cx="{82 + k * 52}" cy="322" r="15" fill="#efe0c8"/>' for k in range(5))
        return (f'<svg viewBox="0 0 400 400" width="100%" height="100%">{bones}<path d="M40,110 C120,80 280,80 360,110 L350,270 C270,290 130,290 50,270 Z" fill="#6b1f12"/>'
                f'<path d="M60,130 C140,105 260,105 340,130 L336,170 C260,150 140,150 64,170 Z" fill="#a43a1c" opacity=".7"/>'
                + ''.join(f'<path d="M{80 + k * 60},120 L{120 + k * 60},260" stroke="#2e0d06" stroke-width="9" opacity=".75"/>' for k in range(5)) + '</svg>')
    if kind == 2:   # wing / drumstick
        return ('<svg viewBox="0 0 400 400" width="100%" height="100%"><g transform="rotate(-35 200 200)">'
                '<rect x="190" y="200" width="36" height="150" rx="16" fill="#efe0c8"/><circle cx="194" cy="350" r="24" fill="#efe0c8"/><circle cx="222" cy="350" r="24" fill="#efe0c8"/>'
                '<path d="M208,30 C300,30 330,130 290,190 C268,222 240,232 208,232 C176,232 148,222 126,190 C86,130 116,30 208,30 Z" fill="#8a3b14"/>'
                '<path d="M170,60 C200,46 250,52 270,90" stroke="#d07a3a" stroke-width="14" fill="none" stroke-linecap="round" opacity=".7"/>'
                '<path d="M140,140 L270,110 M150,180 L280,150" stroke="#3a1206" stroke-width="9" stroke-linecap="round" opacity=".7"/></g></svg>')
    return ('<svg viewBox="0 0 400 400" width="100%" height="100%"><g transform="rotate(20 200 200)">'          # asun: hot pepper
            '<path d="M212,92 C210,60 230,40 262,36 L268,52 C246,58 236,72 238,96 Z" fill="#3a2414"/>'
            '<path d="M150,110 C220,80 290,110 280,190 C270,270 200,340 110,370 C150,320 170,270 160,220 C152,180 130,140 150,110 Z" fill="#C4161C"/>'
            '<path d="M180,130 C230,120 255,150 250,190" stroke="#ff6a5a" stroke-width="14" fill="none" stroke-linecap="round" opacity=".7"/></g></svg>')


def person_svg():
    return ('<svg viewBox="0 0 160 380" width="100%" height="100%" style="overflow:visible">'
            '<g class="armL" style="transform-origin:46px 170px"><path d="M46,170 L18,10" stroke="#060303" stroke-width="24" stroke-linecap="round"/></g>'
            '<g class="armR" style="transform-origin:114px 170px"><path d="M114,170 L142,10" stroke="#060303" stroke-width="24" stroke-linecap="round"/></g>'
            '<circle cx="80" cy="100" r="38" fill="#060303"/><path d="M14,380 C14,220 36,150 80,146 C124,150 146,220 146,380 Z" fill="#060303"/></svg>')


def checkmark():
    return ('<svg viewBox="0 0 100 100" width="130" height="130" style="position:absolute;left:-6px;top:-30px;overflow:visible">'
            '<path class="tick" d="M14,52 L42,80 L96,6" fill="none" stroke="#D0141E" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" '
            'stroke-dasharray="140" stroke-dashoffset="140"/></svg>')


def html():
    hooks = [(-30, 'ham', 60, .85, .0), (170, None, 110, .75, 1.3), (360, 'rack', 20, .7, .6), (620, None, 80, .75, 2.4), (930, 'ham', 30, .9, 1.7)]
    hk = ''.join(f'<div class="a hook" data-ph="{ph}" data-sc="{sc}" style="left:{x}px;top:-40px;transform-origin:60px 0">{hook_svg(m, ch)}</div>' for x, m, ch, sc, ph in hooks)
    flames = lambda cls, n, x0, x1, base, h: ''.join(
        f'<div class="a {cls}" style="left:{x0 + (x1 - x0) * i / (n - 1) - h * .35:.0f}px;top:{base - h:.0f}px;width:{h * .7:.0f}px;height:{h:.0f}px;transform-origin:50% 100%">'
        f'<svg viewBox="0 0 100 102" width="100%" height="100%" preserveAspectRatio="none"><defs><linearGradient id="{cls}{i}" x1="0" y1="1" x2="0" y2="0">'
        f'<stop offset="0" stop-color="#ffd27a"/><stop offset=".35" stop-color="#ff7a1a"/><stop offset=".8" stop-color="#d0141e"/><stop offset="1" stop-color="#d0141e" stop-opacity="0"/>'
        f'</linearGradient></defs><path d="{FLAME}" fill="url(#{cls}{i})"/></svg></div>' for i in range(n))
    puffs = ''.join(f'<div class="a puff" style="width:{220 + (i * 37) % 120}px;height:{220 + (i * 37) % 120}px;border-radius:50%;'
                    f'background:radial-gradient(circle,rgba(230,220,210,.32),rgba(230,220,210,0) 68%)"></div>' for i in range(16))
    sparks = ''.join(f'<div class="a spk2" style="width:{4 + i % 4}px;height:{4 + i % 4}px;border-radius:50%;background:#ffb347;box-shadow:0 0 10px #ff6a1f"></div>' for i in range(34))
    skewers = ''.join(f'<div id="sk{i}" class="a" style="left:{260 + (i % 2) * 30}px;top:{668 + i * 20}px;width:560px;height:80px;opacity:0">{skewer_svg()}</div>' for i in range(4))
    plates = ''.join(f'<div id="food{i}" class="a" style="left:290px;top:400px;width:500px;height:500px;opacity:0">{food_svg(i)}</div>' for i in range(4))
    people = ''.join(f'<div class="a ppl" style="left:{-60 + i * 120}px;top:{1360 + (i % 3) * 40}px;width:{170 + (i % 2) * 30}px;height:{420 + (i % 2) * 40}px">{person_svg()}</div>' for i in range(10))
    beams = ''.join(f'<div class="beam" style="left:{-60 + i * 230}px"></div>' for i in range(5))
    embers = ''.join(f'<div class="a em" style="width:{3 + i % 5}px;height:{3 + i % 5}px;border-radius:50%;background:{"#ffb347" if i % 3 else "#ff5a1f"};'
                     f'box-shadow:0 0 10px #ff6a1f"></div>' for i in range(40))
    bats = ''.join(f'<div class="bat" id="bat{i}">{BAT}</div>' for i in range(N_BATS))
    rows = ''.join(f'<div id="r{i}" class="row" style="top:{900 + i * 170}px"><div class="box">{checkmark()}</div><div class="lab">{c}</div></div>' for i, c in enumerate(CHECK))
    menu_words = ''.join(f'<div id="m{i}" class="hl{" red" if i == 3 else ""}" style="position:absolute;left:0;right:0;top:0;font-size:210px"><span class="ln">{w}</span></div>' for i, w in enumerate(MENU))
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>
<div id="stage"><div id="cam" class="L">
<div class="L" style="background:radial-gradient(ellipse 90% 55% at 50% 100%, #3a0906 0%, #120404 45%, #050303 80%)"></div>
<img id="fogA" class="a" src="file://{TEX}/smoke_bone.png" style="left:-20%;top:900px;width:140%;height:900px;object-fit:fill;opacity:.28">
<div id="hooks" class="L">{hk}</div>

<!-- S1 calendar -->
<div id="s1" class="L"><div id="cal" class="cal"><div class="rings"><i></i><i></i><i></i></div><div class="top">OCT</div>
  <div id="cday" class="day">WED</div><div id="cnum" class="num">28</div></div></div>

<!-- S2 grill -->
<div id="s2" class="L" style="opacity:0">
  <div id="gglow" class="a" style="left:90px;top:470px;width:900px;height:500px;background:radial-gradient(ellipse 50% 50% at 50% 60%, rgba(255,100,30,.6), rgba(208,20,30,0) 70%)"></div>
  <div id="puffs" class="L">{puffs}</div>
  <div id="gflames" class="L">{flames('gf', 9, 280, 800, 760, 170)}</div>
  {skewers}
  <div class="a" style="left:190px;top:480px;width:700px;height:640px">{grill_svg()}</div>
  <div id="sparks" class="L">{sparks}</div>
</div>

<!-- S3 menu -->
<div id="s3" class="L" style="opacity:0">
  <div id="plate" class="a" style="left:240px;top:350px;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,#2a1210 0 58%,#B3121C 59% 62%,#120808 63% 70%,rgba(0,0,0,0) 71%)"></div>
  <svg id="ring" class="a" style="left:240px;top:350px" width="600" height="600"><circle cx="300" cy="300" r="270" fill="none" stroke="#EFE6D6" stroke-width="5" stroke-dasharray="4 22" opacity=".55"/></svg>
  {plates}
</div>

<!-- S4 party -->
<div id="s4" class="L" style="opacity:0;overflow:hidden">
  <div id="beams" class="L">{beams}</div>
  <div class="spk" id="spL" style="left:40px"><div class="cone" style="width:130px;height:130px"></div><div class="cone" style="width:190px;height:190px"></div></div>
  <div class="spk" id="spR" style="right:40px"><div class="cone" style="width:130px;height:130px"></div><div class="cone" style="width:190px;height:190px"></div></div>
  <div class="a" style="left:0;top:1300px;width:{W}px;height:700px;background:radial-gradient(ellipse 70% 50% at 50% 30%, rgba(208,20,30,.55), rgba(0,0,0,0) 70%)"></div>
  <div id="people" class="L">{people}</div>
</div>

<!-- S5 FirstKlaz -->
{photo('pF', 'fk-silver-portrait.jpg', '50% 18%')}

<!-- S7 end world -->
<div id="s7" class="L" style="opacity:0">
  <div id="pumpL" class="a" style="left:40px;top:1490px;width:230px;height:200px;transform-origin:50% 100%">{pumpkin_svg()}</div>
  <div id="pumpR" class="a" style="left:820px;top:1520px;width:200px;height:174px;transform-origin:50% 100%">{pumpkin_svg()}</div>
  <div id="fireglow" class="L" style="background:radial-gradient(ellipse 80% 30% at 50% 100%, rgba(255,110,20,.75), rgba(208,20,30,.35) 45%, rgba(0,0,0,0) 75%)"></div>
  <div id="fire" class="L" style="filter:blur(2px)">{flames('ef', 9, -40, 1120, 1990, 320)}</div>
</div>
<img id="fogB" class="a" src="file://{TEX}/smoke_red.png" style="left:-20%;top:1250px;width:140%;height:700px;object-fit:fill;opacity:.35">

<div id="bats" class="L">{bats}</div>

<!-- type (brand system) -->
{blk('b1', 1150, 'Meat &amp; Greet presents', [('The countdown', 150, False), ('is on.', 150, True)])}
{blk('b2', 1180, 'Saturday &middot; 5PM', [('The grill', 170, False), ('is heating up.', 120, True)])}
<div id="b3" class="blk" style="top:1030px"><div class="kick"><span class="rule"></span><span class="kt">On the menu</span><span class="rule"></span></div>
  <div style="position:relative;height:230px">{menu_words}</div></div>
{blk('b4', 760, 'Then, after dark', [('The party', 190, False), ('takes over.', 150, True)])}
{blk('b5', 1200, 'Live on stage', [('FirstKlaz', 200, False), ('shuts it down.', 110, True)])}
{blk('b6', 430, 'Your Saturday checklist', [('Come', 190, False), ('prepared.', 190, True)])}
{rows}
<div id="end" class="L" style="opacity:0">
  <div id="lg" class="a" style="left:{W / 2 - 100}px;top:240px;width:200px;height:159px">{logo(200, 0, 0)}</div>
  <div id="l3" class="a minor c" style="top:1120px;font-size:44px;opacity:0">Sat 31 Oct &middot; 5PM &middot; Doxa Park, Abuja</div>
  <div id="tix" class="a" style="left:110px;top:1210px;width:860px;height:150px;display:flex">
    <div style="flex:1;background:#B3121C;display:flex;flex-direction:column;justify-content:center;padding:0 36px;-webkit-mask:radial-gradient(circle 18px at 100% 50%,transparent 98%,#000)">
      <div style="font-family:Anton;font-size:70px;line-height:1;text-transform:uppercase">Get tickets</div>
      <div style="font-family:Anton;font-size:30px;letter-spacing:.14em;margin-top:6px;opacity:.95">PV.RSVP/FIRSTKLAZ-MEATING</div></div>
    <div style="width:0;border-left:4px dashed #050303"></div>
    <div style="width:180px;background:#B3121C;display:flex;align-items:center;justify-content:center;-webkit-mask:radial-gradient(circle 18px at 0 50%,transparent 98%,#000)">
      <div style="font-family:Anton;font-size:60px">18+</div></div></div>
</div>
{blk('b7', 470, 'This Saturday', [('Get your tickets.', 128, False), ('The BBQ', 200, True), ('is free.', 200, True)])}
<div id="mini" class="a" style="left:64px;top:150px;width:150px;height:119px;opacity:0">{logo(150, 0, 0)}</div>
<div id="embers" class="L">{embers}</div>
</div>
<img id="grain" class="L" src="file://{GRAIN}" style="width:130%;height:130%;opacity:.2;mix-blend-mode:overlay">
<div class="L" style="background:radial-gradient(ellipse 80% 65% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,.7))"></div>
<div id="bolt" class="a" style="left:520px;top:0;opacity:0"><svg width="260" height="900"><path d="M150,0 L90,300 L150,300 L60,620 L120,620 L20,900" fill="none" stroke="#e8efff" stroke-width="8" stroke-linejoin="bevel" style="filter:drop-shadow(0 0 18px #9fb6ff)"/></svg></div>
<div id="flash" class="L" style="background:#eef2ff;opacity:0;mix-blend-mode:screen"></div>
<div id="border" class="L">{embroidery_frame()}</div>
<div id="black" class="L" style="background:#000;opacity:0"></div>
</div>
<script>{JS}</script></body></html>"""


JS = r"""
const $=id=>document.getElementById(id);
const cl=(x,a=0,b=1)=>Math.min(b,Math.max(a,x)), P=(t,a,b)=>cl((t-a)/(b-a)), L=(a,b,x)=>a+(b-a)*x;
const E={out3:x=>1-Math.pow(1-x,3),io3:x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2,outX:x=>x===1?1:1-Math.pow(2,-10*x),
  back:x=>{const c1=1.9,c3=c1+1;return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2)},bounce:x=>{const n=7.5625,d=2.75;
  if(x<1/d)return n*x*x; if(x<2/d)return n*(x-=1.5/d)*x+.75; if(x<2.5/d)return n*(x-=2.25/d)*x+.9375; return n*(x-=2.625/d)*x+.984375}};
const rnd=i=>{const s=Math.sin(i*127.1+311.7)*43758.5453;return s-Math.floor(s)};
const op=(el,v)=>el.style.opacity=v;
const BEAT=.5, G0=3.0;
const LIGHTNING=[[.2,1],[.42,1],[15.0,1],[21.5,1]];
const HITS=[.25,2.0,3.5,4.0,4.5,5.0,5.5,7.0,8.0,9.0,10.0,11.0,15.0,19.45,19.95,20.45,21.5,22.3,22.9];
const SCENES=[[0,3],[3,7],[7,11],[11,15],[15,18.5],[18.5,21.5],[21.5,99]];
const scene=t=>SCENES.findIndex(([a,b])=>t>=a&&t<b);
function kick(t){ if(t<G0) return 0; const d=(t-G0)%BEAT; return Math.exp(-d*9); }
function block(id,t,t0,t1,stag=.14){
  const el=$(id); if(t<t0||t>=t1){op(el,0);return}
  op(el,1-P(t,t1-.12,t1));
  const k=E.out3(P(t,t0,t0+.45)); el.querySelectorAll('.rule').forEach(r=>r.style.width=(k*64)+'px');
  const kt=el.querySelector('.kt'); kt.style.opacity=P(t,t0+.1,t0+.4); kt.style.letterSpacing=L(.6,.34,E.out3(P(t,t0,t0+.6)))+'em';
  el.querySelectorAll('.hl:not([id]) .ln').forEach((ln,i)=>{const s=t0+.15+i*stag, e=E.outX(P(t,s,s+.5));
    ln.style.transform=`translateY(${(1-e)*108}%)`; ln.style.filter=`blur(${(1-e)*6}px)`;});
}
function word(id,t,t0,t1){const el=$(id); if(t<t0||t>=t1){op(el,0);return} op(el,1);
  const e=E.outX(P(t,t0,t0+.35)); el.firstElementChild.style.transform=`translateY(${(1-e)*108}%)`;}
function bat(i,t){
  const el=$('bat'+i); let x,y,s,rot=0,vis=1;
  if(i<24){ const t0=.25+rnd(i)*.4, d=.9+rnd(i+5)*.6, p=P(t,t0,t0+d); if(t<t0||p>=1){op(el,0);return}
    const a=rnd(i+9)*Math.PI*2, e=p*p; x=540+Math.cos(a)*1500*e; y=900+Math.sin(a)*1700*e-200*p; s=L(.3,3.4,p); rot=Math.cos(a)*25;
  } else { const k=i-24, per=4.5+rnd(k)*3, ph=(t/per+rnd(k+20))%1, dir=k%2?1:-1;
    x=dir>0?L(-260,1340,ph):L(1340,-260,ph); y=180+rnd(k+33)*1250+Math.sin(t*2.2+k)*70; s=.6+rnd(k+44)*.7;
    vis=(t>1.5?1:0)*((t>11&&t<15)?.5:1); rot=Math.sin(t*3+k)*12; }
  const flap=Math.sin(t*(22+(i%5)*3)+i), fy=.3+.7*flap;
  el.querySelector('.wl').setAttribute('transform',`scale(1,${fy})`); el.querySelector('.wr').setAttribute('transform',`scale(-1,${fy})`);
  el.style.transform=`translate(${x-100}px,${y-50}px) scale(${s}) rotate(${rot}deg)`; op(el,vis);
}
function flameSet(sel,t,amt){document.querySelectorAll(sel).forEach((f,i)=>{const s=amt*(.75+.25*Math.sin(t*(9+i)+i*2)+.12*Math.sin(t*23+i));
  f.style.transform=`scaleY(${s}) scaleX(${.9+.1*Math.sin(t*7+i)}) skewX(${Math.sin(t*3+i)*6}deg)`;});}

function render(t){
  const sc=scene(t), kp=kick(t);
  // lightning, shake, grain
  let fl=0,bolt=0; for(const [s,len] of LIGHTNING){const d=(t-s)/len; if(d>=0&&d<.35){const k=(d<.05?1:d<.09?.25:d<.14?.85:Math.max(0,1-(d-.14)/.2)); fl=Math.max(fl,k); if(d<.16) bolt=1;}}
  op($('flash'),fl*.6); op($('bolt'),bolt*fl); $('bolt').style.left=(t<1?600:t<16?260:640)+'px';
  let sx=0,sy=0; for(const s of HITS){ if(t>=s){const d=t-s,a=Math.exp(-d*10)*10; sx+=a*Math.sin(d*70); sy+=a*Math.cos(d*53);} }
  $('cam').style.transform=`translate(${sx}px,${sy}px)`;
  $('grain').style.transform=`translate(${-rnd(Math.floor(t*30))*20}%,${-rnd(Math.floor(t*30)+5)*20}%)`;
  op($('border'),E.out3(P(t,.1,1.0)));
  document.querySelectorAll('.hook').forEach(h=>{const ph=+h.dataset.ph,s=+h.dataset.sc; h.style.transform=`scale(${s}) rotate(${Math.sin(t*1.4+ph)*4}deg)`;});
  op($('hooks'),(sc===1||sc===2||sc===6)?1:0);
  $('fogA').style.transform=`translateX(${Math.sin(t*.25)*6-t*1.2}%)`; $('fogB').style.transform=`translateX(${t*1.4-8}%)`;
  op($('mini'),(t>.4&&t<21.5)?cl(P(t,.4,.8)):0);

  // S1 calendar
  op($('s1'),sc===0?1:0);
  if(sc===0){
    const flips=[1.0,1.5,2.0]; let idx=0; flips.forEach((f,i)=>{if(t>=f) idx=i+1;});
    const days=[['WED','28'],['THU','29'],['FRI','30'],['SAT','31']];
    $('cday').textContent=days[idx][0]; $('cnum').textContent=days[idx][1]; $('cal').classList.toggle('sat',idx===3);
    let fy=1; for(const f of flips){ if(t>=f-.12&&t<f) fy=L(1,0,P(t,f-.12,f)); if(t>=f&&t<f+.15) fy=L(0,1,E.out3(P(t,f,f+.15))); }
    const enter=E.back(P(t,.3,.75)), pop=t>=2.0?1+.12*Math.exp(-(t-2.0)*6):1;
    $('cal').style.transform=`translateY(${L(-900,0,enter)}px) scaleY(${fy}) scale(${pop}) rotate(${Math.sin(t*2)*1.5}deg)`;
  }
  block('b1',t,.6,3.0,.3);

  // S2 grill
  op($('s2'),sc===1?1:0);
  if(sc===1){
    const ig=P(t,3.0,3.6);
    document.querySelectorAll('.coal').forEach((c,i)=>c.style.opacity=ig*(.55+.45*Math.sin(t*(4+i%5)+i)));
    op($('gglow'),ig*(.75+.25*Math.sin(t*9)+.2*kp));
    flameSet('.gf',t,E.out3(P(t,3.3,3.9))*(.85+.25*kp));
    for(let i=0;i<4;i++){ const t0=4.0+i*.5, e=E.bounce(P(t,t0-.35,t0+.2));
      $('sk'+i).style.transform=`translateY(${L(-900,0,e)}px) rotate(${(i%2?-3:3)*(1-e)}deg)`; op($('sk'+i),t>=t0-.35?1:0); }
    document.querySelectorAll('.puff').forEach((p,i)=>{const per=2.2+rnd(i)*1.2, ph=((t-3)/per+rnd(i+3))%1;
      p.style.left=(300+rnd(i+7)*460+Math.sin(t+i)*40)+'px'; p.style.top=(700-ph*700)+'px';
      p.style.transform=`scale(${.6+ph*1.4})`; op(p,P(t,3.4,4.2)*Math.sin(ph*Math.PI));});
    document.querySelectorAll('.spk2').forEach((s,i)=>{const per=.9+rnd(i)*.8, ph=((t-3)/per+rnd(i+11))%1;
      s.style.left=(280+rnd(i+2)*520+Math.sin(t*3+i)*30)+'px'; s.style.top=(740-ph*520)+'px'; op(s,P(t,3.3,3.8)*(1-ph));});
  }
  block('b2',t,3.2,7.0,.18);

  // S3 menu
  op($('s3'),sc===2?1:0);
  if(sc===2){
    $('ring').style.transform=`rotate(${t*40}deg)`; $('plate').style.transform=`scale(${1+.03*kp})`;
    for(let i=0;i<4;i++){ const t0=7.0+i, f=$('food'+i), on=t>=t0&&t<t0+1; op(f,on?1:0);
      if(on){ const e=E.back(P(t,t0,t0+.35)); f.style.transform=`scale(${e*(1+.04*kp)}) rotate(${L(-40,0,E.out3(P(t,t0,t0+.45)))+Math.sin(t*2)*3}deg)`; } }
  }
  block('b3',t,7.0,11.0); for(let i=0;i<4;i++) word('m'+i,t,7.05+i,8.0+i);

  // S4 party
  op($('s4'),sc===3?1:0);
  if(sc===3){
    document.querySelectorAll('.beam').forEach((b,i)=>{b.style.transform=`rotate(${Math.sin(t*1.6+i*1.3)*28}deg)`; op(b,.45+.55*kp);});
    document.querySelectorAll('.cone').forEach(c=>c.style.transform=`scale(${1+.1*kp})`);
    document.querySelectorAll('.ppl').forEach((p,i)=>{const ph=((t-G0)/BEAT+i*.37)%1, j=Math.abs(Math.sin(ph*Math.PI));
      p.style.transform=`translateY(${-j*60}px)`; p.querySelector('.armL').style.transform=`rotate(${-10-j*25+Math.sin(t*4+i)*8}deg)`;
      p.querySelector('.armR').style.transform=`rotate(${10+j*25-Math.sin(t*4+i)*8}deg)`;});
  }
  block('b4',t,11.3,15.0,.2);

  // S5 FirstKlaz
  const onF=sc===4; op($('pF'),onF?1:0);
  if(onF){ const img=$('pF').firstElementChild; img.style.transform=`scale(${L(1.14,1.0,E.out3(P(t,15,18.5)))})`;
    img.style.filter=`grayscale(.85) contrast(1.35) brightness(${.72+fl*.9+.12*kp})`; }
  block('b5',t,15.3,18.5,.2);

  // S6 checklist
  block('b6',t,18.6,21.5,.2);
  for(let i=0;i<3;i++){ const r=$('r'+i), t0=19.2+i*.5;
    if(t<t0||t>=21.5){op(r,0);continue} const e=E.outX(P(t,t0,t0+.4)); op(r,e*(1-P(t,21.4,21.5))); r.style.transform=`translateX(${(1-e)*-120}px)`;
    r.querySelector('.tick').setAttribute('stroke-dashoffset',140*(1-E.out3(P(t,t0+.25,t0+.45)))); }

  // S7 end
  const end=sc===6; op($('s7'),end?1:0); op($('end'),end?1:0);
  if(end){
    flameSet('.ef',t,E.out3(P(t,21.5,22.2))*(.9+.15*kp)); op($('fireglow'),.8+.2*Math.sin(t*11));
    [['pumpL',21.7],['pumpR',21.85]].forEach(([id,t0])=>{const e=E.back(P(t,t0,t0+.4)); $(id).style.transform=`scale(${e})`;
      $(id).querySelector('.pface').style.opacity=t>t0+.2?(.75+.25*Math.sin(t*23+t0*9)):0;
      $(id).style.filter=`drop-shadow(0 0 ${t>t0+.2?30+10*Math.sin(t*17):0}px rgba(255,140,30,.7))`;});
    $('lg').style.transform=`scale(${E.back(P(t,21.6,22.0))})`;
    const l3=E.out3(P(t,22.9,23.3)); op($('l3'),l3); $('l3').style.transform=`translateY(${L(40,0,l3)}px)`;
    let pulse=0; for(let k=23.5;k<25;k+=BEAT*2) if(t>=k) pulse=Math.max(pulse,1-P(t,k,k+.3));
    const tx=E.back(P(t,23.1,23.5)); $('tix').style.transform=`translateY(${L(500,0,tx)}px) scale(${1+pulse*.035})`; op($('tix'),t>=23.1?1:0);
  }
  block('b7',t,22.0,99,.28);

  // embers + bats
  const emOn = sc===1?0 : sc===6?1 : .45;
  document.querySelectorAll('.em').forEach((el,i)=>{const sp=160+rnd(i)*300,x0=rnd(i+40)*1080,y=(1950+rnd(i+80)*1950-t*sp)%2000;
    el.style.left=(x0+Math.sin(t*1.5+i)*40)+'px'; el.style.top=y+'px'; op(el,emOn*(.3+.7*rnd(i+3))*(.6+.4*Math.sin(t*8+i)));});
  for(let i=0;i<40;i++) bat(i,t);
  op($('black'),P(t,24.75,25.0)*.6);
}
window.render=render;
"""


def render_frames():
    os.makedirs(SCRATCH, exist_ok=True)
    hp = os.path.join(HERE, '_bbq.html')
    open(hp, 'w').write(html())
    js = os.path.join(HERE, '_shoot_bbq.js')
    open(js, 'w').write(f"""const {{chromium}}=require('playwright');(async()=>{{const b=await chromium.launch();
const p=await b.newPage({{viewport:{{width:{W},height:{H}}}}});await p.goto('file://{hp}');await p.evaluate(()=>document.fonts.ready);
await p.waitForTimeout(800);const n={int(FPS * DUR)};const only=process.argv.slice(2).map(Number);
for(let f=0;f<n;f++){{ if(only.length&&!only.includes(f)) continue; await p.evaluate(t=>render(t),f/{FPS});
await p.screenshot({{path:'{SCRATCH}/f_'+String(f).padStart(4,'0')+'.jpg',type:'jpeg',quality:94}});}}
await b.close();}})();""")
    subprocess.run(['node', js] + sys.argv[2:], check=True)


# ------------------------------------------------------------------ sound (synthesised, 120 BPM)
SR = 44100


def audio(path):
    from scipy.signal import butter, lfilter
    n = int(SR * DUR); out = np.zeros(n); rng = np.random.default_rng(41)
    tt = lambda d: np.arange(int(SR * d)) / SR
    filt = lambda kind, f, x: lfilter(*butter(2, np.array(f) / (SR / 2), kind), x)

    def put(sig, t0, g=1.0):
        i = int(t0 * SR)
        if i < n:
            sig = sig[:n - i]; out[i:i + len(sig)] += sig * g

    def drone(d):
        t = tt(d)
        return (np.sin(2 * np.pi * 55 * t) + .8 * np.sin(2 * np.pi * 58.3 * t)) * .22 * np.minimum(1, t / .8) * np.minimum(1, (d - t) / .5)

    def thunder(d=2.0):
        t = tt(d)
        return filt('high', 1500, rng.normal(0, 1, len(t))) * np.exp(-t * 18) * .8 + filt('low', 180, rng.normal(0, 1, len(t))) * (1 - np.exp(-t * 8)) * np.exp(-t * 1.6) * 3

    def flutter(d=1.6, dens=1.0):
        t = tt(d); x = np.zeros(len(t))
        for _ in range(int(6 * dens)):
            f = rng.uniform(16, 26); ph = rng.uniform(0, 6.28)
            x += filt('band', [600, 3500], rng.normal(0, 1, len(t))) * np.clip(np.sin(2 * np.pi * f * t + ph), 0, 1) ** 3
        return x * np.sin(np.pi * t / d) * .18

    def bell(f, d=1.2, g=.22):
        t = tt(d)
        return (np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * f * 2.76 * t) + .25 * np.sin(2 * np.pi * f * 5.4 * t)) * np.exp(-t * 3) * g

    def click():
        t = tt(.08)
        return filt('band', [1500, 5000], rng.normal(0, 1, len(t))) * np.exp(-t * 80) * .5

    def boom():
        t = tt(1.4)
        return np.sin(2 * np.pi * np.cumsum(32 + 80 * np.exp(-t * 8)) / SR) * np.exp(-t * 2.6)

    def kick(g=1.0):
        t = tt(.45)
        return np.sin(2 * np.pi * np.cumsum(48 + 110 * np.exp(-t * 28)) / SR) * np.exp(-t * 7) * g

    def shaker(a=1.0):
        t = tt(.09)
        return filt('high', 6000, rng.normal(0, 1, len(t))) * np.exp(-t * 55) * .16 * a

    def talking_drum(f0, f1, dur=.3):
        t = tt(dur); f = f1 + (f0 - f1) * np.exp(-t * 9)
        tone = np.sin(2 * np.pi * np.cumsum(f) / SR) + .3 * np.sin(4 * np.pi * np.cumsum(f) / SR)
        return (tone * np.exp(-t * 7) + filt('band', [800, 3000], rng.normal(0, 1, len(t))) * np.exp(-t * 60) * .5) * .5

    def clap():
        t = tt(.25)
        env = np.exp(-t * 25) + .6 * np.exp(-np.abs(t - .012) * 400) + .5 * np.exp(-np.abs(t - .024) * 400)
        return filt('band', [900, 2500], rng.normal(0, 1, len(t))) * env * .42

    def sub(f, d=.45):
        t = tt(d)
        return np.tanh(1.6 * np.sin(2 * np.pi * f * t)) * np.exp(-t * 4) * .45

    def sizzle(d, g=1.0):
        t = tt(d); x = filt('high', 3500, rng.normal(0, 1, len(t)))
        crackle = (rng.random(len(t)) > .9993) * rng.uniform(.5, 1.5, len(t))
        return (x * (.5 + .5 * np.abs(np.sin(2 * np.pi * 3.1 * t))) * .12 + filt('high', 2000, crackle)) * g * np.minimum(1, t / .4) * np.minimum(1, (d - t) / .4)

    def swell(d=1.6):
        t = tt(d)
        return filt('band', [400, 2500], rng.normal(0, 1, len(t))) * np.sin(np.pi * t / d) ** 2 * .35

    def whoosh(d=.5):
        t = tt(d); x = rng.normal(0, 1, len(t)); y = np.zeros_like(x)
        for k, f in enumerate(np.linspace(300, 4000, 8)):
            seg = slice(int(len(x) * k / 8), int(len(x) * (k + 1) / 8)); y[seg] = filt('band', [f * .7, f * 1.3], x)[seg]
        return y * np.sin(np.pi * t / d) * .45

    # intro
    put(drone(3.4), 0, .9)
    put(thunder(), .2, .55)
    put(flutter(1.8, 1.5), .25, 1.1)
    for tm, f in [(.6, 440), (.9, 523.3), (1.2, 659.3), (1.5, 622.3)]:
        put(bell(f), tm, .8)
    for tf in (1.0, 1.5, 2.0):
        put(click(), tf, 1)
    put(boom(), 2.0, .6)
    put(whoosh(.5), 2.55, .8)
    # groove
    for k in range(int((DUR - .6 - 3.0) / .5)):
        tb = 3.0 + k * .5
        put(kick(.7 if tb < 7 else 1.0), tb, .85)
        for s in range(2):
            put(shaker(1 if s else .6), tb + s * .25, 1)
        if tb >= 7 and k % 4 in (1, 3):
            put(talking_drum(240 if k % 8 < 4 else 200, 140), tb + .25, .75)
        if tb >= 11 and k % 2 == 1 and not (18.5 <= tb < 21.5):
            put(clap(), tb, .9)
        if tb >= 11 and k % 2 == 0 and not (18.5 <= tb < 21.5):
            put(sub(55 if (k // 4) % 2 == 0 else 49), tb, .8)
    put(sizzle(4.0), 3.0, 1)
    for s in (4.0, 4.5, 5.0, 5.5):
        put(sizzle(.6, 2.2), s, 1)
    for s in (7.0, 11.0, 15.0, 21.5):
        put(boom(), s, .9)
    for s in (6.6, 10.6, 14.6, 21.1):
        put(whoosh(.45), s, .8)
    put(swell(1.8), 11.0, 1)
    put(thunder(), 15.0, .6); put(thunder(), 21.5, .6)
    for i, s in enumerate((19.45, 19.95, 20.45)):
        put(bell(880 * (1.0, 1.26, 1.5)[i], .8, .3), s, 1)
    put(flutter(1.2, .6), 13.0, .6); put(flutter(1.2, .6), 23.0, .6)
    fade = np.ones(n); fe = int(SR * .9); fade[-fe:] = np.linspace(1, 0, fe)
    out = np.tanh(out * 1.3) * fade
    out = out / np.max(np.abs(out)) * .78
    import wave
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.stack([out, out], 1) * 32767).astype('<i2').tobytes())


def encode():
    os.makedirs(OUT, exist_ok=True)
    wav = os.path.join(HERE, '_bed_bbq.wav')
    audio(wav)
    v = ['-framerate', str(FPS), '-i', f'{SCRATCH}/f_%04d.jpg']
    enc = ['-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart']
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error'] + v + enc + [os.path.join(OUT, NAME + '_NO-AUDIO.mp4')], check=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error'] + v + ['-i', wav] + enc +
                   ['-af', 'alimiter=limit=0.8:level=false,volume=-2dB', '-c:a', 'aac', '-b:a', '192k', '-shortest', os.path.join(OUT, NAME + '.mp4')], check=True)
    shutil.copy(f'{SCRATCH}/f_{int(24.0 * FPS):04d}.jpg', os.path.join(OUT, NAME + '_poster.jpg'))
    os.remove(wav)
    print('ok', NAME)


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'frames':
        render_frames()
    else:
        render_frames(); encode()
