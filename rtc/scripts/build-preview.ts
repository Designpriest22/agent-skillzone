/**
 * Builds a single self-contained HTML file of the game for offline review: React app, CSS, fonts and every
 * image inlined. Guest mode only; accounts, leaderboards and payments need the server.
 * Usage: npx tsx scripts/build-preview.ts  →  ../exports/run-the-capital-preview.html
 */
import fs from "node:fs";
import path from "node:path";
import { build } from "esbuild";

const root = path.resolve(__dirname, "..");
const out = path.resolve(root, "..", "exports", "run-the-capital-preview.html");
const MIME: Record<string, string> = { ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml" };

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
}

async function main() {
  const res = await build({
    entryPoints: [path.join(root, "preview/main.tsx")],
    bundle: true, minify: true, write: false, format: "iife", target: "es2020", jsx: "automatic",
    outdir: path.join(root, ".preview"),
    tsconfig: path.join(root, "tsconfig.json"),
    define: { "process.env.NODE_ENV": '"production"' },
    loader: { ".woff2": "dataurl", ".woff": "empty", ".json": "json" },
    logLevel: "warning",
  });
  const js = res.outputFiles.find((f) => f.path.endsWith(".js"))!.text;
  const css = res.outputFiles.find((f) => f.path.endsWith(".css"))!.text;
  const assets: Record<string, string> = {};
  for (const f of walk(path.join(root, "public/game"))) {
    const mime = MIME[path.extname(f)];
    if (!mime) continue;
    assets["/" + path.relative(path.join(root, "public"), f).split(path.sep).join("/")] = `data:${mime};base64,${fs.readFileSync(f).toString("base64")}`;
  }
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#170a06"><title>Run The Capital · Preview</title><style>${css}</style></head>
<body><div id="root"></div><script>window.__RTC_PREVIEW=true;window.__RTC_ASSETS=${JSON.stringify(assets)};</script>
<script>${js.replace(/<\/script/gi, "<\\/script")}</script></body></html>`;
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  console.log(`Wrote ${path.relative(process.cwd(), out)} (${(html.length / 1e6).toFixed(1)} MB, ${Object.keys(assets).length} assets)`);
}
main().catch((e) => { console.error(e); process.exit(1); });
