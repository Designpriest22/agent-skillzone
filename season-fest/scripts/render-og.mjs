#!/usr/bin/env node
/**
 * Renders public/og/season-fest-og.jpg (1200×630) from the real artwork,
 * fonts and grill photography. Re-run after changing the date/venue:
 *
 *   npm run og
 */
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

function loadPlaywright() {
  const req = createRequire(import.meta.url);
  try {
    return req('playwright');
  } catch {
    const globalRoot = execSync('npm root -g').toString().trim();
    return createRequire(globalRoot + '/')('playwright');
  }
}

const root = resolve(import.meta.dirname, '..');
const f = (p) => pathToFileURL(join(root, p)).href;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:BSD;src:url(${f('node_modules/@fontsource-variable/big-shoulders-display/files/big-shoulders-display-latin-wght-normal.woff2')}) format('woff2');font-weight:100 900}
@font-face{font-family:IS;font-style:italic;src:url(${f('node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2')}) format('woff2')}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;overflow:hidden;background:#0b0807;color:#f7f2ec;font-family:BSD,sans-serif;position:relative}
.glow{position:absolute;inset:0;background:radial-gradient(60% 55% at 30% 115%,rgba(255,94,26,.55),transparent 70%),radial-gradient(90% 70% at 25% 120%,rgba(117,20,27,.95),transparent 75%)}
.grill{position:absolute;right:-40px;top:-30px;height:700px;-webkit-mask-image:linear-gradient(90deg,transparent 0,#000 35%);mask-image:linear-gradient(90deg,transparent 0,#000 35%)}
.mg{position:absolute;right:46px;top:40px;width:150px;filter:drop-shadow(0 8px 20px rgba(0,0,0,.6))}
.left{position:absolute;left:64px;top:46px;width:640px;display:flex;flex-direction:column;align-items:center;text-align:center}
.eyebrow{font-weight:700;font-size:20px;letter-spacing:.3em;color:#cfc8c1;text-transform:uppercase}
.logo{width:560px;margin:14px 0 8px;filter:drop-shadow(0 16px 40px rgba(255,60,20,.4))}
.statement{font-family:IS,serif;font-style:italic;font-size:40px;line-height:1.05}
.meta{margin-top:20px;font-weight:800;font-size:30px;letter-spacing:.14em;text-transform:uppercase;display:flex;gap:22px;align-items:center}
.meta b{color:#ffb547;font-weight:800}
.meta i{width:34px;height:2px;background:#ff5e1a}
.prod{position:absolute;left:64px;right:0;bottom:30px;width:640px;display:flex;justify-content:center;align-items:center;gap:14px;font-weight:700;font-size:16px;letter-spacing:.28em;color:#cfc8c1;text-transform:uppercase}
.prod img{height:34px}.prod .c{height:26px}.prod span.x{color:#ff5e1a;font-size:22px;letter-spacing:0}
</style></head><body>
<div class="glow"></div>
<img class="grill" src="${f('src/assets/food/grill-closeup.jpg')}">
<img class="mg" src="${f('src/assets/brand/meat-and-greet-logo.png')}">
<div class="left">
  <p class="eyebrow">MEAT &amp; GREET · Christmas Eve edition</p>
  <img class="logo" src="${f('src/assets/brand/season-fest-logo.webp')}">
  <p class="statement">A Christmas Eve gathering with bite.</p>
  <p class="meta"><b>Thu 24 Dec 2026</b><i></i><span>Harrow Park, Abuja</span></p>
</div>
<div class="prod">Produced by <img src="${f('src/assets/brand/tcm-logo.png')}"><span class="x">×</span><img class="c" src="${f('src/assets/brand/the-clique-logo.png')}"></div>
</body></html>`;

const dir = mkdtempSync(join(tmpdir(), 'sf-og-'));
const file = join(dir, 'og.html');
writeFileSync(file, html);

const { chromium } = loadPlaywright();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(file).href, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
mkdirSync(join(root, 'public/og'), { recursive: true });
await page.screenshot({ path: join(root, 'public/og/season-fest-og.jpg'), type: 'jpeg', quality: 86 });
await browser.close();
console.log('Wrote public/og/season-fest-og.jpg');
