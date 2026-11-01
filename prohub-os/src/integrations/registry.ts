/**
 * Modular integration registry. Adding a service = adding one definition here plus an adapter file.
 * Credentials resolve from (1) encrypted DB config set in the UI, then (2) environment variables.
 */
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { integrationConfigs } from "@/db/schema";
import { decryptJson } from "@/lib/crypto";

export type CredentialField = { key: string; label: string; envVar: string; secret?: boolean; required?: boolean; help?: string };

export type IntegrationDef = {
  slug: string;
  name: string;
  category: "ai" | "communication" | "marketing" | "business" | "payments" | "development" | "creative";
  description: string;
  /** implemented = working adapter; planned = documented structure, adapter not yet built. */
  maturity: "implemented" | "planned";
  usedBy: string[];
  fields: CredentialField[];
  docsUrl: string;
  notes?: string;
};

export const INTEGRATIONS: IntegrationDef[] = [
  {
    slug: "anthropic", name: "Anthropic Claude API", category: "ai", maturity: "implemented",
    description: "Reasoning engine for every agent, including server-side web search and web fetch for research.",
    usedBy: ["all agents"], docsUrl: "https://platform.claude.com/docs",
    fields: [{ key: "apiKey", label: "API key", envVar: "ANTHROPIC_API_KEY", secret: true, required: true }],
  },
  {
    slug: "openai_images", name: "OpenAI Images", category: "creative", maturity: "implemented",
    description: "Image generation for design concepts and social creatives (gpt-image models).",
    usedBy: ["graphic-design", "social-media"], docsUrl: "https://platform.openai.com/docs/guides/images",
    fields: [
      { key: "apiKey", label: "API key", envVar: "OPENAI_API_KEY", secret: true, required: true },
      { key: "model", label: "Model", envVar: "OPENAI_IMAGE_MODEL", help: "Default gpt-image-1" },
    ],
  },
  {
    slug: "video_provider", name: "Video generation provider", category: "creative", maturity: "implemented",
    description: "Generic HTTP adapter for an AI video API (Runway, Luma, Higgsfield, Kling via gateway). Sends prompt + spec, stores the returned job/URL.",
    usedBy: ["video-production"], docsUrl: "docs/INTEGRATIONS.md#video-generation",
    notes: "Provider APIs differ; the adapter POSTs {prompt, aspect_ratio, duration_seconds} JSON and expects {id|url}. Map your provider in generateVideo() (src/integrations/creative.ts).",
    fields: [
      { key: "endpoint", label: "Generation endpoint URL", envVar: "VIDEO_API_URL", required: true },
      { key: "apiKey", label: "API key (Bearer)", envVar: "VIDEO_API_KEY", secret: true, required: true },
    ],
  },
  {
    slug: "smtp", name: "Email (SMTP / Gmail)", category: "communication", maturity: "implemented",
    description: "Outbound email for proposals, outreach and report delivery. Works with Gmail (app password), Google Workspace, Zoho, SES, etc.",
    usedBy: ["client-management", "sales-marketing", "reports"], docsUrl: "docs/INTEGRATIONS.md#email",
    fields: [
      { key: "host", label: "SMTP host", envVar: "SMTP_HOST", required: true },
      { key: "port", label: "Port", envVar: "SMTP_PORT", required: true },
      { key: "user", label: "Username", envVar: "SMTP_USER", required: true },
      { key: "pass", label: "Password / app password", envVar: "SMTP_PASS", secret: true, required: true },
      { key: "from", label: "From address", envVar: "SMTP_FROM", required: true },
    ],
  },
  {
    slug: "whatsapp", name: "WhatsApp Business Cloud API", category: "communication", maturity: "implemented",
    description: "Send approved messages and receive enquiries via webhook. Outbound messages to new contacts require approved templates (Meta policy).",
    usedBy: ["client-management", "sales-marketing"], docsUrl: "https://developers.facebook.com/docs/whatsapp/cloud-api",
    fields: [
      { key: "accessToken", label: "Access token", envVar: "WHATSAPP_ACCESS_TOKEN", secret: true, required: true },
      { key: "phoneNumberId", label: "Phone number ID", envVar: "WHATSAPP_PHONE_NUMBER_ID", required: true },
      { key: "verifyToken", label: "Webhook verify token", envVar: "WHATSAPP_VERIFY_TOKEN", secret: true },
      { key: "appSecret", label: "App secret (webhook signature)", envVar: "META_APP_SECRET", secret: true },
      { key: "publicNumber", label: "Public WhatsApp number (for click-to-chat)", envVar: "WHATSAPP_PUBLIC_NUMBER" },
    ],
  },
  {
    slug: "telegram", name: "Telegram bot", category: "communication", maturity: "implemented",
    description: "Push approvals, alerts and the daily executive briefing to the owner's Telegram.",
    usedBy: ["notifications"], docsUrl: "https://core.telegram.org/bots/api",
    fields: [
      { key: "botToken", label: "Bot token", envVar: "TELEGRAM_BOT_TOKEN", secret: true, required: true },
      { key: "chatId", label: "Owner chat ID", envVar: "TELEGRAM_CHAT_ID", required: true },
    ],
  },
  {
    slug: "slack", name: "Slack", category: "communication", maturity: "implemented",
    description: "Post approvals, alerts and reports to a Slack channel via incoming webhook.",
    usedBy: ["notifications"], docsUrl: "https://api.slack.com/messaging/webhooks",
    fields: [{ key: "webhookUrl", label: "Incoming webhook URL", envVar: "SLACK_WEBHOOK_URL", secret: true, required: true }],
  },
  {
    slug: "meta", name: "Meta Graph API (Facebook & Instagram)", category: "marketing", maturity: "implemented",
    description: "Publish approved posts to a Facebook Page and Instagram Business account; receive comments/DMs via webhook.",
    usedBy: ["social-media"], docsUrl: "https://developers.facebook.com/docs/graph-api",
    notes: "Requires a Page access token with pages_manage_posts, instagram_content_publish. Instagram publishing requires a public media URL.",
    fields: [
      { key: "pageAccessToken", label: "Page access token", envVar: "META_PAGE_ACCESS_TOKEN", secret: true, required: true },
      { key: "pageId", label: "Facebook Page ID", envVar: "META_PAGE_ID", required: true },
      { key: "igUserId", label: "Instagram Business user ID", envVar: "META_IG_USER_ID" },
      { key: "verifyToken", label: "Webhook verify token", envVar: "META_VERIFY_TOKEN", secret: true },
      { key: "appSecret", label: "App secret", envVar: "META_APP_SECRET", secret: true },
    ],
  },
  {
    slug: "linkedin", name: "LinkedIn (Posts API)", category: "marketing", maturity: "implemented",
    description: "Publish approved posts to a LinkedIn organization page.",
    usedBy: ["social-media"], docsUrl: "https://learn.microsoft.com/linkedin/marketing/community-management/shares/posts-api",
    notes: "Requires an access token with w_organization_social (Community Management API access must be approved by LinkedIn).",
    fields: [
      { key: "accessToken", label: "Access token", envVar: "LINKEDIN_ACCESS_TOKEN", secret: true, required: true },
      { key: "organizationUrn", label: "Organization URN", envVar: "LINKEDIN_ORG_URN", required: true, help: "urn:li:organization:123" },
    ],
  },
  {
    slug: "tiktok", name: "TikTok Content Posting API", category: "marketing", maturity: "planned",
    description: "TikTok requires app review for direct posting. Until approved, approved TikTok items go to the manual-publish queue with captions and assets ready.",
    usedBy: ["social-media"], docsUrl: "https://developers.tiktok.com/doc/content-posting-api-get-started",
    fields: [{ key: "accessToken", label: "Access token", envVar: "TIKTOK_ACCESS_TOKEN", secret: true }],
  },
  {
    slug: "youtube", name: "YouTube Data API", category: "marketing", maturity: "planned",
    description: "Video uploads need OAuth consent; approved YouTube items use the manual-publish queue in this version.",
    usedBy: ["social-media", "video-production"], docsUrl: "https://developers.google.com/youtube/v3",
    fields: [{ key: "apiKey", label: "API key (read-only stats)", envVar: "YOUTUBE_API_KEY", secret: true }],
  },
  {
    slug: "paystack", name: "Paystack", category: "payments", maturity: "implemented",
    description: "Payment links for invoices; verified charge.success webhooks record income automatically.",
    usedBy: ["finance", "client-management"], docsUrl: "https://paystack.com/docs/api",
    fields: [{ key: "secretKey", label: "Secret key", envVar: "PAYSTACK_SECRET_KEY", secret: true, required: true }],
  },
  {
    slug: "vercel", name: "Vercel deploy hook", category: "development", maturity: "implemented",
    description: "Trigger a production redeploy after approved website changes (for externally hosted client sites).",
    usedBy: ["web-development"], docsUrl: "https://vercel.com/docs/deploy-hooks",
    fields: [{ key: "deployHookUrl", label: "Deploy hook URL", envVar: "VERCEL_DEPLOY_HOOK_URL", secret: true, required: true }],
  },
  {
    slug: "github", name: "GitHub", category: "development", maturity: "implemented",
    description: "Commit website files produced by the Web Development agent to a repository branch (approval required).",
    usedBy: ["web-development"], docsUrl: "https://docs.github.com/rest",
    fields: [
      { key: "token", label: "Fine-grained token (contents:write)", envVar: "GITHUB_TOKEN", secret: true, required: true },
      { key: "repo", label: "owner/repo", envVar: "GITHUB_REPO", required: true },
      { key: "branch", label: "Branch", envVar: "GITHUB_BRANCH" },
    ],
  },
  {
    slug: "google_workspace", name: "Google Drive / Sheets / Calendar", category: "business", maturity: "planned",
    description: "OAuth-based sync of reports to Drive/Sheets and meetings to Calendar. Until connected, reports download as PDF/XLSX/CSV and meetings are tracked in the CRM.",
    usedBy: ["reports", "client-management"], docsUrl: "https://developers.google.com/workspace",
    fields: [
      { key: "clientId", label: "OAuth client ID", envVar: "GOOGLE_CLIENT_ID" },
      { key: "clientSecret", label: "OAuth client secret", envVar: "GOOGLE_CLIENT_SECRET", secret: true },
    ],
  },
];

export function getIntegration(slug: string) {
  return INTEGRATIONS.find((i) => i.slug === slug);
}

export async function getCredentials(slug: string): Promise<Record<string, string> | null> {
  const def = getIntegration(slug);
  if (!def) return null;
  let stored: Record<string, string> = {};
  try {
    const [row] = await db.select().from(integrationConfigs).where(eq(integrationConfigs.slug, slug));
    if (row?.credentialsEncrypted) stored = decryptJson<Record<string, string>>(row.credentialsEncrypted);
    if (row && !row.enabled && row.credentialsEncrypted) return null; // explicitly disabled
  } catch (e) {
    console.error(`[integrations] could not read stored credentials for ${slug}:`, e instanceof Error ? e.message : e);
  }
  const out: Record<string, string> = {};
  for (const f of def.fields) {
    const v = stored[f.key] || process.env[f.envVar] || "";
    if (v) out[f.key] = v;
  }
  const missing = def.fields.filter((f) => f.required && !out[f.key]);
  return missing.length ? null : out;
}

export async function isConfigured(slug: string) {
  return (await getCredentials(slug)) !== null;
}

export class IntegrationNotConfigured extends Error {
  constructor(slug: string) {
    const def = getIntegration(slug);
    super(`${def?.name ?? slug} is not configured. Add credentials in Integrations (or env: ${def?.fields.filter((f) => f.required).map((f) => f.envVar).join(", ")}).`);
    this.name = "IntegrationNotConfigured";
  }
}

export async function requireCredentials(slug: string) {
  const c = await getCredentials(slug);
  if (!c) throw new IntegrationNotConfigured(slug);
  return c;
}
