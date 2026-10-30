import type { SpeechProvider, SynthesisResult, TranscriptionResult } from "./types";

/** Test-only double (OVERSABI_TEST_PROVIDERS=1). Never used in production. */
export class TestSpeechProvider implements SpeechProvider {
  id = "test-double";
  vendorSttLanguages = ["yo", "ig", "ha", "en"] as const;
  vendorTtsLanguages = ["yo", "ig", "ha", "en"] as const;

  async transcribe(audio: Blob): Promise<TranscriptionResult> {
    const text = await audio.text();
    if (text.includes("FAIL")) throw new Error("Simulated transcription failure");
    return { text: `[test transcript ${audio.size} bytes]` };
  }

  async synthesize(text: string): Promise<SynthesisResult> {
    if (text.includes("[[tts-fail]]")) throw new Error("Simulated synthesis failure");
    return { audio: new TextEncoder().encode("test-audio").buffer as ArrayBuffer, mimeType: "audio/mpeg" };
  }
}
