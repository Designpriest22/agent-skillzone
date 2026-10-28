"""FIRSTKLAZ MEATING - 15s Halloween story promo (1080x1920, 30fps).

python3 promo.py            -> ../export/FirstKlaz-Meating_Story-Promo_15s.mp4 (+ silent version, poster)
python3 promo.py frames 0 90 -> render only those frames (for checking)

Built to match the official flyer: butcher hooks and chains, hanging meat, fire, fog,
shadow figures, chrome-and-blood title, drippy red Halloween type. It ends on the official
flyer artwork. Pipeline: HTML with a deterministic render(t) -> Playwright frame capture ->
ffmpeg H.264. The sound design (drone, heartbeat, music box, thunder, metal hits, 808 drop)
is synthesised in code, so there is nothing to license.

STORYBOARD
 0.0-2.4  DARKNESS  fog, two lightning strikes reveal swinging hooks and hanging meat; "ABUJA..." bleeds in
 2.4-5.0  WICKED    shadow figures emerge, jack-o'-lanterns ignite, skull with glowing eyes;
                    "SOMETHING WICKED" (chrome) / "IS ON THE GRILL" (blood red); fire rises
 5.0-9.0  REVEAL    lightning cut -> tight on FirstKlaz (official flyer) -> thunder -> pull back to the title
 9.0-11.4 DETAILS   31ST OCT / 5PM / DOXA PARK, ABUJA / HALLOWEEN BBQ PARTY, each hit on a metal clang
11.4-15.0 FLYER     lightning -> the official flyer, alive with fire, embers and fog; hold to read
"""
import os
import shutil
import subprocess
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
FONTS = os.path.join(ROOT, 'src', 'fonts')
TEX = os.path.join(ROOT, 'build', 'tex')
GRAIN = os.path.join(ROOT, 'firstklaz-carousel', 'src', 'grain.png')
FLYER = os.path.join(HERE, 'assets', 'official-flyer-4x5.jpg')       # 2060 x 2576
OUT = os.path.abspath(os.path.join(HERE, '..', 'export'))
FPS, DUR, W, H = 30, 15.0, 1080, 1920
SCRATCH = os.environ.get('PROMO_TMP', os.path.join(HERE, '_frames'))

FLAME = ("M50,2 C58,20 72,26 74,46 C80,38 82,30 80,22 C94,38 98,58 92,76 C86,92 70,100 50,100 C30,100 14,92 8,76 "
         "C2,58 8,42 18,32 C18,42 22,50 28,54 C26,36 38,22 50,2 Z")

CSS = f"""
@font-face{{font-family:Anton;src:url(file://{FONTS}/Anton.ttf)}}
@font-face{{font-family:Wet;src:url(file://{FONTS}/RubikWetPaint.ttf)}}
@font-face{{font-family:Dirt;src:url(file://{FONTS}/RubikDirt.ttf)}}
*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{width:{W}px;height:{H}px;background:#000;overflow:hidden}}
#stage{{position:relative;width:{W}px;height:{H}px;overflow:hidden;background:#050303;color:#F2ECE4}}
.L{{position:absolute;inset:0}}
.a{{position:absolute}}
.c{{left:0;width:{W}px;text-align:center}}
.wet{{font-family:Wet;color:#D0141E;line-height:1;text-shadow:0 0 30px rgba(208,20,30,.55)}}
.dirt{{font-family:Dirt;line-height:1}}
.chrome{{position:relative;font-family:Anton;text-transform:uppercase;line-height:1}}
.chrome .ex{{position:absolute;left:0;top:0;width:100%;color:#1a0f0d;
  text-shadow:0 2px 0 #241512,0 4px 0 #2c1a16,0 6px 0 #33201b,0 8px 0 #3a241f,0 10px 0 #1a0f0d,0 18px 30px rgba(0,0,0,.8)}}
.chrome .fc{{position:relative;color:transparent;background:linear-gradient(180deg,#fbfbfb 0%,#c9c9c9 28%,#5d5d5d 48%,#2c2c2c 52%,#a7a7a7 66%,#e7e7e7 82%,#7b7b7b 100%);
  -webkit-background-clip:text;background-clip:text;-webkit-text-stroke:2px #151515}}
svg{{display:block}}
"""


# ------------------------------------------------------------------ vector props
def hook_svg(meat=None, chain=260):
    links = ''.join(f'<rect x="{46 if i % 2 else 52}" y="{i * 26}" width="{28 if i % 2 else 16}" height="34" rx="{14 if i % 2 else 8}" '
                    f'fill="none" stroke="url(#mtl)" stroke-width="7"/>' for i in range(chain // 26))
    y = chain
    hook = (f'<circle cx="60" cy="{y + 14}" r="14" fill="none" stroke="url(#mtl)" stroke-width="9"/>'
            f'<path d="M60,{y + 28} L60,{y + 150} C60,{y + 215} 116,{y + 222} 118,{y + 160} L104,{y + 176}" fill="none" stroke="url(#mtl)" stroke-width="12" stroke-linecap="round"/>')
    m = ''
    if meat == 'ham':
        m = (f'<g transform="translate(18,{y + 120})"><path d="M42,0 C70,8 92,40 96,90 C100,150 80,210 46,214 C14,210 -6,160 -2,100 C2,48 16,6 42,0 Z" fill="#5a1611"/>'
             f'<path d="M42,0 C70,8 92,40 96,90 C100,150 80,210 46,214 C30,180 30,60 42,0 Z" fill="#7a2018" opacity=".8"/>'
             f'<path d="M20,70 C40,90 60,80 80,100 M14,130 C40,150 64,140 88,160" stroke="#c9a08c" stroke-width="5" fill="none" opacity=".55"/>'
             f'<circle cx="42" cy="2" r="9" fill="#e9d6c5"/></g>')
    elif meat == 'rack':
        m = (f'<g transform="translate(10,{y + 130})"><path d="M10,0 L100,0 C108,60 104,150 92,190 L18,190 C6,150 2,60 10,0 Z" fill="#6b1914"/>'
             + ''.join(f'<path d="M{20 + k * 18},6 L{22 + k * 18},180" stroke="#e7d3c0" stroke-width="7" opacity=".85"/>' for k in range(5)) +
             f'<path d="M10,0 L100,0 C108,60 104,150 92,190 L18,190" fill="none" stroke="#3a0b08" stroke-width="6"/></g>')
    return (f'<svg width="120" height="{y + 360}" viewBox="0 0 120 {y + 360}" style="overflow:visible"><defs>'
            f'<linearGradient id="mtl" x1="0" x2="1"><stop offset="0" stop-color="#2a2a2a"/><stop offset=".45" stop-color="#9b9b9b"/>'
            f'<stop offset=".55" stop-color="#d8d8d8"/><stop offset="1" stop-color="#3a3a3a"/></linearGradient></defs>{links}{hook}{m}</svg>')


def figure_svg():
    return ('<svg viewBox="0 0 300 700" width="100%" height="100%"><defs><radialGradient id="eye"><stop offset="0" stop-color="#ff4a3a"/>'
            '<stop offset=".4" stop-color="#d0141e"/><stop offset="1" stop-color="#d0141e" stop-opacity="0"/></radialGradient></defs>'
            '<path d="M150,20 C210,20 240,70 240,130 C240,170 230,190 220,205 C260,260 280,380 290,520 C295,600 300,660 300,700 L0,700 '
            'C0,660 5,600 10,520 C20,380 40,260 80,205 C70,190 60,170 60,130 C60,70 90,20 150,20 Z" fill="#0a0606"/>'
            '<ellipse cx="150" cy="140" rx="52" ry="62" fill="#000"/>'
            '<circle class="eyeL" cx="128" cy="140" r="16" fill="url(#eye)"/><circle class="eyeR" cx="172" cy="140" r="16" fill="url(#eye)"/></svg>')


def pumpkin_svg():
    return ('<svg viewBox="0 0 220 190" width="100%" height="100%"><defs><radialGradient id="pg" cx=".5" cy=".55">'
            '<stop offset="0" stop-color="#ffe08a"/><stop offset=".5" stop-color="#ffb43a"/><stop offset="1" stop-color="#ff6a00"/></radialGradient></defs>'
            '<path d="M104,30 C100,14 108,4 122,2 L126,10 C116,14 114,20 116,30 Z" fill="#4a2a14"/>'
            '<ellipse cx="60" cy="108" rx="58" ry="74" fill="#b8410f"/><ellipse cx="160" cy="108" rx="58" ry="74" fill="#b8410f"/>'
            '<ellipse cx="110" cy="106" rx="62" ry="80" fill="#d5531a"/><ellipse cx="110" cy="106" rx="30" ry="78" fill="#e0662a" opacity=".6"/>'
            '<g class="pface" fill="url(#pg)"><path d="M58,80 L88,80 L73,54 Z"/><path d="M132,80 L162,80 L147,54 Z"/><path d="M100,104 L120,104 L110,88 Z"/>'
            '<path d="M48,124 L66,138 L80,124 L96,140 L110,124 L124,140 L140,124 L154,138 L172,124 C162,166 58,166 48,124 Z"/></g></svg>')


def skull_svg():
    body = ("M100,6 C152,6 190,44 190,98 C190,126 180,145 168,156 L168,172 C168,181 161,186 152,186 L147,186 L147,204 "
            "C147,218 135,228 121,228 L79,228 C65,228 53,218 53,204 L53,186 L48,186 C39,186 32,181 32,172 L32,156 C20,145 10,126 10,98 C10,44 48,6 100,6 Z")
    return (f'<svg viewBox="0 0 200 234" width="100%" height="100%"><defs><radialGradient id="sg"><stop offset="0" stop-color="#ff5a3c"/>'
            f'<stop offset=".35" stop-color="#d0141e" stop-opacity=".9"/><stop offset="1" stop-color="#d0141e" stop-opacity="0"/></radialGradient>'
            f'<linearGradient id="bone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#efe6d6"/><stop offset="1" stop-color="#8e8273"/></linearGradient></defs>'
            f'<path d="{body}" fill="url(#bone)"/>'
            '<path d="M44,110 C42,88 58,78 76,80 C93,82 99,96 95,112 C91,128 76,138 62,135 C50,132 45,123 44,110 Z" fill="#0b0707"/>'
            '<path d="M156,110 C158,88 142,78 124,80 C107,82 101,96 105,112 C109,128 124,138 138,135 C150,132 155,123 156,110 Z" fill="#0b0707"/>'
            '<circle class="sk" cx="72" cy="108" r="24" fill="url(#sg)"/><circle class="sk" cx="128" cy="108" r="24" fill="url(#sg)"/>'
            '<path d="M100,138 C93,150 86,160 89,167 C92,172 98,169 100,164 C102,169 108,172 111,167 C114,160 107,150 100,138 Z" fill="#0b0707"/>'
            '<rect x="57" y="179" width="86" height="42" rx="11" fill="#0b0707"/>'
            + ''.join(f'<rect x="{59.5 + i * 13.6:.1f}" y="178" width="11.4" height="20" rx="4" fill="#d9cfc0"/><rect x="{59.5 + i * 13.6:.1f}" y="201" width="11.4" height="17" rx="4" fill="#d9cfc0"/>' for i in range(6))
            + '<path d="M122,10 L116,26 L126,36 L117,50" fill="none" stroke="#0b0707" stroke-width="3"/></svg>')


def drips_svg(w, h, n, seed):
    rnd = np.random.default_rng(seed)
    s = []
    for _ in range(n):
        x = rnd.uniform(.04, .96) * w
        dw = rnd.uniform(.006, .016) * w
        ln = rnd.uniform(.25, 1) * h
        s.append(f'<path d="M{x - dw:.1f},0 L{x + dw:.1f},0 L{x + dw * .7:.1f},{ln - dw:.1f} A{dw * .95:.1f},{dw * .95:.1f} 0 1 1 {x - dw * .7:.1f},{ln - dw:.1f} Z" fill="#a70d16"/>')
    return f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}">{"".join(s)}</svg>'


def chrome(text, size, top, id_):
    return (f'<div id="{id_}" class="a c chrome" style="top:{top}px;font-size:{size}px">'
            f'<div class="ex">{text}</div><div class="fc">{text}</div></div>')


def html():
    hooks = [(-30, 'ham', 90, .9, .0), (170, None, 150, .8, 1.3), (360, 'rack', 40, .75, .6), (620, None, 110, .8, 2.4), (770, None, 60, .85, 2.1),
             (930, 'ham', 50, .95, 1.7)]
    hk = ''.join(f'<div class="a hook" data-ph="{ph}" style="left:{x}px;top:-40px;transform-origin:60px 0;transform:scale({sc});opacity:.95">'
                 f'{hook_svg(m, ch)}</div>' for x, m, ch, sc, ph in hooks)
    figs = ''.join(f'<div class="a fig" style="left:{x}px;top:{y}px;width:{w}px;height:{w * 7 / 3:.0f}px;filter:blur({b}px)">{figure_svg()}</div>'
                   for x, y, w, b in ((-60, 760, 300, 2.5), (230, 700, 230, 4), (640, 720, 240, 4), (860, 780, 290, 2.5)))
    flames = ''.join(f'<div class="a fl" style="left:{x}px;bottom:{-40 + (i % 3) * 10}px;width:{wd}px;height:{wd * 1.4:.0f}px;transform-origin:50% 100%">'
                     f'<svg viewBox="0 0 100 102" width="100%" height="100%" preserveAspectRatio="none"><defs><linearGradient id="fg{i}" x1="0" y1="1" x2="0" y2="0">'
                     f'<stop offset="0" stop-color="#ffd27a"/><stop offset=".35" stop-color="#ff7a1a"/><stop offset=".8" stop-color="#d0141e"/><stop offset="1" stop-color="#d0141e" stop-opacity="0"/>'
                     f'</linearGradient></defs><path d="{FLAME}" fill="url(#fg{i})"/></svg></div>'
                     for i, (x, wd) in enumerate([(-60, 300), (120, 220), (260, 340), (470, 260), (620, 330), (800, 240), (930, 300), (40, 180), (380, 200), (720, 190)]))
    embers = ''.join(f'<div class="a em" style="width:{3 + i % 5}px;height:{3 + i % 5}px;border-radius:50%;background:{"#ffb347" if i % 3 else "#ff5a1f"};'
                     f'box-shadow:0 0 10px #ff6a1f"></div>' for i in range(60))
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>
<div id="stage"><div id="cam" class="L">

<!-- WORLD: fog, hooks, figures, pumpkins, fire (shared by S1, S2, S4) -->
<div id="world" class="L">
  <div id="sky" class="L" style="background:radial-gradient(ellipse 90% 55% at 50% 100%, #3a0906 0%, #120404 45%, #050303 80%)"></div>
  <img id="fogA" class="a" src="file://{TEX}/smoke_bone.png" style="left:-20%;top:900px;width:140%;height:900px;object-fit:fill;opacity:.3">
  <div id="figs" class="L">{figs}</div>
  <div id="hooks" class="L">{hk}</div>
  <div id="pumpL" class="a" style="left:40px;top:1490px;width:230px;height:200px">{pumpkin_svg()}</div>
  <div id="pumpR" class="a" style="left:820px;top:1520px;width:200px;height:174px">{pumpkin_svg()}</div>
  <div id="skull" class="a" style="left:{W / 2 - 150}px;top:1150px;width:300px;height:351px">{skull_svg()}</div>
  <div id="fireglow" class="L" style="background:radial-gradient(ellipse 80% 30% at 50% 100%, rgba(255,110,20,.75), rgba(208,20,30,.35) 45%, rgba(0,0,0,0) 75%)"></div>
  <div id="fire" class="L" style="filter:blur(2px)">{flames}</div>
  <img id="fogB" class="a" src="file://{TEX}/smoke_red.png" style="left:-20%;top:1150px;width:140%;height:800px;object-fit:fill;opacity:.55">
</div>

<!-- S1 / S2 type -->
<div id="abuja" class="a c wet" style="top:560px;font-size:210px">Abuja...</div>
<div id="dripA" class="a" style="left:180px;top:745px;transform-origin:50% 0">{drips_svg(720, 260, 14, 3)}</div>
{chrome('Something', 170, 440, 'w1')}
{chrome('Wicked', 230, 600, 'w2')}
<div id="w3" class="a c wet" style="top:965px;font-size:130px">is on the grill.</div>

<!-- S3 / S5: official flyer -->
<div id="flyerWrap" class="L" style="opacity:0">
  <div id="flyBlack" class="L" style="background:#000"></div>
  <img id="flyer" class="a" src="file://{FLYER}" style="left:0;top:285px;width:{W}px;height:1351px;transform-origin:587px 846px;
    -webkit-mask-image:linear-gradient(180deg,transparent 0%,#000 7%,#000 93%,transparent 100%)">
  <div id="flick" class="L" style="background:radial-gradient(ellipse 70% 40% at 50% 70%, rgba(255,120,30,.35), rgba(0,0,0,0) 70%);mix-blend-mode:screen"></div>
</div>

<!-- S4 details -->
<div id="d1" class="a c dirt" style="top:380px;font-size:280px">31ST</div>
<div id="d1b" class="a c dirt" style="top:650px;font-size:280px;color:#D0141E;text-shadow:0 0 30px rgba(208,20,30,.6)">OCT</div>
<div id="d2" class="a c dirt" style="top:935px;font-size:170px">5PM</div>
<div id="d3" class="a c dirt" style="top:1125px;font-size:92px;text-transform:uppercase">Doxa Park, Abuja</div>
<div id="d4" class="a c wet" style="top:1250px;font-size:132px;line-height:.95">Halloween<br>BBQ Party</div>
<div id="dripD" class="a" style="left:220px;top:1500px;transform-origin:50% 0">{drips_svg(640, 160, 12, 9)}</div>

<div id="embers" class="L">{embers}</div>
</div>
<img id="grain" class="L" src="file://{GRAIN}" style="width:130%;height:130%;opacity:.2;mix-blend-mode:overlay">
<div class="L" style="background:radial-gradient(ellipse 80% 65% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,.75))"></div>
<div id="bolt" class="a" style="left:520px;top:0;opacity:0"><svg width="260" height="900"><path d="M150,0 L90,300 L150,300 L60,620 L120,620 L20,900" fill="none" stroke="#e8efff" stroke-width="8" stroke-linejoin="bevel" style="filter:drop-shadow(0 0 18px #9fb6ff)"/></svg></div>
<div id="flash" class="L" style="background:#eef2ff;opacity:0;mix-blend-mode:screen"></div>
<div id="black" class="L" style="background:#000;opacity:0"></div>
</div>
<script>{JS}</script></body></html>"""


JS = r"""
const $=id=>document.getElementById(id);
const cl=(x,a=0,b=1)=>Math.min(b,Math.max(a,x)), P=(t,a,b)=>cl((t-a)/(b-a)), L=(a,b,x)=>a+(b-a)*x;
const E={out3:x=>1-Math.pow(1-x,3),io3:x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2,outX:x=>x===1?1:1-Math.pow(2,-10*x),
  inX:x=>x===0?0:Math.pow(2,10*x-10),back:x=>{const c1=1.9,c3=c1+1;return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2)}};
const rnd=i=>{const s=Math.sin(i*127.1+311.7)*43758.5453;return s-Math.floor(s)};
const op=(el,v)=>el.style.opacity=v;
const LIGHTNING=[.35,.55,5.0,6.55,11.4];
const HITS=[.35,2.5,5.0,6.55,9.0,9.55,10.05,10.6,11.4];
function slam(el,t,t0,{dur=.3,from=1.8,blur=16}={}){
  if(t<t0){op(el,0);return}
  const e=E.outX(P(t,t0,t0+dur)); op(el,cl(P(t,t0,t0+dur*.4)));
  el.style.transform=`scale(${L(from,1,e)})`; el.style.filter=`blur(${L(blur,0,e)}px)`;
}
function bleed(el,t,t0,dur=.9){ // text fades in like ink soaking through
  if(t<t0){op(el,0);return}
  const e=E.out3(P(t,t0,t0+dur)); op(el,e); el.style.filter=`blur(${L(18,0,e)}px)`; el.style.letterSpacing=L(.12,0,e)+'em';
}
function render(t){
  // ---------------- lightning
  let fl=0, bolt=0;
  for(const s of LIGHTNING){ const d=t-s; if(d>=0&&d<.35){ const k=(d<.05?1:d<.09?.25:d<.14?.85:Math.max(0,1-(d-.14)/.2)); fl=Math.max(fl,k); if(d<.16) bolt=1; } }
  op($('flash'),fl*.6); op($('bolt'),bolt*(LIGHTNING.indexOf(5.0)>=0&&t>4.9&&t<5.2?0:1)*fl);
  $('bolt').style.left=(t<1?560:t<7?300:640)+'px';
  // camera shake on hits
  let sx=0,sy=0; for(const s of HITS){ if(t>=s){const d=t-s,a=Math.exp(-d*10)*12; sx+=a*Math.sin(d*70); sy+=a*Math.cos(d*53);} }
  $('cam').style.transform=`translate(${sx}px,${sy}px)`;
  $('grain').style.transform=`translate(${-rnd(Math.floor(t*30))*20}%,${-rnd(Math.floor(t*30)+5)*20}%)`;

  // ---------------- world visibility: S1, S2, S4
  const inFlyer=(t>=5.0&&t<9.0)||t>=11.4;
  const fin=t>=11.4; op($('world'),inFlyer&&!fin?0:1); op($('flyerWrap'),inFlyer?1:0); op($('flyBlack'),fin?0:1);
  for(const id of ['pumpL','pumpR','skull','figs']) $(id).style.visibility=fin?'hidden':'visible';
  // darkness in S1: world only visible by lightning + faint fire
  const dark = t<2.4 ? Math.max(fl, .16+.1*Math.sin(t*3)) : 1;
  $('world').style.filter=`brightness(${dark})`;
  // hooks swing
  document.querySelectorAll('.hook').forEach((h,i)=>{
    const ph=+h.dataset.ph, sc=h.style.transform.match(/scale\(([^)]+)\)/)[1];
    h.style.transform=`scale(${sc}) rotate(${Math.sin(t*1.4+ph)*4+Math.sin(t*.6+ph*2)*2}deg)`;
  });
  // fog drift
  $('fogA').style.transform=`translateX(${Math.sin(t*.25)*6-t*1.2}%)`; $('fogB').style.transform=`translateX(${t*1.4-8}%)`;
  // shadow figures rise from the fog in S2
  document.querySelectorAll('.fig').forEach((f,i)=>{
    const e=E.out3(P(t,2.5+i*.18,3.6+i*.18)); f.style.transform=`translateY(${L(260,0,e)}px) translateX(${Math.sin(t*.8+i)*12}px)`;
    op(f,e*(t<9?1:.8)); f.querySelectorAll('circle').forEach(c=>c.style.opacity=(t>3.6+i*.2?.6+.4*Math.sin(t*5+i):0));
  });
  // pumpkins ignite
  [['pumpL',2.75],['pumpR',2.95]].forEach(([id,t0])=>{
    const e=E.back(P(t,t0,t0+.4)); $(id).style.transform=`scale(${e})`; $(id).style.transformOrigin='50% 100%';
    $(id).querySelector('.pface').style.opacity=t>t0+.2?(.75+.25*Math.sin(t*23+t0*9)*Math.sin(t*7)):0;
    $(id).style.filter=`drop-shadow(0 0 ${t>t0+.2?30+10*Math.sin(t*17):0}px rgba(255,140,30,.7))`;
  });
  // skull rises, eyes glow on the beat
  const sk=E.out3(P(t,3.6,4.4)); $('skull').style.transform=`translateY(${L(500,0,sk)}px)`; op($('skull'),t<9?sk:0);
  $('skull').querySelectorAll('.sk').forEach(c=>c.style.opacity=t>4.2?(.55+.45*Math.abs(Math.sin(t*Math.PI*2))):0);
  // fire
  const fireOn = t<2.4 ? .35 : t<4.0 ? L(.35,1,E.out3(P(t,3.9,4.6))) : 1;
  document.querySelectorAll('.fl').forEach((f,i)=>{
    const s=fireOn*(.75+.25*Math.sin(t*(9+i)+i*2)+.12*Math.sin(t*23+i));
    f.style.transform=`scaleY(${s}) scaleX(${.9+.1*Math.sin(t*7+i)}) skewX(${Math.sin(t*3+i)*6}deg)`;
  });
  op($('fireglow'),fireOn*(.8+.2*Math.sin(t*11)));
  // embers everywhere after 2.4
  const emOn = t<2.4?.3:1;
  document.querySelectorAll('.em').forEach((el,i)=>{
    const sp=160+rnd(i)*300, x0=rnd(i+40)*1080, y=(1950+rnd(i+80)*1950-t*sp)%2000;
    el.style.left=(x0+Math.sin(t*1.5+i)*40)+'px'; el.style.top=y+'px'; op(el,emOn*(.3+.7*rnd(i+3))*(.6+.4*Math.sin(t*8+i)));
  });

  // ---------------- S1 type
  bleed($('abuja'),t,.9,1.0); if(t>=2.3) op($('abuja'),1-P(t,2.3,2.5));
  const dA=E.out3(P(t,1.3,2.3)); $('dripA').style.transform=`scaleY(${dA})`; op($('dripA'),t<2.5?(t>1.3?1:0):0);
  // ---------------- S2 type
  slam($('w1'),t,2.5,{from:1.5}); slam($('w2'),t,2.75,{from:2.0});
  bleed($('w3'),t,3.3,.7);
  for(const id of ['w1','w2','w3']) if(t>=4.85) op($(id),1-P(t,4.85,5.0));

  // ---------------- S3 / S5: the flyer
  const fly=$('flyer');
  if(t<9){
    // tight on FirstKlaz, slow creep, thunder at 6.55 -> pull back to reveal the title
    const push=L(2.35,2.5,P(t,5.0,6.5)), pull=E.io3(P(t,6.55,8.7));
    const s=L(push,1.22,pull);
    const tx=L(540-587,0,pull), ty=L(960-846,-60,pull);
    fly.style.transform=`translate(${tx}px,${ty}px) scale(${s})`;
  } else {
    const s=L(1.08,1.0,E.out3(P(t,11.4,15)));
    fly.style.transform=`translate(0px,0px) scale(${s})`;
  }
  op($('flick'),.5+.35*Math.sin(t*13)*Math.sin(t*5.3));

  // ---------------- S4 details
  slam($('d1'),t,9.0,{from:1.9}); slam($('d1b'),t,9.25,{from:2.2}); slam($('d2'),t,9.55,{from:2.0}); slam($('d3'),t,10.05,{from:1.6});
  bleed($('d4'),t,10.6,.5);
  const dD=E.out3(P(t,10.8,11.4)); $('dripD').style.transform=`scaleY(${dD})`; op($('dripD'),t>10.8&&t<11.4?1:0);
  for(const id of ['d1','d1b','d2','d3','d4']) if(t>=11.35||t<9) op($(id),t<9?0:1-P(t,11.35,11.45));

  // fade to black at the very end
  op($('black'),P(t,14.6,15.0)*.85);
}
window.render=render;
"""


def render_frames():
    os.makedirs(SCRATCH, exist_ok=True)
    hp = os.path.join(HERE, '_promo.html')
    open(hp, 'w').write(html())
    js = os.path.join(HERE, '_shoot.js')
    open(js, 'w').write(f"""const {{chromium}}=require('playwright');(async()=>{{const b=await chromium.launch();
const p=await b.newPage({{viewport:{{width:{W},height:{H}}}}});await p.goto('file://{hp}');await p.evaluate(()=>document.fonts.ready);
await p.waitForTimeout(800);const n={int(FPS * DUR)};const only=process.argv.slice(2).map(Number);
for(let f=0;f<n;f++){{ if(only.length&&!only.includes(f)) continue; await p.evaluate(t=>render(t),f/{FPS});
await p.screenshot({{path:'{SCRATCH}/f_'+String(f).padStart(4,'0')+'.jpg',type:'jpeg',quality:94}});}}
await b.close();}})();""")
    subprocess.run(['node', js] + sys.argv[2:], check=True)


# ------------------------------------------------------------------ sound design
SR = 44100


def audio(path):
    from scipy.signal import butter, lfilter
    n = int(SR * DUR)
    out = np.zeros(n)
    rng = np.random.default_rng(13)
    tt = lambda d: np.arange(int(SR * d)) / SR

    def put(sig, t0, g=1.0):
        i = int(t0 * SR)
        if i >= n:
            return
        sig = sig[:n - i]
        out[i:i + len(sig)] += sig * g

    filt = lambda kind, f, x: lfilter(*butter(2, np.array(f) / (SR / 2), kind), x)

    def drone(d):
        t = tt(d)
        x = (np.sin(2 * np.pi * 55 * t) + .8 * np.sin(2 * np.pi * 58.3 * t) + .4 * np.sin(2 * np.pi * 82.4 * t)) * .25
        wind = filt('band', [200, 900], rng.normal(0, 1, len(t))) * (.5 + .5 * np.sin(2 * np.pi * .3 * t)) * .25
        env = np.minimum(1, t / 1.5)
        return (x + wind) * env

    def heartbeat():
        t = tt(.35)
        thump = lambda: np.sin(2 * np.pi * (45 + 40 * np.exp(-t * 30)) * t) * np.exp(-t * 14)
        x = np.zeros(int(SR * .6)); a = thump(); x[:len(a)] += a; x[int(SR * .2):int(SR * .2) + len(a)] += a * .7
        return x

    def thunder(d=2.2):
        t = tt(d)
        crack = filt('high', 1500, rng.normal(0, 1, len(t))) * np.exp(-t * 18) * .8
        rumble = filt('low', 180, rng.normal(0, 1, len(t))) * (1 - np.exp(-t * 8)) * np.exp(-t * 1.6) * 3
        return crack + rumble

    def bell(f, d=1.4):
        t = tt(d)
        return (np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * f * 2.76 * t) + .25 * np.sin(2 * np.pi * f * 5.4 * t)) * np.exp(-t * 3) * .22

    def clang():
        t = tt(1.2)
        parts = [(310, 1), (777, .7), (1260, .5), (1984, .35), (3150, .2)]
        x = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * (3 + f / 900)) for f, a in parts)
        return x * .35 + filt('high', 2000, rng.normal(0, 1, len(t))) * np.exp(-t * 40) * .3

    def whoosh(d=.8, up=True):
        t = tt(d); x = rng.normal(0, 1, len(t)); y = np.zeros_like(x)
        bands = np.linspace(300, 4000, 10) if up else np.linspace(4000, 300, 10)
        for k, f in enumerate(bands):
            seg = slice(int(len(x) * k / 10), int(len(x) * (k + 1) / 10))
            y[seg] = filt('band', [f * .7, f * 1.3], x)[seg]
        return y * np.sin(np.pi * t / d) * .5

    def boom():
        t = tt(1.6)
        return np.sin(2 * np.pi * np.cumsum(32 + 80 * np.exp(-t * 8)) / SR) * np.exp(-t * 2.4)

    def kick808(d=.7, f0=58):
        t = tt(d)
        return np.tanh(2 * np.sin(2 * np.pi * np.cumsum(f0 + 120 * np.exp(-t * 30)) / SR) * np.exp(-t * 3.5)) * .9

    def hat(d=.05):
        t = tt(d)
        return filt('high', 7000, rng.normal(0, 1, len(t))) * np.exp(-t * 90) * .2

    def clap():
        t = tt(.25)
        x = filt('band', [900, 2500], rng.normal(0, 1, len(t)))
        env = np.exp(-t * 25) + .6 * np.exp(-np.abs(t - .012) * 400) + .5 * np.exp(-np.abs(t - .024) * 400)
        return x * env * .45

    put(drone(15), 0, .9)
    for tb in (.0, 1.0, 1.85, 2.55, 3.15, 3.7, 4.2, 4.6):          # heartbeat accelerating into the drop
        put(heartbeat(), tb, .9)
    for s in (.35, .55, 5.0, 6.55, 11.4):
        put(thunder(), s, .75 if s > 1 else .6)
    melody = [(.9, 440), (1.2, 523.3), (1.5, 659.3), (1.8, 622.3), (2.1, 493.9)]    # creepy music-box line (A minor, with a flat 6 sting)
    for tm, f in melody:
        put(bell(f), tm, .9)
    put(clang(), 2.5, .8); put(clang(), 2.75, .9)
    put(whoosh(1.1), 2.45, .7); put(whoosh(.9, False), 3.3, .5)
    put(whoosh(.6), 4.4, .9)
    put(boom(), 5.0, 1.0)
    # the drop: half-time 808 groove, 140 BPM feel
    beat = 60 / 140
    t0 = 5.0
    k = 0
    while t0 + k * beat < 14.4:
        tb = t0 + k * beat
        if k % 4 in (0, 3) or (k % 8 == 6):
            put(kick808(f0=58 if k % 8 < 4 else 52), tb, .85)
        if k % 4 == 2:
            put(clap(), tb, .9)
        for h in range(2):
            put(hat(), tb + h * beat / 2, 1 if h == 0 else .6)
        if k % 8 == 7:                                                 # hi-hat roll into each bar
            for r in range(4):
                put(hat(.03), tb + beat / 2 + r * beat / 8, .7)
        k += 1
    for s in (9.0, 9.55, 10.05):
        put(clang(), s, .8)
    put(whoosh(.6), 10.8, .8)
    put(boom(), 11.4, 1.0)
    for tm, f in [(12.4, 440), (12.7, 523.3), (13.0, 659.3), (13.3, 622.3)]:
        put(bell(f), tm, .6)
    fade = np.ones(n); fe = int(SR * .9); fade[-fe:] = np.linspace(1, 0, fe)
    out = np.tanh(out * 1.3) * fade
    out = out / np.max(np.abs(out)) * .8
    import wave
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.stack([out, out], 1) * 32767).astype('<i2').tobytes())


def encode():
    os.makedirs(OUT, exist_ok=True)
    wav = os.path.join(HERE, '_bed.wav')
    audio(wav)
    silent = os.path.join(OUT, 'FirstKlaz-Meating_Story-Promo_15s_NO-AUDIO.mp4')
    final = os.path.join(OUT, 'FirstKlaz-Meating_Story-Promo_15s.mp4')
    v = ['-framerate', str(FPS), '-i', f'{SCRATCH}/f_%04d.jpg']
    enc = ['-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart']
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error'] + v + enc + [silent], check=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error'] + v + ['-i', wav] + enc +
                   ['-af', 'alimiter=limit=0.8:level=false,volume=-2dB', '-c:a', 'aac', '-b:a', '192k', '-shortest', final], check=True)
    shutil.copy(f'{SCRATCH}/f_{int(10.9 * FPS):04d}.jpg', os.path.join(OUT, 'FirstKlaz-Meating_Story-Promo_poster.jpg'))
    os.remove(wav)
    print('ok', final)


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'frames':
        render_frames()
    else:
        render_frames(); encode()
