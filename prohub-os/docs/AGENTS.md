# The AI workforce — agent instructions

The authoritative, versioned job descriptions live in [`src/agents/definitions.ts`](../src/agents/definitions.ts)
(mission, responsibilities, objectives, KPIs, quality bar, tool belt, model, budget). The shared operating charter
every agent receives is in [`src/agents/prompts.ts`](../src/agents/prompts.ts). Owners can append standing
instructions per agent from the dashboard (Workforce → agent → *Extra instructions*), and change model, effort,
turn limit, daily budget and status.

## How the brief's roles map to agents

| Brief | Agent (slug) | Default model | Key tools |
|---|---|---|---|
| **PROHUB AI — the Managing Director** | Adaeze (`managing-director`) | Opus | delegate_task (+ depends_on), await_subtasks, review_deliverable, finance/sales/target/ops analytics, report narrative, web search |
| 1. Video Production & Animation Director | Segun (`video-production`) | Sonnet | **render_video** (MP4s in 9:16, 1:1, 4:5, 16:9; styles `cinematic` / `studio` / `classic`), generate_video (AI footage provider), brand_assets |
| 2. Content Creation Director | Bisi (`content`) | Sonnet | content calendar, deliverables, brand assets, record_intel |
| 3. Copywriting Specialist | Femi (`copywriting`) | Opus | deliverables with QC (no stock AI phrasing), brand assets, lead history |
| 4. Sales & Marketing Director | Chidi (`sales-marketing`) | Sonnet | web research, create/update leads (evidence required), follow-ups, campaigns, campaign launch requests, sales metrics |
| 5. Client Relationship Manager | Ngozi (`client-management`) | Sonnet | CRM, interactions, follow-ups, proposals, approval-gated email/WhatsApp, projects, invoices |
| 6. Social Media Manager | Amaka (`social-media`) | Sonnet | content items, publish requests (approval), calendar, image generation, social leads |
| 7. Graphic Design Director | Ife (`graphic-design`) | Sonnet | SVG layouts (sanitised), image generation, brand library |
| 8. Web Development Director | Dayo (`web-development`) | Sonnet | landing pages on the agency site, publish requests, GitHub commit requests |
| 9. Business Operations Manager (COO) | Tunde (`operations-manager`) **+** Ibrahim (`finance`) | Sonnet / Haiku | Operations: proposed-task review, workload, deadlines, midday progress cycle. Finance: ledger analytics, invoices, receivables, P&L narrative. |
| §6 Daily Business Research Engine | Kemi (`research`) | Sonnet | web search/fetch, **record_intel** (topic, findings, sources, opportunity, cost, revenue, action, priority) |

The COO role is split in two so that money questions are always answered by an agent whose only job is
recorded figures, while operations work (triage, unblocking, deadlines) runs on its own budget. Both report to
the Managing Director.

## Creative productions are team work

Every ad or video runs through the creative team, coordinated by the Managing Director:
**brief → Copywriting** (lines and script) **→ Graphic Design** (art direction and brand check — logo, palette, type)
**→ Video Production** (motion in the house style + sound design, measured QC) **→ Managing Director review**
against the brief before anything is reported as done. Sound design is on by default for every render: SFX are
spotted to cuts, word slams, counters, callouts and logo reveals and mixed under the music to -14 LUFS; the cue
sheet and measured loudness appear on the deliverable for review.

## Rules every agent works under (enforced in code, not just prompts)

- **Verified completion.** A task finishes only via `complete_task` listing the IDs of records it produced; the
  orchestrator checks each exists. A plan or draft cannot be reported as a finished deliverable.
- **Approval levels.** L1 autonomous (research, drafts, internal records) · L2 approval required (publishing,
  outbound messages, proposals, invoices, pricing, delivery dates, campaigns) · L3 owner-only in the dashboard
  (payments, contracts, refunds, ledger changes, access, deleting critical data).
- **No fabricated data.** Leads need source URLs; verified facts are kept apart from assumptions; revenue comes only
  from the ledger; pipeline values are labelled estimates; platform metrics only from APIs or sourced manual entry.
- **Pricing.** Agents quote only owner-configured prices; anything else is marked *indicative — pending owner
  confirmation*, and proposals need approval.
- **Cost limits.** Per-agent daily budget, turn limit, error-streak circuit breaker, delegation depth ≤ 3,
  ≤ 30 tasks per instruction.

## Performance indicators

Each agent's page shows its KPIs (computed from the database), task success rate, cost and recent transcripts.
The Managing Director's evening review and the Operations Manager's midday cycle use `agent_workload` and task
outcomes to flag under-performing agents and re-delegate failed work.
