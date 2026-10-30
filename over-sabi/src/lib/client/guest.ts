"use client";

/**
 * Guest progress lives in localStorage until the learner creates an account, then it
 * is merged server-side. Every access is wrapped: storage can be unavailable.
 */
const KEY = "oversabi.guest.v1";

export interface GuestProgress {
  completedLessons: { lessonId: string; score: number }[];
  savedVocabIds: string[];
  onboarding?: {
    language?: string;
    level?: string;
    goals?: string[];
    explanationLanguage?: string;
    dailyGoalMinutes?: number;
  };
  anonymousId?: string;
}

const empty = (): GuestProgress => ({ completedLessons: [], savedVocabIds: [] });

export function readGuestProgress(): GuestProgress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const p = JSON.parse(raw) as GuestProgress;
    return { ...empty(), ...p };
  } catch {
    return empty();
  }
}

export function writeGuestProgress(update: (p: GuestProgress) => GuestProgress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(update(readGuestProgress())));
  } catch {
    /* private mode or storage full: progress just won't persist */
  }
}

export function clearGuestProgress() {
  try {
    const p = readGuestProgress();
    localStorage.setItem(KEY, JSON.stringify({ ...empty(), anonymousId: p.anonymousId }));
  } catch {
    /* ignore */
  }
}

export function anonymousId(): string {
  const p = readGuestProgress();
  if (p.anonymousId) return p.anonymousId;
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  writeGuestProgress((g) => ({ ...g, anonymousId: id }));
  return id;
}
