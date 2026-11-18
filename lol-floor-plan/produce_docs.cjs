// Produces the brand allocation PDFs from the live desk's data.
// Runs desk.html in Chromium with a local stand-in for the artifact database,
// uses the page's own document generator, and prints each document to PDF.
//   node produce_docs.cjs <data.json> <logo-dir> <out-dir>
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const [dataFile, logoDir, outDir] = process.argv.slice(2);
const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
for (const b of Object.values(data.brands)) {
  const f = path.join(logoDir, b.logoId + '.png');
  if (fs.existsSync(f)) b.logoUrl = 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
}
fs.mkdirSync(outDir, { recursive: true });

const desk = fs.readFileSync(path.join(__dirname, 'desk.html'), 'utf8');
const mock = `<script>(()=>{const store=${JSON.stringify({ brands: data.brands, alloc: data.alloc })};
const snap=c=>({docs:Object.entries(store[c]).map(([id,v])=>({id,exists:true,data:()=>v})),size:0,empty:false});
const coll=c=>({onSnapshot(f){setTimeout(()=>f(snap(c)));return()=>{}},doc(id){return{}}});
const db={collection:coll,doc:()=>({})};
window.claude={use:async n=>n==='db'?db:n==='user'?{can:async()=>false}:n==='downloads'?{save:async r=>{window.__saved=r;return{status:'saved'}}}:null};})();</script>`;
const page = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${mock}${desk}</body></html>`;
const tmp = path.join(outDir, '_desk.html');
fs.writeFileSync(tmp, page);

(async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.goto('file://' + tmp);
  await p.waitForFunction(() => document.querySelectorAll('#brands .brand').length > 0);
  await p.click('.tab[data-tab="docs"]');

  const printer = await browser.newPage();
  const toPdf = async (html, file) => {
    const f = path.join(outDir, '_doc.html');
    fs.writeFileSync(f, html);
    await printer.goto('file://' + f, { waitUntil: 'networkidle' });
    await printer.evaluate(() => document.fonts.ready);
    await printer.pdf({ path: path.join(outDir, file), format: 'A4', landscape: true, printBackground: true });
  };

  const ids = await p.$$eval('#doc-brands [data-doc]', els => els.map(e => e.dataset.doc));
  for (const id of ids) {
    const b = data.brands[id];
    await p.evaluate(() => { window.__saved = null; });
    await p.click(`#doc-brands [data-doc="${id}"]`);
    if (await p.isDisabled('#dl-doc')) { console.log('skip (no slots)', b.name); continue; }
    await p.click('#dl-doc');
    await p.waitForFunction(() => window.__saved);
    const saved = await p.evaluate(() => window.__saved);
    const file = saved.filename.replace(/\.html$/, '.pdf');
    await toPdf(saved.data, file);
    console.log('wrote', file);
  }
  await p.click('.tab[data-tab="master"]');
  await p.evaluate(() => { window.__saved = null; });
  await p.click('#dl-master');
  await p.waitForFunction(() => window.__saved);
  await toPdf(await p.evaluate(() => window.__saved.data), 'LOL2026_brand-masterplan.pdf');
  console.log('wrote masterplan; errors:', JSON.stringify(errors));
  if (!process.env.KEEP) { fs.unlinkSync(tmp); fs.unlinkSync(path.join(outDir, '_doc.html')); }
  await browser.close();
})();
