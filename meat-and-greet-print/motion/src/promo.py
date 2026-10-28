"""FIRSTKLAZ MEATING - 15s Instagram story promo (1080x1920, 30fps).

python3 promo.py  ->  ../export/FirstKlaz-Meating_Story-Promo_15s.mp4 (+ silent version, poster frame)

Pipeline: one HTML page with a deterministic render(t) function -> Playwright seeks every frame
-> ffmpeg encodes H.264. Audio is synthesised in code (no licensed music): kick, shaker,
talking-drum pitch bends, risers and impacts, cut to the same 120 BPM grid as the edit.

STORYBOARD (120 BPM, 1 beat = 0.5s)
 0.0-2.0  HOOK      embers rise, flame ignites, "ABUJA," slams, "SOMETHING'S ON THE GRILL."
 2.0-5.0  ARTIST    red wipe -> FirstKlaz portrait push-in, FIRSTKLAZ brush slam with RGB split
 5.0-8.5  ENERGY    4 whip-pan cuts on the beat (Meat & Greet crowd): SUYA. SMOKE. COSTUMES. THE CROWD.
 8.5-11.5 LOCKUP    logo drop, FIRSTKLAZ / MEATING brush-reveal, HALLOWEEN BBQ PARTY
11.5-15.0 SELL      SAT 31 OCT / DOXA PARK, ABUJA / 5PM - ticket stub slides in and pulses on the beat
"""
import json
import os
import shutil
import subprocess
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'firstklaz-carousel', 'src'))
from carousel import FONTS, LOGO  # noqa: E402

PHOTOS = os.path.join(ROOT, 'firstklaz-carousel', 'src', 'photos')
GRAIN = os.path.join(ROOT, 'firstklaz-carousel', 'src', 'grain.png')
TEX = os.path.join(ROOT, 'build', 'tex')
OUT = os.path.abspath(os.path.join(HERE, '..', 'export'))
FPS, DUR, W, H = 30, 15.0, 1080, 1920
SCRATCH = os.environ.get('PROMO_TMP', os.path.join(HERE, '_frames'))

PH = lambda n: 'file://' + os.path.join(PHOTOS, n)

CSS = f"""
@font-face{{font-family:Anton;src:url(file://{FONTS}/Anton.ttf)}}
@font-face{{font-family:Brush;src:url(file://{FONTS}/SedgwickAveDisplay.ttf)}}
@font-face{{font-family:Mono;font-weight:600;src:url(file://{FONTS}/PlexMono-600.ttf)}}
*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{width:{W}px;height:{H}px;background:#0B0909;overflow:hidden}}
#stage{{position:relative;width:{W}px;height:{H}px;overflow:hidden;background:#0B0909;color:#EFE6D6}}
.L{{position:absolute;inset:0;will-change:transform,opacity}}
.a{{position:absolute}}
.ph{{position:absolute;inset:-4%;background-size:cover;background-position:center;filter:sepia(.16) saturate(.95) contrast(1.08)}}
.anton{{font-family:Anton;text-transform:uppercase;line-height:.92}}
.brush{{font-family:Brush;line-height:1}}
.mono{{font-family:Mono;font-weight:600;text-transform:uppercase;letter-spacing:.2em}}
.c{{left:0;width:{W}px;text-align:center}}
.mg-keyline{{fill:#fff}}.mg-panel{{fill:#0B0909}}.mg-amp{{fill:#D81E1E}}.mg-flame{{fill:#F05A28}}.mg-steak{{fill:#A3171E}}
svg{{display:block}}
"""

FLAME = ("M50,2 C58,20 72,26 74,46 C80,38 82,30 80,22 C94,38 98,58 92,76 C86,92 70,100 50,100 C30,100 14,92 8,76 "
         "C2,58 8,42 18,32 C18,42 22,50 28,54 C26,36 38,22 50,2 Z")
FLAME_IN = "M50,40 C55,52 64,58 64,72 C64,84 58,92 50,92 C42,92 36,86 36,76 C36,66 42,62 44,56 C46,64 50,66 52,64 C50,56 48,48 50,40 Z"


def logo(w):
    return LOGO.replace('<svg ', f'<svg width="{w}" height="{w * 761.8 / 959.2:.0f}" ', 1)


def border():
    """Kaftan-embroidery border, drawn as one long strip per side so it can 'stitch' in."""
    T = 26
    def strip(n, vertical):
        cells = []
        for i in range(n):
            o = i * T
            x, y = (0, o) if vertical else (o, 0)
            s = T / 44
            g = f'<g transform="translate({x},{y}) scale({s})">'
            if i % 2 == 0:
                g += ('<rect x="5" y="5" width="34" height="34" fill="none" stroke="#7a3a2c" stroke-width="3"/>'
                      '<path d="M22,10 L34,22 L22,34 L10,22 Z" fill="#B3121C"/>')
            else:
                g += '<path d="M5,8 L22,20 L39,8 M5,22 L22,34 L39,22" fill="none" stroke="#E0592A" stroke-width="3"/>'
            cells.append(g + '</g>')
        return ''.join(cells)
    nh, nv = W // T + 1, H // T + 1
    return (f'<div id="bTop" class="a" style="left:0;top:0;width:{W}px;height:{T}px;background:#120E0C;overflow:hidden"><svg width="{W}" height="{T}">{strip(nh, False)}</svg></div>'
            f'<div id="bBot" class="a" style="left:0;bottom:0;width:{W}px;height:{T}px;background:#120E0C;overflow:hidden"><svg width="{W}" height="{T}">{strip(nh, False)}</svg></div>'
            f'<div id="bL" class="a" style="left:0;top:0;width:{T}px;height:{H}px;background:#120E0C;overflow:hidden"><svg width="{T}" height="{H}">{strip(nv, True)}</svg></div>'
            f'<div id="bR" class="a" style="right:0;top:0;width:{T}px;height:{H}px;background:#120E0C;overflow:hidden"><svg width="{T}" height="{H}">{strip(nv, True)}</svg></div>')


def html():
    embers = ''.join(f'<div class="a em" style="width:{4 + (i * 7) % 7}px;height:{4 + (i * 7) % 7}px;border-radius:50%;'
                     f'background:{"#F6A13A" if i % 3 else "#E0592A"};box-shadow:0 0 12px #E0592A"></div>' for i in range(46))
    crowd = [('crowd-red-suya.jpg', '50% 100%', '1700px auto', 'SUYA.'), ('crowd-skewer.jpg', '50% 40%', 'cover', 'SMOKE.'),
             ('crowd-red-group.jpg', '50% 25%', 'cover', 'COSTUMES.'), ('crowd-singing.jpg', '58% 30%', 'cover', 'THE CROWD.')]
    cuts = ''.join(f'<div id="cut{i}" class="L" style="opacity:0;overflow:hidden"><div class="ph" style="background-image:url({PH(f)});background-position:{pos};background-size:{sz}"></div>'
                   f'<div class="L" style="background:linear-gradient(180deg,rgba(11,9,9,.45),rgba(11,9,9,0) 30%,rgba(11,9,9,0) 60%,rgba(11,9,9,.7))"></div>'
                   f'<div id="word{i}" class="a anton c" style="top:1180px;font-size:200px;color:#EFE6D6;text-shadow:0 10px 40px rgba(0,0,0,.6)">{w}</div></div>'
                   for i, (f, pos, sz, w) in enumerate(crowd))
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>
<div id="stage"><div id="cam" class="L">

<!-- S1 HOOK -->
<div id="s1" class="L">
  <div id="glow1" class="L" style="background:radial-gradient(ellipse 60% 40% at 50% 68%, rgba(224,89,42,.55), rgba(179,18,28,.25) 40%, rgba(11,9,9,0) 75%)"></div>
  <div id="flame" class="a" style="left:{W / 2 - 110}px;top:1230px;width:220px;height:224px">
    <svg width="220" height="224" viewBox="0 0 100 102"><path d="{FLAME}" fill="#E0592A"/><path d="{FLAME_IN}" fill="#F6A13A"/></svg></div>
  <div id="abuja" class="a anton c" style="top:430px;font-size:250px">Abuja,</div>
  <div id="l1" class="a brush c" style="top:700px;font-size:130px">Something&rsquo;s</div>
  <div id="l2" class="a brush c" style="top:830px;font-size:130px">on the</div>
  <div id="l3" class="a brush c" style="top:950px;font-size:170px;color:#B3121C;text-shadow:0 0 40px rgba(179,18,28,.6)">grill.</div>
</div>

<!-- S2 ARTIST -->
<div id="s2" class="L" style="opacity:0;overflow:hidden">
  <div id="p2" class="ph" style="background-image:url({PH('fk-silver-portrait.jpg')});background-position:50% 22%"></div>
  <div class="L" style="background:linear-gradient(180deg,rgba(11,9,9,.5) 0%,rgba(11,9,9,0) 25%,rgba(11,9,9,0) 50%,rgba(11,9,9,.85) 72%,#0B0909 92%)"></div>
  <div id="sweep" class="L" style="background:linear-gradient(105deg,rgba(255,255,255,0) 40%,rgba(255,236,210,.28) 50%,rgba(255,255,255,0) 60%);mix-blend-mode:screen"></div>
  <div id="fk" class="a brush c" style="top:1190px;font-size:200px">FirstKlaz</div>
  <div id="live" class="a mono c" style="top:1440px;font-size:34px;color:#E0592A"></div>
</div>

<!-- S3 ENERGY -->
<div id="s3" class="L" style="opacity:0">{cuts}</div>

<!-- S4 LOCKUP -->
<div id="s4" class="L" style="opacity:0;overflow:hidden">
  <div id="p4" class="ph" style="background-image:url({PH('fk-brown-profile.jpg')});background-position:58% 20%;filter:sepia(.25) contrast(1.1) brightness(.32) blur(4px)"></div>
  <img class="L" src="file://{TEX}/smoke_red.png" style="width:100%;height:60%;top:45%;object-fit:fill;opacity:.95">
  <div class="L" style="background:radial-gradient(ellipse 70% 40% at 50% 50%, rgba(179,18,28,.35), rgba(11,9,9,.2) 70%)"></div>
  <div id="logo4" class="a" style="left:{W / 2 - 200}px;top:330px">{logo(400)}</div>
  <div id="m1" class="a brush c" style="top:760px;font-size:210px">FirstKlaz</div>
  <div id="m2" class="a brush c" style="top:960px;font-size:230px;color:#B3121C;text-shadow:0 0 50px rgba(179,18,28,.55)">Meating</div>
  <div id="hb" class="a anton c" style="top:1250px;font-size:64px;color:#EFE6D6">Halloween BBQ Party</div>
</div>

<!-- S5 SELL -->
<div id="s5" class="L" style="opacity:0;overflow:hidden">
  <img class="L" src="file://{TEX}/board_black.jpg" style="width:100%;height:100%;object-fit:cover">
  <div id="p5" class="a" style="left:0;top:0;width:{W}px;height:860px;overflow:hidden">
    <div class="ph" style="background-image:url({PH('fk-blue-seated.jpg')});background-position:50% 28%"></div>
    <div class="L" style="background:linear-gradient(180deg,rgba(11,9,9,.45),rgba(11,9,9,0) 30%,rgba(11,9,9,.2) 70%,#0B0909)"></div></div>
  <div id="d1" class="a anton" style="left:72px;top:800px;font-size:190px">Sat 31 Oct</div>
  <div id="d2" class="a anton" style="left:72px;top:990px;font-size:96px;color:#E0592A">Doxa Park, Abuja</div>
  <div id="d3" class="a anton" style="left:72px;top:1100px;font-size:96px">5PM &middot; 18+</div>
  <div id="tix" class="a" style="left:72px;top:1260px;width:936px;height:170px;display:flex">
    <div style="flex:1;background:#B3121C;display:flex;flex-direction:column;justify-content:center;padding:0 40px;-webkit-mask:radial-gradient(circle 20px at 100% 50%,transparent 98%,#000)">
      <div class="anton" style="font-size:84px">Get tickets</div>
      <div class="mono" style="font-size:30px;letter-spacing:.06em;margin-top:6px">pv.rsvp/firstklaz-meating</div></div>
    <div style="width:0;border-left:4px dashed #0B0909"></div>
    <div style="width:200px;background:#B3121C;display:flex;align-items:center;justify-content:center;-webkit-mask:radial-gradient(circle 20px at 0 50%,transparent 98%,#000)">
      <div class="anton" style="font-size:66px">31.10</div></div></div>
  <div id="logo5" class="a" style="left:72px;top:150px">{logo(200)}</div>
</div>

<!-- persistent -->
<div id="embers" class="L" style="pointer-events:none">{embers}</div>
<div id="wipe" class="a" style="left:-10%;width:120%;height:130%;top:130%;background:#B3121C;transform:skewY(-8deg)"></div>
<div id="wipe2" class="a" style="left:-10%;width:120%;height:130%;top:130%;background:#0B0909;transform:skewY(-8deg)"></div>
</div>
<img id="grain" class="L" src="file://{GRAIN}" style="width:130%;height:130%;opacity:.16;mix-blend-mode:overlay">
<div class="L" style="background:radial-gradient(ellipse 85% 70% at 50% 50%, rgba(0,0,0,0) 60%, rgba(0,0,0,.55))"></div>
<div id="flash" class="L" style="background:#FFF4E6;opacity:0"></div>
{border()}
</div>
<script>{JS}</script></body></html>"""


JS = r"""
const $ = id => document.getElementById(id);
const cl = (x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const P = (t,a,b)=>cl((t-a)/(b-a));
const L = (a,b,x)=>a+(b-a)*x;
const E = {
  out3:x=>1-Math.pow(1-x,3), in3:x=>x*x*x, io3:x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2,
  outX:x=>x===1?1:1-Math.pow(2,-10*x), inX:x=>x===0?0:Math.pow(2,10*x-10),
  back:x=>{const c1=2.2,c3=c1+1;return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2)},
};
function rnd(i){const s=Math.sin(i*127.1+311.7)*43758.5453;return s-Math.floor(s);}
function show(el,on){el.style.opacity=on?1:0;}
// slam: big -> settle, with motion blur and RGB split decay
function slam(el,t,t0,{dur=.32,from=1.9,rgb=true,rot=0}={}){
  if(t<t0){el.style.opacity=0;return;}
  const x=P(t,t0,t0+dur), e=E.outX(x);
  el.style.opacity=cl(x*4);
  el.style.transform=`scale(${L(from,1,e)}) rotate(${L(rot*2,rot,e)}deg)`;
  el.style.filter=`blur(${L(14,0,E.out3(P(t,t0,t0+dur*.8)))}px)`;
  if(rgb){const k=Math.max(0,1-P(t,t0,t0+.6))*16; el.style.textShadow=k>.2?`${k}px 0 rgba(179,18,28,.9), ${-k}px 0 rgba(224,89,42,.7)`:'';}
}
function rise(el,t,t0,{dur=.45,dy=90}={}){
  if(t<t0){el.style.opacity=0;return;}
  const e=E.out3(P(t,t0,t0+dur)); el.style.opacity=e; el.style.transform=`translateY(${L(dy,0,e)}px)`;
}
function reveal(el,t,t0,dur=.5){ // brush wipe left->right
  const e=E.io3(P(t,t0,t0+dur)); el.style.opacity=t<t0?0:1;
  el.style.clipPath=`inset(-20% ${L(100,0,e)}% -20% 0)`;
}
const SLAMS=[.5,2.55,5.0,5.875,6.75,7.625,8.65,11.55,12.7];
function render(t){
  // camera shake from impacts
  let sx=0,sy=0;
  for(const s of SLAMS){ if(t>=s){const d=t-s, a=Math.exp(-d*11)*14; sx+=a*Math.sin(d*70); sy+=a*Math.cos(d*55);} }
  $('cam').style.transform=`translate(${sx}px,${sy}px)`;
  // grain jitter
  $('grain').style.transform=`translate(${-rnd(Math.floor(t*30))*20}%,${-rnd(Math.floor(t*30)+9)*20}%)`;
  // border stitches in over the first second
  const b=E.out3(P(t,.1,1.1));
  $('bTop').style.clipPath=`inset(0 ${100-b*100}% 0 0)`; $('bBot').style.clipPath=`inset(0 0 0 ${100-b*100}%)`;
  $('bL').style.clipPath=`inset(${100-b*100}% 0 0 0)`; $('bR').style.clipPath=`inset(0 0 ${100-b*100}% 0)`;
  // embers (visible in S1, S4)
  const emOn = (t<2.2?1:0) + (t>8.5&&t<11.6?1:0);
  document.querySelectorAll('.em').forEach((el,i)=>{
    const sp=180+rnd(i)*320, x0=rnd(i+50)*1080, y=(1900+rnd(i+90)*1900 - t*sp)%1950;
    el.style.left=(x0+Math.sin(t*1.7+i)*30)+'px'; el.style.top=y+'px';
    el.style.opacity=emOn*(.35+.65*rnd(i+7))*(.6+.4*Math.sin(t*9+i));
  });
  // flash on cuts
  let fl=0; for(const s of [2.3,5.0,5.875,6.75,7.625,8.65,11.55]) if(t>=s) fl=Math.max(fl,1-P(t,s,s+.12));
  $('flash').style.opacity=fl*.55;

  // ---------- S1 HOOK 0-2.3
  show($('s1'),t<2.3);
  const fi=E.back(P(t,.25,.75)); const flick=.92+.08*Math.sin(t*37)+.05*Math.sin(t*61);
  $('flame').style.transform=`scale(${fi*flick})`; $('flame').style.opacity=cl(P(t,.25,.45));
  $('glow1').style.opacity=cl(P(t,.25,.9))*flick;
  slam($('abuja'),t,.5);
  slam($('l1'),t,1.0,{from:1.4,rgb:false}); slam($('l2'),t,1.25,{from:1.4,rgb:false}); slam($('l3'),t,1.5,{from:2.2,rot:-3});

  // wipe 1 (red) 2.0-2.45
  const w1=E.io3(P(t,1.95,2.45)); $('wipe').style.top=L(130,-150,w1)+'%';

  // ---------- S2 ARTIST 2.2-5.1
  show($('s2'),t>=2.2&&t<5.1);
  $('p2').style.transform=`scale(${L(1.22,1.04,E.out3(P(t,2.2,5.0)))})`;
  $('sweep').style.transform=`translateX(${L(-110,110,E.io3(P(t,2.9,3.9)))}%)`;
  slam($('fk'),t,2.55,{from:2.4});
  const live='LIVE · 31.10 · ABUJA'; const n=Math.floor(P(t,3.1,3.9)*live.length);
  $('live').textContent=live.slice(0,n)+(t>3.1&&Math.floor(t*6)%2?'_':'');
  // exit: whip left 4.85-5.0
  const ex2=E.inX(P(t,4.85,5.0)); $('s2').style.transform=`translateX(${-ex2*110}%)`; $('s2').style.filter=`blur(${ex2*30}px)`;

  // ---------- S3 ENERGY 5.0-8.65 : whip cuts every 0.875s
  show($('s3'),t>=4.85&&t<8.7);
  for(let i=0;i<4;i++){
    const c=$('cut'+i), t0=5.0+i*.875, t1=t0+.875;
    const on=t>=t0-.15&&t<t1+.02; c.style.opacity=on?1:0;
    const enter=E.outX(P(t,t0-.15,t0+.1)), exit=E.inX(P(t,t1-.12,t1));
    const dir=i%2?-1:1;
    c.style.transform=`translateX(${(1-enter)*dir*100 - exit*dir*100}%) scale(${L(1.0,1.08,P(t,t0,t1))})`;
    c.style.filter=`blur(${(1-enter)*30+exit*30}px)`;
    slam($('word'+i),t,t0+.08,{from:1.7,rot:i%2?3:-3});
  }

  // wipe 2 (black) 8.35-8.8
  const w2=E.io3(P(t,8.3,8.8)); $('wipe2').style.top=L(130,-150,w2)+'%';

  // ---------- S4 LOCKUP 8.55-11.7
  show($('s4'),t>=8.55&&t<11.7);
  $('p4').style.transform=`scale(${L(1.15,1.0,E.out3(P(t,8.55,11.5)))})`;
  const lg=E.back(P(t,8.65,9.05)); $('logo4').style.transform=`translateY(${L(-700,0,lg)}px) rotate(${L(-12,0,lg)}deg)`;
  reveal($('m1'),t,9.1,.45); reveal($('m2'),t,9.5,.5);
  const hb=E.out3(P(t,10.1,10.7)); $('hb').style.opacity=hb; $('hb').style.letterSpacing=L(.6,.12,hb)+'em';

  // wipe 3 (red) 11.3-11.75
  const w3=E.io3(P(t,11.25,11.75)); $('wipe').style.top = t>5? L(130,-150,w3)+'%' : $('wipe').style.top;

  // ---------- S5 SELL 11.5-15
  show($('s5'),t>=11.5);
  $('p5').firstElementChild.style.transform=`scale(${L(1.18,1.05,E.out3(P(t,11.5,15)))})`;
  slam($('d1'),t,11.55,{from:1.6});
  rise($('d2'),t,11.95); rise($('d3'),t,12.2);
  const tx=E.back(P(t,12.55,12.95));
  let pulse=0; for(let k=13.5;k<15;k+=.5) if(t>=k) pulse=Math.max(pulse,1-P(t,k,k+.3));
  $('tix').style.transform=`translateY(${L(500,0,tx)}px) scale(${1+pulse*.035})`; $('tix').style.opacity=t>=12.55?1:0;
  rise($('logo5'),t,12.9,{dy:-40});
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
await p.waitForTimeout(600);const n={int(FPS * DUR)};const only=process.argv.slice(2).map(Number);
for(let f=0;f<n;f++){{ if(only.length&&!only.includes(f)) continue; await p.evaluate(t=>render(t),f/{FPS});
await p.screenshot({{path:'{SCRATCH}/f_'+String(f).padStart(4,'0')+'.jpg',type:'jpeg',quality:94}});}}
await b.close();}})();""")
    subprocess.run(['node', js] + sys.argv[2:], check=True)


# ------------------------------------------------------------------ audio
SR = 44100


def audio(path):
    from scipy.signal import butter, lfilter
    n = int(SR * DUR)
    out = np.zeros(n)
    rng = np.random.default_rng(7)
    tt = lambda d: np.arange(int(SR * d)) / SR

    def put(sig, t0, gain=1.0):
        i = int(t0 * SR)
        if i >= n:
            return
        sig = sig[:n - i]
        out[i:i + len(sig)] += sig * gain

    def bp(x, lo, hi):
        b, a = butter(2, [lo / (SR / 2), hi / (SR / 2)], 'band')
        return lfilter(b, a, x)

    def hp(x, f):
        b, a = butter(2, f / (SR / 2), 'high')
        return lfilter(b, a, x)

    def lp(x, f):
        b, a = butter(2, f / (SR / 2), 'low')
        return lfilter(b, a, x)

    def kick(g=1.0):
        t = tt(.45); f = 48 + 110 * np.exp(-t * 28)
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7) * g

    def boom():
        t = tt(1.8); f = 34 + 70 * np.exp(-t * 9)
        body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.6)
        crash = lp(rng.normal(0, 1, len(t)), 3500) * np.exp(-t * 4) * .35
        return body + crash

    def talking_drum(f0, f1, dur=.32):
        """Pitch glide = the talking drum's 'speech' (dundun / kalangu)."""
        t = tt(dur); f = f1 + (f0 - f1) * np.exp(-t * 9)
        tone = np.sin(2 * np.pi * np.cumsum(f) / SR) + .3 * np.sin(4 * np.pi * np.cumsum(f) / SR)
        slap = bp(rng.normal(0, 1, len(t)), 800, 3000) * np.exp(-t * 60) * .5
        return (tone * np.exp(-t * 7) + slap) * .55

    def shaker(acc=1.0):
        t = tt(.09)
        return hp(rng.normal(0, 1, len(t)), 6000) * np.exp(-t * 55) * .18 * acc

    def riser(dur):
        t = tt(dur); x = rng.normal(0, 1, len(t))
        sweep = np.zeros_like(x)
        for k, (lo, hi) in enumerate(np.linspace([300, 900], [3000, 9000], 8)):
            seg = slice(int(len(x) * k / 8), int(len(x) * (k + 1) / 8))
            sweep[seg] = bp(x, lo, hi)[seg]
        return sweep * (t / dur) ** 2 * .45

    def crackle(dur):
        x = np.zeros(int(SR * dur))
        for _ in range(int(dur * 40)):
            i = rng.integers(0, len(x) - 400)
            x[i:i + 300] += hp(rng.normal(0, 1, 300), 2500) * np.exp(-np.arange(300) / 40) * rng.uniform(.1, .5)
        return x * .5

    put(crackle(2.4), 0, .6)                                 # fire under the hook
    put(boom(), .5, .9)                                      # ABUJA,
    for k, tk in enumerate((1.0, 1.25, 1.5)):                # SOMETHING'S / ON THE / GRILL
        put(talking_drum(260 - k * 20, 150 - k * 15), tk, .9)
    put(riser(.5), 1.55, .8)
    groove_start, groove_end = 2.0, 14.5
    beat = .5
    bt = groove_start
    while bt < groove_end:
        put(kick(), bt, .9)
        bt += beat
    st = groove_start
    i = 0
    while st < groove_end:
        put(shaker(1.0 if i % 2 else .6), st + .25 * 0, 1)
        st += .25; i += 1
    pattern = [(0.75, 230, 140), (1.25, 200, 120), (1.5, 260, 150), (1.75, 180, 110)]   # per 2s bar
    bar = groove_start
    while bar < groove_end:
        for off, f0, f1 in pattern:
            if bar + off < groove_end:
                put(talking_drum(f0, f1), bar + off, .8)
        bar += 2.0
    put(boom(), 2.55, .7)                                    # FIRSTKLAZ
    put(riser(.8), 4.2, 1)
    for tk in (5.0, 5.875, 6.75, 7.625):                     # whip cuts
        put(hp(rng.normal(0, 1, int(SR * .18)), 1500) * np.linspace(1, 0, int(SR * .18)) * .35, tk - .12)
        put(boom()[:int(SR * .6)], tk, .45)
    put(riser(.8), 7.85, 1)
    put(boom(), 8.65, .9)                                    # logo drop
    put(riser(.6), 10.95, .8)
    put(boom(), 11.55, .9)                                   # SAT 31 OCT
    put(boom(), 12.7, .6)                                    # ticket
    # mix
    fade = np.ones(n); fe = int(SR * .8); fade[-fe:] = np.linspace(1, 0, fe)
    out = np.tanh(out * 1.2) * fade
    out = out / np.max(np.abs(out)) * .78
    st = np.stack([out, out], 1)
    import wave
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((st * 32767).astype('<i2').tobytes())


def encode():
    os.makedirs(OUT, exist_ok=True)
    wav = os.path.join(HERE, '_bed.wav')
    audio(wav)
    silent = os.path.join(OUT, 'FirstKlaz-Meating_Story-Promo_15s_NO-AUDIO.mp4')
    final = os.path.join(OUT, 'FirstKlaz-Meating_Story-Promo_15s.mp4')
    v = ['-framerate', str(FPS), '-i', f'{SCRATCH}/f_%04d.jpg']
    enc = ['-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart']
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error'] + v + enc + [silent], check=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error'] + v + ['-i', wav] + enc + ['-af', 'alimiter=limit=0.8:level=false', '-c:a', 'aac', '-b:a', '192k', '-shortest', final], check=True)
    shutil.copy(f'{SCRATCH}/f_{int(13.5 * FPS):04d}.jpg', os.path.join(OUT, 'FirstKlaz-Meating_Story-Promo_poster.jpg'))
    os.remove(wav)
    print('ok', final)


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'frames':
        render_frames()
    else:
        render_frames(); encode()
