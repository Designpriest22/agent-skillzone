import { describe, expect, it } from "vitest";
import { nextStreak, localDate } from "@/lib/dates";
import { NEW_CARD, schedule } from "@/lib/srs";
import { toneContour } from "@/lib/tone";

describe("spaced repetition", () => {
  const now = new Date("2026-01-01T00:00:00Z");
  it("brings forgotten cards back within minutes and lowers ease", () => {
    const s = schedule({ ...NEW_CARD, repetitions: 3, intervalDays: 10 }, 0, now);
    expect(s.repetitions).toBe(0);
    expect(s.lapses).toBe(1);
    expect(s.ease).toBeCloseTo(2.3);
    expect(s.dueAt.getTime() - now.getTime()).toBe(10 * 60_000);
  });
  it("grows intervals 1 → 6 → ease-multiplied", () => {
    const a = schedule(NEW_CARD, 4, now);
    expect(a.intervalDays).toBe(1);
    const b = schedule(a, 4, now);
    expect(b.intervalDays).toBe(6);
    const c = schedule(b, 4, now);
    expect(c.intervalDays).toBe(Math.round(6 * b.ease));
  });
  it("never lets ease fall below 1.3", () => {
    let s = { ...NEW_CARD };
    for (let i = 0; i < 20; i++) s = schedule(s, 0, now);
    expect(s.ease).toBe(1.3);
  });
  it("caps intervals at a year", () => {
    expect(schedule({ ease: 3, intervalDays: 300, repetitions: 9, lapses: 0 }, 5, now).intervalDays).toBe(
      365,
    );
  });
});

describe("streaks", () => {
  it("extends on consecutive days, holds on the same day, resets after a gap", () => {
    const start = { currentDays: 0, longestDays: 0, lastActiveDate: null };
    const d1 = nextStreak(start, "2026-03-01");
    expect(d1.currentDays).toBe(1);
    expect(nextStreak(d1, "2026-03-01").currentDays).toBe(1);
    const d2 = nextStreak(d1, "2026-03-02");
    expect(d2.currentDays).toBe(2);
    const gap = nextStreak(d2, "2026-03-05");
    expect(gap).toMatchObject({ currentDays: 1, longestDays: 2 });
  });
  it("computes the local calendar date in the learner's time zone", () => {
    const t = new Date("2026-06-01T23:30:00Z");
    expect(localDate("Africa/Lagos", t)).toBe("2026-06-02");
    expect(localDate("America/New_York", t)).toBe("2026-06-01");
  });
});

describe("tone contour", () => {
  it("maps acute/grave/unmarked to high/low/mid", () => {
    expect(toneContour("Báwo ni?")).toEqual(["H", "M", "M"]);
    expect(toneContour("Ẹ káàárọ̀")).toEqual(["M", "H", "L", "H", "L"]);
  });
  it("never invents a contour for text without tone marks", () => {
    expect(toneContour("Kedu?")).toBeNull();
    expect(toneContour("Ina kwana?")).toBeNull();
  });
});
