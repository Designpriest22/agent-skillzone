// Shared closing pieces for the cinematic ads and the story animations.
// Expects page globals: L (layout), ctx, U (unit fn), IMG, BRAND.
//
//  sponsorFrame()  - the final five seconds: sponsor logos ONLY (no festival logo, no event details, no text)
//  drawLockup()    - the event information lock-up that closes the creative section (flyer copy only)
'use strict';

// ---------------- sponsor frame ----------------
// Search every way of splitting the 13 logos (kept in flyer reading order) into rows, and keep the split that
// gives the largest equal-visual-area logo size inside the safe area. Ties favour symmetric, centred layouts.
var SP;
function compositions(n, k, lo, hi) {
  if (k === 1) return n >= lo && n <= hi ? [[n]] : [];
  const out = []; for (let a = lo; a <= hi; a++) for (const r of compositions(n - a, k - 1, lo, hi)) out.push([a, ...r]); return out;
}
function sponsorLayout() {
  const box = { x0: L.x0 + U(20), x1: L.x1 - U(20), y0: L.y0, y1: L.y1 };
  const maxH = (box.y1 - box.y0) * (L.vert ? .8 : .76);
  const gapK = L.vert ? .72 : .6, padK = L.vert ? .55 : .5;
  const pack = (rows, A) => { const r = Math.sqrt(A); return packSponsors(rows, box.x0, box.x1, 0, r * gapK, A, r * 1.32, r * 3.1, r * padK); };
  const kRange = L.vert ? [4, 5, 6] : L.ar < 1.2 ? [3, 4, 5] : [2, 3, 4];
  let best = null;
  for (const k of kRange) for (const rows of compositions(13, k, 2, L.wide ? 7 : 4)) {
    let lo = U(1000), hi = U(300000), ok = 0;
    for (let i = 0; i < 24; i++) { const A = (lo + hi) / 2; const p = pack(rows, A); if (p.bottom <= maxH && !p.shrunk) { ok = A; lo = A; } else hi = A; }
    const sym = rows.every((v, i) => v === rows[rows.length - 1 - i]) ? 1.04 : 1;   // mild preference for symmetric rows
    const score = ok * sym;
    if (!best || score > best.score) best = { rows, A: ok, score };
  }
  const p = pack(best.rows, best.A);
  const oy = box.y0 + ((box.y1 - box.y0) - p.bottom) / 2;
  p.boxes.forEach(b => { b.y += oy; b.cy += oy; }); p.bottom += oy; p.rows = best.rows;
  SP = p;
}
// clean backdrop drawn from the flyer's own charcoal tone
function sponsorBg() {
  const g = ctx.createRadialGradient(L.W / 2, L.H * .45, 0, L.W / 2, L.H * .45, Math.hypot(L.W, L.H) * .6);
  g.addColorStop(0, '#1d1c1b'); g.addColorStop(.6, '#121111'); g.addColorStop(1, '#070707');
  ctx.fillStyle = g; ctx.fillRect(0, 0, L.W, L.H);
}
// st.mode: 'rise' (soft fade + rise), 'pop' (scale settle), 'wipe' (mask reveal upward)
function sponsorFrame(t, st = {}) {
  sponsorBg();
  const n = SP.boxes.length; const mode = st.mode || 'rise';
  const drift = 1 + .018 * E.inOutQuad(prog(t, 0, 5));
  ctx.save(); ctx.translate(L.W / 2, (SP.boxes[0].y + SP.bottom) / 2); ctx.scale(drift, drift); ctx.translate(-L.W / 2, -(SP.boxes[0].y + SP.bottom) / 2);
  if (window.__log) window.__log.imgs.push('SPONSORS');
  SP.boxes.forEach((b, i) => {
    const t0 = (st.delay ?? .12) + i * (st.stagger ?? .05);
    const p = prog(t, t0, t0 + (st.dur ?? .55));
    if (p <= 0) return;
    ctx.save();
    if (mode === 'pop') {
      const s = clamp(E.outBack(p, 1.5), 0, 1.08); ctx.globalAlpha = clamp(p * 2.2);
      ctx.translate(b.x + b.w / 2, b.cy); ctx.scale(s, s); ctx.drawImage(b.im, -b.w / 2, -b.h / 2, b.w, b.h);
    } else if (mode === 'wipe') {
      const q = E.outQuart(p); ctx.beginPath(); ctx.rect(b.x - 4, b.y + b.h * (1 - q) - 4, b.w + 8, b.h * q + 8); ctx.clip();
      ctx.drawImage(b.im, b.x, b.y + (1 - q) * b.h * .35, b.w, b.h);
    } else {
      const q = E.outCubic(p); ctx.globalAlpha = q; ctx.drawImage(b.im, b.x, b.y + (1 - q) * U(18), b.w, b.h);
    }
    ctx.restore();
  });
  ctx.restore();
}

// ---------------- event information lock-up ----------------
// WIZKID wordmark, LIVE OUT LOUD MUSIC FESTIVAL logo, DECEMBER 13, 2026, EAGLE SQUARE, ABUJA
// (+ the flyer's own "GET TICKETS AT WIZKID.TIX.AFRICA" line on social formats; omitted on billboards)
var LK;
function lockupLayout() {
  const bb = !!L.bb, tix = !bb;
  if (L.wide) {
    const lolW = U(bb ? 520 : 470), wzW = U(bb ? 900 : 820);
    return LK = { wide: true, tix, lolW, wzW, colL: L.x0 + L.sw * .2, colR: L.x0 + L.sw * .66, date: U(bb ? 104 : 92), venue: U(bb ? 46 : 40) };
  }
  let k = 1;
  for (let it = 0; it < 8; it++) {
    const wz = L.sw * (L.vert ? .86 : .66) * k, lol = (L.vert ? L.sw * .62 : L.sh * .34) * k;
    const date = U(L.vert ? 112 : 88) * k, venue = U(L.vert ? 44 : 36) * k, tA = U(28) * k, tB = U(L.vert ? 44 : 38) * k;
    const wzH = wz * IMG.wizkid.height / IMG.wizkid.width, lolH = lol * IMG.lol.height / IMG.lol.width;
    const gap = U(L.vert ? 54 : 30) * k;
    const blocks = [wzH, lolH, date * .9 + venue * 1.7].concat(tix ? [tA * 1.25 + tB * 1.1] : []);
    const total = blocks.reduce((a, b) => a + b, 0) + gap * (blocks.length - 1);
    if (total <= L.sh * .96 || it === 7) {
      let y = L.y0 + (L.sh - total) / 2; const ys = blocks.map(h => { const c = y; y += h + gap; return c; });
      return LK = { wide: false, tix, wz, wzH, lol, lolH, date, venue, tA, tB, ys };
    }
    k *= L.sh * .96 / total;
  }
}
// st: {t0, step, ease, rise, reveal:'fade'|'mask', sweep, lolAnim(t)}
function drawLockup(t, st) {
  const c = LK; const ap = (i, d = .5) => st.ease(prog(t, st.t0 + i * st.step, st.t0 + i * st.step + d));
  const rise = p => (1 - p) * U(st.rise ?? 26);
  const piece = (i, draw) => { // reveal helper: fade+rise, or rising mask
    const p = ap(i); if (p <= 0) return;
    if (st.reveal === 'mask') { ctx.save(); draw(0, 1, p); ctx.restore(); }
    else { ctx.save(); ctx.globalAlpha *= clamp(p); draw(rise(p), p, 1); ctx.restore(); }
  };
  const lolA = (p) => st.lolAnim ? st.lolAnim(t) : { chev: { a: p }, word: { a: p }, mf: { a: p }, zig: { a: 1, reveal: E.outCubic(clamp(p)) } };
  if (c.wide) {
    const midY = L.cy;
    const lolH = c.lolW * IMG.lol.height / IMG.lol.width, wzH = c.wzW * IMG.wizkid.height / IMG.wizkid.width;
    const blockH = wzH + U(40) + c.date + U(28) + c.venue + (c.tix ? U(110) : 0);
    const top = midY - blockH / 2;
    piece(0, (dy, a, m) => lolLogo(ctx, c.colL, midY + dy, c.lolW, lolA(ap(0))));
    piece(1, (dy, a, m) => maskY(top, wzH, m, () => drawImg(ctx, IMG.wizkid, c.colR, top + wzH / 2 + dy + (1 - m) * wzH, c.wzW)));
    if (st.sweep) sweepImg(ctx, IMG.wizkid, c.colR, top + wzH / 2, c.wzW, prog(t, st.sweep, st.sweep + 1.1));
    const dy0 = top + wzH + U(40) + c.date * .86;
    piece(2, (dy, a, m) => maskY(dy0 - c.date, c.date * 1.1, m, () => text(ctx, BRAND.event.dateLong, c.colR, dy0 + dy + (1 - m) * c.date, { fam: 'Anton', size: c.date, track: .02, color: BRAND.white })));
    const vy = dy0 + U(28) + c.venue;
    piece(3, (dy, a, m) => maskY(vy - c.venue, c.venue * 1.2, m, () => text(ctx, BRAND.event.venue, c.colR, vy + dy + (1 - m) * c.venue, { fam: 'Oswald', w: 700, size: c.venue, track: .3, color: BRAND.tan })));
    if (c.tix) piece(4, (dy) => tixLine(c.colR, vy + U(86) + dy, U(28), U(40)));
  } else {
    const [y0, y1, y2, y3] = c.ys;
    piece(0, (dy, a, m) => maskY(y0, c.wzH, m, () => drawImg(ctx, IMG.wizkid, L.cx, y0 + c.wzH / 2 + dy + (1 - m) * c.wzH, c.wz)));
    if (st.sweep) sweepImg(ctx, IMG.wizkid, L.cx, y0 + c.wzH / 2, c.wz, prog(t, st.sweep, st.sweep + 1.1));
    piece(1, (dy) => lolLogo(ctx, L.cx, y1 + c.lolH / 2 + dy, c.lol, lolA(ap(1))));
    const db = y2 + c.date * .86;
    piece(2, (dy, a, m) => maskY(db - c.date, c.date * 1.1, m, () => text(ctx, BRAND.event.dateLong, L.cx, db + dy + (1 - m) * c.date, { fam: 'Anton', size: c.date, track: .02, color: BRAND.white })));
    const vb = db + c.venue * 1.6;
    piece(3, (dy, a, m) => maskY(vb - c.venue, c.venue * 1.2, m, () => text(ctx, BRAND.event.venue, L.cx, vb + dy + (1 - m) * c.venue, { fam: 'Oswald', w: 700, size: c.venue, track: .3, color: BRAND.tan })));
    if (c.tix) piece(4, (dy) => tixLine(L.cx, y3 + c.tA + dy, c.tA, c.tB, true));
  }
}
function maskY(y, h, m, fn) { if (m >= 1) return fn(); ctx.save(); ctx.beginPath(); ctx.rect(-L.W, y - h * .1, L.W * 3, h * 1.25); ctx.clip(); fn(); ctx.restore(); }
// the flyer's ticket line, exactly: GET TICKETS AT  WIZKID.TIX.AFRICA
function tixLine(cx, y, sA, sB, stacked) {
  if (stacked) {
    text(ctx, BRAND.event.ticketsLead, cx, y, { fam: 'Montserrat', w: 400, size: sA, track: .12, color: BRAND.white });
    text(ctx, BRAND.event.url, cx, y + sA * .3 + sB, { fam: 'Montserrat', w: 700, size: sB, track: .02, color: BRAND.white });
  } else {
    const aW = measure(ctx, BRAND.event.ticketsLead, { fam: 'Montserrat', w: 400, size: sA, track: .1 }) + U(18);
    const bW = measure(ctx, BRAND.event.url, { fam: 'Montserrat', w: 700, size: sB, track: .02 });
    const x = cx - (aW + bW) / 2;
    text(ctx, BRAND.event.ticketsLead, x, y, { fam: 'Montserrat', w: 400, size: sA, track: .1, align: 'left', color: BRAND.white });
    text(ctx, BRAND.event.url, x + aW, y, { fam: 'Montserrat', w: 700, size: sB, track: .02, align: 'left', color: BRAND.white });
  }
}
