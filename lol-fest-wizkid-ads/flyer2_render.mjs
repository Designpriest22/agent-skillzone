// node flyer2_render.mjs [filter]      -> v2 flyers: 13 sponsors x 2 concepts x 3 formats, PNG + JPG (1x) and PNG masters (2x)
// SHEET=out.jpg node flyer2_render.mjs [filter]  -> contact sheet only (review)
import { createRequire } from 'node:module'; import path from 'node:path'; import fs from 'node:fs'; import { execFileSync } from 'node:child_process';
import { serve } from './serve.mjs';
import { SPN } from './render20.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const dir = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(dir, 'out', '_work', 'v2flyers');
const CON = { 1: 'Creative Variation 01', 2: 'Creative Variation 02' }, CNAME = { 1: 'V01-Signature', 2: 'V02-Brand-Edition' };
const FM = { feed: '1080x1350_4x5_Feed', square: '1080x1080_1x1_Square', story: '1080x1920_9x16_Story' };
export const fjobs = [];
for (const [s, n] of Object.entries(SPN)) for (const v of [1, 2]) for (const [f, tag] of Object.entries(FM))
  fjobs.push({ id: `${s}-v${v}-${f}`, s, v, f, q: `s=${s}&v=${v}&f=${f}`, dir: `${n}/${CON[v]}`, base: `LOLFEST_x_${n.slice(3)}_Flyer_${CNAME[v]}_${tag}` });
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const todo = fjobs.filter(j => !process.argv[2] || j.id.includes(process.argv[2]));
  const srv = await serve(dir); const browser = await chromium.launch(); const sheet = process.env.SHEET; const tmp = fs.mkdtempSync('/tmp/fl2'); const shots = [];
  const queue = [...todo];
  await Promise.all([0, 1, 2, 3].map(async () => { while (queue.length) { const j = queue.shift();
    for (const dpr of sheet || process.env.NOMASTER ? [1] : [1, 2]) {
      const page = await browser.newPage(); page.on('pageerror', e => console.error(`[${j.id}]`, e.message));
      await page.goto(`${srv.url}/flyer2.html?${j.q}&dpr=${dpr}`); await page.evaluate(() => window.ready);
      const b = Buffer.from(await page.evaluate(() => window.png()), 'base64'); await page.close();
      if (sheet) { const f = path.join(tmp, `${String(todo.indexOf(j)).padStart(3, '0')}.png`); fs.writeFileSync(f, b); shots.push(f); continue; }
      const d = path.join(OUT, j.dir); fs.mkdirSync(d, { recursive: true });
      if (dpr === 1) { const p = path.join(d, j.base + '.png'); fs.writeFileSync(p, b); execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', p, '-q:v', '2', path.join(d, j.base + '.jpg')]); }
      else { const md = path.join(OUT, '_masters', j.dir); fs.mkdirSync(md, { recursive: true }); fs.writeFileSync(path.join(md, j.base + '_MASTER@2x.png'), b); }
    }
    console.log('done', j.id); } }));
  await browser.close(); srv.close();
  if (sheet) { const cols = Number(process.env.COLS || 6), tw = process.env.TW || 300, th = process.env.TH || 375;
    for (const f of shots) execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', f, '-vf', `scale=${tw}:${th}:force_original_aspect_ratio=decrease,pad=${tw}:${th}:(ow-iw)/2:(oh-ih)/2:gray`, f.replace('.png', '.jpg')]);
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-pattern_type', 'glob', '-i', `${tmp}/*.jpg`, '-vf', `tile=${cols}x${Math.ceil(todo.length / cols)}:padding=6:color=gray`, '-frames:v', '1', sheet]); console.log('sheet', sheet); }
}
