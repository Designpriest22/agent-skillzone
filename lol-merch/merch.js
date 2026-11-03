// LOL FEST 2026 merch renderer: garment mockups as layered SVG.
// garmentSVG({ g: 'tee'|'jersey'|'polo', c: 'onyx'|'chalk'|'ember', v: 'front'|'back', zoom: null|'logo'|'number' })
(function () {
const LOGO = 'assets/lol-logo.png', LOGO_AR = 647 / 729;

// Colourways, all drawn from the logo: gold, blaze orange (zig-zag), cream (type), ink.
const CW = {
  onyx:  { name: 'ONYX',  note: 'Classic black & white', body: '#161616', inner: '#0A0A0A', trim: '#F2EFE8', accent: '#E7B064', text: '#F2EFE8', dark: true,
           num: { fill: '#F2EFE8', gap: '#161616', line: '#F2EFE8', shadow: '#000000', stitch: '#A7A196' } },
  chalk: { name: 'CHALK', note: 'White with bold contrast', body: '#F1EEE7', inner: '#D8D3C9', trim: '#141414', accent: '#E8561B', text: '#141414', dark: false,
           num: { fill: '#E8561B', gap: '#F1EEE7', line: '#141414', shadow: '#CDC6BA', stitch: '#8A2C0A', gloss: true } },
  ember: { name: 'EMBER', note: 'Premium festival colourway', body: '#9A3714', inner: '#6A230B', trim: '#F3E5C8', accent: '#E9B25A', text: '#F6E7C8', dark: true,
           num: { fill: '#F6E7C8', gap: '#9A3714', line: '#E9B25A', shadow: '#55190A', stitch: '#B98B4B', stripes: '#E9B25A' } },
};

// Custom jersey numerals on a 100 x 160 grid: chamfered block forms like modern football kits.
const ONE = 'M30 0 H76 V160 H36 V46 H12 V28 Z';
const THREE = 'M4 0 H84 L100 16 V66 L88 80 L100 94 V144 L84 160 H4 V124 H62 V98 H24 V62 H62 V36 H4 Z';
const NUM_W = 174, NUM_H = 160;

// Garment silhouettes (viewBox 1000 x 1200).
const G = {
  tee: {
    label: 'Oversized T-Shirt',
    body: 'M392,148 C440,160 560,160 608,148 L792,192 C850,206 880,240 900,290 L956,452 C958,460 955,466 948,469 L818,516 C810,518 803,514 801,507 L780,440 L784,1108 C784,1118 778,1124 768,1125 C640,1134 360,1134 232,1125 C222,1124 216,1118 216,1108 L220,440 L199,507 C197,514 190,518 182,516 L52,469 C45,466 42,460 44,452 L100,290 C120,240 150,206 208,192 Z',
    neckFront: 'M392,148 C420,236 580,236 608,148', neckBack: 'M392,148 C440,172 560,172 608,148',
    neckHole: 'M392,148 C440,160 560,160 608,148 C580,236 420,236 392,148 Z',
    seams: ['M800,196 C790,300 782,380 781,442', 'M200,196 C210,300 218,380 219,442', 'M944,447 L812,494', 'M56,447 L188,494', 'M226,1100 C360,1110 640,1110 774,1100'],
    folds: [['d', 'M770,470 C700,540 640,600 590,640', 22], ['d', 'M230,470 C300,540 360,600 410,640', 22], ['d', 'M330,720 C320,850 300,980 296,1110', 30],
            ['d', 'M680,760 C690,880 702,990 712,1110', 30], ['l', 'M430,290 C420,520 410,800 404,1080', 40], ['l', 'M880,300 L930,440', 18], ['l', 'M150,300 L100,430', 14],
            ['d', 'M240,1060 C380,1040 620,1040 760,1060', 16]],
    crestFront: { cx: 500, top: 250, w: 206 }, numBack: { cx: 500, top: 440, h: 330 }, nape: 212, dec: 412, jock: { x: 252, y: 1010 },
  },
  jersey: {
    label: 'Sleeveless Jersey',
    body: 'M400,140 C450,150 550,150 600,140 L692,146 C690,300 722,430 792,462 L800,1095 C800,1110 792,1118 780,1120 C640,1132 360,1132 220,1120 C208,1118 200,1110 200,1095 L208,462 C278,430 310,300 308,146 Z',
    neckFront: 'M400,140 C412,318 588,318 600,140', neckBack: 'M400,140 C440,186 560,186 600,140',
    neckHole: 'M400,140 C450,150 550,150 600,140 C588,318 412,318 400,140 Z',
    arm: ['M692,146 C690,300 722,430 792,462', 'M308,146 C310,300 278,430 208,462'],
    sideStripes: true,
    seams: ['M216,1088 C360,1100 640,1100 784,1088'],
    folds: [['d', 'M330,520 C320,700 300,900 292,1100', 30], ['d', 'M672,520 C690,720 704,900 712,1100', 30], ['l', 'M440,330 C430,560 420,820 414,1080', 40],
            ['d', 'M236,1066 C380,1046 620,1046 764,1066', 16], ['d', 'M700,200 C705,300 720,380 760,430', 14]],
    crestFront: { cx: 500, top: 330, w: 150 }, numBack: { cx: 500, top: 432, h: 340 }, nape: 210, dec: 404, jock: { x: 248, y: 1006 },
  },
  polo: {
    label: 'Collared Polo Jersey',
    body: 'M402,140 C450,152 550,152 598,140 L770,180 C820,192 845,215 860,250 L928,430 C930,438 926,444 919,446 L800,478 C792,480 786,476 784,469 L762,400 L770,1100 C770,1112 762,1118 752,1119 C620,1128 380,1128 248,1119 C238,1118 230,1112 230,1100 L238,400 L216,469 C214,476 208,480 200,478 L81,446 C74,444 70,438 72,430 L140,250 C155,215 180,192 230,180 Z',
    seams: ['M772,186 C770,270 764,340 762,400', 'M228,186 C230,270 236,340 238,400', 'M246,1092 C380,1102 620,1102 754,1092'],
    cuffs: ['M919,446 L800,478 L790,446 L906,414 Z', 'M81,446 L200,478 L210,446 L94,414 Z'],
    folds: [['d', 'M760,470 C700,540 650,590 610,620', 20], ['d', 'M240,470 C300,540 350,590 390,620', 20], ['d', 'M340,700 C330,850 316,980 312,1100', 28],
            ['d', 'M664,740 C672,860 684,990 690,1100', 28], ['l', 'M436,420 C428,620 420,860 416,1080', 38], ['l', 'M870,300 L910,420', 14],
            ['d', 'M256,1064 C390,1046 610,1046 744,1064', 14]],
    crestFront: { cx: 640, top: 300, w: 104 }, numBack: null, nape: 214, dec: null, jock: { x: 268, y: 1004 },
  },
  tank: {
    label: 'Boxy Sleeveless Tee',
    body: 'M392,148 C440,160 560,160 608,148 L770,178 C782,180 788,190 788,202 C786,330 772,470 770,560 C772,580 790,594 812,598 L818,1078 C818,1088 812,1094 802,1095 C660,1104 340,1104 198,1095 C188,1094 182,1088 182,1078 L188,598 C210,594 228,580 230,560 C228,470 214,330 212,202 C212,190 218,180 230,178 Z',
    arm: ['M788,202 C786,330 772,470 770,560 C772,580 790,594 812,598', 'M212,202 C214,330 228,470 230,560 C228,580 210,594 188,598'],
    neckFront: 'M392,148 C420,236 580,236 608,148', neckBack: 'M392,148 C440,172 560,172 608,148',
    neckHole: 'M392,148 C440,160 560,160 608,148 C580,236 420,236 392,148 Z',
    seams: ['M192,1066 C340,1076 660,1076 808,1066'],
    folds: [['d', 'M790,610 C720,660 670,700 620,730', 20], ['d', 'M210,610 C280,660 330,700 380,730', 20], ['d', 'M320,760 C312,880 300,980 296,1080', 30],
            ['d', 'M690,780 C696,880 704,980 710,1080', 30], ['l', 'M430,290 C420,520 410,800 404,1060', 40], ['l', 'M760,240 L752,520', 12], ['l', 'M240,240 L248,520', 10],
            ['d', 'M206,1040 C380,1022 620,1022 794,1040', 16]],
    crestFront: { cx: 500, top: 250, w: 206 }, numBack: { cx: 500, top: 440, h: 330 }, nape: 212, dec: 412, jock: { x: 226, y: 986 },
  },
};

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

function crest(cx, top, w, cw, treatment, id) {
  const h = w * 1.18, r = w * 0.08, x = cx - w / 2;
  const shield = `M${r},0 H${w - r} Q${w},0 ${w},${r} V${h * 0.66} C${w},${h * 0.84} ${w * 0.62},${h * 0.93} ${w / 2},${h} C${w * 0.38},${h * 0.93} 0,${h * 0.84} 0,${h * 0.66} V${r} Q0,0 ${r},0 Z`;
  const lw = w * 0.8, lh = lw * LOGO_AR;
  const inset = `translate(${w * 0.045} ${w * 0.045}) scale(${0.91} ${1 - (w * 0.09) / h})`;
  const patch = treatment === 'patch';
  return `<g transform="translate(${x} ${top})" ${patch ? `filter="url(#raise${id})"` : ''}>
    <path d="${shield}" fill="#13100E"/>
    ${patch ? `<path d="${shield}" fill="url(#satin${id})" opacity=".55"/>` : ''}
    <path d="${shield}" transform="${inset}" fill="none" stroke="${cw.accent === '#E8561B' ? '#E7B064' : cw.accent}" stroke-width="${w * 0.02}"/>
    ${patch ? `<path d="${shield}" fill="none" stroke="#E7B064" stroke-opacity=".9" stroke-width="${w * 0.012}" stroke-dasharray="${w * 0.018} ${w * 0.012}" transform="translate(${w * 0.018} ${w * 0.018}) scale(.964 ${1 - (w * 0.036) / h})"/>` : ''}
    <image href="${LOGO}" x="${(w - lw) / 2}" y="${w * 0.1}" width="${lw}" height="${lh}"/>
    <path d="M${w / 2},${w * 0.1 + lh + w * 0.07} l${w * 0.025},${w * 0.05} l${w * 0.055},${w * 0.006} l-${w * 0.042},${w * 0.036} l${w * 0.014},${w * 0.054} l-${w * 0.052},-${w * 0.03} l-${w * 0.052},${w * 0.03} l${w * 0.014},-${w * 0.054} l-${w * 0.042},-${w * 0.036} l${w * 0.055},-${w * 0.006} z" fill="${cw.accent === '#E8561B' ? '#E7B064' : cw.accent}"/>
  </g>`;
}

function number13(cx, top, height, cw, id) {
  const n = cw.num, s = height / NUM_H, x0 = cx - (NUM_W * s) / 2;
  const digits = `<path d="${ONE}" transform="translate(-12 0)"/><path d="${THREE}" transform="translate(74 0)"/>`;
  return `<g transform="translate(${x0} ${top}) scale(${s})">
    <defs><clipPath id="dclip${id}">${digits}</clipPath></defs>
    <g transform="translate(3.2 4.2)" fill="${n.shadow}" stroke="${n.shadow}" stroke-width="12" stroke-linejoin="miter">${digits}</g>
    <g fill="${n.line}" stroke="${n.line}" stroke-width="12" stroke-linejoin="miter">${digits}</g>
    <g fill="${n.gap}" stroke="${n.gap}" stroke-width="6" stroke-linejoin="miter">${digits}</g>
    <g fill="${n.fill}">${digits}</g>
    ${n.stripes ? `<g clip-path="url(#dclip${id})"><rect x="-20" y="0" width="220" height="160" fill="url(#pin${id})"/></g>` : ''}
    ${n.gloss ? `<g clip-path="url(#dclip${id})"><rect x="-20" y="0" width="220" height="160" fill="url(#gloss${id})"/></g>` : ''}
    <g clip-path="url(#dclip${id})" fill="none">
      <g stroke="${n.stitch}" stroke-width="9" stroke-dasharray="1.6 1.4">${digits}</g>
      <g stroke="${n.fill}" stroke-width="5.4">${digits}</g>
      ${n.stripes ? `<g stroke="url(#pin${id})" stroke-width="5.4">${digits}</g>` : ''}
    </g>
  </g>`;
}

function layered(text, x, y, size, cw, ls, weight = 900) {
  const n = cw.num, base = `x="${x}" y="${y}" text-anchor="middle" font-family="BSD" font-weight="${weight}" font-size="${size}" letter-spacing="${ls}"`;
  return `<text ${base} fill="${n.line}" stroke="${n.line}" stroke-width="${size * 0.13}" stroke-linejoin="miter">${text}</text>
    <text ${base} fill="${n.gap}" stroke="${n.gap}" stroke-width="${size * 0.065}" stroke-linejoin="miter">${text}</text>
    <text ${base} fill="${n.fill}">${text}</text>`;
}

function garmentSVG({ g, c, v, zoom = null, studio = true, id = 'a' }) {
  const S = G[g], cw = CW[c], dark = cw.dark;
  const body = S.body;
  // ----- prints -----
  let prints = '';
  if (v === 'front') {
    const cr = S.crestFront;
    prints += crest(cr.cx, cr.top, cr.w, cw, g === 'tee' ? 'print' : 'patch', id);
    if (g === 'polo') prints += `<text x="360" y="352" text-anchor="middle" font-family="BSD" font-weight="800" font-size="24" letter-spacing="5" fill="${cw.dark ? cw.accent : cw.trim}">LOL FEST</text>
      <text x="360" y="378" text-anchor="middle" font-family="BSD" font-weight="600" font-size="15" letter-spacing="6" fill="${cw.dark ? cw.accent : cw.trim}">ABUJA · 2026</text>`;
    const j = S.jock;
    prints += `<g transform="translate(${j.x} ${j.y})"><rect width="92" height="54" rx="3" fill="#13100E"/><rect x="3.5" y="3.5" width="85" height="47" rx="2" fill="none" stroke="#E7B064" stroke-width="1.2" stroke-dasharray="2 1.6"/>
      <text x="46" y="21" text-anchor="middle" font-family="BSD" font-weight="800" font-size="12" letter-spacing="1.6" fill="#E7B064">OFFICIAL</text>
      <text x="46" y="35" text-anchor="middle" font-family="BSD" font-weight="600" font-size="9.5" letter-spacing="1.4" fill="#F2EFE8">MERCHANDISE</text>
      <text x="46" y="46" text-anchor="middle" font-family="BSD" font-weight="600" font-size="7.5" letter-spacing="1.2" fill="#BDB6AA">LOL FEST · ABUJA</text></g>`;
  } else {
    prints += `<text x="500" y="${S.nape}" text-anchor="middle" font-family="BSD" font-weight="800" font-size="22" letter-spacing="7" fill="${cw.text}" opacity=".92">LOL FEST 2026</text>`;
    if (S.numBack) {
      prints += layered('DEC', 500, S.dec, 78, cw, 22);
      prints += number13(S.numBack.cx, S.numBack.top, S.numBack.h, cw, id);
    }
  }
  // ----- trims -----
  let trims = '';
  const neck = v === 'front' ? S.neckFront : S.neckBack;
  if (g === 'tee' || g === 'tank') {
    if (v === 'front') trims += `<path d="${S.neckHole}" fill="${cw.inner}"/><path d="M392,148 C440,160 560,160 608,148" stroke="${cw.inner}" stroke-width="10" fill="none" opacity=".6"/>`;
    trims += `<path d="${neck}" stroke="${shade(cw.body, dark ? 1.25 : 0.93)}" stroke-width="22" fill="none"/><path d="${neck}" stroke="${dark ? 'rgba(255,255,255,.18)' : 'rgba(0,0,0,.25)'}" stroke-width="1.6" stroke-dasharray="5 4" fill="none" transform="translate(0 13)"/>`;
  }
  if (g === 'tank') {
    S.arm.forEach(a => { trims += `<path d="${a}" stroke="${shade(cw.body, dark ? 1.18 : 0.94)}" stroke-width="26" fill="none"/><path d="${a}" stroke="${dark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.26)'}" stroke-width="1.6" stroke-dasharray="5 4" fill="none" transform="translate(${a.startsWith('M788') ? -11 : 11} 0)"/>`; });
  }
  if (g === 'jersey') {
    if (v === 'front') trims += `<path d="${S.neckHole}" fill="${cw.inner}"/>`;
    trims += `<path d="${neck}" stroke="${cw.trim}" stroke-width="30" fill="none"/><path d="${neck}" stroke="${cw.accent}" stroke-width="6" fill="none"/>`;
    S.arm.forEach(a => { trims += `<path d="${a}" stroke="${cw.trim}" stroke-width="26" fill="none"/><path d="${a}" stroke="${cw.accent}" stroke-width="5" fill="none"/>`; });
    trims += `<path d="M206,474 L200,1100" stroke="${cw.trim}" stroke-width="9"/><path d="M219,474 L213,1100" stroke="${cw.accent}" stroke-width="5"/>
              <path d="M794,474 L800,1100" stroke="${cw.trim}" stroke-width="9"/><path d="M781,474 L787,1100" stroke="${cw.accent}" stroke-width="5"/>`;
  }
  if (g === 'polo') {
    S.cuffs.forEach(cf => { trims += `<path d="${cf}" fill="${cw.trim}"/><path d="${cf}" fill="url(#rib${id})" opacity=".35"/>`; });
    trims += `<path d="M906,424 L796,456" stroke="${cw.accent}" stroke-width="4"/><path d="M94,424 L204,456" stroke="${cw.accent}" stroke-width="4"/>`;
    if (v === 'front') {
      trims += `<path d="M400,140 C430,170 460,190 488,236 L512,236 C540,190 570,170 600,140 C560,150 440,150 400,140 Z" fill="${cw.inner}"/>
        <rect x="476" y="232" width="48" height="160" fill="${cw.body}"/><rect x="476" y="232" width="48" height="160" fill="none" stroke="${dark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.28)'}" stroke-width="1.6" stroke-dasharray="5 4"/>
        <path d="M476,392 L524,392" stroke="${dark ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.3)'}" stroke-width="2"/>
        ${[278, 344].map(y => `<circle cx="500" cy="${y}" r="9.5" fill="${cw.trim}"/><circle cx="500" cy="${y}" r="9.5" fill="none" stroke="rgba(0,0,0,.3)" stroke-width="1.2"/>${[[-3, -3], [3, -3], [-3, 3], [3, 3]].map(([a, b]) => `<circle cx="${500 + a}" cy="${y + b}" r="1.3" fill="rgba(0,0,0,.45)"/>`).join('')}`).join('')}
        <path d="M400,140 C450,128 550,128 600,140 C560,150 440,150 400,140 Z" fill="${shade(cw.trim, 0.85)}"/>
        ${['M488,236 L422,318 L378,228 C372,190 382,160 400,140 C430,170 460,190 488,236 Z', 'M512,236 L578,318 L622,228 C628,190 618,160 600,140 C570,170 540,190 512,236 Z'].map(p => `
          <defs><clipPath id="cl${id}${p.length}"><path d="${p}"/></clipPath></defs>
          <path d="${p}" fill="${cw.trim}"/><path d="${p}" fill="url(#rib${id})" opacity=".25"/>
          <path d="${p}" fill="none" stroke="${cw.accent}" stroke-width="16" clip-path="url(#cl${id}${p.length})"/>
          <path d="${p}" fill="none" stroke="${cw.trim}" stroke-width="9" clip-path="url(#cl${id}${p.length})"/>
          <path d="${p}" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="1.5"/>`).join('')}`;
    } else {
      trims += `<path d="M400,140 C450,126 550,126 600,140 L600,166 C550,152 450,152 400,166 Z" fill="${cw.trim}"/>
        <path d="M400,160 C450,146 550,146 600,160" stroke="${cw.accent}" stroke-width="4" fill="none"/><path d="M400,140 C450,126 550,126 600,140 L600,166 C550,152 450,152 400,166 Z" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="1.5"/>`;
    }
  }
  // ----- shading & texture -----
  const foldLayer = S.folds.map(([t, d, w]) => {
    const col = t === 'd' ? (dark ? 'rgba(0,0,0,.32)' : 'rgba(60,50,40,.16)') : (dark ? 'rgba(255,255,255,.055)' : 'rgba(255,255,255,.45)');
    return `<path d="${d}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round" filter="url(#soft${id})"/>`;
  }).join('');
  const seamCol = dark ? 'rgba(255,255,255,.13)' : 'rgba(0,0,0,.22)';
  const seams = (S.seams || []).map(d => `<path d="${d}" stroke="${seamCol}" stroke-width="1.6" stroke-dasharray="6 4" fill="none"/>`).join('');
  const texture = g === 'jersey' ? `url(#mesh${id})` : g === 'polo' ? `url(#pique${id})` : null;

  const vb = zoom ? zoomBox(S, v, zoom) : '0 0 1000 1200';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="100%" height="100%">
  <defs>
    <clipPath id="body${id}"><path d="${body}"/></clipPath>
    <radialGradient id="studio${id}" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="#F1EEE9"/><stop offset=".7" stop-color="#E2DED7"/><stop offset="1" stop-color="#CFCAC2"/></radialGradient>
    <linearGradient id="side${id}" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity="${dark ? .5 : .22}"/><stop offset=".16" stop-color="#000" stop-opacity="0"/>
      <stop offset=".42" stop-color="#fff" stop-opacity="${dark ? .07 : .1}"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset=".85" stop-color="#000" stop-opacity="${dark ? .12 : .05}"/><stop offset="1" stop-color="#000" stop-opacity="${dark ? .5 : .24}"/></linearGradient>
    <linearGradient id="vert${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="${dark ? .07 : .12}"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${dark ? .25 : .1}"/></linearGradient>
    <linearGradient id="gloss${id}" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <pattern id="pin${id}" patternUnits="userSpaceOnUse" width="6" height="6"><rect width="6" height="1.3" fill="${(cw.num.stripes || '#000')}" opacity=".85"/></pattern>
    <pattern id="mesh${id}" patternUnits="userSpaceOnUse" width="8" height="8"><circle cx="2" cy="2" r="1.6" fill="#000" opacity="${dark ? .5 : .16}"/><circle cx="6" cy="6" r="1.6" fill="#000" opacity="${dark ? .5 : .16}"/></pattern>
    <pattern id="pique${id}" patternUnits="userSpaceOnUse" width="5" height="5"><path d="M0 2.5 L2.5 0 L5 2.5 L2.5 5 Z" fill="none" stroke="#000" stroke-opacity="${dark ? .35 : .1}" stroke-width=".8"/></pattern>
    <pattern id="rib${id}" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(${g === 'polo' ? 75 : 90})"><rect width="1.4" height="4" fill="#000" opacity=".5"/></pattern>
    <pattern id="satin${id}" patternUnits="userSpaceOnUse" width="3" height="3" patternTransform="rotate(35)"><rect width="1" height="3" fill="#fff" opacity=".07"/></pattern>
    <filter id="soft${id}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="18"/></filter>
    <filter id="floor${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="24"/></filter>
    <filter id="drop${id}" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur in="SourceAlpha" stdDeviation="9"/><feOffset dy="10"/><feComponentTransfer><feFuncA type="linear" slope=".28"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="raise${id}" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur in="SourceAlpha" stdDeviation="1.6"/><feOffset dx="1" dy="2.2"/><feComponentTransfer><feFuncA type="linear" slope=".55"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="warp${id}" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="6" xChannelSelector="R" yChannelSelector="G"/></filter>
    <filter id="knit${id}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope="0" intercept="1"/></feComponentTransfer></filter>
  </defs>
  ${studio ? `<rect x="-200" y="-200" width="1400" height="1600" fill="url(#studio${id})"/><ellipse cx="500" cy="1150" rx="330" ry="26" fill="#000" opacity=".22" filter="url(#floor${id})"/>` : ''}
  <g filter="url(#drop${id})">
    <path d="${body}" fill="${cw.body}"/>
    <g clip-path="url(#body${id})">
      ${texture ? `<rect width="1000" height="1200" fill="${texture}"/>` : ''}
      ${trims}
      <g filter="url(#warp${id})">${prints}</g>
      ${seams}
      <rect width="1000" height="1200" fill="url(#side${id})"/>
      <rect width="1000" height="1200" fill="url(#vert${id})"/>
      ${foldLayer}
      <rect width="1000" height="1200" filter="url(#knit${id})" opacity="${dark ? .07 : .09}" style="mix-blend-mode:${dark ? 'screen' : 'multiply'}"/>
    </g>
    <path d="${body}" fill="none" stroke="${dark ? 'rgba(0,0,0,.6)' : 'rgba(0,0,0,.14)'}" stroke-width="2"/>
  </g>
</svg>`;
}

function zoomBox(S, v, zoom) {
  if (zoom === 'nape') return '290 70 420 420';
  if (zoom === 'logo') { const c = S.crestFront, h = c.w * 1.18, m = c.w * 0.32; const s = Math.max(c.w, h) + m * 2; return `${c.cx - s / 2} ${c.top + h / 2 - s / 2} ${s} ${s}`; }
  const n = S.numBack, w = (NUM_W * n.h) / NUM_H, s = w * 1.22;
  return `${n.cx - s / 2} ${n.top + n.h * 0.3} ${s} ${s}`;
}

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const m = v => Math.max(0, Math.min(255, Math.round(f > 1 ? v + (255 - v) * (f - 1) : v * f)));
  return '#' + [m(r), m(g), m(b)].map(v => v.toString(16).padStart(2, '0')).join('');
}

window.MERCH = { CW, G, garmentSVG, number13, crest, layered };
})();
