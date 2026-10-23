// Render PNG copies of the main SVG files for people who need raster logos
// (slides, documents, social uploads). Usage: node export_png.js <logos-dir>
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const WANT = ['mark-positive', 'mark-reverse', 'horizontal-positive', 'horizontal-reverse', 'stacked-positive'];

(async () => {
  const dir = process.argv[2];
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  for (const concept of fs.readdirSync(dir).filter((d) => fs.statSync(path.join(dir, d)).isDirectory())) {
    const out = path.join(dir, concept, 'png');
    fs.mkdirSync(out, { recursive: true });
    for (const name of WANT) {
      const svg = fs.readFileSync(path.join(dir, concept, `${name}.svg`), 'utf8');
      const [, w, h] = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
      const width = name.startsWith('mark') ? 1024 : 2400;
      const height = Math.round((width * h) / w);
      const pad = Math.round(width * 0.06);
      const bg = name.endsWith('reverse') ? '#0B2A1F' : 'transparent';
      await page.setViewportSize({ width: width + pad * 2, height: height + pad * 2 });
      await page.setContent(`<body style="margin:0;background:${bg}"><div style="padding:${pad}px;line-height:0">` +
        svg.replace(/width="[^"]+" height="[^"]+"/, `width="${width}" height="${height}"`) + '</div></body>');
      await page.screenshot({ path: path.join(out, `${name}.png`), omitBackground: bg === 'transparent' });
    }
  }
  await browser.close();
})();
