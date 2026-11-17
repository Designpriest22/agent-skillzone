import type { SessionSummary, TutorTurn } from "./schemas";
import type { TutorContext } from "./prompts";

/** One prior turn. `raw` is the provider's own representation, replayed unchanged. */
export interface HistoryTurn {
  role: "learner" | "tutor";
  text: string;
  raw?: unknown;
}

export interface TutorTurnResult {
  turn: TutorTurn;
  /** Provider-native assistant content to store and replay on the next request. */
  raw: unknown;
  provider: string;
  model: string;
  usage?: { inputTokens: number; outputTokens: number; cacheReadTokens?: number };
}

export interface ChatProvider {
  id: string;
  model: string;
  tutorTurn(ctx: TutorContext, history: HistoryTurn[], learnerText: string): Promise<TutorTurnResult>;
  summarize(ctx: TutorContext, transcript: HistoryTurn[]): Promise<SessionSummary>;
}

/** Thrown when the model declines; the UI shows a neutral message and lets the learner continue. */
export class TutorDeclinedError extends Error {
  constructor(public category: string | null) {
    super("The tutor couldn't respond to that message.");
  }
}
