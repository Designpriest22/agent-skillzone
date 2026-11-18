// Scenes 13–14: Text From Your Ex, The Dedication Mixtape (the two extra ideas).
'use strict';

function wrapLines(ctx, s, font, maxW) {
  const words = s.split(' '), out = []; let line = '';
  for (const w of words) { const tryL = line ? line + ' ' + w : w; if (measure(ctx, tryL, font) > maxW && line) { out.push(line); line = w; } else line = tryL; }
  if (line) out.push(line); return out;
}

// ============ 13 TEXT FROM YOUR EX ============
(() => {
  // [arrival time, who, text]; 'sticker' sends the logo. Lines are original, not song lyrics.
  const MSG = [[1.3, 'them', 'u up?'], [2.9, 'me', 'it’s late and I’m all about R&B tonight'], [4.7, 'them', 'do you still think about us?'],
    [6.1, 'me', 'only when the slow jams play'], [7.4, 'them', 'where are you rn??'], [8.7, 'me', 'front row. singing every word.'],
    [10.0, 'them', '...can I come?'], [11.2, 'me', 'sticker']];
  const FONT = '700 34px "Barlow Condensed"';
  function draw(ctx, t, W, H) {
    const cx = W / 2, bp = beatPulse(t), last = MSG.filter(m => t >= m[0]).pop();
    ctx.fillStyle = lin(ctx, 0, 0, W, H, [[0, '#2B0D2E'], [1, '#12060F']]); ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const r = rng(4);
    for (let k = 0; k < 30; k++) glowDot(ctx, r() * W, r() * H, 50 + r() * 90, [C.red, C.orchid, C.cream][k % 3], .16 + .06 * Math.sin(TAU * t / LOOP * 2 + k));
    ctx.restore();
    // phone
    const pw = 520, ph = 1000, px = cx - pw / 2, py = 40, buzz = last && t - last[0] < .25 && last[1] === 'them' ? Math.sin(t * 160) * 4 : 0;
    ctx.save(); ctx.translate(buzz, 0);
    ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 30; ctx.fillStyle = '#0B0A0B'; rrect(ctx, px, py, pw, ph, 70); ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#3A3437'; ctx.lineWidth = 4; rrect(ctx, px + 2, py + 2, pw - 4, ph - 4, 68); ctx.stroke();
    const sx = px + 18, sy = py + 18, sw = pw - 36, sh = ph - 36;
    ctx.save(); rrect(ctx, sx, sy, sw, sh, 54); ctx.clip();
    ctx.fillStyle = '#100B0E'; ctx.fillRect(sx, sy, sw, sh);
    // status bar + header
    txt(ctx, '23:47', sx + 56, sy + 34, { font: '700 26px "Barlow Condensed"', color: C.white });
    ctx.fillStyle = '#000'; rrect(ctx, cx - 70, sy + 14, 140, 38, 19); ctx.fill();
    ctx.fillStyle = '#1C1518'; ctx.fillRect(sx, sy + 64, sw, 110);
    ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(cx, sy + 104, 30, 0, TAU); ctx.fill(); ctx.fillStyle = C.white; heartPath(ctx, cx, sy + 106, 30); ctx.fill();
    txt(ctx, 'My Ex (do not reply)', cx, sy + 152, { font: '700 24px "Barlow Condensed"', color: '#D9C9CC' });
    // messages, anchored to the bottom and pushed up as new ones arrive
    const out = eIO(inv(12.9, 14.4, t)), bw = 330, gap = 18, items = [];
    for (const [at, who, s] of MSG) {
      if (t < at) break;
      const lines = s === 'sticker' ? null : wrapLines(ctx, s, FONT, bw - 44), h = lines ? lines.length * 40 + 30 : 200;
      items.push({ at, who, s, lines, h });
    }
    const next = MSG.find(m => t < m[0] && t > m[0] - .8 && m[1] === 'them'), typing = next ? 74 + gap : 0;
    ctx.save(); ctx.beginPath(); ctx.rect(sx, sy + 176, sw, sh - 176); ctx.clip();
    let y = sy + sh - 120 - typing + out * -900;
    for (let i = items.length - 1; i >= 0; i--) {
      const m = items[i], k = eBack((t - m.at) / .32), hh = m.h * clamp(eOut((t - m.at) / .25)); y -= hh;
      if (y + m.h < sy + 180) { y -= gap; continue; }
      const me = m.who === 'me', w = m.lines ? Math.min(bw, Math.max(...m.lines.map(l => measure(ctx, l, FONT))) + 44) : 210, x = me ? sx + sw - 24 - w : sx + 24;
      ctx.save(); ctx.globalAlpha = clamp(k * 2); const ox = me ? x + w : x; ctx.translate(ox, y + m.h); ctx.scale(clamp(k, .3, 1.2), clamp(k, .3, 1.2)); ctx.translate(-ox, -(y + m.h));
      if (m.lines) {
        ctx.fillStyle = me ? C.red : '#2F2A2D'; rrect(ctx, x, y, w, m.h, 26); ctx.fill();
        m.lines.forEach((l, j) => txt(ctx, l, x + 22, y + 34 + j * 40, { font: FONT, color: C.white, align: 'left' }));
      } else { logo(ctx, 'heart', C.red, x + w / 2, y + m.h / 2, 200 * (1 + .06 * bp), { glow: 30, glowColor: 'rgba(255,74,72,.6)' }); }
      ctx.restore(); y -= gap;
    }
    ctx.restore();
    if (next) { const tx = sx + 24, ty = sy + sh - 120 - 74; ctx.fillStyle = '#2F2A2D'; rrect(ctx, tx, ty, 110, 64, 32); ctx.fill(); for (let d = 0; d < 3; d++) { ctx.fillStyle = `rgba(255,255,255,${.4 + .6 * Math.max(0, Math.sin(t * 9 - d * .8))})`; ctx.beginPath(); ctx.arc(tx + 32 + d * 23, ty + 32, 8, 0, TAU); ctx.fill(); } }
    if (t > 11.6 && t < 13.2) txt(ctx, 'Read 23:47 ♥', sx + sw - 30, sy + sh - 106, { font: '700 22px "Barlow Condensed"', color: '#BBA9AE', align: 'right', alpha: smooth(11.6, 11.9, t) * (1 - smooth(12.9, 13.2, t)) });
    ctx.fillStyle = '#1C1518'; ctx.fillRect(sx, sy + sh - 92, sw, 92);
    ctx.strokeStyle = '#3A3437'; ctx.lineWidth = 2; rrect(ctx, sx + 24, sy + sh - 74, sw - 110, 52, 26); ctx.stroke();
    txt(ctx, 'iMessage', sx + 48, sy + sh - 47, { font: '500 24px "Barlow Condensed"', color: '#6F6366', align: 'left' });
    ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(sx + sw - 50, sy + sh - 48, 26, 0, TAU); ctx.fill();
    ctx.restore(); ctx.restore();
    // side type
    const side = (W - pw) / 4, la = win(t, .3, 14.6, .4, .4);
    txt(ctx, '1 NEW MESSAGE', side + 20, 360, { font: '800 30px "Barlow Condensed"', ls: 10, color: C.red, alpha: la });
    ['TEXT', 'FROM', 'YOUR EX'].forEach((s, i) => txt(ctx, s, side + 20, 460 + i * 110, { font: '400 120px Anton', color: i === 2 ? C.cream : C.white, alpha: la * clamp(eOut((t - .3 - i * .15) / .4)) }));
    const ra = win(t, 2.9, 14.6, .4, .4);
    txt(ctx, 'SING', W - side - 20, 420, { font: '400 120px Anton', color: C.white, alpha: ra });
    txt(ctx, 'YOUR REPLY', W - side - 20, 530, { font: '400 92px Anton', color: C.redHot, alpha: ra, glow: 20 * bp, glowColor: C.red });
    txt(ctx, 'SHOUT-OUTS ON SCREEN ALL NIGHT', W - side - 20, 640, { font: '700 28px "Barlow Condensed"', ls: 6, color: C.cream, alpha: ra * .85 });
    vignette(ctx, W, H, .5); grain(ctx, W, H, t, .06);
  }
  SCENES.push({ id: '13-text-from-your-ex', name: 'Text From Your Ex', tag: 'New idea', draw,
    desc: 'A giant phone. A late-night chat types itself out, every reply a line the crowd can sing back, and it ends with the All About R&B heart sent as a sticker and read at 23:47.' });
})();

// ============ 14 THE DEDICATION MIXTAPE ============
(() => {
  const DED = ['For Tolu, from Ada', 'To my 2009 self', 'For the girls who still know every word', 'To Mum & Dad: your first dance', 'For everyone who drove down tonight', 'To the one that got away'];
  const CW = 1100, CH = 690;
  function reel(ctx, x, y, pack, spin) {
    ctx.fillStyle = '#4A2A1E'; ctx.beginPath(); ctx.arc(x, y, pack, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1; for (let r = 60; r < pack; r += 6) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = '#F2EDE4'; ctx.beginPath(); ctx.arc(x, y, 50, 0, TAU); ctx.fill();
    ctx.save(); ctx.translate(x, y); ctx.rotate(spin); ctx.fillStyle = '#1E1B1C';
    for (let k = 0; k < 6; k++) { ctx.rotate(TAU / 6); ctx.fillRect(-5, 22, 10, 18); }
    ctx.beginPath(); ctx.arc(0, 0, 18, 0, TAU); ctx.fill(); ctx.restore();
  }
  function cassette(ctx, face, p, spin, t) {
    ctx.fillStyle = lin(ctx, 0, -CH / 2, 0, CH / 2, [[0, '#2C2729'], [1, '#141112']]); rrect(ctx, -CW / 2, -CH / 2, CW, CH, 40); ctx.fill();
    ctx.fillStyle = '#3A3437'; for (const [x, y] of [[-510, -305], [510, -305], [-510, 305], [510, 305], [0, 305]]) { ctx.beginPath(); ctx.arc(x, y, 14, 0, TAU); ctx.fill(); ctx.strokeStyle = '#141112'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 8, y); ctx.lineTo(x + 8, y); ctx.stroke(); }
    // label
    const lx = -490, ly = -300, lw = 980, lh = 440;
    if (face === 'A') {
      ctx.fillStyle = '#F6EEDF'; rrect(ctx, lx, ly, lw, lh, 18); ctx.fill();
      ctx.fillStyle = C.red; ctx.fillRect(lx, ly + 300, lw, 26); ctx.fillStyle = C.orchid; ctx.fillRect(lx, ly + 326, lw, 10);
      logo(ctx, 'sig', C.ink, lx + 250, ly + 70, 380);
      txt(ctx, 'SIDE A', lx + lw - 40, ly + 64, { font: '400 64px Anton', color: C.red, align: 'right' });
      ctx.strokeStyle = 'rgba(33,31,32,.18)'; ctx.lineWidth = 2; for (const yy of [ly + 150, ly + 232]) { ctx.beginPath(); ctx.moveTo(lx + 40, yy); ctx.lineTo(lx + lw - 40, yy); ctx.stroke(); }
      // dedication, written on in a sweep
      const slot = 1.5, i = Math.floor((t - .4) / slot), lt = (t - .4) - i * slot;
      if (t >= .4 && i < DED.length) {
        const s = DED[i], font = 'italic 400 60px "DM Serif Display"', w = measure(ctx, s, font), k = eOut(lt / .7), a = 1 - smooth(slot - .2, slot, lt);
        ctx.save(); ctx.beginPath(); ctx.rect(lx + 40, ly + 120, (w + 40) * k, 120); ctx.clip();
        txt(ctx, s, lx + 50, ly + 198, { font, color: C.ink, align: 'left', alpha: a }); ctx.restore();
        txt(ctx, String(i + 1).padStart(2, '0') + ' / 0' + DED.length + '  DEDICATIONS', lx + lw - 40, ly + 128, { font: '700 24px "Barlow Condensed"', ls: 4, color: C.red, align: 'right', alpha: a });
      }
    } else {
      ctx.fillStyle = C.red; rrect(ctx, lx, ly, lw, lh, 18); ctx.fill();
      ctx.fillStyle = C.cream; ctx.fillRect(lx, ly + 300, lw, 26);
      logo(ctx, 'heart', C.white, lx + 150, ly + 150, 230);
      txt(ctx, 'SIDE B', lx + lw - 40, ly + 64, { font: '400 64px Anton', color: C.white, align: 'right' });
      txt(ctx, 'NEXT ON STAGE', lx + 300, ly + 140, { font: '800 30px "Barlow Condensed"', ls: 10, color: C.cream, align: 'left' });
      txt(ctx, 'ARTIST NAME', lx + 300, ly + 220, { font: '400 100px Anton', color: C.white, align: 'left' });
    }
    // window + reels
    ctx.fillStyle = 'rgba(10,8,9,.92)'; rrect(ctx, -290, -40, 580, 170, 22); ctx.fill();
    ctx.save(); rrect(ctx, -290, -40, 580, 170, 22); ctx.clip();
    reel(ctx, -175, 45, lerp(150, 70, p), spin); reel(ctx, 175, 45, lerp(70, 150, p), spin * 1.3);
    ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.beginPath(); ctx.moveTo(-290, -40); ctx.lineTo(-150, -40); ctx.lineTo(-260, 130); ctx.lineTo(-290, 130); ctx.fill();
    ctx.restore();
    // bottom bridge
    ctx.fillStyle = '#242022'; ctx.beginPath(); ctx.moveTo(-330, CH / 2); ctx.lineTo(-290, 185); ctx.lineTo(290, 185); ctx.lineTo(330, CH / 2); ctx.fill();
    ctx.fillStyle = '#0A0809'; for (const x of [-200, -70, 70, 200]) { ctx.beginPath(); ctx.arc(x, 270, x % 140 ? 18 : 12, 0, TAU); ctx.fill(); }
  }
  function draw(ctx, t, W, H) {
    const cx = W / 2, cy = H / 2 + 20, bp = beatPulse(t);
    ctx.fillStyle = lin(ctx, 0, 0, 0, H, [[0, '#F3DFB7'], [1, '#E2C38C']]); ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalAlpha = .08; ctx.fillStyle = C.red; const tw = measure(ctx, 'SIDE A  SIDE B  ', '400 220px Anton');
    for (let r = 0; r < 5; r++) for (let k = -1; k < W / tw + 2; k++) txt(ctx, 'SIDE A  SIDE B  ', k * tw - frac((r % 2 ? 1 : -1) * t / LOOP) * tw, 110 + r * 215, { font: '400 220px Anton', color: C.red, align: 'left' });
    ctx.restore();
    // flips: A -> B at 9.5–10.6, B -> A at 13.9–15
    const f1 = eIO(inv(9.5, 10.6, t)), f2 = eIO(inv(13.9, 15.0, t)), flip = f1 - f2 * 0 + (f2 > 0 ? f2 : 0);
    const ang = Math.PI * (f2 > 0 ? 1 + f2 : f1), face = Math.cos(ang) >= 0 ? (f2 > 0 ? 'A' : 'A') : 'B';
    const showFace = (ang % TAU) < Math.PI / 2 || (ang % TAU) > Math.PI * 1.5 ? 'A' : 'B';
    const lift = Math.sin(Math.PI * (f2 > 0 ? f2 : f1)), sx = Math.abs(Math.cos(ang));
    // tape: side A plays 0→1 over 0–9.5; side B rewinds fast so the loop closes on a fresh side A
    const pA = inv(0, 9.5, t), pB = eIO(inv(11.0, 13.6, t)), p = showFace === 'A' ? pA * (t < 13.9 ? 1 : 0) : pB;
    const spin = t < 9.5 ? t * 2.2 : t < 11 ? 9.5 * 2.2 : 9.5 * 2.2 + (t - 11) * 9;
    ctx.fillStyle = 'rgba(80,40,20,.3)'; ctx.beginPath(); ctx.ellipse(cx, cy + CH / 2 + 30 + lift * 40, CW * .5 * (1 - lift * .2), 30, 0, 0, TAU); ctx.fill();
    ctx.save(); ctx.translate(cx, cy - lift * 60); const s = (1 + .1 * lift) * (1 + .012 * bp) * .92; ctx.scale(s * Math.max(sx, .02), s); ctx.rotate(-.02 + lift * .05);
    cassette(ctx, showFace, p, spin, t); ctx.restore();
    // captions
    txt(ctx, 'THE DEDICATION MIXTAPE', cx, 60, { font: '800 40px "Barlow Condensed"', ls: 16, color: C.ink });
    const capB = win(t, 10.6, 13.8, .3, .3);
    txt(ctx, 'SEND YOUR DEDICATION AT THE BOOTH  ·  ALL ABOUT R&B', cx, H - 44, { font: '700 28px "Barlow Condensed"', ls: 8, color: C.red, alpha: 1 - capB });
    txt(ctx, 'SIDE B  ·  COMING UP NEXT', cx, H - 44, { font: '800 30px "Barlow Condensed"', ls: 10, color: C.ink, alpha: capB });
    if (t > 11 && t < 13.6) txt(ctx, '◀◀ REWIND', cx + CW * .46 * .92, cy - CH * .46, { font: '700 26px "Barlow Condensed"', ls: 6, color: C.red, align: 'right', alpha: .4 + .4 * Math.sin(t * 12) });
    vignette(ctx, W, H, .3); grain(ctx, W, H, t, .07);
  }
  SCENES.push({ id: '14-dedication-mixtape', name: 'The Dedication Mixtape', tag: 'New idea', draw,
    desc: 'A cassette plays while crowd dedications write themselves onto the label. It flips to Side B to reveal the next act, rewinds, and flips back to Side A.' });
})();
