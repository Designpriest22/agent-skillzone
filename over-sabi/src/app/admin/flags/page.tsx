import { AdminButton } from "@/components/admin/AdminControls";
import { Badge, Card, PageHeader } from "@/components/ui/primitives";
import { chatProvider } from "@/lib/ai";
import { requireAdminPage } from "@/lib/auth/admin-guard";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { paymentsConfigured } from "@/lib/payments/service";
import { speechProvider } from "@/lib/speech";

export const metadata = { title: "Flags & providers" };
export const dynamic = "force-dynamic";

export default async function FlagsPage() {
  await requireAdminPage("admin");
  const flags = await db()`select * from feature_flags order by key`;
  const e = env();
  const chat = chatProvider();
  const speech = speechProvider();
  const providers = [
    ["AI tutor", chat ? `${chat.id} · ${chat.model}` : "not configured (set ANTHROPIC_API_KEY)"],
    [
      "Speech",
      speech
        ? `${speech.id} · STT claims: ${speech.vendorSttLanguages.join(", ")} · TTS claims: ${speech.vendorTtsLanguages.join(", ")}`
        : "not configured (set SPEECH_PROVIDER + key)",
    ],
    ["Email", e.RESEND_API_KEY ? "resend" : "not configured (dev console only)"],
    ["Payments", paymentsConfigured() ? "paystack" : "not configured"],
    ["Google sign-in", e.GOOGLE_CLIENT_ID ? "configured" : "not configured"],
    ["Storage", e.STORAGE_DRIVER],
    ["Transcript retention", `${e.TRANSCRIPT_RETENTION_DAYS} days`],
    ["Cron", e.CRON_SECRET ? "secret set" : "CRON_SECRET not set — daily jobs can't run"],
  ];
  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="Operations" title="Feature flags & providers">
        Provider configuration comes from environment variables, so secrets never live in the database or the
        browser.
      </PageHeader>
      <section>
        <h2 className="mb-3 text-xl font-bold">Providers</h2>
        <Card className="divide-y divide-border p-0">
          {providers.map(([k, v]) => (
            <p key={k} className="flex justify-between gap-4 px-4 py-3 text-sm">
              <strong>{k}</strong>
              <span className="text-right text-muted">{v}</span>
            </p>
          ))}
        </Card>
      </section>
      <section>
        <h2 className="mb-3 text-xl font-bold">Flags</h2>
        <ul className="flex flex-col gap-2">
          {flags.map((f) => (
            <Card key={f.key} className="flex flex-wrap items-center justify-between gap-3">
              <span>
                <strong className="font-mono">{f.key}</strong>{" "}
                <Badge tone={f.enabled ? "success" : "neutral"}>{f.enabled ? "on" : "off"}</Badge>
                <span className="block text-sm text-muted">{f.description}</span>
              </span>
              <AdminButton
                action="set_flag"
                input={{ key: f.key, enabled: !f.enabled }}
                label={f.enabled ? "Turn off" : "Turn on"}
              />
            </Card>
          ))}
        </ul>
      </section>
    </div>
  );
}
