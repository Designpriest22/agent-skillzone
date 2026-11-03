import { PageHeader } from "@/components/ui/primitives";
import { requireAdminPage } from "@/lib/auth/admin-guard";
import { db } from "@/lib/db";

export const metadata = { title: "Audit log" };
export const dynamic = "force-dynamic";

export default async function AuditPage() {
  await requireAdminPage("admin");
  const events = await db()`
    select a.*, u.email from audit_events a left join users u on u.id = a.actor_id order by a.created_at desc limit 200`;
  return (
    <div>
      <PageHeader eyebrow="Security" title="Audit log">
        Every admin action, password reset, checkout and account deletion. Append-only from the app.
      </PageHeader>
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-2 font-mono text-xs uppercase">
            <tr>
              <th className="p-3">When</th>
              <th className="p-3">Who</th>
              <th className="p-3">Action</th>
              <th className="p-3">Entity</th>
              <th className="p-3">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {events.map((e) => (
              <tr key={e.id} className="align-top">
                <td className="whitespace-nowrap p-3">{new Date(e.created_at).toLocaleString()}</td>
                <td className="p-3">{e.email ?? "system / deleted user"}</td>
                <td className="p-3 font-mono">{e.action}</td>
                <td className="p-3 font-mono text-xs">
                  {e.entity_type} {e.entity_id}
                </td>
                <td className="max-w-md p-3 font-mono text-xs">{JSON.stringify(e.details)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
