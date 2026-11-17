/**
 * Rasterises the brand kit with headless Chromium:
 *  - app icons, favicons (PNG + ICO), maskable icon
 *  - PNG versions of every logo SVG
 *  - Open Graph image and social templates
 *  - brand guidelines PDF (printed from /brand; requires `npm start` running on APP_URL)
 * Run after `python3 scripts/brand/build_svgs.py`.
 */
import fs from "node:fs";
import path from "node:path";
import { chromium, type Browser } from "@playwright/test";

const ROOT = process.cwd();
const BRAND = path.join(ROOT, "public/brand");
const ICONS = path.join(ROOT, "public/icons");
const PNG = path.join(BRAND, "png");
const SOCIAL = path.join(BRAND, "social");
const APP_URL = process.env.APP_URL ?? "http://localhost:3000";
const executablePath = fs.existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined;

async function svgToPng(browser: Browser, svgFile: string, out: string, width: number, height?: number) {
  const svg = fs.readFileSync(svgFile, "utf8");
  const vb = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)!;
  const ratio = Number(vb[2]) / Number(vb[1]);
  const h = height ?? Math.round(width * ratio);
  const page = await browser.newPage({ viewport: { width, height: h }, deviceScaleFactor: 1 });
  await page.setContent(
    `<html><body style="margin:0;background:transparent">${svg.replace(/width="[\d.]+" height="[\d.]+"/, `width="${width}" height="${h}"`)}</body></html>`,
  );
  await page.screenshot({ path: out, omitBackground: true, clip: { x: 0, y: 0, width, height: h } });
  await page.close();
}

/** Minimal ICO writer: an ICONDIR with embedded PNG images (supported by all modern browsers). */
function writeIco(pngFiles: { file: string; size: number }[], out: string) {
  const images = pngFiles.map((p) => ({ ...p, data: fs.readFileSync(p.file) }));
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach((img, i) => {
    const o = 6 + i * 16;
    header.writeUInt8(img.size >= 256 ? 0 : img.size, o);
    header.writeUInt8(img.size >= 256 ? 0 : img.size, o + 1);
    header.writeUInt8(0, o + 2);
    header.writeUInt8(0, o + 3);
    header.writeUInt16LE(1, o + 4);
    header.writeUInt16LE(32, o + 6);
    header.writeUInt32LE(img.data.length, o + 8);
    header.writeUInt32LE(offset, o + 12);
    offset += img.data.length;
  });
  fs.writeFileSync(out, Buffer.concat([header, ...images.map((i) => i.data)]));
}

async function social(
  browser: Browser,
  format: "square" | "story" | "og",
  params: Record<string, string>,
  out: string,
) {
  const size = { square: [1080, 1080], story: [1080, 1920], og: [1200, 630] }[format];
  const page = await browser.newPage({ viewport: { width: size[0]!, height: size[1]! } });
  const url = new URL(`file://${path.join(ROOT, "brand/social/template.html")}`);
  url.search = new URLSearchParams({ format, ...params }).toString();
  await page.goto(url.toString());
  await page.waitForSelector("body[data-ready='1']");
  await page.locator("#card").screenshot({ path: out });
  await page.close();
}

async function main() {
  for (const d of [ICONS, PNG, SOCIAL]) fs.mkdirSync(d, { recursive: true });
  const browser = await chromium.launch({ executablePath });
  try {
    const mark = path.join(BRAND, "over-sabi-mark.svg");
    for (const s of [16, 32, 48, 180, 192, 512, 1024])
      await svgToPng(browser, mark, path.join(PNG, `over-sabi-mark-${s}.png`), s);
    fs.copyFileSync(path.join(PNG, "over-sabi-mark-192.png"), path.join(ICONS, "icon-192.png"));
    fs.copyFileSync(path.join(PNG, "over-sabi-mark-512.png"), path.join(ICONS, "icon-512.png"));
    fs.copyFileSync(path.join(PNG, "over-sabi-mark-180.png"), path.join(ICONS, "apple-touch-icon.png"));
    fs.copyFileSync(mark, path.join(ICONS, "icon.svg"));
    await svgToPng(
      browser,
      path.join(BRAND, "over-sabi-icon-maskable.svg"),
      path.join(ICONS, "icon-maskable-512.png"),
      512,
    );
    writeIco(
      [16, 32, 48].map((s) => ({ file: path.join(PNG, `over-sabi-mark-${s}.png`), size: s })),
      path.join(ROOT, "public/favicon.ico"),
    );
    for (const f of fs.readdirSync(BRAND).filter((f) => f.endsWith(".svg") && f !== "over-sabi-mark.svg")) {
      const base = f.replace(".svg", "");
      const w = f.includes("horizontal") ? 1200 : f.includes("stacked") ? 800 : 1024;
      await svgToPng(browser, path.join(BRAND, f), path.join(PNG, `${base}.png`), w);
    }
    await social(
      browser,
      "og",
      {
        kicker: "Your language. Your people. Your voice.",
        phrase: "Ẹ káàárọ̀",
        meaning: "Learn Yoruba, Igbo and Hausa through real conversations.",
      },
      path.join(BRAND, "og-image.png"),
    );
    await social(
      browser,
      "square",
      {
        kicker: "Achievement unlocked",
        phrase: "Well greeted",
        meaning: "Completed the greetings chapter in Yoruba.",
      },
      path.join(SOCIAL, "achievement-square.png"),
    );
    await social(
      browser,
      "square",
      {
        kicker: "Today I learned · Yoruba",
        phrase: "Ẹ káàárọ̀",
        meaning: "Good morning — the respectful way, for elders.",
      },
      path.join(SOCIAL, "phrase-square-yoruba.png"),
    );
    await social(
      browser,
      "story",
      {
        kicker: "Today I learned · Hausa",
        phrase: "Ina kwana?",
        meaning: "Good morning — literally, “how did you sleep?”",
      },
      path.join(SOCIAL, "phrase-story-hausa.png"),
    );
    await social(
      browser,
      "story",
      { kicker: "Today I learned · Igbo", phrase: "Kedu?", meaning: "How are you? — answer “Ọ dị mma.”" },
      path.join(SOCIAL, "phrase-story-igbo.png"),
    );

    // Brand guidelines PDF, printed from the live /brand page.
    try {
      const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
      await page.goto(`${APP_URL}/brand`, { waitUntil: "networkidle", timeout: 30_000 });
      await page.emulateMedia({ media: "print" });
      await page.pdf({
        path: path.join(BRAND, "over-sabi-brand-guidelines.pdf"),
        format: "A4",
        printBackground: true,
        margin: { top: "14mm", bottom: "14mm", left: "10mm", right: "10mm" },
      });
      await page.close();
      console.log("Brand guidelines PDF written.");
    } catch (err) {
      console.warn(
        `Skipped PDF: start the app on ${APP_URL} first (${(err as Error).message.split("\n")[0]}).`,
      );
    }
  } finally {
    await browser.close();
  }
  console.log("Brand assets exported.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
