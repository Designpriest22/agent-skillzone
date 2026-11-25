/* ============================================================================
   OUTSIDE IN THE CITY — Vector logo system
   ----------------------------------------------------------------------------
   The reference artwork is recreated from scratch as vector + type:
     · wordmark "OUTSIDE" (Bodoni Moda, high-contrast Didone)
     · champagne-gold location pin containing an Abuja skyline
     · gold arc sweeping beneath the wordmark
     · "IN THE CITY" + category + "BACKED BY THE CAPITAL MOVEMENT"
   Themes recolour the same geometry for: primary / white / black / symbol.
   ========================================================================== */

/* ---- Colour themes -------------------------------------------------------- */
const OIC_LOGO_THEMES = {
  primary: { word:'#F3EFE5', sub:'#F3EFE5', pin:'#C6A46A', sky:'#C6A46A',
             arc:'#C6A46A', rule:'#C6A46A', cat:'rgba(243,239,229,0.82)',
             endLead:'rgba(243,239,229,0.55)', end:'#F3EFE5', window:'none' },
  white:   { word:'#F6F3EC', sub:'#F6F3EC', pin:'#F6F3EC', sky:'#F6F3EC',
             arc:'#F6F3EC', rule:'#F6F3EC', cat:'rgba(246,243,236,0.8)',
             endLead:'rgba(246,243,236,0.55)', end:'#F6F3EC', window:'none' },
  black:   { word:'#0A0A0A', sub:'#0A0A0A', pin:'#0A0A0A', sky:'#0A0A0A',
             arc:'#0A0A0A', rule:'#0A0A0A', cat:'rgba(10,10,10,0.78)',
             endLead:'rgba(10,10,10,0.55)', end:'#0A0A0A', window:'none' }
};

/* ---- Abuja skyline (local 100 x 60 box, ground at y=56) -------------------
   National-Mosque dome + minarets, flanked by capital-city towers. */
function oicSkylineGroup(fill, opacity) {
  const o = (opacity == null) ? 1 : opacity;
  const gy = 56;
  function rect(x, w, top) { return `<path d="M${x} ${top}H${(x + w)}V${gy}H${x}Z"/>`; }
  function minaret(cx, top, w) {
    const x = cx - w / 2;
    return `<path d="M${x} ${top + 3}H${x + w}V${gy}H${x}Z"/>` +
           `<path d="M${cx} ${top - 3.4}L${x - 0.2} ${top + 3}H${x + w + 0.2}Z"/>` +
           `<path d="M${cx} ${top - 6.6}L${cx - 0.55} ${top - 3.4}H${cx + 0.55}Z"/>`;
  }
  const dome =
    `<path d="M40 40H60V${gy}H40Z"/>` +                             /* drum */
    `<path d="M39 40 A11 12 0 0 1 61 40 Z"/>` +                     /* dome */
    `<path d="M50 24 L49.1 28.4 H50.9 Z"/>` +                       /* finial */
    `<circle cx="50" cy="29.4" r="1.15"/>`;
  const buildings =
    rect(10, 7.5, 33) + rect(18.5, 5, 39) +                          /* left cluster */
    rect(77, 7.5, 35) + rect(85.5, 5, 40.5) +                        /* right cluster */
    rect(24.4, 3.4, 41);                                            /* inner-left block */
  const minarets =
    minaret(33.5, 33, 2.6) + minaret(66.5, 33, 2.6) +
    minaret(29, 38.5, 2.1) + minaret(71, 38.5, 2.1);
  return `<g fill="${fill}" fill-opacity="${o}" stroke="none">${dome}${minarets}${buildings}</g>`;
}

/* ---- Location pin (teardrop outline + skyline window) --------------------- */
function oicPinGroup(theme, cx, topY, size) {
  const t = OIC_LOGO_THEMES[theme] || theme;         // allow passing a theme object
  const r = size * 0.5;
  const cyHead = topY + r;                            // circle centre
  const sw = Math.max(2, size * 0.075);
  const tipY = topY + size * 1.42;
  // teardrop: circle head + tapered point
  const a = r * 0.70;
  const path =
    `M ${cx} ${tipY} ` +
    `C ${cx - a} ${cyHead + r * 0.78}, ${cx - r} ${cyHead + r * 0.30}, ${cx - r} ${cyHead} ` +
    `A ${r} ${r} 0 1 1 ${cx + r} ${cyHead} ` +
    `C ${cx + r} ${cyHead + r * 0.30}, ${cx + a} ${cyHead + r * 0.78}, ${cx} ${tipY} Z`;
  // skyline fit inside lower part of the head circle
  const boxW = r * 1.46, boxH = boxW * 0.6;
  const sx = cx - boxW / 2;
  const sy = cyHead + r * 0.30 - boxH;
  const scale = boxW / 100;
  const win = (t.window && t.window !== 'none')
    ? `<circle cx="${cx}" cy="${cyHead}" r="${r - sw * 0.5}" fill="${t.window}"/>` : '';
  return `<g class="oic-pin">
      ${win}
      <path d="${path}" fill="none" stroke="${t.pin}" stroke-width="${sw}" stroke-linejoin="round"/>
      <g transform="translate(${sx} ${sy}) scale(${scale})">
        <g transform="translate(0 ${-( -0)})">${oicSkylineGroup(t.sky, 1)}</g>
        <path d="M2 56H98" stroke="${t.sky}" stroke-width="2.2" stroke-linecap="round"/>
      </g>
    </g>`;
}

/* ---- Full stacked lockup -> returns an SVG string -------------------------
   opts: { theme, width, showCategory, showEndorsement } */
function oicLogoSVG(opts) {
  opts = opts || {};
  const theme = opts.theme || 'primary';
  const t = OIC_LOGO_THEMES[theme] || OIC_LOGO_THEMES.primary;
  const W = 1000;
  const showCat = opts.showCategory !== false;
  const showEnd = opts.showEndorsement !== false;
  let H = 300;
  const cx = W / 2;

  // Pin
  const pin = oicPinGroup(t, cx + 150, 8, 150);

  // Wordmark OUTSIDE
  const wordY = 250;
  const word =
    `<text x="${cx}" y="${wordY}" text-anchor="middle" fill="${t.word}" ` +
    `font-family="Bodoni Moda, serif" font-weight="700" font-size="212" ` +
    `letter-spacing="2" style="font-feature-settings:'liga' 0;">OUTSIDE</text>`;

  // Arc under the wordmark (echo of the reference swoosh)
  const arcReal =
    `<path d="M236 286 C 410 352, 612 352, 792 250" fill="none" ` +
    `stroke="${t.arc}" stroke-width="5" stroke-linecap="round" opacity="0.95"/>`;

  // IN THE CITY
  const subY = 338;
  const sub =
    `<text x="${cx}" y="${subY}" text-anchor="middle" fill="${t.sub}" ` +
    `font-family="Bodoni Moda, serif" font-weight="700" font-size="58" ` +
    `letter-spacing="22">IN THE CITY</text>`;

  let y = subY + 48;
  let extra = '';
  if (showCat) {
    extra += `<path d="M${cx - 70} ${y} H${cx + 70}" stroke="${t.rule}" stroke-width="1.4" opacity="0.9"/>`;
    y += 44;
    extra += `<text x="${cx}" y="${y}" text-anchor="middle" fill="${t.cat}" ` +
      `font-family="Schibsted Grotesk, sans-serif" font-weight="600" font-size="23" letter-spacing="8">` +
      `ABUJA LIFESTYLE &amp; ENTERTAINMENT CONCIERGE</text>`;
    y += 20;
  }
  if (showEnd) {
    y += 34;
    extra += `<path d="M${cx - 150} ${y} H${cx + 150}" stroke="${t.rule}" stroke-width="1" opacity="0.45"/>`;
    y += 40;
    extra += `<text x="${cx}" y="${y}" text-anchor="middle" fill="${t.endLead}" ` +
      `font-family="Schibsted Grotesk, sans-serif" font-weight="600" font-size="19" letter-spacing="9">BACKED BY</text>`;
    y += 34;
    extra += `<text x="${cx}" y="${y}" text-anchor="middle" fill="${t.end}" ` +
      `font-family="Schibsted Grotesk, sans-serif" font-weight="600" font-size="26" letter-spacing="7">THE CAPITAL MOVEMENT</text>`;
    y += 18;
  }
  H = y + 20;

  const body = pin + arcReal + word + sub + extra;
  return oicWrapSVG(body, W, H, opts.title || 'OUTSIDE IN THE CITY');
}

/* ---- Standalone brand symbol (pin only), square --------------------------- */
function oicSymbolSVG(opts) {
  opts = opts || {};
  const theme = opts.theme || 'primary';
  const t = OIC_LOGO_THEMES[theme] || OIC_LOGO_THEMES.primary;
  const S = 400;
  const pin = oicPinGroup(t, S / 2, 70, 230);
  return oicWrapSVG(pin, S, S, 'OUTSIDE IN THE CITY — Symbol');
}

/* ---- Clean logomark (pin + wordmark + "IN THE CITY" only, no taglines) ----- */
function oicLogomarkSVG(theme) {
  return oicLogoSVG({ theme: theme || 'primary', showCategory: false, showEndorsement: false });
}

/* ---- Inline lockup for use inside graphics (returns a <g> at given scale) -- */
function oicLogoInline(theme, x, y, scale, opts) {
  opts = opts || {};
  const svg = oicLogoSVG({ theme: theme, showCategory: opts.showCategory === true,
                           showEndorsement: opts.showEndorsement === true });
  // extract inner of the generated svg
  const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  return `<g transform="translate(${x} ${y}) scale(${scale})">${inner}</g>`;
}

/* ---- Small horizontal wordmark lockup (for graphic headers) --------------- */
function oicWordmarkInline(theme, cx, y, fontSize, opts) {
  opts = opts || {};
  const t = OIC_LOGO_THEMES[theme] || OIC_LOGO_THEMES.primary;
  const fs = fontSize || 30;
  const pinSize = fs * 1.15;
  const pin = oicPinGroup(t, cx, y - fs * 2.15, pinSize);
  const word =
    `<text x="${cx}" y="${y}" text-anchor="middle" fill="${t.word}" ` +
    `font-family="Bodoni Moda, serif" font-weight="700" font-size="${fs}" letter-spacing="${fs*0.06}">OUTSIDE</text>`;
  const sub =
    `<text x="${cx}" y="${y + fs * 0.74}" text-anchor="middle" fill="${t.sub}" ` +
    `font-family="Schibsted Grotesk, sans-serif" font-weight="600" font-size="${fs * 0.30}" letter-spacing="${fs*0.22}">IN THE CITY</text>`;
  return `<g class="oic-mark">${pin}${word}${sub}</g>`;
}

/* ---- SVG document wrapper (adds xmlns + embedded fonts for export) --------- */
function oicWrapSVG(body, w, h, title, opts) {
  opts = opts || {};
  const fontStyle = (typeof oicFontFaceCSS === 'function' && opts.embedFonts !== false)
    ? `<style>${oicFontFaceCSS()}</style>` : '';
  const bg = opts.background ? `<rect width="${w}" height="${h}" fill="${opts.background}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
    `viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${title}">` +
    `<title>${title}</title>${fontStyle}${bg}${body}</svg>`;
}

/* ---- Logo-only wallpapers (premium background) ---------------------------- */
const OIC_WALLPAPERS = {
  phone:   { w: 1080, h: 1920, logoFrac: 0.80, label: 'Phone · 9:16' },
  desktop: { w: 2560, h: 1440, logoFrac: 0.34, label: 'Desktop · 16:9' },
  square:  { w: 1080, h: 1080, logoFrac: 0.70, label: 'Square · 1:1' },
  post:    { w: 1080, h: 1350, logoFrac: 0.74, label: 'Post · 4:5' }
};

function oicWallpaperSVG(kind) {
  const spec = OIC_WALLPAPERS[kind] || OIC_WALLPAPERS.phone;
  const w = spec.w, h = spec.h;
  const bgId = 'wbg_' + kind, mg = 'wmg_' + kind, vg = 'wvg_' + kind;
  const baseY = h * (kind === 'desktop' ? 0.98 : 0.9);
  let body = '';
  body += `<rect width="${w}" height="${h}" fill="#070708"/>`;
  body += `<defs><linearGradient id="${bgId}" x1="0" y1="0" x2="0" y2="1">`
    + `<stop offset="0%" stop-color="#0C0D11"/><stop offset="55%" stop-color="#070708"/><stop offset="100%" stop-color="#040405"/></linearGradient></defs>`;
  body += `<rect width="${w}" height="${h}" fill="url(#${bgId})"/>`;
  // soft moon glow
  body += `<defs><radialGradient id="${mg}" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#E8D9BA" stop-opacity="0.14"/><stop offset="100%" stop-color="#E8D9BA" stop-opacity="0"/></radialGradient></defs>`;
  body += `<circle cx="${w * 0.72}" cy="${h * 0.2}" r="${h * 0.26}" fill="url(#${mg})"/>`;
  // faint Abuja landmark skyline at the base
  if (typeof oicAbujaSkyline === 'function') {
    body += `<g opacity="0.5">` + oicAbujaSkyline(w, baseY, { mode: 'line', color: '#C6A46A', sw: 1.6, ground: false }) + `</g>`;
  }
  // faint arc motif
  body += `<path d="M${-w * 0.1} ${h * 0.64} C ${w * 0.3} ${h * 0.78}, ${w * 0.7} ${h * 0.46}, ${w * 1.1} ${h * 0.58}" fill="none" stroke="#C6A46A" stroke-width="1.4" opacity="0.12"/>`;
  // centred logo lockup
  const logoSvg = oicLogoSVG({ theme: 'primary', showCategory: true, showEndorsement: true, embedFonts: false });
  const lh = parseFloat((logoSvg.match(/height="([\d.]+)"/) || [0, 596])[1]);
  const lw = 1000;
  const targetW = w * spec.logoFrac;
  const sc = targetW / lw;
  const lx = (w - lw * sc) / 2;
  const ly = (h - lh * sc) / 2 - (kind === 'desktop' ? 0 : h * 0.02);
  const inner = logoSvg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<style>[\s\S]*?<\/style>/, '');
  body += `<g transform="translate(${lx} ${ly}) scale(${sc})">${inner}</g>`;
  // vignette
  body += `<defs><radialGradient id="${vg}" cx="50%" cy="46%" r="72%"><stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.55"/></radialGradient></defs>`;
  body += `<rect width="${w}" height="${h}" fill="url(#${vg})"/>`;
  return oicWrapSVG(body, w, h, 'OUTSIDE IN THE CITY — Wallpaper');
}

if (typeof window !== 'undefined') {
  Object.assign(window, {
    OIC_LOGO_THEMES, oicSkylineGroup, oicPinGroup, oicLogoSVG, oicLogomarkSVG, oicSymbolSVG,
    oicLogoInline, oicWordmarkInline, oicWrapSVG, OIC_WALLPAPERS, oicWallpaperSVG
  });
}
