# Progress reports

Status as of this delivery. "Tested" means covered by the automated suite (`npm test`, 26 tests against a real PostgreSQL) or verified in a real browser against the running app. Agent reasoning against the live Claude API was **not** exercised in the build environment (no API key available there); the orchestration it drives was tested end to end with a scripted model client, and `npm run agent:smoke` performs the live check once a key is configured.

---

## Phase 1 — Research & architecture ✅
**Built:** framework comparison and decision (own loop on Claude Messages API + Postgres-backed task orchestration), model and cost strategy, data model (40+ tables), integration plan. See [ARCHITECTURE.md](ARCHITECTURE.md).
**Remaining:** none for MVP.

## Phase 2 — Core system ✅
**Built:** authentication (scrypt, DB sessions, roles owner/manager/viewer, login rate limit), dashboard shell, command centre, agent registry, task management, migrations and seed, job queue, scheduler, worker (standalone / embedded / cron modes).
**Tested:** password hashing, credential encryption, queue claim/dedupe/backoff/dead-letter, scheduler single-fire per slot; login → dashboard in browser; anonymous access to dashboard and report downloads blocked.

## Phase 3 — Agent development ✅
**Built:** 12 agents with job descriptions, objectives, KPIs, quality bars and tool belts (≈50 tools); runtime loop with completion verification, nudge-once, turn limit, error circuit breaker, budgets, pause/disable, refusal handling, pause_turn handling, transcripts and cost accounting; delegation with dependencies and automatic manager resume; proposed-task review by the Operations Manager; inter-agent inbox; per-agent memory.
**Tested:** MD → Research → Sales (dependency) → MD resume and consolidation with verified outputs; fabricated output IDs rejected; agent that stops without completing is failed; invalid tool input returned as error; lead evidence and dedupe rules; paused/disabled agents; missing API key handled; proposal → Ops review → rejection.
**Needs credentials:** `ANTHROPIC_API_KEY` for live execution.

## Phase 4 — Business operations ✅
**Built:** CRM (kanban, table, clients, follow-ups, proposals, contact history, lead detail with verified facts vs assumptions and score breakdown), prospecting pipeline (segments, evidence-backed leads, transparent scoring, pitch workflow), projects with deliverables, client approvals and revisions, finance centre (ledger, invoices, profitability, receivables), revenue-target engine.
**Tested:** finance summary, ₦15m target maths (achieved, remaining, deals required, weighted pipeline — pipeline never counted as revenue), receivables/overdue, pipeline weighting, lead scoring, enquiry intake and dedupe; owner sets a target and records a payment in the browser and the overview updates.

## Phase 5 — Marketing & creative production ✅ (integration-dependent pieces need credentials)
**Built:** content calendar, approval-gated publishing (Facebook, Instagram, LinkedIn APIs; manual-publish queue for TikTok/YouTube/X/Pinterest), manual metrics entry with provenance, campaigns with ROI from recorded spend and attributed revenue, agent-built landing pages (structured sections, draft preview, publish approval), public agency website with lead capture and WhatsApp, creative deliverables with QC checklists, SVG design output, image/video generation adapters.
**Tested:** website, service pages, contact form → lead + interaction + triage task (browser + HTTP); WhatsApp webhook → enquiry; webhook signature/verify-token rejection.
**Needs credentials:** Meta (Page/IG), LinkedIn, OpenAI Images, video provider, WhatsApp Cloud API, SMTP.

## Phase 6 — Automation ✅
**Built:** schedules for morning intelligence, midday execution, evening review + daily briefing (12 sections since v1.1), daily finance report, hourly follow-up reminders, daily overdue-invoice check, 5-minute scheduled publishing, weekly business/social and monthly finance/social reports; notifications (in-app, Telegram, Slack) and report delivery (email PDF, Telegram digest).
**Tested:** briefing contains all required sections; weekly/monthly/social/daily-finance builders; PDF/XLSX/CSV rendering and authenticated downloads; follow-up reminders create tasks exactly once; schedules computed in Africa/Lagos.

## Phase 7 — Testing ✅ (MVP scope)
26 automated tests across orchestration, delegation, verification, permissions, approvals, finance calculations, queue, scheduler, reports, enquiries, security primitives and timezone handling. Production build passes. Every dashboard and public route rendered without errors in Chromium.
**Not yet covered:** live-API agent quality evaluation (needs key + an eval set), third-party API calls (need sandbox credentials), load testing.

## Phase 8 — Deployment readiness ✅
`.env.example`, migrations, Dockerfile (web + worker from one image), `vercel.json` cron, deployment guide (Render/Railway/Fly + Supabase, Vercel serverless, Docker), backup script and procedure, admin/user guides, integrations setup, troubleshooting, security notes.

---

## Integrations requiring credentials
| Needed for | Credentials |
|---|---|
| All agents | Anthropic API key |
| Outreach, proposals, report emails | SMTP (Gmail app password works) |
| WhatsApp outreach + inbound | WhatsApp Cloud API token, phone number ID, verify token, Meta app secret |
| Facebook/Instagram publishing + DMs/comments | Meta Page token, Page ID, IG user ID, verify token |
| LinkedIn publishing | LinkedIn org token (Community Management API approval) |
| Payment links + automatic income recording | Paystack secret key + webhook URL |
| Image / video generation | OpenAI API key; video provider endpoint + key |
| Push notifications | Telegram bot token + chat ID and/or Slack webhook |
| Client-site deploys | GitHub token + repo; Vercel deploy hook |

## Phase 9 (v1.1) — Command channels, video production, daily rhythm ✅
Built against the PROHUB INTELLIGENCE master brief, on top of the MVP above.

**Built**
- **WhatsApp command centre** (official Cloud API): authorised numbers bound to users and roles; natural-language instructions to the MD; quick commands (`help`, `approvals`, `approve/reject/change <ref>`, `status`, `tasks`, `cancel`); progress messages (received → agent assigned → department finished → verified final report with records, links, pending approvals, video files and report PDFs); Approve / Reject / Request-changes buttons on every approval; images and PDFs passed to the MD as real image/document input; voice-note transcription (OpenAI) with graceful fallback; 24-hour-window template fallback; inbound de-duplication; non-authorised senders remain CRM enquiries.
- **Claude command centre**: remote MCP server (`/api/mcp`, stateless Streamable HTTP) with 18 tools — instructions, status, task board, business snapshot, pipeline, approvals (L3 refused), reports, agents, deliverables, payments, knowledge. Personal access tokens (hashed) managed in Settings.
- **Built-in video production**: `render_video` renders MP4s (9:16, 1:1, 4:5, 16:9) from a storyboard in the client's palette via Chromium + ffmpeg; ffprobe-measured QC; files stored and linked to the client deliverable; video playback on the deliverable page.
- **Daily rhythm** 07:00 intelligence · 08:00 assignments (new cycle) · 12:00 progress · 17:00 report; the daily report now has the brief's 12 sections and is delivered to WhatsApp (summary + PDF).
- **Research reports** now require topic, findings, sources, opportunity, cost/revenue economics, recommended action and priority.
- **Pipeline stages** aligned to the brief: New lead → Contacted → Responded → Qualified → (Meeting) → Proposal sent → Negotiation → Won/Lost (data migration included).
- **Revenue intelligence snapshot**: actual revenue, expenses, net, target, outstanding/overdue, pipeline estimates, leads, outreach, responses, win rate, new/active/repeat clients, marketing spend, cost per lead, CAC.
- **Cost routing**: Opus for MD and copy, Sonnet for specialists, Haiku for finance narration.
- **Deployment**: Docker image with Chromium + ffmpeg; Compose profile for web + worker + migrations.

**Tested** — 34 automated tests pass, including the six acceptance scenarios from the brief end to end (see [TESTING.md](TESTING.md)): WhatsApp webhook → queue → MD → agents → CRM/approvals → WhatsApp replies; MCP instruction and status; real 15-second MP4 renders in three formats. Production build passes.

**Not verified here (needs your credentials)** — live Claude reasoning quality (`npm run agent:smoke`), delivery through a real Meta WhatsApp number, voice-note transcription (OpenAI key), and Claude connecting to a deployed URL. The automated suite intercepts Meta's API and scripts the model's tool choices; it proves the workflow, not the model's judgement.

## Next phase
See [ROADMAP.md](ROADMAP.md).
