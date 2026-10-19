import "server-only";
import { chatProvider } from "../ai";
import type { TutorContext } from "../ai/prompts";
import { tutorSettingsSchema, type SessionSummary, type TutorSettings, type TutorTurn } from "../ai/schemas";
import { TutorDeclinedError, type HistoryTurn } from "../ai/types";
import { recordProviderEvent, track } from "../analytics";
import { db, withUser } from "../db";
import { consumeUsage, getEntitlement } from "../entitlements";
import { env } from "../env";
import { HttpError } from "../http";
import { awardXp } from "../progress";

/** Hidden opening message: lets the tutor greet first without a fake learner line. */
const SESSION_OPENER =
  "[The learner has just opened a practice session. Greet them in character, briefly, and ask a first easy question.]";

/** Grace period after the chosen session length before turns are refused. */
const GRACE_MINUTES = 2;

export interface StartSessionInput {
  languageCode: string;
  tutorId: string;
  settings: Partial<TutorSettings>;
}

async function loadContext(
  userId: string,
  languageCode: string,
  tutorId: string,
  settings: TutorSettings,
): Promise<TutorContext> {
  const [lang] = await db()`
    select code, name, native_name, orthography_notes, register_notes, dialect_notes, tutor_status
    from languages where code = ${languageCode}`;
  if (!lang) throw new HttpError(404, "Language not found.", "not_found");
  if (lang.tutor_status === "unavailable") {
    throw new HttpError(
      409,
      `AI tutor practice isn't available for ${lang.name} yet.`,
      "language_unavailable",
    );
  }
  const [tutor] = await db()`
    select id, name, persona, tagline, teaching_approach, correction_style, specialties
    from tutors where id = ${tutorId} and language_code = ${languageCode} and status = 'active'`;
  if (!tutor) throw new HttpError(404, "That tutor doesn't teach this language.", "not_found");

  return withUser(userId, async (tx) => {
    const [u] = await tx`
      select u.display_name, p.explanation_language, lp.level, lp.goals
      from users u join profiles p on p.user_id = u.id
      left join learning_plans lp on lp.user_id = u.id and lp.language_code = ${languageCode}
      where u.id = ${userId}`;
    const vocab = await tx`
      select v.text, v.translation, v.review_status from user_vocabulary uv join vocabulary v on v.id = uv.vocab_id
      where uv.user_id = ${userId} and v.language_code = ${languageCode} and v.review_status <> 'rejected'
      order by uv.created_at desc limit 60`;
    return {
      language: {
        code: lang.code,
        name: lang.name,
        native_name: lang.native_name,
        orthography_notes: lang.orthography_notes,
        register_notes: lang.register_notes,
        dialect_notes: lang.dialect_notes,
      },
      tutor: tutor as unknown as TutorContext["tutor"],
      learner: {
        displayName: u?.display_name ?? "",
        level: u?.level ?? "beginner",
        goals: u?.goals ?? [],
        explanationLanguage: u?.explanation_language ?? "en",
      },
      settings,
      knownVocab: vocab.map((v) => ({
        text: v.text,
        translation: v.translation,
        reviewStatus: v.review_status,
      })),
    };
  });
}

function requireProvider() {
  const provider = chatProvider();
  if (!provider) {
    throw new HttpError(
      503,
      "The AI tutor isn't connected on this server yet. You can still practise with guided dialogues.",
      "tutor_unavailable",
    );
  }
  return provider;
}

async function runTurn(ctx: TutorContext, history: HistoryTurn[], text: string) {
  const provider = requireProvider();
  const started = Date.now();
  try {
    const result = await provider.tutorTurn(ctx, history, text);
    await recordProviderEvent({
      provider: result.provider,
      capability: "chat",
      language: ctx.language.code,
      ok: true,
      latencyMs: Date.now() - started,
    });
    return result;
  } catch (err) {
    await recordProviderEvent({
      provider: provider.id,
      capability: "chat",
      language: ctx.language.code,
      ok: false,
      latencyMs: Date.now() - started,
      error: err instanceof Error ? err.message : String(err),
    });
    if (err instanceof TutorDeclinedError) {
      throw new HttpError(
        422,
        "The tutor can't respond to that. Try saying it another way.",
        "tutor_declined",
      );
    }
    throw new HttpError(
      502,
      "The tutor didn't respond. Your message wasn't lost — it's still in the box. Try sending it again.",
      "tutor_failed",
    );
  }
}

export interface PublicTurn {
  id: string;
  seq: number;
  role: "learner" | "tutor";
  text: string;
  translation: string | null;
  inputMode: "voice" | "text";
  corrections: TutorTurn["corrections"];
  newVocabulary: TutorTurn["newVocabulary"];
  uncertainty: string | null;
  createdAt: string;
}

export async function startSession(userId: string, input: StartSessionInput) {
  const entitlement = await getEntitlement(userId);
  const settings = tutorSettingsSchema.parse(input.settings);
  if (settings.sessionMinutes > entitlement.limits.max_session_minutes) {
    settings.sessionMinutes = entitlement.limits.max_session_minutes as TutorSettings["sessionMinutes"];
  }
  const ctx = await loadContext(userId, input.languageCode, input.tutorId, settings);
  const provider = requireProvider();
  await consumeUsage(userId, "ai_turns", 1, entitlement.limits);
  await consumeUsage(userId, "sessions", 1, entitlement.limits);

  const result = await runTurn(ctx, [], SESSION_OPENER);
  const retention = env().TRANSCRIPT_RETENTION_DAYS;

  const sessionId = await withUser(userId, async (tx) => {
    const [s] = await tx`
      insert into learning_sessions (user_id, language_code, tutor_id, mode, settings, provider_info, transcript_expires_at)
      values (${userId}, ${input.languageCode}, ${input.tutorId}, 'text', ${tx.json(settings)},
              ${tx.json({ chat: provider.id, model: result.model })}, now() + ${`${retention} days`}::interval)
      returning id`;
    await tx`insert into conversation_turns (session_id, user_id, seq, role, text, meta)
             values (${s!.id}, ${userId}, 0, 'learner', ${SESSION_OPENER}, ${tx.json({ hidden: true })})`;
    await insertTutorTurn(tx, userId, s!.id, 1, result.turn, result.raw);
    await tx`update learning_sessions set turn_count = 1 where id = ${s!.id}`;
    return s!.id as string;
  });

  await track("speaking_session_started", {
    userId,
    language: input.languageCode,
    props: { tutor: input.tutorId },
  });
  return { sessionId, settings, turns: await getTranscript(userId, sessionId) };
}

async function insertTutorTurn(
  tx: Parameters<Parameters<typeof withUser>[1]>[0],
  userId: string,
  sessionId: string,
  seq: number,
  turn: TutorTurn,
  raw: unknown,
) {
  const [row] = await tx`
    insert into conversation_turns (session_id, user_id, seq, role, text, translation, meta)
    values (${sessionId}, ${userId}, ${seq}, 'tutor', ${turn.reply}, ${turn.translation},
            ${tx.json({ raw, corrections: turn.corrections, newVocabulary: turn.newVocabulary, uncertainty: turn.uncertainty } as never)})
    returning id`;
  return row!.id as string;
}

export async function sendTurn(
  userId: string,
  sessionId: string,
  input: { text: string; inputMode: "voice" | "text"; sttProvider?: string },
): Promise<{ learner: PublicTurn; tutor: PublicTurn; endsAt: string }> {
  const session = await withUser(userId, async (tx) => {
    const [s] = await tx`
      select id, language_code, tutor_id, settings, status, started_at from learning_sessions where id = ${sessionId}`;
    return s;
  });
  if (!session) throw new HttpError(404, "Session not found.", "not_found");
  if (session.status !== "active")
    throw new HttpError(409, "This session has ended. Start a new one to keep practising.", "session_ended");
  const settings = tutorSettingsSchema.parse(session.settings);
  const endsAt = new Date(new Date(session.started_at).getTime() + settings.sessionMinutes * 60_000);
  if (Date.now() > endsAt.getTime() + GRACE_MINUTES * 60_000) {
    throw new HttpError(409, "Time's up for this session. End it to see your summary.", "session_time_up");
  }

  const entitlement = await getEntitlement(userId);
  await consumeUsage(userId, "ai_turns", 1, entitlement.limits);
  const ctx = await loadContext(userId, session.language_code, session.tutor_id, settings);

  const prior = await withUser(
    userId,
    (tx) => tx`
    select seq, role, text, meta from conversation_turns where session_id = ${sessionId} order by seq`,
  );
  const history: HistoryTurn[] = prior.map((t) => ({ role: t.role, text: t.text, raw: t.meta?.raw }));
  const nextSeq = (prior.at(-1)?.seq ?? -1) + 1;

  // Persist the learner's words before calling the model, so nothing is lost if it fails.
  const learnerId = await withUser(userId, async (tx) => {
    const [row] = await tx`
      insert into conversation_turns (session_id, user_id, seq, role, text, input_mode, stt_provider)
      values (${sessionId}, ${userId}, ${nextSeq}, 'learner', ${input.text}, ${input.inputMode}, ${input.sttProvider ?? null})
      returning id`;
    return row!.id as string;
  });

  let result;
  try {
    result = await runTurn(ctx, history, input.text);
  } catch (err) {
    // Roll back the learner turn so the history stays valid (user/assistant alternation).
    await withUser(userId, (tx) => tx`delete from conversation_turns where id = ${learnerId}`);
    throw err;
  }

  const tutorId = await withUser(userId, async (tx) => {
    const id = await insertTutorTurn(tx, userId, sessionId, nextSeq + 1, result.turn, result.raw);
    for (const c of result.turn.corrections) {
      await tx`
        insert into feedback_items (session_id, turn_id, user_id, type, original, corrected, explanation)
        values (${sessionId}, ${learnerId}, ${userId}, ${c.type}, ${c.original}, ${c.corrected}, ${c.explanation})`;
    }
    await tx`
      update learning_sessions set turn_count = turn_count + 1,
        duration_seconds = least(extract(epoch from now() - started_at)::int, ${settings.sessionMinutes * 60 + GRACE_MINUTES * 60})
      where id = ${sessionId}`;
    return id;
  });

  const transcript = await getTranscript(userId, sessionId);
  return {
    learner: transcript.find((t) => t.id === learnerId)!,
    tutor: transcript.find((t) => t.id === tutorId)!,
    endsAt: endsAt.toISOString(),
  };
}

export async function getTranscript(userId: string, sessionId: string): Promise<PublicTurn[]> {
  const rows = await withUser(
    userId,
    (tx) => tx`
    select id, seq, role, text, translation, input_mode, meta, created_at
    from conversation_turns where session_id = ${sessionId} order by seq`,
  );
  return rows
    .filter((r) => !r.meta?.hidden)
    .map((r) => ({
      id: r.id,
      seq: r.seq,
      role: r.role,
      text: r.text,
      translation: r.translation,
      inputMode: r.input_mode,
      corrections: r.meta?.corrections ?? [],
      newVocabulary: r.meta?.newVocabulary ?? [],
      uncertainty: r.meta?.uncertainty ?? null,
      createdAt: new Date(r.created_at).toISOString(),
    }));
}

export async function endSession(
  userId: string,
  sessionId: string,
): Promise<{ summary: SessionSummary | null; xpEarned: number; newAchievements: string[] }> {
  const session = await withUser(userId, async (tx) => {
    const [s] =
      await tx`select id, language_code, tutor_id, settings, status, summary, started_at from learning_sessions where id = ${sessionId}`;
    return s;
  });
  if (!session) throw new HttpError(404, "Session not found.", "not_found");
  if (session.status === "ended") return { summary: session.summary, xpEarned: 0, newAchievements: [] };

  const transcript = await getTranscript(userId, sessionId);
  const learnerTurns = transcript.filter((t) => t.role === "learner").length;
  let summary: SessionSummary | null = null;
  if (learnerTurns > 0 && chatProvider()) {
    const settings = tutorSettingsSchema.parse(session.settings);
    const ctx = await loadContext(userId, session.language_code, session.tutor_id, settings);
    try {
      summary = await chatProvider()!.summarize(
        ctx,
        transcript.map((t) => ({ role: t.role, text: t.text })),
      );
    } catch (err) {
      await recordProviderEvent({
        provider: chatProvider()!.id,
        capability: "chat",
        language: session.language_code,
        ok: false,
        error: String(err),
      });
    }
  }

  const { xp, newAchievements } = await withUser(userId, async (tx) => {
    await tx`
      update learning_sessions set status = 'ended', ended_at = now(), summary = ${summary ? tx.json(summary) : null},
        duration_seconds = least(extract(epoch from now() - started_at)::int, 3600)
      where id = ${sessionId}`;
    const xp = learnerTurns > 0 ? 10 + Math.min(learnerTurns, 10) * 2 : 0;
    const newAchievements = learnerTurns > 0 ? await awardXp(tx, userId, xp, "conversation", sessionId) : [];
    return { xp, newAchievements };
  });

  if (learnerTurns > 0) {
    await track("speaking_session_completed", {
      userId,
      language: session.language_code,
      props: { turns: learnerTurns },
    });
    const [{ n }] =
      (await db()`select count(*)::int as n from learning_sessions where user_id = ${userId} and status = 'ended' and turn_count > 1`) as unknown as [
        { n: number },
      ];
    if (n === 1) await track("first_speaking_session", { userId, language: session.language_code });
  }
  return { summary, xpEarned: xp, newAchievements };
}
