import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { revenueTargets, schedules, users, services, authorizedSenders, apiTokens } from "@/db/schema";
import { getUser } from "@/lib/auth";
import { isConfigured } from "@/integrations/registry";
import { env } from "@/lib/env";
import { TokenCreator } from "./token-creator";
import { getSettings } from "@/services/settings";
import { PageHeader, Panel, Tabs, Field, inputClass, textareaClass, Table, Th, Td, Badge, ErrorNote, InfoNote } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { setTargetAction, saveSettingsAction, scheduleAction, createUserAction, setUserActiveAction, updateServiceAction, changePasswordAction, addSenderAction, toggleSenderAction, revokeApiTokenAction } from "../actions";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { monthPeriod } from "@/lib/time";

export const metadata = { title: "Settings" };

export default async function Settings({ searchParams }: { searchParams: Promise<{ tab?: string; ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const tab = sp.tab ?? "targets";
  const labels: Record<string, string> = { targets: "Revenue targets", operations: "Operations", schedules: "Schedules", services: "Services & pricing", channels: "Command channels", users: "Users" };
  return (
    <>
      <PageHeader title="Settings" />
      {sp.error && <div className="mb-3"><ErrorNote>{sp.error}</ErrorNote></div>}
      {sp.ok && <div className="mb-3"><InfoNote>{sp.ok}</InfoNote></div>}
      <Tabs active={labels[tab]} tabs={Object.entries(labels).map(([k, v]) => ({ href: `/os/settings?tab=${k}`, label: v }))} />
      {tab === "targets" && <Targets />}
      {tab === "operations" && <Operations />}
      {tab === "schedules" && <Schedules />}
      {tab === "services" && <Services />}
      {tab === "channels" && <Channels />}
      {tab === "users" && <Users />}
    </>
  );
}

async function Targets() {
  const rows = await db.select().from(revenueTargets).orderBy(desc(revenueTargets.periodStart)).limit(24);
  const m = monthPeriod();
  const defaultStart = new Date(m.start.getTime() + 12 * 3600_000).toISOString().slice(0, 8) + "01";
  return (
    <div className="grid gap-4 lg:grid-cols-[440px_1fr]">
      <Panel title="Set a target">
        <form action={setTargetAction} className="grid grid-cols-2 gap-3">
          <Field label="Period"><select name="periodType" className={inputClass}><option value="month">Month</option><option value="quarter">Quarter</option></select></Field>
          <Field label="Starts (YYYY-MM-01)"><input name="periodStart" defaultValue={defaultStart} className={inputClass} /></Field>
          <Field label="Revenue target (₦)"><input name="revenueTarget" required placeholder="15000000" className={inputClass} /></Field>
          <Field label="Average deal value (₦)"><input name="avgDeal" className={inputClass} /></Field>
          <Field label="New clients required"><input name="newClients" type="number" className={inputClass} /></Field>
          <Field label="Retainer revenue target (₦)"><input name="retainerTarget" className={inputClass} /></Field>
          <Field label="Marketing budget (₦)"><input name="marketingBudget" className={inputClass} /></Field>
          <Field label="Lead generation target"><input name="leadTarget" type="number" className={inputClass} /></Field>
          <Field label="Sales conversion target (%)"><input name="conversionTarget" type="number" step="0.5" className={inputClass} /></Field>
          <div className="col-span-2"><SubmitButton>Save target</SubmitButton></div>
        </form>
      </Panel>
      <Panel title="Targets" pad={false}><Table><thead><tr><Th>Period</Th><Th className="text-right">Revenue</Th><Th className="text-right">Avg deal</Th><Th className="text-right">Clients</Th><Th className="text-right">Leads</Th><Th className="text-right">Conversion</Th><Th className="text-right">Mkt budget</Th></tr></thead><tbody>
        {rows.map((t) => <tr key={t.id}><Td>{t.periodType} from {t.periodStart}</Td><Td className="num text-right">{formatMoney(t.revenueTargetMinor)}</Td><Td className="num text-right">{formatMoney(t.avgDealValueMinor)}</Td><Td className="num text-right">{t.newClientsTarget ?? "—"}</Td><Td className="num text-right">{t.leadTarget ?? "—"}</Td><Td className="num text-right">{t.conversionTargetPct ? `${t.conversionTargetPct}%` : "—"}</Td><Td className="num text-right">{formatMoney(t.marketingBudgetMinor)}</Td></tr>)}
        {!rows.length && <tr><Td colSpan={7} className="py-6 text-center text-fg-3">No targets yet</Td></tr>}
      </tbody></Table></Panel>
    </div>
  );
}

async function Operations() {
  const s = await getSettings();
  return (
    <Panel title="Autonomous operations" className="max-w-2xl">
      <form action={saveSettingsAction} className="space-y-3">
        <label className="flex items-center gap-2"><input type="checkbox" name="autonomousCycles" defaultChecked={s.autonomousCycles} /> Run the daily cycles automatically (07:00 intelligence, 08:00 assignments, 12:00 progress, 17:00 report — times editable under Schedules)</label>
        <Field label="Daily prospect quota" hint="Real prospects the Sales agent tries to find each morning. Higher = more model and search cost."><input name="dailyProspectQuota" type="number" min={0} max={50} defaultValue={s.dailyProspectQuota} className={inputClass + " w-32"} /></Field>
        <Field label="Prospecting segments (one per line, rotated daily)"><textarea name="prospectSegments" rows={8} defaultValue={s.prospectSegments.join("\n")} className={textareaClass} /></Field>
        <Field label="Report email" hint="Receives scheduled reports as PDF (requires the Email integration)."><input name="reportEmail" type="email" defaultValue={s.reportEmail ?? ""} className={inputClass} /></Field>
        <label className="flex items-center gap-2"><input type="checkbox" name="reportWhatsApp" defaultChecked={s.reportWhatsApp} /> Send scheduled reports (summary + PDF) to authorised WhatsApp numbers</label>
        <SubmitButton>Save</SubmitButton>
      </form>
    </Panel>
  );
}

async function Schedules() {
  const rows = await db.select().from(schedules).orderBy(schedules.slug);
  return (
    <Panel pad={false}><Table><thead><tr><Th>Schedule</Th><Th>Cron ({rows[0]?.timezone})</Th><Th>Status</Th><Th>Last run</Th><Th>Next run</Th><Th /></tr></thead><tbody>
      {rows.map((s) => <tr key={s.slug}><Td className="font-medium">{s.name}<div className="text-[11.5px] text-fg-3">{s.jobType}</div></Td>
        <Td><form action={scheduleAction} className="flex gap-1"><input type="hidden" name="slug" value={s.slug} /><input type="hidden" name="op" value="cron" /><input name="cron" defaultValue={s.cron} className={inputClass + " h-7 w-32 font-mono text-[12px]"} /><SubmitButton size="sm" variant="ghost">Set</SubmitButton></form></Td>
        <Td>{s.enabled ? <Badge tone="ok">enabled</Badge> : <Badge>disabled</Badge>}</Td><Td className="text-fg-3">{formatDate(s.lastRunAt, true)}</Td><Td className="text-fg-2">{s.enabled ? formatDate(s.nextRunAt, true) : "—"}</Td>
        <Td className="whitespace-nowrap"><form action={scheduleAction} className="flex gap-1"><input type="hidden" name="slug" value={s.slug} /><SubmitButton size="sm" variant="secondary" name="op" value="run">Run now</SubmitButton><SubmitButton size="sm" variant="ghost" name="op" value="toggle">{s.enabled ? "Disable" : "Enable"}</SubmitButton></form></Td></tr>)}
    </tbody></Table></Panel>
  );
}

async function Services() {
  const rows = await db.select().from(services).orderBy(services.sortOrder);
  return (
    <Panel title="Service catalogue & indicative pricing" pad={false}>
      <div className="px-4 pt-3 text-[12.5px] text-fg-2">Agents quote only prices you set here; unset prices are marked "indicative — pending owner confirmation" in drafts.</div>
      <Table><thead><tr><Th>Service</Th><Th>Price from (₦)</Th><Th>Pricing model</Th><Th>On website</Th><Th /></tr></thead><tbody>
        {rows.map((s) => <tr key={s.slug}><Td className="font-medium">{s.name}<div className="text-[11.5px] text-fg-3">{s.summary}</div></Td>
          <Td colSpan={4}><form action={updateServiceAction} className="flex flex-wrap items-center gap-2"><input type="hidden" name="slug" value={s.slug} />
            <input name="priceFrom" defaultValue={s.priceFromMinor ? s.priceFromMinor / 100 : ""} placeholder="not set" className={inputClass + " h-7 w-36"} />
            <select name="pricingModel" defaultValue={s.pricingModel ?? "custom"} className={inputClass + " h-7 w-32"}>{["project", "retainer", "hourly", "package", "custom"].map((p) => <option key={p}>{p}</option>)}</select>
            <label className="flex items-center gap-1 text-[12.5px]"><input type="checkbox" name="published" defaultChecked={s.published} /> published</label>
            <SubmitButton size="sm" variant="secondary">Save</SubmitButton></form></Td></tr>)}
      </tbody></Table>
    </Panel>
  );
}

async function Users() {
  const rows = await db.select({ id: users.id, email: users.email, name: users.name, role: users.role, active: users.active, lastLoginAt: users.lastLoginAt }).from(users);
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
      <Panel pad={false}><Table><thead><tr><Th>User</Th><Th>Role</Th><Th>Status</Th><Th>Last login</Th><Th /></tr></thead><tbody>
        {rows.map((u) => <tr key={u.id}><Td>{u.name}<div className="text-[12px] text-fg-3">{u.email}</div></Td><Td><Badge tone={u.role === "owner" ? "accent" : "neutral"}>{u.role}</Badge></Td><Td>{u.active ? <Badge tone="ok">active</Badge> : <Badge>inactive</Badge>}</Td><Td className="text-fg-3">{formatDate(u.lastLoginAt, true)}</Td>
          <Td><form action={setUserActiveAction}><input type="hidden" name="id" value={u.id} /><input type="hidden" name="active" value={String(!u.active)} /><SubmitButton size="sm" variant="ghost">{u.active ? "Deactivate" : "Activate"}</SubmitButton></form></Td></tr>)}
      </tbody></Table>
        <div className="border-t border-line p-4 text-[12.5px] text-fg-2"><b>Roles.</b> Owner: everything, including Level-3 authorisations, finance ledger and credentials. Manager: commands, Level-2 approvals, CRM and projects. Viewer: read-only.</div>
      </Panel>
      <div className="space-y-4">
        <Panel title="Add user"><form action={createUserAction} className="space-y-2">
          <Field label="Name"><input name="name" required className={inputClass} /></Field><Field label="Email"><input name="email" type="email" required className={inputClass} /></Field>
          <Field label="Role"><select name="role" className={inputClass}><option value="manager">Manager</option><option value="viewer">Viewer</option><option value="owner">Owner</option></select></Field>
          <Field label="Temporary password (min 10)"><input name="password" type="password" required minLength={10} className={inputClass} /></Field>
          <SubmitButton>Create user</SubmitButton></form></Panel>
        <Panel title="Change my password"><form action={changePasswordAction} className="space-y-2"><input name="password" type="password" minLength={10} required className={inputClass} /><SubmitButton variant="secondary">Change password</SubmitButton></form></Panel>
      </div>
    </div>
  );
}

async function Channels() {
  const me = await getUser();
  const [senders, people, tokens, waReady] = await Promise.all([
    db.select({ id: authorizedSenders.id, address: authorizedSenders.address, label: authorizedSenders.label, active: authorizedSenders.active, lastSeenAt: authorizedSenders.lastSeenAt, user: users.name, role: users.role })
      .from(authorizedSenders).innerJoin(users, eq(users.id, authorizedSenders.userId)).orderBy(authorizedSenders.createdAt),
    db.select({ id: users.id, name: users.name, role: users.role }).from(users).where(eq(users.active, true)),
    me ? db.select().from(apiTokens).where(eq(apiTokens.userId, me.id)).orderBy(desc(apiTokens.createdAt)) : Promise.resolve([]),
    isConfigured("whatsapp"),
  ]);
  const mcpUrl = `${env.appUrl}/api/mcp`;
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Panel title="WhatsApp command centre">
        {!waReady && <div className="mb-3"><ErrorNote>The WhatsApp Business Cloud API isn&apos;t configured yet — add it under Integrations, then point the Meta webhook at {env.appUrl}/api/webhooks/meta.</ErrorNote></div>}
        <p className="mb-3 text-[12.5px] text-fg-2">Only these numbers can issue instructions and approvals. Messages from any other number are treated as customer enquiries and go to the CRM. Each number acts with its user&apos;s role; Level-3 (owner-only) actions always require the dashboard.</p>
        <Table><thead><tr><Th>Number</Th><Th>User</Th><Th>Status</Th><Th>Last message</Th><Th /></tr></thead><tbody>
          {senders.map((r) => <tr key={r.id}><Td className="font-mono">+{r.address}<div className="font-sans text-[11.5px] text-fg-3">{r.label}</div></Td><Td>{r.user} <Badge>{r.role}</Badge></Td><Td>{r.active ? <Badge tone="ok">active</Badge> : <Badge>disabled</Badge>}</Td><Td className="text-fg-3">{formatDate(r.lastSeenAt, true)}</Td>
            <Td><form action={toggleSenderAction}><input type="hidden" name="id" value={r.id} /><SubmitButton size="sm" variant="ghost">{r.active ? "Disable" : "Enable"}</SubmitButton></form></Td></tr>)}
          {!senders.length && <tr><Td colSpan={5} className="text-fg-3">No numbers authorised yet.</Td></tr>}
        </tbody></Table>
        <form action={addSenderAction} className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
          <Field label="Number (international)"><input name="address" required placeholder="2348012345678" className={inputClass} /></Field>
          <Field label="Acts as user"><select name="userId" className={inputClass}>{people.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.role})</option>)}</select></Field>
          <Field label="Label"><input name="label" placeholder="Owner's phone" className={inputClass} /></Field>
          <SubmitButton>Authorise</SubmitButton>
        </form>
      </Panel>
      <Panel title="Claude command centre (connector)">
        <p className="mb-3 text-[12.5px] text-fg-2">Connect Claude (claude.ai, Claude Desktop or Claude Code) to Prohub AI. Claude can then send instructions to the Managing Director, follow progress, read reports and the pipeline, and approve Level-2 actions — acting as you, with your role. Endpoint: <code className="font-mono">{mcpUrl}</code></p>
        <TokenCreator mcpUrl={mcpUrl} />
        <Table><thead><tr><Th>Token</Th><Th>Created</Th><Th>Last used</Th><Th /></tr></thead><tbody>
          {tokens.map((t) => <tr key={t.id}><Td>{t.name}<div className="font-mono text-[11.5px] text-fg-3">{t.prefix}…</div></Td><Td className="text-fg-3">{formatDate(t.createdAt, true)}</Td><Td className="text-fg-3">{formatDate(t.lastUsedAt, true)}</Td>
            <Td>{t.revokedAt ? <Badge>revoked</Badge> : <form action={revokeApiTokenAction}><input type="hidden" name="id" value={t.id} /><SubmitButton size="sm" variant="ghost" confirm="Revoke this token? Connected Claude clients will stop working.">Revoke</SubmitButton></form>}</Td></tr>)}
          {!tokens.length && <tr><Td colSpan={4} className="text-fg-3">No tokens yet.</Td></tr>}
        </tbody></Table>
      </Panel>
    </div>
  );
}
