// Renders index.html to an A3 PDF plus per-sheet PNG previews.
// Usage: node render_pdf.mjs   (needs Playwright + Chromium)
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const here = new URL('./', import.meta.url);
mkdirSync(new URL('out/', here), { recursive: true });
const body = readFileSync(new URL('index.html', here), 'utf8');
const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>${body}</body></html>`;
writeFileSync(new URL('out/preview.html', here), html);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 1 });
await page.goto(new URL('out/preview.html', here).href, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
const sheets = await page.$$('section.page');
for (let i = 0; i < sheets.length; i++) {
  await sheets[i].screenshot({ path: new URL(`out/sheet-${i}.png`, here).pathname });
}
await page.pdf({
  path: new URL('out/LOL-Festival-2026-Brand-Placement-Plan.pdf', here).pathname,
  format: 'A3', landscape: true, printBackground: true,
});
await browser.close();
console.log('rendered', sheets.length, 'sheets');
