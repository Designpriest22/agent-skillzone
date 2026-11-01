# Roadmap

## Now (first two weeks after go-live)
1. **Turn it on:** add the Anthropic key, SMTP and Telegram; fill in the Company profile and Brand guidelines in the Knowledge base; set this month's revenue target and service prices.
2. **Calibrate:** run `npm run agent:smoke`, then 3–5 real commands. Review transcripts and costs on each agent page; adjust effort, budgets and standing instructions.
3. **Build an eval set** from the first 20 real tasks (good vs bad outcomes) so prompt and model changes can be measured, not guessed.

## v1.1 — Revenue engine depth
- Inbound email ingestion (IMAP/Gmail API) so replies to outreach land in contact history automatically.
- WhatsApp template management and 24-hour session tracking in the UI.
- Proposal PDF generation with Prohub branding; e-signature integration (L3).
- Lead enrichment adapters (public business directories, CAC company search where permitted).
- Public procurement portal monitors (scheduled fetch + diffing) feeding the Intelligence Centre.

## v1.2 — Creative production
- Asset storage (Supabase Storage / S3) for uploaded brand files and generated media; public URLs for Instagram publishing.
- Rendering SVG → PNG for social posts; multi-size export per platform.
- Provider-specific video adapters (Runway, Luma, Higgsfield) with job polling.
- Client review portal: share deliverables with clients for approval without dashboard access.

## v1.3 — Intelligence & learning
- pgvector embeddings for semantic retrieval; automatic lesson extraction after won/lost deals and approved/rejected deliverables.
- Platform analytics import (Meta Insights, LinkedIn, YouTube) on a schedule for real engagement metrics.
- Google Workspace OAuth: Drive export of reports, Sheets sync, Calendar meetings.
- Accounting sync (e.g. Zoho Books / QuickBooks) as an alternative ledger source.

## v2 — Platform
- Multi-business tenancy (the `businesses` table is in place; scope all rows by business).
- Per-business agent rosters and custom agents defined from the UI.
- Managed Agents sandbox for the Web Development agent to build, test and deploy full client sites.
- SSO / 2FA, granular per-tool permissions per role, IP allow-listing.
