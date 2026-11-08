// node render_v3.mjs [filter]   final sponsor ads (v3, approved): 13 sponsors x 3 formats, 15 s, the supplied song edit
//  00:00-00:04 sponsor intro · 00:04-00:11 Wizkid footage + LOL FEST / WIZKID / date / venue · 00:11-00:15 end frame with WIZKID.TIX.AFRICA
import { createRequire } from 'node:module'; import { spawn } from 'node:child_process'; import path from 'node:path'; import fs from 'node:fs';
import { serve } from './serve.mjs';
import { SPN } from './render20.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const dir = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(dir, 'out', '_work', 'v3');
const SONG = process.env.SONG || path.join(dir, 'out/DELIVERY/LOLFEST_WIZKID_CAMPAIGN/07-PROJECT-FILES-ASSETS/music/Final-Baba-Nla_edit_15s.wav');
export const FMT3 = { reels: '1080x1920_9x16_Stories-Reels-TikTok', feed: '1080x1350_4x5_Feed', square: '1080x1080_1x1_Square' };
export const jobs3 = [];
for (const [s, n] of Object.entries(SPN)) for (const [f, tag] of Object.entries(FMT3)) jobs3.push({ id: `${s}-${f}`, s, f, n, file: path.join(n, `LOLFEST_x_${n.slice(3)}_15s_${tag}.mp4`) });
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const todo = jobs3.filter(j => !process.argv[2] || j.id.includes(process.argv[2]));
  const srv = await serve(dir); const browser = await chromium.launch(); const q = [...todo];
  await Promise.all(Array.from({ length: Number(process.env.CONC || 4) }, async () => { while (q.length) { const j = q.shift();
    const page = await browser.newPage(); page.on('pageerror', e => console.error(j.id, 'page error', e.message));
    await page.goto(`${srv.url}/sponsors_v3.html?render=1&s=${j.s}&f=${j.f}`); await page.evaluate(() => window.ready);
    const { FPS, DUR } = await page.evaluate(() => window.meta); const out = path.join(OUT, j.file); fs.mkdirSync(path.dirname(out), { recursive: true });
    const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-i', SONG, '-map', '0:v', '-map', '1:a',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-profile:v', 'high', '-level', '4.2', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-g', String(FPS * 2),
      '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-t', String(DUR), '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let f = 0; f < FPS * DUR; f++) { const b = Buffer.from(await page.evaluate(f => window.grab(f), f), 'base64'); if (!ff.stdin.write(b)) await new Promise(r => ff.stdin.once('drain', r)); }
    ff.stdin.end(); await new Promise((res, rej) => ff.on('close', c => c ? rej(new Error('ffmpeg ' + c)) : res())); await page.close(); console.log('done', j.id);
  } }));
  await browser.close(); srv.close(); console.log('all renders done');
}
