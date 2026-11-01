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

/** Classic layouts: bold kinetic type on brand colour fields. */
export const CLASSIC_LAYOUTS = ["hook", "statement", "list", "stat", "cta", "logo"] as const;
/**
 * Studio layouts: the clean agency "UI motion" language (sentence-case type, capsules, design-tool UI,
 * shape grids, brush strokes) with Katana-style editing energy — beat-locked cuts, camera punches, hits.
 */
export const STUDIO_LAYOUTS = ["type_line", "ui_select", "pill_cycle", "word_wheel", "pill_stack", "bento", "stroke_reveal", "cta_pill", "logo_end"] as const;
/**
 * Cinematic layouts: dark code-rendered lyric-video language — slamming heavy type with echo trails, glowing counter,
 * node network, pulse rings, 3D wireframe corridor, HUD callouts, oscilloscope wave, logo reveal — over a persistent HUD
 * with grain, bloom and flash / invert / chromatic hits.
 */
export const CINEMATIC_LAYOUTS = ["slam", "counter", "network", "rings", "corridor", "callouts", "wave", "logo_reveal"] as const;

export const sceneSchema = z.object({
  layout: z.enum([...CLASSIC_LAYOUTS, ...STUDIO_LAYOUTS, ...CINEMATIC_LAYOUTS]).describe(
    "classic — hook: kinetic headline · statement: headline + line · list: 2–4 points · stat: big counting number · cta: action + button · logo: brand sting. " +
    "studio — type_line: sentence inks in word by word (prop 'eyes' adds a playful doodle) · ui_select: design-tool selection box, cursor, headline + typed pill (button) · " +
    "pill_cycle: headline ending in a capsule that cycles through `words` · word_wheel: vertical list of `items` scrolling past a highlighted centre · " +
    "pill_stack: stacked capsules with sticker badges, `items` typed in · bento: shape grid assembles then fills with `image_file_ids` · " +
    "stroke_reveal: brush stroke sweeps across while headline/subline reveal · cta_pill: capsule draws and fills with `button` text · logo_end: brand logo reveal and hold. " +
    "cinematic — slam: `items` slam in one per beat, giant, with echo trails (last word in accent) · counter: `headline` label + glowing number counting to `stat` · " +
    "network: particles converge, a node network grows, `items` light up karaoke-style · rings: `headline` word with pulse rings (O's glow) · corridor: 3D wireframe corridor dolly, sign with `headline`/`subline` · " +
    "callouts: `image_file_id` under HUD boxes labelled with `words`, `items` stacked left · wave: light streak becomes an oscilloscope wave carrying `headline` · logo_reveal: streak + logo materialises, `headline` tagline, `button` CTA tag",
  ),
  duration: z.number().min(1).max(15).describe("Seconds on screen. For beat-locked edits make scene lengths multiples of the music's beat."),
  eyebrow: z.string().max(40).optional().describe("Small label above the headline"),
  headline: z.string().min(1).max(90),
  subline: z.string().max(140).optional(),
  items: z.array(z.string().min(1).max(60)).max(10).optional().describe("list / pill_stack (2–4) / word_wheel (5–10)"),
  words: z.array(z.string().min(1).max(24)).min(2).max(6).optional().describe("pill_cycle: words cycled in the capsule"),
  stat: z.object({ value: z.number(), prefix: z.string().max(4).optional(), suffix: z.string().max(6).optional() }).optional().describe("For layout=stat; counts up"),
  button: z.string().max(28).optional().describe("cta / cta_pill / ui_select pill text"),
  contact: z.string().max(60).optional().describe("cta / cta_pill / logo / logo_end: handle, URL or phone — only real, provided details"),
  prop: z.enum(["none", "eyes"]).default("none").describe("type_line decoration"),
  background: z.enum(["brand", "dark", "light", "accent", "image", "paper", "white", "ink"]).default("brand"),
  image_file_id: z.string().uuid().optional().describe("Background image (stored file) when background=image"),
  image_file_ids: z.array(z.string().uuid()).max(6).optional().describe("bento: photos masked into the shapes"),
  transition: z.enum(["cut", "punch", "wipe"]).optional().describe("How this scene enters (studio). Default: cut on the beat; punch = camera zoom hit; wipe = bar sweep"),
});

export const storyboardBase = z.object({
  title: z.string().min(3).max(120),
  objective: z.string().min(10).max(300).describe("What the video must achieve and for whom"),
  style: z.enum(["classic", "studio", "cinematic"]).default("classic").describe("classic: bold kinetic type on colour fields · studio: clean agency UI-motion language · cinematic: dark HUD lyric-video language with heavy kinetic type and generative scenes"),
  brand: z.object({
    name: z.string().min(1).max(60),
    primary: hex.optional(), secondary: hex.optional(), accent: hex.optional(),
    background: hex.optional(), text: hex.optional(),
    shape: hex.optional().describe("studio: colour of bento shapes"),
    stroke: hex.optional().describe("studio: brush-stroke colour (defaults to accent)"),
    heading_font: z.enum(["Anton", "Montserrat", "Oswald"]).default("Montserrat"),
    logo_svg: z.string().max(60_000).optional().describe("Inline <svg> logo; otherwise the brand name is set as a wordmark"),
  }),
  scenes: z.array(sceneSchema).min(1).max(10),
  formats: z.array(z.enum(["9:16", "1:1", "4:5", "16:9"])).min(1).max(4).default(["9:16", "1:1", "16:9"]),
  fps: z.union([z.literal(24), z.literal(25), z.literal(30)]).default(30),
  audio_file_id: z.string().uuid().optional().describe("Music or voice-over (stored file); trimmed and faded to length"),
  beat_seconds: z.number().min(0.25).max(2).optional().describe("Music beat length (e.g. 0.6 for 100 BPM). Studio animations and hits lock to it"),
  beat_offset: z.number().min(0).max(2).default(0).describe("Time of the first downbeat in the soundtrack"),
});

/** Cross-field rules (layouts must belong to the chosen style; layout-specific content present). */
export function refineStoryboard(sb: { style: "classic" | "studio" | "cinematic"; scenes: z.infer<typeof sceneSchema>[] }, ctx: z.RefinementCtx) {
  const allowed: readonly string[] = sb.style === "studio" ? STUDIO_LAYOUTS : sb.style === "cinematic" ? CINEMATIC_LAYOUTS : CLASSIC_LAYOUTS;
  sb.scenes.forEach((s, i) => {
    if (!allowed.includes(s.layout)) ctx.addIssue({ code: "custom", path: ["scenes", i, "layout"], message: `Layout "${s.layout}" is not part of the ${sb.style} style (${allowed.join(", ")})` });
    if (s.layout === "pill_cycle" && !s.words?.length) ctx.addIssue({ code: "custom", path: ["scenes", i, "words"], message: "pill_cycle needs `words`" });
    if (s.layout === "word_wheel" && (s.items?.length ?? 0) < 5) ctx.addIssue({ code: "custom", path: ["scenes", i, "items"], message: "word_wheel needs 5–10 `items`" });
    if (s.layout === "callouts" && !s.image_file_id) ctx.addIssue({ code: "custom", path: ["scenes", i, "image_file_id"], message: "callouts needs `image_file_id`" });
    if (s.layout === "pill_stack" && (s.items?.length ?? 0) < 2) ctx.addIssue({ code: "custom", path: ["scenes", i, "items"], message: "pill_stack needs 2–4 `items`" });
  });
}

export const storyboardSchema = storyboardBase.superRefine(refineStoryboard);

export type Storyboard = z.infer<typeof storyboardSchema>;
export type Scene = z.infer<typeof sceneSchema>;

export const totalDuration = (sb: Pick<Storyboard, "scenes">) => Math.round(sb.scenes.reduce((a, s) => a + s.duration, 0) * 100) / 100;

/** Neutral defaults when a client's palette isn't on file — flagged in QC rather than invented. */
export const NEUTRAL = { primary: "#111827", secondary: "#1F2937", accent: "#F59E0B", background: "#0B0F17", text: "#F9FAFB" };
