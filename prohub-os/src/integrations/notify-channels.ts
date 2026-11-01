import { httpJson } from "./http";
import { getCredentials } from "./registry";

export async function sendTelegram(text: string): Promise<boolean> {
  const c = await getCredentials("telegram");
  if (!c) return false;
  await httpJson(`https://api.telegram.org/bot${c.botToken}/sendMessage`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: c.chatId, text: text.slice(0, 4000), disable_web_page_preview: true }),
  });
  return true;
}

export async function sendSlack(text: string): Promise<boolean> {
  const c = await getCredentials("slack");
  if (!c) return false;
  const res = await fetch(c.webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
  if (!res.ok) throw new Error(`Slack webhook responded ${res.status}`);
  return true;
}
