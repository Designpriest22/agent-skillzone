// Destination Nigeria motion runtime — deterministic, seekable compositions.
// Every composition exposes window.renderAt(seconds), window.DURATION and window.FPS.
// Open any composition in a browser to preview; add ?scrub to get a timeline slider.
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const q = new URLSearchParams(location.search);
  const P = {
    w: +q.get('w') || 1920, h: +q.get('h') || 1080,
    theme: q.get('theme') || 'dark', transparent: q.get('transparent') === '1', logo: q.get('logo') !== '0',
  };
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const E = {
    linear: t => t,
    outCubic: t => 1 - Math.pow(1 - t, 3),
    inOutCubic: t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    outExpo: t => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    inOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
    outBack: t => { const c1 = 1.25, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  };
  const seg = (t, a, b, ease = E.inOutCubic) => ease(clamp((t - a) / (b - a)));

  function el(tag, attrs = {}, parent) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  let uid = 0;
  const id = p => `${p}${++uid}`;

  function stage() {
    document.body.style.cssText = `margin:0;background:${P.transparent ? 'transparent' : '#000'};overflow:hidden`;
    const svg = el('svg', { viewBox: `0 0 ${P.w} ${P.h}`, width: P.w, height: P.h });
    svg.style.display = 'block';
    document.body.appendChild(svg);
    const defs = el('defs', {}, svg);
    return { svg, defs };
  }

  const tone = (name, cw) => name === 'sun' ? cw.sun : name === 'horizon' ? cw.hz : name === 'horizon_small' ? cw.hzs
    : (name === 'monolith' || name === 'ridge') ? cw.mt : cw.word;

  // Builds the official logo from the supplied geometry, in addressable layers.
  function logo(parent, defs, cw, opts = {}) {
    const root = el('g', {}, parent);
    const L = {};
    const land = el('g', {}, root);
    const outline = el('g', { fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, root);
    L.outlines = {};
    for (const n of ['horizon', 'horizon_small', 'ridge', 'monolith']) {
      L[n] = el('path', { d: DN.paths[n], fill: tone(n, cw) }, land);
      L.outlines[n] = el('path', { d: DN.paths[n], pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1,
        stroke: (opts.outline || {})[n] || tone(n, cw), 'stroke-width': opts.outlineWidth || .3 }, outline);
    }
    L.land = land; L.outline = outline;
    L.sunWrap = el('g', {}, root);
    L.bloom = null;
    if (opts.bloom) {
      const g = id('bloom');
      const rg = el('radialGradient', { id: g }, defs);
      el('stop', { offset: 0, 'stop-color': DN.C.gold, 'stop-opacity': .9 }, rg);
      el('stop', { offset: .35, 'stop-color': DN.C.gold, 'stop-opacity': .35 }, rg);
      el('stop', { offset: 1, 'stop-color': DN.C.gold, 'stop-opacity': 0 }, rg);
      L.bloom = el('circle', { cx: 104.07, cy: 6.62, r: 26, fill: `url(#${g})`, opacity: 0 }, L.sunWrap);
    }
    L.sun = el('path', { d: DN.paths.sun, fill: cw.sun }, L.sunWrap);
    // wordmark with a soft left-to-right wipe mask
    const mid = id('wipe'), gid = id('wipeg');
    const lg = el('linearGradient', { id: gid, x1: 0, x2: 1, y1: 0, y2: 0 }, defs);
    el('stop', { offset: .45, 'stop-color': '#fff' }, lg); el('stop', { offset: .55, 'stop-color': '#000' }, lg);
    const m = el('mask', { id: mid, maskUnits: 'userSpaceOnUse', x: -400, y: -50, width: 800, height: 200 }, defs);
    L.wipe = el('rect', { x: -195, y: -20, width: 340, height: 100, fill: `url(#${gid})` }, m);
    L.word = el('g', { mask: `url(#${mid})` }, root);
    for (const n of DN.word) el('path', { d: DN.paths[n], fill: cw.word }, L.word);
    L.nigeria = el('g', {}, root);
    for (const n of DN.nigeria) el('path', { d: DN.paths[n], fill: cw.word }, L.nigeria);
    L.root = root;
    return L;
  }

  // EXPERIENCE. INVEST. EXPLORE. (outlined Inter SemiBold, gold sun-dot full stops)
  function campaign(parent, color, dot) {
    const root = el('g', {}, parent);
    const words = DN.campaign.words.map(w => {
      const g = el('g', {}, root);
      el('path', { d: w.d, fill: color }, g);
      const dg = el('g', { transform: `translate(${w.dot[0]},${w.dot[1]})` }, root);
      const c = el('circle', { cx: 0, cy: 0, r: w.dot[2], fill: dot }, dg);
      return { g, c };
    });
    return { root, words, width: DN.campaign.width, cap: DN.campaign.cap };
  }

  function roundel(parent, defs, bg, cw) {
    const { cx, cy, r } = DN.roundel;
    const root = el('g', {}, parent);
    const disc = el('circle', { cx, cy, r, fill: bg }, root);
    const cid = id('clip');
    const cp = el('clipPath', { id: cid }, defs);
    el('circle', { cx, cy, r }, cp);
    const inner = el('g', { 'clip-path': `url(#${cid})` }, root);
    const hz = el('g', {}, inner), mt = el('g', {}, inner);
    const outlines = {};
    for (const n of ['horizon', 'horizon_small']) {
      el('path', { d: DN.paths[n], fill: tone(n, cw) }, hz);
      outlines[n] = el('path', { d: DN.paths[n], pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1, fill: 'none',
        stroke: tone(n, cw), 'stroke-width': .35, 'stroke-linecap': 'round' }, inner);
    }
    for (const n of ['monolith', 'ridge']) el('path', { d: DN.paths[n], fill: tone(n, cw) }, mt);
    const sunWrap = el('g', {}, inner);
    const sun = el('path', { d: DN.paths.sun, fill: cw.sun }, sunWrap);
    return { root, disc, hz, mt, sunWrap, sun, outlines, cx, cy, r };
  }

  function bgGradient(svg, defs, stops, cx = .5, cy = .45, r = .8) {
    const g = id('bg');
    const rg = el('radialGradient', { id: g, cx, cy, r }, defs);
    stops.forEach(([o, c, a]) => el('stop', { offset: o, 'stop-color': c, 'stop-opacity': a ?? 1 }, rg));
    return el('rect', { width: P.w, height: P.h, fill: `url(#${g})` }, svg);
  }

  function scrubber() {
    if (!q.has('scrub')) return;
    const s = document.createElement('input');
    s.type = 'range'; s.min = 0; s.max = window.DURATION; s.step = 1 / window.FPS; s.value = 0;
    s.style.cssText = 'position:fixed;left:2%;bottom:12px;width:96%';
    s.oninput = () => window.renderAt(+s.value);
    document.body.appendChild(s);
    let t0 = performance.now();
    if (q.has('play')) (function loop() { window.renderAt(((performance.now() - t0) / 1000) % window.DURATION); requestAnimationFrame(loop); })();
  }

  window.DNM = { P, E, seg, lerp, clamp, el, id, stage, logo, campaign, roundel, bgGradient, scrubber };
})();
