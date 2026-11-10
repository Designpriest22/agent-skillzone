import { createHmac, timingSafeEqual } from "node:crypto";
import { httpJson } from "./http";
import { requireCredentials, getCredentials } from "./registry";

/** Creates a Paystack transaction and returns the hosted payment URL. Amount is in kobo. */
export async function createPaymentLink(opts: { email: string; amountMinor: number; reference: string; invoiceId: string; callbackUrl?: string }) {
  const c = await requireCredentials("paystack");
  const res = await httpJson<{ status: boolean; data: { authorization_url: string; reference: string } }>("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: { Authorization: `Bearer ${c.secretKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email: opts.email, amount: opts.amountMinor, reference: opts.reference, callback_url: opts.callbackUrl, metadata: { invoice_id: opts.invoiceId } }),
  });
  return { url: res.data.authorization_url, reference: res.data.reference };
}

export async function verifyPaystackSignature(rawBody: string, signature: string | null): Promise<boolean> {
  const c = await getCredentials("paystack");
  if (!c || !signature) return false;
  const expected = Buffer.from(createHmac("sha512", c.secretKey).update(rawBody).digest("hex"));
  const got = Buffer.from(signature);
  return expected.length === got.length && timingSafeEqual(expected, got);
}

/** Re-verify a transaction with Paystack before trusting a webhook (defence in depth). */
export async function verifyTransaction(reference: string) {
  const c = await requireCredentials("paystack");
  const res = await httpJson<{ data: { status: string; amount: number; currency: string; paid_at: string; reference: string; customer: { email: string }; metadata?: { invoice_id?: string } } }>(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${c.secretKey}` } },
  );
  return res.data;
}
