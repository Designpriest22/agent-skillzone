// Scenes 7–10: Departures Board, Red Means R&B, Neon Signature, Phones Up.
'use strict';

// ============ 07 DEPARTURES BOARD ============
(() => {
  const PX = 56, CW = 52, CH = 76, PY = 88, ROWS = 7, CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789&:.';
  const FD = .055;
  const DATA = [['21:00', 'AR001', 'ABJ', 'R&B', 'A1', 'BOARDING'], ['21:05', 'AR096', 'LOS', 'R&B', 'A2', 'ON TIME'], ['21:10', 'AR214', 'ACC', 'R&B', 'B1', 'ON TIME'],
    ['21:15', 'AR520', 'LHR', 'R&B', 'B4', 'ON TIME'], ['21:20', 'AR777', 'JNB', 'R&B', 'C2', 'FINAL CALL'], ['21:30', 'AR143', 'NBO', 'R&B', 'C3', 'ON TIME'], ['21:45', 'AR365', 'DXB', 'R&B', 'D1', 'IN LOVE']];
  let cache = {};
  function layout(cols) {
    if (cache[cols]) return cache[cols];
    const gate = cols >= 35, pad = (s, n) => (s + ' '.repeat(n)).slice(0, n);
    const colsDef = gate ? [['TIME', 5], ['FLIGHT', 5], ['FROM', 3], ['', 1], ['TO', 3], ['GATE', 2], ['STATUS', 10]] : [['TIME', 5], ['FLIGHT', 5], ['FROM', 3], ['', 1], ['TO', 3], ['STATUS', 10]];
    const used = colsDef.reduce((a, c) => a + c[1], 0) + colsDef.length - 1, lead = Math.floor((cols - used) / 2);
    const starts = []; let x = lead; colsDef.forEach(c => { starts.push(x); x += c[1] + 1; });
    const table = DATA.map(d => { const f = gate ? [d[0], d[1], d[2], '>', d[3], d[4], d[5]] : [d[0], d[1], d[2], '>', d[3], d[5]]; return pad(' '.repeat(lead) + f.map((v, i) => pad(v, colsDef[i][1])).join(' '), cols); });
    const ctr = s => pad(' '.repeat(Math.max(0, Math.floor((cols - s.length) / 2))) + s, cols);
    const msg = ['', 'ALL FLIGHTS', 'ARE HEADED', 'TO R&B', '', 'SING. FEEL. CONNECT.', ''].map(ctr);
    const blank = Array(ROWS).fill(' '.repeat(cols));
    const r = rng(cols * 7 + 1), delay = [], flips = [];
    for (let y = 0; y < ROWS; y++) { delay.push([]); flips.push([]); for (let c = 0; c < cols; c++) { delay[y].push(y * .11 + c * .022 + r() * .18); flips[y].push(4 + Math.floor(r() * 9)); } }
    return cache[cols] = { colsDef, starts, table, msg, blank, delay, flips, statusCol: starts[starts.length - 1] };
  }
  const STATES = [[.6, 'table'], [8.2, 'msg'], [13.6, 'blank']];
  function cellState(L, y, c, t) {
    let prev = L.blank[y][c], cur = prev, start = -1, idx = -1;
    STATES.forEach(([T, k], i) => { const s = T + L.delay[y][c]; if (t >= s) { prev = cur; cur = L[k][y][c]; start = s; idx = i; } });
    if (idx < 0) return { ch: prev };
    const n = L.flips[y][c], e = t - start;
    if (prev === cur || e >= n * FD) return { ch: cur };
    const r = rng(y * 991 + c * 37 + idx * 7 + 1), seq = Array.from({ length: n }, () => CHARS[Math.floor(r() * CHARS.length)]);
    const i = Math.floor(e / FD), p = frac(e / FD), from = i === 0 ? prev : seq[i - 1], to = i === n - 1 ? cur : seq[i];
    return { ch: to, from, p };
  }
  function glyph(ctx, ch, x, y, col) {
    if (ch === ' ') return;
    if (ch === '>') { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x + 10, y + CH / 2 - 5); ctx.lineTo(x + 30, y + CH / 2 - 5); ctx.lineTo(x + 30, y + CH / 2 - 15); ctx.lineTo(x + 44, y + CH / 2); ctx.lineTo(x + 30, y + CH / 2 + 15); ctx.lineTo(x + 30, y + CH / 2 + 5); ctx.lineTo(x + 10, y + CH / 2 + 5); ctx.fill(); return; }
    txt(ctx, ch, x + CW / 2, y + CH / 2 + 3, { font: '800 64px "Barlow Condensed"', color: col });
  }
  function half(ctx, x, y, top, fn) { ctx.save(); ctx.beginPath(); ctx.rect(x, top ? y : y + CH / 2, CW, CH / 2); ctx.clip(); fn(); ctx.restore(); }
  function draw(ctx, t, W, H) {
    const cols = Math.floor((W - 120) / PX), L = layout(cols), gx = (W - cols * PX + (PX - CW)) / 2, gy = 262;
    ctx.fillStyle = lin(ctx, 0, 0, 0, H, [[0, '#141012'], [1, '#090708']]); ctx.fillRect(0, 0, W, H);
    // header
    txt(ctx, '✈', gx + 34, 118, { font: '400 76px "DejaVu Sans", sans-serif', color: C.cream });
    txt(ctx, 'DEPARTURES', gx + 96, 122, { font: '400 96px Anton', color: C.white, align: 'left', ls: 4 });
    txt(ctx, 'ALL ABOUT R&B INTERNATIONAL', gx + 98, 192, { font: '700 28px "Barlow Condensed"', color: C.red, align: 'left', ls: 10 });
    logo(ctx, 'heart', C.red, W - gx - 300, 128, 150);
    const sec = Math.floor(t) % 60; txt(ctx, '21:' + String(Math.floor(t / 60)).padStart(2, '0'), W - gx, 112, { font: '400 92px VT323', color: '#FFB347', align: 'right', glow: 16 });
    txt(ctx, 'LOCAL TIME', W - gx, 172, { font: '700 22px "Barlow Condensed"', color: 'rgba(237,213,167,.6)', align: 'right', ls: 6 });
    const ha = win(t, .4, 8.4, .4, .3);
    L.colsDef.forEach(([n], i) => txt(ctx, n, gx + L.starts[i] * PX, 236, { font: '800 24px "Barlow Condensed"', color: 'rgba(237,213,167,.65)', align: 'left', ls: 6, alpha: ha }));
    // flaps
    const blink = .55 + .45 * Math.cos(t * TAU / (BEAT * 2));
    for (let y = 0; y < ROWS; y++) for (let c = 0; c < cols; c++) {
      const x = gx + c * PX, yy = gy + y * PY, s = cellState(L, y, c, t);
      const red = (t > 8.2 && t < 13.9 && y === 3 && 'R&B'.includes(s.ch) && s.ch !== ' ' && !s.from);
      const bg = red ? C.red : '#1E1A1B';
      ctx.fillStyle = bg; rrect(ctx, x, yy, CW, CH, 5); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fillRect(x, yy, CW, CH / 2);
      let col = '#F2E6CE';
      if (y === 0 && c >= L.statusCol && t > 1.5 && t < 8.2 && !s.from) col = `rgba(255,90,80,${blink})`;
      if (y === 4 && c >= L.statusCol && t > 1.5 && t < 8.2 && !s.from) col = C.orchid;
      if (red) col = C.white;
      if (!s.from) glyph(ctx, s.ch, x, yy, col);
      else {
        half(ctx, x, yy, true, () => glyph(ctx, s.ch, x, yy, col));
        half(ctx, x, yy, false, () => glyph(ctx, s.from, x, yy, col));
        ctx.save(); const k = s.p < .5 ? 1 - s.p * 2 : s.p * 2 - 1; ctx.translate(0, yy + CH / 2); ctx.scale(1, k); ctx.translate(0, -(yy + CH / 2));
        ctx.fillStyle = '#262123'; if (s.p < .5) ctx.fillRect(x, yy, CW, CH / 2); else ctx.fillRect(x, yy + CH / 2, CW, CH / 2);
        half(ctx, x, yy, s.p < .5, () => glyph(ctx, s.p < .5 ? s.from : s.ch, x, yy, col)); ctx.restore();
      }
      ctx.fillStyle = '#060505'; ctx.fillRect(x, yy + CH / 2 - 1, CW, 2);
    }
    // ticker
    const ty = 912; ctx.fillStyle = C.red; ctx.fillRect(0, ty, W, 92);
    const s = 'ALL FLIGHTS ARE HEADED TO R&B   ♥   PLEASE PROCEED TO YOUR FEELINGS   ♥   NOW BOARDING: SING. FEEL. CONNECT.   ♥   ';
    const tw = measure(ctx, s, '400 54px Anton', 3), off = frac(t / LOOP * 2) * tw;
    for (let k = -1; k < Math.ceil(W / tw) + 1; k++) txt(ctx, s, k * tw - off, ty + 48, { font: '400 54px Anton', color: C.white, align: 'left', ls: 3 });
    vignette(ctx, W, H, .4); grain(ctx, W, H, t, .05);
  }
  SCENES.push({ id: '07-departures-board', name: 'Departures Board', tag: 'Brief idea', draw,
    desc: 'A split-flap board flips into departures: ABJ, LOS, ACC, LHR, JNB, NBO, DXB, all headed to R&B. Then the whole board flips to ALL FLIGHTS ARE HEADED TO R&B.' });
})();

// ============ 08 RED MEANS R&B (traffic light + danfo) ============
(() => {
  let city = null;
  function phase(t) { return t < 3.4 ? 'g' : t < 4.6 ? 'a' : t < 12.4 ? 'r' : 'g'; }
  function draw(ctx, t, W, H) {
    if (!city || city.W !== W) { const r = rng(8); city = { W, b: Array.from({ length: Math.ceil(W / 70) + 2 }, (_, i) => ({ x: i * 70 - 40 + r() * 20, w: 60 + r() * 40, h: 140 + r() * 320, win: r() })) }; }
    const ph = phase(t), red = ph === 'r' ? smooth(4.6, 4.75, t) * (1 - smooth(12.3, 12.45, t)) : 0, bp = beatPulse(t);
    const stop = W * .6, xD = t < 12.7 ? lerp(-700, stop, eOut(inv(2.0, 5.0, t))) : lerp(stop, W + 800, eIn(inv(12.7, 14.9, t)));
    ctx.fillStyle = lin(ctx, 0, 0, 0, 760, [[0, '#12050F'], [1, '#4A0F1C']]); ctx.fillRect(0, 0, W, H);
    for (const b of city.b) {
      ctx.fillStyle = '#1C0A14'; ctx.fillRect(b.x, 760 - b.h, b.w, b.h);
      const r = rng(Math.floor(b.x) + 3); for (let y = 760 - b.h + 16; y < 740; y += 30) for (let x = b.x + 10; x < b.x + b.w - 14; x += 22) if (r() < .35) { ctx.fillStyle = r() < .2 ? 'rgba(198,102,189,.7)' : 'rgba(253,214,160,.65)'; ctx.fillRect(x, y, 10, 14); }
    }
    // road
    ctx.fillStyle = '#151012'; ctx.fillRect(0, 760, W, H);
    ctx.fillStyle = '#2A2224'; ctx.fillRect(0, 740, W, 26);
    ctx.fillStyle = 'rgba(237,213,167,.8)'; for (let x = -40; x < W; x += 220) ctx.fillRect(x, 1010, 120, 12);
    ctx.fillStyle = 'rgba(255,255,255,.85)'; for (let k = 0; k < 10; k++) ctx.fillRect(W * .9 + k * 34 - 300, 960, 20, 120);
    // passing traffic on green
    const g = (1 - smooth(3.2, 3.6, t)) + smooth(12.4, 12.8, t);
    if (g > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let k = 0; k < 6; k++) { const x = frac(k / 6 + t * .9) * (W + 800) - 400; ctx.fillStyle = lin(ctx, x - 300, 0, x, 0, [[0, 'rgba(255,60,60,0)'], [1, `rgba(255,${k % 2 ? 230 : 80},${k % 2 ? 200 : 70},${.8 * clamp(g)})`]]); ctx.fillRect(x - 300, 800 + (k % 3) * 18, 300, 6); } ctx.restore(); }
    // danfo
    const dy = 932 + Math.sin(t * 14) * (xD > -600 && xD < W + 700 && Math.abs(xD - stop) > 2 ? 2 : .6), bw = 780, bx = xD - bw / 2;
    ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.beginPath(); ctx.ellipse(xD, 945, bw * .55, 22, 0, 0, TAU); ctx.fill();
    ctx.save(); ctx.translate(bx, dy - 340);
    ctx.fillStyle = '#F4B400'; ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(620, 0); ctx.quadraticCurveTo(700, 0, 740, 120); ctx.lineTo(780, 200); ctx.lineTo(780, 300); ctx.lineTo(0, 300); ctx.lineTo(0, 20); ctx.quadraticCurveTo(0, 0, 20, 0); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(10, 10, 640, 10);
    ctx.fillStyle = '#141012'; ctx.fillRect(0, 196, 780, 14); ctx.fillRect(0, 222, 780, 8);
    ctx.fillStyle = '#211A1C'; for (let k = 0; k < 5; k++) rrect(ctx, 30 + k * 122, 34, 106, 120, 10), ctx.fill();
    ctx.beginPath(); ctx.moveTo(650, 34); ctx.lineTo(700, 34); ctx.lineTo(748, 150); ctx.lineTo(650, 150); ctx.fill();
    for (let k = 0; k < 5; k++) { const hop = Math.abs(Math.sin((t / BEAT + k * .5) * Math.PI)) * 10 * (red > .5 ? 1 : .3); ctx.fillStyle = '#060405'; ctx.beginPath(); ctx.arc(83 + k * 122, 118 - hop, 26, 0, TAU); ctx.fill(); ctx.fillRect(48 + k * 122, 140 - hop, 70, 20); }
    logo(ctx, 'heart', C.white, 30 + 53 + 0, 94, 92, { alpha: .95 });
    ctx.fillStyle = '#FFFFFF'; rrect(ctx, 660, 38, 80, 26, 4); ctx.fill(); txt(ctx, 'R&B ONLY', 700, 52, { font: '800 17px "Barlow Condensed"', color: C.red });
    txt(ctx, 'SLOW JAMS ONLY', 330, 262, { font: '400 46px Anton', color: '#141012', ls: 4 });
    ctx.fillStyle = '#141012'; ctx.fillRect(760, 250, 24, 40); ctx.fillRect(-6, 250, 20, 40);
    glowDot(ctx, 770, 214, 50, '#FFF1C8', .9);
    glowDot(ctx, 8, 214, 40 + red * 30, C.redHot, .5 + red * .5);
    ctx.restore();
    for (const wx of [bx + 150, bx + 620]) { ctx.save(); ctx.translate(wx, 930); ctx.rotate(xD / 62); ctx.fillStyle = '#0B0909'; ctx.beginPath(); ctx.arc(0, 0, 62, 0, TAU); ctx.fill(); ctx.fillStyle = '#8B8582'; ctx.beginPath(); ctx.arc(0, 0, 28, 0, TAU); ctx.fill(); ctx.fillStyle = '#0B0909'; for (let k = 0; k < 5; k++) { ctx.rotate(TAU / 5); ctx.fillRect(-4, 6, 8, 18); } ctx.restore(); }
    // red wash
    if (red > 0) { ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.fillStyle = `rgba(255,40,40,${red * (.35 + .1 * bp)})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    // traffic light
    const lx = W * .17, top = 110;
    ctx.fillStyle = '#0A0809'; ctx.fillRect(lx - 16, top + 600, 32, H);
    ctx.fillStyle = lin(ctx, lx - 130, 0, lx + 130, 0, [[0, '#1D1A1B'], [.5, '#2E2A2B'], [1, '#141213']]); rrect(ctx, lx - 130, top, 260, 640, 40); ctx.fill();
    const lamps = [['r', C.redHot, 210], ['a', '#FFB12E', 420], ['g', '#38E07B', 630]];
    for (const [k, col, y] of lamps) {
      const on = k === 'r' ? red : ph === k ? 1 : 0, cy = top + y - 100;
      ctx.fillStyle = '#050404'; ctx.beginPath(); ctx.arc(lx, cy, 92, 0, TAU); ctx.fill();
      ctx.fillStyle = on ? col : '#2A1E1F'; ctx.globalAlpha = on ? 1 : .6;
      if (k === 'r') {
        ctx.fillStyle = on ? '#5A0D10' : '#241819'; ctx.beginPath(); ctx.arc(lx, cy, 80, 0, TAU); ctx.fill();
        ctx.save(); ctx.globalAlpha = .25 + .75 * on; ctx.shadowColor = C.redHot; ctx.shadowBlur = 60 * on * (1 + bp * .6); ctx.fillStyle = on ? C.redHot : '#3A2222'; heartPath(ctx, lx, cy + 6, 140 * (1 + .06 * bp * on)); ctx.fill(); ctx.restore();
        logo(ctx, 'htext', on ? '#FFE9E6' : '#4A3434', lx, cy - 4, 150 * (1 + .06 * bp * on), { alpha: .5 + .5 * on });
      } else { ctx.beginPath(); ctx.arc(lx, cy, 80, 0, TAU); ctx.shadowColor = col; ctx.shadowBlur = on * 60; ctx.fill(); ctx.shadowBlur = 0; }
      ctx.globalAlpha = 1;
      if (on) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDot(ctx, lx, cy, 320, col, .35 * on); ctx.restore(); }
      ctx.fillStyle = '#0A0809'; ctx.beginPath(); ctx.moveTo(lx - 100, cy - 92); ctx.lineTo(lx + 100, cy - 92); ctx.lineTo(lx + 80, cy - 62); ctx.lineTo(lx - 80, cy - 62); ctx.fill();
    }
    // countdown
    const left = ph === 'r' ? Math.ceil(12.4 - t) : ph === 'g' ? Math.ceil((t < 3.4 ? 3.4 - t : 15 + 3.4 - t)) : Math.ceil(4.6 - t), cc = ph === 'r' ? C.redHot : ph === 'a' ? '#FFB12E' : '#38E07B';
    ctx.fillStyle = '#050404'; rrect(ctx, lx - 80, top + 660, 160, 110, 14); ctx.fill();
    txt(ctx, String(left).padStart(2, '0'), lx, top + 718, { font: '400 110px VT323', color: cc, glow: 20 });
    // type
    const tx = W * .64, ra = win(t, 4.7, 12.3, .15, .25);
    if (ra > 0) {
      const k1 = eBack((t - 4.75) / .3), k2 = eBack((t - 5.1) / .35);
      txt(ctx, 'RED MEANS', tx, 130, { font: '800 80px "Barlow Condensed"', ls: 18, color: C.white, alpha: ra * clamp(k1) });
      ctx.save(); ctx.translate(tx, 380); const s = lerp(1.6, 1, clamp(k2)) * (1 + .03 * bp); ctx.scale(s, s);
      txt(ctx, 'R&B.', 0, 0, { font: '400 300px Anton', color: C.redHot, alpha: ra * clamp(k2 * 2), glow: 60 + 40 * bp, glowColor: C.red }); ctx.restore();
      txt(ctx, 'STOP.  SING.  FEEL.  CONNECT.', tx, 575, { font: '700 40px "Barlow Condensed"', ls: 10, color: C.cream, alpha: ra * smooth(6.0, 6.4, t) });
    }
    const ga = Math.max(1 - smooth(2.6, 3.2, t), smooth(12.8, 13.3, t));
    if (ga > 0) { txt(ctx, 'NEXT STOP:', tx, 230, { font: '800 56px "Barlow Condensed"', ls: 14, color: '#9BF2BA', alpha: ga }); logo(ctx, 'heart', C.white, tx, 420, 320, { alpha: ga }); }
    vignette(ctx, W, H, .5); grain(ctx, W, H, t, .07);
  }
  SCENES.push({ id: '08-red-means-rnb', name: 'Red Means R&B', tag: 'Brief idea', draw,
    desc: 'Lagos at night. A danfo pulls up as the light changes. The red lamp is a heart reading R&B, the countdown runs, the passengers bop, then the light goes green and the danfo moves off.' });
})();

// ============ 09 NEON SIGNATURE (logo hero) ============
(() => {
  let wall = null;
  function makeWall(W, H) {
    const c = offscreen(W, H), x = c.getContext('2d'), r = rng(19);
    x.fillStyle = '#120809'; x.fillRect(0, 0, W, H);
    for (let row = 0, y = 0; y < 800; row++, y += 56) for (let bx = (row % 2) * -64; bx < W; bx += 128) {
      const v = 30 + Math.floor(r() * 18); x.fillStyle = `rgb(${v + 12},${v - 10},${v - 8})`; x.fillRect(bx + 3, y + 3, 122, 50);
      x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(bx + 3, y + 40, 122, 13);
    }
    x.fillStyle = lin(x, 0, 780, 0, H, [[0, '#0A0506'], [1, '#050203']]); x.fillRect(0, 790, W, H);
    return c;
  }
  const mixC = (a, b, k) => { const p = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)), A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], k)).toString(16).padStart(2, '0')).join(''); };
  function draw(ctx, t, W, H) {
    if (!wall || wall.width !== Math.ceil(W)) wall = makeWall(W, H);
    const cx = W / 2, cy = 420, sw = 1180, sh = sw * IMG.sig.height / IMG.sig.width, x0 = cx - sw / 2, y0 = cy - sh / 2;
    const p = inv(.6, 3.6, t), fr = rng(Math.floor(t * 30) + 5);
    let power = smooth(.5, .7, t);
    if (t > 7.1 && t < 7.6) power *= fr() < .45 ? .15 : 1;
    if (t > 13.7) power *= t < 14.3 ? (fr() < .5 ? .1 : 1) * (1 - smooth(14.1, 14.4, t)) : 0;
    const hb = heartbeat(t), bp = beatPulse(t, BEAT * 2);
    const glowCol = mixC(mixC(C.red, C.orchid, smooth(8.3, 9.0, t)), C.red, smooth(11.4, 12.1, t));
    ctx.drawImage(wall, 0, 0, W, H);
    // light spill on the bricks
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = power * (.5 + .15 * bp);
    ctx.fillStyle = rad(ctx, cx, cy, 0, 900, [[0, glowCol + 'AA'], [.5, glowCol + '33'], [1, glowCol + '00']]); ctx.fillRect(0, 0, W, 800); ctx.restore();
    // neon layer (written on along the slant of the signature)
    const L = offscreen(sw + 200, sh + 200), lx = L.getContext('2d'), pad = 100;
    const dir = [Math.cos(-.36), Math.sin(-.36)], a0 = [pad, pad + sh], len = sw * dir[0] + sh * -dir[1] * 1.1;
    const signLayer = (col, blur) => {
      lx.clearRect(0, 0, L.width, L.height); lx.save();
      lx.shadowColor = blur ? col : 'transparent'; lx.shadowBlur = blur;
      lx.beginPath(); lx.rect(0, 0, pad + sw * .885, L.height); lx.rect(pad + sw * .885, pad + sh * .32, L.width, L.height); lx.clip();
      lx.drawImage(tinted('sig', col), pad, pad, sw, sh); lx.restore();
      lx.globalCompositeOperation = 'destination-in';
      const g = lx.createLinearGradient(a0[0], a0[1], a0[0] + dir[0] * len, a0[1] + dir[1] * len), e = clamp(p * 1.04);
      g.addColorStop(0, '#000'); g.addColorStop(Math.max(0, e - .01), '#000'); g.addColorStop(Math.min(1, e + .005), 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      lx.fillStyle = p >= 1 ? '#000' : g; lx.fillRect(0, 0, L.width, L.height); lx.globalCompositeOperation = 'source-over';
      return L;
    };
    const drawSign = (target, alpha) => {
      target.save(); target.globalAlpha = alpha * Math.max(power, p < 1 && t > .6 ? 1 : 0);
      target.globalCompositeOperation = 'lighter'; target.drawImage(signLayer(glowCol, 70), x0 - pad, y0 - pad);
      target.globalCompositeOperation = 'source-over'; target.drawImage(signLayer('#FFF3F1', 14), x0 - pad, y0 - pad);
      // the heart: its own tube, red, beating
      const hOn = smooth(3.7, 3.8, t) * (fr() < .3 && t < 4.1 ? .2 : 1) * power;
      if (hOn > 0) {
        const hs = 1 + .08 * hb, hx = x0 + sw * .943, hy = y0 + sh * .14;
        target.save(); target.globalAlpha *= hOn; target.translate(hx, hy); target.scale(hs, hs); target.translate(-hx, -hy);
        target.beginPath(); target.rect(x0 + sw * .885, y0 - 40, sw * .2, sh * .36 + 40); target.clip();
        target.shadowColor = C.redHot; target.shadowBlur = 50; target.drawImage(tinted('sig', C.redHot), x0, y0, sw, sh);
        target.shadowBlur = 12; target.drawImage(tinted('sig', '#FFE3E0'), x0, y0, sw, sh); target.restore();
      }
      target.restore();
    };
    drawSign(ctx, 1);
    // pen-tip sparks while writing
    if (p > 0 && p < 1) {
      const e = p * 1.04, tipX = x0 + dir[0] * len * e * .98, tipY = y0 + sh * .82 + dir[1] * len * e * .7;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDot(ctx, tipX, tipY, 70, '#FFFFFF', .9); glowDot(ctx, tipX, tipY, 160, glowCol, .6);
      const r = rng(Math.floor(t * 30)); for (let k = 0; k < 14; k++) glowDot(ctx, tipX + (r() - .5) * 160, tipY + (r() - .2) * 120, 6 + r() * 8, C.cream, .8);
      ctx.restore();
    }
    // tagline
    const ta = smooth(4.3, 4.6, t) * power;
    txt(ctx, 'SING.  FEEL.  CONNECT.', cx, 720, { font: '800 58px "Barlow Condensed"', ls: 26, color: '#FFF1EE', glow: 30, glowColor: glowCol, alpha: ta });
    // wet-floor reflection
    ctx.save(); ctx.beginPath(); ctx.rect(0, 790, W, H - 790); ctx.clip(); ctx.translate(0, 790 * 2 - 40); ctx.scale(1, -1); ctx.filter = 'blur(5px)';
    drawSign(ctx, .3); txt(ctx, 'SING.  FEEL.  CONNECT.', cx, 720, { font: '800 58px "Barlow Condensed"', ls: 26, color: '#FFF1EE', alpha: ta * .3 });
    ctx.restore();
    ctx.fillStyle = lin(ctx, 0, 790, 0, H, [[0, 'rgba(5,2,3,0)'], [1, 'rgba(5,2,3,.85)']]); ctx.fillRect(0, 790, W, H);
    vignette(ctx, W, H, .6); grain(ctx, W, H, t, .08);
  }
  SCENES.push({ id: '09-neon-signature', name: 'Neon Signature', tag: 'Logo hero', draw,
    desc: 'The signature logo writes itself on in neon across a brick wall. The heart flickers on and beats, the glow shifts red to orchid and back, with a wet-floor reflection and a power-cut glitch.' });
})();

// ============ 10 PHONES UP (crowd engagement) ============
(() => {
  let P = null;
  function init(W) {
    const r = rng(23), phones = [], parts = [], crowd = [];
    for (let i = 0; i < 46; i++) phones.push({ x: 60 + r() * (W - 120), y: 650 + r() * 170, on: .3 + r() * 2.0, off: 13.9 + r() * .9, tilt: (r() - .5) * .5, ph: r() * TAU });
    for (let i = 0; i < 220; i++) { const a = r() * TAU, fill = i < 150 ? 1 : .35 + r() * .55; const [hx, hy] = heartPoint(a); parts.push({ ph: i % phones.length, tx: hx * fill, ty: hy * fill, d: r() * .8, s: 6 + r() * 10, c: [C.cream, C.white, C.redHot, C.blush][i % 4] }); }
    for (let row = 0; row < 3; row++) for (let x = -40; x < W + 60; x += 70 + r() * 40) crowd.push({ row, x, s: .8 + r() * .5 + row * .25, ph: r() * 2 });
    return { W, phones, parts, crowd };
  }
  function draw(ctx, t, W, H) {
    if (!P || P.W !== W) P = init(W);
    const hb = heartbeat(t), bp = beatPulse(t), HX = W / 2, HY = 400, HS = 300 * (1 + .06 * hb * smooth(4.5, 5.0, t) * (1 - smooth(12.2, 12.6, t)));
    ctx.fillStyle = lin(ctx, 0, 0, 0, H, [[0, '#1B0820'], [.6, '#2B0D2E'], [1, '#0B040C']]); ctx.fillRect(0, 0, W, H);
    // beams sweep on a 15 s cycle
    const cols = [C.red, C.orchid, C.cream, C.orchid, C.red, C.cream];
    for (let k = 0; k < 6; k++) beam(ctx, W * (.08 + k * .168), -30, Math.sin(TAU * t / LOOP * (k % 2 ? 2 : 3) + k) * .5, 1100, .16, cols[k] + 'CC', .14 + .08 * bp);
    const noise = win(t, 7.5, 10.0, .3, .3);
    if (noise > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(203,50,52,${noise * bp * .3})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    // phones + arms
    const phoneOn = ph => smooth(ph.on, ph.on + .15, t) * (1 - smooth(ph.off, ph.off + .1, t));
    for (const ph of P.phones) {
      const sway = Math.sin(TAU * t / LOOP * 4 + ph.ph) * 14, x = ph.x + sway, y = ph.y + Math.sin(t / BEAT * Math.PI + ph.ph) * 4;
      ctx.strokeStyle = '#0A040B'; ctx.lineWidth = 22; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(ph.x - 30, H); ctx.quadraticCurveTo(ph.x - 10, y + 160, x, y + 30); ctx.stroke();
      const on = phoneOn(ph);
      ctx.save(); ctx.translate(x, y); ctx.rotate(ph.tilt); ctx.fillStyle = '#0A040B'; rrect(ctx, -17, -30, 34, 60, 6); ctx.fill();
      ctx.fillStyle = on ? `rgba(255,248,235,${on})` : '#1A0E1A'; rrect(ctx, -14, -27, 28, 50, 4); ctx.fill(); ctx.restore();
      if (on) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDot(ctx, x, y - 10, 80, '#FFF2DE', .5 * on); ctx.restore(); }
    }
    // crowd silhouettes
    for (const c of P.crowd) {
      const bob = -Math.abs(Math.sin((t / BEAT + c.ph) * Math.PI)) * 10 * c.s, y = 900 + c.row * 70 + bob, s = 46 * c.s;
      ctx.fillStyle = ['#0E0510', '#090309', '#050205'][c.row];
      ctx.beginPath(); ctx.arc(c.x, y, s * .55, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(c.x, y + s * 1.5, s * 1.25, s * 1.0, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(c.x - s * 1.25, y + s * 1.5, s * 2.5, 300);
    }
    // lights lift from phones into a heart
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const pt of P.parts) {
      const ph = P.phones[pt.ph], src = [ph.x + Math.sin(TAU * t / LOOP * 4 + ph.ph) * 14, ph.y - 10];
      const k = eIO(inv(2.5 + pt.d, 4.3 + pt.d, t)) * (1 - eIO(inv(12.3 + pt.d * .6, 13.9 + pt.d * .6, t)));
      if (k <= 0) continue;
      const dst = [HX + pt.tx * HS, HY + pt.ty * HS], ctl = [lerp(src[0], dst[0], .3), Math.min(src[1], dst[1]) - 260];
      const u = 1 - k, x = u * u * src[0] + 2 * u * k * ctl[0] + k * k * dst[0], y = u * u * src[1] + 2 * u * k * ctl[1] + k * k * dst[1];
      const tw = .7 + .3 * Math.sin(t * 9 + pt.d * 40);
      glowDot(ctx, x, y, pt.s * 2.2 * (1 + .3 * hb * k), pt.c, tw * clamp(k * 3));
    }
    ctx.restore();
    const la = win(t, 4.8, 12.5, .4, .4);
    if (la > 0) logo(ctx, 'htext', C.white, HX, HY + 10, 360 * (1 + .04 * hb), { alpha: la, glow: 30, glowColor: C.redHot });
    // kinetic type
    const big = (s, y, a0, a1, font, col) => {
      if (t < a0 || t > a1) return; const k = eBack((t - a0) / .35), out = 1 - smooth(a1 - .2, a1, t);
      ctx.save(); ctx.translate(W / 2, y); const sc = lerp(1.5, 1, clamp(k)) * (1 + .03 * bp); ctx.scale(sc, sc);
      txt(ctx, s, 0, 0, { font, color: col, alpha: clamp(k * 2) * out, glow: 40, glowColor: 'rgba(203,50,52,.8)' }); ctx.restore();
    };
    big('PHONES UP!', 420, .2, 2.6, '400 250px Anton', C.white);
    big('LIGHT IT UP', 120, 2.6, 5.0, '800 74px "Barlow Condensed"', C.cream);
    big('MAKE SOME NOISE', 110, 7.5, 10.0, '400 120px Anton', C.white);
    if (noise > 0) {
      const lvl = Math.floor(inv(7.7, 9.6, t) * 10 + .001);
      for (let k = 0; k < 10; k++) { ctx.save(); ctx.globalAlpha = noise; ctx.fillStyle = k < lvl ? C.redHot : 'rgba(255,255,255,.18)'; if (k < lvl) { ctx.shadowColor = C.redHot; ctx.shadowBlur = 20; } heartPath(ctx, W / 2 - 405 + k * 90, 210, k < lvl ? 58 + 10 * bp : 52); ctx.fill(); ctx.restore(); }
      if (t > 9.6) big('LOUDER!', 840, 9.6, 10.0, '400 170px Anton', C.redHot);
    }
    [['SING.', 10.0], ['FEEL.', 10.8], ['CONNECT.', 11.6]].forEach(([w, a]) => big(w, 120, a, a + .8, w === 'FEEL.' ? 'italic 400 140px "DM Serif Display"' : '400 130px Anton', w === 'FEEL.' ? C.redHot : C.white));
    vignette(ctx, W, H, .5); grain(ctx, W, H, t, .07);
  }
  SCENES.push({ id: '10-phones-up', name: 'Phones Up', tag: 'New idea', draw,
    desc: 'Built for audience participation. PHONES UP, the crowd\'s lights lift into a beating heart around the logo, a MAKE SOME NOISE meter fills on the beat, then SING. FEEL. CONNECT.' });
})();
