// node snap.mjs <page> <query> <out.jpg> t1 t2 ...   -> contact sheet of frames at those times (review tool)
import { createRequire } from 'node:module'; import path from 'node:path'; import fs from 'node:fs'; import { execFileSync } from 'node:child_process';
import { serve } from './serve.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const dir = path.dirname(new URL(import.meta.url).pathname);
const [page_, query, outFile, ...ts] = process.argv.slice(2);
const srv = await serve(dir); const browser = await chromium.launch(); const page = await browser.newPage();
page.on('pageerror', e => console.error('[page error]', e.message)); page.on('console', m => m.type() === 'error' && console.error('[console]', m.text()));
await page.goto(`${srv.url}/${page_}?render=1&${query}`); await page.evaluate(() => window.ready);
const { FPS } = await page.evaluate(() => window.meta);
const tmp = fs.mkdtempSync('/tmp/snap'); const files = [];
for (const t of ts) { const b64 = await page.evaluate(f => window.grab(f), Math.round(Number(t) * FPS)); const f = `${tmp}/${String(files.length).padStart(3, '0')}.jpg`; fs.writeFileSync(f, Buffer.from(b64, 'base64')); files.push(f); }
await browser.close(); srv.close();
const cols = Math.min(files.length, Number(process.env.COLS || 6));
execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', `${tmp}/%03d.jpg`, '-vf', `scale=${process.env.TW || 360}:-1,tile=${cols}x${Math.ceil(files.length / cols)}:padding=6:color=gray`, '-frames:v', '1', outFile]);
console.log('wrote', outFile);
