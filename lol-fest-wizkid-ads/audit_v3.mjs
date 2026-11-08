// node audit_v3.mjs [filter]   content audit of the final 15 s sponsor ads (every 2nd frame, all formats)
//  - approved copy only; the only sponsor logo is the spot's own
//  - 0-4 s sponsor logo; 4-11 s footage + LOL FEST logo + WIZKID + DECEMBER 13, 2026 + EAGLE SQUARE, ABUJA
//  - end frame 11-15 s (4 s): sponsor logo, LOL FEST logo, WIZKID, date, venue and WIZKID.TIX.AFRICA on screen
import { createRequire } from 'node:module'; import path from 'node:path'; import fs from 'node:fs';
import { serve } from './serve.mjs';
import { jobs3 } from './render_v3.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const dir = path.dirname(new URL(import.meta.url).pathname);
const jobs = jobs3.filter(j => !process.argv[2] || j.id.includes(process.argv[2]));
const srv = await serve(dir); const browser = await chromium.launch(); const report = []; let fails = 0; const q = [...jobs];
await Promise.all([0, 1, 2].map(async () => { while (q.length) { const j = q.shift();
  const page = await browser.newPage(); await page.goto(`${srv.url}/sponsors_v3.html?render=1&s=${j.s}&f=${j.f}`); await page.evaluate(() => window.ready);
  const { FPS, DUR, ENDFRAME, sponsorLogo } = await page.evaluate(() => window.meta); const APPROVED = await page.evaluate(() => window.APPROVED);
  const P = [], texts = new Set(), intro = new Set(), fest = new Set(), festT = new Set(); let endMiss = 0, endN = 0;
  for (let f = 0; f < FPS * DUR; f += 2) { const t = f / FPS; const log = await page.evaluate(f => window.audit(f), f); const tx = log.texts.map(s => s.trim());
    for (const s of tx) { texts.add(s); if (!APPROVED.includes(s)) P.push(`unapproved text "${s}"`); }
    for (const im of log.imgs) if (/^\d\d-.*\.png$/.test(im) && im !== sponsorLogo) P.push(`other sponsor logo ${im}`);
    if (t < 4) log.imgs.forEach(x => intro.add(x));
    else if (t < ENDFRAME) { log.imgs.forEach(x => fest.add(x)); tx.forEach(x => festT.add(x)); }
    else if (t >= ENDFRAME + 1.2) { endN++; const need = [tx.includes('WIZKID.TIX.AFRICA'), tx.includes('DECEMBER 13, 2026'), tx.includes('EAGLE SQUARE, ABUJA'), log.imgs.includes(sponsorLogo), log.imgs.includes('lol-logo'), log.imgs.includes('wizkid-wordmark.png')]; if (need.includes(false)) endMiss++; }
  }
  if (!intro.has(sponsorLogo)) P.push('sponsor logo missing from 0-4 s');
  if (![...fest].some(x => /^(rt|slo)\//.test(x))) P.push('no footage in 4-11 s');
  for (const n of ['lol-logo', 'wizkid-wordmark.png']) if (!fest.has(n)) P.push(`festival section missing ${n}`);
  for (const s of ['DECEMBER 13, 2026', 'EAGLE SQUARE, ABUJA']) if (!festT.has(s)) P.push(`${s} missing in 4-11 s`);
  if (endMiss) P.push(`end frame incomplete on ${endMiss}/${endN} sampled frames`);
  await page.close(); const u = [...new Set(P)]; if (u.length) fails++; report.push({ id: j.id, pass: !u.length, problems: u, copy: [...texts] });
  console.log(`${u.length ? 'FAIL' : 'PASS'} ${j.id}${u.length ? ' - ' + u.join('; ') : ''}`);
} }));
await browser.close(); srv.close(); fs.writeFileSync(path.join(dir, 'out', 'v3-video-content-audit.json'), JSON.stringify(report.sort((a, b) => a.id.localeCompare(b.id)), null, 1));
console.log(fails ? `${fails} FAILED` : 'ALL 39 ADS PASS'); process.exit(fails ? 1 : 0);
