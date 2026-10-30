# Over Sabi

**Your language. Your people. Your voice.**

Over Sabi is a web app for learning to *speak* African languages — starting with Yoruba, Igbo and Hausa — through short guided lessons, conversation practice with AI tutors, and spaced-repetition revision. It is built to be honest about language quality: every piece of content carries its review status, and speech features are labelled per language according to what has actually been tested.

> **Status: beta, deployment-ready, not deployed.** The application, database, tests and brand kit are complete and run locally. External services (AI tutor, speech, email, payments, Google sign-in, Supabase storage) are integrated but **not connected** — they need your credentials. The starter curriculum is an **editorial draft awaiting native-speaker review**. See [Outstanding work](#outstanding-work).

## What's in the box

| Area | Where |
| --- | --- |
| Next.js 16 app (App Router, React 19, TypeScript, Tailwind 4) | `src/` |
| Postgres schema, row-level security, migrations | `db/migrations/` |
| Language registry (57 languages), curriculum, tutors, plans | `content/` |
| Seed / migrate / admin bootstrap / brand export scripts | `scripts/` |
| Unit + integration tests (Vitest, real Postgres) | `tests/` |
| End-to-end tests (Playwright) | `e2e/` |
| Brand kit (SVG, PNG, PDF, social templates) | `public/brand/`, `brand/` |
| Documentation | this folder (`*.md`) |

Documentation: [ARCHITECTURE](ARCHITECTURE.md) · [PRODUCT_SPEC](PRODUCT_SPEC.md) · [LANGUAGE_QUALITY](LANGUAGE_QUALITY.md) · [SECURITY_AND_PRIVACY](SECURITY_AND_PRIVACY.md) · [DEPLOYMENT](DEPLOYMENT.md) · [BRAND_GUIDELINES](brand/BRAND_GUIDELINES.md) · [FEATURE_MATRIX](FEATURE_MATRIX.md) · [IMPLEMENTATION_CHECKLIST](IMPLEMENTATION_CHECKLIST.md) · [QA_CHECKLIST](QA_CHECKLIST.md)

## Quick start (local)

Requirements: Node 20.18+ (22 recommended), PostgreSQL 14+ (16 tested).

```bash
cd over-sabi
npm install

# 1. A database and a role that can create roles (needed once, for the RLS role)
createuser --createdb --createrole --pwprompt oversabi      # password: oversabi (or your own)
createdb -O oversabi oversabi_dev

# 2. Environment
cp .env.example .env.local
# set DATABASE_URL and SESSION_SECRET (openssl rand -hex 32)

# 3. Schema + seed content
npm run db:migrate
npm run db:seed

# 4. Run
npm run dev            # http://localhost:3000
```

Create an account in the app, then make yourself an admin:

```bash
npm run make-admin -- you@example.com
```

With no external keys configured, everything except AI conversation, voice, email delivery, payments and Google sign-in works. In development, verification and password-reset emails are printed to the server console (clearly labelled as not sent).

### Turning on integrations

Set the variables in `.env.local` (all documented in [`.env.example`](.env.example)):

| Feature | Variables |
| --- | --- |
| AI tutor (Claude) | `ANTHROPIC_API_KEY` (model `TUTOR_MODEL`, default `claude-opus-5-5`) |
| Voice input / AI voice | `SPEECH_PROVIDER=openai` + `OPENAI_API_KEY`, or `SPEECH_PROVIDER=elevenlabs` + `ELEVENLABS_API_KEY` (+ `ELEVENLABS_VOICE_ID`) |
| Email | `RESEND_API_KEY`, `EMAIL_FROM` |
| Payments | `PAYSTACK_SECRET_KEY` (then add prices in **Admin → Plans**) |
| Google sign-in | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| Audio storage | `STORAGE_DRIVER=supabase`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| Daily jobs | `CRON_SECRET` (call `POST /api/cron/daily`) |

`GET /api/health` and **Admin → Flags & providers** show what is configured. Speech for each language stays labelled "experimental" or "unavailable" until an admin marks it validated after testing — see [LANGUAGE_QUALITY.md](LANGUAGE_QUALITY.md).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` · `typecheck` · `format` | ESLint, `tsc --noEmit`, Prettier |
| `npm run db:migrate` | Apply `db/migrations/*.sql` (tracked in `schema_migrations`) |
| `npm run db:seed` | Upsert languages, tutors, plans, flags and courses (idempotent; `-- --force-content` overwrites courses) |
| `npm run db:reset` | Drop and recreate the schema, then seed (refuses in production) |
| `npm run make-admin -- <email> [role]` | Set a user's role from the command line |
| `npm test` | All Vitest tests (unit + integration; needs Postgres) |
| `npm run test:e2e` | Playwright journeys (starts its own dev server on :3100) |
| `npm run brand:export` | Rasterise icons, favicons, social images; print the brand PDF (needs the app running) |
| `npm run screenshots` | Regenerate the real product screenshots used on the landing page |
| `python3 scripts/brand/build_svgs.py` | Rebuild outlined logo SVGs (needs `pip install fonttools brotli`) |

## Testing

```bash
createdb -O oversabi oversabi_test     # unit + integration database (reset on every run)
createdb -O oversabi oversabi_e2e      # end-to-end database (reset on every run)
npm test
npm run test:e2e
```

Override with `TEST_DATABASE_URL` / `E2E_DATABASE_URL`. Playwright uses `/opt/pw-browsers/chromium` when present, otherwise run `npx playwright install chromium`.

Automated tests use **deterministic test doubles** for the AI tutor and speech provider (enabled with `OVERSABI_TEST_PROVIDERS=1`, refused when `NODE_ENV=production`). They verify the plumbing — sessions, transcripts, limits, fallbacks, summaries — **not** the quality of Yoruba/Igbo/Hausa output, which must be evaluated with native speakers and real provider keys ([LANGUAGE_QUALITY.md](LANGUAGE_QUALITY.md)). The manual checklist for microphones, audio, real devices and poor networks is in [QA_CHECKLIST.md](QA_CHECKLIST.md).

Latest results are recorded in [IMPLEMENTATION_CHECKLIST.md](IMPLEMENTATION_CHECKLIST.md#test-results).

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) — Vercel + Supabase is the documented path; any Node host + Postgres works.

## Outstanding work

The short version (full list with exact steps in [PRODUCT_SPEC.md](PRODUCT_SPEC.md#limitations-and-how-to-resolve-them)):

1. **Native-speaker review of all starter content** (Yoruba, Igbo, Hausa) through **Admin → Review queue**.
2. **Record native-speaker audio** for listening activities (contributor recording flow exists).
3. **Connect and evaluate providers** per language with real recordings before marking speech "validated".
4. **Legal review** of the draft privacy policy and terms (NDPA), fill in operator details.
5. **Add prices** (Paystack plan codes) and test a live checkout + webhook end to end.
6. Deploy, set DNS, configure cron, and run the manual QA checklist on real Android/iOS devices.
