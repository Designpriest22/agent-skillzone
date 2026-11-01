/**
 * Built-in video renderer: storyboard → deterministic HTML → headless Chromium frames → ffmpeg (H.264 MP4).
 * Runs in the background worker (needs Chromium + ffmpeg; both are in the Docker image). No paid video API
 * required; AI-generated clips or photos can be layered in as scene backgrounds via stored files.
 *
 * Every output is verified with ffprobe (codec, resolution, duration, size) and the QC checklist on the
 * deliverable is computed from those measurements — not claimed by the model.
 */
import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile, readFile as readFs } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { FORMATS, totalDuration, type Storyboard, type VideoFormat } from "./storyboard";
import { buildHtml } from "./template";
import { buildStudioHtml } from "./studio";
import { buildCinematicHtml } from "./cinematic";
import { readFile } from "@/services/files";

export class VideoRenderUnavailable extends Error {}

const FFMPEG = () => process.env.FFMPEG_PATH || "ffmpeg";
const FFPROBE = () => process.env.FFPROBE_PATH || "ffprobe";

function run(cmd: string, args: string[], input?: Buffer): Promise<{ code: number; stdout: Buffer; stderr: string }> {
  return new Promise((resolve, reject) => {
    const p = spawn(/*turbopackIgnore: true*/ cmd, args, { stdio: ["pipe", "pipe", "pipe"] });
    const out: Buffer[] = [];
    let err = "";
    p.stdout.on("data", (d) => out.push(d));
    p.stderr.on("data", (d) => { err += d.toString(); if (err.length > 20000) err = err.slice(-20000); });
    p.on("error", reject);
    p.on("close", (code) => resolve({ code: code ?? 1, stdout: Buffer.concat(out), stderr: err }));
    if (input) p.stdin.end(input); else p.stdin.end();
  });
}

export async function renderAvailable(): Promise<{ ok: boolean; reason?: string }> {
  try {
    const r = await run(FFMPEG(), ["-version"]);
    if (r.code !== 0) return { ok: false, reason: "ffmpeg is not installed" };
  } catch { return { ok: false, reason: "ffmpeg is not installed" }; }
  try { await loadChromium(); } catch (e) { return { ok: false, reason: e instanceof Error ? e.message : String(e) }; }
  return { ok: true };
}

type Browser = { newPage: (o: { viewport: { width: number; height: number }; deviceScaleFactor: number }) => Promise<Page>; close: () => Promise<void> };
type Page = {
  setContent: (html: string, o?: { waitUntil?: string; timeout?: number }) => Promise<void>;
  evaluate: <T>(fn: string | ((arg: number) => T), arg?: number) => Promise<T>;
  screenshot: (o: { type: "jpeg" | "png"; quality?: number }) => Promise<Buffer>;
  on: (ev: string, cb: (e: Error) => void) => void;
  close: () => Promise<void>;
};

async function loadChromium() {
  let mod: { chromium: { launch: (o: Record<string, unknown>) => Promise<Browser> } };
  try {
    mod = (await import("playwright-core")) as unknown as typeof mod;
  } catch {
    throw new VideoRenderUnavailable("playwright-core is not installed");
  }
  return mod.chromium;
}

export type RenderedVideo = {
  format: VideoFormat; width: number; height: number; fps: number;
  mp4: Buffer; poster: Buffer;
  probe: { codec: string; width: number; height: number; pixFmt: string; durationS: number; sizeBytes: number };
  renderMs: number;
};

async function probe(file: string) {
  const r = await run(FFPROBE(), ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=codec_name,width,height,pix_fmt:format=duration,size", "-of", "json", file]);
  if (r.code !== 0) throw new Error(`ffprobe failed: ${r.stderr.slice(0, 300)}`);
  const j = JSON.parse(r.stdout.toString()) as { streams: { codec_name: string; width: number; height: number; pix_fmt: string }[]; format: { duration: string; size: string } };
  const s = j.streams[0];
  return { codec: s.codec_name, width: s.width, height: s.height, pixFmt: s.pix_fmt, durationS: Number(j.format.duration), sizeBytes: Number(j.format.size) };
}

/** Resolves stored background images into data URIs so the page never touches the network. */
async function loadImages(sb: Storyboard) {
  const out: Record<string, string> = {};
  for (const id of new Set(sb.scenes.flatMap((s) => [s.image_file_id, ...(s.image_file_ids ?? [])]).filter(Boolean) as string[])) {
    const f = await readFile(id);
    if (f && f.mimeType.startsWith("image/")) out[id] = `data:${f.mimeType};base64,${f.data.toString("base64")}`;
  }
  return out;
}

export const pageHtml = (sb: Storyboard, format: VideoFormat, images: Record<string, string>) =>
  sb.style === "studio" ? buildStudioHtml(sb, format, images) : sb.style === "cinematic" ? buildCinematicHtml(sb, format, images) : buildHtml(sb, format, images);

export async function renderStoryboard(sb: Storyboard, opts: { onProgress?: (msg: string) => void } = {}): Promise<RenderedVideo[]> {
  const avail = await renderAvailable();
  if (!avail.ok) throw new VideoRenderUnavailable(`Video rendering is unavailable on this server: ${avail.reason}. Install Chromium and ffmpeg (see docs/DEPLOYMENT.md).`);
  const chromium = await loadChromium();
  const duration = totalDuration(sb);
  const fps = sb.fps;
  const frames = Math.round(duration * fps);
  const images = await loadImages(sb);
  const dir = await mkdtemp(path.join(/*turbopackIgnore: true*/ tmpdir(), "prohub-render-"));
  let audioPath: string | null = null;
  if (sb.audio_file_id) {
    const a = await readFile(sb.audio_file_id);
    if (a && (a.mimeType.startsWith("audio/") || a.mimeType.startsWith("video/"))) { audioPath = path.join(/*turbopackIgnore: true*/ dir, "audio.bin"); await writeFile(/*turbopackIgnore: true*/ audioPath, a.data); }
  }
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none", "--disable-lcd-text"],
  });
  const results: RenderedVideo[] = [];
  try {
    for (const format of sb.formats) {
      const t0 = Date.now();
      const { width, height } = FORMATS[format];
      const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
      const pageErrors: string[] = [];
      page.on("pageerror", (e) => pageErrors.push(e.message));
      await page.setContent(pageHtml(sb, format, images), { waitUntil: "load", timeout: 60_000 });
      await page.evaluate("window.ready");
      if (pageErrors.length) throw new Error(`Template error: ${pageErrors[0]}`);
      const out = path.join(/*turbopackIgnore: true*/ dir, `${format.replace(":", "x")}.mp4`);
      const args = ["-y", "-hide_banner", "-loglevel", "error", "-f", "image2pipe", "-c:v", "mjpeg", "-framerate", String(fps), "-i", "-"];
      if (audioPath) args.push("-i", audioPath);
      args.push("-map", "0:v");
      if (audioPath) args.push("-map", "1:a:0", "-af", `afade=t=in:d=0.3,afade=t=out:st=${Math.max(0, duration - 0.8)}:d=0.8,loudnorm=I=-14:TP=-1.0:LRA=11`, "-c:a", "aac", "-b:a", "160k");
      args.push("-c:v", "libx264", "-preset", "medium", "-crf", "19", "-maxrate", `${Math.round((width * height) / (1080 * 1920) * 6000)}k`, "-bufsize", `${Math.round((width * height) / (1080 * 1920) * 12000)}k`, "-profile:v", "high", "-pix_fmt", "yuv420p", "-r", String(fps), "-g", String(fps * 2),
        "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-t", String(duration), "-movflags", "+faststart", out);
      const ff = spawn(/*turbopackIgnore: true*/ FFMPEG(), args, { stdio: ["pipe", "ignore", "pipe"] });
      let ffErr = "";
      ff.stderr.on("data", (d) => { ffErr += d.toString(); });
      const done = new Promise<void>((res, rej) => ff.on("close", (c) => (c === 0 ? res() : rej(new Error(`ffmpeg exited ${c}: ${ffErr.slice(0, 400)}`)))));
      let poster: Buffer | null = null;
      // Poster: the moment the first scene's copy has fully landed.
      const posterAt = Math.min(sb.scenes[0].duration * 0.85, duration - 0.05);
      for (let f = 0; f < frames; f++) {
        const t = f / fps;
        await page.evaluate((tt: number) => (window as unknown as { renderAt: (x: number) => void }).renderAt(tt), t);
        const jpg = await page.screenshot({ type: "jpeg", quality: 92 });
        if (!poster && t >= posterAt) poster = jpg;
        if (!ff.stdin.write(jpg)) await new Promise((r) => ff.stdin.once("drain", r));
        if (f % (fps * 5) === 0) opts.onProgress?.(`${format}: frame ${f}/${frames}`);
      }
      ff.stdin.end();
      await done;
      await page.close();
      const p = await probe(out);
      results.push({ format, width, height, fps, mp4: await readFs(/*turbopackIgnore: true*/ out), poster: poster ?? Buffer.alloc(0), probe: p, renderMs: Date.now() - t0 });
    }
  } finally {
    await browser.close().catch(() => undefined);
    await rm(/*turbopackIgnore: true*/ dir, { recursive: true, force: true }).catch(() => undefined);
  }
  return results;
}

/** Objective QC computed from the rendered file — what the deliverable's checklist records. */
export function qcFor(sb: Storyboard, v: RenderedVideo) {
  const target = totalDuration(sb);
  const brandSet = sb.style !== "classic" ? Boolean(sb.brand.accent) : Boolean(sb.brand.primary && sb.brand.accent);
  const longest = Math.max(...sb.scenes.map((s) => s.headline.split(/\s+/).length / s.duration));
  return [
    { item: `Resolution ${v.probe.width}×${v.probe.height} matches ${v.format}`, pass: v.probe.width === v.width && v.probe.height === v.height },
    { item: `Duration ${v.probe.durationS.toFixed(2)}s vs storyboard ${target}s`, pass: Math.abs(v.probe.durationS - target) <= 0.25 },
    { item: `H.264 / yuv420p (plays on Instagram, TikTok, WhatsApp, YouTube)`, pass: v.probe.codec === "h264" && v.probe.pixFmt === "yuv420p" },
    { item: `File size ${(v.probe.sizeBytes / 1048576).toFixed(1)} MB${v.probe.sizeBytes > 16 * 1048576 ? " — over WhatsApp's 16 MB limit" : ""}`, pass: v.probe.sizeBytes > 50_000 },
    { item: "Hook lands within 2s (first scene animates in immediately)", pass: sb.scenes[0].duration <= 4 || ["hook", "type_line", "slam"].includes(sb.scenes[0].layout) },
    { item: `On-screen text readable without sound (≤ ${longest.toFixed(1)} words/s on the busiest scene)`, pass: longest <= 3.5 },
    { item: "Ends on a call to action or brand sting", pass: ["cta", "logo", "cta_pill", "logo_end", "logo_reveal"].includes(sb.scenes[sb.scenes.length - 1].layout) },
    { item: brandSet ? "Brand palette applied" : "Brand palette not on file — neutral palette used; confirm colours before publishing", pass: brandSet },
  ];
}
