// node board.mjs -> out/LOL-FEST-2026-merch-board.png + .pdf (run render.mjs first)
import { createRequire } from 'node:module';
import path from 'node:path';
const { chromium } = createRequire(import.meta.url)('playwright');
const dir = path.dirname(new URL(import.meta.url).pathname);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 2400, height: 1600 }, deviceScaleFactor: 1 });
page.on('pageerror', e => console.error('[page error]', e.message));
page.on('requestfailed', r => console.error('[missing]', r.url()));
await page.goto('file://' + path.join(dir, 'board.html'));
await page.evaluate(() => window.ready);
const h = await page.evaluate(() => document.getElementById('board').scrollHeight);
await page.locator('#board').screenshot({ path: path.join(dir, 'out', 'LOL-FEST-2026-merch-board.png') });
await page.pdf({ path: path.join(dir, 'out', 'LOL-FEST-2026-merch-board.pdf'), width: '2400px', height: `${h}px`, printBackground: true, pageRanges: '1' });
await browser.close();
console.log('board', h, 'px tall');
