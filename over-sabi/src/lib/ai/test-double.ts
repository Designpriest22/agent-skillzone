import type { TutorContext } from "./prompts";
import type { SessionSummary } from "./schemas";
import type { ChatProvider, HistoryTurn, TutorTurnResult } from "./types";

/**
 * Deterministic stand-in used ONLY by automated tests (OVERSABI_TEST_PROVIDERS=1,
 * never in production). It does not generate language; it echoes so tests can check
 * the session plumbing — persistence, limits, transcripts, summaries — end to end.
 */
export class TestChatProvider implements ChatProvider {
  id = "test-double";
  model = "test-double";

  async tutorTurn(ctx: TutorContext, history: HistoryTurn[], learnerText: string): Promise<TutorTurnResult> {
    if (learnerText.includes("[[fail]]")) throw new Error("Simulated provider failure");
    const n = history.filter((h) => h.role === "tutor").length + 1;
    return {
      turn: {
        reply: `[test tutor ${ctx.tutor.name} #${n}] ${learnerText}`,
        translation: ctx.settings.translationAssist ? `[translation #${n}]` : null,
        corrections: learnerText.includes("[[correct]]")
          ? [
              {
                type: "grammar",
                original: learnerText,
                corrected: learnerText.replace("[[correct]]", "").trim(),
                explanation: "Test correction.",
              },
            ]
          : [],
        newVocabulary: [{ term: "test-term", meaning: "test meaning", note: "" }],
        uncertainty: null,
      },
      raw: [{ type: "text", text: `test-${n}` }],
      provider: this.id,
      model: this.model,
    };
  }

  async summarize(_ctx: TutorContext, transcript: HistoryTurn[]): Promise<SessionSummary> {
    return {
      summary: `Test summary of ${transcript.length} turns.`,
      usefulExpressions: [{ term: "test-term", meaning: "test meaning" }],
      keyCorrections: [],
      grammarInsights: ["Test insight."],
      reviewPhrases: ["test-term"],
      nextStep: "Try the next lesson.",
      caveats: "Pronunciation was not assessed.",
    };
  }
}
