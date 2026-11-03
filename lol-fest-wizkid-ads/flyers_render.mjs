// node flyers_render.mjs [outDir] [filter]  ->  <outDir>/<NN-Sponsor>/*_2x.png (+ content audit printed per flyer)
import { createRequire } from 'node:module'; import path from 'node:path'; import fs from 'node:fs';
import { serve } from './serve.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const dir = path.dirname(new URL(import.meta.url).pathname);
const OUT = process.argv[2] || path.join(dir, 'out', '_work', 'flyers'); const filt = process.argv[3];
const SPN = { hennessy: '01-Hennessy', heineken: '02-Heineken', 'coca-cola': '03-Coca-Cola', desperados: '04-Desperados', best: '05-BEST', axe: '06-AXE', 'lords-gin': '07-Lords-London-Dry-Gin',
  'transcorp-hotels': '08-Transcorp-Hotels', 'vodi-group': '09-Vodi-Group', 'united-nigeria': '10-United-Nigeria-Airlines', trace: '11-TRACE-Plus', 'square-meter': '12-Square-Meter-Spaces', 'nova-flair': '13-Nova-Flair' };
const FT = { feed: '1080x1350_4x5_Feed', story: '1080x1920_9x16_Story', square: '1080x1080_1x1_Square' };
const srv = await serve(dir); const browser = await chromium.launch(); let fails = 0; const report = [];
for (const [s, n] of Object.entries(SPN)) for (const [f, tag] of Object.entries(FT)) {
  const id = `${s}-${f}`; if (filt && !id.includes(filt)) continue;
  const page = await browser.newPage(); page.on('pageerror', e => console.error(id, e.message));
  await page.goto(`${srv.url}/flyers.html?s=${s}&f=${f}&dpr=2`); await page.evaluate(() => window.ready);
  const APPROVED = await page.evaluate(() => window.APPROVED); const meta = await page.evaluate(() => window.meta); const log = await page.evaluate(() => window.audit());
  const probs = [];
  for (const t of log.texts) if (!APPROVED.some(a => a.includes(t.trim()))) probs.push(`unapproved text "${t}"`);
  for (const im of log.imgs) if (/^\d\d-.*\.png$/.test(im) && im !== meta.sponsorLogo) probs.push(`other sponsor ${im}`);
  for (const need of [meta.sponsorLogo, 'lol-logo', 'wizkid-wordmark.png']) if (!log.imgs.includes(need)) probs.push(`missing ${need}`);
  for (const need of ['DECEMBER 13, 2026', 'EAGLE SQUARE, ABUJA']) if (!log.texts.includes(need)) probs.push(`missing ${need}`);
  if (!log.texts.includes('WIZKID.TIX.AFRICA')) probs.push('no ticket line');
  if (log.imgs.some(x => /footage|rt\//.test(x))) probs.push('video footage used (flyers must use the supplied photograph only)');
  if (!log.imgs.includes('wizkid-cutout.png')) probs.push('supplied photograph missing');
  if (probs.length) fails++;
  report.push({ id, pass: !probs.length, problems: probs, copy: [...new Set(log.texts)], images: [...new Set(log.imgs)] });
  const b64 = await page.evaluate(() => window.png()); const file = path.join(OUT, n, `LOLFEST_WIZKID_x_${n.slice(3)}_Flyer_${tag}_2x.png`);
  fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, Buffer.from(b64, 'base64')); await page.close();
  console.log(`${probs.length ? 'FAIL' : 'PASS'} ${id}${probs.length ? ' :: ' + probs.join('; ') : ''}`);
}
await browser.close(); srv.close();
fs.writeFileSync(path.join(OUT, 'flyer-content-audit.json'), JSON.stringify(report, null, 1));
console.log(fails ? `${fails} FAILED` : 'ALL FLYERS PASS');
