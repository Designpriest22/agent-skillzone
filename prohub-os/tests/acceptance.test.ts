/**
 * ACCEPTANCE TESTS — the six real-world scenarios from the project brief, run end to end through the real
 * WhatsApp webhook route, job queue, orchestrator, permission/approval system, database, Claude connector
 * (MCP endpoint) and video renderer (Chromium + ffmpeg).
 *
 * Two things are substituted, and only these:
 *  - The model: a scripted stand-in (tests/helpers.ts) decides which tools each agent calls, so the test
 *    proves the plumbing deterministically. Live reasoning quality is checked with `npm run agent:smoke`.
 *  - Meta's Graph API: outbound HTTP to graph.facebook.com is intercepted and recorded, so we can assert
 *    exactly what the owner would receive on WhatsApp without a live Meta account.
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import { and, eq, inArray } from "drizzle-orm";
import { db, closeDb } from "@/db/client";
import {
  users, commands, tasks, leads, interactions, approvals, contentItems, deliverables, intelItems, notifications,
  authorizedSenders, clients, brandAssets, transactions, invoices, campaigns,
} from "@/db/schema";
import { setLLMClient } from "@/agents/llm";
import { resetDb, useScript, drainQueue, parse } from "./helpers";
import { POST as metaWebhook } from "@/app/api/webhooks/meta/route";
import { handleMcp } from "@/channels/mcp-http";
import { createApiToken } from "@/lib/api-tokens";
import { readFile } from "@/services/files";
import { renderAvailable } from "@/video/render";
import { shortRef } from "@/orchestrator/command-status";

const OWNER_PHONE = "2348030000001";
const PROSPECT_PHONE = "2348099990000";

/* ── Meta Graph API interception ─────────────────────────────────────────── */
type Sent = { to: string; type: string; text?: string; interactive?: { body: { text: string }; action: { buttons: { reply: { id: string; title: string } }[] } }; document?: { filename: string }; video?: unknown; image?: unknown };
let sent: Sent[] = [];
const realFetch = globalThis.fetch;
function installGraphMock() {
  let n = 0;
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    if (!url.startsWith("https://graph.facebook.com/")) return realFetch(input, init);
    const json = (o: unknown) => new Response(JSON.stringify(o), { status: 200, headers: { "Content-Type": "application/json" } });
    if (url.endsWith("/messages")) {
      const body = JSON.parse(String(init?.body));
      if (body.status === "read") return json({ success: true });
      sent.push({ to: body.to, type: body.type, text: body.text?.body, interactive: body.interactive, document: body.document, video: body.video, image: body.image });
      return json({ messaging_product: "whatsapp", messages: [{ id: `wamid.out.${++n}` }] });
    }
    if (url.endsWith("/media")) return json({ id: `media.${++n}` });
    return json({});
  }) as typeof fetch;
}

let msgSeq = 0;
async function whatsapp(from: string, message: Record<string, unknown>, name = "Test User") {
  const id = `wamid.in.${++msgSeq}`;
  const payload = { object: "whatsapp_business_account", entry: [{ id: "waba", changes: [{ field: "messages", value: { messaging_product: "whatsapp", contacts: [{ wa_id: from, profile: { name } }], messages: [{ from, id, timestamp: String(Math.floor(Date.now() / 1000)), ...message }] } }] }] };
  const res = await metaWebhook(new Request("http://localhost/api/webhooks/meta", { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } }));
  expect(res.status).toBe(200);
  return id;
}
const text = (body: string) => ({ type: "text", text: { body } });
const toOwner = () => sent.filter((m) => m.to === OWNER_PHONE);
const ownerTexts = () => toOwner().map((m) => m.text ?? m.interactive?.body.text ?? "").join("\n---\n");

/* ── Claude connector (MCP) client ───────────────────────────────────────── */
let mcpToken = "";
let rpcId = 0;
async function mcp(method: string, params: Record<string, unknown> = {}) {
  const res = await handleMcp(new Request("http://localhost/api/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", Authorization: `Bearer ${mcpToken}` },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++rpcId, method, params }),
  }), mcpToken);
  expect(res.status).toBe(200);
  return (await res.json()) as { result?: { content?: { type: string; text: string }[]; tools?: { name: string }[]; isError?: boolean }; error?: { message: string } };
}
const callTool = async (name: string, args: Record<string, unknown> = {}) => {
  const r = await mcp("tools/call", { name, arguments: args });
  if (r.error) throw new Error(r.error.message);
  return { text: r.result!.content!.map((c) => c.text).join("\n"), isError: Boolean(r.result!.isError) };
};

/** Pulls `outputs: [...]` arrays out of the manager's resume message. */
function subtaskOutputs(first: unknown) {
  const s = typeof first === "string" ? first : JSON.stringify(first);
  return [...s.matchAll(/outputs: (\[[^\n]*\])/g)].flatMap((m) => JSON.parse(m[1]) as { type: string; id: string }[]);
}
const firstText = (req: { messages: unknown[] }) => {
  const c = (req.messages[0] as { content: unknown }).content;
  return typeof c === "string" ? c : (c as { type: string; text?: string }[]).filter((b) => b.type === "text").map((b) => b.text).join("\n");
};

let ownerId = "";
beforeAll(() => {
  process.env.WHATSAPP_ACCESS_TOKEN = "test-access-token";
  process.env.WHATSAPP_PHONE_NUMBER_ID = "100200300";
  installGraphMock();
});
beforeEach(async () => {
  await resetDb();
  setLLMClient(null);
  sent = [];
  [{ id: ownerId }] = await db.select({ id: users.id }).from(users).where(eq(users.role, "owner"));
  await db.insert(authorizedSenders).values({ channel: "whatsapp", address: OWNER_PHONE, userId: ownerId, label: "Owner" });
  mcpToken = (await createApiToken(ownerId, "Claude test")).token;
});
afterAll(async () => {
  globalThis.fetch = realFetch;
  delete process.env.WHATSAPP_ACCESS_TOKEN;
  delete process.env.WHATSAPP_PHONE_NUMBER_ID;
  setLLMClient(null);
  await closeDb();
});

describe("ACCEPTANCE", () => {
  it("TEST 1 — WhatsApp: 'Find 10 businesses in Abuja that may need branding services' → MD delegates to Sales, prospects recorded in the CRM, owner kept informed", async () => {
    const PROSPECTS = ["Wuse Gardens Restaurant", "Maitama Dental Studio", "Jabi Lakeside Suites", "Garki Fresh Bakery", "Utako Auto Spares", "Gwarinpa Kids Academy", "Asokoro Law Chambers", "Kubwa Pharmacy Plus", "Central Area Fitness Hub", "Lugbe Furniture House"];
    useScript({
      Adaeze: ({ turn, req }) => {
        const first = firstText(req);
        if (first.includes("resuming after your delegated subtasks")) {
          const outs = subtaskOutputs(first).filter((o) => o.type === "lead");
          return [{ tool: "complete_task", input: { summary: `Research completed. ${outs.length} potential prospects in Abuja identified and recorded in the CRM: 7 qualified (clear branding gaps) and 3 requiring further verification. Lead report is ready.`, outputs: outs } }];
        }
        if (turn === 0) {
          expect(first).toContain("sent this over WhatsApp");
          return [{ tool: "delegate_task", input: { agent: "sales-marketing", title: "Find 10 Abuja businesses needing branding", instructions: "Identify 10 real businesses in Abuja with visible branding weaknesses (dated logo, inconsistent visuals, weak social presence). Record each with evidence, services needed, value estimate and follow-up date." } }];
        }
        return [{ tool: "await_subtasks", input: { plan_notes: "Sales prospects first; consolidate the lead report when done." } }];
      },
      Chidi: ({ turn, lastResults }) => {
        if (turn === 0) return PROSPECTS.map((name, i) => ({ tool: "create_lead", input: {
          company_name: name, industry: ["hospitality", "healthcare", "hospitality", "food", "automotive", "education", "legal", "pharmacy", "fitness", "retail"][i], location: "Abuja",
          website: `https://example.com/${i}`, services_needed: ["brand-identity"], problem_identified: "Logo and signage are dated and inconsistent across social profiles.",
          recommended_approach: "Send a one-page brand audit with two quick wins and offer a full identity refresh.", source_urls: [`https://example.com/${i}`],
          verified_facts: ["Instagram visuals inconsistent with signage"], assumptions: i >= 7 ? ["Owner is the decision maker — needs verification"] : [],
          estimated_value_ngn: 750000, signals: { industry_fit: true, observed_weaknesses: i < 7 ? 3 : 1, budget_signal: i < 7 ? "weak" : "none" },
        } }));
        const ids = lastResults.map((r) => parse<{ lead_id: string }>(r.content).lead_id);
        return [
          ...ids.map((id) => ({ tool: "schedule_follow_up", input: { lead_id: id, due_in_days: 2, reason: "First outreach after brand audit" } })),
          { tool: "complete_task", input: { summary: `Recorded ${ids.length} Abuja prospects with sources; 7 qualified, 3 need verification of decision maker.`, outputs: ids.map((id) => ({ type: "lead", id })) } },
        ];
      },
    });

    await whatsapp(OWNER_PHONE, text("Good morning. Find 10 businesses in Abuja that may need branding services."));
    await drainQueue();

    const [cmd] = await db.select().from(commands).where(eq(commands.channel, "whatsapp"));
    expect(cmd.status).toBe("completed");
    expect(cmd.replyTo).toBe(OWNER_PHONE);
    const recorded = await db.select().from(leads).where(eq(leads.location, "Abuja"));
    expect(recorded).toHaveLength(10);
    expect(recorded.every((l) => l.sourceUrls.length > 0 && l.servicesNeeded.includes("brand-identity"))).toBe(true);
    const all = await db.select().from(tasks).where(eq(tasks.commandId, cmd.id));
    expect(all.find((t) => t.agentSlug === "sales-marketing")?.status).toBe("completed");
    expect(all.find((t) => !t.parentTaskId)?.verification?.verified).toBe(true);

    const msgs = ownerTexts();
    expect(msgs).toContain("Instruction received");
    expect(msgs).toContain("Sales & Marketing (Chidi) has been assigned");
    expect(msgs).toContain("Sales & Marketing (Chidi) finished");
    expect(msgs).toContain(`Done — ${shortRef(cmd.id)}`);
    expect(msgs).toContain("10 lead(s) recorded in the CRM");
    expect(msgs).toContain("Lead report is ready");

    // Quick command over WhatsApp reflects the same verified state.
    sent = [];
    await whatsapp(OWNER_PHONE, text("tasks"));
    await drainQueue();
    expect(ownerTexts()).toMatch(/Completed: [2-9]/);
  });

  it("TEST 2 — WhatsApp: 'Create an Instagram campaign for our branding services' → content, copy, design and marketing collaborate; posts enter the approval queue; owner decides on WhatsApp", async () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><rect width="1080" height="1350" fill="#0E1A2B"/><text x="80" y="600" font-size="96" fill="#F7F4EC" font-family="Montserrat">Your brand, sharpened.</text></svg>`;
    const ids: Record<string, string> = {};
    useScript({
      Adaeze: ({ turn, lastResults, req }) => {
        const first = firstText(req);
        if (first.includes("resuming after your delegated subtasks")) {
          const outs = subtaskOutputs(first);
          return [{ tool: "complete_task", input: { summary: "Instagram campaign for branding services is ready: strategy, copy, 3 designed posts and the campaign record. 3 posts are awaiting your approval to publish; the campaign launch is awaiting approval too.", outputs: outs } }];
        }
        const d = (agent: string, title: string, instructions: string, depends_on: string[] = []) => ({ tool: "delegate_task", input: { agent, title, instructions, depends_on } });
        if (turn === 0) return [d("content", "Instagram campaign strategy for branding services", "Develop a 2-week Instagram campaign strategy for Prohub's branding services aimed at Abuja and Lagos SME owners, objective lead generation, with 3 post concepts."),
          d("sales-marketing", "Campaign record and acquisition plan", "Create the campaign record for the Instagram branding campaign with objective lead_generation, target segment and channels; no paid budget without owner authorisation.")];
        if (turn === 1) { ids.content = parse<{ task_id: string }>(lastResults[0].content).task_id; ids.salesTask = parse<{ task_id: string }>(lastResults[1].content).task_id; return [d("copywriting", "Captions and hooks for 3 posts", "Write captions, hooks and CTAs for the 3 campaign posts in Prohub's voice, based on the strategy.", [ids.content])]; }
        if (turn === 2) { ids.copy = parse<{ task_id: string }>(lastResults[0].content).task_id; return [d("graphic-design", "Design 3 Instagram posts (1080×1350)", "Design the three campaign posts at 1080×1350 using the approved copy and brand palette.", [ids.copy])]; }
        if (turn === 3) { ids.design = parse<{ task_id: string }>(lastResults[0].content).task_id; return [d("social-media", "Schedule the campaign posts for approval", "Create the 3 Instagram content items with the designs and captions, link the campaign, and request approval to publish.", [ids.design, ids.salesTask])]; }
        return [{ tool: "await_subtasks", input: { plan_notes: "Strategy + campaign record → copy → design → social scheduling with approval." } }];
      },
      Bisi: ({ turn, lastResults }) => turn === 0
        ? [{ tool: "save_deliverable", input: { kind: "content_strategy", title: "Instagram branding campaign strategy", content: "## Objective\nGenerate 25 qualified brand-audit requests in 14 days.\n## Posts\n1. Before/after rebrand\n2. Cost of a weak brand\n3. Free audit offer", submit_for_review: true } }]
        : [{ tool: "complete_task", input: { summary: "Strategy with objective and 3 post concepts.", outputs: [{ type: "deliverable", id: parse<{ deliverable_id: string }>(lastResults[0].content).deliverable_id }] } }],
      Chidi: ({ turn, lastResults }) => {
        if (turn === 0) return [{ tool: "create_campaign", input: { name: "Instagram — Branding services (Nov)", objective: "lead_generation", channels: ["instagram"], target_segment: "SME owners in Abuja and Lagos" } }];
        ids.campaign = parse<{ campaign_id: string }>(lastResults[0].content).campaign_id;
        return [{ tool: "complete_task", input: { summary: "Campaign record created (organic, no paid budget).", outputs: [{ type: "campaign", id: ids.campaign }] } }];
      },
      Femi: ({ turn, lastResults }) => turn === 0
        ? [{ tool: "save_deliverable", input: { kind: "copy", title: "Captions for 3 branding posts", content: "1. Your logo is your handshake. Is yours firm? Book a free brand audit on WhatsApp.\n2. ...\n3. ...", qc: [{ item: "One CTA per caption", pass: true }, { item: "No stock AI phrasing", pass: true }, { item: "Under 150 words", pass: true }] } }]
        : [{ tool: "complete_task", input: { summary: "Captions written for all 3 posts.", outputs: [{ type: "deliverable", id: parse<{ deliverable_id: string }>(lastResults[0].content).deliverable_id }] } }],
      Ife: ({ turn, lastResults }) => {
        if (turn === 0) return [{ tool: "save_deliverable", input: { kind: "design_svg", format: "svg", title: "Post 1 — Your brand, sharpened", content: svg, platform: "instagram_post_4x5", qc: [{ item: "1080×1350", pass: true }, { item: "Max two type families", pass: true }, { item: "Brand palette", pass: true }] } }];
        ids.designDel = parse<{ deliverable_id: string }>(lastResults[0].content).deliverable_id;
        return [{ tool: "complete_task", input: { summary: "Designed the campaign post set.", outputs: [{ type: "deliverable", id: ids.designDel }] } }];
      },
      Amaka: ({ turn, lastResults, req }) => {
        if (turn === 0) {
          const campaignId = /"type":"campaign","id":"([0-9a-f-]{36})"/.exec(firstText(req))?.[1];
          return [1, 2, 3].map((k) => ({ tool: "create_content_item", input: { platform: "instagram", format: "post", title: `Branding campaign post ${k}`, caption: `Post ${k}: your logo is your handshake — book a free brand audit on WhatsApp.`, objective: "lead_generation", campaign_id: campaignId } }));
        }
        if (turn === 1) { ids.items = JSON.stringify(lastResults.map((r) => parse<{ content_item_id: string }>(r.content).content_item_id)); return [{ tool: "request_publish_content", input: { content_item_ids: JSON.parse(ids.items) } }]; }
        const req2 = parse<{ requested: { approval_id: string; content_item_id: string }[] }>(lastResults[0].content).requested;
        return [{ tool: "complete_task", input: { summary: "3 Instagram posts created and submitted for publishing approval.", outputs: [...req2.map((r) => ({ type: "content_item", id: r.content_item_id })), ...req2.map((r) => ({ type: "approval", id: r.approval_id }))] } }];
      },
    });

    await whatsapp(OWNER_PHONE, text("Create an Instagram campaign for our branding services."));
    await drainQueue();

    const [cmd] = await db.select().from(commands).where(eq(commands.channel, "whatsapp"));
    expect(cmd.status).toBe("completed");
    const agentsInvolved = new Set((await db.select({ a: tasks.agentSlug }).from(tasks).where(eq(tasks.commandId, cmd.id))).map((r) => r.a));
    for (const a of ["content", "copywriting", "graphic-design", "sales-marketing", "social-media"]) expect(agentsInvolved.has(a)).toBe(true);
    expect(await db.select().from(campaigns)).toHaveLength(1);
    const pending = await db.select().from(approvals).where(and(eq(approvals.status, "pending"), eq(approvals.actionType, "social.publish")));
    expect(pending).toHaveLength(3);
    expect((await db.select().from(contentItems)).every((c) => c.status === "awaiting_approval")).toBe(true);

    // Each approval reached the owner's WhatsApp with Approve / Reject / Request-changes buttons.
    const buttons = toOwner().filter((m) => m.type === "interactive");
    expect(buttons).toHaveLength(3);
    expect(buttons[0].interactive!.action.buttons.map((b) => b.reply.title)).toEqual(["Approve", "Reject", "Request changes"]);
    expect(ownerTexts()).toContain("Awaiting your approval");

    // Owner taps "Approve" on the first post → the governed action executes.
    const approveId = buttons[0].interactive!.action.buttons[0].reply.id;
    await whatsapp(OWNER_PHONE, { type: "interactive", interactive: { type: "button_reply", button_reply: { id: approveId, title: "Approve" } } });
    await drainQueue();
    const [a1] = await db.select().from(approvals).where(eq(approvals.id, approveId.split(":")[2]));
    expect(["executed", "failed"]).toContain(a1.status); // executed → published or moved to the manual-publish queue (no Meta page token in tests)
    expect(a1.decisionNote).toContain("WhatsApp");
    const [item1] = await db.select().from(contentItems).where(eq(contentItems.id, String(a1.payload.contentItemId)));
    expect(["published", "manual_publish", "scheduled"]).toContain(item1.status);

    // Owner requests changes on the second post by text → revision goes back to the Social Media agent as a tracked instruction.
    sent = [];
    const second = pending.find((p) => p.id !== a1.id)!;
    await whatsapp(OWNER_PHONE, text(`change ${shortRef(second.id)} make the CTA say "Chat with us on WhatsApp"`));
    const [rev] = await db.select().from(commands).where(and(eq(commands.channel, "whatsapp"), eq(commands.status, "executing")));
    // processed on the queue
    await drainQueue(3);
    const [secondNow] = await db.select().from(approvals).where(eq(approvals.id, second.id));
    expect(secondNow.status).toBe("rejected");
    expect(secondNow.decisionNote).toContain("Chat with us on WhatsApp");
    const revisions = await db.select().from(commands).where(eq(commands.issuedBy, ownerId));
    expect(revisions.some((c) => c.text.startsWith("Revise") && c.channel === "whatsapp")).toBe(true);
    expect(ownerTexts()).toContain("Changes requested");
    void rev;
  });

  it("TEST 3 — WhatsApp: 'Give me our business performance report' → MD answers from real data (and the Claude connector returns the same figures)", async () => {
    const [client] = await db.insert(clients).values({ name: "Jabi Lakeside Suites", createdBy: "test" }).returning();
    await db.insert(transactions).values({ type: "income", amountMinor: 150_000_000, amountBaseMinor: 150_000_000, category: "client_payment", description: "Brand identity — 1st instalment", source: "manual", recordedBy: `user:${ownerId}`, occurredAt: new Date(), clientId: client.id });
    await db.insert(transactions).values({ type: "expense", amountMinor: 20_000_000, amountBaseMinor: 20_000_000, category: "ads", description: "Instagram boost", source: "manual", recordedBy: `user:${ownerId}`, occurredAt: new Date() });
    const past = new Date(Date.now() - 10 * 86400_000).toISOString().slice(0, 10);
    await db.insert(invoices).values({ number: "PH-TEST-001", clientId: client.id, subtotalMinor: 80_000_000, totalMinor: 80_000_000, issueDate: past, dueDate: past, status: "sent", createdBy: "test" });
    await db.insert(leads).values({ companyName: "Asokoro Law Chambers", source: "manual", stage: "proposal_sent", estimatedValueMinor: 120_000_000, createdBy: "test" });

    useScript({
      Adaeze: ({ turn, lastResults }) => {
        if (turn === 0) return [{ tool: "finance_report", input: { period: "this_month" } }, { tool: "sales_metrics", input: { period: "this_month" } }, { tool: "operations_snapshot", input: {} }];
        const fin = parse<{ formatted: { income: string; expenses: string; net: string } }>(lastResults[0].content);
        return [{ tool: "complete_task", input: { answer_only: true, summary: `Business performance (this month, recorded data only): revenue received ${fin.formatted.income}; expenses ${fin.formatted.expenses}; net ${fin.formatted.net}. Outstanding: 1 overdue invoice of ₦800,000. Pipeline (estimate, not revenue): 1 proposal out. No sales closed yet this month.` } }];
      },
    });
    await whatsapp(OWNER_PHONE, text("Give me our business performance report."));
    await drainQueue();
    const [cmd] = await db.select().from(commands).where(eq(commands.channel, "whatsapp"));
    expect(cmd.status).toBe("completed");
    const msgs = ownerTexts();
    expect(msgs).toContain("₦1,500,000");
    expect(msgs).toContain("₦200,000");
    expect(msgs).toContain("₦1,300,000");

    const snap = await callTool("business_snapshot");
    expect(snap.text).toContain("Revenue (recorded payments): ₦1,500,000");
    expect(snap.text).toContain("Overdue: ₦800,000 (1)");
    expect(snap.text).toContain("Pipeline (estimates, not revenue)");
    expect(snap.text).toContain("Marketing spend: ₦200,000");
    const owed = await callTool("outstanding_payments", { overdue_only: true });
    expect(owed.text).toContain("PH-TEST-001");
  });

  it("TEST 4 — a new client contacts the business on WhatsApp → lead + requirements captured, Client Manager triages, Managing Director/owner notified", async () => {
    useScript({
      Ngozi: ({ turn, req }) => {
        const leadId = /lead_id=([0-9a-f-]{36})/.exec(firstText(req))![1];
        if (turn === 0) return [
          { tool: "update_lead", input: { lead_id: leadId, stage: "responded", note: "Inbound request for logo + website", add_verified_facts: ["Restaurant in Wuse 2, Abuja", "Opening in 6 weeks"], estimated_value_ngn: 1200000 } },
          { tool: "schedule_follow_up", input: { lead_id: leadId, due_in_days: 1, reason: "Collect budget and brand references" } },
          { tool: "request_send_whatsapp", input: { to: `+${PROSPECT_PHONE}`, lead_id: leadId, purpose: "First reply to inbound enquiry", text: "Hi Amina, thanks for reaching out to Prohub! Congratulations on the new restaurant. To prepare a proposal, could you share your opening date, budget range and any brands you admire?" } },
          { tool: "send_agent_message", input: { to_agent: "managing-director", subject: "New inbound lead: restaurant in Wuse 2", body: "Logo + website enquiry, opening in 6 weeks, est. ₦1.2m. Reply drafted for approval; follow-up scheduled." } },
        ];
        return [{ tool: "complete_task", input: { summary: "Qualified the restaurant enquiry (logo + website, opening in 6 weeks), drafted a reply for approval and scheduled a follow-up. Pricing not quoted — awaiting approved pricing.", outputs: [{ type: "lead", id: leadId }] } }];
      },
    });
    await whatsapp(PROSPECT_PHONE, text("Hello, I'm opening a restaurant in Wuse 2 in about 6 weeks and need a logo and a simple website. Can you help?"), "Amina Bello");
    await drainQueue();

    const [lead] = await db.select().from(leads).where(eq(leads.phone, `+${PROSPECT_PHONE}`));
    expect(lead.source).toBe("whatsapp");
    expect(lead.contactName).toBe("Amina Bello");
    expect(lead.problemIdentified).toContain("logo");
    expect(lead.stage).toBe("responded");
    const hist = await db.select().from(interactions).where(eq(interactions.leadId, lead.id));
    expect(hist.some((h) => h.direction === "inbound" && h.channel === "whatsapp")).toBe(true);
    const triage = await db.select().from(tasks).where(and(eq(tasks.leadId, lead.id), eq(tasks.agentSlug, "client-management")));
    expect(triage[0].status).toBe("completed");
    const reply = await db.select().from(approvals).where(eq(approvals.actionType, "whatsapp.send"));
    expect(reply).toHaveLength(1); // the reply waits for approval — nothing was sent to the prospect
    expect(sent.filter((m) => m.to === PROSPECT_PHONE)).toHaveLength(0);
    expect((await db.select().from(notifications)).some((n) => n.title.includes("New enquiry"))).toBe(true);
    expect(ownerTexts()).toContain("New enquiry");
    // A stranger can never issue commands.
    expect(await db.select().from(commands)).toHaveLength(0);
  });

  it("TEST 5 — Claude: 'Research five new ways we can generate revenue this month' → structured, sourced opportunities with costs, revenue and priorities", async () => {
    const ideas = [
      ["Brand-audit-as-a-service for SMEs", 60000, 2500000], ["Monthly content retainers for clinics", 150000, 4800000], ["Event promo video packages (Detty December)", 400000, 6000000],
      ["WhatsApp catalogue setup for retailers", 50000, 1800000], ["Website care plans for past clients", 30000, 1500000],
    ] as const;
    useScript({
      Adaeze: ({ turn, req }) => {
        const first = firstText(req);
        if (first.includes("resuming after your delegated subtasks")) {
          const outs = subtaskOutputs(first).filter((o) => o.type === "intel");
          return [{ tool: "complete_task", input: { summary: `Five revenue opportunities for this month are in the Intelligence Centre, ranked by priority with cost and revenue estimates. Top pick: event promo video packages (high priority).`, outputs: outs } }];
        }
        if (turn === 0) return [{ tool: "delegate_task", input: { agent: "research", title: "Five revenue opportunities this month", instructions: "Research five specific ways Prohub can generate revenue this month in Nigeria, each with sources, implementation cost, revenue potential, recommended action and priority." } }];
        return [{ tool: "await_subtasks", input: { plan_notes: "Research → consolidate ranked recommendations." } }];
      },
      Kemi: ({ turn, lastResults }) => {
        if (turn === 0) return ideas.map(([title, cost, rev], i) => ({ tool: "record_intel", input: {
          category: "revenue_opportunity", title, summary: `Demand signal observed for ${title.toLowerCase()} among Nigerian SMEs this quarter.`, source_urls: [`https://example.com/source-${i}`], confidence: "likely",
          opportunity: `Package and sell ${title.toLowerCase()} to existing leads and past clients.`, recommendation: `Sales to pitch to 10 warm leads this week; Content to publish one proof post.`,
          priority: i === 2 ? "high" : i < 2 ? "medium" : "low", economics: { est_cost_ngn: cost, est_revenue_ngn: rev, requirements: "Existing team capacity", risks: "Seasonal demand" },
        } }));
        return [{ tool: "complete_task", input: { summary: "Recorded 5 revenue opportunities with economics.", outputs: lastResults.map((r) => ({ type: "intel", id: parse<{ intel_id: string }>(r.content).intel_id })) } }];
      },
    });
    const sentRes = await callTool("send_instruction", { instruction: "Research five new ways we can generate revenue this month." });
    expect(sentRes.text).toContain("Instruction received");
    const ref = /reference ([0-9A-F]{6})/.exec(sentRes.text)![1];
    await drainQueue();
    const status = await callTool("get_instruction_status", { ref });
    expect(status.text).toContain("— completed");
    expect(status.text).toContain("Five revenue opportunities");
    const intel = await db.select().from(intelItems);
    expect(intel).toHaveLength(5);
    for (const i of intel) {
      expect(i.opportunity).toBeTruthy(); expect(i.recommendation).toBeTruthy(); expect(i.sourceUrls.length).toBeGreaterThan(0);
      expect(i.economics?.estCostMinor).toBeGreaterThan(0); expect(i.economics?.estRevenueMinor).toBeGreaterThan(0);
    }
    expect(intel.filter((i) => i.priority === "high")).toHaveLength(1);
  });

  it("TEST 6 — Claude: 'Create a 15-second advertisement for a client' → copy + video agents produce real MP4s (9:16, 1:1, 16:9) for review", async () => {
    const avail = await renderAvailable();
    expect(avail.ok, avail.reason).toBe(true);
    const [client] = await db.insert(clients).values({ name: "Jabi Lakeside Suites", createdBy: "test" }).returning();
    await db.insert(brandAssets).values({ clientId: client.id, kind: "palette", name: "Primary palette", value: JSON.stringify({ primary: "#12332B", accent: "#E9B44C", background: "#0A1F1A", text: "#FBF7EF" }), createdBy: "test" });
    let copyTask = "";
    useScript({
      Adaeze: ({ turn, lastResults, req }) => {
        const first = firstText(req);
        if (first.includes("resuming after your delegated subtasks")) {
          const outs = subtaskOutputs(first);
          return [{ tool: "complete_task", input: { summary: "15-second ad for Jabi Lakeside Suites is ready for review in 9:16, 1:1 and 16:9, with script. Not published — awaiting your review.", outputs: outs } }];
        }
        if (turn === 0) return [{ tool: "delegate_task", input: { agent: "copywriting", title: "15s ad script — Jabi Lakeside Suites", client_id: client.id, instructions: "Write a 15-second, 5-scene script for a weekend-staycation ad for Jabi Lakeside Suites aimed at Abuja professionals; on-screen text only, ≤3 words per second." } }];
        if (turn === 1) { copyTask = parse<{ task_id: string }>(lastResults[0].content).task_id; return [{ tool: "delegate_task", input: { agent: "video-production", title: "Produce the 15s ad in 9:16, 1:1, 16:9", client_id: client.id, depends_on: [copyTask], instructions: "Turn the approved script into a finished 15-second motion-graphics ad in the client's palette, in 9:16, 1:1 and 16:9, saved to the client's folder." } }]; }
        return [{ tool: "await_subtasks", input: { plan_notes: "Script, then video render." } }];
      },
      Femi: ({ turn, lastResults }) => turn === 0
        ? [{ tool: "save_deliverable", input: { kind: "script", title: "Jabi Lakeside Suites — 15s staycation", client_id: client.id, content: "S1 Weekend, sorted. S2 Lake views from every room. S3 Pool · Spa · Brunch. S4 Book your staycation. S5 Logo.", qc: [{ item: "15s total", pass: true }, { item: "≤3 words/s", pass: true }, { item: "CTA in final 3s", pass: true }] } }]
        : [{ tool: "complete_task", input: { summary: "Wrote the 15-second, 5-scene staycation script.", outputs: [{ type: "deliverable", id: parse<{ deliverable_id: string }>(lastResults[0].content).deliverable_id }] } }],
      Segun: ({ turn, lastResults }) => {
        if (turn === 0) return [{ tool: "brand_assets", input: { action: "list", client_id: client.id } }];
        if (turn === 1) {
          const pal = JSON.parse(parse<{ value: string }[]>(lastResults[0].content)[0].value);
          return [{ tool: "render_video", input: {
            title: "Jabi Lakeside Suites — Weekend staycation (15s)", objective: "Drive weekend staycation bookings from Abuja professionals.", client_id: client.id,
            brand: { name: "Jabi Lakeside Suites", ...pal, heading_font: "Montserrat" },
            scenes: [
              { layout: "hook", duration: 3, eyebrow: "This weekend", headline: "Weekend, sorted." },
              { layout: "statement", duration: 3, headline: "Lake views from every room", background: "dark" },
              { layout: "list", duration: 3.5, headline: "Stay for", items: ["Pool", "Spa", "Sunday brunch"] },
              { layout: "cta", duration: 3.5, headline: "Book your staycation", button: "Reserve on WhatsApp", contact: "jabilakesidesuites.ng" },
              { layout: "logo", duration: 2, headline: "Jabi, Abuja" },
            ],
            formats: ["9:16", "1:1", "16:9"], fps: 30,
          } }];
        }
        const r = parse<{ deliverable_id: string; failed_qc: string[] }>(lastResults[0].content);
        expect(r.failed_qc).toEqual([]);
        return [{ tool: "complete_task", input: { summary: "Rendered the 15s ad in 3 formats; all measured QC checks pass.", outputs: [{ type: "deliverable", id: r.deliverable_id }] } }];
      },
    });

    const sentRes = await callTool("send_instruction", { instruction: "Create a 15-second advertisement for our client Jabi Lakeside Suites." });
    const ref = /reference ([0-9A-F]{6})/.exec(sentRes.text)![1];
    await drainQueue();

    const [video] = await db.select().from(deliverables).where(eq(deliverables.kind, "video"));
    expect(video.clientId).toBe(client.id);
    expect(video.status).toBe("in_review");
    expect(video.qc.length).toBeGreaterThanOrEqual(24);
    expect(video.qc.every((q) => q.pass)).toBe(true);
    expect(video.fileIds).toHaveLength(6);
    const mp4s = [];
    for (const id of video.fileIds) { const f = await readFile(id); if (f?.mimeType === "video/mp4") mp4s.push(f); }
    expect(mp4s.map((f) => f.meta.format).sort()).toEqual(["16:9", "1:1", "9:16"]);
    for (const f of mp4s) {
      expect(f.data.subarray(4, 8).toString()).toBe("ftyp");
      expect(Number(f.meta.durationS)).toBeCloseTo(15, 0);
      expect(f.sizeBytes).toBeLessThan(16 * 1048576); // deliverable over WhatsApp
    }
    const status = await callTool("get_instruction_status", { ref });
    expect(status.text).toContain("— completed");
    expect(status.text).toContain("ready for review");
    const del = await callTool("get_deliverable", { id: video.id });
    expect(del.text).toMatch(/\.mp4 \(video\/mp4/);
    const script = await db.select().from(deliverables).where(and(eq(deliverables.kind, "script"), eq(deliverables.clientId, client.id)));
    expect(script).toHaveLength(1);
  }, 400_000);
});

describe("channel security", () => {
  it("Claude connector rejects missing/revoked tokens and lists its tools for a valid one", async () => {
    const bad = await handleMcp(new Request("http://localhost/api/mcp", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }) }), null);
    expect(bad.status).toBe(401);
    const list = await mcp("tools/list");
    const names = list.result!.tools!.map((t) => t.name);
    for (const n of ["send_instruction", "get_instruction_status", "task_board", "business_snapshot", "pipeline", "list_approvals", "decide_approval", "get_report", "list_agents", "get_deliverable"]) expect(names).toContain(n);
  });

  it("WhatsApp: Level-3 approvals can't be authorised by chat; viewers can't issue instructions; duplicate deliveries are processed once", async () => {
    const { requestApproval } = await import("@/governance/approvals");
    const a = await requestApproval({ actionType: "spend.authorize", title: "Boost campaign ₦100,000", summary: "Ad spend", payload: { amountNgn: 100000 } });
    await drainQueue();
    sent = [];
    await whatsapp(OWNER_PHONE, text(`approve ${shortRef(a.id)}`));
    await drainQueue();
    expect((await db.select().from(approvals).where(eq(approvals.id, a.id)))[0].status).toBe("pending");
    expect(ownerTexts()).toContain("owner-only (Level 3)");

    const [viewer] = await db.insert(users).values({ email: "viewer@test.local", name: "Viewer", role: "viewer", passwordHash: "x" }).returning();
    await db.insert(authorizedSenders).values({ channel: "whatsapp", address: "2348030000002", userId: viewer.id });
    await whatsapp("2348030000002", text("Find 50 new clients now"));
    await drainQueue();
    expect(await db.select().from(commands)).toHaveLength(0);
    expect(sent.some((m) => m.to === "2348030000002" && m.text?.includes("view-only"))).toBe(true);

    // Meta redelivers the same message id: processed exactly once.
    const payload = { object: "whatsapp_business_account", entry: [{ changes: [{ field: "messages", value: { contacts: [], messages: [{ from: PROSPECT_PHONE, id: "wamid.dup.1", type: "text", text: { body: "Hi, do you design menus?" } }] } }] }] };
    for (let k = 0; k < 3; k++) {
      await metaWebhook(new Request("http://localhost/api/webhooks/meta", { method: "POST", body: JSON.stringify(payload) }));
      if (k === 1) { useScript({ Ngozi: () => [{ tool: "fail_task", input: { reason: "test: no action needed for this message" } }] }); await drainQueue(); }
    }
    await drainQueue();
    const inbound = await db.select().from(interactions).where(and(eq(interactions.direction, "inbound"), inArray(interactions.externalId, ["wamid.dup.1"])));
    expect(inbound).toHaveLength(1);
  });
});
