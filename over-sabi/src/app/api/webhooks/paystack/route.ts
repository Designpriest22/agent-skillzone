import { env } from "@/lib/env";
import { recordProviderEvent } from "@/lib/analytics";
import { verifyPaystackSignature } from "@/lib/payments/paystack";
import { handlePaystackEvent } from "@/lib/payments/service";

/**
 * Paystack webhook. Signature is verified against the RAW body before parsing.
 * Not cookie-authenticated, so no Origin check; the HMAC is the authentication.
 */
export async function POST(req: Request) {
  const secret = env().PAYSTACK_SECRET_KEY;
  if (!secret) return new Response("payments not configured", { status: 503 });
  const raw = await req.text();
  if (!verifyPaystackSignature(raw, req.headers.get("x-paystack-signature"), secret)) {
    await recordProviderEvent({
      provider: "paystack",
      capability: "payments",
      ok: false,
      error: "invalid webhook signature",
    });
    return new Response("invalid signature", { status: 401 });
  }
  try {
    const outcome = await handlePaystackEvent(JSON.parse(raw));
    return Response.json({ received: true, outcome });
  } catch (err) {
    await recordProviderEvent({
      provider: "paystack",
      capability: "payments",
      ok: false,
      error: String(err),
    });
    // 500 makes Paystack retry later.
    return new Response("processing error", { status: 500 });
  }
}
