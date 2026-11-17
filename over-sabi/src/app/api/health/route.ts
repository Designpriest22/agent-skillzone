import { chatProvider } from "@/lib/ai";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { paymentsConfigured } from "@/lib/payments/service";
import { speechProvider } from "@/lib/speech";

/** Liveness + configuration report (no secrets). */
export async function GET() {
  let database = "ok";
  try {
    await db()`select 1`;
  } catch {
    database = "unreachable";
  }
  const e = env();
  const body = {
    status: database === "ok" ? "ok" : "degraded",
    database,
    integrations: {
      tutor: chatProvider()?.id ?? "not_configured",
      speech: speechProvider()?.id ?? "not_configured",
      email: e.RESEND_API_KEY ? "resend" : "not_configured",
      payments: paymentsConfigured() ? "paystack" : "not_configured",
      oauth: e.GOOGLE_CLIENT_ID ? "google" : "not_configured",
      storage: e.STORAGE_DRIVER,
    },
    time: new Date().toISOString(),
  };
  return Response.json(body, {
    status: database === "ok" ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
