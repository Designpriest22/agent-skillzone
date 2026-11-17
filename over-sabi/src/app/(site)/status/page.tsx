import type { Metadata } from "next";
import { Badge, Card, PageHeader } from "@/components/ui/primitives";
import { chatProvider } from "@/lib/ai";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { paymentsConfigured } from "@/lib/payments/service";
import { speechProvider } from "@/lib/speech";

export const metadata: Metadata = { title: "Service status" };
export const dynamic = "force-dynamic";

export default async function StatusPage() {
  const recent = await db()`
    select capability, count(*)::int as total, count(*) filter (where ok)::int as ok
    from provider_events where created_at > now() - interval '24 hours' group by capability`;
  const byCap = new Map(recent.map((r) => [r.capability as string, r]));
  const services = [
    { name: "Lessons and progress", configured: true, cap: null },
    { name: "AI tutor", configured: !!chatProvider(), cap: "chat" },
    { name: "Speech", configured: !!speechProvider(), cap: "stt" },
    { name: "Email", configured: !!env().RESEND_API_KEY, cap: "email" },
    { name: "Payments", configured: paymentsConfigured(), cap: "payments" },
  ];
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <PageHeader eyebrow="Status" title="Service status">
        What&apos;s switched on for this deployment, and how it has behaved over the last 24 hours.
      </PageHeader>
      <Card className="divide-y divide-border p-0">
        {services.map((s) => {
          const r = s.cap ? byCap.get(s.cap) : undefined;
          const rate = r && r.total ? Math.round((r.ok / r.total) * 100) : null;
          return (
            <div key={s.name} className="flex items-center justify-between px-5 py-4">
              <span className="font-semibold">{s.name}</span>
              <span className="flex items-center gap-2">
                {rate !== null ? <span className="text-sm text-muted">{rate}% ok (24h)</span> : null}
                <Badge tone={!s.configured ? "neutral" : rate !== null && rate < 90 ? "warning" : "success"}>
                  {!s.configured ? "Not configured" : rate !== null && rate < 90 ? "Degraded" : "Operational"}
                </Badge>
              </span>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
