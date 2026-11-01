import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { db, closeDb } from "@/db/client";
import { approvals, users, transactions, clients, invoices, revenueTargets, leads, jobs, schedules, reports, followUps, tasks } from "@/db/schema";
import { requestApproval, decideApproval } from "@/governance/approvals";
import { executeApproval } from "@/governance/actions";
import { canApprove } from "@/governance/permissions";
import { financeSummary, targetStatus, pipelineSummary, receivables } from "@/services/finance";
import { scoreLead } from "@/services/scoring";
import { enqueue, claimJob, failJob, completeJob } from "@/orchestrator/queue";
import { tickScheduler } from "@/orchestrator/scheduler";
import { checkFollowUps } from "@/orchestrator/cycles";
import { generateReport } from "@/services/reports";
import { reportToCsv, reportToPdf, reportToXlsx } from "@/services/report-render";
import { monthPeriod, isoDate, parseMonth } from "@/lib/time";
import { encryptJson, decryptJson, hashPassword, verifyPassword } from "@/lib/crypto";
import { resetDb, drainQueue } from "./helpers";
import { setLLMClient } from "@/agents/llm";

beforeEach(async () => {
  await resetDb();
  setLLMClient(null);
});
afterAll(closeDb);

async function mkUser(role: "owner" | "manager" | "viewer") {
  if (role === "owner") return (await db.select().from(users).where(eq(users.role, "owner")))[0];
  const [u] = await db.insert(users).values({ email: `${role}-${Date.now()}@t.local`, name: role, role, passwordHash: await hashPassword("x-password-1") }).returning();
  return u;
}

describe("permissions & approvals", () => {
  it("enforces level-based approval rights", () => {
    expect(canApprove("viewer", 2)).toBe(false);
    expect(canApprove("manager", 2)).toBe(true);
    expect(canApprove("manager", 3)).toBe(false);
    expect(canApprove("owner", 3)).toBe(true);
  });

  it("L2 email: viewer cannot approve, manager can; execution failure is recorded and recoverable", async () => {
    const a = await requestApproval({ actionType: "email.send", agentSlug: "client-management", title: "Email prospect", summary: "First contact", payload: { to: "ceo@example.com", subject: "Hello", body: "Personalised pitch body text here." } });
    expect(a.level).toBe(2);
    const viewer = await mkUser("viewer");
    await expect(decideApproval({ approvalId: a.id, userId: viewer.id, role: viewer.role, decision: "approve" })).rejects.toThrow(/cannot approve/);
    const manager = await mkUser("manager");
    await decideApproval({ approvalId: a.id, userId: manager.id, role: manager.role, decision: "approve" });
    await drainQueue();
    const [after] = await db.select().from(approvals).where(eq(approvals.id, a.id));
    expect(after.status).toBe("failed"); // SMTP not configured in tests
    expect(after.error).toMatch(/not configured/);
    // Recovery path: a failed approval can be executed again once fixed.
    await expect(executeApproval(a.id)).rejects.toThrow(/not configured/);
    const [again] = await db.select().from(approvals).where(eq(approvals.id, a.id));
    expect(again.status).toBe("failed");
  });

  it("L3 spend authorisation requires the owner and never moves money", async () => {
    const a = await requestApproval({ actionType: "spend.authorize", agentSlug: "sales-marketing", title: "Meta ads budget", summary: "₦200,000 test budget", payload: { amount_ngn: 200000 } });
    expect(a.level).toBe(3);
    const manager = await mkUser("manager");
    await expect(decideApproval({ approvalId: a.id, userId: manager.id, role: "manager", decision: "approve" })).rejects.toThrow(/Only the owner/);
    const owner = await mkUser("owner");
    await decideApproval({ approvalId: a.id, userId: owner.id, role: "owner", decision: "approve" });
    await drainQueue();
    const [after] = await db.select().from(approvals).where(eq(approvals.id, a.id));
    expect(after.status).toBe("executed");
    expect(after.executionResult?.authorised).toBe(true);
    expect(await db.select().from(transactions)).toHaveLength(0);
  });

  it("decisions cannot be made twice", async () => {
    const a = await requestApproval({ actionType: "site_page.publish", title: "Publish", summary: "x", payload: { pageId: "00000000-0000-0000-0000-000000000000" } });
    const owner = await mkUser("owner");
    await decideApproval({ approvalId: a.id, userId: owner.id, role: "owner", decision: "reject", note: "Not now" });
    await expect(decideApproval({ approvalId: a.id, userId: owner.id, role: "owner", decision: "approve" })).rejects.toThrow(/already rejected/);
  });
});

describe("finance & revenue targets", () => {
  async function seedLedger() {
    const [c] = await db.insert(clients).values({ name: "Eko Hotel Test", createdBy: "user:test" }).returning();
    const now = new Date();
    const rows = [
      { type: "income" as const, amountMinor: 5_000_000_00, category: "client_payment", serviceSlug: "social-media-management", clientId: c.id },
      { type: "income" as const, amountMinor: 2_500_000_00, category: "client_payment", serviceSlug: "video-production-animation", clientId: c.id },
      { type: "expense" as const, amountMinor: 800_000_00, category: "freelancers" },
      { type: "expense" as const, amountMinor: 300_000_00, category: "ads" },
      { type: "refund" as const, amountMinor: 100_000_00, category: "refund", clientId: c.id },
    ];
    for (const r of rows) await db.insert(transactions).values({ ...r, amountBaseMinor: r.amountMinor, description: "test", source: "manual", recordedBy: "user:test", occurredAt: now });
    return c;
  }

  it("summarises recorded transactions only", async () => {
    const c = await seedLedger();
    const s = await financeSummary(monthPeriod());
    expect(s.incomeMinor).toBe(7_500_000_00);
    expect(s.expenseMinor).toBe(1_100_000_00);
    expect(s.refundMinor).toBe(100_000_00);
    expect(s.netMinor).toBe(6_300_000_00);
    expect(s.byService[0]).toEqual({ service: "social-media-management", incomeMinor: 5_000_000_00 });
    expect(s.byClient[0].clientId).toBe(c.id);
  });

  it("computes progress against the ₦15m monthly target without counting pipeline as revenue", async () => {
    await seedLedger();
    const start = isoDate(new Date(monthPeriod().start.getTime() + 12 * 3600_000));
    await db.insert(revenueTargets).values({ periodType: "month", periodStart: start, revenueTargetMinor: 15_000_000_00, avgDealValueMinor: 1_500_000_00, leadTarget: 100, newClientsTarget: 20, createdBy: "user:test" });
    await db.insert(leads).values({ companyName: "Big Pipeline Co", source: "manual", stage: "negotiation", estimatedValueMinor: 10_000_000_00, createdBy: "user:test" });
    const t = await targetStatus("month");
    expect(t.configured).toBe(true);
    if (!t.configured) return;
    expect(t.achievedMinor).toBe(7_400_000_00); // income − refunds; the ₦10m negotiation is NOT revenue
    expect(t.remainingMinor).toBe(7_600_000_00);
    expect(Math.round(t.pctAchieved)).toBe(49);
    expect(t.dealsRequired).toBe(6); // ceil(7.6m / 1.5m)
    expect(t.pipeline.weightedValueMinor).toBe(7_000_000_00); // 70% of 10m
    expect(t.marketingSpendMinor).toBe(300_000_00);
  });

  it("tracks receivables and overdue invoices", async () => {
    const [c] = await db.insert(clients).values({ name: "Client", createdBy: "user:test" }).returning();
    await db.insert(invoices).values([
      { number: "PH-T-1", clientId: c.id, subtotalMinor: 1000_00, totalMinor: 1000_00, amountPaidMinor: 200_00, status: "partially_paid", issueDate: "2026-01-01", dueDate: "2026-01-15", createdBy: "t" },
      { number: "PH-T-2", clientId: c.id, subtotalMinor: 500_00, totalMinor: 500_00, status: "sent", issueDate: "2026-01-01", dueDate: "2099-01-01", createdBy: "t" },
      { number: "PH-T-3", clientId: c.id, subtotalMinor: 900_00, totalMinor: 900_00, status: "draft", issueDate: "2026-01-01", dueDate: "2026-01-02", createdBy: "t" },
    ]);
    const r = await receivables();
    expect(r.totalOutstandingMinor).toBe(1300_00);
    expect(r.overdueMinor).toBe(800_00);
    expect(r.overdueCount).toBe(1);
  });

  it("scores leads transparently", () => {
    expect(scoreLead({}).score).toBe(5);
    const hot = scoreLead({ industryFit: true, observedWeaknesses: 3, budgetSignal: "strong", timingTrigger: true, verifiedContact: true, decisionMakerKnown: true });
    expect(hot.priority).toBe("hot");
    expect(hot.score).toBe(20 + 24 + 20 + 15 + 10);
  });

  it("weights pipeline by stage probability", async () => {
    await db.insert(leads).values([
      { companyName: "A", source: "manual", stage: "proposal_sent", estimatedValueMinor: 1000_00, createdBy: "t" },
      { companyName: "B", source: "manual", stage: "won", estimatedValueMinor: 5000_00, createdBy: "t" },
      { companyName: "C", source: "manual", stage: "lost", estimatedValueMinor: 5000_00, createdBy: "t" },
    ]);
    const p = await pipelineSummary();
    expect(p.openCount).toBe(1);
    expect(p.weightedValueMinor).toBe(550_00);
  });
});

describe("queue, scheduler and automation", () => {
  it("dedupes, claims, retries with backoff and dead-letters", async () => {
    const id = await enqueue("followups.check", {}, { dedupeKey: "k1", maxAttempts: 2 });
    expect(await enqueue("followups.check", {}, { dedupeKey: "k1" })).toBeNull();
    let job = await claimJob("w1");
    expect(job?.id).toBe(id);
    expect(await claimJob("w2")).toBeNull(); // locked
    expect(await failJob(job!, "boom")).toBe(false);
    await db.update(jobs).set({ runAt: new Date() }).where(eq(jobs.id, id!));
    job = await claimJob("w1");
    expect(job?.attempts).toBe(2);
    expect(await failJob(job!, "boom again")).toBe(true);
    const [dead] = await db.select().from(jobs).where(eq(jobs.id, id!));
    expect(dead.status).toBe("dead");
    const ok = await enqueue("followups.check", {});
    const j2 = await claimJob("w1");
    await completeJob(j2!.id);
    const [done] = await db.select().from(jobs).where(eq(jobs.id, ok!));
    expect(done.status).toBe("succeeded");
  });

  it("fires due schedules exactly once per slot", async () => {
    await db.update(schedules).set({ nextRunAt: new Date(Date.now() - 1000) }).where(eq(schedules.slug, "follow-up-reminders"));
    const fired = await tickScheduler();
    expect(fired).toContain("follow-up-reminders");
    expect(await tickScheduler()).not.toContain("follow-up-reminders");
    const queued = await db.select().from(jobs).where(eq(jobs.type, "followups.check"));
    expect(queued).toHaveLength(1);
  });

  it("turns overdue follow-ups into agent tasks once", async () => {
    const [l] = await db.insert(leads).values({ companyName: "Due Co", source: "manual", createdBy: "t" }).returning();
    await db.insert(followUps).values({ leadId: l.id, agentSlug: "client-management", dueAt: new Date(Date.now() - 3600_000), reason: "No reply", createdBy: "t" });
    expect((await checkFollowUps()).created).toBe(1);
    expect((await checkFollowUps()).created).toBe(0);
    const t = await db.select().from(tasks).where(eq(tasks.agentSlug, "client-management"));
    expect(t[0].title).toContain("Due Co");
  });
});

describe("reports", () => {
  it("generates the 12-section daily business report from data and renders PDF/XLSX/CSV", async () => {
    const r = await generateReport("daily_briefing");
    const sections = (r.data as { sections: { title: string }[] }).sections;
    for (let i = 1; i <= 12; i++) expect(sections.some((s) => s.title.startsWith(`${i}.`))).toBe(true);
    const [row] = await db.select().from(reports).where(eq(reports.id, r.id));
    expect(reportToCsv(row)).toContain("Daily Business Report");
    expect((await reportToPdf(row)).subarray(0, 4).toString()).toBe("%PDF");
    expect((await reportToXlsx(row)).length).toBeGreaterThan(1000);
  });

  it("builds weekly, monthly and social reports", async () => {
    for (const k of ["weekly_business", "monthly_finance", "social_weekly", "daily_finance"] as const) {
      const r = await generateReport(k);
      expect((r.data as { sections: unknown[] }).sections.length).toBeGreaterThan(1);
    }
  });
});

describe("security primitives", () => {
  it("encrypts credentials and hashes passwords", async () => {
    const c = encryptJson({ apiKey: "sk-secret" });
    expect(c).not.toContain("sk-secret");
    expect(decryptJson(c)).toEqual({ apiKey: "sk-secret" });
    const h = await hashPassword("correct horse");
    expect(await verifyPassword("correct horse", h)).toBe(true);
    expect(await verifyPassword("wrong", h)).toBe(false);
  });

  it("parses month names for 'revenue for October'", () => {
    const p = parseMonth("October 2026")!;
    expect(p.label).toBe("October 2026");
    expect(p.start.toISOString()).toBe("2026-09-30T23:00:00.000Z"); // Lagos is UTC+1
  });
});

describe("time periods (Africa/Lagos)", () => {
  it("labels days and weeks by the local calendar date, not UTC", async () => {
    const { dayPeriod, weekPeriod } = await import("@/lib/time");
    const at = new Date("2026-11-01T10:00:00Z"); // Sunday 11:00 in Lagos
    expect(dayPeriod(at).label).toBe("2026-11-01");
    expect(dayPeriod(at).start.toISOString()).toBe("2026-10-31T23:00:00.000Z");
    expect(dayPeriod(at, -1).label).toBe("2026-10-31");
    expect(weekPeriod(at).label).toBe("Week of 2026-10-26");
  });
});

describe("inbound enquiries", () => {
  it("creates a lead, inbound interaction and a triage task; repeat contact reuses the lead", async () => {
    const { intakeEnquiry } = await import("@/services/enquiries");
    const a = await intakeEnquiry({ name: "Tola", company: "Lekki Suites", email: "tola@example.com", message: "Need Instagram help", channel: "website", source: "website_form" });
    expect(a.isNew).toBe(true);
    const b = await intakeEnquiry({ name: "Tola", email: "TOLA@example.com", message: "Following up", channel: "website", source: "website_form" });
    expect(b.leadId).toBe(a.leadId);
    const t = await db.select().from(tasks).where(eq(tasks.leadId, a.leadId));
    expect(t).toHaveLength(2);
    expect(t.every((x) => x.agentSlug === "client-management" && x.status === "queued")).toBe(true);
  });
});
