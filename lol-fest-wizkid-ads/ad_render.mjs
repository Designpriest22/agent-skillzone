// Generic single-ad renderer: node ad_render.mjs <page.html> <format> <audio.wav> <out.mp4>
// The page must expose window.ready, window.meta {FPS,DUR}, window.grab(frame)->base64 jpeg, and read ?f=<format>.
import { createRequire } from 'node:module'; import { spawn } from 'node:child_process'; import path from 'node:path'; import fs from 'node:fs';
import { serve } from './serve.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const dir = path.dirname(new URL(import.meta.url).pathname);
const [pageFile, fmt, audio, out] = process.argv.slice(2);
if (!pageFile || !fmt || !out) { console.error('usage: ad_render.mjs <page.html> <format> <audio.wav|-> <out.mp4>'); process.exit(1); }
fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
const srv = await serve(dir); const browser = await chromium.launch(); const page = await browser.newPage();
page.on('pageerror', e => { console.error('PAGE ERROR', e.message); });
page.on('console', m => m.type() === 'error' && console.error('[console]', m.text()));
await page.goto(`${srv.url}/${pageFile}?render=1&f=${fmt}`); await page.evaluate(() => window.ready);
const { FPS, DUR } = await page.evaluate(() => window.meta);
const haveAudio = audio && audio !== '-' && fs.existsSync(audio);
const args = ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-'];
if (haveAudio) args.push('-i', audio, '-map', '0:v', '-map', '1:a');
args.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-profile:v', 'high', '-level', '4.2', '-pix_fmt', 'yuv420p',
  '-r', String(FPS), '-g', String(FPS * 2), '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709');
if (haveAudio) args.push('-c:a', 'aac', '-b:a', '192k', '-ar', '48000');
args.push('-t', String(DUR), '-movflags', '+faststart', out);
const ff = spawn('ffmpeg', args, { stdio: ['pipe', 'inherit', 'inherit'] });
const N = Math.round(FPS * DUR);
for (let f = 0; f < N; f++) {
  const b = Buffer.from(await page.evaluate(f => window.grab(f), f), 'base64');
  if (!ff.stdin.write(b)) await new Promise(r => ff.stdin.once('drain', r));
  if (f % 50 === 0) process.stderr.write(`\r${pageFile} ${fmt}: ${f}/${N}`);
}
ff.stdin.end(); await new Promise((res, rej) => ff.on('close', c => c ? rej(new Error('ffmpeg ' + c)) : res()));
await browser.close(); srv.close();
console.error(`\n${out} done`);
