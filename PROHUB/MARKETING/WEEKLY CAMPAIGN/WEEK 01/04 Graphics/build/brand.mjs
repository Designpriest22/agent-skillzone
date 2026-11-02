// Prohub brand kit for the WEEK 01 campaign — tokens, fonts and logo artwork, all taken from what Prohub already has
// on file (prohub-os/assets). Nothing here is a new identity: colours come from the vectorised logo (#FD8D18 swoosh,
// white monogram/wordmark on dark), type from the font set already used in Prohub's own video and OS work.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REPO = path.resolve(HERE, "../../../../../..");
const ASSETS = path.join(REPO, "prohub-os/assets");

export const C = {
  ink: "#0C0C0D",      // base (logo is designed for dark backgrounds)
  ink2: "#161618",
  line: "#2A2A2D",
  paper: "#F3EFE8",    // warm off-white for rhythm across the grid
  paper2: "#E7E1D7",
  orange: "#FD8D18",   // Prohub swoosh orange (from the logo file)
  white: "#FFFFFF",
  mute: "#8E8B86",
  muteDark: "#5E5C58",
};

const font = (file) => `data:font/woff2;base64,${readFileSync(path.join(ASSETS, "fonts", file)).toString("base64")}`;
export const FONT_CSS = [
  ["Montserrat", 500, "montserrat-latin-500-normal.woff2"],
  ["Montserrat", 700, "montserrat-latin-700-normal.woff2"],
  ["Montserrat", 800, "montserrat-latin-800-normal.woff2"],
  ["Inter", 400, "inter-latin-400-normal.woff2"],
  ["Inter", 500, "inter-latin-500-normal.woff2"],
  ["Inter", 600, "inter-latin-600-normal.woff2"],
  ["Inter", 700, "inter-latin-700-normal.woff2"],
  ["Mono", 400, "jetbrains-mono-latin-400-normal.woff2"],
  ["Mono", 700, "jetbrains-mono-latin-700-normal.woff2"],
  ["Archivo", 400, "archivo-black-latin-400-normal.woff2"],
  ["Anton", 400, "anton-latin-400-normal.woff2"],
].map(([f, w, file]) => `@font-face{font-family:'${f}';font-weight:${w};font-style:normal;src:url(${font(file)}) format('woff2');}`).join("\n");

const logoSrc = readFileSync(path.join(ASSETS, "brand/prohub/prohub-logo.svg"), "utf8");
const pathD = (id) => logoSrc.match(new RegExp(`id="${id}"[^>]*d="([^"]+)"`))[1];
const MARK = pathD("mark"), SWOOSH = pathD("swoosh"), WORD = pathD("wordmark");

/** Full lock-up. tone: "light" = white artwork for dark grounds (master), "dark" = ink artwork for paper grounds. */
export function logo({ h = 60, tone = "light", accent = C.orange } = {}) {
  const fg = tone === "light" ? C.white : C.ink;
  return `<svg class="logo" style="height:${h}px;width:auto;display:block" viewBox="0 0 2775 1217" xmlns="http://www.w3.org/2000/svg"><g transform="translate(-112,-105)" fill-rule="evenodd"><path fill="${fg}" d="${MARK}"/><path fill="${accent}" d="${SWOOSH}"/><path fill="${fg}" d="${WORD}"/></g></svg>`;
}
export function mark({ h = 60, tone = "light", accent = C.orange } = {}) {
  const fg = tone === "light" ? C.white : C.ink;
  return `<svg class="mark" style="height:${h}px;width:auto;display:block" viewBox="0 0 793 1217" xmlns="http://www.w3.org/2000/svg"><g transform="translate(-112,-105)" fill-rule="evenodd"><path fill="${fg}" d="${MARK}"/><path fill="${accent}" d="${SWOOSH}"/></g></svg>`;
}
/** The orange swoosh on its own — Prohub's own gesture, used across the campaign as the mark of emphasis. */
export function swoosh({ w = 300, color = C.orange, style = "" } = {}) {
  return `<svg class="swoosh" style="width:${w}px;height:auto;display:block;${style}" viewBox="293 552 486 404" xmlns="http://www.w3.org/2000/svg"><path fill="${color}" d="${SWOOSH}"/></svg>`;
}

/** Naira sign drawn in the headline face (the webfont subsets carry no ₦ glyph). */
export const naira = (bar = "0.075em") => `<span class="naira" style="position:relative;display:inline-block">N<i style="position:absolute;left:-0.06em;right:-0.06em;top:38%;height:${bar};background:currentColor"></i><i style="position:absolute;left:-0.06em;right:-0.06em;top:56%;height:${bar};background:currentColor"></i></span>`;

export const BASE_CSS = `
${FONT_CSS}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:100%;height:100%}
body{font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision;overflow:hidden}
.art{position:relative;overflow:hidden;width:var(--w);height:var(--h)}
.ink{background:${C.ink};color:${C.white}}
.paper{background:${C.paper};color:${C.ink}}
.orange{background:${C.orange};color:${C.ink}}
.h{font-family:'Montserrat';font-weight:800;letter-spacing:-0.045em;line-height:0.95}
.h7{font-family:'Montserrat';font-weight:700;letter-spacing:-0.03em;line-height:1.05}
.b{font-family:'Inter';font-weight:500;letter-spacing:-0.012em;line-height:1.32}
.mono{font-family:'Mono';font-weight:400;letter-spacing:0.08em;text-transform:uppercase}
.o{color:${C.orange}}
.mu{color:${C.mute}}
.grain:after{content:"";position:absolute;inset:0;pointer-events:none;opacity:.07;mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")}
.meta{position:absolute;left:var(--m);right:var(--m);display:flex;justify-content:space-between;align-items:center;font-size:21px;z-index:5}
.meta.top{top:calc(var(--m) * .8)}
.meta.bot{bottom:calc(var(--m) * .8)}
.rule{height:2px;background:currentColor;opacity:.18}
`;
