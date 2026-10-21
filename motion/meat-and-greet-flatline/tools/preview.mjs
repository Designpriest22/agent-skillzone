// usage: node preview.mjs outdir t1 t2 ...   (or "beats" / "half")
import { chromium } from 'playwright';
import fs from 'fs';
const [outdir, ...rest] = process.argv.slice(2);
let times = [];
if (rest[0] === 'beats') for (let b = 0; b < 40; b++) times.push(b * 0.5);
else if (rest[0] === 'half') for (let b = 0; b < 80; b++) times.push(b * 0.25);
else if (rest[0] === 'range') { const [a, z, st] = rest.slice(1).map(Number); for (let t = a; t <= z + 1e-9; t += st) times.push(+t.toFixed(4)); }
else times = rest.map(Number);
fs.mkdirSync(outdir, { recursive: true });
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
p.on('console', m => console.log('[page]', m.text()));
p.on('pageerror', e => console.log('[pageerror]', e.message));
await p.goto('file://' + process.cwd() + '/flatline.html');
await p.evaluate('window.ready');
console.log(await p.evaluate('JSON.stringify(window.info())'));
for (const t of times) {
  const t0 = Date.now();
  await p.evaluate(`window.seek(${t})`);
  const f = `${outdir}/t${t.toFixed(3).padStart(6, '0')}.png`;
  await p.screenshot({ path: f });
  console.log(f, Date.now() - t0, 'ms');
}
await b.close();
