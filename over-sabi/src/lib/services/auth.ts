import "server-only";
import { z } from "zod";
import { audit } from "../audit";
import { track } from "../analytics";
import { hashPassword, passwordRules, verifyPassword } from "../auth/password";
import { createSession, destroyAllSessions } from "../auth/session";
import { hashToken, newToken } from "../auth/tokens";
import { db } from "../db";
import { env } from "../env";
import { HttpError } from "../http";
import { sendMail } from "../mailer";

export const signUpSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
  password: z
    .string()
    .min(passwordRules.min, `Password must be at least ${passwordRules.min} characters.`)
    .max(passwordRules.max),
  displayName: z.string().trim().min(1, "Tell us what to call you.").max(60),
  ageConfirmed: z.literal(true, { error: "You must be 13 or older to create an account." }),
  ageBand: z.enum(["teen", "adult"]),
  acceptTerms: z.literal(true, { error: "Please accept the terms and privacy policy." }),
});

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(passwordRules.max),
});

// Constant work for unknown emails so response timing doesn't reveal which accounts exist.
let dummyHash: Promise<string> | null = null;

export async function signUp(input: z.infer<typeof signUpSchema>) {
  const passwordHash = await hashPassword(input.password);
  const userId = await db().begin(async (tx) => {
    const existing = await tx`select id from users where email = ${input.email}`;
    if (existing.length)
      throw new HttpError(409, "An account with this email already exists. Sign in instead.", "email_taken");
    const [u] = await tx`
      insert into users (email, password_hash, display_name) values (${input.email}, ${passwordHash}, ${input.displayName})
      returning id`;
    await tx`
      insert into profiles (user_id, age_band, privacy_consent_at, leaderboard_opt_in)
      values (${u!.id}, ${input.ageBand}, now(), false)`;
    return u!.id as string;
  });
  await createSession(userId);
  await sendVerificationEmail(userId, input.email);
  await track("signup", { userId });
  return userId;
}

export async function signIn(input: z.infer<typeof signInSchema>) {
  const [u] = await db()`select id, password_hash from users where email = ${input.email}`;
  if (!u?.password_hash) {
    dummyHash ??= hashPassword("not-a-real-password");
    await verifyPassword(input.password, await dummyHash);
    throw new HttpError(401, "That email and password don't match an account.", "bad_credentials");
  }
  if (!(await verifyPassword(input.password, u.password_hash))) {
    throw new HttpError(401, "That email and password don't match an account.", "bad_credentials");
  }
  await createSession(u.id);
  return u.id as string;
}

export async function sendVerificationEmail(userId: string, email: string) {
  const { token, hash } = newToken();
  await db()`delete from auth_tokens where user_id = ${userId} and kind = 'verify_email' and used_at is null`;
  await db()`insert into auth_tokens (user_id, kind, token_hash, expires_at) values (${userId}, 'verify_email', ${hash}, now() + interval '2 days')`;
  const link = `${env().APP_URL}/verify-email?token=${token}`;
  return sendMail({
    to: email,
    subject: "Confirm your Over Sabi email",
    text: `Welcome to Over Sabi!\n\nConfirm your email address so we can keep your account safe:\n${link}\n\nThis link expires in 2 days. If you didn't sign up, ignore this email.`,
  });
}

export async function verifyEmail(token: string): Promise<boolean> {
  const rows = await db()`
    update auth_tokens set used_at = now()
    where token_hash = ${hashToken(token)} and kind = 'verify_email' and used_at is null and expires_at > now()
    returning user_id`;
  if (!rows[0]) return false;
  await db()`update users set email_verified_at = coalesce(email_verified_at, now()), updated_at = now() where id = ${rows[0].user_id}`;
  return true;
}

export async function requestPasswordReset(email: string): Promise<void> {
  const [u] = await db()`select id from users where email = ${email.trim().toLowerCase()}`;
  if (!u) return; // Same response whether or not the account exists.
  const { token, hash } = newToken();
  await db()`insert into auth_tokens (user_id, kind, token_hash, expires_at) values (${u.id}, 'reset_password', ${hash}, now() + interval '1 hour')`;
  await sendMail({
    to: email,
    subject: "Reset your Over Sabi password",
    text: `Someone asked to reset the password for this Over Sabi account.\n\nChoose a new password:\n${env().APP_URL}/reset-password?token=${token}\n\nThis link expires in 1 hour. If this wasn't you, you can ignore this email.`,
  });
}

export async function resetPassword(token: string, password: string): Promise<void> {
  if (password.length < passwordRules.min)
    throw new HttpError(400, `Password must be at least ${passwordRules.min} characters.`, "weak_password");
  const rows = await db()`
    update auth_tokens set used_at = now()
    where token_hash = ${hashToken(token)} and kind = 'reset_password' and used_at is null and expires_at > now()
    returning user_id`;
  const userId = rows[0]?.user_id as string | undefined;
  if (!userId)
    throw new HttpError(
      400,
      "This reset link has expired or was already used. Request a new one.",
      "invalid_token",
    );
  await db()`update users set password_hash = ${await hashPassword(password)}, updated_at = now() where id = ${userId}`;
  await destroyAllSessions(userId);
  await audit(userId, "password_reset", "user", userId);
  await createSession(userId);
}

/** Finds or creates a user from a verified Google identity. */
export async function signInWithGoogle(profile: {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string;
}) {
  const [linked] =
    await db()`select user_id from oauth_accounts where provider = 'google' and provider_account_id = ${profile.sub}`;
  let userId = linked?.user_id as string | undefined;
  if (!userId) {
    if (!profile.emailVerified)
      throw new HttpError(400, "Your Google email isn't verified.", "unverified_email");
    userId = await db().begin(async (tx) => {
      const [existing] = await tx`select id from users where email = ${profile.email}`;
      let id = existing?.id as string | undefined;
      if (!id) {
        const [u] = await tx`
          insert into users (email, display_name, email_verified_at) values (${profile.email}, ${profile.name.slice(0, 60)}, now())
          returning id`;
        id = u!.id as string;
        // Age band is confirmed during onboarding for OAuth sign-ups.
        await tx`insert into profiles (user_id, privacy_consent_at) values (${id}, now())`;
      } else {
        await tx`update users set email_verified_at = coalesce(email_verified_at, now()) where id = ${id}`;
      }
      await tx`insert into oauth_accounts (provider, provider_account_id, user_id) values ('google', ${profile.sub}, ${id})`;
      return id;
    });
  }
  await createSession(userId);
  return userId;
}
