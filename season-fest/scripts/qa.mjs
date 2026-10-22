#!/usr/bin/env node
/**
 * Browser QA for SEASON FEST.
 *
 *   npm run build && npm run preview   # in one terminal
 *   npm run qa                          # in another
 *
 * Checks, per viewport: console/page errors, horizontal overflow, layout
 * shift (CLS), ticket modal behaviour + focus return, reduced-motion layout,
 * and writes screenshots of every section to ./qa-output.
 *
 * Uses Playwright from the project or a global install
 * (npm i -D playwright, or npx playwright install chromium).
 */
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

function loadPlaywright() {
  const req = createRequire(import.meta.url);
  try {
    return req('playwright');
  } catch {
    const globalRoot = execSync('npm root -g').toString().trim();
    return createRequire(globalRoot + '/')('playwright');
  }
}

const { chromium } = loadPlaywright();
const BASE = process.env.QA_URL || 'http://localhost:4321/';
const OUT = process.env.QA_OUT || 'qa-output';
const ONLY = process.env.QA_ONLY?.split(',');
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { name: 'desktop-1440', width: 1440, height: 900, dpr: 1 },
  { name: 'laptop-1280', width: 1280, height: 720, dpr: 1 },
  { name: 'tablet-834', width: 834, height: 1194, dpr: 1, mobile: true },
  { name: 'iphone-390', width: 390, height: 844, dpr: 2, mobile: true },
  { name: 'android-360', width: 360, height: 760, dpr: 2, mobile: true },
].filter((v) => !ONLY || ONLY.includes(v.name));

const SECTIONS = ['#about', '#experience', '#ch-sound', '#ch-people', '#ch-festival', '#atmosphere', '.rows', '.timeline', '#christmas-eve', '#producers', '#details', '.faq', '#save-room', '.footer'];

const report = { base: BASE, results: [] };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function scrollThrough(page) {
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 400) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await sleep(60);
  }
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await sleep(800);
}

const browser = await chromium.launch();

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.dpr,
    isMobile: Boolean(vp.mobile),
    hasTouch: Boolean(vp.mobile),
    reducedMotion: 'no-preference',
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('requestfailed', (r) => {
    const u = r.url();
    if (!u.includes('google.com') && !u.includes('instagram.com')) errors.push(`request failed: ${u}`);
  });

  await page.addInitScript(() => {
    window.__cls = 0;
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
  });

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await sleep(2200);
  await page.screenshot({ path: `${OUT}/${vp.name}-00-hero.png` });

  const r = { viewport: vp.name, checks: {} };
  r.checks.motionReady = await page.evaluate(() => document.documentElement.classList.contains('motion-ready'));
  r.checks.fxOn = await page.evaluate(() => Boolean(document.querySelector('[data-stage].fx-on')));
  r.checks.heroCtaVisible = await page.locator('.hero [data-ticket-cta]').isVisible();

  // Mid-transition frames of the pinned stage.
  for (const [i, f] of [0.35, 0.75, 1.1].entries()) {
    await page.evaluate((ff) => window.scrollTo(0, window.innerHeight * ff), f);
    await sleep(900);
    await page.screenshot({ path: `${OUT}/${vp.name}-0${i + 1}-heat.png` });
  }

  for (const [i, sel] of SECTIONS.entries()) {
    const el = page.locator(sel).first();
    if (!(await el.count())) continue;
    await el.evaluate((n) => n.scrollIntoView({ block: 'start', behavior: 'instant' }));
    await sleep(1300);
    const name = sel.replace(/[#.]/g, '');
    await page.screenshot({ path: `${OUT}/${vp.name}-${String(i + 10).padStart(2, '0')}-${name}.png` });
  }

  r.checks.horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  const wide = await page.evaluate(() => {
    const vw = window.innerWidth;
    return Array.from(document.querySelectorAll('body *'))
      .filter((el) => {
        if (el.closest('.row, .marquee, .heat__food, .festoon, .stage__lights, [popover], dialog, .ticket-cta')) return false;
        const s = getComputedStyle(el);
        if (s.position === 'fixed' || s.visibility === 'hidden' || s.display === 'none') return false;
        // Content clipped by an overflow:hidden/clip ancestor can't overflow the page.
        for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
          const o = getComputedStyle(a);
          if (/(hidden|clip)/.test(o.overflowX + o.overflow)) return false;
        }
        const b = el.getBoundingClientRect();
        return b.width > 0 && (b.right > vw + 1 || b.left < -1);
      })
      .slice(0, 8)
      .map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].join('.')}`);
  });
  r.checks.elementsOutsideViewport = wide;

  // Mobile ticket bar appears mid-page on phones.
  if (vp.width < 640) {
    await page.locator('#atmosphere').evaluate((n) => n.scrollIntoView({ behavior: 'instant' }));
    await sleep(700);
    r.checks.mobileBarVisible = await page.evaluate(() => document.querySelector('[data-ticket-bar]')?.hasAttribute('data-visible'));
  }

  // Ticket modal: opens from a CTA, closes on Escape, returns focus.
  await page.locator('#christmas-eve [data-ticket-cta]').first().evaluate((n) => n.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await sleep(1200);
  const cta = page.locator('#christmas-eve [data-ticket-cta]').first();
  await cta.focus();
  await page.keyboard.press('Enter');
  await sleep(600);
  r.checks.modalOpens = await page.evaluate(() => document.getElementById('ticket-modal')?.open === true);
  await page.screenshot({ path: `${OUT}/${vp.name}-90-modal.png` });
  await page.keyboard.press('Escape');
  await sleep(400);
  r.checks.modalClosesOnEsc = await page.evaluate(() => document.getElementById('ticket-modal')?.open === false);
  r.checks.focusReturned = await page.evaluate(() => document.activeElement?.hasAttribute('data-ticket-cta'));

  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(500);
  await scrollThrough(page);
  r.checks.cls = Number((await page.evaluate(() => window.__cls)).toFixed(4));
  r.errors = errors;
  report.results.push(r);
  console.log(vp.name, JSON.stringify(r.checks), errors.length ? `\n  errors: ${errors.join('\n  ')}` : '');
  await ctx.close();
}

// Reduced motion: complete static page, nothing hidden.
for (const vp of VIEWPORTS.filter((v) => ['desktop-1440', 'iphone-390'].includes(v.name))) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
    isMobile: Boolean(vp.mobile),
    reducedMotion: 'reduce',
  });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await sleep(800);
  const hidden = await page.evaluate(() =>
    Array.from(document.querySelectorAll('main h2, main h3, main p, main img'))
      .filter((el) => {
        const s = getComputedStyle(el);
        return s.visibility === 'hidden' || Number(s.opacity) < 0.05;
      })
      .map((el) => el.textContent?.slice(0, 40) || el.getAttribute('alt')),
  );
  const motionClass = await page.evaluate(() => document.documentElement.className);
  await page.screenshot({ path: `${OUT}/${vp.name}-reduced-full.png`, fullPage: true });
  console.log(`${vp.name} reduced-motion: html="${motionClass}" hiddenContent=${hidden.length}`, hidden.slice(0, 5));
  report.results.push({ viewport: `${vp.name}-reduced`, checks: { htmlClass: motionClass, hiddenContent: hidden } });
  await ctx.close();
}

// No JavaScript: everything readable, CTAs land on #tickets.
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const href = await page.locator('.hero [data-ticket-cta]').getAttribute('href');
  await page.screenshot({ path: `${OUT}/nojs-full.png`, fullPage: true });
  console.log(`no-js: hero CTA href=${href}`);
  report.results.push({ viewport: 'no-js', checks: { heroCtaHref: href } });
  await ctx.close();
}

await browser.close();
writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));
console.log(`\nScreenshots + report.json written to ${OUT}/`);
