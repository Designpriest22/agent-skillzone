/**
 * Storyboard contract for the built-in motion-graphics renderer. The Video agent writes this; the renderer
 * turns it into MP4s for each placement. Kept deliberately small: scene layouts are art-directed templates
 * (kinetic type, lists, stats, CTA, logo sting) that look professional with any brand palette.
 */
import { z } from "zod";

export const FORMATS = {
  "9:16": { width: 1080, height: 1920, label: "Reels / TikTok / Shorts / Stories" },
  "1:1": { width: 1080, height: 1080, label: "Feed square" },
  "4:5": { width: 1080, height: 1350, label: "Feed portrait" },
  "16:9": { width: 1920, height: 1080, label: "YouTube / web / LinkedIn" },
} as const;
export type VideoFormat = keyof typeof FORMATS;

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use 6-digit hex colours, e.g. #0F172A");

export const sceneSchema = z.object({
  layout: z.enum(["hook", "statement", "list", "stat", "cta", "logo"]).describe(
    "hook: kinetic headline, word by word · statement: headline + supporting line · list: headline + 2–4 points · stat: big number + label · cta: action + button + contact · logo: brand sting",
  ),
  duration: z.number().min(1).max(15).describe("Seconds on screen"),
  eyebrow: z.string().max(40).optional().describe("Small label above the headline"),
  headline: z.string().min(1).max(90),
  subline: z.string().max(140).optional(),
  items: z.array(z.string().min(1).max(60)).max(4).optional().describe("For layout=list"),
  stat: z.object({ value: z.number(), prefix: z.string().max(4).optional(), suffix: z.string().max(6).optional() }).optional().describe("For layout=stat; counts up"),
  button: z.string().max(28).optional().describe("For layout=cta, e.g. 'Book a free brand audit'"),
  contact: z.string().max(60).optional().describe("For layout=cta/logo, e.g. a handle, URL or phone number"),
  background: z.enum(["brand", "dark", "light", "accent", "image"]).default("brand"),
  image_file_id: z.string().uuid().optional().describe("Background image (stored file) when background=image"),
});

export const storyboardSchema = z.object({
  title: z.string().min(3).max(120),
  objective: z.string().min(10).max(300).describe("What the video must achieve and for whom"),
  brand: z.object({
    name: z.string().min(1).max(60),
    primary: hex.optional(), secondary: hex.optional(), accent: hex.optional(),
    background: hex.optional(), text: hex.optional(),
    heading_font: z.enum(["Anton", "Montserrat", "Oswald"]).default("Montserrat"),
    logo_svg: z.string().max(60_000).optional().describe("Inline <svg> logo; otherwise the brand name is set as a wordmark"),
  }),
  scenes: z.array(sceneSchema).min(1).max(10),
  formats: z.array(z.enum(["9:16", "1:1", "4:5", "16:9"])).min(1).max(4).default(["9:16", "1:1", "16:9"]),
  fps: z.union([z.literal(24), z.literal(25), z.literal(30)]).default(30),
  audio_file_id: z.string().uuid().optional().describe("Music or voice-over (stored file); trimmed and faded to length"),
});

export type Storyboard = z.infer<typeof storyboardSchema>;
export type Scene = z.infer<typeof sceneSchema>;

export const totalDuration = (sb: Pick<Storyboard, "scenes">) => Math.round(sb.scenes.reduce((a, s) => a + s.duration, 0) * 100) / 100;

/** Neutral defaults when a client's palette isn't on file — flagged in QC rather than invented. */
export const NEUTRAL = { primary: "#111827", secondary: "#1F2937", accent: "#F59E0B", background: "#0B0F17", text: "#F9FAFB" };
