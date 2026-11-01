# Architecture & technical decisions

## 1. Research summary: how to build the agent layer

| Option | Strengths | Why not (for v1) |
|---|---|---|
| **LangGraph / LangChain** | Graph-based orchestration, ecosystem | Heavy abstraction, Python-first, hard to enforce our completion-verification and permission semantics inside its nodes; extra dependency surface. |
| **CrewAI / AutoGen** | Fast multi-agent prototyping | Role-play conversations between agents are expensive and hard to audit; weak guarantees about side effects. |
| **Claude Managed Agents** | Anthropic hosts loop + sandbox, scheduled deployments | Strong fit for coding/file-heavy agents, but our agents' "tools" are business-database operations that must run inside our trust boundary with our approval gates. Good future option for the Web Development agent's build sandbox. |
| **Claude Agent SDK** | Batteries-included (files, bash) | Built for coding agents; we need narrow business tools, not shell access. |
| **Claude Messages API + our own loop** ✅ | Full control of every tool call, budget, approval gate and verification; one dependency | We own ~250 lines of loop code (`src/agents/runtime.ts`). |

**Decision:** a thin, explicit orchestrator over the Claude Messages API with tool use. Coordination happens through **durable tasks in PostgreSQL** (not chat between agents), which makes every step inspectable, resumable and auditable.

### Model choice
- Default: **Claude Opus 5.5** (`claude-opus-5-5`) for all agents, with per-agent `effort` (MD `high`, others `medium`). Opus 5.5 is priced at $4/$20 per MTok, and lower effort keeps routine agents cheap without switching model families (one cache namespace).
- Owner-configurable per agent in the dashboard: Sonnet 5.5 (~50% cheaper), Haiku 5.5 (high volume, lowest cost), Fable 5.1 (most capable, premium).
- **Server tools:** Anthropic-hosted `web_search_20260209` / `web_fetch_20260209` (Lagos user location) give research agents real web access with no scraping infrastructure.
- **Refusal fallbacks:** requests use `fallbacks: "default"` (beta `server-side-fallback-2026-07-01`) where supported; a final `refusal` stop reason fails the task with a clear message.
- **Prompt caching:** top-level `cache_control` caches tools + a stable system prompt (shared charter → job description → pinned knowledge). Volatile content (time, inbox, memories) goes in the user turn.

### Cost controls
- Per-agent **daily USD budget** (tasks defer to next morning when exhausted), **max turns** per task, **error-streak circuit breaker** (4 consecutive all-error turns), capped `max_uses` on web search/fetch, **delegation depth ≤ 3** and **≤ 30 tasks per command**.
- Every run records tokens (incl. cache reads), web searches and estimated USD cost (`agent_runs`), visible per agent.

## 2. System architecture

```
 Owner (dashboard, Telegram/Slack/email notifications)
   │ natural-language command / approvals
   ▼
 Next.js app (App Router, server actions, API routes)         Public site + webhooks
   │                                                          (enquiry form, WhatsApp/Meta, Paystack)
   ▼                                                                   │
 PostgreSQL ◀──────────── single source of truth ─────────────────────┘
   ▲   tasks · commands · jobs · schedules · CRM · finance · deliverables · knowledge · approvals · audit log
   │
 Worker (npm run worker | embedded | /api/cron/tick)
   ├─ scheduler: due schedules → jobs (dedupe per slot)
   ├─ queue: FOR UPDATE SKIP LOCKED, retries w/ backoff, dead-letter, stale-lock recovery
   └─ handlers: task.run → Agent runtime (Claude tool loop) → tools → DB / approvals / integrations
                approval.execute → governed action executors → integrations (email, WhatsApp, Meta, …)
```

### Why PostgreSQL as the queue (instead of Redis + Celery)
One fewer service to host and pay for, jobs are transactional with business data, and `SKIP LOCKED` scales to multiple workers. The queue module is isolated (`src/orchestrator/queue.ts`) if a broker is ever needed.

### Worker deployment modes
- `standalone` (recommended): separate long-running process.
- `embedded`: worker starts inside the Next.js server via `instrumentation.ts` (single-service hosts).
- `cron`: serverless — `/api/cron/tick` drains the queue for ~50 s per call (Vercel Cron every minute).

## 3. Orchestration model

**Commands** → root task for the Managing Director.
**Tasks** have an explicit lifecycle:

`proposed → approved → queued → in_progress → (awaiting_subtasks) → completed | failed`, plus `rejected`, `cancelled`.

- **Managers** (MD, Ops) delegate with `delegate_task` (immediately `approved`) and optional `depends_on`; they call `await_subtasks` and are **re-invoked automatically** with child results when all children finish (`maybeResumeParent`).
- **Department agents** request help with `request_collaboration` → `proposed` task → the Operations Manager reviews it (auto-enqueued) or the owner approves it.
- **Dependencies:** a task is queued only when its prerequisites complete; if one fails, dependents fail with a clear reason.
- **Verification:** `complete_task` must list output IDs (`deliverable`, `lead`, `approval`, …). The orchestrator checks each exists; otherwise the tool returns an error to the model. Results are stored in `tasks.verification`.
- **Inter-agent messages:** `send_agent_message` → inbox delivered at the start of the recipient's next task.
- **Recovery:** transient API errors (429/5xx/network) re-queue with exponential backoff; permanent errors fail the task with the message; the owner can **retry** failed tasks and failed approval executions from the UI.

## 4. Agents

| Slug | Role | Notable tools |
|---|---|---|
| managing-director | AI Managing Director | delegate, await, review deliverables, finance/sales/target/ops analytics, report narrative, web |
| operations-manager | AI Operations Manager | review proposed tasks, delegate, workload, projects |
| research | Research Analyst | web search/fetch, record_intel, lead audit updates |
| sales-marketing | Sales & Marketing Lead | web, create/update leads (evidence-required), campaigns, follow-ups |
| client-management | Client Manager | CRM, interactions, follow-ups, proposals, outbound email/WhatsApp requests, projects, invoices |
| content | Content Strategist | content calendar, brand assets |
| copywriting | Copywriter | deliverables with QC, brand assets |
| graphic-design | Graphic Designer | SVG layouts (sanitised), image generation, brand library |
| video-production | Video Producer | scripts/storyboards, video generation |
| social-media | Social Media Manager | calendar, publish requests, social leads |
| web-development | Web Developer | structured landing pages on Prohub's site, publish requests, GitHub commit requests |
| finance | Finance & Business Manager | finance analytics, invoices (draft/send request), owner authorisations |

Every agent also has: `complete_task`, `fail_task`, `save_deliverable` (QC checklist required for creative work), `read_record`, `search_knowledge`, `save_memory`, `add_knowledge`, `send_agent_message`, `list_services`, `list_recent_deliverables`.

## 5. Data model (main tables)

`users, sessions` · `businesses` (multi-business ready) · `agents, agent_runs, agent_messages, agent_memories` · `commands, tasks` · `knowledge_docs` (FTS) · `leads, clients, interactions, follow_ups, proposals` · `projects, deliverables, brand_assets` · `campaigns, social_accounts, content_items, site_pages, portfolio_items, testimonials` · `invoices, transactions, revenue_targets` · `intel_items` · `approvals, activity_log, notifications` · `integration_configs` (encrypted) · `jobs, schedules, reports`.

Money is stored as integer **kobo** (`bigint`); non-NGN transactions store currency, FX rate and the NGN base amount.

## 6. Knowledge & RAG
- **Pinned docs** (company profile, brand guidelines, services, pricing policy) are injected into every agent's system prompt (cached).
- **Retrieval:** PostgreSQL full-text search (`websearch_to_tsquery`, GIN index) over shared docs and per-agent memories, with an ILIKE fallback. Zero additional infrastructure or embedding cost.
- **Upgrade path:** add `pgvector` (Supabase supports it) and an embeddings provider; `src/agents/memory.ts` is the only module to change.

## 7. Security
See [SECURITY.md](SECURITY.md): scrypt password hashing, DB-backed httpOnly sessions, role checks on every server action, AES-256-GCM credential encryption, signed-webhook verification (Paystack HMAC-SHA512, Meta HMAC-SHA256), rate limiting on login and the public form, honeypot, sandboxed rendering of agent HTML/SVG, structured (non-HTML) landing pages, append-only audit log.

## 8. Frontend
Next.js 16 App Router, React 19 server components + server actions, Tailwind CSS v4 design tokens (light/dark), shadcn-style local primitives (`src/components/ui.tsx`), hand-rolled SVG charts that only render recorded data. Live views auto-refresh while agents work.
