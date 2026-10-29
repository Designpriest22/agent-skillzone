// Generic headless renderer for the Destination Nigeria brand kit.
// Usage: node render.mjs jobs.json
// jobs.json = [{ src, out, w, h, scale?, format?: png|jpg|webp|pdf, transparent?, pdfW?, pdfH?, quality? }]
//  - src may be .svg (inlined into a blank page so installed brand fonts resolve) or .html
//  - w/h are CSS pixels of the artboard; scale multiplies the raster output
//  - pdf output keeps vector artwork; pdfW/pdfH accept CSS units ("210mm")
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = createRequire(import.meta.url)('playwright');

const jobs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const browser = await chromium.launch();
const pages = new Map();

async function pageFor(scale) {
  if (!pages.has(scale)) {
    const ctx = await browser.newContext({ deviceScaleFactor: scale });
    const p = await ctx.newPage();
    p.on('pageerror', e => console.error('[page error]', e.message));
    pages.set(scale, p);
  }
  return pages.get(scale);
}

let n = 0;
for (const j of jobs) {
  const fmt = j.format || path.extname(j.out).slice(1).replace('jpeg', 'jpg');
  const scale = fmt === 'pdf' ? 1 : (j.scale || 1);
  const page = await pageFor(scale);
  await page.setViewportSize({ width: Math.round(j.w), height: Math.round(j.h) });
  const src = path.resolve(j.src);
  if (src.endsWith('.svg') && j.direct) {
    await page.goto('file://' + src, { waitUntil: 'load' });
  } else if (src.endsWith('.svg')) {
    if (!page.url().startsWith('about:')) await page.goto('about:blank');
    const svg = fs.readFileSync(src, 'utf8').replace(/<\?xml[^>]*\?>/, '');
    const bg = j.transparent ? 'transparent' : (j.bg || 'transparent');
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
      @page{margin:0}html,body{margin:0;padding:0;background:${bg};width:${j.w}px;height:${j.h}px;overflow:hidden}
      svg{display:block;width:${j.w}px;height:${j.h}px}</style></head><body>${svg}</body></html>`,
      { waitUntil: 'load' });
  } else {
    await page.goto('file://' + src + (j.query || ''), { waitUntil: 'load' });
  }
  await page.evaluate(() => document.fonts && document.fonts.ready);
  if (j.wait) await page.waitForTimeout(j.wait);
  fs.mkdirSync(path.dirname(path.resolve(j.out)), { recursive: true });
  if (fmt === 'pdf') {
    await page.emulateMedia({ media: 'print' });
    await page.pdf({ path: j.out, width: j.pdfW || `${j.w}px`, height: j.pdfH || `${j.h}px`,
      printBackground: true, preferCSSPageSize: !!j.cssPage, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
    await page.emulateMedia({ media: 'screen' });
  } else {
    const opts = { path: fmt === 'webp' ? undefined : j.out, type: fmt === 'jpg' ? 'jpeg' : 'png',
      omitBackground: !!j.transparent, fullPage: !!j.fullPage };
    if (fmt === 'jpg') opts.quality = j.quality || 90;
    const buf = await page.screenshot(opts);
    if (fmt === 'webp') fs.writeFileSync(j.out + '.png', buf);
  }
  n++;
}
await browser.close();
console.log(`rendered ${n} file(s)`);
