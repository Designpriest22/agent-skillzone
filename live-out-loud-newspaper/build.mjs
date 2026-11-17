// node build.mjs -> out/page-1..4.png (1080x1350, Instagram carousel), out/live-out-loud-times.pdf, out/contact-sheet.png
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');

const dir = path.dirname(new URL(import.meta.url).pathname);
const out = path.join(dir, 'out'); fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 1400 }, deviceScaleFactor: 1 });
page.on('pageerror', e => console.error('[page error]', e.message));
page.on('requestfailed', r => console.error('[missing]', r.url()));
await page.goto('file://' + path.join(dir, 'index.html'));
await page.evaluate(() => window.ready);
// flag any text that overflows its page or box
const overflow = await page.evaluate(() => [...document.querySelectorAll('.page *')].filter(e => {
  const p = e.closest('.page').getBoundingClientRect(), r = e.getBoundingClientRect();
  return r.width && (r.bottom > p.bottom + 1 || r.right > p.right + 1);
}).map(e => e.className || e.tagName));
if (overflow.length) console.warn('overflow:', [...new Set(overflow)].join(', '));
for (let i = 1; i <= 4; i++) {
  await page.locator(`#p${i}`).screenshot({ path: path.join(out, `page-${i}.png`) });
}
// 2x renders + page text for the PowerPoint export (tools/make_pptx.py)
const hires = path.join(out, 'hires'); fs.mkdirSync(hires, { recursive: true });
const page2x = await browser.newPage({ viewport: { width: 1200, height: 1400 }, deviceScaleFactor: 2 });
await page2x.goto('file://' + path.join(dir, 'index.html'));
await page2x.evaluate(() => window.ready);
for (let i = 1; i <= 4; i++) {
  await page2x.locator(`#p${i}`).screenshot({ path: path.join(hires, `page-${i}@2x.png`) });
}
const text = await page2x.evaluate(() => [1, 2, 3, 4].map(i => document.getElementById(`p${i}`).innerText.replace(/\n{2,}/g, '\n').trim()));
fs.writeFileSync(path.join(hires, 'text.json'), JSON.stringify(text, null, 2));
await page2x.close();
await page.emulateMedia({ media: 'print' });
await page.pdf({ path: path.join(out, 'live-out-loud-times.pdf'), width: '1080px', height: '1350px', printBackground: true, preferCSSPageSize: true });
await browser.close();
console.log('done');
