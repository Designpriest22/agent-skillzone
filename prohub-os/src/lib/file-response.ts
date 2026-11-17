import type { StoredFile } from "@/services/files";

/** Streams a stored file with HTTP Range support (needed for video seeking in browsers and WhatsApp previews). */
export function fileResponse(req: Request, f: StoredFile & { data: Buffer }, opts: { download?: boolean } = {}) {
  const headers: Record<string, string> = {
    "Content-Type": f.mimeType,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=3600",
    "Content-Disposition": `${opts.download ? "attachment" : "inline"}; filename="${f.name.replace(/[^\w.\- ]/g, "_")}"`,
    "X-Content-Type-Options": "nosniff",
  };
  const range = req.headers.get("range");
  const m = range && /^bytes=(\d*)-(\d*)$/.exec(range);
  if (m) {
    const size = f.data.length;
    let start = m[1] ? Number(m[1]) : size - Number(m[2] || 0);
    let end = m[1] ? (m[2] ? Number(m[2]) : size - 1) : size - 1;
    start = Math.max(0, start); end = Math.min(size - 1, end);
    if (start > end || start >= size) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    return new Response(new Uint8Array(f.data.subarray(start, end + 1)), { status: 206, headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) } });
  }
  return new Response(new Uint8Array(f.data), { headers: { ...headers, "Content-Length": String(f.data.length) } });
}
