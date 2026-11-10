/** Input bits. One 11-bit mask per 60 Hz tick is the whole player input. */
export const B = {
  LEFT: 1,
  RIGHT: 2,
  UP: 4,
  DOWN: 8,
  ATTACK: 16,
  JUMP: 32,
  SPECIAL: 64,
  GRAB: 128,
  DODGE: 256,
  ULT: 512,
  EQUIP: 1024,
} as const;

export const MAX_TICKS = 60 * 60 * 12; // 12 minutes per run

/** Run-length encode per-tick masks: "mask.count,mask.count" in base 36. */
export function encodeInputs(masks: ArrayLike<number>): string {
  const out: string[] = [];
  let i = 0;
  while (i < masks.length) {
    const m = masks[i]!;
    let n = 1;
    while (i + n < masks.length && masks[i + n] === m) n++;
    out.push(`${m.toString(36)}.${n.toString(36)}`);
    i += n;
  }
  return out.join(",");
}

export function decodeInputs(s: string, maxTicks = MAX_TICKS): Uint16Array {
  if (!s) return new Uint16Array(0);
  const parts = s.split(",");
  let total = 0;
  const pairs: [number, number][] = [];
  for (const p of parts) {
    const dot = p.indexOf(".");
    if (dot < 1) throw new Error("bad input encoding");
    const m = parseInt(p.slice(0, dot), 36);
    const n = parseInt(p.slice(dot + 1), 36);
    if (!Number.isFinite(m) || !Number.isFinite(n) || m < 0 || m > 2047 || n < 1) throw new Error("bad input encoding");
    total += n;
    if (total > maxTicks) throw new Error("input log too long");
    pairs.push([m, n]);
  }
  const out = new Uint16Array(total);
  let k = 0;
  for (const [m, n] of pairs) {
    out.fill(m, k, k + n);
    k += n;
  }
  return out;
}

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function rng() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
