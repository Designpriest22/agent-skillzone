import "server-only";
import type { SpeechProvider, SynthesisResult, TranscriptionResult } from "./types";

/**
 * ElevenLabs REST: speech-to-text (Scribe) and text-to-speech. ElevenLabs documents
 * Scribe support for Hausa and Igbo (Igbo FLEURS WER 43.4% for Scribe v1 — treat as
 * experimental). We did not find official confirmation of Yoruba/Igbo/Hausa TTS, so
 * no Nigerian-language TTS is claimed; admins can enable it per language after testing.
 */
export class ElevenLabsSpeechProvider implements SpeechProvider {
  id = "elevenlabs";
  vendorSttLanguages = ["ha", "ig", "en"] as const;
  vendorTtsLanguages = ["en"] as const;

  constructor(
    private apiKey: string,
    private sttModel: string,
    private ttsModel: string,
    private voiceId: string | undefined,
  ) {}

  async transcribe(audio: Blob, language: string): Promise<TranscriptionResult> {
    const form = new FormData();
    form.append("file", audio, "speech.webm");
    form.append("model_id", this.sttModel);
    const iso3: Record<string, string> = { ha: "hau", ig: "ibo", yo: "yor", en: "eng" };
    if (iso3[language]) form.append("language_code", iso3[language]!);
    const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: { "xi-api-key": this.apiKey },
      body: form,
    });
    if (!res.ok) throw new Error(`ElevenLabs transcription failed: ${res.status}`);
    const data = (await res.json()) as { text?: string; language_code?: string };
    return { text: (data.text ?? "").trim(), detectedLanguage: data.language_code };
  }

  async synthesize(
    text: string,
    _language: string,
    opts: { speed: number; voice?: string },
  ): Promise<SynthesisResult> {
    const voice = opts.voice || this.voiceId;
    if (!voice) throw new Error("ELEVENLABS_VOICE_ID is not set");
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_64`,
      {
        method: "POST",
        headers: { "xi-api-key": this.apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          model_id: this.ttsModel,
          voice_settings: { speed: Math.max(0.7, Math.min(1.2, opts.speed)) },
        }),
      },
    );
    if (!res.ok) throw new Error(`ElevenLabs speech failed: ${res.status}`);
    return { audio: await res.arrayBuffer(), mimeType: "audio/mpeg" };
  }
}
