export type Tone = "H" | "M" | "L";

const VOWELS = /[aeiouɛɔ]/;
const NASAL_SYLLABIC = /^[nm]$/;

/**
 * Derives a tone sequence from Yoruba-style tone marks: U+0301 (acute) = high,
 * U+0300 (grave) = low, no mark = mid. Each vowel (and tone-marked syllabic n/m)
 * is one tone-bearing unit. Returns null if the text has no tone marks at all, so we
 * never invent a contour for text written without them.
 */
export function toneContour(text: string): Tone[] | null {
  const decomposed = text.normalize("NFD").toLowerCase();
  if (!/[̀́]/.test(decomposed)) return null;
  const tones: Tone[] = [];
  const chars = [...decomposed];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]!;
    const isVowel = VOWELS.test(ch);
    const isNasal = NASAL_SYLLABIC.test(ch);
    if (!isVowel && !isNasal) continue;
    // Collect the combining marks that follow this base letter.
    let j = i + 1;
    let tone: Tone = "M";
    let marked = false;
    while (j < chars.length && /\p{M}/u.test(chars[j]!)) {
      if (chars[j] === "́") {
        tone = "H";
        marked = true;
      } else if (chars[j] === "̀") {
        tone = "L";
        marked = true;
      }
      j++;
    }
    if (isNasal && !marked) continue; // plain n/m are consonants
    tones.push(tone);
    i = j - 1;
  }
  return tones.length ? tones : null;
}
