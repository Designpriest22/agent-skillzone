/**
 * "Cinematic" motion template — dark, code-rendered lyric-video language: giant heavy words slamming in one per beat
 * with collapsing echo trails, a glowing digital counter, particles converging into a growing node network, pulse
 * rings behind a word, a 3D wireframe corridor with a floating sign, HUD callouts over an image, a light streak that
 * becomes an oscilloscope wave with text riding it, and a logo reveal. A persistent HUD (mono labels, scene index,
 * timecode), film grain, vignette, bloom on the accent colour, camera drift + punch-ins, flash / invert / chromatic hits.
 *
 * Same page contract as the other templates: everything is computed from `t` in window.renderAt(t); randomness is
 * seeded; layout is measured once in `ready`.
 */
import { readFileSync } from "node:fs";
import { FORMATS, type Storyboard, type VideoFormat } from "./storyboard";
import { safeSvg } from "./template";
import { logoLayers } from "./studio";

const F = {
  display: new URL("../../assets/fonts/archivo-black-latin-400-normal.woff2", import.meta.url),
  condensed: new URL("../../assets/fonts/anton-latin-400-normal.woff2", import.meta.url),
  mono4: new URL("../../assets/fonts/jetbrains-mono-latin-400-normal.woff2", import.meta.url),
  mono7: new URL("../../assets/fonts/jetbrains-mono-latin-700-normal.woff2", import.meta.url),
  inter5: new URL("../../assets/fonts/inter-latin-500-normal.woff2", import.meta.url),
};
let css: string | null = null;
function fonts() {
  if (css) return css;
  const face = (fam: string, w: number, u: URL) => `@font-face{font-family:'${fam}';font-weight:${w};src:url(data:font/woff2;base64,${readFileSync(u).toString("base64")}) format('woff2');}`;
  css = [face("Display", 400, F.display), face("Condensed", 400, F.condensed), face("Mono", 400, F.mono4), face("Mono", 700, F.mono7), face("Inter", 500, F.inter5)].join("\n");
  return css;
}
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const letters = (s: string) => [...s].map((c) => `<span class="lt">${c === " " ? "&nbsp;" : esc(c)}</span>`).join("");

export function buildCinematicHtml(sb: Storyboard, format: VideoFormat, images: Record<string, string> = {}) {
  const { width: W, height: H } = FORMATS[format];
  const portrait = H > W;
  const unit = Math.min(W, H);
  const A = sb.brand.accent ?? "#FD8D18";
  const logo = safeSvg(sb.brand.logo_svg);
  let t0 = 0;
  const scenes = sb.scenes.map((s, i) => {
    const sc = { i, layout: s.layout, start: t0, end: t0 + s.duration, duration: s.duration, transition: s.transition ?? (i === 0 ? "cut" : "punch"), items: s.items ?? [], words: s.words ?? [], tag: (s.eyebrow ?? s.items?.[0] ?? s.headline).split(/\s+/)[0].replace(/[^\w&']/g, "").toUpperCase().slice(0, 10), stat: s.stat ?? null };
    t0 += s.duration;
    return sc;
  });
  const total = t0;
  const M = Math.round(unit * (portrait ? 0.019 : 0.015)); // HUD mono size

  const body = sb.scenes.map((s, i) => {
    let h = "";
    switch (s.layout) {
      case "slam": {
        const ws = s.items?.length ? s.items : s.headline.split(/\s+/);
        h = `<div class="slam-wrap">${ws.map((w, k) => `<div class="slam ${k % 3 === 1 ? "cond" : "wide"} ${k === ws.length - 1 ? "last" : ""}" data-k="${k}">
          ${Array.from({ length: 6 }, (_, e) => `<span class="echo" data-e="${e}">${esc(w)}</span>`).join("")}<span class="main">${letters(w)}</span>
          <div class="slam-tag">${String(k + 1).padStart(2, "0")}/${String(ws.length).padStart(2, "0")} — ${esc(w.replace(/[^\w ]/g, "").toUpperCase())}</div></div>`).join("")}</div>`;
        break;
      }
      case "counter":
        h = `<div class="cnt"><div class="cnt-label">${esc(s.headline)}</div><div class="cnt-num" data-r="num">0</div>
          <div class="cnt-bar"><i data-r="bar"></i></div><div class="cnt-scale"><span>0.00</span><span>0.50</span><span>1.00</span></div></div>`;
        break;
      case "network":
        h = `<canvas class="cv" data-r="cv"></canvas><div class="lyr">${(s.items ?? s.headline.split(/\s+/)).map((w, k) => `<div class="ly ${k === 0 ? "small" : ""}" data-k="${k}">${esc(w)}</div>`).join("")}</div>
          <div class="hudbox"><div>NODES</div><div class="o" data-r="nodes">0001</div><div class="g">GROWTH // LIVE</div></div>`;
        break;
      case "rings":
        h = `<canvas class="cv" data-r="cv"></canvas><div class="ringword" data-r="word">${[...s.headline.toUpperCase()].map((c) => (/[O0]/.test(c) ? `<span class="ro">${c}</span>` : c === " " ? `<span>&nbsp;</span>` : `<span>${esc(c)}</span>`)).join("")}</div>
          ${s.subline ? `<div class="ring-sub" data-r="sub">${esc(s.subline)}</div>` : ""}`;
        break;
      case "corridor":
        h = `<canvas class="cv" data-r="cv"></canvas><div class="sign" data-r="sign"><div class="s1">${esc(s.headline.toUpperCase())}</div>${s.subline ? `<div class="s2">${esc(s.subline.toUpperCase())}</div>` : ""}<div class="s3">PROHUB // SECTOR 0${i + 1}</div></div>`;
        break;
      case "callouts": {
        const img = s.image_file_id ? images[s.image_file_id] : null;
        h = `<div class="cimg" data-r="img" ${img ? `style="background-image:url(${img})"` : ""}></div><div class="ctint"></div><div class="scan"></div>
          <svg class="lead" data-r="lead" viewBox="0 0 ${W} ${H}"></svg>
          <div class="cstack">${(s.items ?? s.headline.split(/\s+/)).map((w, k, arr) => `<div class="cw ${k === arr.length - 1 ? "o" : ""}" data-k="${k}">${esc(w.toUpperCase())}<small>t+00:0${k}.${String(24 + k * 17).padStart(2, "0")}</small></div>`).join("")}</div>
          ${(s.words ?? []).map((w, k) => `<div class="cbox" data-k="${k}"></div><div class="ctag" data-k="${k}">${esc(w.toUpperCase())}</div>`).join("")}`;
        break;
      }
      case "wave":
        h = `<canvas class="cv" data-r="cv"></canvas><svg class="wtext" viewBox="0 0 ${W} ${H}"><path id="wp${i}" data-r="wpath" fill="none"/><text data-r="wtext"><textPath href="#wp${i}" startOffset="4%">${esc(s.headline)}</textPath></text></svg>
          <div class="osc tl">CH1 0.2 V/div DC<br>CH2 SIGNAL &nbsp;${esc(sb.brand.name.toUpperCase())}</div><div class="osc tr">M 111.6 ms/div<br>TRIG ▲ STABLE</div>`;
        break;
      case "logo_reveal":
        h = `<div class="streak" data-r="streak"></div><div class="lwrap"><i class="br a"></i><i class="br b"></i><i class="br c"></i><i class="br d"></i>
          <div class="logo" data-r="logo">${logoLayers(logo, sb.brand.name)}</div></div>
          <div class="ltag" data-r="tagline">${esc(s.headline.toUpperCase())}</div>${s.button ? `<div class="lcta" data-r="cta">${esc(s.button.toUpperCase())} →</div>` : ""}${s.contact ? `<div class="lcontact" data-r="contact">${esc(s.contact)}</div>` : ""}`;
        break;
    }
    return `<section class="scene" data-i="${i}"><div class="cam">${h}</div></section>`;
  }).join("\n");

  const data = JSON.stringify({ W, H, unit, portrait, A, beat: sb.beat_seconds ?? 0.6, total, fps: sb.fps, scenes });
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${fonts()}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;overflow:hidden;background:#0A0A0A;color:#EDEAE3}
body{font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased}
#stage{position:absolute;inset:0}
.scene{position:absolute;inset:0;overflow:hidden;visibility:hidden;background:#0A0A0A}
.cam{position:absolute;inset:0;transform-origin:50% 50%}
.cv{position:absolute;inset:0;width:100%;height:100%}
.slam-wrap{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
.slam{position:absolute;left:0;right:0;top:50%;text-align:center;visibility:hidden}
.slam .main{display:inline-block;white-space:nowrap;line-height:.9}
.slam .echo{display:block;white-space:nowrap;line-height:.9}
.slam.wide .main,.slam.wide .echo{font-family:'Display';font-size:${Math.round(unit * 0.2)}px;letter-spacing:-.01em}
.slam.cond .main,.slam.cond .echo{font-family:'Condensed';font-size:${Math.round(H * (portrait ? 0.34 : 0.62))}px;letter-spacing:-.005em;line-height:.86}
.slam .echo{position:absolute;left:0;right:0;top:0;color:transparent;-webkit-text-stroke:${Math.max(2, Math.round(unit * 0.003))}px rgba(237,234,227,.55)}
.slam.last .main{color:${A};text-shadow:0 0 ${Math.round(unit * 0.03)}px ${A}88}
.lt{display:inline-block}
.slam-tag{font-family:'Mono';font-size:${M}px;color:#8a8a8a;letter-spacing:.12em;margin-top:${Math.round(unit * 0.02)}px}
.cnt{position:absolute;left:${Math.round(W * 0.08)}px;right:${Math.round(W * 0.08)}px;top:50%;transform:translateY(-50%)}
.cnt-label{font-family:'Display';font-size:${Math.round(unit * (portrait ? 0.062 : 0.05))}px;line-height:1;color:#EDEAE3;margin-bottom:${Math.round(unit * 0.02)}px}
.cnt-num{font-family:'Mono';font-weight:700;font-size:${Math.round(unit * (portrait ? 0.3 : 0.27))}px;line-height:1;color:${A};text-shadow:0 0 ${Math.round(unit * 0.02)}px ${A},0 0 ${Math.round(unit * 0.07)}px ${A}99;letter-spacing:-.02em}
.cnt-bar{height:${Math.max(3, Math.round(unit * 0.004))}px;background:#2a2a2a;margin-top:${Math.round(unit * 0.02)}px}
.cnt-bar i{display:block;height:100%;width:0;background:${A};box-shadow:0 0 12px ${A}}
.cnt-scale{display:flex;justify-content:space-between;font-family:'Mono';font-size:${M}px;color:#777;margin-top:6px}
.lyr{position:absolute;left:${Math.round(W * 0.07)}px;top:${Math.round(H * (portrait ? 0.14 : 0.12))}px}
.ly{font-family:'Display';font-size:${Math.round(unit * (portrait ? 0.12 : 0.1))}px;line-height:.98;color:#5a5a5a}
.ly.small{font-size:${Math.round(unit * 0.045)}px;margin-bottom:${Math.round(unit * 0.01)}px}
.hudbox{position:absolute;right:${Math.round(W * 0.06)}px;top:${Math.round(H * (portrait ? 0.14 : 0.12))}px;font-family:'Mono';font-size:${M}px;text-align:right;color:#8a8a8a;letter-spacing:.1em}
.hudbox .o{color:${A};font-size:${Math.round(M * 1.8)}px;font-weight:700}
.hudbox .g{font-size:${Math.round(M * 0.8)}px;opacity:.7}
.ringword{position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);text-align:center;font-family:'Display';font-size:${Math.round(unit * (portrait ? 0.22 : 0.24))}px;line-height:1;white-space:nowrap}
.ringword span{display:inline-block}
.ro{color:transparent;-webkit-text-stroke:${Math.max(3, Math.round(unit * 0.006))}px ${A};filter:drop-shadow(0 0 ${Math.round(unit * 0.012)}px ${A})}
.ring-sub{position:absolute;left:0;right:0;top:${Math.round(H * 0.5 + unit * 0.17)}px;text-align:center;font-family:'Mono';font-size:${Math.round(M * 1.4)}px;letter-spacing:.2em;color:#bdbdbd}
.sign{position:absolute;left:50%;top:${Math.round(H * (portrait ? 0.4 : 0.42))}px;background:#0b0b0b;border:2px solid #d9d9d9;padding:${Math.round(unit * 0.03)}px ${Math.round(unit * 0.045)}px;text-align:center;transform-origin:50% 50%;box-shadow:0 0 40px #000}
.sign .s1{font-family:'Display';font-size:${Math.round(unit * 0.06)}px;line-height:1.05;white-space:nowrap}
.sign .s2{font-family:'Display';font-size:${Math.round(unit * 0.06)}px;line-height:1.05;color:${A};white-space:nowrap;text-shadow:0 0 18px ${A}66}
.sign .s3{font-family:'Mono';font-size:${Math.round(M * 0.9)}px;color:#888;margin-top:8px;letter-spacing:.2em}
.cimg{position:absolute;inset:-4%;background-size:cover;background-position:center;filter:grayscale(1) contrast(1.35) brightness(.75)}
.ctint{position:absolute;inset:0;background:radial-gradient(circle at 60% 50%,${A}55,transparent 60%);mix-blend-mode:screen}
.scan{position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,.25) 0 2px,transparent 2px 4px)}
.lead{position:absolute;inset:0;width:100%;height:100%}
.cstack{position:absolute;left:${Math.round(W * 0.06)}px;top:50%;transform:translateY(-50%)}
.cw{font-family:'Display';font-size:${Math.round(unit * (portrait ? 0.075 : 0.06))}px;line-height:1.02;margin-bottom:${Math.round(unit * 0.012)}px;text-shadow:0 2px 20px #000}
.cw small{display:block;font-family:'Mono';font-size:${Math.round(M * 0.75)}px;color:#9a9a9a;letter-spacing:.1em}
.cw.o{color:${A};text-shadow:0 0 20px ${A}88}
.cbox{position:absolute;border:2px solid ${A};box-shadow:0 0 12px ${A}aa}
.ctag{position:absolute;background:${A};color:#0A0A0A;font-family:'Mono';font-weight:700;font-size:${Math.round(M * 0.95)}px;padding:2px 8px;letter-spacing:.08em;white-space:nowrap}
.wtext{position:absolute;inset:0;width:100%;height:100%}
.wtext text{font-family:'Inter';font-weight:500;font-size:${Math.round(unit * (portrait ? 0.072 : 0.06))}px;fill:none;stroke:${A};stroke-width:1.6;filter:drop-shadow(0 0 6px ${A})}
.osc{position:absolute;font-family:'Mono';font-size:${M}px;color:#8a8a8a;line-height:1.5;letter-spacing:.06em}
.osc.tl{left:${Math.round(W * 0.06)}px;top:${Math.round(H * (portrait ? 0.14 : 0.1))}px}.osc.tr{right:${Math.round(W * 0.06)}px;top:${Math.round(H * (portrait ? 0.14 : 0.1))}px;text-align:right}
.streak{position:absolute;left:0;right:0;top:50%;height:${Math.max(2, Math.round(unit * 0.004))}px;background:linear-gradient(90deg,transparent,#fff 45%,${A} 55%,transparent);box-shadow:0 0 30px ${A};opacity:0}
.lwrap{position:absolute;left:50%;top:50%;transform:translate(-50%,-56%);padding:${Math.round(unit * 0.05)}px}
.logo{position:relative;width:${Math.round(W * (portrait ? 0.72 : 0.44))}px}
.ll{position:absolute;inset:0}.ll:first-child{position:relative}.ll svg{display:block;width:100%;height:auto}
.ll[data-layer=swoosh]{filter:drop-shadow(0 0 ${Math.round(unit * 0.012)}px ${A})}
.wordmark-text{font-family:'Display';font-size:${Math.round(unit * 0.15)}px}
.br{position:absolute;width:${Math.round(unit * 0.05)}px;height:${Math.round(unit * 0.05)}px;border-color:${A};border-style:solid;opacity:0}
.br.a{left:0;top:0;border-width:3px 0 0 3px}.br.b{right:0;top:0;border-width:3px 3px 0 0}.br.c{left:0;bottom:0;border-width:0 0 3px 3px}.br.d{right:0;bottom:0;border-width:0 3px 3px 0}
.ltag{position:absolute;left:0;right:0;top:${Math.round(H * 0.5 + unit * (portrait ? 0.2 : 0.15))}px;text-align:center;font-family:'Mono';font-size:${Math.round(M * 1.3)}px;letter-spacing:.3em;color:#cfcfcf}
.lcta{position:absolute;left:50%;top:${Math.round(H * 0.5 + unit * (portrait ? 0.27 : 0.22))}px;transform:translateX(-50%);background:${A};color:#0A0A0A;font-family:'Mono';font-weight:700;font-size:${Math.round(M * 1.5)}px;padding:${Math.round(M * 0.5)}px ${Math.round(M * 1.2)}px;letter-spacing:.12em;white-space:nowrap;box-shadow:0 0 30px ${A}88}
.lcontact{position:absolute;left:0;right:0;top:${Math.round(H * 0.5 + unit * (portrait ? 0.34 : 0.29))}px;text-align:center;font-family:'Mono';font-size:${Math.round(M * 1.2)}px;color:#bdbdbd}
#hud{position:absolute;inset:0;pointer-events:none;font-family:'Mono';font-size:${M}px;color:#8a8a8a;letter-spacing:.08em;z-index:30}
#hud .tl{position:absolute;left:${Math.round(W * 0.05)}px;top:${Math.round(H * 0.035)}px}
#hud .tr{position:absolute;right:${Math.round(W * 0.05)}px;top:${Math.round(H * 0.035)}px;text-align:right}
#hud .bl{position:absolute;left:${Math.round(W * 0.05)}px;bottom:${Math.round(H * 0.035)}px}
#hud .br2{position:absolute;right:${Math.round(W * 0.05)}px;bottom:${Math.round(H * 0.035)}px;text-align:right}
#hud .idx span{margin-right:${Math.round(M * 0.9)}px}#hud .idx span.on{color:${A}}
#hud .rule{position:absolute;left:${Math.round(W * 0.05)}px;right:${Math.round(W * 0.05)}px;top:${Math.round(H * 0.035 + M * 2.6)}px;height:1px;background:#2b2b2b}
#hud .rec{color:${A}}
#grain{position:absolute;inset:0;width:100%;height:100%;z-index:40;opacity:.09;mix-blend-mode:screen;pointer-events:none}
#vig{position:absolute;inset:0;z-index:39;background:radial-gradient(ellipse at center,transparent 55%,rgba(0,0,0,.55));pointer-events:none}
#flash{position:absolute;inset:0;z-index:45;background:#fff;opacity:0}
</style></head><body><div id="stage">${body}</div>
<div id="hud"><div class="tl">${esc(sb.brand.name.toUpperCase())} // BRAND FILM 01<div class="idx" data-r="idx">${scenes.map((s, k) => `<span data-k="${k}">${String(k + 1).padStart(2, "0")} ${esc(s.tag)}</span>`).join("")}</div></div>
<div class="tr"><span class="rec">● REC</span> <span data-r="tc">00:00:00:00</span><br>${sb.fps}FPS · ${W}×${H}</div><div class="rule"></div>
<div class="bl" data-r="sidx">01/${String(scenes.length).padStart(2, "0")}</div><div class="br2">CREATIVE &amp; DIGITAL</div></div>
<canvas id="grain"></canvas><div id="vig"></div><div id="flash"></div>
<script>
var D=${data};var A=D.A;
var clamp=function(x){return x<0?0:x>1?1:x};
var E={lin:function(t){return t},out:function(t){return 1-Math.pow(1-t,3)},expo:function(t){return t===1?1:1-Math.pow(2,-10*t)},inq:function(t){return t*t*t},io:function(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2},back:function(t){var c=1.7;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2)}};
function tw(lt,a,d,e){return E[e||'expo'](clamp((lt-a)/d))}
function lerp(a,b,p){return a+(b-a)*p}
function rnd(n){var x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x)}
function q(r,s){return r.querySelector(s)}function qa(r,s){return [].slice.call(r.querySelectorAll(s))}
var roots=qa(document,'.scene');var MS=[];var B=D.beat;
function ctx2d(r){var c=q(r,'[data-r=cv]');if(!c)return null;if(!c._x){c.width=D.W;c.height=D.H;c._x=c.getContext('2d')}var x=c._x;x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,D.W,D.H);return x}
function glowLine(x,pts,col,w,blur){x.save();x.strokeStyle=col;x.lineWidth=w;x.shadowColor=col;x.shadowBlur=blur;x.beginPath();pts.forEach(function(p,i){i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1])});x.stroke();x.restore()}

var R={
 slam:function(r,lt,s,m){var ws=qa(r,'.slam');var n=ws.length;var step=Math.min(s.duration/n,Math.max(B,0.35));
  var k=Math.min(n-1,Math.floor(lt/step));
  ws.forEach(function(w,j){w.style.visibility=j===k?'visible':'hidden'});var w=ws[k];var lt2=lt-k*step;var p=tw(lt2,0,0.28,'expo');
  w.style.transform='translateY(-50%) scale('+(1+0.06*(1-p)+0.03*clamp(lt2/step))+')';
  qa(w,'.echo').forEach(function(e,i){var off=(i+1)*D.unit*0.035*(1-p);e.style.transform='translateY('+off+'px)';e.style.opacity=String((1-p)*(1-i/7))});
  var ls=qa(w,'.lt');ls.forEach(function(l,i){var a=i*Math.min(0.045,0.2/ls.length);var lp=tw(lt2,a,0.16,'out');l.style.opacity=String(lp);l.style.transform='translateY('+((1-lp)*D.unit*0.05)+'px)'});
  m.flash=Math.max(0,0.22*(1-lt2/0.08))},
 counter:function(r,lt,s,m){var v=s.stat?s.stat.value:100;var suf=s.stat&&s.stat.suffix!=null?s.stat.suffix:'%';var p=tw(lt,0.15,s.duration*0.62,'io');
  var cur=Math.round(v*p);q(r,'[data-r=num]').textContent=String(cur).padStart(String(v).length,'0')+suf;q(r,'[data-r=bar]').style.width=(p*100)+'%';
  var done=s.duration*0.62+0.15;m.invert=lt>done&&lt<done+0.1;q(r,'.cnt').style.transform='translateY(-50%) translateX('+(Math.sin(lt*40)*(p<1?D.unit*0.002:0))+'px)'},
 network:function(r,lt,s,m){var x=ctx2d(r);var fx=D.W*0.62,fy=D.H*(D.portrait?0.58:0.56);
  x.strokeStyle='rgba(237,234,227,.08)';x.lineWidth=1;for(var c=1;c<5;c++){x.beginPath();x.arc(fx,fy,D.unit*0.12*c,0,7);x.stroke()}
  for(var i=0;i<240;i++){var a=rnd(i)*6.283,d=D.unit*(0.25+rnd(i+9)*0.6);var p=tw(lt,rnd(i+3)*0.5,0.9,'inq');if(p>=1)continue;
   var px=fx+Math.cos(a)*d*(1-p),py=fy+Math.sin(a)*d*0.7*(1-p);var tl=D.unit*0.012*(0.3+p*2);x.strokeStyle='rgba(237,234,227,'+(0.7*(1-p))+')';x.beginPath();x.moveTo(px,py);x.lineTo(px+Math.cos(a)*tl,py+Math.sin(a)*tl*0.7);x.stroke()}
  var core=tw(lt,0.7,0.3);x.save();x.fillStyle=A;x.shadowColor=A;x.shadowBlur=30;x.beginPath();x.arc(fx,fy,D.unit*0.008*(1+core),0,7);x.fill();x.restore();
  var nodes=0;var segs=m.segs;segs.forEach(function(g){var gp=tw(lt,0.8+g.d*0.28+g.o,0.35,'out');if(gp<=0)return;var ex=lerp(g.x1,g.x2,gp),ey=lerp(g.y1,g.y2,gp);
   glowLine(x,[[g.x1,g.y1],[ex,ey]],'rgba(240,226,210,.85)',Math.max(1.5,D.unit*0.0022),8);if(gp>=1){nodes++;x.save();x.fillStyle=A;x.shadowColor=A;x.shadowBlur=18;x.beginPath();x.arc(g.x2,g.y2,D.unit*0.005,0,7);x.fill();x.restore()}});
  q(r,'[data-r=nodes]').textContent=String(Math.max(1,nodes)).padStart(4,'0');
  var ly=qa(r,'.ly');var stepW=Math.max(0.3,(s.duration-0.6)/(ly.length+1));ly.forEach(function(l,j){var a=0.2+j*stepW;var on=tw(lt,a,0.25);var next=lt>a+stepW;
   l.style.opacity=String(on);l.style.transform='translateY('+((1-on)*D.unit*0.03)+'px)';l.style.color=j===0?'#d8d8d8':(lt>=a&&!next?A:(next?'#EDEAE3':'#5a5a5a'));l.style.textShadow=(lt>=a&&!next&&j)?'0 0 24px '+A+'88':'none'})},
 rings:function(r,lt,s,m){var x=ctx2d(r);var cx=D.W/2,cy=D.H/2;for(var i=0;i<9;i++){var rr=((lt*0.5+i/9)%1);var R2=D.unit*(0.08+rr*0.9);
   x.save();x.strokeStyle='rgba(255,90,40,'+(0.65*(1-rr))+')';x.lineWidth=Math.max(1.5,D.unit*0.003);x.shadowColor=A;x.shadowBlur=14;x.beginPath();x.arc(cx,cy,R2,0,7);x.stroke();x.restore()}
  var wd=q(r,'[data-r=word]');var p=tw(lt,0,0.35,'expo');var beatPulse=1+0.035*Math.max(0,1-((lt%B)/0.12));wd.style.transform='translateY(-50%) scale('+((1.5-0.5*p)*beatPulse)+')';wd.style.opacity=String(p);wd.style.filter='blur('+((1-p)*D.unit*0.01)+'px)';
  var sb2=q(r,'[data-r=sub]');if(sb2)sb2.style.opacity=String(tw(lt,0.5,0.3))},
 corridor:function(r,lt,s,m){var x=ctx2d(r);var f=D.portrait?D.W*0.95:D.H*0.95;var cz=lt*2.0,camx=Math.sin(lt*0.7)*0.12;var cx=D.W/2,cy=D.H*0.5;var wdt=1.5,hh=1.15;
  function P(X,Y,Z){var z=Z-cz;if(z<0.2)return null;return [cx+f*(X-camx)/z,cy-f*Y/z,z]}
  function L(a,b,al){if(!a||!b)return;x.strokeStyle='rgba(225,225,225,'+al+')';x.beginPath();x.moveTo(a[0],a[1]);x.lineTo(b[0],b[1]);x.stroke()}
  x.lineWidth=Math.max(1,D.unit*0.0014);
  for(var zi=0;zi<26;zi++){var Z=Math.floor(cz/1.2)*1.2+zi*1.2;var al=clamp(1-(Z-cz)/24)*0.75;if(al<=0)continue;
   [-wdt,wdt].forEach(function(X,side){L(P(X,-hh,Z),P(X,hh,Z),al);for(var sh=0;sh<6;sh++){var Y=-hh+sh*(2*hh/5);L(P(X,Y,Z),P(X,Y,Z+1.2),al*0.8);
     for(var bk=0;bk<5;bk++){var bz=Z+0.1+bk*0.22;var bh=0.12+rnd(zi*31+sh*7+bk+side*99)*0.16;if(sh<5)L(P(X,Y,bz),P(X,Y+bh,bz),al*0.45)}}});
   L(P(-wdt,-hh,Z),P(wdt,-hh,Z),al*0.6);L(P(-wdt,hh,Z),P(wdt,hh,Z),al*0.4);if(zi%2===0){L(P(-0.4,hh,Z),P(0.4,hh,Z),al);L(P(-0.4,hh,Z+0.6),P(0.4,hh,Z+0.6),al)}}
  for(var gx=-wdt;gx<=wdt+0.01;gx+=0.5)L(P(gx,-hh,cz+0.3),P(gx,-hh,cz+30),0.25);
  var zs=7.5;var sp=tw(lt,0.3,0.6,'expo');var depth=Math.max(1.4,zs-cz*0.55);var sc=(f/depth)/(f/4.2);var sg=q(r,'[data-r=sign]');
  sg.style.transform='translate(-50%,-50%) scale('+(sc*(0.6+0.4*sp))+') perspective(900px) rotateY('+(Math.sin(lt*0.8)*6)+'deg)';sg.style.opacity=String(sp);
  var s2=q(sg,'.s2');if(s2)s2.style.opacity=String(tw(lt,0.3+B*2,0.25))},
 callouts:function(r,lt,s,m){var img=q(r,'[data-r=img]');img.style.transform='scale('+(1.05+0.08*clamp(lt/s.duration))+') translateX('+(-D.unit*0.02*clamp(lt/s.duration))+'px)';
  var cws=qa(r,'.cw');var st=Math.max(0.25,(s.duration-0.8)/(cws.length+1));cws.forEach(function(c,j){var p=tw(lt,0.2+j*st,0.25);c.style.opacity=String(p);c.style.transform='translateX('+((1-p)*-D.unit*0.04)+'px)'});
  var svg=q(r,'[data-r=lead]');var html='';qa(r,'.cbox').forEach(function(b,j){var g=m.boxes[j];var p=tw(lt,0.45+j*0.3,0.3,'back');b.style.left=g.x+'px';b.style.top=g.y+'px';b.style.width=g.w+'px';b.style.height=g.h+'px';
   b.style.transform='scale('+p+')';b.style.opacity=String(clamp(p));var lp=tw(lt,0.6+j*0.3,0.3);var tg=q(r,'.ctag[data-k="'+j+'"]');tg.style.left=g.tx+'px';tg.style.top=g.ty+'px';tg.style.opacity=String(lp);
   var x1=g.x+g.w/2,y1=g.y+g.h/2;html+='<polyline points="'+x1+','+y1+' '+lerp(x1,g.tx,lp)+','+lerp(y1,g.ty+10,lp)+'" stroke="'+A+'" stroke-width="2" fill="none" opacity="'+lp+'"/>'});svg.innerHTML=html},
 wave:function(r,lt,s,m){var x=ctx2d(r);var cy=D.H*0.56;var gp=tw(lt,0.4,0.5);x.strokeStyle='rgba(255,110,60,'+(0.16*gp)+')';x.lineWidth=1;var gs=D.unit*0.06;
  for(var gx=D.W*0.04;gx<D.W*0.97;gx+=gs){x.beginPath();x.moveTo(gx,D.H*0.2);x.lineTo(gx,D.H*0.86);x.stroke()}for(var gy=D.H*0.2;gy<D.H*0.87;gy+=gs){x.beginPath();x.moveTo(D.W*0.04,gy);x.lineTo(D.W*0.96,gy);x.stroke()}
  var sp=tw(lt,0,0.4,'expo');var amp=D.unit*0.07*tw(lt,0.6,0.6,'io');var ph=lt*3.2;var pts=[];var x0=D.W*(0.5-0.5*sp),x1=D.W*(0.5+0.5*sp);
  for(var xx=x0;xx<=x1;xx+=6){pts.push([xx,cy+Math.sin((xx/D.W)*12.5-ph)*amp])}glowLine(x,pts,A,Math.max(2,D.unit*0.004),24);glowLine(x,pts,'#FFE2C8',Math.max(1,D.unit*0.0015),4);
  var d='';for(var px=0;px<=D.W;px+=12){var py=cy-D.unit*0.04+Math.sin((px/D.W)*12.5-ph)*amp;d+=(px?'L':'M')+px+' '+py}q(r,'[data-r=wpath]').setAttribute('d',d);
  var tx=q(r,'[data-r=wtext]');var tp=tw(lt,0.9,Math.max(0.6,s.duration-1.5),'lin');tx.style.clipPath='inset(0 '+((1-tp)*100)+'% 0 0)'},
 logo_reveal:function(r,lt,s,m){var st=q(r,'[data-r=streak]');var sp=tw(lt,0,0.45,'expo');st.style.opacity=String(lt<0.6?1-tw(lt,0.35,0.25):0);st.style.transform='scaleX('+sp+')';
  var L=q(r,'[data-r=logo]');L.style.transform='scale('+(1+0.03*clamp(lt/s.duration))+')';
  qa(L,'.ll').forEach(function(l){var id=l.getAttribute('data-layer');var ext=m.layers[id]||[0,100];
   if(id==='mark'||id==='all'){var p=tw(lt,0.3,0.6,'expo');l.style.opacity=String(clamp(p*1.4));l.style.filter='blur('+((1-p)*D.unit*0.015)+'px)';l.style.transform='scale('+(0.8+0.2*p)+')'}
   else{var a=id==='swoosh'?0.55:0.6,dd=id==='swoosh'?0.3:0.5;var p2=tw(lt,a,dd,'expo');l.style.clipPath='inset(-20% '+(100-lerp(ext[0],ext[1],p2))+'% -20% -20%)';
     var j=lt<a+dd+0.15?(rnd(Math.floor(lt*30))-0.5)*D.unit*0.01:0;l.style.transform='translateX('+j+'px)'}});
  qa(r,'.br').forEach(function(b,k){var p=tw(lt,0.9+k*0.05,0.3,'back');b.style.opacity=String(clamp(p));b.style.transform='scale('+(1.6-0.6*p)+')'});
  var tg=q(r,'[data-r=tagline]');tg.style.opacity=String(tw(lt,1.1,0.4));var ct=q(r,'[data-r=cta]');if(ct){var cp=tw(lt,1.5,0.35,'back');ct.style.opacity=String(clamp(cp));ct.style.transform='translateX(-50%) scale('+(0.7+0.3*cp)+')'}
  var cn=q(r,'[data-r=contact]');if(cn)cn.style.opacity=String(tw(lt,1.8,0.4));m.flash=lt>0.28&&lt<0.4?0.5*(1-(lt-0.28)/0.12):0;
  var fade=1-tw(lt,s.duration-0.8,0.75,'out');r.style.opacity=String(fade);document.getElementById('hud').style.opacity=String(fade)}
};

function measure(){roots.forEach(function(r,i){var s=D.scenes[i];var m={};r.style.visibility='visible';
 if(s.layout==='rings'){var rw=q(r,'[data-r=word]');var sp=rw.children;var cw=function(){return sp[sp.length-1].getBoundingClientRect().right-sp[0].getBoundingClientRect().left};var g2=0;while(g2++<50&&cw()>D.W*0.86){rw.style.fontSize=(parseFloat(getComputedStyle(rw).fontSize)*0.95)+'px'}}
 if(s.layout==='slam'){qa(r,'.slam').forEach(function(w){w.style.visibility='visible';var main=q(w,'.main');var maxW=D.W*0.9,maxH=D.H*(D.portrait?0.36:0.64);var g=0;
   while(g++<60&&(main.getBoundingClientRect().width>maxW||main.getBoundingClientRect().height>maxH)){var fs=parseFloat(getComputedStyle(main).fontSize)*0.95;main.style.fontSize=fs+'px';qa(w,'.echo').forEach(function(e){e.style.fontSize=fs+'px'})}w.style.visibility='hidden'})}
 if(s.layout==='network'){var fx=D.W*0.62,fy=D.H*(D.portrait?0.58:0.56);var segs=[];var id=0;
   (function grow(x,y,a,len,d){if(d>5)return;var n=d===0?3:2;for(var b=0;b<n;b++){id++;var na=a+(b-(n-1)/2)*(0.9-d*0.08)+(rnd(id)-0.5)*0.5;var l=len*(0.72+rnd(id+5)*0.25);
     var x2=x+Math.cos(na)*l,y2=y+Math.sin(na)*l;segs.push({x1:x,y1:y,x2:x2,y2:y2,d:d,o:rnd(id+11)*0.1});grow(x2,y2,na,l,d+1)}})(fx,fy,-2.3,D.unit*0.16,0);m.segs=segs}
 if(s.layout==='callouts'){var sl=[[0.56,0.3],[0.74,0.46],[0.6,0.62],[0.8,0.72]];m.boxes=qa(r,'.cbox').map(function(b,k){var p=sl[k%4];var bw=D.unit*0.09,bh=D.unit*0.07;var bx=D.W*p[0],by=D.H*p[1];
   var tx=bx+(k%2?-D.unit*0.2:D.unit*0.12),ty=by-D.unit*0.08;tx=Math.min(D.W-D.unit*0.22,Math.max(D.W*0.45,tx));return {x:bx,y:by,w:bw,h:bh,tx:tx,ty:ty}})}
 if(s.layout==='logo_reveal'){var L=q(r,'[data-r=logo]');var lr=L.getBoundingClientRect();m.layers={};qa(L,'.ll').forEach(function(l){var id2=l.getAttribute('data-layer');var p=q(l,'path:not([style*="display:none"])');
   if(p){var pr=p.getBoundingClientRect();m.layers[id2]=[(pr.left-lr.left)/lr.width*100,(pr.right-lr.left)/lr.width*100]}})}
 r.style.visibility='hidden';MS[i]=m})}

var grain=document.getElementById('grain');var gx;var tiles=[];
function makeGrain(){var gw=Math.round(D.W/3),gh=Math.round(D.H/3);grain.width=gw;grain.height=gh;gx=grain.getContext('2d');for(var t=0;t<6;t++){var im=gx.createImageData(gw,gh);
  for(var p=0;p<im.data.length;p+=4){var v=rnd(p*0.37+t*7919)*255;im.data[p]=im.data[p+1]=im.data[p+2]=v;im.data[p+3]=255}tiles.push(im)}}
window.ready=document.fonts.ready.then(function(){measure();makeGrain();window.renderAt(0);return true});
var stage=document.getElementById('stage');var flash=document.getElementById('flash');var hud=document.getElementById('hud');
function tc(t){var f=Math.floor(t*D.fps);var s=Math.floor(f/D.fps);return '00:00:'+String(s).padStart(2,'0')+':'+String(f%D.fps).padStart(2,'0')}
window.renderAt=function(t){var fl=0,inv=false,chroma=0,cur=0;
 roots.forEach(function(r,i){var s=D.scenes[i];var last=i===D.scenes.length-1;var vis=t>=s.start-1e-6&&(t<s.end||(last&&t<=D.total+1));r.style.visibility=vis?'visible':'hidden';if(!vis)return;cur=i;
  var lt=t-s.start;var m=MS[i];m.flash=0;m.invert=false;
  var cam=q(r,'.cam');var drift=1+0.045*clamp(lt/s.duration);var rot=Math.sin(lt*0.6+i)*0.6;var sx=0,sy=0,blur=0;
  if(s.transition==='punch'){var pp=tw(lt,0,0.32,'expo');drift*=1+0.22*(1-pp);blur=(1-pp)*D.unit*0.012;var sh=Math.max(0,1-lt/0.25);sx=(rnd(Math.floor(t*30))-0.5)*D.unit*0.03*sh;sy=(rnd(Math.floor(t*30)+5)-0.5)*D.unit*0.03*sh;fl=Math.max(fl,0.35*(1-tw(lt,0,0.1,'out')));chroma=Math.max(chroma,1-tw(lt,0,0.18,'out'))}
  cam.style.transform='translate('+sx+'px,'+sy+'px) rotate('+rot+'deg) scale('+drift+')';cam.style.filter=blur>0.3?'blur('+blur+'px)':'none';
  R[s.layout](r,lt,s,m);fl=Math.max(fl,m.flash||0);inv=inv||m.invert});
 var cs=Math.round(chroma*D.unit*0.006);stage.style.filter=(inv?'invert(1) ':'')+(cs>0?'drop-shadow('+cs+'px 0 0 rgba(255,0,60,.55)) drop-shadow(-'+cs+'px 0 0 rgba(0,190,255,.45))':'');
 if(!stage.style.filter.trim())stage.style.filter='none';flash.style.opacity=String(fl);
 q(hud,'[data-r=tc]').textContent=tc(t);q(hud,'[data-r=sidx]').textContent=String(cur+1).padStart(2,'0')+'/'+String(D.scenes.length).padStart(2,'0');
 var win=D.portrait||D.W===D.H?1:2;qa(hud,'.idx span').forEach(function(sp,k){sp.className=k===cur?'on':'';sp.style.display=Math.abs(k-cur)<=win?'inline':'none'});
 if(gx)gx.putImageData(tiles[Math.floor(t*D.fps)%tiles.length],0,0)};
</script></body></html>`;
}
