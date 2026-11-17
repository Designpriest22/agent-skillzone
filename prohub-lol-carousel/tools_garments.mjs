// Render flat-lay garments (no studio backdrop) from the merch renderer -> assets/garments/*.png
import { createRequire } from 'node:module';
import path from 'node:path';
const { chromium } = createRequire(import.meta.url)('playwright');
const dir = path.dirname(new URL(import.meta.url).pathname), merch = path.join(dir, '..', 'lol-merch');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1000, height: 1200 }, deviceScaleFactor: 1 });
for (const [g, c, v] of [['tee', 'onyx', 'back'], ['polo', 'ember', 'front'], ['jersey', 'chalk', 'back']]) {
  await p.goto('file://' + path.join(merch, 'view.html') + `?g=${g}&c=${c}&v=${v}`);
  await p.evaluate(() => window.ready);
  await p.evaluate(o => { document.body.style.background = 'transparent'; document.documentElement.style.background = 'transparent';
    document.getElementById('v').innerHTML = MERCH.garmentSVG({ ...o, studio: false }); }, { g, c, v });
  await p.evaluate(() => window.ready);
  await p.locator('#v').screenshot({ path: path.join(dir, 'assets/garments', `${g}-${c}-${v}.png`), omitBackground: true });
}
await b.close(); console.log('garments ok');
