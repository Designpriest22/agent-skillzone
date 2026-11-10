/** Thin API client. Finished runs that fail to submit (bad network) are queued and retried. */
import type { RunResult } from "../sim/sim";

export class ApiError extends Error { constructor(public status: number, message: string, public code: string) { super(message); } }

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) }, credentials: "same-origin" });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string; code?: string };
  if (!res.ok) throw new ApiError(res.status, data.error ?? "Network error", data.code ?? "error");
  return data;
}

export const api = {
  me: () => call<MeResponse>("/api/me"),
  patchMe: (body: Record<string, unknown>) => call("/api/me", { method: "PATCH", body: JSON.stringify(body) }),
  signUp: (body: { email: string; password: string; username: string; homeArea: string; fighter: string }) => call("/api/auth/signup", { method: "POST", body: JSON.stringify(body) }),
  signIn: (body: { email: string; password: string }) => call("/api/auth/signin", { method: "POST", body: JSON.stringify(body) }),
  signOut: () => call("/api/auth/signout", { method: "POST", body: "{}" }),
  startRun: (body: { substage: string; fighter: string; equipment: string | null }) => call<{ runId: string; seed: number; equipment: string | null }>("/api/runs/start", { method: "POST", body: JSON.stringify(body) }),
  finishRun: (body: FinishBody) => call<FinishOutcome>("/api/runs/finish", { method: "POST", body: JSON.stringify(body) }),
  leaderboard: (board: string, extra = "") => call<{ rows: BoardRow[]; at: string }>(`/api/leaderboard?board=${board}${extra}`),
  buy: (itemId: string) => call<{ cash: number }>("/api/store/buy", { method: "POST", body: JSON.stringify({ itemId }) }),
  checkout: (itemId: string) => call<{ authorizationUrl: string }>("/api/store/checkout", { method: "POST", body: JSON.stringify({ itemId }) }),
  player: (u: string) => call<Record<string, unknown>>(`/api/players/${encodeURIComponent(u)}`),
  purchases: () => call<{ purchases: { reference: string; itemId: string; status: string; amount: number; at: string }[] }>("/api/store/purchases"),
  report: (u: string, reason: string) => call(`/api/players/${encodeURIComponent(u)}/report`, { method: "POST", body: JSON.stringify({ reason }) }),
  react: (u: string, kind: string) => call(`/api/players/${encodeURIComponent(u)}/react`, { method: "POST", body: JSON.stringify({ kind }) }),
};

export interface FinishBody { runId: string; inputs: string; claimed: { score: number; ticks: number; cleared: boolean } }
export interface FinishOutcome { verified: boolean; reason?: string; result?: RunResult; rewards: { label: string; xp: number; cash: number }[]; achievements: string[]; unlocked: string[]; rankUp: string | null; profile?: { xp: number; cash: number; rank: string } }
export interface BoardRow { position: number; username: string; avatar: string; area: string; value: number; rank: string; level: number; rating: string | null }
export interface MeResponse {
  user: { username: string } | null;
  profile?: { username: string; avatar: string; homeArea: string; selectedFighter: string; equipment: string | null; xp: number; cash: number; level: number; rank: { rank: number; name: string; next: { name: string; xp: number } | null }; stats: Record<string, number> };
  fighters?: string[]; achievements?: string[]; inventory?: { id: string; source: string }[];
  missions?: { id: string; name: string; desc: string; period: string; xp: number; cash: number; done: boolean }[];
  history?: { amount: number; reason: string; ref: string; at: string }[];
  bests?: Record<string, { score: number; rating: string; clears: number }>;
  unlockedStages?: string[];
}

const QUEUE = "rtc.pendingRuns.v1";
export function queueRun(body: FinishBody) {
  try { const q = JSON.parse(localStorage.getItem(QUEUE) ?? "[]") as FinishBody[]; q.push(body); localStorage.setItem(QUEUE, JSON.stringify(q.slice(-5))); } catch { /* storage blocked */ }
}
export async function flushQueue(): Promise<number> {
  let q: FinishBody[] = [];
  try { q = JSON.parse(localStorage.getItem(QUEUE) ?? "[]"); } catch { return 0; }
  const keep: FinishBody[] = [];
  let sent = 0;
  for (const b of q) {
    try { await api.finishRun(b); sent++; } catch (e) { if (!(e instanceof ApiError) || e.status >= 500) keep.push(b); }
  }
  try { localStorage.setItem(QUEUE, JSON.stringify(keep)); } catch { /* storage blocked */ }
  return sent;
}
