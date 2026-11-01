import { env } from "./env";

/** Returns the UTC instant for 00:00 local business time on the given local calendar date. */
function zonedMidnight(year: number, month: number, day: number, tz = env.timezone): Date {
  // Lagos has no DST (UTC+1) but compute generically via Intl offset.
  const guess = new Date(Date.UTC(year, month, day, 0, 0, 0));
  const offsetMin = tzOffsetMinutes(guess, tz);
  return new Date(guess.getTime() - offsetMin * 60_000);
}

export function tzOffsetMinutes(at: Date, tz = env.timezone): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(at);
  const g = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute"), g("second"));
  return Math.round((asUtc - at.getTime()) / 60_000);
}

export function localParts(at = new Date(), tz = env.timezone) {
  const shifted = new Date(at.getTime() + tzOffsetMinutes(at, tz) * 60_000);
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth(), day: shifted.getUTCDate(), weekday: shifted.getUTCDay() };
}

/** YYYY-MM-DD of a local calendar date (handles day/month overflow). */
function localLabel(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);
}

export type Period = { start: Date; end: Date; label: string };

export function dayPeriod(at = new Date(), offsetDays = 0): Period {
  const p = localParts(at);
  const start = zonedMidnight(p.year, p.month, p.day + offsetDays);
  const end = zonedMidnight(p.year, p.month, p.day + offsetDays + 1);
  return { start, end, label: localLabel(p.year, p.month, p.day + offsetDays) };
}

export function weekPeriod(at = new Date(), offsetWeeks = 0): Period {
  const p = localParts(at);
  const mondayOffset = (p.weekday + 6) % 7;
  const start = zonedMidnight(p.year, p.month, p.day - mondayOffset + offsetWeeks * 7);
  const end = zonedMidnight(p.year, p.month, p.day - mondayOffset + offsetWeeks * 7 + 7);
  return { start, end, label: `Week of ${localLabel(p.year, p.month, p.day - mondayOffset + offsetWeeks * 7)}` };
}

export function monthPeriod(at = new Date(), offsetMonths = 0): Period {
  const p = localParts(at);
  const start = zonedMidnight(p.year, p.month + offsetMonths, 1);
  const end = zonedMidnight(p.year, p.month + offsetMonths + 1, 1);
  const label = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(p.year, p.month + offsetMonths, 1)));
  return { start, end, label };
}

export function quarterPeriod(at = new Date()): Period {
  const p = localParts(at);
  const qStartMonth = Math.floor(p.month / 3) * 3;
  const start = zonedMidnight(p.year, qStartMonth, 1);
  const end = zonedMidnight(p.year, qStartMonth + 3, 1);
  return { start, end, label: `Q${qStartMonth / 3 + 1} ${p.year}` };
}

/** Month period for a "YYYY-MM" string or month name (e.g. "October", "2026-10"). */
export function parseMonth(input: string, now = new Date()): Period | null {
  const iso = /^(\d{4})-(\d{2})$/.exec(input.trim());
  const p = localParts(now);
  let year = p.year;
  let month: number;
  if (iso) {
    year = Number(iso[1]);
    month = Number(iso[2]) - 1;
  } else {
    const names = ["january","february","march","april","may","june","july","august","september","october","november","december"];
    const m = input.trim().toLowerCase().match(/^([a-z]+)(?:\s+(\d{4}))?$/);
    if (!m) return null;
    month = names.findIndex((n) => n.startsWith(m[1].slice(0, 3)));
    if (month < 0) return null;
    if (m[2]) year = Number(m[2]);
    else if (month > p.month) year -= 1; // "October" in January means last October
  }
  const start = zonedMidnight(year, month, 1);
  const end = zonedMidnight(year, month + 1, 1);
  const label = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month, 1)));
  return { start, end, label };
}

export const isoDate = (d: Date) => d.toISOString().slice(0, 10);
