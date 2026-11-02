# Go live: step-by-step

This guide takes Prohub OS from this repository to a live, always-on deployment at your own domain. It follows one recommended path end to end — **Supabase** (database) + **Render** (web app and background worker) — and lists the alternatives at the end. For background and reference, see [DEPLOYMENT.md](DEPLOYMENT.md), [INTEGRATIONS.md](INTEGRATIONS.md) and [BACKUP.md](BACKUP.md).

**Time:** about 60–90 minutes, plus waiting time for DNS and Meta's WhatsApp verification.

---

## What you're deploying

| Piece | What it does | Where it runs |
|---|---|---|
| Web app | Dashboard (`/os`), public site, login, webhooks, Claude connector (`/api/mcp`) | Render **Web Service** (Docker) |
| Worker | Job queue, scheduler (07:00/08:00/12:00/17:00 cycles), agent execution, video rendering | Render **Background Worker** (Docker) |
| Database | All business data, plus files (videos, PDFs, WhatsApp media are stored in Postgres) | **Supabase** Postgres |

Both services are built from the same `Dockerfile`, which already includes Chromium and ffmpeg for video rendering. Because files live in the database, neither service needs a persistent disk.

---

## Step 0 — Before you start

You need:

- [ ] Access to this GitHub repository (`designpriest22/agent-skillzone`).
- [ ] A **Supabase** account — supabase.com.
- [ ] A **Render** account — render.com, signed in with GitHub.
- [ ] An **Anthropic API key** — platform.claude.com → API keys.
- [ ] Access to your domain's DNS settings (for example, `prohub.ng`).
- [ ] A password manager to store the secrets below.

Generate three secrets on your computer and save each one in your password manager:

```bash
openssl rand -base64 32
```

Use the output as `ENCRYPTION_KEY`. **Back it up.** If you lose it, the credentials saved in the dashboard can't be decrypted.

```bash
openssl rand -hex 24
```

Use the output as `CRON_SECRET`.

```bash
openssl rand -hex 16
```

Use the output as `WHATSAPP_VERIFY_TOKEN` (and, if you use Meta Pages, generate one more for `META_VERIFY_TOKEN`).

Also choose the owner login: `OWNER_EMAIL` and a strong `OWNER_PASSWORD`.

### Make sure the code is on the branch you'll deploy

Prohub OS lives in the `prohub-os/` folder of this repository. Render deploys one branch. Merge the branch that contains `prohub-os/` into `main` (recommended) and deploy `main`, or deploy that branch directly. Every push to the deployed branch will redeploy production, so keep work-in-progress on other branches.

---

## Step 1 — Create the database (Supabase)

1. In Supabase, click **New project**.
2. Name it `prohub-prod`, set a strong **database password** (save it), and choose a region. **Use the same region you'll pick on Render** — Frankfurt (EU Central) is the closest shared option to Nigeria on both platforms.
3. Choose a plan. The free plan is fine for a trial. For production, use a paid plan: rendered videos and PDFs are stored in the database, and paid plans include daily backups.
4. When the project is ready, click **Connect** and copy the **Session pooler** connection string (port `5432`). It looks like:

   ```text
   postgresql://postgres.<project-ref>:<YOUR-PASSWORD>@aws-0-<region>.pooler.supabase.com:5432/postgres
   ```

5. Replace `<YOUR-PASSWORD>` with the database password. This is your `DATABASE_URL`.

> Use the **Session** pooler, not the direct connection (which may be IPv6-only and unreachable from Render) and not the Transaction pooler. If you ever switch to the Transaction pooler (port `6543`), you must also set `DATABASE_PREPARE=false`.

---

## Step 2 — Create a shared environment group (Render)

Both services need identical settings, so define them once.

1. In Render, open **Environment Groups** → **New Environment Group** and name it `prohub-prod`.
2. Add these variables:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Session pooler string from Step 1 |
| `DATABASE_PREPARE` | `true` |
| `DATABASE_POOL_SIZE` | `5` (each service opens its own pool — keep the total within your Supabase pooler limit) |
| `APP_URL` | Leave as a placeholder for now — you'll set it in Step 4 |
| `ENCRYPTION_KEY` | From Step 0 |
| `BUSINESS_TIMEZONE` | `Africa/Lagos` |
| `OWNER_EMAIL` | Your login email |
| `OWNER_NAME` | Your name |
| `OWNER_PASSWORD` | Strong password from Step 0 |
| `WORKER_MODE` | `standalone` |
| `WORKER_CONCURRENCY` | `3` |
| `CRON_SECRET` | From Step 0 |
| `ANTHROPIC_API_KEY` | Your Anthropic key |
| `WHATSAPP_VERIFY_TOKEN` | From Step 0 (needed in Step 8) |

Leave the integration variables (SMTP, WhatsApp, Meta, Paystack, Telegram, OpenAI) out for now. You can add them here later, or enter them in the dashboard under **Integrations**, where they're stored encrypted. Values saved in the dashboard take precedence over environment variables.

---

## Step 3 — Deploy the web app

1. In Render, click **New** → **Web Service** → **Build and deploy from a Git repository**, and pick `designpriest22/agent-skillzone`.
2. Configure:
   - **Name:** `prohub-web`
   - **Branch:** `main` (or the branch from Step 0)
   - **Root Directory:** `prohub-os`
   - **Language / Runtime:** **Docker** (Render detects the `Dockerfile`)
   - **Region:** the same region as Supabase
   - **Instance type:** a paid instance with at least 2 GB RAM. Free instances sleep when idle and don't support the Shell or pre-deploy commands used below.
3. Open **Advanced**:
   - **Health Check Path:** `/api/health`
   - **Pre-Deploy Command:** `npm run db:migrate` (applies any pending migrations safely on every deploy)
   - **Auto-Deploy:** On
4. Under **Environment**, link the `prohub-prod` environment group.
5. Click **Create Web Service** and wait for the first build. It takes a few minutes because it installs Chromium and ffmpeg.

The Docker image already sets `NODE_ENV=production`, and Render supplies the port the app listens on.

---

## Step 4 — Set the public URL

1. Copy the service URL Render shows, for example `https://prohub-web.onrender.com`.
2. In the `prohub-prod` environment group, set `APP_URL` to that URL. Use no trailing slash.
3. Save. Render redeploys the services linked to the group.

You'll change `APP_URL` again in Step 7 when the custom domain is live.

---

## Step 5 — Create the database tables and the owner account (once)

1. Open `prohub-web` → **Shell**.
2. Run:

   ```bash
   npm run setup
   ```

This runs the migrations and seeds the 12 agents, services, schedules, starter knowledge and your owner account. It's safe to re-run, because it skips anything that already exists. If you left `OWNER_PASSWORD` empty, a random password is printed once in this output. Copy it immediately.

> No Shell? Run the same command from your computer, inside `prohub-os/`, with `DATABASE_URL` set to the production string. Use `npm install` first.

---

## Step 6 — Deploy the worker

Without the worker, nothing runs in the background: no agent work, no schedules, no WhatsApp replies.

1. In Render, click **New** → **Background Worker** and select the same repository.
2. Configure:
   - **Name:** `prohub-worker`
   - **Branch / Root Directory / Language:** the same as the web app (`prohub-os`, Docker)
   - **Region:** the same
   - **Docker Command:** `npm run worker`
   - **Instance type:** at least 2 GB RAM (video rendering runs Chromium)
3. Link the `prohub-prod` environment group and create the service.
4. Open its **Logs**. You should see the worker start and claim jobs.

> On a host that only allows one service, skip this step and set `WORKER_MODE=embedded` instead, which runs the worker inside the web process. The separate worker is more robust.

---

## Step 7 — Connect your domain

1. In `prohub-web`, open **Settings** → **Custom Domains** → **Add Custom Domain**. Add your domain, for example `prohub.ng`, and `www.prohub.ng` (or a subdomain such as `os.prohub.ng`).
2. Render shows the DNS records to create. Typically:
   - `www` (or another subdomain) → a **CNAME** pointing to `prohub-web.onrender.com`
   - the root domain → an **A** record (or ALIAS/ANAME) using the value Render displays
3. Add those records at your DNS provider. Remove any conflicting old A or CNAME records for the same names.
4. Wait for Render to show the domain as **Verified** and the certificate as issued. HTTPS is automatic.
5. Set `APP_URL` in the environment group to the final URL, for example `https://prohub.ng` (no trailing slash), and let the services redeploy.

---

## Step 8 — Smoke test

Work through these checks in order:

1. Open `https://<your-domain>/api/health`. You should see `{"ok":true,"db":"up",…,"ai":"configured"}`.
2. Open `https://<your-domain>/login` and sign in with the owner account.
3. Go to **Integrations** → **Anthropic** → **Test connection**.
4. Go to **Command centre** and ask: *"Which agent has the most outstanding tasks?"*
5. Go to **Activity & jobs** → **Background jobs**. Jobs should move from *queued* to *succeeded* within seconds. If they stay queued, the worker isn't running (see Step 6).
6. Submit the contact form on the public site. A lead and a triage task should appear in the CRM.
7. In the `prohub-worker` Shell, run `npm run video:sample`. It renders three test MP4s and prints the quality check.

---

## Step 9 — Connect the channels

Set these up in the dashboard under **Integrations** (encrypted), then press **Test connection** on each. Full details are in [INTEGRATIONS.md](INTEGRATIONS.md).

| Integration | What to do | Webhook / URL |
|---|---|---|
| **Email (SMTP)** | Enter host, port, user, app password and the From address | — |
| **WhatsApp Cloud API** | Meta for Developers → Business app → WhatsApp. Add a permanent System User token, the phone number ID and `META_APP_SECRET`. Subscribe to **messages**. | `https://<your-domain>/api/webhooks/meta`, verify token = `WHATSAPP_VERIFY_TOKEN` |
| **Authorise your phone** | Settings → **Command channels** → add your number (e.g. `2348012345678`). Send *help* to the business number. | — |
| **WhatsApp template** | Create a utility template such as `prohub_update` with one variable, and set `WHATSAPP_OWNER_TEMPLATE` | — |
| **Claude connector** | Settings → **Command channels** → **Create token**. In Claude: Settings → Connectors → Add custom connector. | `https://<your-domain>/api/mcp/phk_…` (treat it like a password) |
| **Paystack** | Enter the secret key | `https://<your-domain>/api/webhooks/paystack` |
| **Meta Page / Instagram** | Page token, Page ID, IG user ID | `https://<your-domain>/api/webhooks/meta`, verify token = `META_VERIFY_TOKEN` |
| **Telegram / Slack** | Bot token and chat ID, or a webhook URL | — |
| **OpenAI** (optional) | API key, for image generation and voice-note transcription | — |

In production, unsigned Meta webhook calls are rejected, so `META_APP_SECRET` must be set for WhatsApp to work.

---

## Step 10 — Harden before you announce it

- [ ] **Backups:** confirm daily backups in Supabase, and turn on Point-in-Time Recovery for production. Do a test restore once a quarter ([BACKUP.md](BACKUP.md)).
- [ ] **Secrets:** `ENCRYPTION_KEY`, the database password and all tokens are in a password manager. `.env` files are never committed.
- [ ] **Accounts:** turn on two-factor authentication for GitHub, Render, Supabase, Meta and Anthropic.
- [ ] **Owner password:** if it was printed in logs, change it in the dashboard. Clear `OWNER_PASSWORD` from the environment group once the account exists.
- [ ] **Monitoring:** add an uptime monitor (for example UptimeRobot or Better Stack) on `https://<your-domain>/api/health`, and turn on Render's deploy-failure notifications.
- [ ] **Spend limits:** set a monthly usage limit in the Anthropic console, and review per-agent models and effort on the Workforce page.
- [ ] **Branch protection:** protect the deployed branch on GitHub, because every merge deploys to production.

---

## Day-to-day: updates and rollbacks

- **Deploying a change:** merge to the deployed branch. Render builds, runs `npm run db:migrate` (pre-deploy), then swaps traffic over once `/api/health` passes. The worker redeploys too.
- **Changing the database schema:** edit `src/db/schema.ts`, run `npm run db:generate`, review and commit the SQL in `drizzle/`. The pre-deploy step applies it.
- **Rolling back:** in Render, open the service's **Events** and roll back to the previous deploy. Database migrations are not rolled back automatically, so make schema changes additive where possible.
- **Changing a secret:** edit it in the `prohub-prod` group. Both services redeploy with the new value.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `/api/health` returns `ok:false` | Wrong `DATABASE_URL`, or the password still contains a placeholder | Re-copy the Session pooler string; check the password and region |
| `"ai":"not configured"` | `ANTHROPIC_API_KEY` is missing | Add it to the group or under Integrations |
| Jobs stay *queued* | Worker isn't running, or `WORKER_MODE` is wrong | Check `prohub-worker` logs; `WORKER_MODE=standalone` |
| `too many connections` / pool errors | Combined pools exceed the Supabase limit | Lower `DATABASE_POOL_SIZE`, or upgrade the Supabase compute |
| Build runs out of memory or is killed | Instance too small | Use an instance with at least 2 GB RAM |
| Can't log in after deploy | Logging in over plain `http`, where production cookies are `secure` | Always use the `https://` URL |
| WhatsApp webhook verification fails | Verify token mismatch, or wrong URL | Use the same `WHATSAPP_VERIFY_TOKEN` in Meta; URL must be `…/api/webhooks/meta` |
| WhatsApp messages arrive but nothing happens | `META_APP_SECRET` is missing, or the worker is down | Set the secret; check the worker logs |
| Links in emails or WhatsApp point to localhost or onrender.com | Stale `APP_URL` | Set `APP_URL` to the final https domain |
| Videos fail to render | Worker not on the Docker image, or too little RAM | Deploy the worker from the Dockerfile; run `npm run video:sample` |

---

## Alternatives

- **Railway or Fly.io:** the same shape as Render — one service for `npm start` (web), one for `npm run worker`, built from the Dockerfile, with the same variables. See DEPLOYMENT.md, Option A.
- **Your own VM (DigitalOcean, Hetzner, AWS Lightsail):** install Docker, copy `.env.example` to `.env` and fill it in, then run:

  ```bash
  docker compose --profile app up -d --build
  ```

  Put Caddy in front for automatic HTTPS, with a `Caddyfile` containing `prohub.ng { reverse_proxy localhost:3000 }`. Schedule `scripts/backup.sh` for backups. The bundled database lives on the VM, so you are responsible for its backups.
- **Vercel (serverless):** set `WORKER_MODE=cron` and `CRON_SECRET`; `vercel.json` already calls `/api/cron/tick` every minute. Video rendering doesn't work on serverless, so add a Docker worker elsewhere if you need it.

---

## Go-live checklist

- [ ] Supabase project created; Session pooler `DATABASE_URL` saved
- [ ] `prohub-prod` environment group complete
- [ ] `prohub-web` live, health check passing
- [ ] `npm run setup` run once; owner can sign in
- [ ] `prohub-worker` running; jobs succeed
- [ ] Custom domain verified with HTTPS; `APP_URL` updated
- [ ] Anthropic, SMTP and WhatsApp connected and tested
- [ ] Your phone authorised; *help* returns the menu
- [ ] Claude connector token created and tested
- [ ] Backups, uptime monitor, 2FA and spend limits in place
