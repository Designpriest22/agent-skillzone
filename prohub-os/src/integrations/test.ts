/** Connectivity checks for the Integrations page. Each makes a harmless read-only call. */
import Anthropic from "@anthropic-ai/sdk";
import { requireCredentials, getIntegration } from "./registry";
import { testSmtp } from "./email";
import { httpJson } from "./http";

export async function testIntegration(slug: string): Promise<string> {
  const def = getIntegration(slug);
  if (!def) throw new Error("Unknown integration");
  if (def.maturity === "planned") throw new Error(`${def.name} adapter is planned, not yet implemented — see docs/INTEGRATIONS.md.`);
  const c = await requireCredentials(slug);
  switch (slug) {
    case "anthropic": {
      const client = new Anthropic({ apiKey: c.apiKey, baseURL: process.env.ANTHROPIC_API_BASE_URL || undefined });
      const m = await client.models.retrieve(process.env.DEFAULT_AGENT_MODEL ?? "claude-opus-5-5");
      return `Connected — model ${m.id} available`;
    }
    case "smtp": return testSmtp();
    case "telegram": {
      const r = await httpJson<{ result: { username: string } }>(`https://api.telegram.org/bot${c.botToken}/getMe`);
      return `Connected as @${r.result.username}`;
    }
    case "slack": return "Webhook URL stored (Slack webhooks cannot be tested without posting a message).";
    case "whatsapp": {
      const r = await httpJson<{ display_phone_number?: string }>(`https://graph.facebook.com/v21.0/${c.phoneNumberId}?access_token=${encodeURIComponent(c.accessToken)}`);
      return `Connected — ${r.display_phone_number ?? "phone number found"}`;
    }
    case "meta": {
      const r = await httpJson<{ name: string }>(`https://graph.facebook.com/v21.0/${c.pageId}?fields=name&access_token=${encodeURIComponent(c.pageAccessToken)}`);
      return `Connected to Page "${r.name}"`;
    }
    case "linkedin": return "Token stored. LinkedIn tokens are validated on first publish.";
    case "paystack": {
      await httpJson("https://api.paystack.co/balance", { headers: { Authorization: `Bearer ${c.secretKey}` } });
      return "Connected to Paystack";
    }
    case "openai_images": {
      await httpJson("https://api.openai.com/v1/models", { headers: { Authorization: `Bearer ${c.apiKey}` } });
      return "Connected to OpenAI";
    }
    case "github": {
      const r = await httpJson<{ full_name: string }>(`https://api.github.com/repos/${c.repo}`, { headers: { Authorization: `Bearer ${c.token}`, Accept: "application/vnd.github+json" } });
      return `Connected to ${r.full_name}`;
    }
    case "vercel": return "Deploy hook stored (calling it would trigger a deployment, so it is not auto-tested).";
    case "video_provider": return "Endpoint and key stored. The first generate_video call validates them.";
    default: return "Credentials present";
  }
}
