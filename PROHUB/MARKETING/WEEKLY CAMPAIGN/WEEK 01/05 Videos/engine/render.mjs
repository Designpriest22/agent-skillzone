// Prohub Reel Engine — page builder + frame renderer.
//   node render.mjs <reel.js> --stills 0.5,2,4 [--out dir]      quick look-dev frames (PNG)
//   node render.mjs <reel.js> --picture [--sub 3] [--out dir]   full picture pass → silent master + cues.json
// Picture is captured at fps×sub and folded back to fps with ffmpeg tmix — real motion blur, not a filter.
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const HERE = path.dirname(fileURLToPath(import.meta.url));
const VIDEOS = path.resolve(HERE, "..");
const WEEK = path.resolve(VIDEOS, "..");
const REPO = path.resolve(WEEK, "../../../..");
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const reelPath = path.resolve(args.find((a) => a.endsWith(".js")));
const outDir = path.resolve(opt("--out", path.join(VIDEOS, "build")));
mkdirSync(outDir, { recursive: true });

const b64 = (p) => readFileSync(p).toString("base64");
const FONTS = [
  ["Montserrat", 500, `${REPO}/prohub-os/assets/fonts/montserrat-latin-500-normal.woff2`],
  ["Montserrat", 700, `${REPO}/prohub-os/assets/fonts/montserrat-latin-700-normal.woff2`],
  ["Montserrat", 800, `${REPO}/prohub-os/assets/fonts/montserrat-latin-800-normal.woff2`],
  ["Inter", 400, `${REPO}/prohub-os/assets/fonts/inter-latin-400-normal.woff2`],
  ["Inter", 600, `${REPO}/prohub-os/assets/fonts/inter-latin-600-normal.woff2`],
  ["Inter", 700, `${REPO}/prohub-os/assets/fonts/inter-latin-700-normal.woff2`],
  ["Mono", 400, `${REPO}/prohub-os/assets/fonts/jetbrains-mono-latin-400-normal.woff2`],
  ["Mono", 700, `${REPO}/prohub-os/assets/fonts/jetbrains-mono-latin-700-normal.woff2`],
  ["Archivo", 400, `${REPO}/prohub-os/assets/fonts/archivo-black-latin-400-normal.woff2`],
  ["Anton", 400, `${REPO}/prohub-os/assets/fonts/anton-latin-400-normal.woff2`],
  ["Marker", 400, `${HERE}/fonts/permanent-marker-latin-400-normal.woff2`],
  ["Grotesk", 400, `${HERE}/fonts/space-grotesk-latin-400-normal.woff2`],
  ["Grotesk", 700, `${HERE}/fonts/space-grotesk-latin-700-normal.woff2`],
].map(([f, w, p]) => `@font-face{font-family:'${f}';font-weight:${w};src:url(data:font/woff2;base64,${b64(p)}) format('woff2')}`).join("\n");

function buildPage() {
  const src = readFileSync(reelPath, "utf8");
  const m = src.match(/^\/\/ @assets (\{.*\})$/m);
  const assets = m ? JSON.parse(m[1]) : {};
  const img = {};
  for (const [k, p] of Object.entries(assets)) {
    const abs = path.resolve(WEEK, p);
    const ext = path.extname(abs).slice(1).replace("jpg", "jpeg");
    img[k] = ext === "svg" ? readFileSync(abs, "utf8") : `data:image/${ext};base64,${b64(abs)}`;
  }
  const logo = readFileSync(`${REPO}/prohub-os/assets/brand/prohub/prohub-logo.svg`, "utf8");
  return `<!doctype html><html><head><meta charset="utf-8"><style>${FONTS}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1080px;height:1920px;overflow:hidden;background:#000}
#stage{position:relative;width:1080px;height:1920px;overflow:hidden;background:#0C0C0D}
#cam{position:absolute;inset:0;transform-origin:50% 50%;will-change:transform}
#cam > *{position:absolute}
.scene{position:absolute;left:0;top:0;width:1080px;height:1920px;overflow:hidden}
.scene > *{position:absolute}
.fxc{position:absolute;left:0;top:0;width:1080px;height:1920px;pointer-events:none}
#grain{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:90}
#vig{position:absolute;inset:0;pointer-events:none;z-index:91;background:radial-gradient(ellipse 75% 60% at 50% 50%,transparent 55%,rgba(0,0,0,.85) 100%)}
#flash{position:absolute;inset:0;pointer-events:none;z-index:95;opacity:0}
.ch,.wd{display:inline-block;will-change:transform}
</style></head><body><div id="stage"></div>
<script>window.IMG=${JSON.stringify(img)};window.LOGO_SVG=${JSON.stringify(logo)};</script>
<script>${readFileSync(`${HERE}/vendor/gsap.min.js`, "utf8")}</script>
<script>${readFileSync(`${HERE}/vendor/CustomEase.min.js`, "utf8")}</script>
<script>gsap.registerPlugin(CustomEase);</script>
<script>${readFileSync(`${HERE}/runtime.js`, "utf8")}</script>
<script>${src}</script>
</body></html>`;
}

const html = buildPage();
const browser = await chromium.launch({ args: ["--font-render-hinting=none", "--disable-lcd-text", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
const errs = []; page.on("pageerror", (e) => errs.push(e.message)); page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
await page.setContent(html, { waitUntil: "load" });
await page.evaluate("window.ready");
if (errs.length) { console.error("page errors:", errs); process.exit(1); }
const meta = await page.evaluate(() => ({ name: ENGINE.name, duration: ENGINE.duration, fps: ENGINE.fps, bpm: ENGINE.bpm, offset: ENGINE.offset, cues: ENGINE.cues, spots: ENGINE.spots, music: window.MUSIC || null }));
writeFileSync(path.join(outDir, `${meta.name}.cues.json`), JSON.stringify(meta, null, 1));

const stills = opt("--stills");
if (stills) {
  for (const t of stills.split(",").map(Number)) {
    await page.evaluate((tt) => window.seek(tt), t);
    await page.screenshot({ path: path.join(outDir, `${meta.name}_${t.toFixed(2)}.jpg`), type: "jpeg", quality: 88 });
  }
  console.log(`stills → ${outDir}`);
} else if (args.includes("--picture")) {
  const sub = Number(opt("--sub", 3));
  const rate = meta.fps * sub;
  const frames = Math.round(meta.duration * rate);
  const out = path.join(outDir, `${meta.name}_picture.mp4`);
  const vf = sub > 1 ? `tmix=frames=${sub}:weights='${Array(sub).fill(1).join(" ")}',select='eq(mod(n\\,${sub})\\,${sub - 1})',setpts=N/${meta.fps}/TB` : "null";
  const ff = spawn("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-f", "image2pipe", "-c:v", "mjpeg", "-framerate", String(rate), "-i", "-",
    "-vf", vf, "-r", String(meta.fps), "-c:v", "libx264", "-preset", "slow", "-crf", "14", "-pix_fmt", "yuv420p", out], { stdio: ["pipe", "ignore", "inherit"] });
  const done = new Promise((res, rej) => ff.on("close", (c) => (c === 0 ? res() : rej(new Error("ffmpeg " + c)))));
  const t0 = Date.now();
  for (let f = 0; f < frames; f++) {
    // forward shutter: output frame k averages subframes k·sub … k·sub+sub-1, so a hard cut on frame k stays clean
    const t = f / rate;
    await page.evaluate((tt) => window.seek(tt), t);
    const jpg = await page.screenshot({ type: "jpeg", quality: 93 });
    if (!ff.stdin.write(jpg)) await new Promise((r) => ff.stdin.once("drain", r));
    if (f % (rate * 4) === 0) process.stdout.write(`  ${meta.name}: ${(f / rate).toFixed(1)}s / ${meta.duration}s\r`);
  }
  ff.stdin.end(); await done;
  console.log(`\n✓ picture ${out} (${frames} subframes, ${Math.round((Date.now() - t0) / 1000)}s)`);
}
await browser.close();
