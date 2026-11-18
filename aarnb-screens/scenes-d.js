// Scenes 11–12: logo loops on brand red.
'use strict';

function redGround(ctx, W, H, hot = 0) {
  ctx.fillStyle = C.red; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = rad(ctx, W / 2, H / 2, 0, W * .7, [[0, `rgba(255,96,86,${.45 + .3 * hot})`], [.55, 'rgba(203,50,52,0)'], [1, 'rgba(90,10,16,.6)']]);
  ctx.fillRect(0, 0, W, H);
}
function burst(ctx, cx, cy, age, n, seed, spread = 900) {
  if (age < 0 || age > 2.2) return; const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const a = r() * TAU, v = (.35 + r() * .65) * spread, d = v * eOut(age / 1.6), s = 14 + r() * 34, rot = (r() - .5) * 3 * age;
    ctx.save(); ctx.globalAlpha = 1 - smooth(1.1, 2.2, age); ctx.translate(cx + Math.cos(a) * d, cy + Math.sin(a) * d + 120 * age * age); ctx.rotate(rot);
    ctx.fillStyle = [C.white, C.cream, C.ink, '#FF8A80'][i % 4]; heartPath(ctx, 0, 0, s); ctx.fill(); ctx.restore();
  }
}
function ring(ctx, cx, cy, age, col = C.white) {
  if (age < 0 || age > 1) return;
  ctx.save(); ctx.globalAlpha = 1 - age; ctx.strokeStyle = col; ctx.lineWidth = 14 * (1 - age) + 2; ctx.beginPath(); ctx.arc(cx, cy, 120 + age * 900, 0, TAU); ctx.stroke(); ctx.restore();
}

// ============ 11 RED ROOM (heart logo on red) ============
(() => {
  function band(ctx, W, y, ang, bg, fg, s, dir, t) {
    ctx.save(); ctx.translate(W / 2, y); ctx.rotate(ang);
    ctx.fillStyle = bg; ctx.fillRect(-W, -52, W * 2, 104);
    const tw = measure(ctx, s, '400 64px Anton', 6), off = frac(dir * t / LOOP * 2) * tw;
    for (let k = -Math.ceil(W / tw) - 1; k < Math.ceil(W / tw) + 1; k++) txt(ctx, s, k * tw - off, 4, { font: '400 64px Anton', color: fg, align: 'left', ls: 6 });
    ctx.restore();
  }
  function draw(ctx, t, W, H) {
    const cx = W / 2, cy = H / 2, bp = beatPulse(t), hb = heartbeat(t), bar = Math.floor(t / (BEAT * 4));
    redGround(ctx, W, H, bp);
    // infinite heart tunnel: each ring doubles in 2.5 s, so six doublings close the 15 s loop
    const z = frac(t / 2.5);
    for (let k = -3; k < 6; k++) {
      const s = 300 * Math.pow(2, k + z), a = smooth(60, 260, s) * (1 - smooth(2600, 5200, s));
      if (a <= 0) continue;
      const col = (k + 30) % 3 === 0 ? C.white : (k + 30) % 3 === 1 ? C.cream : '#8E1C20';
      logo(ctx, 'outline', col, cx, cy + 10, s, { alpha: a * (.55 + .3 * bp), rot: Math.sin(TAU * t / LOOP + k) * .06 });
    }
    // on-beat strobe, stronger on every 4th beat
    const strobe = Math.exp(-((t % (BEAT * 4)) / BEAT) * 9);
    if (strobe > .02) { ctx.fillStyle = `rgba(255,240,225,${.35 * strobe})`; ctx.fillRect(0, 0, W, H); }
    // crossing marquee bands
    band(ctx, W, 150, -.07, C.cream, C.red, 'SING.  FEEL.  CONNECT.  ·  ', 1, t);
    band(ctx, W, H - 150, -.07, C.ink, C.white, 'ALL ABOUT R&B  ·  ALL ABOUT R&B  ·  ', -1, t);
    // drops
    for (const d of [2.5, 7.5, 12.5]) { ring(ctx, cx, cy, (t - d) / .9); burst(ctx, cx, cy, t - d, 46, d * 10); }
    // logo with RGB-split echo on the beat
    const w = 560 * (1 + .07 * bp + .03 * hb), sh = 16 * bp;
    logo(ctx, 'heart', C.cream, cx - sh, cy + sh * .6, w, { alpha: .9 * bp });
    logo(ctx, 'heart', C.ink, cx + sh, cy - sh * .6, w, { alpha: .8 * bp });
    logo(ctx, 'heart', C.white, cx, cy, w, { glow: 30 + 30 * bp, glowColor: 'rgba(120,10,20,.6)' });
    // side call-outs that swap every bar (2.5 s)
    const words = ['SING.', 'FEEL.', 'CONNECT.', 'SING.', 'FEEL.', 'CONNECT.'], wd = words[bar % 6], lt = t % (BEAT * 4), ka = eBack(lt / .3) * (1 - smooth(BEAT * 4 - .2, BEAT * 4, lt));
    const sideX = (W - w) / 4 + 10;
    txt(ctx, wd, sideX, cy, { font: '400 120px Anton', color: C.white, alpha: clamp(ka), glow: 20, glowColor: 'rgba(90,10,16,.6)' });
    txt(ctx, wd, W - sideX, cy, { font: '400 120px Anton', color: C.cream, alpha: clamp(ka), glow: 20, glowColor: 'rgba(90,10,16,.6)' });
    vignette(ctx, W, H, .35); grain(ctx, W, H, t, .06);
  }
  SCENES.push({ id: '11-red-room', name: 'Red Room', tag: 'Logo hero', draw,
    desc: 'The heart logo punches on every beat over an endless zoom of heart outlines on brand red. Strobes, marquee bands, heart-confetti drops every five seconds, and SING / FEEL / CONNECT call-outs.' });
})();

// ============ 12 SIGNATURE ON RED ============
(() => {
  function typeWall(ctx, W, H, t, mode) {
    const rows = 7, rh = H / rows, s = 'ALL ABOUT R&B  ';
    const tw = measure(ctx, s, '400 150px Anton', 4);
    for (let r = 0; r < rows; r++) {
      const dir = r % 2 ? 1 : -1, off = frac(dir * t / LOOP * (1 + r % 2)) * tw, y = rh * (r + .5);
      for (let k = -1; k < Math.ceil(W / tw) + 2; k++) {
        const o = { font: '400 150px Anton', align: 'left', ls: 4 };
        if (r % 2) txt(ctx, s, k * tw - off, y, { ...o, color: '#B82A2E', alpha: 1 - mode });
        else txt(ctx, s, k * tw - off, y, { ...o, noFill: true, stroke: '#E0544E', lw: 2, alpha: 1 - mode });
        if (mode > 0) txt(ctx, s, k * tw - off, y, { ...o, noFill: true, stroke: C.cream, lw: 2.5, alpha: mode * .55 });
      }
    }
  }
  function writeOn(ctx, p, x0, y0, sw, alpha) {
    const sh = sw * IMG.sig.height / IMG.sig.width, pad = 60, L = offscreen(sw + pad * 2, sh + pad * 2), lx = L.getContext('2d');
    lx.shadowColor = 'rgba(80,0,10,.5)'; lx.shadowBlur = 24; lx.shadowOffsetY = 10;
    lx.drawImage(tinted('sig', C.white), pad, pad, sw, sh); lx.shadowColor = 'transparent';
    if (p < 1) {
      const dir = [Math.cos(-.36), Math.sin(-.36)], len = sw * dir[0] + sh * -dir[1] * 1.1;
      const g = lx.createLinearGradient(pad, pad + sh, pad + dir[0] * len, pad + sh + dir[1] * len);
      g.addColorStop(0, '#000'); g.addColorStop(Math.max(0, p - .01), '#000'); g.addColorStop(Math.min(1, p + .005), 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      lx.globalCompositeOperation = 'destination-in'; lx.fillStyle = g; lx.fillRect(0, 0, L.width, L.height);
      const tx = x0 + dir[0] * len * p * .98, ty = y0 + sh * .82 + dir[1] * len * p * .7;
      ctx.save(); ctx.globalAlpha = alpha; ctx.drawImage(L, x0 - pad, y0 - pad);
      ctx.globalCompositeOperation = 'lighter'; glowDot(ctx, tx, ty, 80, '#FFFFFF', .9); ctx.restore();
    } else { ctx.save(); ctx.globalAlpha = alpha; ctx.drawImage(L, x0 - pad, y0 - pad); ctx.restore(); }
  }
  function draw(ctx, t, W, H) {
    const cx = W / 2, cy = H / 2, bp = beatPulse(t), hb = heartbeat(t);
    const mode = smooth(7.9, 8.3, t) * (1 - smooth(12.6, 13.2, t));
    redGround(ctx, W, H, bp * .5);
    typeWall(ctx, W, H, t, mode);
    ctx.fillStyle = rad(ctx, cx, cy, 0, 760, [[0, 'rgba(203,50,52,.92)'], [.6, 'rgba(203,50,52,.55)'], [1, 'rgba(203,50,52,0)']]); ctx.fillRect(0, 0, W, H);
    // part 1: the signature writes on, its heart pops, the tagline lands on the beat
    const sigA = 1 - smooth(7.4, 7.7, t), sw = 1180, sh = sw * IMG.sig.height / IMG.sig.width, x0 = cx - sw / 2, y0 = cy - sh / 2 - 60;
    if (t > .5 && sigA > 0) {
      const sc = 1 + .025 * bp * smooth(3.4, 3.6, t);
      ctx.save(); ctx.translate(cx, cy - 60); ctx.scale(sc, sc); ctx.translate(-cx, -(cy - 60));
      writeOn(ctx, inv(.6, 3.3, t) * 1.04, x0, y0, sw, sigA); ctx.restore();
      const hx = x0 + sw * .943, hy = y0 + sh * .14;
      ring(ctx, hx, hy, (t - 3.4) / .8, C.cream); burst(ctx, hx, hy, t - 3.4, 34, 77, 700);
      if (t > 3.4) { ctx.save(); ctx.globalAlpha = sigA; ctx.fillStyle = C.white; heartPath(ctx, hx, hy + 6, 110 * (1 + .25 * hb) * eBack((t - 3.4) / .3)); ctx.fill(); ctx.restore(); }
      [['SING.', 3.75], ['FEEL.', 5.0], ['CONNECT.', 6.25]].forEach(([w, a], i) => {
        const k = eBack((t - a) / .3); if (t < a) return;
        txt(ctx, w, cx + (i - 1) * 440, cy + 300 + (1 - clamp(k)) * 60, { font: '400 110px Anton', color: i === 1 ? C.ink : C.cream, alpha: clamp(k * 2) * sigA });
      });
    }
    // transition: a white heart swells out of the signature's heart and wipes the frame
    const wipe = t - 7.4;
    if (wipe > 0 && wipe < .9) {
      const hx = x0 + sw * .943, hy = y0 + sh * .14, k = wipe < .45 ? eIn(wipe / .45) : 1, open = wipe < .45 ? 0 : eOut((wipe - .45) / .45);
      const big = Math.hypot(W, H) * 1.7;
      ctx.save(); ctx.fillStyle = C.white; ctx.beginPath();
      if (!open) { heartSub(ctx, lerp(hx, cx, k), lerp(hy, cy, k), big * k); ctx.fill(); }
      else { ctx.rect(0, 0, W, H); heartSub(ctx, cx, cy, big * open); ctx.fill('evenodd'); }
      ctx.restore();
    }
    // part 2: the heart logo slams in and bounces on the beat, then spins out before the loop closes
    const ina = eBack((t - 8.1) / .4), out = eIn(inv(12.4, 13.0, t));
    if (t > 8.1 && out < 1) {
      const s = lerp(1.6, 1, clamp(ina)) * (1 - out) * (1 + .07 * bp);
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(out * 2.4); ctx.scale(s, s);
      logo(ctx, 'heart', '#7E161B', 10, 14, 640, { alpha: .6 });
      logo(ctx, 'heart', C.white, 0, 0, 640, { alpha: clamp(ina * 3) });
      ctx.restore();
      ring(ctx, cx, cy, (t - 8.1) / .9);
      burst(ctx, cx, cy, t - 8.15, 50, 991);
      const tagA = smooth(8.8, 9.1, t) * (1 - smooth(12.2, 12.5, t));
      txt(ctx, 'SING.  FEEL.  CONNECT.', cx, H - 110, { font: '800 50px "Barlow Condensed"', ls: 16, color: C.cream, alpha: tagA });
    }
    if (out > 0 && out < 1) ring(ctx, cx, cy, out, C.cream);
    vignette(ctx, W, H, .35); grain(ctx, W, H, t, .06);
  }
  SCENES.push({ id: '12-signature-on-red', name: 'Signature on Red', tag: 'Logo hero', draw,
    desc: 'The signature logo writes itself across a moving wall of type on brand red. Its heart pops into confetti, SING / FEEL / CONNECT lands on the beat, then a white heart wipe brings in the heart logo, which bounces and spins out.' });
})();
