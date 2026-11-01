# Integrations setup

You can enter credentials in two places: **Integrations** in the dashboard (owner only, encrypted with AES-256-GCM) or **environment variables**. Values saved in the dashboard take precedence over environment variables. After saving, press **Test connection**.

The system uses official APIs only. Where a platform does not allow automated access (or the access is still waiting for app review), approved content goes to the **manual-publish queue**. Its caption and assets are ready to post by hand, and you can then mark it published and enter its metrics.

## Anthropic (required for agents)
Create a key at platform.claude.com, then set `ANTHROPIC_API_KEY`. Agents use Claude Opus 5.5 by default. You can change the model and effort per agent on its workforce page. Web search and web fetch are billed by Anthropic (web search costs about $0.01 per search).

## Email — SMTP (Gmail, Google Workspace, Zoho, SES, etc.)
- **Gmail / Workspace:** turn on 2-Step Verification, create an **App password**, then set `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_USER=you@domain`, `SMTP_PASS=<app password>` and `SMTP_FROM="Prohub Creative Solutions <you@domain>"`.
- For bulk outreach, use a transactional provider such as Amazon SES, Postmark or Zoho ZeptoMail, with SPF, DKIM and DMARC set on your domain.
- **Used for:** approved outreach emails, proposals, invoices, and report delivery (Settings → Operations → Report email).

## WhatsApp Business Cloud API — command centre + customer channel
This uses the official Cloud API only (no unofficial automation that risks a ban). One business number does two jobs:
**authorised numbers** (you, your managers) command the system, and **everyone else** is treated as a customer whose messages become CRM enquiries.

1. In Meta for Developers, create an app (type *Business*) and add **WhatsApp**. Add and verify your business phone number.
2. Create a permanent **System User** token with `whatsapp_business_messaging` and `whatsapp_business_management`. Set `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` (or enter them under **Integrations**).
3. **Webhook:** callback URL `https://<APP_URL>/api/webhooks/meta`, verify token = `WHATSAPP_VERIFY_TOKEN`, subscribe to the **messages** field. Set `META_APP_SECRET` — in production, unsigned webhook calls are rejected.
4. **Authorise your phone:** Settings → **Command channels** → add your number in international format (`2348012345678`) and pick the user it acts as. Or set `WHATSAPP_OWNER_NUMBERS=2348012345678` before `npm run setup` to bind it to the owner account. Each number acts with that user's role (viewer = read-only, manager = instructions + Level-2 approvals, owner = everything except Level-3, which always needs the dashboard).
5. **Out-of-window updates (recommended):** WhatsApp only allows free-form messages within 24 hours of your last message to the number. For the 17:00 report and alerts on quiet days, create a **utility template** in WhatsApp Manager with one body variable — e.g. name `prohub_update`, body `Prohub AI update: {{1}}` — and set `WHATSAPP_OWNER_TEMPLATE=prohub_update` (and `WHATSAPP_TEMPLATE_LANGUAGE`, default `en`). The system falls back to it automatically when Meta reports the window is closed.
6. **Voice notes (optional):** voice notes are transcribed with OpenAI's speech-to-text when `OPENAI_API_KEY` is set (`OPENAI_TRANSCRIBE_MODEL`, default `gpt-4o-mini-transcribe`). Claude does not accept audio input directly. Without a key, the system asks for typed instructions.
7. `WHATSAPP_PUBLIC_NUMBER` turns on click-to-chat on the website.

What the channel supports: text, images and PDFs (shown to the Managing Director as real images/documents), video (stored and linked), voice notes (transcribed), interactive **Approve / Reject / Request changes** buttons, PDF reports, rendered video previews (≤16 MB, larger files are sent as links), and task notifications. Inbound messages are processed on the job queue and de-duplicated by message ID, because Meta re-delivers webhooks.

- **Policy:** messages to a customer outside the 24-hour customer-service window need a **Meta-approved template**. Agents propose template sends; nothing goes to a customer without your approval.

## Claude connector (MCP) — the Claude command centre
Prohub OS exposes a remote **MCP server** at `https://<APP_URL>/api/mcp` (Streamable HTTP, stateless). Claude can then give instructions to the Managing Director, follow progress, read the business, and decide Level-2 approvals — acting as you.

1. In Prohub OS: Settings → **Command channels** → *Claude command centre* → **Create token**. Copy it (it is shown once; only a hash is stored). Revoke tokens there at any time.
2. Connect Claude:
   - **Claude Code:** `claude mcp add --transport http prohub https://<APP_URL>/api/mcp --header "Authorization: Bearer phk_…"`
   - **claude.ai / Claude Desktop** (Settings → Connectors → *Add custom connector*): use the URL form with the token in the path, `https://<APP_URL>/api/mcp/phk_…`. Treat that URL as a password.
3. Ask Claude things like *"Ask Prohub to find 20 potential clients for our branding services"*, *"What's waiting for my approval?"*, *"Give me today's business snapshot"*.

Tools: `send_instruction`, `get_instruction_status`, `list_instructions`, `task_board`, `business_snapshot`, `pipeline`, `get_lead`, `list_approvals`, `decide_approval`, `list_reports`, `get_report`, `generate_report`, `list_agents`, `set_agent_status`, `list_deliverables`, `get_deliverable`, `outstanding_payments`, `search_knowledge`. See [API.md](API.md).

## Meta — Facebook Page & Instagram
1. Use the same or another Meta app. Get a long-lived **Page access token** with `pages_manage_posts`, `pages_read_engagement`, `instagram_basic` and `instagram_content_publish`.
2. Set `META_PAGE_ID`, `META_PAGE_ACCESS_TOKEN` and `META_IG_USER_ID` (the Instagram Business account linked to the Page).
3. Webhooks (Page: `feed`, `messages`; Instagram: `comments`, `messages`) go to `/api/webhooks/meta` with `META_VERIFY_TOKEN`.
- Instagram publishing requires a **public image URL**. Content without one goes to the manual queue.

## LinkedIn
This needs Community Management API access, which LinkedIn must approve. Set `LINKEDIN_ACCESS_TOKEN` (scope `w_organization_social`) and `LINKEDIN_ORG_URN` (`urn:li:organization:<id>`). Tokens expire after 60 days, so refresh them as needed.

## TikTok, YouTube, X, Pinterest
Status: *planned*. Direct posting needs app review or OAuth consent. Until then, approved items go to the manual-publish queue.

## Paystack
1. Set `PAYSTACK_SECRET_KEY`.
2. In Paystack → Settings → API Keys & Webhooks, set the webhook URL to `https://<APP_URL>/api/webhooks/paystack`.
3. When an approved invoice is sent, the system creates a payment link. When a payment succeeds, the webhook is signature-verified, re-verified with Paystack's API, and recorded once as income against the invoice.
- Payments in currencies other than NGN are not auto-recorded (there is no trusted FX rate). The owner gets an alert to record them manually.

## Image generation — OpenAI
Set `OPENAI_API_KEY` (optionally `OPENAI_IMAGE_MODEL`, default `gpt-image-1`). The Graphic Design and Social Media agents will then generate art-directed images. Without it, they produce SVG layouts and design briefs.

## Video production
**Built in, no API needed:** the Video Production agent's `render_video` tool renders finished motion-graphics MP4s (H.264, 9:16 / 1:1 / 4:5 / 16:9) from a storyboard, in the client's brand palette, using headless Chromium and ffmpeg in the worker. Both are included in the Docker image; on other hosts install `chromium` and `ffmpeg` and set `CHROMIUM_PATH` if Chromium is not on the default path. Check a host with `npm run video:sample`. Each render's QC checklist (resolution, duration, codec, file size, text density, CTA, palette) is measured from the actual file with ffprobe.

**AI-generated footage (optional):** `generateVideo()` in `src/integrations/creative.ts` is a generic HTTP adapter: it POSTs `{prompt, aspect_ratio, duration_seconds, image_url}` to `VIDEO_API_URL` with `Authorization: Bearer VIDEO_API_KEY` and expects `{id}` or `{url}`. Provider APIs differ, so put a small gateway in front of your provider (Runway, Luma, Kling, Higgsfield) or edit `generateVideo()`. Generated clips and photos can be stored and used as scene backgrounds in renders.

## Telegram (owner notifications)
Create a bot with @BotFather and set `TELEGRAM_BOT_TOKEN`. Send the bot a message, then read your chat ID from `https://api.telegram.org/bot<token>/getUpdates` and set `TELEGRAM_CHAT_ID`. You will receive approvals, alerts and daily briefing digests.

## Slack
Create an Incoming Webhook and set `SLACK_WEBHOOK_URL`. It receives the same notifications as Telegram.

## GitHub & Vercel (client websites)
`GITHUB_TOKEN` (fine-grained, contents read/write on one repo), `GITHUB_REPO=owner/repo`, `GITHUB_BRANCH` and `VERCEL_DEPLOY_HOOK_URL`. The Web Development agent can then request approval to commit files and trigger a redeploy.

## Google Workspace
Status: *planned* (OAuth). Reports are downloadable as PDF, Excel and CSV in the meantime.

## Adding a new integration
1. Add a definition to `INTEGRATIONS` in `src/integrations/registry.ts`, with its fields and their environment variables.
2. Write an adapter in `src/integrations/<name>.ts` that uses `requireCredentials(slug)`.
3. If it acts on the outside world, add a governed action to `ACTION_POLICY` and an executor in `src/governance/actions.ts`.
4. Expose it to agents as a tool in `src/agents/tools/*` and add the tool to the relevant agents in `definitions.ts`.
5. Optionally add a connectivity check to `src/integrations/test.ts`.
