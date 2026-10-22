#!/usr/bin/env node
/**
 * SEASON FEST teaser campaign — "Cold to Fire".
 *
 * Five 4:5 flyers (1080×1350, rendered at 2× = 2160×2700) that post as a
 * sequence and join into ONE continuous scene as an Instagram carousel:
 * the festoon lights hang across slide edges and the night warms from snow
 * (01) to full fire (05) — the website's snow-to-ember signature.
 *
 *   npm run teasers   →  campaign/teasers/*.jpg
 *
 * Everything is drawn from the real assets: supplied logos, real MEAT & GREET
 * photography, the site's fonts and the same flame shader as the website.
 * Copy only uses confirmed facts (date, venue, brands, @meatndgreet9ja).
 */
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

function loadPlaywright() {
  const req = createRequire(import.meta.url);
  try {
    return req('playwright');
  } catch {
    return createRequire(execSync('npm root -g').toString().trim() + '/')('playwright');
  }
}

const root = resolve(import.meta.dirname, '..');
const f = (p) => pathToFileURL(join(root, p)).href;
const OUT = join(root, 'campaign/teasers');
const W = 1080;
const H = 1350;
const N = 5;

const slides = [
  { slug: 'something-on-the-grill' },
  { slug: 'bringing-the-heat' },
  { slug: 'done-this-before' },
  { slug: 'save-the-date' },
  { slug: 'season-fest-reveal' },
];

const footer = (i) => `
  <div class="scrim-b"></div>
  <footer class="foot">
    <img class="foot__mg" src="${f('src/assets/brand/meat-and-greet-logo.png')}">
    <div class="foot__seq">${Array.from({ length: N }, (_, k) => `<i class="${k === i ? 'on' : k < i ? 'done' : ''}"></i>`).join('')}</div>
    <div class="foot__handle">@meatndgreet9ja</div>
  </footer>`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:BSD;src:url(${f('node_modules/@fontsource-variable/big-shoulders-display/files/big-shoulders-display-latin-wght-normal.woff2')}) format('woff2');font-weight:100 900}
@font-face{font-family:IS;src:url(${f('node_modules/@fontsource-variable/instrument-sans/files/instrument-sans-latin-wght-normal.woff2')}) format('woff2');font-weight:400 700}
@font-face{font-family:SERIF;font-style:italic;src:url(${f('node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2')}) format('woff2')}
:root{--obs:#0b0807;--snow:#f7f2ec;--ember:#ff5e1a;--gold:#ffb547;--silver:#cfc8c1;--flame:#e8261c;--ice:#dfe8f0}
*{margin:0;box-sizing:border-box}
html,body{width:${W * N}px;height:${H}px;overflow:hidden;background:var(--obs)}
body{position:relative;color:var(--snow);font-family:IS,sans-serif;-webkit-font-smoothing:antialiased}
#sky{position:absolute;inset:0;background:
  linear-gradient(90deg,#070a0f 0%,#0a0b0d 22%,#0b0807 45%,#0b0807 100%),#0b0807}
#glow{position:absolute;inset:0;background:
  radial-gradient(900px 420px at 4500px 1420px,rgba(255,94,26,.55),transparent 70%),
  radial-gradient(1400px 620px at 4300px 1450px,rgba(117,20,27,.9),transparent 72%),
  radial-gradient(1200px 520px at 3000px 1480px,rgba(117,20,27,.65),transparent 72%),
  radial-gradient(900px 400px at 1500px 1500px,rgba(117,20,27,.35),transparent 70%)}
canvas{position:absolute;left:0;top:0;width:${W * N}px;height:${H}px}
#fire{mix-blend-mode:screen}
#lights{position:absolute;left:0;top:26px;width:${W * N}px;height:200px;overflow:visible}
#grain{position:absolute;inset:0;opacity:.085;pointer-events:none;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .9 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")}
.slide{position:absolute;top:0;width:${W}px;height:${H}px;overflow:hidden}
.d{font-family:BSD,sans-serif;font-weight:900;text-transform:uppercase;line-height:.84;letter-spacing:-.005em}
.lbl{font-family:BSD;font-weight:700;font-size:23px;letter-spacing:.32em;text-transform:uppercase;color:var(--silver)}
.serif{font-family:SERIF,serif;font-style:italic;font-weight:400;letter-spacing:-.01em}
.hot{background:linear-gradient(0deg,#ffb547 0%,#ffe3bd 45%,#fffaf3 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.fire{background:linear-gradient(0deg,#ffcf6a 0%,#ff8a2a 28%,#ff4a1c 58%,#c3161a 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.outline{color:transparent;-webkit-text-stroke:2.4px rgba(223,232,240,.82)}
.shadow{filter:drop-shadow(0 6px 30px rgba(11,8,7,.85))}

/* footer */
.foot{position:absolute;left:64px;right:64px;bottom:52px;height:64px;display:flex;align-items:center;justify-content:space-between}
.foot__mg{height:62px;filter:drop-shadow(0 6px 16px rgba(0,0,0,.6))}
.foot__handle{font-family:BSD;font-weight:800;font-size:26px;letter-spacing:.2em;text-transform:uppercase}
.foot__seq{display:flex;gap:8px;position:absolute;left:50%;transform:translateX(-50%)}
.foot__seq i{width:34px;height:4px;background:rgba(247,242,236,.22)}
.foot__seq i.done{background:rgba(255,181,71,.55)}
.foot__seq i.on{background:var(--ember);box-shadow:0 0 14px rgba(255,94,26,.8)}
.prod{display:flex;align-items:center;justify-content:center;gap:16px;font-family:BSD;font-weight:700;font-size:20px;letter-spacing:.28em;text-transform:uppercase;color:var(--silver)}
.prod img.tcm{height:50px}.prod img.clq{height:34px}.prod b{color:var(--ember);font-size:28px;letter-spacing:0}
.scrim-b{position:absolute;left:0;right:0;bottom:0;height:250px;background:linear-gradient(to top,rgba(11,8,7,.9),rgba(11,8,7,.5) 50%,transparent)}

/* 01 — something's on the grill */
.s1 .grill{position:absolute;right:-230px;bottom:150px;width:600px;mix-blend-mode:lighten;opacity:.7;
  -webkit-mask-image:radial-gradient(closest-side,#000 30%,transparent 92%);mask-image:radial-gradient(closest-side,#000 30%,transparent 92%);filter:brightness(.75) saturate(1.15)}
.s1 .top{position:absolute;top:262px;left:0;right:0;text-align:center}
.s1 h1{position:absolute;top:330px;left:0;right:0;text-align:center;font-size:178px}
.s1 h1 .hot{filter:drop-shadow(0 0 38px rgba(255,120,40,.55))}
.s1 .ask{position:absolute;top:900px;left:0;right:0;text-align:center;font-size:52px;line-height:1.05}
.s1 .date{position:absolute;top:1000px;left:0;right:0;display:flex;justify-content:center;align-items:center;gap:22px;font-family:BSD;font-weight:800;font-size:40px;letter-spacing:.24em;color:var(--gold)}
.s1 .date i{width:60px;height:2px;background:linear-gradient(90deg,transparent,var(--ember),transparent)}

/* 02 — bringing the heat */
.s2 .cold{position:absolute;top:238px;left:64px;font-size:150px}
.s2 .rule{position:absolute;top:640px;left:64px;right:64px;display:flex;align-items:center;gap:20px}
.s2 .rule span{font-family:BSD;font-weight:800;font-size:26px;letter-spacing:.3em;text-transform:uppercase;color:var(--gold);white-space:nowrap}
.s2 .rule i{flex:1;height:2px;background:linear-gradient(90deg,rgba(223,232,240,.5),var(--ember))}
.s2 .heat{position:absolute;top:706px;right:64px;text-align:right;font-size:150px}

/* 03 — we've done this before */
.s3 .top{position:absolute;top:236px;left:64px}
.s3 .photo{position:absolute;top:290px;left:64px;width:952px;height:600px;transform:rotate(-1.6deg);outline:1.5px solid rgba(247,242,236,.28);outline-offset:14px;overflow:hidden;box-shadow:0 40px 90px rgba(0,0,0,.6)}
.s3 .photo img{width:100%;height:100%;object-fit:cover;object-position:62% 40%}
.s3 .photo::after{content:'';position:absolute;inset:0;background:linear-gradient(to top,rgba(11,8,7,.55),transparent 45%)}
.s3 .cap{position:absolute;top:832px;left:96px;font-family:BSD;font-weight:700;font-size:18px;letter-spacing:.3em;text-transform:uppercase;color:rgba(247,242,236,.85);transform:rotate(-1.6deg)}
.s3 h2{position:absolute;top:905px;left:64px;font-size:146px}
.s3 .sub{position:absolute;top:1170px;left:64px;font-size:40px;line-height:1.1;color:var(--gold)}

/* 04 — save the date */
.s4 .top{position:absolute;top:236px;left:64px;color:var(--gold)}
.s4 h2{position:absolute;top:290px;left:64px;font-size:132px;line-height:.86}
.s4 .stub-wrap{position:absolute;left:150px;top:790px;transform:rotate(-5deg);filter:drop-shadow(0 40px 60px rgba(0,0,0,.6))}
.stub{--n:22px;display:grid;grid-template-columns:600px 190px;height:330px;color:var(--obs)}
.stub__main{padding:34px 40px;display:grid;align-content:space-between;
  background:radial-gradient(circle at 100% 0,transparent var(--n),var(--snow) calc(var(--n) + .5px)) top right/51% 51% no-repeat,
  radial-gradient(circle at 100% 100%,transparent var(--n),var(--snow) calc(var(--n) + .5px)) bottom right/51% 51% no-repeat,
  linear-gradient(var(--snow),var(--snow)) left/50% 100% no-repeat}
.stub__row{display:flex;align-items:center;justify-content:space-between}
.stub__row + .stub__row{border-top:2px dashed rgba(11,8,7,.22);padding-top:22px}
.stub__row img{height:64px}
.stub__k{font-family:BSD;font-weight:700;font-size:16px;letter-spacing:.3em;text-transform:uppercase;color:#6b5f58}
.stub__v{font-family:BSD;font-weight:900;font-size:46px;line-height:1;text-transform:uppercase;margin-top:6px}
.stub__v.sm{font-size:34px}
.stub__tear{border-left:3px dashed rgba(11,8,7,.3);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;
  background:radial-gradient(circle at 0 0,transparent var(--n),var(--ember) calc(var(--n) + .5px)) top left/51% 51% no-repeat,
  radial-gradient(circle at 0 100%,transparent var(--n),var(--ember) calc(var(--n) + .5px)) bottom left/51% 51% no-repeat,
  linear-gradient(var(--ember),var(--ember)) right/50% 100% no-repeat}
.stub__day{font-family:BSD;font-weight:900;font-size:112px;line-height:.82}
.stub__mon{font-family:BSD;font-weight:800;font-size:26px;letter-spacing:.24em}
.stub__code{width:70px;height:52px;margin-top:12px;background:repeating-linear-gradient(90deg,#0b0807 0 3px,transparent 3px 6px,#0b0807 6px 7px,transparent 7px 11px,#0b0807 11px 15px,transparent 15px 18px)}
.s4 .drop{position:absolute;right:64px;top:1182px;font-family:SERIF;font-style:italic;font-size:38px;color:var(--snow)}

/* 05 — reveal */
.s5 .scrim{position:absolute;inset:0;background:radial-gradient(620px 520px at 540px 560px,rgba(11,8,7,.82),rgba(11,8,7,.45) 60%,transparent 85%)}
.s5 .top{position:absolute;top:232px;left:0;right:0;text-align:center;display:flex;justify-content:center;align-items:center;gap:16px}
.s5 .top i{width:10px;height:10px;background:#52b47a;transform:rotate(45deg)}
.s5 .logo{position:absolute;top:268px;left:50%;width:880px;transform:translateX(-50%);filter:drop-shadow(0 24px 60px rgba(255,60,20,.45))}
.s5 .stmt{position:absolute;top:818px;left:0;right:0;text-align:center;font-size:52px;line-height:1.05}
.s5 .meta{position:absolute;top:898px;left:0;right:0;display:flex;justify-content:center;align-items:center;gap:22px;font-family:BSD;font-weight:900;font-size:40px;letter-spacing:.14em;text-transform:uppercase}
.s5 .prod{position:absolute;top:1112px;left:0;right:0}
.s5 .meta b{color:var(--gold);font-weight:900}
.s5 .meta i{width:46px;height:3px;background:var(--ember)}
.s5 .cta{position:absolute;top:976px;left:50%;transform:translateX(-50%);filter:drop-shadow(0 0 34px rgba(255,94,26,.6))}
.cta__body{--n:16px;display:flex;align-items:center;gap:18px;height:100px;padding:0 66px 0 76px;font-size:44px !important;background:linear-gradient(100deg,#ff3f1c 0%,#ff641f 42%,#ff9a36 100%);color:#1a0905;font-family:BSD;font-weight:900;font-size:36px;letter-spacing:.12em;text-transform:uppercase;white-space:nowrap;position:relative;
  -webkit-mask:radial-gradient(circle at 0 50%,#0000 var(--n),#000 calc(var(--n) + .5px)) 0 0/51% 100% no-repeat,radial-gradient(circle at 100% 50%,#0000 var(--n),#000 calc(var(--n) + .5px)) 100% 0/51% 100% no-repeat}
.cta__body::before{content:'';position:absolute;left:30px;top:22px;bottom:22px;border-left:3px dotted rgba(26,9,5,.35)}
</style></head><body>
<div id="sky"></div><div id="glow"></div>
<canvas id="fire"></canvas>
<canvas id="particles"></canvas>
<svg id="lights" viewBox="0 0 ${W * N} 200" aria-hidden="true"></svg>

<!-- 01 -->
<section class="slide s1" style="left:0">
  <img class="grill" src="${f('src/assets/food/grill-closeup.jpg')}">
  <p class="top lbl">Abuja · this December</p>
  <h1 class="d">Something’s<br>on the<br><span class="hot">grill.</span></h1>
  <p class="ask serif">Keep your Christmas Eve free.</p>
  <p class="date"><i></i>24.12<i></i></p>
  ${footer(0)}
</section>

<!-- 02 -->
<section class="slide s2" style="left:${W}px">
  <h2 class="cold d outline">Harmattan<br>nights<br>run cold.</h2>
  <div class="rule"><span>24.12 · Abuja</span><i></i></div>
  <h2 class="heat d"><span class="fire shadow">We’re<br>bringing<br>the heat.</span></h2>
  ${footer(1)}
</section>

<!-- 03 -->
<section class="slide s3" style="left:${W * 2}px">
  <p class="top lbl">MEAT &amp; GREET · Previous editions</p>
  <div class="photo"><img src="${f('src/assets/photos/audience-feature.jpg')}"></div>
  <p class="cap">MEAT &amp; GREET, Abuja</p>
  <h2 class="d shadow">We’ve done<br>this before.</h2>
  <p class="sub serif">This Christmas Eve, we turn it all the way up.</p>
  ${footer(2)}
</section>

<!-- 04 -->
<section class="slide s4" style="left:${W * 3}px">
  <p class="top lbl">Save the date</p>
  <h2 class="d shadow">Your<br>Christmas Eve<br>plans just<br><span class="hot">changed.</span></h2>
  <div class="stub-wrap"><div class="stub">
    <div class="stub__main">
      <div class="stub__row"><div><p class="stub__k">Thursday</p><p class="stub__v">24 December 2026</p></div></div>
      <div class="stub__row">
        <div><p class="stub__k">Where</p><p class="stub__v sm">Harrow Park, Abuja</p></div>
        <img src="${f('src/assets/brand/meat-and-greet-logo.png')}">
      </div>
    </div>
    <div class="stub__tear"><span class="stub__day">24</span><span class="stub__mon">DEC</span><span class="stub__code"></span></div>
  </div></div>
  <p class="drop">The name drops next.</p>
  ${footer(3)}
</section>

<!-- 05 -->
<section class="slide s5" style="left:${W * 4}px">
  <div class="scrim"></div>
  <p class="top lbl"><span>MEAT &amp; GREET</span><i></i><span>The Christmas Eve edition</span></p>
  <img class="logo" src="${f('src/assets/brand/season-fest-logo.webp')}">
  <p class="stmt serif">A Christmas Eve gathering with bite.</p>
  <p class="meta"><b>Thu 24 Dec 2026</b><i></i><span>Harrow Park, Abuja</span></p>
  <div class="cta"><div class="cta__body">Tickets drop soon</div></div>
  <div class="prod"><span>Produced by</span><img src="${f('src/assets/brand/tcm-logo.png')}" class="tcm"><b>×</b><img src="${f('src/assets/brand/the-clique-logo.png')}" class="clq"></div>
  ${footer(4)}
</section>

<div id="grain"></div>

<script>
window.addEventListener('load', () => setTimeout(draw, 0));
function draw(){
const W=${W}*${N}, H=${H};
// Heat across the carousel: Christmas-night cool (01) → full fire (05).
const heatAt = (x) => 0.03 + 0.88 * Math.pow(Math.min(1, Math.max(0, x / W)), 1.35);

/* ---------- fire: the website's flame shader, heat varying with x ---------- */
(function fire(){
  const c = document.getElementById('fire');
  const S = 0.55; c.width = Math.round(W*S); c.height = Math.round(H*S);
  const gl = c.getContext('webgl', { preserveDrawingBuffer: true, premultipliedAlpha:false });
  const vs = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  const fs = \`precision highp float;uniform vec2 r;uniform float t;varying vec2 v;
  float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
  float n(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);}
  float fb(vec2 p){float s=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<5;i++){s+=a*n(p);p=m*p;a*=.5;}return s;}
  void main(){vec2 uv=v;float asp=r.x/r.y;vec2 p=vec2(uv.x*asp,uv.y)*1.25;
    float heat=.03+.88*pow(uv.x,1.35);
    vec2 q=vec2(fb(p*1.7+vec2(0.,-t*.45)),fb(p*1.7+vec2(5.2,-t*.55)));
    float nn=fb(p*2.6+q*1.8+vec2(0.,-t*1.15));
    float hh=mix(.07,1.05,heat*heat);
    float body=1.-uv.y/hh;
    float fv=clamp(body+(nn-.5)*1.15,0.,1.);fv=pow(fv,1.55);
    vec3 c=vec3(0.);
    c=mix(c,vec3(.30,.03,.05),smoothstep(.02,.22,fv));
    c=mix(c,vec3(.80,.11,.06),smoothstep(.18,.52,fv));
    c=mix(c,vec3(1.,.35,.08),smoothstep(.5,.84,fv));
    c=mix(c,vec3(1.,.68,.30),smoothstep(.86,1.,fv)*.6);
    float sm=fb(p*1.3+q*.6+vec2(t*.04,-t*.12))*smoothstep(.15,.95,uv.y)*smoothstep(1.05,.35,uv.y);
    c+=vec3(.9,.82,.76)*sm*.06*(.5+heat*.7);
    gl_FragColor=vec4(c,1.);}\`;
  const sh=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw gl.getShaderInfoLog(s);return s};
  const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,vs));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(pr);gl.useProgram(pr);
  const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const l=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,2,gl.FLOAT,false,0,0);
  gl.viewport(0,0,c.width,c.height);
  gl.uniform2f(gl.getUniformLocation(pr,'r'),c.width,c.height);
  gl.uniform1f(gl.getUniformLocation(pr,'t'),9.4);
  gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
})();

/* ---------- snow → ember particles (seeded, reproducible) ---------- */
(function particles(){
  const dpr = window.devicePixelRatio || 1;
  const c = document.getElementById('particles'); c.width = W*dpr; c.height = H*dpr;
  const g = c.getContext('2d'); g.scale(dpr, dpr);
  let s = 20261224; const rnd = () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const sprite = (size, stops) => { const o = document.createElement('canvas'); o.width = o.height = size; const x = o.getContext('2d'); const gr = x.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2); stops.forEach(([a,b]) => gr.addColorStop(a,b)); x.fillStyle = gr; x.fillRect(0,0,size,size); return o; };
  const snow = sprite(64, [[0,'rgba(255,255,255,1)'],[.35,'rgba(250,250,255,.75)'],[1,'rgba(250,250,255,0)']]);
  const ember = sprite(64, [[0,'rgba(255,242,205,1)'],[.18,'rgba(255,170,70,.95)'],[.45,'rgba(255,90,26,.35)'],[1,'rgba(255,60,20,0)']]);
  const hot = sprite(96, [[0,'rgba(255,255,240,1)'],[.25,'rgba(255,200,110,.8)'],[1,'rgba(255,120,40,0)']]);
  const melt = (x) => H * (1 - (0.12 + heatAt(x) * 0.78));
  for (let i = 0; i < 1500; i++) {
    const x = rnd() * W, heat = heatAt(x), my = melt(x);
    if (rnd() < 1.05 - heat * 1.15) {
      // snow above the melt line; a few big out-of-focus flakes for depth
      const y = rnd() * my, big = rnd() < 0.05;
      const r = big ? 10 + rnd() * 14 : 1.2 + rnd() * 2.4;
      g.globalAlpha = big ? 0.12 + rnd() * 0.1 : 0.3 + rnd() * 0.55;
      g.drawImage(snow, x - r * 2, y - r * 2, r * 4, r * 4);
    } else {
      // embers: thick near the fire, thinning as they rise; short motion streaks
      const y = my - 260 + Math.pow(rnd(), 0.7) * (H - my + 260);
      const r = 0.8 + rnd() * 2.2, len = 1 + rnd() * 2.6, ang = (rnd() - 0.5) * 0.9;
      g.save(); g.translate(x, y); g.rotate(ang); g.scale(1, len);
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = 0.45 + rnd() * 0.55;
      g.drawImage(ember, -r * 3.5, -r * 3.5, r * 7, r * 7);
      g.restore();
      // the moment snow ignites: hot flashes along the melt line
      if (Math.abs(y - my) < 40 && rnd() < 0.35) {
        g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.7;
        const hs = 10 + rnd() * 18; g.drawImage(hot, x - hs / 2, y - hs / 2, hs, hs);
      }
      g.globalCompositeOperation = 'source-over';
    }
  }
  g.globalAlpha = 1;
})();

/* ---------- festoon lights across the whole carousel ---------- */
(function lights(){
  const svg = document.getElementById('lights'), NS = 'http://www.w3.org/2000/svg';
  const span = 1350, top = 14, sag = 92;
  const cols = { warm:['#fff1d6','#ffb547'], red:['#ffb4a6','#ff3b2f'], ember:['#ffc79a','#ff7a24'], green:['#c4f2d4','#52b47a'] };
  const order = ['warm','red','warm','ember','green','warm','red','ember','warm','green'];
  let defs = '', d = '', bulbs = '', k = 0;
  for (const [name,[, glow]] of Object.entries(cols)) defs += \`<radialGradient id="g-\${name}"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".3" stop-color="\${glow}" stop-opacity=".45"/><stop offset="1" stop-color="\${glow}" stop-opacity="0"/></radialGradient>\`;
  for (let x0 = 0; x0 < W; x0 += span) {
    const x1 = x0 + span, cx = (x0 + x1) / 2, cy = top + sag * 2;
    d += \`M\${x0} \${top} Q\${cx} \${cy} \${x1} \${top} \`;
    for (let i = 1; i <= 11; i++) {
      const t = i / 12, x = (1-t)**2*x0 + 2*(1-t)*t*cx + t*t*x1, y = (1-t)**2*top + 2*(1-t)*t*cy + t*t*top;
      const c = order[k++ % order.length], dim = 0.7 + ((k * 37) % 10) / 33;
      bulbs += \`<g transform="translate(\${x.toFixed(1)} \${y.toFixed(1)})" opacity="\${dim.toFixed(2)}"><line x1="0" y1="0" x2="0" y2="11" stroke="#2a201c" stroke-width="2.4"/><rect x="-4.5" y="9" width="9" height="7" rx="1.2" fill="#3a2e28"/><circle cx="0" cy="27" r="44" fill="url(#g-\${c})"/><ellipse cx="0" cy="26" rx="7.5" ry="10.5" fill="\${cols[c][0]}"/></g>\`;
    }
  }
  svg.innerHTML = \`<defs>\${defs}</defs><path d="\${d}" fill="none" stroke="#2a201c" stroke-width="2.6"/>\${bulbs}\`;
})();
document.body.dataset.ready = '1';
}
</script>
</body></html>`;

const dir = mkdtempSync(join(tmpdir(), 'sf-teasers-'));
const file = join(dir, 'teasers.html');
writeFileSync(file, html);

const { chromium } = loadPlaywright();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W * N, height: H }, deviceScaleFactor: 2 });
page.on('pageerror', (e) => console.error('page error:', e.message));
const t0 = Date.now();
await page.goto(pathToFileURL(file).href, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => document.fonts.ready);
await page.waitForFunction(() => document.body.dataset.ready === '1', null, { timeout: 180000 });
console.log(`scene drawn in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
await page.waitForTimeout(400);

mkdirSync(OUT, { recursive: true });
for (const [i, s] of slides.entries()) {
  const path = join(OUT, `season-fest-teaser-0${i + 1}-${s.slug}.jpg`);
  await page.screenshot({ path, type: 'jpeg', quality: 92, clip: { x: i * W, y: 0, width: W, height: H } });
  console.log('wrote', path.replace(root + '/', ''));
}
// Whole carousel as one strip, to preview the continuous scene.
await page.screenshot({ path: join(OUT, 'carousel-preview.jpg'), type: 'jpeg', quality: 85, scale: 'css' });
console.log('wrote campaign/teasers/carousel-preview.jpg');
await browser.close();
