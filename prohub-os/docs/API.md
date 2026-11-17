# API reference

All endpoints are served by the Next.js app. Dashboard pages use session cookies; programmatic access uses
personal access tokens (`phk_…`, created in **Settings → Command channels**, stored only as SHA-256 hashes).

## Claude connector — MCP server

| | |
|---|---|
| Endpoint | `POST /api/mcp` with `Authorization: Bearer phk_…` · or `POST /api/mcp/<token>` for URL-only clients (claude.ai / Claude Desktop custom connectors) |
| Transport | MCP Streamable HTTP, **stateless** (no session id), JSON responses |
| Identity | The token's user and role; every action is audited as that user |
| Rate limit | 120 requests / minute / user (per app instance) |

| Tool | Access | What it does |
|---|---|---|
| `send_instruction(instruction, agent?, wait_seconds?)` | manager+ | Gives the AI Managing Director (or one named agent) a task. Returns a 6-character reference. `wait_seconds` (≤50) waits for quick answers. |
| `get_instruction_status(ref)` | viewer+ | Every task by agent, split into **completed / pending / failed / awaiting approval**, plus pending approvals and the MD's verified final report. |
| `list_instructions(limit, mine_only)` | viewer+ | Recent instructions from all channels. |
| `task_board(since_hours)` | viewer+ | Workforce-wide completed, pending, failed and awaiting-approval tasks. |
| `business_snapshot()` | viewer+ | This month's actual revenue, expenses, net, target progress, outstanding/overdue invoices, pipeline *estimates*, leads, outreach, responses, deals, win rate, new/active/repeat clients, marketing spend, cost per lead, CAC, active projects, pending approvals. JSON included. |
| `pipeline(stage?, query?, limit)` | viewer+ | CRM search by stage and text. |
| `get_lead(id)` | viewer+ | Lead record with verified facts vs assumptions and contact history. |
| `list_approvals()` | viewer+ | Pending governed actions. |
| `decide_approval(ref, decision, note?)` | manager+ | `approve` (executes the real action), `reject`, or `request_changes` (returns to the agent as a tracked revision). **Level 3 is refused** — dashboard only. |
| `list_reports(kind?)` / `get_report(id)` / `generate_report(kind)` | viewer+ / viewer+ / viewer+ | Reports computed from the database; `get_report` renders sections as Markdown with a PDF link. |
| `list_agents()` / `set_agent_status(agent, status)` | viewer+ / manager+ | The workforce and its load; pause or reactivate an agent. |
| `list_deliverables(status?, kind?)` / `get_deliverable(id)` | viewer+ | Work produced, with QC and file links (e.g. MP4s per aspect ratio). |
| `outstanding_payments(overdue_only)` | viewer+ | Sent/partially-paid invoices with amounts and due dates. |
| `search_knowledge(query)` | viewer+ | Company profile, services, pricing policy, brand guidelines, SOPs. |

## Webhooks

| Endpoint | Caller | Notes |
|---|---|---|
| `GET /api/webhooks/meta` | Meta | Subscription handshake (`hub.verify_token` = `WHATSAPP_VERIFY_TOKEN` or `META_VERIFY_TOKEN`). |
| `POST /api/webhooks/meta` | Meta | WhatsApp messages (queued as `whatsapp.inbound`, de-duplicated by message id), Facebook/Instagram comments and DMs. Requires a valid `X-Hub-Signature-256` in production (`META_APP_SECRET`). |
| `POST /api/webhooks/paystack` | Paystack | Verified payment events → ledger income (the only automatic source of "paid"). |

## Files

| Endpoint | Access | Notes |
|---|---|---|
| `GET /api/files/<id>` | signed-in users | Rendered videos, posters, report PDFs, media received on WhatsApp. Supports HTTP Range (video seeking). `?download` forces a download. |
| `GET /api/files/t/<token>` | anyone with the capability token | For external fetchers. Tokens are 24 random bytes. |

## Other endpoints

| Endpoint | Notes |
|---|---|
| `POST /api/public/enquiry` | Website lead form → CRM lead + Client Manager triage task. Rate-limited. |
| `GET /api/reports/<id>/<pdf\|xlsx\|csv>` | Report downloads (signed-in users). |
| `GET /api/cron/tick` | Serverless mode: runs due schedules and drains the queue. `Authorization: Bearer $CRON_SECRET`. |
| `GET /api/health` | Database and AI configuration status. |

## Job types (worker)

`task.run` · `approval.execute` · `cycle.morning` (07:00) · `cycle.assignments` (08:00) · `cycle.midday` (12:00) · `cycle.evening` (17:00) · `followups.check` · `invoices.check` · `content.publish_due` · `report.generate` · `whatsapp.inbound` · `channel.notify` (WhatsApp progress for WhatsApp-issued commands) · `channel.approval` (approval buttons to authorised numbers).
