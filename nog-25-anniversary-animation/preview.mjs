import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const times = process.argv.slice(2).map(Number);

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1500, height: 1200 } });
await page.goto('file://' + path.join(__dirname, 'index.html'));
await page.waitForFunction(() => typeof window.renderAtTime === 'function');
await page.evaluate(() => { window.__PAUSE_LOOP = true; });

for (const t of times) {
  await page.evaluate((tt) => window.renderAtTime(tt), t);
  const out = path.join(__dirname, 'preview_' + t.toString().replace('.', '_') + '.png');
  await page.screenshot({ path: out });
  console.log('wrote', out);
}
await browser.close();
