/** The learner's calendar date (YYYY-MM-DD) in their own timezone. */
export function localDate(timezone: string, now: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

/** Streak update rule: same day keeps, next day extends, any gap resets to 1. */
export function nextStreak(
  current: { currentDays: number; longestDays: number; lastActiveDate: string | null },
  today: string,
): { currentDays: number; longestDays: number; lastActiveDate: string } {
  if (current.lastActiveDate === today) return { ...current, lastActiveDate: today };
  const gap = current.lastActiveDate ? daysBetween(current.lastActiveDate, today) : Infinity;
  const currentDays = gap === 1 ? current.currentDays + 1 : 1;
  return { currentDays, longestDays: Math.max(current.longestDays, currentDays), lastActiveDate: today };
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m ? `${m} min${s ? ` ${s} s` : ""}` : `${s} s`;
}
