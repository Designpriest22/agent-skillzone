import "server-only";
import { audit } from "../audit";
import { destroySession } from "../auth/session";
import { db, withUser } from "../db";
import { HttpError } from "../http";
import { createHash } from "node:crypto";
import { env } from "../env";
import { disableSubscription } from "../payments/paystack";

/** Everything we hold about a learner, as JSON (Settings → Privacy → Download my data). */
export async function exportUserData(userId: string) {
  return withUser(userId, async (tx) => {
    const [user] =
      await tx`select id, email, display_name, role, email_verified_at, created_at from users where id = ${userId}`;
    const [profile] = await tx`select * from profiles where user_id = ${userId}`;
    return {
      exportedAt: new Date().toISOString(),
      notice: "This file contains your Over Sabi account data. Keep it safe.",
      user,
      profile,
      learningPlans: await tx`select * from learning_plans where user_id = ${userId}`,
      lessonProgress: await tx`select * from lesson_progress where user_id = ${userId}`,
      activityAttempts:
        await tx`select lesson_id, activity_id, correct, near_miss, score, response, created_at from activity_attempts where user_id = ${userId}`,
      vocabulary: await tx`
        select uv.*, v.text, v.translation from user_vocabulary uv left join vocabulary v on v.id = uv.vocab_id where uv.user_id = ${userId}`,
      sessions:
        await tx`select id, language_code, tutor_id, mode, settings, status, started_at, ended_at, duration_seconds, turn_count, summary from learning_sessions where user_id = ${userId}`,
      transcripts:
        await tx`select session_id, seq, role, text, translation, input_mode, created_at from conversation_turns where user_id = ${userId} and not coalesce((meta->>'hidden')::boolean, false) order by session_id, seq`,
      feedback: await tx`select * from feedback_items where user_id = ${userId}`,
      xp: await tx`select amount, reason, local_date, created_at from xp_events where user_id = ${userId}`,
      streak: await tx`select * from streaks where user_id = ${userId}`,
      achievements: await tx`select code, earned_at from user_achievements where user_id = ${userId}`,
      subscriptions:
        await tx`select plan_code, provider, status, current_period_end, created_at from subscriptions where user_id = ${userId}`,
      contributions:
        await tx`select id, language_code, kind, payload, status, created_at from content_contributions where contributor_id = ${userId}`,
    };
  });
}

/**
 * Permanently deletes a learner. Learning data cascades with the user row. Accepted
 * content contributions stay (they are part of the shared curriculum) but lose their
 * link to the person; analytics events are anonymised by the FK's ON DELETE SET NULL.
 * The audit trail records a one-way hash, not the email.
 */
export async function deleteAccount(userId: string, confirmEmail: string) {
  const [u] = await db()`select email from users where id = ${userId}`;
  if (!u) throw new HttpError(404, "Account not found.", "not_found");
  if (String(u.email).toLowerCase() !== confirmEmail.trim().toLowerCase()) {
    throw new HttpError(400, "Type your account email exactly to confirm.", "confirm_mismatch");
  }
  const [active] = await db()`
    select provider_subscription_code, provider_meta from subscriptions
    where user_id = ${userId} and provider = 'paystack' and status = 'active' and current_period_end > now()
    order by created_at desc limit 1`;
  // Best effort: stop future renewals before the account (and its link to the payment) disappears.
  let renewalStopped = false;
  const secret = env().PAYSTACK_SECRET_KEY;
  if (active && secret && active.provider_subscription_code && active.provider_meta?.email_token) {
    try {
      await disableSubscription(secret, active.provider_subscription_code, active.provider_meta.email_token);
      renewalStopped = true;
    } catch {
      renewalStopped = false;
    }
  }
  const ref = createHash("sha256").update(`${userId}`).digest("hex").slice(0, 16);
  await destroySession();
  await db().begin(async (tx) => {
    await tx`delete from content_contributions where contributor_id = ${userId} and status = 'pending'`;
    await tx`delete from support_requests where user_id = ${userId}`;
    await tx`delete from users where id = ${userId}`;
    await audit(
      null,
      "account_deleted",
      "user",
      ref,
      { hadActiveSubscription: !!active, renewalStopped },
      tx,
    );
  });
  return { hadActiveSubscription: !!active && !renewalStopped };
}
