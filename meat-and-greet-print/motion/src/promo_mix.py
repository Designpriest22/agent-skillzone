"""FIRSTKLAZ MEATING - 15s story promo, MIX edit (1080x1920, 30fps).

Combines the two earlier cuts: FirstKlaz's press portraits, slam typography and the ticket stub
from the first edit, inside the Halloween world of the second (hooks, chains, fire, fog,
lightning, chrome-and-blood type), with bat swarms throughout.

python3 promo_mix.py              -> ../export/FirstKlaz-Meating_Story-Promo_15s_MIX.mp4 (+ silent, poster)
python3 promo_mix.py frames 0 90  -> render only those frames

STORYBOARD
 0.0-2.0  COLD OPEN  lightning, a bat swarm bursts at camera, "Abuja..." bleeds in, DO YOU DARE?
 2.0-4.3  HIM        lightning cut to FirstKlaz (blood-red duotone), FIRSTKLAZ chrome slam, "is haunting the capital"
 4.3-6.5  WICKED     second portrait, SOMETHING / WICKED / "is on the grill."
 6.5-8.4  DRESS CODE three beat-cuts of his looks: COME / DRESSED / TO KILL.
 8.4-11.2 DETAILS    hooks, fire, jack-o'-lanterns: 31ST / OCT / 5PM / DOXA PARK, ABUJA / Halloween BBQ Party
11.2-15.0 LOCKUP     FirstKlaz in a coffin frame, FIRSTKLAZ MEATING, date line, ticket stub pulsing on the beat
"""
import os
import shutil
import subprocess
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.abspath(os.path.join(HERE, '..', '..', 'story-games', 'src')))
import promo  # noqa: E402
from promo import CSS, FLAME, TEX, GRAIN, W, H, FPS, DUR, hook_svg, figure_svg, pumpkin_svg, skull_svg, drips_svg, chrome  # noqa: E402
from stories import frame as embroidery_frame, logo  # noqa: E402

PHOTOS = os.path.abspath(os.path.join(HERE, '..', '..', 'firstklaz-carousel', 'src', 'photos'))
OUT = os.path.abspath(os.path.join(HERE, '..', 'export'))
SCRATCH = os.environ.get('PROMO_TMP', os.path.join(HERE, '_frames_mix'))
PH = lambda n: 'file://' + os.path.join(PHOTOS, n)
NAME = 'FirstKlaz-Meating_Story-Promo_15s_MIX'

MIX_CSS = CSS + """
.spook{position:absolute;inset:-5%;background-size:cover;background-position:center;filter:grayscale(.85) contrast(1.35) brightness(.72)}
.blood{position:absolute;inset:0;background:#B0101A;mix-blend-mode:multiply;opacity:.62}
.rim{position:absolute;inset:0;background:radial-gradient(ellipse 60% 70% at 85% 35%, rgba(255,80,40,.45), rgba(0,0,0,0) 60%);mix-blend-mode:screen}
.shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.7) 0%,rgba(0,0,0,0) 22%,rgba(0,0,0,0) 48%,rgba(0,0,0,.85) 68%,#000 92%)}
.chrome.a{position:absolute}
.mg-keyline{fill:#fff}.mg-panel{fill:#0B0909}.mg-amp{fill:#D81E1E}.mg-flame{fill:#F05A28}.mg-steak{fill:#A3171E}
#pL .spook{filter:grayscale(.7) contrast(1.25) brightness(.95)!important}#pL .blood{opacity:.4}
.bat{position:absolute;left:0;top:0;width:200px;height:100px;filter:drop-shadow(0 0 4px rgba(208,20,30,.65))}
"""

WING = ("M-6,-2 C-20,-22 -48,-30 -96,-14 C-86,-8 -84,0 -82,8 C-72,0 -62,2 -56,12 C-48,2 -38,2 -32,12 "
        "C-26,2 -16,0 -8,8 Z")
BAT = (f'<svg viewBox="-100 -50 200 100" width="200" height="100" style="overflow:visible">'
       f'<g class="wl"><path d="{WING}" fill="#0d0606"/></g><g class="wr"><path d="{WING}" fill="#0d0606"/></g>'
       f'<ellipse cx="0" cy="4" rx="9" ry="16" fill="#0d0606"/><circle cx="0" cy="-10" r="8" fill="#0d0606"/>'
       f'<path d="M-6,-14 L-8,-26 L-1,-16 Z M6,-14 L8,-26 L1,-16 Z" fill="#0d0606"/>'
       f'<circle cx="-3" cy="-11" r="1.6" fill="#ff3b2f"/><circle cx="3" cy="-11" r="1.6" fill="#ff3b2f"/></svg>')
N_BATS = 46

COFFIN = 'polygon(19% 0%, 81% 0%, 100% 26%, 73% 100%, 27% 100%, 0% 26%)'


def photo(id_, name, pos, extra=''):
    return (f'<div id="{id_}" class="L" style="opacity:0;overflow:hidden{extra}"><div class="spook" style="background-image:url({PH(name)});background-position:{pos}"></div>'
            f'<div class="blood"></div><div class="rim"></div><div class="shade"></div></div>')


def html():
    hooks = [(-30, 'ham', 90, .9, .0), (170, None, 150, .8, 1.3), (360, 'rack', 40, .75, .6), (620, None, 110, .8, 2.4),
             (770, None, 60, .85, 2.1), (930, 'ham', 50, .95, 1.7)]
    hk = ''.join(f'<div class="a hook" data-ph="{ph}" data-sc="{sc}" style="left:{x}px;top:-40px;transform-origin:60px 0">{hook_svg(m, ch)}</div>'
                 for x, m, ch, sc, ph in hooks)
    figs = ''.join(f'<div class="a fig" style="left:{x}px;top:{y}px;width:{w}px;height:{w * 7 / 3:.0f}px;filter:blur({b}px)">{figure_svg()}</div>'
                   for x, y, w, b in ((-60, 760, 300, 2.5), (230, 700, 230, 4), (640, 720, 240, 4), (860, 780, 290, 2.5)))
    flames = ''.join(f'<div class="a fl" style="left:{x}px;bottom:{-40 + (i % 3) * 10}px;width:{wd}px;height:{wd * 1.4:.0f}px;transform-origin:50% 100%">'
                     f'<svg viewBox="0 0 100 102" width="100%" height="100%" preserveAspectRatio="none"><defs><linearGradient id="fg{i}" x1="0" y1="1" x2="0" y2="0">'
                     f'<stop offset="0" stop-color="#ffd27a"/><stop offset=".35" stop-color="#ff7a1a"/><stop offset=".8" stop-color="#d0141e"/><stop offset="1" stop-color="#d0141e" stop-opacity="0"/>'
                     f'</linearGradient></defs><path d="{FLAME}" fill="url(#fg{i})"/></svg></div>'
                     for i, (x, wd) in enumerate([(-60, 300), (120, 220), (260, 340), (470, 260), (620, 330), (800, 240), (930, 300), (40, 180), (380, 200), (720, 190)]))
    embers = ''.join(f'<div class="a em" style="width:{3 + i % 5}px;height:{3 + i % 5}px;border-radius:50%;background:{"#ffb347" if i % 3 else "#ff5a1f"};'
                     f'box-shadow:0 0 10px #ff6a1f"></div>' for i in range(50))
    bats = ''.join(f'<div class="bat" id="bat{i}">{BAT}</div>' for i in range(N_BATS))
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{MIX_CSS}</style></head><body>
<div id="stage"><div id="cam" class="L">

<div id="world" class="L">
  <div class="L" style="background:radial-gradient(ellipse 90% 55% at 50% 100%, #3a0906 0%, #120404 45%, #050303 80%)"></div>
  <img id="fogA" class="a" src="file://{TEX}/smoke_bone.png" style="left:-20%;top:900px;width:140%;height:900px;object-fit:fill;opacity:.3">
  <div id="figs" class="L">{figs}</div>
  <div id="hooks" class="L">{hk}</div>
  <div id="pumpL" class="a" style="left:40px;top:1490px;width:230px;height:200px;transform-origin:50% 100%">{pumpkin_svg()}</div>
  <div id="pumpR" class="a" style="left:820px;top:1520px;width:200px;height:174px;transform-origin:50% 100%">{pumpkin_svg()}</div>
  <div id="fireglow" class="L" style="background:radial-gradient(ellipse 80% 30% at 50% 100%, rgba(255,110,20,.75), rgba(208,20,30,.35) 45%, rgba(0,0,0,0) 75%)"></div>
  <div id="fire" class="L" style="filter:blur(2px)">{flames}</div>
  <img id="fogB" class="a" src="file://{TEX}/smoke_red.png" style="left:-20%;top:1150px;width:140%;height:800px;object-fit:fill;opacity:.55">
</div>

{photo('pA', 'fk-silver-portrait.jpg', '50% 18%')}
{photo('pB', 'fk-black-leaning.jpg', '50% 14%')}
{photo('pC', 'fk-brown-profile.jpg', '58% 18%')}
{photo('pD', 'fk-blue-seated.jpg', '50% 26%')}
{photo('pE', 'fk-black-standing.jpg', '50% 30%')}
<img id="fogP" class="a" src="file://{TEX}/smoke_bone.png" style="left:-20%;top:1250px;width:140%;height:700px;object-fit:fill;opacity:0">

<!-- cold open -->
<div id="abuja" class="a c wet" style="top:620px;font-size:210px">Abuja...</div>
<div id="dripA" class="a" style="left:180px;top:805px;transform-origin:50% 0">{drips_svg(720, 240, 14, 3)}</div>
{chrome('Do you dare?', 120, 1010, 'dare')}

<!-- him -->
{chrome('FirstKlaz', 200, 1150, 'fk')}
<div id="haunt" class="a c wet" style="top:1390px;font-size:104px;line-height:.95">is haunting<br>the capital</div>

<!-- wicked -->
{chrome('Something', 150, 1040, 'w1')}
{chrome('Wicked', 210, 1190, 'w2')}
<div id="w3" class="a c wet" style="top:1445px;font-size:110px">is on the grill.</div>

<!-- dress code -->
<div id="k1" class="a c dirt" style="top:1180px;font-size:250px">COME</div>
<div id="k2" class="a c dirt" style="top:1180px;font-size:200px">DRESSED</div>
<div id="k3" class="a c dirt" style="top:1180px;font-size:220px;color:#D0141E;text-shadow:0 0 30px rgba(208,20,30,.6)">TO KILL.</div>

<!-- details -->
<div id="d1" class="a c dirt" style="top:380px;font-size:280px">31ST</div>
<div id="d1b" class="a c dirt" style="top:650px;font-size:280px;color:#D0141E;text-shadow:0 0 30px rgba(208,20,30,.6)">OCT</div>
<div id="d2" class="a c dirt" style="top:935px;font-size:170px">5PM</div>
<div id="d3" class="a c dirt" style="top:1125px;font-size:92px;text-transform:uppercase">Doxa Park, Abuja</div>
<div id="d4" class="a c wet" style="top:1250px;font-size:132px;line-height:.95">Halloween<br>BBQ Party</div>

<!-- lockup -->
<div id="lock" class="L" style="opacity:0">
  <div id="lglow" class="a" style="left:{W / 2 - 330}px;top:300px;width:660px;height:760px;background:radial-gradient(ellipse 50% 50% at 50% 50%, rgba(208,20,30,.7), rgba(0,0,0,0) 70%)"></div>
  <div id="coffin" class="a" style="left:{W / 2 - 260}px;top:350px;width:520px;height:670px;clip-path:{COFFIN};background:#D0141E;padding:10px">
    <div class="L" style="inset:10px;clip-path:{COFFIN};overflow:hidden">{photo('pL', 'fk-silver-portrait.jpg', '50% 20%').replace('opacity:0;', '')}</div></div>
  <div id="lg" class="a" style="left:{W / 2 - 95}px;top:175px;width:190px;height:151px">{logo(190, 0, 0)}</div>
  {chrome('FirstKlaz', 165, 1035, 'l1')}
  <div id="l2" class="a c wet" style="top:1200px;font-size:170px">Meating</div>
  <div id="l3" class="a c dirt" style="top:1395px;font-size:52px">SAT 31 OCT &middot; 5PM &middot; DOXA PARK, ABUJA</div>
  <div id="tix" class="a" style="left:110px;top:1480px;width:860px;height:150px;display:flex">
    <div style="flex:1;background:#B3121C;display:flex;flex-direction:column;justify-content:center;padding:0 36px;-webkit-mask:radial-gradient(circle 18px at 100% 50%,transparent 98%,#000)">
      <div style="font-family:Anton;font-size:70px;line-height:1;text-transform:uppercase">Get tickets</div>
      <div style="font-family:Anton;font-size:30px;letter-spacing:.08em;margin-top:6px;opacity:.95">PV.RSVP/FIRSTKLAZ-MEATING</div></div>
    <div style="width:0;border-left:4px dashed #050303"></div>
    <div style="width:180px;background:#B3121C;display:flex;align-items:center;justify-content:center;-webkit-mask:radial-gradient(circle 18px at 0 50%,transparent 98%,#000)">
      <div style="font-family:Anton;font-size:60px">18+</div></div></div>
</div>

<div id="bats" class="L">{bats}</div>
<div id="embers" class="L">{embers}</div>
</div>
<img id="grain" class="L" src="file://{GRAIN}" style="width:130%;height:130%;opacity:.2;mix-blend-mode:overlay">
<div class="L" style="background:radial-gradient(ellipse 80% 65% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,.75))"></div>
<div id="bolt" class="a" style="left:520px;top:0;opacity:0"><svg width="260" height="900"><path d="M150,0 L90,300 L150,300 L60,620 L120,620 L20,900" fill="none" stroke="#e8efff" stroke-width="8" stroke-linejoin="bevel" style="filter:drop-shadow(0 0 18px #9fb6ff)"/></svg></div>
<div id="flash" class="L" style="background:#eef2ff;opacity:0;mix-blend-mode:screen"></div>
<div id="border" class="L" style="pointer-events:none">{embroidery_frame()}</div>
<div id="black" class="L" style="background:#000;opacity:0"></div>
</div>
<script>{JS}</script></body></html>"""


JS = r"""
const $=id=>document.getElementById(id);
const cl=(x,a=0,b=1)=>Math.min(b,Math.max(a,x)), P=(t,a,b)=>cl((t-a)/(b-a)), L=(a,b,x)=>a+(b-a)*x;
const E={out3:x=>1-Math.pow(1-x,3),io3:x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2,outX:x=>x===1?1:1-Math.pow(2,-10*x),
  back:x=>{const c1=1.9,c3=c1+1;return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2)}};
const rnd=i=>{const s=Math.sin(i*127.1+311.7)*43758.5453;return s-Math.floor(s)};
const op=(el,v)=>el.style.opacity=v;
const LIGHTNING=[[.25,1],[.45,1],[2.0,1],[4.3,1],[6.5,.4],[8.4,1],[11.2,1]];
const HITS=[.25,2.0,2.35,4.3,4.55,4.75,6.5,7.15,7.8,8.4,8.65,8.9,9.2,9.7,11.2,12.0,12.55];
const BEAT=60/140;
function slam(el,t,t0,{dur=.3,from=1.8,blur=16,out=99}={}){
  if(t<t0||t>=out){op(el,0);return}
  const e=E.outX(P(t,t0,t0+dur)); op(el,cl(P(t,t0,t0+dur*.4)));
  el.style.transform=`scale(${L(from,1,e)})`; el.style.filter=`blur(${L(blur,0,e)}px)`;
}
function bleed(el,t,t0,dur=.8,out=99){
  if(t<t0||t>=out){op(el,0);return}
  const e=E.out3(P(t,t0,t0+dur)); op(el,e); el.style.filter=`blur(${L(18,0,e)}px)`; el.style.letterSpacing=L(.12,0,e)+'em';
}
// ---------- bats: 0-27 burst at the camera, 28+ ambient flyers
function bat(i,t){
  const el=$('bat'+i); let x,y,s,vis=1,rot=0;
  if(i<28){
    const t0=.3+rnd(i)*.45, d=.9+rnd(i+5)*.6, p=P(t,t0,t0+d);
    if(t<t0||p>=1){op(el,0);return}
    const a=rnd(i+9)*Math.PI*2, e=p*p;
    x=540+Math.cos(a)*1500*e; y=900+Math.sin(a)*1700*e - 200*p; s=L(.3,3.4,p); rot=Math.cos(a)*25;
  } else {
    const k=i-28, per=4.5+rnd(k)*3, ph=(t/per+rnd(k+20))%1, dir=k%2?1:-1;
    x=dir>0?L(-260,1340,ph):L(1340,-260,ph); y=180+rnd(k+33)*1250+Math.sin(t*2.2+k)*70; s=.7+rnd(k+44)*.8;
    vis = (t>2.0) ? 1 : 0; rot=Math.sin(t*3+k)*12;
  }
  const flap=Math.sin(t*(22+(i%5)*3)+i);
  const fy=.3+.7*flap;
  el.querySelector('.wl').setAttribute('transform',`scale(1,${fy})`);
  el.querySelector('.wr').setAttribute('transform',`scale(-1,${fy})`);
  el.style.transform=`translate(${x-100}px,${y-50}px) scale(${s}) rotate(${rot}deg)`; op(el,vis);
}
const PHOTOS=[['pA',2.0,4.3],['pB',4.3,6.5],['pC',6.5,7.15],['pD',7.15,7.8],['pE',7.8,8.4]];
function render(t){
  // lightning + shake + grain
  let fl=0,bolt=0;
  for(const [s,len] of LIGHTNING){const d=(t-s)/len; if(d>=0&&d<.35){const k=(d<.05?1:d<.09?.25:d<.14?.85:Math.max(0,1-(d-.14)/.2)); fl=Math.max(fl,k); if(d<.16) bolt=1;}}
  op($('flash'),fl*.6); op($('bolt'),bolt*fl); $('bolt').style.left=(t<1?600:t<5?250:t<9?680:420)+'px';
  let sx=0,sy=0; for(const s of HITS){ if(t>=s){const d=t-s,a=Math.exp(-d*10)*12; sx+=a*Math.sin(d*70); sy+=a*Math.cos(d*53);} }
  $('cam').style.transform=`translate(${sx}px,${sy}px)`;
  $('grain').style.transform=`translate(${-rnd(Math.floor(t*30))*20}%,${-rnd(Math.floor(t*30)+5)*20}%)`;
  op($('border'),E.out3(P(t,8.4,8.9)));                          // kaftan border frames the info half

  // world
  const inPhoto = t>=2.0 && t<8.4;
  op($('world'), inPhoto?0:1);
  $('world').style.filter=`brightness(${t<2.0?Math.max(fl,.18+.08*Math.sin(t*3)):1})`;
  document.querySelectorAll('.hook').forEach(h=>{const ph=+h.dataset.ph,sc=+h.dataset.sc;
    h.style.transform=`scale(${sc}) rotate(${Math.sin(t*1.4+ph)*4+Math.sin(t*.6+ph*2)*2}deg)`;});
  $('fogA').style.transform=`translateX(${Math.sin(t*.25)*6-t*1.2}%)`; $('fogB').style.transform=`translateX(${t*1.4-8}%)`;
  document.querySelectorAll('.fig').forEach((f,i)=>{const e=E.out3(P(t,8.5+i*.15,9.4+i*.15));
    f.style.transform=`translateY(${L(260,0,e)}px) translateX(${Math.sin(t*.8+i)*12}px)`; op(f,e*(t<11.2?1:.35));
    f.querySelectorAll('circle').forEach(c=>c.style.opacity=.6+.4*Math.sin(t*5+i));});
  [['pumpL',8.7],['pumpR',8.85]].forEach(([id,t0])=>{const e=E.back(P(t,t0,t0+.4)); $(id).style.transform=`scale(${e})`;
    $(id).querySelector('.pface').style.opacity=t>t0+.2?(.75+.25*Math.sin(t*23+t0*9)*Math.sin(t*7)):0;
    $(id).style.filter=`drop-shadow(0 0 ${t>t0+.2?30+10*Math.sin(t*17):0}px rgba(255,140,30,.7))`;});
  const fireOn = t<2 ? .35 : 1;
  document.querySelectorAll('.fl').forEach((f,i)=>{const s=fireOn*(.75+.25*Math.sin(t*(9+i)+i*2)+.12*Math.sin(t*23+i));
    f.style.transform=`scaleY(${s}) scaleX(${.9+.1*Math.sin(t*7+i)}) skewX(${Math.sin(t*3+i)*6}deg)`;});
  op($('fireglow'),fireOn*(.8+.2*Math.sin(t*11)));
  document.querySelectorAll('.em').forEach((el,i)=>{const sp=160+rnd(i)*300,x0=rnd(i+40)*1080,y=(1950+rnd(i+80)*1950-t*sp)%2000;
    el.style.left=(x0+Math.sin(t*1.5+i)*40)+'px'; el.style.top=y+'px'; op(el,(t<2?.3:1)*(.3+.7*rnd(i+3))*(.6+.4*Math.sin(t*8+i)));});

  // photos: slow push, lightning-lit, red duotone
  for(const [id,a,b] of PHOTOS){
    const on=t>=a&&t<b; op($(id),on?1:0); if(!on) continue;
    const img=$(id).firstElementChild; img.style.transform=`scale(${L(1.12,1.0,E.out3(P(t,a,b)))})`;
    img.style.filter=`grayscale(.85) contrast(1.35) brightness(${.72+fl*.9})`;
  }
  op($('fogP'), inPhoto?.45:0); $('fogP').style.transform=`translateX(${-t*2}%)`;

  // cold open
  bleed($('abuja'),t,.7,.9,2.0); const dA=E.out3(P(t,1.0,1.9)); $('dripA').style.transform=`scaleY(${dA})`; op($('dripA'),t>1.0&&t<2.0?1:0);
  slam($('dare'),t,1.35,{from:1.6,out:2.0});
  // him
  slam($('fk'),t,2.35,{from:2.2,out:4.25}); bleed($('haunt'),t,2.9,.7,4.25);
  // wicked
  slam($('w1'),t,4.55,{from:1.5,out:6.45}); slam($('w2'),t,4.75,{from:2.0,out:6.45}); bleed($('w3'),t,5.3,.7,6.45);
  // dress code
  slam($('k1'),t,6.55,{from:2,out:7.15}); slam($('k2'),t,7.2,{from:2,out:7.8}); slam($('k3'),t,7.85,{from:2.2,out:8.4});
  // details
  slam($('d1'),t,8.65,{from:1.9,out:11.2}); slam($('d1b'),t,8.9,{from:2.2,out:11.2}); slam($('d2'),t,9.2,{from:2,out:11.2});
  slam($('d3'),t,9.7,{from:1.6,out:11.2}); bleed($('d4'),t,10.2,.5,11.2);

  // lockup
  op($('lock'),t>=11.2?1:0);
  const cf=E.back(P(t,11.25,11.75)); $('coffin').style.transform=`translateY(${L(-900,0,cf)}px)`;
  $('pL').firstElementChild.style.transform=`scale(${L(1.15,1.0,E.out3(P(t,11.3,15)))})`;
  op($('lglow'),cl(P(t,11.5,12))*(.75+.25*Math.sin(t*9)));
  const lg=E.back(P(t,11.6,12.0)); $('lg').style.transform=`scale(${lg})`;
  slam($('l1'),t,12.0,{from:2.0}); bleed($('l2'),t,12.3,.5);
  const l3=E.out3(P(t,12.55,12.9)); op($('l3'),l3); $('l3').style.transform=`translateY(${L(40,0,l3)}px)`;
  let pulse=0; for(let k=13.4;k<15;k+=BEAT*2) if(t>=k) pulse=Math.max(pulse,1-P(t,k,k+.3));
  const tx=E.back(P(t,12.75,13.15)); $('tix').style.transform=`translateY(${L(500,0,tx)}px) scale(${1+pulse*.035})`; op($('tix'),t>=12.75?1:0);

  for(let i=0;i<46;i++) bat(i,t);
  op($('black'),P(t,14.6,15.0)*.85);
}
window.render=render;
"""


def render_frames():
    os.makedirs(SCRATCH, exist_ok=True)
    hp = os.path.join(HERE, '_promo_mix.html')
    open(hp, 'w').write(html())
    js = os.path.join(HERE, '_shoot_mix.js')
    open(js, 'w').write(f"""const {{chromium}}=require('playwright');(async()=>{{const b=await chromium.launch();
const p=await b.newPage({{viewport:{{width:{W},height:{H}}}}});await p.goto('file://{hp}');await p.evaluate(()=>document.fonts.ready);
await p.waitForTimeout(800);const n={int(FPS * DUR)};const only=process.argv.slice(2).map(Number);
for(let f=0;f<n;f++){{ if(only.length&&!only.includes(f)) continue; await p.evaluate(t=>render(t),f/{FPS});
await p.screenshot({{path:'{SCRATCH}/f_'+String(f).padStart(4,'0')+'.jpg',type:'jpeg',quality:94}});}}
await b.close();}})();""")
    subprocess.run(['node', js] + sys.argv[2:], check=True)


# ------------------------------------------------------------------ sound
SR = 44100


def audio(path):
    from scipy.signal import butter, lfilter
    n = int(SR * DUR); out = np.zeros(n); rng = np.random.default_rng(29)
    tt = lambda d: np.arange(int(SR * d)) / SR
    filt = lambda kind, f, x: lfilter(*butter(2, np.array(f) / (SR / 2), kind), x)

    def put(sig, t0, g=1.0):
        i = int(t0 * SR)
        if i < n:
            sig = sig[:n - i]; out[i:i + len(sig)] += sig * g

    def drone(d):
        t = tt(d)
        x = (np.sin(2 * np.pi * 55 * t) + .8 * np.sin(2 * np.pi * 58.3 * t) + .4 * np.sin(2 * np.pi * 82.4 * t)) * .25
        return (x + filt('band', [200, 900], rng.normal(0, 1, len(t))) * (.5 + .5 * np.sin(2 * np.pi * .3 * t)) * .25) * np.minimum(1, t / 1.0)

    def heartbeat():
        t = tt(.35); a = np.sin(2 * np.pi * (45 + 40 * np.exp(-t * 30)) * t) * np.exp(-t * 14)
        x = np.zeros(int(SR * .6)); x[:len(a)] += a; x[int(SR * .2):int(SR * .2) + len(a)] += a * .7
        return x

    def thunder(d=2.0):
        t = tt(d)
        return filt('high', 1500, rng.normal(0, 1, len(t))) * np.exp(-t * 18) * .8 + filt('low', 180, rng.normal(0, 1, len(t))) * (1 - np.exp(-t * 8)) * np.exp(-t * 1.6) * 3

    def flutter(d=1.6, density=1.0):
        """Wing beats of a swarm: band noise amplitude-modulated at ~18-26 Hz, several bats detuned."""
        t = tt(d); x = np.zeros(len(t))
        for k in range(int(6 * density)):
            f = rng.uniform(16, 26); ph = rng.uniform(0, 6.28)
            x += filt('band', [600, 3500], rng.normal(0, 1, len(t))) * np.clip(np.sin(2 * np.pi * f * t + ph), 0, 1) ** 3
        return x * np.sin(np.pi * t / d) * .18

    def screech():
        t = tt(.35); f = 2600 + 900 * np.sin(2 * np.pi * 9 * t)
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * .08

    def bell(f, d=1.3):
        t = tt(d)
        return (np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * f * 2.76 * t) + .25 * np.sin(2 * np.pi * f * 5.4 * t)) * np.exp(-t * 3) * .22

    def clang():
        t = tt(1.0)
        x = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * (3 + f / 900)) for f, a in [(310, 1), (777, .7), (1260, .5), (1984, .35), (3150, .2)])
        return x * .32 + filt('high', 2000, rng.normal(0, 1, len(t))) * np.exp(-t * 40) * .3

    def boom():
        t = tt(1.6)
        return np.sin(2 * np.pi * np.cumsum(32 + 80 * np.exp(-t * 8)) / SR) * np.exp(-t * 2.4)

    def kick808(f0=58):
        t = tt(.7)
        return np.tanh(2 * np.sin(2 * np.pi * np.cumsum(f0 + 120 * np.exp(-t * 30)) / SR) * np.exp(-t * 3.5)) * .9

    def hat(d=.05):
        t = tt(d)
        return filt('high', 7000, rng.normal(0, 1, len(t))) * np.exp(-t * 90) * .2

    def clap():
        t = tt(.25)
        env = np.exp(-t * 25) + .6 * np.exp(-np.abs(t - .012) * 400) + .5 * np.exp(-np.abs(t - .024) * 400)
        return filt('band', [900, 2500], rng.normal(0, 1, len(t))) * env * .45

    put(drone(15), 0, .85)
    for tb in (0.0, .8, 1.45):
        put(heartbeat(), tb, .9)
    for s in (.25, .45, 2.0, 4.3, 6.5, 8.4, 11.2):
        put(thunder(), s, .55 if s < 1 else .7)
    put(flutter(1.8, 1.6), .25, 1.2)                       # the swarm
    for s in (.4, .7, 1.1):
        put(screech(), s, 1)
    for s in (3.1, 5.6, 9.9, 13.2):                        # passing bats
        put(flutter(1.2, .6), s, .7)
    for tm, f in [(.7, 440), (1.0, 523.3), (1.3, 659.3), (1.6, 622.3)]:
        put(bell(f), tm, .85)
    for s in (2.0, 6.5, 11.2):
        put(boom(), s, 1)
    for s in (2.35, 4.55, 4.75, 6.55, 7.2, 7.85, 8.65, 8.9, 9.2, 9.7, 12.0):
        put(clang(), s, .75)
    beat = 60 / 140; k = 0
    while 2.0 + k * beat < 14.4:
        tb = 2.0 + k * beat
        if k % 4 in (0, 3) or k % 8 == 6:
            put(kick808(58 if k % 8 < 4 else 52), tb, .85)
        if k % 4 == 2:
            put(clap(), tb, .9)
        put(hat(), tb, 1); put(hat(), tb + beat / 2, .6)
        if k % 8 == 7:
            for r in range(4):
                put(hat(.03), tb + beat / 2 + r * beat / 8, .7)
        k += 1
    for tm, f in [(12.4, 440), (12.7, 523.3), (13.0, 659.3), (13.3, 622.3)]:
        put(bell(f), tm, .6)
    fade = np.ones(n); fe = int(SR * .9); fade[-fe:] = np.linspace(1, 0, fe)
    out = np.tanh(out * 1.3) * fade
    out = out / np.max(np.abs(out)) * .78
    import wave
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.stack([out, out], 1) * 32767).astype('<i2').tobytes())


def encode():
    os.makedirs(OUT, exist_ok=True)
    wav = os.path.join(HERE, '_bed_mix.wav')
    audio(wav)
    v = ['-framerate', str(FPS), '-i', f'{SCRATCH}/f_%04d.jpg']
    enc = ['-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart']
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error'] + v + enc + [os.path.join(OUT, NAME + '_NO-AUDIO.mp4')], check=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error'] + v + ['-i', wav] + enc +
                   ['-af', 'alimiter=limit=0.8:level=false,volume=-2dB', '-c:a', 'aac', '-b:a', '192k', '-shortest', os.path.join(OUT, NAME + '.mp4')], check=True)
    shutil.copy(f'{SCRATCH}/f_{int(14.0 * FPS):04d}.jpg', os.path.join(OUT, NAME + '_poster.jpg'))
    os.remove(wav)
    print('ok', NAME)


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'frames':
        render_frames()
    else:
        render_frames(); encode()
