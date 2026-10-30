// Destination Nigeria v2 motion helpers: SVG stage, easing, the engraved plate and the logo's own drawing.
// Used by H_logo-reveal, I_logo-sting and J_plate-loop. No blooms, rings, wipes or particles.
(function () {
  const Q = new URLSearchParams(location.search);
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs = {}, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; };
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const seg = (t, a, b, e = x => x) => e(clamp((t - a) / (b - a)));
  const lerp = (a, b, k) => a + (b - a) * k;
  const E = { out: x => 1 - Math.pow(1 - x, 3), inOut: x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2 };
  const C = { forest: '#103428', ridge: '#2C5040', gold: '#E8A432', ivory: '#F5F0E6', white: '#FFFFFF', stone: '#5F6662', sage: '#A9BFA9' };
  function stage() {
    const W = +(Q.get('w') || 1920), H = +(Q.get('h') || 1080);
    const dark = Q.get('theme') === 'dark', transparent = Q.has('transparent');
    document.body.style.cssText = `margin:0;overflow:hidden;width:${W}px;height:${H}px;background:${transparent ? 'transparent' : (dark ? C.forest : C.ivory)}`;
    const svg = el('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}` }, document.body);
    svg.style.display = 'block';
    const defs = el('defs', {}, svg);
    if (!transparent) el('rect', { width: W, height: H, fill: dark ? C.forest : C.ivory }, svg);
    return { svg, defs, W, H, dark, transparent, u: Math.min(W, H) / 1080, Q };
  }
  // the logo, built from the master paths; parts animate independently, geometry never changes
  function Logo(parent, defs, x, y, w, dark) {
    const cw = dark ? DN.colourways.reversed : DN.colourways.fullcolour;
    const tone = n => n === 'sun' ? cw.sun : n === 'horizon' ? cw.hz : n === 'horizon_small' ? cw.hzs : (n === 'monolith' || n === 'ridge') ? cw.mt : cw.word;
    const s = w / 150.25;
    const g = el('g', { transform: `translate(${x},${y}) scale(${s})` }, parent);
    const cid = 'lc' + Math.random().toString(36).slice(2, 7);
    const cp = el('clipPath', { id: cid }, defs); const r = el('rect', { x: 25, y: -5, height: 32, width: 0 }, cp);
    const land = el('g', { 'clip-path': `url(#${cid})` }, g);
    ['horizon', 'horizon_small', 'ridge', 'monolith'].forEach(n => el('path', { d: DN.paths[n], fill: tone(n) }, land));
    const sun = el('g', {}, g); el('path', { d: DN.paths.sun, fill: cw.sun }, sun);
    const word = el('g', {}, g);
    ['D', 'e', 's', 'ti', 'idot1', 'n1', 'a', 't', 'i', 'idot2', 'o', 'n2', 'N', 'I', 'G', 'E', 'R', 'I2', 'A'].forEach(n => el('path', { d: DN.paths[n], fill: tone(n) }, word));
    return {
      g, s, horizonY: y + 21.4 * s, bottom: y + 59.06 * s,
      land(k) { r.setAttribute('width', k * 105); },
      sun(k) { sun.setAttribute('opacity', k); sun.setAttribute('transform', `translate(104.07,${6.62 + (1 - k) * 5}) scale(${lerp(.55, 1, k)}) translate(-104.07,-6.62)`); },
      word(k) { word.setAttribute('opacity', k); word.setAttribute('transform', `translate(0,${(1 - k) * 3})`); },
    };
  }
  // an engraved plate whose strokes are cut one by one (both edges grow from the stroke's start)
  function Plate(parent, data, rect, ink) {
    const g = el('g', { transform: `translate(${rect.x},${rect.y}) scale(${rect.w / data.w})` }, parent);
    const N = data.polys.length;
    const P = data.polys.map(d => el('path', { d, fill: ink, 'fill-opacity': 0, stroke: ink, 'stroke-width': 1.3, pathLength: 1, 'stroke-dasharray': '0 1' }, g));
    return {
      g, N,
      progress(i, p) {
        const n = P[i];
        if (p <= 0) { n.setAttribute('stroke-opacity', 0); n.setAttribute('fill-opacity', 0); return; }
        n.setAttribute('stroke-opacity', 1);
        if (p >= 1) { n.setAttribute('stroke-dasharray', 'none'); n.setAttribute('fill-opacity', 1); return; }
        const h = p / 2; n.setAttribute('stroke-dasharray', `${h} ${1 - 2 * h} ${h} 0`); n.setAttribute('fill-opacity', p * p * p);
      },
      engrave(t, a, b, each, reverse = false) {
        const span = (b - a) - each;
        for (let i = 0; i < N; i++) {
          const k = reverse ? N - 1 - i : i;
          const s0 = a + span * (k / N);
          const p = seg(t, s0, s0 + each, E.out);
          this.progress(i, reverse ? 1 - p : p);
        }
      },
    };
  }
  window.DN2 = { el, clamp, seg, lerp, E, C, stage, Logo, Plate, Q };
})();
