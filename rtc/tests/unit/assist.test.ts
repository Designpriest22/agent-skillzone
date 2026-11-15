import { describe, expect, it } from "vitest";
import { ASSIST_COOLDOWN, Sim, simulate } from "@/game/sim/sim";
import { B } from "@/game/sim/input";

describe("story mode crew call", () => {
  it("calls the crew member once, then waits for the cooldown", () => {
    const sim = new Sim({ seed: 3, substage: "01A", fighter: "odumodu", assist: "romie" });
    for (let i = 0; i < 5; i++) sim.step(0);
    sim.step(B.ASSIST);
    expect(sim.projs.some((p) => p.kind === "summon_romie")).toBe(true);
    expect(sim.assistCD).toBe(ASSIST_COOLDOWN - 1); // counts down within the same tick
    sim.step(0); sim.step(B.ASSIST);
    expect(sim.projs.filter((p) => p.kind === "summon_romie").length).toBe(1);
  });

  it("does nothing without a crew member, and replays deterministically with one", () => {
    const solo = new Sim({ seed: 3, substage: "01A", fighter: "odumodu" });
    solo.step(0); solo.step(B.ASSIST);
    expect(solo.projs.some((p) => p.kind.startsWith("summon_"))).toBe(false);
    const inputs = Array.from({ length: 900 }, (_, i) => (i === 100 ? B.ASSIST : i % 20 < 10 ? B.RIGHT | B.ATTACK : B.RIGHT));
    const a = simulate({ seed: 11, substage: "01A", fighter: "odumodu", assist: "settings" }, inputs);
    const b = simulate({ seed: 11, substage: "01A", fighter: "odumodu", assist: "settings" }, inputs);
    expect(a).toEqual(b);
  });
});
