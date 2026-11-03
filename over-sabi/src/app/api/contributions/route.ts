import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db, withUser } from "@/lib/db";
import { assertSameOrigin, handler, HttpError, json, requireApiUser } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { putObject } from "@/lib/storage";

const payloadSchema = z.object({
  language: z.string().max(12),
  kind: z.enum(["new_vocabulary", "correction", "pronunciation", "cultural_note", "dialect_variant"]),
  targetVocabId: z.string().uuid().optional(),
  text: z.string().trim().max(300).default(""),
  translation: z.string().trim().max(300).default(""),
  dialect: z.string().trim().max(120).default(""),
  notes: z.string().trim().max(2000).default(""),
  speakerConsent: z.boolean().default(false),
});

/**
 * Native-speaker contributions: new words, corrections, dialect variants, cultural
 * notes and pronunciation recordings. Everything lands in the review queue; nothing
 * is published without a reviewer's approval.
 */
export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const user = await requireApiUser();
  const [flag] = await db()`select enabled from feature_flags where key = 'contributions'`;
  if (flag && !flag.enabled) throw new HttpError(403, "Contributions are paused right now.", "disabled");
  await rateLimit(`contrib:${user.id}`, 30, 3600);
  const form = await req.formData();
  const input = payloadSchema.parse(JSON.parse(String(form.get("payload") ?? "{}")));
  const [lang] = await db()`select 1 from languages where code = ${input.language}`;
  if (!lang) throw new HttpError(400, "Unknown language.", "bad_language");
  if (input.kind !== "pronunciation" && !input.text && !input.notes)
    throw new HttpError(400, "Add the word, correction or note you want to share.", "empty");

  let audioAssetId: string | null = null;
  const audio = form.get("audio");
  if (input.kind === "pronunciation") {
    if (!(audio instanceof Blob) || !audio.size)
      throw new HttpError(400, "Record the pronunciation first.", "no_audio");
    if (audio.size > 1024 * 1024) throw new HttpError(413, "Keep recordings under 30 seconds.", "too_large");
    if (!input.speakerConsent)
      throw new HttpError(400, "Please confirm you agree to share this recording.", "consent_required");
    const key = `contributions/${input.language}/${randomUUID()}.webm`;
    await putObject(key, await audio.arrayBuffer(), "audio/webm");
    const [asset] = await db()`
      insert into audio_assets (language_code, storage_path, mime_type, speaker_label, speaker_consent, license, source, review_status, uploaded_by)
      values (${input.language}, ${key}, 'audio/webm', 'Community contributor', true, 'CC BY-SA 4.0 (contributor consent recorded)',
              'Over Sabi contribution', 'in_review', ${user.id})
      returning id`;
    audioAssetId = asset!.id;
  }
  const [row] = await withUser(
    user.id,
    (tx) => tx`
    insert into content_contributions (contributor_id, language_code, kind, target_entity_type, target_entity_id, payload, audio_asset_id)
    values (${user.id}, ${input.language}, ${input.kind}, ${input.targetVocabId ? "vocabulary" : null}, ${input.targetVocabId ?? null},
            ${tx.json({ text: input.text, translation: input.translation, dialect: input.dialect, notes: input.notes })}, ${audioAssetId})
    returning id`,
  );
  return json({ ok: true, id: row!.id }, { status: 201 });
});
