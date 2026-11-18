// Scenes 4–6: Logo Hiding in Plain Sight (two montages) and The Receipt.
'use strict';

function heartSub(ctx, cx, cy, s) { // heart as a subpath (no beginPath), for even-odd holes
  const w = s / 2, h = s * .92;
  ctx.moveTo(cx, cy + h * .5);
  ctx.bezierCurveTo(cx - w * .2, cy + h * .32, cx - w * 1.02, cy - h * .02, cx - w * .98, cy - h * .28);
  ctx.bezierCurveTo(cx - w * .94, cy - h * .56, cx - w * .42, cy - h * .66, cx, cy - h * .3);
  ctx.bezierCurveTo(cx + w * .42, cy - h * .66, cx + w * .94, cy - h * .56, cx + w * .98, cy - h * .28);
  ctx.bezierCurveTo(cx + w * 1.02, cy - h * .02, cx + w * .2, cy + h * .32, cx, cy + h * .5);
  ctx.closePath();
}

// Three 5 s vignettes joined by a heart-iris wipe that also bridges the loop point.
function montage(ctx, t, W, H, vigs) {
  const i = Math.min(2, Math.floor(t / 5)), lt = t - i * 5, v = vigs[i];
  ctx.save(); const z = 1 + .05 * lt / 5; ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
  v.draw(ctx, lt, W, H); ctx.restore();
  // captions
  const a = win(lt, .35, 4.7, .3, .25);
  ctx.save(); ctx.globalAlpha = a;
  const tag = 'SPOTTED  ·  ' + v.tag, tw = measure(ctx, tag, '800 28px "Barlow Condensed"', 6) + 44;
  ctx.fillStyle = C.red; rrect(ctx, 80, 74, tw, 54, 27); ctx.fill();
  txt(ctx, tag, 80 + tw / 2, 102, { font: '800 28px "Barlow Condensed"', ls: 6, color: C.white });
  ctx.restore();
  const lines = v.line.split('\n');
  lines.forEach((ln, k) => {
    const kk = eOut((lt - .55 - k * .15) / .45), out = 1 - smooth(4.45, 4.75, lt);
    txt(ctx, ln, 80, H - 120 - (lines.length - 1 - k) * 104 + (1 - kk) * 50, { font: '400 100px Anton', color: v.ink || C.white, align: 'left', alpha: clamp(kk) * out, glow: v.ink ? 0 : 24, glowColor: 'rgba(0,0,0,.45)' });
  });
  txt(ctx, 'ALL ABOUT R&B IN THE REAL WORLD', W - 80, H - 70, { font: '700 26px "Barlow Condensed"', ls: 8, color: v.ink || C.white, align: 'right', alpha: a * .8 });
  grain(ctx, W, H, t, .06);
  // heart iris
  for (const b of [0, 5, 10, 15]) {
    const d = t - b; if (Math.abs(d) > .5) continue;
    const big = Math.hypot(W, H) * 1.5;
    ctx.save(); ctx.fillStyle = C.red; ctx.beginPath();
    if (d < 0) { heartSub(ctx, W / 2, H / 2 + 40, big * eIn((d + .5) / .5)); ctx.fill(); }
    else { ctx.rect(0, 0, W, H); heartSub(ctx, W / 2, H / 2 + 40, big * eOut(d / .5)); ctx.fill('evenodd'); }
    ctx.restore();
    const la = 1 - inv(.05, .22, Math.abs(d));
    if (la > 0) logo(ctx, 'heart', C.white, W / 2, H / 2, 300 * (1 + .15 * (1 - la)), { alpha: la });
  }
}

// ---------- vignettes ----------
function vMug(ctx, lt, W, H) {
  const cx = W / 2 + 170;
  ctx.fillStyle = lin(ctx, 0, 0, 0, 760, [[0, '#F6E6C8'], [1, '#E6C996']]); ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalAlpha = .28; ctx.fillStyle = '#FFF8EA';
  for (let k = 0; k < 3; k++) { const x = 120 + k * 260 + lt * 6; ctx.beginPath(); ctx.moveTo(x, -20); ctx.lineTo(x + 170, -20); ctx.lineTo(x + 620, 760); ctx.lineTo(x + 450, 760); ctx.fill(); }
  ctx.restore();
  ctx.strokeStyle = 'rgba(120,80,40,.1)'; ctx.lineWidth = 3;
  for (let y = 330; y < 740; y += 82) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  for (let x = 0; x < W; x += 82) { ctx.beginPath(); ctx.moveTo(x, 330); ctx.lineTo(x, 740); ctx.stroke(); }
  ctx.fillStyle = lin(ctx, 0, 730, 0, H, [[0, '#C08A5E'], [.7, '#8C5A3A'], [1, '#5E3A24']]); ctx.fillRect(0, 730, W, H);
  ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(0, 730, W, 8);
  // admit-one ticket
  ctx.save(); ctx.translate(cx + 470, 880); ctx.rotate(-.12); ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(-150, -50, 310, 110);
  ctx.fillStyle = C.red; ctx.fillRect(-160, -60, 310, 110); ctx.setLineDash([6, 6]); ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(60, -60); ctx.lineTo(60, 50); ctx.stroke(); ctx.setLineDash([]);
  txt(ctx, 'ADMIT ONE', -50, -18, { font: '800 30px "Barlow Condensed"', ls: 4 }); txt(ctx, 'ALL ABOUT R&B', -50, 18, { font: '700 22px "Barlow Condensed"', ls: 3, color: C.cream });
  txt(ctx, '♥', 105, -5, { font: '400 50px sans-serif', color: C.white }); ctx.restore();
  // saucer + mug
  ctx.fillStyle = 'rgba(60,30,10,.35)'; ctx.beginPath(); ctx.ellipse(cx + 20, 845, 300, 50, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = lin(ctx, 0, 800, 0, 860, [[0, '#FFFFFF'], [1, '#D9CFC4']]); ctx.beginPath(); ctx.ellipse(cx, 830, 270, 46, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#1C1A1B'; ctx.lineWidth = 40; ctx.beginPath(); ctx.arc(cx + 168, 620, 84, -1.25, 1.25); ctx.stroke();
  ctx.fillStyle = lin(ctx, cx - 165, 0, cx + 165, 0, [[0, '#0E0D0D'], [.25, '#3C3739'], [.45, '#232022'], [1, '#0A0909']]);
  ctx.beginPath(); ctx.moveTo(cx - 165, 460); ctx.lineTo(cx - 165, 770); ctx.quadraticCurveTo(cx - 165, 822, cx - 110, 822); ctx.lineTo(cx + 110, 822); ctx.quadraticCurveTo(cx + 165, 822, cx + 165, 770); ctx.lineTo(cx + 165, 460); ctx.fill();
  ctx.fillStyle = '#2E2A2C'; ctx.beginPath(); ctx.ellipse(cx, 460, 165, 34, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#4A2C18'; ctx.beginPath(); ctx.ellipse(cx, 464, 146, 26, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(190,130,80,.5)'; ctx.beginPath(); ctx.ellipse(cx - 20, 462, 70, 10, 0, 0, TAU); ctx.fill();
  logo(ctx, 'heart', C.white, cx, 645, 230);
  // steam
  ctx.save(); ctx.filter = 'blur(7px)'; ctx.lineCap = 'round';
  for (let k = 0; k < 3; k++) {
    ctx.strokeStyle = `rgba(255,255,255,${.5 - k * .08})`; ctx.lineWidth = 22 - k * 4; ctx.beginPath();
    for (let y = 440; y > 140; y -= 10) { const p = (440 - y) / 300, x = cx - 60 + k * 60 + Math.sin(p * 5 + lt * 2.2 + k * 2) * 34 * p; y === 440 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.globalAlpha = .9; ctx.stroke();
  }
  ctx.restore();
}

function vFridge(ctx, lt, W, H) {
  const cx = W / 2;
  ctx.fillStyle = lin(ctx, 0, 0, W, H, [[0, '#F3EAF1'], [1, '#D6C2D4']]); ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(80,40,80,.25)'; ctx.fillRect(0, 300, W, 6);
  ctx.fillStyle = lin(ctx, 0, 0, W, 0, [[0, 'rgba(255,255,255,0)'], [.5, 'rgba(255,255,255,.35)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(0, 0, W, H);
  for (const [y0, y1] of [[110, 250], [370, 900]]) { ctx.fillStyle = lin(ctx, W - 230, 0, W - 190, 0, [[0, '#8E8A90'], [.5, '#FFFFFF'], [1, '#9C98A0']]); rrect(ctx, W - 230, y0, 40, y1 - y0, 20); ctx.fill(); }
  // letter magnets on the freezer
  [['S', C.red, -.2], ['I', C.orchid, .15], ['N', '#E8A33B', -.1], ['G', C.ink, .2]].forEach(([ch, col, r], k) => {
    ctx.save(); ctx.translate(cx - 250 + k * 110, 200); ctx.rotate(r); ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 6; txt(ctx, ch, 0, 0, { font: '400 130px Anton', color: col }); ctx.restore();
  });
  // polaroid
  ctx.save(); ctx.translate(cx - 470, 580); ctx.rotate(-.09); ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 10;
  ctx.fillStyle = '#FFFDF8'; ctx.fillRect(-150, -180, 300, 360); ctx.shadowColor = 'transparent';
  ctx.fillStyle = lin(ctx, 0, -160, 0, 100, [[0, C.orchid], [1, C.red]]); ctx.fillRect(-128, -158, 256, 256);
  for (let k = 0; k < 5; k++) { ctx.fillStyle = 'rgba(40,10,30,.75)'; ctx.beginPath(); ctx.arc(-90 + k * 45, 98 - (k % 2) * 8, 26, Math.PI, 0); ctx.fill(); }
  glowDot(ctx, 0, -100, 60, '#FFFFFF', .6);
  txt(ctx, 'last year ♥', 0, 140, { font: 'italic 400 34px "DM Serif Display"', color: C.ink }); ctx.restore();
  // note
  ctx.save(); ctx.translate(cx + 420, 560); ctx.rotate(.06); ctx.shadowColor = 'rgba(0,0,0,.2)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 8;
  ctx.fillStyle = C.cream; ctx.fillRect(-150, -160, 300, 320); ctx.shadowColor = 'transparent';
  ['to do:', '- get tickets', '- new outfit', '- call bae', '- learn the lyrics'].forEach((s, k) => txt(ctx, s, -120, -110 + k * 56, { font: 'italic 400 36px "DM Serif Display"', color: k ? C.ink : C.red, align: 'left' }));
  ctx.strokeStyle = C.red; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-124, -56); ctx.lineTo(90, -56); ctx.stroke();
  ctx.fillStyle = C.orchid; ctx.beginPath(); ctx.arc(0, -165, 18, 0, TAU); ctx.fill(); ctx.restore();
  // hero magnet drop
  const k = inv(.35, 1.05, lt), y = lerp(-320, 560, k < 1 ? eIn(k) : 1), land = lt - 1.05;
  const sq = land > 0 ? 1 + .12 * Math.exp(-land * 7) * Math.cos(land * 30) : 1;
  ctx.save(); ctx.translate(cx - 20, y); ctx.scale(sq, 2 - sq); ctx.rotate(-.05);
  ctx.shadowColor = 'rgba(60,0,20,.35)'; ctx.shadowBlur = 26; ctx.shadowOffsetY = 16; ctx.fillStyle = C.red; heartPath(ctx, 0, 0, 440); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.fillStyle = lin(ctx, 0, -200, 0, 60, [[0, 'rgba(255,255,255,.35)'], [1, 'rgba(255,255,255,0)']]); heartPath(ctx, 0, -10, 400); ctx.fill();
  logo(ctx, 'htext', C.white, 0, -30, 400); ctx.restore();
  if (land > 0 && land < .45) { ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.globalAlpha = 1 - land / .45;
    for (const [a, r] of [[-2.5, 300], [-2.0, 300], [-.6, 300], [-1.1, 300]]) { ctx.beginPath(); ctx.moveTo(cx - 20 + Math.cos(a) * r, 560 + Math.sin(a) * r * .8); ctx.lineTo(cx - 20 + Math.cos(a) * (r + 60), 560 + Math.sin(a) * (r + 60) * .8); ctx.stroke(); } ctx.restore(); }
}

function vBeach(ctx, lt, W, H) {
  const cx = W / 2;
  ctx.fillStyle = lin(ctx, 0, 0, 0, 620, [[0, '#8F3A88'], [.55, '#E17C83'], [1, '#F6C29A']]); ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = rad(ctx, cx + 430, 470, 0, 420, [[0, 'rgba(255,240,210,.9)'], [1, 'rgba(255,240,210,0)']]); ctx.fillRect(0, 0, W, H); ctx.restore();
  ctx.fillStyle = '#FCE6C2'; ctx.beginPath(); ctx.arc(cx + 430, 500, 130, 0, TAU); ctx.fill();
  ctx.fillStyle = lin(ctx, 0, 580, 0, 720, [[0, '#7A2E6C'], [1, '#C65A72']]); ctx.fillRect(0, 580, W, 160);
  ctx.fillStyle = 'rgba(255,230,200,.6)'; { const r = rng(41); for (let k = 0; k < 40; k++) { const x = frac(r() + lt * .02 * (1 + k % 3)) * W, y = 600 + r() * 120; ctx.fillRect(x, y, 30 + r() * 60, 3); } }
  ctx.fillStyle = lin(ctx, 0, 700, 0, H, [[0, '#F3DBAF'], [1, '#E2BC82']]); ctx.beginPath(); ctx.moveTo(0, 720);
  for (let x = 0; x <= W; x += 40) ctx.lineTo(x, 715 + Math.sin(x * .01 + lt * 1.5) * 8); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 6; ctx.beginPath(); for (let x = 0; x <= W; x += 40) { const y = 715 + Math.sin(x * .01 + lt * 1.5) * 8; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
  // palm
  ctx.save(); ctx.translate(140, 760); ctx.strokeStyle = '#2A1220'; ctx.lineWidth = 34; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(70, -300, 30, -560); ctx.stroke();
  ctx.fillStyle = '#2A1220'; for (let k = 0; k < 7; k++) { const a = -2.9 + k * .45 + Math.sin(lt * 1.5 + k) * .04; ctx.save(); ctx.translate(30, -560); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(160, -70, 300, 30); ctx.quadraticCurveTo(160, -20, 0, 0); ctx.fill(); ctx.restore(); }
  ctx.restore();
  // beach ball bouncing on the beat
  const R = 150, ph = frac(lt / (BEAT * 2)), hgt = 430 * 4 * ph * (1 - ph), g = 930, bx = cx - 80 + Math.sin(lt * .8) * 60, by = g - R - hgt;
  const contact = Math.min(ph, 1 - ph), sq = contact < .05 ? 1 - (.05 - contact) * 2 : 1;
  ctx.fillStyle = 'rgba(80,40,20,.25)'; ctx.beginPath(); ctx.ellipse(bx, g, R * (1.1 - hgt / 1200), 26 * (1.1 - hgt / 1200), 0, 0, TAU); ctx.fill();
  ctx.save(); ctx.translate(bx, by + R * (1 - sq)); ctx.scale(2 - sq, sq);
  ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.clip();
  const cols = [C.red, C.cream, C.white, C.orchid, C.red, C.white], sp = lt * 2.4;
  cols.forEach((c, k) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, sp + k * TAU / 6, sp + (k + 1) * TAU / 6); ctx.fill(); });
  ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(0, 0, R * .46, 0, TAU); ctx.fill();
  logo(ctx, 'heart', C.red, 0, 2, R * .78, { rot: Math.sin(lt * 2) * .15 });
  ctx.fillStyle = rad(ctx, -R * .4, -R * .45, 0, R * 1.3, [[0, 'rgba(255,255,255,.55)'], [.4, 'rgba(255,255,255,0)'], [.85, 'rgba(60,0,30,0)'], [1, 'rgba(60,0,30,.45)']]); ctx.fillRect(-R, -R, R * 2, R * 2);
  ctx.restore();
}

function vPadel(ctx, lt, W, H) {
  const cx = W / 2;
  ctx.fillStyle = '#120A1A'; ctx.fillRect(0, 0, W, H);
  for (let k = 0; k < 4; k++) { const x = W * (.12 + k * .25); beam(ctx, x, -20, (k - 1.5) * .08, 900, .35, '#FFF3E0', .12); glowDot(ctx, x, 10, 90, '#FFF6E8', .9); }
  ctx.fillStyle = 'rgba(190,170,230,.07)'; ctx.fillRect(0, 230, W, 340);
  for (let x = 0; x < W; x += 300) { ctx.fillStyle = '#05030A'; ctx.fillRect(x, 200, 14, 380); }
  ctx.fillStyle = 'rgba(255,255,255,.06)'; for (let k = 0; k < 6; k++) { const x = k * 380 + lt * 20; ctx.beginPath(); ctx.moveTo(x, 230); ctx.lineTo(x + 70, 230); ctx.lineTo(x - 40, 570); ctx.lineTo(x - 110, 570); ctx.fill(); }
  ctx.fillStyle = lin(ctx, 0, 570, 0, H, [[0, '#3E1C4E'], [1, '#6A2E7A']]); ctx.fillRect(0, 570, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 8;
  ctx.beginPath(); ctx.moveTo(cx - 900, 1080); ctx.lineTo(cx - 520, 600); ctx.moveTo(cx + 900, 1080); ctx.lineTo(cx + 520, 600); ctx.moveTo(cx - 640, 760); ctx.lineTo(cx + 640, 760); ctx.moveTo(cx, 760); ctx.lineTo(cx, 1080); ctx.stroke();
  // net
  ctx.fillStyle = 'rgba(20,10,20,.85)'; ctx.fillRect(cx - 560, 560, 1120, 60); ctx.fillStyle = C.white; ctx.fillRect(cx - 560, 556, 1120, 8);
  ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1; for (let x = cx - 560; x < cx + 560; x += 14) { ctx.beginPath(); ctx.moveTo(x, 564); ctx.lineTo(x, 620); ctx.stroke(); }
  // bench + tote
  const bx = W * .67;
  ctx.fillStyle = '#7A4A2E'; for (let k = 0; k < 3; k++) ctx.fillRect(bx - 330, 830 + k * 22, 660, 16);
  ctx.fillStyle = '#1A1014'; ctx.fillRect(bx - 300, 896, 22, 140); ctx.fillRect(bx + 278, 896, 22, 140);
  ctx.save(); ctx.translate(bx + 40, 830); ctx.rotate(Math.sin(lt * 1.3) * .015);
  ctx.strokeStyle = '#141012'; ctx.lineWidth = 18; ctx.lineWidth = 12; ctx.beginPath(); ctx.ellipse(0, -360, 100, 150, 0, Math.PI, 0); ctx.stroke(); ctx.strokeStyle = '#2A2427'; ctx.beginPath(); ctx.ellipse(16, -360, 88, 132, 0, Math.PI, 0); ctx.stroke();
  ctx.fillStyle = lin(ctx, -170, 0, 170, 0, [[0, '#0D0B0C'], [.4, '#2A2628'], [1, '#0B0A0A']]); ctx.beginPath(); ctx.moveTo(-150, -360); ctx.lineTo(150, -360); ctx.lineTo(175, 0); ctx.lineTo(-175, 0); ctx.closePath(); ctx.fill();
  logo(ctx, 'heart', C.white, 0, -185, 220); ctx.restore();
  // racket
  ctx.save(); ctx.translate(bx - 250, 820); ctx.rotate(-.25); ctx.fillStyle = '#141012'; ctx.fillRect(-14, 0, 28, 170);
  ctx.fillStyle = '#1D1519'; ctx.beginPath(); ctx.ellipse(0, -110, 92, 118, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = C.orchid; ctx.lineWidth = 8; ctx.stroke();
  ctx.fillStyle = 'rgba(198,102,189,.6)'; for (let y = -190; y < -30; y += 26) for (let x = -60; x <= 60; x += 26) if (x * x / 6400 + (y + 110) ** 2 / 9500 < 1) { ctx.beginPath(); ctx.arc(x, y, 5, 0, TAU); ctx.fill(); }
  ctx.restore();
  // ball rallying
  const ph = frac(lt / 2.5), x = lerp(-60, W + 60, ph), hop = Math.abs(Math.sin(ph * Math.PI * 3)), y = 980 - hop * 420;
  for (let k = 6; k >= 0; k--) { const p2 = ph - k * .008, x2 = lerp(-60, W + 60, p2), y2 = 980 - Math.abs(Math.sin(p2 * Math.PI * 3)) * 420; ctx.fillStyle = `rgba(222,245,90,${k ? .12 : 1})`; ctx.beginPath(); ctx.arc(x2, y2, 26, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x - 8, y, 18, -1, 1); ctx.stroke();
}

function vGym(ctx, lt, W, H) {
  const cx = W / 2 + 300;
  ctx.fillStyle = lin(ctx, 0, 0, 0, 780, [[0, '#1A1214'], [1, '#2A1A1D']]); ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,.035)'; ctx.lineWidth = 3; for (let x = 0; x < W; x += 120) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 780); ctx.stroke(); }
  ctx.save(); ctx.shadowColor = C.redHot; ctx.shadowBlur = 40; ctx.fillStyle = '#FF8A86'; ctx.fillRect(0, 168, W, 8); ctx.restore();
  const fl = .85 + .15 * Math.sin(lt * 40) * (frac(lt * .7) < .1 ? 1 : 0);
  txt(ctx, 'feel it.', W / 2 - 160, 330, { font: 'italic 400 150px "DM Serif Display"', color: '#FFD9D6', glow: 40, glowColor: C.redHot, alpha: fl });
  beam(ctx, cx, -20, 0, 900, .3, '#FFEEDD', .2);
  ctx.fillStyle = lin(ctx, 0, 780, 0, H, [[0, '#231B1D'], [1, '#0E0A0B']]); ctx.fillRect(0, 780, W, H);
  const r = rng(4); ctx.fillStyle = 'rgba(255,255,255,.05)'; for (let k = 0; k < 400; k++) ctx.fillRect(r() * W, 790 + r() * 290, 3, 3);
  // dumbbell
  ctx.save(); ctx.translate(cx + 420, 925); ctx.fillStyle = '#8F8B88'; ctx.fillRect(-150, -12, 300, 24);
  for (const s of [-1, 1]) { ctx.fillStyle = '#151213'; rrect(ctx, s * 150 - 45, -80, 90, 160, 16); ctx.fill(); ctx.fillStyle = C.red; ctx.fillRect(s * 150 - 45, -8, 90, 16); }
  ctx.restore();
  // bottle
  ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.beginPath(); ctx.ellipse(cx, 905, 150, 26, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = lin(ctx, cx - 100, 0, cx + 100, 0, [[0, '#7E1A1E'], [.3, '#D8403F'], [.45, '#F06A64'], [.6, '#CB3234'], [1, '#6E1619']]);
  rrect(ctx, cx - 100, 330, 200, 575, 40); ctx.fill();
  ctx.fillStyle = lin(ctx, cx - 70, 0, cx + 70, 0, [[0, '#BDB4A6'], [.4, '#FFFFFF'], [1, '#A49B8E']]); rrect(ctx, cx - 70, 250, 140, 92, 14); ctx.fill();
  ctx.strokeStyle = '#E8E2D8'; ctx.lineWidth = 16; ctx.beginPath(); ctx.arc(cx, 238, 44, Math.PI, 0); ctx.stroke();
  logo(ctx, 'heart', C.white, cx, 600, 170);
  txt(ctx, '750 ML', cx, 820, { font: '700 24px "Barlow Condensed"', ls: 6, color: 'rgba(255,255,255,.8)' });
  const dr = rng(9); ctx.fillStyle = 'rgba(255,255,255,.55)';
  for (let k = 0; k < 34; k++) { const x = cx - 85 + dr() * 170, y0 = 360 + dr() * 520, sp = dr() < .3 ? 60 : 0, y = Math.min(890, y0 + lt * sp), s = 3 + dr() * 6; ctx.beginPath(); ctx.ellipse(x, y, s * .8, s, 0, 0, TAU); ctx.fill(); }
}

function vMirror(ctx, lt, W, H) {
  const cx = W / 2, shake = Math.sin(lt * 23) * 1.5;
  ctx.fillStyle = lin(ctx, 0, 0, 0, 660, [[0, '#6B2A6A'], [.5, '#D9697C'], [1, '#F6C9A0']]); ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#FDE3BE'; ctx.beginPath(); ctx.arc(cx + 360, 640, 80, 0, TAU); ctx.fill();
  ctx.fillStyle = '#3B1530'; ctx.beginPath(); ctx.moveTo(cx - 1000, 660); ctx.bezierCurveTo(cx - 900, 360, cx - 560, 360, cx - 420, 660); ctx.fill(); // Aso Rock
  const r = rng(12); for (let k = 0; k < 26; k++) { const x = cx - 400 + k * 62, h = 40 + r() * 160; ctx.fillStyle = '#2B0F25'; ctx.fillRect(x, 660 - h, 54, h); ctx.fillStyle = 'rgba(253,220,170,.7)'; for (let w = 0; w < 4; w++) if (r() < .5) ctx.fillRect(x + 8 + (w % 2) * 24, 660 - h + 14 + Math.floor(w / 2) * 26, 12, 12); }
  ctx.fillStyle = '#1E1418'; ctx.beginPath(); ctx.moveTo(cx - 60, 660); ctx.lineTo(cx + 60, 660); ctx.lineTo(cx + 1100, H); ctx.lineTo(cx - 1100, H); ctx.fill();
  ctx.fillStyle = C.cream; for (let k = 0; k < 8; k++) { const z = frac(k / 8 + lt * .6), y = 660 + (H - 660) * z * z, w = 4 + 26 * z * z, h = 10 + 90 * z * z; ctx.fillRect(cx - w / 2, y, w, h); }
  // car interior frame
  ctx.fillStyle = '#0C0809';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(W, 110); ctx.quadraticCurveTo(cx, 60, 0, 110); ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(260, 110); ctx.lineTo(60, H); ctx.lineTo(0, H); ctx.fill();
  ctx.beginPath(); ctx.moveTo(W, 0); ctx.lineTo(W - 260, 110); ctx.lineTo(W - 60, H); ctx.lineTo(W, H); ctx.fill();
  ctx.fillStyle = lin(ctx, 0, 900, 0, H, [[0, '#1C1215'], [1, '#070405']]); ctx.beginPath(); ctx.moveTo(0, 930); ctx.quadraticCurveTo(cx, 870, W, 930); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
  // mirror
  ctx.save(); ctx.translate(0, shake);
  ctx.fillStyle = '#0B0809'; ctx.fillRect(cx - 18, 60, 36, 120);
  const mx = cx - 330, my = 170, mw = 660, mh = 210;
  ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 30; ctx.fillStyle = '#121012'; rrect(ctx, mx - 16, my - 16, mw + 32, mh + 32, 40); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.save(); rrect(ctx, mx, my, mw, mh, 28); ctx.clip();
  ctx.fillStyle = lin(ctx, 0, my, 0, my + mh, [[0, '#E9A08E'], [1, '#5B2A50']]); ctx.fillRect(mx, my, mw, mh);
  ctx.fillStyle = '#1A1015'; ctx.beginPath(); ctx.moveTo(cx - 30, my + 110); ctx.lineTo(cx + 30, my + 110); ctx.lineTo(cx + 260, my + mh); ctx.lineTo(cx - 260, my + mh); ctx.fill();
  for (const s of [-1, 1]) glowDot(ctx, cx + s * 36 + Math.sin(lt) * 10, my + 140, 40, '#FFF1D8', .9);
  ctx.fillStyle = '#0E0A0C'; ctx.beginPath(); ctx.arc(mx + 150, my + mh + 30, 110, Math.PI, 0); ctx.arc(mx + mw - 150, my + mh + 30, 110, Math.PI, 0); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.beginPath(); ctx.moveTo(mx + 60, my); ctx.lineTo(mx + 200, my); ctx.lineTo(mx + 80, my + mh); ctx.lineTo(mx - 60, my + mh); ctx.fill();
  // sticker
  ctx.save(); ctx.translate(mx + mw - 92, my + mh - 70); ctx.rotate(-.12); ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(0, 0, 54, 0, TAU); ctx.fill(); ctx.strokeStyle = C.white; ctx.lineWidth = 4; ctx.stroke(); logo(ctx, 'heart', C.white, 0, 2, 76); ctx.restore();
  txt(ctx, 'OBJECTS IN MIRROR ARE CLOSER THAN THEY APPEAR', cx - 60, my + mh - 18, { font: '700 15px "Barlow Condensed"', ls: 2, color: 'rgba(255,255,255,.75)' });
  ctx.restore();
  // swinging heart air freshener
  const sw = Math.sin(lt * 2.4) * .28;
  ctx.save(); ctx.translate(cx + 250, my + mh + 16); ctx.rotate(sw); ctx.strokeStyle = C.cream; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 170); ctx.stroke();
  ctx.translate(0, 290); ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 20; ctx.fillStyle = C.red; heartPath(ctx, 0, 0, 250); ctx.fill(); ctx.shadowColor = 'transparent';
  logo(ctx, 'htext', C.white, 0, -14, 230); ctx.restore();
  ctx.restore();
}

SCENES.push({ id: '04-plain-sight-home', name: 'In Plain Sight: Home & Holiday', tag: 'Brief idea', desc: 'The logo shows up in everyday life: a kitchen mug, a heart fridge magnet that drops in and snaps on, and a beach ball bouncing on the beat. Heart-iris wipes join the shots.',
  draw: (ctx, t, W, H) => montage(ctx, t, W, H, [
    { draw: vMug, tag: 'THE KITCHEN', line: 'MORNING COFFEE,\nSLOW JAMS.', ink: C.ink },
    { draw: vFridge, tag: 'THE FRIDGE', line: 'STUCK ON\nR&B.', ink: C.ink },
    { draw: vBeach, tag: 'THE BEACH', line: 'ALL SUMMER,\nALL R&B.' }]) });
SCENES.push({ id: '05-plain-sight-out', name: 'In Plain Sight: Out & About', tag: 'Brief idea', desc: 'The tote bag at the padel court, the gym water bottle and the rear-view mirror sticker on an Abuja rush-hour drive, Aso Rock on the horizon.',
  draw: (ctx, t, W, H) => montage(ctx, t, W, H, [
    { draw: vPadel, tag: 'THE PADEL COURT', line: 'GAME. SET.\nR&B.' },
    { draw: vGym, tag: 'THE GYM', line: 'STAY HYDRATED.\nSTAY IN YOUR FEELINGS.' },
    { draw: vMirror, tag: 'RUSH HOUR', line: 'OBJECTS IN MIRROR ARE\nCLOSER TO R&B.' }]) });

// ============ 06 THE RECEIPT ============
(() => {
  const PW = 620, LH = 46;
  const L = [['logo'], ['cb', 'ALL ABOUT R&B'], ['c', 'KITCHEN & SLOW JAMS'], ['c', 'TABLE 01  -  SERVER: CUPID'], ['sep'],
    ['lr', '1 SLOW JAM (EXTRA SLOW)', '4,500'], ['lr', '2 YEARNING', '9,000'], ['lr', '1 HEALING', 'FREE'], ['lr', '3 LATE NIGHT TEXTS', '6,000'],
    ['lr', '1 FORGIVENESS (SIDE)', '2,500'], ['lr', '1 CONNECTION', 'PRICELESS'], ['sep'], ['lr', 'SUBTOTAL', 'ALL MY LOVE'], ['lr', 'VAT (VIBES 100%)', 'INCL.'],
    ['big', 'TOTAL', 'PRICELESS'], ['sep'], ['c', 'PAID WITH: MY WHOLE HEART'], ['c', '* SING. FEEL. CONNECT. *'], ['c', 'THANK YOU, COME AGAIN'], ['bar'], ['gap']];
  const hOf = l => l[0] === 'logo' ? 270 : l[0] === 'big' ? 76 : l[0] === 'bar' ? 120 : l[0] === 'gap' ? 40 : LH;
  const tops = []; let acc = 40; for (const l of L) { tops.push(acc); acc += hOf(l); } const TOT = acc + 20;
  function paper(ctx, x, top, len) {
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 14;
    ctx.fillStyle = lin(ctx, x, 0, x + PW, 0, [[0, '#F1ECE2'], [.5, '#FFFDF8'], [1, '#EAE3D6']]);
    ctx.beginPath(); ctx.moveTo(x, top + 10); for (let k = 0; k <= 31; k++) ctx.lineTo(x + k * PW / 31, top + (k % 2 ? 0 : 12)); ctx.lineTo(x + PW, top + len); ctx.lineTo(x, top + len); ctx.fill(); ctx.restore();
    const ink = '#2A2526';
    L.forEach((l, i) => {
      const y = top + tops[i], cx = x + PW / 2;
      if (l[0] === 'logo') logo(ctx, 'heart', C.red, cx, y + 130, 250);
      else if (l[0] === 'cb') txt(ctx, l[1], cx, y + 22, { font: '700 38px "Courier Prime"', color: ink });
      else if (l[0] === 'c') txt(ctx, l[1], cx, y + 22, { font: '400 26px "Courier Prime"', color: ink });
      else if (l[0] === 'sep') txt(ctx, '-'.repeat(34), cx, y + 22, { font: '400 28px "Courier Prime"', color: ink, alpha: .7 });
      else if (l[0] === 'lr') { txt(ctx, l[1], x + 34, y + 22, { font: '400 27px "Courier Prime"', color: ink, align: 'left' }); txt(ctx, l[2], x + PW - 34, y + 22, { font: '700 27px "Courier Prime"', color: l[2] === 'PRICELESS' ? C.red : ink, align: 'right' }); }
      else if (l[0] === 'big') { txt(ctx, l[1], x + 34, y + 38, { font: '700 46px "Courier Prime"', color: ink, align: 'left' }); txt(ctx, l[2], x + PW - 34, y + 38, { font: '700 46px "Courier Prime"', color: C.red, align: 'right' }); }
      else if (l[0] === 'bar') { const r = rng(77); ctx.fillStyle = ink; let bx = x + 110; while (bx < x + PW - 110) { const w = 2 + Math.floor(r() * 4) * 2; if (r() < .6) ctx.fillRect(bx, y + 10, w, 80); bx += w + 3; } txt(ctx, 'A A R & B  1 4 3', cx, y + 104, { font: '400 18px "Courier Prime"', color: ink }); }
    });
  }
  function draw(ctx, t, W, H) {
    const cx = W / 2, slot = 905;
    ctx.fillStyle = lin(ctx, 0, 0, 0, H, [[0, '#2A1012'], [1, '#0F0607']]); ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const r = rng(31);
    for (let k = 0; k < 26; k++) glowDot(ctx, r() * W, r() * 520, 40 + r() * 70, [C.cream, C.red, '#FFB070'][k % 3], .18 + .1 * Math.sin(t * TAU / LOOP * 2 + k));
    ctx.restore();
    // print progress: line by line with a stepped feed
    const pr = inv(.5, 8.8, t), nLines = L.length, li = pr * nLines, whole = Math.floor(li), part = eOut(frac(li) * 1.6);
    const printed = pr >= 1 ? TOT : (tops[Math.min(whole, nLines - 1)] + hOf(L[Math.min(whole, nLines - 1)]) * part);
    const tear = eIO(inv(9.2, 10.4, t)), fly = eIn(inv(13.6, 14.4, t)), printerY = 120 * eIO(inv(9.4, 10.2, t)) * (1 - eOut(inv(14.0, 14.9, t)));
    const fit = 960 / TOT, sc = lerp(1, fit, tear), top0 = slot - printed;
    const ty = lerp(top0, H / 2 - TOT * fit / 2, tear) - fly * (H + 200), rot = -.035 * tear + .3 * fly;
    // receipt
    ctx.save();
    if (tear === 0) { ctx.beginPath(); ctx.rect(0, 0, W, slot); ctx.clip(); }
    const shakeP = pr > 0 && pr < 1 ? Math.sin(t * 80) * .8 : 0;
    ctx.translate(cx, ty + (tear ? TOT * sc / 2 : 0)); ctx.rotate(rot); ctx.scale(sc, sc); ctx.translate(-PW / 2 + shakeP, tear ? -TOT / 2 : 0);
    if (printed > 0) paper(ctx, 0, 0, tear ? TOT : printed);
    // stamp
    const st = t - 10.9;
    if (st > 0 && fly < 1) {
      const k = eOut(st / .18), s = lerp(2.4, 1, k);
      ctx.save(); ctx.translate(PW / 2, tops[17]); ctx.rotate(-.18); ctx.scale(s, s); ctx.globalAlpha = clamp(st / .1) * .9;
      ctx.strokeStyle = C.red; ctx.lineWidth = 8; rrect(ctx, -250, -70, 500, 140, 18); ctx.stroke(); ctx.lineWidth = 3; rrect(ctx, -236, -56, 472, 112, 12); ctx.stroke();
      txt(ctx, 'PAID IN FULL', 0, -8, { font: '400 76px Anton', color: C.red, ls: 4 }); txt(ctx, 'WITH LOVE ♥', 0, 44, { font: '800 30px "Barlow Condensed"', color: C.red, ls: 10 });
      ctx.restore();
    }
    ctx.restore();
    // printer
    ctx.save(); ctx.translate(0, printerY + (1 - eOut(inv(0, .4, t))) * 0);
    ctx.fillStyle = 'rgba(0,0,0,.5)'; rrect(ctx, cx - 400, slot + 20, 800, 220, 30); ctx.fill();
    ctx.fillStyle = lin(ctx, 0, slot - 20, 0, H, [[0, '#3A3436'], [.15, '#1D191A'], [1, '#0C0A0B']]); rrect(ctx, cx - 390, slot - 14, 780, 260, 28); ctx.fill();
    ctx.fillStyle = '#050404'; rrect(ctx, cx - PW / 2 - 14, slot - 4, PW + 28, 12, 6); ctx.fill();
    glowDot(ctx, cx + 330, slot + 60, 18, pr > 0 && pr < 1 ? '#7CFF8A' : C.red, .9);
    txt(ctx, 'ALL ABOUT R&B  ·  POS', cx - 330, slot + 62, { font: '700 22px "Barlow Condensed"', ls: 6, color: 'rgba(237,213,167,.5)', align: 'left' });
    ctx.restore();
    // side type
    const side = (W - PW) / 2;
    const ia = win(t, .4, 14.2, .5, .4);
    txt(ctx, 'TONIGHT\'S ORDER', side / 2, 380, { font: '800 32px "Barlow Condensed"', ls: 12, color: C.cream, alpha: ia });
    txt(ctx, 'More R&B,', side / 2, 480, { font: 'italic 400 110px "DM Serif Display"', color: C.white, alpha: ia });
    txt(ctx, 'please.', side / 2, 590, { font: 'italic 400 110px "DM Serif Display"', color: C.redHot, alpha: ia });
    const ra = win(t, 11.1, 14.0, .4, .4);
    txt(ctx, 'TOTAL', W - side / 2, 400, { font: '800 32px "Barlow Condensed"', ls: 12, color: C.cream, alpha: ra });
    txt(ctx, 'PRICELESS', W - side / 2, 500, { font: '400 120px Anton', color: C.white, alpha: ra, glow: 30, glowColor: 'rgba(203,50,52,.8)' });
    txt(ctx, 'SING. FEEL. CONNECT.', W - side / 2, 590, { font: '700 32px "Barlow Condensed"', ls: 8, color: C.redHot, alpha: ra });
    vignette(ctx, W, H, .55); grain(ctx, W, H, t, .07);
  }
  SCENES.push({ id: '06-the-receipt', name: 'The Receipt', tag: 'Brief idea', draw,
    desc: 'A restaurant receipt prints line by line: slow jams, yearning, healing, total PRICELESS. It tears off, fits to screen and gets stamped PAID IN FULL, WITH LOVE.' });
})();
