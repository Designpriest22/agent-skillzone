import { getCurrentUser, hasRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getObject } from "@/lib/storage";

/**
 * Serves stored audio. Verified pronunciation audio is public; recordings under review
 * are only available to their contributor and to reviewers.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const key = (await params).key.map(decodeURIComponent).join("/");
  const [asset] =
    await db()`select storage_path, mime_type, review_status, uploaded_by from audio_assets where storage_path = ${key}`;
  if (!asset) return new Response("Not found", { status: 404 });
  if (asset.review_status !== "verified") {
    const user = await getCurrentUser();
    if (!user || (user.id !== asset.uploaded_by && !hasRole(user, "reviewer")))
      return new Response("Not found", { status: 404 });
  }
  const obj = await getObject(asset.storage_path);
  if (!obj) return new Response("Not found", { status: 404 });
  return new Response(obj.data, {
    headers: {
      "Content-Type": asset.mime_type,
      "Cache-Control":
        asset.review_status === "verified" ? "public, max-age=604800, immutable" : "private, no-store",
    },
  });
}
