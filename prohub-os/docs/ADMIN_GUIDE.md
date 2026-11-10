# Admin guide

## First-day setup (owner)
1. **Knowledge base:** edit *Company profile* and *Prohub brand guidelines*. Both are pinned, which means every agent reads them on every task. Add standard operating procedures (SOPs), past projects and client notes as unpinned documents; agents retrieve those by search when they need them.
2. **Settings → Services & pricing:** set indicative prices. Agents quote only prices you set; anything else they mark as *indicative — pending owner confirmation*.
3. **Settings → Revenue targets:** set the monthly target, average deal value, lead target and conversion target. The Managing Director tracks progress against these figures every evening.
4. **Settings → Operations:** set the daily prospect quota, which segments to prospect (rotated daily), and the email address that receives reports.
5. **Integrations:** add credentials and test each one.
6. **Settings → Users:** add managers (for approvals and day-to-day operations) and viewers (read-only).
7. **Marketing → Website:** add real portfolio items and verified testimonials. The website hides those sections until there is real content.

## Roles
| Role | Can |
|---|---|
| Owner | Everything, including Level-3 authorisations, the finance ledger, integration credentials, users, schedules, targets and pricing |
| Manager | Issue commands, approve Level-2 actions, manage the CRM, projects and deliverables, pause and resume agents, generate reports |
| Viewer | Read-only |

## Permission levels (agents)
- **L1 Autonomous:** research, analysis, drafts, internal records, task organisation, recommendations, lead identification.
- **L2 Approval required:** emails, WhatsApp messages, proposals, invoices to clients, social publishing, page publishing, campaign launches, code commits and deploys. Approved by an owner or manager.
- **L3 Owner only:** spending money, payments, contracts, refunds, changes to financial records, granting access, deleting critical data. Approving one records an **authorisation**. The system never moves money itself.

Every agent tool call, approval, decision, login and ledger entry is written to **Activity & jobs → Activity log**.

## Managing agents
On **AI workforce → agent**:
- **Pause** holds the agent's queued tasks and rechecks every 15 minutes. **Disable** fails new tasks with a clear message. **Resume** returns the agent to normal.
- **Model and effort:** the defaults are Opus 5.5 at medium effort (high for the Managing Director). Lower the effort or switch to Sonnet or Haiku for high-volume agents to cut cost.
- **Daily budget (USD):** once an agent reaches it, its tasks wait until the next morning.
- **Max turns:** the cap on model calls per task.
- **Standing instructions:** your own rules, appended to the agent's job description.
- **Runs:** tokens, web searches and cost for each run. Open any task to see its full transcript.

## Schedules
**Settings → Schedules** shows every recurring job, its cron expression (Africa/Lagos time), last run and next run. You can edit the cron expression, disable a schedule, or **Run now**. To stop all autonomous agent work while keeping reports and reminders, untick *Run morning, midday and evening agent cycles* in **Settings → Operations**.

| Schedule | Default |
|---|---|
| Morning intelligence (MD → Research, Sales) | 07:00 Mon–Sat |
| Midday execution (Operations Manager) | 12:00 Mon–Sat |
| Evening review + executive briefing | 18:00 daily |
| Daily financial report | 19:30 daily |
| Follow-up reminders | hourly at :15 |
| Overdue invoice check | 09:00 daily |
| Publish scheduled content | every 5 minutes |
| Weekly reports | Monday 08:00 |
| Monthly reports | 1st of month 08:00 |

## Finance rules
- Only the owner records transactions. Paystack payments in NGN are recorded automatically from verified webhooks.
- Agents can draft invoices and request to send them; they cannot mark anything paid.
- Use the category list so reports classify costs correctly. Direct costs (freelancers, production, media buying, project costs, printing, equipment rental) count towards gross profit.
- Link income to a **client**, **service** and **invoice**, and expenses to a **project** or **campaign**. Those links drive revenue-by-service, client lifetime value, project profitability and marketing ROI.

## Recovery
- **Failed task:** open it, read the error and transcript, fix the cause (often a missing integration), then press **Retry**.
- **Failed approved action:** **Approvals** shows the error; fix the cause and press **Retry execution**.
- **Dead job:** **Activity & jobs → Background jobs → Retry**.
- **Stuck job:** jobs locked for more than 30 minutes are re-queued automatically.

See also [BACKUP.md](BACKUP.md) and [TROUBLESHOOTING.md](TROUBLESHOOTING.md).
