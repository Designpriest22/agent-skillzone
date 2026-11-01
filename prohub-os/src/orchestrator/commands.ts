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

export type CommandChannel = "dashboard" | "whatsapp" | "claude" | "api";

const CHANNEL_NOTE: Record<CommandChannel, string> = {
  dashboard: "",
  whatsapp: "\n\nThe owner sent this over WhatsApp and will read your final report on a phone: lead with the outcome and the key figures, keep it under ~1,500 characters, use short lines and simple bullets (no tables or markdown headings). Progress updates are sent automatically as you delegate.",
  claude: "\n\nThe owner sent this from Claude (the Claude connector). Your final report is returned to Claude verbatim: be complete but concise, quote real figures and record IDs.",
  api: "",
};

export async function submitCommand(text: string, userId: string, opts: { agentSlug?: string; channel?: CommandChannel; replyTo?: string | null; attachments?: string[] } = {}) {
  const clean = text.trim();
  if (clean.length < 3) throw new Error("Command is too short");
  if (clean.length > 8000) throw new Error("Command is too long (max 8000 characters)");
  const channel = opts.channel ?? "dashboard";
  const attachments = opts.attachments ?? [];
  const [cmd] = await db.insert(commands).values({ text: clean, issuedBy: userId, status: "planning", channel, replyTo: opts.replyTo ?? null, attachments }).returning();
  const attachNote = attachments.length ? `\n\nThe owner attached ${attachments.length} file(s); they are included above this message (file IDs: ${attachments.join(", ")}). Pass the file IDs on to agents who need them.` : "";
  const agentSlug = opts.agentSlug ?? "managing-director";
  const direct = agentSlug !== "managing-director";
  const task = await createTask({
    agentSlug, createdBy: `user:${userId}`, status: "approved", priority: 1, commandId: cmd.id,
    title: truncate(clean.split("\n")[0], 90),
    instructions: direct
      ? `The owner assigned this task to you directly:\n\n"""${clean}"""\n\nDo the work with your tools and complete the task with verified outputs.${attachNote}${CHANNEL_NOTE[channel]}`
      : `The owner issued this instruction:\n\n"""${clean}"""\n\nInterpret the objective. If it is a question about the business, answer it from your data tools (finance_report, sales_metrics, agent_workload, revenue_target_status, operations_snapshot, list_tasks) and complete with answer_only=true, quoting the figures you retrieved. If it requires work, plan it, delegate to the right agents with clear, self-contained instructions (use depends_on for ordering), call await_subtasks, and when resumed consolidate the verified results into a report for the owner. Keep completed, pending, failed and awaiting-approval items clearly separate; a plan or draft is not a completed deliverable.${attachNote}${CHANNEL_NOTE[channel]}`,
  });
  await db.update(commands).set({ rootTaskId: task.id, status: "executing" }).where(eq(commands.id, cmd.id));
  await logActivity({ type: "user", id: userId }, "command.submitted", { type: "command", id: cmd.id }, { text: truncate(clean, 300), agent: agentSlug, channel });
  return { commandId: cmd.id, taskId: task.id };
}
