// node render.mjs [stills]  -> out/slide-N.mp4 (6 s, 1080x1350, with sound bed) + out/slide-N.png
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import path from 'node:path';
const { chromium } = createRequire(import.meta.url)('playwright');
const dir = path.dirname(new URL(import.meta.url).pathname), out = path.join(dir, 'out');
const stillsOnly = process.argv[2] === 'stills';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
page.on('pageerror', e => console.error('[page error]', e.message));
const run = (args, stdin) => new Promise((res, rej) => { const p = spawn('ffmpeg', args, { stdio: [stdin ? 'pipe' : 'ignore', 'inherit', 'inherit'] }); p.on('close', c => c ? rej(new Error('ffmpeg ' + c)) : res()); if (stdin) stdin(p); });
for (let n = 1; n <= 8; n++) {
  await page.goto('file://' + path.join(dir, 'carousel.html') + '?slide=' + n);
  await page.evaluate(() => window.ready);
  await page.evaluate(() => window.renderAt(5.2)); await page.waitForTimeout(80);
  await page.locator('#s').screenshot({ path: path.join(out, `slide-${n}.png`) });
  if (stillsOnly) { console.log('still', n); continue; }
  await run(['-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'png', '-i', '-', '-i', path.join(out, 'bed.wav'),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', '-b:a', '160k', '-t', '6', '-movflags', '+faststart',
    path.join(out, `slide-${n}.mp4`)], async p => {
      for (let f = 0; f < 180; f++) {
        await page.evaluate(t => window.renderAt(t), f / 30);
        await page.evaluate(() => Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))));
        const buf = await page.locator('#s').screenshot({ type: 'png' });
        if (!p.stdin.write(buf)) await new Promise(r => p.stdin.once('drain', r));
      }
      p.stdin.end();
    });
  console.log('slide', n);
}
await browser.close();
