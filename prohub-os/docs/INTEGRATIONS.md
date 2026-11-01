# Integrations setup

You can enter credentials in two places: **Integrations** in the dashboard (owner only, encrypted with AES-256-GCM) or **environment variables**. Values saved in the dashboard take precedence over environment variables. After saving, press **Test connection**.

The system uses official APIs only. Where a platform does not allow automated access (or the access is still waiting for app review), approved content goes to the **manual-publish queue**. Its caption and assets are ready to post by hand, and you can then mark it published and enter its metrics.

## Anthropic (required for agents)
Create a key at platform.claude.com, then set `ANTHROPIC_API_KEY`. Agents use Claude Opus 5.5 by default. You can change the model and effort per agent on its workforce page. Web search and web fetch are billed by Anthropic (web search costs about $0.01 per search).

## Email — SMTP (Gmail, Google Workspace, Zoho, SES, etc.)
- **Gmail / Workspace:** turn on 2-Step Verification, create an **App password**, then set `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_USER=you@domain`, `SMTP_PASS=<app password>` and `SMTP_FROM="Prohub Creative Solutions <you@domain>"`.
- For bulk outreach, use a transactional provider such as Amazon SES, Postmark or Zoho ZeptoMail, with SPF, DKIM and DMARC set on your domain.
- **Used for:** approved outreach emails, proposals, invoices, and report delivery (Settings → Operations → Report email).

## WhatsApp Business Cloud API
1. In Meta for Developers, create an app and add **WhatsApp**. Add your business phone number.
2. Create a permanent System User token with `whatsapp_business_messaging`. Set `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID`.
3. Webhook: callback URL `https://<APP_URL>/api/webhooks/meta`, verify token `WHATSAPP_VERIFY_TOKEN`, subscribe to `messages`. Set `META_APP_SECRET` so that signatures are verified.
4. `WHATSAPP_PUBLIC_NUMBER` turns on click-to-chat on the website.
- **Policy:** messages to a contact outside the 24-hour customer-service window need a **Meta-approved template**. Agents propose template sends, and you approve them.

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

## Video generation
`generateVideo()` in `src/integrations/creative.ts` is a generic HTTP adapter: it POSTs `{prompt, aspect_ratio, duration_seconds, image_url}` to `VIDEO_API_URL` with `Authorization: Bearer VIDEO_API_KEY`, and expects `{id}` or `{url}` back. Provider APIs differ, so either put a small gateway in front of your provider (Runway, Luma, Kling or Higgsfield) or edit `generateVideo()` to match its API. Without a provider, the Video agent delivers scripts, storyboards and animation briefs.

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
