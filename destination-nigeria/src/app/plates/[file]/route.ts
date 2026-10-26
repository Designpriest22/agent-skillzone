import { allPlates } from "@/lib/content";
import { parsePlateKey, plateKey, plateSvg } from "@/lib/plates";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return allPlates().map((p) => ({ file: `${plateKey(p)}.svg` }));
}

export async function GET(_req: Request, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params;
  const plate = parsePlateKey(file.replace(/\.svg$/, ""));
  if (!plate) return new Response("Not found", { status: 404 });
  return new Response(plateSvg(plate), {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=86400, stale-while-revalidate=604800",
      "x-content-type-options": "nosniff",
    },
  });
}
