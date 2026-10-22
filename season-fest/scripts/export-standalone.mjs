#!/usr/bin/env node
/**
 * Exports the built site as ONE self-contained HTML file that opens anywhere
 * (double-click, email, USB, upload) with no other files:
 *
 *   npm run build && npm run export
 *   → export/season-fest-standalone.html
 *   → export/season-fest-site.zip   (the full multi-file build, best for hosting)
 *
 * What gets inlined: all JavaScript (incl. the lazily loaded motion/fire
 * modules), Latin font files, one WebP per image, favicons and the .ics file.
 * The Google Maps embed and outbound links still need a connection.
 *
 * For real hosting prefer dist/ (or the zip): it keeps responsive AVIF/WebP
 * images and caching. The standalone file trades that for portability.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { execSync } from 'node:child_process';
import { rolldown } from 'rolldown';

const root = resolve(import.meta.dirname, '..');
const dist = join(root, 'dist');
const out = join(root, 'export');
const MAX_IMG_WIDTH = 1400;

if (!existsSync(join(dist, 'index.html'))) {
  console.error('dist/index.html not found — run `npm run build` first.');
  process.exit(1);
}
if (process.env.BASE_PATH && process.env.BASE_PATH !== '/') {
  console.error('Build without BASE_PATH before exporting the standalone file.');
  process.exit(1);
}

const b64 = (buf) => Buffer.from(buf).toString('base64');
const fromDist = (url) => readFileSync(join(dist, decodeURIComponent(url.split('?')[0].replace(/^\//, ''))));
const mime = (p) =>
  ({ webp: 'image/webp', avif: 'image/avif', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', svg: 'image/svg+xml', woff2: 'font/woff2', ico: 'image/x-icon' })[
    p.split('?')[0].split('.').pop().toLowerCase()
  ] || 'application/octet-stream';
const dataUri = (url) => `data:${mime(url)};base64,${b64(fromDist(url))}`;

let html = readFileSync(join(dist, 'index.html'), 'utf8');
const stats = { images: 0, fonts: 0 };

/* 1. Scripts: one bundle with every dynamic import inlined ------------- */
const bundle = await rolldown({ input: join(root, 'src/scripts/main.ts'), logLevel: 'silent' });
const { output } = await bundle.generate({ format: 'esm', inlineDynamicImports: true, minify: true });
await bundle.close();
const js = output[0].code.replace(/<\/script/gi, '<\\/script');
const scriptTags = html.match(/<script type="module" src="\/_astro\/[^"]+"><\/script>/g) || [];
if (scriptTags.length !== 1) throw new Error(`expected 1 module script, found ${scriptTags.length}`);
html = html.replace(scriptTags[0], () => `<script type="module">${js}</script>`);

/* 2. Images: keep <picture>, drop <source>s, embed one WebP per <img> --- */
html = html.replace(/<picture\b[^>]*>[\s\S]*?<\/picture>/g, (pic) => {
  const webp = pic.match(/<source[^>]*srcset="([^"]+)"[^>]*type="image\/webp"/) || pic.match(/<source[^>]*type="image\/webp"[^>]*srcset="([^"]+)"/);
  const candidates = (webp ? webp[1] : '')
    .split(',')
    .map((c) => c.trim().split(/\s+/))
    .filter((c) => c[0])
    .map(([url, w]) => ({ url, w: parseInt(w, 10) || 0 }))
    .sort((a, b) => a.w - b.w);
  const pick = candidates.filter((c) => c.w <= MAX_IMG_WIDTH).pop() || candidates[0];
  return pic
    .replace(/<source\b[^>]*>/g, '')
    .replace(/<img\b([^>]*)>/, (img, attrs) => {
      const src = pick ? pick.url : (attrs.match(/\bsrc="([^"]+)"/) || [])[1];
      stats.images++;
      const clean = attrs.replace(/\s(?:src|srcset|sizes)="[^"]*"/g, '');
      return `<img src="${dataUri(src)}"${clean}>`;
    });
});

/* 3. Fonts: Latin subsets only (the page has no other scripts), inlined - */
html = html.replace(/@font-face\{[^}]*\}/g, (rule) => {
  if (/latin-ext|vietnamese|cyrillic|greek/.test(rule)) return '';
  // Drop legacy .woff fallbacks: every browser that runs this page supports WOFF2.
  rule = rule.replace(/,\s*url\(\/_astro\/[^)]+\.woff\)\s*format\(["']?woff["']?\)/g, '');
  return rule.replace(/url\((\/_astro\/[^)]+\.woff2)\)/g, (_, url) => {
    stats.fonts++;
    return `url(${dataUri(url)})`;
  });
});
html = html.replace(/<link rel="preload"[^>]*as="font"[^>]*>/g, '');

/* 4. Icons, manifest, calendar file ------------------------------------ */
html = html.replace(/<link rel="manifest"[^>]*>/, '');
html = html.replace(/(<link rel="(?:icon|apple-touch-icon)" href=")(\/[^"]+)"/g, (_, pre, url) => `${pre}${dataUri(url)}"`);
const ics = readFileSync(join(dist, 'season-fest-2026.ics'), 'utf8');
html = html.replaceAll('href="/season-fest-2026.ics"', `href="data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}"`);

/* 5. Sanity check: nothing may still point at local files -------------- */
const leftovers = [...html.matchAll(/(?:src|href|srcset)="(\/(?!\/)[^"]*)"|url\((\/_astro[^)]*)\)/g)]
  .map((m) => m[1] || m[2])
  .filter((u) => u && !u.startsWith('/og/')); // og:image meta is only used by link scrapers
if (leftovers.length) throw new Error(`unresolved local references: ${leftovers.slice(0, 5).join(', ')}`);

mkdirSync(out, { recursive: true });
const file = join(out, 'season-fest-standalone.html');
writeFileSync(file, html);

/* 6. Zip of the full build for hosting --------------------------------- */
const zip = join(out, 'season-fest-site.zip');
execSync(`python3 -c "import shutil,sys; shutil.make_archive(sys.argv[1], 'zip', sys.argv[2])" "${zip.replace(/\.zip$/, '')}" "${dist}"`);

const mb = (p) => (statSync(p).size / 1024 / 1024).toFixed(2) + ' MB';
console.log(`${relative(root, file)}  ${mb(file)}  (${stats.images} images, ${stats.fonts} fonts, 1 script, no external files)`);
console.log(`${relative(root, zip)}  ${mb(zip)}  (${readdirSync(join(dist, '_astro')).length + 10} files, for hosting)`);
