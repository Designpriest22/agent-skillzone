// node render.mjs story|feed [t1 t2 ...]  -> stills to out/<fmt>-frames, or the full 25 s reel to out/iconiq-fola-<fmt>.mp4
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');
const dir = path.dirname(new URL(import.meta.url).pathname), out = path.join(dir, 'out');
const fmt = process.argv[2] || 'story', [W, H] = fmt === 'feed' ? [1080, 1350] : [1080, 1920];
const stills = process.argv.slice(3).map(Number), FPS = 30, DUR = 25;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: W, height: H } });
p.on('pageerror', e => console.error('[page error]', e.message));
await p.goto('file://' + path.join(dir, 'reel.html')); await p.evaluate(() => window.ready);
const settle = () => p.evaluate(() => Promise.all([...document.images].filter(i => i.offsetParent).map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))));
if (stills.length) {
  fs.mkdirSync(path.join(out, fmt + '-frames'), { recursive: true });
  for (const t of stills) { await p.evaluate(t => window.renderAt(t), t); await settle(); await p.screenshot({ path: path.join(out, fmt + '-frames', `t${t.toFixed(2)}.jpg`), quality: 85 }); }
} else {
  const ff = spawn('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-', '-i', path.join(out, 'mix.wav'),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', '-b:a', '256k', '-t', String(DUR), '-movflags', '+faststart',
    path.join(out, `iconiq-fola-${fmt}.mp4`)], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let f = 0; f < FPS * DUR; f++) {
    await p.evaluate(t => window.renderAt(t), f / FPS); await settle();
    const buf = await p.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 150 === 0) console.log(fmt, 'frame', f);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
}
await b.close(); console.log('done');
