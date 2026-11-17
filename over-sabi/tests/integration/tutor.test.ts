import { describe, expect, it } from "vitest";
import { endSession, getTranscript, sendTurn, startSession } from "@/lib/services/tutor";
import { makeUser, sql } from "./helpers";

// Uses the deterministic test provider (OVERSABI_TEST_PROVIDERS=1): this checks the
// session plumbing, not language quality.
describe("AI tutor sessions", () => {
  it("starts a session with a tutor greeting, takes turns and stores corrections", async () => {
    const u = await makeUser();
    const s = await startSession(u.id, {
      languageCode: "yo",
      tutorId: "kemi",
      settings: { sessionMinutes: 30 },
    });
    expect(s.settings.sessionMinutes).toBe(10); // capped by the Free plan
    expect(s.turns).toHaveLength(1);
    expect(s.turns[0]!.role).toBe("tutor");

    const r = await sendTurn(u.id, s.sessionId, { text: "Ẹ káàárọ̀ [[correct]]", inputMode: "text" });
    expect(r.learner.text).toContain("Ẹ káàárọ̀");
    expect(r.tutor.text).toContain("#2");
    expect(r.tutor.corrections).toHaveLength(1);

    const transcript = await getTranscript(u.id, s.sessionId);
    expect(transcript.map((t) => t.role)).toEqual(["tutor", "learner", "tutor"]);
    const [fb] = await sql`select * from feedback_items where session_id = ${s.sessionId}`;
    expect(fb!.type).toBe("grammar");
  });

  it("keeps the history valid when the provider fails", async () => {
    const u = await makeUser();
    const s = await startSession(u.id, { languageCode: "yo", tutorId: "kemi", settings: {} });
    await expect(
      sendTurn(u.id, s.sessionId, { text: "hello [[fail]]", inputMode: "text" }),
    ).rejects.toMatchObject({ status: 502, code: "tutor_failed" });
    const transcript = await getTranscript(u.id, s.sessionId);
    expect(transcript).toHaveLength(1);
    const [ev] =
      await sql`select * from provider_events where provider = 'test-double' and not ok order by id desc limit 1`;
    expect(ev!.capability).toBe("chat");
  });

  it("rejects a tutor that doesn't teach the language", async () => {
    const u = await makeUser();
    await expect(
      startSession(u.id, { languageCode: "yo", tutorId: "musa", settings: {} }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("generates and saves a summary, awards XP once", async () => {
    const u = await makeUser();
    const s = await startSession(u.id, { languageCode: "ha", tutorId: "hauwa", settings: {} });
    await sendTurn(u.id, s.sessionId, { text: "Sannu", inputMode: "text" });
    const end = await endSession(u.id, s.sessionId);
    expect(end.summary?.summary).toContain("Test summary");
    expect(end.xpEarned).toBe(12);
    expect(end.newAchievements).toContain("first_conversation");
    const again = await endSession(u.id, s.sessionId);
    expect(again.xpEarned).toBe(0);
    await expect(sendTurn(u.id, s.sessionId, { text: "x", inputMode: "text" })).rejects.toMatchObject({
      code: "session_ended",
    });
  });

  it("enforces the plan's daily tutor-reply allowance", async () => {
    const u = await makeUser();
    const s = await startSession(u.id, { languageCode: "yo", tutorId: "kemi", settings: {} });
    await sql`update usage_counters set ai_turns = 15 where user_id = ${u.id}`;
    await expect(sendTurn(u.id, s.sessionId, { text: "one more", inputMode: "text" })).rejects.toMatchObject({
      status: 402,
      code: "usage_limit",
    });
  });

  it("does not let one learner read another's transcript", async () => {
    const a = await makeUser();
    const b = await makeUser();
    const s = await startSession(a.id, { languageCode: "yo", tutorId: "kemi", settings: {} });
    expect(await getTranscript(b.id, s.sessionId)).toEqual([]);
    await expect(sendTurn(b.id, s.sessionId, { text: "hi", inputMode: "text" })).rejects.toMatchObject({
      status: 404,
    });
  });
});
