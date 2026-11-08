// node audit_flyer2.mjs   content audit of the 78 v2 flyers
//  - every string is approved flyer/brief copy (the flyer sets 13 / DEC on two lines, so the words of "13 DEC" are allowed)
//  - images: the supplied colour portrait, the LOL FEST logo, and the flyer's own sponsor logo ONLY (no footage, no other sponsor)
//  - required: WIZKID, 13 DEC, ABUJA, EAGLE SQUARE, ABUJA, WIZKID.TIX.AFRICA, festival logo, sponsor logo
//  - legibility: URL >= 40 px (36 on 1:1 Brand Edition), venue >= 28 px, date >= 80 px cap, sponsor logo >= 40 px tall
import { createRequire } from 'node:module'; import path from 'node:path'; import fs from 'node:fs';
import { serve } from './serve.mjs';
import { fjobs } from './flyer2_render.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const dir = path.dirname(new URL(import.meta.url).pathname);
const srv = await serve(dir); const browser = await chromium.launch(); const report = []; let fails = 0;
const q = [...fjobs];
await Promise.all([0, 1, 2, 3].map(async () => { while (q.length) { const j = q.shift();
  const page = await browser.newPage(); await page.goto(`${srv.url}/flyer2.html?${j.q}`); await page.evaluate(() => window.ready);
  const { sponsorLogo } = await page.evaluate(() => window.meta); const APPROVED = await page.evaluate(() => window.APPROVED);
  const { log, sizes } = await page.evaluate(() => window.audit()); await page.close();
  const P = [], tx = log.texts.map(s => s.trim()), all = tx.join(' | ');
  for (const s of tx) if (!APPROVED.includes(s) && !['13', 'DEC'].includes(s)) P.push(`unapproved text "${s}"`);
  for (const im of log.imgs) { if (/^\d\d-.*\.png$/.test(im) && im !== sponsorLogo) P.push(`other sponsor logo ${im}`); if (/^(rt|slo|matte)\//.test(im) || /footage/.test(im)) P.push(`footage in flyer ${im}`); if (/cutout|aerial|flyer-/.test(im)) P.push(`old image ${im}`); }
  if (!log.imgs.includes('wizkid-portrait-color.png')) P.push('supplied portrait missing');
  if (!log.imgs.includes('lol-logo')) P.push('festival logo missing'); if (!log.imgs.includes(sponsorLogo)) P.push('sponsor logo missing');
  if (!log.imgs.includes('wizkid-wordmark.png')) P.push('WIZKID text logo missing');
  for (const need of ['ABUJA', 'EAGLE SQUARE, ABUJA', 'WIZKID.TIX.AFRICA', 'GET TICKETS AT']) if (!tx.includes(need)) P.push(`missing "${need}"`);
  if (!(tx.includes('13 DEC') || (tx.includes('13') && tx.includes('DEC')))) P.push('missing 13 DEC');
  const minUrl = j.f === 'square' && j.v === 2 ? 36 : 40;
  if (sizes.url < minUrl) P.push(`URL ${sizes.url.toFixed(1)} px < ${minUrl}`); if (sizes.venue < 28) P.push(`venue ${sizes.venue.toFixed(1)} px`); if (sizes.date < 80) P.push(`date cap ${sizes.date} px`); if (sizes.logoH < 40) P.push(`sponsor logo ${sizes.logoH.toFixed(0)} px tall`);
  if (P.length) fails++; report.push({ id: j.id, pass: !P.length, problems: P, copy: [...new Set(tx)], sizes });
  console.log(`${P.length ? 'FAIL' : 'PASS'} ${j.id}${P.length ? ' - ' + P.join('; ') : ''}`);
} }));
await browser.close(); srv.close();
fs.writeFileSync(path.join(dir, 'out', 'v2-flyer-content-audit.json'), JSON.stringify(report.sort((a, b) => a.id.localeCompare(b.id)), null, 1));
console.log(fails ? `${fails} flyer(s) FAILED` : 'ALL 78 FLYERS PASS'); process.exit(fails ? 1 : 0);
