import "server-only";
import { z } from "zod";
import { audit } from "../audit";
import { hasRole, type Role, type SessionUser } from "../auth/session";
import { db, type Tx } from "../db";
import { HttpError } from "../http";
import { checkAchievements } from "../progress";

/**
 * Every admin mutation goes through this dispatcher: each action declares the minimum
 * role, validates input with Zod, runs in a transaction and writes an audit event.
 * Hiding UI links is never the security boundary — this is.
 */
const REVIEW_STATUS = z.enum([
  "editorial_draft",
  "in_review",
  "verified",
  "disputed",
  "rejected",
  "ai_draft",
]);
const uuid = z.string().uuid();

const actions = {
  review_content: {
    role: "reviewer" as Role,
    schema: z.object({
      entityType: z.enum(["vocabulary", "lesson", "cultural_note", "audio_asset"]),
      entityId: uuid,
      decision: z.enum(["approve", "reject", "request_changes", "dispute"]),
      notes: z.string().max(2000).default(""),
    }),
    async run(
      tx: Tx,
      actor: SessionUser,
      i: {
        entityType: "vocabulary" | "lesson" | "cultural_note" | "audio_asset";
        entityId: string;
        decision: string;
        notes: string;
      },
    ) {
      const table = {
        vocabulary: "vocabulary",
        lesson: "lessons",
        cultural_note: "cultural_notes",
        audio_asset: "audio_assets",
      }[i.entityType];
      const status =
        i.entityType === "audio_asset"
          ? { approve: "verified", reject: "rejected", request_changes: "in_review", dispute: "in_review" }[
              i.decision
            ]
          : {
              approve: "verified",
              reject: "rejected",
              request_changes: "editorial_draft",
              dispute: "disputed",
            }[i.decision];
      const [before] = await tx`select * from ${tx(table)} where id = ${i.entityId}`;
      if (!before) throw new HttpError(404, "Item not found.", "not_found");
      if (i.decision === "dispute" && !i.notes)
        throw new HttpError(400, "Explain what's disputed so others can weigh in.", "notes_required");
      const sets: Record<string, unknown> = { review_status: status };
      if (i.entityType === "vocabulary" || i.entityType === "cultural_note") {
        sets.reviewed_by = actor.id;
        sets.reviewed_at = new Date();
      }
      await tx`update ${tx(table)} set ${tx(sets)} where id = ${i.entityId}`;
      await tx`insert into content_reviews (entity_type, entity_id, reviewer_id, decision, notes)
               values (${i.entityType}, ${i.entityId}, ${actor.id}, ${i.decision}, ${i.notes})`;
      if (i.entityType === "audio_asset" && i.decision === "approve" && before.uploaded_by) {
        // Attach approved pronunciation to its vocabulary item, if the contribution named one.
        const [c] =
          await tx`select target_entity_id from content_contributions where audio_asset_id = ${i.entityId} and target_entity_type = 'vocabulary'`;
        if (c?.target_entity_id)
          await tx`update vocabulary set audio_asset_id = ${i.entityId} where id = ${c.target_entity_id}`;
      }
      return { status };
    },
  },
  review_contribution: {
    role: "reviewer" as Role,
    schema: z.object({
      id: uuid,
      decision: z.enum(["accepted", "rejected"]),
      notes: z.string().max(2000).default(""),
    }),
    async run(
      tx: Tx,
      actor: SessionUser,
      i: { id: string; decision: "accepted" | "rejected"; notes: string },
    ) {
      const [c] = await tx`select * from content_contributions where id = ${i.id}`;
      if (!c) throw new HttpError(404, "Contribution not found.", "not_found");
      await tx`update content_contributions set status = ${i.decision}, reviewer_id = ${actor.id}, review_notes = ${i.notes}, reviewed_at = now() where id = ${i.id}`;
      await tx`insert into content_reviews (entity_type, entity_id, reviewer_id, decision, notes)
               values ('contribution', ${i.id}, ${actor.id}, ${i.decision === "accepted" ? "approve" : "reject"}, ${i.notes})`;
      let createdVocabId: string | null = null;
      if (
        i.decision === "accepted" &&
        c.kind === "new_vocabulary" &&
        c.payload.text &&
        c.payload.translation
      ) {
        // Accepted words enter the catalogue as "in_review": a second reviewer verifies them.
        const [v] = await tx`
          insert into vocabulary (language_code, source_language_code, kind, text, translation, context_note, topic, source, contributor_id, review_status, confidence)
          values (${c.language_code}, 'en', ${String(c.payload.text).includes(" ") ? "phrase" : "word"}, ${c.payload.text}, ${c.payload.translation},
                  ${[c.payload.dialect && `Dialect: ${c.payload.dialect}`, c.payload.notes].filter(Boolean).join(". ")}, 'community',
                  'Community contribution', ${c.contributor_id}, 'in_review', 'medium')
          on conflict (language_code, source_language_code, text, translation) do update set updated_at = now()
          returning id`;
        createdVocabId = v!.id;
      }
      if (i.decision === "accepted" && c.contributor_id) {
        await tx`insert into notifications (user_id, kind, title, body, link)
                 values (${c.contributor_id}, 'contribution', 'Your contribution was accepted', 'Thank you for helping build the course.', '/contribute')`;
        await tx`set local role oversabi_app`;
        await tx`select set_config('app.user_id', ${c.contributor_id}, true)`;
        await checkAchievements(tx, c.contributor_id);
        await tx`reset role`;
      }
      return { createdVocabId };
    },
  },
  update_vocabulary: {
    role: "editor" as Role,
    schema: z.object({
      id: uuid,
      text: z.string().trim().min(1).max(300),
      translation: z.string().trim().min(1).max(300),
      literal_meaning: z.string().max(300).default(""),
      context_note: z.string().max(1000).default(""),
      register: z.enum(["neutral", "formal", "informal", "respectful", "intimate"]),
      confidence: z.enum(["low", "medium", "high"]),
    }),
    async run(
      tx: Tx,
      actor: SessionUser,
      i: {
        id: string;
        text: string;
        translation: string;
        literal_meaning: string;
        context_note: string;
        register: string;
        confidence: string;
      },
    ) {
      const [before] = await tx`select * from vocabulary where id = ${i.id}`;
      if (!before) throw new HttpError(404, "Not found.", "not_found");
      await tx`insert into content_versions (entity_type, entity_id, version, snapshot, created_by)
               values ('vocabulary', ${i.id}, ${before.version}, ${tx.json(before as never)}, ${actor.id})
               on conflict do nothing`;
      // Any edit sends the item back for review: a changed translation is no longer the reviewed one.
      await tx`update vocabulary set text = ${i.text}, translation = ${i.translation}, literal_meaning = ${i.literal_meaning},
                 context_note = ${i.context_note}, register = ${i.register}, confidence = ${i.confidence},
                 version = version + 1, review_status = 'in_review', updated_at = now()
               where id = ${i.id}`;
      return { version: before.version + 1 };
    },
  },
  set_lesson_status: {
    role: "editor" as Role,
    schema: z.object({ id: uuid, status: z.enum(["draft", "published", "archived"]) }),
    async run(tx: Tx, _a: SessionUser, i: { id: string; status: string }) {
      const r = await tx`update lessons set status = ${i.status}, updated_at = now() where id = ${i.id}`;
      if (!r.count) throw new HttpError(404, "Lesson not found.", "not_found");
      return {};
    },
  },
  set_review_status: {
    role: "editor" as Role,
    schema: z.object({
      entityType: z.enum(["vocabulary", "lesson", "cultural_note"]),
      id: uuid,
      status: REVIEW_STATUS,
    }),
    async run(tx: Tx, _a: SessionUser, i: { entityType: string; id: string; status: string }) {
      const table = { vocabulary: "vocabulary", lesson: "lessons", cultural_note: "cultural_notes" }[
        i.entityType
      ]!;
      await tx`update ${tx(table)} set review_status = ${i.status} where id = ${i.id}`;
      return {};
    },
  },
  update_language: {
    role: "editor" as Role,
    schema: z.object({
      code: z.string().max(20),
      catalogue_status: z.enum(["roadmap", "in_development", "beta", "available"]),
      content_status: z.enum(["none", "draft", "in_review", "verified"]),
      stt_status: z.enum(["unsupported", "untested", "experimental", "validated"]),
      tts_status: z.enum(["unsupported", "untested", "experimental", "validated"]),
      tutor_status: z.enum(["unavailable", "experimental", "validated"]),
      human_reviewer_status: z.enum(["none", "recruiting", "active"]),
      limitations: z.string().max(2000),
      speech_notes: z.string().max(4000),
    }),
    async run(tx: Tx, _a: SessionUser, i: Record<string, string>) {
      const { code, ...rest } = i;
      if (rest.catalogue_status === "available" && rest.content_status !== "verified") {
        throw new HttpError(
          400,
          "A language can only be marked available once its content is verified.",
          "not_verified",
        );
      }
      const r = await tx`update languages set ${tx(rest)}, updated_at = now() where code = ${code!}`;
      if (!r.count) throw new HttpError(404, "Language not found.", "not_found");
      return {};
    },
  },
  update_tutor: {
    role: "editor" as Role,
    schema: z.object({
      id: z.string().max(40),
      tagline: z.string().max(200),
      bio: z.string().max(1000),
      teaching_approach: z.string().max(500),
      correction_style: z.string().max(500),
      default_speed: z.coerce.number().min(0.5).max(1.5),
      status: z.enum(["active", "hidden"]),
      voice_id: z.string().max(120).default(""),
    }),
    async run(tx: Tx, _a: SessionUser, i: { id: string; voice_id: string } & Record<string, unknown>) {
      const { id, voice_id, ...rest } = i;
      await tx`update tutors set ${tx(rest as never)}, voice = ${tx.json(voice_id ? { default: voice_id } : {})}, updated_at = now() where id = ${id}`;
      return {};
    },
  },
  resolve_report: {
    role: "reviewer" as Role,
    schema: z.object({ id: uuid, status: z.enum(["resolved", "dismissed"]) }),
    async run(tx: Tx, actor: SessionUser, i: { id: string; status: string }) {
      await tx`update content_reports set status = ${i.status}, resolved_by = ${actor.id}, resolved_at = now() where id = ${i.id}`;
      return {};
    },
  },
  set_user_role: {
    role: "admin" as Role,
    schema: z.object({
      userId: uuid,
      role: z.enum(["learner", "contributor", "reviewer", "editor", "admin"]),
    }),
    async run(tx: Tx, actor: SessionUser, i: { userId: string; role: string }) {
      if (i.userId === actor.id && i.role !== "admin")
        throw new HttpError(400, "You can't remove your own admin role.", "self_demote");
      const r = await tx`update users set role = ${i.role}, updated_at = now() where id = ${i.userId}`;
      if (!r.count) throw new HttpError(404, "User not found.", "not_found");
      return {};
    },
  },
  grant_plan: {
    role: "admin" as Role,
    schema: z.object({
      userId: uuid,
      planCode: z.string().max(40),
      days: z.coerce.number().int().min(1).max(3660),
      reason: z.string().min(3).max(500),
    }),
    async run(tx: Tx, _a: SessionUser, i: { userId: string; planCode: string; days: number }) {
      const [p] = await tx`select 1 from plans where code = ${i.planCode}`;
      if (!p) throw new HttpError(400, "Unknown plan.", "bad_plan");
      await tx`insert into subscriptions (user_id, plan_code, provider, status, current_period_end)
               values (${i.userId}, ${i.planCode}, 'manual', 'active', now() + ${`${i.days} days`}::interval)`;
      return {};
    },
  },
  revoke_manual_plans: {
    role: "admin" as Role,
    schema: z.object({ userId: uuid }),
    async run(tx: Tx, _a: SessionUser, i: { userId: string }) {
      await tx`update subscriptions set status = 'cancelled', updated_at = now() where user_id = ${i.userId} and provider = 'manual' and status = 'active'`;
      return {};
    },
  },
  update_plan: {
    role: "admin" as Role,
    schema: z.object({
      code: z.string().max(40),
      daily_ai_turns: z.coerce.number().int().min(0).max(10000),
      max_session_minutes: z.coerce.number().int().min(5).max(60),
      daily_tts_chars: z.coerce.number().int().min(0).max(1_000_000),
      daily_stt_seconds: z.coerce.number().int().min(0).max(86_400),
      is_available: z.boolean(),
    }),
    async run(tx: Tx, _a: SessionUser, i: { code: string; is_available: boolean } & Record<string, number>) {
      const { code, is_available, ...limits } = i;
      await tx`update plans set limits = limits || ${tx.json(limits)}, is_available = ${is_available} where code = ${code}`;
      return {};
    },
  },
  add_price: {
    role: "admin" as Role,
    schema: z.object({
      planCode: z.string().max(40),
      currency: z.string().regex(/^[A-Z]{3}$/),
      amountMinor: z.coerce.number().int().positive(),
      interval: z.enum(["monthly", "annually"]),
      providerPlanCode: z.string().min(3).max(120),
    }),
    async run(
      tx: Tx,
      _a: SessionUser,
      i: {
        planCode: string;
        currency: string;
        amountMinor: number;
        interval: string;
        providerPlanCode: string;
      },
    ) {
      await tx`insert into plan_prices (plan_code, provider, currency, amount_minor, billing_interval, provider_plan_code)
               values (${i.planCode}, 'paystack', ${i.currency}, ${i.amountMinor}, ${i.interval}, ${i.providerPlanCode})`;
      return {};
    },
  },
  deactivate_price: {
    role: "admin" as Role,
    schema: z.object({ id: uuid }),
    async run(tx: Tx, _a: SessionUser, i: { id: string }) {
      await tx`update plan_prices set active = false where id = ${i.id}`;
      return {};
    },
  },
  set_flag: {
    role: "admin" as Role,
    schema: z.object({ key: z.string().max(60), enabled: z.boolean() }),
    async run(tx: Tx, actor: SessionUser, i: { key: string; enabled: boolean }) {
      await tx`update feature_flags set enabled = ${i.enabled}, updated_by = ${actor.id}, updated_at = now() where key = ${i.key}`;
      return {};
    },
  },
  set_support_status: {
    role: "admin" as Role,
    schema: z.object({ id: uuid, status: z.enum(["open", "answered", "closed"]) }),
    async run(tx: Tx, _a: SessionUser, i: { id: string; status: string }) {
      await tx`update support_requests set status = ${i.status} where id = ${i.id}`;
      return {};
    },
  },
} as const;

export type AdminAction = keyof typeof actions;
export const ADMIN_ACTIONS = Object.keys(actions) as AdminAction[];

export function minimumRoleFor(action: AdminAction): Role {
  return actions[action].role;
}

export async function runAdminAction(actor: SessionUser, action: string, input: unknown) {
  if (!(action in actions)) throw new HttpError(400, "Unknown action.", "bad_action");
  const def = actions[action as AdminAction];
  if (!hasRole(actor, def.role))
    throw new HttpError(403, "Your role doesn't allow this action.", "forbidden");
  const parsed = def.schema.parse(input);
  return db().begin(async (tx) => {
    const result = await (def.run as (tx: Tx, a: SessionUser, i: unknown) => Promise<unknown>)(
      tx,
      actor,
      parsed,
    );
    const p = parsed as Record<string, unknown>;
    const entityId = String(p.id ?? p.entityId ?? p.userId ?? p.code ?? p.key ?? p.planCode ?? "");
    await audit(actor.id, `admin.${action}`, action, entityId || null, p, tx);
    return result;
  });
}
