import { describe, expect, it } from "vitest";
import { gradeActivity } from "@/lib/content/validate";
import { buildActivity } from "@/lib/content/build-activity";
import { yoruba } from "../../content/curriculum/yoruba";

describe("gradeActivity", () => {
  it("grades multiple choice by index", () => {
    expect(gradeActivity("listening", { index: 2 }, { type: "listening", index: 2 }).correct).toBe(true);
    expect(gradeActivity("listening", { index: 2 }, { type: "listening", index: 1 }).score).toBe(0);
  });

  it("returns the dialogue explanation as feedback", () => {
    const r = gradeActivity(
      "dialogue",
      { index: 0, explanation: "Use the respectful form." },
      { type: "dialogue", index: 1 },
    );
    expect(r.correct).toBe(false);
    expect(r.feedback).toBe("Use the respectful form.");
  });

  it("gives half credit for a tone-mark near miss in translation", () => {
    const r = gradeActivity(
      "translation",
      { accepted: ["Ẹ ṣé", "Ẹ ṣéun"] },
      { type: "translation", text: "E seun" },
    );
    expect(r).toMatchObject({ correct: false, nearMiss: true, score: 0.5, expected: "Ẹ ṣé" });
  });

  it("grades word order exactly", () => {
    const ans = { order: ["Orúkọ", "mi", "ni", "Adé"] };
    expect(
      gradeActivity("word_order", ans, { type: "word_order", order: ["Orúkọ", "mi", "ni", "Adé"] }).correct,
    ).toBe(true);
    expect(
      gradeActivity("word_order", ans, { type: "word_order", order: ["mi", "Orúkọ", "ni", "Adé"] }).correct,
    ).toBe(false);
  });

  it("gives partial credit for matching and ignores duplicate claims", () => {
    const ans = {
      pairs: [
        ["a", "1"],
        ["b", "2"],
        ["c", "3"],
        ["d", "4"],
      ] as [string, string][],
    };
    const r = gradeActivity("matching", ans, {
      type: "matching",
      pairs: [
        ["a", "1"],
        ["b", "2"],
        ["c", "4"],
        ["d", "3"],
      ],
    });
    expect(r.score).toBe(0.5);
    const cheat = gradeActivity("matching", ans, {
      type: "matching",
      pairs: [
        ["a", "1"],
        ["a", "1"],
        ["a", "1"],
        ["a", "1"],
      ],
    });
    expect(cheat.correct).toBe(false);
    expect(cheat.score).toBe(0.25);
  });

  it("grades review items against the provided key", () => {
    const key = new Map([["11111111-1111-4111-8111-111111111111", "Thank you"]]);
    const r = gradeActivity(
      "review",
      null,
      { type: "review", answers: [{ vocabId: "11111111-1111-4111-8111-111111111111", choice: "thank you" }] },
      key,
    );
    expect(r.correct).toBe(true);
    expect(r.items?.[0]?.correct).toBe(true);
  });

  it("rejects a response of the wrong type", () => {
    expect(gradeActivity("translation", { accepted: ["x"] }, { type: "listening", index: 0 }).correct).toBe(
      false,
    );
  });
});

describe("buildActivity (seed content)", () => {
  const ctx = (seed: string) => ({
    resolve: () => "00000000-0000-4000-8000-000000000000",
    textOf: () => "x",
    seed,
  });

  it("never starts a word-order activity in the solved order", () => {
    for (let i = 0; i < 50; i++) {
      const built = buildActivity({ type: "word_order", prompt: "p", answer: ["a", "b"] }, ctx(`s${i}`)) as {
        payload: { tokens: string[] };
      };
      expect(built.payload.tokens).toEqual(["b", "a"]);
    }
  });

  it("tracks the correct option after shuffling", () => {
    for (let i = 0; i < 20; i++) {
      const built = buildActivity(
        { type: "listening", vocab: "k", prompt: "p", options: ["right", "w1", "w2", "w3"], answerIndex: 0 },
        ctx(`x${i}`),
      ) as {
        payload: { options: string[] };
        answer: { index: number };
      };
      expect(built.payload.options[built.answer.index]).toBe("right");
    }
  });

  it("every authored Yoruba activity references real vocabulary and valid answers", () => {
    const keys = new Set(yoruba.vocab.map((v) => v.key));
    for (const ch of yoruba.chapters)
      for (const l of ch.lessons) {
        for (const k of l.vocab) expect(keys.has(k), `${l.slug}: ${k}`).toBe(true);
        for (const a of l.activities) {
          if ("answerIndex" in a) expect(a.answerIndex).toBeLessThan(a.options.length);
          if (a.type === "listening") expect(keys.has(a.vocab)).toBe(true);
        }
      }
  });
});
