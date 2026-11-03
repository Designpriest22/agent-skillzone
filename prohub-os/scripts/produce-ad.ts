/**
 * Produce an ad from a storyboard spec through the Video agent's real render_video tool.
 *
 *   npm run ad:produce -- content/ads/prohub-launch/spec.json [--out out-ad] [--stills 1.2,5,9.5] [--formats 9:16,16:9]
 *
 * The spec is a storyboard (src/video/storyboard.ts) whose media may be given as local paths:
 *   brand.logo_svg_path, audio_path, scenes[].image_paths[] — resolved relative to the spec file.
 * Full run: media are stored as files, render_video creates the 'video' deliverable (measured QC, files) and the
 * MP4s are also written to --out. --stills renders chosen frames only (no database writes) for fast review.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";
import { storyboardSchema, FORMATS, type VideoFormat } from "@/video/storyboard";
import { pageHtml } from "@/video/render";
import { renderVideoTool } from "@/agents/tools/video";
import { saveFile } from "@/services/files";
import { closeDb } from "@/db/client";

const args = process.argv.slice(2);
const specPath = args.find((a) => !a.startsWith("--") && a.endsWith(".json"));
if (!specPath) throw new Error("usage: produce-ad.ts <spec.json> [--out dir] [--stills t1,t2] [--formats 9:16,1:1]");
const opt = (k: string) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const outDir = opt("--out") ?? "out-ad";
const dir = path.dirname(path.resolve(specPath));
const spec = JSON.parse(readFileSync(specPath, "utf8"));
const rel = (p: string) => path.resolve(dir, p);
const mime = (p: string) => (p.endsWith(".png") ? "image/png" : p.endsWith(".webp") ? "image/webp" : p.endsWith(".m4a") ? "audio/mp4" : p.endsWith(".mp3") ? "audio/mpeg" : "image/jpeg");
if (opt("--formats")) spec.formats = opt("--formats")!.split(",");
if (spec.brand?.logo_svg_path) { spec.brand.logo_svg = readFileSync(rel(spec.brand.logo_svg_path), "utf8"); delete spec.brand.logo_svg_path; }
mkdirSync(outDir, { recursive: true });

const stills = opt("--stills");
if (stills) {
  // Preview: inline media as data URIs under synthetic ids; nothing touches the database.
  const images: Record<string, string> = {};
  let n = 0;
  for (const s of spec.scenes) {
    if (s.layout === "callouts" && s.image_paths?.length) { const id = `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`; images[id] = `data:${mime(s.image_paths[0])};base64,${readFileSync(rel(s.image_paths[0])).toString("base64")}`; s.image_file_id = id; delete s.image_paths; }
    if (s.image_paths) { s.image_file_ids = s.image_paths.map((p: string) => { const id = `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`; images[id] = `data:${mime(p)};base64,${readFileSync(rel(p)).toString("base64")}`; return id; }); delete s.image_paths; }
  }
  delete spec.audio_path;
  const sb = storyboardSchema.parse(spec);
  const times = stills.split(",").map(Number);
  const browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
  for (const format of sb.formats as VideoFormat[]) {
    const { width, height } = FORMATS[format];
    const page = await browser.newPage({ viewport: { width, height } });
    const errs: string[] = []; page.on("pageerror", (e) => errs.push(e.message));
    await page.setContent(pageHtml(sb, format, images), { waitUntil: "load" });
    await page.evaluate("window.ready");
    for (const t of times) {
      await page.evaluate((tt) => (window as unknown as { renderAt: (x: number) => void }).renderAt(tt), t);
      await page.screenshot({ path: path.join(outDir, `still-${format.replace(":", "x")}-${t.toFixed(2)}.jpg`), type: "jpeg", quality: 85 });
    }
    if (errs.length) console.error(format, "page errors:", errs);
    await page.close();
  }
  await browser.close();
  console.log(`stills written to ${outDir}`);
  process.exit(0);
}

// Full production through the Video agent's tool.
for (const s of spec.scenes) {
  if (s.layout === "callouts" && s.image_paths?.length) { s.image_file_id = (await saveFile({ name: path.basename(s.image_paths[0]), mimeType: mime(s.image_paths[0]), data: readFileSync(rel(s.image_paths[0])), source: "upload", createdBy: "script:produce-ad" })).id; delete s.image_paths; }
  if (s.image_paths) {
    s.image_file_ids = [];
    for (const p of s.image_paths) s.image_file_ids.push((await saveFile({ name: path.basename(p), mimeType: mime(p), data: readFileSync(rel(p)), source: "upload", createdBy: "script:produce-ad" })).id);
    delete s.image_paths;
  }
}
if (spec.audio_path) { spec.audio_file_id = (await saveFile({ name: path.basename(spec.audio_path), mimeType: mime(spec.audio_path), data: readFileSync(rel(spec.audio_path)), source: "upload", createdBy: "script:produce-ad" })).id; delete spec.audio_path; }
const ctx = { agentSlug: "video-production", taskId: crypto.randomUUID(), runId: crypto.randomUUID(), produced: [] as { type: string; id: string }[], terminal: null };
const t0 = Date.now();
const res = (await renderVideoTool.run(renderVideoTool.schema.parse(spec), ctx)) as { deliverable_id: string; files: { format: string; file_id: string; poster_file_id: string }[]; failed_qc: string[] };
console.log(JSON.stringify({ ...res, seconds: Math.round((Date.now() - t0) / 1000) }, null, 2));
const { readFile } = await import("@/services/files");
for (const f of res.files) {
  const mp4 = await readFile(f.file_id); const poster = await readFile(f.poster_file_id);
  const base = path.join(outDir, `${spec.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40)}-${f.format.replace(":", "x")}`);
  if (mp4) writeFileSync(`${base}.mp4`, mp4.data);
  if (poster) writeFileSync(`${base}-poster.jpg`, poster.data);
}
await closeDb();
