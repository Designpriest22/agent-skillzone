import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

const API = "https://api.paystack.co";

/** Paystack signs webhooks with HMAC-SHA512 of the raw body, keyed by the secret key. */
export function verifyPaystackSignature(
  rawBody: string,
  signature: string | null,
  secretKey: string,
): boolean {
  if (!signature) return false;
  const expected = createHmac("sha512", secretKey).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function initializeTransaction(
  secretKey: string,
  input: {
    email: string;
    amountMinor: number;
    currency: string;
    callbackUrl: string;
    metadata: Record<string, string>;
  },
): Promise<{ authorizationUrl: string; reference: string }> {
  const res = await fetch(`${API}/transaction/initialize`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: input.email,
      amount: input.amountMinor,
      currency: input.currency,
      callback_url: input.callbackUrl,
      metadata: input.metadata,
    }),
  });
  const data = (await res.json()) as {
    status: boolean;
    message?: string;
    data?: { authorization_url: string; reference: string };
  };
  if (!res.ok || !data.status || !data.data)
    throw new Error(`Paystack initialize failed: ${data.message ?? res.status}`);
  return { authorizationUrl: data.data.authorization_url, reference: data.data.reference };
}


/** Server-side confirmation: a webhook alone is never trusted without this lookup. */
export async function verifyTransaction(
  secretKey: string,
  reference: string,
): Promise<{ status: string; amount: number; currency: string; reference: string; metadata: Record<string, unknown> }> {
  const res = await fetch(`${API}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  const data = (await res.json()) as { status: boolean; message?: string; data?: { status: string; amount: number; currency: string; reference: string; metadata: Record<string, unknown> } };
  if (!res.ok || !data.status || !data.data) throw new Error(`Paystack verify failed: ${data.message ?? res.status}`);
  return data.data;
}
