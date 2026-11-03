export interface TranscriptionResult {
  text: string;
  /** Provider-reported language, when available. */
  detectedLanguage?: string;
}

export interface SynthesisResult {
  audio: ArrayBuffer;
  mimeType: string;
}

export interface SpeechProvider {
  id: string;
  /**
   * Languages the VENDOR documents as supported. This is a claim, not a validation:
   * Over Sabi's own per-language status (languages.stt_status / tts_status) decides
   * how the feature is labelled to learners.
   */
  vendorSttLanguages: readonly string[];
  vendorTtsLanguages: readonly string[];
  transcribe(audio: Blob, language: string): Promise<TranscriptionResult>;
  synthesize(
    text: string,
    language: string,
    opts: { speed: number; voice?: string },
  ): Promise<SynthesisResult>;
}
