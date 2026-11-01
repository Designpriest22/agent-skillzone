import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { transactions, invoices, clients, services, projects, campaigns } from "@/db/schema";
import { financeSummary, receivables, targetStatus } from "@/services/finance";
import { monthPeriod } from "@/lib/time";
import { formatMoney, pct } from "@/lib/money";
import { PageHeader, Panel, Stat, Tabs, Table, Th, Td, StatusBadge, Field, inputClass, ErrorNote, Badge, InfoNote } from "@/components/ui";
import { BarChart, HBar } from "@/components/charts";
import { SubmitButton } from "@/components/client";
import { recordTransactionAction, createInvoiceAction, invoiceStatusAction } from "../actions";
import { formatDate } from "@/lib/utils";
import { requireUser } from "@/lib/auth";
import { DIRECT_COST_CATEGORIES } from "@/services/reports";

export const metadata = { title: "Finance centre" };

export default async function Finance({ searchParams }: { searchParams: Promise<{ tab?: string; error?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const tab = sp.tab ?? "overview";
  const labels: Record<string, string> = { overview: "Overview", transactions: "Transactions", invoices: "Invoices", profitability: "Project profitability" };
  return (
    <>
      <PageHeader title="Finance centre" subtitle="Only recorded transactions count. Agents can draft invoices but can never write to the ledger." />
      {sp.error && <div className="mb-3"><ErrorNote>{sp.error}</ErrorNote></div>}
      <Tabs active={labels[tab] ?? "Overview"} tabs={Object.entries(labels).map(([k, v]) => ({ href: `/os/finance?tab=${k}`, label: v }))} />
      {tab === "overview" && <Overview />}
      {tab === "transactions" && <Transactions owner={user.role === "owner"} />}
      {tab === "invoices" && <Invoices owner={user.role === "owner"} />}
      {tab === "profitability" && <Profitability />}
    </>
  );
}

async function Overview() {
  const month = monthPeriod();
  const [fin, recv, target, ...history] = await Promise.all([financeSummary(month), receivables(), targetStatus("month"), ...Array.from({ length: 12 }, (_, i) => financeSummary(monthPeriod(new Date(), i - 11)))]);
  const m = (v: number) => formatMoney(v, "NGN", { compact: true });
  const direct = fin.expensesByCategory.filter((e) => DIRECT_COST_CATEGORIES.includes(e.category)).reduce((a, e) => a + e.amountMinor, 0);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        <Stat label="Revenue (month)" value={m(fin.incomeMinor)} /><Stat label="Expenses (month)" value={m(fin.expenseMinor)} />
        <Stat label="Gross profit" value={m(fin.incomeMinor - fin.refundMinor - direct)} sub="after direct costs" /><Stat label="Net profit" value={m(fin.netMinor)} sub={`margin ${pct(fin.marginPct, 0)}`} tone={fin.netMinor < 0 ? "bad" : undefined} />
        <Stat label="Receivables" value={m(recv.totalOutstandingMinor)} sub={`${recv.count} open invoices`} /><Stat label="Overdue" value={m(recv.overdueMinor)} tone={recv.overdueCount ? "bad" : undefined} sub={`${recv.overdueCount} invoices`} />
      </div>
      {target.configured && <InfoNote>Target {formatMoney(target.target.revenueTargetMinor)} · achieved {pct(target.pctAchieved, 0)} · {target.onTrack ? "on pace" : "behind pace"} · {target.dealsRequired ?? "?"} more deals needed at average value.</InfoNote>}
      <Panel title="Monthly revenue vs expenses — 12 months"><BarChart data={history.map((f) => ({ label: f.period.label.slice(0, 3), value: f.incomeMinor, secondary: f.expenseMinor }))} format={(v) => formatMoney(v)} /></Panel>
      <div className="grid gap-4 md:grid-cols-3">
        <Panel title="Revenue by service (month)"><HBar rows={fin.byService.map((s) => ({ label: s.service, value: s.incomeMinor }))} format={m} /></Panel>
        <Panel title="Revenue by client (month)"><HBar rows={fin.byClient.map((s) => ({ label: s.client, value: s.incomeMinor }))} format={m} /></Panel>
        <Panel title="Expenses by category (month)"><HBar rows={fin.expensesByCategory.map((s) => ({ label: s.category, value: s.amountMinor }))} format={m} /></Panel>
      </div>
    </div>
  );
}

async function Transactions({ owner }: { owner: boolean }) {
  const [rows, cl, svc, inv, proj, camp] = await Promise.all([
    db.select({ t: transactions, client: clients.name }).from(transactions).leftJoin(clients, eq(clients.id, transactions.clientId)).orderBy(desc(transactions.occurredAt)).limit(300),
    db.select({ id: clients.id, name: clients.name }).from(clients), db.select({ slug: services.slug, name: services.name }).from(services),
    db.select({ id: invoices.id, number: invoices.number }).from(invoices).where(eq(invoices.status, "sent")), db.select({ id: projects.id, name: projects.name }).from(projects), db.select({ id: campaigns.id, name: campaigns.name }).from(campaigns),
  ]);
  return (
    <div className="space-y-4">
      {owner ? (
        <Panel title="Record a transaction (owner only)">
          <form action={recordTransactionAction} className="grid gap-3 md:grid-cols-4">
            <Field label="Type"><select name="type" className={inputClass}><option value="income">Income</option><option value="expense">Expense</option><option value="refund">Refund</option></select></Field>
            <Field label="Amount"><input name="amount" required className={inputClass} placeholder="250000" /></Field>
            <Field label="Currency"><select name="currency" className={inputClass}><option>NGN</option><option>USD</option><option>GBP</option><option>EUR</option></select></Field>
            <Field label="FX rate to NGN" hint="Only for non-NGN"><input name="fxRate" className={inputClass} /></Field>
            <Field label="Category" hint={`Direct costs: ${DIRECT_COST_CATEGORIES.join(", ")}`}><input name="category" list="cats" required className={inputClass} /><datalist id="cats">{["client_payment", "retainer", ...DIRECT_COST_CATEGORIES, "ads", "marketing", "software", "salaries", "rent", "utilities", "transport", "other"].map((c) => <option key={c} value={c} />)}</datalist></Field>
            <Field label="Date"><input name="occurredAt" type="datetime-local" className={inputClass} /></Field>
            <Field label="Client"><select name="clientId" className={inputClass}><option value="">—</option>{cl.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
            <Field label="Service"><select name="serviceSlug" className={inputClass}><option value="">—</option>{svc.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}</select></Field>
            <Field label="Invoice paid" hint="Applies the payment to the invoice"><select name="invoiceId" className={inputClass}><option value="">—</option>{inv.map((i) => <option key={i.id} value={i.id}>{i.number}</option>)}</select></Field>
            <Field label="Project"><select name="projectId" className={inputClass}><option value="">—</option>{proj.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
            <Field label="Campaign (for ROI)"><select name="campaignId" className={inputClass}><option value="">—</option>{camp.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
            <Field label="Reference"><input name="reference" className={inputClass} placeholder="Bank ref / receipt no." /></Field>
            <Field label="Description" className="md:col-span-3"><input name="description" required className={inputClass} /></Field>
            <div className="flex items-end"><SubmitButton confirm="Record this transaction in the ledger?">Record</SubmitButton></div>
          </form>
        </Panel>
      ) : <InfoNote>Only the owner can record or change financial transactions.</InfoNote>}
      <Panel pad={false}><Table><thead><tr><Th>Date</Th><Th>Type</Th><Th>Category</Th><Th>Description</Th><Th>Client</Th><Th>Service</Th><Th className="text-right">Amount</Th><Th>Source</Th></tr></thead><tbody>
        {rows.map(({ t, client }) => <tr key={t.id}><Td className="whitespace-nowrap text-fg-2">{formatDate(t.occurredAt)}</Td><Td><Badge tone={t.type === "income" ? "ok" : t.type === "refund" ? "warn" : "neutral"}>{t.type}</Badge></Td><Td className="text-fg-2">{t.category}</Td><Td>{t.description}</Td><Td className="text-fg-2">{client ?? "—"}</Td><Td className="text-fg-2">{t.serviceSlug ?? "—"}</Td><Td className="num text-right">{t.type === "income" ? "" : "−"}{formatMoney(t.amountBaseMinor)}{t.currency !== "NGN" && <div className="text-[11px] text-fg-3">{formatMoney(t.amountMinor, t.currency)}</div>}</Td><Td><Badge>{t.source}</Badge></Td></tr>)}
        {!rows.length && <tr><Td colSpan={8} className="py-8 text-center text-fg-3">No transactions recorded. Revenue figures stay at zero until real payments are recorded or arrive via Paystack.</Td></tr>}
      </tbody></Table></Panel>
    </div>
  );
}

async function Invoices({ owner }: { owner: boolean }) {
  const [rows, cl] = await Promise.all([db.select({ i: invoices, client: clients.name }).from(invoices).leftJoin(clients, eq(clients.id, invoices.clientId)).orderBy(desc(invoices.createdAt)).limit(200), db.select({ id: clients.id, name: clients.name }).from(clients)]);
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="space-y-4">
      <Panel pad={false}><Table><thead><tr><Th>Number</Th><Th>Client</Th><Th>Status</Th><Th>Issued</Th><Th>Due</Th><Th className="text-right">Total</Th><Th className="text-right">Paid</Th><Th className="text-right">Balance</Th><Th /></tr></thead><tbody>
        {rows.map(({ i, client }) => (
          <tr key={i.id}><Td className="font-medium">{i.number}<div className="text-[11.5px] text-fg-3">{i.createdBy.split(":")[0]}</div></Td><Td>{client}</Td><Td><StatusBadge status={i.status} />{["sent", "partially_paid"].includes(i.status) && i.dueDate < today && <Badge tone="bad" className="ml-1">overdue</Badge>}</Td><Td className="text-fg-2">{i.issueDate}</Td><Td className="text-fg-2">{i.dueDate}</Td>
            <Td className="num text-right">{formatMoney(i.totalMinor, i.currency)}</Td><Td className="num text-right">{formatMoney(i.amountPaidMinor, i.currency)}</Td><Td className="num text-right">{formatMoney(i.totalMinor - i.amountPaidMinor, i.currency)}</Td>
            <Td>{owner && (i.status === "draft" || i.status === "awaiting_approval") && <form action={invoiceStatusAction} className="flex gap-1"><input type="hidden" name="id" value={i.id} /><SubmitButton size="sm" variant="secondary" name="status" value="sent">Mark sent manually</SubmitButton><SubmitButton size="sm" variant="ghost" name="status" value="void">Void</SubmitButton></form>}{i.paymentLink && <a className="text-[12px] text-accent" href={i.paymentLink} target="_blank" rel="noreferrer">payment link</a>}</Td></tr>
        ))}
        {!rows.length && <tr><Td colSpan={9} className="py-8 text-center text-fg-3">No invoices yet.</Td></tr>}
      </tbody></Table></Panel>
      <Panel title="New invoice (draft)">
        {cl.length ? (
          <form action={createInvoiceAction} className="space-y-3">
            <div className="grid gap-3 md:grid-cols-4">
              <Field label="Client"><select name="clientId" required className={inputClass}>{cl.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
              <Field label="Due date"><input name="dueDate" type="date" className={inputClass} /></Field>
              <Field label="VAT %"><input name="vat" type="number" step="0.5" defaultValue={7.5} className={inputClass} /></Field>
            </div>
            {[0, 1, 2].map((n) => <div key={n} className="grid gap-2 md:grid-cols-[1fr_90px_160px]"><input name="itemDesc" placeholder={`Line item ${n + 1}`} className={inputClass} /><input name="itemQty" type="number" defaultValue={1} min={1} className={inputClass} /><input name="itemPrice" placeholder="Unit price ₦" className={inputClass} /></div>)}
            <SubmitButton variant="secondary">Create draft</SubmitButton>
            <div className="text-[12px] text-fg-3">Sending an invoice to a client is a Level 2 action — ask the Client Management agent to send it (approval required), or mark it sent if you sent it yourself.</div>
          </form>
        ) : <div className="text-fg-3">Invoices need a client. Clients are created when a lead is marked Won.</div>}
      </Panel>
    </div>
  );
}

async function Profitability() {
  const rows = await db.execute((await import("drizzle-orm")).sql`
    SELECT p.id, p.name, p.status, p.budget_minor,
      coalesce((SELECT sum(amount_base_minor) FROM transactions t WHERE t.project_id = p.id AND t.type = 'income'),0)::bigint AS income,
      coalesce((SELECT sum(amount_base_minor) FROM transactions t WHERE t.project_id = p.id AND t.type = 'expense'),0)::bigint AS cost,
      coalesce((SELECT sum(total_minor) FROM invoices i WHERE i.project_id = p.id AND i.status <> 'void'),0)::bigint AS invoiced
    FROM projects p ORDER BY p.created_at DESC`);
  const list = rows as unknown as { id: string; name: string; status: string; budget_minor: string | null; income: string; cost: string; invoiced: string }[];
  return (
    <Panel pad={false}><Table><thead><tr><Th>Project</Th><Th>Status</Th><Th className="text-right">Budget</Th><Th className="text-right">Invoiced</Th><Th className="text-right">Received</Th><Th className="text-right">Direct costs</Th><Th className="text-right">Profit</Th><Th className="text-right">Margin</Th></tr></thead><tbody>
      {list.map((p) => { const inc = Number(p.income), cost = Number(p.cost); return <tr key={p.id}><Td className="font-medium">{p.name}</Td><Td><StatusBadge status={p.status} /></Td><Td className="num text-right">{formatMoney(p.budget_minor ? Number(p.budget_minor) : null)}</Td><Td className="num text-right">{formatMoney(Number(p.invoiced))}</Td><Td className="num text-right">{formatMoney(inc)}</Td><Td className="num text-right">{formatMoney(cost)}</Td><Td className={`num text-right ${inc - cost < 0 ? "text-bad" : ""}`}>{formatMoney(inc - cost)}</Td><Td className="num text-right">{inc ? pct(((inc - cost) / inc) * 100, 0) : "—"}</Td></tr>; })}
      {!list.length && <tr><Td colSpan={8} className="py-8 text-center text-fg-3">No projects. Link transactions to projects to see profitability.</Td></tr>}
    </tbody></Table></Panel>
  );
}
