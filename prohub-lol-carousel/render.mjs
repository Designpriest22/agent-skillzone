// node render.mjs [stills] -> out/slide-N.png for all 8; out/slide-N.mp4 for the video slides (clip audio kept)
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');
const dir = path.dirname(new URL(import.meta.url).pathname), out = path.join(dir, 'out');
fs.mkdirSync(out, { recursive: true });
for (const f of fs.readdirSync(out)) if (/^slide-\d\.(png|mp4)$/.test(f)) fs.unlinkSync(path.join(out, f));
const VIDEO = { 1: 'walk', 3: 'reel', 6: 'pyro' };
const stillsOnly = process.argv[2] === 'stills';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
page.on('pageerror', e => console.error('[page error]', e.message));
const settle = () => page.evaluate(() => Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))));
for (let n = 1; n <= 8; n++) {
  await page.goto('file://' + path.join(dir, 'carousel.html') + '?slide=' + n);
  await page.evaluate(() => window.ready);
  await page.evaluate(() => window.renderAt(2.4)); await settle();
  await page.locator('#view').screenshot({ path: path.join(out, `slide-${n}.png`) });
  if (stillsOnly || !VIDEO[n]) { console.log('still', n); continue; }
  const ff = spawn('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'png', '-i', '-',
    '-i', path.join(dir, 'assets/clips', VIDEO[n], 'audio.wav'), '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', '30',
    '-c:a', 'aac', '-b:a', '192k', '-t', '6', '-movflags', '+faststart', path.join(out, `slide-${n}.mp4`)], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let f = 0; f < 180; f++) {
    await page.evaluate(t => window.renderAt(t), f / 30); await settle();
    const buf = await page.locator('#view').screenshot({ type: 'png' });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  console.log('video', n);
}
await browser.close();
