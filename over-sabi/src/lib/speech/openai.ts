import "server-only";
import type { SpeechProvider, SynthesisResult, TranscriptionResult } from "./types";

/**
 * OpenAI audio endpoints (REST). Transcription: /v1/audio/transcriptions. Speech:
 * /v1/audio/speech. OpenAI's transcription models list Yoruba and Hausa among
 * supported languages; we did not find Igbo. OpenAI's TTS voices are optimised for
 * English, so we do not claim Nigerian-language TTS for this provider.
 */
export class OpenAiSpeechProvider implements SpeechProvider {
  id = "openai";
  vendorSttLanguages = ["yo", "ha", "en"] as const;
  vendorTtsLanguages = ["en"] as const;

  constructor(
    private apiKey: string,
    private sttModel: string,
    private ttsModel: string,
    private defaultVoice: string,
  ) {}

  async transcribe(audio: Blob, language: string): Promise<TranscriptionResult> {
    const form = new FormData();
    form.append("file", audio, "speech.webm");
    form.append("model", this.sttModel);
    if ((this.vendorSttLanguages as readonly string[]).includes(language)) form.append("language", language);
    form.append("response_format", "json");
    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}` },
      body: form,
    });
    if (!res.ok) throw new Error(`OpenAI transcription failed: ${res.status} ${await safeText(res)}`);
    const data = (await res.json()) as { text?: string };
    return { text: (data.text ?? "").trim() };
  }

  async synthesize(
    text: string,
    _language: string,
    opts: { speed: number; voice?: string },
  ): Promise<SynthesisResult> {
    const res = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.ttsModel,
        voice: opts.voice || this.defaultVoice,
        input: text,
        speed: opts.speed,
        response_format: "mp3",
      }),
    });
    if (!res.ok) throw new Error(`OpenAI speech failed: ${res.status} ${await safeText(res)}`);
    return { audio: await res.arrayBuffer(), mimeType: "audio/mpeg" };
  }
}

async function safeText(res: Response) {
  try {
    return (await res.text()).slice(0, 300);
  } catch {
    return "";
  }
}
