/** Paystack webhook: verified successful charges are recorded as income (idempotent on reference). */
import { eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { invoices, transactions } from "@/db/schema";
import { verifyPaystackSignature, verifyTransaction } from "@/integrations/paystack";
import { notifyOwner } from "@/services/notify";
import { logActivity } from "@/lib/audit";
import { formatMoney } from "@/lib/money";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const raw = await req.text();
  if (!(await verifyPaystackSignature(raw, req.headers.get("x-paystack-signature")))) return new Response("Invalid signature", { status: 401 });
  const evt = JSON.parse(raw) as { event: string; data: { reference: string } };
  if (evt.event !== "charge.success") return Response.json({ ignored: evt.event });
  // Defence in depth: confirm with Paystack's API rather than trusting the payload.
  const tx = await verifyTransaction(evt.data.reference);
  if (tx.status !== "success") return Response.json({ ignored: `status ${tx.status}` });
  if (tx.currency !== "NGN") {
    // No trusted FX rate is available automatically; the owner records it with the rate actually received.
    await notifyOwner({ kind: "alert", title: `Paystack payment in ${tx.currency} needs manual recording`, body: `Reference ${tx.reference}, ${tx.amount / 100} ${tx.currency} from ${tx.customer.email}. Record it in Finance with the settled NGN rate.`, href: "/os/finance?tab=transactions" });
    return Response.json({ manual: true });
  }
  let [inv] = tx.metadata?.invoice_id ? await db.select().from(invoices).where(eq(invoices.id, tx.metadata.invoice_id)) : [];
  if (!inv) [inv] = await db.select().from(invoices).where(eq(invoices.paymentReference, tx.reference));
  const inserted = await db.insert(transactions).values({
    type: "income", amountMinor: tx.amount, currency: "NGN", amountBaseMinor: tx.amount, fxRate: 1,
    category: "client_payment", clientId: inv?.clientId ?? null, invoiceId: inv?.id ?? null, projectId: inv?.projectId ?? null,
    serviceSlug: inv?.lineItems[0]?.serviceSlug ?? null, description: `Paystack payment ${tx.reference}${inv ? ` for ${inv.number}` : ""} (${tx.customer.email})`,
    source: "paystack", externalReference: tx.reference, recordedBy: "webhook:paystack", occurredAt: new Date(tx.paid_at),
  }).onConflictDoNothing().returning({ id: transactions.id });
  if (!inserted.length) return Response.json({ duplicate: true });
  if (inv) {
    await db.update(invoices).set({ amountPaidMinor: sql`${invoices.amountPaidMinor} + ${tx.amount}`, status: inv.amountPaidMinor + tx.amount >= inv.totalMinor ? "paid" : "partially_paid", updatedAt: new Date() }).where(eq(invoices.id, inv.id));
  }
  await logActivity({ type: "webhook", id: "paystack" }, "finance.payment_received", { type: "transaction", id: inserted[0].id }, { reference: tx.reference, amount: tx.amount });
  await notifyOwner({ kind: "info", title: `Payment received: ${formatMoney(tx.amount, tx.currency)}`, body: `${inv ? `Invoice ${inv.number}` : "Unmatched payment"} · ${tx.customer.email}${inv ? "" : " — match it to a client in Finance."}`, href: "/os/finance?tab=transactions" });
  return Response.json({ recorded: true });
}
