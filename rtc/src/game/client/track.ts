/**
 * First-party, anonymous gameplay analytics. A random id lives in localStorage; no IP, fingerprint or location
 * is collected. Events are batched and sent every 10s or when the tab is hidden. Off in the offline preview,
 * when the browser sends Do Not Track, or when the player turns it off in Settings.
 */
import type { EventName, EventProps } from "./events";
import { isPreview } from "./assets";

const OPT = "rtc.analytics.v1";
const ANON = "rtc.anon.v1";
const LAST = "rtc.lastSeen.v1";
type Queued = { name: EventName; at: number; props: Record<string, unknown> };

let queue: Queued[] = [];
let timer = 0;
let ids: { anonId: string; sessionId: string; platform: "desktop" | "mobile" | "tablet" } | null = null;

const rid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`);
const store = { get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* storage blocked */ } } };

export function analyticsEnabled() {
  if (typeof window === "undefined" || isPreview()) return false;
  if (navigator.doNotTrack === "1") return false;
  return store.get(OPT) !== "off";
}
export function setAnalyticsEnabled(on: boolean) { store.set(OPT, on ? "on" : "off"); if (!on) queue = []; }

function platform(): "desktop" | "mobile" | "tablet" {
  const coarse = matchMedia("(pointer: coarse)").matches;
  if (!coarse) return "desktop";
  return Math.min(screen.width, screen.height) >= 600 ? "tablet" : "mobile";
}

function init() {
  if (ids) return ids;
  let anonId = store.get(ANON);
  if (!anonId) { anonId = rid(); store.set(ANON, anonId); }
  ids = { anonId, sessionId: rid(), platform: platform() };
  addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flush(true); });
  addEventListener("pagehide", () => flush(true));
  return ids;
}

export function track<N extends EventName>(name: N, props: EventProps<N>) {
  if (!analyticsEnabled()) return;
  init();
  queue.push({ name, at: Date.now(), props: props as Record<string, unknown> });
  if (queue.length >= 40) flush();
  else if (!timer) timer = window.setTimeout(() => flush(), 10_000);
}

export function flush(beacon = false) {
  if (timer) { clearTimeout(timer); timer = 0; }
  if (!queue.length || !ids) return;
  const body = JSON.stringify({ ...ids, events: queue.splice(0, 50) });
  if (beacon && navigator.sendBeacon) { navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" })); return; }
  void fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true, credentials: "same-origin" }).catch(() => {});
}

/** Session start: traffic source from ?src= or utm_source only (never the full referrer URL). */
export function trackSessionStart() {
  if (!analyticsEnabled()) return;
  const q = new URLSearchParams(location.search);
  const raw = (q.get("src") ?? q.get("utm_source") ?? "").toLowerCase().replace(/[^a-z0-9_.-]/g, "").slice(0, 40);
  let source = raw;
  if (!source && document.referrer) { try { source = new URL(document.referrer).hostname.replace(/^www\./, "").slice(0, 40); } catch { /* ignore */ } }
  if (source === location.hostname) source = "";
  const last = Number(store.get(LAST) ?? 0);
  store.set(LAST, String(Date.now()));
  track("session_started", { source, returning: last > 0 });
}
