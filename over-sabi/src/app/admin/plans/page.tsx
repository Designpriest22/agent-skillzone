import { AdminButton, AdminForm } from "@/components/admin/AdminControls";
import { Card, Notice, PageHeader } from "@/components/ui/primitives";
import { requireAdminPage } from "@/lib/auth/admin-guard";
import { db } from "@/lib/db";
import { paymentsConfigured } from "@/lib/payments/service";

export const metadata = { title: "Plans" };
export const dynamic = "force-dynamic";

export default async function AdminPlansPage() {
  await requireAdminPage("admin");
  const plans = await db()`select * from plans order by sort_order`;
  const prices = await db()`select * from plan_prices order by plan_code, amount_minor`;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Monetisation" title="Plans, prices and limits">
        Prices live here, not in code. Create the matching plan in your Paystack dashboard first and paste its
        plan code.
      </PageHeader>
      {!paymentsConfigured() ? (
        <Notice tone="warning" title="Payments not configured">
          PAYSTACK_SECRET_KEY isn&apos;t set, so checkout is disabled for learners.
        </Notice>
      ) : null}
      {plans.map((p) => (
        <Card key={p.code} className="flex flex-col gap-4">
          <p className="font-display text-xl font-bold">
            {p.name} <span className="font-mono text-xs text-muted">{p.code}</span>
          </p>
          <AdminForm
            action="update_plan"
            fixed={{ code: p.code }}
            submitLabel="Save limits"
            fields={[
              {
                name: "daily_ai_turns",
                label: "Tutor replies / day",
                type: "number",
                defaultValue: p.limits.daily_ai_turns,
              },
              {
                name: "max_session_minutes",
                label: "Max session minutes",
                type: "number",
                defaultValue: p.limits.max_session_minutes,
              },
              {
                name: "daily_stt_seconds",
                label: "Voice input seconds / day",
                type: "number",
                defaultValue: p.limits.daily_stt_seconds,
              },
              {
                name: "daily_tts_chars",
                label: "AI voice characters / day",
                type: "number",
                defaultValue: p.limits.daily_tts_chars,
              },
              {
                name: "is_available",
                label: "Available to buy",
                type: "checkbox",
                defaultValue: p.is_available,
              },
            ]}
          />
          {p.code !== "free" ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold">Prices</p>
              {prices
                .filter((x) => x.plan_code === p.code)
                .map((x) => (
                  <p key={x.id} className="flex items-center gap-3 text-sm">
                    {x.currency} {(Number(x.amount_minor) / 100).toFixed(2)} / {x.billing_interval} ·{" "}
                    {x.provider_plan_code} · {x.active ? "active" : "inactive"}
                    {x.active ? (
                      <AdminButton
                        action="deactivate_price"
                        input={{ id: x.id }}
                        label="Deactivate"
                        variant="ghost"
                        confirm="Stop offering this price? Existing subscribers keep it."
                      />
                    ) : null}
                  </p>
                ))}
              <AdminForm
                action="add_price"
                fixed={{ planCode: p.code }}
                submitLabel="Add price"
                fields={[
                  { name: "currency", label: "Currency (e.g. NGN)", defaultValue: "NGN" },
                  {
                    name: "amountMinor",
                    label: "Amount in minor units (kobo/cents)",
                    type: "number",
                    defaultValue: "",
                  },
                  {
                    name: "interval",
                    label: "Interval",
                    type: "select",
                    options: ["monthly", "annually"],
                    defaultValue: "monthly",
                  },
                  { name: "providerPlanCode", label: "Paystack plan code (PLN_…)", defaultValue: "" },
                ]}
              />
            </div>
          ) : null}
        </Card>
      ))}
    </div>
  );
}
