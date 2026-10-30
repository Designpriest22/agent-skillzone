import { describe, expect, it } from "vitest";
import { compareText, normalizeLoose, normalizeStrict, seededShuffle } from "@/lib/content/normalize";

describe("answer normalisation", () => {
  it("treats precomposed and combining diacritics as the same letter", () => {
    const precomposed = "Ẹ ṣé";
    const decomposed = precomposed.normalize("NFD");
    expect(decomposed).not.toBe(precomposed);
    expect(compareText(decomposed, [precomposed])).toBe("exact");
  });

  it("ignores case, surrounding space and sentence punctuation", () => {
    expect(compareText("  kí ni orúkọ rẹ  ", ["Kí ni orúkọ rẹ?"])).toBe("exact");
  });

  it("flags missing Yoruba tone marks as a near miss, not correct", () => {
    expect(compareText("E se", ["Ẹ ṣé"])).toBe("near");
    expect(compareText("abúrò", ["àbúrò"])).toBe("near");
  });

  it("flags plain letters in place of Hausa hooked letters as a near miss", () => {
    expect(compareText("hudu", ["huɗu"])).toBe("near");
    expect(compareText("huɗu", ["huɗu"])).toBe("exact");
  });

  it("keeps Hausa apostrophes meaningful but accepts curly quotes", () => {
    expect(normalizeStrict("’yar’uwa")).toBe("'yar'uwa");
    expect(compareText("’yar’uwa", ["'yar'uwa"])).toBe("exact");
  });

  it("rejects wrong words", () => {
    expect(compareText("Daalụ", ["Na gode"])).toBe("none");
    expect(compareText("", ["Na gode"])).toBe("none");
  });

  it("strips Igbo dots only in loose comparison", () => {
    expect(normalizeLoose("Daalụ")).toBe("daalu");
    expect(compareText("Daalu", ["Daalụ"])).toBe("near");
  });

  it("shuffles deterministically", () => {
    const a = seededShuffle([1, 2, 3, 4, 5, 6], "seed");
    expect(seededShuffle([1, 2, 3, 4, 5, 6], "seed")).toEqual(a);
    expect([...a].sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
