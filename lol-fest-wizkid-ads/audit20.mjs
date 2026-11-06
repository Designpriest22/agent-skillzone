// node audit20.mjs [filter]   content audit of every v2 20 s sponsor spot (every 2nd frame, all 3 formats)
//  - every typeset string comes from the APPROVED list; the only sponsor logo is the spot's own
//  - 00:00-00:05 brand-led: own sponsor logo shown
//  - 00:05-00:15 festival: footage, LOL FEST logo, WIZKID wordmark, DECEMBER 13, 2026, EAGLE SQUARE, ABUJA
//  - ticket CTA WIZKID.TIX.AFRICA on screen inside 0-15 s for >= 3 s continuous
//  - 00:15-00:20 sponsor logo ONLY: no text, no LOL logo, no wordmark, no footage, nothing but the sponsor's own logo
import { createRequire } from 'node:module'; import path from 'node:path'; import fs from 'node:fs';
import { serve } from './serve.mjs';
import { jobs as RJ } from './render20.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const dir = path.dirname(new URL(import.meta.url).pathname);
const jobs = RJ.filter(j => !process.argv[2] || j.id.includes(process.argv[2]));
const srv = await serve(dir); const browser = await chromium.launch(); const report = []; let fails = 0;
await Promise.all([0, 1, 2].map(async w => { for (let i = w; i < jobs.length; i += 3) {
  const j = jobs[i]; const page = await browser.newPage(); await page.goto(`${srv.url}/ad20.html?render=1&${j.q}`); await page.evaluate(() => window.ready);
  const { FPS, DUR, END, sponsorLogo } = await page.evaluate(() => window.meta); const APPROVED = await page.evaluate(() => window.APPROVED);
  const P = []; const texts = new Set(); const open = new Set(), fest = new Set(), festT = new Set(); let ctaRun = 0, ctaBest = 0, ctaFirst = null;
  for (let f = 0; f < FPS * DUR; f += 2) {
    const t = f / FPS; const log = await page.evaluate(f => window.audit(f), f); const tx = log.texts.map(s => s.trim()).filter(Boolean);
    for (const s of tx) { texts.add(s); if (!APPROVED.includes(s)) P.push(`unapproved text "${s}"`); }
    for (const im of log.imgs) { if (/^\d\d-.*\.png$/.test(im) && im !== sponsorLogo) P.push(`other sponsor logo ${im}`); if (/cutout|flyer/.test(im)) P.push(`flyer asset in video ${im}`); }
    if (t < 5) log.imgs.forEach(x => open.add(x));
    if (t >= 5 && t < END) { log.imgs.forEach(x => fest.add(x)); tx.forEach(x => festT.add(x)); }
    if (t >= END) { if (tx.length) P.push(`text in logo-only end card: ${tx.join(' | ')}`); const other = log.imgs.filter(x => x !== sponsorLogo); if (other.length) P.push(`non-sponsor element in end card: ${[...new Set(other)].join(', ')}`); if (!log.imgs.includes(sponsorLogo) && t > END + 1) P.push('end card without sponsor logo'); }
    const cta = t < END && tx.includes('WIZKID.TIX.AFRICA'); ctaRun = cta ? ctaRun + 2 / FPS : 0; ctaBest = Math.max(ctaBest, ctaRun); if (cta && ctaFirst === null) ctaFirst = t;
  }
  if (!open.has(sponsorLogo)) P.push('sponsor logo missing from 0-5 s opening');
  if (![...fest].some(x => /^(rt|slo)\//.test(x) || /^\d+\.jpg$/.test(x))) P.push('no footage in 5-15 s');
  for (const need of ['lol-logo', 'wizkid-wordmark.png']) if (![...fest].some(x => x.includes(need.replace('.png', '')))) P.push(`festival section missing ${need}`);
  for (const s of ['DECEMBER 13, 2026', 'EAGLE SQUARE, ABUJA', 'GET TICKETS AT', 'WIZKID.TIX.AFRICA']) if (!festT.has(s)) P.push(`${s} not shown in 5-15 s`);
  if (ctaBest < 3 - 1e-6) P.push(`CTA held only ${ctaBest.toFixed(2)} s`);
  await page.close(); const uniq = [...new Set(P)]; if (uniq.length) fails++;
  report.push({ id: j.id, pass: !uniq.length, problems: uniq, copy: [...texts], cta: { first: ctaFirst, heldSeconds: +ctaBest.toFixed(2) } });
  console.log(`${uniq.length ? 'FAIL' : 'PASS'} ${j.id} cta ${ctaFirst?.toFixed(2)}s +${ctaBest.toFixed(2)}s${uniq.length ? '\n   - ' + uniq.slice(0, 8).join('\n   - ') : ''}`);
} }));
await browser.close(); srv.close();
fs.writeFileSync(path.join(dir, 'out', 'v2-video-content-audit.json'), JSON.stringify(report.sort((a, b) => a.id.localeCompare(b.id)), null, 1));
console.log(fails ? `${fails} spot(s) FAILED` : 'ALL 20 s SPONSOR SPOTS PASS'); process.exit(fails ? 1 : 0);
