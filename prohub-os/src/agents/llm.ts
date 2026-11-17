/**
 * Model access layer. Production uses the Anthropic Messages API (beta surface for server-side
 * refusal fallbacks). Tests inject a scripted client — the runtime never fakes responses itself.
 */
import Anthropic from "@anthropic-ai/sdk";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { integrationConfigs } from "@/db/schema";
import { decryptJson } from "@/lib/crypto";

export type LLMRequest = {
  model: string;
  effort: "low" | "medium" | "high" | "xhigh" | "max";
  system: Anthropic.Beta.BetaTextBlockParam[];
  messages: Anthropic.Beta.BetaMessageParam[];
  tools: Anthropic.Beta.BetaToolUnion[];
  maxTokens?: number;
};

export interface LLMClient {
  create(req: LLMRequest): Promise<Anthropic.Beta.BetaMessage>;
}

/** Models that accept server-side `fallbacks: "default"` on the Claude API. */
const FALLBACK_MODELS = new Set(["claude-opus-5-5", "claude-opus-5", "claude-sonnet-5-5", "claude-fable-5-1"]);

export class AnthropicLLM implements LLMClient {
  constructor(private client: Anthropic) {}
  async create(req: LLMRequest) {
    const useFallback = FALLBACK_MODELS.has(req.model);
    const stream = this.client.beta.messages.stream({
      model: req.model,
      max_tokens: req.maxTokens ?? 32000,
      system: req.system,
      messages: req.messages,
      tools: req.tools,
      output_config: { effort: req.effort },
      // Auto-caches the longest stable prefix (tools + system + history) across agent turns.
      cache_control: { type: "ephemeral" },
      ...(useFallback ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
    });
    return stream.finalMessage();
  }
}

let override: LLMClient | null = null;
/** Test hook: inject a scripted client. */
export function setLLMClient(c: LLMClient | null) {
  override = c;
}

export class LLMNotConfigured extends Error {
  constructor() {
    super("No Anthropic API key configured. Add ANTHROPIC_API_KEY to the environment or set it in Integrations → Anthropic.");
    this.name = "LLMNotConfigured";
  }
}

export async function getLLM(): Promise<LLMClient> {
  if (override) return override;
  let apiKey = process.env.ANTHROPIC_API_KEY ?? "";
  if (!apiKey) {
    try {
      const [row] = await db.select().from(integrationConfigs).where(eq(integrationConfigs.slug, "anthropic"));
      if (row?.credentialsEncrypted && row.enabled) apiKey = decryptJson<{ apiKey?: string }>(row.credentialsEncrypted).apiKey ?? "";
    } catch { /* fall through */ }
  }
  if (!apiKey) throw new LLMNotConfigured();
  return new AnthropicLLM(new Anthropic({ apiKey, baseURL: process.env.ANTHROPIC_API_BASE_URL || undefined, maxRetries: 3 }));
}

/** USD per million tokens (input, output, cache read, cache write 5m). Source: Anthropic pricing, Oct 2026. */
export const PRICING: Record<string, { in: number; out: number; cacheRead: number; cacheWrite: number }> = {
  "claude-fable-5-1": { in: 10, out: 50, cacheRead: 0.25, cacheWrite: 12.5 },
  "claude-opus-5-5": { in: 4, out: 20, cacheRead: 0.2, cacheWrite: 5 },
  "claude-sonnet-5-5": { in: 2, out: 10, cacheRead: 0.2, cacheWrite: 2.5 },
  "claude-haiku-5-5": { in: 0.1, out: 0.5, cacheRead: 0.01, cacheWrite: 0.125 },
};
export const WEB_SEARCH_USD_PER_REQUEST = 0.01;

export function estimateCostUsd(model: string, u: { input: number; output: number; cacheRead: number; cacheWrite: number; webSearches: number }) {
  const p = PRICING[model] ?? PRICING["claude-opus-5-5"];
  return (u.input * p.in + u.output * p.out + u.cacheRead * p.cacheRead + u.cacheWrite * p.cacheWrite) / 1_000_000 + u.webSearches * WEB_SEARCH_USD_PER_REQUEST;
}

export const AVAILABLE_MODELS = [
  { id: "claude-opus-5-5", label: "Claude Opus 5.5 — default, strongest reasoning per cost" },
  { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5 — faster, ~50% cheaper" },
  { id: "claude-haiku-5-5", label: "Claude Haiku 5.5 — high-volume, lowest cost" },
  { id: "claude-fable-5-1", label: "Claude Fable 5.1 — most capable, premium price" },
];
