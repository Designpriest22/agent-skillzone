import { describe, expect, it } from "vitest";
import { getEntitlement } from "@/lib/entitlements";
import { handlePaystackEvent } from "@/lib/payments/service";
import { exportUserData, deleteAccount } from "@/lib/services/account";
import { runAdminAction } from "@/lib/services/admin";
import { runDailyJobs } from "@/lib/services/cron";
import { startSession, sendTurn } from "@/lib/services/tutor";
import { asSessionUser, makeUser, sql } from "./helpers";

describe("payments and entitlements", () => {
  it("activates a plan from a verified charge.success event exactly once", async () => {
    const u = await makeUser();
    await sql`insert into plan_prices (plan_code, provider, currency, amount_minor, billing_interval, provider_plan_code)
              values ('plus', 'paystack', 'NGN', 100000, 'monthly', 'PLN_test_monthly') on conflict do nothing`;
    expect((await getEntitlement(u.id)).planCode).toBe("free");
    const event = {
      event: "charge.success",
      data: {
        id: 991001 + Math.floor(Math.random() * 1e6),
        reference: "ref1",
        metadata: { user_id: u.id },
        plan: { plan_code: "PLN_test_monthly" },
        customer: { email: u.email, customer_code: "CUS_1" },
      },
    };
    expect(await handlePaystackEvent(event)).toBe("applied");
    expect(await handlePaystackEvent(event)).toBe("duplicate");
    const ent = await getEntitlement(u.id);
    expect(ent.planCode).toBe("plus");
    expect(ent.limits.daily_ai_turns).toBe(200);
    const subs = await sql`select * from subscriptions where user_id = ${u.id}`;
    expect(subs).toHaveLength(1);
  });

  it("ignores events for unknown plans and handles cancellation", async () => {
    const u = await makeUser();
    expect(
      await handlePaystackEvent({
        event: "charge.success",
        data: { id: 5550001, metadata: { user_id: u.id }, plan: { plan_code: "PLN_unknown" } },
      }),
    ).toBe("ignored");
    await sql`insert into subscriptions (user_id, plan_code, provider, provider_subscription_code, status, current_period_end)
              values (${u.id}, 'plus', 'paystack', 'SUB_cancel_me', 'active', now() + interval '10 days')`;
    expect(
      await handlePaystackEvent({
        event: "subscription.not_renew",
        data: { id: 5550002, subscription_code: "SUB_cancel_me" },
      }),
    ).toBe("applied");
    const ent = await getEntitlement(u.id);
    expect(ent.planCode).toBe("plus"); // access continues until the period ends
    expect(ent.subscription?.status).toBe("non_renewing");
  });
});

describe("admin actions", () => {
  it("enforces per-action roles and audits what happens", async () => {
    const reviewer = await makeUser({ role: "reviewer" });
    const target = await makeUser();
    await expect(
      runAdminAction(asSessionUser(reviewer, "reviewer"), "set_user_role", {
        userId: target.id,
        role: "admin",
      }),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      runAdminAction(asSessionUser(target), "resolve_report", { id: target.id, status: "resolved" }),
    ).rejects.toMatchObject({ status: 403 });

    const [v] =
      await sql`select id from vocabulary where language_code = 'yo' and review_status = 'editorial_draft' limit 1`;
    await runAdminAction(asSessionUser(reviewer, "reviewer"), "review_content", {
      entityType: "vocabulary",
      entityId: v!.id,
      decision: "approve",
      notes: "Native speaker check",
    });
    const [after] = await sql`select review_status, reviewed_by from vocabulary where id = ${v!.id}`;
    expect(after).toMatchObject({ review_status: "verified", reviewed_by: reviewer.id });
    const [log] =
      await sql`select * from audit_events where actor_id = ${reviewer.id} order by id desc limit 1`;
    expect(log!.action).toBe("admin.review_content");
  });

  it("sends edited content back to review and keeps the old version", async () => {
    const editor = await makeUser({ role: "editor" });
    const [v] = await sql`select * from vocabulary where language_code = 'ig' limit 1`;
    await runAdminAction(asSessionUser(editor, "editor"), "update_vocabulary", {
      id: v!.id,
      text: v!.text,
      translation: `${v!.translation} (edited)`,
      literal_meaning: "",
      context_note: "",
      register: "neutral",
      confidence: "medium",
    });
    const [after] = await sql`select version, review_status from vocabulary where id = ${v!.id}`;
    expect(after).toMatchObject({ version: v!.version + 1, review_status: "in_review" });
    const [snap] = await sql`select snapshot from content_versions where entity_id = ${v!.id}`;
    expect(snap!.snapshot.translation).toBe(v!.translation);
  });

  it("won't mark a language available before its content is verified", async () => {
    const admin = await makeUser({ role: "admin" });
    await expect(
      runAdminAction(asSessionUser(admin, "admin"), "update_language", {
        code: "yo",
        catalogue_status: "available",
        content_status: "draft",
        stt_status: "untested",
        tts_status: "untested",
        tutor_status: "experimental",
        human_reviewer_status: "recruiting",
        limitations: "",
        speech_notes: "",
      }),
    ).rejects.toMatchObject({ status: 400 });
  });
});

describe("account data", () => {
  it("exports and then deletes everything belonging to a learner", async () => {
    const u = await makeUser();
    const s = await startSession(u.id, { languageCode: "yo", tutorId: "kemi", settings: {} });
    await sendTurn(u.id, s.sessionId, { text: "Báwo ni?", inputMode: "text" });
    await sql`insert into content_contributions (contributor_id, language_code, kind, payload, status) values (${u.id}, 'yo', 'new_vocabulary', '{"text":"x"}', 'accepted')`;
    await sql`insert into analytics_events (user_id, name) values (${u.id}, 'signup')`;

    const data = await exportUserData(u.id);
    expect(data.user!.email).toBe(u.email);
    expect(data.transcripts.length).toBeGreaterThan(0);

    await expect(deleteAccount(u.id, "wrong@example.test")).rejects.toMatchObject({ status: 400 });
    await deleteAccount(u.id, u.email.toUpperCase());
    for (const t of ["users", "profiles", "learning_sessions", "conversation_turns", "learning_plans"]) {
      const col = t === "users" ? "id" : "user_id";
      const rows = await sql`select 1 from ${sql(t)} where ${sql(col)} = ${u.id}`;
      expect(rows, t).toHaveLength(0);
    }
    const [c] =
      await sql`select contributor_id from content_contributions where payload->>'text' = 'x' order by created_at desc limit 1`;
    expect(c!.contributor_id).toBeNull(); // accepted contribution kept, anonymised
    const [ev] = await sql`select count(*)::int as n from analytics_events where user_id = ${u.id}`;
    expect(ev!.n).toBe(0);
  });

  it("deletes transcripts after their retention period but keeps summaries", async () => {
    const u = await makeUser();
    const s = await startSession(u.id, { languageCode: "yo", tutorId: "kemi", settings: {} });
    await sql`update learning_sessions set transcript_expires_at = now() - interval '1 day', summary = '{"summary":"kept"}' where id = ${s.sessionId}`;
    const r = await runDailyJobs();
    expect(r.transcriptTurnsDeleted).toBeGreaterThan(0);
    const turns = await sql`select 1 from conversation_turns where session_id = ${s.sessionId}`;
    expect(turns).toHaveLength(0);
    const [sess] = await sql`select summary from learning_sessions where id = ${s.sessionId}`;
    expect(sess!.summary.summary).toBe("kept");
  });
});
