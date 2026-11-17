import { afterAll, describe, expect, it } from "vitest";
import { withUser } from "@/lib/db";
import { makeUser, sql } from "./helpers";

describe("row-level security (learner role)", () => {
  afterAll(async () => {});

  it("hides other learners' rows even without a WHERE clause", async () => {
    const a = await makeUser();
    const b = await makeUser();
    const [v] = await sql`select id, language_code from vocabulary limit 1`;
    await sql`insert into user_vocabulary (user_id, vocab_id, language_code) values (${b.id}, ${v!.id}, ${v!.language_code})`;
    await sql`insert into learning_sessions (user_id, language_code, tutor_id, mode) values (${b.id}, 'yo', 'kemi', 'text')`;

    const seen = await withUser(a.id, async (tx) => ({
      vocab: await tx`select * from user_vocabulary`,
      sessions: await tx`select * from learning_sessions`,
      plans: await tx`select * from learning_plans`,
      users: await tx`select id from users`,
    }));
    expect(seen.vocab).toHaveLength(0);
    expect(seen.sessions).toHaveLength(0);
    expect(seen.plans.every((p) => p.user_id === a.id)).toBe(true);
    expect(seen.users.map((u) => u.id)).toEqual([a.id]);
  });

  it("cannot update or delete another learner's data", async () => {
    const a = await makeUser();
    const b = await makeUser();
    const r = await withUser(a.id, async (tx) => ({
      upd: await tx`update learning_plans set level = 'fluency' where user_id = ${b.id}`,
      del: await tx`delete from learning_plans where user_id = ${b.id}`,
    }));
    expect(r.upd.count).toBe(0);
    expect(r.del.count).toBe(0);
    const [plan] = await sql`select level from learning_plans where user_id = ${b.id}`;
    expect(plan!.level).toBe("beginner");
  });

  it("cannot insert rows that claim to belong to someone else", async () => {
    const a = await makeUser();
    const b = await makeUser();
    await expect(
      withUser(
        a.id,
        (tx) =>
          tx`insert into xp_events (user_id, amount, reason, local_date) values (${b.id}, 100, 'x', current_date)`,
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it("cannot read the stored answers to lesson activities", async () => {
    const a = await makeUser();
    await expect(withUser(a.id, (tx) => tx`select answer from lesson_activities limit 1`)).rejects.toThrow(
      /permission denied/,
    );
    const rows = await withUser(a.id, (tx) => tx`select id, payload from lesson_activities limit 1`);
    expect(rows).toHaveLength(1);
  });

  it("cannot grant itself a paid plan or more usage", async () => {
    const a = await makeUser();
    await expect(
      withUser(
        a.id,
        (tx) =>
          tx`insert into subscriptions (user_id, plan_code, provider, status) values (${a.id}, 'plus', 'manual', 'active')`,
      ),
    ).rejects.toThrow(/permission denied/);
    await expect(
      withUser(a.id, (tx) => tx`update usage_counters set ai_turns = 0 where user_id = ${a.id}`),
    ).rejects.toThrow(/permission denied/);
  });

  it("cannot promote itself to admin", async () => {
    const a = await makeUser();
    await expect(
      withUser(a.id, (tx) => tx`update users set role = 'admin' where id = ${a.id}`),
    ).rejects.toThrow(/permission denied/);
    const [u] = await sql`select role from users where id = ${a.id}`;
    expect(u!.role).toBe("learner");
  });
});
