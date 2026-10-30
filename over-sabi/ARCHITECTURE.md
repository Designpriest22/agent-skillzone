# Architecture

## Overview

```
Browser (React 19, mobile-first, PWA service worker)
   │  fetch JSON / FormData (same-origin, cookie session)
   ▼
Next.js 16 App Router (Node runtime)
   ├─ Server Components: pages read data directly (no client data-fetching layer)
   ├─ Route handlers /api/*: validated with Zod, wrapped by `handler()` for uniform errors
   ├─ Services (src/lib/services): lessons, tutor, auth, account, admin, cron
   ├─ Provider abstractions: ai/ (chat), speech/ (STT/TTS), payments/, mailer, storage
   └─ db.ts ── postgres.js ──► PostgreSQL (local or Supabase)
                                 ├─ row-level security for learner data
                                 └─ `oversabi_app` role used via SET LOCAL ROLE
External (optional): Anthropic · OpenAI / ElevenLabs · Paystack · Resend · Google OAuth · Supabase Storage
```

## Key decisions

### 1. One Postgres connection, RLS via `SET LOCAL ROLE`
The brief recommends Supabase with row-level security. Supabase RLS normally keys off a Supabase Auth JWT. We use our own auth (below), so instead:

- Migration `0002` creates a `NOLOGIN` role `oversabi_app` with no `BYPASSRLS`, and grants the connecting role membership.
- `withUser(userId, fn)` opens a transaction, runs `SET LOCAL ROLE oversabi_app` and `set_config('app.user_id', userId, true)`, then runs `fn`.
- Policies on every learner-owned table are `user_id = app_uid()`. `lesson_activities.answer` is column-revoked from the role. `subscriptions` and `usage_counters` are read-only to it, so entitlements can't be changed by learner-context code.

Why: it works identically on local Postgres, Supabase, Neon or RDS; needs one `DATABASE_URL`; and is enforced by the database, so a forgotten `WHERE` can't leak another learner's data. Integration tests (`tests/integration/rls.test.ts`) prove isolation. Privileged code (auth, webhooks, cron, admin after a role check) uses the owner connection and is audited.

### 2. Own authentication instead of Supabase Auth
Email/password (scrypt, OWASP parameters), opaque session tokens (SHA-256 hashed at rest, HttpOnly/SameSite=Lax cookies, 30 days), email verification and password reset with single-use hashed tokens, Google OAuth (authorization code + PKCE + state). Keeping auth in-app avoids coupling RLS to a vendor JWT and lets everything run against plain Postgres in development and CI. Migrating to Supabase Auth later is possible: replace `session.ts` and set `app.user_id` from the JWT `sub`.

### 3. Content as reviewed data, not code
Curriculum is authored in `content/curriculum/*.ts` (reviewable in PRs), seeded into tables, then managed in the admin. Every vocabulary item, lesson and cultural note has `review_status`, reviewer, timestamps, version and source. Activities store `payload` (sent to the browser) separately from `answer` (never leaves the server). Grading is a pure function (`src/lib/content/validate.ts`).

### 4. Language-aware answer checking
`normalize.ts` NFC-normalises (keyboards produce both composed and combining forms), keeps Hausa apostrophes, and offers a *loose* comparison that strips tone marks/under-dots and maps hooked letters (ɓ ɗ ƙ ƴ). A loose-only match is a **near miss** (half credit, specific feedback) — never "correct", because tone changes meaning.

### 5. AI tutor provider abstraction
`ChatProvider` (`src/lib/ai/types.ts`) with one production implementation, `AnthropicChatProvider`:
- Structured outputs (`betaZodOutputFormat`) give each turn `reply`, `translation`, `corrections[]`, `newVocabulary[]`, `uncertainty`.
- Model `claude-opus-5-5` by default (`TUTOR_MODEL`), effort `low` for conversational latency (`TUTOR_EFFORT`).
- Server-side refusal fallback (`fallbacks: "default"`, beta `server-side-fallback-2026-07-01`) so a classifier decline is retried on the recommended fallback model.
- **Append-only history**: each tutor turn's full returned `content` (including thinking blocks) is stored in `conversation_turns.meta.raw` and replayed unchanged, as the API requires for preserved thinking. A failed turn's learner message is rolled back so user/assistant alternation stays valid.
- Prompt caching via top-level `cache_control`. The system prompt is stable per session.
- The system prompt grounds the tutor in the learner's curated vocabulary (with review status), orthography and register notes, and instructs it never to invent idioms or cultural rules and never to claim to judge pronunciation (it only sees text).

Adding another chat provider = implement `ChatProvider` and select it in `ai/index.ts`.

### 6. Speech: vendor claims vs our validation
`SpeechProvider` declares the languages the **vendor documents** (`vendorSttLanguages` / `vendorTtsLanguages`). `languages.stt_status/tts_status` records **Over Sabi's validation** (`unsupported | untested | experimental | validated`). `speechCapability()` combines them:

| Vendor lists language | Our status | Learner sees |
| --- | --- | --- |
| no | untested | unavailable |
| yes | untested / experimental | experimental — transcription goes into the text box to confirm before sending |
| any | validated | available — transcription sent directly |
| any | unsupported | unavailable |

Implemented: OpenAI (STT `gpt-4o-transcribe`, TTS `gpt-4o-mini-tts`) and ElevenLabs (Scribe STT, TTS). Neither claims Nigerian-language TTS by default. Audio is streamed to the provider and not stored. Spitch (a Nigerian speech vendor) is a recommended evaluation candidate but was **not** implemented because its API couldn't be verified from this environment.

### 7. Live voice: turn-based, low latency, honest
The speaking room uses `MediaRecorder` + a client-side energy VAD (auto-stop after 1.5 s of silence, 30 s cap), uploads the clip for transcription, then sends text to the tutor and optionally plays synthesised audio. Barge-in: starting to talk stops tutor audio. States (listening / transcribing / thinking / speaking / your turn) are always visible and announced to screen readers. A realtime speech-to-speech pipeline (WebRTC) was not chosen because no realtime provider has documented, tested support for Yoruba/Igbo/Hausa; the provider layer leaves room for it.

### 8. Payments
`plans` (features + limits, JSON) and `plan_prices` (provider plan codes, currency, amount) live in the database — no prices in code. Paystack: `transaction/initialize` with a plan code → hosted checkout → **webhook is the only source of truth** (HMAC-SHA512 on the raw body, constant-time compare, idempotent by `(provider, event_key)`). The return page never marks anything paid. Entitlements are resolved server-side from `subscriptions`; usage is metered atomically in `usage_counters`. Manual grants (institutions, support) are audited admin actions.

### 9. Admin
A single endpoint (`POST /api/admin`) dispatches named actions, each declaring its minimum role (`reviewer < editor < admin`), a Zod schema and a transactional handler; every action writes `audit_events`. The admin layout and each page also check roles server-side — hiding links is not the security boundary.

### 10. Low bandwidth
Self-hosted variable fonts (subset by unicode-range, no third-party requests), mostly server-rendered pages, small client islands, compressed PNG screenshots, a service worker that caches static assets cache-first and learning pages network-first with offline fallback. AI and speech are explicitly online-only.

### 11. Analytics and quality
First-party `analytics_events` (no IPs, no message text, opt-out respected) and `provider_events` (latency, failures per provider/capability/language). The admin overview separates engagement from evidence of learning (revision retention) and shows per-language readiness.

## Data model (summary)

Identity: `users`, `profiles`, `oauth_accounts`, `auth_sessions`, `auth_tokens`.
Registry: `languages`, `dialects`.
Curriculum: `courses` → `chapters` → `lessons` → `lesson_activities`; `vocabulary` (words/phrases/sentences with examples, register, review metadata), `lesson_vocabulary`, `audio_assets`, `cultural_notes`.
Workflow: `content_contributions`, `content_reviews`, `content_versions`, `content_reports`.
Tutors: `tutors`. Learner: `learning_plans` (tutor + settings), `lesson_progress`, `activity_attempts`, `user_vocabulary` (SRS state; curated or custom unverified phrases).
Conversation: `learning_sessions`, `conversation_turns` (+ `session_transcripts` view), `feedback_items`.
Engagement: `xp_events`, `streaks`, `achievements`, `user_achievements`, `notifications`.
Commerce: `plans`, `plan_prices`, `subscriptions`, `payment_events`, `usage_counters`.
Ops: `analytics_events`, `provider_events`, `audit_events`, `feature_flags`, `support_requests`, `rate_limits`.

All tables have primary keys, foreign keys with deliberate `ON DELETE` behaviour (cascade for learner data, set null for shared content), check constraints for enumerations, and indexes on hot paths.

## Request lifecycle example — a tutor turn

1. Browser `POST /api/tutor/sessions/:id/turns` `{ text, inputMode }`.
2. `handler()` → `requireApiUser()` → Origin check → rate limit (40/min) → Zod.
3. `sendTurn`: load session under RLS → check time budget → `consumeUsage(ai_turns)` atomically against the plan limit → build context (persona, settings, learner level, curated vocabulary) → persist learner turn → call provider → on failure roll back and record `provider_events` → persist tutor turn (+ raw content) and `feedback_items` → return both turns.
4. Browser renders reply, corrections, new vocabulary; requests TTS if available and not muted.

## Directory layout

```
src/app/(site)      public pages        src/app/(app)    signed-in app shell
src/app/(focus)     onboarding, lesson player, speaking room (no chrome)
src/app/admin       admin               src/app/api      route handlers
src/components      UI (brand, ui, lesson, speak, app, admin, site)
src/lib             env, db, http, auth, content, ai, speech, payments, services
```
