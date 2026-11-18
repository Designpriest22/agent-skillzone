// node render.mjs stills <sceneIdx|all> <t1,t2,...> [ratio]   -> out/stills/*.png  (ratio: 16x9 | 2x1)
// node render.mjs video  <sceneIdx|all> [ratio|both]            -> out/<ratio>/<id>.mp4  (15 s, 30 fps, loopable)
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import http from 'node:http';
const { chromium } = createRequire(import.meta.url)('playwright');
const dir = path.dirname(new URL(import.meta.url).pathname), out = path.join(dir, 'out');
const SIZES = { '16x9': [1920, 1080], '2x1': [2160, 1080] };
const [mode = 'stills', which = 'all', a3, a4] = process.argv.slice(2);
const FPS = 30, FRAMES = 15 * FPS;
const b = await chromium.launch({ args: ['--disable-gpu-sandbox'] });
const p = await b.newPage({ viewport: { width: 2160, height: 1080 } });
p.on('pageerror', e => console.error('[page error]', e.message));
p.on('console', m => m.type() === 'error' && console.error('[console]', m.text()));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2' };
const srv = http.createServer((q, s) => { const f = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { s.writeHead(404); s.end(); } else { s.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); s.end(d); } }); });
await new Promise(r => srv.listen(0, '127.0.0.1', r));
await p.goto(`http://127.0.0.1:${srv.address().port}/render.html`); await p.evaluate(() => window.ready);
const list = await p.evaluate(() => window.sceneList);
const pick = which === 'all' ? list : which.split(',').map(i => list[+i - 1]);
const grab = () => p.evaluate(() => document.getElementById('c').toDataURL('image/png').split(',')[1]).then(s => Buffer.from(s, 'base64'));
if (mode === 'stills') {
  const ts = (a3 || '0,5,10').split(',').map(Number), ratios = a4 ? [a4] : ['16x9'];
  fs.mkdirSync(path.join(out, 'stills'), { recursive: true });
  for (const s of pick) for (const r of ratios) {
    await p.evaluate(([id, w, h]) => window.setup(id, w, h), [s.id, ...SIZES[r]]);
    for (const t of ts) { await p.evaluate(t => window.renderAt(t), t); fs.writeFileSync(path.join(out, 'stills', `${s.id}_${r}_t${t.toFixed(2)}.png`), await grab()); }
  }
} else {
  const ratios = !a3 || a3 === 'both' ? ['16x9', '2x1'] : [a3];
  for (const s of pick) for (const r of ratios) {
    const [w, h] = SIZES[r]; fs.mkdirSync(path.join(out, r), { recursive: true });
    await p.evaluate(([id, w, h]) => window.setup(id, w, h), [s.id, w, h]);
    const file = path.join(out, r, `AAR&B_${s.id}_${r}.mp4`.replace('&', 'n'));
    const ff = spawn('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-movflags', '+faststart', file], { stdio: ['pipe', 'inherit', 'inherit'] });
    const t0 = Date.now();
    for (let f = 0; f < FRAMES; f++) {
      await p.evaluate(t => window.renderAt(t), f / FPS);
      const buf = await grab(); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
    console.log(`${s.id} ${r} done in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
}
await b.close(); srv.close();
