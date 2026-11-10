/**
 * Sound design for rendered videos. Every render gets a designed audio layer by default: SFX spotted to the picture
 * (cuts, word slams, counters, HUD blips, network nodes, streaks, a riser into the logo's sub drop, sparkles on the
 * CTA), mixed over the music with sidechain ducking, limited and normalised to -14 LUFS (social-platform loudness).
 *
 * Cue timing mirrors each template's animation timing, so hits land on the frames that move. The SFX kit lives in
 * assets/sfx/kit (built from CC0 one-shots by scripts/build-sfx-kit.sh).
 */
import { spawn } from "node:child_process";
import path from "node:path";
import type { Storyboard } from "./storyboard";

export type SfxName = "hit" | "impact" | "boom" | "riser" | "whoosh" | "whoosh_in" | "glitch" | "tick" | "blip" | "node" | "scan" | "streak" | "sparkle" | "drone";
export type Cue = { t: number; sfx: SfxName; gain: number; why: string };

const KIT: Record<SfxName, URL> = {
  hit: new URL("../../assets/sfx/kit/hit.wav", import.meta.url),
  impact: new URL("../../assets/sfx/kit/impact.wav", import.meta.url),
  boom: new URL("../../assets/sfx/kit/boom.wav", import.meta.url),
  riser: new URL("../../assets/sfx/kit/riser.wav", import.meta.url),
  whoosh: new URL("../../assets/sfx/kit/whoosh.wav", import.meta.url),
  whoosh_in: new URL("../../assets/sfx/kit/whoosh_in.wav", import.meta.url),
  glitch: new URL("../../assets/sfx/kit/glitch.wav", import.meta.url),
  tick: new URL("../../assets/sfx/kit/tick.wav", import.meta.url),
  blip: new URL("../../assets/sfx/kit/blip.wav", import.meta.url),
  node: new URL("../../assets/sfx/kit/node.wav", import.meta.url),
  scan: new URL("../../assets/sfx/kit/scan.wav", import.meta.url),
  streak: new URL("../../assets/sfx/kit/streak.wav", import.meta.url),
  sparkle: new URL("../../assets/sfx/kit/sparkle.wav", import.meta.url),
  drone: new URL("../../assets/sfx/kit/drone.wav", import.meta.url),
};
/** Lengths of the reversed/pre-roll sounds whose loudest point is their end. */
const PREROLL: Partial<Record<SfxName, number>> = { whoosh_in: 0.95, riser: 2.15 };

/** Builds the cue sheet: when each sound fires and why (shown on the deliverable for creative review). */
export function cueSheet(sb: Storyboard): Cue[] {
  const cues: Cue[] = [];
  const beat = sb.beat_seconds ?? 0.6;
  const add = (t: number, sfx: SfxName, gain: number, why: string) => { if (t >= 0) cues.push({ t: Math.round(t * 1000) / 1000, sfx, gain, why }); };
  const pre = (end: number, sfx: SfxName, gain: number, why: string) => add(end - (PREROLL[sfx] ?? 0), sfx, gain, why);
  let t0 = 0;
  sb.scenes.forEach((s, i) => {
    const d = s.duration, st = t0;
    const punch = (s.transition ?? (sb.style === "cinematic" && i > 0 ? "punch" : "cut")) === "punch";
    const logoScene = ["logo_reveal", "logo_end", "logo"].includes(s.layout);
    if (i > 0 && !logoScene) {
      pre(st, "whoosh_in", punch ? 0.75 : 0.5, `into scene ${i + 1}`);
      add(st, punch ? "impact" : "hit", punch ? 0.95 : 0.55, `cut to scene ${i + 1} (${s.layout})`);
    }
    switch (s.layout) {
      /* cinematic */
      case "slam": {
        const ws = s.items?.length ? s.items : s.headline.split(/\s+/);
        const step = Math.min(d / ws.length, Math.max(beat, 0.35));
        ws.forEach((w, k) => { if (k === 0 && i > 0) return; add(st + k * step, k === ws.length - 1 ? "impact" : "hit", k === ws.length - 1 ? 0.9 : 0.75, `slam "${w}"`); });
        break;
      }
      case "counter": {
        const end = 0.15 + d * 0.62;
        for (let x = 0.15; x < end; x += 0.1) add(st + x, "tick", 0.45, "counter tick");
        add(st + end, "glitch", 0.8, "counter hits 100 / invert flash");
        break;
      }
      case "network": {
        add(st, "scan", 0.55, "particles converge");
        const n = (s.items ?? s.headline.split(/\s+/)).length;
        const stepW = Math.max(0.3, (d - 0.6) / (n + 1));
        for (let j = 0; j < n; j++) add(st + 0.2 + j * stepW, "node", 0.7, "lyric line lights up");
        add(st + 0.8, "blip", 0.45, "network starts growing");
        break;
      }
      case "rings":
        for (let x = beat; x < d - 0.1; x += beat) add(st + x, "hit", 0.28, "ring pulse on the beat");
        break;
      case "corridor":
        add(st, "drone", 0.7, "3D corridor room tone");
        add(st + 0.3, "whoosh", 0.6, "sign flies in");
        add(st + 0.3 + beat * 2, "node", 0.6, "second line lights");
        break;
      case "callouts": {
        const items = s.items ?? s.headline.split(/\s+/);
        const stc = Math.max(0.25, (d - 0.8) / (items.length + 1));
        items.forEach((_, j) => add(st + 0.2 + j * stc, "tick", 0.55, "stacked word"));
        (s.words ?? []).forEach((w, j) => add(st + 0.45 + j * 0.3, "blip", 0.65, `callout "${w}"`));
        break;
      }
      case "wave":
        add(st, "streak", 0.85, "light streak");
        add(st + 0.6, "scan", 0.35, "oscilloscope signal");
        break;
      case "logo_reveal":
        pre(st + 0.3, "riser", 0.8, "build into the logo");
        add(st, "streak", 0.6, "light streak across");
        add(st + 0.3, "boom", 1.0, "logo reveal sub drop");
        add(st + 0.62, "glitch", 0.3, "wordmark glitch-in");
        if (s.button) add(st + 1.5, "sparkle", 0.6, "CTA appears");
        break;
      /* studio */
      case "type_line": {
        const n = s.headline.split(/\s+/).length;
        for (let k = 0; k < n; k++) add(st + 0.08 + k * beat * 0.375, "tick", 0.35, "word inks in");
        break;
      }
      case "ui_select":
        add(st + 0.1, "blip", 0.5, "selection box");
        if (s.button) for (let k = 0; k < s.button.length; k++) add(st + 1.15 + k / 16, "tick", 0.3, "typing");
        break;
      case "pill_cycle":
        (s.words ?? []).forEach((_, k) => add(st + 0.9 + k * ((d - 1.1) / Math.max(1, s.words!.length)), "blip", 0.5, "capsule word change"));
        break;
      case "word_wheel": {
        const n = s.items?.length ?? 0;
        const step = Math.max(beat / 2, (d - 0.4) / Math.max(1, n - 1));
        for (let k = 1; k < n; k++) add(st + k * step, "tick", 0.4, "wheel tick");
        break;
      }
      case "pill_stack":
        (s.items ?? []).forEach((_, k) => add(st + 0.75 + k * 0.08, "node", 0.45, "capsule opens"));
        break;
      case "bento":
        for (let k = 0; k < 5; k++) add(st + k * 0.07, "hit", 0.25, "shape lands");
        (s.image_file_ids ?? []).slice(0, 5).forEach((_, k) => add(st + 0.75 + k * beat * 0.4, "blip", 0.4, "photo reveals"));
        break;
      case "stroke_reveal":
        add(st + 0.55, "whoosh", 0.7, "brush stroke");
        break;
      case "cta_pill":
        add(st + 0.45, "sparkle", 0.55, "CTA fills");
        break;
      case "logo_end":
      case "logo":
        if (i > 0) pre(st, "riser", 0.6, "build into the logo");
        add(st, "boom", 0.9, "logo reveal");
        add(st + 0.4, "sparkle", 0.5, "logo sparkle");
        break;
      /* classic */
      case "cta":
        add(st + 0.45, "sparkle", 0.5, "button pops");
        break;
      default:
        break;
    }
    t0 += d;
  });
  return cues.sort((a, b) => a.t - b.t);
}

function run(args: string[]) {
  return new Promise<{ code: number; stderr: string }>((resolve, reject) => {
    const p = spawn(/*turbopackIgnore: true*/ process.env.FFMPEG_PATH || "ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => { err += d.toString(); if (err.length > 40000) err = err.slice(-40000); });
    p.on("error", reject);
    p.on("close", (code) => resolve({ code: code ?? 1, stderr: err }));
  });
}

/**
 * Mixes music (optional) + spotted SFX into one master WAV of exactly `duration` seconds.
 * Music is ducked by the SFX bus (sidechain), the sum is limited and loudness-normalised to -14 LUFS / -1.5 dBTP.
 */
export async function mixSoundtrack(sb: Storyboard, musicPath: string | null, outPath: string, duration: number) {
  const cues = cueSheet(sb).filter((c) => c.t < duration);
  const args = ["-v", "error", "-y"];
  let idx = 0;
  const parts: string[] = [];
  let music = "";
  if (musicPath) {
    args.push("-i", musicPath);
    music = `[${idx}]aresample=48000,aformat=channel_layouts=stereo,atrim=0:${duration},asetpts=N/SR/TB,afade=t=in:d=0.2,afade=t=out:st=${Math.max(0, duration - 1.2)}:d=1.2,volume=0.72[mus]`;
    idx++;
  }
  // one input per distinct sound, split as many times as it is used
  const used = [...new Set(cues.map((c) => c.sfx))];
  const inputIdx: Record<string, number> = {};
  for (const name of used) { args.push("-i", decodeURIComponent(KIT[name as SfxName].pathname)); inputIdx[name] = idx++; }
  for (const name of used) {
    const n = cues.filter((c) => c.sfx === name).length;
    parts.push(`[${inputIdx[name]}]aresample=48000,aformat=channel_layouts=stereo,asplit=${n}${Array.from({ length: n }, (_, k) => `[${name}${k}]`).join("")}`);
  }
  const counters: Record<string, number> = {};
  const labels: string[] = [];
  cues.forEach((c, k) => {
    const j = (counters[c.sfx] = (counters[c.sfx] ?? -1) + 1);
    const ms = Math.round(c.t * 1000);
    parts.push(`[${c.sfx}${j}]adelay=${ms}|${ms},volume=${c.gain}[c${k}]`);
    labels.push(`[c${k}]`);
  });
  const sfxBus = labels.length
    ? `${labels.join("")}amix=inputs=${labels.length}:normalize=0:duration=longest,apad=whole_dur=${duration},atrim=0:${duration}[sfx]`
    : `anullsrc=r=48000:cl=stereo,atrim=0:${duration}[sfx]`;
  parts.push(sfxBus);
  if (musicPath) {
    parts.push(music);
    parts.push(`[sfx]asplit=2[sfxa][sfxsc]`);
    parts.push(`[mus][sfxsc]sidechaincompress=threshold=0.04:ratio=4:attack=8:release=260:makeup=1[duck]`);
    parts.push(`[duck][sfxa]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.9:level=disabled,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[out]`);
  } else {
    parts.push(`[sfx]alimiter=limit=0.9:level=disabled,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[out]`);
  }
  args.push("-filter_complex", parts.join(";"), "-map", "[out]", "-t", String(duration), "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le", outPath);
  const r = await run(args);
  if (r.code !== 0) throw new Error(`Sound design mix failed: ${r.stderr.slice(-600)}`);
  return { cues, path: outPath };
}

/** Integrated loudness (LUFS) and true peak of a file's audio, measured with EBU R128. */
export async function measureLoudness(file: string): Promise<{ lufs: number; truePeak: number } | null> {
  const r = await run(["-hide_banner", "-nostats", "-i", file, "-vn", "-af", "ebur128=peak=true:framelog=quiet", "-f", "null", "-"]);
  const I = /I:\s+(-?[\d.]+) LUFS/.exec(r.stderr);
  const P = /Peak:\s+(-?[\d.]+) dBFS/.exec(r.stderr);
  return I ? { lufs: Number(I[1]), truePeak: P ? Number(P[1]) : NaN } : null;
}

export const kitPath = (name: SfxName) => path.normalize(decodeURIComponent(KIT[name].pathname));
