// Render every HTML page in the manifest to a vector PDF with headless Chromium.
// usage: node render.js manifest.json [filter]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const man = JSON.parse(fs.readFileSync(process.argv[2]));
  const filter = process.argv[3];
  const jobs = man.filter(j => !filter || j.html.includes(filter));
  const browser = await chromium.launch();
  const N = 4;
  let i = 0;
  async function worker() {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    while (i < jobs.length) {
      const j = jobs[i++];
      fs.mkdirSync(path.dirname(j.pdf), { recursive: true });
      const t0 = Date.now();
      await page.goto('file://' + j.html, { waitUntil: 'load', timeout: 300000 });
      await page.waitForFunction(() => document.body.dataset.ready === '1', null, { timeout: 300000 });
      await page.pdf({ path: j.pdf, preferCSSPageSize: true, printBackground: true, timeout: 600000 });
      console.log(`${((Date.now() - t0) / 1000).toFixed(1)}s  ${path.basename(j.pdf)}`);
    }
    await ctx.close();
  }
  await Promise.all(Array.from({ length: N }, worker));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
