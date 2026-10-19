import { recordProviderEvent } from "@/lib/analytics";
import { getLanguage } from "@/lib/content/repo";
import { db } from "@/lib/db";
import { consumeUsage, getEntitlement } from "@/lib/entitlements";
import { assertSameOrigin, handler, HttpError, json, requireApiUser } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { speechCapability, speechProvider } from "@/lib/speech";

const MAX_BYTES = 2 * 1024 * 1024;

/**
 * Transcribes a short learner recording. Audio is streamed to the configured speech
 * provider and NOT stored by Over Sabi.
 */
export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const user = await requireApiUser();
  await rateLimit(`stt:${user.id}`, 30, 60);
  const [p] = await db()`select voice_processing_consent_at from profiles where user_id = ${user.id}`;
  if (!p?.voice_processing_consent_at)
    throw new HttpError(403, "Allow voice processing in the speaking room first.", "consent_required");
  const form = await req.formData();
  const audio = form.get("audio");
  const language = String(form.get("language") ?? "");
  const clientSeconds = Number(form.get("seconds") ?? 0);
  if (!(audio instanceof Blob) || audio.size === 0)
    throw new HttpError(400, "No audio received. Check your microphone and try again.", "no_audio");
  if (audio.size > MAX_BYTES)
    throw new HttpError(413, "That recording is too long. Keep it under a minute.", "too_large");
  const lang = await getLanguage(language);
  if (!lang) throw new HttpError(400, "Unknown language.", "bad_language");
  const cap = speechCapability("stt", lang);
  if (cap.status === "unavailable") throw new HttpError(409, cap.reason, "stt_unavailable");

  const seconds = Math.ceil(
    Math.max(Number.isFinite(clientSeconds) ? clientSeconds : 0, audio.size / 16000, 1),
  );
  const ent = await getEntitlement(user.id);
  await consumeUsage(user.id, "stt_seconds", Math.min(seconds, 120), ent.limits);

  const provider = speechProvider()!;
  const started = Date.now();
  try {
    const result = await provider.transcribe(audio, language);
    await recordProviderEvent({
      provider: provider.id,
      capability: "stt",
      language,
      ok: true,
      latencyMs: Date.now() - started,
    });
    if (!result.text)
      throw new HttpError(
        422,
        "We couldn't make out any words. Try again a little closer to the mic, or type instead.",
        "empty_transcript",
      );
    return json({ text: result.text, provider: provider.id, status: cap.status, note: cap.reason });
  } catch (err) {
    if (err instanceof HttpError) throw err;
    await recordProviderEvent({
      provider: provider.id,
      capability: "stt",
      language,
      ok: false,
      latencyMs: Date.now() - started,
      error: String(err),
    });
    throw new HttpError(
      502,
      "Transcription isn't working right now. Type your reply instead — the conversation continues.",
      "stt_failed",
    );
  }
});
