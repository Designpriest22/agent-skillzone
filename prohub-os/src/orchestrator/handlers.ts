import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { tasks, commands } from "@/db/schema";
import type { Job } from "./queue";
import { runTask } from "@/agents/runtime";
import { executeApproval } from "@/governance/actions";
import * as cycles from "./cycles";
import { generateReport } from "@/services/reports";
import { notifyOwner } from "@/services/notify";
import { deliverReport } from "@/services/report-delivery";

async function afterTaskRun(taskId: string) {
  const [t] = await db.select().from(tasks).where(eq(tasks.id, taskId));
  if (!t) return;
  // Owner commands: tell the owner when the root task finishes.
  if (t.commandId && !t.parentTaskId && (t.status === "completed" || t.status === "failed")) {
    const [cmd] = await db.select().from(commands).where(eq(commands.id, t.commandId));
    await notifyOwner({
      kind: t.status === "completed" ? "info" : "alert",
      title: `${t.status === "completed" ? "Done" : "Failed"}: ${cmd?.text.slice(0, 80) ?? t.title}`,
      body: (t.resultSummary ?? t.error ?? "").slice(0, 1200),
      href: `/os/command?c=${t.commandId}`,
    });
  }
  // Scheduled reviews that attached a narrative: deliver the finished report.
  if (t.status === "completed" && t.kind === "scheduled") {
    for (const o of t.outputs.filter((o) => o.type === "report")) {
      await notifyOwner({ kind: "report", title: t.title, body: (t.resultSummary ?? "").slice(0, 900), href: `/os/reports/${o.id}` });
      await deliverReport(o.id);
    }
  }
}

export async function handleJob(job: Job): Promise<unknown> {
  const p = job.payload as Record<string, unknown>;
  switch (job.type) {
    case "task.run": {
      const res = await runTask(String(p.taskId), { resume: Boolean(p.resume) });
      if (res.status === "completed" || res.status === "failed") await afterTaskRun(String(p.taskId));
      return res;
    }
    case "approval.execute": return executeApproval(String(p.approvalId));
    case "cycle.morning": return cycles.morningCycle();
    case "cycle.assignments": return cycles.assignmentsCycle();
    case "whatsapp.inbound": {
      const { handleInbound } = await import("@/channels/whatsapp");
      return handleInbound(p as unknown as Parameters<typeof handleInbound>[0]);
    }
    case "channel.notify": {
      const { sendCommandEvent } = await import("@/channels/whatsapp");
      return sendCommandEvent(p as unknown as Parameters<typeof sendCommandEvent>[0]);
    }
    case "channel.approval": {
      const { pushApproval } = await import("@/channels/whatsapp");
      return { sent: await pushApproval(String(p.approvalId)) };
    }
    case "cycle.midday": return cycles.middayCycle();
    case "cycle.evening": return cycles.eveningCycle();
    case "followups.check": return cycles.checkFollowUps();
    case "invoices.check": return cycles.checkInvoices();
    case "content.publish_due": return cycles.publishDueContent();
    case "report.generate": {
      const kind = String(p.kind);
      if (kind === "weekly") return cycles.weeklyReports();
      if (kind === "monthly") return cycles.monthlyReports();
      if (kind === "daily_finance") return cycles.dailyFinanceReport();
      return generateReport(kind as Parameters<typeof generateReport>[0], "system:job");
    }
    default:
      throw new Error(`Unknown job type ${job.type}`);
  }
}
