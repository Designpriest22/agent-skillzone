// Shared motion-design library for the LOL FEST x WIZKID campaign.
// Everything is drawn on a single <canvas> per frame: deterministic, seekable, resolution-independent.
'use strict';

// ---------- maths / easing ----------
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a, b, p) => a + (b - a) * p;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const E = {
  lin: p => p,
  inQuad: p => p * p, outQuad: p => 1 - (1 - p) * (1 - p),
  inOutQuad: p => p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2,
  inCubic: p => p * p * p, outCubic: p => 1 - Math.pow(1 - p, 3),
  inOutCubic: p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2,
  outQuart: p => 1 - Math.pow(1 - p, 4), inQuart: p => p ** 4,
  outQuint: p => 1 - Math.pow(1 - p, 5),
  inOutQuint: p => p < .5 ? 16 * p ** 5 : 1 - Math.pow(-2 * p + 2, 5) / 2,
  outExpo: p => p >= 1 ? 1 : 1 - Math.pow(2, -10 * p),
  inExpo: p => p <= 0 ? 0 : Math.pow(2, 10 * p - 10),
  inOutExpo: p => p <= 0 ? 0 : p >= 1 ? 1 : p < .5 ? Math.pow(2, 20 * p - 10) / 2 : (2 - Math.pow(2, -20 * p + 10)) / 2,
  outBack: (p, s = 1.6) => 1 + (s + 1) * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2),
};
// animate value between keyframes [[t, v, ease?], ...]
function kf(t, keys) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, e] = keys[i];
    if (t <= t1) { const [t0, v0] = keys[i - 1]; return mix(v0, v1, (e || E.inOutCubic)(prog(t, t0, t1))); }
  }
  return keys[keys.length - 1][1];
}
// in/hold/out envelope: fades in over [a, a+i], out over [b-o, b]
const env = (t, a, b, i = .3, o = .3, ei = E.outCubic, eo = E.inCubic) =>
  t < a || t > b ? 0 : Math.min(ei(prog(t, a, a + i)), 1 - eo(prog(t, b - o, b)));
function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ---------- brand ----------
const BRAND = {
  black: '#0a0908', ink: '#141210', white: '#F4EEE9', cream: '#EAD7B7', tan: '#B88E6E',
  orange: '#E6531A', gold: '#F6C26B', amber: '#F29A3E', teal: '#2E5A5C',
  event: { headliner: 'WIZKID', festival: 'LIVE OUT LOUD MUSIC FESTIVAL', date: '13 DEC', dateLong: 'DECEMBER 13, 2026', city: 'ABUJA',
           venue: 'EAGLE SQUARE, ABUJA', ticketsLead: 'GET TICKETS AT', url: 'WIZKID.TIX.AFRICA' },
};
// Every on-screen word must come from the flyer or the approved brief. The audit (audit.mjs) checks each rendered
// string against this list; nothing else may be typeset.
const APPROVED = ['LIVE OUT LOUD MUSIC FESTIVAL', 'WIZKID', 'DECEMBER 13, 2026', 'EAGLE SQUARE, ABUJA',  // brief
  'LIVE', 'ABUJA', '13 DEC', 'GET TICKETS AT', 'WIZKID.TIX.AFRICA'];                                       // flyer lines
const SPONSORS = ['01-hennessy', '02-heineken', '03-coca-cola', '04-desperados', '05-best', '06-axe', '07-lords-gin',
  '08-transcorp-hotels', '09-vodi-group', '10-united-nigeria', '11-trace', '12-square-meter', '13-nova-flair'];
// optical size trims (1 = neutral) so heavy or very compact marks read evenly
const SPONSOR_TRIM = { '04-desperados': .92, '07-lords-gin': 1.08, '09-vodi-group': 1.05, '02-heineken': 1.0, '10-united-nigeria': 1.02, '13-nova-flair': 1.04, '08-transcorp-hotels': 1.05, '11-trace': .97 };

// ---------- formats ----------
// safe = area kept clear of platform UI (stories: profile bar + reply field; reels/tiktok: caption, buttons, sound bar)
const FORMATS = {
  story:  { W: 1080, H: 1920, safe: { t: 250, b: 290, l: 70, r: 70 }, tag: '9x16' },
  reels:  { W: 1080, H: 1920, safe: { t: 210, b: 470, l: 70, r: 160 }, tag: '9x16' },
  feed:   { W: 1080, H: 1350, safe: { t: 80, b: 80, l: 76, r: 76 }, tag: '4x5' },
  square: { W: 1080, H: 1080, safe: { t: 70, b: 70, l: 70, r: 70 }, tag: '1x1' },
  land:   { W: 1920, H: 1080, safe: { t: 70, b: 70, l: 96, r: 96 }, tag: '16x9' },
  bbL:    { W: 1920, H: 1080, safe: { t: 60, b: 60, l: 80, r: 80 }, tag: '16x9', bb: true },
  bbP:    { W: 1080, H: 1920, safe: { t: 80, b: 80, l: 70, r: 70 }, tag: '9x16', bb: true },
  bb4k:   { W: 1920, H: 1080, safe: { t: 60, b: 60, l: 80, r: 80 }, tag: '16x9', bb: true, dpr: 2 },
  master: { W: 1920, H: 1080, safe: { t: 70, b: 70, l: 96, r: 96 }, tag: '16x9', dpr: 2 },
};
function layout(key) {
  const f = FORMATS[key]; const { W, H, safe } = f;
  const L = { key, ...f, dpr: f.dpr || 1, ar: W / H };
  L.vert = L.ar < .7; L.wide = L.ar > 1.3; L.sq = !L.vert && !L.wide;
  L.u = Math.min(W, H) / 1080;                      // 1 unit = 1px at 1080 short side
  L.cx = (safe.l + W - safe.r) / 2; L.cy = (safe.t + H - safe.b) / 2;
  L.sw = W - safe.l - safe.r; L.sh = H - safe.t - safe.b;
  L.x0 = safe.l; L.x1 = W - safe.r; L.y0 = safe.t; L.y1 = H - safe.b;
  return L;
}

// ---------- assets ----------
const IMG = {};
function loadImg(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('img ' + src)); i.src = src; });
}
async function loadFonts() {
  const F = [
    ['Anton', 'anton-latin-400-normal', 400], ['Bebas', 'bebas-neue-latin-400-normal', 400],
    ['Oswald', 'oswald-latin-200-normal', 200], ['Oswald', 'oswald-latin-300-normal', 300],
    ['Oswald', 'oswald-latin-500-normal', 500], ['Oswald', 'oswald-latin-700-normal', 700],
    ['Montserrat', 'montserrat-latin-300-normal', 300], ['Montserrat', 'montserrat-latin-400-normal', 400],
    ['Montserrat', 'montserrat-latin-600-normal', 600], ['Montserrat', 'montserrat-latin-700-normal', 700],
    ['Montserrat', 'montserrat-latin-800-normal', 800],
    ['Serif', 'instrument-serif-latin-400-normal', 400], ['Serif', 'instrument-serif-latin-400-italic', 400, 'italic'],
  ];
  await Promise.all(F.map(async ([fam, file, w, style]) => {
    const ff = new FontFace(fam, `url(assets/fonts/${file}.woff2)`, { weight: String(w), style: style || 'normal' });
    document.fonts.add(await ff.load());
  }));
}
async function loadBrand() {
  const list = {
    lol: 'assets/flyer/lol-logo@3x.png', lolWord: 'assets/flyer/lol-layers/wordmark.png',
    chevL: 'assets/flyer/lol-layers/chev-l.png', chevR: 'assets/flyer/lol-layers/chev-r.png',
    lolMF: 'assets/flyer/lol-layers/music-festival.png', lolZig: 'assets/flyer/lol-layers/zigzag.png',
    wizkid: 'assets/flyer/wizkid-wordmark.png',
  };
  await Promise.all(Object.entries(list).map(async ([k, v]) => { IMG[k] = await loadImg(v); }));
  await Promise.all(SPONSORS.map(async s => { IMG[s] = await loadImg(`assets/logos/${s}.png`); }));
}

// ---------- footage ----------
// frames are pre-finished 1440x1440 stills at 50 fps (motion-interpolated) + 25 fps originals
const FOOT = { meta: null, cache: new Map(), order: [] };
async function loadFootageMeta() { FOOT.meta = await (await fetch('footage/meta.json')).json(); FOOT.track = await (await fetch('footage/track.json')).json(); }
function shotRange(shot) { const [a, b] = FOOT.meta.shots[shot]; return [a / 25, (b + 1) / 25 - 0.001]; }
async function getFrame(kind, idx) {
  const key = kind + idx;
  if (FOOT.cache.has(key)) return FOOT.cache.get(key);
  const img = await loadImg(`footage/${kind}/${String(idx).padStart(4, '0')}.jpg`.replace('.jpg', kind === 'matte' ? '.png' : '.jpg'));
  FOOT.cache.set(key, img); FOOT.order.push(key);
  if (FOOT.order.length > 160) FOOT.cache.delete(FOOT.order.shift());
  return img;
}
// source time (seconds in the original clip) -> image. Real-time playback uses the camera originals,
// slowed sections use the interpolated 50 fps set.
async function srcFrame(srcT, slow) {
  if (slow) return getFrame('slo', clamp(Math.round(srcT * 50), 0, FOOT.meta.nSlo - 1));
  return getFrame('rt', clamp(Math.floor(srcT * 25 + 1e-6), 0, FOOT.meta.nRt - 1));
}
// cover-fit a square source into a rect, centred on focal point (fx, fy), with zoom
function drawCover(ctx, img, x, y, w, h, fx = .5, fy = .5, zoom = 1, ox = 0, oy = 0) {
  if (window.__log) window.__log.imgs.push(img.src.split('/').slice(-2).join('/').replace(/\d{4}\.(jpg|png)$/, '*'));
  const S = img.width; const s = Math.max(w / S, h / img.height) * zoom;
  const vw = w / s, vh = h / s;
  const sx = clamp(fx * S - vw / 2 + ox * S, 0, S - vw), sy = clamp(fy * img.height - vh / 2 + oy * img.height, 0, img.height - vh);
  ctx.drawImage(img, sx, sy, vw, vh, x, y, w, h);
  return { s, sx, sy, vw, vh, map: (nx, ny) => [x + (nx * S - sx) * s, y + (ny * img.height - sy) * s] };
}

// ---------- type ----------
function setFont(ctx, fam, size, w = 400, italic = false, track = 0) {
  ctx.font = `${italic ? 'italic ' : ''}${w} ${size}px "${fam}"`;
  ctx.letterSpacing = `${track}px`;
}
// o: {fam,size,w,italic,track(em),color,align,alpha,base, chars:(i,n)=>{dx,dy,a,s,rot}, stroke, shadow}
function text(ctx, str, x, y, o = {}) {
  if (window.__log && str.trim()) window.__log.texts.push(str);
  const size = o.size || 60, track = (o.track || 0) * size;
  setFont(ctx, o.fam || 'Montserrat', size, o.w || 400, o.italic, track);
  ctx.textBaseline = o.base || 'alphabetic';
  const widths = [...str].map(ch => ctx.measureText(ch).width);
  const full = ctx.measureText(str).width - track; // trailing spacing removed
  let x0 = x;
  if (o.align === 'center' || o.align === undefined) x0 = x - full / 2;
  else if (o.align === 'right') x0 = x - full;
  ctx.save();
  ctx.globalAlpha *= (o.alpha === undefined ? 1 : o.alpha);
  if (o.shadow) { ctx.shadowColor = o.shadow[0]; ctx.shadowBlur = o.shadow[1]; }
  ctx.textAlign = 'left';
  const paint = (s, px, py) => {
    if (o.stroke) { ctx.lineWidth = o.stroke[1]; ctx.strokeStyle = o.stroke[0]; ctx.lineJoin = 'round'; ctx.strokeText(s, px, py); }
    if (o.color !== null) { ctx.fillStyle = o.color || BRAND.white; ctx.fillText(s, px, py); }
  };
  if (!o.chars) paint(str, x0, y);
  else {
    let cx = x0; const chars = [...str]; const n = chars.length;
    chars.forEach((ch, i) => {
      const a = o.chars(i, n) || {};
      if ((a.a ?? 1) > 0.001) {
        ctx.save(); ctx.globalAlpha *= (a.a ?? 1);
        const ccx = cx + widths[i] / 2 - track / 2;
        ctx.translate(ccx + (a.dx || 0), y + (a.dy || 0));
        if (a.rot) ctx.rotate(a.rot);
        if (a.s !== undefined) ctx.scale(a.sx ?? a.s, a.s);
        paint(ch, -widths[i] / 2 + track / 2, 0);
        ctx.restore();
      }
      cx += widths[i];
    });
  }
  ctx.restore();
  return full;
}
function measure(ctx, str, o) { const size = o.size || 60; setFont(ctx, o.fam || 'Montserrat', size, o.w || 400, o.italic, (o.track || 0) * size); return ctx.measureText(str).width - (o.track || 0) * size; }
// fit size so the string spans `width`
function fitSize(ctx, str, width, o) { return (o.size || 100) * width / measure(ctx, str, { ...o, size: o.size || 100 }); }

// clip helpers
function withClip(ctx, path, fn) { ctx.save(); ctx.beginPath(); path(ctx); ctx.clip(); fn(); ctx.restore(); }
const rectPath = (x, y, w, h) => c => c.rect(x, y, w, h);

// ---------- images ----------
function drawImg(ctx, img, cx, cy, w, o = {}) {
  if (window.__log) window.__log.imgs.push(img.src.split('/').pop());
  const h = w * img.height / img.width;
  ctx.save(); ctx.globalAlpha *= (o.alpha ?? 1);
  if (o.blur) ctx.filter = `blur(${o.blur}px)`;
  if (o.comp) ctx.globalCompositeOperation = o.comp;
  ctx.translate(cx, cy); if (o.rot) ctx.rotate(o.rot); if (o.s) ctx.scale(o.s, o.s);
  if (o.clip) { ctx.beginPath(); o.clip(ctx, -w / 2, -h / 2, w, h); ctx.clip(); }
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
  return h;
}
// LOL FEST lockup assembled from its own layers. a = per-layer anim {word,chev,mf,zig} each {a, s, dx, dy, reveal}
function lolLogo(ctx, cx, cy, w, a = {}) {
  if (window.__log) window.__log.imgs.push('lol-logo');
  const h = w * IMG.lol.height / IMG.lol.width;
  const L = (img, an = {}) => {
    if ((an.a ?? 1) <= 0.001) return;
    ctx.save(); ctx.globalAlpha *= (an.a ?? 1);
    ctx.translate(cx + (an.dx || 0) * w, cy + (an.dy || 0) * w);
    const s = an.s ?? 1; ctx.scale(s, s);
    if (an.reveal !== undefined && an.reveal < 1) { // vertical wipe from bottom
      ctx.beginPath(); ctx.rect(-w / 2, h / 2 - h * an.reveal, w, h * an.reveal); ctx.clip();
    }
    if (an.blur) ctx.filter = `blur(${an.blur}px)`;
    ctx.drawImage(img, -w / 2, -h / 2, w, h); ctx.restore();
  };
  L(IMG.chevL, a.chevL || a.chev); L(IMG.chevR, a.chevR || a.chev);
  L(IMG.lolWord, a.word); L(IMG.lolMF, a.mf); L(IMG.lolZig, a.zig);
  return h;
}
// light sweep across an image-shaped region (uses the image alpha as mask)
const _tmp = document.createElement('canvas');
function sweepImg(ctx, img, cx, cy, w, p, color = 'rgba(255,240,210,0.85)', width = .18) {
  if (p <= 0 || p >= 1) return;
  const h = w * img.height / img.width;
  _tmp.width = Math.ceil(w); _tmp.height = Math.ceil(h);
  const t = _tmp.getContext('2d'); t.clearRect(0, 0, _tmp.width, _tmp.height);
  t.globalCompositeOperation = 'source-over'; t.drawImage(img, 0, 0, w, h);
  t.globalCompositeOperation = 'source-in';
  const x = mix(-w * .4, w * 1.4, p);
  const g = t.createLinearGradient(x - w * width, 0, x + w * width, h * .3);
  g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, color); g.addColorStop(1, 'rgba(255,255,255,0)');
  t.fillStyle = g; t.fillRect(0, 0, w, h);
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.drawImage(_tmp, cx - w / 2, cy - h / 2); ctx.restore();
}

// ---------- graphic devices ----------
// the flyer's orange zigzag, as a vector so it can be animated / scaled without softness
function zigzag(ctx, x, y, w, amp, n, o = {}) {
  ctx.save(); ctx.globalAlpha *= (o.alpha ?? 1);
  ctx.strokeStyle = o.color || BRAND.orange; ctx.lineWidth = o.lw || amp * .55; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const p = o.draw ?? 1, seg = w / (n * 2);
  ctx.beginPath(); ctx.moveTo(x, y);
  const total = n * 2; const upto = total * p;
  for (let i = 0; i < Math.ceil(upto); i++) {
    const f = Math.min(1, upto - i);
    const yA = (i % 2 === 0) ? y : y + amp; const yB = (i % 2 === 0) ? y + amp : y;
    ctx.lineTo(x + seg * (i + f), mix(yA, yB, f));
  }
  ctx.stroke(); ctx.restore();
}
function flash(ctx, L, a, color = '#fff') { if (a <= 0) return; ctx.save(); ctx.globalAlpha = clamp(a); ctx.fillStyle = color; ctx.fillRect(0, 0, L.W, L.H); ctx.restore(); }
function vignette(ctx, L, s = .55, inner = .45) {
  const g = ctx.createRadialGradient(L.W / 2, L.H / 2, Math.min(L.W, L.H) * inner * .6, L.W / 2, L.H / 2, Math.hypot(L.W, L.H) * .55);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${s})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, L.W, L.H);
}
function letterbox(ctx, L, frac, color = '#000') { // frac = bar height as fraction of H (each)
  if (frac <= 0) return; ctx.fillStyle = color;
  ctx.fillRect(0, 0, L.W, L.H * frac); ctx.fillRect(0, L.H * (1 - frac), L.W, L.H * frac + 1);
}
// film grain: pre-baked noise tiles composited in overlay mode
const GRAIN = [];
function makeGrain() {
  for (let k = 0; k < 6; k++) {
    const c = document.createElement('canvas'); c.width = c.height = 384;
    const x = c.getContext('2d'); const d = x.createImageData(384, 384); const r = rng(77 + k * 101);
    for (let i = 0; i < d.data.length; i += 4) { const v = 128 + (r() + r() + r() - 1.5) * 120; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    x.putImageData(d, 0, 0); GRAIN.push(c);
  }
}
function grain(ctx, L, frame, amt = .07) {
  const g = GRAIN[frame % GRAIN.length]; ctx.save(); ctx.globalAlpha = amt; ctx.globalCompositeOperation = 'overlay';
  const pat = ctx.createPattern(g, 'repeat'); const ox = hash(frame) * 384, oy = hash(frame + 9) * 384;
  ctx.translate(-ox, -oy); ctx.fillStyle = pat; ctx.fillRect(0, 0, L.W + 384, L.H + 384); ctx.restore();
}
// colour grade applied on top of the footage layer via blend layers
function grade(ctx, L, look, k = 1) {
  const G = {
    gold:  [['soft-light', 'rgba(255,170,80,0.32)'], ['multiply', 'rgba(26,40,48,0.20)']],
    heat:  [['soft-light', 'rgba(255,110,40,0.42)'], ['overlay', 'rgba(255,120,60,0.10)']],
    teal:  [['soft-light', 'rgba(20,80,90,0.45)'], ['screen', 'rgba(255,150,70,0.06)']],
    mono:  [['saturation', 'rgb(128,128,128)'], ['soft-light', 'rgba(255,230,200,0.15)']],
  }[look] || [];
  ctx.save();
  for (const [op, col] of G) { ctx.globalCompositeOperation = op; ctx.globalAlpha = k; ctx.fillStyle = col; ctx.fillRect(0, 0, L.W, L.H); }
  ctx.restore();
}

// ---------- sponsor end-card pieces ----------
// optically balanced logo sizes: equal visual area, clamped by max height / width
function sponsorBoxes(area, hMax, wMax) {
  return SPONSORS.map(s => {
    const im = IMG[s]; const ar = im.width / im.height; const A = area * (SPONSOR_TRIM[s] || 1) ** 2;
    let h = Math.sqrt(A / ar), w = h * ar;
    if (h > hMax) { h = hMax; w = h * ar; } if (w > wMax) { w = wMax; h = w / ar; }
    return { s, im, w, h };
  });
}
// pack logos into rows (counts), centred in [x0,x1], rows centred vertically around their line, returns placed boxes
function packSponsors(rows, x0, x1, yTop, rowGap, area, hMax, wMax, gapMin) {
  const boxes = sponsorBoxes(area, hMax, wMax); const out = []; let k = 0; let y = yTop; let shrunk = false;
  for (const n of rows) {
    const row = boxes.slice(k, k + n); k += n;
    let tw = row.reduce((s, b) => s + b.w, 0); const avail = x1 - x0;
    let gap = (avail - tw) / (n - 1 || 1);
    if (gap < gapMin) { shrunk = true; const sc = (avail - gapMin * (n - 1)) / tw; row.forEach(b => { b.w *= sc; b.h *= sc; }); tw *= sc; gap = gapMin; }
    gap = Math.min(gap, gapMin * 2.6);
    const rowW = tw + gap * (n - 1); let x = (x0 + x1) / 2 - rowW / 2;
    const rh = Math.max(...row.map(b => b.h));
    for (const b of row) { out.push({ ...b, x, y: y + (rh - b.h) / 2, cy: y + rh / 2 }); x += b.w + gap; }
    y += rh + rowGap;
  }
  return { boxes: out, bottom: y - rowGap, shrunk };
}
function drawSponsors(ctx, placed, t, o = {}) {
  if (window.__log) window.__log.imgs.push('SPONSORS');
  placed.boxes.forEach((b, i) => {
    const st = (o.delay || 0) + i * (o.stagger ?? .045);
    const p = (o.ease || E.outCubic)(prog(t, st, st + (o.dur ?? .45)));
    if (p <= 0) return;
    ctx.save(); ctx.globalAlpha *= p;
    const dy = (1 - p) * (o.rise ?? 18);
    ctx.drawImage(b.im, b.x, b.y + dy, b.w, b.h);
    ctx.restore();
  });
}

Object.assign(window, { APPROVED, clamp, mix, prog, E, kf, env, rng, hash, BRAND, SPONSORS, FORMATS, layout, IMG, loadImg, loadFonts, loadBrand,
  FOOT, loadFootageMeta, shotRange, getFrame, srcFrame, drawCover, setFont, text, measure, fitSize, withClip, rectPath, drawImg, lolLogo,
  sweepImg, zigzag, flash, vignette, letterbox, makeGrain, grain, grade, sponsorBoxes, packSponsors, drawSponsors });
