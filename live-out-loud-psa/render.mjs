// node render.mjs
// Renders the transparent overlay (overlay.html) frame by frame and composites it onto the
// cropped source clip with ffmpeg -> out/live-out-loud-psa.mp4 (+ preview stills).
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');

const dir = path.dirname(new URL(import.meta.url).pathname);
const out = path.join(dir, 'out'); fs.mkdirSync(out, { recursive: true });
const cfg = JSON.parse(fs.readFileSync(path.join(dir, 'config.js'), 'utf8').replace(/^\s*window\.CONFIG\s*=\s*|;\s*$/g, ''));
const { fps: FPS, duration: DUR } = cfg;
const { x, y, w, h } = cfg.source.crop;
const T = cfg.title, A = cfg.artwork;
const mp4 = path.join(out, 'live-out-loud-psa.mp4');

// footage: crop away the screen-recording bars, cover-scale to 1080x1920,
// blurred+darkened copies fade over it behind the title card and the artwork
const vf = [
  `[0:v]fps=${FPS},crop=${w}:${h}:${x}:${y},scale=-2:1920:flags=lanczos,crop=1080:1920,setsar=1,split=3[base][b1s][b2s]`,
  `[b1s]scale=270:480,gblur=sigma=5,eq=brightness=-0.06:saturation=0.85,scale=1080:1920,format=yuva420p,fade=t=out:st=${T.out}:d=0.35:alpha=1[b1]`,
  `[b2s]scale=270:480,gblur=sigma=7,eq=brightness=-0.12:saturation=0.9,scale=1080:1920,format=yuva420p,fade=t=in:st=${A.in - 0.1}:d=0.3:alpha=1[b2]`,
  `[base][b1]overlay=format=auto[v1]`, `[v1][b2]overlay=format=auto[v2]`,
  `[1:v]format=rgba[ov]`, `[v2][ov]overlay=format=auto,format=yuv420p[vout]`,
  `[0:a]afade=t=out:st=${DUR - 0.6}:d=0.6,loudnorm=I=-14:TP=-1.0:LRA=11,aresample=48000[aout]`
].join(';');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
page.on('pageerror', e => console.error('[page error]', e.message));
await page.goto('file://' + path.join(dir, 'overlay.html') + '?render=1');
await page.evaluate(() => window.ready);

const ff = spawn('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error',
  '-i', path.join(dir, cfg.source.file),
  '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
  '-filter_complex', vf, '-map', '[vout]', '-map', '[aout]',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-profile:v', 'high', '-level', '4.2', '-pix_fmt', 'yuv420p',
  '-r', String(FPS), '-g', String(FPS), '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
  '-c:a', 'aac', '-b:a', '192k', '-t', String(DUR), '-movflags', '+faststart', mp4], { stdio: ['pipe', 'inherit', 'inherit'] });

const t0 = Date.now();
for (let f = 0; f < FPS * DUR; f++) {
  await page.evaluate(t => window.renderAt(t), f / FPS);
  const buf = await page.screenshot({ type: 'png', omitBackground: true });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (f % 90 === 0) console.log(`frame ${f}/${FPS * DUR}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
ff.stdin.end();
await new Promise((res, rej) => ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg exit ' + c))));
await browser.close();

// preview stills straight from the finished video
for (const [name, t] of [['preview-title', 2.9], ['preview-clip', 8.0], ['preview-artwork', 24.0]]) {
  await new Promise(r => spawn('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(t), '-i', mp4, '-frames:v', '1', '-q:v', '2',
    path.join(out, `${name}.jpg`)]).on('close', r));
}
console.log('done', mp4);
