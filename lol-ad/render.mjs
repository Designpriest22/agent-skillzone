// node render.mjs <story|feed|square|wide> [t1 t2 ...]   stills -> out/frames/<f>-<t>.png ; full -> out/_<f>.mp4 (silent)
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');
const dir = path.dirname(new URL(import.meta.url).pathname), out = path.join(dir, 'out');
const [f, ...ts] = process.argv.slice(2); const DUR = 25, FPS = 30;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1920 } });
p.on('pageerror', e => console.error('[page error]', e.message));
await p.goto('file://' + path.join(dir, 'ad.html') + '?f=' + f); await p.evaluate(() => window.ready);
const settle = () => p.evaluate(() => Promise.all([...document.images].filter(i => i.offsetParent).map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))));
const shot = async t => { await p.evaluate(t => window.renderAt(t), t); await settle(); return p.locator('#v').screenshot({ type: 'jpeg', quality: 95 }); };
if (ts.length) { fs.mkdirSync(path.join(out, 'frames'), { recursive: true }); for (const t of ts.map(Number)) fs.writeFileSync(path.join(out, 'frames', `${f}-${t.toFixed(2)}.jpg`), await shot(t)); }
else {
  const ff = spawn('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(FPS), path.join(out, `_${f}.mp4`)], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = 0; i < DUR * FPS; i++) { const buf = await shot(i / FPS); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); if (i % 150 === 0) console.log(f, i); }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
}
await b.close(); console.log('done', f);
