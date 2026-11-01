/**
 * WhatsApp Business Platform — Cloud API (official). No unofficial automation or scraping.
 *
 * Messaging rules this adapter respects:
 *  - Free-form messages only inside the 24-hour customer-service window (the recipient messaged us last).
 *    Outside it, Meta rejects with error 131047 and an approved template must be used instead.
 *  - Text bodies are limited to 4096 characters; longer text is split on paragraph boundaries.
 *  - Media is uploaded to Meta first (returns a media id), then referenced in the message.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { httpJson } from "./http";
import { requireCredentials, getCredentials } from "./registry";

export const GRAPH = "https://graph.facebook.com/v21.0";
export const WA_TEXT_LIMIT = 4096;

export class WhatsAppWindowClosed extends Error {
  constructor() { super("WhatsApp 24-hour window is closed for this recipient; an approved template is required."); this.name = "WhatsAppWindowClosed"; }
}

const digits = (n: string) => n.replace(/[^\d]/g, "");

async function post<T>(path: string, body: unknown): Promise<T> {
  const c = await requireCredentials("whatsapp");
  try {
    return await httpJson<T>(`${GRAPH}/${c.phoneNumberId}/${path}`, {
      method: "POST", headers: { Authorization: `Bearer ${c.accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/131047|re-engagement/i.test(msg)) throw new WhatsAppWindowClosed();
    throw e;
  }
}

/** Splits long text into WhatsApp-sized chunks, preferring paragraph, then line, then word boundaries. */
export function chunkText(text: string, limit = WA_TEXT_LIMIT - 16): string[] {
  const out: string[] = [];
  let rest = text.trim();
  while (rest.length > limit) {
    const window = rest.slice(0, limit);
    const cut = Math.max(window.lastIndexOf("\n\n"), window.lastIndexOf("\n"), window.lastIndexOf(" "));
    const at = cut > limit * 0.5 ? cut : limit;
    out.push(rest.slice(0, at).trimEnd());
    rest = rest.slice(at).trimStart();
  }
  if (rest) out.push(rest);
  return out.length > 1 ? out.map((c, i) => `${c}\n\n(${i + 1}/${out.length})`) : out;
}

/** Template parameters may not contain newlines, tabs or more than four consecutive spaces. */
export function templateParam(s: string, max = 900) {
  return s.replace(/[\n\t]+/g, " · ").replace(/ {4,}/g, "   ").trim().slice(0, max) || "—";
}

/** Free-form text only works inside the 24h customer-service window; otherwise use an approved template. */
export async function sendWhatsApp(opts: { to: string; text?: string; template?: { name: string; language: string; params?: string[] }; replyToMessageId?: string }) {
  const to = digits(opts.to);
  if (opts.template) {
    const t = opts.template;
    const res = await post<{ messages?: { id: string }[] }>("messages", {
      messaging_product: "whatsapp", to, type: "template",
      template: {
        name: t.name, language: { code: t.language },
        components: t.params?.length ? [{ type: "body", parameters: t.params.map((p) => ({ type: "text", text: templateParam(p) })) }] : undefined,
      },
    });
    return { messageId: res.messages?.[0]?.id ?? null, messageIds: res.messages?.map((m) => m.id) ?? [] };
  }
  const ids: string[] = [];
  for (const [i, chunk] of chunkText(opts.text ?? "").entries()) {
    const res = await post<{ messages?: { id: string }[] }>("messages", {
      messaging_product: "whatsapp", recipient_type: "individual", to, type: "text", text: { body: chunk, preview_url: false },
      ...(i === 0 && opts.replyToMessageId ? { context: { message_id: opts.replyToMessageId } } : {}),
    });
    if (res.messages?.[0]?.id) ids.push(res.messages[0].id);
  }
  return { messageId: ids[0] ?? null, messageIds: ids };
}

/** Interactive reply buttons (max 3, titles ≤ 20 chars). Only valid inside the 24h window. */
export async function sendWhatsAppButtons(opts: { to: string; body: string; buttons: { id: string; title: string }[]; footer?: string }) {
  const res = await post<{ messages?: { id: string }[] }>("messages", {
    messaging_product: "whatsapp", recipient_type: "individual", to: digits(opts.to), type: "interactive",
    interactive: {
      type: "button",
      body: { text: opts.body.slice(0, 1024) },
      ...(opts.footer ? { footer: { text: opts.footer.slice(0, 60) } } : {}),
      action: { buttons: opts.buttons.slice(0, 3).map((b) => ({ type: "reply", reply: { id: b.id.slice(0, 256), title: b.title.slice(0, 20) } })) },
    },
  });
  return { messageId: res.messages?.[0]?.id ?? null };
}

/** Uploads bytes to Meta's media store; returns a media id usable for ~30 days. */
export async function uploadWhatsAppMedia(data: Buffer, mimeType: string, filename: string): Promise<string> {
  const c = await requireCredentials("whatsapp");
  const form = new FormData();
  form.append("messaging_product", "whatsapp");
  form.append("type", mimeType);
  form.append("file", new Blob([new Uint8Array(data)], { type: mimeType }), filename);
  const res = await httpJson<{ id: string }>(`${GRAPH}/${c.phoneNumberId}/media`, {
    method: "POST", headers: { Authorization: `Bearer ${c.accessToken}` }, body: form, timeoutMs: 120_000,
  });
  return res.id;
}

export type MediaKind = "document" | "image" | "video" | "audio";

export async function sendWhatsAppMedia(opts: { to: string; kind: MediaKind; data: Buffer; mimeType: string; filename: string; caption?: string }) {
  const mediaId = await uploadWhatsAppMedia(opts.data, opts.mimeType, opts.filename);
  const media: Record<string, string> = { id: mediaId };
  if (opts.caption && opts.kind !== "audio") media.caption = opts.caption.slice(0, 1000);
  if (opts.kind === "document") media.filename = opts.filename;
  const res = await post<{ messages?: { id: string }[] }>("messages", { messaging_product: "whatsapp", recipient_type: "individual", to: digits(opts.to), type: opts.kind, [opts.kind]: media });
  return { messageId: res.messages?.[0]?.id ?? null, mediaId };
}

/** Resolves an inbound media id to bytes (two-step: metadata → authenticated download). */
export async function downloadWhatsAppMedia(mediaId: string): Promise<{ data: Buffer; mimeType: string; sizeBytes: number }> {
  const c = await requireCredentials("whatsapp");
  const meta = await httpJson<{ url: string; mime_type: string; file_size?: number }>(`${GRAPH}/${encodeURIComponent(mediaId)}`, { headers: { Authorization: `Bearer ${c.accessToken}` } });
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 120_000);
  try {
    const res = await fetch(meta.url, { headers: { Authorization: `Bearer ${c.accessToken}` }, signal: ctrl.signal });
    if (!res.ok) throw new Error(`WhatsApp media download failed: ${res.status}`);
    const data = Buffer.from(await res.arrayBuffer());
    return { data, mimeType: meta.mime_type, sizeBytes: data.length };
  } finally { clearTimeout(timer); }
}

/** Marks an inbound message as read (blue ticks) — tells the owner the system has picked it up. */
export async function markWhatsAppRead(messageId: string) {
  await post("messages", { messaging_product: "whatsapp", status: "read", message_id: messageId }).catch(() => undefined);
}

/**
 * Voice-note transcription. WhatsApp voice notes arrive as OGG/Opus. Claude does not accept audio input,
 * so this uses OpenAI's transcription endpoint when an OpenAI key is configured (same key as image generation).
 */
export async function transcribeAudio(data: Buffer, mimeType: string): Promise<string | null> {
  const c = await getCredentials("openai_images");
  if (!c?.apiKey) return null;
  const form = new FormData();
  form.append("model", process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe");
  form.append("file", new Blob([new Uint8Array(data)], { type: mimeType.split(";")[0] }), mimeType.includes("ogg") ? "voice.ogg" : "voice.m4a");
  const res = await httpJson<{ text: string }>("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST", headers: { Authorization: `Bearer ${c.apiKey}` }, body: form, timeoutMs: 120_000,
  });
  return res.text?.trim() || null;
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
