import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FPS = 30;
const DURATION = 15.0;
const TOTAL_FRAMES = Math.round(FPS * DURATION); // 450
const FRAMES_DIR = process.argv[2] || path.join(__dirname, 'frames');

fs.mkdirSync(FRAMES_DIR, { recursive: true });

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1500, height: 1200 }, deviceScaleFactor: 1 });
await page.goto('file://' + path.join(__dirname, 'index.html'));
await page.waitForFunction(() => typeof window.renderAtTime === 'function');
await page.evaluate(() => { window.__PAUSE_LOOP = true; });

const startTime = Date.now();
for (let i = 0; i < TOTAL_FRAMES; i++) {
  const t = i / FPS;
  await page.evaluate((tt) => window.renderAtTime(tt), t);
  const fname = path.join(FRAMES_DIR, 'frame_' + String(i).padStart(5, '0') + '.png');
  await page.screenshot({ path: fname });
  if (i % 30 === 0) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`frame ${i}/${TOTAL_FRAMES} (t=${t.toFixed(2)}s) — ${elapsed}s elapsed`);
  }
}
await browser.close();
console.log('done, total frames:', TOTAL_FRAMES);
