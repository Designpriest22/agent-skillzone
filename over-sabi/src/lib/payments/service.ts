import "server-only";
import { z } from "zod";
import { audit } from "../audit";
import { recordProviderEvent, track } from "../analytics";
import { db } from "../db";
import { env } from "../env";
import { HttpError } from "../http";
import { disableSubscription, initializeTransaction } from "./paystack";

export function paymentsConfigured(): boolean {
  return !!env().PAYSTACK_SECRET_KEY;
}

export async function listPublicPlans() {
  const plans =
    await db()`select code, name, description, features, limits, is_available, sort_order from plans where is_public order by sort_order`;
  const prices =
    await db()`select id, plan_code, provider, currency, amount_minor, billing_interval from plan_prices where active order by amount_minor`;
  type Price = {
    id: string;
    plan_code: string;
    provider: string;
    currency: string;
    amount_minor: string;
    billing_interval: string;
  };
  type Plan = {
    code: string;
    name: string;
    description: string;
    features: string[];
    limits: Record<string, number>;
    is_available: boolean;
    sort_order: number;
  };
  return (plans as unknown as Plan[]).map((p) => ({
    ...p,
    prices: (prices as unknown as Price[]).filter((x) => x.plan_code === p.code),
  }));
}

export async function startCheckout(user: { id: string; email: string }, priceId: string) {
  const secret = env().PAYSTACK_SECRET_KEY;
  if (!secret)
    throw new HttpError(503, "Payments aren't switched on yet. No charge was made.", "payments_unconfigured");
  const [price] = await db()`
    select pp.*, p.is_available from plan_prices pp join plans p on p.code = pp.plan_code
    where pp.id = ${priceId} and pp.active`;
  if (!price || !price.is_available) throw new HttpError(404, "That plan isn't available.", "not_found");
  try {
    const { authorizationUrl, reference } = await initializeTransaction(secret, {
      email: user.email,
      amountMinor: Number(price.amount_minor),
      currency: price.currency,
      planCode: price.provider_plan_code,
      callbackUrl: `${env().APP_URL}/billing/return`,
      metadata: { user_id: user.id, plan_code: price.plan_code, price_id: price.id },
    });
    await track("checkout_started", { userId: user.id, props: { plan: price.plan_code } });
    await audit(user.id, "checkout_started", "plan_price", price.id, { reference });
    return authorizationUrl;
  } catch (err) {
    await recordProviderEvent({
      provider: "paystack",
      capability: "payments",
      ok: false,
      error: String(err),
    });
    throw new HttpError(
      502,
      "We couldn't reach the payment provider. No charge was made — try again shortly.",
      "payments_failed",
    );
  }
}

const eventSchema = z.object({ event: z.string(), data: z.record(z.string(), z.unknown()) });
type Data = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * Applies a verified Paystack webhook. Idempotent: each event is stored once by
 * (provider, event_key) and a replay is acknowledged without re-applying.
 */
export async function handlePaystackEvent(payload: unknown): Promise<"applied" | "duplicate" | "ignored"> {
  const { event, data } = eventSchema.parse(payload) as { event: string; data: Data };
  const eventKey = `${event}:${data.id ?? data.reference ?? data.subscription_code ?? JSON.stringify(data).length}`;
  return db().begin(async (tx) => {
    const inserted = await tx`
      insert into payment_events (provider, event_key, type, payload) values ('paystack', ${eventKey}, ${event}, ${tx.json(payload as never)})
      on conflict (provider, event_key) do nothing returning id`;
    if (!inserted.length) return "duplicate" as const;

    const findUser = async (): Promise<string | null> => {
      const metaUser = data.metadata?.user_id;
      if (typeof metaUser === "string") {
        const [u] = await tx`select id from users where id = ${metaUser}`;
        if (u) return u.id;
      }
      const email = data.customer?.email;
      if (typeof email === "string") {
        const [u] = await tx`select id from users where email = ${email}`;
        if (u) return u.id;
      }
      return null;
    };
    const planFromCode = async (code: unknown) => {
      if (typeof code !== "string") return null;
      const [p] =
        await tx`select plan_code, billing_interval from plan_prices where provider = 'paystack' and provider_plan_code = ${code}`;
      return p ?? null;
    };

    let outcome: "applied" | "ignored" = "ignored";
    if (event === "charge.success") {
      const userId = await findUser();
      const plan = await planFromCode(data.plan?.plan_code ?? data.plan);
      if (userId && plan) {
        const period = plan.billing_interval === "annually" ? "1 year" : "1 month";
        const customer = data.customer?.customer_code ?? null;
        const [existing] = await tx`
          select id from subscriptions where user_id = ${userId} and provider = 'paystack' and plan_code = ${plan.plan_code}
          order by created_at desc limit 1`;
        if (existing) {
          await tx`update subscriptions set status = 'active', provider_customer_code = coalesce(${customer}, provider_customer_code),
            current_period_end = greatest(coalesce(current_period_end, now()), now()) + ${period}::interval, updated_at = now()
            where id = ${existing.id}`;
        } else {
          await tx`insert into subscriptions (user_id, plan_code, provider, provider_customer_code, status, current_period_end)
            values (${userId}, ${plan.plan_code}, 'paystack', ${customer}, 'active', now() + ${period}::interval)`;
        }
        await tx`insert into notifications (user_id, kind, title, body, link)
          values (${userId}, 'billing', 'Your plan is active', 'Thanks for supporting Over Sabi. Your new limits apply now.', '/settings/billing')`;
        outcome = "applied";
        await track("subscription_activated", { userId, props: { plan: plan.plan_code } });
      }
    } else if (event === "subscription.create") {
      const userId = await findUser();
      const plan = await planFromCode(data.plan?.plan_code);
      if (userId && plan) {
        await tx`
          update subscriptions set provider_subscription_code = ${data.subscription_code ?? null},
            provider_meta = provider_meta || ${tx.json({ email_token: data.email_token ?? null })},
            current_period_end = coalesce(${data.next_payment_date ?? null}::timestamptz, current_period_end), updated_at = now()
          where id = (select id from subscriptions where user_id = ${userId} and provider = 'paystack' and plan_code = ${plan.plan_code}
                      order by created_at desc limit 1)`;
        outcome = "applied";
      }
    } else if (
      event === "subscription.not_renew" ||
      event === "subscription.disable" ||
      event === "invoice.payment_failed"
    ) {
      const code = data.subscription_code ?? data.subscription?.subscription_code;
      const status =
        event === "subscription.not_renew"
          ? "non_renewing"
          : event === "subscription.disable"
            ? "cancelled"
            : "past_due";
      if (typeof code === "string") {
        const r =
          await tx`update subscriptions set status = ${status}, updated_at = now() where provider = 'paystack' and provider_subscription_code = ${code}`;
        outcome = r.count ? "applied" : "ignored";
      }
    }
    await tx`update payment_events set processed_at = now() where provider = 'paystack' and event_key = ${eventKey}`;
    return outcome;
  });
}

export async function cancelSubscription(userId: string) {
  const [sub] = await db()`
    select id, provider_subscription_code, provider_meta from subscriptions
    where user_id = ${userId} and provider = 'paystack' and status = 'active' order by created_at desc limit 1`;
  if (!sub) throw new HttpError(404, "You don't have an active paid subscription.", "not_found");
  const secret = env().PAYSTACK_SECRET_KEY;
  if (!secret || !sub.provider_subscription_code || !sub.provider_meta?.email_token) {
    throw new HttpError(
      409,
      "We can't cancel this automatically yet. Contact support and we'll do it for you.",
      "cancel_unavailable",
    );
  }
  await disableSubscription(secret, sub.provider_subscription_code, sub.provider_meta.email_token);
  // Access continues until the paid period ends; Paystack's webhook confirms the change.
  await db()`update subscriptions set status = 'non_renewing', updated_at = now() where id = ${sub.id}`;
  await audit(userId, "subscription_cancel_requested", "subscription", sub.id);
}
