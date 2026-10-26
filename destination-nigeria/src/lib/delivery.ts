import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import type { FormPayload } from "./forms";

/**
 * Where form submissions go. Adapters are tried in order; a submission counts
 * as delivered only when at least one configured adapter succeeds. If none is
 * configured the API answers 503 and the visitor is told plainly that online
 * submissions are not yet enabled — never a false success.
 *
 *  FORMS_WEBHOOK_URL       POST JSON to any CRM/automation endpoint (HubSpot workflow, Zapier, Make, n8n…)
 *  FORMS_WEBHOOK_SECRET    optional; sent as X-Destination-Nigeria-Signature (HMAC-SHA256 of the body)
 *  RESEND_API_KEY + FORMS_NOTIFY_TO + FORMS_FROM   email a notification via Resend
 *  BREVO_API_KEY + BREVO_LIST_ID                   add newsletter sign-ups to a Brevo list
 *  FORMS_FILE_STORE=1      append to .data/submissions.jsonl (local development only)
 */

export type DeliveryResult = { delivered: string[]; failed: string[]; configured: string[] };

type Envelope = { id: string; receivedAt: string; payload: FormPayload };

async function hmac(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return Buffer.from(sig).toString("hex");
}

const adapters: { name: string; enabled: (p: FormPayload) => boolean; send: (e: Envelope) => Promise<void> }[] = [
  {
    name: "webhook",
    enabled: () => Boolean(process.env.FORMS_WEBHOOK_URL),
    async send(e) {
      const body = JSON.stringify(e);
      const headers: Record<string, string> = { "content-type": "application/json" };
      if (process.env.FORMS_WEBHOOK_SECRET) headers["x-destination-nigeria-signature"] = await hmac(process.env.FORMS_WEBHOOK_SECRET, body);
      const res = await fetch(process.env.FORMS_WEBHOOK_URL!, { method: "POST", headers, body, signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`webhook ${res.status}`);
    },
  },
  {
    name: "resend",
    enabled: () => Boolean(process.env.RESEND_API_KEY && process.env.FORMS_NOTIFY_TO && process.env.FORMS_FROM),
    async send(e) {
      const lines = Object.entries(e.payload)
        .filter(([k]) => k !== "consent")
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`);
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
        body: JSON.stringify({
          from: process.env.FORMS_FROM,
          to: process.env.FORMS_NOTIFY_TO!.split(",").map((s) => s.trim()),
          subject: `Destination Nigeria: new ${e.payload.kind} submission`,
          text: `Submission ${e.id} received ${e.receivedAt}\n\n${lines.join("\n")}`,
          reply_to: "email" in e.payload ? e.payload.email : undefined,
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`resend ${res.status}`);
    },
  },
  {
    name: "brevo",
    enabled: (p) => p.kind === "newsletter" && Boolean(process.env.BREVO_API_KEY && process.env.BREVO_LIST_ID),
    async send(e) {
      if (e.payload.kind !== "newsletter") return;
      const res = await fetch("https://api.brevo.com/v3/contacts", {
        method: "POST",
        headers: { "api-key": process.env.BREVO_API_KEY!, "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          email: e.payload.email,
          listIds: [Number(process.env.BREVO_LIST_ID)],
          updateEnabled: true,
          attributes: { DN_AUDIENCE: e.payload.audience, DN_INTERESTS: e.payload.interests.join(",") },
        }),
        signal: AbortSignal.timeout(8000),
      });
      // 204 = updated existing contact
      if (!res.ok && res.status !== 204) throw new Error(`brevo ${res.status}`);
    },
  },
  {
    name: "file",
    enabled: () => process.env.FORMS_FILE_STORE === "1",
    async send(e) {
      const dir = path.join(process.cwd(), ".data");
      await fs.mkdir(dir, { recursive: true });
      await fs.appendFile(path.join(dir, "submissions.jsonl"), JSON.stringify(e) + "\n", "utf8");
    },
  },
];

export function configuredAdapters(payload: FormPayload): string[] {
  return adapters.filter((a) => a.enabled(payload)).map((a) => a.name);
}

export async function deliver(payload: FormPayload): Promise<DeliveryResult> {
  const envelope: Envelope = { id: crypto.randomUUID(), receivedAt: new Date().toISOString(), payload };
  const active = adapters.filter((a) => a.enabled(payload));
  const results = await Promise.allSettled(active.map((a) => a.send(envelope)));
  const delivered: string[] = [];
  const failed: string[] = [];
  results.forEach((r, i) => {
    const n = active[i]!.name;
    if (r.status === "fulfilled") delivered.push(n);
    else {
      failed.push(n);
      // Log the adapter and reason only — never the visitor's personal data.
      console.error(`[forms] ${n} delivery failed for ${envelope.id}: ${(r.reason as Error)?.message ?? r.reason}`);
    }
  });
  return { delivered, failed, configured: active.map((a) => a.name) };
}
