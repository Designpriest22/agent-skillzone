// node render.mjs [t1 t2 ...] -> stills in out/frames, or the full 22 s video to out/goat-money-test.mp4 (run `python3 score.py` first)
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');
const dir = path.dirname(new URL(import.meta.url).pathname), out = path.join(dir, 'out');
const stills = process.argv.slice(2).map(Number);
const FPS = 30, DUR = 22;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
p.on('pageerror', e => console.error('[page error]', e.message));
await p.goto('file://' + path.join(dir, 'index.html') + '?render=1'); await p.evaluate(() => window.ready);
const shot = (opts) => p.locator('#r').screenshot(opts);
if (stills.length) {
  fs.mkdirSync(path.join(out, 'frames'), { recursive: true });
  for (const t of stills) { await p.evaluate(t => window.renderAt(t), t); await shot({ path: path.join(out, 'frames', `t${t.toFixed(2)}.png`) }); }
} else {
  const ff = spawn('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-', '-i', path.join(out, 'score.wav'),
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-c:a', 'aac', '-b:a', '192k', '-t', String(DUR), '-movflags', '+faststart',
    path.join(out, 'goat-money-test.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let f = 0; f < FPS * DUR; f++) {
    await p.evaluate(t => window.renderAt(t), f / FPS);
    const buf = await shot({ type: 'png' });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 120 === 0) console.log('frame', f);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
}
await b.close(); console.log('done');
