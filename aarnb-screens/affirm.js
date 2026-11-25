// Affirmation loops from the user's references: station display, marker note, painted caution wall.
'use strict';

// fit lines of text into a box: returns font size
function fitLines(ctx, lines, maxW, maxH, lh = 1.02, maxSize = 220) {
  let s = maxSize; ctx.save(); ctx.font = NF(100); const w = Math.max(...lines.map(l => ctx.measureText(l).width)); ctx.restore();
  s = Math.min(s, 100 * maxW / w, maxH / (lines.length * lh)); return Math.floor(s);
}

// ============ A · STATION SIGN ============
(() => {
  const MSGS = [
    ['YOU MUST', 'BELIEVE YOU', 'ARE THE ONE.'],
    ['NEXT STOP:', 'YOUR', 'FEELINGS.'],
    ['LOVE IS', 'ARRIVING', 'NOW.'],
    ['ALL ABOUT R&B.', 'ALL', 'ABOARD.'],
  ];
  const SLOT = LOOP / MSGS.length;
  function bullet(ctx, x, y, r) { ctx.fillStyle = '#F08A24'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.fillStyle = C.white; heartPath(ctx, x, y + 1, r * 1.05); ctx.fill(); }
  function draw(ctx, t, W, H) {
    const bp = beatPulse(t), drift = Math.sin(TAU * t / LOOP) * 6;
    // night street: scaffold, lamp, warm wall
    ctx.fillStyle = lin(ctx, 0, 0, W, 0, [[0, '#0B0708'], [.7, '#1A1210'], [1, '#3A2A1C']]); ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = lin(ctx, W * .78, 0, W, 0, [[0, 'rgba(255,190,110,0)'], [1, 'rgba(255,190,110,.28)']]); ctx.fillRect(W * .78, 0, W * .22, H);
    ctx.strokeStyle = '#2C2A2C'; ctx.lineWidth = 16;
    for (const [x1, y1, x2, y2] of [[0, 120, W * .55, 520], [W * .1, 0, W * .75, 560], [W * .35, -40, W * .95, 500]]) { ctx.beginPath(); ctx.moveTo(x1 + drift, y1); ctx.lineTo(x2 + drift, y2); ctx.stroke(); }
    ctx.lineWidth = 26; for (const x of [W * .62, W * .7]) { ctx.beginPath(); ctx.moveTo(x + drift, 0); ctx.lineTo(x + drift, H); ctx.stroke(); }
    ctx.fillStyle = '#0A0809'; ctx.fillRect(90 + drift, 160, 40, H); ctx.fillRect(70 + drift, 130, 80, 40);
    const fl = .9 + .1 * Math.sin(t * 37) * Math.sin(t * 5);
    glowDot(ctx, 110 + drift, 110, 260, '#FFE2A8', .55 * fl); ctx.fillStyle = '#FFF1CC'; ctx.beginPath(); ctx.ellipse(110 + drift, 110, 70, 50, 0, 0, TAU); ctx.fill();
    // sign
    const sw = Math.min(1320, W * .68), sh = sw * .6, sx = W / 2 - sw / 2 + drift * .5, sy = 140;
    const pw = sw - 56, ph = sh * .74, px = sx + 28, py = sy + 28;
    const msgI = Math.floor(t / SLOT), lt = t - msgI * SLOT, msg = MSGS[msgI];
    const hot = msgI === 2 ? (Math.floor(lt / (BEAT)) % 2 ? 1 : 0) * smooth(1.0, 1.1, lt) : 0;
    const panelCol = hot ? C.white : C.red, textCol = hot ? C.red : C.white;
    ctx.save(); ctx.shadowColor = hot ? 'rgba(255,255,255,.7)' : 'rgba(255,60,60,.7)'; ctx.shadowBlur = 120 + 40 * bp; ctx.fillStyle = panelCol; ctx.fillRect(px, py, pw, ph); ctx.restore();
    ctx.fillStyle = '#0B0A0B'; rrect(ctx, sx, sy, sw, sh, 18); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.rect(px, py, pw, ph); ctx.clip();
    ctx.fillStyle = panelCol; ctx.fillRect(px, py, pw, ph);
    ctx.fillStyle = lin(ctx, 0, py, 0, py + ph, [[0, 'rgba(255,255,255,.12)'], [1, 'rgba(0,0,0,.18)']]); ctx.fillRect(px, py, pw, ph);
    // message: line-by-line scan on, scan off at slot end
    const size = fitLines(ctx, msg, pw * .86, ph * .84, 1.0, 190), x0 = px + (pw - measure(ctx, msg.reduce((a, b) => a.length >= b.length ? a : b), NF(size))) / 2;
    msg.forEach((ln, i) => {
      const on = inv(.15 + i * .22, .45 + i * .22, lt), off = inv(SLOT - .5 + i * .08, SLOT - .25 + i * .08, lt);
      const ly = py + ph / 2 + (i - (msg.length - 1) / 2) * size * 1.0;
      if (on <= 0 || off >= 1) return;
      ctx.save(); ctx.beginPath(); ctx.rect(px, ly - size * .62 + size * 1.24 * off, pw, size * 1.24 * (on - off)); ctx.clip();
      const blink = msgI === 2 && i === 2 && lt > 1.2 ? (Math.floor(lt / (BEAT / 2)) % 2 ? .35 : 1) : 1;
      txt(ctx, ln, x0, ly + size * .05, { font: NF(size), color: textCol, align: 'left', alpha: blink });
      ctx.restore();
      if (on < 1) { ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillRect(px, ly - size * .62 + size * 1.24 * on - 3, pw, 6); }
    });
    // LED dot texture + scanlines
    ctx.fillStyle = 'rgba(0,0,0,.10)'; for (let y = py; y < py + ph; y += 6) ctx.fillRect(px, y, pw, 2);
    if (msgI === 2 && lt > 1 && lt < 1.6) burst(ctx, px + pw * .7, py + ph * .7, lt - 1, 30, 5, 500);
    ctx.restore();
    // ETA strip
    const ey = py + ph + 14, eh = sh - ph - 56;
    ctx.fillStyle = '#2E2C2D'; ctx.fillRect(px, ey, pw, eh);
    const fs = eh * .34, cyE = ey + eh / 2, mins = [8, 22, 6, 30].map((m, k) => Math.max(0, m - msgI * (k % 2 ? 2 : 1)));
    const groups = [['Mainland', 0], ['Island', 2]];
    groups.forEach(([lbl, k], gi) => {
      const gx = px + 24 + gi * pw / 2;
      txt(ctx, lbl, gx, cyE, { font: NF(fs), color: C.white, align: 'left' });
      const lw = measure(ctx, lbl, NF(fs)), bw = Math.min(eh * 1.75, (pw / 2 - lw - 70) / 2);
      for (let j = 0; j < 2; j++) {
        const bx = gx + lw + 24 + j * (bw + 10); ctx.fillStyle = '#5A5758'; ctx.fillRect(bx, ey + 8, bw, eh - 16);
        bullet(ctx, bx + bw * .27, cyE, eh * .26);
        const m = mins[k + j], arr = m === 0;
        txt(ctx, arr ? 'NOW' : String(m), bx + bw * .7, cyE - (arr ? 0 : fs * .18), { font: NF(arr ? fs * .8 : fs), color: arr ? '#FFB2AE' : C.white, alpha: arr ? .5 + .5 * Math.abs(Math.sin(t * 6)) : 1 });
        if (!arr) txt(ctx, 'MIN', bx + bw * .7, cyE + fs * .62, { font: NF(fs * .38), color: '#CFCBCC' });
      }
    });
    // station fascia below
    ctx.fillStyle = '#121014'; ctx.fillRect(sx - 30, sy + sh + 30, sw + 60, H);
    txt(ctx, 'All About R&B Station', sx + 30, sy + sh + 130, { font: NF(78), color: '#D9D2CC', align: 'left' });
    logo(ctx, 'heart', C.red, sx + sw - 90, sy + sh + 125, 120);
    // passing train light sweep
    const tr = inv(8.6, 10.2, t);
    if (tr > 0 && tr < 1) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let k = 0; k < 5; k++) { const x = lerp(-600, W + 600, tr) - k * 260; ctx.fillStyle = lin(ctx, x - 200, 0, x + 200, 0, [[0, 'rgba(255,230,190,0)'], [.5, 'rgba(255,230,190,.16)'], [1, 'rgba(255,230,190,0)']]); ctx.fillRect(x - 200, 0, 400, H); } ctx.restore(); }
    vignette(ctx, W, H, .55); grain(ctx, W, H, t, .09);
  }
  SCENES.push({ id: 'a1-station-sign', name: 'Station Sign', tag: 'Affirmation', key: 1.6, draw,
    desc: 'A station display glowing at night cycles R&B messages: YOU MUST BELIEVE YOU ARE THE ONE, NEXT STOP: YOUR FEELINGS, LOVE IS ARRIVING NOW. The arrival times count down and a passing train sweeps light across.' });
})();

// ============ B · NOTE TO SELF (marker on red) ============
(() => {
  const NOTES = [
    { lines: ['YOU ARE', 'ABSOLUTELY', 'CAPABLE OF', 'CREATING THE LIFE', "YOU CAN'T STOP", 'THINKING ABOUT.'], t0: .4, under: 1 },
    { lines: ['YOU ARE', 'ALLOWED', 'TO FEEL', 'EVERY WORD', 'OF THIS SONG.'], t0: 7.9, under: 3 },
  ];
  const INK = '#141012', DT = .05;
  function writeNote(ctx, note, t, W, H, boilSeed) {
    const left = 90, top = 150, maxW = W * .6, maxH = H - 300, size = fitLines(ctx, note.lines, maxW, maxH, 1.12, 150), lh = size * 1.12;
    let n = 0, tip = null;
    ctx.save(); ctx.font = NF(size); ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineWidth = size * .045; ctx.strokeStyle = INK; ctx.fillStyle = INK;
    note.lines.forEach((ln, li) => {
      let x = left; const y = top + li * lh + size / 2;
      for (const ch of ln) {
        const w = ctx.measureText(ch).width, ts = note.t0 + n * DT, k = clamp((t - ts) / .09);
        if (k > 0 && ch !== ' ') {
          const r = rng(boilSeed * 131 + n * 7 + 1);
          ctx.save(); ctx.translate(x + w / 2 + (r() - .5) * 3, y + (r() - .5) * 3); ctx.rotate((r() - .5) * .07);
          ctx.beginPath(); ctx.rect(-w / 2 - 10, -size, (w + 20) * k, size * 2); ctx.clip();
          ctx.strokeText(ch, -w / 2, 0); ctx.fillText(ch, -w / 2, 0); ctx.restore();
          if (k < 1) tip = [x + w * k, y];
        }
        x += w + size * .04; n++;
      }
      if (li === note.under) { // scribbled underline once the line is written
        const ts = note.t0 + n * DT + .1, k = eOut((t - ts) / .4);
        if (k > 0) { ctx.save(); ctx.lineWidth = size * .05; ctx.lineCap = 'round'; ctx.beginPath(); const r = rng(boilSeed + 9); ctx.moveTo(left, y + size * .5);
          for (let u = 0; u <= 1.001; u += .1) ctx.lineTo(left + (x - left) * u * k, y + size * .5 + Math.sin(u * 9) * 3 + (r() - .5) * 3); ctx.stroke(); ctx.restore(); }
      }
    });
    ctx.restore();
    return { tip, end: note.t0 + n * DT, size };
  }
  function page(ctx, W, H, t) {
    ctx.fillStyle = '#DF4740'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = rad(ctx, W * .4, H * .4, 0, W * .8, [[0, 'rgba(255,255,255,.08)'], [1, 'rgba(60,0,0,.25)']]); ctx.fillRect(0, 0, W, H);
  }
  function draw(ctx, t, W, H) {
    const boil = Math.floor(t * 10);
    page(ctx, W, H, t);
    // the doodle side: a big marker heart drawn on, logo signed under it
    const hx = W * .8, hy = H * .42, hs = Math.min(420, W * .2);
    // note 1 page (tears off at 6.9), note 2 page (tears off at 13.9)
    const pages = [[0, 6.9], [1, 13.7]];
    for (const [i, tear] of pages) {
      const note = NOTES[i];
      if (t < note.t0 - .5 || t > tear + 1.2) continue;
      const k = eIn(inv(tear, tear + .95, t));
      ctx.save();
      if (k > 0) { ctx.translate(W * .1, H + 200); ctx.rotate(-k * .5); ctx.translate(-W * .1, -(H + 200) + k * H * 1.8); ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 40; page(ctx, W, H, t); ctx.shadowColor = 'transparent'; }
      const { tip, end } = writeNote(ctx, note, t, W, H, boil + i * 50);
      // heart doodle + signature
      const dk = eIO(inv(end + .1, end + 1.3, t));
      if (dk > 0) {
        ctx.save(); ctx.translate(hx, hy); const r = rng(boil + 3); ctx.rotate((r() - .5) * .03);
        ctx.strokeStyle = INK; ctx.lineWidth = hs * .05; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        heartPath(ctx, 0, 0, hs); ctx.setLineDash([hs * 3.4 * dk, hs * 4]); ctx.stroke();
        if (i === 1) { heartPath(ctx, 4, 6, hs * .9); ctx.stroke(); }
        ctx.restore();
        logo(ctx, 'sig', INK, hx, hy + hs * .78, hs * 1.15, { alpha: smooth(end + 1.0, end + 1.5, t) });
      }
      if (tip && k === 0) { ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(tip[0] + 6, tip[1] - 10, 9, 0, TAU); ctx.fill(); }
      ctx.restore();
    }
    grain(ctx, W, H, t, .12); vignette(ctx, W, H, .3);
  }
  SCENES.push({ id: 'a2-note-to-self', name: 'Note to Self', tag: 'Affirmation', key: 6.0, draw,
    desc: 'Black marker on a red page. YOU ARE ABSOLUTELY CAPABLE OF CREATING THE LIFE YOU CAN\'T STOP THINKING ABOUT writes itself letter by letter with a hand-drawn wobble, a heart gets doodled and signed, the page tears away, and YOU ARE ALLOWED TO FEEL EVERY WORD OF THIS SONG follows.' });
})();

// ============ C · CAUTION WALL ============
(() => {
  let tex = null;
  const YEL = '#F0BC2A', SETS = [
    [3.9, 6.6, ["WE'RE TOO BIG", 'TO FIT IN', 'THEIR SMALL MINDS']],
    [7.2, 10.1, ['SLOW JAMS', 'AHEAD.', 'PROCEED WITH FEELING.']],
    [10.7, 13.5, ['MAY CAUSE', 'SPONTANEOUS', 'SINGING.']],
  ];
  function bricks(W, H) {
    const c = offscreen(W, H), x = c.getContext('2d'), r = rng(71);
    x.fillStyle = '#6E625C'; x.fillRect(0, 0, W, H);
    for (let row = 0, y = 0; y < H; row++, y += 46) for (let bx = (row % 2) * -55; bx < W; bx += 110) {
      const v = 120 + Math.floor(r() * 50); x.fillStyle = `rgb(${v},${v - 10},${v - 16})`; x.fillRect(bx + 3, y + 3, 104, 40);
      x.fillStyle = 'rgba(255,255,255,.08)'; x.fillRect(bx + 3, y + 3, 104, 5); x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(bx + 3, y + 37, 104, 6);
      for (let k = 0; k < 6; k++) { x.fillStyle = `rgba(0,0,0,${r() * .15})`; x.fillRect(bx + r() * 100, y + r() * 38, 3 + r() * 10, 2 + r() * 5); }
    }
    return c;
  }
  // spray-stencil reveal: text revealed through a growing cloud of dots
  function sprayText(ctx, lines, x, y, size, lh, k0, k1, color, seed) {
    if (k0 <= 0) return;
    const w = Math.max(...lines.map(l => measure(ctx, l, NF(size)))) + 40, h = lh * lines.length + 40;
    const L = offscreen(w, h), lx = L.getContext('2d'); lx.font = NF(size); lx.fillStyle = color; lx.textBaseline = 'middle';
    lines.forEach((l, i) => lx.fillText(l, 20, 20 + lh * i + lh / 2));
    if (k0 < 1 || k1 > 0) {
      const M = offscreen(w, h), mx = M.getContext('2d'), r = rng(seed); mx.fillStyle = '#000';
      for (let i = 0; i < 900; i++) { const px = r() * w, py = r() * h, ts = (px / w) * .7 + r() * .3, rr = 30 + r() * 40; if (k0 > ts) { mx.beginPath(); mx.arc(px, py, rr * clamp((k0 - ts) * 5), 0, TAU); mx.fill(); } }
      lx.globalCompositeOperation = 'destination-in'; lx.drawImage(M, 0, 0);
      if (k1 > 0) { lx.globalCompositeOperation = 'destination-out'; lx.fillRect(0, 0, w * k1, h); }
    }
    ctx.drawImage(L, x - 20, y - 20);
  }
  function draw(ctx, t, W, H) {
    if (!tex || tex.width !== Math.ceil(W)) tex = bricks(W, H);
    const bp = beatPulse(t), push = 1 + .03 * (t / LOOP);
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(push, push); ctx.translate(-W / 2, -H / 2);
    ctx.drawImage(tex, 0, 0);
    // sign geometry
    const sw = Math.min(1500, W * .74), sh = sw * .68, sx = W / 2 - sw / 2, sy = (H - sh) / 2 - 20;
    const paint = eIO(inv(.6, 2.0, t)), band = eIO(inv(2.1, 2.9, t)), buff = eIO(inv(13.8, 14.8, t));
    const rollEdge = (k, x0, w) => x0 + w * k;
    // yellow coat (roller from left), black band, and the grey buff that wipes it all for the loop
    const paintLayer = (fn, k) => { if (k <= 0) return; ctx.save(); ctx.beginPath(); const e = rollEdge(k, sx - 20, sw + 40); ctx.moveTo(sx - 20, sy - 20); for (let y = sy - 20; y <= sy + sh + 20; y += 20) ctx.lineTo(e + Math.sin(y * .05) * 12, y); ctx.lineTo(sx - 20, sy + sh + 20); ctx.closePath(); ctx.clip(); fn(); ctx.restore(); };
    paintLayer(() => {
      ctx.fillStyle = YEL; ctx.fillRect(sx, sy, sw, sh);
      ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = .3; ctx.drawImage(tex, sx, sy, sw, sh, sx, sy, sw, sh); ctx.restore();
      paintLayer(() => { ctx.fillStyle = '#17130F'; ctx.fillRect(sx + sw * .05, sy + sh * .06, sw * .9, sh * .3); }, band);
      // CAUTION stencil cut into the band
      const cs = sh * .25; sprayText(ctx, ['CAUTION'], sx + sw / 2 - measure(ctx, 'CAUTION', NF(cs)) / 2, sy + sh * .06 + sh * .3 / 2 - cs * .6, cs, cs * 1.2, inv(3.0, 3.7, t) * 1.3, 0, YEL, 5);
      // rotating messages
      SETS.forEach(([a, b, lines], si) => {
        const size = fitLines(ctx, lines, sw * .8, sh * .46, 1.08, 120), lh = size * 1.08;
        const w = Math.max(...lines.map(l => measure(ctx, l, NF(size))));
        sprayText(ctx, lines, sx + sw / 2 - w / 2, sy + sh * .44, size, lh, inv(a, a + 1.0, t) * 1.3, inv(b - .4, b, t), '#0E0B09', 30 + si);
      });
      // stencilled heart logo
      logo(ctx, 'heart', '#17130F', sx + sw - 110, sy + sh - 100, 150, { alpha: smooth(3.8, 4.2, t) * .9 });
      ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = .15; ctx.drawImage(tex, sx, sy, sw, sh, sx, sy, sw, sh); ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(sx, sy, sw, sh);
    }, paint);
    // buff: fresh grey paint rolled over, matching the bare wall at t = 0
    if (buff > 0) paintLayer(() => { ctx.drawImage(tex, sx - 20, sy - 20, sw + 40, sh + 40, sx - 20, sy - 20, sw + 40, sh + 40); }, buff);
    // roller tool
    const rk = t < 3 ? (t < 2.05 ? paint : band) : buff;
    if ((t > .6 && t < 2.9) || (t > 13.8 && t < 14.8)) {
      const ex = rollEdge(rk, sx - 20, sw + 40), ry = sy + sh / 2 + Math.sin(t * 9) * sh * .35;
      ctx.fillStyle = '#2B2B2E'; ctx.fillRect(ex - 18, ry - 160, 36, 320); ctx.fillStyle = '#555'; ctx.fillRect(ex + 18, ry - 6, 220, 12);
    }
    ctx.restore();
    // night light: flickering sodium lamp + passing headlights in brand colours
    const fl = t < .5 ? (rng(Math.floor(t * 30))() < .5 ? .3 : 1) : .92 + .08 * Math.sin(t * 31);
    ctx.fillStyle = rad(ctx, W * .5, -200, 100, H * 1.3, [[0, `rgba(255,214,150,${.16 * fl})`], [1, `rgba(0,0,0,${.4 - .2 * fl})`]]); ctx.fillRect(0, 0, W, H);
    for (const [a, col] of [[5.0, '255,74,72'], [11.2, '198,102,189']]) { const k = inv(a, a + 1.4, t); if (k <= 0 || k >= 1) continue; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const x = lerp(-500, W + 500, k); ctx.fillStyle = lin(ctx, x - 400, 0, x + 400, 0, [[0, `rgba(${col},0)`], [.5, `rgba(${col},.28)`], [1, `rgba(${col},0)`]]); ctx.fillRect(x - 400, 0, 800, H); ctx.restore(); }
    // pavement
    ctx.fillStyle = lin(ctx, 0, H - 110, 0, H, [[0, '#3A3634'], [1, '#1A1817']]); ctx.fillRect(0, H - 110, W, 110);
    vignette(ctx, W, H, .6); grain(ctx, W, H, t, .1);
  }
  SCENES.push({ id: 'a3-caution-wall', name: 'Caution Wall', tag: 'Affirmation', key: 5.5, draw,
    desc: 'A night alley wall is painted live: roller strokes lay the yellow and the black band, CAUTION is spray-stencilled, then WE\'RE TOO BIG TO FIT IN THEIR SMALL MINDS, SLOW JAMS AHEAD and MAY CAUSE SPONTANEOUS SINGING. A grey roller buffs it clean for the loop.' });
})();
