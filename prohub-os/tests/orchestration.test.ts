import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { db, closeDb } from "@/db/client";
import { tasks, commands, leads, deliverables, intelItems, agentRuns, activityLog, agents, users } from "@/db/schema";
import { submitCommand } from "@/orchestrator/commands";
import { setLLMClient } from "@/agents/llm";
import { resetDb, useScript, drainQueue, parse } from "./helpers";

async function ownerId() {
  const [u] = await db.select().from(users).where(eq(users.role, "owner"));
  return u.id;
}

beforeEach(async () => {
  await resetDb();
  setLLMClient(null);
});
afterAll(async () => {
  setLLMClient(null);
  await closeDb();
});

describe("multi-agent orchestration", () => {
  it("MD delegates research → sales (dependency), resumes and consolidates with verified outputs", async () => {
    let researchTaskId = "";
    let leadIds: string[] = [];
    useScript({
      Adaeze: ({ turn, lastResults, req }) => {
        const first = req.messages[0].content as string;
        if (first.includes("resuming after your delegated subtasks")) {
          const ids = [...first.matchAll(/\{"id":"([0-9a-f-]{36})","type":"lead"\}/g)].map((m) => m[1]);
          return [{ tool: "complete_task", input: { summary: `Found ${ids.length} hospitality prospects with verified sources; outreach pending approval.`, outputs: ids.map((id) => ({ type: "lead", id })) } }];
        }
        if (turn === 0) return [{ tool: "delegate_task", input: { agent: "research", title: "Audit Lagos hospitality digital presence", instructions: "Research hotels in Lagos with weak social media presence and publish findings with sources for the sales team." } }];
        if (turn === 1) {
          researchTaskId = parse<{ task_id: string }>(lastResults[0].content).task_id;
          return [{ tool: "delegate_task", input: { agent: "sales-marketing", title: "Add qualified hospitality prospects", instructions: "Using the research findings, add each real prospect to the CRM with sources, problems and recommended approach.", depends_on: [researchTaskId] } }];
        }
        return [{ tool: "await_subtasks", input: { plan_notes: "Research first, then sales adds leads. Consolidate when both finish." } }];
      },
      Kemi: ({ turn, lastResults }) => {
        if (turn === 0) return [
          { tool: "record_intel", input: { category: "potential_client", title: "Two Lagos hotels with dormant Instagram", summary: "Hotel A and Hotel B have not posted in 4+ months and their sites lack booking.", source_urls: ["https://example.com/hotel-a", "https://example.com/hotel-b"], confidence: "verified", recommendation: "Pitch social media management retainers.", opportunity: "Social media management retainers for two dormant hotel accounts.", priority: "high" } },
          { tool: "save_deliverable", input: { kind: "research_report", title: "Lagos hospitality audit", content: "## Findings\n- Hotel A: last post 5 months ago\n- Hotel B: no mobile site", submit_for_review: true } },
        ];
        const intel = parse<{ intel_id: string }>(lastResults[0].content).intel_id;
        const del = parse<{ deliverable_id: string }>(lastResults[1].content).deliverable_id;
        return [{ tool: "complete_task", input: { summary: "Published 1 verified finding covering 2 hotels and an audit report.", outputs: [{ type: "intel", id: intel }, { type: "deliverable", id: del }] } }];
      },
      Chidi: ({ turn, lastResults, req }) => {
        expect(req.messages[0].content as string).toContain("Results from prerequisite tasks");
        if (turn === 0) return ["Hotel A", "Hotel B"].map((name) => ({
          tool: "create_lead",
          input: {
            company_name: name, industry: "hospitality", services_needed: ["social-media-management"], problem_identified: "No Instagram posts in 4+ months; no online booking.",
            recommended_approach: "Send a 3-post sample concept and propose a monthly retainer.", source_urls: [`https://example.com/${name.toLowerCase().replace(" ", "-")}`],
            verified_facts: ["Last Instagram post over 4 months ago"], assumptions: ["Has budget for a retainer"], estimated_value_ngn: 450000,
            signals: { industry_fit: true, observed_weaknesses: 2, budget_signal: "weak", verified_contact: false },
          },
        }));
        leadIds = lastResults.map((r) => parse<{ lead_id: string }>(r.content).lead_id);
        return [{ tool: "complete_task", input: { summary: "Added 2 real hospitality leads (both warm).", outputs: leadIds.map((id) => ({ type: "lead", id })) } }];
      },
    });

    const { commandId, taskId } = await submitCommand("Find hospitality businesses that need social media management", await ownerId());
    await drainQueue();

    const [cmd] = await db.select().from(commands).where(eq(commands.id, commandId));
    expect(cmd.status).toBe("completed");
    expect(cmd.response).toContain("Found 2 hospitality prospects");

    const all = await db.select().from(tasks).where(eq(tasks.commandId, commandId));
    expect(all).toHaveLength(3);
    expect(all.every((t) => t.status === "completed")).toBe(true);
    const root = all.find((t) => t.id === taskId)!;
    expect(root.verification?.verified).toBe(true);
    expect(root.verification?.checked).toBe(2);

    const sales = all.find((t) => t.agentSlug === "sales-marketing")!;
    expect(sales.dependsOn).toEqual([researchTaskId]);

    const leadRows = await db.select().from(leads);
    expect(leadRows.map((l) => l.companyName).sort()).toEqual(["Hotel A", "Hotel B"]);
    expect(leadRows[0].score).toBeGreaterThan(0);
    expect(leadRows[0].sourceUrls.length).toBe(1);
    expect(leadRows[0].assumptions).toContain("Has budget for a retainer");

    expect(await db.select().from(intelItems)).toHaveLength(1);
    expect((await db.select().from(deliverables))[0].status).toBe("in_review");

    const runs = await db.select().from(agentRuns);
    expect(runs.length).toBe(4); // MD, research, sales, MD resume
    expect(runs.every((r) => r.costUsd > 0)).toBe(true);
    const log = await db.select().from(activityLog);
    expect(log.some((l) => l.action === "tool.create_lead")).toBe(true);
  });

  it("rejects completion claims that reference records which do not exist", async () => {
    useScript({
      Femi: ({ turn, lastResults }) => {
        if (turn === 0) return [{ tool: "complete_task", input: { summary: "Wrote 5 ad variations for the campaign.", outputs: [{ type: "deliverable", id: "00000000-0000-0000-0000-000000000000" }] } }];
        expect(lastResults[0].isError).toBe(true);
        expect(lastResults[0].content).toContain("do not exist");
        return [{ tool: "fail_task", input: { reason: "Could not save deliverables before completing." } }];
      },
    });
    const { taskId } = await submitCommand("Write ad copy", await ownerId(), { agentSlug: "copywriting" });
    await drainQueue();
    const [t] = await db.select().from(tasks).where(eq(tasks.id, taskId));
    expect(t.status).toBe("failed");
    expect(t.verification).toBeNull();
  });

  it("an agent that stops talking without completing is nudged once, then marked failed", async () => {
    useScript({ Femi: () => ({ text: "Here is some copy I wrote for you!" }) });
    const { taskId, commandId } = await submitCommand("Write a tagline", await ownerId(), { agentSlug: "copywriting" });
    await drainQueue();
    const [t] = await db.select().from(tasks).where(eq(tasks.id, taskId));
    expect(t.status).toBe("failed");
    expect(t.error).toContain("no verifiable completion");
    const [c] = await db.select().from(commands).where(eq(commands.id, commandId));
    expect(c.status).toBe("failed");
  });

  it("invalid tool input is returned to the model as an error, not executed", async () => {
    useScript({
      Chidi: ({ turn, lastResults }) => {
        if (turn === 0) return [{ tool: "create_lead", input: { company_name: "X" } }];
        expect(lastResults[0].isError).toBe(true);
        expect(lastResults[0].content).toMatch(/Invalid input/);
        return [{ tool: "fail_task", input: { reason: "Insufficient research to create a lead." } }];
      },
    });
    await submitCommand("Add a lead", await ownerId(), { agentSlug: "sales-marketing" });
    await drainQueue();
    expect(await db.select().from(leads)).toHaveLength(0);
  });

  it("researched leads require source URLs and duplicates are refused", async () => {
    const base = { industry: "real estate", services_needed: ["branding"], problem_identified: "Outdated logo and website", recommended_approach: "Offer brand refresh audit", signals: {} };
    useScript({
      Chidi: ({ turn, lastResults }) => {
        if (turn === 0) return [{ tool: "create_lead", input: { ...base, company_name: "Acme Realty" } }];
        if (turn === 1) {
          expect(lastResults[0].content).toContain("source URL");
          return [{ tool: "create_lead", input: { ...base, company_name: "Acme Realty", source_urls: ["https://acme.example"] } }];
        }
        if (turn === 2) return [{ tool: "create_lead", input: { ...base, company_name: "ACME REALTY", source_urls: ["https://acme.example"] } }];
        expect(lastResults[0].content).toContain("already in the CRM");
        const [lead] = [lastResults];
        void lead;
        return [{ tool: "fail_task", input: { reason: "Test finished; stopping deliberately." } }];
      },
    });
    await submitCommand("Add Acme", await ownerId(), { agentSlug: "sales-marketing" });
    await drainQueue();
    expect(await db.select().from(leads)).toHaveLength(1);
  });

  it("defers work for paused agents and fails it for disabled agents", async () => {
    await db.update(agents).set({ status: "paused" }).where(eq(agents.slug, "copywriting"));
    const { taskId } = await submitCommand("Write copy", await ownerId(), { agentSlug: "copywriting" });
    useScript({});
    await drainQueue();
    let [t] = await db.select().from(tasks).where(eq(tasks.id, taskId));
    expect(t.status).toBe("queued"); // re-enqueued for later

    await db.update(agents).set({ status: "disabled" }).where(eq(agents.slug, "graphic-design"));
    const r = await submitCommand("Design a flyer", await ownerId(), { agentSlug: "graphic-design" });
    await drainQueue();
    [t] = await db.select().from(tasks).where(eq(tasks.id, r.taskId));
    expect(t.status).toBe("failed");
    expect(t.error).toContain("disabled");
  });

  it("fails clearly and recoverably when no API key is configured", async () => {
    const { taskId } = await submitCommand("Show me revenue for October", await ownerId());
    await drainQueue();
    const [t] = await db.select().from(tasks).where(eq(tasks.id, taskId));
    expect(t.status).toBe("failed");
    expect(t.error).toContain("ANTHROPIC_API_KEY");
  });

  it("non-manager requests become proposed tasks reviewed by the Operations Manager", async () => {
    useScript({
      Bisi: ({ turn, lastResults }) => {
        if (turn === 0) return [{ tool: "request_collaboration", input: { agent: "graphic-design", title: "Carousel visuals for hotel series", instructions: "Design 5 carousel slides (1080x1350) for the hotel content series using Prohub brand." } }];
        const id = parse<{ task_id: string }>(lastResults[0].content).task_id;
        return [{ tool: "complete_task", input: { summary: "Requested carousel visuals from Design.", outputs: [{ type: "task", id }] } }];
      },
      Tunde: ({ turn, req }) => {
        if (turn === 0) return [{ tool: "list_tasks", input: { statuses: ["proposed"] } }];
        if (turn === 1) {
          const content = JSON.stringify(req.messages[req.messages.length - 1].content);
          const id = /\\"id\\":\\"([0-9a-f-]{36})\\"/.exec(content)![1];
          return [{ tool: "review_proposed_task", input: { task_id: id, decision: "reject", reason: "Duplicate of an existing design task this week." } }];
        }
        const content = JSON.stringify(req.messages[req.messages.length - 1].content);
        const id = /task_id\\":\\"([0-9a-f-]{36})/.exec(content)![1];
        return [{ tool: "complete_task", input: { summary: "Reviewed 1 proposed task (rejected as duplicate).", outputs: [{ type: "task", id }] } }];
      },
    });
    await submitCommand("Plan hotel carousel content", await ownerId(), { agentSlug: "content" });
    await drainQueue();
    const design = await db.select().from(tasks).where(eq(tasks.agentSlug, "graphic-design"));
    expect(design).toHaveLength(1);
    expect(design[0].status).toBe("rejected");
    const ops = await db.select().from(tasks).where(eq(tasks.agentSlug, "operations-manager"));
    expect(ops[0].status).toBe("completed");
  });
});
