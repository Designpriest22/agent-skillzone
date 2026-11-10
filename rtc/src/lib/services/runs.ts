import "server-only";
import { randomInt } from "node:crypto";
import { z } from "zod";
import { db, type Tx } from "../db";
import { HttpError } from "../http";
import { simulate, type RunResult } from "@/game/sim/sim";
import { decodeInputs, MAX_TICKS } from "@/game/sim/input";
import { FIGHTERS, ROSTER, STARTERS } from "@/game/data/roster";
import { ACHIEVEMENTS, BOSSES, EQUIPMENT, SUBSTAGES, activeMissions, missionPeriod, rankForXp, type EquipmentId } from "@/game/data/world";

const DAILY_RUN_CASH_CAP = 3000;
const RATING_ORDER = ["C", "B", "A", "S"];

export const startSchema = z.object({
  substage: z.string().refine((s) => !!SUBSTAGES[s], "Unknown stage."),
  fighter: z.string().refine((f) => !!FIGHTERS[f], "Unknown fighter."),
  equipment: z.string().nullable().optional(),
});

export const finishSchema = z.object({
  runId: z.string().uuid(),
  inputs: z.string().max(400_000),
  claimed: z.object({ score: z.number().int().min(0), ticks: z.number().int().min(1).max(MAX_TICKS), cleared: z.boolean() }),
});

/** Substages a player may start: 01A always; each later one once its predecessor is cleared. */
export async function unlockedSubstages(userId: string | null): Promise<Set<string>> {
  const open = new Set(["01A"]);
  if (!userId) return open;
  const rows = await db()`select substage_id from substage_bests where user_id = ${userId}`;
  const cleared = new Set(rows.map((r) => r.substage_id as string));
  for (const s of Object.values(SUBSTAGES)) if (s.unlockedBy && cleared.has(s.unlockedBy)) open.add(s.id);
  return open;
}

export async function startRun(userId: string | null, input: z.infer<typeof startSchema>) {
  const open = await unlockedSubstages(userId);
  if (!open.has(input.substage)) throw new HttpError(403, "Clear the previous substage first.", "locked_stage");
  let equipment: EquipmentId | null = null;
  if (userId) {
    const owned = await db()`select 1 from fighters_owned where user_id = ${userId} and fighter_id = ${input.fighter}`;
    if (!owned.length) throw new HttpError(403, "You haven't unlocked that fighter yet.", "locked_fighter");
    if (input.equipment) {
      const id = input.equipment as EquipmentId;
      if (!EQUIPMENT[id]) throw new HttpError(400, "Unknown equipment.", "bad_equipment");
      const free = id === "firstaid";
      const inv = free ? [1] : await db()`select 1 from inventory where user_id = ${userId} and item_id = ${`equip_${id}`}`;
      if (!inv.length) throw new HttpError(403, "You don't own that equipment.", "locked_equipment");
      equipment = id;
    }
  } else if (!STARTERS.includes(input.fighter)) {
    throw new HttpError(403, "Sign in to play that fighter.", "locked_fighter");
  }
  const seed = randomInt(1, 2 ** 31 - 1);
  const [r] = await db()`
    insert into runs (user_id, fighter_id, substage_id, equipment, seed)
    values (${userId}, ${input.fighter}, ${input.substage}, ${equipment}, ${seed}) returning id`;
  return { runId: r!.id as string, seed, equipment };
}

export interface RewardLine { label: string; xp: number; cash: number }
export interface FinishOutcome {
  verified: boolean;
  reason?: string;
  result?: RunResult;
  rewards: RewardLine[];
  achievements: string[];
  unlocked: string[];
  rankUp: string | null;
  profile?: { xp: number; cash: number; rank: string };
}

export async function finishRun(userId: string | null, input: z.infer<typeof finishSchema>): Promise<FinishOutcome> {
  return db().begin(async (tx) => {
    const rows = await tx`select * from runs where id = ${input.runId} for update`;
    const run = rows[0];
    if (!run) throw new HttpError(404, "Run not found.", "no_run");
    if ((run.user_id ?? null) !== userId) throw new HttpError(403, "That run belongs to someone else.", "not_your_run");
    if (run.status !== "started") throw new HttpError(409, "That run was already submitted.", "already_finished");

    const reject = async (reason: string): Promise<FinishOutcome> => {
      await tx`update runs set status = 'rejected', reject_reason = ${reason}, finished_at = now() where id = ${run.id}`;
      return { verified: false, reason, rewards: [], achievements: [], unlocked: [], rankUp: null };
    };

    let inputs: Uint16Array;
    try { inputs = decodeInputs(input.inputs); } catch { return reject("malformed input log"); }
    if (inputs.length !== input.claimed.ticks) return reject("tick count mismatch");
    // Wall-clock plausibility: a run can't be submitted faster than it could be played.
    const elapsed = (Date.now() - new Date(run.started_at).getTime()) / 1000;
    if (elapsed + 3 < inputs.length / 60) return reject("submitted faster than real time");
    if (elapsed > 3 * 3600) return reject("run expired");

    const result = simulate({ seed: Number(run.seed), substage: run.substage_id, fighter: run.fighter_id, equipment: run.equipment }, inputs);
    if (result.score !== input.claimed.score || result.cleared !== input.claimed.cleared) return reject("score did not match the server replay");

    await tx`update runs set status = 'verified', finished_at = now(), ticks = ${result.ticks}, score = ${result.score},
      max_combo = ${result.maxCombo}, kos = ${result.kos}, damage_taken = ${result.damageTaken}, tokens = ${result.tokens},
      rating = ${result.rating}, cleared = ${result.cleared}, boss_defeated = ${result.bossDefeated} where id = ${run.id}`;

    if (!userId) return { verified: true, result, rewards: [], achievements: [], unlocked: [], rankUp: null };
    return applyRewards(tx, userId, run.id as string, result);
  });
}

async function award(tx: Tx, userId: string, xp: number, cash: number, reason: string, ref: string): Promise<boolean> {
  let inserted = false;
  if (xp > 0) {
    const r = await tx`insert into xp_ledger (user_id, amount, reason, ref) values (${userId}, ${xp}, ${reason}, ${ref}) on conflict do nothing returning id`;
    if (r.length) { inserted = true; await tx`update profiles set xp = xp + ${xp}, updated_at = now() where user_id = ${userId}`; }
  }
  if (cash > 0) {
    const r = await tx`insert into cash_ledger (user_id, amount, reason, ref) values (${userId}, ${cash}, ${reason}, ${ref}) on conflict do nothing returning id`;
    if (r.length) { inserted = true; await tx`update profiles set cash = cash + ${cash}, total_cash_earned = total_cash_earned + ${cash} where user_id = ${userId}`; }
  }
  return inserted;
}

async function applyRewards(tx: Tx, userId: string, runId: string, r: RunResult): Promise<FinishOutcome> {
  const [before] = await tx`select xp, cash, highest_combo, tokens_found from profiles where user_id = ${userId} for update`;
  const rankBefore = rankForXp(Number(before!.xp));
  const rewards: RewardLine[] = [];
  const achievements: string[] = [];
  const unlocked: string[] = [];
  const [prevBest] = await tx`select best_score, best_rating, clears from substage_bests where user_id = ${userId} and substage_id = ${r.substage}`;
  const firstClear = r.cleared && !prevBest;

  const [today] = await tx`select coalesce(sum(amount), 0)::int as total from cash_ledger
    where user_id = ${userId} and reason = 'run' and created_at >= date_trunc('day', now())`;
  const cashRoom = Math.max(0, DAILY_RUN_CASH_CAP - Number(today!.total));

  if (r.cleared) {
    const ratingXp = { S: 300, A: 200, B: 100, C: 40, "-": 0 }[r.rating];
    const ratingCash = { S: 120, A: 80, B: 40, C: 15, "-": 0 }[r.rating];
    const xp = 200 + Math.min(600, Math.floor(r.score / 60)) + ratingXp;
    const cash = Math.min(cashRoom, (firstClear ? 150 : 60) + ratingCash + r.tokens * 25);
    await award(tx, userId, xp, cash, "run", runId);
    rewards.push({ label: `${r.substage} cleared · ${r.rating} rating`, xp, cash });
    await tx`update profiles set wins = wins + 1 where user_id = ${userId}`;
    await tx`insert into substage_bests (user_id, substage_id, best_score, best_rating, best_ticks) values (${userId}, ${r.substage}, ${r.score}, ${r.rating}, ${r.ticks})
      on conflict (user_id, substage_id) do update set clears = substage_bests.clears + 1,
        best_score = greatest(substage_bests.best_score, excluded.best_score),
        best_ticks = least(substage_bests.best_ticks, excluded.best_ticks),
        best_rating = case when position(excluded.best_rating in 'CBAS') > position(substage_bests.best_rating in 'CBAS') then excluded.best_rating else substage_bests.best_rating end`;
  } else {
    await award(tx, userId, 30, 0, "run", runId);
    rewards.push({ label: "Run complete · keep pushing", xp: 30, cash: 0 });
    await tx`update profiles set losses = losses + 1 where user_id = ${userId}`;
  }

  if (r.bossDefeated) {
    const boss = Object.values(BOSSES).find((b) => b.stage === r.substage)!;
    const first = await award(tx, userId, boss.reward.xp, boss.reward.cash, "boss_first", boss.id);
    if (first) rewards.push({ label: `${boss.name} defeated (first time)`, xp: boss.reward.xp, cash: boss.reward.cash });
    else { const xp = Math.round(boss.reward.xp * 0.2); await award(tx, userId, xp, 0, "boss", runId); rewards.push({ label: `${boss.name} defeated`, xp, cash: 0 }); }
    await tx`update profiles set bosses_defeated = bosses_defeated + 1 where user_id = ${userId}`;
    for (const f of ROSTER) if (f.unlock.type === "boss" && f.unlock.boss === boss.id) {
      const ins = await tx`insert into fighters_owned (user_id, fighter_id, source) values (${userId}, ${f.id}, 'boss') on conflict do nothing returning fighter_id`;
      if (ins.length) unlocked.push(f.name);
    }
  }

  await tx`update profiles set highest_combo = greatest(highest_combo, ${r.maxCombo}), tokens_found = tokens_found + ${r.tokens} where user_id = ${userId}`;

  // Missions are checked against the verified result only.
  const now = new Date();
  for (const m of activeMissions(now)) {
    const c = m.check;
    const ok = (!c.combo || r.maxCombo >= c.combo) && (!c.kos || r.kos >= c.kos) && (!c.tokens || r.tokens >= c.tokens) &&
      (!c.boss || r.bossDefeated) && (!c.rating || (r.cleared && RATING_ORDER.indexOf(r.rating) >= RATING_ORDER.indexOf(c.rating))) &&
      (!c.substage || (r.cleared && r.substage === c.substage)) && (!c.noDamage || (r.cleared && r.damageTaken === 0));
    if (!ok) continue;
    const period = missionPeriod(m, now);
    const ins = await tx`insert into mission_claims (user_id, mission_id, period, run_id) values (${userId}, ${m.id}, ${period}, ${runId}) on conflict do nothing returning mission_id`;
    if (!ins.length) continue;
    await award(tx, userId, m.xp, m.cash, "mission", `${m.id}:${period}`);
    await tx`update profiles set missions_completed = missions_completed + 1 where user_id = ${userId}`;
    rewards.push({ label: `Mission: ${m.name}`, xp: m.xp, cash: m.cash });
  }

  const [prof] = await tx`select xp, highest_combo, tokens_found from profiles where user_id = ${userId}`;
  const earned = (id: string, cond: boolean) => (cond ? [id] : []);
  const candidates = [
    ...earned("first_blood", r.cleared),
    ...earned("combo_30", r.maxCombo >= 30),
    ...earned("danfo_down", r.bossDefeated && r.substage === "01C"),
    ...earned("crescent_closed", r.bossDefeated && r.substage === "02C"),
    ...earned("flawless", r.cleared && r.damageTaken === 0),
    ...earned("collector", Number(prof!.tokens_found) >= 5),
  ];
  for (const id of candidates) {
    const ins = await tx`insert into achievements (user_id, achievement_id) values (${userId}, ${id}) on conflict do nothing returning achievement_id`;
    if (!ins.length) continue;
    const a = ACHIEVEMENTS.find((x) => x.id === id)!;
    await award(tx, userId, a.xp, 0, "achievement", id);
    achievements.push(id);
  }

  const [after] = await tx`select xp, cash from profiles where user_id = ${userId}`;
  const rankAfter = rankForXp(Number(after!.xp));
  for (const f of ROSTER) if (f.unlock.type === "rank" && f.unlock.rank <= rankAfter.rank) {
    const ins = await tx`insert into fighters_owned (user_id, fighter_id, source) values (${userId}, ${f.id}, 'rank') on conflict do nothing returning fighter_id`;
    if (ins.length) unlocked.push(f.name);
  }
  return {
    verified: true, result: r, rewards, achievements, unlocked,
    rankUp: rankAfter.rank > rankBefore.rank ? rankAfter.name : null,
    profile: { xp: Number(after!.xp), cash: Number(after!.cash), rank: rankAfter.name },
  };
}
