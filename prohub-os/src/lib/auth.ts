import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db/client";
import { sessions, users } from "@/db/schema";
import { randomToken, sha256, verifyPassword } from "./crypto";
import { rateLimit } from "./rate-limit";
import { logActivity } from "./audit";

export const SESSION_COOKIE = "prohub_session";
const SESSION_DAYS = 14;

export type SessionUser = { id: string; email: string; name: string; role: "owner" | "manager" | "viewer" };

export async function login(email: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
  const limit = rateLimit(`login:${ip}`, 8, 15 * 60_000);
  if (!limit.ok) return { ok: false, error: `Too many attempts. Try again in ${Math.ceil(limit.retryAfterMs / 60000)} minutes.` };
  const [u] = await db.select().from(users).where(eq(users.email, email.trim().toLowerCase()));
  const valid = u && u.active && (await verifyPassword(password, u.passwordHash));
  if (!valid) {
    await logActivity({ type: "system", id: "auth" }, "auth.login_failed", null, { email: email.slice(0, 120), ip });
    return { ok: false, error: "Invalid email or password." };
  }
  const token = randomToken(32);
  await db.insert(sessions).values({ tokenHash: sha256(token), userId: u.id, expiresAt: new Date(Date.now() + SESSION_DAYS * 86400_000), ip, userAgent: h.get("user-agent")?.slice(0, 300) ?? null });
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, u.id));
  (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_DAYS * 86400 });
  await logActivity({ type: "user", id: u.id }, "auth.login", null, { ip });
  return { ok: true };
}

export async function logout() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.tokenHash, sha256(token)));
  jar.delete(SESSION_COOKIE);
}

export async function getUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [row] = await db.select({ id: users.id, email: users.email, name: users.name, role: users.role, active: users.active })
    .from(sessions).innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, sha256(token)), gt(sessions.expiresAt, new Date())));
  if (!row || !row.active) return null;
  return { id: row.id, email: row.email, name: row.name, role: row.role };
}

export async function requireUser(minRole: "viewer" | "manager" | "owner" = "viewer"): Promise<SessionUser> {
  const u = await getUser();
  if (!u) redirect("/login");
  const rank = { viewer: 0, manager: 1, owner: 2 };
  if (rank[u.role] < rank[minRole]) throw new Error(`This action requires the ${minRole} role.`);
  return u;
}
