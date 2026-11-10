"use client";
import { useState } from "react";
import { api, ApiError } from "@/game/client/api";

/** Respect / fire / rematch reactions and the report button. The server rate-limits both and requires sign-in. */
export function ProfileActions({ username }: { username: string }) {
  const [msg, setMsg] = useState<string | null>(null);
  const run = async (fn: () => Promise<unknown>, ok: string) => {
    try { await fn(); setMsg(ok); } catch (e) { setMsg(e instanceof ApiError ? (e.status === 401 ? "Sign in on the game page first." : e.message) : "Couldn't reach the server."); }
  };
  return (
    <div className="row">
      <button className="btn small" onClick={() => run(() => api.react(username, "respect"), "Respect sent.")}>Respect</button>
      <button className="btn small" onClick={() => run(() => api.react(username, "fire"), "🔥 sent.")}>🔥</button>
      <button className="btn small ghost" onClick={() => run(() => api.react(username, "rematch"), "Rematch request sent.")}>Rematch</button>
      <button className="btn small ghost" onClick={() => { const r = prompt("What's wrong with this profile?"); if (r) void run(() => api.report(username, r), "Thanks. A moderator will look at it."); }}>Report</button>
      {msg && <span className="muted" role="status">{msg}</span>}
    </div>
  );
}
