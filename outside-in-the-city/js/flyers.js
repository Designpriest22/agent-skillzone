/* ============================================================================
   OUTSIDE IN THE CITY — Flyers
   Launch / Services / Event flyers, each in Instagram post (1080x1350) and
   Story (1080x1920). All carry the EXACT logo (placed as the real artwork),
   on the brand's black-and-gold system. Specifics (dates, venues, handles)
   are clearly-marked editable placeholders — never invented.
   ========================================================================== */

const OIC_FLYER_SIZES = { post: { w: 1080, h: 1350 }, story: { w: 1080, h: 1920 } };

function oicFlyerBg(w, h) {
  const id = oicUid('fbg');
  let s = `<defs>${oicLinGrad(id, [['0%', '#0B0C0F'], ['55%', '#08090B'], ['100%', '#050506']])}</defs>`;
  s += `<rect width="${w}" height="${h}" fill="url(#${id})"/>`;
  s += oicOrb(w * 0.5, -h * 0.03, w * 0.6, '#C6A46A', 0.06);
  return s;
}
function oicFlyerSkyline(w, h, baseY) {
  const k = w / 1000;
  const top = baseY - 206 * k;
  return { markup: oicAbujaSkyline(w, baseY, { mode: 'line', color: 'rgba(198,164,106,0.5)', sw: 1.5, ground: true }), top: top };
}
function oicCtaBlock(cx, y, cta, handle) {
  let s = oicRule(cx - 34, y - 34, 68, OIC_PALETTE.gold, 0.85);
  s += oicText(cta, { x: cx, y: y, anchor: 'middle', family: FAM.grotesk, weight: 700, size: 20, color: OIC_PALETTE.gold, spacing: 3 });
  if (handle) s += oicText(handle, { x: cx, y: y + 36, anchor: 'middle', family: FAM.grotesk, weight: 500, size: 17, color: OIC_PALETTE.dim, spacing: 1 });
  return s;
}

/* ---- 1 · LAUNCH ----------------------------------------------------------- */
function oicFlyerLaunch(d, S) {
  const w = S.w, h = S.h, cx = w / 2, story = h > 1500;
  let s = oicFlyerBg(w, h);
  const logoW = w * (story ? 0.66 : 0.6), logoTop = h * (story ? 0.085 : 0.095);
  s += oicExactLogo(cx, logoTop, logoW);
  let y = logoTop + logoW / OIC_LOGO_IMG_AR + h * (story ? 0.06 : 0.055);
  s += oicText(d.eyebrow, { x: cx, y: y, anchor: 'middle', family: FAM.grotesk, weight: 700, size: 16, color: OIC_PALETTE.gold, spacing: 6 });
  const hlLines = d.headline.split('\n');
  const hlSize = story ? 112 : 96, hlLH = hlSize * 0.94;
  y += story ? 110 : 92;
  s += oicText(hlLines, { x: cx, y: y, anchor: 'middle', family: FAM.grotesk, weight: 800, size: hlSize, color: OIC_PALETTE.ivory, lineHeight: hlLH, spacing: -2 });
  y += oicBlockH(hlLines.length, hlLH) + (story ? 70 : 60);
  const subLines = oicWrap(d.sub, FAM.grotesk, 400, story ? 31 : 28, w * 0.76, 0);
  s += oicText(subLines, { x: cx, y: y, anchor: 'middle', family: FAM.grotesk, weight: 400, size: story ? 31 : 28, color: OIC_PALETTE.dim, lineHeight: story ? 44 : 40 });
  // skyline + CTA at the base
  const baseY = h - h * 0.055;
  const sky = oicFlyerSkyline(w, h, baseY);
  s += sky.markup;
  s += oicCtaBlock(cx, sky.top - h * (story ? 0.075 : 0.085), d.cta, d.handle);
  return oicWrapSVG(s, w, h, 'OUTSIDE — Launch flyer', { background: OIC_PALETTE.black });
}

/* ---- 2 · SERVICES --------------------------------------------------------- */
function oicFlyerServices(d, S) {
  const w = S.w, h = S.h, cx = w / 2, story = h > 1500;
  let s = oicFlyerBg(w, h);
  const logoW = w * (story ? 0.6 : 0.54), logoTop = h * (story ? 0.075 : 0.08);
  s += oicExactLogo(cx, logoTop, logoW);
  let y = logoTop + logoW / OIC_LOGO_IMG_AR + h * (story ? 0.055 : 0.05);
  s += oicText(d.eyebrow, { x: cx, y: y, anchor: 'middle', family: FAM.grotesk, weight: 700, size: 15, color: OIC_PALETTE.gold, spacing: 6 });
  const hlLines = d.headline.split('\n');
  const hlSize = story ? 86 : 74, hlLH = hlSize * 0.94;
  y += story ? 86 : 74;
  s += oicText(hlLines, { x: cx, y: y, anchor: 'middle', family: FAM.grotesk, weight: 800, size: hlSize, color: OIC_PALETTE.ivory, lineHeight: hlLH, spacing: -1.5 });
  y += oicBlockH(hlLines.length, hlLH) + (story ? 54 : 46);
  const subLines = oicWrap(d.sub, FAM.grotesk, 400, story ? 28 : 25, w * 0.72, 0);
  s += oicText(subLines, { x: cx, y: y, anchor: 'middle', family: FAM.serif, weight: 400, size: story ? 30 : 26, color: OIC_PALETTE.dim, lineHeight: story ? 40 : 36, italic: true });
  y += oicBlockH(subLines.length, story ? 40 : 36) + (story ? 96 : 78);
  // services 2 x 3, centred
  const gut = 56, colW = (w - 2 * OIC_M - gut) / 2, rowH = story ? 150 : 128;
  d.services.forEach((sv, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = OIC_M + col * (colW + gut), ry = y + row * rowH;
    s += oicRule(x, ry - 28, colW, OIC_PALETTE.line, 1);
    s += oicIcon(sv.icon, x + 26, ry + 26, 46, OIC_PALETTE.gold);
    s += oicText(sv.title, { x: x + 66, y: ry + 34, family: FAM.grotesk, weight: 700, size: story ? 20 : 18, color: OIC_PALETTE.ivory, spacing: 1 });
  });
  const afterGrid = y + 3 * rowH;
  s += oicCtaBlock(cx, afterGrid + (story ? 80 : 56), d.cta, d.handle);
  return oicWrapSVG(s, w, h, 'OUTSIDE — Services flyer', { background: OIC_PALETTE.black });
}

/* ---- 3 · EVENT ------------------------------------------------------------ */
function oicFlyerEvent(d, S) {
  const w = S.w, h = S.h, cx = w / 2, story = h > 1500;
  let s = oicFlyerBg(w, h);
  // faint Aso Rock behind
  s += `<g opacity="0.9">` + oicAsoRock(w * 0.5 - w * 0.34, h, w * 0.68, h * (story ? 0.5 : 0.56), { mode: 'solid', color: '#0F1014', detail: false }) + `</g>`;
  s += `<g>` + oicAsoRock(w * 0.5 - w * 0.34, h, w * 0.68, h * (story ? 0.5 : 0.56), { mode: 'line', color: 'rgba(198,164,106,0.18)', sw: 1.4, detail: true }) + `</g>`;
  const logoW = w * (story ? 0.52 : 0.46), logoTop = h * (story ? 0.07 : 0.075);
  s += oicExactLogo(cx, logoTop, logoW);
  let y = logoTop + logoW / OIC_LOGO_IMG_AR + h * (story ? 0.06 : 0.055);
  s += oicText(d.eyebrow, { x: cx, y: y, anchor: 'middle', family: FAM.grotesk, weight: 700, size: 15, color: OIC_PALETTE.gold, spacing: 7 });
  // occasion
  y += story ? 96 : 84;
  const occLines = oicWrap(d.occasion, FAM.grotesk, 800, story ? 104 : 90, w * 0.82, -1);
  s += oicText(occLines, { x: cx, y: y, anchor: 'middle', family: FAM.grotesk, weight: 800, size: story ? 104 : 90, color: OIC_PALETTE.ivory, lineHeight: story ? 96 : 84, spacing: -1.5 });
  y += oicBlockH(occLines.length, story ? 96 : 84) + (story ? 70 : 56);
  // gold rule
  s += oicRule(cx - 60, y - 34, 120, OIC_PALETTE.gold, 0.8);
  // date · time
  s += oicText(d.date + '  ·  ' + d.time, { x: cx, y: y + 8, anchor: 'middle', family: FAM.grotesk, weight: 700, size: story ? 26 : 23, color: OIC_PALETTE.ivory, spacing: 3 });
  y += story ? 70 : 58;
  s += oicText(d.venue, { x: cx, y: y, anchor: 'middle', family: FAM.serif, weight: 400, size: story ? 34 : 30, color: OIC_PALETTE.gold, italic: true });
  y += story ? 58 : 48;
  s += oicText(d.dress, { x: cx, y: y, anchor: 'middle', family: FAM.grotesk, weight: 500, size: story ? 18 : 16, color: OIC_PALETTE.dim, spacing: 4 });
  // rsvp at base
  s += oicCtaBlock(cx, h - h * (story ? 0.085 : 0.095), d.rsvp, null);
  return oicWrapSVG(s, w, h, 'OUTSIDE — Event flyer', { background: OIC_PALETTE.black });
}

/* ---- registry ------------------------------------------------------------- */
const OIC_FLYERS = {
  launch:   { title: 'Launch announcement', render: oicFlyerLaunch },
  services: { title: 'Services & booking', render: oicFlyerServices },
  event:    { title: 'Event / experience', render: oicFlyerEvent }
};
function oicRenderFlyer(type, size) {
  return OIC_FLYERS[type].render(OIC_DATA.flyers[type], OIC_FLYER_SIZES[size || 'post']);
}

if (typeof window !== 'undefined') {
  Object.assign(window, { OIC_FLYER_SIZES, OIC_FLYERS, oicRenderFlyer, oicFlyerBg });
}
