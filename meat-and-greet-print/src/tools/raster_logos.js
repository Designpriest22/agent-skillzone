// Rasterise the vector logo into transparent PNGs (for small, many-page items).
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const dir = process.argv[2]; const svg = fs.readFileSync(path.join(dir, 'mg-logo-paths.svg'), 'utf8');
  const css = `.mg-color .mg-keyline{fill:#fff}.mg-color .mg-panel{fill:#0B0909}.mg-color .mg-amp{fill:#D81E1E}.mg-color .mg-flame{fill:#F05A28}.mg-color .mg-steak{fill:#A3171E}
.mg-bone .mg-keyline{fill:#EFE6D6}.mg-bone .mg-panel{fill:#0B0909}.mg-bone .mg-amp{fill:#EFE6D6}.mg-bone .mg-flame{fill:#EFE6D6}.mg-bone .mg-steak{fill:#0B0909}
.mg-red .mg-keyline{fill:#EFE6D6}.mg-red .mg-panel{fill:#B3121C}.mg-red .mg-amp{fill:#0B0909}.mg-red .mg-flame{fill:#0B0909}.mg-red .mg-steak{fill:#EFE6D6}`;
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 2400, height: 1907 } });
  for (const v of ['color', 'bone', 'red']) {
    await p.setContent(`<html><body style="margin:0;background:transparent"><style>${css} svg{width:2400px;height:1907px;display:block}</style>${svg.replace('<svg ', `<svg class="mg-${v}" `)}</body></html>`);
    await p.screenshot({ path: path.join(dir, `mg-logo-${v}.png`), omitBackground: true });
  }
  await b.close();
})();
