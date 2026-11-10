// node render.mjs [quick]  -> out/mockups/<garment>-<colourway>-<view>.png and close-ups
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');
const dir = path.dirname(new URL(import.meta.url).pathname);
const out = path.join(dir, 'out', 'mockups'); fs.mkdirSync(out, { recursive: true });
const quick = process.argv[2] === 'quick';
const jobs = [];
const G = ['tee', 'tank', 'jersey', 'polo'], C = ['onyx', 'chalk', 'ember'];
const HERO = { tee: 'onyx', tank: 'onyx', jersey: 'chalk', polo: 'ember' };
for (const g of G) for (const c of (quick ? [HERO[g]] : C)) for (const v of ['front', 'back']) jobs.push({ g, c, v });
for (const g of G) { jobs.push({ g, c: HERO[g], v: 'front', z: 'logo' }); jobs.push({ g, c: HERO[g], v: 'back', z: g === 'polo' ? 'nape' : 'number' }); }
jobs.push({ g: 'tee', c: 'onyx', v: 'back', z: 'number' });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1000, height: 1200 }, deviceScaleFactor: 1.6 });
page.on('pageerror', e => console.error('[page error]', e.message));
for (const j of jobs) {
  const qs = new URLSearchParams({ g: j.g, c: j.c, v: j.v, ...(j.z ? { z: j.z } : {}) });
  await page.goto('file://' + path.join(dir, 'view.html') + '?' + qs);
  await page.evaluate(() => window.ready);
  const name = `${j.g}-${j.c}-${j.v}${j.z ? '-' + j.z : ''}.png`;
  await page.locator('#v').screenshot({ path: path.join(out, name) });
  console.log(name);
}
await browser.close();
