import { handler, json, requireApiUser } from "@/lib/http";
import { dashboard } from "@/lib/services/analytics";

export const GET = handler(async (req) => {
  await requireApiUser("moderator");
  const days = Number(new URL(req.url).searchParams.get("days") ?? 30);
  return json(await dashboard(Number.isFinite(days) ? days : 30), { headers: { "Cache-Control": "no-store" } });
});
