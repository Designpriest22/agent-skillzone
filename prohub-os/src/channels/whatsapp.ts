/**
 * WhatsApp command centre.
 *
 * Inbound (from the Meta webhook, processed on the job queue so the webhook answers Meta immediately):
 *   - Messages from an AUTHORISED number (authorized_senders → user → role) are business commands:
 *       quick commands (help, approvals, approve/reject/change <ref>, status, tasks, cancel <ref>)
 *       or a natural-language instruction for the AI Managing Director.
 *   - Messages from anyone else are customer enquiries → CRM lead + Client Manager triage (unchanged).
 *
 * Outbound:
 *   - Progress for WhatsApp-issued commands (agent assigned → department finished → final verified result).
 *   - Approval requests with Approve / Reject / Changes buttons, reports (digest + PDF), alerts.
 *
 * Text, images, documents, video and voice notes are accepted. Voice notes are transcribed when an
 * OpenAI key is configured (Claude does not take audio input); otherwise the sender is asked for text.
 */
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { approvals, authorizedSenders, commands, deliverables, reports, tasks, users } from "@/db/schema";
import {
  sendWhatsApp, sendWhatsAppButtons, sendWhatsAppMedia, downloadWhatsAppMedia, markWhatsAppRead, transcribeAudio,
  WhatsAppWindowClosed, type MediaKind,
} from "@/integrations/whatsapp";
import { getCredentials, isConfigured } from "@/integrations/registry";
import { intakeEnquiry } from "@/services/enquiries";
import { saveFile, readFile, listFileMeta } from "@/services/files";
import { submitCommand } from "@/orchestrator/commands";
import { commandStatus, recentCommands, resolveRef, shortRef, taskBoard, agentLabel } from "@/orchestrator/command-status";
import { decideApproval, requestChanges } from "@/governance/approvals";
import { cancelTask } from "@/orchestrator/tasks";
import { ACTION_POLICY } from "@/governance/permissions";
import { logActivity } from "@/lib/audit";
import { env } from "@/lib/env";
import { errMessage, truncate } from "@/lib/utils";

/** WhatsApp Cloud API media limits (bytes). */
const OUTBOUND_LIMIT: Record<MediaKind, number> = { video: 16 * 1048576, image: 5 * 1048576, audio: 16 * 1048576, document: 100 * 1048576 };

export type InboundMessage = {
  from: string; id: string; timestamp?: string; type: string;
  text?: { body: string };
  image?: { id: string; mime_type?: string; caption?: string };
  document?: { id: string; mime_type?: string; caption?: string; filename?: string };
  video?: { id: string; mime_type?: string; caption?: string };
  audio?: { id: string; mime_type?: string; voice?: boolean };
  sticker?: { id: string };
  interactive?: { type: string; button_reply?: { id: string; title: string }; list_reply?: { id: string; title: string } };
  button?: { payload?: string; text?: string };
  location?: { latitude: number; longitude: number; name?: string; address?: string };
  contacts?: unknown[];
};

const digits = (s: string) => s.replace(/[^\d]/g, "");
const RANK = { viewer: 0, manager: 1, owner: 2 } as const;

export async function findSender(phone: string) {
  const [row] = await db.select({ senderId: authorizedSenders.id, address: authorizedSenders.address, userId: users.id, name: users.name, role: users.role, active: users.active })
    .from(authorizedSenders).innerJoin(users, eq(users.id, authorizedSenders.userId))
    .where(and(eq(authorizedSenders.channel, "whatsapp"), eq(authorizedSenders.address, digits(phone)), eq(authorizedSenders.active, true)));
  return row && row.active ? row : null;
}

/** Sends text, tolerating a closed 24h window by falling back to the configured owner template. */
export async function sendText(to: string, text: string, opts: { replyTo?: string } = {}) {
  try {
    return await sendWhatsApp({ to, text, replyToMessageId: opts.replyTo });
  } catch (e) {
    if (e instanceof WhatsAppWindowClosed) {
      const c = await getCredentials("whatsapp");
      if (c?.ownerTemplate) return sendWhatsApp({ to, template: { name: c.ownerTemplate, language: c.templateLanguage || "en", params: [truncate(text, 900)] } });
    }
    throw e;
  }
}

/* ───────────────────────────── Inbound ───────────────────────────── */

const HELP = `*Prohub AI — WhatsApp command centre*

Just tell me what you need in plain language, e.g.
• Find 10 businesses in Abuja that may need branding
• Create an Instagram campaign for our branding services
• Give me our business performance report
• Which clients have outstanding payments?

Quick commands:
• *approvals* — what's waiting for you
• *approve ABC123* / *reject ABC123 reason* / *change ABC123 what to change*
• *status* — your recent instructions · *status ABC123* — one instruction
• *tasks* — completed, pending, failed and awaiting-approval work today
• *cancel ABC123* — stop an instruction
• *help* — this message

You can also send images, PDFs and voice notes with your instruction.`;

type Sender = NonNullable<Awaited<ReturnType<typeof findSender>>>;

export async function handleInbound(p: { message: InboundMessage; contactName?: string | null }) {
  const m = p.message;
  const sender = await findSender(m.from);
  if (!sender) return handleCustomerMessage(m, p.contactName ?? null);
  await db.update(authorizedSenders).set({ lastSeenAt: new Date() }).where(eq(authorizedSenders.id, sender.senderId));
  await markWhatsAppRead(m.id);
  try {
    return await handleOwnerMessage(m, sender);
  } catch (e) {
    await sendText(m.from, `⚠️ I couldn't process that: ${errMessage(e)}`, { replyTo: m.id }).catch(() => undefined);
    throw e;
  }
}

async function storeInboundMedia(m: InboundMessage, by: string) {
  const media = m.image ?? m.document ?? m.video ?? m.audio ?? m.sticker;
  if (!media) return null;
  const dl = await downloadWhatsAppMedia(media.id);
  const ext = (dl.mimeType.split("/")[1] ?? "bin").split(";")[0];
  const name = m.document?.filename ?? `whatsapp-${m.type}-${m.id.slice(-8)}.${ext}`;
  return saveFile({ name, mimeType: dl.mimeType, data: dl.data, source: "whatsapp", createdBy: by, meta: { messageId: m.id, from: digits(m.from), type: m.type, caption: (media as { caption?: string }).caption ?? null } });
}

async function handleCustomerMessage(m: InboundMessage, contactName: string | null) {
  let text = m.text?.body ?? m.interactive?.button_reply?.title ?? m.button?.text ?? (m.image ?? m.document ?? m.video)?.caption ?? "";
  let fileNote = "";
  if (m.image || m.document || m.video || m.audio) {
    try {
      const f = await storeInboundMedia(m, "webhook:whatsapp");
      if (f) fileNote = `\n[Attached ${m.type}: ${env.appUrl}/api/files/${f.id}]`;
      if (m.audio && f) {
        const full = await readFile(f.id);
        const transcript = full ? await transcribeAudio(full.data, full.mimeType).catch(() => null) : null;
        if (transcript) text = `${text}\n[Voice note transcript] ${transcript}`.trim();
      }
    } catch (e) { fileNote = `\n[${m.type} attachment could not be downloaded: ${errMessage(e)}]`; }
  }
  if (m.location) text = `${text}\n[Location] ${m.location.name ?? ""} ${m.location.address ?? ""} (${m.location.latitude}, ${m.location.longitude})`.trim();
  return intakeEnquiry({
    name: contactName ?? `+${digits(m.from)}`, phone: `+${digits(m.from)}`, message: `${text || `[${m.type} message]`}${fileNote}`,
    channel: "whatsapp", source: "whatsapp", externalId: m.id,
  });
}

async function handleOwnerMessage(m: InboundMessage, sender: Sender) {
  // Button presses on approval requests: apv:<decision>:<approvalId>
  const buttonId = m.interactive?.button_reply?.id ?? m.button?.payload ?? null;
  if (buttonId?.startsWith("apv:")) {
    const [, decision, id] = buttonId.split(":");
    if (decision === "changes") {
      return sendText(m.from, `What should be changed? Reply: *change ${shortRef(id)} <your notes>*`, { replyTo: m.id });
    }
    return decide(m, sender, id, decision === "approve" ? "approve" : "reject", decision === "approve" ? undefined : "Rejected via WhatsApp");
  }

  let text = (m.text?.body ?? m.interactive?.list_reply?.title ?? m.button?.text ?? (m.image ?? m.document ?? m.video)?.caption ?? "").trim();
  const attachments: string[] = [];
  if (m.image || m.document || m.video || m.audio || m.sticker) {
    const f = await storeInboundMedia(m, `user:${sender.userId}`);
    if (f && m.audio) {
      const full = await readFile(f.id);
      const transcript = full ? await transcribeAudio(full.data, full.mimeType) : null;
      if (!transcript) {
        return sendText(m.from, (await isConfigured("openai_images"))
          ? "I couldn't make out that voice note. Please try again or type the instruction."
          : "Voice notes need a transcription service, which isn't connected yet (add an OpenAI key under Integrations). Please type the instruction for now.", { replyTo: m.id });
      }
      text = transcript;
      await sendText(m.from, `🎙️ I heard: "${truncate(transcript, 500)}"`, { replyTo: m.id });
    } else if (f && (m.image || m.document)) {
      attachments.push(f.id);
    } else if (f && m.video) {
      text = `${text}\n\n[The owner attached a video: ${env.appUrl}/api/files/${f.id} (file_id ${f.id}). It is stored in the system; you cannot watch it directly.]`.trim();
    }
  }
  if (m.location) text = `${text}\n[Location shared] ${m.location.name ?? ""} ${m.location.address ?? ""} (${m.location.latitude}, ${m.location.longitude})`.trim();

  if (!text && !attachments.length) return sendText(m.from, "I received your message but there was nothing I could act on. Send *help* for examples.", { replyTo: m.id });

  const quick = await quickCommand(m, sender, text);
  if (quick !== false) return quick;

  if (RANK[sender.role] < RANK.manager) return sendText(m.from, "Your access is view-only. You can use *status*, *tasks* and *approvals*; ask the owner to upgrade your role to issue instructions.", { replyTo: m.id });
  const instruction = text || "Review the attached file(s) and tell me what you recommend we do with them.";
  const { commandId } = await submitCommand(instruction, sender.userId, { channel: "whatsapp", replyTo: digits(m.from), attachments });
  await logActivity({ type: "user", id: sender.userId }, "whatsapp.command", { type: "command", id: commandId }, { from: digits(m.from), attachments: attachments.length });
  return sendText(m.from, `✅ Instruction received (ref *${shortRef(commandId)}*). The Managing Director is planning the work — I'll update you as agents are assigned and when results are verified.`, { replyTo: m.id });
}

/** Returns false when the text is not a quick command. */
async function quickCommand(m: InboundMessage, sender: Sender, text: string): Promise<unknown | false> {
  const t = text.trim();
  const lower = t.toLowerCase();
  if (/^(help|menu|commands|\?)$/.test(lower)) return sendText(m.from, HELP);

  if (/^(approvals|pending|pending approvals)$/.test(lower)) {
    const rows = await db.select().from(approvals).where(eq(approvals.status, "pending")).orderBy(approvals.createdAt).limit(10);
    if (!rows.length) return sendText(m.from, "Nothing is waiting for your approval. 👍");
    await sendText(m.from, `*${rows.length} item(s) awaiting approval:*\n\n${rows.map((a) => `• *${shortRef(a.id)}* — ${a.title}\n  ${ACTION_POLICY[a.actionType]?.label ?? a.actionType}${a.level === 3 ? " · owner-only, use the dashboard" : ""}`).join("\n")}\n\nReply *approve <ref>*, *reject <ref> reason* or *change <ref> notes*.`);
    return { listed: rows.length };
  }

  const dec = /^(approve|approved|yes|reject|decline|no|change|changes|modify|revise)\s+([0-9a-f-]{4,36})\b\s*(.*)$/is.exec(t);
  if (dec) {
    const verb = dec[1].toLowerCase();
    const ref = await resolveRef("approvals", dec[2]);
    if ("error" in ref) return sendText(m.from, ref.error, { replyTo: m.id });
    if (["change", "changes", "modify", "revise"].includes(verb)) {
      if (!dec[3].trim()) return sendText(m.from, `Tell me what to change: *change ${dec[2].toUpperCase()} <notes>*`, { replyTo: m.id });
      const res = await requestChanges({ approvalId: ref.id, userId: sender.userId, role: sender.role, notes: dec[3].trim(), channel: { kind: "whatsapp", replyTo: digits(m.from) } });
      return sendText(m.from, `✏️ Changes requested on *${shortRef(ref.id)}*. ${agentLabel(res.agentSlug)} is revising it (new ref *${shortRef(res.commandId)}*); the revised version will come back for approval.`, { replyTo: m.id });
    }
    return decide(m, sender, ref.id, ["approve", "approved", "yes"].includes(verb) ? "approve" : "reject", dec[3].trim() || undefined);
  }

  const st = /^status(?:\s+([0-9a-f-]{4,36}))?$/i.exec(t);
  if (st) {
    if (st[1]) {
      const ref = await resolveRef("commands", st[1]);
      if ("error" in ref) return sendText(m.from, ref.error);
      const s = await commandStatus(ref.id);
      if (!s) return sendText(m.from, "Not found.");
      return sendText(m.from, formatCommandStatus(s));
    }
    const rows = await recentCommands({ userId: sender.userId, limit: 5 });
    if (!rows.length) return sendText(m.from, "You haven't issued any instructions yet. Send *help* for examples.");
    return sendText(m.from, `*Your recent instructions:*\n\n${rows.map((r) => `• *${shortRef(r.id)}* — ${statusIcon(r.status)} ${r.status}\n  ${truncate(r.text, 90)}`).join("\n")}\n\nReply *status <ref>* for detail.`);
  }

  if (/^(tasks|today|board|outstanding)$/.test(lower)) {
    const b = await taskBoard(24);
    const list = (xs: { title: string; agentLabel: string }[], n = 5) => xs.slice(0, n).map((x) => `  • ${truncate(x.title, 70)} — ${x.agentLabel}`).join("\n") || "  —";
    return sendText(m.from, `*Workforce — last 24h*\n\n✅ Completed: ${b.completed.length}\n${list(b.completed)}\n\n⏳ Pending: ${b.pending.length}\n${list(b.pending)}\n\n🛑 Failed: ${b.failed.length}\n${list(b.failed)}\n\n🔐 Awaiting your approval: ${b.pendingApprovals.length}${b.pendingApprovals.length ? `\n${b.pendingApprovals.slice(0, 5).map((a) => `  • *${a.ref}* ${truncate(a.title, 70)}`).join("\n")}` : ""}${b.pausedAgents.length ? `\n\nPaused agents: ${b.pausedAgents.join(", ")}` : ""}`);
  }

  const cancel = /^(cancel|stop)\s+([0-9a-f-]{4,36})$/i.exec(t);
  if (cancel) {
    if (RANK[sender.role] < RANK.manager) return sendText(m.from, "Your role cannot cancel instructions.");
    const ref = await resolveRef("commands", cancel[2]);
    if ("error" in ref) return sendText(m.from, ref.error);
    const [cmd] = await db.select().from(commands).where(eq(commands.id, ref.id));
    if (!cmd?.rootTaskId) return sendText(m.from, "That instruction has no running work.");
    await cancelTask(cmd.rootTaskId, `user:${sender.userId}`);
    return sendText(m.from, `🛑 Cancelled *${shortRef(cmd.id)}* and all of its open tasks.`);
  }
  return false;
}

async function decide(m: InboundMessage, sender: Sender, approvalId: string, decision: "approve" | "reject", note?: string) {
  const [a] = await db.select().from(approvals).where(eq(approvals.id, approvalId));
  if (!a) return sendText(m.from, "That approval no longer exists.");
  // Level 3 (restricted) actions need the stronger dashboard login, never a chat message.
  if (a.level >= 3) return sendText(m.from, `🔒 *${shortRef(a.id)}* is an owner-only (Level 3) action: ${ACTION_POLICY[a.actionType]?.label}. For safety it can only be authorised in the dashboard: ${env.appUrl}/os/approvals?focus=${a.id}`);
  try {
    await decideApproval({ approvalId, userId: sender.userId, role: sender.role, decision, note: note ? `${note} (via WhatsApp)` : "via WhatsApp" });
  } catch (e) {
    return sendText(m.from, `Couldn't record that: ${errMessage(e)}`, { replyTo: m.id });
  }
  return sendText(m.from, decision === "approve"
    ? `👍 Approved *${shortRef(a.id)}* — ${a.title}. Executing now; I'll confirm the outcome.`
    : `👎 Rejected *${shortRef(a.id)}* — ${a.title}.${note ? ` Reason noted: ${truncate(note, 200)}` : ""}`, { replyTo: m.id });
}

/* ───────────────────────────── Outbound: command progress ───────────────────────────── */

const statusIcon = (s: string) => ({ completed: "✅", failed: "🛑", cancelled: "🛑", executing: "⏳", planning: "⏳", received: "📥" } as Record<string, string>)[s] ?? "•";

export function formatCommandStatus(s: NonNullable<Awaited<ReturnType<typeof commandStatus>>>) {
  const lines = [
    `*${s.command.ref}* — ${statusIcon(s.command.status)} ${s.command.status}`,
    truncate(s.command.text, 200), "",
    `✅ ${s.counts.completed} completed · ⏳ ${s.counts.pending} pending · 🛑 ${s.counts.failed} failed · 🔐 ${s.counts.awaiting_approval} awaiting approval`,
  ];
  for (const t of s.tasks.filter((x) => x.depth === 1).slice(0, 8)) lines.push(`• ${t.agentLabel}: ${t.bucket.replace("_", " ")} — ${truncate(t.title, 60)}`);
  if (s.pendingApprovals.length) lines.push("", "Waiting for you:", ...s.pendingApprovals.map((a) => `• *${a.ref}* ${a.title}`));
  if (s.command.status === "completed" && s.command.response) lines.push("", truncate(s.command.response, 1500));
  return lines.join("\n");
}

/** Describes a task's verified outputs in owner language, and collects files worth sending. */
export async function describeOutputs(outputs: { type: string; id: string }[]) {
  const by = (type: string) => outputs.filter((o) => o.type === type).map((o) => o.id);
  const lines: string[] = [];
  const media: { fileId: string; kind: MediaKind; caption: string }[] = [];
  const leadIds = by("lead");
  if (leadIds.length) lines.push(`• ${leadIds.length} lead(s) recorded in the CRM — ${env.appUrl}/os/crm`);
  const dIds = by("deliverable");
  if (dIds.length) {
    const ds = await db.select({ id: deliverables.id, title: deliverables.title, kind: deliverables.kind, status: deliverables.status, fileIds: deliverables.fileIds }).from(deliverables).where(inArray(deliverables.id, dIds));
    for (const d of ds) {
      lines.push(`• ${d.kind.replace(/_/g, " ")}: ${d.title} (${d.status.replace("_", " ")}) — ${env.appUrl}/os/deliverables/${d.id}`);
      for (const f of await listFileMeta(d.fileIds)) {
        const kind: MediaKind = f.mimeType.startsWith("video/") ? "video" : f.mimeType.startsWith("image/") ? "image" : "document";
        media.push({ fileId: f.id, kind, caption: `${d.title} — ${String(f.meta?.format ?? f.name)}` });
      }
    }
  }
  const rIds = by("report");
  if (rIds.length) {
    const rs = await db.select({ id: reports.id, title: reports.title }).from(reports).where(inArray(reports.id, rIds));
    for (const r of rs) lines.push(`• Report: ${r.title} — ${env.appUrl}/os/reports/${r.id}`);
  }
  const other = outputs.filter((o) => !["lead", "deliverable", "report"].includes(o.type));
  const grouped = new Map<string, number>();
  for (const o of other) grouped.set(o.type, (grouped.get(o.type) ?? 0) + 1);
  for (const [type, n] of grouped) lines.push(`• ${n} ${type.replace(/_/g, " ")} record(s)`);
  return { lines, media, reportIds: rIds };
}

export async function sendFileToWhatsApp(to: string, fileId: string, kind: MediaKind, caption: string) {
  const f = await readFile(fileId);
  if (!f) return false;
  if (f.data.length > OUTBOUND_LIMIT[kind]) {
    await sendText(to, `${caption}\n(${(f.data.length / 1048576).toFixed(1)} MB — too large for WhatsApp; open it here: ${env.appUrl}/api/files/${f.id})`);
    return false;
  }
  await sendWhatsAppMedia({ to, kind, data: f.data, mimeType: f.mimeType, filename: f.name, caption });
  return true;
}

/** Job handler: progress events for commands issued over WhatsApp. */
export async function sendCommandEvent(p: { commandId: string; event: "assigned" | "finished" | "command_done"; taskId?: string }) {
  if (!(await isConfigured("whatsapp"))) return { skipped: "whatsapp not configured" };
  const [cmd] = await db.select().from(commands).where(eq(commands.id, p.commandId));
  if (!cmd || cmd.channel !== "whatsapp" || !cmd.replyTo) return { skipped: "not a whatsapp command" };
  const to = cmd.replyTo;
  const ref = shortRef(cmd.id);

  if (p.event === "assigned" && p.taskId) {
    const [t] = await db.select().from(tasks).where(eq(tasks.id, p.taskId));
    if (!t) return { skipped: "task gone" };
    await sendText(to, `📋 [${ref}] ${agentLabel(t.agentSlug)} has been assigned: ${truncate(t.title, 120)}`);
    return { sent: "assigned" };
  }
  if (p.event === "finished" && p.taskId) {
    const [t] = await db.select().from(tasks).where(eq(tasks.id, p.taskId));
    if (!t) return { skipped: "task gone" };
    const ok = t.status === "completed";
    await sendText(to, ok
      ? `✔️ [${ref}] ${agentLabel(t.agentSlug)} finished: ${truncate(t.resultSummary ?? t.title, 600)}`
      : `⚠️ [${ref}] ${agentLabel(t.agentSlug)} could not complete "${truncate(t.title, 80)}": ${truncate(t.error ?? t.status, 300)}`);
    return { sent: "finished" };
  }
  // Final result: only what the orchestrator verified, plus anything awaiting approval.
  const s = await commandStatus(cmd.id);
  if (!s) return { skipped: "missing" };
  const rootOutputs = s.root?.outputs ?? [];
  const allOutputs = rootOutputs.length ? rootOutputs : s.tasks.filter((t) => t.status === "completed").flatMap((t) => t.outputs);
  const { lines, media, reportIds } = await describeOutputs(allOutputs);
  const ok = s.command.status === "completed";
  const header = ok ? `✅ *Done — ${ref}*` : s.command.status === "cancelled" ? `🛑 *Cancelled — ${ref}*` : `🛑 *Could not complete — ${ref}*`;
  const body = [
    header, "",
    truncate(s.command.response ?? "", 3200),
    lines.length ? `\n*Verified outputs*\n${lines.join("\n")}` : "",
    s.pendingApprovals.length ? `\n*Awaiting your approval*\n${s.pendingApprovals.map((a) => `• *${a.ref}* ${a.title}`).join("\n")}\nReply *approve <ref>*, *reject <ref>* or *change <ref> notes*.` : "",
    `\n${s.counts.completed} task(s) completed · ${s.counts.failed} failed · details: ${env.appUrl}/os/command?c=${cmd.id}`,
  ].filter(Boolean).join("\n");
  await sendText(to, body);
  for (const md of media.slice(0, 6)) await sendFileToWhatsApp(to, md.fileId, md.kind, md.caption).catch((e) => console.error("[whatsapp] media send failed", errMessage(e)));
  for (const rid of reportIds.slice(0, 2)) await sendReportPdf(to, rid).catch((e) => console.error("[whatsapp] report send failed", errMessage(e)));
  return { sent: "command_done", media: media.length };
}

/* ───────────────────────────── Outbound: owner notifications & reports ───────────────────────────── */

/** Authorised numbers whose role meets `minRole` (approvals go only to people who can decide them). */
export async function ownerRecipients(minRole: "viewer" | "manager" | "owner" = "manager") {
  const rows = await db.select({ address: authorizedSenders.address, role: users.role }).from(authorizedSenders)
    .innerJoin(users, eq(users.id, authorizedSenders.userId))
    .where(and(eq(authorizedSenders.channel, "whatsapp"), eq(authorizedSenders.active, true), eq(users.active, true)));
  return rows.filter((r) => RANK[r.role] >= RANK[minRole]).map((r) => r.address);
}

export async function pushApproval(approvalId: string) {
  if (!(await isConfigured("whatsapp"))) return 0;
  const [a] = await db.select().from(approvals).where(eq(approvals.id, approvalId));
  if (!a || a.status !== "pending") return 0;
  const recipients = await ownerRecipients(a.level >= 3 ? "owner" : "manager");
  const policy = ACTION_POLICY[a.actionType];
  const body = `🔐 *Approval needed — ${shortRef(a.id)}*\n${a.title}\n\n${policy?.label ?? a.actionType}${a.agentSlug ? ` · requested by ${agentLabel(a.agentSlug)}` : ""}\n\n${truncate(a.summary, 700)}`;
  let sent = 0;
  for (const to of recipients) {
    try {
      if (a.level >= 3) await sendText(to, `${body}\n\nOwner-only action — authorise in the dashboard: ${env.appUrl}/os/approvals?focus=${a.id}`);
      else await sendWhatsAppButtons({ to, body, footer: `Or reply: change ${shortRef(a.id)} <notes>`, buttons: [{ id: `apv:approve:${a.id}`, title: "Approve" }, { id: `apv:reject:${a.id}`, title: "Reject" }, { id: `apv:changes:${a.id}`, title: "Request changes" }] });
      sent++;
    } catch (e) {
      if (e instanceof WhatsAppWindowClosed) { await sendText(to, `${body}\n\nReply *approve ${shortRef(a.id)}* or *reject ${shortRef(a.id)}*.`).then(() => sent++).catch(() => undefined); }
      else console.error("[whatsapp] approval push failed", errMessage(e));
    }
  }
  return sent;
}

export async function pushText(text: string, minRole: "viewer" | "manager" | "owner" = "manager") {
  if (!(await isConfigured("whatsapp"))) return 0;
  let sent = 0;
  for (const to of await ownerRecipients(minRole)) {
    try { await sendText(to, text); sent++; } catch (e) { console.error("[whatsapp] push failed", errMessage(e)); }
  }
  return sent;
}

export async function sendReportPdf(to: string, reportId: string) {
  const [r] = await db.select().from(reports).where(eq(reports.id, reportId));
  if (!r) return false;
  const { reportToPdf } = await import("@/services/report-render");
  const pdf = await reportToPdf(r);
  await sendWhatsAppMedia({ to, kind: "document", data: pdf, mimeType: "application/pdf", filename: `${r.kind}-${r.createdAt.toISOString().slice(0, 10)}.pdf`, caption: r.title });
  return true;
}
