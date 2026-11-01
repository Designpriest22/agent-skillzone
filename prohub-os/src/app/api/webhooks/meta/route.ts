/**
 * Meta webhooks: WhatsApp Business messages, Facebook Page / Instagram messages and comments.
 *
 * WhatsApp messages are queued (deduplicated by message id, because Meta retries deliveries) and processed
 * by the worker: authorised numbers become owner commands, everyone else becomes a CRM enquiry.
 * Answering 200 quickly matters — Meta disables webhooks that are slow or failing.
 */
import { verifyMetaSignature } from "@/integrations/whatsapp";
import { enqueue } from "@/orchestrator/queue";
import { getCredentials } from "@/integrations/registry";
import { intakeEnquiry } from "@/services/enquiries";
import { createTask } from "@/orchestrator/tasks";
import { logActivity } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const token = u.searchParams.get("hub.verify_token");
  const wa = await getCredentials("whatsapp"), meta = await getCredentials("meta");
  const expected = [wa?.verifyToken, meta?.verifyToken, process.env.WHATSAPP_VERIFY_TOKEN, process.env.META_VERIFY_TOKEN].filter(Boolean);
  if (u.searchParams.get("hub.mode") === "subscribe" && token && expected.includes(token)) return new Response(u.searchParams.get("hub.challenge") ?? "", { status: 200 });
  return new Response("Forbidden", { status: 403 });
}

type Change = { field?: string; value?: Record<string, unknown> };
type Entry = { id?: string; changes?: Change[]; messaging?: { sender?: { id: string }; message?: { mid?: string; text?: string } }[] };

export async function POST(req: Request) {
  const raw = await req.text();
  if (!(await verifyMetaSignature(raw, req.headers.get("x-hub-signature-256")))) return new Response("Invalid signature", { status: 401 });
  let body: { object?: string; entry?: Entry[] };
  try { body = JSON.parse(raw); } catch { return new Response("Bad JSON", { status: 400 }); }
  let handled = 0;
  for (const entry of body.entry ?? []) {
    for (const ch of entry.changes ?? []) {
      const v = ch.value ?? {};
      // WhatsApp Business inbound messages
      const messages = (v.messages as { from: string; id: string; type: string }[] | undefined) ?? [];
      const contacts = (v.contacts as { profile?: { name?: string }; wa_id: string }[] | undefined) ?? [];
      for (const m of messages) {
        if (!m?.from || !m?.id) continue;
        const contactName = contacts.find((c) => c.wa_id === m.from)?.profile?.name ?? null;
        await enqueue("whatsapp.inbound", { message: m, contactName }, { priority: 1, maxAttempts: 4, dedupeKey: `wa-in:${m.id}` });
        handled++;
      }
      // Facebook/Instagram comments on Prohub's posts
      if ((ch.field === "feed" && v.item === "comment") || ch.field === "comments") {
        const text = String(v.message ?? v.text ?? "");
        const from = (v.from as { name?: string; username?: string } | undefined);
        await createTask({ agentSlug: "social-media", createdBy: "webhook:meta", status: "approved", kind: "triage", priority: 2,
          title: `New ${body.object === "instagram" ? "Instagram" : "Facebook"} comment`,
          instructions: `A comment arrived on Prohub's ${body.object} account from ${from?.name ?? from?.username ?? "a user"}: """${text.slice(0, 1500)}"""\nDecide whether it is a sales enquiry. If so, create a lead (source=social) and log the interaction; draft a public reply or DM suggestion as a deliverable. Do not reply publicly without approval.` });
        handled++;
      }
    }
    // Messenger / Instagram DMs
    for (const m of entry.messaging ?? []) {
      if (!m.message?.text || !m.sender?.id) continue;
      await intakeEnquiry({ name: `${body.object === "instagram" ? "Instagram" : "Messenger"} user ${m.sender.id.slice(-6)}`, message: m.message.text, channel: "social", source: "social", externalId: m.message.mid ?? null, phone: null, email: null });
      handled++;
    }
  }
  await logActivity({ type: "webhook", id: "meta" }, "webhook.meta", null, { object: body.object, handled });
  return Response.json({ ok: true, handled });
}
