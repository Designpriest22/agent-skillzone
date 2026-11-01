import { z } from "zod";
/**
 * Video production tools. render_video turns a storyboard into finished MP4s (9:16, 1:1, 4:5, 16:9) with the
 * built-in motion-graphics renderer, stores them, and records a reviewable 'video' deliverable whose QC
 * checklist comes from ffprobe measurements of the actual files.
 */
import { db } from "@/db/client";
import { deliverables } from "@/db/schema";
import { defineTool, ToolError } from "./types";
import { storyboardSchema, FORMATS, totalDuration } from "@/video/storyboard";
import { renderStoryboard, qcFor, VideoRenderUnavailable } from "@/video/render";
import { saveFile } from "@/services/files";
import { env } from "@/lib/env";

export const renderVideoTool = defineTool({
  name: "render_video",
  description:
    "Render a finished motion-graphics video from a storyboard, in every requested aspect ratio (9:16 Reels/TikTok/Shorts, 1:1 and 4:5 feed, 16:9 YouTube/web). " +
    "Scenes use art-directed layouts (hook, statement, list, stat, cta, logo) in the client's brand colours; stored images can be scene backgrounds and a stored audio file can be the soundtrack. " +
    "Load brand_assets first and pass the real palette — do not invent brand colours. Keep on-screen copy to ≤3 words per second. Takes ~25s per format. " +
    "Creates a 'video' deliverable (in review if every measured QC check passes, otherwise draft) and returns its ID and file links.",
  governance: "autonomous",
  schema: storyboardSchema.extend({
    project_id: z.string().uuid().optional(),
    client_id: z.string().uuid().optional(),
    lead_id: z.string().uuid().optional(),
    storyboard_deliverable_id: z.string().uuid().optional().describe("The storyboard deliverable this render implements"),
  }),
  async run(input, ctx) {
    const { project_id, client_id, lead_id, storyboard_deliverable_id, ...sb } = input;
    const duration = totalDuration(sb);
    if (duration > 60) throw new ToolError(`Total duration is ${duration}s; keep videos to 60s or less.`);
    let videos;
    try {
      videos = await renderStoryboard(sb);
    } catch (e) {
      if (e instanceof VideoRenderUnavailable) throw new ToolError(`${e.message} Deliver the script and storyboard as deliverables and report that rendering is unavailable on this server.`);
      throw e;
    }
    const fileIds: string[] = [];
    const outputs: { format: string; file_id: string; poster_file_id: string; url: string; duration_s: number; size_mb: number }[] = [];
    const qc: { item: string; pass: boolean; note?: string }[] = [];
    for (const v of videos) {
      const slug = sb.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "video";
      const mp4 = await saveFile({ name: `${slug}-${v.format.replace(":", "x")}.mp4`, mimeType: "video/mp4", data: v.mp4, source: "render", createdBy: `agent:${ctx.agentSlug}`, meta: { format: v.format, width: v.width, height: v.height, fps: v.fps, durationS: v.probe.durationS, placement: FORMATS[v.format].label } });
      const poster = await saveFile({ name: `${slug}-${v.format.replace(":", "x")}-poster.jpg`, mimeType: "image/jpeg", data: v.poster, source: "render", createdBy: `agent:${ctx.agentSlug}`, meta: { format: v.format, posterFor: mp4.id } });
      fileIds.push(mp4.id, poster.id);
      outputs.push({ format: v.format, file_id: mp4.id, poster_file_id: poster.id, url: `${env.appUrl}/api/files/${mp4.id}`, duration_s: v.probe.durationS, size_mb: Math.round(v.probe.sizeBytes / 10485.76) / 100 });
      for (const q of qcFor(sb, v)) qc.push({ item: `[${v.format}] ${q.item}`, pass: q.pass });
    }
    const allPass = qc.every((q) => q.pass);
    const content = [
      `# ${sb.title}`, "", `**Objective:** ${sb.objective}`, `**Duration:** ${duration}s · **Formats:** ${sb.formats.join(", ")} · ${sb.fps} fps${sb.audio_file_id ? " · with soundtrack" : " · silent (designed for sound-off viewing)"}`, "",
      "## Scenes", ...sb.scenes.map((s, i) => `${i + 1}. **${s.layout}** (${s.duration}s) — ${s.eyebrow ? `_${s.eyebrow}_ · ` : ""}${s.headline}${s.subline ? ` — ${s.subline}` : ""}${s.items?.length ? ` — ${s.items.join(" / ")}` : ""}${s.button ? ` — [${s.button}]` : ""}${s.contact ? ` — ${s.contact}` : ""}`),
      "", "## Files", ...outputs.map((o) => `- ${o.format} (${FORMATS[o.format as keyof typeof FORMATS].label}): ${o.url} — ${o.duration_s.toFixed(2)}s, ${o.size_mb} MB`),
      "", "<details><summary>Storyboard JSON</summary>", "", "```json", JSON.stringify(sb, null, 2), "```", "</details>",
    ].join("\n");
    const [row] = await db.insert(deliverables).values({
      taskId: ctx.taskId, agentSlug: ctx.agentSlug, kind: "video", title: sb.title, format: "markdown", content,
      fileIds, fileUrl: outputs[0]?.url ?? null, platform: sb.formats.join(","), projectId: project_id ?? null, clientId: client_id ?? null, leadId: lead_id ?? null,
      status: allPass ? "in_review" : "draft", qc, reviewNotes: storyboard_deliverable_id ? `Implements storyboard ${storyboard_deliverable_id}` : null,
    }).returning({ id: deliverables.id });
    ctx.produced.push({ type: "deliverable", id: row.id });
    return { deliverable_id: row.id, status: allPass ? "in_review" : "draft (fix the failed QC items and re-render)", files: outputs, failed_qc: qc.filter((q) => !q.pass).map((q) => q.item) };
  },
});
