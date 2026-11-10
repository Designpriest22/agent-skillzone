import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { buildSummaryInstruction, buildTutorSystemPrompt, type TutorContext } from "./prompts";
import { sessionSummarySchema, tutorTurnSchema, type SessionSummary } from "./schemas";
import { TutorDeclinedError, type ChatProvider, type HistoryTurn, type TutorTurnResult } from "./types";

const FALLBACK_BETA = "server-side-fallback-2026-07-01";

/**
 * Claude-backed tutor. Uses structured outputs so every turn has a reply, optional
 * translation, corrections and new vocabulary as separate fields.
 *
 * - Server-side refusal fallback (`fallbacks: "default"`) is enabled so a policy decline
 *   is retried on Anthropic's recommended fallback model instead of failing the turn.
 * - Each tutor turn's full `content` (including thinking blocks) is stored and replayed
 *   unchanged, keeping the history append-only as the API requires.
 * - Effort defaults to "low": short conversational turns, latency matters.
 */
export class AnthropicChatProvider implements ChatProvider {
  id = "anthropic";
  private client: Anthropic;

  constructor(
    apiKey: string,
    public model: string,
    private effort: "low" | "medium" | "high",
  ) {
    this.client = new Anthropic({ apiKey, maxRetries: 2, timeout: 60_000 });
  }

  async tutorTurn(ctx: TutorContext, history: HistoryTurn[], learnerText: string): Promise<TutorTurnResult> {
    const messages: Anthropic.Beta.BetaMessageParam[] = history.map((t) =>
      t.role === "learner"
        ? { role: "user", content: t.text }
        : {
            role: "assistant",
            content: (t.raw as Anthropic.Beta.BetaContentBlockParam[] | undefined) ?? t.text,
          },
    );
    messages.push({ role: "user", content: learnerText });

    const response = await this.client.beta.messages.parse({
      model: this.model,
      max_tokens: 4000,
      betas: [FALLBACK_BETA],
      fallbacks: "default",
      cache_control: { type: "ephemeral" },
      system: buildTutorSystemPrompt(ctx),
      output_config: { effort: this.effort, format: betaZodOutputFormat(tutorTurnSchema) },
      messages,
    });

    if (response.stop_reason === "refusal")
      throw new TutorDeclinedError(response.stop_details?.category ?? null);
    const parsed = response.parsed_output;
    if (!parsed) throw new Error(`Tutor reply could not be parsed (stop_reason=${response.stop_reason})`);
    return {
      turn: parsed,
      raw: response.content,
      provider: this.id,
      model: response.model,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
      },
    };
  }

  async summarize(ctx: TutorContext, transcript: HistoryTurn[]): Promise<SessionSummary> {
    const text = transcript
      .map((t) => `${t.role === "learner" ? "Learner" : ctx.tutor.name}: ${t.text}`)
      .join("\n");
    const response = await this.client.beta.messages.parse({
      model: this.model,
      max_tokens: 4000,
      betas: [FALLBACK_BETA],
      fallbacks: "default",
      system: buildSummaryInstruction(ctx),
      output_config: { effort: "low", format: betaZodOutputFormat(sessionSummarySchema) },
      messages: [{ role: "user", content: `<conversation>\n${text}\n</conversation>` }],
    });
    if (response.stop_reason === "refusal")
      throw new TutorDeclinedError(response.stop_details?.category ?? null);
    if (!response.parsed_output) throw new Error("Summary could not be parsed");
    return response.parsed_output;
  }
}
