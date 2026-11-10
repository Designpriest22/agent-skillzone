import { describe, expect, it } from "vitest";
import { Sim, simulate, type Actor } from "@/game/sim/sim";
import { B, decodeInputs, encodeInputs } from "@/game/sim/input";
import { ROSTER } from "@/game/data/roster";

/** A simple bot that plays like a person: walk to the nearest enemy, line up, punch, use specials. */
import { botMask, playBot } from "../bot";

describe("input encoding", () => {
  it("round-trips run-length encoded masks", () => {
    const masks = [0, 0, 0, 16, 16, 2, 2, 2, 2, 1024, 0];
    const s = encodeInputs(masks);
    expect(Array.from(decodeInputs(s))).toEqual(masks);
  });
  it("rejects malformed and oversized logs", () => {
    expect(() => decodeInputs("zz")).toThrow();
    expect(() => decodeInputs("0.99999999")).toThrow();
    expect(() => decodeInputs("fff.2")).toThrow();
  });
});

describe("simulation", () => {
  it("is deterministic: the same seed and inputs give the same result", () => {
    const a = playBot("01A", "odumodu", 1234);
    const replay = simulate({ seed: 1234, substage: "01A", fighter: "odumodu", equipment: "firstaid" }, decodeInputs(encodeInputs(a.log)));
    expect(replay).toEqual(a.result);
  });

  it("a different seed with the same inputs does not reproduce the score", () => {
    const a = playBot("01A", "romie", 77);
    const replay = simulate({ seed: 78, substage: "01A", fighter: "romie", equipment: "firstaid" }, a.log);
    expect(replay.score === a.result.score && replay.ticks === a.result.ticks && replay.kos === a.result.kos).toBe(false);
  });

  it("the bot can clear Wuse II 01A with combos, KOs and a rating", () => {
    const { result } = playBot("01A", "odumodu", 42);
    expect(result.cleared).toBe(true);
    expect(result.kos).toBeGreaterThanOrEqual(10);
    expect(result.maxCombo).toBeGreaterThanOrEqual(4);
    expect(["S", "A", "B", "C"]).toContain(result.rating);
  });

  it("Oga Danfo can be defeated", () => {
    const { result } = playBot("01C", "odumodu", 9);
    expect(result.bossDefeated).toBe(true);
  });

  it("Madam Crescent's booth, floor and light-show phases can be beaten", () => {
    const { result } = playBot("02C", "mamaput", 8);
    expect(result.bossDefeated).toBe(true);
    expect(result.cleared).toBe(true);
  });

  it("every fighter's special and ultimate runs without errors", () => {
    for (const f of ROSTER) {
      const sim = new Sim({ seed: 3, substage: "01A", fighter: f.id, recordEvents: false });
      for (let i = 0; i < 200; i++) sim.step(i < 150 ? B.RIGHT : 0);
      sim.special = 100; sim.ult = 100;
      sim.step(B.SPECIAL);
      for (let i = 0; i < 80; i++) sim.step(0);
      sim.step(B.ULT);
      for (let i = 0; i < 120; i++) sim.step(0);
      expect(sim.player.hp).toBeGreaterThan(0);
    }
  });
});
