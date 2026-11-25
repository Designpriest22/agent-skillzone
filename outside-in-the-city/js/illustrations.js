/* ============================================================================
   OUTSIDE IN THE CITY — Abuja landmark system (restrained + architectural)
   ----------------------------------------------------------------------------
   No photographic pastiche, no bokeh, no grain. The imagery is a precise set of
   Abuja's real landmarks — Aso Rock, the National Mosque (dome + four minarets),
   the National Christian Centre spire, and Central Business District towers —
   drawn as clean gold line-work and solid forms with generous negative space.
   Everything is deterministic, so preview and export are identical.
   ========================================================================== */

let _oicUid = 0;
function oicUid(p) { _oicUid++; return (p || 'g') + '_' + _oicUid; }

function oicLinGrad(id, stops, horizontal) {
  const c = horizontal ? 'x1="0" y1="0" x2="1" y2="0"' : 'x1="0" y1="0" x2="0" y2="1"';
  return `<linearGradient id="${id}" ${c}>` +
    stops.map(s => `<stop offset="${s[0]}" stop-color="${s[1]}" stop-opacity="${s[2] == null ? 1 : s[2]}"/>`).join('') +
    `</linearGradient>`;
}
function oicOrb(cx, cy, r, color, inner) {
  const id = oicUid('orb');
  return `<defs><radialGradient id="${id}" cx="50%" cy="50%" r="50%">` +
    `<stop offset="0%" stop-color="${color}" stop-opacity="${inner == null ? 0.5 : inner}"/>` +
    `<stop offset="100%" stop-color="${color}" stop-opacity="0"/></radialGradient></defs>` +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id})"/>`;
}
function oicScrim(w, h, fromY, color, maxOp) {
  const id = oicUid('scr'); const c = color || '#060606'; const op = maxOp == null ? 0.9 : maxOp;
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="${(fromY / h * 100).toFixed(1)}%" stop-color="${c}" stop-opacity="0"/>` +
    `<stop offset="100%" stop-color="${c}" stop-opacity="${op}"/></linearGradient></defs>` +
    `<rect width="${w}" height="${h}" fill="url(#${id})"/>`;
}

/* ---- drawing helper: outline in line / solid mode -------------------------- */
function _oicShape(d, o) {
  if (o.mode === 'solid') return `<path d="${d}" fill="${o.color}" fill-opacity="${o.opacity == null ? 1 : o.opacity}"/>`;
  return `<path d="${d}" fill="${o.fill || 'none'}" stroke="${o.color}" stroke-width="${o.sw}" stroke-linejoin="round" stroke-linecap="round" opacity="${o.opacity == null ? 1 : o.opacity}"/>`;
}

/* ---- individual landmarks (sit on baseY) ---------------------------------- */
/* Central Business District tower */
function oicTower(x, baseY, w, h, o) {
  const top = baseY - h;
  const crownW = w * 0.42, cx = x + w / 2;
  let d = `M${x} ${baseY} L${x} ${top} L${x + w} ${top} L${x + w} ${baseY} Z`;
  let s = _oicShape(d, o);
  // crown + mast
  s += _oicShape(`M${cx - crownW / 2} ${top} L${cx - crownW / 2} ${top - h * 0.06} L${cx + crownW / 2} ${top - h * 0.06} L${cx + crownW / 2} ${top}`, o);
  s += `<path d="M${cx} ${top - h * 0.06} L${cx} ${top - h * 0.16}" stroke="${o.color}" stroke-width="${o.sw}" opacity="${o.opacity == null ? 1 : o.opacity}"/>`;
  // slim mullions
  if (o.detail !== false) {
    const n = Math.max(2, Math.round(w / 16));
    let m = `<g stroke="${o.color}" stroke-width="${Math.max(0.6, o.sw * 0.5)}" opacity="${(o.opacity == null ? 1 : o.opacity) * 0.5}">`;
    for (let i = 1; i < n; i++) m += `<path d="M${x + (w / n) * i} ${top + h * 0.05} L${x + (w / n) * i} ${baseY}"/>`;
    m += `</g>`;
    s += m;
  }
  return s;
}

/* National Mosque — drum + dome + finial + four minarets */
function oicMosque(cx, baseY, s, o) {
  const drumW = 2.3 * s, drumTop = baseY - 2.4 * s;
  const domeH = 1.9 * s, domeW = 1.35 * s;
  let g = '';
  function minaret(mx, hgt) {
    const w = 0.44 * s, top = baseY - hgt;
    let d = `M${mx - w / 2} ${baseY} L${mx - w / 2} ${top} L${mx + w / 2} ${top} L${mx + w / 2} ${baseY} Z`;
    let m = _oicShape(d, o);
    // onion cap + spike
    m += _oicShape(`M${mx - w * 0.6} ${top} Q ${mx} ${top - w * 1.6} ${mx + w * 0.6} ${top} Z`, o);
    m += `<path d="M${mx} ${top - w * 1.2} L${mx} ${top - w * 2.2}" stroke="${o.color}" stroke-width="${o.sw}"/>`;
    return m;
  }
  // low connecting wall
  g += _oicShape(`M${cx - 3.4 * s} ${baseY} L${cx - 3.4 * s} ${baseY - 0.8 * s} L${cx + 3.4 * s} ${baseY - 0.8 * s} L${cx + 3.4 * s} ${baseY} Z`, o);
  g += minaret(cx - 3.0 * s, 3.4 * s) + minaret(cx + 3.0 * s, 3.4 * s);
  g += minaret(cx - 1.95 * s, 4.3 * s) + minaret(cx + 1.95 * s, 4.3 * s);
  // drum
  g += _oicShape(`M${cx - drumW / 2} ${baseY} L${cx - drumW / 2} ${drumTop} L${cx + drumW / 2} ${drumTop} L${cx + drumW / 2} ${baseY} Z`, o);
  // dome (onion)
  g += _oicShape(`M${cx - domeW} ${drumTop} C ${cx - domeW} ${drumTop - domeH * 0.8} ${cx - domeW * 0.5} ${drumTop - domeH} ${cx} ${drumTop - domeH} C ${cx + domeW * 0.5} ${drumTop - domeH} ${cx + domeW} ${drumTop - domeH * 0.8} ${cx + domeW} ${drumTop} Z`,
    o.mode === 'line' ? o : { mode: 'solid', color: o.domeFill || o.color, opacity: o.opacity });
  // finial
  g += `<path d="M${cx} ${drumTop - domeH} L${cx} ${drumTop - domeH - 0.9 * s}" stroke="${o.color}" stroke-width="${o.sw}"/>`;
  g += `<circle cx="${cx}" cy="${drumTop - domeH - 1.1 * s}" r="${0.22 * s}" fill="${o.color}"/>`;
  return g;
}

/* National Christian Centre — slender concave spire + cross + nave */
function oicChurch(cx, baseY, s, o) {
  const spireH = 6.2 * s, baseH = 1.1 * s, baseW = 2.6 * s;
  let g = '';
  // nave base
  g += _oicShape(`M${cx - baseW / 2} ${baseY} L${cx - baseW / 2} ${baseY - baseH} L${cx + baseW / 2} ${baseY - baseH} L${cx + baseW / 2} ${baseY} Z`, o);
  // concave tapering spire
  g += _oicShape(`M${cx - 0.62 * s} ${baseY - baseH} Q ${cx - 0.26 * s} ${baseY - spireH * 0.55} ${cx} ${baseY - spireH} Q ${cx + 0.26 * s} ${baseY - spireH * 0.55} ${cx + 0.62 * s} ${baseY - baseH} Z`, o);
  // small flanking pinnacles
  g += _oicShape(`M${cx - 1.0 * s} ${baseY - baseH} L${cx - 1.0 * s} ${baseY - baseH - 1.4 * s} L${cx - 0.78 * s} ${baseY - baseH} Z`, o);
  g += _oicShape(`M${cx + 1.0 * s} ${baseY - baseH} L${cx + 1.0 * s} ${baseY - baseH - 1.4 * s} L${cx + 0.78 * s} ${baseY - baseH} Z`, o);
  // cross finial
  g += `<path d="M${cx} ${baseY - spireH} L${cx} ${baseY - spireH - 0.9 * s} M${cx - 0.3 * s} ${baseY - spireH - 0.55 * s} L${cx + 0.3 * s} ${baseY - spireH - 0.55 * s}" stroke="${o.color}" stroke-width="${o.sw}"/>`;
  return g;
}

/* Aso Rock — the granite monolith */
function oicAsoRock(x, baseY, w, h, o) {
  const d = `M${x} ${baseY} ` +
    `L${x + w * 0.05} ${baseY - h * 0.5} ` +
    `C ${x + w * 0.11} ${baseY - h * 0.86} ${x + w * 0.27} ${baseY - h * 1.0} ${x + w * 0.45} ${baseY - h * 0.97} ` +
    `C ${x + w * 0.63} ${baseY - h * 0.94} ${x + w * 0.82} ${baseY - h * 0.66} ${x + w * 0.95} ${baseY - h * 0.26} ` +
    `L${x + w} ${baseY} Z`;
  let s = _oicShape(d, o);
  // a couple of faint striations for rock character
  if (o.detail !== false) {
    s += `<g stroke="${o.color}" stroke-width="${Math.max(0.6, o.sw * 0.5)}" fill="none" opacity="${(o.opacity == null ? 1 : o.opacity) * 0.4}">` +
      `<path d="M${x + w * 0.16} ${baseY - h * 0.62} C ${x + w * 0.34} ${baseY - h * 0.74} ${x + w * 0.5} ${baseY - h * 0.72} ${x + w * 0.64} ${baseY - h * 0.6}"/>` +
      `<path d="M${x + w * 0.24} ${baseY - h * 0.4} C ${x + w * 0.42} ${baseY - h * 0.5} ${x + w * 0.6} ${baseY - h * 0.48} ${x + w * 0.78} ${baseY - h * 0.34}"/>` +
      `</g>`;
  }
  return s;
}

/* ---- composed Abuja skyline ----------------------------------------------- */
function oicAbujaSkyline(w, baseY, opts) {
  opts = opts || {};
  const k = w / 1000;
  const o = {
    mode: opts.mode || 'line',
    color: opts.color || '#C6A46A',
    sw: opts.sw || 2,
    fill: opts.fill || null,
    opacity: opts.opacity,
    domeFill: opts.domeFill || (opts.color || '#C6A46A'),
    detail: opts.detail
  };
  let s = '<g class="oic-skyline">';
  // left CBD cluster
  s += oicTower(0.015 * w, baseY, 70 * k, 150 * k, o);
  s += oicTower(0.105 * w, baseY, 50 * k, 118 * k, o);
  s += oicTower(0.178 * w, baseY, 40 * k, 92 * k, o);
  // twin religious landmarks (city centre)
  s += oicMosque(0.37 * w, baseY, 24 * k, o);
  s += oicChurch(0.515 * w, baseY, 23 * k, o);
  // right CBD cluster
  s += oicTower(0.60 * w, baseY, 54 * k, 176 * k, o);
  s += oicTower(0.676 * w, baseY, 38 * k, 108 * k, o);
  s += oicTower(0.728 * w, baseY, 34 * k, 142 * k, o);
  // Aso Rock looming on the right
  s += oicAsoRock(0.775 * w, baseY, 0.255 * w, 206 * k, o);
  // ground line
  if (opts.ground !== false)
    s += `<path d="M0 ${baseY} H${w}" stroke="${o.color}" stroke-width="${o.sw}" opacity="${(o.opacity == null ? 1 : o.opacity) * 0.5}"/>`;
  return s + '</g>';
}

/* ---- single landmark motif (for grids / lists) ---------------------------- */
function oicLandmark(name, cx, cy, size, color, mode) {
  const o = { mode: mode || 'line', color: color, sw: Math.max(1.2, size * 0.03), detail: false };
  const baseY = cy + size * 0.42;
  const k = size / 56;
  switch (name) {
    case 'mosque': return `<g>${oicMosque(cx, baseY, 5.2 * k, o)}</g>`;
    case 'church': return `<g>${oicChurch(cx, baseY, 5.0 * k, o)}</g>`;
    case 'asorock': return `<g>${oicAsoRock(cx - size * 0.5, baseY, size, size * 0.74, o)}</g>`;
    case 'tower': return `<g>${oicTower(cx - size * 0.28, baseY, size * 0.3, size * 0.9, o)}${oicTower(cx + size * 0.02, baseY, size * 0.24, size * 0.66, o)}</g>`;
    case 'lake': {
      const y = cy + size * 0.1;
      let s = `<path d="M${cx - size * 0.5} ${y} q ${size * 0.25} ${size * 0.14} ${size * 0.5} 0 q ${size * 0.25} ${-size * 0.14} ${size * 0.5} 0" fill="none" stroke="${color}" stroke-width="${o.sw}"/>`;
      s += `<path d="M${cx - size * 0.44} ${y + size * 0.18} q ${size * 0.22} ${size * 0.12} ${size * 0.44} 0 q ${size * 0.22} ${-size * 0.12} ${size * 0.44} 0" fill="none" stroke="${color}" stroke-width="${o.sw * 0.8}" opacity="0.6"/>`;
      s += oicMosque(cx, y - size * 0.02, 2.4 * k, o);
      return `<g>${s}</g>`;
    }
    default: return `<g>${oicTower(cx - size * 0.15, baseY, size * 0.3, size * 0.9, o)}</g>`;
  }
}

/* ---- the location pin motif (brand signature) ----------------------------- */
function oicPinMotif(cx, cy, size, color, withGlow) {
  const r = size * 0.5, cyHead = cy, sw = Math.max(1.4, size * 0.06);
  const tipY = cy + size * 1.25;
  const a = r * 0.7;
  const path = `M ${cx} ${tipY} C ${cx - a} ${cyHead + r * 0.78}, ${cx - r} ${cyHead + r * 0.3}, ${cx - r} ${cyHead} ` +
    `A ${r} ${r} 0 1 1 ${cx + r} ${cyHead} C ${cx + r} ${cyHead + r * 0.3}, ${cx + a} ${cyHead + r * 0.78}, ${cx} ${tipY} Z`;
  let s = withGlow ? oicOrb(cx, cyHead, size * 1.2, color, 0.22) : '';
  s += `<path d="${path}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  s += `<circle cx="${cx}" cy="${cyHead}" r="${r * 0.28}" fill="${color}"/>`;
  return s;
}

if (typeof window !== 'undefined') {
  Object.assign(window, {
    oicUid, oicLinGrad, oicOrb, oicScrim, oicTower, oicMosque, oicChurch, oicAsoRock,
    oicAbujaSkyline, oicLandmark, oicPinMotif
  });
}
