/**
 * Render storyboard specs to MP4 without a database — same templates, sound design, encoder settings and
 * measured QC as the Video agent's render_video tool, but media are read from local paths.
 *
 *   npx tsx scripts/render-offline.ts <spec.json> [more.json…] --out <dir> [--formats 9:16,4:5] [--stills 1.2,5]
 *
 * Spec = storyboard (src/video/storyboard.ts) plus local-path fields resolved relative to the spec file:
 *   brand.logo_svg_path, audio_path, scenes[].image_path (callouts/background), scenes[].image_paths[] (bento),
 *   and an optional `out_name` used for the output file names.
 * Writes <out_name>_<format>.mp4, a poster JPG and <out_name>_qc.json (ffprobe + loudness + QC checklist).
 */
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { chromium } from "playwright-core";
import { storyboardSchema, FORMATS, totalDuration, type VideoFormat } from "../src/video/storyboard";
import { pageHtml, qcFor, type RenderedVideo } from "../src/video/render";
import { mixSoundtrack, measureLoudness } from "../src/video/sound";

const args = process.argv.slice(2);
const opt = (k: string) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const specs = args.filter((a, i) => a.endsWith(".json") && !["--out", "--formats", "--stills"].includes(args[i - 1] ?? ""));
const outDir = path.resolve(opt("--out") ?? "out-offline");
const stills = opt("--stills")?.split(",").map(Number);
const mime = (p: string) => (p.endsWith(".png") ? "image/png" : p.endsWith(".webp") ? "image/webp" : "image/jpeg");
const execPath = process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium";

function probe(file: string) {
  const r = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=codec_name,width,height,pix_fmt:format=duration,size", "-of", "json", file]);
  const j = JSON.parse(r.stdout.toString());
  const s = j.streams[0];
  return { codec: s.codec_name, width: s.width, height: s.height, pixFmt: s.pix_fmt, durationS: Number(j.format.duration), sizeBytes: Number(j.format.size) };
}

const browser = await chromium.launch({ headless: true, executablePath: execPath, args: ["--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none", "--disable-lcd-text"] });
for (const specPath of specs) {
  const dir = path.dirname(path.resolve(specPath));
  const rel = (p: string) => path.resolve(dir, p);
  const spec = JSON.parse(readFileSync(specPath, "utf8"));
  const name: string = spec.out_name ?? path.basename(specPath, ".json");
  delete spec.out_name;
  if (opt("--formats")) spec.formats = opt("--formats")!.split(",");
  if (spec.brand?.logo_svg_path) { spec.brand.logo_svg = readFileSync(rel(spec.brand.logo_svg_path), "utf8"); delete spec.brand.logo_svg_path; }
  const images: Record<string, string> = {};
  let n = 0;
  const addImg = (p: string) => { const id = `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`; images[id] = `data:${mime(p)};base64,${readFileSync(rel(p)).toString("base64")}`; return id; };
  for (const s of spec.scenes) {
    if (s.image_path) { s.image_file_id = addImg(s.image_path); delete s.image_path; }
    if (s.image_paths) { s.image_file_ids = s.image_paths.map(addImg); delete s.image_paths; }
  }
  const audio = spec.audio_path ? rel(spec.audio_path) : null;
  delete spec.audio_path;
  const sb = storyboardSchema.parse(spec);
  const duration = totalDuration(sb);
  const fps = sb.fps;
  const frames = Math.round(duration * fps);
  mkdirSync(outDir, { recursive: true });

  if (stills) {
    for (const format of sb.formats as VideoFormat[]) {
      const { width, height } = FORMATS[format];
      const page = await browser.newPage({ viewport: { width, height } });
      await page.setContent(pageHtml(sb, format, images), { waitUntil: "load" });
      await page.evaluate("window.ready");
      for (const t of stills) {
        await page.evaluate((tt) => (window as unknown as { renderAt: (x: number) => void }).renderAt(tt), t);
        await page.screenshot({ path: path.join(outDir, `${name}_still_${format.replace(":", "x")}_${t.toFixed(2)}.jpg`), type: "jpeg", quality: 85 });
      }
      await page.close();
    }
    console.log(`stills: ${name}`);
    continue;
  }

  const tmp = mkdtempSync(path.join(tmpdir(), "prohub-offline-"));
  const mixPath = path.join(tmp, "mix.wav");
  const { cues } = sb.sound_design !== "off" ? await mixSoundtrack(sb, audio, mixPath, duration) : { cues: [] };
  const audioPath = sb.sound_design !== "off" ? mixPath : audio;
  const report: unknown[] = [];
  for (const format of sb.formats as VideoFormat[]) {
    const t0 = Date.now();
    const { width, height } = FORMATS[format];
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    const errs: string[] = []; page.on("pageerror", (e) => errs.push(e.message));
    await page.setContent(pageHtml(sb, format, images), { waitUntil: "load", timeout: 60_000 });
    await page.evaluate("window.ready");
    if (errs.length) throw new Error(`${name} ${format}: ${errs[0]}`);
    const out = path.join(outDir, `${name}_${format.replace(":", "x")}.mp4`);
    const ff = ["-y", "-hide_banner", "-loglevel", "error", "-f", "image2pipe", "-c:v", "mjpeg", "-framerate", String(fps), "-i", "-"];
    if (audioPath) ff.push("-i", audioPath);
    ff.push("-map", "0:v");
    if (audioPath) ff.push("-map", "1:a:0", "-c:a", "aac", "-b:a", "192k");
    ff.push("-c:v", "libx264", "-preset", "medium", "-crf", "19", "-maxrate", `${Math.round((width * height) / (1080 * 1920) * 6000)}k`, "-bufsize", `${Math.round((width * height) / (1080 * 1920) * 12000)}k`,
      "-profile:v", "high", "-pix_fmt", "yuv420p", "-r", String(fps), "-g", String(fps * 2), "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-t", String(duration), "-movflags", "+faststart", out);
    const proc = spawn("ffmpeg", ff, { stdio: ["pipe", "ignore", "pipe"] });
    let ffErr = ""; proc.stderr.on("data", (d) => { ffErr += d; });
    const done = new Promise<void>((res, rej) => proc.on("close", (c) => (c === 0 ? res() : rej(new Error(ffErr.slice(0, 400))))));
    let poster: Buffer | null = null;
    const posterAt = Math.min(sb.scenes[0].duration * 0.85, duration - 0.05);
    for (let f = 0; f < frames; f++) {
      const t = f / fps;
      await page.evaluate((tt: number) => (window as unknown as { renderAt: (x: number) => void }).renderAt(tt), t);
      const jpg = await page.screenshot({ type: "jpeg", quality: 92 });
      if (!poster && t >= posterAt) poster = jpg;
      if (!proc.stdin.write(jpg)) await new Promise((r) => proc.stdin.once("drain", r));
    }
    proc.stdin.end();
    await done;
    await page.close();
    if (poster) writeFileSync(path.join(outDir, `${name}_${format.replace(":", "x")}_poster.jpg`), poster);
    const p = probe(out);
    const loud = audioPath ? await measureLoudness(out) : null;
    const v = { format, width, height, fps, mp4: Buffer.alloc(0), poster: Buffer.alloc(0), probe: p, renderMs: Date.now() - t0, sound: { cues, lufs: loud?.lufs ?? null, truePeak: loud?.truePeak ?? null, music: Boolean(audio) } } as RenderedVideo;
    const qc = qcFor(sb, v);
    report.push({ format, file: path.basename(out), probe: p, loudness: loud, sfx_cues: cues.length, qc, render_seconds: Math.round(v.renderMs / 1000) });
    console.log(`✓ ${path.basename(out)}  ${p.width}×${p.height}  ${p.durationS.toFixed(2)}s  ${(p.sizeBytes / 1048576).toFixed(1)}MB  ${loud ? loud.lufs.toFixed(1) + " LUFS" : "silent"}  QC ${qc.filter((q) => q.pass).length}/${qc.length}`);
  }
  writeFileSync(path.join(outDir, `${name}_qc.json`), JSON.stringify({ title: sb.title, duration, cue_sheet: cues, renders: report }, null, 2));
  rmSync(tmp, { recursive: true, force: true });
}
await browser.close();
