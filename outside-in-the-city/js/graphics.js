/* ============================================================================
   OUTSIDE IN THE CITY — The five graphics (1080 x 1350)
   ----------------------------------------------------------------------------
   Sans-led, members-club typography (Schibsted Grotesk) with Newsreader italic
   used only as an accent. No repeated masthead/footer furniture — each tile is
   a pure, confident message on deep black, grounded in real Abuja landmarks and
   districts, with controlled gold and generous negative space.
   The same SVG is used for preview and PNG export, so they match exactly.
   ========================================================================== */

const OIC_W = 1080, OIC_H = 1350, OIC_M = 112;
const FAM = {
  grotesk: 'Schibsted Grotesk, sans-serif',
  serif: 'Newsreader, serif',
  bodoni: 'Bodoni Moda, serif'
};

/* ---- text measurement + wrapping ------------------------------------------ */
const _oicCv = (typeof document !== 'undefined') ? document.createElement('canvas') : null;
const _oicCtx = _oicCv ? _oicCv.getContext('2d') : null;
function oicEsc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function oicMeasure(text, family, weight, size, spacing, italic) {
  if (!_oicCtx) return String(text).length * size * 0.52;
  _oicCtx.font = (italic ? 'italic ' : '') + weight + ' ' + size + 'px ' + family;
  try { _oicCtx.letterSpacing = (spacing || 0) + 'px'; } catch (e) {}
  const w = _oicCtx.measureText(String(text)).width;
  try { _oicCtx.letterSpacing = '0px'; } catch (e) {}
  return w;
}
function oicWrap(text, family, weight, size, maxW, spacing) {
  const out = [];
  String(text).split('\n').forEach(seg => {
    const words = seg.split(/\s+/).filter(Boolean);
    if (!words.length) { out.push(''); return; }
    let line = words[0];
    for (let i = 1; i < words.length; i++) {
      if (oicMeasure(line + ' ' + words[i], family, weight, size, spacing) <= maxW) line += ' ' + words[i];
      else { out.push(line); line = words[i]; }
    }
    out.push(line);
  });
  return out;
}
function oicText(lines, o) {
  const arr = Array.isArray(lines) ? lines : [lines];
  const lh = o.lineHeight == null ? o.size * 1.2 : o.lineHeight;
  const tspans = arr.map((l, i) => `<tspan x="${o.x}" dy="${i === 0 ? 0 : lh}">${oicEsc(l)}</tspan>`).join('');
  return `<text x="${o.x}" y="${o.y}" text-anchor="${o.anchor || 'start'}" ` +
    `fill="${o.color}" fill-opacity="${o.opacity == null ? 1 : o.opacity}" ` +
    `font-family="${o.family}" font-weight="${o.weight}" font-size="${o.size}" ` +
    `letter-spacing="${o.spacing || 0}"${o.italic ? ' font-style="italic"' : ''}>${tspans}</text>`;
}
function oicBlockH(n, lineHeight) { return (n - 1) * lineHeight; }

/* ---- page background (restrained) ----------------------------------------- */
function oicPageBg() {
  const id = oicUid('pg');
  let s = `<defs>${oicLinGrad(id, [['0%', '#0B0C0F'], ['60%', '#08090B'], ['100%', '#060607']])}</defs>`;
  s += `<rect width="${OIC_W}" height="${OIC_H}" fill="url(#${id})"/>`;
  s += oicOrb(OIC_W * 0.5, -60, OIC_W * 0.55, '#C6A46A', 0.05);
  return s;
}

/* ---- photo slot: real photo if supplied, else architectural fallback ------ */
function oicImageSlot(img, focus, x, y, w, h, fallback, radius) {
  if (!img) return fallback;
  const cid = oicUid('clip'); const r = radius || 0;
  const par = focus < 34 ? 'xMidYMin' : (focus > 66 ? 'xMidYMax' : 'xMidYMid');
  return `<defs><clipPath id="${cid}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" ry="${r}"/></clipPath></defs>` +
    `<g clip-path="url(#${cid})"><image x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="${par} slice" href="${img}" xlink:href="${img}"/>` +
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#oicPhotoScrim)"/></g>`;
}
function oicPhotoScrimDef() {
  return `<defs><linearGradient id="oicPhotoScrim" x1="0" y1="0" x2="0" y2="1"><stop offset="40%" stop-color="#060606" stop-opacity="0"/><stop offset="100%" stop-color="#060606" stop-opacity="0.55"/></linearGradient></defs>`;
}

/* ---- gold hairline rule --------------------------------------------------- */
function oicRule(x, y, w, color, op) {
  return `<path d="M${x} ${y} H${x + w}" stroke="${color || OIC_PALETTE.gold}" stroke-width="1" opacity="${op == null ? 0.6 : op}"/>`;
}

/* ---- refined line icons for services -------------------------------------- */
function oicIcon(name, cx, cy, s, color) {
  const sw = Math.max(1.5, s * 0.044);
  const g = (inner) => `<g transform="translate(${cx} ${cy})" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${inner}</g>`;
  const h = s / 2;
  switch (name) {
    case 'stay':
      return g(`<circle cx="${-h*0.45}" cy="${-h*0.1}" r="${h*0.32}"/><path d="M${-h*0.16} ${h*0.02} L${h*0.7} ${h*0.02}"/><path d="M${h*0.4} ${h*0.02} v${h*0.26} M${h*0.62} ${h*0.02} v${h*0.2}"/>`);
    case 'transport':
      return g(`<path d="M${-h*0.8} ${h*0.15} h${s*0.8} v${-h*0.22} l${-h*0.28} ${-h*0.42} h${-s*0.44} l${-h*0.3} ${h*0.42} z"/><circle cx="${-h*0.42}" cy="${h*0.18}" r="${h*0.16}"/><circle cx="${h*0.42}" cy="${h*0.18}" r="${h*0.16}"/>`);
    case 'dining':
      return g(`<path d="M${-h*0.35} ${-h*0.7} v${s*0.5}"/><path d="M${-h*0.55} ${-h*0.7} v${h*0.3} a${h*0.2} ${h*0.2} 0 0 0 ${h*0.4} 0 v${-h*0.3}"/><path d="M${h*0.4} ${-h*0.7} c${-h*0.3} ${h*0.1} ${-h*0.3} ${h*0.6} 0 ${h*0.6} v${h*0.5}"/>`);
    case 'entertainment':
      return g(`<path d="M${-h*0.55} ${-h*0.55} h${s*0.55} a${h*0.55} ${h*0.4} 0 0 1 ${-s*0.55} 0 z"/><path d="M0 ${-h*0.2} v${h*0.6}"/><path d="M${-h*0.3} ${h*0.55} h${h*0.6}"/>`);
    case 'vip':
      return g(`<path d="M${-h*0.7} ${h*0.3} l${h*0.18} ${-s*0.55} l${h*0.5} ${h*0.35} l${h*0.32} ${-h*0.6} l${h*0.32} ${h*0.6} l${h*0.5} ${-h*0.35} l${h*0.18} ${s*0.55} z"/><path d="M${-h*0.55} ${h*0.5} h${s*0.55}"/>`);
    case 'private':
      return g(`<path d="M${-h*0.6} ${-h*0.25} h${s*0.6} l${-s*0.3} ${s*0.65} z"/><path d="M${-h*0.6} ${-h*0.25} l${h*0.3} ${s*0.65} M${h*0.6} ${-h*0.25} l${-h*0.3} ${s*0.65} M${-h*0.2} ${-h*0.25} l${h*0.2} ${h*0.3} l${h*0.2} ${-h*0.3}"/>`);
    default: return g(`<circle r="${h*0.5}"/>`);
  }
}

/* ===========================================================================
   GRAPHIC 01 — THE CITY HAS A NEW INSIDER
   =========================================================================== */
function oicG01(d) {
  d = d || OIC_DATA.g01;
  let s = `<rect width="${OIC_W}" height="${OIC_H}" fill="${OIC_PALETTE.black}"/>`;
  s += oicOrb(OIC_W * 0.5, -40, OIC_W * 0.6, '#C6A46A', 0.06);
  // headline
  const hlLines = oicWrap(d.headline, FAM.grotesk, 800, 112, 840, -2);
  s += oicText(hlLines, { x: OIC_M, y: 322, family: FAM.grotesk, weight: 800, size: 112, color: OIC_PALETTE.ivory, lineHeight: 108, spacing: -2 });
  let y = 322 + oicBlockH(hlLines.length, 108);
  // gold rule + body
  y += 66;
  s += oicRule(OIC_M, y - 22, 96, OIC_PALETTE.gold, 0.8);
  const bodyLines = oicWrap(d.body, FAM.grotesk, 400, 29, 700, 0);
  s += oicText(bodyLines, { x: OIC_M, y: y + 18, family: FAM.grotesk, weight: 400, size: 29, color: OIC_PALETTE.dim, lineHeight: 42 });
  // architectural hero — gold-line Abuja skyline across the lower third
  const baseY = 1232;
  if (d.image) {
    s += oicPhotoScrimDef() + oicImageSlot(d.image, d.imageFocus, 0, 846, OIC_W, OIC_H - 846, '', 0);
  } else {
    s += oicScrim(OIC_W, OIC_H, 980, '#060606', 0.0); // keep clean
    s += oicAbujaSkyline(OIC_W, baseY, { mode: 'line', color: OIC_PALETTE.gold, sw: 2, ground: true });
    // a pin dropped on the city — insider signature
    s += oicPinMotif(OIC_W * 0.37, baseY - 150, 46, OIC_PALETTE.gold, true);
  }
  return oicCanvas(s, 'The city has a new insider');
}

/* ===========================================================================
   GRAPHIC 02 — ABUJA, ACCORDING TO US.  (the city as our territory)
   =========================================================================== */
function oicG02(d) {
  d = d || OIC_DATA.g02;
  let s = oicPageBg();
  const hlLines = d.headline.split('\n');
  s += oicText(hlLines, { x: OIC_M, y: 210, family: FAM.grotesk, weight: 800, size: 82, color: OIC_PALETTE.ivory, lineHeight: 80, spacing: -1.5 });
  let y = 210 + oicBlockH(hlLines.length, 80);
  const bodyLines = oicWrap(d.body, FAM.grotesk, 400, 26, 720, 0);
  s += oicText(bodyLines, { x: OIC_M, y: y + 52, family: FAM.grotesk, weight: 400, size: 26, color: OIC_PALETTE.dim, lineHeight: 37 });
  // district index
  const top = y + 52 + oicBlockH(bodyLines.length, 37) + 70;
  const rowH = (1250 - top) / d.cells.length;
  d.cells.forEach((c, i) => {
    const ry = top + i * rowH;
    const midY = ry + rowH / 2;
    s += oicRule(OIC_M, ry, OIC_W - 2 * OIC_M, OIC_PALETTE.line, 1);
    // landmark motif
    s += oicLandmark(c.motif, OIC_M + 34, midY, 56, OIC_PALETTE.gold, 'line');
    // district name
    s += oicText(c.area, { x: OIC_M + 96, y: midY + 12, family: FAM.grotesk, weight: 700, size: 38, color: OIC_PALETTE.ivory, spacing: 0 });
    // italic serif descriptor, right aligned
    s += oicText(c.line, { x: OIC_W - OIC_M, y: midY + 10, anchor: 'end', family: FAM.serif, weight: 500, size: 30, color: OIC_PALETTE.gold, italic: true });
  });
  s += oicRule(OIC_M, 1250, OIC_W - 2 * OIC_M, OIC_PALETTE.line, 1);
  return oicCanvas(s, 'Abuja, according to us');
}

/* ===========================================================================
   GRAPHIC 03 — NOT EVERYONE KNOWS WHERE TO GO.
   =========================================================================== */
function oicG03(d) {
  d = d || OIC_DATA.g03;
  let s = `<rect width="${OIC_W}" height="${OIC_H}" fill="${OIC_PALETTE.black}"/>`;
  // architectural hero — Aso Rock emerging on the right + a dropped pin
  if (d.image) {
    s += oicPhotoScrimDef() + oicImageSlot(d.image, d.imageFocus, 0, 0, OIC_W, OIC_H, '', 0);
    s += oicScrim(OIC_W, OIC_H, 420, '#060606', 0.55);
  } else {
    s += oicOrb(OIC_W * 0.78, OIC_H * 0.52, OIC_W * 0.5, '#C6A46A', 0.10);
    s += oicAsoRock(OIC_W * 0.44, OIC_H, OIC_W * 0.64, 760, { mode: 'solid', color: '#121319', detail: false });
    s += oicAsoRock(OIC_W * 0.44, OIC_H, OIC_W * 0.64, 760, { mode: 'line', color: 'rgba(198,164,106,0.35)', sw: 1.6, detail: true });
    s += oicPinMotif(OIC_W * 0.70, OIC_H * 0.52, 56, OIC_PALETTE.gold, true);
  }
  // headline (left column)
  const hlLines = d.headline.split('\n');
  s += oicText(hlLines, { x: OIC_M, y: 300, family: FAM.grotesk, weight: 800, size: 76, color: OIC_PALETTE.ivory, lineHeight: 74, spacing: -1.5 });
  let y = 300 + oicBlockH(hlLines.length, 74);
  // secondary — italic serif accent, distinct treatment
  y += 66;
  s += oicRule(OIC_M, y - 34, 54, OIC_PALETTE.gold, 0.9);
  s += oicText(d.secondary, { x: OIC_M, y: y, family: FAM.serif, weight: 500, size: 52, color: OIC_PALETTE.gold, italic: true });
  // body
  const bodyLines = oicWrap(d.body, FAM.grotesk, 400, 27, 452, 0);
  s += oicText(bodyLines, { x: OIC_M, y: y + 70, family: FAM.grotesk, weight: 400, size: 27, color: OIC_PALETTE.dim, lineHeight: 40 });
  return oicCanvas(s, 'Not everyone knows where to go');
}

/* ===========================================================================
   GRAPHIC 04 — THE OUTSIDE LIST
   =========================================================================== */
function oicG04(d) {
  d = d || OIC_DATA.g04;
  let s = oicPageBg();
  s += oicText(d.headline, { x: OIC_M, y: 184, family: FAM.grotesk, weight: 800, size: 74, color: OIC_PALETTE.ivory, spacing: -1 });
  s += oicText(d.subheading, { x: OIC_M, y: 226, family: FAM.grotesk, weight: 700, size: 16, color: OIC_PALETTE.gold, spacing: 3 });
  const top = 268, bottom = 1256;
  const rowH = (bottom - top) / d.destinations.length;
  d.destinations.forEach((dest, i) => {
    const ry = top + i * rowH;
    const midY = ry + rowH / 2;
    s += oicRule(OIC_M, ry, OIC_W - 2 * OIC_M, OIC_PALETTE.line, 1);
    // number
    s += oicText('0' + (i + 1), { x: OIC_M, y: midY + 16, family: FAM.grotesk, weight: 800, size: 48, color: 'rgba(198,164,106,0.9)' });
    // motif / photo slot
    const mx = OIC_M + 96;
    const motif = oicLandmark(dest.motif, mx + 34, midY, 60, OIC_PALETTE.gold, 'line');
    s += oicImageSlot(dest.image, dest.imageFocus, mx, midY - 52, 104, 104, motif, 3);
    // text block
    const bx = mx + 128;
    const bw = OIC_W - OIC_M - bx;
    let catLine = dest.category;
    s += oicText(catLine, { x: bx, y: midY - 30, family: FAM.grotesk, weight: 700, size: 13, color: OIC_PALETTE.gold, spacing: 3 });
    s += oicText(dest.name, { x: bx, y: midY + 4, family: FAM.grotesk, weight: 700, size: 34, color: OIC_PALETTE.ivory });
    const noteLines = oicWrap(dest.note, FAM.serif, 400, 23, bw, 0).slice(0, 2);
    s += oicText(noteLines, { x: bx, y: midY + 34, family: FAM.serif, weight: 400, size: 23, color: OIC_PALETTE.dim, italic: true, lineHeight: 29 });
    // honest placeholder tag
    if (dest.placeholder) {
      const label = 'SELECTION PENDING';
      const pw = oicMeasure(label, FAM.grotesk, 700, 11, 2) + 20;
      s += `<rect x="${OIC_W - OIC_M - pw}" y="${ry + 20}" width="${pw}" height="20" rx="10" fill="none" stroke="rgba(198,164,106,0.45)"/>`;
      s += oicText(label, { x: OIC_W - OIC_M - pw + 10, y: ry + 34, family: FAM.grotesk, weight: 700, size: 11, color: 'rgba(198,164,106,0.9)', spacing: 2 });
    }
  });
  s += oicRule(OIC_M, bottom, OIC_W - 2 * OIC_M, OIC_PALETTE.line, 1);
  return oicCanvas(s, 'The Outside List');
}

/* ===========================================================================
   GRAPHIC 05 — YOUR CITY. YOUR WAY. OUR CONNECTIONS.
   =========================================================================== */
function oicG05(d) {
  d = d || OIC_DATA.g05;
  let s = oicPageBg();
  const hlLines = d.headline.split('\n');
  s += oicText(hlLines, { x: OIC_M, y: 208, family: FAM.grotesk, weight: 800, size: 70, color: OIC_PALETTE.ivory, lineHeight: 70, spacing: -1.5 });
  let y = 208 + oicBlockH(hlLines.length, 70);
  const bodyLines = oicWrap(d.body, FAM.grotesk, 400, 26, 740, 0);
  s += oicText(bodyLines, { x: OIC_M, y: y + 52, family: FAM.grotesk, weight: 400, size: 26, color: OIC_PALETTE.dim, lineHeight: 37 });
  // services 2 x 3
  const gTop = y + 52 + oicBlockH(bodyLines.length, 37) + 96;
  const gx = OIC_M, gut = 40, colW = (OIC_W - 2 * OIC_M - gut) / 2, rowH = 176;
  d.services.forEach((sv, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = gx + col * (colW + gut), ry = gTop + row * rowH;
    s += oicRule(x, ry, colW, OIC_PALETTE.line, 1);
    s += oicIcon(sv.icon, x + 28, ry + 62, 48, OIC_PALETTE.gold);
    s += oicText(sv.title, { x: x + 72, y: ry + 56, family: FAM.grotesk, weight: 700, size: 20, color: OIC_PALETTE.ivory, spacing: 1 });
    s += oicText(sv.note, { x: x + 72, y: ry + 86, family: FAM.serif, weight: 400, size: 22, color: OIC_PALETTE.dim, italic: true });
  });
  // CTA
  const ctaY = gTop + 3 * rowH + 72;
  s += oicRule(OIC_W / 2 - 30, ctaY - 34, 60, OIC_PALETTE.gold, 0.8);
  s += oicText(d.cta, { x: OIC_W / 2, y: ctaY, anchor: 'middle', family: FAM.grotesk, weight: 700, size: 21, color: OIC_PALETTE.gold, spacing: 2 });
  return oicCanvas(s, 'Your city, your way, our connections');
}

/* ---- canvas wrapper ------------------------------------------------------- */
function oicCanvas(body, title) {
  return oicWrapSVG(body, OIC_W, OIC_H, title || 'OUTSIDE IN THE CITY', { background: OIC_PALETTE.black });
}

const OIC_GRAPHICS = {
  g01: { title: 'The City Has A New Insider', render: oicG01 },
  g02: { title: 'Abuja, According To Us', render: oicG02 },
  g03: { title: 'Not Everyone Knows Where To Go', render: oicG03 },
  g04: { title: 'The Outside List', render: oicG04 },
  g05: { title: 'Your City. Your Way. Our Connections.', render: oicG05 }
};
function oicRenderGraphic(id) { return OIC_GRAPHICS[id].render(OIC_DATA[id]); }

if (typeof window !== 'undefined') {
  Object.assign(window, { OIC_GRAPHICS, oicRenderGraphic, oicG01, oicG02, oicG03, oicG04, oicG05,
    oicText, oicWrap, oicMeasure, oicIcon, oicCanvas, oicImageSlot, OIC_W, OIC_H, OIC_M, FAM });
}
