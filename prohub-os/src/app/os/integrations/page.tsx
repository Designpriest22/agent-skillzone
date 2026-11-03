import { db } from "@/db/client";
import { integrationConfigs } from "@/db/schema";
import { INTEGRATIONS } from "@/integrations/registry";
import { decryptJson } from "@/lib/crypto";
import { PageHeader, Panel, Badge, Field, inputClass, ErrorNote, InfoNote } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { saveIntegrationAction, testIntegrationAction } from "../actions";
import { formatDate } from "@/lib/utils";
import { env } from "@/lib/env";

export const metadata = { title: "Integrations" };

export default async function Integrations({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string; focus?: string }> }) {
  const sp = await searchParams;
  const rows = new Map((await db.select().from(integrationConfigs)).map((r) => [r.slug, r]));
  const categories = [...new Set(INTEGRATIONS.map((i) => i.category))];
  return (
    <>
      <PageHeader title="Integrations" subtitle="Modular connectors. Credentials are encrypted at rest (AES-256-GCM); environment variables also work. Only the owner can change credentials." />
      {sp.error && <div className="mb-3"><ErrorNote>{sp.error}</ErrorNote></div>}
      {sp.ok && <div className="mb-3"><InfoNote>{sp.ok}</InfoNote></div>}
      {!env.encryptionKey && <div className="mb-3"><ErrorNote>ENCRYPTION_KEY is not set — credentials cannot be stored from this page. Use environment variables or set ENCRYPTION_KEY.</ErrorNote></div>}
      {categories.map((cat) => (
        <div key={cat} className="mb-6">
          <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-fg-3">{cat}</h2>
          <div className="grid gap-3 lg:grid-cols-2">
            {INTEGRATIONS.filter((i) => i.category === cat).map((i) => {
              const row = rows.get(i.slug);
              let stored: Record<string, string> = {};
              try { if (row?.credentialsEncrypted) stored = decryptJson(row.credentialsEncrypted); } catch { /* key rotated */ }
              const has = (k: string, envVar: string) => !!stored[k] || !!process.env[envVar];
              const configured = i.fields.filter((f) => f.required).every((f) => has(f.key, f.envVar));
              return (
                <Panel key={i.slug} className={sp.focus === i.slug ? "ring-2 ring-accent" : ""}
                  title={<span className="flex items-center gap-2 normal-case tracking-normal"><span className="text-[13.5px] font-semibold text-fg">{i.name}</span>{i.maturity === "planned" ? <Badge>planned</Badge> : configured ? <Badge tone="ok">configured</Badge> : <Badge tone="warn">needs credentials</Badge>}</span>}
                  actions={row?.lastTestedAt && <Badge tone={row.lastTestOk ? "ok" : "bad"}>{row.lastTestOk ? "test passed" : "test failed"} · {formatDate(row.lastTestedAt, true)}</Badge>}>
                  <p className="text-fg-2">{i.description}</p>
                  {i.notes && <p className="mt-1 text-[12px] text-fg-3">{i.notes}</p>}
                  <div className="mt-1 text-[12px] text-fg-3">Used by: {i.usedBy.join(", ")} · <a href={i.docsUrl.startsWith("http") ? i.docsUrl : "#"} target="_blank" rel="noreferrer" className="text-accent">docs</a></div>
                  {row?.lastError && !row.lastTestOk && <div className="mt-2"><ErrorNote>{row.lastError}</ErrorNote></div>}
                  <details className="mt-3"><summary className="cursor-pointer text-[12.5px] text-accent">Configure</summary>
                    <form action={saveIntegrationAction} className="mt-2 space-y-2">
                      <input type="hidden" name="slug" value={i.slug} />
                      {i.fields.map((f) => (
                        <Field key={f.key} label={`${f.label}${f.required ? "" : " (optional)"}`} hint={`${has(f.key, f.envVar) ? (stored[f.key] ? "Stored (leave blank to keep)" : `Set via env ${f.envVar}`) : `env: ${f.envVar}`}${f.help ? ` · ${f.help}` : ""}`}>
                          <input name={f.key} type={f.secret ? "password" : "text"} autoComplete="off" placeholder={stored[f.key] && f.secret ? "••••••••" : stored[f.key] ?? ""} className={inputClass} />
                        </Field>
                      ))}
                      <label className="flex items-center gap-2 text-[12.5px]"><input type="checkbox" name="enabled" defaultChecked={row?.enabled ?? true} /> Enabled</label>
                      <SubmitButton size="sm">Save</SubmitButton>
                    </form>
                  </details>
                  {i.maturity === "implemented" && <form action={testIntegrationAction} className="mt-2"><input type="hidden" name="slug" value={i.slug} /><SubmitButton size="sm" variant="secondary">Test connection</SubmitButton></form>}
                </Panel>
              );
            })}
          </div>
        </div>
      ))}
      <Panel title="Inbound webhooks">
        <ul className="space-y-1 font-mono text-[12px]">
          <li>{env.appUrl}/api/webhooks/paystack — charge.success → records income (signature verified)</li>
          <li>{env.appUrl}/api/webhooks/meta — WhatsApp messages, Facebook/Instagram comments & DMs → CRM enquiries</li>
          <li>{env.appUrl}/api/public/enquiry — website lead form</li>
          <li>{env.appUrl}/api/cron/tick — scheduler + queue drain for serverless deployments (Bearer CRON_SECRET)</li>
        </ul>
      </Panel>
    </>
  );
}
