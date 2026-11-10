import "server-only";
import { z } from "zod";
import { db } from "../db";
import { HttpError } from "../http";
import { hashPassword, passwordRules, verifyPassword } from "../auth/password";
import { createSession } from "../auth/session";
import { AREA_IDS } from "@/game/data/world";
import { STARTERS } from "@/game/data/roster";

const BLOCKED = /(fuck|shit|nigg|bitch|cunt|ashawo|olodo|mumu)/i;

export const usernameSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_]{3,16}$/, "3–16 letters, numbers or underscores.")
  .refine((u) => !BLOCKED.test(u), "Pick a different username.");

export const signUpSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(passwordRules.min).max(passwordRules.max),
  username: usernameSchema,
  homeArea: z.enum(AREA_IDS as unknown as [string, ...string[]]),
  fighter: z.string().refine((f) => STARTERS.includes(f), "Pick a starter fighter."),
});

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
});

export async function signUp(input: z.infer<typeof signUpSchema>) {
  const hash = await hashPassword(input.password);
  const userId = await db().begin(async (tx) => {
    const taken = await tx`select 1 from profiles where username = ${input.username}`;
    if (taken.length) throw new HttpError(409, "That username is taken.", "username_taken");
    const existing = await tx`select 1 from users where email = ${input.email}`;
    if (existing.length) throw new HttpError(409, "An account with that email already exists.", "email_taken");
    const [u] = await tx`insert into users (email, password_hash) values (${input.email}, ${hash}) returning id`;
    await tx`insert into profiles (user_id, username, avatar, home_area, selected_fighter, cash, total_cash_earned)
             values (${u!.id}, ${input.username}, ${input.fighter}, ${input.homeArea}, ${input.fighter}, 300, 300)`;
    for (const f of STARTERS) await tx`insert into fighters_owned (user_id, fighter_id, source) values (${u!.id}, ${f}, 'starter')`;
    await tx`insert into cash_ledger (user_id, amount, reason, ref) values (${u!.id}, 300, 'welcome', ${input.homeArea})`;
    return u!.id as string;
  });
  await createSession(userId);
  return userId;
}

export async function signIn(input: z.infer<typeof signInSchema>) {
  const rows = await db()`select id, password_hash from users where email = ${input.email}`;
  const u = rows[0];
  // Verify against a dummy hash when the user doesn't exist so timing doesn't reveal accounts.
  const ok = u ? await verifyPassword(input.password, u.password_hash) : (await hashPassword(input.password), false);
  if (!u || !ok) throw new HttpError(401, "Email or password is wrong.", "bad_credentials");
  await createSession(u.id);
}
