// node render.mjs [t1 t2 ...]  -> stills to out/frames, or the full 20 s reel to out/prohub-lol-reel.mp4
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');
const dir = path.dirname(new URL(import.meta.url).pathname), out = path.join(dir, 'out');
const stills = process.argv.slice(2).map(Number);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
p.on('pageerror', e => console.error('[page error]', e.message));
await p.goto('file://' + path.join(dir, 'reel.html')); await p.evaluate(() => window.ready);
const settle = () => p.evaluate(() => Promise.all([...document.images].filter(i => i.offsetParent).map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))));
if (stills.length) {
  fs.mkdirSync(path.join(out, 'frames'), { recursive: true });
  for (const t of stills) { await p.evaluate(t => window.renderAt(t), t); await settle(); await p.locator('#r').screenshot({ path: path.join(out, 'frames', `t${t.toFixed(2)}.png`) }); }
} else {
  const ff = spawn('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'png', '-i', '-', '-i', path.join(out, 'score.wav'),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', '-b:a', '192k', '-t', '20', '-movflags', '+faststart',
    path.join(out, 'prohub-lol-reel.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let f = 0; f < 600; f++) {
    await p.evaluate(t => window.renderAt(t), f / 30); await settle();
    const buf = await p.locator('#r').screenshot({ type: 'png' });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 100 === 0) console.log('frame', f);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
}
await b.close(); console.log('done');
