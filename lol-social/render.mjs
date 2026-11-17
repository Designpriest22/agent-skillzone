// node render.mjs [stills|<id> ...]  -> out/<id>.png for stills, out/<id>.mp4 for motion (score from tools/score.py)
import { createRequire } from 'node:module';
import { spawn, execFileSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');
const dir = path.dirname(new URL(import.meta.url).pathname), out = path.join(dir, 'out');
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
p.on('pageerror', e => console.error('[page error]', e.message));
const open = async id => { await p.goto('file://' + path.join(dir, 'studio.html') + '?id=' + id); await p.evaluate(() => window.ready); return p.evaluate(() => window.COMP); };
const all = (await open('g1-word-hunt')).ids;
const arg = process.argv.slice(2), stillsOnly = arg[0] === 'stills';
const pick = stillsOnly || !arg.length ? all : all.filter(([k]) => arg.includes(k));
const settle = () => p.evaluate(() => Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))));
for (const [id, dur] of pick) {
  const c = await open(id); await p.setViewportSize({ width: c.w, height: c.h });
  if (!dur || stillsOnly) {
    if (dur) { await p.evaluate(t => window.renderAt(t), dur - .5); await settle(); }
    await p.locator('#c').screenshot({ path: path.join(out, `${id}${dur ? '-poster' : ''}.png`) }); console.log('still', id); continue;
  }
  const wav = path.join(out, `${id}.wav`);
  execFileSync('python3', [path.join(dir, 'tools/score.py'), id, String(dur), wav]);
  const ff = spawn('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'png', '-i', '-', '-i', wav,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', '-b:a', '192k', '-t', String(dur), '-movflags', '+faststart',
    path.join(out, `${id}.mp4`)], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let f = 0; f < dur * 30; f++) {
    await p.evaluate(t => window.renderAt(t), f / 30); await settle();
    const buf = await p.locator('#c').screenshot({ type: 'png' });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); fs.unlinkSync(wav); console.log('motion', id);
}
await b.close();
