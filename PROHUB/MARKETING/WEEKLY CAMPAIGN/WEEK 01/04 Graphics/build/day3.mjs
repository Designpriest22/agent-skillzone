// DAY 3 — Creative showcase: "We rebranded a suya spot that doesn't exist."
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync } from "node:fs";
import { C, logo, BASE_CSS } from "./brand.mjs";
import { frame } from "./layout.mjs";
import { boards, fit, EY } from "./emberyaji.mjs";

export const FOLDER = "Day 03 - Ember and Yaji Showcase";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const MEDIA = path.resolve(HERE, "../../05 Videos/media");
const BOARDS = path.resolve(HERE, "../boards/ember-and-yaji");
mkdirSync(MEDIA, { recursive: true });
mkdirSync(BOARDS, { recursive: true });
const N = 7;
const disclaimer = `<span class="mono" style="font-size:18px;color:${C.mute}">Fictional brand · Prohub concept work</span>`;

const slide = (i, tone, label, body, bot) => ({
  name: `D3-0${i}_carousel_4x5_${label}`,
  ...frame({ size: "portrait", tone, top: [undefined, `03 / 07 — Showcase`], bot: bot ?? [i === 1 ? "Swipe →" : "Fictional brand · Real process", `0${i} / 0${N}`], body, grain: tone !== "orange" }),
});

export function assets() {
  const out = [
    slide(1, "ink", "cover", `
      <div class="h" style="position:absolute;left:76px;right:76px;top:150px;font-size:96px">We rebranded a suya spot that doesn’t exist.</div>
      <div style="position:absolute;left:76px;top:560px">${fit(boards.sign(), 560, 22)}</div>
      <div class="b" style="position:absolute;left:666px;right:76px;top:580px;font-size:32px;color:#C9C6C0">Fictional business.<br><br>Real process.<br><br><span class="o">Swipe to watch it become a brand.</span></div>`),
    slide(2, "paper", "before", `
      <div class="mono" style="position:absolute;left:76px;top:160px;font-size:24px;color:${C.muteDark}">Before</div>
      <div class="h" style="position:absolute;left:76px;right:76px;top:200px;font-size:92px">Great suya. Forgettable brand.</div>
      <div style="position:absolute;left:76px;top:450px;transform:rotate(-2deg)">${fit(boards.before(), 560, 6)}</div>
      <div class="b" style="position:absolute;left:676px;right:76px;top:520px;font-size:30px;color:${C.muteDark}">Five colours. Six fonts. Two phone numbers. Nothing a customer could describe to a friend.</div>`),
    slide(3, "ink", "insight", `
      <div class="mono o" style="position:absolute;left:76px;top:160px;font-size:24px">The insight</div>
      <div class="h" style="position:absolute;left:76px;right:76px;top:210px;font-size:90px">Suya is bought at night, by the light of the grill.</div>
      <div class="h" style="position:absolute;left:76px;right:76px;top:560px;font-size:90px;color:${C.orange}">So the brand should glow.</div>
      <div style="position:absolute;left:76px;right:76px;top:840px;border-top:2px solid ${C.line};padding-top:30px;display:grid;grid-template-columns:1fr 1fr;gap:30px">
        <div><div class="mono" style="font-size:20px;color:${C.mute}">Positioning</div><div class="b" style="font-size:34px;margin-top:12px">Abuja’s late-night suya, done properly.</div></div>
        <div><div class="mono" style="font-size:20px;color:${C.mute}">Name</div><div class="b" style="font-size:34px;margin-top:12px">Ember &amp; Yaji — the fire and the spice.</div></div></div>`),
    slide(4, "ink", "identity", `
      <div class="mono o" style="position:absolute;left:76px;top:160px;font-size:24px">The identity</div>
      <div style="position:absolute;left:76px;top:220px;display:flex;gap:24px">${fit(boards.logo(), 452)}${fit(boards.palette(), 452)}</div>
      <div class="h7" style="position:absolute;left:76px;right:76px;top:720px;font-size:56px">A skewer that stacks into a flame. Colours pulled straight from the grill.</div>
      <div class="b" style="position:absolute;left:76px;right:76px;top:900px;font-size:30px;color:#C9C6C0">One symbol, one wordmark, five colours, two typefaces. Small enough to stay consistent — distinctive enough to be remembered.</div>`),
    slide(5, "paper", "applied", `
      <div class="mono" style="position:absolute;left:76px;top:160px;font-size:24px;color:${C.muteDark}">Applied</div>
      <div class="h" style="position:absolute;left:76px;right:76px;top:200px;font-size:84px">Every touchpoint says the same thing.</div>
      <div style="position:absolute;left:76px;top:440px;display:flex;gap:24px">${fit(boards.packaging(), 452)}${fit(boards.menu(), 452)}</div>
      <div class="b" style="position:absolute;left:76px;right:76px;top:930px;font-size:30px;color:${C.muteDark}">Heat shown in embers, not words. A seal sticker that becomes the thing people photograph.</div>`),
    slide(6, "ink", "feed", `
      <div class="mono o" style="position:absolute;left:76px;top:160px;font-size:24px">On the feed</div>
      <div style="position:absolute;left:76px;top:220px">${fit(boards.social(), 600)}</div>
      <div class="h7" style="position:absolute;left:712px;right:76px;top:230px;font-size:48px">Recognisable from one tile.</div>
      <div class="b" style="position:absolute;left:712px;right:76px;top:470px;font-size:28px;color:#C9C6C0">Cover the name on any post and you still know whose it is.<br><br><span class="o">That’s the logo test from Monday — passed.</span></div>
      <div class="h7" style="position:absolute;left:76px;right:76px;top:870px;font-size:44px;color:${C.mute}">Same suya. <span style="color:${C.white}">Different story.</span></div>`),
    slide(7, "orange", "cta", `
      <div class="h" style="position:absolute;left:76px;right:76px;top:170px;font-size:124px;color:${C.ink}">Imagine what we’d do with a real one.</div>
      <div class="b" style="position:absolute;left:76px;right:140px;top:720px;font-size:42px;color:${C.ink};font-weight:600">Brand strategy, identity, packaging, menus, signage, social. One team, one direction.</div>
      <div class="h7" style="position:absolute;left:76px;right:76px;top:920px;font-size:52px;color:${C.ink}">Tell us what your business is building.</div>
      <div style="position:absolute;left:76px;bottom:150px">${logo({ h: 70, tone: "dark", accent: C.white })}</div>`, ["DM ‘SHOWCASE’", "07 / 07"]),
  ];

  // Stories
  out.push({
    name: "D3-08_story_9x16_before-after",
    ...frame({
      size: "story", tone: "ink", m: 84, top: [undefined, "Before / after"], bot: ["Fictional brand · Prohub concept", "New post"],
      body: `
      <div style="position:absolute;left:150px;top:190px">${fit(boards.before(), 780, 14)}</div>
      <div class="mono" style="position:absolute;left:176px;top:214px;font-size:24px;background:${C.ink};color:${C.white};padding:8px 14px;border-radius:6px;z-index:3">Before</div>
      <div style="position:absolute;left:150px;top:1000px">${fit(boards.sign(), 780, 14)}</div>
      <div class="mono" style="position:absolute;left:176px;top:1024px;font-size:24px;background:${C.orange};color:${C.ink};padding:8px 14px;border-radius:6px;z-index:3">After</div>`,
    }),
  });
  out.push({
    name: "D3-09_story_9x16_slider",
    ...frame({
      size: "story", tone: "paper", m: 84, top: [undefined, "Rate it"], bot: ["Prohub", "Full case study on the feed"],
      body: `
      <div class="h" style="position:absolute;left:84px;right:84px;top:240px;font-size:104px">Would you queue for this suya?</div>
      <div style="position:absolute;left:84px;top:620px">${fit(boards.packaging(), 912, 22)}</div>`,
    }),
  });

  // Standalone 1000→1080 boards for the reel (bento layout) — written to 05 Videos/media as JPG.
  for (const [k, b] of Object.entries(boards)) {
    out.push({
      name: `EY-board_${k}`, w: 1080, h: 1080, alsoJpg: MEDIA, dir: BOARDS,
      html: `<!doctype html><html><head><meta charset="utf-8"><style>${BASE_CSS}</style></head><body style="width:1080px;height:1080px">${fit(b(), 1080, 0)}</body></html>`,
    });
  }
  return out;
}
export { EY };
