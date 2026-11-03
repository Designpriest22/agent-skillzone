/**
 * File store for rendered videos, report PDFs and media received over WhatsApp.
 *
 * Files live in Postgres (bytea) so the web app and the background worker see the same bytes on any
 * host — including platforms where the two run on separate machines with no shared disk.
 * Dashboard users read files through /api/files/[id]; external fetchers (e.g. Meta pulling a video
 * for WhatsApp) use the unguessable public token: /api/files/t/[token].
 */
import { createHash } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { files } from "@/db/schema";
import { randomToken } from "@/lib/crypto";
import { env } from "@/lib/env";

/** Postgres handles this comfortably; larger media should go to object storage (see ARCHITECTURE.md). */
export const MAX_FILE_BYTES = 60 * 1024 * 1024;

export type StoredFile = Omit<typeof files.$inferSelect, "data">;

export async function saveFile(opts: {
  name: string; mimeType: string; data: Buffer; source: "render" | "whatsapp" | "report" | "upload";
  createdBy: string; meta?: Record<string, unknown>;
}): Promise<StoredFile> {
  if (!opts.data.length) throw new Error("Refusing to store an empty file");
  if (opts.data.length > MAX_FILE_BYTES) throw new Error(`File is ${(opts.data.length / 1048576).toFixed(1)} MB; the limit is ${MAX_FILE_BYTES / 1048576} MB`);
  const [row] = await db.insert(files).values({
    name: opts.name.slice(0, 200), mimeType: opts.mimeType, sizeBytes: opts.data.length, data: opts.data,
    sha256: createHash("sha256").update(opts.data).digest("hex"), publicToken: randomToken(24),
    source: opts.source, meta: opts.meta ?? {}, createdBy: opts.createdBy,
  }).returning({
    id: files.id, name: files.name, mimeType: files.mimeType, sizeBytes: files.sizeBytes, sha256: files.sha256, publicToken: files.publicToken,
    source: files.source, meta: files.meta, createdBy: files.createdBy, createdAt: files.createdAt,
  });
  return row;
}

const META_COLS = {
  id: files.id, name: files.name, mimeType: files.mimeType, sizeBytes: files.sizeBytes, sha256: files.sha256, publicToken: files.publicToken,
  source: files.source, meta: files.meta, createdBy: files.createdBy, createdAt: files.createdAt,
};

export async function getFileMeta(id: string): Promise<StoredFile | null> {
  const [row] = await db.select(META_COLS).from(files).where(eq(files.id, id));
  return row ?? null;
}

export async function listFileMeta(ids: string[]): Promise<StoredFile[]> {
  if (!ids.length) return [];
  return db.select(META_COLS).from(files).where(inArray(files.id, ids));
}

export async function readFile(id: string): Promise<(StoredFile & { data: Buffer }) | null> {
  const [row] = await db.select().from(files).where(eq(files.id, id));
  return row ? { ...row, data: Buffer.from(row.data) } : null;
}

export async function readFileByToken(token: string): Promise<(StoredFile & { data: Buffer }) | null> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const [row] = await db.select().from(files).where(eq(files.publicToken, token));
  return row ? { ...row, data: Buffer.from(row.data) } : null;
}

/** Dashboard link (requires login). */
export const fileUrl = (id: string) => `/api/files/${id}`;
/** Capability link for external fetchers; anyone with the token can read the file. */
export const publicFileUrl = (f: Pick<StoredFile, "publicToken">) => `${env.appUrl}/api/files/t/${f.publicToken}`;
