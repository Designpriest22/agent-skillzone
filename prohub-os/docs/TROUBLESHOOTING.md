# Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Banner "AI engine not connected" | No Anthropic key | Set `ANTHROPIC_API_KEY` or add it in Integrations → Anthropic, then retry the failed tasks |
| Tasks stay **queued** | Worker not running | Start `npm run worker` (or use `WORKER_MODE=embedded` / the cron endpoint). Check `/api/health` → `lastJobClaim` |
| Task failed: "Daily budget … reached" (deferred) | Agent hit its USD budget | Raise the budget on the agent page, or wait for the 06:00 reset |
| Task failed: "Reached the turn limit" | Scope too broad | Narrow the instruction, or raise *Max turns* |
| Task failed: "Stopped after 4 consecutive turns of tool errors" | Repeated invalid tool use or a missing integration | Read the transcript; usually an integration needs credentials |
| Task failed: "Agent stopped without calling complete_task" | The model answered in text instead of producing records | Retry. If it repeats, add standing instructions or raise the effort |
| Approved action **failed** | Integration missing or rejected the call (e.g. SMTP auth, WhatsApp template) | Fix it in Integrations → Test connection, then Approvals → Retry execution |
| Instagram posts go to the manual queue | No public media URL / IG user ID not configured | Provide an image URL, or post manually and mark it published |
| WhatsApp message rejected | Outside the 24h window without an approved template | Use a Meta-approved template |
| Paystack payment not recorded | Webhook URL or secret wrong, or a non-NGN currency | Check the webhook settings; record non-NGN payments manually |
| Login says "Too many attempts" | Rate limit (8 per 15 min per IP) | Wait 15 minutes |
| `prepared statement … already exists` | Supabase transaction pooler | Set `DATABASE_PREPARE=false` |
| Stored credentials stopped working after a redeploy | `ENCRYPTION_KEY` changed | Restore the original key, or re-enter the credentials |
| Reports show ₦0 | No transactions recorded yet (by design) | Record payments in Finance or connect Paystack |

Logs: the web and worker processes log to stdout. Agent-level detail lives in each task's **Run → Transcript**. Every action is in **Activity & jobs**.
