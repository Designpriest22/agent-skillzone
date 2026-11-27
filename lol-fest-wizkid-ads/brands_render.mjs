// node brands_render.mjs [filter]        -> sponsor wall carousel: 4 slides x (feed 4:5, story 9:16), PNG + JPG, plus @2x masters
// SHEET=out.jpg node brands_render.mjs   -> contact sheet only (review)
import { createRequire } from 'node:module'; import path from 'node:path'; import fs from 'node:fs'; import { execFileSync } from 'node:child_process';
import { serve } from './serve.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const dir = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(dir, 'out', '_work', 'brands');
const FM = { feed: '1080x1350_4x5_Carousel', story: '1080x1920_9x16_Story' };
const jobs = [];
for (const f of Object.keys(FM)) for (const s of [1, 2, 3, 4]) jobs.push({ id: `${f}-${s}`, q: `f=${f}&slide=${s}`, base: `LOLFEST_WIZKID_Sponsors_Slide-0${s}-of-04_${FM[f]}`, f });
const todo = jobs.filter(j => !process.argv[2] || j.id.includes(process.argv[2]));
const srv = await serve(dir); const browser = await chromium.launch(); const sheet = process.env.SHEET; const tmp = fs.mkdtempSync('/tmp/brw'); const shots = [];
for (const j of todo) for (const dpr of sheet ? [1] : [1, 2]) {
  const page = await browser.newPage(); page.on('pageerror', e => console.error(`[${j.id}]`, e.message));
  await page.goto(`${srv.url}/brands.html?${j.q}&dpr=${dpr}`); await page.evaluate(() => window.ready);
  const b = Buffer.from(await page.evaluate(() => window.png()), 'base64'); await page.close();
  if (sheet) { const f = path.join(tmp, `${String(todo.indexOf(j)).padStart(3, '0')}.png`); fs.writeFileSync(f, b); shots.push(f); continue; }
  const d = path.join(OUT, j.f === 'feed' ? 'Carousel 4x5 (1080x1350)' : 'Story 9x16 (1080x1920)'); fs.mkdirSync(d, { recursive: true });
  if (dpr === 1) { const p = path.join(d, j.base + '.png'); fs.writeFileSync(p, b); execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', p, '-q:v', '2', path.join(d, j.base + '.jpg')]); }
  else { const md = path.join(OUT, '_Print-Masters @2x'); fs.mkdirSync(md, { recursive: true }); fs.writeFileSync(path.join(md, j.base + '_MASTER@2x.png'), b); }
  console.log('done', j.id, dpr);
}
await browser.close(); srv.close();
if (sheet) { const cols = Number(process.env.COLS || 4), th = Number(process.env.TH || 700);
  for (const f of shots) execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', f, '-vf', `scale=-1:${th},pad=iw+0:${th}:0:0:gray`, f.replace('.png', '.jpg')]);
  const n = shots.length; execFileSync('ffmpeg', ['-y', '-v', 'error', ...shots.flatMap(f => ['-i', f.replace('.png', '.jpg')]), '-filter_complex', `${shots.map((_, i) => `[${i}]pad=iw+12:ih:6:0:gray[p${i}]`).join(';')};${shots.map((_, i) => `[p${i}]`).join('')}hstack=inputs=${n}`, '-frames:v', '1', sheet]);
  console.log('sheet', sheet); }
