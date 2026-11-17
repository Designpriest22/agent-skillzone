/** Renders a sample storyboard to ./out-sample (or the dir given) — a quick check that Chromium + ffmpeg work on this host. */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { storyboardSchema } from "@/video/storyboard";
import { renderStoryboard, qcFor } from "@/video/render";

const outDir = process.argv[2] ?? "out-sample";
const sb = storyboardSchema.parse({
  title: "Prohub — Branding that sells (15s)",
  objective: "Make Abuja SME owners see that weak branding costs them sales, and book a free brand audit.",
  brand: { name: "Prohub Creative", primary: "#0E1A2B", accent: "#F2B705", background: "#08111D", text: "#F7F4EC", heading_font: "Montserrat" },
  scenes: [
    { layout: "hook", duration: 3, eyebrow: "For Abuja businesses", headline: "Your brand is losing you customers" },
    { layout: "stat", duration: 3, eyebrow: "Fast turnaround", headline: "from brief to a brand you can launch", stat: { value: 14, suffix: " days" } },
    { layout: "list", duration: 4, headline: "What you get", items: ["Logo & identity", "Social media kit", "Brand guidelines"] },
    { layout: "cta", duration: 3, headline: "Get a free brand audit", button: "Book on WhatsApp", contact: "prohub.ng" },
    { layout: "logo", duration: 2, headline: "Creative that moves business", contact: "@prohubcreative" },
  ],
  formats: ["9:16", "1:1", "16:9"],
});
const t = Date.now();
const vids = await renderStoryboard(sb, { onProgress: (m) => console.log(m) });
mkdirSync(outDir, { recursive: true });
for (const v of vids) {
  const base = path.join(outDir, `sample-${v.format.replace(":", "x")}`);
  writeFileSync(`${base}.mp4`, v.mp4); writeFileSync(`${base}-poster.jpg`, v.poster);
  console.log(v.format, v.probe, `${v.renderMs}ms`);
  for (const q of qcFor(sb, v)) console.log(`  ${q.pass ? "✓" : "✗"} ${q.item}`);
}
console.log(`total ${((Date.now() - t) / 1000).toFixed(1)}s`);
process.exit(0);
