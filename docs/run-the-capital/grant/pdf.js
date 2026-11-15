// Renders each grant-pack section to its own branded PDF, plus one combined pack.
// Usage: node docs/run-the-capital/grant/pdf.js   (after build.py)
const path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');

const HERE = __dirname;
const DOCS = [
  ['profile', '01_TCM_Company_Profile.pdf', 'Business / Company Profile'],
  ['project', '02_Project_Description.pdf', 'Project Description'],
  ['business-plan', '03_Business_Plan.pdf', 'Business Plan'],
  ['budget', '04_Project_Budget.pdf', 'Project Budget'],
  ['implementation', '05_Implementation_Plan.pdf', 'Implementation Plan'],
];
const PAGE = { width: '1280px', height: '1810px', printBackground: true, margin: { top: '0', bottom: '0', left: '0', right: '0' } };

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 1810 } });
  await p.emulateMedia({ media: 'print', reducedMotion: 'reduce' });
  await p.goto('file://' + path.join(HERE, 'grant-pack.html'));
  await p.waitForLoadState('networkidle').catch(() => {});
  await p.waitForTimeout(800);
  await p.addStyleTag({ content: `
    .pdf-head { display: flex; justify-content: space-between; align-items: center; padding: 28px 50px; border-bottom: 1px solid var(--line); }
    .pdf-head img { height: 34px; width: auto; }
    .pdf-head span { font: 600 12px var(--mono); letter-spacing: .12em; text-transform: uppercase; color: var(--muted); }
    section.doc { break-before: auto !important; padding-block: 40px !important; }
    .hero { display: none; }
    footer { break-inside: avoid; }` });
  const logo = await p.getAttribute('.topbar img', 'src');
  for (const [id, file, title] of DOCS) {
    await p.evaluate(({ id, title, logo }) => {
      document.querySelectorAll('.pdf-head').forEach((n) => n.remove());
      document.querySelectorAll('section.doc').forEach((s) => { s.style.display = s.id === id ? '' : 'none'; });
      const h = document.createElement('div'); h.className = 'pdf-head';
      h.innerHTML = `<img alt="TCM"><span>Run The Capital · ${title} · The Capital Movement · November 2026</span>`;
      h.querySelector('img').src = logo;
      document.querySelector('main').prepend(h);
    }, { id, title, logo });
    await p.pdf({ path: path.join(HERE, file), ...PAGE });
    console.log('wrote', file);
  }
  // Combined pack: cover hero + all sections
  await p.evaluate(() => {
    document.querySelectorAll('.pdf-head').forEach((n) => n.remove());
    document.querySelectorAll('section.doc').forEach((s) => { s.style.display = ''; s.style.breakBefore = 'page'; });
    document.querySelector('.hero').style.display = 'block';
  });
  await p.pdf({ path: path.join(HERE, 'TCM_RunTheCapital_Grant_Pack.pdf'), ...PAGE });
  console.log('wrote TCM_RunTheCapital_Grant_Pack.pdf');
  await b.close();
})();
