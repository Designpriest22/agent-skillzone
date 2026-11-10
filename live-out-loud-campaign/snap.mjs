// Render individual frames as PNG for review: node snap.mjs 0.5 2.9 4.8 ...
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import path from 'node:path';
import fs from 'node:fs';

const dir = path.dirname(new URL(import.meta.url).pathname);
const out = path.join(dir, 'out', 'frames');
fs.mkdirSync(out, { recursive: true });
const times = process.argv.slice(2).map(Number);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
page.on('console', m => console.log('[page]', m.text()));
page.on('pageerror', e => console.error('[page error]', e.message));
await page.goto('file://' + path.join(dir, 'index.html') + '?render=1');
await page.evaluate(() => window.ready);
for (const t of times) {
  await page.evaluate(t => window.renderAt(t), t);
  const f = path.join(out, `t${t.toFixed(2)}.png`);
  await page.screenshot({ path: f });
  console.log(f);
}
await browser.close();
