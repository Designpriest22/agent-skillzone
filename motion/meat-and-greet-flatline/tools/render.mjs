// node render.mjs <html> <outSegment.mkv> <frameStart> <frameEnd>   (frames at 60fps, 3 subframes each)
import { chromium } from 'playwright';
import { spawn } from 'child_process';
const [html, out, f0s, f1s] = process.argv.slice(2);
const F0 = +f0s, F1 = +f1s, FPS = 60, SUB = 3, SHUTTER = 0.5; // 180° shutter, 3 samples across it
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
p.on('pageerror', e => { console.error('[pageerror]', e.message); process.exit(1); });
await p.goto('file://' + html); await p.evaluate('window.ready');
const ff = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(FPS * SUB), '-i', '-',
  '-vf', `tmix=frames=${SUB}:weights='1 1 1',select='eq(mod(n\\,${SUB})\\,${SUB - 1})',setpts=N/(${FPS}*TB)`,
  '-r', String(FPS), '-c:v', 'libx264rgb', '-qp', '0', '-preset', 'ultrafast', out], { stdio: ['pipe', 'inherit', 'inherit'] });
const t0 = Date.now();
for (let f = F0; f < F1; f++) {
  for (let s = 0; s < SUB; s++) {
    const t = f / FPS + (s - (SUB - 1) / 2) * (SHUTTER / FPS) / SUB;   // centred on the frame time
    await p.evaluate(`window.seek(${t}, ${f})`);
    const buf = await p.screenshot({ type: 'jpeg', quality: 100 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  if ((f - F0) % 30 === 0) console.log(`[${out}] frame ${f} / ${F1}  ${((Date.now() - t0) / 1000 / (f - F0 + 1)).toFixed(2)} s/frame`);
}
ff.stdin.end();
await new Promise(r => ff.on('close', r));
await b.close();
console.log(`[${out}] done in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
