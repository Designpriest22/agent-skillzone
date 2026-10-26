import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Liveness check for uptime monitoring. Reports whether form delivery is configured, without secrets. */
export function GET() {
  const forms = Boolean(process.env.FORMS_WEBHOOK_URL || (process.env.RESEND_API_KEY && process.env.FORMS_NOTIFY_TO) || process.env.FORMS_FILE_STORE === "1");
  return NextResponse.json({ ok: true, formsDelivery: forms ? "configured" : "not_configured" }, { headers: { "cache-control": "no-store" } });
}
