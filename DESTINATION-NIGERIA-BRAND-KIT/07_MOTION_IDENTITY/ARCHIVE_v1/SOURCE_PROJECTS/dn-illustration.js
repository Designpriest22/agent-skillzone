// Destination Nigeria — illustration library for the 25 s brand intro.
// Characters and scenery are layered, shaded SVG built from parts so they can be animated (limbs, cloth, water).
// Every builder returns { g, update(t) }. Coordinates: characters stand with feet at (0,0), ~520 units tall, facing right.
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, a = {}, p) => { const n = document.createElementNS(NS, tag); for (const k in a) n.setAttribute(k, a[k]); if (p) p.appendChild(n); return n; };
  const g = (p, a = {}) => el('g', a, p);
  const path = (p, d, fill, a = {}) => el('path', Object.assign({ d, fill }, a), p);
  let uid = 0; const id = s => `${s}${++uid}`;
  const C = window.DN.C;
  const SKIN = { base: '#6B4430', light: '#8C5B3E', dark: '#47291A', lip: '#5A3022' };
  const HAIR = '#1B1512';
  const tf = (n, s) => n.setAttribute('transform', s);
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const sm = (a, b, v) => { const x = clamp((v - a) / (b - a)); return x * x * (3 - 2 * x); };

  function lin(defs, stops, x2 = 0, y2 = 1, x1 = 0, y1 = 0) {
    const i = id('lg'); const lg = el('linearGradient', { id: i, x1, y1, x2, y2 }, defs);
    stops.forEach(([o, c, a]) => el('stop', { offset: o, 'stop-color': c, 'stop-opacity': a ?? 1 }, lg));
    return `url(#${i})`;
  }
  function rad(defs, stops, cx = .5, cy = .5, r = .5) {
    const i = id('rg'); const rg = el('radialGradient', { id: i, cx, cy, r }, defs);
    stops.forEach(([o, c, a]) => el('stop', { offset: o, 'stop-color': c, 'stop-opacity': a ?? 1 }, rg));
    return `url(#${i})`;
  }
  function blur(defs, sd) { const i = id('bl'); const f = el('filter', { id: i, x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs); el('feGaussianBlur', { stdDeviation: sd }, f); return `url(#${i})`; }

  // ---------- textile patterns (adire-style resist dye, wax-print circles)
  function adire(defs) {
    const i = id('adire');
    const p = el('pattern', { id: i, width: 34, height: 34, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(8)' }, defs);
    el('rect', { width: 34, height: 34, fill: '#1E4A55' }, p);
    el('circle', { cx: 9, cy: 9, r: 6, fill: 'none', stroke: '#CFE0DA', 'stroke-opacity': .55, 'stroke-width': 1.6 }, p);
    el('circle', { cx: 9, cy: 9, r: 2, fill: '#CFE0DA', 'fill-opacity': .6 }, p);
    el('path', { d: 'M20,22 h12 M26,16 v12', stroke: '#CFE0DA', 'stroke-opacity': .45, 'stroke-width': 1.4 }, p);
    el('circle', { cx: 26, cy: 4, r: 1.3, fill: '#CFE0DA', 'fill-opacity': .5 }, p);
    return `url(#${i})`;
  }
  function wax(defs, base, a, b) {
    const i = id('wax');
    const p = el('pattern', { id: i, width: 40, height: 40, patternUnits: 'userSpaceOnUse' }, defs);
    el('rect', { width: 40, height: 40, fill: base }, p);
    el('circle', { cx: 10, cy: 10, r: 8, fill: a }, p); el('circle', { cx: 10, cy: 10, r: 3.5, fill: base }, p);
    el('circle', { cx: 30, cy: 30, r: 8, fill: b }, p); el('circle', { cx: 30, cy: 30, r: 3.5, fill: a }, p);
    el('path', { d: 'M0,40 L40,0', stroke: b, 'stroke-width': 1.5, 'stroke-opacity': .6 }, p);
    return `url(#${i})`;
  }

  // ---------- faces (profile, facing right). Head centre (0,0), ~ 92 tall
  function head(p, defs, o = {}) {
    const h = g(p);
    const skin = lin(defs, [[0, SKIN.light], [1, SKIN.base]], 1, 0);
    if (o.backHair) path(h, 'M-34,-30 C-40,-58 -10,-70 14,-64 C30,-60 36,-48 34,-38 L-30,-14 Z', HAIR);
    el('rect', { x: -14, y: 28, width: 26, height: 30, rx: 8, fill: SKIN.dark }, h);           // neck
    path(h, 'M-30,-38 C-31,-64 22,-70 31,-42 L35,-24 L44,-9 C45,-6 43,-4 39,-4 L37,3 L34,6 L36,10 C36,15 33,17 30,19 C25,34 -6,40 -20,31 C-33,20 -34,-6 -30,-38 Z', skin);
    path(h, 'M-20,31 C-6,40 22,34 30,19 C22,26 0,30 -20,24 Z', SKIN.dark, { opacity: .35 });  // jaw shade
    el('ellipse', { cx: -7, cy: -6, rx: 7.5, ry: 11, fill: SKIN.base }, h);                  // ear
    path(h, 'M-9,-12 C-4,-10 -4,-2 -8,0', 'none', { stroke: SKIN.dark, 'stroke-width': 1.6, 'stroke-linecap': 'round' });
    const eye = g(h, { transform: 'translate(22,-21)' });
    path(eye, 'M-7,0 C-3,-5 4,-5 7,-1 C3,3 -3,3 -7,0 Z', '#F5F0E6');
    el('circle', { cx: 2.5, cy: -.8, r: 2.8, fill: '#2A1A12' }, eye);
    el('circle', { cx: 3.4, cy: -1.8, r: .9, fill: '#fff' }, eye);
    path(eye, 'M-8,-1 C-3,-7 5,-7 8,-2', 'none', { stroke: '#2A1A12', 'stroke-width': 1.6, 'stroke-linecap': 'round' });
    path(h, 'M14,-31 C20,-35 28,-34 33,-30', 'none', { stroke: HAIR, 'stroke-width': 3, 'stroke-linecap': 'round' }); // brow
    path(h, 'M38,-6 C35,-4 33,-5 32,-7', 'none', { stroke: SKIN.dark, 'stroke-width': 1.5, 'stroke-linecap': 'round' }); // nostril
    path(h, 'M37,4 C34,5 31,5 29,4 M36,10 C33,12 31,12 29,11', 'none', { stroke: SKIN.lip, 'stroke-width': 2.2, 'stroke-linecap': 'round' });
    el('ellipse', { cx: 18, cy: -2, rx: 8, ry: 5, fill: SKIN.light, opacity: .45 }, h);      // cheek light
    if (o.beard) path(h, 'M-14,24 C0,34 22,30 30,18 C32,24 26,34 12,37 C0,39 -12,34 -14,24 Z', HAIR, { opacity: .85 });
    if (o.earring) { el('circle', { cx: -6, cy: 9, r: 4, fill: 'none', stroke: C.gold, 'stroke-width': 2 }, h); }
    return { g: h, eye };
  }

  function hand(p, x, y, r = 0, s = 1) {
    const h = g(p, { transform: `translate(${x},${y}) rotate(${r}) scale(${s})` });
    path(h, 'M-9,-8 C0,-12 12,-9 14,-2 C16,4 10,10 0,10 C-8,10 -12,4 -9,-8 Z', SKIN.base);
    path(h, 'M2,-8 C6,-14 12,-14 12,-9', 'none', { stroke: SKIN.base, 'stroke-width': 6, 'stroke-linecap': 'round' });  // thumb
    path(h, 'M0,4 C6,5 10,3 12,0', 'none', { stroke: SKIN.dark, 'stroke-width': 1.2, opacity: .7 });
    return h;
  }

  // articulated limb: two segments, returns joint groups
  function limb(p, x, y, l1, l2, w1, w2, fill1, fill2) {
    const a = g(p, { transform: `translate(${x},${y})` });
    const up = g(a);
    el('rect', { x: -w1 / 2, y: -w1 / 2, width: w1, height: l1 + w1 / 2, rx: w1 / 2, fill: fill1 }, up);
    const lo = g(up, { transform: `translate(0,${l1})` });
    el('rect', { x: -w2 / 2, y: -w2 / 2, width: w2, height: l2 + w2 / 2, rx: w2 / 2, fill: fill2 }, lo);
    const end = g(lo, { transform: `translate(0,${l2})` });
    return { a, up, lo, end, set(r1, r2) { tf(up, `rotate(${r1})`); tf(lo, `translate(0,${l1}) rotate(${r2})`); } };
  }

  // ======================================================================= DRUMMER (dùndún talking drum)
  function drummer(p, defs, hits) {
    const root = g(p);
    el('ellipse', { cx: 10, cy: 0, rx: 130, ry: 14, fill: '#000', opacity: .28 }, root);
    const body = g(root);
    const trousers = lin(defs, [[0, '#EFE8DA'], [1, '#C9BFA9']], 1, 0);
    path(body, 'M-46,-255 C-52,-170 -60,-90 -62,-12 L-30,-12 C-24,-90 -12,-170 -2,-240 Z', trousers);
    path(body, 'M-6,-250 C2,-170 10,-90 14,-12 L48,-12 C42,-100 34,-180 30,-245 Z', trousers);
    path(body, 'M-14,-200 C-12,-140 -16,-80 -22,-30', 'none', { stroke: '#B8AD95', 'stroke-width': 2 });
    for (const x of [-46, 30]) path(body, `M${x - 22},-14 h52 c6,0 8,8 4,12 h-60 c-4,-4 -2,-12 4,-12 Z`, '#2B1E16');
    const torso = g(body);
    const ad = adire(defs);
    path(torso, 'M-64,-430 C-86,-390 -92,-300 -82,-232 C-40,-218 40,-218 74,-232 C80,-310 72,-392 48,-430 C22,-446 -38,-448 -64,-430 Z', ad);
    path(torso, 'M-82,-232 C-40,-218 40,-218 74,-232 L70,-250 C30,-238 -40,-238 -80,-250 Z', '#163A42');      // hem band
    path(torso, 'M-8,-440 L6,-380 L20,-440 Z', '#163A42');                                                       // neckline
    path(torso, 'M-64,-430 C-86,-390 -92,-300 -82,-232 C-70,-300 -68,-380 -50,-425 Z', '#000', { opacity: .18 });
    // drum strap + drum
    path(torso, 'M-40,-430 C0,-380 50,-340 90,-310', 'none', { stroke: C.laterite, 'stroke-width': 7, 'stroke-linecap': 'round' });
    const drumG = g(root, { transform: 'translate(70,-322) rotate(-6)' });
    const wood = lin(defs, [[0, '#9A6236'], [.5, '#6E4122'], [1, '#4A2A16']], 0, 1);
    const waist = el('path', { fill: wood }, drumG);
    const cords = g(drumG, { stroke: '#EFE6D2', 'stroke-width': 1.6, opacity: .95 });
    const cordEls = [...Array(11)].map(() => el('path', { fill: 'none' }, cords));
    el('ellipse', { cx: -88, cy: 0, rx: 15, ry: 50, fill: '#D9C49B', stroke: '#6E4122', 'stroke-width': 4 }, drumG);
    el('ellipse', { cx: 88, cy: 0, rx: 15, ry: 50, fill: '#E7D6B0', stroke: '#6E4122', 'stroke-width': 4 }, drumG);
    el('ellipse', { cx: 90, cy: -8, rx: 6, ry: 24, fill: '#fff', opacity: .3 }, drumG);
    for (let i = 0; i < 14; i++) el('circle', { cx: 88 + 15 * Math.cos(i / 14 * 6.28) * .2, cy: 50 * Math.sin(i / 14 * 6.28), r: 2, fill: C.gold }, drumG);
    // back arm squeezing cords
    const back = limb(root, -26, -408, 78, 76, 30, 24, ad, SKIN.base);
    back.set(-28, -78);
    hand(back.end, 0, 6, 80);
    const hd = head(root, defs, { beard: true });
    const headG = g(root);
    headG.appendChild(hd.g);
    // fila (cap) with gold band, folded to the back
    const cap = g(hd.g);
    path(cap, 'M-33,-36 C-36,-74 30,-80 34,-42 C12,-54 -14,-52 -33,-36 Z', C.laterite);
    path(cap, 'M-33,-38 C-58,-52 -54,-78 -28,-70 C-24,-58 -26,-48 -33,-38 Z', '#8F3F1E');
    path(cap, 'M-33,-36 C-14,-52 12,-54 34,-42 L33,-36 C12,-47 -14,-45 -33,-30 Z', C.gold);
    for (let i = 0; i < 6; i++) el('circle', { cx: -22 + i * 10, cy: -44 + Math.abs(i - 2.5) * 1.2, r: 1.6, fill: C.forest }, cap);
    // front arm with curved stick (kongo)
    const front = limb(root, 24, -402, 86, 80, 32, 25, ad, SKIN.base);
    const stick = g(front.end, { transform: 'rotate(150)' });
    path(stick, 'M0,0 C34,-16 64,0 80,34', 'none', { stroke: '#3A2414', 'stroke-width': 7, 'stroke-linecap': 'round' });
    path(stick, 'M2,-1 C30,-14 56,-2 72,24', 'none', { stroke: '#7A4E2C', 'stroke-width': 2, 'stroke-linecap': 'round' });
    hand(front.end, 0, 2, -30);
    function drumShape(sq) {
      const w = 26 - 8 * sq;
      waist.setAttribute('d', `M-88,-50 C-30,-${w} 30,-${w} 88,-50 L88,50 C30,${w} -30,${w} -88,50 Z`);
      cordEls.forEach((c, i) => { const y = -46 + i * 9.2; const yy = y * (w / 50) * .9; c.setAttribute('d', `M-86,${y} C-30,${yy} 30,${yy} 86,${y}`); });
    }
    return {
      g: root, update(t) {
        let up = 0, last = -9;
        for (const [h] of hits) { if (h <= t) last = h; const d = h - t; if (d > .06 && d < .2) up = Math.max(up, (0.2 - d) / .14); else if (d >= 0 && d <= .06) up = Math.max(up, d / .06); }
        const since = t - last, rebound = since < .25 ? Math.sin(since / .25 * Math.PI) * .25 : 0;
        const idle = .5 + .5 * Math.sin(t * 6.3);
        front.set(-38 - 30 * up + 6 * rebound, -62 - 28 * up + 10 * rebound);
        const squeeze = since < .4 ? Math.sin(Math.min(1, since / .2) * Math.PI / 2) * (1 - since / .4) : 0;
        drumShape(squeeze);
        back.set(-28 + 6 * squeeze, -78 - 10 * squeeze);
        tf(body, `rotate(${1.5 * Math.sin(t * 2 * Math.PI / 1.25)} 0 -240)`);
        tf(headG, `rotate(${2 * Math.sin(t * 2 * Math.PI / .625) + 3 * rebound} 0 -430) translate(6,-476) scale(1.32)`);
        tf(drumG, `translate(${74 + 2 * idle},${-322 + 3 * squeeze}) rotate(-6)`);
      },
    };
  }

  // ======================================================================= DANCER (gele, iro & buba, ipele scarf)
  function dancer(p, defs) {
    const root = g(p);
    el('ellipse', { cx: 0, cy: 0, rx: 110, ry: 13, fill: '#000', opacity: .26 }, root);
    const body = g(root);
    const wrap = wax(defs, C.laterite, C.gold, '#7A2F18');
    const skirt = path(body, '', wrap);
    const skirtShade = path(body, '', '#000', { opacity: .16 });
    for (const x of [-22, 18]) path(body, `M${x - 14},-12 c4,-10 22,-10 28,0 Z`, '#2B1E16');
    const blouse = lin(defs, [[0, '#F5F0E6'], [1, '#E2D6BE']], 1, 1);
    const torso = g(body);
    path(torso, 'M-50,-410 C-66,-370 -64,-300 -54,-250 C-20,-240 24,-240 50,-250 C58,-300 60,-370 44,-410 C20,-426 -26,-426 -50,-410 Z', blouse);
    path(torso, 'M-56,-262 C-20,-250 24,-250 54,-262 L56,-240 C20,-226 -22,-226 -58,-240 Z', C.gold);        // sash
    path(torso, 'M-6,-420 C-2,-400 8,-400 12,-420', 'none', { stroke: '#C9BFA9', 'stroke-width': 3 });
    for (let i = 0; i < 4; i++) path(torso, `M${-40 + i * 24},-395 l6,30`, 'none', { stroke: '#D6C9AF', 'stroke-width': 2 });
    // arms (both raised, holding the scarf)
    const L = limb(root, -36, -398, 74, 70, 26, 21, blouse, SKIN.base);
    const R = limb(root, 34, -398, 74, 70, 26, 21, blouse, SKIN.base);
    const hl = hand(L.end, 0, 4, 90), hr = hand(R.end, 0, 4, 90);
    const scarf = path(root, '', lin(defs, [[0, C.gold], [.5, '#F3C46A'], [1, '#C98722']], 1, 0), { opacity: .96 });
    const scarfLine = path(root, '', 'none', { stroke: '#9A6510', 'stroke-width': 1.5, opacity: .6 });
    // head with gele (sculpted headtie)
    const hd = head(root, defs, { earring: true });
    const headG = g(root); headG.appendChild(hd.g);
    const gele = g(hd.g);
    const geleFill = lin(defs, [[0, '#F6CD72'], [.6, C.gold], [1, '#B97C14']], 1, 1);
    path(gele, 'M-36,-30 C-48,-70 -20,-104 20,-100 C48,-96 52,-66 36,-38 C10,-50 -14,-48 -36,-30 Z', geleFill);
    for (let i = 0; i < 6; i++) {
      const a = -150 + i * 22;
      path(gele, `M-4,-58 C${-4 + 40 * Math.cos(a * Math.PI / 180)},${-58 + 40 * Math.sin(a * Math.PI / 180)} ${-4 + 70 * Math.cos((a + 8) * Math.PI / 180)},${-58 + 70 * Math.sin((a + 8) * Math.PI / 180)} ${-4 + 82 * Math.cos((a + 14) * Math.PI / 180)},${-58 + 82 * Math.sin((a + 14) * Math.PI / 180)} L${-4 + 70 * Math.cos((a + 20) * Math.PI / 180)},${-58 + 70 * Math.sin((a + 20) * Math.PI / 180)} Z`,
        i % 2 ? '#F2C35E' : '#D99A2B', { stroke: '#B97C14', 'stroke-width': 1 });
    }
    path(gele, 'M-36,-30 C-14,-48 10,-50 36,-38 L34,-32 C10,-44 -12,-42 -34,-24 Z', '#9A6510');
    for (let i = 0; i < 5; i++) path(gele, `M${-24 + i * 12},-46 q6,-26 16,-34`, 'none', { stroke: '#FFF3D6', 'stroke-width': 1.4, opacity: .55 });
    return {
      g: root, update(t) {
        const beat = t * 2 * Math.PI / 1.25, sway = Math.sin(beat), bob = Math.abs(Math.sin(beat * 2));
        const hip = 10 * sway;
        skirt.setAttribute('d', `M-52,-252 C-62,-180 ${-74 + hip * .5},-90 ${-86 + hip},-14 C-40,-6 40,-6 ${88 + hip},-14 C${74 + hip * .5},-90 62,-180 54,-252 C20,-262 -20,-262 -52,-252 Z`);
        skirtShade.setAttribute('d', `M-52,-252 C-62,-180 ${-74 + hip * .5},-90 ${-86 + hip},-14 C-60,-10 -48,-10 -40,-12 C-40,-90 -40,-180 -30,-255 Z`);
        tf(body, `translate(${hip * .6},${-4 * bob}) rotate(${2.5 * sway} 0 -250)`);
        L.set(150 + 22 * Math.sin(beat + .4), 28 * Math.sin(beat + 1.2) - 10);
        R.set(-150 + 22 * Math.sin(beat + 2.2), -28 * Math.sin(beat + 2.6) + 10);
        tf(L.a, `translate(${-36 + hip * .6},${-398 - 4 * bob})`); tf(R.a, `translate(${34 + hip * .6},${-398 - 4 * bob})`);
        tf(headG, `translate(${8 + hip * .7},${-462 - 4 * bob}) rotate(${4 * Math.sin(beat + .8)}) scale(1.22)`);
        // scarf between hands, rippling
        const m1 = root.getCTM(), p1 = hl.getCTM(), p2 = hr.getCTM();
        if (!m1 || !p1 || !p2) return;
        const inv = m1.inverse(), A = p1.multiply ? inv.multiply(p1) : p1, B = inv.multiply(p2);
        const x1 = A.e, y1 = A.f, x2 = B.e, y2 = B.f;
        let top = '', bot = '';
        for (let i = 0; i <= 24; i++) {
          const k = i / 24, x = x1 + (x2 - x1) * k, y = y1 + (y2 - y1) * k + 60 * Math.sin(k * Math.PI) + 14 * Math.sin(k * 9 - t * 8) * Math.sin(k * Math.PI);
          const w = 16 * Math.sin(k * Math.PI) + 3;
          top += (i ? ' L' : 'M') + x.toFixed(1) + ',' + (y - w).toFixed(1);
          bot = ` L${x.toFixed(1)},${(y + w).toFixed(1)}` + bot;
        }
        scarf.setAttribute('d', top + bot + 'Z');
        scarfLine.setAttribute('d', top);
      },
    };
  }

  // ======================================================================= TRAVELLER (walk cycle)
  function traveller(p, defs) {
    const root = g(p);
    el('ellipse', { cx: 0, cy: 0, rx: 95, ry: 12, fill: '#000', opacity: .25 }, root);
    const body = g(root);
    const shorts = lin(defs, [[0, '#CDB58A'], [1, '#A88E62']], 1, 0);
    const legs = [0, 1].map(i => {
      const lg = limb(body, -8 + i * 6, -240, 112, 108, 34, 24, shorts, SKIN.base);
      const boot = g(lg.end);
      path(boot, 'M-14,-10 L-14,12 L34,14 C38,6 30,-2 18,-2 L12,-10 Z', '#3B2618');
      path(boot, 'M-14,10 L34,12', 'none', { stroke: '#1E140D', 'stroke-width': 4 });
      el('rect', { x: -15, y: -16, width: 30, height: 8, rx: 3, fill: '#EFE8DA' }, boot);          // sock
      return lg;
    });
    body.insertBefore(legs[1].a, legs[0].a);
    const shirt = lin(defs, [[0, '#7FA08A'], [1, C.canopy]], 1, 0);
    const torso = g(body);
    // backpack
    const pack = g(torso);
    path(pack, 'M-112,-436 C-124,-380 -122,-300 -108,-262 L-44,-262 C-38,-320 -40,-400 -52,-440 C-70,-452 -96,-450 -112,-436 Z', C.forest);
    path(pack, 'M-118,-360 L-104,-292 L-62,-292 L-60,-360 Z', '#173D30', { stroke: '#0B231B', 'stroke-width': 2 });
    path(pack, 'M-112,-436 C-100,-452 -70,-452 -52,-440 L-56,-420 C-74,-430 -98,-430 -110,-418 Z', '#0E2C22');
    el('rect', { x: -96, y: -334, width: 18, height: 10, rx: 2, fill: C.gold }, pack);
    path(pack, 'M-110,-300 h66', 'none', { stroke: '#0B231B', 'stroke-width': 3, 'stroke-dasharray': '4 4' });
    el('ellipse', { cx: -80, cy: -258, rx: 34, ry: 12, fill: '#4E7A62', stroke: '#173D30', 'stroke-width': 3 }, pack);  // bedroll
    path(torso, 'M-50,-430 C-66,-380 -66,-300 -56,-236 L46,-236 C56,-300 56,-380 40,-430 C16,-446 -30,-446 -50,-430 Z', shirt);
    path(torso, 'M-6,-440 L4,-400 L16,-440 Z', '#EFE8DA');
    el('rect', { x: 8, y: -392, width: 24, height: 22, rx: 3, fill: '#6E8F78', stroke: '#4E7A62', 'stroke-width': 2 }, torso);
    for (let i = 0; i < 4; i++) el('circle', { cx: 4, cy: -420 + i * 44, r: 2.5, fill: '#EFE8DA' }, torso);
    path(torso, 'M-48,-430 C-30,-360 -10,-300 26,-262', 'none', { stroke: '#3B2618', 'stroke-width': 6 });                // pack strap
    path(torso, 'M36,-428 C10,-360 -10,-320 -24,-276', 'none', { stroke: '#1B1512', 'stroke-width': 3 });                 // camera strap
    const cam = g(torso, { transform: 'translate(-34,-282)' });
    el('rect', { x: -20, y: -14, width: 40, height: 28, rx: 5, fill: '#1F2321' }, cam);
    el('circle', { cx: 6, cy: 0, r: 10, fill: '#3A403C', stroke: '#111', 'stroke-width': 2 }, cam);
    el('circle', { cx: 8, cy: -2, r: 3, fill: '#8FB3B8' }, cam);
    path(torso, 'M-56,-246 L46,-246 L46,-236 L-56,-236 Z', '#3B2618');                                                    // belt
    const arms = [0, 1].map(i => { const a = limb(i ? torso : body, -4, -418, 84, 78, 26, 21, shirt, SKIN.base); hand(a.end, 0, 4, 80); return a; });
    body.insertBefore(arms[0].a, torso);
    const hd = head(root, defs, {});
    const headG = g(root); headG.appendChild(hd.g);
    const hat = g(hd.g);
    path(hat, 'M-58,-32 C-30,-46 30,-50 62,-34 C40,-28 -30,-26 -58,-32 Z', '#B89B66');
    path(hat, 'M-34,-36 C-36,-72 30,-78 34,-40 C10,-46 -12,-44 -34,-36 Z', C.savannah);
    path(hat, 'M-34,-40 C-12,-48 12,-50 34,-44 L34,-38 C12,-44 -12,-42 -34,-34 Z', C.forest);
    return {
      g: root, update(t, walking = 1) {
        const ph = t * 2 * Math.PI / .95;
        const s0 = Math.sin(ph), s1 = Math.sin(ph + Math.PI);
        const bob = 5 * Math.abs(Math.cos(ph)) * walking;
        legs[0].set(-26 * s0 * walking, Math.max(0, 38 * Math.sin(ph + 1.3)) * walking);
        legs[1].set(-26 * s1 * walking, Math.max(0, 38 * Math.sin(ph + Math.PI + 1.3)) * walking);
        arms[0].set(22 * s0 * walking - 4, -14 - 10 * walking);
        arms[1].set(22 * s1 * walking - 4, -14 - 10 * walking);
        tf(body, `translate(0,${-bob})`);
        tf(headG, `translate(8,${-470 - bob}) rotate(${2 * Math.sin(ph * 2)}) scale(1.28)`);
      },
    };
  }

  // ======================================================================= BUSINESSWOMAN (gele, blazer, tablet)
  function professional(p, defs) {
    const root = g(p);
    el('ellipse', { cx: 0, cy: 0, rx: 100, ry: 12, fill: '#000', opacity: .22 }, root);
    const body = g(root);
    for (const x of [-26, 10]) {
      el('rect', { x, y: -150, width: 18, height: 140, rx: 8, fill: SKIN.base }, body);
      path(body, `M${x - 4},-12 L${x + 24},-12 L${x + 30},-2 L${x - 4},-2 Z`, '#1B201E');
      el('rect', { x: x + 14, y: -12, width: 4, height: 12, fill: '#1B201E' }, body);
    }
    path(body, 'M-50,-268 C-56,-210 -54,-170 -46,-140 L46,-140 C54,-170 56,-210 50,-268 Z', C.charcoal);                 // skirt
    const blazer = lin(defs, [[0, C.ridge], [1, C.forest]], 1, 0);
    const torso = g(body);
    path(torso, 'M-56,-432 C-74,-390 -72,-300 -62,-252 C-20,-242 24,-242 58,-252 C66,-300 66,-392 48,-432 C22,-448 -30,-448 -56,-432 Z', blazer);
    path(torso, 'M-14,-440 L4,-330 L20,-440 Z', '#F5F0E6');                                                                // blouse
    path(torso, 'M-14,-440 L-30,-392 L-6,-380 L4,-330 Z', '#0B231B', { opacity: .55 });                                    // lapel
    path(torso, 'M20,-440 L34,-394 L12,-380 L4,-330 Z', '#0B231B', { opacity: .4 });
    el('circle', { cx: 4, cy: -300, r: 4, fill: C.gold }, torso);
    el('circle', { cx: 4, cy: -276, r: 4, fill: C.gold }, torso);
    path(torso, 'M26,-400 l12,4', 'none', { stroke: C.gold, 'stroke-width': 3 });                                          // pin
    // tablet arm (back) and gesture arm (front)
    const back = limb(root, -30, -420, 80, 70, 28, 21, blazer, SKIN.base);
    back.set(8, -78);
    const tab = g(back.end, { transform: 'translate(-4,4) rotate(70)' });
    el('rect', { x: -34, y: -50, width: 68, height: 96, rx: 8, fill: '#1B201E' }, tab);
    el('rect', { x: -28, y: -44, width: 56, height: 84, rx: 4, fill: lin(defs, [[0, '#CFE0DA'], [1, C.sage]], 0, 1) }, tab);
    path(tab, 'M-22,24 L-8,10 L4,16 L22,-14', 'none', { stroke: C.forest, 'stroke-width': 3, 'stroke-linecap': 'round' });
    el('circle', { cx: 22, cy: -14, r: 4, fill: C.gold }, tab);
    hand(back.end, 0, 6, 60);
    const front = limb(root, 30, -420, 82, 74, 28, 21, blazer, SKIN.base);
    const fh = hand(front.end, 0, 4, 90);
    const hd = head(root, defs, { earring: true });
    const headG = g(root); headG.appendChild(hd.g);
    const gele = g(hd.g);
    const gf = lin(defs, [[0, '#F6CD72'], [1, '#B97C14']], 1, 1);
    path(gele, 'M-36,-28 C-52,-60 -40,-96 -4,-102 C30,-106 52,-78 40,-40 C14,-50 -12,-48 -36,-28 Z', gf);
    for (let i = 0; i < 5; i++) path(gele, `M${-30 + i * 14},-34 C${-40 + i * 14},-70 ${-20 + i * 16},-96 ${4 + i * 10},-100`, 'none', { stroke: '#9A6510', 'stroke-width': 2, opacity: .5 });
    path(gele, 'M-40,-60 C-70,-70 -76,-40 -50,-30 C-46,-40 -42,-50 -40,-60 Z', '#D99A2B');
    path(gele, 'M-36,-28 C-12,-48 14,-50 40,-40 L38,-34 C14,-44 -12,-42 -34,-22 Z', C.forest);
    return {
      g: root, update(t, gestureAt = 0) {
        const gk = sm(gestureAt, gestureAt + .6, t);
        front.set(-30 - 110 * gk + 6 * Math.sin(t * 3) * gk, -30 + 20 * gk + 10 * Math.sin(t * 4) * gk);
        const blink = ((t % 3.1) < .12) ? .1 : 1;
        tf(hd.eye, `translate(22,-21) scale(1,${blink})`);
        tf(headG, `translate(6,${-478}) rotate(${-3 * gk + 1.5 * Math.sin(t * 1.3)}) scale(1.28)`);
        tf(body, `translate(0,${-2 * Math.sin(t * 2)})`);
      },
    };
  }

  // ======================================================================= scenery
  function palm(p, defs, h = 420, lean = 8) {
    const root = g(p);
    const trunk = lin(defs, [[0, '#7A5A3A'], [1, '#4E3622']], 1, 0);
    const tx = Math.tan(lean * Math.PI / 180) * h;
    path(root, `M-12,0 C-10,${-h * .4} ${tx * .5 - 8},${-h * .8} ${tx - 6},${-h} L${tx + 6},${-h} C${tx * .5 + 8},${-h * .8} 10,${-h * .4} 14,0 Z`, trunk);
    for (let i = 1; i < 16; i++) { const k = i / 16, x = tx * k * k; path(root, `M${x - 11 + k * 4},${-h * k} q11,6 ${22 - k * 8},0`, 'none', { stroke: '#3A281A', 'stroke-width': 2 }); }
    const crown = g(root, { transform: `translate(${tx},${-h})` });
    const fronds = [];
    for (let i = 0; i < 9; i++) {
      const a = -170 + i * 40 + (i % 2) * 8, L = 150 + (i % 3) * 25;
      const f = g(crown);
      const ca = Math.cos(a * Math.PI / 180), sa = Math.sin(a * Math.PI / 180);
      const ex = ca * L, ey = sa * L * .55 + L * .45, mx = ca * L * .5, my = sa * L * .5 - 30;
      path(f, `M0,0 Q${mx},${my} ${ex},${ey}`, 'none', { stroke: '#2C5040', 'stroke-width': 4 });
      let leaf = '';
      for (let k = 1; k < 18; k++) {
        const s = k / 18, x = 2 * (1 - s) * s * mx + s * s * ex, y = 2 * (1 - s) * s * my + s * s * ey;
        const nx = -(ey - 0), ny = ex; const nl = Math.hypot(nx, ny) || 1, ll = 34 * Math.sin(s * Math.PI) + 6;
        leaf += `M${x.toFixed(1)},${y.toFixed(1)} l${(nx / nl * ll + 8).toFixed(1)},${(ny / nl * ll + 16).toFixed(1)} M${x.toFixed(1)},${y.toFixed(1)} l${(-nx / nl * ll + 8).toFixed(1)},${(-ny / nl * ll + 16).toFixed(1)} `;
      }
      path(f, leaf, 'none', { stroke: i % 2 ? '#3E6B52' : '#2C5040', 'stroke-width': 3.2, 'stroke-linecap': 'round' });
      fronds.push([f, i]);
    }
    for (let i = 0; i < 4; i++) el('circle', { cx: -8 + i * 6, cy: 10 + (i % 2) * 6, r: 8, fill: '#B4532A' }, crown);
    return { g: root, update(t) { fronds.forEach(([f, i]) => tf(f, `rotate(${3 * Math.sin(t * 1.4 + i * .7)})`)); } };
  }

  function acacia(p, s = 1, col = '#1A3A2E') {
    const r = g(p, { transform: `scale(${s})` });
    path(r, 'M-6,0 C-4,-40 -10,-80 -30,-110 M2,0 C4,-50 12,-90 40,-118 M0,-60 C10,-80 20,-96 6,-120', 'none', { stroke: col, 'stroke-width': 7, 'stroke-linecap': 'round' });
    path(r, 'M-90,-112 C-80,-140 -20,-150 0,-138 C30,-156 90,-148 100,-120 C80,-104 -60,-100 -90,-112 Z', col);
    return r;
  }

  function bird(p, color = '#1B201E') {
    const b = el('path', { fill: 'none', stroke: color, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, p);
    return { g: b, set(x, y, s, flap) { b.setAttribute('d', `M${x - 16 * s},${y - 9 * s * flap} Q${x - 7 * s},${y - 4 * s * flap} ${x},${y} Q${x + 7 * s},${y - 4 * s * flap} ${x + 16 * s},${y - 9 * s * flap}`); } };
  }

  function elephant(p, defs) {
    const root = g(p);
    const skin = lin(defs, [[0, '#8A847A'], [1, '#5E5A53']], 0, 1);
    const legs = [[-70, 0], [-30, 1], [50, 1], [86, 0]].map(([x, ph]) => {
      const lg = g(root, { transform: `translate(${x},-80)` });
      el('rect', { x: -16, y: 0, width: 32, height: 84, rx: 10, fill: ph ? '#6E6961' : '#5A564F' }, lg);
      path(lg, 'M-16,74 h32 v10 h-32 Z', '#4A463F');
      return [lg, x, ph];
    });
    path(root, 'M-110,-90 C-120,-150 -80,-196 0,-200 C70,-204 110,-170 116,-120 C120,-90 100,-70 60,-66 L-80,-66 C-104,-66 -110,-78 -110,-90 Z', skin);
    path(root, 'M-90,-110 C-60,-96 40,-92 100,-110', 'none', { stroke: '#4F4B45', 'stroke-width': 2, opacity: .6 });
    const headG = g(root, { transform: 'translate(112,-150)' });
    path(headG, 'M-20,-50 C20,-70 64,-40 62,0 C60,26 40,40 20,38 C0,36 -24,10 -20,-50 Z', skin);
    const ear = path(headG, 'M-6,-46 C-50,-60 -66,-10 -46,24 C-30,40 -6,30 -2,10 Z', '#7C766D', { stroke: '#4F4B45', 'stroke-width': 2 });
    el('circle', { cx: 34, cy: -14, r: 3.5, fill: '#1B1512' }, headG);
    const trunk = path(headG, '', 'none', { stroke: '#6E6961', 'stroke-width': 22, 'stroke-linecap': 'round' });
    const wr = path(headG, '', 'none', { stroke: '#4F4B45', 'stroke-width': 2, 'stroke-dasharray': '2 9' });
    path(headG, 'M44,22 C62,34 76,30 84,18', 'none', { stroke: '#F5F0E6', 'stroke-width': 7, 'stroke-linecap': 'round' });
    return {
      g: root, update(t) {
        const ph = t * 2 * Math.PI / 1.6;
        legs.forEach(([lg, x, k]) => tf(lg, `translate(${x},-80) rotate(${10 * Math.sin(ph + k * Math.PI)})`));
        const sw = Math.sin(ph * .5);
        const d = `M48,10 C56,${50 + 6 * sw} ${50 + 10 * sw},${84} ${40 + 18 * sw},${104} `;
        trunk.setAttribute('d', d); wr.setAttribute('d', d);
        tf(ear, `rotate(${5 * Math.sin(ph * .7)} -6 -10)`);
        tf(root.firstChild, '');
      },
    };
  }

  function inselberg(p, defs, w, h, lightFromRight = true) {
    // granite inselberg: steep asymmetric dome, a lower shoulder, exfoliation sheets and dark water streaks
    const r = g(p);
    const fill = lin(defs, lightFromRight ? [[0, '#16302A'], [.55, '#2A4A3C'], [.88, '#5E6A4E'], [1, '#C9A25A']] : [[0, '#C9A25A'], [.45, '#2A4A3C'], [1, '#16302A']], 1, 0);
    const sh = `M${w * .18},0 C${w * .26},${-h * .42} ${w * .44},${-h * .55} ${w * .56},${-h * .38} C${w * .64},${-h * .24} ${w * .66},${-h * .1} ${w * .68},0 Z`;
    path(r, sh, lin(defs, [[0, '#1C3A30'], [.7, '#38533F'], [1, '#B58E4E']], 1, 0));
    const d = `M${-w * .5},0 C${-w * .49},${-h * .38} ${-w * .44},${-h * .78} ${-w * .3},${-h * .94} C${-w * .16},${-h * 1.04} ${w * .1},${-h * 1.03} ${w * .24},${-h * .9} C${w * .36},${-h * .78} ${w * .42},${-h * .45} ${w * .44},0 Z`;
    path(r, d, fill);
    const cid = id('ins'); const cp = el('clipPath', { id: cid }, defs); el('path', { d }, cp);
    const det = g(r, { 'clip-path': `url(#${cid})` });
    for (const [s, o] of [[.88, .35], [.74, .28], [.6, .22], [.46, .16]]) {
      path(det, `M${-w * .49 * s},${-h * .38 * s} C${-w * .44 * s},${-h * .78 * s} ${-w * .3 * s},${-h * .94 * s} ${-w * .05 * s},${-h * 1.0 * s} C${w * .12 * s},${-h * 1.02 * s} ${w * .3 * s},${-h * .84 * s} ${w * .4 * s},${-h * .5 * s}`,
        'none', { stroke: '#E4D3A8', 'stroke-width': 2, opacity: o * .45, transform: `translate(0,${-h * (1 - s) * .25})` });
    }
    const streaks = [[-.32, .9, .5, 10], [-.2, .97, .62, 16], [-.06, 1.0, .7, 9], [.06, .99, .55, 14], [.17, .93, .66, 11], [.28, .82, .4, 8], [-.4, .72, .45, 7]];
    for (const [x, top, len, sw] of streaks) {
      const X = w * x, Y = -h * top, L = h * len, S = sw * w / 900;
      path(det, `M${X - S},${Y} C${X - S * .2},${Y + L * .4} ${X - S * 1.4},${Y + L * .7} ${X - S * .4},${Y + L} L${X + S * .5},${Y + L} C${X + S},${Y + L * .6} ${X + S * .4},${Y + L * .3} ${X + S},${Y} Z`, '#1C2A23', { opacity: .32 });
    }
    path(det, `M${-w * .25},${-h * .62} C${-w * .12},${-h * .66} ${w * .05},${-h * .64} ${w * .2},${-h * .55}`, 'none', { stroke: '#22362C', 'stroke-width': 3, opacity: .45 });
    let bush = `M${-w * .62},6`;
    for (let x = -w * .62; x < w * .74; x += w * .045) { const hh = 14 + 26 * Math.abs(Math.sin(x * 7.3 / w)) + 10 * Math.abs(Math.sin(x * 19 / w)); bush += ` Q${x + w * .02},${-hh * 1.6} ${x + w * .045},${-hh * .4}`; }
    path(r, bush + ` L${w * .74},10 L${-w * .62},10 Z`, '#163A2E');
    let bush2 = `M${-w * .55},8`;
    for (let x = -w * .55; x < w * .6; x += w * .06) { const hh = 8 + 18 * Math.abs(Math.sin(x * 5.1 / w + 1)); bush2 += ` Q${x + w * .03},${-hh * 1.5} ${x + w * .06},${-hh * .2}`; }
    path(r, bush2 + ` L${w * .6},10 L${-w * .55},10 Z`, '#0F2C22');
    return r;
  }

  function stringLights(p, defs, x1, x2, y, sag, n) {
    const r = g(p);
    path(r, `M${x1},${y} Q${(x1 + x2) / 2},${y + 2 * sag} ${x2},${y}`, 'none', { stroke: '#1B1512', 'stroke-width': 2 });
    const glow = rad(defs, [[0, '#FFE2A0', .9], [1, '#FFE2A0', 0]]);
    const bulbs = [];
    for (let i = 1; i < n; i++) {
      const k = i / n, x = (1 - k) * (1 - k) * x1 + 2 * (1 - k) * k * (x1 + x2) / 2 + k * k * x2, yy = (1 - k) * (1 - k) * y + 2 * (1 - k) * k * (y + 2 * sag) + k * k * y;
      const gl = el('circle', { cx: x, cy: yy + 8, r: 26, fill: glow }, r);
      const b = el('circle', { cx: x, cy: yy + 8, r: 6, fill: i % 3 ? '#FFD27A' : C.gold }, r);
      bulbs.push([gl, b, i]);
    }
    return { g: r, update(t) { bulbs.forEach(([gl, b, i]) => { const v = .65 + .35 * Math.sin(t * 3 + i * 1.7); gl.setAttribute('opacity', v); }); } };
  }

  function waterfall(p, defs, w, h) {
    const r = g(p);
    path(r, `M${-w * .9},0 L${-w * .8},${-h} L${-w * .45},${-h * 1.08} L${-w * .5},0 Z`, '#3E4F44');
    path(r, `M${w * .5},0 L${w * .45},${-h * 1.05} L${w * .85},${-h * .96} L${w * .95},0 Z`, '#35463C');
    path(r, `M${-w * .8},${-h} L${-w * .45},${-h * 1.08} L${-w * .55},${-h * .7} Z`, '#55695B', { opacity: .7 });
    const water = lin(defs, [[0, '#D7ECEA'], [1, '#9FC8C4']], 0, 1);
    el('rect', { x: -w * .5, y: -h * 1.06, width: w, height: h * 1.06, fill: water }, r);
    const strands = [...Array(16)].map((_, i) => el('path', { d: `M${-w * .48 + i * w * .064},${-h * 1.06} L${-w * .48 + i * w * .064 + (i % 3 - 1) * 4},0`, stroke: '#FFFFFF', 'stroke-width': 3 + (i % 3), 'stroke-opacity': .55, 'stroke-dasharray': `${30 + i % 4 * 12} ${20 + i % 5 * 8}`, fill: 'none' }, r));
    const mist = el('ellipse', { cx: 0, cy: -10, rx: w * .9, ry: 40, fill: '#FFFFFF', opacity: .55, filter: blur(defs, 12) }, r);
    return { g: r, update(t) { strands.forEach((s, i) => s.setAttribute('stroke-dashoffset', -t * (260 + i * 12))); mist.setAttribute('ry', 40 + 8 * Math.sin(t * 3)); } };
  }

  window.DNIL = { el, g, path, id, tf, lin, rad, blur, adire, wax, head, hand, limb, drummer, dancer, traveller, professional, palm, acacia, bird, elephant, inselberg, stringLights, waterfall, SKIN, sm, clamp };
})();
