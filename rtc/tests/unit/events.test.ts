import { describe, expect, it } from "vitest";
import { activeEvents, activeMissions, missionPeriod } from "@/game/data/world";

describe("festival events", () => {
  it("adds the Live Out Loud mission only while the event runs", () => {
    const during = new Date("2026-11-20T12:00:00Z");
    expect(activeEvents(during).map((e) => e.id)).toContain("liveoutloud");
    const m = activeMissions(during).find((x) => x.id === "e_liveoutloud");
    expect(m).toBeDefined();
    expect(missionPeriod(m!, during)).toBe("event");
    expect(missionPeriod(m!, new Date("2026-12-01T00:00:00Z"))).toBe("event"); // one claim for the whole event
    expect(activeMissions(new Date("2026-12-14T08:00:00Z")).some((x) => x.id === "e_liveoutloud")).toBe(false);
    expect(activeMissions(new Date("2026-10-01T08:00:00Z")).some((x) => x.id === "e_liveoutloud")).toBe(false);
  });
});
