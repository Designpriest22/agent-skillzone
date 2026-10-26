import { buildSearchIndex } from "@/lib/search-index";

export const dynamic = "force-static";

export function GET() {
  return Response.json(buildSearchIndex(), {
    headers: { "cache-control": "public, max-age=3600, stale-while-revalidate=86400", "x-robots-tag": "noindex" },
  });
}
