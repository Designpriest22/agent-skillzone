"use client";

import { useSyncExternalStore } from "react";

/**
 * Trip shortlist stored in the visitor's own browser (localStorage). Nothing is
 * sent to a server. Each stop has a slug, a number of days and an optional note.
 */

export type Stop = { slug: string; days: number; note: string };

const KEY = "dn:shortlist:v1";
const listeners = new Set<() => void>();
let cache: Stop[] | null = null;
const EMPTY: Stop[] = [];

function read(): Stop[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    cache = Array.isArray(parsed)
      ? parsed
          .filter((s): s is Stop => typeof s === "object" && s !== null && typeof (s as Stop).slug === "string")
          .map((s) => ({ slug: s.slug, days: Math.min(30, Math.max(1, Number(s.days) || 1)), note: String(s.note ?? "").slice(0, 280) }))
      : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: Stop[]) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage unavailable (private mode): keep the in-memory list for this visit
  }
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      cache = null;
      listeners.forEach((l) => l());
    }
  });
}

export const shortlist = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  get: read,
  has: (slug: string) => read().some((s) => s.slug === slug),
  toggle(slug: string): boolean {
    const cur = read();
    if (cur.some((s) => s.slug === slug)) {
      write(cur.filter((s) => s.slug !== slug));
      return false;
    }
    write([...cur, { slug, days: 1, note: "" }]);
    return true;
  },
  remove: (slug: string) => write(read().filter((s) => s.slug !== slug)),
  move(slug: string, dir: -1 | 1) {
    const cur = [...read()];
    const i = cur.findIndex((s) => s.slug === slug);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= cur.length) return;
    [cur[i], cur[j]] = [cur[j]!, cur[i]!];
    write(cur);
  },
  update(slug: string, patch: Partial<Omit<Stop, "slug">>) {
    write(read().map((s) => (s.slug === slug ? { ...s, ...patch } : s)));
  },
  replace: (stops: Stop[]) => write(stops),
  clear: () => write([]),
};

export function useShortlist(): Stop[] {
  return useSyncExternalStore(shortlist.subscribe, shortlist.get, () => EMPTY);
}
