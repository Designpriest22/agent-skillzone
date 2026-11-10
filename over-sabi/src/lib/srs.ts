/**
 * Spaced repetition: SM-2 (SuperMemo 2) with small, documented tweaks.
 * Grades: 0 = forgot, 3 = hard, 4 = good, 5 = easy.
 * Pure functions — no I/O — so scheduling is easy to test.
 */
export type Grade = 0 | 3 | 4 | 5;

export interface SrsState {
  ease: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
}

export const NEW_CARD: SrsState = { ease: 2.5, intervalDays: 0, repetitions: 0, lapses: 0 };

/** Forgotten cards come back within the same session/day. */
export const RELEARN_MINUTES = 10;

export function schedule(state: SrsState, grade: Grade, now: Date = new Date()): SrsState & { dueAt: Date } {
  if (grade < 3) {
    return {
      ease: Math.max(1.3, round2(state.ease - 0.2)),
      intervalDays: 0,
      repetitions: 0,
      lapses: state.lapses + 1,
      dueAt: new Date(now.getTime() + RELEARN_MINUTES * 60_000),
    };
  }
  const repetitions = state.repetitions + 1;
  let intervalDays: number;
  if (repetitions === 1) intervalDays = grade === 5 ? 3 : 1;
  else if (repetitions === 2) intervalDays = grade === 3 ? 3 : 6;
  else
    intervalDays = Math.round(
      Math.max(1, state.intervalDays) * (grade === 3 ? 1.2 : state.ease) * (grade === 5 ? 1.3 : 1),
    );
  intervalDays = Math.min(intervalDays, 365);
  const q = grade;
  const ease = Math.max(1.3, round2(state.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))));
  return {
    ease,
    intervalDays,
    repetitions,
    lapses: state.lapses,
    dueAt: new Date(now.getTime() + intervalDays * 86_400_000),
  };
}

/** Map an automatic lesson result onto an SRS grade. */
export function gradeFromResult(correct: boolean, nearMiss: boolean): Grade {
  if (correct) return 4;
  if (nearMiss) return 3;
  return 0;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
