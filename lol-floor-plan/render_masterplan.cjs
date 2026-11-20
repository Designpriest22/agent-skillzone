// Renders the logo masterplan HTML to an A2 landscape PDF and a PNG preview of sheet 1.
//   node render_masterplan.cjs <in.html> <out.pdf> [preview.png]
const { chromium } = require('playwright');
const path = require('path');
const [inp, out, png] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 2170, height: 1512 } });
  await p.goto('file://' + path.resolve(inp), { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  if (png) await (await p.$('section.page')).screenshot({ path: png });
  await p.pdf({ path: out, width: '594mm', height: '420mm', printBackground: true });
  await b.close();
})();
