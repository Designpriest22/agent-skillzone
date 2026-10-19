import "server-only";
import { db } from "./db";

/**
 * First-party, privacy-conscious product analytics. No third-party trackers, no IP
 * addresses, no free text from learners. Learners can opt out in Settings → Privacy.
 */
export type AnalyticsEvent =
  | "onboarding_completed"
  | "lesson_started"
  | "lesson_completed"
  | "first_lesson_completed"
  | "speaking_session_started"
  | "speaking_session_completed"
  | "first_speaking_session"
  | "review_completed"
  | "vocab_saved"
  | "signup"
  | "checkout_started"
  | "subscription_activated"
  | "translation_reported"
  | "guest_lesson_completed";

export async function track(
  name: AnalyticsEvent,
  opts: {
    userId?: string | null;
    anonymousId?: string | null;
    language?: string | null;
    props?: Record<string, string | number | boolean>;
  } = {},
) {
  try {
    if (opts.userId) {
      const [p] = await db()`select analytics_opt_out from profiles where user_id = ${opts.userId}`;
      if (p?.analytics_opt_out) return;
    }
    await db()`
      insert into analytics_events (user_id, anonymous_id, name, language_code, props)
      values (${opts.userId ?? null}, ${opts.anonymousId ?? null}, ${name}, ${opts.language ?? null}, ${db().json(opts.props ?? {})})`;
  } catch (err) {
    // Analytics must never break a learner's request.
    console.warn("[analytics] dropped event", name, err);
  }
}

export async function recordProviderEvent(e: {
  provider: string;
  capability: "chat" | "stt" | "tts" | "email" | "payments" | "storage";
  language?: string | null;
  ok: boolean;
  latencyMs?: number;
  error?: string;
  costUsd?: number;
}) {
  try {
    await db()`
      insert into provider_events (provider, capability, language_code, ok, latency_ms, error, cost_estimate_usd)
      values (${e.provider}, ${e.capability}, ${e.language ?? null}, ${e.ok}, ${e.latencyMs ?? null},
              ${e.error?.slice(0, 500) ?? null}, ${e.costUsd ?? null})`;
  } catch (err) {
    console.warn("[provider-events] dropped", err);
  }
}
