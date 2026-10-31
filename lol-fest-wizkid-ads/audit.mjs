// node audit.mjs [filter]   strict content review of every spot (every 2nd frame):
//  1. every typeset string must be a substring of an APPROVED line (flyer / brief)
//  2. the final 5 s may draw sponsor logos ONLY (no text, no festival logo, no wordmark, no footage)
//  3. the four communication priorities must each appear: festival logo, WIZKID, DECEMBER 13, 2026, EAGLE SQUARE, ABUJA
//  4. story animations may not use performance footage; cinematic ads may not use the flyer photograph
import { createRequire } from 'node:module'; import path from 'node:path'; import fs from 'node:fs';
import { serve } from './serve.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const dir = path.dirname(new URL(import.meta.url).pathname);
const jobs = [];
for (const c of ['c1', 'c2', 'c3']) for (const f of ['story', 'reels', 'feed', 'square', 'land', 'bbL', 'bbP']) jobs.push({ id: `${c}-${f}`, page: 'ads.html', q: `c=${c}&f=${f}`, kind: 'ad' });
for (const s of ['s1', 's2', 's3', 's4', 's5']) jobs.push({ id: `${s}`, page: 'stories.html', q: `s=${s}`, kind: 'story' });
const todo = jobs.filter(j => !process.argv[2] || j.id.includes(process.argv[2]));
const srv = await serve(dir); const browser = await chromium.launch();
const report = []; let fails = 0;
await Promise.all([0, 1, 2].map(async w => {
  for (let i = w; i < todo.length; i += 3) {
    const j = todo[i]; const page = await browser.newPage();
    await page.goto(`${srv.url}/${j.page}?render=1&${j.q}`); await page.evaluate(() => window.ready);
    const { FPS, DUR, END } = await page.evaluate(() => window.meta); const APPROVED = await page.evaluate(() => window.APPROVED);
    const problems = []; const seenT = new Map(); const seenI = new Set();
    for (let f = 0; f < FPS * DUR; f += 2) {
      const t = f / FPS; const log = await page.evaluate(f => window.audit(f), f);
      for (const s of log.texts) { const k = s.trim(); if (!seenT.has(k)) seenT.set(k, t.toFixed(2)); if (!APPROVED.some(a => a.includes(k)) && !(j.id === 's2' && /^[1-4]$/.test(k))) problems.push(`${t.toFixed(2)}s unapproved text "${k}"`); }
      for (const im of log.imgs) seenI.add(im);
      if (t >= END) {
        if (log.texts.length) problems.push(`${t.toFixed(2)}s text in sponsor frame: ${log.texts.join(' | ')}`);
        const bad = log.imgs.filter(x => x !== 'SPONSORS'); if (bad.length) problems.push(`${t.toFixed(2)}s non-sponsor artwork in sponsor frame: ${[...new Set(bad)].join(', ')}`);
        if (!log.imgs.includes('SPONSORS')) problems.push(`${t.toFixed(2)}s sponsor frame without logos`);
      }
      if (j.kind === 'story' && log.imgs.some(x => /^(rt|slo|matte)\//.test(x))) problems.push(`${t.toFixed(2)}s performance footage in story`);
      if (j.kind === 'ad' && log.imgs.includes('wizkid-cutout.png')) problems.push(`${t.toFixed(2)}s flyer photograph in cinematic ad`);
    }
    const texts = [...seenT.keys()];
    if (!seenI.has('lol-logo')) problems.push('festival logo never shown');
    if (!seenI.has('wizkid-wordmark.png')) problems.push('WIZKID never shown');
    // the date may appear as the brief's DECEMBER 13, 2026 or the flyer's own 13 DEC
    const has = s => texts.includes(s);
    if (!(has('DECEMBER 13, 2026') || has('13 DEC') || (has('13') && has('DEC')))) problems.push('date never shown');
    if (!(has('EAGLE SQUARE, ABUJA') || (has('EAGLE SQUARE,') && has('ABUJA')) || (has('EAGLE') && has('SQUARE,') && has('ABUJA')))) problems.push('venue never shown in full');
    await page.close();
    const uniq = [...new Set(problems.map(p => p.replace(/^[\d.]+s /, '')))];
    if (uniq.length) fails++;
    report.push({ id: j.id, pass: !uniq.length, problems: uniq.slice(0, 12), firstFrames: problems.slice(0, 3), copy: Object.fromEntries(seenT) });
    console.log(`${uniq.length ? 'FAIL' : 'PASS'} ${j.id}  copy: ${texts.map(s => `"${s}"`).join(', ')}${uniq.length ? '\n   - ' + uniq.join('\n   - ') : ''}`);
  }
}));
await browser.close(); srv.close();
fs.mkdirSync(path.join(dir, 'out'), { recursive: true });
fs.writeFileSync(path.join(dir, 'out', 'content-audit.json'), JSON.stringify(report.sort((a, b) => a.id.localeCompare(b.id)), null, 1));
console.log(fails ? `${fails} spot(s) FAILED` : 'ALL SPOTS PASS');
process.exit(fails ? 1 : 0);
