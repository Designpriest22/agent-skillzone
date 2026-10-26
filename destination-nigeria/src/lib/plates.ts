/**
 * Illustration plates.
 *
 * Deterministic, original landscape illustrations drawn in the visual language
 * of the Destination Nigeria logo: layered ridge lines and a single gold sun.
 * They stand in for photography until licensed, location-verified images are
 * supplied (see docs/ASSETS.md). They depict landscape *types*, never a specific
 * named place, so they cannot misrepresent a destination.
 *
 * Every plate is rendered as layers so the hero can move them independently.
 */
import type { Plate, SceneKind, TimeOfDay } from "@/content/schema";

export const W = 1600;
export const H = 1000;

type Palette = {
  skyTop: string;
  skyMid: string;
  skyLow: string;
  sun: string;
  sunY: number;
  sunR: number;
  haze: string;
  far: string;
  near: string;
  water: string;
  waterDeep: string;
  light: string;
  ground: string;
  lit: boolean;
};

const palettes: Record<TimeOfDay, Palette> = {
  dawn: {
    skyTop: "#22344a", skyMid: "#b98472", skyLow: "#f1c48d", sun: "#e8a432", sunY: 0.5, sunR: 70,
    haze: "#f5d9b0", far: "#a3a596", near: "#103428", water: "#7d97a0", waterDeep: "#2b4c55", light: "#fbe6c2", ground: "#8a7a52", lit: false,
  },
  day: {
    skyTop: "#6f9fae", skyMid: "#c4dad6", skyLow: "#f3eee0", sun: "#e8a432", sunY: 0.2, sunR: 48,
    haze: "#eef0e4", far: "#a6b9a5", near: "#1b4632", water: "#5f8f99", waterDeep: "#24515a", light: "#fffaf0", ground: "#b39a63", lit: false,
  },
  dusk: {
    skyTop: "#232f55", skyMid: "#a95a48", skyLow: "#efae58", sun: "#e8a432", sunY: 0.56, sunR: 84,
    haze: "#e9a66c", far: "#6c5b6a", near: "#0c2219", water: "#8a6a72", waterDeep: "#2a2a44", light: "#ffd79a", ground: "#5d4433", lit: true,
  },
  night: {
    skyTop: "#06110e", skyMid: "#10292a", skyLow: "#28463f", sun: "#f2e3bd", sunY: 0.18, sunR: 26,
    haze: "#2f4f47", far: "#1f3b37", near: "#050f0c", water: "#1b3a3d", waterDeep: "#081816", light: "#ffd27a", ground: "#14231e", lit: true,
  },
};

// ——— utilities ———

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
type Rand = ReturnType<typeof rng>;

const f = (n: number) => (Math.round(n * 10) / 10).toString();

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
}
export function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const c = (x: number, y: number) => Math.round(x + (y - x) * t).toString(16).padStart(2, "0");
  return `#${c(r1, r2)}${c(g1, g2)}${c(b1, b2)}`;
}

/** Catmull-Rom spline through points, as cubic Béziers. */
function smooth(points: [number, number][]): string {
  if (points.length < 2) return "";
  let d = `M${f(points[0]![0])},${f(points[0]![1])}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${f(c1x)},${f(c1y)} ${f(c2x)},${f(c2y)} ${f(p2[0])},${f(p2[1])}`;
  }
  return d;
}

/** A ridge line: sum of sines with random phase, plus jitter, closed to the bottom. */
function ridge(r: Rand, base: number, amp: number, opts: { step?: number; freq?: number; jag?: number } = {}): string {
  const step = opts.step ?? 40;
  const freq = opts.freq ?? 1;
  const jag = opts.jag ?? 0.12;
  const p1 = r() * Math.PI * 2;
  const p2 = r() * Math.PI * 2;
  const p3 = r() * Math.PI * 2;
  const pts: [number, number][] = [];
  for (let x = -80; x <= W + 80; x += step) {
    const u = x / W;
    const y =
      base -
      amp *
        (0.55 * Math.sin(u * Math.PI * 2 * freq + p1) +
          0.3 * Math.sin(u * Math.PI * 5.3 * freq + p2) +
          0.15 * Math.sin(u * Math.PI * 11.7 * freq + p3)) -
      amp * jag * (r() - 0.5);
    pts.push([x, y]);
  }
  return `${smooth(pts)}L${W + 80},${H + 20}L-80,${H + 20}Z`;
}

function linear(id: string, stops: [number, string, number?][], vertical = true): string {
  const s = stops.map(([o, c, op]) => `<stop offset="${o}" stop-color="${c}"${op !== undefined ? ` stop-opacity="${op}"` : ""}/>`).join("");
  return `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 0}">${s}</linearGradient>`;
}

function radial(id: string, stops: [number, string, number?][]): string {
  const s = stops.map(([o, c, op]) => `<stop offset="${o}" stop-color="${c}"${op !== undefined ? ` stop-opacity="${op}"` : ""}/>`).join("");
  return `<radialGradient id="${id}">${s}</radialGradient>`;
}

type Ctx = { r: Rand; p: Palette; id: string; defs: string[]; tod: TimeOfDay };

function sky(c: Ctx, sunX = 0.68): string {
  const { p, id } = c;
  c.defs.push(linear(`${id}-sky`, [[0, p.skyTop], [0.55, p.skyMid], [1, p.skyLow]]));
  c.defs.push(radial(`${id}-glow`, [[0, p.sun, 0.55], [0.35, p.sun, 0.18], [1, p.sun, 0]]));
  const sx = W * sunX;
  const sy = H * p.sunY;
  let stars = "";
  if (c.tod === "night") {
    for (let i = 0; i < 70; i++) {
      stars += `<circle cx="${f(c.r() * W)}" cy="${f(c.r() * H * 0.5)}" r="${f(0.6 + c.r() * 1.3)}" fill="#f6efd9" opacity="${f(0.25 + c.r() * 0.6)}"/>`;
    }
  }
  return (
    `<rect width="${W}" height="${H}" fill="url(#${id}-sky)"/>` +
    stars +
    `<circle cx="${f(sx)}" cy="${f(sy)}" r="${f(p.sunR * 5)}" fill="url(#${id}-glow)"/>` +
    `<circle class="plate-sun" cx="${f(sx)}" cy="${f(sy)}" r="${p.sunR}" fill="${p.sun}"/>`
  );
}

function haze(c: Ctx, y: number, h: number, op = 0.55): string {
  const gid = `${c.id}-haze${Math.round(y)}`;
  c.defs.push(linear(gid, [[0, c.p.haze, 0], [0.5, c.p.haze, op], [1, c.p.haze, 0]]));
  return `<rect x="0" y="${f(y)}" width="${W}" height="${f(h)}" fill="url(#${gid})"/>`;
}

function layerColor(c: Ctx, t: number) {
  return mix(c.p.far, c.p.near, t);
}

/** Cluster of circles forming a canopy blob along a line. */
function canopy(c: Ctx, x0: number, x1: number, y: number, size: number, color: string, density = 1): string {
  let s = "";
  const n = Math.max(3, Math.round(((x1 - x0) / size) * 1.6 * density));
  for (let i = 0; i < n; i++) {
    const x = x0 + ((x1 - x0) * i) / (n - 1) + (c.r() - 0.5) * size * 0.6;
    const rr = size * (0.55 + c.r() * 0.6);
    s += `<circle cx="${f(x)}" cy="${f(y - rr * 0.4 + (c.r() - 0.5) * size * 0.5)}" r="${f(rr)}"/>`;
  }
  return `<g fill="${color}">${s}<rect x="${f(x0 - size)}" y="${f(y)}" width="${f(x1 - x0 + size * 2)}" height="${f(H - y + 20)}"/></g>`;
}

function acacia(x: number, base: number, h: number, color: string, r: Rand): string {
  const w = h * (1.1 + r() * 0.5);
  const top = base - h;
  const lean = (r() - 0.5) * h * 0.25;
  return (
    `<g fill="${color}" stroke="${color}">` +
    `<path d="M${f(x)},${f(base)} L${f(x + lean)},${f(top + h * 0.15)}" stroke-width="${f(h * 0.06)}" fill="none" stroke-linecap="round"/>` +
    `<path d="M${f(x + lean)},${f(top + h * 0.3)} L${f(x + lean - w * 0.22)},${f(top + h * 0.12)} M${f(x + lean)},${f(top + h * 0.3)} L${f(x + lean + w * 0.25)},${f(top + h * 0.1)}" stroke-width="${f(h * 0.03)}" fill="none" stroke-linecap="round"/>` +
    `<ellipse cx="${f(x + lean)}" cy="${f(top + h * 0.08)}" rx="${f(w / 2)}" ry="${f(h * 0.11)}" stroke="none"/>` +
    `<ellipse cx="${f(x + lean - w * 0.18)}" cy="${f(top + h * 0.14)}" rx="${f(w * 0.24)}" ry="${f(h * 0.07)}" stroke="none"/>` +
    `</g>`
  );
}

function palm(x: number, base: number, h: number, color: string, r: Rand, dir = 1): string {
  const bend = h * (0.18 + r() * 0.15) * dir;
  const tx = x + bend;
  const ty = base - h;
  let fronds = "";
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI / 2 + (i - 4) * 0.42 + (r() - 0.5) * 0.2;
    const len = h * (0.3 + r() * 0.12);
    const ex = tx + Math.cos(a) * len * 1.3;
    const ey = ty + Math.sin(a) * len * 0.5 + len * 0.45;
    const mx = tx + Math.cos(a) * len * 0.7;
    const my = ty + Math.sin(a) * len * 0.6 - len * 0.05;
    fronds += `<path d="M${f(tx)},${f(ty)} Q${f(mx)},${f(my)} ${f(ex)},${f(ey)}" stroke-width="${f(h * 0.025)}"/>`;
  }
  return (
    `<g stroke="${color}" fill="none" stroke-linecap="round">` +
    `<path d="M${f(x)},${f(base)} Q${f(x + bend * 0.2)},${f(base - h * 0.55)} ${f(tx)},${f(ty)}" stroke-width="${f(h * 0.035)}"/>` +
    fronds +
    `</g>`
  );
}

function dome(c: Ctx, cx: number, base: number, w: number, h: number, i: number): string {
  const { p, id } = c;
  const gid = `${id}-dome${i}`;
  const rock = c.tod === "night" ? "#1f2a27" : c.tod === "dusk" ? "#4f4048" : c.tod === "dawn" ? "#7c6e66" : "#8d8a80";
  const litSide = mix(rock, p.light, c.tod === "night" ? 0.12 : 0.45);
  c.defs.push(`<linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="0.3"><stop offset="0" stop-color="${litSide}"/><stop offset="0.55" stop-color="${rock}"/><stop offset="1" stop-color="${mix(rock, p.near, 0.6)}"/></linearGradient>`);
  const top = base - h;
  // Asymmetric monolith: a steep near-vertical face on one side, a long sloping back on the other.
  const flip = c.r() > 0.5 ? 1 : -1;
  const X = (u: number) => cx + flip * (u - 0.5) * w;
  const pk = 0.32 + c.r() * 0.1;
  const d =
    `M${f(X(0))},${f(base)} ` +
    `C${f(X(0.02))},${f(base - h * 0.62)} ${f(X(0.1))},${f(top + h * 0.06)} ${f(X(pk))},${f(top)} ` +
    `C${f(X(pk + 0.16))},${f(top - h * 0.01)} ${f(X(0.66))},${f(top + h * 0.12)} ${f(X(0.8))},${f(top + h * 0.38)} ` +
    `C${f(X(0.88))},${f(top + h * 0.52)} ${f(X(0.92))},${f(base - h * 0.22)} ${f(X(1))},${f(base)} Z`;
  let streaks = "";
  for (let k = 0; k < 14; k++) {
    const u = 0.06 + c.r() * 0.8;
    const sx = X(u);
    const sTop = top + h * (0.04 + Math.pow(Math.abs(u - pk) * 1.6, 2) * 0.55 + c.r() * 0.08);
    const len = 0.45 + c.r() * 0.55;
    const ey = sTop + (base - sTop) * len;
    const drift = flip * (u - pk) * w * 0.1;
    streaks += `<path d="M${f(sx)},${f(sTop)} Q${f(sx + drift * 0.5 + (c.r() - 0.5) * 10)},${f((sTop + ey) / 2)} ${f(sx + drift)},${f(ey)}" stroke="${mix(rock, p.near, 0.55)}" stroke-width="${f(1.5 + c.r() * 6)}" opacity="${f(0.12 + c.r() * 0.22)}" fill="none" stroke-linecap="round"/>`;
  }
  // shadowed flank
  const sh = `M${f(X(0.62))},${f(top + h * 0.1)} C${f(X(0.78))},${f(top + h * 0.3)} ${f(X(0.9))},${f(base - h * 0.25)} ${f(X(1))},${f(base)} L${f(X(0.7))},${f(base)} C${f(X(0.72))},${f(base - h * 0.4)} ${f(X(0.66))},${f(top + h * 0.35)} ${f(X(0.62))},${f(top + h * 0.1)} Z`;
  return `<g><path d="${d}" fill="url(#${gid})"/><path d="${sh}" fill="${p.near}" opacity="0.22"/>${streaks}</g>`;
}

// ——— scenes ———

type Layers = string[];

function sceneHighland(c: Ctx): Layers {
  const L: Layers = [sky(c, 0.3 + c.r() * 0.4)];
  const n = 5;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const base = H * (0.5 + t * 0.32);
    const amp = H * (0.07 + t * 0.05);
    L.push(`<path d="${ridge(c.r, base, amp, { freq: 0.8 + c.r() * 0.6 })}" fill="${layerColor(c, t)}"/>` + (i < n - 1 ? haze(c, base - amp * 0.2, amp * 1.6, 0.5 - t * 0.3) : ""));
  }
  return L;
}

function sceneInselberg(c: Ctx): Layers {
  const L: Layers = [sky(c, 0.78)];
  L.push(`<path d="${ridge(c.r, H * 0.7, H * 0.03)}" fill="${layerColor(c, 0.15)}"/>` + haze(c, H * 0.62, H * 0.14, 0.45));
  const count = 1 + Math.floor(c.r() * 2);
  let domes = "";
  for (let i = 0; i < count; i++) {
    const w = W * (i === 0 ? 0.42 : 0.2 + c.r() * 0.1);
    const h = H * (i === 0 ? 0.42 : 0.22 + c.r() * 0.08);
    const cx = i === 0 ? W * (0.38 + c.r() * 0.12) : W * (0.12 + c.r() * 0.15) + (c.r() > 0.5 ? W * 0.6 : 0);
    domes = (i === 0 ? "" : domes) + dome(c, cx, H * 0.8, w, h, i) + (i === 0 ? domes : "");
  }
  L.push(domes);
  L.push(`<path d="${ridge(c.r, H * 0.84, H * 0.02, { step: 30 })}" fill="${layerColor(c, 0.75)}"/>`);
  let trees = "";
  for (let i = 0; i < 4; i++) trees += acacia(W * (0.05 + c.r() * 0.9), H * 0.88, H * (0.1 + c.r() * 0.08), c.p.near, c.r);
  L.push(`<path d="${ridge(c.r, H * 0.9, H * 0.015, { step: 30 })}" fill="${c.p.near}"/>` + trees);
  return L;
}

function sceneWaterfall(c: Ctx): Layers {
  const { p, id } = c;
  const T = H * 0.42; // lip of the falls
  const B = H * 0.84; // plunge pool
  const L: Layers = [sky(c, 0.5)];
  L.push(`<path d="${ridge(c.r, H * 0.4, H * 0.07)}" fill="${layerColor(c, 0.15)}"/>` + haze(c, H * 0.32, H * 0.14, 0.5));
  L.push(`<path d="${ridge(c.r, H * 0.48, H * 0.05)}" fill="${layerColor(c, 0.35)}"/>`);
  const stone = c.tod === "night" ? "#1d2a26" : c.tod === "dusk" ? "#4a3d44" : "#6b675a";
  const wall = mix(layerColor(c, 0.55), stone, 0.6);
  c.defs.push(linear(`${id}-wall`, [[0, mix(wall, p.light, 0.2)], [1, mix(wall, p.near, 0.55)]]));
  let strata = "";
  for (let i = 0; i < 7; i++) {
    const y = T + H * (0.04 + i * 0.055 + c.r() * 0.02);
    strata += `<path d="M${f(W * 0.32)},${f(y)} q${f(W * 0.09)},${f((c.r() - 0.5) * 14)} ${f(W * 0.18)},0 t${f(W * 0.18)},0" stroke="${mix(wall, p.near, 0.6)}" stroke-width="${f(2 + c.r() * 3)}" opacity="0.45" fill="none"/>`;
  }
  L.push(`<rect x="${f(W * 0.3)}" y="${f(T)}" width="${f(W * 0.4)}" height="${f(B - T + 20)}" fill="url(#${id}-wall)"/>` + strata);
  // the falls: a slightly widening sheet of pale water
  const waterHi = c.tod === "night" ? "#c9d6d3" : "#f4f7f2";
  const waterLo = mix(waterHi, p.water, 0.35);
  c.defs.push(linear(`${id}-fall`, [[0, waterLo], [0.25, waterHi], [0.8, mix(waterHi, p.water, 0.2)], [1, waterHi]]));
  const fx = W * (0.47 + (c.r() - 0.5) * 0.04);
  const fw = W * (0.07 + c.r() * 0.03);
  let streaks = "";
  for (let i = 0; i < 16; i++) {
    const u = c.r();
    const sx = fx + u * fw;
    streaks += `<path class="plate-stream" d="M${f(sx)},${f(T)} L${f(sx + (u - 0.5) * 30)},${f(B - 10)}" stroke="#ffffff" stroke-width="${f(1.2 + c.r() * 3)}" opacity="${f(0.25 + c.r() * 0.5)}"/>`;
  }
  c.defs.push(radial(`${id}-mist`, [[0, "#ffffff", c.tod === "night" ? 0.35 : 0.8], [1, "#ffffff", 0]]));
  L.push(
    `<path d="M${f(fx)},${f(T)} L${f(fx + fw)},${f(T)} L${f(fx + fw + 18)},${f(B)} L${f(fx - 18)},${f(B)} Z" fill="url(#${id}-fall)"/>` + streaks +
      `<ellipse cx="${f(fx + fw / 2)}" cy="${f(B + 14)}" rx="${f(W * 0.22)}" ry="${f(H * 0.05)}" fill="${mix(p.water, waterHi, 0.25)}"/>` +
      `<ellipse cx="${f(fx + fw / 2)}" cy="${f(B - 6)}" rx="${f(W * 0.16)}" ry="${f(H * 0.09)}" fill="url(#${id}-mist)"/>`,
  );
  // flanking cliffs, crowned and stippled with forest
  const cliffC = mix(layerColor(c, 0.75), stone, 0.4);
  c.defs.push(linear(`${id}-cliff`, [[0, mix(cliffC, p.light, 0.14)], [0.55, cliffC], [1, mix(cliffC, p.near, 0.75)]]));
  const left = `M-40,${H} L-40,${f(T - H * 0.04)} C${f(W * 0.14)},${f(T - H * 0.06)} ${f(W * 0.32)},${f(T - H * 0.01)} ${f(fx - 4)},${f(T)} L${f(fx - 26)},${f(B)} C${f(W * 0.3)},${f(H * 0.92)} ${f(W * 0.12)},${f(H * 0.94)} 0,${H} Z`;
  const right = `M${W + 40},${H} L${W + 40},${f(T - H * 0.07)} C${f(W * 0.86)},${f(T - H * 0.05)} ${f(W * 0.66)},${f(T - H * 0.01)} ${f(fx + fw + 4)},${f(T)} L${f(fx + fw + 30)},${f(B)} C${f(W * 0.7)},${f(H * 0.93)} ${f(W * 0.88)},${f(H * 0.94)} ${W},${H} Z`;
  const shrubC = mix(cliffC, p.near, 0.55);
  let shrubs = "";
  for (let i = 0; i < 26; i++) {
    const onLeft = i % 2 === 0;
    const sx = onLeft ? c.r() * (fx - 80) : fx + fw + 80 + c.r() * (W - fx - fw - 80);
    const sy = T + H * 0.04 + c.r() * (B - T);
    shrubs += canopy(c, sx - 30, sx + 30, sy, 9 + c.r() * 8, shrubC, 0.8).replace(/<rect[^>]*\/>/, "");
  }
  L.push(
    `<path d="${left}" fill="url(#${id}-cliff)"/><path d="${right}" fill="url(#${id}-cliff)"/>` + shrubs +
      canopy(c, -60, fx - 30, T - H * 0.03, 36, mix(cliffC, p.near, 0.6)).replace(/<rect[^>]*\/>/, "") +
      canopy(c, fx + fw + 30, W + 60, T - H * 0.05, 36, mix(cliffC, p.near, 0.6)).replace(/<rect[^>]*\/>/, ""),
  );
  L.push(canopy(c, -60, W * 0.2, H * 0.93, 46, p.near) + canopy(c, W * 0.8, W + 60, H * 0.93, 46, p.near));
  return L;
}

function sceneSavanna(c: Ctx): Layers {
  const { p, id } = c;
  const L: Layers = [sky(c, 0.62)];
  L.push(`<path d="${ridge(c.r, H * 0.66, H * 0.025)}" fill="${layerColor(c, 0.2)}"/>` + haze(c, H * 0.6, H * 0.12, 0.5));
  c.defs.push(linear(`${id}-grass`, [[0, mix(p.ground, p.haze, 0.35)], [1, mix(p.ground, p.near, 0.55)]]));
  L.push(`<rect x="0" y="${f(H * 0.7)}" width="${W}" height="${f(H * 0.3)}" fill="url(#${id}-grass)"/>`);
  let trees = "";
  const n = 4 + Math.floor(c.r() * 3);
  for (let i = 0; i < n; i++) {
    const depth = c.r();
    trees += acacia(W * (0.04 + c.r() * 0.92), H * (0.71 + depth * 0.05), H * (0.06 + depth * 0.1), mix(p.far, p.near, 0.5 + depth * 0.5), c.r);
  }
  L.push(trees);
  let fg = acacia(W * (c.r() > 0.5 ? 0.82 : 0.16), H * 0.95, H * 0.42, p.near, c.r);
  fg += `<path d="${ridge(c.r, H * 0.93, H * 0.012, { step: 24 })}" fill="${p.near}"/>`;
  L.push(fg);
  return L;
}

function sceneCoast(c: Ctx): Layers {
  const { p, id } = c;
  const sunX = 0.6;
  const L: Layers = [sky(c, sunX)];
  const horizon = H * 0.6;
  c.defs.push(linear(`${id}-sea`, [[0, mix(p.water, p.skyLow, 0.35)], [1, p.waterDeep]]));
  let glints = "";
  for (let i = 0; i < 46; i++) {
    const y = horizon + 6 + Math.pow(c.r(), 1.6) * H * 0.34;
    const spread = 20 + (y - horizon) * 0.5;
    const x = W * sunX + (c.r() - 0.5) * spread * 2;
    glints += `<rect x="${f(x)}" y="${f(y)}" width="${f(10 + c.r() * 40)}" height="2" fill="${p.sun}" opacity="${f(0.25 + c.r() * 0.5)}"/>`;
  }
  let waves = "";
  for (let i = 0; i < 18; i++) {
    const y = horizon + 10 + i * i * 1.15;
    waves += `<path d="M0,${f(y)} Q${f(W * 0.25)},${f(y - 3)} ${f(W * 0.5)},${f(y)} T${W},${f(y)}" stroke="${p.light}" stroke-width="${f(0.8 + i * 0.08)}" opacity="${f(0.12)}" fill="none"/>`;
  }
  L.push(`<rect x="0" y="${f(horizon)}" width="${W}" height="${f(H - horizon)}" fill="url(#${id}-sea)"/>` + waves + glints);
  const sand = mix(p.ground, p.light, 0.45);
  L.push(`<path d="M-20,${H} L-20,${f(H * 0.8)} C${f(W * 0.25)},${f(H * 0.76)} ${f(W * 0.55)},${f(H * 0.86)} ${f(W + 20)},${f(H * 0.84)} L${W + 20},${H} Z" fill="${sand}"/>` +
    `<path d="M-20,${f(H * 0.8)} C${f(W * 0.25)},${f(H * 0.76)} ${f(W * 0.55)},${f(H * 0.86)} ${f(W + 20)},${f(H * 0.84)}" stroke="${p.light}" stroke-width="3" opacity="0.6" fill="none"/>`);
  let palms = "";
  for (let i = 0; i < 3; i++) palms += palm(W * (0.04 + i * 0.09 + c.r() * 0.03), H * 0.96, H * (0.5 + c.r() * 0.2), p.near, c.r, 1);
  palms += palm(W * 0.93, H * 0.98, H * 0.46, p.near, c.r, -1);
  L.push(palms);
  return L;
}

function sceneLake(c: Ctx): Layers {
  const { p, id } = c;
  const L: Layers = [sky(c, 0.35)];
  const horizon = H * 0.6;
  const ridgeD = ridge(c.r, horizon, H * 0.06);
  L.push(`<path d="${ridgeD}" fill="${layerColor(c, 0.35)}"/>` + haze(c, horizon - H * 0.08, H * 0.14, 0.4));
  c.defs.push(linear(`${id}-lake`, [[0, mix(p.water, p.skyLow, 0.5)], [1, p.waterDeep]]));
  L.push(
    `<rect x="0" y="${f(horizon)}" width="${W}" height="${f(H - horizon)}" fill="url(#${id}-lake)"/>` +
      `<g transform="translate(0 ${f(horizon * 2)}) scale(1 -1)" opacity="0.28"><path d="${ridgeD}" fill="${layerColor(c, 0.5)}"/></g>` +
      `<rect x="0" y="${f(horizon)}" width="${W}" height="3" fill="${p.light}" opacity="0.35"/>`,
  );
  // canoe with paddler
  const cx = W * (0.45 + c.r() * 0.2);
  const cy = H * 0.74;
  L.push(
    `<g fill="${p.near}"><path d="M${f(cx - 120)},${f(cy)} Q${f(cx)},${f(cy + 26)} ${f(cx + 120)},${f(cy)} Q${f(cx)},${f(cy + 10)} ${f(cx - 120)},${f(cy)} Z"/>` +
      `<circle cx="${f(cx + 10)}" cy="${f(cy - 52)}" r="10"/><path d="M${f(cx)},${f(cy - 42)} L${f(cx + 22)},${f(cy - 42)} L${f(cx + 18)},${f(cy + 4)} L${f(cx + 2)},${f(cy + 4)} Z"/>` +
      `<path d="M${f(cx + 40)},${f(cy - 70)} L${f(cx - 30)},${f(cy + 34)}" stroke="${p.near}" stroke-width="4"/></g>` +
      `<path d="M${f(cx - 160)},${f(cy + 18)} L${f(cx + 160)},${f(cy + 18)}" stroke="${p.light}" opacity="0.25" stroke-width="2"/>`,
  );
  let reeds = "";
  for (let i = 0; i < 60; i++) {
    const x = (c.r() < 0.5 ? c.r() * W * 0.22 : W - c.r() * W * 0.22);
    const h = H * (0.08 + c.r() * 0.14);
    reeds += `<path d="M${f(x)},${H} q${f((c.r() - 0.5) * 30)},${f(-h * 0.6)} ${f((c.r() - 0.5) * 40)},${f(-h)}" stroke="${p.near}" stroke-width="${f(2 + c.r() * 3)}" fill="none"/>`;
  }
  L.push(reeds);
  return L;
}

function sceneCity(c: Ctx): Layers {
  const { p, id } = c;
  const L: Layers = [sky(c, 0.22)];
  const waterline = H * 0.76;
  // distant skyline
  let far = "";
  let x = -20;
  while (x < W + 20) {
    const w = 30 + c.r() * 60;
    const h = H * (0.08 + c.r() * 0.12);
    far += `<rect x="${f(x)}" y="${f(waterline - h)}" width="${f(w)}" height="${f(h)}"/>`;
    x += w + c.r() * 8;
  }
  L.push(`<g fill="${layerColor(c, 0.35)}">${far}</g>` + haze(c, waterline - H * 0.12, H * 0.16, 0.35));
  // main towers
  let near = "";
  let lights = "";
  x = W * 0.12;
  const facade = c.tod === "day" ? mix(p.near, p.skyMid, 0.35) : layerColor(c, 0.85);
  c.defs.push(linear(`${id}-glass`, [[0, mix(facade, p.light, 0.25)], [1, facade]], false));
  while (x < W * 0.9) {
    const w = 50 + c.r() * 90;
    const h = H * (0.16 + Math.pow(c.r(), 1.5) * 0.36);
    const top = waterline - h;
    near += `<rect x="${f(x)}" y="${f(top)}" width="${f(w)}" height="${f(h)}" fill="url(#${id}-glass)"/>`;
    if (c.r() > 0.6) near += `<rect x="${f(x + w * 0.3)}" y="${f(top - 20)}" width="${f(w * 0.4)}" height="20" fill="${facade}"/>`;
    if (c.r() > 0.75) near += `<rect x="${f(x + w * 0.48)}" y="${f(top - 60)}" width="3" height="40" fill="${facade}"/>`;
    // window lights
    const cols = Math.max(2, Math.floor(w / 14));
    const rows = Math.floor(h / 16);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (c.r() < (p.lit ? 0.28 : 0.07)) {
          const lx = x + 5 + col * ((w - 10) / cols);
          const ly = top + 8 + row * 16;
          lights += `<rect x="${f(lx)}" y="${f(ly)}" width="6" height="8"/>`;
        }
      }
    }
    x += w + 6 + c.r() * 24;
  }
  L.push(near + `<g fill="${p.lit ? p.light : "#ffffff"}" opacity="${p.lit ? 0.85 : 0.35}">${lights}</g>`);
  // water, bridge, reflections
  c.defs.push(linear(`${id}-lagoon`, [[0, mix(p.water, p.skyLow, 0.3)], [1, p.waterDeep]]));
  let refl = "";
  if (p.lit) {
    for (let i = 0; i < 90; i++) {
      refl += `<rect x="${f(W * 0.1 + c.r() * W * 0.8)}" y="${f(waterline + 6 + c.r() * H * 0.18)}" width="${f(2 + c.r() * 3)}" height="${f(4 + c.r() * 16)}" fill="${p.light}" opacity="${f(0.2 + c.r() * 0.45)}"/>`;
    }
  }
  const deckY = waterline + H * 0.07;
  let piers = "";
  for (let px = -20; px < W + 40; px += 90) piers += `<rect x="${px}" y="${f(deckY)}" width="7" height="${f(H - deckY)}"/>`;
  L.push(
    `<rect x="0" y="${f(waterline)}" width="${W}" height="${f(H - waterline)}" fill="url(#${id}-lagoon)"/>` + refl +
      `<g fill="${p.near}"><rect x="-20" y="${f(deckY - 10)}" width="${W + 40}" height="12"/>${piers}</g>` +
      (p.lit ? `<g fill="${p.light}">${Array.from({ length: 30 }, (_, i) => `<circle cx="${f(i * 56 + 10)}" cy="${f(deckY - 16)}" r="2.2"/>`).join("")}</g>` : ""),
  );
  return L;
}

function sceneEarthen(c: Ctx): Layers {
  const { p, id } = c;
  const L: Layers = [sky(c, 0.75)];
  const earth = c.tod === "dusk" ? "#a3532f" : c.tod === "night" ? "#3a2a22" : "#c48a52";
  const lit = mix(earth, p.light, 0.3);
  const shade = mix(earth, p.near, 0.35);
  L.push(`<path d="${ridge(c.r, H * 0.62, H * 0.03)}" fill="${layerColor(c, 0.2)}"/>` + haze(c, H * 0.56, H * 0.12, 0.4));
  c.defs.push(linear(`${id}-wall`, [[0, lit], [1, earth]]));
  let bld = "";
  let x = -30;
  while (x < W + 30) {
    const w = 140 + c.r() * 200;
    const h = H * (0.18 + c.r() * 0.16);
    const base = H * 0.86;
    const top = base - h;
    const hornH = 26 + c.r() * 18;
    // parapet with zanko-style corner pinnacles
    bld += `<path d="M${f(x)},${f(base)} L${f(x)},${f(top)} Q${f(x + 2)},${f(top - hornH)} ${f(x + 16)},${f(top - hornH - 6)} Q${f(x + 14)},${f(top - 8)} ${f(x + 30)},${f(top)} L${f(x + w - 30)},${f(top)} Q${f(x + w - 14)},${f(top - 8)} ${f(x + w - 16)},${f(top - hornH - 6)} Q${f(x + w - 2)},${f(top - hornH)} ${f(x + w)},${f(top)} L${f(x + w)},${f(base)} Z" fill="url(#${id}-wall)"/>`;
    // arched doorway
    const dw = 34 + c.r() * 20;
    const dx = x + w * (0.3 + c.r() * 0.4);
    bld += `<path d="M${f(dx)},${f(base)} L${f(dx)},${f(base - 60)} Q${f(dx + dw / 2)},${f(base - 100)} ${f(dx + dw)},${f(base - 60)} L${f(dx + dw)},${f(base)} Z" fill="${shade}"/>`;
    // relief ornament
    const oy = top + h * 0.25;
    bld += `<g stroke="${lit}" stroke-width="3" fill="none" opacity="0.85">`;
    bld += `<path d="M${f(x + 30)},${f(oy)} ${Array.from({ length: Math.floor((w - 60) / 24) }, (_, j) => `L${f(x + 42 + j * 24)},${f(oy + (j % 2 ? -12 : 12))}`).join(" ")}"/>`;
    bld += `<circle cx="${f(x + w / 2)}" cy="${f(oy + 40)}" r="${f(14 + c.r() * 8)}"/><circle cx="${f(x + w / 2)}" cy="${f(oy + 40)}" r="5"/>`;
    bld += `</g>`;
    if (c.r() > 0.5) bld += `<rect x="${f(x + w * 0.15)}" y="${f(top + h * 0.45)}" width="16" height="16" rx="8" fill="${shade}"/>`;
    x += w + 10 + c.r() * 40;
  }
  L.push(bld);
  L.push(`<rect x="0" y="${f(H * 0.86)}" width="${W}" height="${f(H * 0.14)}" fill="${mix(earth, p.near, 0.2)}"/>` + acacia(W * (c.r() > 0.5 ? 0.9 : 0.08), H * 0.98, H * 0.44, p.near, c.r));
  return L;
}

function sceneTerraces(c: Ctx): Layers {
  const { p } = c;
  const L: Layers = [sky(c, 0.82)];
  L.push(`<path d="${ridge(c.r, H * 0.44, H * 0.08)}" fill="${layerColor(c, 0.15)}"/>` + haze(c, H * 0.38, H * 0.14, 0.5));
  const hill = layerColor(c, 0.55);
  const hillD = `M-40,${H} L-40,${f(H * 0.56)} C${f(W * 0.2)},${f(H * 0.4)} ${f(W * 0.45)},${f(H * 0.36)} ${f(W * 0.62)},${f(H * 0.42)} C${f(W * 0.8)},${f(H * 0.48)} ${f(W * 0.95)},${f(H * 0.6)} ${W + 40},${f(H * 0.62)} L${W + 40},${H} Z`;
  let terr = "";
  for (let i = 0; i < 14; i++) {
    const y = H * 0.48 + i * i * 2.6 + i * 10;
    terr += `<path d="M-40,${f(y + 30)} C${f(W * 0.25)},${f(y - 10 + c.r() * 10)} ${f(W * 0.6)},${f(y + c.r() * 14)} ${W + 40},${f(y + 20)}" stroke="${mix(hill, p.light, 0.3)}" stroke-width="${f(2 + i * 0.3)}" fill="none" opacity="0.6"/>`;
  }
  L.push(`<path d="${hillD}" fill="${hill}"/>` + terr);
  // conical-roof houses
  let huts = "";
  for (let i = 0; i < 9; i++) {
    const hx = W * (0.3 + c.r() * 0.45);
    const hy = H * (0.52 + c.r() * 0.12);
    const s = 18 + c.r() * 14;
    const wallC = mix("#a07a55", p.near, c.tod === "night" ? 0.7 : 0.25);
    huts += `<rect x="${f(hx - s / 2)}" y="${f(hy - s * 0.7)}" width="${f(s)}" height="${f(s * 0.7)}" fill="${wallC}"/><path d="M${f(hx - s * 0.75)},${f(hy - s * 0.65)} L${f(hx)},${f(hy - s * 1.6)} L${f(hx + s * 0.75)},${f(hy - s * 0.65)} Z" fill="${mix("#7a6038", p.near, 0.3)}"/>`;
  }
  L.push(huts);
  L.push(`<path d="${ridge(c.r, H * 0.92, H * 0.02, { step: 26 })}" fill="${p.near}"/>`);
  return L;
}

function sceneGrove(c: Ctx): Layers {
  const { p, id } = c;
  const L: Layers = [sky(c, 0.5)];
  for (let i = 0; i < 4; i++) {
    const t = i / 3;
    L.push(canopy(c, -60, W + 60, H * (0.34 + t * 0.2), 40 + t * 30, layerColor(c, 0.25 + t * 0.6)));
  }
  c.defs.push(linear(`${id}-shaft`, [[0, p.light, 0.32], [1, p.light, 0]]));
  let shafts = "";
  for (let i = 0; i < 4; i++) {
    const sx = W * (0.15 + c.r() * 0.7);
    shafts += `<path d="M${f(sx)},0 L${f(sx + 70)},0 L${f(sx + 260)},${H} L${f(sx + 120)},${H} Z" fill="url(#${id}-shaft)"/>`;
  }
  c.defs.push(linear(`${id}-river`, [[0, mix(p.water, p.light, 0.4)], [1, p.water]]));
  L.push(
    shafts +
      `<path d="M${f(W * 0.42)},${f(H * 0.72)} C${f(W * 0.3)},${f(H * 0.8)} ${f(W * 0.62)},${f(H * 0.86)} ${f(W * 0.4)},${H + 10} L${f(W * 0.7)},${H + 10} C${f(W * 0.82)},${f(H * 0.86)} ${f(W * 0.46)},${f(H * 0.8)} ${f(W * 0.5)},${f(H * 0.72)} Z" fill="url(#${id}-river)"/>`,
  );
  // trunks
  let trunks = "";
  for (let i = 0; i < 6; i++) {
    const tx = c.r() < 0.5 ? c.r() * W * 0.28 : W - c.r() * W * 0.28;
    const tw = 14 + c.r() * 22;
    trunks += `<path d="M${f(tx)},${H} L${f(tx + 4)},${f(H * 0.2)} L${f(tx + tw - 4)},${f(H * 0.2)} L${f(tx + tw)},${H} Z"/>`;
  }
  L.push(`<g fill="${p.near}">${trunks}</g>` + canopy(c, -80, W * 0.3, H * 0.12, 60, p.near).replace(/<rect[^>]*\/>/, "") + canopy(c, W * 0.72, W + 80, H * 0.1, 60, p.near).replace(/<rect[^>]*\/>/, ""));
  return L;
}

function sceneFestival(c: Ctx): Layers {
  const { p, id } = c;
  const L: Layers = [sky(c, 0.5)];
  const cols = ["#e8a432", "#f6e7c8", "#a9c2a2", "#5a6fa8", "#d9774b"];
  let bokeh = "";
  c.defs.push(radial(`${id}-bk`, [[0, "#ffffff", 0.9], [0.6, "#ffffff", 0.5], [1, "#ffffff", 0]]));
  for (let i = 0; i < 90; i++) {
    const r = 6 + Math.pow(c.r(), 2) * 70;
    const col = cols[Math.floor(c.r() * cols.length)]!;
    bokeh += `<circle cx="${f(c.r() * W)}" cy="${f(c.r() * H * 0.7)}" r="${f(r)}" fill="${col}" opacity="${f(c.tod === "day" ? 0.18 + c.r() * 0.2 : 0.25 + c.r() * 0.45)}"/>`;
  }
  L.push(bokeh);
  // bunting
  let bunting = "";
  for (let s = 0; s < 3; s++) {
    const y0 = H * (0.18 + s * 0.12);
    const sag = 60 + c.r() * 60;
    for (let i = 0; i <= 26; i++) {
      const u = i / 26;
      const x = -20 + u * (W + 40);
      const y = y0 + sag * 4 * u * (1 - u);
      const col = cols[(i + s) % cols.length]!;
      bunting += `<path d="M${f(x - 14)},${f(y)} L${f(x + 14)},${f(y)} L${f(x)},${f(y + 30)} Z" fill="${col}" opacity="0.92"/>`;
    }
    bunting += `<path d="M-20,${f(y0)} Q${f(W / 2)},${f(y0 + sag * 2)} ${W + 20},${f(y0)}" stroke="${p.light}" stroke-width="1.5" fill="none" opacity="0.5"/>`;
  }
  L.push(bunting);
  // crowd silhouettes
  let crowd = "";
  for (let row = 0; row < 2; row++) {
    const base = H * (0.86 + row * 0.08);
    const col = row === 0 ? layerColor(c, 0.7) : p.near;
    let x = -20;
    while (x < W + 20) {
      const s = 26 + c.r() * 14 + row * 10;
      const headY = base - s * 2.4 - c.r() * 20;
      crowd += `<circle cx="${f(x)}" cy="${f(headY)}" r="${f(s * 0.42)}" fill="${col}"/>`;
      if (c.r() > 0.7) crowd += `<ellipse cx="${f(x)}" cy="${f(headY - s * 0.45)}" rx="${f(s * 0.75)}" ry="${f(s * 0.3)}" fill="${col}"/>`;
      crowd += `<path d="M${f(x - s)},${H} L${f(x - s * 0.8)},${f(headY + s * 0.5)} Q${f(x)},${f(headY + s * 0.1)} ${f(x + s * 0.8)},${f(headY + s * 0.5)} L${f(x + s)},${H} Z" fill="${col}"/>`;
      if (c.r() > 0.8) crowd += `<path d="M${f(x + s * 0.6)},${f(headY + s)} L${f(x + s * 1.2)},${f(headY - s * 1.2)}" stroke="${col}" stroke-width="${f(s * 0.22)}" stroke-linecap="round"/>`;
      x += s * 1.25;
    }
  }
  L.push(crowd);
  return L;
}

function sceneDyepits(c: Ctx): Layers {
  const { p, id } = c;
  const ground = c.tod === "dusk" ? "#b07a4a" : "#cfa56c";
  c.defs.push(linear(`${id}-gr`, [[0, mix(ground, p.light, 0.2)], [1, mix(ground, "#6b4a2a", 0.3)]]));
  const L: Layers = [`<rect width="${W}" height="${H}" fill="url(#${id}-gr)"/>`];
  let speck = "";
  for (let i = 0; i < 260; i++) speck += `<circle cx="${f(c.r() * W)}" cy="${f(c.r() * H)}" r="${f(1 + c.r() * 2.5)}" fill="#5a3d22" opacity="${f(0.06 + c.r() * 0.12)}"/>`;
  L.push(speck);
  // fabric strips drying
  let cloth = "";
  for (let i = 0; i < 4; i++) {
    const cy = H * (0.12 + i * 0.26) + (c.r() - 0.5) * 40;
    const cx = c.r() < 0.5 ? W * 0.02 : W * 0.6;
    const w = W * (0.3 + c.r() * 0.08);
    const ang = (c.r() - 0.5) * 6;
    let pattern = "";
    for (let j = 0; j < 22; j++) pattern += `<circle cx="${f(cx + 20 + j * (w - 40) / 21)}" cy="${f(cy + 34)}" r="7" fill="#f3ecdc" opacity="0.85"/>`;
    for (let j = 0; j < 3; j++) pattern += `<rect x="${f(cx)}" y="${f(cy + 8 + j * 52)}" width="${f(w)}" height="3" fill="#f3ecdc" opacity="0.6"/>`;
    cloth += `<g transform="rotate(${f(ang)} ${f(cx + w / 2)} ${f(cy + 60)})"><rect x="${f(cx)}" y="${f(cy)}" width="${f(w)}" height="120" fill="#24315c"/>${pattern}</g>`;
  }
  L.push(cloth);
  // pits
  let pits = "";
  const pts: [number, number][] = [];
  for (let i = 0; i < 40 && pts.length < 11; i++) {
    const x = W * (0.12 + c.r() * 0.76);
    const y = H * (0.12 + c.r() * 0.76);
    if (pts.every(([a, b]) => Math.hypot(a - x, b - y) > 230)) pts.push([x, y]);
  }
  pts.forEach(([x, y], i) => {
    const r = 70 + c.r() * 30;
    const fresh = i % 4 === 0;
    const dye = fresh ? "#2f6f7c" : "#1b2346";
    c.defs.push(radial(`${id}-pit${i}`, [[0, mix(dye, "#ffffff", 0.18)], [0.7, dye], [1, mix(dye, "#000000", 0.3)]]));
    pits += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r + 22)}" fill="${mix(ground, "#4a3220", 0.35)}"/>`;
    pits += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r + 10)}" fill="${mix(ground, "#2f2a2a", 0.55)}"/>`;
    pits += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="url(#${id}-pit${i})"/>`;
    pits += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 0.62)}" stroke="#ffffff" stroke-opacity="0.12" stroke-width="3" fill="none"/>`;
    pits += `<ellipse cx="${f(x - r * 0.3)}" cy="${f(y - r * 0.35)}" rx="${f(r * 0.25)}" ry="${f(r * 0.1)}" fill="#ffffff" opacity="0.22"/>`;
  });
  L.push(pits);
  return L;
}

function sceneBoulders(c: Ctx): Layers {
  const { p, id } = c;
  const L: Layers = [sky(c, 0.3)];
  L.push(`<path d="${ridge(c.r, H * 0.6, H * 0.05)}" fill="${layerColor(c, 0.2)}"/>` + haze(c, H * 0.52, H * 0.14, 0.45));
  const rock = c.tod === "night" ? "#24302c" : c.tod === "dusk" ? "#5a4a4e" : "#867c70";
  c.defs.push(linear(`${id}-rock`, [[0, mix(rock, p.light, c.tod === "night" ? 0.1 : 0.42)], [1, mix(rock, p.near, 0.45)]]));
  const piles: string[] = [];
  for (let k = 0; k < 3; k++) {
    let s = "";
    const cx = W * (0.15 + k * 0.33 + (c.r() - 0.5) * 0.1);
    const base = H * (0.82 + c.r() * 0.04);
    let y = base;
    const levels = 2 + Math.floor(c.r() * 3);
    for (let lv = 0; lv < levels; lv++) {
      const count = Math.max(1, levels - lv);
      const size = 120 - lv * 22 + c.r() * 30;
      for (let i = 0; i < count; i++) {
        const bx = cx + (i - (count - 1) / 2) * size * 1.4 + (c.r() - 0.5) * 30;
        const ry = size * (0.72 + c.r() * 0.2);
        const by = y - ry;
        s += `<ellipse cx="${f(bx)}" cy="${f(by)}" rx="${f(size)}" ry="${f(ry)}" transform="rotate(${f((c.r() - 0.5) * 30)} ${f(bx)} ${f(by)})" fill="url(#${id}-rock)"/>`;
        s += `<path d="M${f(bx - size * 0.6)},${f(by + ry * 0.5)} Q${f(bx)},${f(by + ry * 0.95)} ${f(bx + size * 0.7)},${f(by + ry * 0.45)}" stroke="${p.near}" stroke-width="6" opacity="0.18" fill="none"/>`;
      }
      y -= size * 1.35;
    }
    piles.push(s);
  }
  L.push(piles.join(""));
  L.push(`<path d="${ridge(c.r, H * 0.88, H * 0.02, { step: 26 })}" fill="${layerColor(c, 0.85)}"/>` + acacia(W * 0.86, H * 0.95, H * 0.3, p.near, c.r));
  return L;
}

function sceneRainforest(c: Ctx): Layers {
  const { p, id } = c;
  const L: Layers = [sky(c, 0.6)];
  for (let i = 0; i < 3; i++) {
    const t = i / 2;
    L.push(canopy(c, -60, W + 60, H * (0.3 + t * 0.18), 50 + t * 20, layerColor(c, 0.3 + t * 0.4)) + haze(c, H * (0.3 + t * 0.18), H * 0.1, 0.35 - t * 0.15));
  }
  // emergent trees
  let em = "";
  for (let i = 0; i < 3; i++) {
    const x = W * (0.15 + c.r() * 0.7);
    const top = H * (0.12 + c.r() * 0.1);
    em += `<rect x="${f(x - 6)}" y="${f(top)}" width="12" height="${f(H * 0.5)}" fill="${layerColor(c, 0.7)}"/>`;
    em += canopy(c, x - 90, x + 90, top, 34, layerColor(c, 0.7)).replace(/<rect[^>]*\/>/, "");
  }
  L.push(em);
  c.defs.push(linear(`${id}-floor`, [[0, mix(p.near, p.haze, 0.2)], [1, p.near]]));
  let ferns = "";
  for (let i = 0; i < 26; i++) {
    const x = c.r() * W;
    const h = H * (0.1 + c.r() * 0.12);
    for (let j = -2; j <= 2; j++) ferns += `<path d="M${f(x)},${H} Q${f(x + j * h * 0.3)},${f(H - h * 0.8)} ${f(x + j * h * 0.55)},${f(H - h * (0.6 + Math.abs(j) * -0.1))}" stroke="${p.near}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  }
  L.push(`<rect x="0" y="${f(H * 0.78)}" width="${W}" height="${f(H * 0.22)}" fill="url(#${id}-floor)"/>` + ferns);
  return L;
}

function sceneTable(c: Ctx): Layers {
  const { id } = c;
  // top-down table with an indigo resist-dye cloth
  const L: Layers = [`<rect width="${W}" height="${H}" fill="#22305a"/>`];
  let cloth = "";
  for (let y = 0; y < H; y += 80) {
    cloth += `<rect x="0" y="${y}" width="${W}" height="2" fill="#e9e1cf" opacity="0.3"/>`;
    for (let x = (y / 80) % 2 ? 40 : 0; x < W; x += 80) cloth += `<circle cx="${x}" cy="${y + 40}" r="9" fill="#e9e1cf" opacity="0.22"/><circle cx="${x}" cy="${y + 40}" r="20" stroke="#e9e1cf" stroke-opacity="0.12" fill="none"/>`;
  }
  L.push(cloth);
  const dishes: { x: number; y: number; r: number; fill: string; fleck: string[] }[] = [
    { x: W * 0.32, y: H * 0.45, r: 230, fill: "#c9522a", fleck: ["#e8a432", "#5c7a32", "#9c2d1c"] }, // tomato-pepper rice
    { x: W * 0.68, y: H * 0.36, r: 170, fill: "#4f6b2a", fleck: ["#e6c45a", "#2f4419", "#c08a3a"] }, // leafy soup
    { x: W * 0.72, y: H * 0.78, r: 120, fill: "#a52f1c", fleck: ["#e8a432", "#5a1a10"] }, // pepper stew
    { x: W * 0.12, y: H * 0.86, r: 100, fill: "#efe2c2", fleck: ["#e3d4a8"] }, // pounded yam
  ];
  let bowls = "";
  dishes.forEach((d, i) => {
    c.defs.push(radial(`${id}-food${i}`, [[0, mix(d.fill, "#ffffff", 0.12)], [0.85, d.fill], [1, mix(d.fill, "#000000", 0.25)]]));
    bowls += `<circle cx="${f(d.x + 10)}" cy="${f(d.y + 16)}" r="${f(d.r + 34)}" fill="#000000" opacity="0.25"/>`;
    bowls += `<circle cx="${f(d.x)}" cy="${f(d.y)}" r="${f(d.r + 30)}" fill="#f4efe4"/>`;
    bowls += `<circle cx="${f(d.x)}" cy="${f(d.y)}" r="${f(d.r + 30)}" stroke="#c9bfa8" stroke-width="3" fill="none"/>`;
    bowls += `<circle cx="${f(d.x)}" cy="${f(d.y)}" r="${f(d.r)}" fill="url(#${id}-food${i})"/>`;
    for (let k = 0; k < d.r * 0.9; k++) {
      const a = c.r() * Math.PI * 2;
      const rr = Math.sqrt(c.r()) * d.r * 0.92;
      bowls += `<ellipse cx="${f(d.x + Math.cos(a) * rr)}" cy="${f(d.y + Math.sin(a) * rr)}" rx="${f(3 + c.r() * 5)}" ry="${f(2 + c.r() * 3)}" transform="rotate(${f(c.r() * 180)} ${f(d.x + Math.cos(a) * rr)} ${f(d.y + Math.sin(a) * rr)})" fill="${d.fleck[k % d.fleck.length]}" opacity="0.8"/>`;
    }
  });
  // fried plantain and skewers
  let plantain = "";
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const px = W * 0.9 + Math.cos(a) * 70;
    const py = H * 0.12 + Math.sin(a) * 50;
    plantain += `<ellipse cx="${f(px)}" cy="${f(py)}" rx="34" ry="20" transform="rotate(${f((a * 180) / Math.PI)} ${f(px)} ${f(py)})" fill="#e3a43e" stroke="#9c5b1c" stroke-width="3"/>`;
  }
  let skewers = "";
  for (let i = 0; i < 3; i++) {
    const y = H * (0.08 + i * 0.07);
    skewers += `<rect x="${f(W * 0.36)}" y="${f(y)}" width="${f(W * 0.24)}" height="5" fill="#c8a670" transform="rotate(-8 ${f(W * 0.48)} ${f(y)})"/>`;
    for (let k = 0; k < 6; k++) skewers += `<rect x="${f(W * 0.38 + k * 56)}" y="${f(y - 14 - k * 7.6)}" width="44" height="28" rx="8" fill="#5b2f1c"/><circle cx="${f(W * 0.38 + k * 56 + 20)}" cy="${f(y - k * 7.6)}" r="5" fill="#b8361e" opacity="0.8"/>`;
  }
  L.push(bowls + plantain + skewers);
  return L;
}

const builders: Record<SceneKind, (c: Ctx) => Layers> = {
  highland: sceneHighland,
  inselberg: sceneInselberg,
  waterfall: sceneWaterfall,
  savanna: sceneSavanna,
  coast: sceneCoast,
  lake: sceneLake,
  city: sceneCity,
  earthen: sceneEarthen,
  terraces: sceneTerraces,
  grove: sceneGrove,
  festival: sceneFestival,
  dyepits: sceneDyepits,
  boulders: sceneBoulders,
  rainforest: sceneRainforest,
  table: sceneTable,
};

export type PlateLayers = { defs: string; layers: string[]; vignette: string };

export function plateLayers(plate: Plate, idPrefix = "p"): PlateLayers {
  const id = `${idPrefix}${plate.scene.slice(0, 3)}${plate.seed}`;
  const c: Ctx = { r: rng(plate.seed * 7919 + plate.scene.length), p: palettes[plate.tod], id, defs: [], tod: plate.tod };
  const layers = builders[plate.scene](c);
  c.defs.push(`<radialGradient id="${id}-vig" cx="0.5" cy="0.45" r="0.75"><stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.32"/></radialGradient>`);
  return {
    defs: `<defs>${c.defs.join("")}</defs>`,
    layers,
    vignette: `<rect width="${W}" height="${H}" fill="url(#${id}-vig)"/>`,
  };
}

/** A complete standalone SVG document for a plate. */
export function plateSvg(plate: Plate, title?: string): string {
  const { defs, layers, vignette } = plateLayers(plate);
  const t = title ? `<title>${title.replace(/[<&>]/g, "")}</title>` : "";
  // Layers are grouped so the hero can move them independently (parallax).
  const body = layers.map((l, i) => `<g class="plx plx-${Math.min(i, 3)}">${l}</g>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">${t}${defs}${body}${vignette}</svg>`;
}

/** Stable file name for a plate. */
export function plateKey(plate: Plate): string {
  return `${plate.scene}-${plate.tod}-${plate.seed}`;
}

export function parsePlateKey(key: string): Plate | null {
  const m = /^([a-z]+)-(dawn|day|dusk|night)-(\d+)$/.exec(key);
  if (!m) return null;
  const scene = m[1] as SceneKind;
  if (!(scene in builders)) return null;
  return { scene, tod: m[2] as TimeOfDay, seed: Number(m[3]) };
}
