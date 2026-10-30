import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/Button";
import { Notice, PageHeader } from "@/components/ui/primitives";
import { requirePageUser } from "@/lib/auth/guards";
import { getEntitlement } from "@/lib/entitlements";

export const metadata: Metadata = { title: "Payment" };
export const dynamic = "force-dynamic";

/**
 * Where Paystack sends the learner after checkout. We never mark a payment as
 * successful from this redirect; only the signed webhook activates a plan.
 */
export default async function BillingReturnPage() {
  const user = await requirePageUser();
  const ent = await getEntitlement(user.id);
  const active = ent.planCode !== "free";
  return (
    <div>
      <PageHeader title={active ? "Your plan is active" : "We're confirming your payment"} />
      {active ? (
        <Notice tone="success" title={`You're on ${ent.planName}.`}>
          Your new limits apply now. Thank you for supporting Over Sabi.
        </Notice>
      ) : (
        <Notice tone="info" title="This usually takes a few seconds.">
          We activate your plan as soon as Paystack confirms the payment to us. Refresh this page in a moment.
          If you were charged and nothing changes within an hour, contact support — we&apos;ll sort it out.
        </Notice>
      )}
      <ButtonLink href="/settings#billing" className="mt-6">
        Go to plan & usage
      </ButtonLink>
    </div>
  );
}
