// Renders every campaign graphic to PNG at its exact platform size.
//   node build.mjs            → all days
//   node build.mjs 2 3        → only days 2 and 3
//   node build.mjs --sheets   → also write per-day contact sheets to ../previews
import { createRequire } from "node:module";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const HERE = path.dirname(fileURLToPath(import.meta.url));
const WEEK = path.resolve(HERE, "../..");
const EXPORTS = path.join(WEEK, "06 Final Exports");
const PREVIEWS = path.join(HERE, "../previews");

const args = process.argv.slice(2);
const only = args.filter((a) => /^\d$/.test(a)).map(Number);
const sheets = args.includes("--sheets");

const days = [];
for (let d = 1; d <= 7; d++) {
  if (only.length && !only.includes(d)) continue;
  try { days.push({ d, ...(await import(`./day${d}.mjs`)) }); } catch (e) { if (e.code !== "ERR_MODULE_NOT_FOUND") throw e; }
}

const browser = await chromium.launch({ args: ["--font-render-hinting=none", "--disable-lcd-text"] });
let count = 0;
for (const day of days) {
  const dir = path.join(EXPORTS, day.FOLDER);
  mkdirSync(dir, { recursive: true });
  const rendered = [];
  for (const a of day.assets()) {
    const page = await browser.newPage({ viewport: { width: a.w, height: a.h }, deviceScaleFactor: 1 });
    const errs = []; page.on("pageerror", (e) => errs.push(e.message));
    await page.setContent(a.html, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    const out = path.join(a.dir ?? dir, `${a.name}.png`);
    await page.screenshot({ path: out, type: "png" });
    if (a.alsoJpg) await page.screenshot({ path: path.join(a.alsoJpg, `${a.name}.jpg`), type: "jpeg", quality: 92 });
    if (errs.length) console.error(a.name, errs);
    await page.close();
    rendered.push({ ...a, out });
    count++;
    console.log(`✓ ${day.FOLDER}/${a.name}.png  ${a.w}×${a.h}`);
  }
  if (sheets) {
    mkdirSync(PREVIEWS, { recursive: true });
    const tiles = rendered.map((r) => `<figure><img src="data:image/png;base64,${readFileSync(r.out).toString("base64")}" style="height:${Math.round(r.h * 0.25)}px"><figcaption>${r.name}</figcaption></figure>`).join("");
    const page = await browser.newPage({ viewport: { width: 2200, height: 400 } });
    await page.setContent(`<body style="margin:0;padding:24px;background:#222;font:14px monospace;color:#bbb;display:flex;flex-wrap:wrap;gap:18px;align-items:flex-start;width:2152px">${tiles}<style>figure{margin:0}img{display:block}</style></body>`, { waitUntil: "load" });
    await page.screenshot({ path: path.join(PREVIEWS, `day${day.d}-sheet.jpg`), type: "jpeg", quality: 80, fullPage: true });
    await page.close();
  }
}
await browser.close();
console.log(`${count} graphics rendered.`);
