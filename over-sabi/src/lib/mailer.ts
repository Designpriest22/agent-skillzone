import "server-only";
import { env } from "./env";
import { recordProviderEvent } from "./analytics";

export interface Mail {
  to: string;
  subject: string;
  text: string;
}

export type MailResult = { delivered: true } | { delivered: false; reason: "not_configured" | "failed" };

/**
 * Sends transactional email through Resend when RESEND_API_KEY is set. Without it,
 * in development the message is printed to the server console (clearly labelled) so
 * verification and reset links can be followed locally. Nothing is printed in
 * production — the caller is told delivery isn't configured.
 */
export async function sendMail(mail: Mail): Promise<MailResult> {
  const e = env();
  if (!e.RESEND_API_KEY) {
    if (e.NODE_ENV !== "production") {
      console.info(`\n[mailer:dev — not sent] To: ${mail.to}\nSubject: ${mail.subject}\n${mail.text}\n`);
    }
    return { delivered: false, reason: "not_configured" };
  }
  const started = Date.now();
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${e.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: e.EMAIL_FROM, to: [mail.to], subject: mail.subject, text: mail.text }),
    });
    if (!res.ok) throw new Error(`Resend responded ${res.status}`);
    await recordProviderEvent({
      provider: "resend",
      capability: "email",
      ok: true,
      latencyMs: Date.now() - started,
    });
    return { delivered: true };
  } catch (err) {
    await recordProviderEvent({ provider: "resend", capability: "email", ok: false, error: String(err) });
    return { delivered: false, reason: "failed" };
  }
}
