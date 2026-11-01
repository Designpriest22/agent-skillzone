# Deployment

Prohub OS has three runtime pieces: the **web app** (Next.js — dashboard, website, WhatsApp webhook, Claude connector), the **worker** (job queue, scheduler, agent execution, video rendering), and **PostgreSQL**. Everything keeps running when no one has Claude Code or the dashboard open. Pick the option below that fits how you want to host it.

**Video rendering** needs Chromium and ffmpeg wherever the worker runs. The Docker image includes both. On Render/Railway/Fly, deploy the worker from the Dockerfile (or install `chromium ffmpeg` in the build) and set `CHROMIUM_PATH`. Serverless functions (Vercel) cannot render video — run a worker container for that, or the Video agent falls back to scripts and storyboards.

## Option A — Recommended: Render / Railway / Fly.io + Supabase

1. **Database:** create a Supabase project. Copy the *Session pooler* or direct connection string into `DATABASE_URL`. If you use the *transaction* pooler (port 6543), also set `DATABASE_PREPARE=false`.
2. **Web service:** build with `npm ci && npm run build` and start with `npm start`. Set every variable from `.env.example`, including `APP_URL` = your public URL.
3. **Worker service:** use the same repo and environment, start with `npm run worker`, and keep `WORKER_MODE=standalone`. One worker is enough to start with. You can run more safely because jobs are claimed with row locks.
4. **Migrate and seed once:** `npm run setup`. Use a one-off job or the shell on the web service.
5. Point your domain (for example `prohub.ng`) at the web service. Then configure the webhooks listed in [INTEGRATIONS.md](INTEGRATIONS.md).

If your host only allows a single service, set `WORKER_MODE=embedded` and the worker runs inside the web process.

## Option B — Vercel (serverless) + Supabase

1. Import the repo into Vercel and set the environment variables, with `WORKER_MODE=cron` and a strong `CRON_SECRET`.
2. `vercel.json` already schedules `/api/cron/tick` every minute. Vercel Cron sends `Authorization: Bearer $CRON_SECRET` automatically when `CRON_SECRET` is set.
3. Each tick runs due schedules and drains the queue for about 50 seconds (tune with `CRON_DRAIN_MS`). Long agent tasks need the function `maxDuration` that your Vercel plan allows (300 s is configured).
4. Run `npm run setup` from your machine against the production `DATABASE_URL`.

## Option C — Docker (any VM)

The quickest path is Compose, which runs the database, migrations, web app and worker:
```bash
cp .env.example .env   # fill in ENCRYPTION_KEY, OWNER_*, ANTHROPIC_API_KEY, WhatsApp, APP_URL …
docker compose --profile app up -d --build
```
Or run the image directly:
```bash
docker build -t prohub-os .
docker run --env-file .env prohub-os npm run setup            # once
docker run -d --env-file .env -p 3000:3000 prohub-os           # web
docker run -d --env-file .env prohub-os npm run worker         # worker
```
Put a TLS-terminating reverse proxy (Caddy or Nginx) in front of port 3000.

## Environment checklist

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL 14+ |
| `APP_URL` | ✅ | Public URL, no trailing slash |
| `ENCRYPTION_KEY` | ✅ | `openssl rand -base64 32`. **Back it up.** Losing it makes the stored credentials unreadable. |
| `OWNER_EMAIL`, `OWNER_PASSWORD` | first run | Creates the owner account during seeding |
| `ANTHROPIC_API_KEY` | for agents | Can also be entered in Integrations |
| `WORKER_MODE`, `CRON_SECRET` | ✅ | See above |
| Integration variables | optional | Or enter them in the Integrations UI |

## Database migrations

- Schema source: `src/db/schema.ts`. To change it, run `npm run db:generate`, review the SQL in `drizzle/`, and commit it.
- To apply migrations, run `npm run db:migrate`. It is safe on every deploy and only applies pending migrations.

## Post-deploy verification

1. `GET /api/health` should return `{"ok":true,"db":"up","ai":"configured"}`.
2. Sign in, open **Integrations** and press **Test connection** on Anthropic, SMTP and Telegram.
3. Run `npm run agent:smoke` against production, or issue *"Which agent has the most outstanding tasks?"* from the Command centre.
4. Check **Activity & jobs → Background jobs**. Jobs should move from queued to succeeded within seconds. If they stay queued, the worker is not running.
5. Submit the public contact form. A lead and a Client Management triage task should appear.
6. **WhatsApp:** from an authorised number send *help* — you should get the command menu within a few seconds. Send *tasks* to see the workforce board. From any other number, a message should create a CRM lead.
7. **Claude connector:** create a token (Settings → Command channels), connect Claude, and ask it to call `business_snapshot`.
8. **Video:** on the worker host run `npm run video:sample` — it writes three MP4s to `out-sample/` and prints the measured QC.
