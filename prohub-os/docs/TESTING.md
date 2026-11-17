# Testing

```bash
docker compose up -d db        # or any PostgreSQL 14+; tests use prohub_test (TEST_DATABASE_URL to override)
npm test                       # 34 tests: unit, orchestration, governance, finance, reports, channels, acceptance
npm run typecheck
npm run video:sample           # renders three real MP4s and prints the measured QC (needs Chromium + ffmpeg)
npm run agent:smoke            # live check against the Claude API (needs ANTHROPIC_API_KEY; costs a few cents)
```

## What is real and what is substituted

| Layer | In the automated tests |
|---|---|
| PostgreSQL, migrations, job queue, scheduler, orchestrator, permissions, approvals, audit log | **Real** |
| WhatsApp webhook route, inbound processing, quick commands, approval buttons, progress messages | **Real** — only Meta's Graph API HTTP calls are intercepted and recorded |
| Claude connector (MCP server, token auth, tools) | **Real** — requests go through the same handler as `/api/mcp` |
| Video renderer (Chromium, ffmpeg, ffprobe-measured QC) | **Real** — the acceptance test renders three 15-second MP4s |
| The model's decisions | **Scripted** stand-in (`tests/helpers.ts`) that chooses tool calls per agent. This proves the workflow end to end deterministically. Judgement quality is checked live with `npm run agent:smoke` and by reviewing transcripts on each agent's page. |

## Acceptance tests (tests/acceptance.test.ts)

| # | Scenario from the brief | What the test proves |
|---|---|---|
| 1 | WhatsApp: *"Find 10 businesses in Abuja that may need branding services."* | Authorised number → MD → Sales delegation; 10 sourced leads in the CRM with follow-ups; the owner receives *received → assigned → finished → Done* with the verified lead count; `tasks` quick command reflects the state. |
| 2 | WhatsApp: *"Create an Instagram campaign for our branding services."* | Content → copy → design → social chain plus the marketing campaign record; 3 posts enter the approval queue; approval buttons reach WhatsApp; tapping **Approve** executes the governed action; *change <ref> …* rejects with notes and creates a tracked revision for the agent. |
| 3 | WhatsApp: *"Give me our business performance report."* | The MD answers from finance/sales/ops tools; the figures in the WhatsApp reply match the ledger; the Claude connector's `business_snapshot` and `outstanding_payments` return the same numbers, with pipeline labelled as estimates. |
| 4 | A new client messages the business | Lead created from WhatsApp with requirements and inbound interaction; Client Manager qualifies it, schedules a follow-up, and drafts a reply **for approval** (nothing is sent to the prospect); owner notified in-app and on WhatsApp; strangers can never issue commands. |
| 5 | Claude: *"Research five new ways we can generate revenue this month."* | Research publishes 5 structured findings (sources, opportunity, cost, revenue, action, priority); status read back through MCP. |
| 6 | Claude: *"Create a 15-second advertisement for a client."* | Copywriting → Video production; real MP4s in 9:16, 1:1 and 16:9 (15 s, H.264, < 16 MB) saved to the client's deliverable with all measured QC passing; status and deliverable readable through MCP. |

Plus channel security: missing or revoked tokens are refused; Level-3 approvals can't be authorised from chat;
viewer numbers can't issue instructions; webhook re-deliveries are processed exactly once.

## Running against live services

1. Add `ANTHROPIC_API_KEY` and run `npm run agent:smoke` (add `-- --research` for a web-research run).
2. Configure WhatsApp (docs/INTEGRATIONS.md), authorise your number, and repeat the six scenarios from your phone.
   The acceptance tests show exactly what you should see.
3. Review each run's transcript, cost and verified outputs on the agent's page before trusting it with outreach.
