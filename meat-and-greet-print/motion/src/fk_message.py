"""FirstKlaz to-camera clip (IMG_5909) -> 16s branded story edit (1080x1920, 30fps).

python3 fk_message.py SOURCE.mov            -> ../export/FirstKlaz-Message_Story-Edit_16s.mp4 (+ silent, poster)
python3 fk_message.py SOURCE.mov frames 0 90  -> render only those frames

 0.00- 8.07  HIS CLIP   HLG HDR tone-mapped to SDR, graded into the campaign (stormy red-black sky, warm
                        skin, muted greens). Bats in the sky, lightning flickers, brand text in the sky zone:
                        "FirstKlaz / has a message." > "Saturday. / Doxa Park, Abuja." > "Come dressed / to kill."
                        Punch-ins when he points at the lens. His own audio, levelled, with a quiet bed under it.
 8.07- 8.50  TRANSITION he leans out of frame > lightning crack + bat swarm + flash
 8.50-16.00  END CARD   Halloween world (hooks, fire, pumpkins, hooded figures, fog), his face from the clip in a
                        coffin frame. "FirstKlaz / Meating." then "Get your tickets. / The BBQ is free."
                        + date line + ticket stub pulsing on the beat
"""
import os
import shutil
import subprocess
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from promo_mix import MIX_CSS, BAT, logo, embroidery_frame, COFFIN  # noqa: E402
from promo import FLAME, TEX, GRAIN, W, H, FPS, hook_svg, pumpkin_svg, figure_svg  # noqa: E402

DUR, CUT = 16.0, 8.07
OUT = os.path.abspath(os.path.join(HERE, '..', 'export'))
SCRATCH = os.environ.get('PROMO_TMP', os.path.join(HERE, '_frames_fk'))
CLIPF = os.path.join(SCRATCH, 'clip')
NAME = 'FirstKlaz-Message_Story-Edit_16s'
N_BATS = 36
TONEMAP = ('zscale=t=linear:npl=120,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,'
           'zscale=t=bt709:m=bt709:r=tv,format=yuv420p,scale=1080:1920:flags=lanczos')

CSS = MIX_CSS + """
#clipWrap{position:absolute;inset:0;overflow:hidden}
#clip{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:contrast(1.1) saturate(.82) sepia(.12) brightness(.96)}
.sky{position:absolute;left:0;top:0;width:100%;height:1100px;background:linear-gradient(180deg,rgba(14,3,3,.96) 0%,rgba(40,6,6,.86) 30%,rgba(60,8,8,.5) 48%,rgba(0,0,0,0) 62%)}
.tint{position:absolute;inset:0;background:#7a0a10;mix-blend-mode:multiply;opacity:.16}
"""


def blk(id_, top, kick, lines):
    hl = ''.join(f'<div class="hl{" red" if red else ""}" style="font-size:{fs}px"><span class="ln">{txt}</span></div>' for txt, fs, red in lines)
    return f'<div id="{id_}" class="blk" style="top:{top}px"><div class="kick"><span class="rule"></span><span class="kt">{kick}</span><span class="rule"></span></div>{hl}</div>'


def flames(cls, n, x0, x1, base, h, gid):
    return ''.join(
        f'<div class="a {cls}" style="left:{x0 + (x1 - x0) * i / max(1, n - 1) - h * .35:.0f}px;top:{base - h:.0f}px;width:{h * .7:.0f}px;height:{h:.0f}px;transform-origin:50% 100%">'
        f'<svg viewBox="0 0 100 102" width="100%" height="100%" preserveAspectRatio="none"><defs><linearGradient id="{gid}{i}" x1="0" y1="1" x2="0" y2="0">'
        f'<stop offset="0" stop-color="#ffe2a0"/><stop offset=".3" stop-color="#ff8a1a"/><stop offset=".75" stop-color="#d0141e"/><stop offset="1" stop-color="#d0141e" stop-opacity="0"/>'
        f'</linearGradient></defs><path d="{FLAME}" fill="url(#{gid}{i})"/></svg></div>' for i in range(n))


def html():
    face = f'file://{CLIPF}/c_0140.jpg'
    hooks = ''.join(f'<div class="a hook" data-ph="{i * .8}" data-sc=".8" style="left:{i * 230 - 40}px;top:-60px;transform-origin:60px 0">{hook_svg(["ham", None, "rack", None, "ham"][i], 30 + (i * 37) % 70)}</div>' for i in range(5))
    figs = ''.join(f'<div class="a fig" style="left:{x}px;top:{y}px;width:{w}px;height:{w * 7 / 3:.0f}px;filter:blur({b}px)">{figure_svg()}</div>'
                   for x, y, w, b in ((-70, 640, 280, 3), (870, 660, 280, 3)))
    bats = ''.join(f'<div class="bat" id="bat{i}">{BAT}</div>' for i in range(N_BATS))
    embers = ''.join(f'<div class="a em" style="width:{3 + i % 5}px;height:{3 + i % 5}px;border-radius:50%;background:{"#ffb347" if i % 3 else "#ff5a1f"};box-shadow:0 0 10px #ff6a1f"></div>' for i in range(36))
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>
<div id="stage"><div id="cam" class="L">

<div id="clipWrap"><img id="clip" src="file://{CLIPF}/c_0001.jpg"><div class="sky"></div><div class="tint"></div>
  <div class="L" style="background:radial-gradient(ellipse 85% 70% at 50% 55%, rgba(0,0,0,0) 55%, rgba(10,2,2,.6))"></div></div>

<div id="world" class="L" style="opacity:0;background:radial-gradient(ellipse 90% 55% at 50% 100%, #3a0906 0%, #120404 45%, #050303 80%)">
  <img class="a fog" src="file://{TEX}/smoke_bone.png" style="left:-20%;top:900px;width:140%;height:900px;object-fit:fill;opacity:.28">
  {figs}
  <div class="L">{hooks}</div>
  <div id="glow" class="a" style="left:{W / 2 - 360}px;top:280px;width:720px;height:760px;background:radial-gradient(ellipse 50% 50% at 50% 50%, rgba(208,20,30,.7), rgba(0,0,0,0) 70%)"></div>
  <div id="coffin" class="a" style="left:{W / 2 - 220}px;top:350px;width:440px;height:560px;clip-path:{COFFIN};background:#D0141E">
    <div class="L" style="inset:9px;clip-path:{COFFIN};overflow:hidden">
      <div id="cface" style="position:absolute;inset:-6%;background:url({face}) -365px -658px/1242px auto no-repeat;filter:grayscale(.75) contrast(1.3) brightness(1.0)"></div>
      <div style="position:absolute;inset:0;background:#B0101A;mix-blend-mode:multiply;opacity:.4"></div>
      <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 55%,rgba(0,0,0,.6))"></div></div></div>
  <div id="pumpL" class="a" style="left:40px;top:1510px;width:230px;height:200px;transform-origin:50% 100%">{pumpkin_svg()}</div>
  <div id="pumpR" class="a" style="left:820px;top:1530px;width:200px;height:174px;transform-origin:50% 100%">{pumpkin_svg()}</div>
  <div id="fireglow" class="L" style="background:radial-gradient(ellipse 80% 30% at 50% 100%, rgba(255,110,20,.75), rgba(208,20,30,.35) 45%, rgba(0,0,0,0) 75%)"></div>
  <div class="L" style="filter:blur(2px)">{flames('ef', 9, -40, 1120, 1990, 300, 'fa')}</div>
  <img class="a fog" src="file://{TEX}/smoke_red.png" style="left:-20%;top:1250px;width:140%;height:700px;object-fit:fill;opacity:.4">
  <div id="lg" class="a" style="left:{W / 2 - 95}px;top:175px;width:190px;height:151px">{logo(190, 0, 0)}</div>
  <div id="l3" class="a minor c" style="top:1262px;font-size:44px;opacity:0">Sat 31 Oct &middot; 5PM &middot; Doxa Park, Abuja</div>
  <div id="tix" class="a" style="left:110px;top:1350px;width:860px;height:150px;display:flex;opacity:0">
    <div style="flex:1;background:#B3121C;display:flex;flex-direction:column;justify-content:center;padding:0 36px;-webkit-mask:radial-gradient(circle 18px at 100% 50%,transparent 98%,#000)">
      <div style="font-family:Anton;font-size:70px;line-height:1;text-transform:uppercase">Get tickets</div>
      <div style="font-family:Anton;font-size:30px;letter-spacing:.14em;margin-top:6px;opacity:.95">PV.RSVP/FIRSTKLAZ-MEATING</div></div>
    <div style="width:0;border-left:4px dashed #050303"></div>
    <div style="width:180px;background:#B3121C;display:flex;align-items:center;justify-content:center;-webkit-mask:radial-gradient(circle 18px at 0 50%,transparent 98%,#000)">
      <div style="font-family:Anton;font-size:60px">18+</div></div></div>
</div>

<div id="bats" class="L">{bats}</div>
<div id="embers" class="L">{embers}</div>
{blk('b1', 300, 'Meat &amp; Greet presents', [('FirstKlaz', 170, False), ('has a message.', 110, True)])}
{blk('b2', 300, 'Halloween BBQ Party', [('Saturday.', 170, False), ('Doxa Park, Abuja.', 104, True)])}
{blk('b3', 300, 'Costume or all-black', [('Come dressed', 140, False), ('to kill.', 170, True)])}
{blk('e1', 950, 'Halloween BBQ Party', [('FirstKlaz', 170, False), ('Meating.', 150, True)])}
{blk('e2', 945, 'This Saturday', [('Get your tickets.', 118, False), ('The BBQ is free.', 118, True)])}
<div id="mini" class="a" style="left:64px;top:150px;width:150px;height:119px;opacity:0">{logo(150, 0, 0)}</div>
</div>
<img id="grain" class="L" src="file://{GRAIN}" style="width:130%;height:130%;opacity:.16;mix-blend-mode:overlay">
<div id="bolt" class="a" style="left:520px;top:0;opacity:0"><svg width="260" height="900"><path d="M150,0 L90,300 L150,300 L60,620 L120,620 L20,900" fill="none" stroke="#e8efff" stroke-width="8" stroke-linejoin="bevel" style="filter:drop-shadow(0 0 18px #9fb6ff)"/></svg></div>
<div id="flash" class="L" style="background:#eef2ff;opacity:0;mix-blend-mode:screen"></div>
<div id="border" class="L">{embroidery_frame()}</div>
<div id="black" class="L" style="background:#000;opacity:0"></div>
</div>
<script>{JS}</script></body></html>"""


JS = r"""
const $=id=>document.getElementById(id);
const cl=(x,a=0,b=1)=>Math.min(b,Math.max(a,x)), P=(t,a,b)=>cl((t-a)/(b-a)), L=(a,b,x)=>a+(b-a)*x;
const E={out3:x=>1-Math.pow(1-x,3),in3:x=>x*x*x,outX:x=>x===1?1:1-Math.pow(2,-10*x),back:x=>{const c1=1.9,c3=c1+1;return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2)}};
const rnd=i=>{const s=Math.sin(i*127.1+311.7)*43758.5453;return s-Math.floor(s)};
const op=(el,v)=>el.style.opacity=v;
const CUT=8.07, BEAT=.5;
const LIGHTNING=[[.05,1],[.3,.8],[3.55,.7],[8.07,.6],[11.75,.8]];
const HITS=[.05,.45,3.6,6.9,7.45,8.07,8.75,11.8,13.0];
const PUNCH=[6.9,7.45];
function block(id,t,t0,t1,stag=.14){
  const el=$(id); if(t<t0||t>=t1){op(el,0);return}
  op(el,1-P(t,t1-.15,t1));
  const k=E.out3(P(t,t0,t0+.45)); el.querySelectorAll('.rule').forEach(r=>r.style.width=(k*64)+'px');
  const kt=el.querySelector('.kt'); kt.style.opacity=P(t,t0+.1,t0+.4); kt.style.letterSpacing=L(.6,.34,E.out3(P(t,t0,t0+.6)))+'em';
  el.querySelectorAll('.hl .ln').forEach((ln,i)=>{const s=t0+.15+i*stag, e=E.outX(P(t,s,s+.5));
    ln.style.transform=`translateY(${(1-e)*108}%)`; ln.style.filter=`blur(${(1-e)*6}px)`;});
}
function bat(i,t){
  const el=$('bat'+i); let x,y,s,r=0,vis=1;
  if(i<22){ const burst=i<10?.15:CUT, t0=burst+rnd(i)*.35, d=.8+rnd(i+5)*.6, p=P(t,t0,t0+d); if(t<t0||p>=1){op(el,0);return}
    const a=rnd(i+9)*Math.PI*2, e=p*p, cy=i<10?380:900; x=540+Math.cos(a)*1500*e; y=cy+Math.sin(a)*1500*e-200*p; s=L(.25,3.4,p); r=Math.cos(a)*25;
  } else { const k=i-22, per=3.8+rnd(k)*2.6, ph=(t/per+rnd(k+20))%1, dir=k%2?1:-1;
    x=dir>0?L(-260,1340,ph):L(1340,-260,ph); y=(t<CUT?110+rnd(k+33)*520:140+rnd(k+33)*1100)+Math.sin(t*2.2+k)*50; s=.4+rnd(k+44)*.55;
    vis=t>.6?1:0; r=Math.sin(t*3+k)*12; }
  const flap=Math.sin(t*(22+(i%5)*3)+i), fy=.3+.7*flap;
  el.querySelector('.wl').setAttribute('transform',`scale(1,${fy})`); el.querySelector('.wr').setAttribute('transform',`scale(-1,${fy})`);
  el.style.transform=`translate(${x-100}px,${y-50}px) scale(${s}) rotate(${r}deg)`; op(el,vis);
}
function render(t){
  // lightning, shake, grain
  let fl=0,bolt=0; for(const [s,len] of LIGHTNING){const d=(t-s)/len; if(d>=0&&d<.35){const k=(d<.05?1:d<.09?.25:d<.14?.85:Math.max(0,1-(d-.14)/.2)); fl=Math.max(fl,k); if(d<.16) bolt=1;}}
  op($('flash'),fl*.6); op($('bolt'),bolt*fl); $('bolt').style.left=(t<2?700:t<CUT+.5?250:640)+'px';
  let sx=0,sy=0; for(const s of HITS){ if(t>=s){const d=t-s,a=Math.exp(-d*10)*11; sx+=a*Math.sin(d*70); sy+=a*Math.cos(d*53);} }
  $('cam').style.transform=`translate(${sx}px,${sy}px)`;
  $('grain').style.transform=`translate(${-rnd(Math.floor(t*30))*20}%,${-rnd(Math.floor(t*30)+5)*20}%)`;
  op($('border'),E.out3(P(t,.1,.9)));

  // ---- his clip
  const inClip=t<CUT; $('clipWrap').style.display=inClip?'block':'none';
  if(inClip){
    const f=Math.min(250,Math.floor(t*30)+1); $('clip').src=$('clip').src.replace(/c_\d{4}\.jpg/,'c_'+String(f).padStart(4,'0')+'.jpg');
    let z=1.02; for(const p of PUNCH){ if(t>=p) z=Math.max(z,1.02+.09*Math.exp(-(t-p)*5)); }
    const out=E.in3(P(t,CUT-.25,CUT)); z*=1+out*.25;
    $('clip').style.transform=`scale(${z})`; $('clip').style.transformOrigin='58% 42%';
    $('clip').style.filter=`contrast(1.1) saturate(.82) sepia(.12) brightness(${.96+fl*.5}) blur(${out*10}px)`;
  }
  op($('mini'),inClip?cl(P(t,.5,.9)):0);
  block('b1',t,.4,3.45,.2); block('b2',t,3.6,6.8,.2); block('b3',t,6.9,CUT,.18);

  // ---- end card
  op($('world'),t>=CUT?1:0);
  if(t>=CUT){
    document.querySelectorAll('.hook').forEach(h=>{const ph=+h.dataset.ph,s=+h.dataset.sc; h.style.transform=`scale(${s}) rotate(${Math.sin(t*1.4+ph)*4}deg)`;});
    document.querySelectorAll('.fog').forEach((f,i)=>f.style.transform=`translateX(${Math.sin(t*.3+i)*60-t*6}px)`);
    document.querySelectorAll('.fig').forEach((f,i)=>{const e=E.out3(P(t,8.6+i*.2,9.6+i*.2)); f.style.transform=`translateY(${L(260,0,e)}px)`; op(f,e*.85);
      f.querySelectorAll('circle').forEach(c=>c.style.opacity=.6+.4*Math.sin(t*5+i));});
    const cf=E.back(P(t,8.45,8.95)); $('coffin').style.transform=`translateY(${L(-1000,0,cf)}px) rotate(${L(-8,0,cf)}deg)`;
    $('cface').style.transform=`scale(${L(1.12,1.0,E.out3(P(t,8.5,16)))})`;
    op($('glow'),cl(P(t,8.9,9.4))*(.75+.25*Math.sin(t*9)));
    $('lg').style.transform=`scale(${E.back(P(t,9.0,9.4))})`;
    [['pumpL',9.1],['pumpR',9.25]].forEach(([id,t0])=>{const e=E.back(P(t,t0,t0+.4)); $(id).style.transform=`scale(${e})`;
      $(id).querySelector('.pface').style.opacity=t>t0+.2?(.75+.25*Math.sin(t*23+t0*9)):0;
      $(id).style.filter=`drop-shadow(0 0 ${t>t0+.2?30+10*Math.sin(t*17):0}px rgba(255,140,30,.7))`;});
    const kp=Math.exp(-((t-CUT)%BEAT)*7);
    document.querySelectorAll('.ef').forEach((f,i)=>{const s=E.out3(P(t,8.3,9.0))*(.85+.2*kp+.2*Math.sin(t*(9+i)+i*2));
      f.style.transform=`scaleY(${s}) scaleX(${.9+.1*Math.sin(t*7+i)}) skewX(${Math.sin(t*3+i)*6}deg)`;});
    op($('fireglow'),.8+.2*Math.sin(t*11));
    const l3=E.out3(P(t,12.6,13.0)); op($('l3'),l3); $('l3').style.transform=`translateY(${L(40,0,l3)}px)`;
    let pulse=0; for(let k=13.5;k<16;k+=BEAT*2) if(t>=k) pulse=Math.max(pulse,1-P(t,k,k+.3));
    const tx=E.back(P(t,12.95,13.35)); $('tix').style.transform=`translateY(${L(500,0,tx)}px) scale(${1+pulse*.035})`; op($('tix'),t>=12.95?1:0);
  }
  block('e1',t,9.35,11.7,.2); block('e2',t,11.85,99,.22);

  const emOn=t>=CUT?1:.25;
  document.querySelectorAll('.em').forEach((el,i)=>{const sp=160+rnd(i)*300,x0=rnd(i+40)*1080,y=(1950+rnd(i+80)*1950-t*sp)%2000;
    el.style.left=(x0+Math.sin(t*1.5+i)*40)+'px'; el.style.top=y+'px'; op(el,emOn*(.3+.7*rnd(i+3))*(.6+.4*Math.sin(t*8+i)));});
  for(let i=0;i<36;i++) bat(i,t);
  op($('black'),P(t,15.7,16.0)*.5);
}
window.render=render;
"""


def extract(src):
    os.makedirs(CLIPF, exist_ok=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-map', '0:v:0', '-vf', TONEMAP, '-q:v', '2', f'{CLIPF}/c_%04d.jpg'], check=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-map', '0:1', '-ac', '1', '-ar', '44100', os.path.join(SCRATCH, 'voice.wav')], check=True)


def render_frames():
    os.makedirs(SCRATCH, exist_ok=True)
    hp = os.path.join(HERE, '_fk.html')
    open(hp, 'w').write(html())
    js = os.path.join(HERE, '_shoot_fk.js')
    open(js, 'w').write(f"""const {{chromium}}=require('playwright');(async()=>{{const b=await chromium.launch();
const p=await b.newPage({{viewport:{{width:{W},height:{H}}}}});p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('file://{hp}');await p.evaluate(()=>document.fonts.ready);
await p.waitForTimeout(800);const n={int(FPS * DUR)};const only=process.argv.slice(2).map(Number);
for(let f=0;f<n;f++){{ if(only.length&&!only.includes(f)) continue; await p.evaluate(t=>render(t),f/{FPS});
await p.evaluate(()=>document.getElementById('clip').decode().catch(()=>{{}}));
await p.screenshot({{path:'{SCRATCH}/f_'+String(f).padStart(4,'0')+'.jpg',type:'jpeg',quality:93}});}}
await b.close();}})();""")
    subprocess.run(['node', js] + sys.argv[3:], check=True)


# ------------------------------------------------------------------ audio: his voice + synthesised bed and FX
SR = 44100


def audio(path):
    import wave
    from scipy.signal import butter, lfilter
    n = int(SR * DUR); rng = np.random.default_rng(91)
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

    def clap():
        t = tt(.25)
        env = np.exp(-t * 25) + .6 * np.exp(-np.abs(t - .012) * 400) + .5 * np.exp(-np.abs(t - .024) * 400)
        return filt('band', [900, 2500], rng.normal(0, 1, len(t))) * env * .42

    def log_drum(f):
        t = tt(.42); fr = f * (1 + 1.2 * np.exp(-t * 40))
        return np.tanh(2.2 * np.sin(2 * np.pi * np.cumsum(fr) / SR)) * np.exp(-t * 6) * .5

    def boom():
        t = tt(1.6); return np.sin(2 * np.pi * np.cumsum(30 + 80 * np.exp(-t * 8)) / SR) * np.exp(-t * 2.3)

    def thunder(d=2.0):
        t = tt(d)
        return filt('high', 1500, rng.normal(0, 1, len(t))) * np.exp(-t * 18) * .8 + filt('low', 180, rng.normal(0, 1, len(t))) * (1 - np.exp(-t * 8)) * np.exp(-t * 1.6) * 3

    def flutter(d=1.5, dens=1.0):
        t = tt(d); x = np.zeros(len(t))
        for _ in range(int(6 * dens)):
            f = rng.uniform(16, 26); ph = rng.uniform(0, 6.28)
            x += filt('band', [600, 3500], rng.normal(0, 1, len(t))) * np.clip(np.sin(2 * np.pi * f * t + ph), 0, 1) ** 3
        return x * np.sin(np.pi * t / d) * .18

    def whoosh(d=.4):
        t = tt(d); x = rng.normal(0, 1, len(t)); y = np.zeros_like(x)
        for k, f in enumerate(np.linspace(400, 5000, 8)):
            seg = slice(int(len(x) * k / 8), int(len(x) * (k + 1) / 8)); y[seg] = filt('band', [f * .7, f * 1.3], x)[seg]
        return y * np.sin(np.pi * t / d) * .4

    def riser(d):
        t = tt(d); return filt('band', [400, 6000], rng.normal(0, 1, len(t))) * (t / d) ** 2 * .4

    def clang():
        t = tt(1.0)
        x = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * (3 + f / 900)) for f, a in [(310, 1), (777, .7), (1260, .5), (1984, .35)])
        return x * .3

    def bell(f, d=1.2):
        t = tt(d); return (np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * f * 2.76 * t)) * np.exp(-t * 3) * .2

    notes = [55, 55, 65.4, 49, 55, 73.4, 65.4, 49]
    for k in range(int(DUR / .25)):
        tb = k * .25
        if k % 2 == 0:
            put(music, kick(), tb, .9)
        put(music, shaker(1 if k % 2 else .6), tb, 1)
        if k % 8 in (2, 6):
            put(music, clap(), tb, .85)
        if k % 8 in (0, 3, 4, 6):
            put(music, log_drum(notes[(k // 8 + k % 8) % 8]), tb, .8)
    tt_all = np.arange(n) / SR
    duck = np.where(tt_all < CUT, .16, 1.0)
    duck = np.convolve(duck, np.ones(int(SR * .2)) / int(SR * .2), mode='same')
    music *= duck

    # his voice: high-pass rumble, level to ~-18 dBFS RMS, soft-limit, fade under the cut
    w = wave.open(os.path.join(SCRATCH, 'voice.wav'))
    v = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').astype(float) / 32768
    v = filt('high', 90, v)[:int(SR * CUT) + int(SR * .2)]
    v = v / (np.sqrt((v ** 2).mean()) + 1e-9) * 10 ** (-18 / 20)
    v = np.tanh(v * 1.4) / 1.4
    fo = np.ones(len(v)); a, b = int(SR * (CUT - .12)), len(v); fo[a:b] = np.linspace(1, 0, b - a)
    voice = np.zeros(n); voice[:len(v)] = v * fo

    put(fx, thunder(), .05, .35); put(fx, flutter(1.6, 1.2), .15, .7)
    for s in (.4, 3.6, 6.9):
        put(fx, whoosh(), s - .15, .35)
    put(fx, thunder(1.4), 3.55, .2)
    for s in (6.9, 7.45):
        put(fx, boom()[:int(SR * .5)], s, .35)
    put(fx, riser(.65), CUT - .65, .6)
    put(fx, boom(), CUT, 1.0); put(fx, thunder(), CUT, .6); put(fx, flutter(1.6, 1.4), CUT, .9)
    for s in (8.75, 9.0, 11.85):
        put(fx, clang(), s, .8)
    put(fx, boom()[:int(SR * .9)], 13.0, .6)
    for tm, f in [(13.4, 440), (13.7, 523.3), (14.0, 659.3), (14.3, 622.3)]:
        put(fx, bell(f), tm, .7)
    out = voice * 1.0 + music * .55 + fx * .8
    fade = np.ones(n); fe = int(SR * .9); fade[-fe:] = np.linspace(1, 0, fe)
    out = np.tanh(out * 1.15) * fade
    out = out / np.max(np.abs(out)) * .8
    with wave.open(path, 'wb') as wf:
        wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(SR)
        wf.writeframes((np.stack([out, out], 1) * 32767).astype('<i2').tobytes())


def encode():
    os.makedirs(OUT, exist_ok=True)
    wav = os.path.join(SCRATCH, 'mix.wav')
    audio(wav)
    v = ['-framerate', str(FPS), '-i', f'{SCRATCH}/f_%04d.jpg']
    enc = ['-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart']
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error'] + v + enc + [os.path.join(OUT, NAME + '_NO-AUDIO.mp4')], check=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error'] + v + ['-i', wav] + enc +
                   ['-af', 'alimiter=limit=0.8:level=false,volume=-1.5dB', '-c:a', 'aac', '-b:a', '192k', '-shortest', os.path.join(OUT, NAME + '.mp4')], check=True)
    shutil.copy(f'{SCRATCH}/f_{int(14.5 * FPS):04d}.jpg', os.path.join(OUT, NAME + '_poster.jpg'))
    print('ok', NAME)


if __name__ == '__main__':
    src = sys.argv[1]
    extract(src)
    if len(sys.argv) > 2 and sys.argv[2] == 'frames':
        render_frames()
    else:
        render_frames(); encode()
