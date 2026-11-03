import "server-only";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { db } from "../db";
import { env } from "../env";
import { hashToken, newToken } from "./tokens";

export const SESSION_COOKIE = "os_session";
const SESSION_DAYS = 30;

export type Role = "learner" | "contributor" | "reviewer" | "editor" | "admin";

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  emailVerified: boolean;
  onboarded: boolean;
}

export async function createSession(userId: string): Promise<void> {
  const { token, hash } = newToken();
  const ua = (await headers()).get("user-agent")?.slice(0, 300) ?? null;
  await db()`
    insert into auth_sessions (user_id, token_hash, user_agent, expires_at)
    values (${userId}, ${hash}, ${ua}, now() + ${`${SESSION_DAYS} days`}::interval)`;
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env().NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db()`delete from auth_sessions where token_hash = ${hashToken(token)}`;
  jar.delete(SESSION_COOKIE);
}

export async function destroyAllSessions(userId: string): Promise<void> {
  await db()`delete from auth_sessions where user_id = ${userId}`;
}

/** The signed-in user for this request, or null. Cached per request. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = await db()`
    update auth_sessions s set last_seen_at = now()
    from users u left join profiles p on p.user_id = u.id
    where s.token_hash = ${hashToken(token)} and s.expires_at > now() and u.id = s.user_id
    returning u.id, u.email, u.display_name, u.role, u.email_verified_at, p.onboarding_completed_at`;
  const r = rows[0];
  if (!r) return null;
  return {
    id: r.id,
    email: r.email,
    displayName: r.display_name,
    role: r.role,
    emailVerified: !!r.email_verified_at,
    onboarded: !!r.onboarding_completed_at,
  };
});

const ROLE_RANK: Record<Role, number> = { learner: 0, contributor: 1, reviewer: 2, editor: 3, admin: 4 };

export function hasRole(user: Pick<SessionUser, "role"> | null, minimum: Role): boolean {
  return !!user && ROLE_RANK[user.role] >= ROLE_RANK[minimum];
}
