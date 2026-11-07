// node props_render.mjs [outdir] [--preview]   hand props + flags: print artwork (PNG at production dpi), die-line sheets, mockups
import { createRequire } from 'node:module'; import path from 'node:path'; import fs from 'node:fs';
import { serve } from './serve.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const dir = path.dirname(new URL(import.meta.url).pathname);
const out = process.argv[2] || path.join(dir, 'out', '_work', 'props'); const preview = process.argv.includes('--preview');
const ORDER = ['fan', 'thunder', 'clapper', 'ledstick', 'wristband', 'bandana', 'bighead', 'shades', 'flag1', 'flag2', 'flag3'];
const srv = await serve(dir); const browser = await chromium.launch();
const errs = []; const meta = {};
async function shot(q, file, type = 'image/png') { const page = await browser.newPage(); page.on('pageerror', e => errs.push(`${q}: ${e.message}`));
  await page.goto(`${srv.url}/props.html?${q}`); await page.evaluate(() => window.ready); const m = await page.evaluate(() => window.meta);
  const b = Buffer.from(await page.evaluate(t => window.png(t), type), 'base64'); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, b); await page.close(); return m; }
const q = [];
ORDER.forEach((id, i) => { const n = String(i + 1).padStart(2, '0') + '-' + id;
  q.push(async () => { meta[id] = await shot(`p=${id}&mode=mock`, path.join(out, n, `${n}_MOCKUP.jpg`), 'image/jpeg'); });
  for (const side of id === 'fan' || id === 'thunder' || id === 'clapper' || id === 'bighead' ? ['front', 'back'] : ['front']) {
    q.push(async () => { await shot(`p=${id}&side=${side}&mode=art${preview ? '&dpi=40' : ''}`, path.join(out, n, `${n}_PRINT-ARTWORK_${side}.png`)); });
    q.push(async () => { await shot(`p=${id}&side=${side}&mode=die&dpi=${preview ? 40 : 100}`, path.join(out, n, `${n}_DIELINE_${side}.png`)); });
  } });
await Promise.all([0, 1, 2, 3].map(async () => { while (q.length) await q.shift()(); }));
const pieces = await (async () => { const page = await browser.newPage(); await page.goto(`${srv.url}/props.html?p=fan&mode=die&dpi=10`); await page.evaluate(() => window.ready); const r = await page.evaluate(() => window.PIECES); await page.close(); return r; })();
fs.writeFileSync(path.join(out, 'pieces.json'), JSON.stringify({ order: ORDER, pieces }, null, 1));
await browser.close(); srv.close(); console.log(errs.length ? errs.join('\n') : 'no page errors', '->', out);
