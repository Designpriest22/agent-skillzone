/**
 * Natural-language command intake. Every owner instruction becomes a command with a root task
 * owned by the AI Managing Director, who interprets, delegates and consolidates.
 */
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { commands } from "@/db/schema";
import { createTask } from "./tasks";
import { logActivity } from "@/lib/audit";
import { truncate } from "@/lib/utils";

export async function submitCommand(text: string, userId: string, opts: { agentSlug?: string } = {}) {
  const clean = text.trim();
  if (clean.length < 3) throw new Error("Command is too short");
  if (clean.length > 8000) throw new Error("Command is too long (max 8000 characters)");
  const [cmd] = await db.insert(commands).values({ text: clean, issuedBy: userId, status: "planning" }).returning();
  const agentSlug = opts.agentSlug ?? "managing-director";
  const direct = agentSlug !== "managing-director";
  const task = await createTask({
    agentSlug, createdBy: `user:${userId}`, status: "approved", priority: 1, commandId: cmd.id,
    title: truncate(clean.split("\n")[0], 90),
    instructions: direct
      ? `The owner assigned this task to you directly:\n\n"""${clean}"""\n\nDo the work with your tools and complete the task with verified outputs.`
      : `The owner issued this instruction:\n\n"""${clean}"""\n\nInterpret the objective. If it is a question about the business, answer it from your data tools (finance_report, sales_metrics, agent_workload, revenue_target_status, operations_snapshot, list_tasks) and complete with answer_only=true, quoting the figures you retrieved. If it requires work, plan it, delegate to the right agents with clear, self-contained instructions (use depends_on for ordering), call await_subtasks, and when resumed consolidate the verified results into a report for the owner.`,
  });
  await db.update(commands).set({ rootTaskId: task.id, status: "executing" }).where(eq(commands.id, cmd.id));
  await logActivity({ type: "user", id: userId }, "command.submitted", { type: "command", id: cmd.id }, { text: truncate(clean, 300), agent: agentSlug });
  return { commandId: cmd.id, taskId: task.id };
}
