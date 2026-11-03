# Security and privacy

## Threat model in brief
Assets: learner accounts, conversation transcripts and voice, progress, payment entitlements, the curriculum's integrity, admin powers, provider API keys.

## Controls

### Authentication & sessions
- Passwords: scrypt (N=2^15, r=8, p=1, 64-byte key, per-user salt), constant-time compare; equal work for unknown emails to avoid account enumeration by timing; identical error for wrong email or password.
- Sessions: 256-bit random tokens, stored as SHA-256 hashes; cookie `os_session` is HttpOnly, SameSite=Lax, Secure in production, 30-day expiry. Password reset revokes all sessions.
- Email verification & reset tokens: single-use, hashed, 2-day / 1-hour expiry. Reset requests always return the same response.
- Google OAuth: authorization code with PKCE (S256) and `state`, both in short-lived HttpOnly cookies; only verified Google emails can create or link accounts.
- First admin is created from the CLI (`npm run make-admin`) — no UI path to self-elevate.

### Authorization
- **Row-level security** on every learner-owned table, enforced by the restricted `oversabi_app` role (ARCHITECTURE §1). Tested: cross-user reads/updates/inserts fail; learners can't read stored answers, can't write subscriptions or usage, can't change their role.
- Role hierarchy `learner < contributor < reviewer < editor < admin`, checked server-side on every admin page and every admin action; all admin actions audited (`audit_events`).
- Entitlements only change via signature-verified Paystack webhooks or audited admin grants.

### Request hygiene
- All inputs validated with Zod; uniform JSON errors; no stack traces leaked.
- CSRF: SameSite cookies + `Origin` check on every cookie-authenticated mutation.
- Rate limits (Postgres-backed, multi-instance safe): sign-in per IP and per email, sign-up, password reset, lesson attempts, tutor turns, speech, reports, contributions, support, admin.
- Usage limits per plan for tutor replies, STT seconds and TTS characters, metered atomically.
- Uploads: size-limited (2 MB speech, 1 MB contributions), stored under random keys, served only through `/api/audio` with review-status access control.
- Security headers: CSP (`default-src 'self'`, no third-party scripts or fonts, `frame-ancestors 'none'`), `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options: DENY`, `Permissions-Policy: microphone=(self)`. Note: Next.js inline bootstrap scripts currently require `'unsafe-inline'` for scripts; moving to nonce-based CSP via middleware is a recommended hardening step.
- Webhooks: HMAC-SHA512 over the raw body with constant-time comparison; idempotent processing; 500 on processing errors so the provider retries.
- Cron endpoint requires `Authorization: Bearer $CRON_SECRET` (constant-time compare).

### Secrets
All provider keys are server-only environment variables, read through `src/lib/env.ts` (which imports `server-only`). Nothing secret is prefixed `NEXT_PUBLIC_`. `.env*` files are git-ignored; `.env.example` contains names only.

## Privacy

### Data minimisation
- Signup collects email, display name, password and an age band — no birth date, phone or location.
- Analytics events store event names and coarse properties only: no IP addresses, no message text, no audio. Users can opt out.
- Raw audio from the speaking room is **not stored**; it is forwarded to the speech provider for transcription only. Contributor recordings are stored only with explicit speaker consent and a stated licence.

### Retention (enforced by `POST /api/cron/daily`)
| Data | Retention |
| --- | --- |
| Conversation transcripts & per-turn corrections | `TRANSCRIPT_RETENTION_DAYS` (default 90), then deleted; session summary kept |
| Analytics events | 13 months |
| Read notifications | 90 days |
| Rate-limit windows | 1 day |
| Account & learning data | until account deletion |

### Learner controls
Settings → Privacy & data: analytics opt-out, leaderboard opt-in (adults only), voice-processing consent (revocable), **download all data (JSON)**, **delete account** (confirmation by typing the email; cascades all learning data; accepted community contributions are kept but de-linked; the audit log stores a one-way hash; an active Paystack renewal is disabled automatically where possible).

### Minors
Accounts require age 13+. Learners aged 13–17 are excluded from leaderboards. No public messaging, social feed or user-to-user contact exists. A family plan with guardian controls is on the roadmap and not implemented.

### AI-specific
- Every tutor is labelled "AI tutor"; the system prompt requires the model to say it's AI if asked. AI voices are labelled as AI; no voice cloning of real people (admin UI warns; tutor voices must be licensed provider voices).
- AI feedback is presented as learning guidance; summaries include a caveat that pronunciation wasn't assessed.
- Private conversations are not used to train models. Any future change would require explicit, separate opt-in consent.
- Model inputs include only what's needed: tutor persona, settings, learner level/goals, explanation language, display name, and the learner's curated vocabulary.

### Nigeria Data Protection Act 2023 (NDPA) alignment — to be confirmed by counsel
Implemented in software: lawful-basis mapping (privacy page), consent capture and withdrawal for voice, data subject access (export) and erasure, retention limits, security of processing, purpose limitation for analytics. **Operator actions required**: appoint a DPO if required, register with the NDPC as applicable, complete cross-border transfer mechanisms with each processor, sign DPAs with Anthropic/OpenAI/ElevenLabs/Paystack/Resend/hosting, perform a DPIA for voice processing, and have counsel finalise the privacy policy and terms (both are marked as drafts in the UI).

## Reporting vulnerabilities
Add a `security.txt` and contact address before launch: `[security contact to be set by operator]`.
