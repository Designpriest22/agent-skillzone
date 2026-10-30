import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { env } from "./env";

/**
 * Object storage for audio (contributor pronunciation recordings). Local disk in
 * development; Supabase Storage (private bucket, service-role key on the server only)
 * in production. Files are served through /api/audio, never by public URL.
 */
export async function putObject(key: string, data: ArrayBuffer, contentType: string): Promise<void> {
  const e = env();
  assertSafeKey(key);
  if (e.STORAGE_DRIVER === "supabase") {
    if (!e.SUPABASE_URL || !e.SUPABASE_SERVICE_ROLE_KEY)
      throw new Error("Supabase storage is not configured");
    const res = await fetch(`${e.SUPABASE_URL}/storage/v1/object/${e.SUPABASE_STORAGE_BUCKET}/${key}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${e.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": contentType,
        "x-upsert": "true",
      },
      body: data,
    });
    if (!res.ok) throw new Error(`Storage upload failed: ${res.status}`);
    return;
  }
  const file = path.join(path.resolve(e.STORAGE_LOCAL_DIR), key);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, Buffer.from(data));
}

export async function getObject(key: string): Promise<{ data: ArrayBuffer; contentType: string } | null> {
  const e = env();
  assertSafeKey(key);
  if (e.STORAGE_DRIVER === "supabase") {
    const res = await fetch(`${e.SUPABASE_URL}/storage/v1/object/${e.SUPABASE_STORAGE_BUCKET}/${key}`, {
      headers: { Authorization: `Bearer ${e.SUPABASE_SERVICE_ROLE_KEY}` },
    });
    if (!res.ok) return null;
    return {
      data: await res.arrayBuffer(),
      contentType: res.headers.get("content-type") ?? "application/octet-stream",
    };
  }
  try {
    const buf = await fs.readFile(path.join(path.resolve(e.STORAGE_LOCAL_DIR), key));
    return {
      data: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer,
      contentType: key.endsWith(".webm")
        ? "audio/webm"
        : key.endsWith(".mp3")
          ? "audio/mpeg"
          : "application/octet-stream",
    };
  } catch {
    return null;
  }
}

export async function deleteObject(key: string): Promise<void> {
  const e = env();
  assertSafeKey(key);
  if (e.STORAGE_DRIVER === "supabase") {
    await fetch(`${e.SUPABASE_URL}/storage/v1/object/${e.SUPABASE_STORAGE_BUCKET}/${key}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${e.SUPABASE_SERVICE_ROLE_KEY}` },
    });
    return;
  }
  await fs.rm(path.join(path.resolve(e.STORAGE_LOCAL_DIR), key), { force: true });
}

function assertSafeKey(key: string) {
  if (!/^[a-z0-9][a-z0-9/_.-]{0,200}$/i.test(key) || key.includes(".."))
    throw new Error("Invalid storage key");
}
