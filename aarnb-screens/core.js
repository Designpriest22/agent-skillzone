// All About R&B screen loops — shared engine.
// Every scene is a pure function of time t in [0, 15): draw(ctx, t, W, H), drawn in a 1080-unit-tall space,
// so the same scene fills 16:9 (W = 1920) and 2:1 (W = 2160) without stretching.
'use strict';
const C = {
  red: '#CB3234', redHot: '#FF4A48', cream: '#EDD5A7', orchid: '#C666BD', ink: '#211F20', white: '#FFFFFF',
  wine: '#4A0F1C', plum: '#2B0D2E', night: '#120812', blush: '#F3C9C2', lilac: '#E9C6E4',
};
const LOOP = 15, BPM = 96, BEAT = 60 / BPM; // 24 beats per loop
const TAU = Math.PI * 2;

// ---------- maths ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const inv = (a, b, x) => clamp((x - a) / (b - a));
const smooth = (a, b, x) => { const k = inv(a, b, x); return k * k * (3 - 2 * k); };
const eOut = k => 1 - Math.pow(1 - clamp(k), 3);
const eIn = k => Math.pow(clamp(k), 3);
const eIO = k => { k = clamp(k); return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
const eBack = k => { k = clamp(k); const c = 1.9; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
const eElastic = k => { k = clamp(k); return k === 0 || k === 1 ? k : Math.pow(2, -10 * k) * Math.sin((k * 10 - .75) * TAU / 3) + 1; };
const frac = x => x - Math.floor(x);
const gauss = (x, w) => Math.exp(-(x * x) / (w * w));
// window: 0 before a, ramps up over fi, holds, ramps down over fo ending at b
const win = (t, a, b, fi = .3, fo = .3) => Math.min(smooth(a, a + fi, t), 1 - smooth(b - fo, b, t));
function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
// heartbeat envelope (lub-dub) every `period` seconds
function heartbeat(t, period = BEAT * 2) { const p = t % period; return gauss(p - .04, .07) + .6 * gauss(p - .29, .07); }
// one bump per beat, sharp attack
function beatPulse(t, every = BEAT) { const p = (t % every) / every; return Math.exp(-p * 7); }

// ---------- assets ----------
const IMG = {};
const ASSET_LIST = { heart: 'assets/heart-logo.png', outline: 'assets/heart-outline.png', htext: 'assets/heart-text.png', sig: 'assets/signature-logo.png' };
const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
// Brand typeface: Amidone Grotesk replaces the display/label faces. It has no numerals, so digits fall back to Barlow Condensed.
// Device text (radio LCD, clocks, countdown, receipt print) keeps its VT323 / Courier faces.
const BRAND = 'AmidoneGrotesk, "Barlow Condensed", sans-serif';
const REMAP = { 'Anton': .82, '"Barlow Condensed"': .84, '"DM Serif Display"': .86 };
function F(font) {
  return font.replace(/^(italic )?(\d+) (\d+(?:\.\d+)?)px (Anton|"Barlow Condensed"|"DM Serif Display")$/, (m, it, w, sz, fam) => `400 ${Math.round(sz * REMAP[fam])}px ${BRAND}`);
}
const FONTS = ['400 40px AmidoneGrotesk', '400 40px Anton', '500 40px "Barlow Condensed"', '700 40px "Barlow Condensed"', '800 40px "Barlow Condensed"', '400 40px VT323',
  '400 40px "Courier Prime"', '700 40px "Courier Prime"', 'italic 400 40px "DM Serif Display"', '400 40px "DM Serif Display"'];
const tintCache = new Map();
function tinted(name, color) {
  const key = name + color; if (tintCache.has(key)) return tintCache.get(key);
  const im = IMG[name], c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
  const x = c.getContext('2d'); x.drawImage(im, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
  tintCache.set(key, c); return c;
}
// draw a logo mask centred at (cx, cy), w wide
function logo(ctx, name, color, cx, cy, w, o = {}) {
  const im = IMG[name], h = w * im.height / im.width;
  ctx.save(); ctx.globalAlpha *= o.alpha ?? 1;
  if (o.glow) { ctx.shadowColor = o.glowColor || color; ctx.shadowBlur = o.glow; }
  if (o.rot) { ctx.translate(cx, cy); ctx.rotate(o.rot); cx = 0; cy = 0; }
  ctx.drawImage(tinted(name, color), cx - w / 2, cy - h / 2, w, h);
  if (o.glow && o.double) ctx.drawImage(tinted(name, color), cx - w / 2, cy - h / 2, w, h);
  ctx.restore(); return h;
}

// ---------- drawing helpers ----------
function txt(ctx, s, x, y, o = {}) {
  ctx.save();
  ctx.font = F(o.font || '700 40px "Barlow Condensed"'); ctx.fillStyle = o.color || C.white;
  ctx.textAlign = o.align || 'center'; ctx.textBaseline = o.base || 'middle';
  ctx.letterSpacing = (o.ls || 0) + 'px'; ctx.globalAlpha *= o.alpha ?? 1;
  if (o.glow) { ctx.shadowColor = o.glowColor || o.color; ctx.shadowBlur = o.glow; }
  if (o.stroke) { ctx.lineWidth = o.lw || 4; ctx.strokeStyle = o.stroke; ctx.lineJoin = 'round'; ctx.strokeText(s, x, y); }
  if (!o.noFill) ctx.fillText(s, x, y);
  ctx.restore();
}
function measure(ctx, s, font, ls = 0) { ctx.save(); ctx.font = F(font); ctx.letterSpacing = ls + 'px'; const w = ctx.measureText(s).width; ctx.restore(); return w; }
// heart path centred at (cx, cy) with width s
function heartPath(ctx, cx, cy, s) {
  const w = s / 2, h = s * .92;
  ctx.beginPath();
  ctx.moveTo(cx, cy + h * .5);
  ctx.bezierCurveTo(cx - w * .2, cy + h * .32, cx - w * 1.02, cy - h * .02, cx - w * .98, cy - h * .28);
  ctx.bezierCurveTo(cx - w * .94, cy - h * .56, cx - w * .42, cy - h * .66, cx, cy - h * .3);
  ctx.bezierCurveTo(cx + w * .42, cy - h * .66, cx + w * .94, cy - h * .56, cx + w * .98, cy - h * .28);
  ctx.bezierCurveTo(cx + w * 1.02, cy - h * .02, cx + w * .2, cy + h * .32, cx, cy + h * .5);
  ctx.closePath();
}
function heartPoint(a) { // parametric heart, a in [0, TAU), returns unit-ish coords (y down)
  const x = 16 * Math.pow(Math.sin(a), 3), y = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a);
  return [x / 17, -y / 17];
}
function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function lin(ctx, x0, y0, x1, y1, stops) { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; }
function rad(ctx, x, y, r0, r1, stops, x1 = x, y1 = y) { const g = ctx.createRadialGradient(x, y, r0, x1, y1, r1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; }
function glowDot(ctx, x, y, r, color, a = 1) {
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = rad(ctx, x, y, 0, r, [[0, color], [.25, color + 'AA'], [1, color + '00']]);
  ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
}
function vignette(ctx, W, H, a = .55) {
  ctx.save(); ctx.fillStyle = rad(ctx, W / 2, H / 2, H * .35, W * .75, [[0, 'rgba(0,0,0,0)'], [1, `rgba(0,0,0,${a})`]]); ctx.fillRect(0, 0, W, H); ctx.restore();
}
let grainPat = null;
function grain(ctx, W, H, t, a = .07) {
  if (!grainPat) {
    const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), d = x.createImageData(256, 256), r = rng(7);
    for (let i = 0; i < d.data.length; i += 4) { const v = r() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    x.putImageData(d, 0, 0); grainPat = ctx.createPattern(c, 'repeat');
  }
  const f = Math.floor(t * 30), r = rng(f * 9973 + 11);
  grainPat.setTransform(new DOMMatrix().translate(r() * 256, r() * 256));
  ctx.save(); ctx.globalAlpha = a; ctx.globalCompositeOperation = 'overlay'; ctx.fillStyle = grainPat; ctx.fillRect(0, 0, W, H); ctx.restore();
}
// stage light cone from (x, y) pointing at angle ang (0 = straight down)
function beam(ctx, x, y, ang, len, spread, color, a) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a;
  const g = ctx.createLinearGradient(0, 0, 0, len); g.addColorStop(0, color); g.addColorStop(1, color.slice(0, 7) + '00');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.lineTo(len * spread, len); ctx.lineTo(-len * spread, len); ctx.closePath(); ctx.fill();
  ctx.restore();
}
// small brand bug in a corner for the "real world" scenes
function bug(ctx, W, H, color = C.white, a = .9) { logo(ctx, 'heart', color, W - 110, 100, 120, { alpha: a }); }
function offscreen(w, h) { const c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h); return c; }
