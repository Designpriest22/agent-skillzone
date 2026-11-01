/**
 * Deterministic HTML motion template. One self-contained page per format; the renderer calls
 * window.renderAt(seconds) for every frame. Rules (from the hyperframes-animation skill): a single seekable
 * timeline, no clocks or randomness, layout measured once up front, motion only via transform + opacity.
 */
import { readFileSync } from "node:fs";
import { FORMATS, NEUTRAL, type Storyboard, type VideoFormat } from "./storyboard";

/** Static asset URLs so bundlers trace exactly these files (OFL fonts, see assets/fonts/LICENSE.md). */
const FONT_URLS = {
  anton400: new URL("../../assets/fonts/anton-latin-400-normal.woff2", import.meta.url),
  mont500: new URL("../../assets/fonts/montserrat-latin-500-normal.woff2", import.meta.url),
  mont700: new URL("../../assets/fonts/montserrat-latin-700-normal.woff2", import.meta.url),
  mont800: new URL("../../assets/fonts/montserrat-latin-800-normal.woff2", import.meta.url),
  oswald600: new URL("../../assets/fonts/oswald-latin-600-normal.woff2", import.meta.url),
};
const FONT_FILES: Record<string, { family: string; weight: number; url: URL }[]> = {
  Anton: [{ family: "Anton", weight: 400, url: FONT_URLS.anton400 }],
  Montserrat: [
    { family: "Montserrat", weight: 500, url: FONT_URLS.mont500 },
    { family: "Montserrat", weight: 700, url: FONT_URLS.mont700 },
    { family: "Montserrat", weight: 800, url: FONT_URLS.mont800 },
  ],
  Oswald: [{ family: "Oswald", weight: 600, url: FONT_URLS.oswald600 }],
};

const fontCache = new Map<string, string>();
function fontFaces(heading: string) {
  const wanted = [...(FONT_FILES[heading] ?? []), ...FONT_FILES.Montserrat];
  const seen = new Set<string>();
  return wanted.filter((f) => !seen.has(f.url.href) && seen.add(f.url.href)).map((f) => {
    let b64 = fontCache.get(f.url.href);
    if (!b64) { b64 = readFileSync(f.url).toString("base64"); fontCache.set(f.url.href, b64); }
    return `@font-face{font-family:'${f.family}';font-weight:${f.weight};font-style:normal;src:url(data:font/woff2;base64,${b64}) format('woff2');}`;
  }).join("\n");
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

/** Strip anything executable from an inline SVG logo. */
export function safeSvg(svg?: string) {
  if (!svg || !/^\s*(<\?xml[^>]*>\s*)?<svg[\s>]/i.test(svg)) return null;
  if (/<script|on\w+\s*=|javascript:|<foreignObject/i.test(svg)) return null;
  return svg.replace(/<\?xml[^>]*>/, "");
}

export function buildHtml(sb: Storyboard, format: VideoFormat, images: Record<string, string> = {}) {
  const { width: W, height: H } = FORMATS[format];
  const c = { ...NEUTRAL, ...Object.fromEntries(Object.entries(sb.brand).filter(([k, v]) => ["primary", "secondary", "accent", "background", "text"].includes(k) && v)) } as typeof NEUTRAL;
  const portrait = H > W;
  // Safe zones: keep copy clear of platform UI (captions, buttons) on vertical placements.
  const pad = portrait ? { t: H * 0.13, b: H * 0.2, x: W * 0.085 } : format === "16:9" ? { t: H * 0.12, b: H * 0.12, x: W * 0.08 } : { t: H * 0.1, b: H * 0.12, x: W * 0.085 };
  const unit = Math.min(W, H);
  const logo = safeSvg(sb.brand.logo_svg);
  let t0 = 0;
  const scenes = sb.scenes.map((s, i) => {
    const sc = { ...s, i, start: t0, end: t0 + s.duration, img: s.image_file_id ? images[s.image_file_id] ?? null : null };
    t0 += s.duration;
    return sc;
  });
  const data = JSON.stringify({ W, H, unit, scenes, total: t0, colors: c, portrait, brandName: sb.brand.name });

  const bgFor = (bg: string) => bg === "dark" ? c.background : bg === "light" ? c.text : bg === "accent" ? c.accent : c.primary;
  const fgFor = (bg: string) => bg === "light" || bg === "accent" ? c.background : c.text;

  const sceneHtml = scenes.map((s) => {
    const bg = bgFor(s.background), fg = fgFor(s.background);
    const accent = s.background === "accent" ? c.background : c.accent;
    const words = s.headline.split(/\s+/).map((w, k) => `<span class="w" data-k="${k}">${esc(w)}</span>`).join(" ");
    const parts: string[] = [];
    if (s.layout === "logo") {
      parts.push(`<div class="logo" data-a="scale" data-d="0.1">${logo ?? `<div class="wordmark">${esc(sb.brand.name)}</div>`}</div>`);
      parts.push(`<div class="rule" data-a="grow" data-d="0.35"></div>`);
      parts.push(`<div class="h fit tag" data-a="rise" data-d="0.5" data-max="2">${esc(s.headline)}</div>`);
      if (s.contact) parts.push(`<div class="contact" data-a="fade" data-d="0.8">${esc(s.contact)}</div>`);
    } else {
      if (s.eyebrow) parts.push(`<div class="eyebrow" data-a="slide" data-d="0.05"><span class="dot"></span>${esc(s.eyebrow)}</div>`);
      if (s.layout === "stat" && s.stat) {
        parts.push(`<div class="stat fit" data-a="count" data-d="0.15" data-max="1" data-value="${s.stat.value}" data-prefix="${esc(s.stat.prefix ?? "")}" data-suffix="${esc(s.stat.suffix ?? "")}">${esc(s.stat.prefix ?? "")}0${esc(s.stat.suffix ?? "")}</div>`);
        parts.push(`<div class="h fit sm" data-a="rise" data-d="0.45" data-max="3">${esc(s.headline)}</div>`);
      } else {
        parts.push(`<div class="h fit ${s.layout === "hook" ? "xl words" : ""}" data-a="${s.layout === "hook" ? "words" : "rise"}" data-d="0.12" data-max="${s.layout === "hook" ? 4 : 3}">${s.layout === "hook" ? words : esc(s.headline)}</div>`);
      }
      if (s.subline) parts.push(`<div class="sub fit" data-a="rise" data-d="${s.layout === "hook" ? 0.75 : 0.4}" data-max="3">${esc(s.subline)}</div>`);
      if (s.layout === "list" && s.items?.length) parts.push(`<ul class="list">${s.items.map((it, k) => `<li data-a="slide" data-d="${(0.45 + k * 0.22).toFixed(2)}"><span class="tick"></span><span>${esc(it)}</span></li>`).join("")}</ul>`);
      if (s.layout === "cta") {
        if (s.button) parts.push(`<div class="btn" data-a="pop" data-d="0.45">${esc(s.button)}</div>`);
        if (s.contact) parts.push(`<div class="contact" data-a="fade" data-d="0.7">${esc(s.contact)}</div>`);
      }
    }
    return `<section class="scene l-${s.layout}" data-i="${s.i}" style="--bg:${bg};--fg:${fg};--ac:${accent}">
      ${s.img ? `<div class="img" style="background-image:url(${s.img})"></div><div class="shade"></div>` : ""}
      <div class="shape s1"></div><div class="shape s2"></div><div class="bar"></div>
      <div class="content">${parts.join("\n")}</div>
      ${s.layout !== "logo" ? `<div class="brandtag">${logo ? `<span class="mini">${logo}</span>` : ""}<span>${esc(sb.brand.name)}</span></div>` : ""}
    </section>`;
  }).join("\n");

  const hf = sb.brand.heading_font;
  const headingStack = `'${hf}', 'Montserrat', 'Helvetica Neue', Arial, sans-serif`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${fontFaces(hf)}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;overflow:hidden;background:${c.background}}
body{font-family:'Montserrat','Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}
.scene{position:absolute;inset:0;background:var(--bg);color:var(--fg);overflow:hidden;opacity:0;will-change:opacity,transform}
.img{position:absolute;inset:-4%;background-size:cover;background-position:center;will-change:transform}
.shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.25),rgba(0,0,0,.72))}
.shape{position:absolute;border-radius:50%;will-change:transform}
.s1{width:${unit * 0.9}px;height:${unit * 0.9}px;right:-${unit * 0.3}px;top:-${unit * 0.26}px;border:${Math.round(unit * 0.045)}px solid var(--ac);opacity:.2}
.s2{width:${unit * 0.36}px;height:${unit * 0.36}px;left:-${unit * 0.12}px;bottom:${pad.b * 0.35}px;background:var(--ac);opacity:.1}
.bar{position:absolute;left:0;top:0;bottom:0;width:${Math.round(unit * 0.018)}px;background:var(--ac);transform-origin:top;will-change:transform}
.content{position:absolute;left:${pad.x}px;right:${pad.x}px;top:${pad.t}px;bottom:${pad.b}px;display:flex;flex-direction:column;justify-content:center;gap:${unit * 0.035}px}
.l-logo .content{align-items:center;text-align:center}
.eyebrow{display:flex;align-items:center;gap:${unit * 0.018}px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;font-size:${unit * 0.03}px;color:var(--ac)}
.dot{width:${unit * 0.016}px;height:${unit * 0.016}px;border-radius:50%;background:var(--ac)}
.h{font-family:${headingStack};font-weight:${hf === "Montserrat" ? 800 : hf === "Oswald" ? 600 : 400};line-height:1.02;letter-spacing:${hf === "Anton" ? "0" : "-.02em"};font-size:${unit * 0.105}px;overflow:hidden}
.h.xl{font-size:${unit * 0.13}px}
.h.sm{font-size:${unit * 0.06}px;font-weight:700;line-height:1.15;letter-spacing:0;font-family:'Montserrat',sans-serif}
.h.tag{font-size:${unit * 0.055}px;font-family:'Montserrat',sans-serif;font-weight:700;letter-spacing:0;line-height:1.2}
.words .w{display:inline-block;will-change:transform,opacity}
.sub{font-size:${unit * 0.043}px;font-weight:500;line-height:1.3;opacity:.92;max-width:94%;overflow:hidden}
.stat{font-family:${headingStack};font-weight:800;font-size:${unit * 0.26}px;line-height:.95;color:var(--ac);letter-spacing:-.03em;overflow:hidden;white-space:nowrap}
.list{list-style:none;display:flex;flex-direction:column;gap:${unit * 0.026}px}
.list li{display:flex;align-items:center;gap:${unit * 0.024}px;font-size:${unit * 0.046}px;font-weight:700;line-height:1.15}
.tick{flex:none;width:${unit * 0.05}px;height:${unit * 0.05}px;border-radius:${unit * 0.012}px;background:var(--ac);position:relative}
.tick:after{content:'';position:absolute;left:32%;top:18%;width:24%;height:44%;border:solid var(--bg);border-width:0 ${unit * 0.008}px ${unit * 0.008}px 0;transform:rotate(45deg)}
.btn{align-self:flex-start;background:var(--ac);color:var(--bg);font-weight:800;font-size:${unit * 0.045}px;padding:${unit * 0.026}px ${unit * 0.05}px;border-radius:${unit * 0.1}px;letter-spacing:.01em}
.contact{font-size:${unit * 0.036}px;font-weight:700;letter-spacing:.04em;opacity:.9}
.l-logo .contact{align-self:center}
.logo{display:flex;justify-content:center;will-change:transform,opacity}
.logo svg{max-width:${unit * 0.55}px;max-height:${unit * 0.3}px;width:auto;height:auto}
.wordmark{font-family:${headingStack};font-weight:800;font-size:${unit * 0.13}px;letter-spacing:-.02em;line-height:1}
.rule{width:${unit * 0.22}px;height:${unit * 0.012}px;background:var(--ac);align-self:center;transform-origin:center}
.brandtag{position:absolute;left:${pad.x}px;bottom:${portrait ? pad.b * 0.55 : pad.b * 0.45}px;display:flex;align-items:center;gap:${unit * 0.014}px;font-weight:700;font-size:${unit * 0.024}px;letter-spacing:.12em;text-transform:uppercase;opacity:.75}
.brandtag .mini svg{height:${unit * 0.034}px;width:auto;display:block}
[data-a]{will-change:transform,opacity}
</style></head><body>
${sceneHtml}
<script>
const D=${data};
const clamp=(x)=>x<0?0:x>1?1:x;
const E={out:(t)=>1-Math.pow(1-t,3),expo:(t)=>t===1?1:1-Math.pow(2,-10*t),back:(t)=>{const c1=1.7,c3=c1+1;return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2)},in:(t)=>t*t*t,inout:(t)=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2};
const prog=(local,delay,dur,ease)=>E[ease](clamp((local-delay)/dur));
const scenes=[...document.querySelectorAll('.scene')];
// Layout pass (once): shrink text until it fits its line budget and the safe area.
function fit(el){const max=Number(el.dataset.max||3);const nowrap=getComputedStyle(el).whiteSpace==='nowrap';let fs=parseFloat(getComputedStyle(el).fontSize);
  const ratio=(parseFloat(getComputedStyle(el).lineHeight)||fs*1.1)/fs;let guard=0;
  // glyph ascenders/descenders legitimately overflow tight line-heights, so allow ~0.35em slack
  const tooBig=()=>el.scrollWidth>el.clientWidth+1||(!nowrap&&el.scrollHeight>fs*ratio*max+fs*0.35);
  while(guard++<60&&tooBig()){fs*=0.95;el.style.fontSize=fs+'px';}}
const stagedEls=scenes.map((sc)=>[...sc.querySelectorAll('[data-a]')]);
window.ready=document.fonts.ready.then(()=>{scenes.forEach((sc)=>{sc.style.opacity=1;
    // size counters against their final value, not the starting 0
    sc.querySelectorAll('[data-a=count]').forEach((el)=>{el.textContent=el.dataset.prefix+Number(el.dataset.value).toLocaleString('en-US')+el.dataset.suffix;});
    sc.querySelectorAll('.fit').forEach(fit);sc.style.opacity=0;});
  // content that still overflows the safe area gets scaled as a block, never clipped
  scenes.forEach((sc)=>{const ct=sc.querySelector('.content');sc.style.opacity=1;const over=ct.scrollHeight/ct.clientHeight;if(over>1){ct.style.transformOrigin='left center';ct.dataset.scale=String(1/over);}sc.style.opacity=0;});
  window.renderAt(0);return true;});
const TR=0.32; // scene transition length (s)
window.renderAt=function(t){
  for(const sc of scenes){const s=D.scenes[Number(sc.dataset.i)];const local=t-s.start;const last=s.i===D.scenes.length-1;
    const inP=s.i===0?1:prog(local,0,TR,'out');const outP=last?0:prog(local,s.duration-TR*0.5,TR*0.5,'in');
    const vis=local>=-0.0001&&local<s.duration+(last?1:0);
    sc.style.opacity=vis?String(inP*(1-outP)):'0';
    if(!vis)continue;
    sc.style.transform='scale('+(1+0.02*(1-inP))+')';
    const bar=sc.querySelector('.bar');bar.style.transform='scaleY('+prog(local,0.05,0.7,'expo')+')';
    const s1=sc.querySelector('.s1'),s2=sc.querySelector('.s2');const drift=local/Math.max(1,s.duration);
    s1.style.transform='translate('+(-D.unit*0.05*drift)+'px,'+(D.unit*0.04*drift)+'px) scale('+(0.6+0.4*prog(local,0,1.2,'expo'))+')';
    s2.style.transform='translate('+(D.unit*0.04*drift)+'px,0) scale('+(0.5+0.5*prog(local,0.15,1.2,'expo'))+')';
    const img=sc.querySelector('.img');if(img)img.style.transform='scale('+(1.0+0.06*drift)+')';
    const ct=sc.querySelector('.content');if(ct.dataset.scale)ct.style.transform='scale('+ct.dataset.scale+')';
    const exitK=last?0:prog(local,s.duration-0.3,0.3,'in');
    for(const el of stagedEls[s.i]){const a=el.dataset.a,d=Number(el.dataset.d||0);
      if(a==='words'){const ws=el.querySelectorAll('.w');ws.forEach((w,k)=>{const p=prog(local,d+k*0.11,0.55,'expo');w.style.opacity=String(p*(1-exitK));w.style.transform='translateY('+((1-p)*D.unit*0.09-exitK*D.unit*0.03)+'px)';});continue;}
      let p;
      if(a==='rise'){p=prog(local,d,0.6,'expo');el.style.transform='translateY('+((1-p)*D.unit*0.06-exitK*D.unit*0.03)+'px)';}
      else if(a==='slide'){p=prog(local,d,0.55,'expo');el.style.transform='translateX('+((1-p)*-D.unit*0.08)+'px)';}
      else if(a==='pop'){p=prog(local,d,0.5,'back');el.style.transform='scale('+(0.6+0.4*p)+')';}
      else if(a==='scale'){p=prog(local,d,0.8,'expo');el.style.transform='scale('+(0.82+0.18*p)+')';}
      else if(a==='grow'){p=prog(local,d,0.6,'expo');el.style.transform='scaleX('+p+')';}
      else if(a==='count'){p=prog(local,d,0.6,'out');const c=prog(local,d,Math.min(1.6,s.duration*0.6),'out');const v=Number(el.dataset.value);const n=Number.isInteger(v)?Math.round(v*c):(v*c).toFixed(1);
        el.textContent=el.dataset.prefix+Number(n).toLocaleString('en-US')+el.dataset.suffix;el.style.transform='translateY('+((1-p)*D.unit*0.05)+'px)';}
      else {p=prog(local,d,0.6,'out');}
      el.style.opacity=String(Math.max(0,(a==='scale'||a==='grow'?Math.min(1,p*1.5):p))*(1-exitK));
    }
  }
};
</script></body></html>`;
}
