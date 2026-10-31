// node audit_sponsors.mjs [filter]  content review of every co-branded sponsor spot (every 2nd frame, all 3 formats)
//  - every typeset string must come from the APPROVED list (flyer / brief)
//  - the ONLY sponsor logo drawn is the spot's own sponsor; no flyer photograph / flyer background
//  - 0-4 s shows the sponsor logo; 10-15 s lock-up shows sponsor logo + festival logo + WIZKID + date + venue
//  - the four event items + sponsor logo all appear
import { createRequire } from 'node:module'; import path from 'node:path'; import fs from 'node:fs';
import { serve } from './serve.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const dir = path.dirname(new URL(import.meta.url).pathname);
const IDS = ['hennessy', 'heineken', 'coca-cola', 'desperados', 'best', 'axe', 'lords-gin', 'transcorp-hotels', 'vodi-group', 'united-nigeria', 'trace', 'square-meter', 'nova-flair'];
const jobs = IDS.flatMap(s => ['reels', 'feed', 'square'].map(f => ({ id: `${s}-${f}`, q: `s=${s}&f=${f}` }))).filter(j => !process.argv[2] || j.id.includes(process.argv[2]));
const srv = await serve(dir); const browser = await chromium.launch(); const report = []; let fails = 0;
await Promise.all([0, 1, 2].map(async w => { for (let i = w; i < jobs.length; i += 3) {
  const j = jobs[i]; const page = await browser.newPage(); await page.goto(`${srv.url}/sponsors.html?render=1&${j.q}`); await page.evaluate(() => window.ready);
  const { FPS, DUR, sponsorLogo } = await page.evaluate(() => window.meta); const APPROVED = await page.evaluate(() => window.APPROVED);
  const problems = []; const texts = new Set(); const seen = { intro: new Set(), lock: new Set(), all: new Set() };
  for (let f = 0; f < FPS * DUR; f += 2) {
    const t = f / FPS; const log = await page.evaluate(f => window.audit(f), f);
    for (const s of log.texts) { texts.add(s.trim()); if (!APPROVED.some(a => a.includes(s.trim()))) problems.push(`unapproved text "${s}" @${t.toFixed(2)}`); }
    for (const im of log.imgs) { seen.all.add(im); if (t < 4) seen.intro.add(im); if (t >= 10) seen.lock.add(im);
      if (/^\d\d-.*\.png$/.test(im) && im !== sponsorLogo) problems.push(`other sponsor logo ${im} @${t.toFixed(2)}`);
      if (/cutout|aerial-crowd|flyer-/.test(im)) problems.push(`flyer photo/background ${im} @${t.toFixed(2)}`); }
  }
  if (!seen.intro.has(sponsorLogo)) problems.push('sponsor logo missing from 0-4 s intro');
  for (const need of [sponsorLogo, 'lol-logo', 'wizkid-wordmark.png']) if (!seen.lock.has(need)) problems.push(`lock-up missing ${need}`);
  if (![...seen.all].some(x => /^(rt|slo)\//.test(x))) problems.push('no Wizkid footage used');
  for (const s of ['DECEMBER 13, 2026', 'EAGLE SQUARE, ABUJA']) if (!texts.has(s)) problems.push(`${s} never shown`);
  await page.close(); const uniq = [...new Set(problems.map(p => p.replace(/ @[\d.]+$/, '')))]; if (uniq.length) fails++;
  report.push({ id: j.id, pass: !uniq.length, problems: uniq, copy: [...texts] });
  console.log(`${uniq.length ? 'FAIL' : 'PASS'} ${j.id}${uniq.length ? '\n   - ' + uniq.join('\n   - ') : ''}`);
} }));
await browser.close(); srv.close();
fs.mkdirSync(path.join(dir, 'out'), { recursive: true }); fs.writeFileSync(path.join(dir, 'out', 'sponsor-content-audit.json'), JSON.stringify(report.sort((a, b) => a.id.localeCompare(b.id)), null, 1));
console.log(fails ? `${fails} spot(s) FAILED` : 'ALL SPONSOR SPOTS PASS'); process.exit(fails ? 1 : 0);
