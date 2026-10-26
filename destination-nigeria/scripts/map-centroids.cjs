/* eslint-disable @typescript-eslint/no-require-imports -- plain Node script */
/**
 * Adds a visual centre (bounding-box centre, nudged to lie inside the shape)
 * to every state outline in src/content/geo/nigeria-states.json, measured in a
 * real browser. These are drawing positions for map pins, not geographic
 * coordinates. Run after `npm run map:build`: node scripts/map-centroids.cjs
 */
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

(async () => {
  const file = path.join(__dirname, "..", "src", "content", "geo", "nigeria-states.json");
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${data.viewBox}">${data.states.map((s) => `<path id="${s.svgId}" d="${s.path}"/>`).join("")}</svg>`;
  await page.setContent(svg);
  const centres = await page.evaluate(() =>
    [...document.querySelectorAll("path")].map((p) => {
      const b = p.getBBox();
      let x = b.x + b.width / 2;
      let y = b.y + b.height / 2;
      const pt = p.ownerSVGElement.createSVGPoint();
      const inside = (px, py) => ((pt.x = px), (pt.y = py), p.isPointInFill(pt));
      if (!inside(x, y)) {
        // spiral outwards until inside the shape
        outer: for (let r = 2; r < Math.max(b.width, b.height); r += 2)
          for (let a = 0; a < Math.PI * 2; a += Math.PI / 12) {
            const nx = x + Math.cos(a) * r, ny = y + Math.sin(a) * r;
            if (inside(nx, ny)) { x = nx; y = ny; break outer; }
          }
      }
      return { id: p.id, cx: Math.round(x * 10) / 10, cy: Math.round(y * 10) / 10 };
    }),
  );
  await browser.close();
  for (const c of centres) Object.assign(data.states.find((s) => s.svgId === c.id), { cx: c.cx, cy: c.cy });
  fs.writeFileSync(file, JSON.stringify(data));
  console.log(`Centres written for ${centres.length} states`);
})();
