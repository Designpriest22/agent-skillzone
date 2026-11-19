// Talent idents: one signature effect per act. 15 s seamless loops, same engine and palette as the main pack.
'use strict';
const TALENT = [];

// ---------- shared ----------
const NF = size => `400 ${size}px ${BRAND}`;
// Amidone has no numerals: '1' is built from the font's own 'I' plus a flag so it matches the face.
function glyphW(x, ch) { return ch === '1' ? x.measureText('I').width + x.measureText('I').width * .55 : x.measureText(ch).width; }
function wordW(x, s, ls) { let w = 0; for (const ch of s) w += glyphW(x, ch) + ls; return w - ls; }
function drawWord(x, s, X, Y, ls, size) {
  let cx = X;
  for (const ch of s) {
    if (ch === '1') {
      const m = x.measureText('I'), stem = m.actualBoundingBoxRight + m.actualBoundingBoxLeft, cap = x.measureText('H').actualBoundingBoxAscent, off = m.width * .55;
      x.fillText('I', cx + off, Y);
      const sx = cx + off + m.width / 2 - stem / 2, top = Y - cap;
      x.beginPath(); x.moveTo(sx + 1, top); x.lineTo(sx + stem * .2, top); x.lineTo(sx - size * .2, top + size * .2); x.lineTo(sx - size * .2, top + size * .2 - stem * .9); x.closePath(); x.fill();
    } else x.fillText(ch, cx, Y);
    cx += glyphW(x, ch) + ls;
  }
}
const nameCache = new Map();
// White name mask, lines stacked and centred, sized to fit maxW x maxH.
function nameMask(lines, maxW, maxH, maxSize = 340) {
  const key = lines.join('|') + maxW + maxH + maxSize; if (nameCache.has(key)) return nameCache.get(key);
  const m = offscreen(10, 10).getContext('2d'); m.font = NF(100);
  const lsK = .03, widest = Math.max(...lines.map(l => wordW(m, l, 100 * lsK)));
  const size = Math.floor(Math.min(maxSize, 100 * maxW / widest, maxH / (lines.length * .92)));
  m.font = NF(size); const ls = size * lsK, lh = size * .92, padX = size * .3, padY = size * .25;
  const ws = lines.map(l => wordW(m, l, ls)), W = Math.max(...ws) + padX * 2, H = lh * lines.length + padY * 2;
  const cv = offscreen(W, H), x = cv.getContext('2d'); x.font = NF(size); x.fillStyle = '#fff'; x.textBaseline = 'alphabetic';
  const cap = x.measureText('H').actualBoundingBoxAscent;
  const letters = [];
  lines.forEach((l, i) => {
    const X = (W - ws[i]) / 2, Y = padY + lh * i + lh / 2 + cap / 2; drawWord(x, l, X, Y, ls, size);
    let cx = X; for (const ch of l) { const gw = glyphW(x, ch); letters.push({ ch, line: i, x: cx, w: gw, y: Y }); cx += gw + ls; }
  });
  const r = { cv, w: W, h: H, size, ls, cap, letters, lines }; nameCache.set(key, r); return r;
}
const tintC = new WeakMap();
function tintMask(cv, color) {
  let m = tintC.get(cv); if (!m) tintC.set(cv, m = {}); if (m[color]) return m[color];
  const c = offscreen(cv.width, cv.height), x = c.getContext('2d'); x.drawImage(cv, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
  return m[color] = c;
}
function chrome(ctx, W, H, col = C.white) {
  logo(ctx, 'heart', col, 130, 115, 150, { alpha: .95 });
  txt(ctx, 'ALL ABOUT R&B', W - 90, 98, { font: NF(26), ls: 10, color: col, align: 'right', alpha: .85 });
  txt(ctx, 'NOW ON STAGE', W - 90, 136, { font: NF(26), ls: 10, color: C.redHot, align: 'right' });
}
function pill(ctx, s, x, y, a, bg = C.red, fg = C.white, size = 44) {
  if (a <= 0) return; const w = measure(ctx, s, NF(size), size * .3) + size * 1.2, h = size * 1.6;
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = bg; rrect(ctx, x - w / 2, y - h / 2, w, h, h / 2); ctx.fill();
  txt(ctx, s, x + size * .15, y + 2, { font: NF(size), ls: size * .3, color: fg }); ctx.restore();
}
function addTalent(id, name, fx, draw, key = 6) { const s = { id, name, tag: 'Talent', key, desc: fx, draw }; SCENES.push(s); TALENT.push(s); }

// ============ DJ BOBJAY · scratch glitch ============
addTalent('t1-dj-bobjay', 'DJ BOBJAY', 'Turntable scratch glitch. The name is sliced into strips that get scratched back and forth with colour-split edges, over a spinning platter and a scrolling waveform.', (ctx, t, W, H) => {
  const cx = W / 2, cy = H / 2 + 40, N = nameMask(['BOBJAY'], W * .74, 330), bp = beatPulse(t);
  ctx.fillStyle = rad(ctx, cx, cy, 0, W * .7, [[0, '#3A0B14'], [1, '#070304']]); ctx.fillRect(0, 0, W, H);
  // platter with strobe dots
  const R = 470, rot = t * TAU / LOOP * 8;
  ctx.save(); ctx.globalAlpha = .7; ctx.fillStyle = '#120C0E'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
  ctx.fillStyle = '#8F8A86'; for (let row = 0; row < 4; row++) { const n = 120 + row * 3, rr = R - 18 - row * 17; for (let i = 0; i < n; i++) { const a = rot * (1 + row * .01) + i * TAU / n; ctx.fillRect(cx + Math.cos(a) * rr - 2, cy + Math.sin(a) * rr - 2, 4, 4); } }
  ctx.strokeStyle = 'rgba(255,255,255,.04)'; for (let rr = 120; rr < R - 90; rr += 5) { ctx.beginPath(); ctx.arc(cx, cy, rr, 0, TAU); ctx.stroke(); }
  ctx.fillStyle = '#2A0E14'; ctx.beginPath(); ctx.arc(cx, cy, 110, 0, TAU); ctx.fill(); ctx.restore();
  // scratch gestures
  const wins = [[.9, 2.3], [5.0, 5.9], [8.4, 9.7], [12.2, 13.1]];
  let S = 0; for (const [a, b] of wins) if (t > a && t < b) S += Math.sin(Math.PI * inv(a, b, t)) * Math.sin(TAU * (t - a) * 3.4);
  const n = 26, sh = N.h / n, x0 = cx - N.w / 2, y0 = cy - N.h / 2, split = 5 + Math.abs(S) * 26 + bp * 4;
  const cols = [[C.red, split, 'lighter'], [C.orchid, -split, 'lighter'], [C.white, 0, 'source-over']];
  for (const [col, dx, op] of cols) {
    const m = tintMask(N.cv, col); ctx.save(); ctx.globalCompositeOperation = op; if (op === 'lighter') ctx.globalAlpha = .85;
    for (let i = 0; i < n; i++) {
      const side = i % 2 ? 1 : -1, inK = eOut(inv(.35 + i * .012, 1.05 + i * .012, t)), outK = eIn(inv(13.9 + i * .01, 14.6 + i * .01, t));
      const off = S * 150 * Math.sin(i * 1.7 + 1) + (1 - inK) * side * W + outK * -side * W;
      ctx.drawImage(m, 0, i * sh, N.w, sh + 1, x0 + off + dx, y0 + i * sh, N.w, sh + 1);
    }
    ctx.restore();
  }
  pill(ctx, 'DJ', cx, y0 + 10, win(t, .9, 14.2, .3, .3));
  // waveform strip with playhead
  const wy = H - 150, wh = 70; ctx.save(); ctx.globalAlpha = .9;
  for (let x = 60; x < W - 60; x += 6) {
    const u = x / W * 40 + t * 8 + S * 3, a = Math.abs(Math.sin(u) * Math.sin(u * .37 + 1) + .35 * Math.sin(u * 2.3)) * (x < cx ? .55 : 1);
    ctx.fillStyle = x < cx ? 'rgba(237,213,167,.35)' : C.cream; ctx.fillRect(x, wy - a * wh, 3, a * wh * 2);
  }
  ctx.fillStyle = C.redHot; ctx.fillRect(cx - 2, wy - wh - 14, 4, wh * 2 + 28); ctx.restore();
  txt(ctx, 'DECK A', 60, wy - wh - 30, { font: NF(22), ls: 8, color: C.cream, align: 'left' });
  txt(ctx, '96 BPM', W - 60, wy - wh - 30, { font: NF(22), ls: 8, color: C.cream, align: 'right' });
  if (Math.abs(S) > .5) { const r = rng(Math.floor(t * 30)); ctx.fillStyle = 'rgba(255,255,255,.06)'; for (let i = 0; i < 6; i++) ctx.fillRect(0, r() * H, W, 2 + r() * 10); }
  chrome(ctx, W, H); vignette(ctx, W, H, .5); grain(ctx, W, H, t, .08);
}, 3.0);

// ============ DJ CHIPSY · particle chips ============
(() => {
  let P = null;
  function build(W, H) {
    const N = nameMask(['CHIPSY'], W * .74, 330), d = N.cv.getContext('2d').getImageData(0, 0, N.cv.width, N.cv.height).data, pts = [], r = rng(31);
    const step = Math.max(5, Math.round(N.size / 48));
    for (let y = 0; y < N.cv.height; y += step) for (let x = 0; x < N.cv.width; x += step) if (d[(y * N.cv.width + x) * 4 + 3] > 128) pts.push([x, y]);
    const x0 = W / 2 - N.w / 2, y0 = H / 2 + 20 - N.h / 2;
    return { W, N, x0, y0, step, ps: pts.map(([x, y]) => ({ hx: x0 + x, hy: y0 + y, a0: r() * TAU, rad: 250 + r() * 900, k: r() < .5 ? 1 : 2, d: (x / N.w) * .6 + r() * .2, c: r() < .55 ? 0 : r() < .6 ? 1 : r() < .7 ? 2 : 3, ex: (r() - .5) * 2, ey: (r() - .5) * 2 })) };
  }
  addTalent('t2-dj-chipsy', 'DJ CHIPSY', 'Thousands of particle chips swarm in to build the name, explode on the drop and re-form with a ripple, over a retro grid floor.', (ctx, t, W, H) => {
    if (!P || P.W !== W) P = build(W, H);
    const cx = W / 2, cy = H / 2, bp = beatPulse(t);
    ctx.fillStyle = lin(ctx, 0, 0, 0, H, [[0, '#14061A'], [.6, '#2B0D2E'], [1, '#0C0410']]); ctx.fillRect(0, 0, W, H);
    // grid floor
    const hz = H * .66; ctx.save(); ctx.strokeStyle = 'rgba(255,74,72,.45)'; ctx.lineWidth = 2; ctx.globalCompositeOperation = 'lighter';
    for (let i = -14; i <= 14; i++) { ctx.beginPath(); ctx.moveTo(cx + i * 30, hz); ctx.lineTo(cx + i * 260, H); ctx.stroke(); }
    for (let k = 0; k < 12; k++) { const z = frac(k / 12 + t * 2 / LOOP), y = hz + (H - hz) * z * z; ctx.globalAlpha = z; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.restore(); ctx.fillStyle = lin(ctx, 0, hz - 80, 0, hz + 20, [[0, 'rgba(198,102,189,0)'], [1, 'rgba(198,102,189,.35)']]); ctx.fillRect(0, hz - 80, W, 100);
    const ripA = win(t, 8.6, 13.0, .5, .5), exK = inv(6.25, 8.2, t), ex = Math.pow(Math.sin(Math.PI * exK), 1.4) * 520;
    let formed = 0;
    // glow behind formed name
    const gA = smooth(2.2, 2.8, t) * (1 - smooth(6.2, 6.5, t)) + smooth(8.0, 8.6, t) * (1 - smooth(12.8, 13.3, t));
    if (gA > 0) { ctx.save(); ctx.globalAlpha = gA * (.55 + .3 * bp); ctx.filter = 'blur(26px)'; ctx.drawImage(tintMask(P.N.cv, C.red), P.x0, P.y0); ctx.restore(); }
    const cols = [C.cream, C.redHot, C.orchid, C.white], s = P.step - 1;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let c = 0; c < 4; c++) {
      ctx.fillStyle = cols[c];
      for (const p of P.ps) {
        if (p.c !== c) continue;
        const f = eIO(inv(.4 + p.d, 2.4 + p.d, t)) * (1 - eIO(inv(13.0 + p.d * .5, 14.7, t)));
        const ang = p.a0 + TAU * t / LOOP * p.k, sx = cx + Math.cos(ang) * p.rad, sy = cy + Math.sin(ang) * p.rad * .45;
        let x = lerp(sx, p.hx, f), y = lerp(sy, p.hy, f);
        const dx = p.hx - cx, dy = p.hy - cy, dl = Math.hypot(dx, dy) + 1;
        x += (dx / dl + p.ex * .6) * ex * f; y += (dy / dl + p.ey * .6) * ex * f;
        y += Math.sin(p.hx * .012 - t * 7) * 14 * ripA * f + bp * (p.ey * 3) * f;
        ctx.fillRect(x, y, s, s);
      }
    }
    ctx.restore();
    pill(ctx, 'DJ', cx, P.y0 + 10, gA);
    if (exK > 0 && exK < .25) { ctx.fillStyle = `rgba(255,240,230,${.5 * (1 - exK / .25)})`; ctx.fillRect(0, 0, W, H); }
    chrome(ctx, W, H); vignette(ctx, W, H, .45); grain(ctx, W, H, t, .06);
  }, 4.0);
})();

// ============ T1K · chrome ============
(() => {
  let face = null;
  addTalent('t3-t1k', 'T1K', 'Extruded chrome 3D type slams in. A light sweep glides across it, an anamorphic lens flare streaks through and it sits on a mirrored floor.', (ctx, t, W, H) => {
    const N = nameMask(['T1K'], W * .6, 420, 420), cx = W / 2, cy = H / 2 - 10, bp = beatPulse(t, BEAT * 2);
    if (!face || face.src !== N.cv) {
      const c = offscreen(N.w, N.h), x = c.getContext('2d');
      x.fillStyle = lin(x, 0, 0, 0, N.h, [[0, '#FFFFFF'], [.33, '#F6DCDC'], [.49, '#6A1A1E'], [.52, '#CB3234'], [.72, '#FFE9DD'], [1, '#7E1A1F']]); x.fillRect(0, 0, N.w, N.h);
      x.globalCompositeOperation = 'destination-in'; x.drawImage(N.cv, 0, 0); face = { src: N.cv, c };
    }
    ctx.fillStyle = rad(ctx, cx, cy, 0, W * .65, [[0, '#3E0E16'], [.6, '#120609'], [1, '#050203']]); ctx.fillRect(0, 0, W, H);
    // floor
    const fy = cy + N.h * .42; ctx.fillStyle = lin(ctx, 0, fy, 0, H, [[0, '#1A0A0D'], [1, '#050203']]); ctx.fillRect(0, fy, W, H - fy);
    ctx.strokeStyle = 'rgba(203,50,52,.25)'; ctx.lineWidth = 1; for (let i = -20; i <= 20; i++) { ctx.beginPath(); ctx.moveTo(cx + i * 40, fy); ctx.lineTo(cx + i * 220, H); ctx.stroke(); }
    const slam = eOut(inv(.4, 1.0, t)), out = eIn(inv(13.9, 14.6, t));
    const s = lerp(2.8, 1, slam) * (1 + .5 * out) * (1 + .015 * bp), yaw = Math.sin(TAU * t / LOOP) * 1.2, a = clamp(slam * 3) * (1 - out);
    const sweepX = frac(t / 5) * 1.8 - .4;
    const drawName = (mirror) => {
      ctx.save(); ctx.translate(cx, mirror ? 2 * fy - cy : cy); ctx.scale(s, mirror ? -s : s); ctx.globalAlpha = a * (mirror ? .16 : 1);
      if (slam < 1) ctx.filter = `blur(${(1 - slam) * 16}px)`;
      for (let k = 26; k >= 1; k--) ctx.drawImage(tintMask(N.cv, k < 4 ? '#8E1C20' : '#3A0A10'), -N.w / 2 + k * yaw, -N.h / 2 + k * 1.5);
      if (mirror) ctx.drawImage(face.c, -N.w / 2, -N.h / 2);
      else {
        const F = offscreen(N.w, N.h), fx2 = F.getContext('2d'); fx2.drawImage(face.c, 0, 0); fx2.globalCompositeOperation = 'source-atop';
        const g = fx2.createLinearGradient(N.w * sweepX - 160, 0, N.w * sweepX + 160, N.h);
        g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,.95)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        fx2.fillStyle = g; fx2.fillRect(0, 0, N.w, N.h); ctx.drawImage(F, -N.w / 2, -N.h / 2);
      }
      ctx.restore();
    };
    drawName(true); drawName(false);
    // anamorphic flare tied to the sweep
    const fx = cx - N.w * s / 2 + N.w * s * sweepX, fa = a * Math.sin(Math.PI * clamp((sweepX + .4) / 1.8)) * .9;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = lin(ctx, 0, 0, W, 0, [[0, 'rgba(255,90,80,0)'], [clamp(fx / W), `rgba(255,236,220,${fa})`], [1, 'rgba(255,90,80,0)']]); ctx.fillRect(0, cy - 3, W, 6);
    glowDot(ctx, fx, cy, 120, '#FFE6D8', fa); for (let k = 1; k < 4; k++) glowDot(ctx, cx + (cx - fx) * k * .35, cy + (cy - 300) * k * .1, 30 + k * 16, k % 2 ? '#C666BD' : '#FF4A48', fa * .4);
    const r = rng(8); for (let i = 0; i < 70; i++) { const x = r() * W, y = H - frac(r() + t * (1 + i % 2) / LOOP) * H; glowDot(ctx, x, y, 3 + r() * 4, C.redHot, .5); }
    ctx.restore();
    txt(ctx, 'LIVE  ·  ALL ABOUT R&B', cx, fy + 120, { font: NF(34), ls: 18, color: C.cream, alpha: a * smooth(1.2, 1.6, t) });
    const fl = Math.max(1 - inv(.95, 1.4, t), 0) * (t > .95 ? 1 : 0) + inv(14.3, 14.6, t) * (1 - inv(14.6, 14.95, t));
    if (fl > 0) { ctx.fillStyle = `rgba(255,245,240,${fl * .8})`; ctx.fillRect(0, 0, W, H); }
    chrome(ctx, W, H); vignette(ctx, W, H, .5); grain(ctx, W, H, t, .07);
  }, 6.0);
})();

// ============ WINZUTHEDJ · laser show ============
addTalent('t4-winzuthedj', 'WINZUTHEDJ', 'Laser show. Beam fans sweep through haze, a laser writes the name in outline, then a scanning laser sheet passes over it on the beat.', (ctx, t, W, H) => {
  const cx = W / 2, cy = H / 2 - 20, bp = beatPulse(t), N = nameMask(['WINZUTHEDJ'], W * .84, 300), beat = Math.floor(t / BEAT);
  ctx.fillStyle = '#050204'; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; const r = rng(3);
  for (let i = 0; i < 9; i++) { const x = r() * W + Math.sin(TAU * t / LOOP + i) * 120, y = r() * H; glowDot(ctx, x, y, 300 + r() * 300, '#5A0F1A', .35); }
  // beam fans
  const fans = [[cx, H + 20, -Math.PI / 2, 11, .09], [-20, H * .12, .25, 7, .08], [W + 20, H * .12, Math.PI - .25, 7, .08]];
  fans.forEach(([ex, ey, base, n, spread], fi) => {
    const sweep = Math.sin(TAU * t / LOOP * (fi ? 3 : 2) + fi) * (fi ? .3 : .4), on = win(t, .2, 14.8, .3, .2);
    for (let i = 0; i < n; i++) {
      if ((beat + i + fi) % 4 === 0 && t > 4) continue;
      const a = base + (i - (n - 1) / 2) * spread * (1 + .3 * Math.sin(t * 1.3)) + sweep, L = 2600, x2 = ex + Math.cos(a) * L, y2 = ey + Math.sin(a) * L;
      const col = (i + fi) % 3 === 0 ? '#FF6BD0' : '#FF2A2A';
      ctx.globalAlpha = .07 * on; ctx.strokeStyle = col; ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.globalAlpha = .75 * on; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(x2, y2); ctx.stroke();
    }
    glowDot(ctx, ex, ey, 80, '#FF3A3A', .9);
  });
  ctx.restore();
  // laser-written outline
  const wr = eIO(inv(.9, 3.9, t)), un = eIO(inv(13.4, 14.5, t)), x0 = cx - N.w / 2, y0 = cy - N.h / 2;
  const L = offscreen(N.w, N.h), lx = L.getContext('2d');
  lx.font = NF(N.size); lx.textBaseline = 'alphabetic'; lx.lineJoin = 'round';
  const line = N.lines[0], X = (N.w - wordW(lx, line, N.ls)) / 2, Y = N.letters[0].y;
  lx.globalAlpha = .18 + .3 * bp; lx.fillStyle = C.red; drawWord(lx, line, X, Y, N.ls, N.size); lx.globalAlpha = 1;
  lx.strokeStyle = '#FF3B3B'; lx.lineWidth = 5; lx.shadowColor = '#FF2020'; lx.shadowBlur = 24; lx.letterSpacing = N.ls + 'px'; lx.strokeText(line, X, Y);
  lx.shadowBlur = 0; lx.strokeStyle = '#FFE6E6'; lx.lineWidth = 1.6; lx.strokeText(line, X, Y);
  const revL = N.w * wr, revR = N.w * un;
  ctx.save(); ctx.beginPath(); ctx.rect(x0 + revR, 0, Math.max(0, revL - revR), H); ctx.clip(); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(L, x0, y0); ctx.restore();
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  if (wr > 0 && wr < 1) { const px = x0 + revL, py = cy + Math.sin(t * 40) * N.h * .3; ctx.strokeStyle = '#FF4040'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, H + 20); ctx.lineTo(px, py); ctx.stroke(); glowDot(ctx, px, py, 70, '#FFFFFF', 1); }
  if (un > 0 && un < 1) { const px = x0 + revR; glowDot(ctx, px, cy, 70, '#FFFFFF', 1); ctx.strokeStyle = '#FF4040'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, H + 20); ctx.lineTo(px, cy); ctx.stroke(); }
  // scanning laser sheet
  const scan = win(t, 7.4, 11.8, .2, .2);
  if (scan > 0) { const sy = cy + Math.sin(TAU * (t - 7.4) / (BEAT * 4)) * N.h * .7; ctx.globalAlpha = scan; ctx.fillStyle = lin(ctx, 0, sy - 30, 0, sy + 30, [[0, 'rgba(255,40,40,0)'], [.5, 'rgba(255,200,200,.9)'], [1, 'rgba(255,40,40,0)']]); ctx.fillRect(0, sy - 30, W, 60); }
  ctx.restore();
  txt(ctx, 'ON THE DECKS', cx, y0 + N.h + 40, { font: NF(36), ls: 22, color: C.cream, alpha: smooth(3.6, 4.0, t) * (1 - smooth(13.2, 13.5, t)) });
  chrome(ctx, W, H); vignette(ctx, W, H, .4); grain(ctx, W, H, t, .07);
}, 6.0);

// ============ LEEYAH · silk ============
addTalent('t5-leeyah', 'LEEYAH', 'Flowing silk ribbons and soft light leaks. The letters drift into focus one by one as the tracking tightens, under a hand-drawn underline and falling petals.', (ctx, t, W, H) => {
  const cx = W / 2, cy = H / 2 + 10, ph = TAU * t / LOOP, hb = heartbeat(t);
  ctx.fillStyle = lin(ctx, 0, 0, W, H, [[0, '#2B0D2E'], [.6, '#4A0F2A'], [1, '#1A0612']]); ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  glowDot(ctx, cx + Math.cos(ph) * 500, 300 + Math.sin(ph * 2) * 120, 700, '#C666BD', .35); glowDot(ctx, cx - Math.cos(ph) * 600, 800, 700, '#CB3234', .35);
  const ribbons = [[300, 120, '#C666BD', 0], [520, 160, '#CB3234', 2], [760, 110, '#EDD5A7', 4], [900, 140, '#C666BD', 1]];
  ribbons.forEach(([y0, A, col, p], ri) => {
    const top = [], bot = [];
    for (let x = -40; x <= W + 40; x += 24) {
      const y = y0 + A * Math.sin(x * .0021 + ph * (ri % 2 ? 1 : -1) + p) + 50 * Math.sin(x * .0057 - ph * 2 + p);
      const th = 40 + 55 * (1 + Math.sin(x * .0035 + ph + p)) / 2; top.push([x, y]); bot.push([x, y + th]);
    }
    ctx.beginPath(); top.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); bot.reverse().forEach(([x, y]) => ctx.lineTo(x, y)); ctx.closePath();
    ctx.fillStyle = lin(ctx, 0, 0, W, 0, [[0, col + '00'], [.3, col + '66'], [.7, col + '88'], [1, col + '00']]); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 2; ctx.beginPath(); top.forEach(([x, y], i) => i ? ctx.lineTo(x, y + 6) : ctx.moveTo(x, y + 6)); ctx.stroke();
  });
  ctx.restore();
  // letters
  const name = 'LEEYAH', ls = lerp(110, 26, eIO(inv(.8, 3.6, t))), size = Math.min(300, W * .13);
  ctx.save(); ctx.font = NF(size); ctx.letterSpacing = '0px'; const ws = [...name].map(c => ctx.measureText(c).width); ctx.restore();
  const tot = ws.reduce((a, b) => a + b) + ls * (name.length - 1); let x = cx - tot / 2;
  [...name].forEach((ch, i) => {
    const k = eOut(inv(.8 + i * .2, 2.2 + i * .2, t)), o = eIn(inv(13.2 + i * .12, 14.3 + i * .12, t)), a = k * (1 - o);
    if (a > 0) { ctx.save(); ctx.filter = `blur(${((1 - k) + o) * 16}px)`;
      txt(ctx, ch, x + ws[i] / 2, cy + (1 - k) * 50 - o * 70 + Math.sin(ph * 3 + i) * 4, { font: NF(size), color: '#FFF3EA', alpha: a, glow: 40 + 20 * hb, glowColor: 'rgba(198,102,189,.9)' }); ctx.restore(); }
    x += ws[i] + ls;
  });
  // underline swash written on
  const u = eIO(inv(3.0, 4.4, t)) * (1 - eIn(inv(13.0, 13.8, t)));
  if (u > 0) { ctx.save(); ctx.strokeStyle = C.redHot; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.shadowColor = C.redHot; ctx.shadowBlur = 20; ctx.setLineDash([1400 * u, 3000]);
    ctx.beginPath(); ctx.moveTo(cx - tot * .45, cy + size * .62); ctx.bezierCurveTo(cx - tot * .1, cy + size * .82, cx + tot * .2, cy + size * .5, cx + tot * .5, cy + size * .58); ctx.stroke(); ctx.restore(); }
  txt(ctx, 'LIVE ON STAGE  ·  ALL ABOUT R&B', cx, cy + size * .62 + 90, { font: NF(30), ls: 16, color: C.cream, alpha: smooth(4.0, 4.6, t) * (1 - smooth(12.8, 13.2, t)) });
  // petals
  const r = rng(12);
  for (let i = 0; i < 46; i++) {
    const px = r() * W + Math.sin(ph * 2 + i) * 60, py = frac(r() + t * (1 + i % 2) / LOOP) * (H + 100) - 50, rot = ph * (i % 3 + 1) + i;
    ctx.save(); ctx.translate(px, py); ctx.rotate(rot); ctx.scale(Math.cos(ph * 2 + i), 1); ctx.globalAlpha = .6; ctx.fillStyle = i % 3 ? '#F3C9C2' : C.red; heartPath(ctx, 0, 0, 14 + r() * 16); ctx.fill(); ctx.restore();
  }
  chrome(ctx, W, H); vignette(ctx, W, H, .45); grain(ctx, W, H, t, .06);
}, 6.0);

// ============ DJ EHIZ · spectrum ============
addTalent('t6-dj-ehiz', 'DJ EHIZ', 'An audio-reactive spectrum ring pumps on the kick. Bass shockwaves ripple out and warp the name, with a big flash drop halfway through.', (ctx, t, W, H) => {
  const cx = W / 2, cy = H / 2 + 20, kick = beatPulse(t), bass = beatPulse(t, BEAT * 2), N = nameMask(['EHIZ'], W * .5, 300, 300), drop = Math.max(0, 1 - Math.abs(t - 7.5) / .5);
  ctx.fillStyle = rad(ctx, cx, cy, 0, W * .7, [[0, `rgba(${90 + 80 * bass},12,24,1)`], [1, '#040203']]); ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 3; k++) { const age = (t % (BEAT * 2)) + k * BEAT * 2; if (age > 3.5) continue; ctx.globalAlpha = (1 - age / 3.5) * .5; ctx.strokeStyle = k ? C.orchid : C.redHot; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, 380 + age * 420, 0, TAU); ctx.stroke(); }
  ctx.globalAlpha = 1;
  const n = 180, R0 = 380 + kick * 18, rot = TAU * t / LOOP, on = win(t, .3, 14.7, .5, .4);
  for (let i = 0; i < n; i++) {
    const j = Math.min(i, n - i), a = rot + i * TAU / n - Math.PI / 2;
    const m = ((.5 + .5 * Math.sin(j * .31 + t * 5.3)) * (.5 + .5 * Math.sin(j * .09 - t * 3.1)) * .8 + (j < 18 ? .5 * bass : 0)) * (.6 + .4 * kick) * on;
    const len = 12 + 230 * m, col = i % 3 === 0 ? C.cream : j < 45 ? C.redHot : C.orchid;
    ctx.strokeStyle = col; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * R0, cy + Math.sin(a) * R0); ctx.lineTo(cx + Math.cos(a) * (R0 + len), cy + Math.sin(a) * (R0 + len)); ctx.stroke();
  }
  ctx.strokeStyle = `rgba(237,213,167,${.4 + .4 * kick})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, R0 - 16, 0, TAU); ctx.stroke();
  const r = rng(5); for (let i = 0; i < 90; i++) { const a = r() * TAU, d = 400 + frac(r() + t * 2 / LOOP) * 900; glowDot(ctx, cx + Math.cos(a) * d, cy + Math.sin(a) * d, 4 + r() * 5, C.cream, .6 * on); }
  ctx.restore();
  // name with bass warp + rgb split
  const inK = eBack(inv(.6, 1.2, t)), outK = eIn(inv(13.8, 14.5, t)), s = lerp(.2, 1, clamp(inK)) * (1 - outK) + .04 * kick, a = clamp(inK * 2) * (1 - outK);
  if (a > 0) {
    const strips = 40, sh = N.h / strips, amp = 10 + 40 * bass + 140 * drop, split = 4 + 18 * kick + 30 * drop;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s); ctx.globalAlpha = a;
    for (const [col, dx, op] of [[C.redHot, split, 'lighter'], [C.orchid, -split, 'lighter'], [C.white, 0, 'source-over']]) {
      ctx.globalCompositeOperation = op; const m = tintMask(N.cv, col);
      for (let i = 0; i < strips; i++) { const off = Math.sin(i * .5 + t * 22) * amp * (i % 3 ? 1 : -.5); ctx.drawImage(m, 0, i * sh, N.w, sh + 1, -N.w / 2 + off + dx, -N.h / 2 + i * sh, N.w, sh + 1); }
    }
    ctx.restore();
    pill(ctx, 'DJ', cx, cy - N.h * s / 2 + 6, a);
  }
  // oscilloscope
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = C.redHot; ctx.lineWidth = 3; ctx.shadowColor = C.redHot; ctx.shadowBlur = 14; ctx.beginPath();
  for (let x = 0; x <= W; x += 8) { const y = H - 110 + Math.sin(x * .02 + t * 18) * (10 + 50 * kick) * Math.sin(x * .003 + t); x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); ctx.restore();
  if (drop > .5) { ctx.fillStyle = `rgba(255,74,72,${(drop - .5) * .8})`; ctx.fillRect(0, 0, W, H); }
  chrome(ctx, W, H); vignette(ctx, W, H, .45); grain(ctx, W, H, t, .07);
}, 7.3);

// ============ PARTYBOY KERRY · disco ============
(() => {
  let conf = null;
  function confetti(W, H) {
    const r = rng(77), list = [];
    for (const [t0, side] of [[1.0, -1], [1.0, 1], [7.5, -1], [7.5, 1]]) for (let i = 0; i < 110; i++) {
      const a = -Math.PI / 2 + side * (-.15 - r() * .55), v = 1300 + r() * 1100;
      list.push({ t0: t0 + r() * .12, x0: side < 0 ? 60 : W - 60, vx: Math.cos(a) * v, vy: Math.sin(a) * v, c: [C.red, C.cream, C.orchid, C.white, '#FFB12E'][i % 5], w: 14 + r() * 14, h: 8 + r() * 8, sp: 6 + r() * 14, ph: r() * TAU });
    }
    return list;
  }
  addTalent('t7-partyboy-kerry', 'PARTYBOY KERRY', 'Disco ball throwing light specks around the room, letters that drop in with an elastic bounce and party on the beat, and confetti cannons on the drop.', (ctx, t, W, H) => {
    if (!conf || conf.W !== W) { conf = confetti(W, H); conf.W = W; }
    const cx = W / 2, rot = TAU * t / LOOP, bp = beatPulse(t), beat = Math.floor(t / BEAT);
    ctx.fillStyle = lin(ctx, 0, 0, 0, H, [[0, '#160818'], [1, '#2A0B1E']]); ctx.fillRect(0, 0, W, H);
    // specks
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const r = rng(9);
    for (let i = 0; i < 240; i++) { const lon = r() * TAU, lat = r() * 1.6 - .2, a = lon + rot * 2, x = cx + Math.sin(a) * W * .75, y = 160 + lat * H * .55 + Math.cos(a) * 30; if (Math.cos(a) < -.2) continue; glowDot(ctx, x, y, 8 + r() * 10, [C.cream, C.orchid, C.redHot, '#FFFFFF'][i % 4], .55 * (.5 + .5 * Math.cos(a))); }
    for (let k = 0; k < 6; k++) beam(ctx, cx, 170, Math.sin(rot * 2 + k * 1.05) * 1.1, 1200, .05, [C.redHot, C.orchid, C.cream][k % 3] + 'CC', .12 + .1 * bp);
    ctx.restore();
    // disco ball
    const by = 170, R = 120; ctx.strokeStyle = '#555'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, by - R); ctx.stroke();
    ctx.fillStyle = '#1E1A1C'; ctx.beginPath(); ctx.arc(cx, by, R, 0, TAU); ctx.fill();
    for (let j = 0; j < 12; j++) { const lat = -Math.PI / 2 + (j + .5) * Math.PI / 12, cl = Math.cos(lat);
      for (let k = 0; k < 28; k++) { const lon = k * TAU / 28 + rot * 2; if (Math.cos(lon) <= .05) continue; const x = cx + R * cl * Math.sin(lon), y = by + R * Math.sin(lat), w = R * TAU / 28 * cl * Math.cos(lon) * .9, h = R * Math.PI / 12 * .85;
        const g = .25 + .75 * frac(Math.sin(j * 12.9 + k * 78.2 + Math.floor(t * 8)) * 43758); ctx.fillStyle = `rgb(${150 + 105 * g},${130 + 110 * g},${150 + 100 * g})`; ctx.fillRect(x - w / 2, y - h / 2, w, h); } }
    ctx.fillStyle = rad(ctx, cx - 40, by - 50, 0, R * 1.2, [[0, 'rgba(255,255,255,.5)'], [.5, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,.45)']]); ctx.beginPath(); ctx.arc(cx, by, R, 0, TAU); ctx.fill();
    for (let k = 0; k < 4; k++) { const a = rot * 6 + k * 1.7, gx = cx + Math.cos(a) * R * .6, gy = by + Math.sin(a * 1.3) * R * .6, s = 20 + 30 * Math.max(0, Math.sin(t * 9 + k * 2)); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = '#FFF'; ctx.beginPath(); ctx.moveTo(gx - s, gy); ctx.lineTo(gx, gy - 3); ctx.lineTo(gx + s, gy); ctx.lineTo(gx, gy + 3); ctx.fill(); ctx.beginPath(); ctx.moveTo(gx, gy - s); ctx.lineTo(gx + 3, gy); ctx.lineTo(gx, gy + s); ctx.lineTo(gx - 3, gy); ctx.fill(); ctx.restore(); }
    // letters
    const lines = ['PARTYBOY', 'KERRY'], size = Math.min(210, W * .1), lh = size * 1.0, top = H / 2 + 60 - lh / 2;
    const pal = [C.cream, C.redHot, C.orchid, C.white]; let g = 0;
    lines.forEach((ln, li) => {
      ctx.save(); ctx.font = NF(size); const ws = [...ln].map(c => ctx.measureText(c).width); ctx.restore();
      const ls = size * .05, tot = ws.reduce((a, b) => a + b) + ls * (ln.length - 1); let x = cx - tot / 2;
      [...ln].forEach((ch, i) => {
        const k = eElastic(inv(.6 + g * .07, 1.8 + g * .07, t)), fall = Math.max(0, t - (13.7 + g * .03)), on = smooth(2.5, 3, t);
        let y = top + li * lh - (1 - k) * 800 + fall * fall * 2600 - Math.abs(Math.sin((t / BEAT + g * .12) * Math.PI)) * 18 * on;
        const rotL = fall * (g % 2 ? 2 : -2) + Math.sin(t * 3 + g) * .04 * on, col = t > 7.5 && t < 13.5 ? pal[(g + beat) % 4] : (li ? C.redHot : C.cream);
        if (t > 0.6 + g * .07 && y < H + 300) {
          ctx.save(); ctx.translate(x + ws[i] / 2, y); ctx.rotate(rotL);
          for (let d = 8; d >= 1; d--) txt(ctx, ch, d * 1.6, d * 2.4, { font: NF(size), color: '#3A0A18' });
          txt(ctx, ch, 0, 0, { font: NF(size), color: col }); ctx.restore();
        }
        x += ws[i] + ls; g++;
      });
    });
    // confetti
    for (const p of conf) {
      const a = t - p.t0; if (a < 0 || a > 3.6) continue;
      const x = p.x0 + p.vx * a * .9 + Math.sin(a * 4 + p.ph) * 30, y = H + 20 + p.vy * a + 900 * a * a;
      if (y > H + 40) continue;
      ctx.save(); ctx.translate(x, y); ctx.rotate(a * p.sp + p.ph); ctx.scale(Math.cos(a * p.sp * 1.3 + p.ph), 1); ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
    }
    const fl = Math.exp(-Math.max(0, t - 7.5) * 8) * (t >= 7.5 ? 1 : 0) + Math.exp(-Math.max(0, t - 1.0) * 8) * (t >= 1.0 ? .5 : 0);
    if (fl > .02) { ctx.fillStyle = `rgba(255,250,245,${fl * .6})`; ctx.fillRect(0, 0, W, H); }
    chrome(ctx, W, H); vignette(ctx, W, H, .45); grain(ctx, W, H, t, .06);
  }, 9.0);
})();

// ============ GOODY · warp tunnel ============
(() => {
  // tunnel phase: fast at the loop seam, near-still while GOODY holds; total travel is a whole number, so it loops
  const phase = t => 2 * t / LOOP + 1.5 * (1 - Math.pow(1 - inv(0, 2.8, t), 2)) + 1.5 * Math.pow(inv(12.2, 15, t), 2);
  addTalent('t8-goody', 'GOODY', 'Warp speed through rings of type and star streaks. Then the tunnel brakes, GOODY slams in with a shockwave and a retro stacked shadow, and flies past camera as the warp kicks back in.', (ctx, t, W, H) => {
    const cx = W / 2, cy = H / 2, ph = phase(t), sp = (phase(t + .02) - ph) / .02, bp = beatPulse(t), hb = heartbeat(t);
    ctx.fillStyle = rad(ctx, cx, cy, 0, W * .7, [[0, '#3A0B1E'], [1, '#060205']]); ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const r = rng(44);
    for (let i = 0; i < 420; i++) {
      const a = r() * TAU, z0 = r(), z = frac(z0 + ph), d = 1.05 - z, d2 = Math.min(1.05, d + .004 + sp * .05);
      const r1 = 60 / d, r2 = 60 / d2; if (r1 > W) continue;
      ctx.strokeStyle = i % 4 ? 'rgba(237,213,167,.8)' : 'rgba(255,74,72,.9)'; ctx.globalAlpha = clamp(z * 1.5); ctx.lineWidth = 1 + 3 * z;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2); ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.stroke();
    }
    ctx.restore();
    // rings of type
    for (let k = 0; k < 7; k++) {
      const z = frac(k / 7 + ph), d = 1.08 - z, R = 150 / d; if (R > W * 1.3) continue;
      const fs = 70 / d * .55, n = Math.max(3, Math.floor(TAU * R / (measure(ctx, 'GOODY', NF(fs)) * 1.6))), hold = smooth(2.8, 3.3, t) * (1 - smooth(12.0, 12.6, t)), a = clamp(z * 2) * (1 - smooth(.85, 1, z)) * .85 * (1 - .6 * hold);
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(k * .5 + ph * (k % 2 ? 1.5 : -1.5));
      for (let i = 0; i < n; i++) { ctx.save(); ctx.rotate(i * TAU / n); txt(ctx, 'GOODY', 0, -R, { font: NF(fs), color: k % 2 ? C.redHot : C.orchid, alpha: a }); ctx.restore(); }
      ctx.restore();
    }
    // hero
    const inK = eBack(inv(2.75, 3.25, t)), out = eIn(inv(12.2, 13.0, t)), s = lerp(.15, 1, clamp(inK)) * (1 + out * 3.5) * (1 + .04 * hb), a = clamp(inK * 3) * (1 - out);
    if (a > 0) {
      const N = nameMask(['GOODY'], W * .62, 360, 360);
      ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s); ctx.globalAlpha = a;
      [[C.wine, 30], [C.orchid, 20], [C.red, 10]].forEach(([col, o]) => ctx.drawImage(tintMask(N.cv, col), -N.w / 2 + o, -N.h / 2 + o));
      ctx.shadowColor = 'rgba(255,240,220,.6)'; ctx.shadowBlur = 30 + 30 * bp; ctx.drawImage(tintMask(N.cv, C.cream), -N.w / 2, -N.h / 2); ctx.restore();
      txt(ctx, 'LIVE  ·  ALL ABOUT R&B', cx, cy + N.h * s / 2 + 40, { font: NF(34), ls: 18, color: C.white, alpha: a * smooth(3.6, 4.0, t) });
    }
    const sw = (t - 2.85) / .9; if (sw > 0 && sw < 1) { ctx.save(); ctx.globalAlpha = 1 - sw; ctx.strokeStyle = C.white; ctx.lineWidth = 16 * (1 - sw) + 2; ctx.beginPath(); ctx.arc(cx, cy, 100 + sw * 1100, 0, TAU); ctx.stroke(); ctx.restore(); }
    const fl = t > 2.85 ? Math.exp(-(t - 2.85) * 7) : 0; if (fl > .02) { ctx.fillStyle = `rgba(255,248,240,${fl * .7})`; ctx.fillRect(0, 0, W, H); }
    chrome(ctx, W, H); vignette(ctx, W, H, .5); grain(ctx, W, H, t, .06);
  }, 6.0);
})();
