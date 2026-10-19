/**
 * Text normalisation for answer checking in African languages.
 *
 * - Always NFC-normalise: learners' keyboards produce both precomposed (é) and
 *   combining (e + U+0301) forms of the same letter.
 * - Apostrophes are meaningful in Hausa ('y, ɗan'uwa), so curly and straight
 *   apostrophes are unified but never removed.
 * - "Loose" comparison removes tone marks and under-dots and maps hooked letters to
 *   their plain counterparts. A loose-only match is a near miss, not a correct answer:
 *   in Yoruba, tone marks distinguish words.
 */
const PUNCTUATION = /[.,!?¿¡;:"“”«»…()\[\]]/g;
const APOSTROPHES = /[’‘ʼ`´]/g;
const HOOKED: Record<string, string> = { ɓ: "b", ɗ: "d", ƙ: "k", ƴ: "y", ŋ: "n" };

export function normalizeStrict(input: string): string {
  return input
    .normalize("NFC")
    .replace(APOSTROPHES, "'")
    .replace(PUNCTUATION, " ")
    .toLocaleLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeLoose(input: string): string {
  return normalizeStrict(input)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[ɓɗƙƴŋ]/g, (c) => HOOKED[c] ?? c)
    .replace(/'/g, "")
    .normalize("NFC");
}

export type MatchKind = "exact" | "near" | "none";

export function compareText(given: string, accepted: string[]): MatchKind {
  const g = normalizeStrict(given);
  if (!g) return "none";
  if (accepted.some((a) => normalizeStrict(a) === g)) return "exact";
  const gl = normalizeLoose(given);
  if (accepted.some((a) => normalizeLoose(a) === gl)) return "near";
  return "none";
}

/** Deterministic shuffle (mulberry32 seeded from a string) so seeds are reproducible. */
export function seededShuffle<T>(items: T[], seed: string): T[] {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let state = h >>> 0;
  const rand = () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}
