import { handler, json } from "@/lib/http";
import { BOARDS, leaderboard, type Board } from "@/lib/services/player";

export const GET = handler(async (req) => {
  const q = new URL(req.url).searchParams;
  const board = (BOARDS as readonly string[]).includes(q.get("board") ?? "") ? (q.get("board") as Board) : "overall";
  const rows = await leaderboard(board, { area: q.get("area") ?? undefined, stage: q.get("stage") ?? undefined });
  return json({ board, rows, at: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
});
