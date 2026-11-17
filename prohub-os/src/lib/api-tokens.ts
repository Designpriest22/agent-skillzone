/**
 * Personal access tokens for the Claude connector (MCP) and other programmatic clients.
 * Format: phk_<random>. Only the SHA-256 hash is stored; the plaintext is shown once at creation.
 */
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { apiTokens, users } from "@/db/schema";
import { randomToken, sha256 } from "./crypto";
import type { SessionUser } from "./auth";

export async function createApiToken(userId: string, name: string) {
  const token = `phk_${randomToken(32)}`;
  const [row] = await db.insert(apiTokens).values({ userId, name: name.trim().slice(0, 80) || "Claude connector", tokenHash: sha256(token), prefix: token.slice(0, 10) }).returning({ id: apiTokens.id });
  return { id: row.id, token };
}

export async function revokeApiToken(id: string, userId: string) {
  await db.update(apiTokens).set({ revokedAt: new Date() }).where(and(eq(apiTokens.id, id), eq(apiTokens.userId, userId)));
}

export async function userForToken(token: string | null | undefined): Promise<SessionUser | null> {
  if (!token || !token.startsWith("phk_") || token.length < 30) return null;
  const [row] = await db.select({ tokenId: apiTokens.id, id: users.id, email: users.email, name: users.name, role: users.role, active: users.active })
    .from(apiTokens).innerJoin(users, eq(users.id, apiTokens.userId))
    .where(and(eq(apiTokens.tokenHash, sha256(token)), isNull(apiTokens.revokedAt)));
  if (!row || !row.active) return null;
  await db.update(apiTokens).set({ lastUsedAt: new Date() }).where(eq(apiTokens.id, row.tokenId));
  return { id: row.id, email: row.email, name: row.name, role: row.role };
}

export function bearer(req: Request): string | null {
  const h = req.headers.get("authorization");
  return h?.startsWith("Bearer ") ? h.slice(7).trim() : null;
}
