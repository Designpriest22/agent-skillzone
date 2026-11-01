import { createHmac, timingSafeEqual } from "node:crypto";
import { httpJson } from "./http";
import { requireCredentials, getCredentials } from "./registry";

const GRAPH = "https://graph.facebook.com/v21.0";

/** Free-form text only works inside the 24h customer-service window; otherwise use an approved template. */
export async function sendWhatsApp(opts: { to: string; text?: string; template?: { name: string; language: string; params?: string[] } }) {
  const c = await requireCredentials("whatsapp");
  const to = opts.to.replace(/[^\d]/g, "");
  const body = opts.template
    ? {
        messaging_product: "whatsapp", to, type: "template",
        template: {
          name: opts.template.name, language: { code: opts.template.language },
          components: opts.template.params?.length ? [{ type: "body", parameters: opts.template.params.map((t) => ({ type: "text", text: t })) }] : undefined,
        },
      }
    : { messaging_product: "whatsapp", to, type: "text", text: { body: opts.text ?? "" } };
  const res = await httpJson<{ messages?: { id: string }[] }>(`${GRAPH}/${c.phoneNumberId}/messages`, {
    method: "POST", headers: { Authorization: `Bearer ${c.accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  return { messageId: res.messages?.[0]?.id ?? null };
}

export async function verifyMetaSignature(rawBody: string, signatureHeader: string | null): Promise<boolean> {
  const c = (await getCredentials("whatsapp")) ?? (await getCredentials("meta"));
  const secret = c?.appSecret || process.env.META_APP_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production"; // allow unsigned only in development
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const expected = Buffer.from(createHmac("sha256", secret).update(rawBody).digest("hex"));
  const got = Buffer.from(signatureHeader.slice(7));
  return expected.length === got.length && timingSafeEqual(expected, got);
}

export async function whatsappClickToChat(prefill: string) {
  const c = await getCredentials("whatsapp");
  const n = (c?.publicNumber || process.env.WHATSAPP_PUBLIC_NUMBER || "").replace(/[^\d]/g, "");
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(prefill)}` : null;
}
