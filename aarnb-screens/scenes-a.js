// Scenes 1–3: Heartbeat in the Clouds, Radio Tuning, The Vinyl Reveal.
'use strict';
const SCENES = [];

// ============ 01 HEARTBEAT IN THE CLOUDS (logo hero) ============
(() => {
  let sprites = null, tunnel = [], bank = [], motes = [];
  function makeCloud(r, w, h, shade) {
    const a = offscreen(w, h), x = a.getContext('2d');
    const n = 9 + Math.floor(r() * 6);
    x.fillStyle = '#fff';
    for (let i = 0; i < n; i++) {
      const k = i / (n - 1), px = w * (.14 + .72 * k + (r() - .5) * .08), rr = h * (.16 + .2 * Math.sin(Math.PI * k) + r() * .1);
      x.beginPath(); x.arc(px, h * .68 - rr * .55, rr, 0, TAU); x.fill();
    }
    x.beginPath(); x.ellipse(w / 2, h * .7, w * .42, h * .12, 0, 0, TAU); x.fill();
    x.globalCompositeOperation = 'source-atop';
    x.fillStyle = lin(x, 0, h * .2, 0, h * .85, [[0, 'rgba(255,255,255,0)'], [.55, 'rgba(255,240,235,0)'], [1, shade]]);
    x.fillRect(0, 0, w, h);
    const b = offscreen(w, h), y = b.getContext('2d'); y.filter = 'blur(3px)'; y.drawImage(a, 0, 0); return b;
  }
  function init() {
    const r = rng(11);
    sprites = [0, 1, 2, 3, 4, 5].map(i => makeCloud(rng(100 + i), 640, 320, i % 2 ? 'rgba(198,102,189,.55)' : 'rgba(203,50,52,.38)'));
    for (let i = 0; i < 30; i++) {
      const a = r() * TAU, d = .7 + r() * 1.3;
      tunnel.push({ sp: i % 6, wx: Math.cos(a) * d * 1.5, wy: Math.sin(a) * d * .8 + .15, z0: i / 30 + r() * .02, fl: r() < .5 });
    }
    for (let i = 0; i < 11; i++) bank.push({ sp: i % 6, x: i / 10, y: r(), s: 1.1 + r() * .7, ph: r() * TAU });
    for (let i = 0; i < 34; i++) motes.push({ x: r(), y0: r(), k: 1 + (i % 2), s: 8 + r() * 20, ph: r() * TAU, red: r() < .45 });
  }
  function draw(ctx, t, W, H) {
    if (!sprites) init();
    const cx = W / 2, cy = H * .47, hb = heartbeat(t);
    ctx.fillStyle = lin(ctx, 0, 0, 0, H, [[0, '#3A0F3A'], [.33, '#8F3A88'], [.58, '#DC7385'], [.8, '#F2B6A0'], [1, '#F4DDB6']]);
    ctx.fillRect(0, 0, W, H);
    // sun glow + rays
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = rad(ctx, cx, cy, 0, 560 + hb * 50, [[0, 'rgba(255,250,240,1)'], [.3, 'rgba(255,226,206,.7)'], [.65, 'rgba(250,180,170,.25)'], [1, 'rgba(250,180,170,0)']]);
    ctx.fillRect(0, 0, W, H);
    const rays = 18, rot = (t / LOOP) * (TAU / rays);
    ctx.translate(cx, cy); ctx.rotate(rot); ctx.fillStyle = 'rgba(255,245,235,.07)';
    for (let i = 0; i < rays; i++) { const a = i * TAU / rays; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, W, a, a + TAU / rays / 2.6); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    // distant cloud bank, gently bobbing
    for (const b of bank) {
      const im = sprites[b.sp], w = 700 * b.s, h = w / 2, x = b.x * (W + 400) - 200 + Math.sin(TAU * t / LOOP + b.ph) * 30;
      ctx.globalAlpha = .75; ctx.drawImage(im, x - w / 2, H - h * .62 + b.y * 60 + Math.sin(TAU * 2 * t / LOOP + b.ph) * 8, w, h);
      ctx.globalAlpha = .3; ctx.drawImage(im, x - w / 2 + 160, -h * .55 + b.y * 40, w * .9, h * .9);
    }
    ctx.globalAlpha = 1;
    // fly-through clouds: depth cycles once per loop, so the loop is seamless
    const list = tunnel.map(c => ({ c, d: 1.25 - frac(c.z0 + t / LOOP) * 1.12 })).sort((a, b) => b.d - a.d);
    const drawCloud = ({ c, d }) => {
      const s = H * .17 / d, x = cx + c.wx * H * .36 / d, y = cy + c.wy * H * .36 / d;
      const a = (1 - smooth(1.02, 1.25, d)) * smooth(.13, .34, d) * (d > .9 ? .75 : 1) * (d < .62 ? smooth(320, 700, Math.hypot(x - cx, (y - cy) * 1.4)) : 1);
      if (a <= 0) return; ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); if (c.fl) ctx.scale(-1, 1);
      ctx.drawImage(sprites[c.sp], -s, -s / 2, s * 2, s); ctx.restore();
    };
    list.filter(o => o.d >= .62).forEach(drawCloud);
    // shockwave rings
    for (let k = 0; k < 2; k++) {
      const age = (t % (BEAT * 2)) + k * BEAT * 2; if (age > 2.3) continue;
      logo(ctx, 'outline', C.white, cx, cy, 620 * (1 + age * .55), { alpha: (1 - age / 2.3) * .55 });
    }
    // the heart
    const ws = 620 * (1 + .075 * hb), wt = 620 * (1 + .03 * hb);
    logo(ctx, 'outline', C.white, cx, cy, ws * 1.012, { glow: 40 + hb * 40, glowColor: 'rgba(255,255,255,.9)', alpha: .6 });
    logo(ctx, 'outline', C.red, cx, cy, ws, { glow: 18, glowColor: 'rgba(203,50,52,.6)' });
    logo(ctx, 'htext', C.red, cx, cy, wt, { glow: 10, glowColor: 'rgba(255,255,255,.8)' });
    list.filter(o => o.d < .62).forEach(drawCloud);
    // rising hearts
    for (const m of motes) {
      const y = H + 60 - frac(m.y0 + t * m.k / LOOP) * (H + 120), x = m.x * W + Math.sin(TAU * t / LOOP * 2 + m.ph) * 40;
      ctx.save(); ctx.globalAlpha = .55 * smooth(H + 60, H * .7, H + 60 - (H + 60 - y)) * (1 - smooth(H * .25, -40, y) * 0) * clamp(y / 300);
      ctx.fillStyle = m.red ? C.red : C.white; heartPath(ctx, x, y, m.s * (1 + .2 * hb)); ctx.fill(); ctx.restore();
    }
    txt(ctx, 'SING.  FEEL.  CONNECT.', cx, H - 92, { font: '800 40px "Barlow Condensed"', ls: 16, color: C.wine, alpha: .92 });
    vignette(ctx, W, H, .35); grain(ctx, W, H, t, .06);
  }
  SCENES.push({ id: '01-heartbeat-clouds', name: 'Heartbeat in the Clouds', tag: 'Logo hero', draw,
    desc: 'The heart logo beats lub-dub at 96 BPM inside a sunset sky while the camera flies through clouds. Shockwave rings on every beat.' });
})();

// ============ 02 RADIO TUNING ============
(() => {
  const keys = [[0, 88.1], [.9, 88.1], [1.9, 92.3], [2.4, 92.3], [3.0, 97.7], [3.45, 97.7], [4.2, 104.9], [4.6, 104.9], [5.6, 101.1], [13.9, 101.1], [14.75, 88.1], [15, 88.1]];
  const stations = { '92.3': 'AFRO FM 92.3', '97.7': 'NEWS 97.7', '104.9': 'TALK 104.9' };
  let bokeh = null;
  function freqAt(t) { for (let i = 0; i < keys.length - 1; i++) { const [a, fa] = keys[i], [b, fb] = keys[i + 1]; if (t <= b) return lerp(fa, fb, eIO((t - a) / (b - a))); } return 88.1; }
  function draw(ctx, t, W, H) {
    if (!bokeh) { const r = rng(5); bokeh = Array.from({ length: 46 }, (_, i) => ({ x: r(), y: 40 + r() * 330, s: 14 + r() * 52, k: 1 + (i % 3 === 0), c: [C.cream, C.red, C.orchid, '#FFB86B'][i % 4] })); }
    const f = freqAt(t), power = smooth(.1, .8, t) * (1 - smooth(14.2, 14.9, t)), lock = smooth(5.5, 5.8, t) * (1 - smooth(13.6, 13.9, t));
    const scanning = lock < .5 && power > .3, bp = beatPulse(t), cam = 1 + .045 * eIO(inv(5.6, 8.4, t)) * (1 - eIO(inv(13.5, 14.6, t)));
    // night city through the windscreen
    ctx.fillStyle = lin(ctx, 0, 0, 0, 440, [[0, '#14060F'], [1, '#3A1024']]); ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const b of bokeh) { const x = frac(b.x - t * b.k / LOOP) * (W + 200) - 100; glowDot(ctx, x, b.y, b.s, b.c, .32); }
    ctx.restore();
    ctx.save(); ctx.translate(W / 2, H * .62); ctx.scale(cam, cam); ctx.translate(-W / 2, -H * .62);
    // dashboard
    ctx.fillStyle = lin(ctx, 0, 380, 0, H, [[0, '#2A1416'], [.25, '#1A0C0E'], [1, '#0B0506']]);
    ctx.beginPath(); ctx.moveTo(-200, 470); ctx.quadraticCurveTo(W / 2, 330, W + 200, 470); ctx.lineTo(W + 200, H + 200); ctx.lineTo(-200, H + 200); ctx.fill();
    ctx.strokeStyle = 'rgba(237,213,167,.18)'; ctx.setLineDash([14, 10]); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-200, 500); ctx.quadraticCurveTo(W / 2, 362, W + 200, 500); ctx.stroke(); ctx.setLineDash([]);
    const x0 = W / 2 - 600, y0 = 450, rw = 1200, rh = 480;
    ctx.fillStyle = 'rgba(0,0,0,.55)'; rrect(ctx, x0 - 10, y0 + 30, rw + 20, rh, 46); ctx.fill();
    // chrome bezel
    ctx.fillStyle = lin(ctx, 0, y0, 0, y0 + rh, [[0, '#F4F1EC'], [.18, '#8D8A88'], [.5, '#D9D6D2'], [.52, '#6E6B6A'], [1, '#C7C4C0']]);
    rrect(ctx, x0, y0, rw, rh, 44); ctx.fill();
    ctx.fillStyle = lin(ctx, 0, y0, 0, y0 + rh, [[0, '#1C1416'], [1, '#0C0809']]); rrect(ctx, x0 + 16, y0 + 16, rw - 32, rh - 32, 32); ctx.fill();
    // dial window
    const dx = x0 + 200, dy = y0 + 46, dw = 800, dh = 150, glowC = lock > .5 ? C.red : '#F2A15A';
    ctx.save(); rrect(ctx, dx, dy, dw, dh, 14); ctx.clip();
    ctx.fillStyle = '#0E0A0A'; ctx.fillRect(dx, dy, dw, dh);
    ctx.globalAlpha = power; ctx.fillStyle = lin(ctx, 0, dy, 0, dy + dh, [[0, '#F7E3BE'], [.5, '#EDD5A7'], [1, '#D9B47C']]); ctx.fillRect(dx, dy, dw, dh);
    ctx.globalAlpha = power * lock * (.25 + .15 * bp); ctx.fillStyle = C.red; ctx.fillRect(dx, dy, dw, dh);
    ctx.globalAlpha = 1;
    const fx = v => dx + 40 + (v - 88) / 20 * (dw - 80);
    ctx.strokeStyle = power > .2 ? 'rgba(33,31,32,.85)' : 'rgba(237,213,167,.2)'; ctx.lineWidth = 2;
    for (let v = 88; v <= 108.01; v += .5) { const big = Math.abs(v % 2) < .01, x = fx(v); ctx.beginPath(); ctx.moveTo(x, dy + 18); ctx.lineTo(x, dy + (big ? 52 : 36)); ctx.stroke(); }
    for (let v = 88; v <= 108; v += 4) txt(ctx, String(v), fx(v), dy + 82, { font: '800 30px "Barlow Condensed"', color: power > .2 ? C.ink : 'rgba(237,213,167,.25)' });
    txt(ctx, 'FM', dx + 22, dy + 120, { font: '800 22px "Barlow Condensed"', color: C.red, align: 'left', alpha: .3 + .7 * power });
    txt(ctx, 'MHz', dx + dw - 22, dy + 120, { font: '700 22px "Barlow Condensed"', color: C.ink, align: 'right', alpha: power * .7 });
    // needle
    const nx = fx(f) + (scanning ? Math.sin(t * 90) * 1.5 : 0);
    ctx.save(); ctx.shadowColor = C.redHot; ctx.shadowBlur = 20 * power; ctx.fillStyle = C.red; ctx.fillRect(nx - 3, dy + 6, 6, dh - 12); ctx.restore();
    ctx.fillStyle = lin(ctx, 0, dy, 0, dy + dh, [[0, 'rgba(255,255,255,.35)'], [.4, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,.25)']]); ctx.fillRect(dx, dy, dw, dh);
    ctx.restore();
    // LCD strip
    const ly = dy + dh + 26, lh = 104;
    ctx.fillStyle = '#100607'; rrect(ctx, dx, ly, dw, lh, 12); ctx.fill();
    ctx.save(); rrect(ctx, dx, ly, dw, lh, 12); ctx.clip();
    const lc = '#FF5B4F'; ctx.globalAlpha = power;
    let label;
    const st = Object.keys(stations).find(k => Math.abs(f - +k) < .06);
    if (lock > .5) {
      const s = '♥ 101.1 FM ♥ ALL ABOUT R&B ♥ SING. FEEL. CONNECT. ', tw = measure(ctx, s, '400 76px VT323', 4), off = ((t - 5.6) * 180) % tw;
      for (let k = -1; k < 3; k++) txt(ctx, s, dx + 24 - off + k * tw, ly + lh / 2 + 4, { font: '400 76px VT323', color: lc, align: 'left', ls: 4, glow: 18 });
    } else {
      const r = rng(Math.floor(t * 20) + 3);
      label = st ? stations[st] : f.toFixed(1) + ' FM  ' + Array.from({ length: 9 }, () => '#%*~=+-:'[Math.floor(r() * 8)]).join('');
      txt(ctx, label, dx + 24, ly + lh / 2 + 4, { font: '400 76px VT323', color: lc, align: 'left', ls: 4, glow: 14, alpha: st ? .9 : .55 + r() * .4 });
    }
    ctx.globalAlpha = .18; ctx.fillStyle = '#000'; for (let y = ly; y < ly + lh; y += 4) ctx.fillRect(dx, y, dw, 2);
    ctx.restore();
    // EQ + signal + heart badge
    const ex = dx, ey = ly + lh + 34;
    for (let i = 0; i < 20; i++) {
      const h = lock * (14 + 46 * Math.abs(Math.sin(i * 1.7 + t * TAU / BEAT * (i % 3 ? .5 : 1))) * (.55 + .45 * bp)) + 6;
      ctx.fillStyle = i % 4 === 0 ? C.cream : C.red; ctx.globalAlpha = .25 + .75 * power; ctx.fillRect(ex + i * 22, ey + 70 - h, 14, h);
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < 6; i++) { const on = power * (lock > .5 ? 1 : (i < 2 + 3 * Math.abs(Math.sin(t * 7)) ? .9 : .15)); ctx.fillStyle = `rgba(237,213,167,${.1 + .9 * on})`; ctx.fillRect(dx + dw - 150 + i * 24, ey + 70 - (i + 1) * 11, 16, (i + 1) * 11); }
    logo(ctx, 'heart', lock > .5 ? C.red : '#3A2526', dx + dw / 2 + 50, ey + 38, 120, { glow: lock * 30 * (1 + bp), glowColor: C.redHot });
    // knobs
    for (const [kx, s] of [[x0 + 100, 1], [x0 + rw - 100, -1]]) {
      const ky = dy + dh / 2 + 20, rot = s * (f - 88) * .6;
      ctx.fillStyle = rad(ctx, kx - 20, ky - 25, 5, 80, [[0, '#FFFFFF'], [.4, '#B9B5B0'], [1, '#4F4C4A']]); ctx.beginPath(); ctx.arc(kx, ky, 66, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 2; for (let i = 0; i < 36; i++) { const a = rot + i * TAU / 36; ctx.beginPath(); ctx.moveTo(kx + Math.cos(a) * 56, ky + Math.sin(a) * 56); ctx.lineTo(kx + Math.cos(a) * 66, ky + Math.sin(a) * 66); ctx.stroke(); }
      ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(kx + Math.cos(rot - 1.57) * 38, ky + Math.sin(rot - 1.57) * 38, 7, 0, TAU); ctx.fill();
      txt(ctx, s > 0 ? 'VOL' : 'TUNE', kx, ky + 110, { font: '800 24px "Barlow Condensed"', ls: 6, color: 'rgba(237,213,167,.6)' });
    }
    // speaker grille dots
    ctx.fillStyle = '#2C2022'; for (let gy = 0; gy < 5; gy++) for (let gx = 0; gx < 7; gx++) { ctx.beginPath(); ctx.arc(x0 + 58 + gx * 14, y0 + 345 + gy * 18, 4, 0, TAU); ctx.arc(x0 + rw - 142 + gx * 14, y0 + 345 + gy * 18, 4, 0, TAU); ctx.fill(); }
    ctx.restore();
    // interference while scanning
    if (scanning) { const r = rng(Math.floor(t * 30)); ctx.fillStyle = 'rgba(255,255,255,.05)'; for (let i = 0; i < 8; i++) ctx.fillRect(0, r() * H, W, 2 + r() * 6); }
    // SING. FEEL. CONNECT.
    const dim = win(t, 8.3, 13.65, .25, .3);
    if (dim > 0) {
      ctx.fillStyle = `rgba(18,6,10,${dim * .82})`; ctx.fillRect(0, 0, W, H);
      const words = [['SING.', 8.45, '400 400px Anton', C.cream], ['FEEL.', 9.7, 'italic 400 420px "DM Serif Display"', C.redHot], ['CONNECT.', 10.95, '400 330px Anton', C.orchid]];
      for (const [w, a, font, col] of words) {
        if (t < a || t >= a + 1.25) continue; const k = t - a;
        ctx.save(); ctx.globalAlpha = .35 * (1 - inv(0, .18, k)); ctx.fillStyle = col; ctx.fillRect(0, 0, W, H); ctx.restore();
        const s = lerp(1.35, 1, eBack(k / .28)) + k * .04;
        ctx.save(); ctx.translate(W / 2, H / 2 + 20); ctx.scale(s, s); txt(ctx, w, 0, 0, { font, color: col, glow: 40, glowColor: 'rgba(0,0,0,.6)' }); ctx.restore();
      }
      if (t >= 12.2) {
        const k = t - 12.2, parts = [['SING.', C.cream, '400 150px Anton'], ['FEEL.', C.redHot, 'italic 400 168px "DM Serif Display"'], ['CONNECT.', C.orchid, '400 150px Anton']];
        const ws = parts.map(p => measure(ctx, p[0], p[2])), gap = 60, tot = ws.reduce((a, b) => a + b) + gap * 2; let x = W / 2 - tot / 2;
        parts.forEach((p, i) => { const kk = eBack((k - i * .1) / .3); txt(ctx, p[0], x + ws[i] / 2, H / 2 + 70 + (1 - kk) * 60, { font: p[2], color: p[1], alpha: clamp(kk) * dim }); x += ws[i] + gap; });
        logo(ctx, 'heart', C.white, W / 2, H / 2 - 170, 230, { alpha: dim * eOut((k - .3) / .3) });
      }
    }
    vignette(ctx, W, H, .5); grain(ctx, W, H, t, .07);
  }
  SCENES.push({ id: '02-radio-tuning', name: 'Radio Tuning', tag: 'Brief idea', draw,
    desc: 'A vintage car radio scans past other stations and locks on 101.1 FM, All About R&B. Then SING. FEEL. CONNECT. hits the screen two beats per word.' });
})();

// ============ 03 THE VINYL REVEAL ============
(() => {
  let rec = null; const R = 440, LR = 150;
  const w0 = TAU * (5 / 8.75); // rev speed chosen so the 15 s rotation lands on whole turns (seamless loop)
  function theta(t) {
    if (t < 4) return -1.5 * w0 - w0 * (4 - t);
    if (t < 7) return -(w0 / 6) * (7 - t) ** 2;
    if (t < 10.5) return 0;
    if (t < 13) return (w0 / 5) * (t - 10.5) ** 2;
    return 1.25 * w0 + w0 * (t - 13);
  }
  function makeRecord() {
    const c = offscreen(R * 2 + 8, R * 2 + 8), x = c.getContext('2d'), o = R + 4, r = rng(3);
    x.fillStyle = '#0B0A0A'; x.beginPath(); x.arc(o, o, R, 0, TAU); x.fill();
    for (let rr = LR + 18; rr < R - 6; rr += 2.2) {
      const gap = [210, 268, 322, 380].some(g => Math.abs(rr - g) < 3);
      const v = gap ? 44 : 14 + Math.floor(r() * 14); x.strokeStyle = `rgb(${v},${v - 1},${v})`; x.lineWidth = gap ? 2.2 : 1.2; x.beginPath(); x.arc(o, o, rr, 0, TAU); x.stroke();
    }
    x.strokeStyle = '#2E2B2B'; x.lineWidth = 6; x.beginPath(); x.arc(o, o, R - 3, 0, TAU); x.stroke();
    return c;
  }
  function plainLabel(ctx) {
    ctx.fillStyle = C.cream; ctx.beginPath(); ctx.arc(0, 0, LR, 0, TAU); ctx.fill();
    ctx.strokeStyle = C.red; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, LR - 14, 0, TAU); ctx.stroke(); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, LR - 24, 0, TAU); ctx.stroke();
    txt(ctx, 'SIDE A', 0, -72, { font: '800 40px "Barlow Condensed"', ls: 8, color: C.red });
    txt(ctx, '33 1/3 RPM', 0, 74, { font: '700 26px "Barlow Condensed"', ls: 5, color: C.ink });
    txt(ctx, 'STEREO', 0, 104, { font: '700 18px "Barlow Condensed"', ls: 6, color: C.ink, alpha: .7 });
  }
  function logoLabel(ctx) {
    ctx.fillStyle = rad(ctx, 0, 0, 0, LR, [[0, '#D8403F'], [1, '#B32A2C']]); ctx.beginPath(); ctx.arc(0, 0, LR, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, LR - 10, 0, TAU); ctx.stroke();
    logo(ctx, 'heart', C.white, 0, 4, 236);
  }
  function draw(ctx, t, W, H) {
    if (!rec) rec = makeRecord();
    const cx = Math.round(W * .36), cy = H / 2, th = theta(t), hold = win(t, 6.6, 10.6, .5, .5), hb = heartbeat(t);
    const mix = smooth(4.3, 6.7, t) * (1 - smooth(13.0, 14.4, t));
    ctx.fillStyle = lin(ctx, 0, 0, W, H, [[0, '#1A0B0D'], [1, '#060304']]); ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = rad(ctx, cx, cy, 0, R * 1.9, [[0, `rgba(203,50,52,${.5 + .3 * hold})`], [.55, 'rgba(120,20,40,.18)'], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(0, 0, W, H);
    // light burst behind the record during the reveal
    if (hold > 0) {
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * .08); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 24; i++) { ctx.fillStyle = `rgba(237,${i % 2 ? 213 : 120},${i % 2 ? 167 : 150},${.06 * hold * (1 + hb)})`; const a = i * TAU / 24; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, W, a, a + .07); ctx.fill(); }
      ctx.restore();
    }
    // record
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 20; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(th); ctx.drawImage(rec, -R - 4, -R - 4);
    plainLabel(ctx);
    if (mix > 0) { ctx.save(); ctx.beginPath(); ctx.arc(0, 0, LR * eIO(mix) + .1, 0, TAU); ctx.clip(); logoLabel(ctx); ctx.restore(); }
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.fill();
    ctx.restore();
    // fixed specular sheen
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R - 2, 0, TAU); ctx.arc(cx, cy, LR + 6, 0, TAU, true); ctx.clip();
    const cg = ctx.createConicGradient(-.6, cx, cy);
    [[0, 0], [.06, .24], [.12, 0], [.5, 0], [.56, .2], [.62, 0], [1, 0]].forEach(([o, a]) => cg.addColorStop(o, `rgba(255,236,220,${a})`));
    ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = cg; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    ctx.fillStyle = rad(ctx, cx + R * .5, cy - R * .6, 0, R * .9, [[0, 'rgba(255,80,80,.18)'], [1, 'rgba(255,80,80,0)']]); ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    ctx.restore();
    // glow ring on reveal
    if (mix > 0 && mix < 1) { ctx.save(); ctx.strokeStyle = `rgba(255,220,200,${.8 * Math.sin(Math.PI * mix)})`; ctx.lineWidth = 6; ctx.shadowColor = C.cream; ctx.shadowBlur = 20; ctx.beginPath(); ctx.arc(cx, cy, LR * eIO(mix), 0, TAU); ctx.stroke(); ctx.restore(); }
    if (hold > 0) { ctx.save(); ctx.globalAlpha = hold * (.25 + .35 * hb); ctx.strokeStyle = C.redHot; ctx.lineWidth = 8; ctx.shadowColor = C.redHot; ctx.shadowBlur = 40; ctx.beginPath(); ctx.arc(cx, cy, LR + 4 + hb * 10, 0, TAU); ctx.stroke(); ctx.restore(); }
    // tonearm
    const P = [cx + R * .98, cy - R * .78], T = [cx + R * .74 * Math.cos(.32), cy + R * .74 * Math.sin(.32)];
    const L = Math.hypot(T[0] - P[0], T[1] - P[1]), aOn = Math.atan2(T[1] - P[1], T[0] - P[0]), off = eIO(inv(6.7, 7.4, t)) * (1 - eIO(inv(10.0, 10.6, t)));
    const a = aOn - .42 * off;
    ctx.save(); ctx.translate(P[0], P[1]);
    ctx.fillStyle = rad(ctx, -10, -10, 4, 70, [[0, '#F2F0EC'], [1, '#55524F']]); ctx.beginPath(); ctx.arc(0, 0, 56, 0, TAU); ctx.fill();
    ctx.rotate(a); ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 14;
    ctx.fillStyle = lin(ctx, 0, -9, 0, 9, [[0, '#FFFFFF'], [.5, '#A9A6A2'], [1, '#5C5956']]); ctx.fillRect(-90, -9, L + 90, 18);
    ctx.fillStyle = '#2A2727'; rrect(ctx, -150, -30, 70, 60, 10); ctx.fill();
    ctx.translate(L, 0); ctx.rotate(.5); ctx.fillStyle = lin(ctx, 0, -22, 0, 22, [[0, '#DCD8D2'], [1, '#6B6865']]); rrect(ctx, -20, -22, 76, 44, 6); ctx.fill();
    ctx.fillStyle = C.red; ctx.fillRect(10, -22, 8, 44);
    ctx.restore();
    // dust in the light
    const r = rng(21); ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 60; i++) { const x = r() * W, y0 = r(), k = 1 + (i % 2), y = frac(y0 - t * k / LOOP) * H; glowDot(ctx, x + Math.sin(t * TAU / LOOP * 3 + i) * 20, y, 3 + r() * 6, C.cream, .35); }
    ctx.restore();
    // text column
    const tx = cx + R + 140, tw = W - tx - 90;
    txt(ctx, 'NOW SPINNING', tx, 300, { font: '800 34px "Barlow Condensed"', ls: 12, color: C.cream, align: 'left' });
    const bp = beatPulse(t);
    const nw = measure(ctx, 'NOW SPINNING', '800 34px "Barlow Condensed"', 12);
    for (let i = 0; i < 6; i++) { ctx.fillStyle = C.red; const h = 8 + 22 * Math.abs(Math.sin(i * 2.1 + t * 6)) * (t < 6.7 || t > 10.5 ? 1 : .2); ctx.fillRect(tx + nw + 16 + i * 12, 315 - h, 8, h); }
    const tracks = [['A1', 'SING.'], ['A2', 'FEEL.'], ['A3', 'CONNECT.']];
    tracks.forEach(([n, name], i) => {
      const y = 410 + i * 150, on = t >= i * 5 && t < (i + 1) * 5, p = on ? (t - i * 5) / 5 : (t >= (i + 1) * 5 ? 1 : 0);
      txt(ctx, n, tx, y, { font: '700 30px "Barlow Condensed"', color: on ? C.red : 'rgba(237,213,167,.4)', align: 'left', ls: 4 });
      txt(ctx, name, tx + 70, y + 4, { font: on ? 'italic 400 104px "DM Serif Display"' : '400 104px Anton', color: on ? C.white : 'rgba(237,213,167,.28)', align: 'left', glow: on ? 18 * (1 + bp) : 0, glowColor: 'rgba(255,74,72,.6)' });
      ctx.fillStyle = 'rgba(237,213,167,.15)'; ctx.fillRect(tx + 72, y + 62, Math.min(tw - 72, 520), 4);
      ctx.fillStyle = C.red; ctx.fillRect(tx + 72, y + 62, Math.min(tw - 72, 520) * p, 4);
    });
    txt(ctx, 'ALL ABOUT R&B  ·  33 1/3 RPM', tx, 870, { font: '700 26px "Barlow Condensed"', ls: 8, color: 'rgba(237,213,167,.55)', align: 'left' });
    vignette(ctx, W, H, .6); grain(ctx, W, H, t, .08);
  }
  SCENES.push({ id: '03-vinyl-reveal', name: 'The Vinyl Reveal', tag: 'Brief idea', draw,
    desc: 'A record spins, slows and lands upright as the plain label turns into the All About R&B logo. The tonearm lifts, the label beats, then the record spins back up.' });
})();
