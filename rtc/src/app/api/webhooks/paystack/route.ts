import { env } from "@/lib/env";
import { verifyPaystackSignature } from "@/lib/paystack";
import { settlePurchase } from "@/lib/services/player";

/** Paystack webhook: HMAC-verified on the raw body, then re-verified against the Paystack API. */
export async function POST(req: Request) {
  const secret = env().PAYSTACK_SECRET_KEY;
  if (!secret) return new Response("payments not configured", { status: 503 });
  const raw = await req.text();
  if (!verifyPaystackSignature(raw, req.headers.get("x-paystack-signature"), secret)) return new Response("invalid signature", { status: 401 });
  try {
    const event = JSON.parse(raw) as { event?: string; data?: { reference?: string } };
    if (event.event === "charge.success" && event.data?.reference) {
      const outcome = await settlePurchase(event.data.reference);
      return Response.json({ received: true, outcome });
    }
    return Response.json({ received: true, outcome: "ignored" });
  } catch (err) {
    console.error("[paystack] webhook error", err);
    return new Response("processing error", { status: 500 });
  }
}
