import "server-only";
import { db, withUser } from "./db";
import { HttpError } from "./http";

export interface PlanLimits {
  daily_ai_turns: number;
  max_session_minutes: number;
  daily_tts_chars: number;
  daily_stt_seconds: number;
  history_days: number;
  seats?: number;
}

export interface Entitlement {
  planCode: string;
  planName: string;
  limits: PlanLimits;
  subscription: { status: string; provider: string; currentPeriodEnd: string | null } | null;
}

/**
 * Resolves the learner's plan from the subscriptions table, which only verified
 * payment webhooks and audited admin actions can write. Read through the learner role
 * so RLS applies.
 */
export async function getEntitlement(userId: string): Promise<Entitlement> {
  return withUser(userId, async (tx) => {
    const [sub] = await tx`
      select s.plan_code, s.status, s.provider, s.current_period_end
      from subscriptions s
      where s.user_id = ${userId} and s.status in ('active', 'non_renewing', 'past_due')
        and (s.current_period_end is null or s.current_period_end > now())
      order by s.current_period_end desc nulls first
      limit 1`;
    const code = sub?.plan_code ?? "free";
    const [plan] = await tx`select code, name, limits from plans where code = ${code}`;
    if (!plan) throw new Error(`Plan ${code} missing`);
    return {
      planCode: plan.code,
      planName: plan.name,
      limits: plan.limits as PlanLimits,
      subscription: sub
        ? {
            status: sub.status,
            provider: sub.provider,
            currentPeriodEnd: sub.current_period_end?.toISOString() ?? null,
          }
        : null,
    };
  });
}

type Counter = "ai_turns" | "stt_seconds" | "tts_chars" | "sessions";
const LIMIT_FOR: Partial<Record<Counter, keyof PlanLimits>> = {
  ai_turns: "daily_ai_turns",
  stt_seconds: "daily_stt_seconds",
  tts_chars: "daily_tts_chars",
};

/**
 * Atomically consumes daily usage. Throws 402 when the plan's daily allowance would be
 * exceeded. Usage counters are written by the privileged connection only.
 */
export async function consumeUsage(
  userId: string,
  counter: Counter,
  amount: number,
  limits: PlanLimits,
): Promise<void> {
  const limitKey = LIMIT_FOR[counter];
  // Counters without a plan limit (e.g. sessions) still get a sane ceiling that fits an int4.
  const limit = limitKey ? (limits[limitKey] as number) : 1_000_000;
  if (amount > limit) {
    throw new HttpError(402, "That request is larger than your plan's daily allowance.", "usage_limit");
  }
  const col = db()(counter);
  const rows = await db()`
    insert into usage_counters (user_id, day, ${col}) values (${userId}, current_date, ${amount})
    on conflict (user_id, day) do update set ${col} = usage_counters.${col} + ${amount}
    where usage_counters.${col} + ${amount} <= ${limit}
    returning ${col} as value`;
  if (!rows.length || (rows[0]!.value as number) > limit) {
    throw new HttpError(
      402,
      "You've used today's practice allowance on your plan. It resets tomorrow — or upgrade for more.",
      "usage_limit",
    );
  }
}

export async function getUsageToday(userId: string) {
  return withUser(userId, async (tx) => {
    const [u] =
      await tx`select ai_turns, stt_seconds, tts_chars, sessions from usage_counters where user_id = ${userId} and day = current_date`;
    return {
      ai_turns: u?.ai_turns ?? 0,
      stt_seconds: u?.stt_seconds ?? 0,
      tts_chars: u?.tts_chars ?? 0,
      sessions: u?.sessions ?? 0,
    };
  });
}
