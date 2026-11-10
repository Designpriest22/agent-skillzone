import "server-only";
import { env, testProvidersEnabled } from "../env";
import { ElevenLabsSpeechProvider } from "./elevenlabs";
import { OpenAiSpeechProvider } from "./openai";
import { TestSpeechProvider } from "./test-double";
import type { SpeechProvider } from "./types";

let cached: SpeechProvider | null | undefined;

export function speechProvider(): SpeechProvider | null {
  if (cached !== undefined) return cached;
  const e = env();
  if (testProvidersEnabled()) cached = new TestSpeechProvider();
  else if (e.SPEECH_PROVIDER === "openai" && e.OPENAI_API_KEY)
    cached = new OpenAiSpeechProvider(
      e.OPENAI_API_KEY,
      e.OPENAI_STT_MODEL,
      e.OPENAI_TTS_MODEL,
      e.OPENAI_TTS_VOICE,
    );
  else if (e.SPEECH_PROVIDER === "elevenlabs" && e.ELEVENLABS_API_KEY)
    cached = new ElevenLabsSpeechProvider(
      e.ELEVENLABS_API_KEY,
      e.ELEVENLABS_STT_MODEL,
      e.ELEVENLABS_TTS_MODEL,
      e.ELEVENLABS_VOICE_ID,
    );
  else cached = null;
  return cached;
}

export type SpeechCapability = "available" | "experimental" | "unavailable";

/**
 * Combines provider configuration, the vendor's documented language list and Over
 * Sabi's own validation status into what the learner is told.
 */
export function speechCapability(
  kind: "stt" | "tts",
  language: { code: string; stt_status: string; tts_status: string },
): { status: SpeechCapability; reason: string } {
  const p = speechProvider();
  if (!p) return { status: "unavailable", reason: "No speech service is configured on this server." };
  const ourStatus = kind === "stt" ? language.stt_status : language.tts_status;
  if (ourStatus === "unsupported")
    return {
      status: "unavailable",
      reason: "Our tests found this language isn't supported well enough yet.",
    };
  const vendorList: readonly string[] = kind === "stt" ? p.vendorSttLanguages : p.vendorTtsLanguages;
  // A language the vendor doesn't list stays off until an admin has trialled it and
  // marked it experimental or validated in /admin/languages.
  if (!vendorList.includes(language.code) && ourStatus === "untested")
    return { status: "unavailable", reason: "The configured speech service doesn't list this language." };
  if (ourStatus === "validated")
    return { status: "available", reason: "Tested by Over Sabi with native speakers." };
  return {
    status: "experimental",
    reason:
      kind === "stt"
        ? "Experimental: transcription for this language hasn't been validated yet. Check the text before you send it."
        : "Experimental: this AI voice hasn't been checked by native speakers yet.",
  };
}

export type { SpeechProvider } from "./types";
