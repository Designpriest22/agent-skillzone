import type { Metadata } from "next";
import { CheckoutButton } from "@/components/site/CheckoutButton";
import { ButtonLink } from "@/components/ui/Button";
import { Badge, Card, Notice, PageHeader } from "@/components/ui/primitives";
import { getCurrentUser } from "@/lib/auth/session";
import { listPublicPlans, paymentsConfigured } from "@/lib/payments/service";

export const metadata: Metadata = { title: "Pricing" };
export const dynamic = "force-dynamic";

function money(amountMinor: number, currency: string) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(
    amountMinor / 100,
  );
}

export default async function PricingPage() {
  const [plans, user] = await Promise.all([listPublicPlans(), getCurrentUser()]);
  const live = paymentsConfigured();
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <PageHeader eyebrow="Pricing" title="Start free. Upgrade when you're hooked.">
        Prices are shown in your billing currency at checkout. Payments are processed by Paystack.
      </PageHeader>
      {!live ? (
        <Notice tone="info" title="Paid plans aren't on sale yet" className="mb-8">
          Checkout is switched off on this server, so no payment can be taken. Everything in the Free plan
          works today.
        </Notice>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((p) => {
          const limits = p.limits as Record<string, number>;
          return (
            <Card
              key={p.code as string}
              className={`flex flex-col gap-4 ${p.code === "plus" ? "border-2 border-primary" : ""}`}
            >
              <div>
                <p className="font-display text-2xl font-extrabold">{p.name as string}</p>
                <p className="text-sm text-muted">{p.description as string}</p>
              </div>
              {p.code === "free" ? (
                <p className="font-display text-3xl font-extrabold">Free</p>
              ) : (p.prices as { amount_minor: string; currency: string; billing_interval: string }[])
                  .length ? (
                <ul className="flex flex-col gap-1">
                  {(
                    p.prices as {
                      id: string;
                      amount_minor: string;
                      currency: string;
                      billing_interval: string;
                    }[]
                  ).map((pr) => (
                    <li key={pr.id}>
                      <span className="font-display text-2xl font-extrabold">
                        {money(Number(pr.amount_minor), pr.currency)}
                      </span>
                      <span className="text-sm text-muted">
                        {" "}
                        / {pr.billing_interval === "annually" ? "year" : "month"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">{p.is_available ? "Price not set yet" : "Coming soon"}</p>
              )}
              <ul className="flex flex-1 list-disc flex-col gap-1 pl-5 text-sm">
                {(p.features as string[]).map((f) => (
                  <li key={f}>{f}</li>
                ))}
                {p.code !== "institution" ? (
                  <li>
                    {limits.daily_ai_turns} tutor replies a day, sessions up to {limits.max_session_minutes}{" "}
                    min
                  </li>
                ) : null}
              </ul>
              {p.code === "free" ? (
                <ButtonLink href={user ? "/home" : "/start"} variant="secondary">
                  {user ? "You're on it" : "Start free"}
                </ButtonLink>
              ) : !p.is_available ? (
                <Badge className="self-start">Coming soon</Badge>
              ) : p.code === "institution" ? (
                <ButtonLink href="/help#contact" variant="secondary">
                  Talk to us
                </ButtonLink>
              ) : live && user ? (
                (p.prices as { id: string; billing_interval: string }[]).map((pr) => (
                  <CheckoutButton
                    key={pr.id}
                    priceId={pr.id}
                    label={`Choose ${pr.billing_interval === "annually" ? "yearly" : "monthly"}`}
                  />
                ))
              ) : live ? (
                <ButtonLink href="/signup">Create an account to upgrade</ButtonLink>
              ) : (
                <Badge className="self-start">Not on sale yet</Badge>
              )}
            </Card>
          );
        })}
      </div>
      <section className="mt-12 max-w-3xl text-sm text-muted">
        <h2 className="mb-2 text-lg font-bold text-text">Subscription terms in brief</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Paid plans renew automatically until you cancel. Cancel any time in Settings; you keep access
            until the end of the period you paid for.
          </li>
          <li>Your plan only activates after the payment provider confirms the payment to us.</li>
          <li>Limits (tutor replies, voice minutes) reset daily. AI features need an internet connection.</li>
          <li>Over Sabi courses don&apos;t lead to formal certification. Levels are an approximate guide.</li>
        </ul>
      </section>
    </div>
  );
}
