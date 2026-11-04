// node render.mjs [t1 t2 ...]  -> stills in out/frames, or the full video to out/money-or-lollipop.mp4
// The soundtrack is the source video's own audio: put it next to this file as audio.mp3
//   ffmpeg -i <source video> -vn -ac 2 -b:a 128k audio.mp3
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');
const dir = path.dirname(new URL(import.meta.url).pathname), out = path.join(dir, 'out');
fs.mkdirSync(path.join(out, 'frames'), { recursive: true });
const stills = process.argv.slice(2).map(Number);
const FPS = 30;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
p.on('pageerror', e => console.error('[page error]', e.message));
await p.goto('file://' + path.join(dir, 'index.html') + '?render=1'); await p.evaluate(() => window.ready);
const DUR = await p.evaluate(() => window.DURATION);
const shot = o => p.locator('#r').screenshot(o);
if (stills.length) {
  for (const t of stills) { await p.evaluate(t => window.renderAt(t), t); await shot({ path: path.join(out, 'frames', `t${t.toFixed(2).padStart(5, '0')}.png`) }); }
} else {
  const audio = path.join(dir, 'audio.mp3'), hasAudio = fs.existsSync(audio);
  const ff = spawn('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-', ...(hasAudio ? ['-i', audio] : []),
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS), ...(hasAudio ? ['-c:a', 'aac', '-b:a', '160k'] : []), '-t', String(DUR), '-movflags', '+faststart',
    path.join(out, 'money-or-lollipop.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] });
  const N = Math.round(FPS * DUR);
  for (let f = 0; f < N; f++) {
    await p.evaluate(t => window.renderAt(t), f / FPS);
    const buf = await shot({ type: 'png' });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 300 === 0) console.log('frame', f, '/', N);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
}
await b.close(); console.log('done');
