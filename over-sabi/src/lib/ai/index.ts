import "server-only";
import { env, testProvidersEnabled } from "../env";
import { AnthropicChatProvider } from "./anthropic";
import { TestChatProvider } from "./test-double";
import type { ChatProvider } from "./types";

let cached: ChatProvider | null | undefined;

/** The configured conversation provider, or null if none is configured. */
export function chatProvider(): ChatProvider | null {
  if (cached !== undefined) return cached;
  const e = env();
  if (testProvidersEnabled()) cached = new TestChatProvider();
  else if (e.ANTHROPIC_API_KEY)
    cached = new AnthropicChatProvider(e.ANTHROPIC_API_KEY, e.TUTOR_MODEL, e.TUTOR_EFFORT);
  else cached = null;
  return cached;
}

export type { ChatProvider } from "./types";
