# Prohub AI OS

An agentic business operating system for **Prohub Creative Solutions**. Twelve AI agents (a Managing Director, an Operations Manager, a Research Analyst and nine department agents) take instructions in plain language, delegate work to each other through a central orchestrator, use real tools to research, draft, build and record work, and report results that the system has checked.

It's built to run a creative agency's revenue engine. That covers prospecting, the CRM and follow-ups, proposals and invoices, content and campaigns, the agency's own website, finance tracking against revenue targets, and daily, weekly and monthly reporting. Humans approve anything that leaves the building.

> **Status:** MVP, working end to end. All 26 automated tests pass and the production build compiles. Each agent becomes active once you add an Anthropic API key. Integrations that touch the outside world (email, WhatsApp, Meta, LinkedIn, Paystack, image/video) each need their own credentials. See [docs/PROGRESS.md](docs/PROGRESS.md) for the phase reports.

---

## What it does

| Capability | How it works |
|---|---|
| **Natural-language command centre** | The owner types *"Develop a campaign to acquire 20 corporate clients this month"*. The AI Managing Director breaks it into tasks, delegates them with dependencies (research → sales → copy → client management), waits, reviews the results and writes a consolidated report. |
| **Real agent execution** | Each agent runs a Claude tool-use loop with its own tools: web search and fetch, CRM, deliverables, campaigns, site pages, invoices, knowledge and memory. Text an agent writes outside a tool is never saved as work. |
| **Verified completion** | An agent can only finish a task by calling `complete_task` with the IDs of the records it produced. The orchestrator checks that every ID exists. If the IDs are fabricated, the completion is rejected. |
| **Three-level permissions** | **L1** autonomous (research, drafting, internal records). **L2** approval required (emails, WhatsApp, proposals, publishing, campaigns). **L3** owner only (spending, contracts, refunds, ledger changes, access). Approved actions run automatically and every outcome is logged. |
| **Customer acquisition engine** | Daily prospecting by segment, evidence-backed leads (verified facts kept separate from assumptions, with source URLs), a transparent 0–100 lead score, pitch workflows, approval-gated outreach, and automatic follow-ups. |
| **CRM** | Kanban and table views, the nine pipeline stages, full contact history, follow-ups, proposals and clients. |
| **Finance** | A ledger written only by the owner or by verified Paystack webhooks. Shows revenue, expenses, gross and net profit, receivables, revenue by service and client, project profitability, campaign ROI, and revenue-target tracking (deals required, pipeline coverage). Leads and proposals never count as revenue. |
| **Marketing** | Content calendar, approval-gated publishing (Facebook, Instagram and LinkedIn APIs, with a manual-publish queue for the rest), campaigns, and agent-built landing pages on the public website. |
| **Autonomous schedule** | A morning intelligence cycle, a midday execution cycle and an evening review that writes the 10-section executive briefing. Follow-up reminders, invoice checks, scheduled publishing, and weekly and monthly reports also run on schedule. All schedules are editable. |
| **Reports** | The executive briefing plus daily, weekly and monthly finance and social reports. Numbers are computed from the database and agents add the narrative. Download as PDF, Excel or CSV, or have them delivered by email or Telegram. |
| **Knowledge and memory** | A shared knowledge base with pinned documents in every agent's context and full-text retrieval for the rest, plus each agent's own memory of lessons learned. |
| **Agency website** | Public site with service pages, portfolio and testimonials (shown only when verified), a lead form, WhatsApp click-to-chat, SEO metadata and a sitemap. Enquiries become CRM leads and triage tasks automatically. |

## Quick start (local)

Requirements: Node 20.11+ (22 recommended) and PostgreSQL 14+. You can start Postgres with `docker compose up -d`.

```bash
cp .env.example .env
#  - set ENCRYPTION_KEY:   openssl rand -base64 32
#  - set OWNER_EMAIL / OWNER_PASSWORD
#  - set ANTHROPIC_API_KEY to enable the agents
npm install
npm run setup          # migrations + seed (agents, services, schedules, starter knowledge, owner account)
npm run dev            # web app on http://localhost:3000   (team login at /login, dashboard at /os)
npm run worker         # in a second terminal: job queue + scheduler
```

Then sign in, open **Command centre** and try *"Which agent has the most outstanding tasks?"* or *"Find 10 hotels in Lagos that need social media management."*

To test against the live API (this costs a few cents): `npm run agent:smoke` or `npm run agent:smoke -- --research`.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` / `build` / `start` | Next.js app |
| `npm run worker` | Background worker (job queue, scheduler, agent execution) |
| `npm run setup` | `db:migrate` + `db:seed` (idempotent) |
| `npm run db:generate` | Generate a migration after editing `src/db/schema.ts` |
| `npm test` | Test suite (needs a Postgres database; uses `prohub_test` by default) |
| `npm run typecheck` | TypeScript check |
| `npm run agent:smoke` | Live end-to-end check against the Claude API |
| `scripts/backup.sh` | `pg_dump` backup with 30-file rotation |

## Project structure

```
src/
  agents/          definitions (12 agents), runtime (tool-use loop), prompts, LLM client, memory/RAG, tools/*
  orchestrator/    tasks (lifecycle, delegation, dependencies), commands, queue, scheduler, cycles, job handlers
  governance/      permission policy, approvals, executors for approved actions
  integrations/    registry + adapters: email, WhatsApp, Telegram, Slack, Meta, LinkedIn, Paystack, images, video, GitHub, Vercel
  services/        finance, scoring, reports (+ PDF/XLSX/CSV), KPIs, enquiries, notifications, settings
  db/              Drizzle schema, client, migrate, seed
  app/os/          dashboard: overview, command, approvals, workforce, tasks, CRM, projects, marketing, finance,
                   intelligence, reports, knowledge, integrations, settings, activity
  app/(site)/      public agency website and agent-built landing pages (/p/[slug])
  app/api/         enquiry form, webhooks (Paystack, Meta/WhatsApp), cron tick, report downloads, health
  worker/          standalone worker process
tests/             orchestration, governance, finance, queue, scheduler, reports, security
drizzle/           SQL migrations
docs/              architecture, roadmap, progress reports, deployment, integrations, admin/user guides, security
```

## Documentation

- [Architecture and technical decisions](docs/ARCHITECTURE.md)
- [Progress reports by phase](docs/PROGRESS.md) · [Roadmap](docs/ROADMAP.md)
- [Deployment](docs/DEPLOYMENT.md) · [Integrations setup](docs/INTEGRATIONS.md) · [Security](docs/SECURITY.md)
- [Admin guide](docs/ADMIN_GUIDE.md) · [User guide](docs/USER_GUIDE.md) · [Backups](docs/BACKUP.md) · [Troubleshooting](docs/TROUBLESHOOTING.md)

## Principles built into the code

1. **No fabricated business data.** Nothing operational is seeded. Revenue comes only from the ledger. Leads require source URLs. Metrics appear only from platform APIs or manual entry that records its source.
2. **No unverifiable completion.** Tasks finish only with output IDs that the orchestrator has checked.
3. **Humans control the outside world.** Every external action goes through an approval and is written to the audit log.
4. **Cost control.** Per-agent daily budgets, turn limits, a circuit breaker for repeated tool errors, prompt caching, and per-run cost accounting.
