/**
 * "Studio" motion template — the clean agency UI-motion language (sentence-case Inter type that inks in word by
 * word, capsules that morph and cycle, design-tool selection boxes and cursors, sticker badges, a periwinkle
 * shape grid that fills with work, a brush stroke that sweeps the frame, a logo end card) edited with
 * Katana-style energy: cuts locked to the music's beat grid, a camera wrapper per scene (slow push + punch-in
 * hits with speed-scaled blur), flash/shake accents on hits.
 *
 * Page contract (shared with the classic template): one self-contained HTML page per format; every visible value
 * is computed from `t` in window.renderAt(t) — no clocks, no randomness (seeded), layout measured once in `ready`.
 */
import { readFileSync } from "node:fs";
import { FORMATS, type Storyboard, type VideoFormat } from "./storyboard";
import { safeSvg } from "./template";

const FONTS = {
  inter400: new URL("../../assets/fonts/inter-latin-400-normal.woff2", import.meta.url),
  inter500: new URL("../../assets/fonts/inter-latin-500-normal.woff2", import.meta.url),
  inter600: new URL("../../assets/fonts/inter-latin-600-normal.woff2", import.meta.url),
  inter700: new URL("../../assets/fonts/inter-latin-700-normal.woff2", import.meta.url),
};
let fontCss: string | null = null;
function fonts() {
  if (fontCss) return fontCss;
  fontCss = ([[400, FONTS.inter400], [500, FONTS.inter500], [600, FONTS.inter600], [700, FONTS.inter700]] as const)
    .map(([w, u]) => `@font-face{font-family:'Inter';font-weight:${w};font-style:normal;src:url(data:font/woff2;base64,${readFileSync(u).toString("base64")}) format('woff2');}`)
    .join("\n");
  return fontCss;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const words = (s: string, cls = "w") => s.split(/\s+/).filter(Boolean).map((w) => `<span class="${cls}">${esc(w)}</span>`).join(" ");

/** Split a multi-part logo SVG (paths with id mark / swoosh / wordmark) into layer copies for staged reveals. */
export function logoLayers(svg: string | null, brandName: string) {
  if (!svg) return `<div class="wordmark-text">${esc(brandName)}</div>`;
  const clean = svg.replace(/\s(width|height)="[^"]*"/g, "").replace("<svg ", '<svg preserveAspectRatio="xMidYMid meet" ');
  const ids = ["mark", "swoosh", "wordmark"].filter((id) => new RegExp(`id="${id}"`).test(clean));
  if (!ids.length) return `<div class="ll" data-layer="all">${clean}</div>`;
  return ids.map((id) => {
    const only = clean.replace(/<path([^>]*?)id="(mark|swoosh|wordmark)"/g, (m, pre, pid) => (pid === id ? m : `<path${pre}id="${pid}-h" style="display:none"`));
    return `<div class="ll" data-layer="${id}">${only}</div>`;
  }).join("");
}

const ICON = {
  hash: '<svg viewBox="0 0 24 24"><path d="M9 3 7 21M17 3l-2 18M4 8.5h17M3 15.5h17" stroke="#9a9a9a" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
  arrow: '<svg viewBox="0 0 24 24"><path d="M5 3l14 8-6 1.6L10 19z" fill="#8e8e8e"/></svg>',
  smile: '<svg viewBox="0 0 24 24"><circle cx="9" cy="10" r="1.3" fill="#9a9a9a"/><circle cx="15" cy="10" r="1.3" fill="#9a9a9a"/><path d="M8 14.5c2 2.2 6 2.2 8 0" stroke="#9a9a9a" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="5.5" stroke="#9a9a9a" stroke-width="2" fill="none"/><path d="M15 15l5 5" stroke="#9a9a9a" stroke-width="2" stroke-linecap="round"/></svg>',
};
const CURSOR = '<svg viewBox="0 0 24 24"><path d="M4 2.5l15 9.2-6.6 1.5 3.6 7.2-2.6 1.3-3.6-7.2L4.9 19z" fill="#111" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/></svg>';
const HAND = '<svg viewBox="0 0 32 32"><path d="M12 4.5c1.2 0 2 .9 2 2v8.2l.9-.2V12c0-1.1.9-2 2-2s2 .9 2 2v2.7l.8-.1v-1.3c0-1.1.9-2 2-2s2 .9 2 2v2l.6-.1c1.1 0 2 .9 2 2v5.6c0 4-3.2 7.2-7.2 7.2h-2.3c-2.4 0-4.6-1.2-5.9-3.2l-4.6-7c-.6-.9-.3-2.1.6-2.7.9-.6 2-.4 2.7.4L10 19.3V6.5c0-1.1.9-2 2-2z" fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/></svg>';
const STICKERS = [
  { bg: "#FFFFFF", svg: '<svg viewBox="0 0 24 24"><path d="M12 2.8l2.4 5.6 6 .5-4.6 4 1.4 5.9L12 15.7 6.8 18.8l1.4-5.9-4.6-4 6-.5z" fill="#B76CF2"/></svg>' },
  { bg: "#FFFFFF", svg: '<svg viewBox="0 0 24 24"><rect x="4" y="9" width="16" height="6" rx="3" fill="#E5484D" transform="rotate(-30 12 12)"/></svg>' },
  { bg: "#FFFFFF", svg: '<svg viewBox="0 0 24 24"><path d="M4 14l2.5-4 2.5 4 2.5-4 2.5 4 2.5-4 2.5 4" stroke="#222" stroke-width="2.2" fill="none" stroke-linejoin="round"/></svg>' },
  { bg: "#FFFFFF", svg: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="6.5" fill="#B5D86A"/><circle cx="9.5" cy="10" r="1.6" fill="#7EA33A"/><circle cx="14" cy="13.5" r="1.3" fill="#7EA33A"/></svg>' },
];
const OUTLINE_COLORS = ["#6457F9", "#4ADE80", "#FD8D18", "#F472B6", "#60A5FA", "#FACC15"];

export function buildStudioHtml(sb: Storyboard, format: VideoFormat, images: Record<string, string> = {}) {
  const { width: W, height: H } = FORMATS[format];
  const portrait = H > W;
  const unit = Math.min(W, H);
  const T = Math.round(unit * (portrait ? 0.082 : W === H ? 0.07 : 0.064)); // base type size: social-legible, larger on vertical
  const C = {
    paper: "#ECEBE6", white: "#FFFFFF", ink: "#0B0B0B", text: "#111111", grey: "#A3A3A3",
    accent: sb.brand.accent ?? "#FD8D18", shape: sb.brand.shape ?? "#6457F9", stroke: sb.brand.stroke ?? sb.brand.accent ?? "#FD8D18", ui: "#2F6BFF",
  };
  const bgOf = (b: string) => (b === "paper" || b === "light" ? C.paper : b === "white" ? C.white : b === "accent" ? C.accent : C.ink);
  const logo = safeSvg(sb.brand.logo_svg);
  const beat = sb.beat_seconds ?? 0.6;

  let t0 = 0;
  const scenes = sb.scenes.map((s, i) => {
    const bg = bgOf(s.background);
    const dark = bg === C.ink;
    const sc = { i, layout: s.layout, start: t0, end: t0 + s.duration, duration: s.duration, bg, dark, transition: s.transition ?? (i === 0 ? "cut" : "cut"), items: s.items ?? [], words: s.words ?? [] };
    t0 += s.duration;
    return sc;
  });
  const total = t0;

  const sceneHtml = sb.scenes.map((s, i) => {
    const sc = scenes[i];
    const fg = sc.dark ? "#F5F5F5" : C.text;
    const prevBg = i > 0 ? scenes[i - 1].bg : sc.bg;
    let body = "";
    switch (s.layout) {
      case "type_line":
        body = `<div class="center col"><div class="line big" data-r="line">${words(s.headline)}</div>${s.subline ? `<div class="line sub" data-r="subline">${words(s.subline)}</div>` : ""}
          ${s.prop === "eyes" ? `<div class="eyes" data-r="eyes"><div class="eye"><div class="pupil"></div></div><div class="eye"><div class="pupil"></div></div></div>` : ""}</div>`;
        break;
      case "ui_select":
        body = `<div class="center"><div class="sel" data-r="sel">
            ${["tl", "tc", "tr", "ml", "mr", "bl", "bc", "br"].map((h) => `<i class="hd ${h}"></i>`).join("")}
            <div class="sel-text" data-r="line">${words(s.headline)}</div>
            ${s.button ? `<div class="tpill" data-r="tpill"><span class="tp-text" data-text="${esc(s.button)}"></span><span class="caret"></span></div>` : ""}
            <div class="tile t1" data-r="tile">${ICON.hash}</div><div class="tile t2" data-r="tile">${ICON.arrow}</div>
            <div class="tile t3" data-r="tile">${ICON.smile}</div><div class="tile t4" data-r="tile">${ICON.search}</div>
          </div><div class="cursor" data-r="cursor">${CURSOR}</div></div>`;
        break;
      case "pill_cycle":
        body = `<div class="center"><div class="cyc-row"><span class="line" data-r="line">${words(s.headline)}</span>
          <span class="cpill" data-r="cpill">${(s.words ?? []).map((w, k) => `<span class="cw" data-k="${k}">${esc(w)}</span>`).join("")}</span></div></div>`;
        break;
      case "word_wheel":
        body = `<div class="halo-shapes"><i class="hs a"></i><i class="hs b"></i></div><div class="wheel" data-r="wheel">${(s.items ?? []).map((w, k) => `<div class="wi" data-k="${k}">${esc(w)}</div>`).join("")}</div>
          <div class="hand" data-r="hand">${HAND}</div>${s.headline ? `<div class="wheel-cap" data-r="cap">${esc(s.headline)}</div>` : ""}`;
        break;
      case "pill_stack":
        body = `<div class="center"><div class="stack" data-r="stack">${(s.items ?? []).map((w, k) => {
          const st = STICKERS[k % STICKERS.length];
          return `<div class="srow" data-k="${k}"><span class="badge" style="background:${st.bg}">${st.svg}</span><span class="spill"><span class="sp-text" data-text="${esc(w)}"></span></span></div>`;
        }).join("")}</div></div>`;
        break;
      case "bento": {
        const ids = s.image_file_ids ?? [];
        const cells = portrait
          ? [["sq", 0, 0, 1], ["ci", 1, 0, 1], ["pi", 0, 1, 2], ["ci", 0, 2, 1], ["sq", 1, 2, 1]]
          : [["sq", 0, 0, 1], ["pi", 1, 0, 2], ["ci", 0, 1, 1], ["sq", 1, 1, 1], ["ci", 2, 1, 1]];
        body = `<div class="bento" data-r="bento"><div class="halo" data-r="halo"></div>${cells.map(([shape, cx, cy, span], k) => {
          const img = ids.length ? images[ids[k % ids.length]] : null;
          return `<div class="bx ${shape}" data-k="${k}" data-cx="${cx}" data-cy="${cy}" data-span="${span}">${img ? `<div class="bimg" style="background-image:url(${img})"></div>` : ""}</div>`;
        }).join("")}</div>${s.headline ? `<div class="bento-cap line" data-r="line">${words(s.headline)}</div>` : ""}`;
        break;
      }
      case "stroke_reveal":
        body = `<div class="center col"><div class="line big" data-r="line">${words(s.headline)}</div>${s.subline ? `<div class="line big swap" data-r="subline">${words(s.subline)}</div>` : ""}</div>
          <svg class="brush" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><path data-r="brush" pathLength="1" d="${brushPath(W, H, portrait)}" stroke="${C.stroke}" stroke-width="${Math.round(unit * (portrait ? 0.11 : 0.085))}" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        break;
      case "cta_pill":
        body = `<div class="center col"><div class="ctap" data-r="ctap"><svg class="ctap-line" preserveAspectRatio="none"><rect pathLength="1" x="2" y="2" rx="999" ry="999" fill="none" stroke="#fff" stroke-width="3"/></svg>
          <div class="ctap-fill"></div><span class="ctap-text">${esc(s.button ?? s.headline)}</span></div>
          ${s.button && s.headline ? `<div class="line sub" data-r="line">${words(s.headline)}</div>` : ""}${s.contact ? `<div class="contact" data-r="contact">${esc(s.contact)}</div>` : ""}</div>`;
        break;
      case "logo_end":
        body = `<div class="center col"><div class="logo" data-r="logo">${logoLayers(logo, sb.brand.name)}</div>${s.headline && s.headline !== sb.brand.name ? `<div class="tagline" data-r="tagline">${esc(s.headline)}</div>` : ""}${s.contact ? `<div class="contact" data-r="contact">${esc(s.contact)}</div>` : ""}</div>`;
        break;
    }
    return `<section class="scene ${sc.dark ? "dark" : "light"}" data-i="${i}" style="background:${sc.bg};color:${fg};--fg:${fg}">
      <div class="cam">${body}</div>
      ${sc.transition === "wipe" ? `<div class="wipebar" style="background:${prevBg}"></div>` : ""}
    </section>`;
  }).join("\n");

  const data = JSON.stringify({ W, H, unit, T, portrait, beat, offset: sb.beat_offset ?? 0, total, scenes, C });
  const pillPad = Math.round(T * 0.55);

  return `<!doctype html><html><head><meta charset="utf-8"><style>
${fonts()}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;overflow:hidden;background:${C.ink}}
body{font-family:'Inter','Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;letter-spacing:-0.01em}
.scene{position:absolute;inset:0;overflow:hidden;visibility:hidden}
.cam{position:absolute;inset:0;transform-origin:50% 50%;will-change:transform,filter}
.center{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:0 ${Math.round(W * 0.08)}px}
.col{flex-direction:column;gap:${Math.round(T * 0.5)}px;text-align:center}
.line{font-size:${T}px;font-weight:500;line-height:1.18;text-wrap:balance}
.line.big{font-size:${Math.round(T * 1.15)}px}
.line.sub{font-size:${Math.round(T * 0.72)}px;font-weight:400;opacity:.9}
.w{display:inline-block;will-change:transform,opacity}
.swap{position:absolute}
.eyes{display:flex;margin-top:${Math.round(T * 0.4)}px}
.eye{width:${Math.round(T * 1.9)}px;height:${Math.round(T * 1.9)}px;border:${Math.max(2, Math.round(T * 0.05))}px solid var(--fg);border-radius:50%;position:relative;background:transparent;margin-left:-${Math.round(T * 0.18)}px}
.pupil{position:absolute;width:${Math.round(T * 0.26)}px;height:${Math.round(T * 0.26)}px;border-radius:50%;background:var(--fg);left:50%;top:50%}
.sel{position:relative;padding:${Math.round(T * 0.8)}px ${Math.round(T * 0.9)}px;border:2px dashed #9DB7FF;display:flex;flex-direction:column;gap:${Math.round(T * 0.45)}px;align-items:flex-start;max-width:${Math.round(W * (portrait ? 0.84 : 0.6))}px}
.hd{position:absolute;width:${Math.round(T * 0.22)}px;height:${Math.round(T * 0.22)}px;background:${C.ui};margin:-${Math.round(T * 0.11)}px}
.hd.tl{left:0;top:0}.hd.tc{left:50%;top:0}.hd.tr{right:0;top:0}.hd.ml{left:0;top:50%}.hd.mr{right:0;top:50%}.hd.bl{left:0;bottom:0}.hd.bc{left:50%;bottom:0}.hd.br{right:0;bottom:0}
.sel-text{font-size:${T}px;font-weight:500;line-height:1.15;position:relative;z-index:2}
.tpill{position:relative;z-index:2;border:${Math.max(2, Math.round(T * 0.045))}px solid ${C.text};border-radius:999px;padding:${Math.round(T * 0.18)}px ${pillPad}px;font-size:${Math.round(T * 0.95)}px;font-weight:500;min-width:${Math.round(T * 3)}px;display:flex;align-items:center;background:#fff;align-self:center}
.caret{display:inline-block;width:2px;height:1.05em;background:${C.text};margin-left:3px}
.tile{position:absolute;width:${Math.round(T * 1.25)}px;height:${Math.round(T * 1.25)}px;border-radius:${Math.round(T * 0.28)}px;background:#E9E9E9;display:flex;align-items:center;justify-content:center;z-index:1}
.tile svg{width:58%;height:58%}
.t1{left:-${Math.round(T * 0.6)}px;bottom:-${Math.round(T * 0.5)}px}.t2{right:-${Math.round(T * 0.4)}px;top:-${Math.round(T * 1.2)}px}.t3{right:-${Math.round(T * 0.8)}px;bottom:${Math.round(T * 0.4)}px}.t4{left:${Math.round(T * 0.4)}px;top:-${Math.round(T * 1.5)}px}
.cursor{position:absolute;width:${Math.round(T * 0.9)}px;height:${Math.round(T * 0.9)}px;left:0;top:0;z-index:5}
.cyc-row{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:${Math.round(T * 0.35)}px;color:#F5F5F5;text-align:center}
.cpill{position:relative;display:inline-block;height:${Math.round(T * 1.6)}px;border:${Math.max(2, Math.round(T * 0.045))}px solid ${C.shape};border-radius:999px;overflow:hidden;vertical-align:middle}
.cw{position:absolute;left:0;right:0;top:50%;text-align:center;white-space:nowrap;font-size:${Math.round(T * 0.92)}px;font-weight:500;color:#fff}
.wheel{position:absolute;left:${Math.round(W * (portrait ? 0.12 : 0.24))}px;top:50%;width:${Math.round(W * 0.76)}px}
.wi{position:absolute;left:0;top:0;white-space:nowrap;font-size:${Math.round(T * 1.55)}px;font-weight:500;line-height:1;transform-origin:left center;color:#fff}
.hand{position:absolute;width:${Math.round(T * 1.5)}px;height:${Math.round(T * 1.5)}px;z-index:4}
.wheel-cap{position:absolute;left:${Math.round(W * 0.1)}px;right:${Math.round(W * 0.1)}px;text-wrap:balance;bottom:${Math.round(H * (portrait ? 0.16 : 0.1))}px;text-align:center;font-size:${Math.round(T * 0.62)}px;color:#9a9a9a}
.halo-shapes .hs{position:absolute;border:${Math.round(unit * 0.012)}px solid ${C.shape};border-radius:999px;opacity:.2}
.hs.a{width:${Math.round(unit * 0.5)}px;height:${Math.round(unit * 1.1)}px;left:-${Math.round(unit * 0.18)}px;top:${Math.round(H * 0.5 - unit * 0.55)}px}
.hs.b{width:${Math.round(unit * 0.5)}px;height:${Math.round(unit * 1.1)}px;right:-${Math.round(unit * 0.2)}px;top:${Math.round(H * 0.5 - unit * 0.4)}px}
.stack{display:flex;flex-direction:column;gap:${Math.round(T * 0.38)}px;align-items:center}
.srow{display:flex;align-items:center;gap:${Math.round(T * 0.22)}px;position:relative}
.badge{width:${Math.round(T * 1.15)}px;height:${Math.round(T * 1.15)}px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex:none;z-index:2}
.badge svg{width:66%;height:66%}
.spill{display:inline-flex;align-items:center;height:${Math.round(T * 1.2)}px;border:${Math.max(2, Math.round(T * 0.04))}px solid #fff;border-radius:999px;overflow:hidden;color:#fff;font-size:${Math.round(T * 0.85)}px;font-weight:500;white-space:nowrap}
.sp-text{padding:0 ${pillPad}px}
.bento{position:absolute;inset:0}
.bx{position:absolute;background:${C.shape};overflow:hidden}
.bx.sq{border-radius:${Math.round(unit * 0.02)}px}.bx.ci,.bx.pi{border-radius:999px}
.bimg{position:absolute;inset:0;background-size:cover;background-position:center}
.halo{position:absolute;border-radius:50%;background:${C.shape};opacity:.12}
.bento-cap{position:absolute;left:${Math.round(W * 0.08)}px;right:${Math.round(W * 0.08)}px;text-align:center;bottom:${Math.round(H * (portrait ? 0.1 : 0.07))}px;color:${C.text}}
.brush{position:absolute;inset:0;width:100%;height:100%;z-index:3}
.ctap{position:relative;display:flex;align-items:center;justify-content:center;padding:${Math.round(T * 0.42)}px ${Math.round(T * 1.1)}px;border-radius:999px;overflow:hidden}
.ctap-line{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.ctap-fill{position:absolute;inset:3px;border-radius:999px;background:${C.accent};background-image:radial-gradient(rgba(255,255,255,.18) 1px,transparent 1.5px),radial-gradient(rgba(0,0,0,.12) 1px,transparent 1.5px);background-size:${Math.round(T * 0.22)}px ${Math.round(T * 0.22)}px,${Math.round(T * 0.31)}px ${Math.round(T * 0.31)}px}
.ctap-text{position:relative;font-size:${Math.round(T * 1.05)}px;font-weight:600;color:#fff;white-space:nowrap}
.contact{font-size:${Math.round(T * 0.6)}px;font-weight:500;letter-spacing:.02em;opacity:.85}
.logo{position:relative;width:${Math.round(W * (portrait ? 0.74 : 0.42))}px}
.ll{position:absolute;inset:0}.ll:first-child{position:relative}
.ll svg{display:block;width:100%;height:auto}
.wordmark-text{font-size:${Math.round(T * 2)}px;font-weight:700;letter-spacing:.04em;color:#fff}
.tagline{font-size:${Math.round(T * 0.62)}px;color:#cfcfcf;font-weight:500}
.wipebar{position:absolute;inset:0;z-index:20}
#flash{position:absolute;inset:0;background:#fff;opacity:0;z-index:50;pointer-events:none}
</style></head><body>
${sceneHtml}
<div id="flash"></div>
<script>
var D=${data};
var clamp=function(x){return x<0?0:x>1?1:x};
var E={lin:function(t){return t},out:function(t){return 1-Math.pow(1-t,3)},expo:function(t){return t===1?1:1-Math.pow(2,-10*t)},
  back:function(t){var c1=1.6,c3=c1+1;return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2)},inq:function(t){return t*t*t},io:function(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2}};
function tw(lt,a,d,e){return E[e||'expo'](clamp((lt-a)/d))}
function lerp(a,b,p){return a+(b-a)*p}
function hex(c){return [parseInt(c.substr(1,2),16),parseInt(c.substr(3,2),16),parseInt(c.substr(5,2),16)]}
function mix(a,b,p){var x=hex(a),y=hex(b);return 'rgb('+Math.round(lerp(x[0],y[0],p))+','+Math.round(lerp(x[1],y[1],p))+','+Math.round(lerp(x[2],y[2],p))+')'}
function seeded(n){var x=Math.sin(n*12.9898+78.233)*43758.5453;return x-Math.floor(x)}
var B=D.beat, HB=D.beat/2;
var roots=[].slice.call(document.querySelectorAll('.scene'));
var M=[]; // per-scene measurements, filled once in ready
function q(r,sel){return r.querySelector(sel)}
function qa(r,sel){return [].slice.call(r.querySelectorAll(sel))}

/* word-by-word ink-in: grey → ink, slide from the right (the reference's signature text move) */
function inkWords(el,lt,start,step,fg,dark){if(!el)return start;var ws=qa(el,'.w');ws.forEach(function(w,k){var a=start+k*step;var p=tw(lt,a,0.42,'expo');
  w.style.opacity=String(p);w.style.transform='translateX('+((1-p)*D.T*0.45)+'px)';w.style.color=mix(dark?'#555555':'#B3B3B3',fg,tw(lt,a+0.12,0.35,'out'));});return start+ws.length*step;}
function typeText(el,lt,start,cps){var full=el.getAttribute('data-text');var n=Math.max(0,Math.min(full.length,Math.floor((lt-start)*cps)));el.textContent=full.slice(0,n);return start+full.length/cps;}

var R={
 type_line:function(r,lt,s,m){var fg=s.dark?'#F5F5F5':'#111111';var end=inkWords(q(r,'[data-r=line]'),lt,0.08,HB*0.75,fg,s.dark);
   inkWords(q(r,'[data-r=subline]'),lt,end+0.15,HB*0.6,fg,s.dark);
   var eyes=q(r,'[data-r=eyes]');if(eyes){var p=tw(lt,end-0.1,0.5,'back');eyes.style.transform='scale('+(0.4+0.6*p)+')';eyes.style.opacity=String(clamp(p*1.4));
     var look=[[0,0],[-0.22,0.05],[0.22,-0.12],[0.05,0.2]];var seg=Math.floor(clamp((lt-end)/ (B*1.0))*0+Math.max(0,Math.floor((lt-end)/B)))%look.length;
     var nxt=(seg+1)%look.length;var f=tw(((lt-end)%B+B)%B,0,0.25,'expo');var lx=lerp(look[seg][0],look[nxt][0],f),ly=lerp(look[seg][1],look[nxt][1],f);
     qa(eyes,'.pupil').forEach(function(pu){pu.style.transform='translate(-50%,-50%) translate('+(lx*D.T*1.6)+'px,'+(ly*D.T*1.6)+'px)'});
     var blink=Math.abs(lt-(end+B*2.5))<0.08?0.15:1;qa(eyes,'.eye').forEach(function(e){e.style.transform='scaleY('+blink+')'});}},
 ui_select:function(r,lt,s,m){var sel=q(r,'[data-r=sel]');var p=tw(lt,0,0.5,'expo');sel.style.transform='scale('+(0.9+0.1*p)+')';sel.style.opacity=String(p);
   qa(sel,'.hd').forEach(function(h,k){var hp=tw(lt,0.1+k*0.03,0.3,'back');h.style.transform='scale('+hp+')'});
   var end=inkWords(q(r,'[data-r=line]'),lt,0.25,HB*0.55,'#111111',false);
   qa(r,'[data-r=tile]').forEach(function(t,k){var tp=tw(lt,0.3+k*0.12,0.45,'back');t.style.opacity=String(clamp(tp*1.3));
     t.style.transform='translate('+(Math.sin(lt*1.3+k*1.7)*D.T*0.18)+'px,'+(Math.cos(lt*1.1+k)*D.T*0.14)+'px) rotate('+(Math.sin(lt+k)*8)+'deg) scale('+(0.5+0.5*tp)+')'});
   var tp=q(r,'[data-r=tpill]');var cur=q(r,'[data-r=cursor]');
   if(tp){var pp=tw(lt,end,0.4,'back');tp.style.transform='scale('+(0.6+0.4*pp)+')';tp.style.opacity=String(clamp(pp*1.5));
     var typed=typeText(q(tp,'.tp-text'),lt,end+0.3,16);q(tp,'.caret').style.opacity=(lt<typed+0.1||Math.floor(lt*2.5)%2===0)?'1':'0';
     var c0=m.cur0,c1=m.cur1;var cp=tw(lt,end-0.4,0.8,'io');var click=lt>end+0.35&&lt<end+0.5?0.82:1;
     cur.style.transform='translate('+lerp(c0[0],c1[0],cp)+'px,'+lerp(c0[1],c1[1],cp)+'px) scale('+click+')';cur.style.opacity=String(tw(lt,0.2,0.3,'out'));}},
 pill_cycle:function(r,lt,s,m){var end=inkWords(q(r,'[data-r=line]'),lt,0.05,HB*0.55,'#F5F5F5',true);var pill=q(r,'[data-r=cpill]');var ws=qa(pill,'.cw');var n=ws.length;
   var segStart=end+0.05;var seg=Math.max(0.5,(s.duration-segStart-0.15)/n);var idx=Math.max(0,Math.min(n-1,Math.floor((lt-segStart)/seg)));var into=lt-segStart-idx*seg;
   var pin=tw(lt,end-0.15,0.4,'back');pill.style.opacity=String(clamp(pin*1.4));pill.style.transform='scale('+(0.7+0.3*pin)+')';
   var prev=Math.max(0,idx-1);var wp=idx===0?1:tw(into,0,0.35,'expo');pill.style.width=lerp(m.pw[prev],m.pw[idx],wp)+'px';
   pill.style.borderColor=${JSON.stringify(OUTLINE_COLORS)}[idx%6];
   ws.forEach(function(w,k){var y,o;if(k===idx){var p=idx===0?tw(lt,end-0.1,0.4):tw(into,0,0.35);y=(1-p)*100;o=p}else if(k===idx-1){var p2=tw(into,0,0.3);y=-p2*100;o=1-p2}else{y=100;o=0}
     w.style.transform='translateY(calc(-50% + '+y+'%))';w.style.opacity=String(o)})},
 word_wheel:function(r,lt,s,m){var items=qa(r,'.wi');var n=items.length;var step=Math.max(HB,(s.duration-0.4)/(n-1));
   var k=Math.floor(lt/step);var f=k+tw(lt-k*step,0,Math.min(0.35,step*0.8),'expo');var pos=Math.min(n-1,f*0.999);var lh=m.lh;
   items.forEach(function(it,j){var d=j-pos;var ad=Math.abs(d);it.style.transform='translateY('+(d*lh-lh*0.5)+'px) scale('+(1-Math.min(0.18,ad*0.06))+')';
     it.style.opacity=String(Math.max(0,1-ad*0.3));it.style.color=ad<0.5?'#ffffff':'#8F8F8F';it.style.fontWeight=ad<0.5?'600':'500'});
   var hand=q(r,'[data-r=hand]');var tap=1-0.12*Math.max(0,1-Math.abs((lt%step)-0.08)/0.1);var cw=m.ww[Math.round(Math.min(n-1,pos))]||D.T*4;
   hand.style.transform='translate('+(m.wx+cw+D.T*0.35)+'px,'+(D.H/2-D.T*0.2)+'px) scale('+tap+')';hand.style.opacity=String(tw(lt,0.3,0.3,'out'));
   var cap=q(r,'[data-r=cap]');if(cap){var cp=tw(lt,0.4,0.5);cap.style.opacity=String(cp)}
   qa(r,'.hs').forEach(function(h,j){h.style.transform='translateY('+(Math.sin(lt*0.9+j*2)*D.unit*0.03)+'px) rotate('+(j?-8:10)+'deg)'})},
 pill_stack:function(r,lt,s,m){var rows=qa(r,'.srow');var cx=D.W/2,cy=D.H/2;
   rows.forEach(function(row,k){var b=q(row,'.badge'),pl=q(row,'.spill'),tx=q(row,'.sp-text');var mm=m.rows[k];
     var pop=tw(lt,k*0.07,0.4,'back');var mv=tw(lt,0.45+k*0.05,0.5,'expo');
     var startX=cx+(Math.cos(k*1.9)*D.T*0.9)-mm.bx,startY=cy+(Math.sin(k*1.9)*D.T*0.7)-mm.by;
     b.style.transform='translate('+lerp(startX,0,mv)+'px,'+lerp(startY,0,mv)+'px) scale('+pop+') rotate('+((1-mv)*-40)+'deg)';
     var open=tw(lt,0.75+k*0.08,0.45,'expo');pl.style.width=(mm.pw*open)+'px';pl.style.opacity=String(clamp(open*3));
     typeText(tx,lt,0.95+k*HB*0.9,22);row.style.transform='translateX('+mm.off+'px)'})},
 bento:function(r,lt,s,m){var bx=qa(r,'.bx');var n=bx.length;
   bx.forEach(function(b,k){var g=m.cells[k];var p=tw(lt,k*0.07,0.55,'expo');var dir=k%4;var ox=dir===0?-D.W:dir===1?D.W:0,oy=dir===2?D.H:dir===3?-D.H:0;
     b.style.transform='translate('+lerp(g.x+ox*0.6,g.x,p)+'px,'+lerp(g.y+oy*0.6,g.y,p)+'px) rotate('+((1-p)*(k%2?14:-14))+'deg)';
     var img=q(b,'.bimg');if(img){var ia=0.75+k*HB*0.8;var ip=tw(lt,ia,0.45,'expo');img.style.clipPath='circle('+(ip*75)+'% at 50% 50%)';img.style.transform='scale('+(1.18-0.12*tw(lt,ia,1.6,'out'))+')'}});
   var halo=q(r,'[data-r=halo]');var hk=Math.max(0,Math.min(n-1,Math.floor((lt-0.75)/(HB*0.8))));var g=m.cells[hk];var hr=Math.max(g.w,g.h)*1.5;
   halo.style.width=hr+'px';halo.style.height=hr+'px';halo.style.transform='translate('+(g.x+g.w/2-hr/2)+'px,'+(g.y+g.h/2-hr/2)+'px)';halo.style.opacity=String(0.14*tw(lt,0.7,0.3,'out'));
   inkWords(q(r,'[data-r=line]'),lt,1.1,HB*0.6,'#111111',false)},
 stroke_reveal:function(r,lt,s,m){var fg=s.dark?'#F5F5F5':'#111111';var line=q(r,'[data-r=line]'),sub=q(r,'[data-r=subline]');
   var bStart=Math.min(0.55,s.duration*0.15),bDur=Math.min(1.5,s.duration*0.42);var bp=tw(lt,bStart,bDur,'io');var segL=0.5;
   var path=q(r,'[data-r=brush]');path.style.strokeDasharray=segL+' 2';path.style.strokeDashoffset=String(lerp(segL,-1,bp));
   var swapAt=bStart+bDur*0.55;inkWords(line,lt,0.05,HB*0.6,fg,s.dark);
   if(sub){var lo=lt<swapAt?1:0;line.style.opacity=String(lo);sub.style.opacity=lt<swapAt?'0':'1';inkWords(sub,lt,swapAt,HB*0.6,fg,s.dark)}},
 cta_pill:function(r,lt,s,m){var c=q(r,'[data-r=ctap]');var p=tw(lt,0,0.55,'expo');c.style.transform='rotate('+((1-p)*-9)+'deg) scale('+(0.88+0.12*p)+')';
   var rect=q(c,'rect');rect.style.strokeDasharray='1 1';rect.style.strokeDashoffset=String(1-tw(lt,0,0.55,'out'));
   var fp=tw(lt,0.45,0.45,'expo');q(c,'.ctap-fill').style.clipPath='inset(0 '+((1-fp)*100)+'% 0 0 round 999px)';
   var tx=q(c,'.ctap-text');var tp=tw(lt,0.5,0.4);tx.style.opacity=String(tp);tx.style.transform='translateY('+((1-tp)*D.T*0.3)+'px)';
   inkWords(q(r,'[data-r=line]'),lt,0.9,HB*0.5,'#F5F5F5',true);var ct=q(r,'[data-r=contact]');if(ct)ct.style.opacity=String(tw(lt,1.2,0.4))},
 logo_end:function(r,lt,s,m){var L=q(r,'[data-r=logo]');var push=1+0.035*clamp(lt/s.duration);L.style.transform='scale('+push+')';
   qa(L,'.ll').forEach(function(l){var id=l.getAttribute('data-layer');var ext=m.layers[id]||[0,100];
     if(id==='mark'||id==='all'){var p=tw(lt,0.0,0.7,'expo');l.style.opacity=String(clamp(p*1.3));l.style.filter='blur('+((1-p)*D.unit*0.012)+'px)';l.style.transform='scale('+(0.86+0.14*p)+')';l.style.transformOrigin=((ext[0]+ext[1])/2)+'% 50%'}
     else{var a=id==='swoosh'?0.28:0.42,d=id==='swoosh'?0.32:0.55;var p2=tw(lt,a,d,id==='swoosh'?'out':'expo');var right=100-lerp(ext[0],ext[1],p2);
       l.style.clipPath='inset(-10% '+right+'% -10% -10%)';if(id==='wordmark')l.style.transform='translateX('+((1-p2)*-D.T*0.5)+'px)'}});
   var tg=q(r,'[data-r=tagline]');if(tg){var tp=tw(lt,0.9,0.5);tg.style.opacity=String(tp);tg.style.transform='translateY('+((1-tp)*D.T*0.3)+'px)'}
   var ct=q(r,'[data-r=contact]');if(ct)ct.style.opacity=String(tw(lt,1.1,0.5));
   var fade=1-tw(lt,s.duration-0.9,0.8,'out');r.style.opacity=String(fade)}
};

function fitW(el,maxW){var fs=parseFloat(getComputedStyle(el).fontSize),g=0;while(g++<40&&el.getBoundingClientRect().width>maxW){fs*=0.95;el.style.fontSize=fs+'px'}}
function measure(){roots.forEach(function(r,i){var s=D.scenes[i];var m={};r.style.visibility='visible';
  qa(r,'.wi').forEach(function(el){fitW(el,D.W*(D.portrait?0.7:0.6))});
  qa(r,'.ctap').forEach(function(el){var tx=q(el,'.ctap-text');var g=0;while(g++<40&&el.getBoundingClientRect().width>D.W*0.86){tx.style.fontSize=(parseFloat(getComputedStyle(tx).fontSize)*0.95)+'px'}});
  qa(r,'.tpill').forEach(function(el){var t=q(el,'.tp-text');t.textContent=t.getAttribute('data-text');var g=0;while(g++<40&&el.getBoundingClientRect().width>D.W*0.8){el.style.fontSize=(parseFloat(getComputedStyle(el).fontSize)*0.95)+'px'}t.textContent=''});
  if(s.layout==='pill_cycle'){var pill=q(r,'[data-r=cpill]');m.pw=qa(pill,'.cw').map(function(w){w.style.position='static';var wd=w.getBoundingClientRect().width;w.style.position='';return wd+${pillPad * 2}});pill.style.width=m.pw[0]+'px'}
  if(s.layout==='word_wheel'){var wis=qa(r,'.wi');var minFs=Math.min.apply(null,wis.map(function(w){return parseFloat(getComputedStyle(w).fontSize)}));wis.forEach(function(w){w.style.fontSize=minFs+'px'});m.lh=minFs*1.26;var wheel=q(r,'[data-r=wheel]');m.wx=wheel.getBoundingClientRect().left;m.ww=qa(r,'.wi').map(function(w){return w.getBoundingClientRect().width})}
  if(s.layout==='pill_stack'){m.rows=qa(r,'.srow').map(function(row,k){var b=q(row,'.badge').getBoundingClientRect();var pl=q(row,'.spill');var tx=q(row,'.sp-text');tx.textContent=tx.getAttribute('data-text');var pw=pl.getBoundingClientRect().width;tx.textContent='';pl.style.minWidth='0';
    return {bx:b.left+b.width/2,by:b.top+b.height/2,pw:pw,off:[0.5,-0.7,0.25,-0.35][k%4]*D.T}})}
  if(s.layout==='ui_select'){var tp=q(r,'[data-r=tpill]');if(tp){var t=q(tp,'.tp-text');t.textContent=t.getAttribute('data-text');var pr=tp.getBoundingClientRect();tp.style.minWidth=pr.width+'px';t.textContent='';
    m.cur1=[pr.left+pr.width*0.72,pr.top+pr.height*0.55];m.cur0=[D.W*0.82,D.H*0.78]}}
  if(s.layout==='bento'){var cols=D.portrait?2:3,rows=D.portrait?3:2;var gap=D.unit*0.025;var cs=Math.min((D.W*(D.portrait?0.7:0.6)-gap*(cols-1))/cols,(D.H*(D.portrait?0.52:0.6)-gap*(rows-1))/rows);
    var gw=cols*cs+(cols-1)*gap,gh=rows*cs+(rows-1)*gap;var ox=(D.W-gw)/2,oy=(D.H-gh)/2-(D.portrait?D.H*0.03:D.H*0.04);
    m.cells=qa(r,'.bx').map(function(b){var cx=+b.dataset.cx,cy=+b.dataset.cy,sp=+b.dataset.span;var w=sp*cs+(sp-1)*gap,h=cs;b.style.width=w+'px';b.style.height=h+'px';b.style.left='0';b.style.top='0';return {x:ox+cx*(cs+gap),y:oy+cy*(cs+gap),w:w,h:h}})}
  if(s.layout==='cta_pill'){var c=q(r,'[data-r=ctap]');var cr=c.getBoundingClientRect();var svg=q(c,'svg');var rect=q(c,'rect');svg.setAttribute('viewBox','0 0 '+cr.width+' '+cr.height);rect.setAttribute('width',cr.width-4);rect.setAttribute('height',cr.height-4)}
  if(s.layout==='logo_end'){var L=q(r,'[data-r=logo]');var lr=L.getBoundingClientRect();m.layers={};qa(L,'.ll').forEach(function(l){var id=l.getAttribute('data-layer');var p=q(l,'path:not([style*="display:none"])');
    if(p){var pr=p.getBoundingClientRect();m.layers[id]=[(pr.left-lr.left)/lr.width*100,(pr.right-lr.left)/lr.width*100]}})}
  r.style.visibility='hidden';M[i]=m})}

window.ready=document.fonts.ready.then(function(){measure();window.renderAt(0);return true});
var flash=document.getElementById('flash');
window.renderAt=function(t){var fl=0;
  roots.forEach(function(r,i){var s=D.scenes[i];var last=i===D.scenes.length-1;var vis=t>=s.start-1e-6&&(t<s.end||(last&&t<=D.total+1));
    r.style.visibility=vis?'visible':'hidden';if(!vis)return;var lt=t-s.start;
    // camera: slow push across the scene, punch-in hit on 'punch' entries (blur scales with zoom speed)
    var cam=q(r,'.cam');var push=1+0.03*clamp(lt/s.duration);var sx=0,sy=0,blur=0;
    if(s.transition==='punch'){var pp=tw(lt,0,0.38,'expo');push*=1+0.16*(1-pp);blur=(1-pp)*D.unit*0.01;var sh=Math.max(0,1-lt/0.22);sx=(seeded(Math.floor(t*30))-0.5)*D.unit*0.02*sh;sy=(seeded(Math.floor(t*30)+7)-0.5)*D.unit*0.02*sh;fl=Math.max(fl,0.3*(1-tw(lt,0,0.14,'out')))}
    cam.style.transform='translate('+sx+'px,'+sy+'px) scale('+push+')';cam.style.filter=blur>0.2?'blur('+blur+'px)':'none';
    var wb=q(r,'.wipebar');if(wb){var wp=tw(lt,0,0.4,'io');wb.style.transform=D.portrait?'translateY('+(-wp*100)+'%)':'translateX('+(wp*100)+'%)'}
    R[s.layout](r,lt,s,M[i])});
  flash.style.opacity=String(fl)};
</script></body></html>`;
}

/** A sweeping brush ribbon that enters off-frame bottom-left, loops through the frame and exits top-right. */
function brushPath(W: number, H: number, portrait: boolean) {
  if (portrait) {
    return `M ${-0.25 * W} ${0.62 * H} C ${0.1 * W} ${0.48 * H}, ${0.15 * W} ${0.78 * H}, ${0.42 * W} ${0.66 * H} S ${0.62 * W} ${0.34 * H}, ${0.52 * W} ${0.42 * H} S ${0.66 * W} ${0.7 * H}, ${0.86 * W} ${0.55 * H} S ${1.1 * W} ${0.3 * H}, ${1.3 * W} ${0.22 * H}`;
  }
  return `M ${-0.1 * W} ${0.95 * H} C ${0.08 * W} ${0.55 * H}, ${0.22 * W} ${0.62 * H}, ${0.3 * W} ${0.86 * H} S ${0.44 * W} ${0.25 * H}, ${0.52 * W} ${0.55 * H} S ${0.66 * W} ${0.98 * H}, ${0.72 * W} ${0.5 * H} S ${0.82 * W} ${-0.05 * H}, ${0.98 * W} ${-0.2 * H}`;
}
