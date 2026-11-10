// Full render: node render.mjs  ->  out/live-out-loud-dec13-checklist.mp4 (+ preview stills)
// Requires out/audio.wav (python3 audio.py) and ffmpeg on PATH.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');

const dir = path.dirname(new URL(import.meta.url).pathname);
const out = path.join(dir, 'out');
fs.mkdirSync(out, { recursive: true });
const FPS = 30, DUR = 15, FRAMES = FPS * DUR;
const mp4 = path.join(out, 'live-out-loud-dec13-checklist.mp4');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
page.on('pageerror', e => console.error('[page error]', e.message));
await page.goto('file://' + path.join(dir, 'index.html') + '?render=1');
await page.evaluate(() => window.ready);

const ff = spawn('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error',
  '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
  '-i', path.join(out, 'audio.wav'),
  '-map', '0:v', '-map', '1:a',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-profile:v', 'high', '-level', '4.2',
  '-pix_fmt', 'yuv420p', '-r', String(FPS), '-g', String(FPS),
  '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
  '-af', 'loudnorm=I=-14:TP=-1.0:LRA=11', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
  '-t', String(DUR), '-movflags', '+faststart', mp4], { stdio: ['pipe', 'inherit', 'inherit'] });

const t0 = Date.now();
for (let f = 0; f < FRAMES; f++) {
  await page.evaluate(t => window.renderAt(t), f / FPS);
  const buf = await page.screenshot({ type: 'png' });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (f % 60 === 0) console.log(`frame ${f}/${FRAMES}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
ff.stdin.end();
await new Promise((res, rej) => ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg exit ' + c))));

// preview stills
for (const [name, t] of [['preview-checklist', 6.4], ['preview-drop', 10.2], ['preview-final', 14.9]]) {
  await page.evaluate(t => window.renderAt(t), t);
  await page.screenshot({ path: path.join(out, `${name}.jpg`), type: 'jpeg', quality: 92 });
}

await browser.close();
console.log('done', mp4);
