import { z } from "zod";
import { recordProviderEvent } from "@/lib/analytics";
import { getLanguage } from "@/lib/content/repo";
import { consumeUsage, getEntitlement } from "@/lib/entitlements";
import { handler, HttpError, parseJson, requireApiUser } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { speechCapability, speechProvider } from "@/lib/speech";

/** Synthesises a tutor reply. Returns audio bytes; nothing is stored. Disclosed as AI voice in the UI. */
export const POST = handler(async (req) => {
  const user = await requireApiUser();
  await rateLimit(`tts:${user.id}`, 40, 60);
  const b = await parseJson(
    req,
    z.object({
      text: z.string().min(1).max(1200),
      language: z.string().max(12),
      speed: z.number().min(0.5).max(1.5).default(1),
      voice: z.string().max(80).optional(),
    }),
  );
  const lang = await getLanguage(b.language);
  if (!lang) throw new HttpError(400, "Unknown language.", "bad_language");
  const cap = speechCapability("tts", lang);
  if (cap.status === "unavailable") throw new HttpError(409, cap.reason, "tts_unavailable");
  const ent = await getEntitlement(user.id);
  await consumeUsage(user.id, "tts_chars", b.text.length, ent.limits);
  const provider = speechProvider()!;
  const started = Date.now();
  try {
    const out = await provider.synthesize(b.text, b.language, { speed: b.speed, voice: b.voice });
    await recordProviderEvent({
      provider: provider.id,
      capability: "tts",
      language: b.language,
      ok: true,
      latencyMs: Date.now() - started,
    });
    return new Response(out.audio, {
      headers: { "Content-Type": out.mimeType, "Cache-Control": "no-store", "X-Speech-Status": cap.status },
    });
  } catch (err) {
    await recordProviderEvent({
      provider: provider.id,
      capability: "tts",
      language: b.language,
      ok: false,
      error: String(err),
    });
    throw new HttpError(
      502,
      "The tutor's voice isn't available right now. You can keep reading the replies.",
      "tts_failed",
    );
  }
});
