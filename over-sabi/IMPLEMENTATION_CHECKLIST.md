# Implementation checklist

Running record of the build against the brief. ✅ done · 🔌 done but needs external credentials to run for real · ⚠️ done with a documented limitation · ⬜ not done (see reason)

## Phases
| Phase | Status | Notes |
| --- | --- | --- |
| 1. Research & planning | ⚠️ | Repo inspected (existing static site left untouched; app lives in `over-sabi/`). tooter.live was unreachable (proxy 403 / DNS failure); see FEATURE_MATRIX.md. Speech-provider language support researched from vendor pages. |
| 2. Identity & design system | ✅ | Three directions evaluated; "Call & Response" chosen. Tokens, components, logos (outlined SVG), PNGs, favicon/ICO, PWA icons, social templates, OG image, 14-page PDF guidelines. |
| 3. Core application | ✅ | Auth, onboarding (guest + account), navigation, schema, language registry, dashboard, preferences. |
| 4. Learning engine | ✅ | 7 activity types, server grading, SRS, progress, history, XP/streaks/achievements. |
| 5. AI tutor & speech | 🔌 | Claude provider + OpenAI/ElevenLabs speech implemented; verified with deterministic doubles; real-language quality untested. Guided-dialogue fallback works with no AI. |
| 6. Content management | ✅ | Review queue, contributions (incl. recordings), disputes, versioning, reports, language/tutor admin. |
| 7. Payments & operations | 🔌 | Plans/limits/prices in DB, Paystack checkout + verified idempotent webhooks, entitlements, usage metering, rate limits, analytics, provider monitoring, cron. |
| 8. Quality assurance | ✅ | Typecheck, lint, 57 Vitest tests, 13 Playwright journeys; manual QA checklist written. |
| 9. Deployment | ⬜ | No hosting credentials in this environment. Deployment-ready; exact steps in DEPLOYMENT.md. |
| 10. Handover | ✅ | README + docs. |

## Acceptance criteria (brief §21)
| # | Criterion | Result | Evidence |
| --- | --- | --- | --- |
| 1 | New user can create an account | ✅ | e2e "new learner signs up…" |
| 2 | Guest lesson | ✅ | e2e "guest can take a sample lesson…" |
| 3 | Select Yoruba, Igbo or Hausa | ✅ | e2e onboarding (Yoruba, Hausa); integration tests use all three |
| 4 | Complete a guided lesson | ✅ | e2e + `lessons.test.ts` |
| 5 | Answer validation | ✅ | `normalize.test.ts`, `grading.test.ts`, e2e near-miss / wrong answer |
| 6 | Save vocabulary | ✅ | e2e notebook after lesson; `/api/vocabulary` |
| 7 | Review items return on schedule | ✅ | `srs-dates-tone.test.ts`, `lessons.test.ts`, e2e revision |
| 8 | Progress persists across sessions | ✅ | e2e re-sign-in shows "Best 100%" |
| 9 | Tutor preferences persist | ✅ | e2e "tutor preferences persist" |
| 10 | Speaking session starts with valid provider credentials | 🔌 | Plumbing verified with the test provider (integration + e2e). **Not** verified with a real Anthropic key — none available. |
| 11 | Speech-service failure → useful fallback | ✅ | e2e provider failure keeps text; `tutor.test.ts` rollback; STT/TTS failure paths coded with typed fallback |
| 12 | Transcripts reviewable | ✅ | e2e "View transcript" |
| 13 | Session summary generated and saved | ✅ (double) | `tutor.test.ts`, e2e summary screen |
| 14 | User-owned records isolated | ✅ | `rls.test.ts` (reads, updates, deletes, inserts, answers, role) |
| 15 | Entitlements not client-modifiable | ✅ | `rls.test.ts`, e2e checkout/webhook rejection |
| 16 | Admin routes protected | ✅ | e2e (page redirect, API 401/403), `payments-admin-account.test.ts` per-action roles |
| 17 | Account deletion removes/anonymises data | ✅ | integration + e2e |
| 18 | Mobile navigation works | ✅ | e2e mobile (Pixel 7), no horizontal overflow |
| 19 | Loading, error, empty states | ✅ | Skeletons, `error.tsx`, `not-found.tsx`, empty states throughout; e2e 404 check |
| 20 | Production build succeeds | ✅ | `next build` passes |

## Test results

Run on 2026-10-19 in the build container (Node 22.22, PostgreSQL 16.15, Chromium 1194):

```
npm run typecheck        → pass
npm run lint             → pass (0 problems)
npm test                 → 8 files, 57 tests passed
npm run test:e2e         → 13 passed (desktop Chromium + Pixel 7 viewport)
npm run build            → compiled successfully
```

**Bugs found by the tests and fixed:** usage-counter limit overflowed Postgres `int4` (every session start failed); Yoruba tone marks rendered detached in the display font (target-language text now always uses Noto Sans); admins were forced through learner onboarding before reaching `/admin`.

**Not covered by automated tests (needs credentials or devices):** real Claude conversations in each language; OpenAI/ElevenLabs transcription and synthesis; Paystack live checkout; Resend delivery; Google OAuth; Supabase Storage; iOS Safari and low-end Android behaviour; real microphones. See QA_CHECKLIST.md and LANGUAGE_QUALITY.md.

## Deliverables (brief §22)
| # | Deliverable | Location |
| --- | --- | --- |
| 1–4 | App, landing & navigation, auth, catalogue & curriculum engine | `src/`, `content/` |
| 5 | Seeded beginner curricula (YO/IG/HA) | `content/curriculum/` — ⚠️ editorial draft, **not yet native-reviewed** |
| 6 | Interactive lesson types | `src/components/lesson/` |
| 7–9 | AI tutor abstraction, live voice, typed fallback | `src/lib/ai/`, `src/lib/speech/`, `src/components/speak/` |
| 10 | Progress & revision | `src/lib/progress.ts`, `src/lib/srs.ts`, `/progress`, `/review` |
| 11 | Admin CMS | `src/app/admin/`, `src/lib/services/admin.ts` |
| 12 | Subscriptions & usage | `src/lib/payments/`, `src/lib/entitlements.ts` |
| 13–15 | Identity kit, SVG/PNG assets, tokens & components | `brand/`, `public/brand/`, `src/app/globals.css`, `src/components/ui/` |
| 16 | Migrations & seeds | `db/migrations/`, `scripts/seed.ts` |
| 17 | Automated tests | `tests/`, `e2e/` |
| 18 | `.env.example` | `.env.example` |
| 19–24 | README, ARCHITECTURE, PRODUCT_SPEC, LANGUAGE_QUALITY, SECURITY_AND_PRIVACY, DEPLOYMENT | this folder |
| 25 | Limitations with exact steps | PRODUCT_SPEC.md § Limitations |
