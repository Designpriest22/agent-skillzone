import type { z } from "zod";

export type ToolContext = {
  agentSlug: string;
  taskId: string;
  runId: string;
  /** Records produced in this run, used for completion verification. */
  produced: { type: string; id: string }[];
  /** Set by terminal tools to end the run. */
  terminal: null | { kind: "completed" | "failed" | "awaiting_subtasks"; summary: string };
};

export type AgentTool<S extends z.ZodType = z.ZodType> = {
  name: string;
  description: string;
  schema: S;
  /** Informational: L1 tools act directly; tools that touch the outside world file approvals instead. */
  governance: "autonomous" | "files_approval";
  run: (input: z.infer<S>, ctx: ToolContext) => Promise<unknown>;
};

export function defineTool<S extends z.ZodType>(t: AgentTool<S>): AgentTool<S> {
  return t;
}

/** Error the model should see and can recover from (bad input, missing record, policy refusal). */
export class ToolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ToolError";
  }
}
