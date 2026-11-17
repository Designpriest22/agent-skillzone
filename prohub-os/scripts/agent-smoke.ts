/**
 * Live smoke test against the real Claude API (costs a few cents).
 *   npm run agent:smoke                 # MD answers a data question from tools
 *   npm run agent:smoke -- --research   # Research agent does a real web-sourced scan
 */
import { eq } from "drizzle-orm";
import { db, closeDb } from "@/db/client";
import { commands, tasks, agentRuns, users } from "@/db/schema";
import { submitCommand } from "@/orchestrator/commands";
import { processOne } from "@/worker/loop";

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Set ANTHROPIC_API_KEY first.");
  const [owner] = await db.select().from(users).where(eq(users.role, "owner"));
  if (!owner) throw new Error("Run `npm run setup` first.");
  const research = process.argv.includes("--research");
  const { commandId } = research
    ? await submitCommand("Find three notable developments from the last month in Nigeria's digital marketing or creative industry and record them as intelligence with sources.", owner.id, { agentSlug: "research" })
    : await submitCommand("Which agent has the most outstanding tasks, and what is our recorded revenue this month?", owner.id);
  const deadline = Date.now() + 10 * 60_000;
  while (Date.now() < deadline) {
    const [c] = await db.select().from(commands).where(eq(commands.id, commandId));
    if (c.status === "completed" || c.status === "failed") break;
    if (!(await processOne())) await new Promise((r) => setTimeout(r, 1000));
  }
  const [c] = await db.select().from(commands).where(eq(commands.id, commandId));
  const ts = await db.select().from(tasks).where(eq(tasks.commandId, commandId));
  console.log(`\nCommand: ${c.status}\n\n${c.response}\n`);
  for (const t of ts) {
    const runs = await db.select().from(agentRuns).where(eq(agentRuns.taskId, t.id));
    console.log(`- [${t.agentSlug}] ${t.status} · verified=${t.verification?.verified ?? "n/a"} · runs=${runs.length} · $${runs.reduce((a, r) => a + r.costUsd, 0).toFixed(4)}`);
  }
  process.exitCode = c.status === "completed" ? 0 : 1;
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(closeDb);
