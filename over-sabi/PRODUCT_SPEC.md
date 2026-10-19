# Product specification — implemented capabilities

Legend: ✅ implemented and covered by automated tests · 🟢 implemented, manually checked · 🔌 implemented, needs external credentials to run for real · 🗺️ roadmap (not built)

## Public site
| Page | Status | Notes |
| --- | --- | --- |
| Landing `/` | 🟢 | Call-and-response hero (YO/IG/HA) with tone line, "what sabi means", real product screenshots, AI tutor roster, live language-status table, no testimonials or invented numbers |
| How it works `/how-it-works` | 🟢 | |
| Language catalogue `/languages`, `/languages/[code]` | ✅ | 57 languages by region; per-language quality status, limitations, orthography/dialect/register notes, ISO codes where known |
| Tutor discovery `/tutors` | 🟢 | Six original AI personas, all labelled AI |
| Sample lesson `/try`, `/try/[code]` | ✅ | No account needed; progress kept on device, merged on sign-up |
| Pricing `/pricing` | ✅ | Plans/limits from DB; prices only if configured; clear "not on sale" state without Paystack |
| About, Help & FAQs (+ contact form), Privacy, Terms, Status, Brand | 🟢 | Privacy/Terms marked "draft for legal review" |
| Sign-in, sign-up, forgot/reset password, verify email | ✅ | Google sign-in 🔌 |

## Learner app
| Capability | Status | Notes |
| --- | --- | --- |
| Onboarding (language → reasons → level → explanation language → tutor → daily minutes) | ✅ | Skippable steps; guest and account modes; creates learning plan and starts first lesson |
| Dashboard `/home` | 🟢 | Next lesson, streak, daily goal, XP today, due revision, stats |
| Course map `/learn` | ✅ | Language switcher, chapters, completion/best score, "up next", planned chapters, beta notice |
| Lesson player | ✅ | Listening, translation (special-character keyboard incl. combining tone marks), word order, matching, dialogue, recap (save words, culture notes), review (SRS-driven). Server-side grading with near-miss detection, retry, report a problem, completion with XP/streak/achievements |
| Speaking room `/speak/session/[id]` | ✅ (test double) / 🔌 | Text conversation with structured corrections, new vocabulary (save as unverified), translations toggle, uncertainty notes, timer, end + summary. Voice input with consent, VAD auto-stop, experimental-transcription confirmation, mic error states 🔌. Tutor voice playback, replay, mute, barge-in 🔌. Offline detection, message kept on failure |
| Tutor selection & settings `/speak/tutors` | ✅ | Tutor, mode (beginner/balanced/immersion), difficulty, correction frequency, target-language %, translation help, speaking speed, session length (capped by plan) |
| Guided dialogues `/speak/dialogues` | 🟢 | No-AI fallback: read, record yourself locally, replay, reveal model reply |
| Session history & transcripts `/speak/history/[id]` | ✅ | Transcript with corrections; summary kept after transcript retention expires |
| Vocabulary notebook `/vocabulary` | ✅ | Search/filter, review-status badges, unverified conversation phrases, remove, report |
| Revision queue `/review` | ✅ | SM-2 flashcards with forgot/hard/good/easy |
| Progress `/progress` | 🟢 | Streak, XP 14-day chart, retention, listening accuracy, speaking stats, grammar insights from corrections, honest "pronunciation not assessed", achievements with share, opt-in weekly leaderboard (adults) |
| Notifications `/notifications` | 🟢 | Revision due, streak, weekly summary (created by daily cron), billing |
| Settings `/settings` | ✅ | Profile, focus language, explanation language, goal, time zone, notifications, privacy toggles, data export, account deletion, plan & usage, cancel renewal 🔌 |
| Contribute `/contribute` | 🟢 | New words, corrections, dialect variants, cultural notes, pronunciation recordings with consent; status of own contributions |
| Mobile bottom navigation, PWA install, offline lesson cache | ✅ / 🟢 | |

## Admin (`/admin`, role-gated)
| Area | Min role | Status |
| --- | --- | --- |
| Overview: language quality matrix, engagement, evidence of learning, provider health, cost (if recorded) | reviewer | 🟢 |
| Review queue: contributions, vocabulary, culture notes, audio, lessons — approve / request changes / dispute / reject, with history | reviewer | ✅ |
| Learner reports | reviewer | 🟢 |
| Content: publish/unpublish lessons, edit vocabulary (versioned, returns to review) | editor | ✅ |
| Languages: all statuses, limitations, speech test notes | editor | ✅ |
| Tutors: prompt-facing persona fields, status, voice id | editor | 🟢 |
| Users: search, roles, manual plan grants | admin | ✅ |
| Plans: limits, availability, Paystack prices | admin | 🟢 |
| Feature flags & provider configuration | admin | 🟢 |
| Support requests, audit log | admin | 🟢 |

## Platform
| Capability | Status |
| --- | --- |
| Postgres schema (40+ tables), versioned migrations, idempotent seed | ✅ |
| Row-level security for all learner data | ✅ |
| AI tutor provider abstraction; Claude implementation with structured output, refusal fallback, caching | ✅ (double) / 🔌 |
| Speech provider abstraction; OpenAI and ElevenLabs implementations | 🔌 |
| Paystack checkout, verified idempotent webhooks, entitlements, usage metering | ✅ (webhook/entitlements) / 🔌 (checkout) |
| Email (Resend) with dev console fallback | 🔌 |
| Storage (local disk / Supabase Storage) | 🟢 local / 🔌 Supabase |
| Daily cron: retention, reminders, weekly summaries, pruning | ✅ |
| First-party analytics + provider monitoring | 🟢 |
| Health endpoint `/api/health` | 🟢 |

## Roadmap (not built — intentionally)
- 🗺️ Family plan profiles and guardian controls; institutional groups, assignments and educator dashboards (plans exist in the catalogue as "Coming soon").
- 🗺️ Language partners, learning circles, friend challenges, any user-to-user messaging (requires moderation tooling first).
- 🗺️ Pronunciation scoring (requires validated models per language).
- 🗺️ Realtime speech-to-speech streaming (no provider with tested support for launch languages).
- 🗺️ Flutterwave and an international card processor (payment abstraction is ready; only Paystack implemented).
- 🗺️ UI localisation (UI is English; explanations can be Pidgin/French via the tutor).
- 🗺️ Native mobile apps (the PWA is installable; app-store direction is in the brand guidelines).

## Limitations and how to resolve them

| # | Limitation | Exact steps to resolve |
| --- | --- | --- |
| 1 | Starter content is an unreviewed editorial draft | Recruit ≥ 2 native-speaker reviewers per language → `npm run make-admin -- <email> reviewer` → work through Admin → Review queue (LANGUAGE_QUALITY.md) → set `content_status=verified`, then `catalogue_status=available`. |
| 2 | Only 4 lessons per language; 14 of 17 chapters are placeholders | Author chapters in `content/curriculum/*.ts` (or via contributions), `npm run db:seed -- --force-content` on a staging DB, review, publish. |
| 3 | No native audio | Contributors record via `/contribute` (pronunciation) with consent → reviewer approves audio → attach to vocabulary (automatic when the contribution names a word). |
| 4 | AI tutor not connected | Set `ANTHROPIC_API_KEY`; run 20+ scripted conversations per language with native reviewers; set `tutor_status` accordingly. |
| 5 | Speech untested | Choose a provider, set keys, follow the evaluation protocol in LANGUAGE_QUALITY.md, record results, set `stt_status`/`tts_status`. Consider evaluating Spitch and Google Chirp 3 (yo-NG preview) by adding a `SpeechProvider` implementation. |
| 6 | Payments not live | Create Paystack plans (NGN, monthly/annual) → set `PAYSTACK_SECRET_KEY` → add prices in Admin → Plans → register webhook `APP_URL/api/webhooks/paystack` → test with Paystack test cards and confirm the plan activates via webhook. Define refund policy in Terms. |
| 7 | Email not delivering | Verify a sending domain in Resend, set `RESEND_API_KEY` and `EMAIL_FROM`. |
| 8 | Legal drafts | Have counsel complete Privacy/Terms placeholders and NDPA obligations (SECURITY_AND_PRIVACY.md). |
| 9 | CSP allows inline scripts | Add nonce-based CSP in middleware (Next.js `headers` + `nonce` prop). |
| 10 | Real-device testing not done | Run QA_CHECKLIST.md on low-end Android (Chrome), iPhone (Safari — MediaRecorder support, autoplay rules), desktop browsers, throttled 3G. |
| 11 | Not deployed | Follow DEPLOYMENT.md. |
