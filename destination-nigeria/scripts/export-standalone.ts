/**
 * Exports the home page as ONE self-contained HTML file that opens offline:
 * inlined CSS, fonts, logo, illustrations and welcome sound, plus a small
 * runtime (scripts/export/standalone-shim.js) for the key interactions.
 *
 * Usage:  npm run build && npm start   (in another terminal)
 *         npm run export:html          → export/destination-nigeria-home.html
 * Env:    EXPORT_FROM (default http://localhost:3000)
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import { categories } from "../src/content/categories";
import { destinations } from "../src/content/destinations";
import { states, zones } from "../src/content/states";
import { heroScenes, stateLabel } from "../src/lib/content";
import { plateKey, plateSvg } from "../src/lib/plates";
import { buildSearchIndex } from "../src/lib/search-index";

const ROOT = path.join(import.meta.dirname, "..");
const FROM = (process.env.EXPORT_FROM ?? "http://localhost:3000").replace(/\/$/, "");
const OUT = path.join(ROOT, "export", "destination-nigeria-home.html");
const executablePath = fs.existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined;

const mime = (p: string) => (p.endsWith(".svg") ? "image/svg+xml" : p.endsWith(".woff2") ? "font/woff2" : p.endsWith(".png") ? "image/png" : "application/octet-stream");

async function dataUri(url: string): Promise<string> {
  const res = await fetch(url.startsWith("http") ? url : `${FROM}${url}`);
  if (!res.ok) throw new Error(`Could not fetch ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return `data:${mime(new URL(url, FROM).pathname)};base64,${buf.toString("base64")}`;
}

async function main() {
  const browser = await chromium.launch({ executablePath });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.addInitScript(() => localStorage.setItem("dn:welcomed", "1"));
  await page.goto(`${FROM}/`, { waitUntil: "load" });
  await page.waitForTimeout(2500);

  const captured = (await page.evaluate(fs.readFileSync(path.join(ROOT, "scripts/export/capture.js"), "utf8"))) as {
    html: string;
    stylesheets: string[];
    imgs: string[];
  };
  await browser.close();

  let html = captured.html;

  // Inline CSS, with fonts as data URIs.
  for (const href of captured.stylesheets) {
    let css = await (await fetch(`${FROM}${href}`)).text();
    const fontUrls = [...new Set([...css.matchAll(/url\(([^)]+\.woff2)\)/g)].map((m) => m[1]!.replace(/["']/g, "")))];
    for (const u of fontUrls) css = css.split(u).join(await dataUri(new URL(u, `${FROM}${href}`).pathname));
    html = html.replace(`<style>/*__CSS__${href}*/</style>`, () => `<style>${css}</style>`);
  }
  // Inline images.
  for (const src of captured.imgs) {
    const uri = await dataUri(src);
    html = html.split(`src="${src}"`).join(`src="${uri}"`);
  }
  // Remaining preload/font URLs that point at the server are dropped.
  html = html.replace(/<link[^>]+href="\/_next[^"]*"[^>]*>/g, "");

  // Runtime data.
  const data = {
    destinations: destinations.map((d) => {
      const s = states.find((x) => x.slug === d.state)!;
      return {
        slug: d.slug,
        name: d.name,
        state: d.state,
        stateName: s.name,
        stateLabel: stateLabel(s),
        zone: s.zone,
        locality: d.locality,
        categories: d.categories,
        summary: d.summary,
        intro: d.intro,
        highlights: d.highlights,
        practical: d.practical,
        sources: d.verification.sources,
        lastChecked: d.verification.lastChecked,
        plateKey: plateKey(d.plate),
      };
    }),
    plates: Object.fromEntries(destinations.map((d) => [plateKey(d.plate), plateSvg(d.plate)])),
    categories,
    zones: Object.fromEntries(Object.entries(zones).map(([k, v]) => [k, v.name])),
    states: states.map((s) => ({ slug: s.slug, name: s.name, capital: s.capital, zone: s.zone, svgId: s.svgId, summary: s.summary ?? "" })),
    scenes: heroScenes.map((h) => ({ svg: plateSvg(h.plate), caption: h.caption })),
    index: buildSearchIndex(),
    sound: `data:audio/mpeg;base64,${fs.readFileSync(path.join(ROOT, "public/audio/welcome.mp3")).toString("base64")}`,
  };
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  const shim = fs.readFileSync(path.join(ROOT, "scripts/export/standalone-shim.js"), "utf8");
  const extraCss = `.dn-toast{position:fixed;left:50%;bottom:1.25rem;z-index:95;max-width:min(36rem,calc(100% - 2rem));transform:translate(-50%,1rem);opacity:0;pointer-events:none;padding:.8rem 1.1rem;border-radius:var(--r-md);background:var(--forest-deep);color:var(--ivory);box-shadow:var(--shadow-2);font-size:.925rem;transition:opacity .3s,transform .3s}.dn-toast.is-on{opacity:1;transform:translate(-50%,0)}.dn-detail{width:min(48rem,calc(100% - 2rem));max-height:calc(100% - 3rem);overflow-y:auto}`;
  const comment = `<!-- Destination Nigeria — standalone export of the home page, generated ${new Date().toISOString().slice(0, 10)} by scripts/export-standalone.ts. Forms are disabled offline. -->`;
  html = html
    .replace("<!doctype html>", `<!doctype html>\n${comment}`)
    .replace("</head>", `<style>${extraCss}</style></head>`)
    .replace("</body>", () => `<script>window.__DN__=${json};</script><script>${shim}</script></body>`);

  // Guard: nothing may still point at the dev server or _next.
  const leftovers = [...html.matchAll(/(?:src|href)="(\/_next[^"]*|\/plates\/[^"]*|\/brand\/[^"]*)"/g)].map((m) => m[1]);
  if (leftovers.length) throw new Error(`Unresolved asset references: ${leftovers.slice(0, 5).join(", ")}`);

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, html);
  console.log(`Wrote ${path.relative(process.cwd(), OUT)} (${(fs.statSync(OUT).size / 1024 / 1024).toFixed(2)} MB)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
