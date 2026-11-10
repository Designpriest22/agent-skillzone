import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db, withUser } from "../db";
import { env } from "../env";
import { HttpError } from "../http";
import { initializeTransaction, verifyTransaction } from "../paystack";
import { FIGHTERS } from "@/game/data/roster";
import { AREAS, EQUIPMENT, SUBSTAGES, STORE_BY_ID, activeMissions, levelForXp, missionPeriod, rankForXp } from "@/game/data/world";
import { unlockedSubstages } from "./runs";

function shapeProfile(p: Record<string, unknown>) {
  const xp = Number(p.xp);
  const rank = rankForXp(xp);
  return {
    username: p.username as string,
    avatar: p.avatar as string,
    homeArea: p.home_area as string,
    selectedFighter: p.selected_fighter as string,
    equipment: (p.equipment as string | null) ?? null,
    xp, cash: Number(p.cash), level: levelForXp(xp),
    rank: { rank: rank.rank, name: rank.name, next: rank.next ? { name: rank.next.name, xp: rank.next.xp } : null },
    stats: {
      wins: p.wins as number, losses: p.losses as number, bossesDefeated: p.bosses_defeated as number,
      missionsCompleted: p.missions_completed as number, highestCombo: p.highest_combo as number,
      tokensFound: p.tokens_found as number, totalCashEarned: Number(p.total_cash_earned), respect: p.respect as number,
    },
  };
}

export async function getMe(userId: string) {
  const [p] = await db()`select * from profiles where user_id = ${userId}`;
  if (!p) throw new HttpError(404, "Profile not found.", "no_profile");
  const fighters = (await db()`select fighter_id, level from fighters_owned where user_id = ${userId}`).map((r) => r.fighter_id as string);
  const bests = await db()`select substage_id, best_score, best_rating, clears from substage_bests where user_id = ${userId}`;
  const achievements = (await db()`select achievement_id from achievements where user_id = ${userId}`).map((r) => r.achievement_id as string);
  // Private ledgers go through row-level security.
  const { inventory, history, claims } = await withUser(userId, async (tx) => ({
    inventory: (await tx`select item_id, source from inventory`).map((r) => ({ id: r.item_id as string, source: r.source as string })),
    history: await tx`select amount, reason, ref, created_at from cash_ledger order by id desc limit 30`,
    claims: (await tx`select mission_id, period from mission_claims`).map((r) => `${r.mission_id}:${r.period}`),
  }));
  const now = new Date();
  const missions = activeMissions(now).map((m) => ({ ...m, done: claims.includes(`${m.id}:${missionPeriod(m, now)}`) }));
  return {
    profile: shapeProfile(p),
    fighters, achievements, inventory, missions,
    history: history.map((h) => ({ amount: h.amount as number, reason: h.reason as string, ref: h.ref as string, at: h.created_at as Date })),
    bests: Object.fromEntries(bests.map((b) => [b.substage_id, { score: b.best_score, rating: b.best_rating, clears: b.clears }])),
    unlockedStages: [...(await unlockedSubstages(userId))],
  };
}

export const profilePatchSchema = z.object({
  avatar: z.string().refine((f) => !!FIGHTERS[f]).optional(),
  selectedFighter: z.string().refine((f) => !!FIGHTERS[f]).optional(),
  equipment: z.string().nullable().optional(),
});

export async function updateProfile(userId: string, patch: z.infer<typeof profilePatchSchema>) {
  if (patch.selectedFighter) {
    const own = await db()`select 1 from fighters_owned where user_id = ${userId} and fighter_id = ${patch.selectedFighter}`;
    if (!own.length) throw new HttpError(403, "You haven't unlocked that fighter.", "locked_fighter");
    await db()`update profiles set selected_fighter = ${patch.selectedFighter}, updated_at = now() where user_id = ${userId}`;
  }
  if (patch.avatar) await db()`update profiles set avatar = ${patch.avatar} where user_id = ${userId}`;
  if (patch.equipment !== undefined) {
    if (patch.equipment && !(patch.equipment in EQUIPMENT)) throw new HttpError(400, "Unknown equipment.", "bad_equipment");
    await db()`update profiles set equipment = ${patch.equipment} where user_id = ${userId}`;
  }
}

export async function publicProfile(username: string) {
  const [p] = await db()`select * from profiles where username = ${username} and not banned`;
  if (!p) throw new HttpError(404, "Player not found.", "no_player");
  const [pos] = await db()`select count(*)::int + 1 as pos from profiles where xp > ${p.xp} and not banned`;
  const achievements = (await db()`select achievement_id from achievements where user_id = ${p.user_id}`).map((r) => r.achievement_id as string);
  return { ...shapeProfile(p), position: pos!.pos as number, achievements, area: AREAS.find((a) => a.id === p.home_area)?.name ?? p.home_area };
}

// ------------------------------------------------------------------ leaderboards
export const BOARDS = ["overall", "combo", "bosses", "wins", "weekly", "monthly", "area", "stage"] as const;
export type Board = (typeof BOARDS)[number];

export async function leaderboard(board: Board, opts: { area?: string; stage?: string } = {}) {
  const sql = db();
  let rows;
  if (board === "overall") rows = await sql`select username, avatar, home_area, xp as value, xp from profiles where not banned order by xp desc, username limit 50`;
  else if (board === "combo") rows = await sql`select username, avatar, home_area, highest_combo as value, xp from profiles where not banned and highest_combo > 0 order by highest_combo desc limit 50`;
  else if (board === "bosses") rows = await sql`select username, avatar, home_area, bosses_defeated as value, xp from profiles where not banned and bosses_defeated > 0 order by bosses_defeated desc limit 50`;
  else if (board === "wins") rows = await sql`select username, avatar, home_area, wins as value, xp from profiles where not banned and wins > 0 order by wins desc limit 50`;
  else if (board === "weekly" || board === "monthly") {
    const unit = board === "weekly" ? "week" : "month";
    rows = await sql`select p.username, p.avatar, p.home_area, sum(r.score)::int as value, p.xp from runs r join profiles p on p.user_id = r.user_id
      where r.status = 'verified' and r.finished_at >= date_trunc(${unit}, now()) and not p.banned
      group by p.user_id order by value desc limit 50`;
  } else if (board === "area") {
    rows = await sql`select username, avatar, home_area, xp as value, xp from profiles where not banned and home_area = ${opts.area ?? "wuse"} order by xp desc limit 50`;
  } else {
    const stage = opts.stage && SUBSTAGES[opts.stage] ? opts.stage : "01A";
    rows = await sql`select p.username, p.avatar, p.home_area, b.best_score as value, p.xp, b.best_rating from substage_bests b
      join profiles p on p.user_id = b.user_id where b.substage_id = ${stage} and not p.banned order by b.best_score desc limit 50`;
  }
  return rows.map((r, i) => ({
    position: i + 1, username: r.username as string, avatar: r.avatar as string, area: r.home_area as string,
    value: Number(r.value), rank: rankForXp(Number(r.xp)).name, level: levelForXp(Number(r.xp)), rating: (r.best_rating as string) ?? null,
  }));
}

// ------------------------------------------------------------------ store
export async function buyWithCash(userId: string, itemId: string) {
  const item = STORE_BY_ID[itemId];
  if (!item || item.cash === null) throw new HttpError(400, "That item isn't sold for Capital Cash.", "not_for_cash");
  return db().begin(async (tx) => {
    const [p] = await tx`select cash from profiles where user_id = ${userId} for update`;
    const owned = await tx`select 1 from inventory where user_id = ${userId} and item_id = ${itemId}`;
    if (owned.length) throw new HttpError(409, "You already own that.", "owned");
    if (Number(p!.cash) < item.cash!) throw new HttpError(402, "Not enough Capital Cash yet.", "insufficient");
    await tx`update profiles set cash = cash - ${item.cash} where user_id = ${userId}`;
    await tx`insert into cash_ledger (user_id, amount, reason, ref) values (${userId}, ${-item.cash!}, 'store', ${itemId})`;
    await tx`insert into inventory (user_id, item_id, source) values (${userId}, ${itemId}, 'cash')`;
    if (item.kind === "fighter") await tx`insert into fighters_owned (user_id, fighter_id, source) values (${userId}, ${itemId.replace("fighter_", "")}, 'cash') on conflict do nothing`;
    const [after] = await tx`select cash from profiles where user_id = ${userId}`;
    return { cash: Number(after!.cash) };
  });
}

/** Starts a Naira purchase. Nothing is granted here: only a verified webhook marks it paid. */
export async function startCheckout(userId: string, email: string, itemId: string) {
  const item = STORE_BY_ID[itemId];
  if (!item || item.naira === null) throw new HttpError(400, "That item isn't sold for Naira.", "not_for_naira");
  const key = env().PAYSTACK_SECRET_KEY;
  if (!key) throw new HttpError(503, "Naira payments open soon.", "payments_not_configured");
  const owned = await db()`select 1 from inventory where user_id = ${userId} and item_id = ${itemId}`;
  if (owned.length) throw new HttpError(409, "You already own that.", "owned");
  const reference = `rtc_${randomUUID()}`;
  await db()`insert into purchases (user_id, item_id, amount_kobo, reference) values (${userId}, ${itemId}, ${item.naira}, ${reference})`;
  const { authorizationUrl } = await initializeTransaction(key, {
    email, amountMinor: item.naira, currency: "NGN", callbackUrl: `${env().APP_URL}/?purchase=${reference}`,
    metadata: { reference, item_id: itemId, user_id: userId },
  });
  return { authorizationUrl, reference };
}

/** Called from the signed webhook. Re-verifies with Paystack, checks the amount, grants once. */
export async function settlePurchase(reference: string): Promise<"granted" | "already" | "ignored" | "mismatch"> {
  const key = env().PAYSTACK_SECRET_KEY;
  if (!key) return "ignored";
  const [p] = await db()`select * from purchases where reference = ${reference}`;
  if (!p) return "ignored";
  if (p.status === "paid") return "already";
  const tx = await verifyTransaction(key, reference);
  if (tx.status !== "success" || tx.amount !== p.amount_kobo || tx.currency !== "NGN") {
    await db()`update purchases set status = 'failed' where id = ${p.id} and status = 'pending'`;
    return "mismatch";
  }
  await db().begin(async (t) => {
    const upd = await t`update purchases set status = 'paid', verified_at = now() where id = ${p.id} and status = 'pending' returning id`;
    if (!upd.length) return;
    await t`insert into inventory (user_id, item_id, source) values (${p.user_id}, ${p.item_id}, 'paystack') on conflict do nothing`;
  });
  return "granted";
}

export async function purchaseHistory(userId: string) {
  const rows = await withUser(userId, (tx) => tx`select item_id, amount_kobo, status, reference, created_at from purchases order by created_at desc limit 50`);
  return rows.map((r) => ({ reference: r.reference as string, itemId: r.item_id as string, status: r.status as string, amount: Number(r.amount_kobo), at: new Date(r.created_at as string).toISOString() }));
}

// ------------------------------------------------------------------ social
export async function react(fromId: string, username: string, kind: "respect" | "fire" | "rematch") {
  const [t] = await db()`select user_id from profiles where username = ${username} and not banned`;
  if (!t) throw new HttpError(404, "Player not found.", "no_player");
  if (t.user_id === fromId) throw new HttpError(400, "You can't react to yourself.", "self");
  const ins = await db()`insert into reactions (from_user, to_user, kind) values (${fromId}, ${t.user_id}, ${kind}) on conflict do nothing returning kind`;
  if (ins.length && kind === "respect") await db()`update profiles set respect = respect + 1 where user_id = ${t.user_id}`;
  return { ok: true };
}

export async function report(fromId: string, username: string, reason: string) {
  const [t] = await db()`select user_id from profiles where username = ${username}`;
  if (!t) throw new HttpError(404, "Player not found.", "no_player");
  await db()`insert into reports (reporter, target, reason) values (${fromId}, ${t.user_id}, ${reason})`;
  return { ok: true };
}
