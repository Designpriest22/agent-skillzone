# Deployment

Over Sabi is a standard Next.js 16 Node application plus a PostgreSQL database. The documented path is **Vercel (app) + Supabase (Postgres + Storage)**, with Paystack, Resend and Anthropic as optional services. Any Node 20+ host (Render, Fly.io, Railway, a VM with `npm start` behind nginx) and any Postgres 14+ (Neon, RDS, Cloud SQL) work the same way.

> Deployment was **not** performed from the build environment (no hosting credentials). Everything below has been exercised locally except the hosted services themselves.

## 1. Database (Supabase)

1. Create a Supabase project in the region closest to your learners (for Nigeria: `eu-west` / `eu-central` are the usual low-latency options; confirm current regions in Supabase).
2. Get the **direct connection** or **Session pooler** connection string (Project Settings → Database). Use the session pooler (port 5432) for serverless hosts; if you use the **transaction** pooler (port 6543) set `DATABASE_PREPARE=false`.
3. The migration creates a role (`oversabi_app`). The Supabase `postgres` user has `CREATEROLE`; if your provider's user does not, create it once manually as a superuser:
   ```sql
   create role oversabi_app nologin;
   grant oversabi_app to <your_app_user>;
   ```
4. From your machine or CI, with `DATABASE_URL` pointing at the new database:
   ```bash
   npm ci
   NODE_ENV=production npm run db:migrate
   npm run db:seed
   ```
   `db:reset` refuses to run when `NODE_ENV=production`.
5. **Storage**: create a **private** bucket `oversabi-audio`. Set `STORAGE_DRIVER=supabase`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (server only). Audio is served through `/api/audio`, never from public bucket URLs.
6. Enable Supabase backups / PITR on a paid plan before launch.

## 2. App (Vercel)

1. Import the repository; set **Root Directory** to `over-sabi`. Framework: Next.js. Build: `npm run build`. Node 22.
2. Environment variables (Production and Preview) — see `.env.example`:
   - Required: `DATABASE_URL`, `SESSION_SECRET` (`openssl rand -hex 32`), `APP_URL` (e.g. `https://oversabi.example`)
   - Optional integrations: `ANTHROPIC_API_KEY`, `TUTOR_MODEL`, `TUTOR_EFFORT`, `SPEECH_PROVIDER` + provider keys, `RESEND_API_KEY`, `EMAIL_FROM`, `GOOGLE_CLIENT_ID/SECRET`, `PAYSTACK_SECRET_KEY`, storage vars, `CRON_SECRET`, `TRANSCRIPT_RETENTION_DAYS`
   - **Never** set `OVERSABI_TEST_PROVIDERS` in production (it is ignored when `NODE_ENV=production` anyway).
3. Function region: pick the region nearest the database.
4. Deploy. Check `https://<domain>/api/health` → `{"status":"ok"}` and the integrations you expect.
5. Create your account in the app, then from a trusted machine: `DATABASE_URL=… npm run make-admin -- you@domain admin`.

### Cron
Add to `vercel.json` (or your scheduler) a daily call:
```json
{ "crons": [{ "path": "/api/cron/daily", "schedule": "15 5 * * *" }] }
```
Vercel Cron sends `Authorization: Bearer $CRON_SECRET` when `CRON_SECRET` is set. Elsewhere: `curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://<domain>/api/cron/daily`.

## 3. DNS and domain
1. Add your domain in Vercel; create the records it shows (apex `A`/`ALIAS`, `www` `CNAME`).
2. Set `APP_URL` to the canonical HTTPS origin and redeploy (used for emails, OAuth and payment callbacks, CSRF origin checks).
3. Email: verify the sending domain in Resend (SPF, DKIM, and add a DMARC record).

## 4. Integrations

| Service | Steps |
| --- | --- |
| **Anthropic** | Create an API key; set `ANTHROPIC_API_KEY`. Default model `claude-opus-5-5`, effort `low`. Server-side refusal fallback is on. Watch cost in the Anthropic console; usage per learner is capped by plan limits. |
| **OpenAI speech** | `SPEECH_PROVIDER=openai`, `OPENAI_API_KEY`. Then evaluate per language (LANGUAGE_QUALITY.md) before changing statuses. |
| **ElevenLabs speech** | `SPEECH_PROVIDER=elevenlabs`, `ELEVENLABS_API_KEY`, a licensed `ELEVENLABS_VOICE_ID`. |
| **Paystack** | Dashboard → Plans: create plans (e.g. Plus monthly/annual, NGN). Settings → API: copy the secret key → `PAYSTACK_SECRET_KEY`. Settings → Webhooks: `https://<domain>/api/webhooks/paystack`. In Admin → Plans, add each price with its `PLN_…` code. Test in Paystack test mode end-to-end, then switch keys. |
| **Google OAuth** | Google Cloud Console → OAuth client (Web). Authorised redirect URI: `https://<domain>/api/auth/google/callback`. Set `GOOGLE_CLIENT_ID/SECRET`. |
| **Resend** | API key → `RESEND_API_KEY`; `EMAIL_FROM` on the verified domain. |

## 5. Monitoring
- `/api/health` for uptime checks (returns 503 if the database is unreachable).
- `/status` public page; **Admin → Overview** for per-language provider failure rates and latency; **Admin → Flags & providers** for configuration.
- Add an error tracker (e.g. Sentry) via `instrumentation.ts` if desired — not bundled to keep the client small.

## 6. Pre-launch checklist
- [ ] Migrations applied, seed run, admin created
- [ ] `/api/health` OK with expected integrations
- [ ] Native-speaker review complete for any language marked *available*
- [ ] Speech statuses set from real evaluations
- [ ] Paystack test-mode purchase activates a plan via webhook; cancellation works
- [ ] Email verification and password reset delivered
- [ ] Cron running; retention verified
- [ ] Privacy policy & terms finalised by counsel; operator details filled in
- [ ] QA_CHECKLIST.md completed on real devices
- [ ] Backups enabled; `SESSION_SECRET` and keys stored in a secret manager

## 7. Rollback
Deployments are immutable on Vercel (promote a previous deployment). Migrations are forward-only SQL; write a new migration to revert schema changes. Take a database snapshot before applying migrations in production.
