import { BASE_CSS, C, mark, logo } from "./brand.mjs";

export const SIZES = { portrait: [1080, 1350], square: [1080, 1080], story: [1080, 1920] };

/**
 * One art-directed frame. Every asset in the campaign shares this chrome: a mono meta line top and bottom, the
 * Prohub mark, generous margins. Content is free-form HTML positioned inside.
 */
export function frame({ size = "portrait", tone = "ink", grain = true, m = 76, top, bot, body, css = "", logoTone }) {
  const [w, h] = SIZES[size] ?? size;
  const lt = logoTone ?? (tone === "ink" ? "light" : "dark");
  const topL = top?.[0] ?? `<span style="display:flex;align-items:center;gap:16px">${mark({ h: 34, tone: lt, accent: tone === "orange" ? C.white : C.orange })}<span>Make it obvious</span></span>`;
  const topR = top?.[1] ?? "";
  const botL = bot?.[0] ?? "Prohub Creative Solutions";
  const botR = bot?.[1] ?? "Abuja · Lagos";
  const metaColor = tone === "ink" ? C.mute : tone === "orange" ? C.ink : C.muteDark;
  return {
    w, h,
    html: `<!doctype html><html><head><meta charset="utf-8"><style>${BASE_CSS}
      :root{--w:${w}px;--h:${h}px;--m:${m}px}
      .meta{color:${metaColor}}
      ${css}</style></head><body>
      <div class="art ${tone} ${grain ? "grain" : ""}">
        ${top === false ? "" : `<div class="meta top mono">${topL}<span>${topR}</span></div>`}
        ${body}
        ${bot === false ? "" : `<div class="meta bot mono"><span>${botL}</span><span>${botR}</span></div>`}
      </div></body></html>`,
  };
}

export const lockup = (h = 64, tone = "light") => logo({ h, tone });
export const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
